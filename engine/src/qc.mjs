// Quality Supervisor checks on a rendered file: technical spec, loudness, black/frozen frames,
// text safe zones, contact sheet. Writes <name>.qc.json and <name>.contact.png.
import { join, relative } from 'node:path';
import { ffmpeg, log, probe, run, FFMPEG, writeJSON } from './util.mjs';

// Where platform UI covers the frame (normalized). Text must stay inside the safe box.
export const SAFE_ZONES = {
  'reel-9x16': { top: 0.13, bottom: 0.78, left: 0.06, right: 0.89, note: 'IG/TikTok UI: top bar, bottom caption, right-side buttons' },
  'feed-4x5': { top: 0.06, bottom: 0.92, left: 0.06, right: 0.94 },
  'square-1x1': { top: 0.06, bottom: 0.92, left: 0.06, right: 0.94 },
  'wide-16x9': { top: 0.05, bottom: 0.95, left: 0.05, right: 0.95, note: 'title safe 90%' },
  'wide-4k': { top: 0.05, bottom: 0.95, left: 0.05, right: 0.95 },
  'cinema-239': { top: 0.05, bottom: 0.95, left: 0.05, right: 0.95 },
};

function parseEbur(stderr) {
  const I = /I:\s+(-?[\d.]+) LUFS/.exec(stderr.slice(stderr.lastIndexOf('Summary:')));
  const TP = /Peak:\s+(-?[\d.]+) dBFS/.exec(stderr.slice(stderr.lastIndexOf('Summary:')));
  return { lufs: I ? Number(I[1]) : null, truePeak: TP ? Number(TP[1]) : null };
}

const TEXT_POS_KEYS = ['at', 'anchor'];

export function safeZoneIssues(tl) {
  const z = SAFE_ZONES[tl.format];
  if (!z) return [];
  const issues = [];
  for (const it of tl.tracks.text || []) {
    for (const k of TEXT_POS_KEYS) {
      const p = it.props?.[k];
      if (!Array.isArray(p)) continue;
      const [x, y] = p;
      if (y < z.top || y > z.bottom) issues.push(`${it.id} (${it.component}) y=${y} outside safe band ${z.top}-${z.bottom} for ${tl.format}`);
      if (x < z.left - 0.02 || x > z.right + 0.02) issues.push(`${it.id} (${it.component}) x=${x} outside safe band ${z.left}-${z.right}`);
    }
  }
  return issues;
}

export async function contactSheet(file, outPng, { cols = 6, rows = 5, width = 240, duration } = {}) {
  const n = cols * rows;
  const d = duration || (await probe(file)).duration;
  const step = Math.max(d / n, 1 / 30);
  await ffmpeg(['-i', file, '-vf', `fps=1/${step.toFixed(4)},scale=${width}:-2,drawtext=text='%{pts\\:hms}':x=6:y=6:fontsize=14:fontcolor=white:box=1:boxcolor=black@0.5,tile=${cols}x${rows}:padding=4:margin=4:color=0x111111`, '-frames:v', '1', outPng]);
  return outPng;
}

export async function qc(file, { tl, expect = {}, outDir, name, extraWarnings = [] } = {}) {
  const checks = [];
  const add = (id, pass, detail, severity = 'error') => checks.push({ id, pass, severity: pass ? 'ok' : severity, detail });
  const p = await probe(file);
  const fps = expect.fps || tl?.fps;
  const frameT = 1 / (fps || 30);
  if (expect.width) add('resolution', p.width === expect.width && p.height === expect.height, `${p.width}x${p.height} (expected ${expect.width}x${expect.height})`);
  if (fps) add('frame-rate', Math.abs(p.fps - fps) < 0.01, `${p.fps?.toFixed(3)} fps (expected ${fps})`);
  if (expect.duration) add('duration', Math.abs(p.duration - expect.duration) <= frameT * 1.5 + 0.03, `${p.duration.toFixed(3)}s (expected ${expect.duration.toFixed(3)}s)`);
  add('codec', p.vcodec === 'h264' && p.pixfmt === 'yuv420p', `${p.vcodec} ${p.pixfmt}`);
  if (expect.hasAudio) {
    add('audio-stream', p.hasAudio && p.acodec === 'aac' && p.sampleRate === 48000, `${p.acodec || 'none'} ${p.sampleRate || ''}Hz ${p.channels || ''}ch`);
    const r = await run(FFMPEG, ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { allowFail: true });
    const { lufs, truePeak } = parseEbur(r.stderr);
    const target = expect.loudness ?? -14;
    add('loudness', lufs !== null && Math.abs(lufs - target) <= 1.0, `${lufs} LUFS integrated (target ${target} ±1)`, 'warning');
    add('true-peak', truePeak !== null && truePeak <= -1.0, `${truePeak} dBFS true peak (max -1.0)`);
  } else {
    add('audio-stream', true, 'silent film (no audio track in timeline)', 'warning');
  }
  // black and frozen stretches
  const bd = await run(FFMPEG, ['-hide_banner', '-nostats', '-i', file, '-vf', 'blackdetect=d=0.4:pix_th=0.08', '-an', '-f', 'null', '-'], { allowFail: true });
  const blacks = [...bd.stderr.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  const intendedBlack = (tl?.tracks?.video || []).some((c) => c.transition?.type === 'dip-black');
  add('black-frames', blacks.length === 0 || intendedBlack, blacks.length ? `black at ${blacks.map(([a, b]) => `${a.toFixed(2)}-${b.toFixed(2)}s`).join(', ')}` : 'none', 'warning');
  const fd = await run(FFMPEG, ['-hide_banner', '-nostats', '-i', file, '-vf', 'freezedetect=n=0.0008:d=2.5', '-an', '-f', 'null', '-'], { allowFail: true });
  const freezes = [...fd.stderr.matchAll(/freeze_start: ([\d.]+)[\s\S]*?freeze_end: ([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  add('frozen-frames', freezes.length === 0, freezes.length ? `static for 2.5s+ at ${freezes.map(([a, b]) => `${a.toFixed(1)}-${b.toFixed(1)}s`).join(', ')} (fine for held cards, a problem in footage)` : 'none', 'warning');
  if (tl) {
    const sz = safeZoneIssues(tl);
    add('text-safe-zones', sz.length === 0, sz.length ? sz.join('; ') : `all text inside ${tl.format} safe zone`, 'warning');
  }
  extraWarnings.forEach((w) => add('render-warning', false, w, 'warning'));
  const contact = outDir ? await contactSheet(file, join(outDir, `${name}.contact.png`), { duration: p.duration }) : null;
  const pass = checks.every((c) => c.pass || c.severity !== 'error');
  const rel = (x) => (x && outDir ? relative(join(outDir, '..'), x) : x);
  const report = { file: rel(file), pass, probe: { ...p, path: rel(p.path) }, checks, contact: rel(contact) };
  const reportPath = outDir ? join(outDir, `${name}.qc.json`) : null;
  if (reportPath) writeJSON(reportPath, report);
  log(`  QC ${pass ? 'PASS' : 'FAIL'}: ` + checks.map((c) => `${c.pass ? '✓' : c.severity === 'error' ? '✗' : '!'} ${c.id}`).join('  '));
  for (const c of checks) if (!c.pass) log(`     ${c.severity === 'error' ? '✗' : '!'} ${c.id}: ${c.detail}`);
  return { ...report, contact, reportPath };
}
