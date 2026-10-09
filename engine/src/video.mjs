// V1 rendering: per-clip segments (trim, speed/ramp, stabilize, reframe, camera move, grade)
// cached by content hash, then joined with transitions into one base video.
import { join, resolve } from 'node:path';
import { renameSync, writeFileSync } from 'node:fs';
import { LIBRARY_DIR, debug, ensureDir, exists, ffmpeg, fileSig, log, readJSON, sha, toFrames } from './util.mjs';
import { layout, speedChunks, transitionDur } from './timeline.mjs';

export const GRADES = () => readJSON(join(LIBRARY_DIR, 'color', 'grades.json'));
export const TRANSITIONS = () => readJSON(join(LIBRARY_DIR, 'transitions', 'transitions.json'));

const n = (x) => Number(x).toFixed(6).replace(/\.?0+$/, '') || '0';

// ---------- grade ----------
export function gradeFilters(clipGrade, globalGrade) {
  const presets = GRADES();
  const g = clipGrade === undefined || clipGrade === null ? globalGrade : clipGrade;
  if (!g || g === 'none') return [];
  const spec = typeof g === 'string' ? { preset: g } : g;
  const out = [];
  if (spec.preset) {
    const p = presets[spec.preset];
    if (!p) throw new Error(`Unknown grade preset "${spec.preset}". Known: ${Object.keys(presets).filter((k) => !k.startsWith('_')).join(', ')}`);
    out.push(...p.filters);
  }
  if (spec.exposure) out.push(`exposure=exposure=${n(spec.exposure)}`);
  if (spec.temperature) out.push(`colortemperature=temperature=${Math.round(spec.temperature)}:mix=${n(spec.temperatureMix ?? 0.5)}`);
  if (spec.contrast !== undefined || spec.saturation !== undefined || spec.gamma !== undefined)
    out.push(`eq=contrast=${n(spec.contrast ?? 1)}:saturation=${n(spec.saturation ?? 1)}:gamma=${n(spec.gamma ?? 1)}`);
  if (spec.vibrance) out.push(`vibrance=intensity=${n(spec.vibrance)}`);
  if (spec.lut) out.push(`lut3d=file='${resolve(LIBRARY_DIR, 'color', spec.lut).replace(/'/g, "\\'")}'`);
  if (spec.sharpen) out.push(`cas=strength=${n(spec.sharpen)}`);
  if (spec.vignette) out.push(`vignette=angle=${n(spec.vignette)}`);
  if (spec.match) {
    // shot matching: per-clip corrections computed by `domus match` (stored as numbers)
    const m = spec.match;
    if (m.exposure) out.push(`exposure=exposure=${n(m.exposure)}`);
    if (m.rs || m.gs || m.bs || m.rm || m.gm || m.bm)
      out.push(`colorbalance=rs=${n(m.rs || 0)}:gs=${n(m.gs || 0)}:bs=${n(m.bs || 0)}:rm=${n(m.rm || 0)}:gm=${n(m.gm || 0)}:bm=${n(m.bm || 0)}`);
  }
  return out;
}

// ---------- camera ----------
const EASE_EXPR = {
  linear: (u) => `(${u})`,
  inOutSine: (u) => `((1-cos(PI*(${u})))/2)`,
  outCubic: (u) => `(1-pow(1-(${u}),3))`,
  inCubic: (u) => `pow(${u},3)`,
  outQuart: (u) => `(1-pow(1-(${u}),4))`,
  architectural: (u) => `(1-pow(1-(${u}),4))`,
  glide: (u) => `((1-cos(PI*(${u})))/2)`,
};

// Returns expressions (in ffmpeg syntax, variable t) for zoom Z(t) >= 1, focus fx(t), fy(t).
export function cameraExprs(clip, dur) {
  const cam = clip.camera || {};
  const base = clip.reframe?.zoom || 1;
  const [fx0, fy0] = clip.reframe?.focus || cam.focus || [0.5, 0.5];
  const amt = cam.amount ?? 0.08;
  const D = Math.max(dur, 1e-3);
  const u = `clip(t/${n(D)},0,1)`;
  const e = (EASE_EXPR[cam.ease] || EASE_EXPR.inOutSine)(u);
  const num = (x) => n(x);
  if (cam.keys?.length) {
    // keys: [[t, zoom, fx, fy], ...] interpolated with inOutSine per segment
    const K = cam.keys;
    const comp = (j) => {
      let expr = num(K[K.length - 1][j]);
      for (let i = K.length - 1; i >= 1; i--) {
        const [t0, , ,] = K[i - 1], t1 = K[i][0];
        const uu = `clip((t-${num(t0)})/${num(Math.max(1e-3, t1 - t0))},0,1)`;
        const seg = `(${num(K[i - 1][j])}+(${num(K[i][j] - K[i - 1][j])})*${EASE_EXPR.inOutSine(uu)})`;
        expr = `if(lt(t,${num(t1)}),${seg},${expr})`;
      }
      return `if(lt(t,${num(K[0][0])}),${num(K[0][j])},${expr})`;
    };
    return { Z: `(${num(base)}*${comp(1)})`, FX: comp(2), FY: comp(3), zmax: base * Math.max(...K.map((k) => k[1])) };
  }
  const move = cam.move || 'static';
  const span = cam.span ?? 0.6; // fraction of available margin travelled by pans
  switch (move) {
    case 'push-in': return { Z: `(${num(base)}*(1+${num(amt)}*${e}))`, FX: num(fx0), FY: num(fy0), zmax: base * (1 + amt) };
    case 'pull-out': return { Z: `(${num(base)}*(1+${num(amt)}*(1-${e})))`, FX: num(fx0), FY: num(fy0), zmax: base * (1 + amt) };
    case 'pan-left': case 'pan-right': {
      const dir = move === 'pan-left' ? -1 : 1;
      return { Z: num(base * (1 + amt)), FX: `clip(${num(fx0)}+${dir}*${num(span)}*(${e}-0.5),0,1)`, FY: num(fy0), zmax: base * (1 + amt) };
    }
    case 'tilt-up': case 'tilt-down': {
      const dir = move === 'tilt-up' ? -1 : 1;
      return { Z: num(base * (1 + amt)), FX: num(fx0), FY: `clip(${num(fy0)}+${dir}*${num(span)}*(${e}-0.5),0,1)`, zmax: base * (1 + amt) };
    }
    case 'drift': // gentle life for stills: 4% push + slight lateral drift
      return { Z: `(${num(base)}*(1+${num(amt * 0.5)}*${e}))`, FX: `clip(${num(fx0)}+0.15*(${e}-0.5),0,1)`, FY: num(fy0), zmax: base * (1 + amt * 0.5) };
    case 'static': default:
      return { Z: num(base), FX: num(fx0), FY: num(fy0), zmax: base };
  }
}

// Filter chain from a decoded source frame to the W×H graded frame.
export function frameChain({ clip, media, W, H, dur, globalGrade, trf }) {
  const f = [];
  if (trf) f.push(`vidstabtransform=input='${trf}':smoothing=${clip.stabilize?.smoothing ?? 15}:zoom=${clip.stabilize?.zoom ?? 3}:interpol=bicubic`);
  const { Z, FX, FY, zmax } = cameraExprs(clip, dur);
  const sw = media.width, sh = media.height;
  const cover = Math.max(W / sw, H / sh);
  // 1) one constant resample to the largest size the move needs (downscale = sharper)
  const PW = Math.ceil((sw * cover * zmax) / 2) * 2 + 2, PH = Math.ceil((sh * cover * zmax) / 2) * 2 + 2;
  f.push(`scale=${PW}:${PH}:flags=lanczos`);
  // 2) per-frame zoom relative to that size, 3) crop the output window around the focus point
  const static_ = !/t/.test(Z);
  if (static_ && Math.abs(Number(Z) - zmax) < 1e-9) {
    // no animated zoom
  } else {
    f.push(`scale=w='max(${W},trunc(${PW}*(${Z})/${n(zmax)}/2)*2)':h='max(${H},trunc(${PH}*(${Z})/${n(zmax)}/2)*2)':eval=frame:flags=bicubic`);
  }
  f.push(`crop=${W}:${H}:x='(iw-${W})*(${FX})':y='(ih-${H})*(${FY})'`);
  f.push(...gradeFilters(clip.grade, globalGrade));
  f.push('setsar=1');
  return f;
}

// ---------- segments ----------
export function segmentKey(tl, clip, media, root, W, H) {
  return sha({ v: 3, clip: { ...clip, transition: undefined, label: undefined, notes: undefined }, src: fileSig(resolve(root, media.path)), W, H, fps: tl.fps, global: tl.grade?.global, grades: clip.grade || tl.grade?.global ? GRADES() : null });
}

async function stabilizeTrf(clip, media, root, cacheDir) {
  const src = resolve(root, media.path);
  const trf = join(cacheDir, `stab_${sha({ s: fileSig(src), in: clip.in, out: clip.out })}.trf`);
  if (!exists(trf)) {
    log(`  stabilize analyse ${clip.id}`);
    await ffmpeg(['-ss', String(clip.in), '-to', String(clip.out), '-i', src, '-vf', `vidstabdetect=shakiness=6:accuracy=12:result='${trf}'`, '-f', 'null', '-']);
  }
  return trf;
}

export async function renderSegment({ tl, clip, root, cacheDir, W, H, quality = 'final' }) {
  const media = tl.media[clip.media];
  const fps = tl.fps;
  const segDir = ensureDir(join(cacheDir, 'segments'));
  const frames = toFrames(clip.dur, fps);
  const key = segmentKey(tl, clip, media, root, W, H) + (quality === 'draft' ? 'd' : '');
  const out = join(segDir, `${clip.id}_${key}.mp4`);
  if (exists(out)) { debug(`segment cache hit ${clip.id}`); return { path: out, cached: true, frames }; }
  const src = resolve(root, media.path);
  const args = [];
  let pre = [];
  if (media.kind === 'image') {
    args.push('-loop', '1', '-framerate', String(fps), '-t', String(clip.dur + 1), '-i', src);
  } else {
    // accurate input seek; ramp chunks below are relative to clip.in
    args.push('-ss', n(clip.in), '-to', n(clip.out + 0.5), '-i', src);
  }
  const trf = media.kind === 'video' && clip.stabilize ? await stabilizeTrf(clip, media, root, cacheDir) : null;
  let graph;
  const chain = frameChain({ clip, media, W, H, dur: clip.dur, globalGrade: tl.grade?.global, trf }).join(',');
  // fps -> look (reframe/camera/grade) -> pad/trim to the exact frame count
  const finish = `fps=${fps},${chain},tpad=stop_mode=clone:stop_duration=2,trim=end_frame=${frames},format=yuv420p`;
  if (media.kind === 'video') {
    const chunks = speedChunks(clip);
    const interp = clip.interpolate ? `minterpolate=fps=${fps}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,` : '';
    if (chunks.length === 1) {
      graph = `[0:v]trim=start=0:end=${n(clip.out - clip.in)},setpts=(PTS-STARTPTS)/${n(chunks[0].speed)},${interp}${finish}[v]`;
    } else {
      const parts = chunks.map((c, i) => `[s${i}]trim=start=${n(c.a - clip.in)}:end=${n(c.b - clip.in)},setpts=(PTS-STARTPTS)/${n(c.speed)}[c${i}]`);
      graph = `[0:v]split=${chunks.length}${chunks.map((_, i) => `[s${i}]`).join('')};${parts.join(';')};${chunks.map((_, i) => `[c${i}]`).join('')}concat=n=${chunks.length}:v=1:a=0,${interp}${finish}[v]`;
    }
  } else {
    graph = `[0:v]${finish}[v]`;
  }
  pre = pre.concat(args);
  const enc = quality === 'draft' ? ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24'] : ['-c:v', 'libx264', '-preset', 'medium', '-crf', '14'];
  const tmp = out + '.part.mp4';
  await ffmpeg([...pre, '-filter_complex', graph, '-map', '[v]', '-an', '-frames:v', String(frames), ...enc, '-pix_fmt', 'yuv420p', '-r', String(fps), tmp]);
  renameSync(tmp, out);
  log(`  segment ${clip.id} ${frames}f ${clip.camera?.move || 'static'}${clip.ramp ? ' ramp' : clip.speed && clip.speed !== 1 ? ` ${clip.speed}x` : ''}`);
  return { path: out, cached: false, frames };
}

// ---------- join ----------
export async function joinSegments({ tl, segs, clips, cacheDir, W, H, brand, quality = 'final', totalFrames }) {
  const fps = tl.fps;
  const T = TRANSITIONS();
  // the base runs to the film's full duration (end cards may extend past the last clip; it holds the last frame)
  const total = Math.max(totalFrames || 0, clips.length ? toFrames(clips[clips.length - 1].end, fps) : 0);
  const key = sha({ v: 3, total, segs: segs.map((s) => s.path), trans: clips.map((c) => c.transition || null), fps, W, H, paper: brand?.colors?.paper });
  const out = join(ensureDir(join(cacheDir, 'base')), `base_${key}${quality === 'draft' ? 'd' : ''}.mp4`);
  if (exists(out)) return { path: out, cached: true, frames: total };
  const inputs = segs.flatMap((s) => ['-i', s.path]);
  const graph = [];
  const blurWindows = [];
  let acc = '[0:v]';
  for (let i = 1; i < segs.length; i++) {
    const prev = clips[i - 1];
    const tr = prev.transition?.type || 'cut';
    const def = T[tr];
    if (!def) throw new Error(`${prev.id}: unknown transition "${tr}". Known: ${Object.keys(T).filter((k) => !k.startsWith('_')).join(', ')}`);
    const d = transitionDur(prev, fps);
    const offset = clips[i].start; // where the next clip starts on the timeline
    const label = `[j${i}]`;
    if (def.engine === 'cut' || d === 0) {
      graph.push(`${acc}[${i}:v]concat=n=2:v=1:a=0${label}`);
    } else if (def.engine === 'dip') {
      const col = (def.color === 'paper' ? brand?.colors?.paper || '#F1E6D3' : def.color || '#000000').replace('#', '0x');
      graph.push(`${acc}fade=t=out:st=${n(offset)}:d=${n(d)}:color=${col}[da${i}]`);
      graph.push(`[${i}:v]fade=t=in:st=0:d=${n(d)}:color=${col}[db${i}]`);
      graph.push(`[da${i}][db${i}]xfade=transition=fade:duration=${n(d)}:offset=${n(offset)}${label}`);
    } else {
      graph.push(`${acc}[${i}:v]xfade=transition=${def.xfade}:duration=${n(d)}:offset=${n(offset)}${label}`);
      if (def.engine === 'whip') blurWindows.push({ a: offset, b: offset + d, blur: prev.transition?.blur ?? def.blur ?? 64, axis: def.axis || 'x' });
    }
    acc = label;
  }
  let post = blurWindows.map((w) => {
    const big = Math.round(w.blur), small = Math.round(w.blur * 0.45);
    const pad = (w.b - w.a) * 0.35;
    const sz = (s) => (w.axis === 'y' ? `sizeX=1:sizeY=${s}` : `sizeX=${s}:sizeY=1`);
    return `avgblur=${sz(small)}:enable='between(t,${n(w.a - pad)},${n(w.b + pad)})',avgblur=${sz(big)}:enable='between(t,${n(w.a + (w.b - w.a) * 0.15)},${n(w.b - (w.b - w.a) * 0.15)})'`;
  }).join(',');
  const finalChain = `${post ? post + ',' : ''}tpad=stop_mode=clone:stop_duration=${n(total / fps + 1)},trim=end_frame=${total},format=yuv420p`;
  if (segs.length === 1) graph.push(`[0:v]${finalChain}[v]`);
  else graph.push(`${acc}${finalChain}[v]`);
  const enc = quality === 'draft' ? ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23'] : ['-c:v', 'libx264', '-preset', 'medium', '-crf', '14'];
  const tmp = out + '.part.mp4';
  writeFileSync(out + '.graph.txt', graph.join(';\n'));
  await ffmpeg([...inputs, '-filter_complex', graph.join(';'), '-map', '[v]', '-frames:v', String(total), ...enc, '-r', String(fps), tmp]);
  renameSync(tmp, out);
  log(`  joined ${segs.length} clips -> ${total}f`);
  return { path: out, cached: false, frames: total };
}

export { layout };
