// Export a DOMUS timeline as a HyperFrames composition (Apache-2.0 framework by HeyGen), so the
// edit can be opened, tweaked and rendered in HyperFrames Studio.
//
// Mapping (verified against the hyperframes-core contract):
//   V1 clip      -> <video class="clip" data-start data-duration data-media-start data-playback-rate>
//                   inside an UNTIMED wrapper that carries the camera move (GSAP) and the grade (CSS filter)
//   speed ramps, stabilization, shot-match -> exported as the engine's baked segment (exact look)
//   transitions  -> dissolve/dip/whip/push approximated with wrapper tweens; others fall back to dissolve
//   overlays     -> one <canvas> per item, painted by the DOMUS motion runtime from the GSAP timeline
//   audio        -> <audio id> with data-volume; synthesized SFX exported as WAV files
// The DOMUS renderer stays the reference for final delivery; the export is for hands-on editing.
import { copyFileSync, linkSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { ENGINE_DIR, LIBRARY_DIR, REPO_DIR, dbToGain, ensureDir, exists, log, sha } from './util.mjs';
import { layout, load, transitionCatalog, transitionDur } from './timeline.mjs';
import { loadBrand } from './overlays.mjs';
import { renderSegment, cameraExprs } from './video.mjs';
import { synthToWav, sfxOffset } from './audio.mjs';

const CSS_GRADE = {
  'architectural-neutral': 'contrast(1.03) saturate(1.03)',
  'domus-warm-paper': 'sepia(0.12) saturate(0.94) contrast(0.97) brightness(1.02)',
  'golden-hour': 'sepia(0.18) saturate(1.08) contrast(1.03)',
  'twilight-blue-hour': 'hue-rotate(-6deg) saturate(1.04) contrast(1.05)',
  'apple-minimal': 'brightness(1.08) saturate(0.9) contrast(0.98)',
  'editorial-soft': 'saturate(0.82) contrast(0.92) brightness(1.03) sepia(0.06)',
  'commercial-crisp': 'contrast(1.08) saturate(1.15)',
  'documentary-natural': 'sepia(0.05) saturate(0.98)',
  'mono-architectural': 'grayscale(1) contrast(1.08)',
};

function place(src, assetsDir) {
  const dst = join(assetsDir, `${sha(src).slice(0, 6)}_${basename(src)}`);
  if (!exists(dst)) { try { linkSync(src, dst); } catch { copyFileSync(src, dst); } }
  return relative(join(assetsDir, '..'), dst);
}

// Turn our ffmpeg camera expression into sampled GSAP keyframes (scale + transform origin).
function cameraKeys(clip, dur, W, H, media) {
  const { Z, FX, FY } = cameraExprs(clip, dur);
  // Evaluate the ffmpeg-style expression at time t with a tiny JS shim.
  const ev = (expr, t) => Function('t', 'PI', 'cos', 'pow', 'clip', 'lt', 'if_', `return ${expr.replace(/\bif\(/g, 'if_(')};`)(
    t, Math.PI, Math.cos, Math.pow, (x, a, b) => Math.min(b, Math.max(a, x)), (a, b) => (a < b ? 1 : 0), (c, a, b) => (c ? a : b));
  const N = Math.max(2, Math.ceil(dur * 4));
  const cover = Math.max(W / media.width, H / media.height);
  const keys = [];
  for (let i = 0; i <= N; i++) {
    const t = (dur * i) / N;
    keys.push({ t, z: ev(Z, t), fx: ev(FX, t), fy: ev(FY, t) });
  }
  return { keys, cover };
}

export async function exportHyperFrames(dir, { baked = false, format } = {}) {
  const { withFormat } = await import('./render.mjs');
  const tl = withFormat(load(dir), format);
  const W = tl.width, H = tl.height, fps = tl.fps;
  const out = ensureDir(join(dir, 'hyperframes'));
  const assets = ensureDir(join(out, 'assets'));
  const { clips, duration } = layout(tl);
  const { brand } = loadBrand(tl, dir);
  const T = transitionCatalog();
  const html = [], js = [], notes = [];
  const cacheDir = ensureDir(join(dir, 'cache'));

  // ---- video ----
  for (const c of clips) {
    const m = tl.media[c.media];
    const needsBake = baked || c.ramp || c.stabilize || c.interpolate || c.grade?.match || m.kind === 'image' || c.camera?.keys;
    const prevTr = c.index > 0 ? clips[c.index - 1].transition : null;
    const inDur = c.index > 0 ? transitionDur(clips[c.index - 1], fps) : 0;
    const wrap = `w-${c.id}`;
    let src, mediaStart = 0, rate = 1;
    let gradeCss = '';
    if (needsBake) {
      const seg = await renderSegment({ tl, clip: c, root: dir, cacheDir, W, H });
      src = place(seg.path, assets);
      notes.push(`${c.id}: exported as baked segment (camera/grade/speed are inside the pixels)`);
    } else {
      src = place(resolve(dir, m.path), assets);
      mediaStart = c.in; rate = c.speed || 1;
      const g = typeof c.grade === 'string' ? c.grade : c.grade?.preset || tl.grade?.global;
      gradeCss = g && CSS_GRADE[g] ? `filter:${CSS_GRADE[g]};` : '';
      const { keys, cover } = cameraKeys(c, c.dur, W, H, m);
      void cover;
      const pct = (k) => `${(k.fx * 100).toFixed(2)}% ${(k.fy * 100).toFixed(2)}%`;
      const frames = keys.slice(1).map((b, i) => `{ scale: ${b.z.toFixed(4)}, transformOrigin: '${pct(b)}', duration: ${(b.t - keys[i].t).toFixed(4)} }`);
      js.push(`// ${c.id} camera (${c.camera?.move || 'static'})`);
      js.push(`tl.fromTo('#${wrap} video', { scale: ${keys[0].z.toFixed(4)}, transformOrigin: '${pct(keys[0])}' }, { keyframes: [${frames.join(', ')}], ease: 'none' }, ${c.start});`);
    }
    const focus = c.reframe?.focus || c.camera?.focus || [0.5, 0.5];
    html.push(`    <div class="cam" id="${wrap}" style="z-index:${c.index + 1};${gradeCss}">
      <video id="${c.id}" class="clip" src="${src}" muted playsinline data-start="${c.start}" data-duration="${c.dur}"${mediaStart ? ` data-media-start="${mediaStart}"` : ''}${rate !== 1 ? ` data-playback-rate="${rate}"` : ''} data-track-index="0" style="object-position:${focus[0] * 100}% ${focus[1] * 100}%"></video>
    </div>`);
    if (inDur > 0) {
      const def = T[prevTr.type] || {};
      const st = c.start, d = inDur;
      if (def.engine === 'whip' || /^push-/.test(prevTr.type)) {
        const dirSign = /left|up/.test(prevTr.type) ? 1 : -1;
        const axis = /up|down/.test(prevTr.type) ? 'yPercent' : 'xPercent';
        js.push(`tl.fromTo('#${wrap}', { ${axis}: ${100 * dirSign} }, { ${axis}: 0, duration: ${d}, ease: 'power2.inOut' }, ${st});`);
        js.push(`tl.fromTo('#w-${clips[c.index - 1].id}', { ${axis}: 0 }, { ${axis}: ${-100 * dirSign}, duration: ${d}, ease: 'power2.inOut', immediateRender: false }, ${st});`);
        if (def.engine === 'whip') js.push(`tl.fromTo(['#${wrap}', '#w-${clips[c.index - 1].id}'], { filter: 'blur(0px)' }, { keyframes: [{ filter: 'blur(14px)', duration: ${d / 2} }, { filter: 'blur(0px)', duration: ${d / 2} }], ease: 'none' }, ${st});`);
      } else {
        if (!['xfade', 'dip'].includes(def.engine) || !['fade', 'fadeblack', 'fadewhite', undefined].includes(def.xfade)) notes.push(`${c.id}: "${prevTr.type}" approximated as a dissolve`);
        js.push(`tl.fromTo('#${wrap}', { opacity: 0 }, { opacity: 1, duration: ${d}, ease: 'none' }, ${st});`);
      }
    }
  }

  // ---- overlays (canvas, painted by the DOMUS runtime) ----
  const order = { animation: 100, vfx: 200, text: 300 };
  const overlays = [];
  for (const tr of ['animation', 'vfx', 'text']) for (const it of tl.tracks[tr]) overlays.push({ ...it, track: tr });
  const images = {};
  for (const [k, v] of Object.entries(brand.logos || {})) if (exists(resolve(REPO_DIR, v))) images[k] = place(resolve(REPO_DIR, v), assets);
  const compDir = ensureDir(join(out, 'compositions'));
  for (const it of overlays) {
    for (const [k, v] of Object.entries(it.props?.images || {})) images[`${it.id}:${k}`] = place(resolve(dir, v), assets);
    const item = { id: it.id, component: it.component, dur: it.dur, props: it.props || {} };
    html.push(`    <div id="${it.id}" data-composition-id="${it.id}" data-composition-src="compositions/${it.id}.html" data-start="${it.start}" data-duration="${it.dur}" data-track-index="${it.track === 'text' ? 3 : it.track === 'vfx' ? 2 : 1}" data-width="${W}" data-height="${H}" style="z-index:${it.layer ?? order[it.track]}"></div>`);
    writeFileSync(join(compDir, `${it.id}.html`), `<!doctype html>
<html>
  <head><meta charset="UTF-8" /><title>${it.id} ${it.component}</title></head>
  <body>
    <template>
      <style>
        #${it.id}-root { position: absolute; inset: 0; }
        #${it.id}-c { width: 100%; height: 100%; display: block; }
      </style>
      <div id="${it.id}-root" data-composition-id="${it.id}" data-width="${W}" data-height="${H}" data-duration="${it.dur}">
        <canvas id="${it.id}-c" width="${W}" height="${H}"></canvas>
      </div>
      <script>
        (function () {
          // DOMUS motion component "${it.component}": a pure function of time painted from GSAP.
          const item = ${JSON.stringify(item)};
          const c = document.getElementById('${it.id}-c'), g = c.getContext('2d');
          const imgs = window.DOMUS_IMAGES_FOR('${it.id}');
          const proxy = { t: 0 };
          const paint = () => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); window.DOMUS.paint(g, item, Math.max(0, Math.min(item.dur - 1e-4, proxy.t)), { W: c.width, H: c.height, images: imgs, seed: 1 }); };
          const tl = gsap.timeline({ paused: true, onUpdate: paint });
          tl.to(proxy, { t: item.dur, duration: item.dur, ease: 'none' }, 0);
          paint();
          window.__timelines['${it.id}'] = tl;
        })();
      </script>
    </template>
  </body>
</html>
`);
  }

  // ---- audio ----
  let audioIdx = 0;
  for (const a of tl.tracks.audio) {
    let src, start = a.start, sfxLen;
    if (a.kind === 'sfx' && a.type) {
      const f = join(assets, `sfx_${a.id}_${a.type}.wav`);
      sfxLen = synthToWav(a.type, a.params || {}, f).len;
      src = relative(out, f); start = Math.max(0, a.start + sfxOffset(a));
    } else src = place(resolve(dir, a.path), assets);
    const gain = a.gain ?? ({ music: -14, vo: 0, ambience: -22, sfx: -8, source: -10 }[a.kind]);
    const len = a.dur || sfxLen || Math.max(0.1, duration - start);
    html.push(`    <audio id="${a.id}" src="${src}" data-start="${start.toFixed(3)}" data-duration="${len.toFixed(3)}"${a.in ? ` data-media-start="${a.in}"` : ''} data-volume="${Math.min(1, dbToGain(gain)).toFixed(3)}" data-track-index="${4 + audioIdx++}"></audio>`);
  }
  if (tl.tracks.audio.some((a) => a.kind === 'vo') && tl.tracks.audio.some((a) => a.kind === 'music')) notes.push('music ducking under VO is not exported; add a data-automation volume lane in Studio if needed');

  // ---- fonts + runtime ----
  const faces = [];
  const fontFiles = new Map();
  for (const f of Object.values(brand.fonts || {})) for (const ff of f?.files || []) {
    const p = resolve(REPO_DIR, ff.path); if (!exists(p)) continue;
    if (!fontFiles.has(p)) fontFiles.set(p, place(p, assets));
    faces.push(`@font-face{font-family:"${f.family}";src:url("${fontFiles.get(p)}");font-weight:${ff.weight || 'normal'};}`);
  }
  const runtime = [join(LIBRARY_DIR, 'motion', 'runtime.js'), ...readdirSync(join(LIBRARY_DIR, 'motion', 'components')).filter((f) => f.endsWith('.js')).sort().map((f) => join(LIBRARY_DIR, 'motion', 'components', f))]
    .map((f) => readFileSync(f, 'utf8')).join('\n');
  writeFileSync(join(assets, 'domus-motion.js'), `// DOMUS motion runtime + components (generated by domus export-hf)\nwindow.DOMUS = window.DOMUS || {};\nwindow.DOMUS.brand = ${JSON.stringify(brand)};\n${runtime}\n(function(){\n  const IMAGES = ${JSON.stringify(images)};\n  const loaded = {};\n  for (const [k, src] of Object.entries(IMAGES)) { const im = new Image(); im.src = src; loaded[k] = im; }\n  window.DOMUS_IMAGES_FOR = (id) => { const o = {}; for (const k in loaded) { o[k] = loaded[k]; if (k.startsWith(id + ':')) o[k.slice(id.length + 1)] = loaded[k]; } return o; };\n})();\n`);

  // GSAP is bundled locally (Standard 'no charge' license) so the export renders offline.
  const gsapSrc = place(join(ENGINE_DIR, 'node_modules', 'gsap', 'dist', 'gsap.min.js'), assets);
  const doc = `<!doctype html>
<html lang="ar">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <title>${tl.title} — DOMUS</title>
    <script src="${gsapSrc}"></script>
    <script src="assets/domus-motion.js"></script>
    <style>
      ${[...new Set(faces)].join('\n      ')}
      body { margin: 0; background: #000; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #000; }
      .cam { position: absolute; inset: 0; overflow: hidden; }
      .cam video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-width="${W}" data-height="${H}" data-duration="${duration}">
${html.join('\n')}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
${js.map((l) => '      ' + l).join('\n')}
      window.__timelines['main'] = tl;
    </script>
  </body>
</html>
`;
  writeFileSync(join(out, 'index.html'), doc);
  writeFileSync(join(out, 'DOMUS_EXPORT.md'), `# HyperFrames export of "${tl.title}"\n\nGenerated by \`domus export-hf\` from timeline v${(await import('./timeline.mjs')).history(dir).slice(-1)[0]?.v ?? '?'}.\n\n\`\`\`sh\ncd ${relative(process.cwd(), out) || '.'}\nnpx hyperframes lint\nnpx hyperframes preview   # opens Studio\nnpx hyperframes render\n\`\`\`\n\nNotes:\n${notes.map((n) => `- ${n}`).join('\n') || '- none'}\n- Grades are CSS approximations of the FFmpeg presets unless the clip was baked.\n- The DOMUS renderer (\`domus render\`) remains the reference for final delivery.\n`);
  log(`HyperFrames composition -> ${join(out, 'index.html')} (${clips.length} clips, ${overlays.length} overlays, ${tl.tracks.audio.length} audio)`);
  notes.forEach((n) => log(`  · ${n}`));
  return join(out, 'index.html');
}
