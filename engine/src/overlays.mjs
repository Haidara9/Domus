// Renders text / animation / VFX items to transparent video clips with headless Chromium.
// Each item is cached by a hash of (component source, props, size, fps, fonts, images), so a
// revision re-renders only the items that changed.
import { spawn } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { BRAND_DIR, FFMPEG, LIBRARY_DIR, REPO_DIR, debug, ensureDir, exists, fileSig, log, readJSON, sha, toFrames } from './util.mjs';

const MOTION_DIR = join(LIBRARY_DIR, 'motion');

// Images go in as data: URLs; file:// images taint the canvas and block frame export.
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', jfif: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', gif: 'image/gif' };
const dataUrl = (p) => `data:${MIME[p.split('.').pop().toLowerCase()] || 'image/png'};base64,${readFileSync(p).toString('base64')}`;

// Full-frame opaque components are encoded as H.264 (no alpha needed, ~50x smaller than qtrle).
export const isOpaque = (item) => item.component === 'paperBackground' || (item.component === 'endCard' && item.props?.bg) || !!item.props?.opaque;

export function loadBrand(tl, root) {
  const candidates = [tl.brand && resolve(REPO_DIR, tl.brand), tl.brand && resolve(root || '.', tl.brand), join(BRAND_DIR, 'brand.json')];
  for (const c of candidates) if (c && exists(c)) return { brand: readJSON(c), path: c };
  return { brand: {}, path: null };
}

function motionSources() {
  const files = [join(MOTION_DIR, 'runtime.js'), ...readdirSync(join(MOTION_DIR, 'components')).filter((f) => f.endsWith('.js')).sort().map((f) => join(MOTION_DIR, 'components', f))];
  return files.map((f) => ({ path: f, code: readFileSync(f, 'utf8') }));
}

// Image keys available to components: brand logos + per-item props.images {key: path}.
function imageTable(brand, items, root) {
  const table = {};
  for (const [k, v] of Object.entries(brand.logos || {})) {
    const p = resolve(REPO_DIR, v);
    if (exists(p)) table[k] = p;
  }
  for (const it of items) for (const [k, v] of Object.entries(it.props?.images || {})) {
    const p = resolve(root, v);
    if (!exists(p)) throw new Error(`${it.id}: image "${v}" not found`);
    table[`${it.id}:${k}`] = p;
    table[k] = table[k] || p;
  }
  return table;
}

function fontFaces(brand) {
  const out = [];
  for (const [role, f] of Object.entries(brand.fonts || {})) {
    if (!f?.family) continue;
    const files = Array.isArray(f.files) ? f.files : f.file ? [{ path: f.file, weight: f.weight || 'normal' }] : [];
    for (const ff of files) {
      const p = resolve(REPO_DIR, ff.path);
      if (!exists(p)) { debug(`font missing for ${role}: ${p}`); continue; }
      out.push(`@font-face{font-family:"${f.family}";src:url("${pathToFileURL(p).href}");font-weight:${ff.weight || 'normal'};font-style:${ff.style || 'normal'};}`);
    }
  }
  return [...new Set(out)];
}

export function stageHTML(brand, W, H) {
  const scripts = motionSources().map((s) => `<script>/* ${s.path} */\n${s.code}\n</script>`).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontFaces(brand).join('\n')}
html,body{margin:0;background:transparent;overflow:hidden}
canvas{display:block}
</style></head><body><canvas id="c" width="${W}" height="${H}"></canvas>
<script>window.DOMUS = window.DOMUS || {}; window.DOMUS.brand = ${JSON.stringify(brand)};</script>
${scripts}
<script>
(function(){
  const D = window.DOMUS, c = document.getElementById('c'), g = c.getContext('2d');
  const images = {};
  D.loadImages = async (table) => {
    await Promise.all(Object.entries(table).map(([k, url]) => new Promise((res, rej) => {
      const im = new Image(); im.onload = () => { images[k] = im; res(); }; im.onerror = () => rej(new Error('image ' + url)); im.src = url;
    })));
  };
  D.loadFonts = async (families) => {
    await Promise.all(families.map((f) => document.fonts.load('400 40px "' + f + '"', 'abc ابت').catch(() => null)));
    await document.fonts.ready;
    return families.map((f) => [f, document.fonts.check('40px "' + f + '"')]);
  };
  D.frame = (items, t, seed) => {
    g.setTransform(1,0,0,1,0,0); g.clearRect(0, 0, c.width, c.height);
    for (const it of items) {
      const lt = t - (it._offset || 0);
      if (lt < 0 || lt >= it.dur) continue;
      const imgs = {}; for (const k in images) { imgs[k] = images[k]; if (k.startsWith(it.id + ':')) imgs[k.slice(it.id.length + 1)] = images[k]; }
      D.paint(g, it, lt, { W: c.width, H: c.height, images: imgs, seed });
    }
  };
  D.png = () => c.toDataURL('image/png').slice(22);
})();
</script></body></html>`;
}

export class OverlayRenderer {
  constructor({ tl, root, cacheDir, W, H, fps }) {
    Object.assign(this, { tl, root, cacheDir: ensureDir(join(cacheDir, 'overlays')), W, H, fps });
    const { brand, path } = loadBrand(tl, root);
    this.brand = brand; this.brandPath = path;
    this.warnings = [];
  }

  // Cache key depends on the runtime + the file that defines this component (not on every component),
  // so editing one component only re-renders items that use it.
  componentSource(name) {
    if (!this._srcMap) {
      this._srcMap = {};
      const all = motionSources();
      this._runtime = all[0].code;
      for (const f of all.slice(1)) for (const m of f.code.matchAll(/D\.register\('(\w+)'/g)) this._srcMap[m[1]] = f.code;
    }
    return this._runtime + (this._srcMap[name] || '');
  }

  itemKey(item, images) {
    const src = this.componentSource(item.component) + (item.component === 'endCard' ? this.componentSource('logoReveal') + this.componentSource('paperBackground') : '');
    const imgSig = Object.values(images).map(fileSig).join('|');
    const fontSig = Object.values(this.brand.fonts || {}).flatMap((f) => (f?.files || (f?.file ? [{ path: f.file }] : [])).map((x) => fileSig(resolve(REPO_DIR, x.path)))).join('|');
    return sha({ v: 3, opaque: isOpaque(item), src: sha(src), item: { component: item.component, dur: item.dur, props: item.props }, W: this.W, H: this.H, fps: this.fps, colors: this.brand.colors, fonts: this.brand.fonts, imgSig, fontSig });
  }

  async open() {
    if (this.browser) return;
    const { chromium } = await import('playwright');
    const exe = process.env.DOMUS_CHROMIUM || (exists('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined);
    this.browser = await chromium.launch({ executablePath: exe, args: ['--force-color-profile=srgb', '--disable-lcd-text'] });
    this.page = await this.browser.newPage({ viewport: { width: this.W, height: this.H }, deviceScaleFactor: 1 });
    const html = stageHTML(this.brand, this.W, this.H);
    const stagePath = join(this.cacheDir, `stage_${this.W}x${this.H}.html`);
    writeFileSync(stagePath, html);
    this.page.on('pageerror', (e) => this.warnings.push(`page error: ${e.message}`));
    await this.page.goto(pathToFileURL(stagePath).href);
    const families = [...new Set(Object.values(this.brand.fonts || {}).map((f) => f?.family).filter(Boolean))];
    const loaded = await this.page.evaluate((f) => window.DOMUS.loadFonts(f), families);
    for (const [f, ok] of loaded) if (!ok) this.warnings.push(`font "${f}" did not load; fallback font used`);
    this.loadedImages = new Set();
  }

  async close() { await this.browser?.close(); this.browser = null; }

  // Render one item to <cache>/overlays/<key>.mov (qtrle, with alpha). Returns path.
  async render(item) {
    const images = imageTable(this.brand, [item], this.root);
    const needsLogo = ['logoReveal', 'endCard'].includes(item.component);
    const logoKey = item.props?.logo || 'logo';
    if (needsLogo && !images[logoKey]) this.warnings.push(`${item.id}: no logo file for "${logoKey}". Rendered a temporary wordmark. Add brand/logos and brand.json "logos".`);
    const key = this.itemKey(item, images);
    const out = join(this.cacheDir, `${item.id}_${key}.mov`);
    if (exists(out)) { debug(`overlay cache hit ${item.id}`); return { path: out, cached: true }; }
    await this.open();
    const fresh = Object.fromEntries(Object.entries(images).filter(([k]) => !this.loadedImages.has(k)).map(([k, p]) => [k, dataUrl(p)]));
    if (Object.keys(fresh).length) { await this.page.evaluate((t) => window.DOMUS.loadImages(t), fresh); Object.keys(fresh).forEach((k) => this.loadedImages.add(k)); }
    const frames = toFrames(item.dur, this.fps);
    const opaque = isOpaque(item);
    const tmp = out + '.part.mov';
    const codec = opaque ? ['-c:v', 'libx264', '-preset', 'medium', '-crf', '12', '-pix_fmt', 'yuv420p'] : ['-c:v', 'qtrle', '-pix_fmt', 'argb'];
    const ff = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(this.fps), '-c:v', 'png', '-i', '-',
      ...codec, tmp], { stdio: ['pipe', 'inherit', 'pipe'] });
    let ferr = ''; ff.stderr.on('data', (d) => (ferr += d));
    const plain = { id: item.id, component: item.component, dur: item.dur, props: item.props || {} };
    for (let f = 0; f < frames; f++) {
      const b64 = await this.page.evaluate(([it, t, seed]) => { window.DOMUS.frame([it], t, seed); return window.DOMUS.png(); }, [plain, f / this.fps, 1]);
      if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    const code = await new Promise((r) => ff.on('close', r));
    if (code !== 0) throw new Error(`overlay encode failed for ${item.id}: ${ferr}`);
    const { renameSync } = await import('node:fs');
    renameSync(tmp, out);
    log(`  overlay ${item.id} (${item.component}) ${frames}f`);
    return { path: out, cached: false };
  }

  // Single PNG of a set of items at timeline time t (for quick previews).
  async still(items, t, outPng) {
    await this.open();
    const all = {};
    for (const it of items) Object.assign(all, imageTable(this.brand, [it], this.root));
    const fresh = Object.fromEntries(Object.entries(all).filter(([k]) => !this.loadedImages.has(k)).map(([k, p]) => [k, dataUrl(p)]));
    if (Object.keys(fresh).length) { await this.page.evaluate((x) => window.DOMUS.loadImages(x), fresh); Object.keys(fresh).forEach((k) => this.loadedImages.add(k)); }
    const plain = items.map((it) => ({ id: it.id, component: it.component, dur: it.dur, props: it.props || {}, _offset: it.start }));
    const b64 = await this.page.evaluate(([its, tt]) => { window.DOMUS.frame(its, tt, 1); return window.DOMUS.png(); }, [plain, t]);
    writeFileSync(outPng, Buffer.from(b64, 'base64'));
    return outPng;
  }
}
