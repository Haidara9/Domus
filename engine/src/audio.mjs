// Sound: a small synthesized SFX library (deterministic, royalty-free by construction) and the
// mixer that turns the audio track into one mastered stereo stem (ducking, fades, loudness).
import { writeFileSync, renameSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { debug, ensureDir, exists, ffmpeg, fileSig, log, run, FFMPEG, sha } from './util.mjs';

const SR = 48000;

function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 * 2 - 1; }; }

// RBJ biquad, coefficients recomputed per call (cheap enough for SFX lengths).
function biquad() {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x, type, f, q = 0.7) => {
    const w = (2 * Math.PI * Math.min(f, SR * 0.45)) / SR, cs = Math.cos(w), al = Math.sin(w) / (2 * q);
    let b0, b1, b2; const a0 = 1 + al, a1 = -2 * cs, a2 = 1 - al;
    if (type === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = (1 - cs) / 2; }
    else if (type === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2; }
    else { b0 = al; b1 = 0; b2 = -al; } // bandpass (constant 0 dB peak)
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y; return y;
  };
}

const bell = (u) => Math.sin(Math.PI * Math.min(1, Math.max(0, u)));
const smooth = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };

// Each voice: (params) => { len, fn(i, t) -> [L, R] }
export const SFX = {
  whoosh: ({ dur = 0.6, dir = 1, low = 350, high = 2600, seed = 11 } = {}) => {
    const nz = rng(seed), bpL = biquad(), bpR = biquad();
    return { len: dur, fn: (i, t) => {
      const u = t / dur, env = Math.pow(bell(u), 1.6);
      const f = low + (high - low) * bell(u);
      const x = nz();
      const pan = 0.5 + 0.45 * dir * (u * 2 - 1);
      const l = bpL(x, 'bp', f, 1.2) * env * 1.4, r = bpR(nz(), 'bp', f * 1.03, 1.2) * env * 1.4;
      return [l * (1 - pan) * 1.6, r * pan * 1.6];
    } };
  },
  swish: (p = {}) => SFX.whoosh({ dur: 0.32, low: 900, high: 5200, ...p }),
  riser: ({ dur = 2.0, seed = 5 } = {}) => {
    const nz = rng(seed), hp = biquad(); let ph = 0;
    return { len: dur + 0.05, fn: (i, t) => {
      const u = Math.min(1, t / dur), env = Math.pow(u, 2.2) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.05) : 1);
      const f = 180 + 1400 * Math.pow(u, 1.8); ph += (2 * Math.PI * f) / SR;
      const tone = Math.sin(ph) * 0.25 + Math.sin(ph * 1.5) * 0.12;
      const air = hp(nz(), 'hp', 800 + 6000 * u) * 0.5;
      const v = (tone + air) * env * 0.8;
      return [v, v];
    } };
  },
  impact: ({ dur = 1.6, seed = 9, freq = 52 } = {}) => {
    const nz = rng(seed), lp = biquad(); let ph = 0;
    return { len: dur, fn: (i, t) => {
      const f = freq * (1 + 1.6 * Math.exp(-t * 18)); ph += (2 * Math.PI * f) / SR;
      const body = Math.sin(ph) * Math.exp(-t * 3.2) * 0.95;
      const crack = lp(nz(), 'lp', 2400 * Math.exp(-t * 6) + 200) * Math.exp(-t * 22) * 0.9;
      const v = Math.tanh((body + crack) * 1.4) * 0.9;
      return [v, v];
    } };
  },
  hit: ({ seed = 3 } = {}) => {
    const nz = rng(seed); let ph = 0;
    return { len: 0.5, fn: (i, t) => {
      const f = 60 + 140 * Math.exp(-t * 35); ph += (2 * Math.PI * f) / SR;
      const v = (Math.sin(ph) * Math.exp(-t * 9) + nz() * Math.exp(-t * 60) * 0.3) * 0.85;
      return [v, v];
    } };
  },
  click: () => ({ len: 0.05, fn: (i, t) => { const v = Math.sin(2 * Math.PI * 2200 * t) * Math.exp(-t * 110) * 0.45; return [v, v]; } }),
  shimmer: ({ dur = 1.8, base = 2400 } = {}) => {
    const parts = [1, 1.5, 2, 2.67, 3.2].map((m, k) => ({ f: base * m, a: 0.18 / (k + 1), ph: k * 1.3 }));
    return { len: dur, fn: (i, t) => {
      const env = smooth(t / 0.25) * Math.exp(-Math.max(0, t - 0.25) * 2.2);
      let l = 0, r = 0;
      parts.forEach((p, k) => { const s = Math.sin(2 * Math.PI * p.f * t + p.ph) * p.a * (0.7 + 0.3 * Math.sin(2 * Math.PI * (3 + k) * t)); l += s * (k % 2 ? 0.6 : 1); r += s * (k % 2 ? 1 : 0.6); });
      return [l * env, r * env];
    } };
  },
  swell: ({ dur = 1.2, seed = 21 } = {}) => {
    const nz = rng(seed), bp = biquad();
    return { len: dur, fn: (i, t) => { const u = t / dur; const v = bp(nz(), 'bp', 300 + 2500 * u, 0.8) * Math.pow(u, 3) * 1.6; return [v, v]; } };
  },
  roomtone: ({ dur = 10, seed = 31, level = 0.35 } = {}) => {
    const nz = rng(seed), lpL = biquad(), lpR = biquad(); let pl = 0, pr = 0;
    return { len: dur, fn: (i, t) => {
      pl = 0.985 * pl + 0.015 * nz(); pr = 0.985 * pr + 0.015 * nz();
      const fade = smooth(t / 0.5) * smooth((dur - t) / 0.5);
      return [lpL(pl * 6, 'lp', 700) * level * fade, lpR(pr * 6, 'lp', 700) * level * fade];
    } };
  },
  air: ({ dur = 10, seed = 41, level = 0.12 } = {}) => {
    const nz = rng(seed), hpL = biquad(), hpR = biquad(), lpL = biquad(), lpR = biquad();
    return { len: dur, fn: (i, t) => {
      const m = 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.07 * t) * Math.sin(2 * Math.PI * 0.023 * t + 1);
      const fade = smooth(t / 0.8) * smooth((dur - t) / 0.8);
      return [lpL(hpL(nz(), 'hp', 1500), 'lp', 7000) * level * m * fade, lpR(hpR(nz(), 'hp', 1500), 'lp', 7000) * level * m * fade];
    } };
  },
};

export function synthToWav(type, params, outPath) {
  const make = SFX[type];
  if (!make) throw new Error(`Unknown sfx type "${type}". Known: ${Object.keys(SFX).join(', ')}`);
  const v = make(params || {});
  const N = Math.ceil(v.len * SR);
  const buf = Buffer.alloc(44 + N * 8);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 8, 4); buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(3, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 8, 28); buf.writeUInt16LE(8, 32); buf.writeUInt16LE(32, 34);
  buf.write('data', 36); buf.writeUInt32LE(N * 8, 40);
  for (let i = 0; i < N; i++) {
    const [l, r] = v.fn(i, i / SR);
    buf.writeFloatLE(Math.max(-1, Math.min(1, l)), 44 + i * 8);
    buf.writeFloatLE(Math.max(-1, Math.min(1, r)), 48 + i * 8);
  }
  writeFileSync(outPath, buf);
  return { path: outPath, len: v.len };
}

// SFX that should hit exactly ON a time are pre-rolled: a riser ends on its start time.
export function sfxOffset(item) {
  if (item.type === 'riser') return -(item.params?.dur ?? 2.0);
  if (item.type === 'swell') return -(item.params?.dur ?? 1.2);
  if (item.type === 'whoosh' || item.type === 'swish') return -((item.params?.dur ?? (item.type === 'swish' ? 0.32 : 0.6)) / 2);
  return 0;
}

const n = (x) => Number(x).toFixed(4);

// Mix the audio track to one stereo AAC/WAV stem of exactly `duration` seconds.
export async function mixAudio({ tl, root, cacheDir, duration, loudness = -14, truePeak = -1.5 }) {
  const items = tl.tracks.audio || [];
  const dir = ensureDir(join(cacheDir, 'audio'));
  if (!items.length) return null;
  const inputs = [], labels = { vo: [], music: [], fx: [] };
  const sig = [];
  const graph = [];
  items.forEach((a, k) => {
    let src, start = a.start;
    if (a.kind === 'sfx' && a.type) {
      const p = { ...(a.params || {}) };
      if (['roomtone', 'air'].includes(a.type) && a.dur) p.dur = a.dur;
      const f = join(dir, `sfx_${a.type}_${sha({ p, v: 1 })}.wav`);
      if (!exists(f)) synthToWav(a.type, p, f);
      src = f; start = Math.max(0, a.start + (a.anchor === 'start' ? 0 : sfxOffset(a)));
    } else {
      src = resolve(root, a.path);
    }
    sig.push({ ...a, src: fileSig(src) });
    inputs.push('-i', src);
    const f = [];
    if (a.in || a.dur) f.push(`atrim=start=${n(a.in || 0)}${a.dur ? `:duration=${n(a.dur)}` : ''}`);
    f.push('asetpts=PTS-STARTPTS', 'aformat=sample_rates=48000:channel_layouts=stereo');
    if (a.fadeIn) f.push(`afade=t=in:st=0:d=${n(a.fadeIn)}`);
    if (a.fadeOut) {
      const len = a.dur || Math.max(0.1, duration - a.start);
      f.push(`afade=t=out:st=${n(Math.max(0, len - a.fadeOut))}:d=${n(a.fadeOut)}`);
    }
    const gain = a.gain ?? ({ music: -14, vo: 0, ambience: -22, sfx: -8, source: -10 }[a.kind]);
    f.push(`volume=${n(gain)}dB`);
    if (start > 0) f.push(`adelay=${Math.round(start * 1000)}:all=1`);
    graph.push(`[${k}:a]${f.join(',')}[a${k}]`);
    (a.kind === 'vo' ? labels.vo : a.kind === 'music' ? labels.music : labels.fx).push({ l: `[a${k}]`, duck: a.duck !== false });
  });
  const key = sha({ v: 2, sig, duration, loudness, truePeak });
  const out = join(dir, `mix_${key}.wav`);
  if (exists(out)) return { path: out, cached: true };

  const mixOf = (arr, name) => {
    if (!arr.length) return null;
    if (arr.length === 1) { graph.push(`${arr[0].l}anull[${name}]`); return `[${name}]`; }
    graph.push(`${arr.map((x) => x.l).join('')}amix=inputs=${arr.length}:normalize=0:duration=longest[${name}]`);
    return `[${name}]`;
  };
  const vo = mixOf(labels.vo, 'vo');
  let music = mixOf(labels.music, 'mus');
  const fx = mixOf(labels.fx, 'fx');
  const busses = [];
  if (vo && music && labels.music.some((m) => m.duck)) {
    graph.push(`${vo}asplit=2[vo1][vosc]`);
    graph.push(`${music}[vosc]sidechaincompress=threshold=0.03:ratio=6:attack=30:release=450:makeup=1[musd]`);
    busses.push('[vo1]', '[musd]');
  } else {
    if (vo) busses.push(vo);
    if (music) busses.push(music);
  }
  if (fx) busses.push(fx);
  const head = busses.length > 1 ? `${busses.join('')}amix=inputs=${busses.length}:normalize=0:duration=longest,` : busses[0];
  const withTail = (tail) => [...graph, `${head}apad,atrim=end=${n(duration)},${tail}[o]`].join(';');

  // pass 1: measure integrated loudness, pass 2: linear normalization + true-peak limiter
  const m = await run(FFMPEG, ['-hide_banner', '-nostats', ...inputs, '-filter_complex', withTail(`loudnorm=I=${loudness}:TP=${truePeak}:LRA=11:print_format=json`), '-map', '[o]', '-f', 'null', '-']);
  const js = JSON.parse(m.stderr.slice(m.stderr.lastIndexOf('{'), m.stderr.lastIndexOf('}') + 1));
  debug('loudness pass1', js);
  const ln = !Number.isFinite(Number(js.input_i)) || Number(js.input_i) < -70 ? 'anull'
    : `loudnorm=I=${loudness}:TP=${truePeak}:LRA=11:measured_I=${js.input_i}:measured_TP=${js.input_tp}:measured_LRA=${js.input_lra}:measured_thresh=${js.input_thresh}:offset=${js.target_offset}:linear=true`;
  const finalGraph = withTail(`${ln},alimiter=limit=${n(Math.pow(10, truePeak / 20))}:level=disabled,aresample=48000`);
  const tmp = out + '.part.wav';
  await ffmpeg([...inputs, '-filter_complex', finalGraph, '-map', '[o]', '-c:a', 'pcm_s24le', '-ar', '48000', tmp]);
  renameSync(tmp, out);
  log(`  audio mix: ${items.length} items, ${labels.vo.length ? 'VO + ' : ''}${labels.music.length ? 'music' + (vo ? ' ducked' : '') + ' + ' : ''}${labels.fx.length} fx`);
  return { path: out, cached: false };
}
