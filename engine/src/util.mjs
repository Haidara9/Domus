// Shared helpers: process execution, probing, hashing, frame math, paths.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ENGINE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const REPO_DIR = resolve(ENGINE_DIR, '..');
export const LIBRARY_DIR = resolve(REPO_DIR, 'library');
export const BRAND_DIR = resolve(REPO_DIR, 'brand');

export const FFMPEG = process.env.DOMUS_FFMPEG || 'ffmpeg';
export const FFPROBE = process.env.DOMUS_FFPROBE || 'ffprobe';

let verbose = !!process.env.DOMUS_VERBOSE;
export const setVerbose = (v) => { verbose = v; };
export const log = (...a) => console.log(...a);
export const debug = (...a) => { if (verbose) console.error('[debug]', ...a); };

// Run a command; resolves {code, stdout, stderr}. Rejects on non-zero unless allowFail.
export function run(cmd, args, { input, allowFail = false, stdio } = {}) {
  debug(cmd, args.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' '));
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: stdio || ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout?.on('data', (d) => (out += d));
    p.stderr?.on('data', (d) => (err += d));
    p.on('error', rej);
    p.on('close', (code) => {
      if (code !== 0 && !allowFail) {
        const e = new Error(`${cmd} exited ${code}\n${err.slice(-3000)}`);
        e.code = code; e.stderr = err; return rej(e);
      }
      res({ code, stdout: out, stderr: err });
    });
    if (input !== undefined) p.stdin.end(input); else p.stdin?.end();
  });
}

export const ffmpeg = (args, opts) => run(FFMPEG, ['-hide_banner', '-y', '-loglevel', 'error', ...args], opts);

export async function probe(path) {
  const { stdout } = await run(FFPROBE, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', path]);
  const j = JSON.parse(stdout);
  const v = j.streams.find((s) => s.codec_type === 'video');
  const a = j.streams.find((s) => s.codec_type === 'audio');
  const rate = (r) => { if (!r) return null; const [n, d] = r.split('/').map(Number); return d ? n / d : n; };
  const isImage = v && (/^(png|mjpeg|jpeg|webp|bmp|tiff)$/.test(v.codec_name) && (!j.format.duration || Number(j.format.duration) < 0.05 || j.format.format_name.includes('image2') || j.format.format_name.includes('_pipe')));
  let rot = 0;
  const sd = v?.side_data_list?.find((s) => s.rotation !== undefined);
  if (sd) rot = Number(sd.rotation);
  else if (v?.tags?.rotate) rot = -Number(v.tags.rotate);
  const swap = Math.abs(rot) % 180 === 90;
  return {
    path,
    kind: isImage ? 'image' : v ? 'video' : a ? 'audio' : 'unknown',
    duration: isImage ? null : Number(j.format.duration || v?.duration || a?.duration || 0),
    width: v ? (swap ? v.height : v.width) : null,
    height: v ? (swap ? v.width : v.height) : null,
    fps: v && !isImage ? rate(v.avg_frame_rate) || rate(v.r_frame_rate) : null,
    vcodec: v?.codec_name || null,
    pixfmt: v?.pix_fmt || null,
    hasAudio: !!a,
    acodec: a?.codec_name || null,
    sampleRate: a ? Number(a.sample_rate) : null,
    channels: a?.channels || null,
    colorTransfer: v?.color_transfer || null,
    rotation: rot,
  };
}

export const sha = (s) => createHash('sha256').update(typeof s === 'string' ? s : JSON.stringify(s)).digest('hex').slice(0, 16);

export function fileSig(path) {
  try { const s = statSync(path); return `${path}:${s.size}:${s.mtimeMs}`; } catch { return `${path}:missing`; }
}

export const ensureDir = (d) => { mkdirSync(d, { recursive: true }); return d; };
export const readJSON = (p) => JSON.parse(readFileSync(p, 'utf8'));
export const writeJSON = (p, o) => { ensureDir(dirname(p)); writeFileSync(p, JSON.stringify(o, null, 2) + '\n'); };
export const exists = existsSync;

// Frame math. All timeline times live on the 1/fps grid.
export const toFrames = (t, fps) => Math.round(t * fps + 1e-9);
export const snap = (t, fps) => toFrames(t, fps) / fps;
export const fmtTime = (t) => {
  const s = Math.max(0, t); const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${(s - m * 60).toFixed(3).padStart(6, '0')}`;
};

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const dbToGain = (db) => Math.pow(10, db / 20);
