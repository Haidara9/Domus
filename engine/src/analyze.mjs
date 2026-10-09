// Asset analysis for the Cinematography Analyst and Colorist:
//   - shot detection (scene cuts) and per-shot measurements: exposure, saturation, color cast,
//     sharpness, motion amount and steadiness; best window per shot
//   - contact sheets with shot numbers
//   - beat / onset detection for music (no Python needed)
//   - shot matching corrections between clips
import { readFileSync, unlinkSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { FFMPEG, clamp, ensureDir, exists, ffmpeg, fileSig, log, probe, readJSON, sha, writeJSON } from './util.mjs';

function parseMeta(text) {
  // ffmpeg metadata=print output: "frame:N pts:.. pts_time:T" then "lavfi.key=value" lines
  const rows = []; let cur = null;
  for (const line of text.split('\n')) {
    const m = /pts_time:([\d.]+)/.exec(line);
    if (m) { cur = { t: Number(m[1]) }; rows.push(cur); continue; }
    const kv = /^(lavfi\.[\w.]+)=(.*)$/.exec(line.trim());
    if (kv && cur) cur[kv[1]] = Number(kv[2]);
  }
  return rows;
}

const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const std = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };

export async function analyzeVideo(path, { cacheDir, sampleFps = 4, cutThreshold = 12 } = {}) {
  const key = sha({ s: fileSig(path), sampleFps, cutThreshold, v: 2 });
  const cached = join(ensureDir(cacheDir), `analysis_${key}.json`);
  if (exists(cached)) return readJSON(cached);
  const info = await probe(path);
  const tmp = (n) => join(cacheDir, `tmp_${key}_${n}.txt`);
  const esc = (p) => p.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
  await ffmpeg(['-i', path, '-an', '-vf', `fps=${sampleFps},scale=480:-2,signalstats,blurdetect=block_width=32:block_height=32:planes=1,metadata=mode=print:file='${esc(tmp('stats'))}'`, '-f', 'null', '-']);
  await ffmpeg(['-i', path, '-an', '-vf', `fps=${sampleFps},scale=240:-2,format=gray,tblend=all_mode=difference,signalstats,metadata=mode=print:key=lavfi.signalstats.YAVG:file='${esc(tmp('motion'))}'`, '-f', 'null', '-']);
  await ffmpeg(['-i', path, '-an', '-vf', `scale=320:-2,scdet=threshold=${cutThreshold},metadata=mode=print:key=lavfi.scd.time:file='${esc(tmp('cuts'))}'`, '-f', 'null', '-']);
  const stats = parseMeta(readFileSync(tmp('stats'), 'utf8'));
  const motion = parseMeta(readFileSync(tmp('motion'), 'utf8'));
  const cuts = parseMeta(readFileSync(tmp('cuts'), 'utf8')).map((r) => r['lavfi.scd.time']).filter((x) => x > 0.2 && x < info.duration - 0.2);
  for (const n of ['stats', 'motion', 'cuts']) try { unlinkSync(tmp(n)); } catch {}
  const bounds = [0, ...cuts, info.duration];
  const shots = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const a = bounds[i], b = bounds[i + 1];
    const S = stats.filter((r) => r.t >= a && r.t < b);
    const M = motion.filter((r) => r.t > a + 0.3 && r.t < b);
    if (!S.length) continue;
    const Y = mean(S.map((r) => r['lavfi.signalstats.YAVG']));
    const sat = mean(S.map((r) => r['lavfi.signalstats.SATAVG']));
    const U = mean(S.map((r) => r['lavfi.signalstats.UAVG'])), V = mean(S.map((r) => r['lavfi.signalstats.VAVG']));
    const lo = mean(S.map((r) => r['lavfi.signalstats.YLOW'])), hi = mean(S.map((r) => r['lavfi.signalstats.YHIGH']));
    const blur = mean(S.map((r) => r['lavfi.blur'] ?? 0));
    const mot = M.map((r) => r['lavfi.signalstats.YAVG']);
    const motionMean = mean(mot), jitter = std(mot);
    // scores 0..1 (absolute heuristics; compare shots relative to each other too)
    const exposure = clamp(1 - Math.abs(Y - 118) / 90);
    const clipping = clamp(1 - Math.max(0, (hi - 235) / 20) - Math.max(0, (16 - lo) / 16) * 0.5);
    const sharp = clamp(1 - (blur - 2) / 10);
    const moves = clamp(motionMean / 6);
    const steady = clamp(1 - jitter / 4);
    const score = +(sharp * 0.35 + exposure * 0.25 + clipping * 0.1 + steady * 0.2 + Math.min(moves, 0.6) * 0.1 / 0.6).toFixed(3);
    // best 3s window by local sharpness and steadiness
    let best = [a, Math.min(b, a + 3)];
    if (b - a > 3.5) {
      let bestScore = -1;
      for (let s = a + 0.3; s + 3 <= b - 0.2; s += 0.5) {
        const w = S.filter((r) => r.t >= s && r.t < s + 3), wm = M.filter((r) => r.t >= s && r.t < s + 3);
        const sc = (1 - mean(w.map((r) => r['lavfi.blur'] ?? 0)) / 12) * 0.6 + (1 - std(wm.map((r) => r['lavfi.signalstats.YAVG'])) / 4) * 0.4;
        if (sc > bestScore) { bestScore = sc; best = [+s.toFixed(2), +(s + 3).toFixed(2)]; }
      }
    }
    const flags = [];
    if (Y < 55) flags.push('underexposed');
    if (Y > 190 || hi > 245) flags.push('highlights-clipping');
    if (blur > 8) flags.push('soft-focus');
    if (jitter > 3) flags.push('shaky');
    if (Math.abs(U - 128) > 6 || Math.abs(V - 128) > 6) flags.push(`color-cast(${U > 128 ? 'blue' : 'yellow'}/${V > 128 ? 'red' : 'green'})`);
    shots.push({
      index: shots.length + 1, start: +a.toFixed(3), end: +b.toFixed(3), dur: +(b - a).toFixed(3),
      luma: +Y.toFixed(1), saturation: +sat.toFixed(1), cast: { u: +(U - 128).toFixed(2), v: +(V - 128).toFixed(2) },
      blur: +blur.toFixed(2), motion: +motionMean.toFixed(2), jitter: +jitter.toFixed(2),
      movement: motionMean < 0.6 ? 'static' : motionMean < 3 ? 'smooth-move' : 'fast-move',
      score, bestWindow: best, flags,
    });
  }
  const res = { path, info, cuts, shots, analyzedAt: new Date().toISOString() };
  writeJSON(cached, res);
  return res;
}

export async function analyzeImage(path) {
  const info = await probe(path);
  return { path, info, shots: [], suggestion: info.width / info.height > 1.2 ? 'landscape still: use drift/pan when placing in 9:16; keep the focus point on the main feature' : 'portrait still: push-in or tilt' };
}

// Contact sheet of a source video with one tile per detected shot (mid-frame), numbered.
export async function shotSheet(analysis, outPng, { width = 320, cols = 4 } = {}) {
  const shots = analysis.shots.length ? analysis.shots : [{ index: 1, start: 0, end: analysis.info.duration }];
  const pick = shots.map((s) => (s.bestWindow ? (s.bestWindow[0] + s.bestWindow[1]) / 2 : (s.start + s.end) / 2));
  const sel = pick.map((t) => `lt(abs(t-${t.toFixed(3)}),0.02)`).join('+');
  const rows = Math.ceil(shots.length / cols);
  await ffmpeg(['-i', analysis.path, '-vf', `select='${sel}',scale=${width}:-2,drawtext=text='%{eif\\:n+1\\:d}':x=8:y=8:fontsize=28:fontcolor=white:box=1:boxcolor=black@0.6,tile=${cols}x${rows}:padding=4:margin=4:color=0x111111`, '-frames:v', '1', '-vsync', 'vfr', outPng]);
  return outPng;
}

// ---------- beats ----------
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let j = 0; j < len / 2; j++) {
        const ur = re[i + j], ui = im[i + j];
        const vr = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci, vi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr;
        re[i + j] = ur + vr; im[i + j] = ui + vi; re[i + j + len / 2] = ur - vr; im[i + j + len / 2] = ui - vi;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}

function decodeMono(path, sr) {
  return new Promise((res, rej) => {
    const p = spawn(FFMPEG, ['-v', 'error', '-i', path, '-ac', '1', '-ar', String(sr), '-f', 'f32le', '-']);
    const chunks = []; p.stdout.on('data', (d) => chunks.push(d)); p.on('error', rej);
    p.on('close', (c) => { if (c) return rej(new Error('decode failed')); const b = Buffer.concat(chunks); res(new Float32Array(b.buffer, b.byteOffset, b.length / 4)); });
  });
}

export async function detectBeats(path, { minBpm = 70, maxBpm = 180, bpm: forceBpm } = {}) {
  const sr = 22050, N = 1024, hop = 512;
  const x = await decodeMono(path, sr);
  const frames = Math.floor((x.length - N) / hop);
  const win = Float32Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
  let prev = new Float32Array(N / 2);
  const flux = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    const re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < N; i++) re[i] = x[f * hop + i] * win[i];
    fft(re, im);
    let s = 0; const mag = new Float32Array(N / 2);
    for (let k = 1; k < N / 2; k++) { mag[k] = Math.log1p(10 * Math.hypot(re[k], im[k])); const d = mag[k] - prev[k]; if (d > 0) s += d; }
    flux[f] = s; prev = mag;
  }
  // normalize & detrend
  const fr = sr / hop;
  const env = new Float32Array(frames);
  const w = Math.round(fr * 0.5);
  for (let i = 0; i < frames; i++) { let m = 0, c = 0; for (let j = Math.max(0, i - w); j < Math.min(frames, i + w); j++) { m += flux[j]; c++; } env[i] = Math.max(0, flux[i] - m / c); }
  // tempo by autocorrelation with a log-normal prior around 120 BPM
  let bestLag = 0, bestVal = -1;
  const ac = (lag) => { let s = 0; for (let i = lag; i < frames; i++) s += env[i] * env[i - lag]; return s / (frames - lag); };
  const lagOf = (bpm) => (60 / bpm) * fr;
  if (forceBpm) bestLag = lagOf(forceBpm);
  else for (let bpm = minBpm; bpm <= maxBpm; bpm += 0.5) {
    const lag = Math.round(lagOf(bpm));
    const v = ac(lag) * Math.exp(-0.5 * (Math.log2(bpm / 120) / 0.9) ** 2);
    if (v > bestVal) { bestVal = v; bestLag = lagOf(bpm); }
  }
  const bpm = (60 * fr) / bestLag;
  // dynamic-programming beat tracking (Ellis 2007)
  const score = new Float32Array(frames), back = new Int32Array(frames).fill(-1);
  const alpha = 100;
  for (let i = 0; i < frames; i++) {
    let best = 0, bi = -1;
    for (let j = Math.round(i - 2 * bestLag); j <= i - Math.round(bestLag / 2); j++) {
      if (j < 0) continue;
      const v = score[j] - alpha * Math.log((i - j) / bestLag) ** 2;
      if (v > best || bi < 0) { best = v; bi = j; }
    }
    score[i] = env[i] + (bi >= 0 ? best : 0); back[i] = bi;
  }
  let i = score.reduce((bi, v, k) => (k > frames - bestLag * 2 && v > score[bi] ? k : bi), frames - 1);
  const beats = [];
  while (i >= 0) { beats.push(+((i * hop) / sr).toFixed(3)); i = back[i]; }
  beats.reverse();
  // downbeats: choose the phase (0..3) whose beats carry the most onset energy
  const strength = beats.map((t) => env[Math.min(frames - 1, Math.round((t * sr) / hop))]);
  let phase = 0, ps = -1;
  for (let p = 0; p < 4; p++) { const s = strength.filter((_, k) => k % 4 === p).reduce((a, b) => a + b, 0); if (s > ps) { ps = s; phase = p; } }
  const downbeats = beats.filter((_, k) => k % 4 === phase);
  // onsets: local maxima above adaptive threshold
  const onsets = [];
  const thr = mean(Array.from(env)) + std(Array.from(env));
  for (let k = 2; k < frames - 2; k++) if (env[k] > thr && env[k] >= env[k - 1] && env[k] >= env[k + 1] && env[k] >= env[k - 2] && env[k] >= env[k + 2]) onsets.push(+((k * hop) / sr).toFixed(3));
  return { path, bpm: +bpm.toFixed(2), beats, downbeats, onsets, duration: +(x.length / sr).toFixed(3) };
}

// ---------- shot matching ----------
// Measure each V1 clip's average exposure/cast over its used range and compute per-clip
// corrections that bring it toward a reference clip (or the median of all clips).
export async function measureClip(path, a, b) {
  const tmp = join(process.env.TMPDIR || '/tmp', `domus_m_${sha({ path, a, b })}.txt`);
  await ffmpeg(['-ss', String(a), '-to', String(b), '-i', path, '-an', '-vf', `fps=2,scale=320:-2,signalstats,metadata=mode=print:file='${tmp.replace(/:/g, '\\:')}'`, '-f', 'null', '-']);
  const rows = parseMeta(readFileSync(tmp, 'utf8')); try { unlinkSync(tmp); } catch {}
  return { Y: mean(rows.map((r) => r['lavfi.signalstats.YAVG'])), U: mean(rows.map((r) => r['lavfi.signalstats.UAVG'])), V: mean(rows.map((r) => r['lavfi.signalstats.VAVG'])) };
}

async function measureImage(path) {
  const tmp = join(process.env.TMPDIR || '/tmp', `domus_i_${sha({ path })}.txt`);
  await ffmpeg(['-i', path, '-vf', `scale=320:-2,format=yuv420p,signalstats,metadata=mode=print:file='${tmp.replace(/:/g, '\\:')}'`, '-f', 'null', '-']);
  const rows = parseMeta(readFileSync(tmp, 'utf8')); try { unlinkSync(tmp); } catch {}
  return { Y: mean(rows.map((r) => r['lavfi.signalstats.YAVG'])), U: mean(rows.map((r) => r['lavfi.signalstats.UAVG'])), V: mean(rows.map((r) => r['lavfi.signalstats.VAVG'])) };
}

export async function matchShots(tl, root, { reference, strength = 0.7 } = {}) {
  const ms = [];
  for (const c of tl.tracks.video) {
    const m = tl.media[c.media];
    const p = resolve(root, m.path);
    const meas = m.kind === 'image' ? await measureImage(p) : await measureClip(p, c.in, c.out);
    ms.push({ id: c.id, ...meas });
  }
  const med = (k) => { const a = ms.map((x) => x[k]).sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
  const ref = reference ? ms.find((x) => x.id === reference) : { Y: med('Y'), U: med('U'), V: med('V') };
  if (!ref) throw new Error(`reference clip ${reference} not found`);
  const corrections = ms.map((x) => {
    const exposure = clamp(Math.log2(ref.Y / Math.max(1, x.Y)) * strength, -0.6, 0.6);
    const bm = clamp(-((x.U - ref.U) / 128) * 1.6 * strength, -0.15, 0.15);
    const rm = clamp(-((x.V - ref.V) / 128) * 1.6 * strength, -0.15, 0.15);
    return { id: x.id, measured: { Y: +x.Y.toFixed(1), U: +x.U.toFixed(1), V: +x.V.toFixed(1) }, match: { exposure: +exposure.toFixed(3), rm: +rm.toFixed(3), bm: +bm.toFixed(3) } };
  });
  return { reference: reference || 'median', ref, corrections };
}

export function mediaId(tl, path) {
  let base = basename(path).replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'media';
  let id = base, k = 2;
  while (tl.media[id]) id = `${base}-${k++}`;
  return id;
}

export { log };
