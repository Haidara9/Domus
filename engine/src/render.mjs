// Render orchestration: validate -> segments -> join -> overlays -> audio -> composite -> QC.
// Every stage is cached by content hash, so a revision re-renders only what changed.
import { copyFileSync, renameSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ensureDir, exists, ffmpeg, log, sha, snap, toFrames, writeJSON } from './util.mjs';
import { FORMATS, layout, save, validate } from './timeline.mjs';
import { joinSegments, renderSegment } from './video.mjs';
import { OverlayRenderer } from './overlays.mjs';
import { mixAudio } from './audio.mjs';
import { qc } from './qc.mjs';

const LAYER_ORDER = { animation: 0, vfx: 1, text: 2 };

// VFX that FFmpeg does better than a canvas overlay (incompressible per-frame noise etc.).
// Applied in the composite chain at the item's layer position, limited to its time window.
export const FFMPEG_VFX = {
  filmGrain: (p = {}) => `noise=alls=${Math.round((p.strength ?? 0.05) * 160)}:allf=t`,
  sharpen: (p = {}) => `cas=strength=${p.strength ?? 0.4}`,
};

export function overlayItems(tl) {
  const all = [];
  for (const tr of ['animation', 'vfx', 'text']) for (const it of tl.tracks[tr]) all.push({ ...it, track: tr });
  return all
    .filter((it) => !it.hidden)
    .sort((a, b) => (a.layer ?? LAYER_ORDER[a.track] * 100) - (b.layer ?? LAYER_ORDER[b.track] * 100) || a.start - b.start);
}

const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const deepMerge = (a, b) => {
  const o = { ...a };
  for (const [k, v] of Object.entries(b || {})) o[k] = isObj(v) && isObj(a?.[k]) ? deepMerge(a[k], v) : v;
  return o;
};

// Switch canvas to another format and apply per-format overrides: any clip or item may carry
// byFormat: { "feed-4x5": { props: { at: [0.5, 0.3] } }, "wide-16x9": { reframe: { focus: [0.4, 0.5] } } }
export function withFormat(tl, format) {
  let out = tl;
  if (format && format !== tl.format) {
    const f = FORMATS[format];
    if (!f) throw new Error(`Unknown format ${format}`);
    out = { ...tl, format, width: f.width, height: f.height };
  }
  const fmt = out.format;
  const apply = (x) => (x.byFormat?.[fmt] ? deepMerge(x, x.byFormat[fmt]) : x);
  return { ...out, tracks: Object.fromEntries(Object.entries(out.tracks).map(([k, arr]) => [k, arr.map(apply)])) };
}

const ENC = {
  draft: ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-c:a', 'aac', '-b:a', '160k'],
  final: ['-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high', '-c:a', 'aac', '-b:a', '320k'],
};

export async function render(dir, opts = {}) {
  const { format, quality = 'final', from, to, noQc = false, label } = opts;
  const { load } = await import('./timeline.mjs');
  let tl = withFormat(load(dir), format);
  const W = tl.width, H = tl.height, fps = tl.fps;
  const v = validate(tl, { root: dir });
  v.warnings.forEach((w) => log(`  ! ${w}`));
  if (!v.ok) throw new Error(`Timeline invalid:\n - ${v.errors.join('\n - ')}`);
  const version = save(dir, load(dir), 'render');
  const cacheDir = ensureDir(join(dir, 'cache'));
  const { clips, duration } = layout(tl);
  if (!(duration > 0)) throw new Error('Timeline has zero duration');
  const totalFrames = toFrames(duration, fps);
  const t0 = Date.now();
  const stats = { segments: { rendered: 0, cached: 0 }, overlays: { rendered: 0, cached: 0 } };
  log(`DOMUS render "${tl.title}" v${version} ${W}x${H} @${fps} ${duration.toFixed(2)}s [${quality}]`);

  // 1) V1 segments + join
  let base;
  const { brand } = (await import('./overlays.mjs')).loadBrand(tl, dir);
  if (clips.length) {
    // segments are independent: render a few in parallel (each ffmpeg is itself multi-threaded)
    const segs = new Array(clips.length);
    let next = 0;
    const workers = Array.from({ length: Math.min(opts.jobs || 3, clips.length) }, async () => {
      while (next < clips.length) {
        const i = next++;
        segs[i] = await renderSegment({ tl, clip: clips[i], root: dir, cacheDir, W, H, quality });
        stats.segments[segs[i].cached ? 'cached' : 'rendered']++;
      }
    });
    await Promise.all(workers);
    base = await joinSegments({ tl, segs, clips, cacheDir, W, H, brand, quality, totalFrames });
  } else {
    const col = (tl.background || brand?.colors?.paper || '#000000').replace('#', '0x');
    base = { path: join(cacheDir, `base_color_${sha({ col, W, H, fps, totalFrames })}.mp4`) };
    if (!exists(base.path)) await ffmpeg(['-f', 'lavfi', '-i', `color=c=${col}:s=${W}x${H}:r=${fps}`, '-frames:v', String(totalFrames), '-c:v', 'libx264', '-crf', '14', '-pix_fmt', 'yuv420p', base.path]);
  }

  // 2) overlays
  const items = overlayItems(tl);
  const ovr = new OverlayRenderer({ tl, root: dir, cacheDir, W, H, fps });
  const ovl = [];
  try {
    for (const it of items) {
      if (FFMPEG_VFX[it.component]) { ovl.push({ filter: FFMPEG_VFX[it.component](it.props), start: snap(it.start, fps), end: snap(it.start + it.dur, fps), id: it.id }); continue; }
      const r = await ovr.render(it);
      stats.overlays[r.cached ? 'cached' : 'rendered']++;
      ovl.push({ ...r, start: snap(it.start, fps), id: it.id });
    }
  } finally { await ovr.close(); }
  ovr.warnings.forEach((w) => log(`  ! ${w}`));

  // 3) audio
  const mix = await mixAudio({ tl, root: dir, cacheDir, duration, loudness: opts.loudness ?? tl.audioTarget?.lufs ?? -14, truePeak: tl.audioTarget?.truePeak ?? -1.5 });

  // 4) composite + encode
  const outDir = ensureDir(join(dir, 'renders'));
  const name = `${(tl.title || 'film').replace(/[^\p{L}\p{N}_-]+/gu, '_')}_${tl.format}_v${String(version).padStart(3, '0')}${quality === 'draft' ? '_draft' : ''}${label ? '_' + label : ''}`;
  const out = join(outDir, `${name}.mp4`);
  const files = ovl.filter((o) => o.path);
  const inputs = ['-i', base.path, ...files.flatMap((o) => ['-i', o.path])];
  if (mix) inputs.push('-i', mix.path);
  const g = [];
  let acc = '[0:v]', k = 0;
  ovl.forEach((o, j) => {
    if (o.filter) {
      g.push(`${acc}${o.filter}:enable='between(t,${o.start},${o.end})'[f${j}]`);
      acc = `[f${j}]`; return;
    }
    k++;
    g.push(`[${k}:v]setpts=PTS-STARTPTS+${o.start}/TB[o${j}]`);
    g.push(`${acc}[o${j}]overlay=eof_action=pass:format=auto[c${j}]`);
    acc = `[c${j}]`;
  });
  g.push(`${acc}format=yuv420p,setsar=1[vout]`);
  const map = ['-map', '[vout]'];
  if (mix) map.push('-map', `${files.length + 1}:a`);
  const range = [];
  if (from !== undefined || to !== undefined) range.push('-ss', String(from || 0), ...(to !== undefined ? ['-to', String(to)] : []));
  const tmp = out + '.part.mp4';
  await ffmpeg([...inputs, '-filter_complex', g.join(';'), ...map, ...range, ...(range.length ? [] : ['-frames:v', String(totalFrames)]), ...ENC[quality],
    '-r', String(fps), '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', '-ar', '48000', tmp]);
  renameSync(tmp, out);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  log(`  -> ${out} (${secs}s; segments ${stats.segments.rendered} new/${stats.segments.cached} cached, overlays ${stats.overlays.rendered} new/${stats.overlays.cached} cached)`);

  const manifest = { file: relative(dir, out), version, format: tl.format, W, H, fps, duration, quality, renderedAt: new Date().toISOString(), seconds: Number(secs), stats, warnings: [...v.warnings, ...ovr.warnings] };
  let report = null;
  if (!noQc && !range.length) {
    report = await qc(out, { tl, expect: { width: W, height: H, fps, duration, loudness: opts.loudness ?? tl.audioTarget?.lufs ?? -14, hasAudio: !!mix }, outDir, name, extraWarnings: manifest.warnings });
    manifest.qc = { pass: report.pass, report: report.reportPath, contact: report.contact };
  }
  writeJSON(join(outDir, `${name}.json`), manifest);
  // keep a stable "latest" copy for previews
  copyFileSync(out, join(outDir, `latest_${tl.format}${quality === 'draft' ? '_draft' : ''}.mp4`));
  return { out, manifest, report };
}

// Fast preview still at timeline time t: base frame + overlays, no full render needed.
export async function still(dir, t, { format, out } = {}) {
  const { load } = await import('./timeline.mjs');
  const tl = withFormat(load(dir), format);
  const W = tl.width, H = tl.height, fps = tl.fps;
  const cacheDir = ensureDir(join(dir, 'cache'));
  const { clips } = layout(tl);
  const outPng = out || join(ensureDir(join(dir, 'renders')), `still_${tl.format}_${t.toFixed(2)}s.png`);
  const basePng = join(cacheDir, `still_base.png`);
  const c = clips.find((x) => t >= x.start && t < x.end) || clips[clips.length - 1];
  if (c) {
    const s = await renderSegment({ tl, clip: c, root: dir, cacheDir, W, H, quality: 'draft' });
    await ffmpeg(['-ss', String(Math.max(0, t - c.start)), '-i', s.path, '-frames:v', '1', basePng]);
  } else {
    const { brand } = (await import('./overlays.mjs')).loadBrand(tl, dir);
    await ffmpeg(['-f', 'lavfi', '-i', `color=c=${(brand?.colors?.paper || '#000000').replace('#', '0x')}:s=${W}x${H}`, '-frames:v', '1', basePng]);
  }
  const ovr = new OverlayRenderer({ tl, root: dir, cacheDir, W, H, fps });
  const ovPng = join(cacheDir, 'still_overlay.png');
  try { await ovr.still(overlayItems(tl).filter((it) => t >= it.start && t < it.start + it.dur), t, ovPng); } finally { await ovr.close(); }
  await ffmpeg(['-i', basePng, '-i', ovPng, '-filter_complex', '[0:v][1:v]overlay=format=auto', '-frames:v', '1', outPng]);
  ovr.warnings.forEach((w) => log(`  ! ${w}`));
  return outPng;
}

