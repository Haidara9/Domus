// V1 rendering: per-clip segments (trim, speed/ramp, stabilize, reframe, camera move, grade)
// cached by content hash, then joined with transitions into one base video.
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renameSync, writeFileSync } from 'node:fs';
import { LIBRARY_DIR, debug, ensureDir, exists, ffmpeg, fileSig, log, readJSON, sha, toFrames } from './util.mjs';
import { layout, speedChunks, transitionDur } from './timeline.mjs';

export const GRADES = () => readJSON(join(LIBRARY_DIR, 'color', 'grades.json'));
export const TRANSITIONS = () => readJSON(join(LIBRARY_DIR, 'transitions', 'transitions.json'));

const TOOLS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'tools');
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

// Camera shake: damped oscillation in output pixels, added to the crop window (needs zoom > 1 for margin).
// camera.shake: [{ at, dur, amp (px), freq (Hz) }], times local to the clip.
export function shakeExprs(clip) {
  const sh = clip.camera?.shake || [];
  if (!sh.length) return { SX: '0', SY: '0' };
  const term = (s, axis) => {
    const f = s.freq ?? 9, a = s.amp ?? 10, d = Math.max(0.05, s.dur ?? 0.5);
    const u = `(t-${n(s.at)})`;
    const wave = axis === 'x' ? `sin(2*PI*${n(f)}*${u})` : `cos(2*PI*${n(f * 0.77)}*${u}+0.6)`;
    return `if(between(t,${n(s.at)},${n(s.at + d)}),${n(axis === 'x' ? a : a * 0.7)}*exp(-5*${u}/${n(d)})*${wave},0)`;
  };
  return { SX: sh.map((s) => term(s, 'x')).join('+'), SY: sh.map((s) => term(s, 'y')).join('+') };
}

// JS mirror of the camera (zoom, focus, shake) at clip-local time t. Overlays tracked on the source
// footage use it to stay locked to the picture when the shot itself is pushed, punched or shaken:
// source-normalized (x, y) -> output-normalized (x*Z + ox, y*Z + oy).
const EASE_JS = {
  linear: (u) => u, inOutSine: (u) => (1 - Math.cos(Math.PI * u)) / 2, glide: (u) => (1 - Math.cos(Math.PI * u)) / 2,
  outCubic: (u) => 1 - (1 - u) ** 3, inCubic: (u) => u ** 3, outQuart: (u) => 1 - (1 - u) ** 4, architectural: (u) => 1 - (1 - u) ** 4,
};
export function cameraAt(clip, t, W = 1920, H = 1080) {
  const cam = clip.camera || {};
  const base = clip.reframe?.zoom || 1;
  const [fx0, fy0] = clip.reframe?.focus || cam.focus || [0.5, 0.5];
  const amt = cam.amount ?? 0.08, span = cam.span ?? 0.6;
  const cl = (x) => Math.min(1, Math.max(0, x));
  const e = (EASE_JS[cam.ease] || EASE_JS.inOutSine)(cl(t / Math.max(clip.dur, 1e-3)));
  let Z = base, FX = fx0, FY = fy0;
  if (cam.keys?.length) {
    const K = cam.keys;
    const comp = (j) => {
      if (t < K[0][0]) return K[0][j];
      for (let i = 1; i < K.length; i++) if (t < K[i][0]) return K[i - 1][j] + (K[i][j] - K[i - 1][j]) * EASE_JS.inOutSine(cl((t - K[i - 1][0]) / Math.max(1e-3, K[i][0] - K[i - 1][0])));
      return K[K.length - 1][j];
    };
    Z = base * comp(1); FX = comp(2); FY = comp(3);
  } else {
    const move = cam.move || 'static';
    if (move === 'push-in') Z = base * (1 + amt * e);
    else if (move === 'pull-out') Z = base * (1 + amt * (1 - e));
    else if (move === 'pan-left' || move === 'pan-right') { Z = base * (1 + amt); FX = cl(fx0 + (move === 'pan-left' ? -1 : 1) * span * (e - 0.5)); }
    else if (move === 'tilt-up' || move === 'tilt-down') { Z = base * (1 + amt); FY = cl(fy0 + (move === 'tilt-up' ? -1 : 1) * span * (e - 0.5)); }
    else if (move === 'drift') { Z = base * (1 + amt * 0.5 * e); FX = cl(fx0 + 0.15 * (e - 0.5)); }
  }
  let sx = 0, sy = 0;
  for (const s of cam.shake || []) {
    const d = Math.max(0.05, s.dur ?? 0.5), u = t - s.at, f = s.freq ?? 9, a = s.amp ?? 10;
    if (u < 0 || u > d) continue;
    const env = Math.exp((-5 * u) / d);
    sx += a * env * Math.sin(2 * Math.PI * f * u); sy += a * 0.7 * env * Math.cos(2 * Math.PI * f * 0.77 * u + 0.6);
  }
  // crop window x = (W*Z - W)*FX + sx, clamped to the scaled frame
  const cx = Math.min(Math.max(0, (W * Z - W) * FX + sx), W * Z - W), cy = Math.min(Math.max(0, (H * Z - H) * FY + sy), H * Z - H);
  return { Z, ox: -cx / W, oy: -cy / H };
}

// ---------- time remap ----------
// clip.timemap: [[outLocal, srcLocal], ...] monotone, from (0,0) to (dur, out-in): a free-form speed curve that
// keeps the clip's duration (so cuts stay on the music) while redistributing speed inside it.
// Rendered by interpolating the source to 120 fps (motion-compensated) and re-timing with setpts.
export function sourceTimeAt(clip, t) {
  const P = clip.timemap;
  if (!P?.length) return t * (clip.speed || 1);
  if (t <= P[0][0]) return P[0][1];
  for (let i = 1; i < P.length; i++) if (t <= P[i][0]) { const k = (t - P[i - 1][0]) / Math.max(1e-9, P[i][0] - P[i - 1][0]); return P[i - 1][1] + (P[i][1] - P[i - 1][1]) * k; }
  return P[P.length - 1][1];
}

// setpts expression: source local time T -> output local time, as a flat sum of clipped ramps (no nesting).
export function timemapPts(P) {
  const terms = [n(P[0][0])];
  for (let i = 1; i < P.length; i++) {
    const ds = P[i][1] - P[i - 1][1], dout = P[i][0] - P[i - 1][0];
    if (ds <= 1e-6) continue;
    terms.push(`${n(dout / ds)}*clip(T-${n(P[i - 1][1])},0,${n(ds)})`);
  }
  return terms.join('+');
}

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
  const { SX, SY } = shakeExprs(clip);
  const shk = SX !== '0';
  const sw_ = `max(${W},trunc(${PW}*(${Z})/${n(zmax)}/2)*2)`, sh_ = `max(${H},trunc(${PH}*(${Z})/${n(zmax)}/2)*2)`;
  if (static_ && Math.abs(Number(Z) - zmax) < 1e-9) {
    const x = shk ? `clip((iw-${W})*(${FX})+${SX},0,iw-${W})` : `(iw-${W})*(${FX})`, y = shk ? `clip((ih-${H})*(${FY})+${SY},0,ih-${H})` : `(ih-${H})*(${FY})`;
    f.push(`crop=${W}:${H}:x='${x}':y='${y}'`);
  } else {
    f.push(`scale=w='${sw_}':h='${sh_}':eval=frame:flags=bicubic`);
    // crop's iw/ih are frozen at the first frame, so the per-frame size is recomputed here
    const x = `(${sw_}-${W})*(${FX})`, y = `(${sh_}-${H})*(${FY})`;
    f.push(`crop=${W}:${H}:x='${shk ? `clip(${x}+${SX},0,${sw_}-${W})` : x}':y='${shk ? `clip(${y}+${SY},0,${sh_}-${H})` : y}'`);
  }
  f.push(...gradeFilters(clip.grade, globalGrade));
  f.push('setsar=1');
  return f;
}

// ---------- footage FX ----------
// clip.fx: light and optics on the picture itself, never geometry. Times are local to the clip.
//   { type: 'exposure' | 'saturation' | 'contrast', at, dur, amount, shape }   animated eq pulses
//   { type: 'bloom', amount, threshold, radius, tint, at?, dur?, shape? }    highlight glow (constant, or a pulse)
//   { type: 'defocus', amount (0..1), radius, at?, dur?, shape? }           lens defocus (rack, or hold)
//   { type: 'fringe', at, dur, px }                                          lens colour fringe on impact cuts
// shape: 'bell' (in and out), 'flash' (fast attack, smooth decay), 'hold' (rises over `rise` s and stays), 'fall' (starts full, fades out).
export function fxShape(v, f) {
  if (f.at === undefined) return '1';
  const at = n(f.at), d = n(Math.max(0.02, f.dur ?? 0.4)), u = `clip((${v}-${at})/${d},0,1)`;
  switch (f.shape || 'bell') {
    case 'flash': return `(clip((${v}-${at})/0.05,0,1)*pow(1-${u},2))`;
    case 'hold': { const r = n(Math.max(0.02, f.rise ?? f.dur ?? 0.4)); return `((1-cos(PI*clip((${v}-${at})/${r},0,1)))/2)`; }
    case 'fall': return `pow(1-${u},2)*gte(${v},${at})+lt(${v},${at})`;
    case 'bell': default: return `pow(sin(PI*${u}),2)`;
  }
}

// Same shapes in JS (per-frame values for blend opacity, sent with sendcmd: per-pixel expressions are far too slow).
export function fxShapeJS(t, f) {
  if (f.at === undefined) return 1;
  const d = Math.max(0.02, f.dur ?? 0.4), u = Math.min(1, Math.max(0, (t - f.at) / d));
  switch (f.shape || 'bell') {
    case 'flash': return Math.min(1, Math.max(0, (t - f.at) / 0.05)) * (1 - u) ** 2;
    case 'hold': { const r = Math.max(0.02, f.rise ?? f.dur ?? 0.4); return (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, (t - f.at) / r)))) / 2; }
    case 'fall': return t < f.at ? 1 : (1 - u) ** 2;
    case 'bell': default: return Math.sin(Math.PI * u) ** 2;
  }
}

// Returns { graph, cmds }: graph from inL to outL; cmds is a sendcmd script to write at cmdPath.
export function fxGraph(fx, inL, outL, { fps = 30, frames = 0, cmdPath = '' } = {}) {
  const list = (fx || []).filter((f) => !f.off);
  if (!list.length) return { graph: `${inL}null${outL}`, cmds: '' };
  const parts = [];
  let cur = inL, k = 0;
  const lab = () => `[fx${k++}]`;
  const sum = (type, v) => list.filter((f) => f.type === type).map((f) => `${n(f.amount ?? 0)}*${fxShape(v, f)}`).join('+');
  const ex = sum('exposure', 't'), sa = sum('saturation', 't'), co = sum('contrast', 't');
  if (ex || sa || co) {
    const o = lab();
    parts.push(`${cur}eq=brightness='${ex || 0}':saturation='1+(${sa || 0})':contrast='1+(${co || 0})':eval=frame${o}`); cur = o;
  }
  const blooms = list.filter((f) => f.type === 'bloom'), defs = list.filter((f) => f.type === 'defocus');
  // per-frame opacities
  const series = (arr, cap) => Array.from({ length: frames }, (_, i) => Math.min(cap, arr.reduce((acc, f) => acc + (f.amount ?? 0.5) * fxShapeJS(i / fps, f), 0)));
  const lines = [];
  const anim = (name, vals) => {
    let last = null;
    vals.forEach((v, i) => { const q = Number(v.toFixed(3)); if (q !== last) { lines.push(`${n(i / fps)} ${name} all_opacity ${q};`); last = q; } });
  };
  const rgb = lab(); parts.push(`${cur}format=gbrp${cmdPath && (blooms.length || defs.length) ? `,sendcmd=f='${cmdPath.replace(/'/g, "\\'")}'` : ''}${rgb}`); cur = rgb;
  if (blooms.length) {
    const b0 = blooms[0], thr = b0.threshold ?? 0.62, rad = b0.radius ?? 22;
    const [tr, tg, tb] = b0.tint || [1, 0.8, 0.55];
    const vals = series(blooms, 1);
    anim('blend@bloom', vals);
    const a = lab(), b = lab(), c = lab(), o = lab();
    parts.push(`${cur}split${a}${b}`);
    parts.push(`${b}colorlevels=rimin=${n(thr)}:gimin=${n(thr)}:bimin=${n(thr)},colorchannelmixer=rr=${n(tr)}:gg=${n(tg)}:bb=${n(tb)},gblur=sigma=${n(rad)}:steps=2${c}`);
    parts.push(`${a}${c}blend@bloom=all_mode=screen:all_opacity=${n(vals[0] ?? 0)}${o}`); cur = o;
  }
  if (defs.length) {
    const rad = defs[0].radius ?? 14;
    const vals = series(defs, 1);
    anim('blend@defocus', vals);
    const a = lab(), b = lab(), c = lab(), o = lab();
    parts.push(`${cur}split${a}${b}`);
    parts.push(`${b}gblur=sigma=${n(rad)}:steps=3${c}`);
    // normal mode: top*opacity + bottom*(1-opacity), so the blurred copy goes on top
    parts.push(`${c}${a}blend@defocus=all_mode=normal:all_opacity=${n(vals[0] ?? 0)}${o}`); cur = o;
  }
  const fr = list.filter((f) => f.type === 'fringe');
  if (fr.length) {
    const o = lab();
    parts.push(`${cur}${fr.map((f) => { const p = Math.round(f.px ?? 6); return `rgbashift=rh=${-p}:bh=${p}:rv=${Math.round(p / 3)}:enable='between(t,${n(f.at)},${n(f.at + (f.dur ?? 0.1))})'`; }).join(',')}${o}`); cur = o;
  }
  parts.push(`${cur}format=yuv420p${outL}`);
  return { graph: parts.join(';'), cmds: lines.join('\n') };
}

// ---------- segments ----------
export function segmentKey(tl, clip, media, root, W, H) {
  return sha({ v: 8, clip: { ...clip, transition: undefined, label: undefined, notes: undefined }, src: fileSig(resolve(root, media.path)), W, H, fps: tl.fps, global: tl.grade?.global, grades: clip.grade || tl.grade?.global ? GRADES() : null });
}

async function retimeSource({ clip, media, src, W, H, fps, frames, cacheDir, quality }) {
  const zm = cameraExprs(clip, clip.dur).zmax;
  const ww = Math.min(media.width, Math.ceil((W * zm) / 2) * 2), wh = Math.min(media.height, Math.ceil((H * zm) / 2) * 2);
  const S = Array.from({ length: frames }, (_, i) => Number(sourceTimeAt(clip, i / fps).toFixed(5)));
  const key = sha({ v: 1, s: fileSig(src), in: clip.in, out: clip.out, S, ww, wh, fps, draft: quality === 'draft' });
  const dir = ensureDir(join(cacheDir, 'retime'));
  const out = join(dir, `${clip.id}_${key}.mp4`);
  if (exists(out)) return out;
  const mapPath = out + '.map.json';
  writeFileSync(mapPath, JSON.stringify({ frames, src: S }));
  log(`  retime ${clip.id} (${frames}f)`);
  const { spawn } = await import('node:child_process');
  await new Promise((res, rej) => {
    const p = spawn('python3', [join(TOOLS_DIR, 'retime.py'), src, String(clip.in), String(clip.out), mapPath, out + '.part.mp4', '--size', `${ww}x${wh}`, '--fps', String(fps), ...(quality === 'draft' ? ['--draft'] : [])], { stdio: ['ignore', 'pipe', 'inherit'] });
    let o = ''; p.stdout.on('data', (d) => (o += d));
    p.on('close', (c) => (c === 0 ? (debug(`retime ${clip.id} ${o.trim()}`), res()) : rej(new Error(`retime failed for ${clip.id}`))));
  });
  renameSync(out + '.part.mp4', out);
  return out;
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
  const cmdPath = out + '.cmd';
  const fxg = fxGraph(clip.fx, '[pre]', '', { fps, frames, cmdPath });
  if (fxg.cmds) writeFileSync(cmdPath, fxg.cmds + '\n');
  const finish = `fps=${fps},${chain},tpad=stop_mode=clone:stop_duration=2,trim=end_frame=${frames},format=yuv420p[pre];${fxg.graph}`;
  if (media.kind === 'video') {
    const chunks = speedChunks(clip);
    const interp = clip.interpolate ? `minterpolate=fps=${fps}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,` : '';
    if (clip.timemap?.length) {
      // frame-accurate retime (engine/tools/retime.py): real frames where the remap lands on them, interpolated in-betweens elsewhere
      const inter = await retimeSource({ clip, media, src, W, H, fps, frames, cacheDir, quality });
      args.length = 0; args.push('-i', inter);
      graph = `[0:v]setpts=PTS-STARTPTS,${finish}[v]`;
    } else if (chunks.length === 1) {
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
