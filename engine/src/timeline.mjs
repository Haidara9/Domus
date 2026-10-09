// DOMUS timeline: schema, normalization (frame-accurate positions), validation,
// non-destructive edit operations and version history.
//
// A production folder holds:
//   timeline.json          the editable source of truth
//   versions/NNNN.json     snapshot after every change, versions/log.json the history
//   cache/                 render cache (segments, overlays) keyed by content hash
//   renders/               outputs
import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { LIBRARY_DIR, ensureDir, exists, readJSON, sha, snap, toFrames, writeJSON } from './util.mjs';

export const SCHEMA = 'domus.timeline/1';

export const FORMATS = {
  'reel-9x16':   { width: 1080, height: 1920, fps: 30, label: 'Instagram Reels / TikTok / Shorts / Stories' },
  'feed-4x5':    { width: 1080, height: 1350, fps: 30, label: 'Instagram / Facebook feed portrait' },
  'square-1x1':  { width: 1080, height: 1080, fps: 30, label: 'Square feed' },
  'wide-16x9':   { width: 1920, height: 1080, fps: 30, label: 'YouTube / website / TV' },
  'wide-4k':     { width: 3840, height: 2160, fps: 30, label: 'YouTube 4K / big screen' },
  'cinema-239':  { width: 1920, height: 804,  fps: 24, label: '2.39:1 cinematic web film' },
};

export const TRACKS = ['video', 'text', 'animation', 'vfx', 'audio'];
const OVERLAY_TRACKS = ['text', 'animation', 'vfx'];
const ID_PREFIX = { video: 'v', text: 't', animation: 'g', vfx: 'x', audio: 'a' };

export function createTimeline({ title = 'Untitled', format = 'reel-9x16', fps } = {}) {
  const f = FORMATS[format];
  if (!f) throw new Error(`Unknown format "${format}". Known: ${Object.keys(FORMATS).join(', ')}`);
  return {
    schema: SCHEMA,
    title,
    format,
    width: f.width,
    height: f.height,
    fps: fps || f.fps,
    brand: 'brand/brand.json',
    grade: { global: null },
    media: {},
    tracks: { video: [], text: [], animation: [], vfx: [], audio: [] },
    markers: [],
    meta: { created: new Date().toISOString() },
  };
}

// ---------- speed / ramps ----------

const smoothstep = (x) => x * x * (3 - 2 * x);

// Speed at source fraction u in [0,1]. ramp: [{at, speed}] sorted by at.
export function speedAt(clip, u) {
  const r = clip.ramp;
  if (!r || !r.length) return clip.speed || 1;
  if (u <= r[0].at) return r[0].speed;
  for (let i = 1; i < r.length; i++) {
    if (u <= r[i].at) {
      const k = (u - r[i - 1].at) / Math.max(1e-9, r[i].at - r[i - 1].at);
      return r[i - 1].speed + (r[i].speed - r[i - 1].speed) * smoothstep(k);
    }
  }
  return r[r.length - 1].speed;
}

// Piecewise-constant approximation used by both duration math and the renderer,
// so the computed duration and the rendered duration always agree.
export function speedChunks(clip, n = 24) {
  const src = clip.out - clip.in;
  if (!clip.ramp || !clip.ramp.length) return [{ a: clip.in, b: clip.out, speed: clip.speed || 1 }];
  const out = [];
  for (let i = 0; i < n; i++) {
    const u0 = i / n, u1 = (i + 1) / n;
    out.push({ a: clip.in + src * u0, b: clip.in + src * u1, speed: speedAt(clip, (u0 + u1) / 2) });
  }
  return out;
}

export function clipOutputDuration(clip, fps) {
  const d = speedChunks(clip).reduce((s, c) => s + (c.b - c.a) / c.speed, 0);
  return Math.max(1, toFrames(d, fps)) / fps;
}

// ---------- normalization ----------

// Returns positions of every V1 clip on the output timeline plus total duration.
// V1 is magnetic: clip i+1 starts where clip i ends minus the transition overlap.
export function layout(tl) {
  const fps = tl.fps;
  const clips = [];
  let t = 0;
  tl.tracks.video.forEach((c, i) => {
    const dur = clipOutputDuration(c, fps);
    const prevT = i > 0 ? transitionDur(tl.tracks.video[i - 1], fps) : 0;
    const start = i === 0 ? 0 : t - prevT;
    clips.push({ ...c, index: i, start: snap(start, fps), dur, end: snap(start + dur, fps) });
    t = start + dur;
  });
  const videoEnd = clips.length ? clips[clips.length - 1].end : 0;
  let overlayEnd = 0;
  for (const tr of [...OVERLAY_TRACKS, 'audio']) {
    for (const it of tl.tracks[tr] || []) if (it.dur) overlayEnd = Math.max(overlayEnd, it.start + it.dur);
  }
  const duration = tl.duration ? snap(tl.duration, fps) : snap(Math.max(videoEnd, tl.tracks.video.length ? 0 : overlayEnd), fps);
  return { clips, duration, frames: toFrames(duration, fps) };
}

let catalog;
export const transitionCatalog = () => (catalog ??= readJSON(join(LIBRARY_DIR, 'transitions', 'transitions.json')));

export function transitionDur(clip, fps) {
  if (!clip?.transition || !clip.transition.type || clip.transition.type === 'cut') return 0;
  return snap(clip.transition.dur ?? transitionCatalog()[clip.transition.type]?.dur ?? 0.5, fps);
}

// ---------- validation ----------

export function validate(tl, { root } = {}) {
  const errors = [], warnings = [];
  const E = (m) => errors.push(m), W = (m) => warnings.push(m);
  if (tl.schema !== SCHEMA) E(`schema must be "${SCHEMA}"`);
  if (!(tl.fps > 0)) E('fps must be > 0');
  if (!(tl.width > 0 && tl.height > 0)) E('width/height required');
  if (tl.width % 2 || tl.height % 2) E('width/height must be even (yuv420p)');
  const fps = tl.fps;
  const onGrid = (t) => Math.abs(t * fps - Math.round(t * fps)) < 1e-6;
  const ids = new Set();
  for (const tr of TRACKS) {
    if (!Array.isArray(tl.tracks?.[tr])) { E(`tracks.${tr} must be an array`); continue; }
    for (const it of tl.tracks[tr]) {
      if (!it.id) E(`${tr}: item without id`);
      else if (ids.has(it.id)) E(`duplicate id ${it.id}`);
      ids.add(it.id);
    }
  }
  if (errors.length) return { ok: false, errors, warnings };

  tl.tracks.video.forEach((c, i) => {
    const m = tl.media[c.media];
    if (!m) return E(`${c.id}: unknown media "${c.media}"`);
    if (root && !exists(resolve(root, m.path))) E(`${c.id}: media file missing: ${m.path}`);
    if (!(c.out > c.in)) E(`${c.id}: out (${c.out}) must be > in (${c.in})`);
    if (c.in < 0) E(`${c.id}: in < 0`);
    if (m.kind === 'video' && m.duration && c.out > m.duration + 1e-3) E(`${c.id}: out ${c.out}s beyond media duration ${m.duration.toFixed(3)}s`);
    if (m.kind === 'video' && (!onGrid(c.in) || !onGrid(c.out))) W(`${c.id}: in/out not on the ${fps}fps grid (will snap)`);
    if (c.speed !== undefined && !(c.speed > 0)) E(`${c.id}: speed must be > 0`);
    if (c.ramp) {
      let last = -1;
      for (const k of c.ramp) {
        if (!(k.at >= 0 && k.at <= 1)) E(`${c.id}: ramp.at must be in [0,1]`);
        if (k.at < last) E(`${c.id}: ramp keys must be sorted`);
        if (!(k.speed > 0)) E(`${c.id}: ramp speed must be > 0`);
        last = k.at;
      }
      const minS = Math.min(...c.ramp.map((k) => k.speed));
      const srcFps = m.fps || fps;
      if (minS < 1 && srcFps * minS < fps * 0.99 && !c.interpolate) {
        W(`${c.id}: slowed to ${minS}x but source is ${srcFps}fps, so frames will repeat (shoot 60/120fps or accept stutter)`);
      }
    }
    if (c.speed && c.speed < 1 && (m.fps || fps) * c.speed < fps * 0.99 && !c.interpolate) {
      W(`${c.id}: ${c.speed}x slow motion from ${(m.fps || fps).toFixed(2)}fps source repeats frames`);
    }
    if (c.camera?.amount !== undefined && Math.abs(c.camera.amount) > 0.25) W(`${c.id}: camera amount ${c.camera.amount} is large; push-ins over 25% soften detail`);
    if (c.reframe?.zoom && c.reframe.zoom < 1) E(`${c.id}: reframe.zoom must be >= 1 (never letterbox-shrink silently)`);
  });

  const { clips } = layout(tl);
  clips.forEach((c, i) => {
    const td = transitionDur(c, fps);
    if (td && i === clips.length - 1) W(`${c.id}: transition on the last clip is ignored`);
    if (td && i < clips.length - 1) {
      const next = clips[i + 1];
      const prevTd = i > 0 ? transitionDur(clips[i - 1], fps) : 0;
      if (td + prevTd > c.dur + 1e-9) E(`${c.id}: transitions (${prevTd}s in + ${td}s out) longer than the clip (${c.dur}s)`);
      if (td > next.dur + 1e-9) E(`${c.id}: transition ${td}s longer than next clip ${next.id} (${next.dur}s)`);
    }
    if (c.dur < 0.5) W(`${c.id}: clip is only ${c.dur.toFixed(2)}s; under 0.5s reads as a flash unless intentional`);
  });

  for (const tr of OVERLAY_TRACKS) {
    for (const it of tl.tracks[tr]) {
      if (!it.component) E(`${it.id}: component required`);
      if (!(it.dur > 0)) E(`${it.id}: dur must be > 0`);
      if (!(it.start >= 0)) E(`${it.id}: start must be >= 0`);
      if (!onGrid(it.start) || !onGrid(it.dur)) W(`${it.id}: start/dur not on frame grid (will snap)`);
    }
  }
  for (const a of tl.tracks.audio) {
    if (!['music', 'vo', 'ambience', 'sfx', 'source'].includes(a.kind)) E(`${a.id}: audio kind must be music|vo|ambience|sfx|source`);
    if (a.kind === 'sfx' && !a.type && !a.path) E(`${a.id}: sfx needs type (synth) or path`);
    if (a.kind !== 'sfx' && !a.path) E(`${a.id}: ${a.kind} needs path`);
    if (root && a.path && !exists(resolve(root, a.path))) E(`${a.id}: audio file missing: ${a.path}`);
    if (!(a.start >= 0)) E(`${a.id}: start must be >= 0`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

// ---------- edit operations (pure: return a new timeline) ----------

const clone = (o) => structuredClone(o);

export function nextId(tl, track) {
  const p = ID_PREFIX[track];
  let max = 0;
  for (const tr of TRACKS) for (const it of tl.tracks[tr]) {
    const m = new RegExp(`^${p}(\\d+)$`).exec(it.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${p}${max + 1}`;
}

export function findItem(tl, id) {
  for (const tr of TRACKS) {
    const i = tl.tracks[tr].findIndex((x) => x.id === id);
    if (i >= 0) return { track: tr, index: i, item: tl.tracks[tr][i] };
  }
  throw new Error(`No item with id "${id}"`);
}

function snapClip(c, fps, media) {
  if (media?.kind === 'video') { c.in = snap(c.in, fps); c.out = snap(c.out, fps); }
  return c;
}

export function addClip(tl0, { media, in: tin = 0, out, at, ...rest }) {
  const tl = clone(tl0);
  const m = tl.media[media];
  if (!m) throw new Error(`Unknown media "${media}"`);
  if (out === undefined) out = m.kind === 'image' ? 3 : m.duration;
  const c = snapClip({ id: nextId(tl, 'video'), media, in: tin, out, ...rest }, tl.fps, m);
  const idx = at === undefined ? tl.tracks.video.length : Math.max(0, Math.min(at, tl.tracks.video.length));
  tl.tracks.video.splice(idx, 0, c);
  return { tl, id: c.id };
}

export function addItem(tl0, track, item) {
  if (!OVERLAY_TRACKS.includes(track) && track !== 'audio') throw new Error(`addItem: bad track ${track}`);
  const tl = clone(tl0);
  const it = { id: nextId(tl, track), ...item };
  it.start = snap(it.start || 0, tl.fps);
  if (it.dur !== undefined) it.dur = snap(it.dur, tl.fps);
  tl.tracks[track].push(it);
  tl.tracks[track].sort((a, b) => a.start - b.start);
  return { tl, id: it.id };
}

// Trim in/out of a V1 clip (absolute source times) or start/dur of other items.
export function trim(tl0, id, { in: tin, out, start, dur }) {
  const tl = clone(tl0);
  const { track, item } = findItem(tl, id);
  if (track === 'video') {
    if (tin !== undefined) item.in = tin;
    if (out !== undefined) item.out = out;
    snapClip(item, tl.fps, tl.media[item.media]);
  } else {
    if (start !== undefined) item.start = snap(start, tl.fps);
    if (dur !== undefined) item.dur = snap(dur, tl.fps);
  }
  return tl;
}

// Slip: move the source window without changing duration.
export function slip(tl0, id, delta) {
  const tl = clone(tl0);
  const { track, item } = findItem(tl, id);
  if (track !== 'video') throw new Error('slip applies to video clips');
  item.in += delta; item.out += delta;
  snapClip(item, tl.fps, tl.media[item.media]);
  return tl;
}

// Split a V1 clip at a timeline time. Speed ramps are split at the matching source point.
export function split(tl0, id, at) {
  const tl = clone(tl0);
  const { clips } = layout(tl);
  const c = clips.find((x) => x.id === id);
  if (!c) throw new Error(`split: ${id} is not a video clip`);
  if (at <= c.start || at >= c.end) throw new Error(`split: ${at}s is outside ${id} (${c.start}-${c.end})`);
  if (c.ramp) throw new Error('split: remove the speed ramp first (ramps are defined over the whole clip)');
  const speed = c.speed || 1;
  const srcAt = snap(c.in + (at - c.start) * speed, tl.fps);
  const idx = tl.tracks.video.findIndex((x) => x.id === id);
  const a = tl.tracks.video[idx];
  const b = { ...clone(a), id: nextId(tl, 'video'), in: srcAt };
  a.out = srcAt;
  delete a.transition; // the cut point is now a hard cut; transition stays on b (to the original next clip)
  tl.tracks.video.splice(idx + 1, 0, b);
  return { tl, id: b.id };
}

export function move(tl0, id, to) {
  const tl = clone(tl0);
  const { track, index, item } = findItem(tl, id);
  if (track === 'video') {
    tl.tracks.video.splice(index, 1);
    tl.tracks.video.splice(Math.max(0, Math.min(to, tl.tracks.video.length)), 0, item);
  } else {
    item.start = snap(to, tl.fps);
    tl.tracks[track].sort((a, b) => a.start - b.start);
  }
  return tl;
}

export function remove(tl0, id) {
  const tl = clone(tl0);
  const { track, index } = findItem(tl, id);
  tl.tracks[track].splice(index, 1);
  return tl;
}

// set(tl, 'v3', 'camera.move', 'push-in'); value null deletes the key.
export function setProp(tl0, id, path, value) {
  const tl = clone(tl0);
  const target = id === 'timeline' ? tl : findItem(tl, id).item;
  const keys = path.split('.');
  let o = target;
  for (const k of keys.slice(0, -1)) o = o[k] ??= {};
  const last = keys[keys.length - 1];
  if (value === null) delete o[last]; else o[last] = value;
  return tl;
}

// Move every V1 cut to the nearest beat (within tolerance) by trimming clip outs.
export function snapCutsToBeats(tl0, beats, { tolerance = 0.25, mode = 'beats' } = {}) {
  let tl = clone(tl0);
  const changes = [];
  for (let i = 0; i < tl.tracks.video.length - 1; i++) {
    const { clips } = layout(tl);
    const c = clips[i];
    const cut = c.end - transitionDur(c, tl.fps) / 2;
    let best = null;
    for (const b of beats) if (best === null || Math.abs(b - cut) < Math.abs(best - cut)) best = b;
    if (best === null || Math.abs(best - cut) > tolerance || Math.abs(best - cut) < 0.5 / tl.fps) continue;
    const delta = best - cut;
    const speed = c.speed || 1;
    const media = tl.media[c.media];
    const newOut = snap(c.out + delta * speed, tl.fps);
    if (media.kind === 'video' && (newOut > media.duration || newOut <= c.in + 0.2)) continue;
    tl.tracks.video[i].out = newOut;
    changes.push({ id: c.id, from: +cut.toFixed(3), to: +best.toFixed(3) });
  }
  return { tl, changes };
}

// ---------- persistence & versions ----------

export const timelinePath = (dir) => join(dir, 'timeline.json');

export function load(dir) {
  const p = timelinePath(dir);
  if (!exists(p)) throw new Error(`No timeline.json in ${dir}`);
  return readJSON(p);
}

export function history(dir) {
  const p = join(dir, 'versions', 'log.json');
  return exists(p) ? readJSON(p) : [];
}

// Save and snapshot if content changed. Returns version number (or the existing one).
export function save(dir, tl, message = 'edit') {
  const vdir = ensureDir(join(dir, 'versions'));
  const log = history(dir);
  const { meta, ...content } = tl;
  const hash = sha(content);
  writeJSON(timelinePath(dir), tl);
  const last = log[log.length - 1];
  if (last && last.hash === hash) return last.v;
  const v = (last?.v || 0) + 1;
  writeJSON(join(vdir, `${String(v).padStart(4, '0')}.json`), tl);
  log.push({ v, time: new Date().toISOString(), message, hash });
  writeJSON(join(vdir, 'log.json'), log);
  return v;
}

export function revert(dir, v) {
  const p = join(dir, 'versions', `${String(v).padStart(4, '0')}.json`);
  if (!exists(p)) throw new Error(`No version ${v}`);
  const tl = readJSON(p);
  return save(dir, tl, `revert to v${v}`);
}

export function listVersions(dir) {
  const vdir = join(dir, 'versions');
  return exists(vdir) ? readdirSync(vdir).filter((f) => /^\d{4}\.json$/.test(f)) : [];
}

// Human-readable summary of differences between two timelines (by id).
export function diff(a, b) {
  const lines = [];
  for (const tr of TRACKS) {
    const A = new Map(a.tracks[tr].map((x) => [x.id, x]));
    const B = new Map(b.tracks[tr].map((x) => [x.id, x]));
    for (const [id, x] of B) {
      if (!A.has(id)) lines.push(`+ ${tr} ${id}`);
      else if (JSON.stringify(A.get(id)) !== JSON.stringify(x)) {
        const keys = new Set([...Object.keys(A.get(id)), ...Object.keys(x)]);
        const ch = [...keys].filter((k) => JSON.stringify(A.get(id)[k]) !== JSON.stringify(x[k]));
        lines.push(`~ ${tr} ${id}: ${ch.join(', ')}`);
      }
    }
    for (const id of A.keys()) if (!B.has(id)) lines.push(`- ${tr} ${id}`);
    if (tr === 'video') {
      const oa = a.tracks.video.map((x) => x.id).join(','), ob = b.tracks.video.map((x) => x.id).join(',');
      if (oa !== ob) lines.push(`order: ${oa} -> ${ob}`);
    }
  }
  for (const k of ['fps', 'width', 'height', 'format', 'grade', 'duration']) {
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) lines.push(`~ timeline.${k}`);
  }
  return lines;
}
