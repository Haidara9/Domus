// DOMUS motion runtime: shared by every motion/text/VFX component.
// Contract: every component is a PURE FUNCTION OF TIME. draw(g, t, ctx) paints the frame at
// local time t (seconds from the item's start). No Math.random, no timers, no state between
// frames. That is what makes renders deterministic and lets the engine re-render one item alone.
(function () {
  const D = (window.DOMUS = window.DOMUS || {});
  D.components = D.components || {};
  D.register = (name, def) => { D.components[name] = def; };

  // ---------- math ----------
  const clamp = (D.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)));
  D.lerp = (a, b, t) => a + (b - a) * t;
  D.range = (t, a, b) => clamp((t - a) / Math.max(1e-9, b - a));
  D.mix = (a, b, t) => a + (b - a) * t;

  // Seeded RNG (mulberry32): the only allowed source of randomness.
  D.rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  D.hash = (n) => { const r = D.rng(n * 9973 + 17); return r(); };

  // ---------- easing ----------
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) { const e = sx(t) - x; const d = dx(t); if (Math.abs(e) < 1e-6 || !d) break; t -= e / d; }
      return sy(clamp(t));
    };
  }
  D.bezier = bezier;
  D.ease = {
    linear: (x) => x,
    inSine: (x) => 1 - Math.cos((x * Math.PI) / 2),
    outSine: (x) => Math.sin((x * Math.PI) / 2),
    inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
    inCubic: (x) => x * x * x,
    outCubic: (x) => 1 - Math.pow(1 - x, 3),
    inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    outQuart: (x) => 1 - Math.pow(1 - x, 4),
    inOutQuart: (x) => (x < 0.5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2),
    outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    inExpo: (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
    inOutExpo: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2),
    outBack: (x) => { const c1 = 1.2, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
    // House curves
    architectural: bezier(0.22, 1, 0.36, 1),   // long, confident settle: titles, lines
    glide: bezier(0.45, 0, 0.15, 1),           // camera-like in-out: panels, wipes
    snap: bezier(0.7, 0, 0.2, 1),              // energetic, for commercial cuts
    exit: bezier(0.55, 0, 0.75, 0.2),          // accelerate away
  };
  D.easeFn = (name) => (typeof name === 'function' ? name : D.ease[name] || D.ease.architectural);

  // Closed-form damped spring 0 -> 1 (pure function of time).
  D.spring = (t, k = 170, d = 26) => {
    if (t <= 0) return 0;
    const w0 = Math.sqrt(k), z = d / (2 * w0);
    if (z < 1) {
      const wd = w0 * Math.sqrt(1 - z * z);
      return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
    }
    return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  };
  D.SPRING = { snappy: [320, 30], default: [170, 26], heavy: [90, 20], playful: [220, 14] };
  D.springP = (t, preset = 'default') => D.spring(t, ...(D.SPRING[preset] || D.SPRING.default));

  // Keyframes: [[t, value, ease?], ...]. Numbers or [x,y] arrays.
  D.keyframes = (keys, t) => {
    if (!keys || !keys.length) return undefined;
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const [t0, v0] = keys[i - 1], [t1, v1, e] = keys[i];
        const k = D.easeFn(e || 'inOutSine')((t - t0) / Math.max(1e-9, t1 - t0));
        return Array.isArray(v0) ? v0.map((a, j) => a + (v1[j] - a) * k) : v0 + (v1 - v0) * k;
      }
    }
    return keys[keys.length - 1][1];
  };

  // ---------- text ----------
  const AR = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
  D.isArabic = (s) => AR.test(String(s || ''));
  D.dir = (s) => (D.isArabic(s) ? 'rtl' : 'ltr');

  // Font roles map to brand fonts (loaded by the stage) with safe fallbacks.
  D.fontFamily = (role, text, lang) => {
    const f = (D.brand && D.brand.fonts) || {};
    const ar = lang ? lang === 'ar' : D.isArabic(text);
    const pick = {
      display: ar ? f.arabicDisplay : f.latinDisplay,
      text: ar ? f.arabicText : f.latinText,
      label: ar ? f.arabicText : f.latinLabel || f.latinText,
    }[role] || (ar ? f.arabicText : f.latinText);
    const fam = (pick && pick.family) || '';
    const fallback = ar ? '"Noto Kufi Arabic", "Noto Naskh Arabic", "DejaVu Sans", sans-serif' : '"Cinzel", "Times New Roman", serif';
    return fam ? `"${fam}", ${fallback}` : fallback;
  };
  // lang ('ar' | 'en') forces a script, e.g. digits inside an Arabic layout use the Arabic face.
  D.setFont = (g, { role = 'text', weight = 400, size = 40, text = '', lang } = {}) => {
    g.font = `${weight} ${Math.round(size)}px ${D.fontFamily(role, text, lang)}`;
  };

  // Draw a single line of text with correct direction. Tracking (letter spacing) is ignored
  // for Arabic: spacing letters breaks the cursive joins. Use word-level motion instead.
  D.text = (g, str, x, y, { align = 'start', tracking = 0, color, alpha } = {}) => {
    const rtl = D.isArabic(str);
    g.save();
    g.direction = rtl ? 'rtl' : 'ltr';
    g.textAlign = align;
    g.textBaseline = 'alphabetic';
    if (color) g.fillStyle = color;
    if (alpha !== undefined) g.globalAlpha *= alpha;
    try { g.letterSpacing = rtl ? '0px' : `${tracking}px`; } catch (e) { /* older engines */ }
    g.fillText(str, x, y);
    g.restore();
  };
  D.measure = (g, str, tracking = 0) => {
    g.save();
    try { g.letterSpacing = D.isArabic(str) ? '0px' : `${tracking}px`; } catch (e) {}
    const w = g.measureText(str).width;
    g.restore();
    return w;
  };
  // Greedy word wrap to maxWidth. Returns lines.
  D.wrap = (g, str, maxWidth) => {
    const words = String(str).split(/\s+/).filter(Boolean);
    const lines = []; let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (g.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else line = test;
    }
    if (line) lines.push(line);
    // no orphans: pull a word down when the last line would hold a single word
    if (lines.length > 1) {
      const last = lines[lines.length - 1].split(' '), prev = lines[lines.length - 2].split(' ');
      if (last.length === 1 && prev.length >= 3) {
        const moved = [prev.pop(), ...last].join(' ');
        if (g.measureText(moved).width <= maxWidth) { lines[lines.length - 2] = prev.join(' '); lines[lines.length - 1] = moved; }
      }
    }
    return lines;
  };
  // Resolve "start"/"end"/"auto" alignment to a canvas x anchor for the text's direction.
  D.alignFor = (str, align) => {
    if (align && align !== 'auto') return align;
    return D.isArabic(str) ? 'right' : 'left';
  };

  // ---------- drawing primitives ----------
  // Partial line from (x1,y1) to (x2,y2) at progress p.
  D.line = (g, x1, y1, x2, y2, p = 1, { width = 2, color, cap = 'butt' } = {}) => {
    if (p <= 0) return;
    g.save(); g.lineWidth = width; g.lineCap = cap; if (color) g.strokeStyle = color;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 + (x2 - x1) * p, y1 + (y2 - y1) * p); g.stroke(); g.restore();
  };
  // Stroke a path (array of [x,y] points) progressively by length.
  D.polyline = (g, pts, p = 1, { width = 2, color, cap = 'round', join = 'round' } = {}) => {
    if (p <= 0 || pts.length < 2) return;
    let total = 0; const seg = [];
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); total += l; }
    let left = total * clamp(p);
    g.save(); g.lineWidth = width; g.lineCap = cap; g.lineJoin = join; if (color) g.strokeStyle = color;
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length && left > 0; i++) {
      const k = Math.min(1, left / seg[i - 1]);
      g.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k);
      left -= seg[i - 1];
    }
    g.stroke(); g.restore();
  };
  // Arch outline (two legs + semicircle) as a point list, for architectural line art.
  D.archPoints = (cx, baseY, w, legH, n = 48) => {
    const r = w / 2, pts = [[cx - r, baseY], [cx - r, baseY - legH]];
    for (let i = 0; i <= n; i++) { const a = Math.PI + (Math.PI * i) / n; pts.push([cx + r * Math.cos(a), baseY - legH + r * Math.sin(a)]); }
    pts.push([cx + r, baseY]);
    return pts;
  };
  D.dot = (g, x, y, r, color) => { g.save(); if (color) g.fillStyle = color; g.beginPath(); g.arc(x, y, Math.max(0, r), 0, Math.PI * 2); g.fill(); g.restore(); };
  D.roundRect = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); };
  D.clipRect = (g, x, y, w, h) => { g.beginPath(); g.rect(x, y, w, h); g.clip(); };

  D.drawImageCover = (g, img, x, y, w, h, focus = [0.5, 0.5]) => {
    if (!img) return;
    const s = Math.max(w / img.width, h / img.height);
    const sw = w / s, sh = h / s;
    const sx = clamp((img.width - sw) * focus[0], 0, img.width - sw), sy = clamp((img.height - sh) * focus[1], 0, img.height - sh);
    g.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  };
  D.drawImageContain = (g, img, cx, cy, maxW, maxH) => {
    if (!img) return { w: 0, h: 0 };
    const s = Math.min(maxW / img.width, maxH / img.height);
    const w = img.width * s, h = img.height * s;
    g.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    return { w, h };
  };

  // ---------- envelope: generic IN / OUT / LOOP for any component ----------
  // ctx.pin: 0->1 during the intro, ctx.pout: 0->1 during the outro (0 before it).
  D.envelope = (t, dur, p) => {
    const inD = (p.in && p.in.dur) ?? 0.8, outD = (p.out && p.out.dur) ?? 0.6;
    return {
      pin: D.range(t, 0, inD),
      pout: D.range(t, dur - outD, dur),
      inD, outD,
    };
  };

  function applyStyle(g, ctx, style, k, entering) {
    // k: 1 = fully visible, 0 = gone
    const { W, H, S } = ctx;
    switch (style) {
      case 'fade': g.globalAlpha *= k; break;
      case 'rise': g.globalAlpha *= k; g.translate(0, (entering ? 1 : -1) * (1 - k) * 60 * S); break;
      case 'sink': g.globalAlpha *= k; g.translate(0, (entering ? -1 : 1) * (1 - k) * 60 * S); break;
      case 'blur': g.globalAlpha *= k; g.filter = `blur(${((1 - k) * 18 * S).toFixed(2)}px)`; break;
      case 'scale': { g.globalAlpha *= k; const s = 0.92 + 0.08 * k; g.translate(W / 2, H / 2); g.scale(s, s); g.translate(-W / 2, -H / 2); break; }
      case 'mask-up': D.clipRect(g, 0, H * (1 - k), W, H * k + 1); break;
      case 'wipe-start': { const rtl = ctx.rtl; const w = W * k; D.clipRect(g, rtl ? W - w : 0, 0, w, H); break; }
      case 'wipe-end': { const rtl = ctx.rtl; const w = W * k; D.clipRect(g, rtl ? 0 : W - w, 0, w, H); break; }
      case 'none': default: break;
    }
  }

  // Resolve props with keyframes: props.keys = { propName: [[t, v, ease], ...] }
  D.resolveProps = (props, t) => {
    if (!props.keys) return props;
    const out = { ...props };
    for (const [k, keys] of Object.entries(props.keys)) out[k] = D.keyframes(keys, t);
    return out;
  };

  // Paint one item at local time t. Called by the stage for every frame.
  D.paint = (g, item, t, env) => {
    const def = D.components[item.component];
    if (!def) throw new Error(`Unknown component "${item.component}"`);
    const merged = { ...(def.defaults || {}), ...(item.props || {}) };
    merged.in = { ...((def.defaults || {}).in || {}), ...((item.props || {}).in || {}) };
    merged.out = { ...((def.defaults || {}).out || {}), ...((item.props || {}).out || {}) };
    merged.loop = { ...((def.defaults || {}).loop || {}), ...((item.props || {}).loop || {}) };
    const p = D.resolveProps(merged, t);
    const dur = item.dur;
    const e = D.envelope(t, dur, p);
    const ctx = {
      W: env.W, H: env.H, S: Math.min(env.W, env.H) / 1080, dur, p, t,
      pin: e.pin, pout: e.pout, inD: e.inD, outD: e.outD,
      brand: D.brand || {}, C: (D.brand && D.brand.colors) || {},
      img: (k) => env.images[k], seed: env.seed || 1, rtl: D.isArabic(p.title || p.text || p.label || ''),
    };
    g.save();
    const inStyle = p.in.style || 'none', outStyle = p.out.style || 'none';
    const ein = D.easeFn(p.in.ease || 'architectural')(e.pin);
    const eout = 1 - D.easeFn(p.out.ease || 'exit')(e.pout);
    if (e.pout <= 0) applyStyle(g, ctx, inStyle, ein, true); else applyStyle(g, ctx, outStyle, eout, false);
    const lp = p.loop || {};
    if (lp.style && lp.style !== 'none') {
      const per = lp.period || 6, amp = (lp.amp ?? 1) * ctx.S;
      const ph = Math.sin((2 * Math.PI * t) / per);
      if (lp.style === 'float') g.translate(0, ph * 6 * amp);
      if (lp.style === 'drift') g.translate((t / per) * 12 * amp * (ctx.rtl ? -1 : 1), 0);
      if (lp.style === 'breathe') { const s = 1 + ph * 0.006 * (lp.amp ?? 1); g.translate(env.W / 2, env.H / 2); g.scale(s, s); g.translate(-env.W / 2, -env.H / 2); }
    }
    def.draw(g, t, ctx);
    g.restore();
  };

  // Normalized anchor -> pixels. Accepts [x,y] in 0..1 of the frame.
  D.at = (ctx, xy) => [xy[0] * ctx.W, xy[1] * ctx.H];
})();
