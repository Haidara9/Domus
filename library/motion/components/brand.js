// Brand components derived from the DOMUS identity: parchment paper, gold line-art arches and
// column, the vertical bracket with its midpoint dot, logo lockup, end card.
(function () {
  const D = window.DOMUS;
  const { ease, range, clamp } = D;
  const lines = (v) => (Array.isArray(v) ? v : String(v || '').split('\n')).filter(Boolean);

  // ---------------------------------------------------------------------------
  D.register('paperBackground', {
    description: 'Opaque parchment background with seeded fibre texture and a slow warm light drift. Use under brand cards and end cards.',
    defaults: { color: null, deep: null, seed: 7, fibres: 1400, light: true, in: { dur: 0.01, style: 'none' }, out: { dur: 0.01, style: 'none' } },
    draw(g, t, ctx) {
      const { p, W, H, S } = ctx;
      const paper = p.color || ctx.C.paper || '#F1E6D3';
      const deep = p.deep || ctx.C.paperDeep || '#E6D5BA';
      g.fillStyle = paper; g.fillRect(0, 0, W, H);
      // soft edge darkening, like the posts
      const rg = g.createRadialGradient(W * 0.45, H * 0.4, Math.min(W, H) * 0.2, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
      rg.addColorStop(0, 'rgba(255,255,255,0)'); rg.addColorStop(1, deep + '88');
      g.fillStyle = rg; g.fillRect(0, 0, W, H);
      // fibre texture: identical every frame (seeded)
      const r = D.rng(p.seed);
      g.save(); g.lineWidth = 1 * S;
      for (let i = 0; i < p.fibres; i++) {
        const x = r() * W, y = r() * H, a = r() * Math.PI, l = (4 + r() * 18) * S;
        g.strokeStyle = r() > 0.5 ? 'rgba(120,90,50,0.05)' : 'rgba(255,255,255,0.10)';
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
      g.restore();
      if (p.light) {
        const lx = W * (0.3 + 0.2 * Math.sin(t * 0.25));
        const lg = g.createRadialGradient(lx, H * 0.25, 0, lx, H * 0.25, Math.max(W, H) * 0.7);
        lg.addColorStop(0, 'rgba(255,248,235,0.35)'); lg.addColorStop(1, 'rgba(255,248,235,0)');
        g.fillStyle = lg; g.fillRect(0, 0, W, H);
      }
    },
  });

  // ---------------------------------------------------------------------------
  D.register('archLines', {
    description: 'Gold architectural line art (concentric arches + a column) drawing itself. Background layer for brand moments.',
    defaults: {
      at: [0.72, 0.62], scale: 1, color: null, width: 1.6, arches: 2, column: true, drawDur: 2.6,
      in: { dur: 0.01, style: 'none' }, out: { dur: 0.6, style: 'fade' }, loop: { style: 'none' },
    },
    draw(g, t, ctx) {
      const { p, S, W } = ctx;
      const col = p.color || ctx.C.line || '#C4A177';
      const [cx, by] = D.at(ctx, p.at);
      const sc = p.scale * S;
      g.save(); g.strokeStyle = col; g.lineWidth = p.width * S; g.globalAlpha *= 0.85;
      for (let i = 0; i < p.arches; i++) {
        const w = (520 + i * 160) * sc, leg = (380 - i * 40) * sc;
        const k = ease.glide(range(t, i * 0.35, p.drawDur + i * 0.35));
        D.polyline(g, D.archPoints(cx + i * 70 * sc, by, w, leg), k, { width: p.width * S, color: col });
      }
      if (p.column) {
        const k = ease.glide(range(t, 0.4, p.drawDur));
        const cw = 92 * sc, ch = 520 * sc, x = cx - 260 * sc, top = by - ch;
        // capital
        D.polyline(g, [[x - cw * 0.65, top], [x + cw * 0.65, top], [x + cw * 0.65, top + 26 * sc], [x - cw * 0.65, top + 26 * sc], [x - cw * 0.65, top]], k);
        // shaft: three verticals
        for (let j = -1; j <= 1; j++) D.line(g, x + j * cw * 0.33, top + 26 * sc, x + j * cw * 0.33, by, ease.glide(range(t, 0.8 + Math.abs(j) * 0.15, p.drawDur + 0.4)), { width: p.width * S, color: col });
      }
      g.restore();
    },
  });

  // ---------------------------------------------------------------------------
  // brandStatement: the layout of the DOMUS posts: right-aligned headline, copper rule, body,
  // vertical bracket with midpoint dot on the outer side.
  D.register('brandStatement', {
    description: 'DOMUS post layout in motion: bracket draws, headline reveals, rule grows, body lines settle. For brand/values chapters.',
    defaults: {
      title: 'من نحن؟', body: '', at: [0.86, 0.30], width: 0.66, size: 92, bodySize: 40, color: null, bodyColor: null,
      accent: null, line: null, bracket: true, in: { dur: 1.4, style: 'none' }, out: { dur: 0.6, style: 'fade' },
    },
    draw(g, t, ctx) {
      const { p, S, W, H } = ctx;
      const ink = p.color || ctx.C.ink || '#151412';
      const bodyCol = p.bodyColor || ink;
      const accent = p.accent || ctx.C.copper || '#A86F3F';
      const lineCol = p.line || ctx.C.line || '#C4A177';
      const rtl = D.isArabic(p.title + p.body);
      const edge = p.at[0] * W; // text edge (right for Arabic)
      const align = rtl ? 'right' : 'left';
      const size = p.size * S, bs = p.bodySize * S;
      let y = p.at[1] * H;
      D.setFont(g, { role: 'display', weight: 500, size, text: p.title });
      const tl = lines(p.title).flatMap((l) => D.wrap(g, l, p.width * W));
      D.setFont(g, { role: 'text', weight: 400, size: bs, text: p.body });
      const bl = lines(p.body).flatMap((l) => D.wrap(g, l, p.width * W));
      const top = y - size * 1.0;
      const titleBottom = y + (tl.length - 1) * size * 1.2;
      const ruleY = titleBottom + size * 0.55;
      const bodyTop = ruleY + bs * 2.0;
      const bottom = bodyTop + Math.max(0, bl.length - 1) * bs * 1.75 + bs * 1.5;
      // bracket
      if (p.bracket) {
        const bx = rtl ? edge + 60 * S : edge - 60 * S, cap = 34 * S * (rtl ? -1 : 1);
        const k = ease.glide(range(t, 0, 1.1));
        g.save(); g.strokeStyle = accent; g.lineWidth = 2.2 * S; g.globalAlpha *= 0.9;
        D.polyline(g, [[bx + cap, top], [bx, top], [bx, bottom], [bx + cap, bottom]], k, { width: 2.2 * S, color: accent, cap: 'butt', join: 'miter' });
        const dk = D.springP(t - 0.95, 'playful');
        D.dot(g, bx, (top + bottom) / 2, 6 * S * dk, accent);
        g.restore();
      }
      // title lines (mask rise)
      tl.forEach((l, i) => {
        const ly = y + i * size * 1.2;
        const k = ease.architectural(range(t, 0.25 + i * 0.1, 1.1 + i * 0.1));
        g.save(); D.clipRect(g, 0, ly - size * 1.05, W, size * 1.4);
        D.setFont(g, { role: 'display', weight: 500, size, text: l });
        g.fillStyle = ink; g.globalAlpha *= clamp(k * 2.5);
        D.text(g, l, edge, ly + (1 - k) * size, { align });
        g.restore();
      });
      // rule
      const rk = ease.architectural(range(t, 0.6, 1.3));
      g.save(); g.strokeStyle = accent; g.lineWidth = 2.5 * S;
      D.line(g, edge, ruleY, edge + (rtl ? -1 : 1) * 210 * S, ruleY, rk); g.restore();
      // body
      bl.forEach((l, i) => {
        const k = ease.outCubic(range(t, 0.85 + i * 0.12, 1.5 + i * 0.12));
        g.save(); g.globalAlpha *= k; g.fillStyle = bodyCol;
        D.setFont(g, { role: 'text', weight: 400, size: bs, text: l });
        D.text(g, l, edge, bodyTop + i * bs * 1.75 + (1 - k) * 14 * S, { align });
        g.restore();
      });
      void lineCol;
    },
  });

  // ---------------------------------------------------------------------------
  // logoReveal: uses the REAL logo file (props.logo = image key). Never redraws the logo.
  // Without a file it shows a plain, clearly temporary wordmark and the engine warns.
  D.register('logoReveal', {
    description: 'Logo lockup: center-out mask reveal, rules extend on both sides, a light sweep passes over the logo pixels only.',
    defaults: {
      logo: 'logo', at: [0.5, 0.5], width: 0.62, rules: true, sweep: true, accent: null, placeholderText: 'DOMUS',
      placeholderSub: 'REAL ESTATE', color: null, in: { dur: 1.6, style: 'none' }, out: { dur: 0.6, style: 'fade' },
    },
    draw(g, t, ctx) {
      const { p, S, W, H } = ctx;
      const [cx, cy] = D.at(ctx, p.at);
      const accent = p.accent || ctx.C.copper || '#A86F3F';
      const img = ctx.img(p.logo);
      const off = document.createElement('canvas'); off.width = W; off.height = H;
      const o = off.getContext('2d');
      let bw = p.width * W, bh;
      if (img) {
        const r = D.drawImageContain(o, img, cx, cy, bw, H * 0.4); bw = r.w; bh = r.h;
      } else {
        const ink = p.color || ctx.C.ink || '#151412';
        D.setFont(o, { role: 'display', weight: 500, size: 150 * S, text: p.placeholderText });
        o.fillStyle = ink; D.text(o, p.placeholderText, cx, cy, { align: 'center', tracking: 6 * S });
        D.setFont(o, { role: 'label', weight: 500, size: 34 * S, text: p.placeholderSub });
        o.fillStyle = accent; D.text(o, p.placeholderSub, cx, cy + 70 * S, { align: 'center', tracking: 14 * S });
        bw = D.measure(o, p.placeholderText, 6 * S) * 1.1; bh = 230 * S;
      }
      if (p.sweep) {
        const sk = ease.inOutSine(range(t, 1.0, 2.2));
        if (sk > 0 && sk < 1) {
          o.save(); o.globalCompositeOperation = 'source-atop';
          const sx = cx - bw / 2 - 200 * S + (bw + 400 * S) * sk;
          const gr = o.createLinearGradient(sx - 120 * S, 0, sx + 120 * S, 0);
          gr.addColorStop(0, 'rgba(255,240,215,0)'); gr.addColorStop(0.5, 'rgba(255,240,215,0.75)'); gr.addColorStop(1, 'rgba(255,240,215,0)');
          o.fillStyle = gr; o.fillRect(0, 0, W, H); o.restore();
        }
      }
      const mk = ease.architectural(range(t, 0.1, 1.2));
      g.save();
      D.clipRect(g, cx - (bw / 2 + 10 * S) * mk, 0, (bw + 20 * S) * mk, H);
      g.globalAlpha *= clamp(mk * 1.5);
      g.drawImage(off, 0, 0);
      g.restore();
      if (p.rules) {
        const rk = ease.architectural(range(t, 0.6, 1.6));
        const y = cy + bh / 2 + 34 * S, len = bw * 0.22;
        g.save(); g.strokeStyle = accent; g.lineWidth = 2 * S;
        D.line(g, cx - bw * 0.18, y, cx - bw * 0.18 - len, y, rk);
        D.line(g, cx + bw * 0.18, y, cx + bw * 0.18 + len, y, rk);
        g.restore();
      }
    },
  });

  // ---------------------------------------------------------------------------
  D.register('endCard', {
    description: 'Closing card: logo, call to action, contact lines, location. Draw over paperBackground (or bg:true).',
    defaults: {
      bg: false, logo: 'logo', cta: 'احجز زيارتك الآن', lines: [], location: 'اللاذقية', at: [0.5, 0.36],
      in: { dur: 1.6, style: 'none' }, out: { dur: 0.01, style: 'none' },
    },
    draw(g, t, ctx) {
      const { p, S, W, H } = ctx;
      if (p.bg) D.components.paperBackground.draw(g, t, { ...ctx, p: { ...D.components.paperBackground.defaults, ...p } });
      D.paint(g, { component: 'logoReveal', dur: ctx.dur, props: { logo: p.logo, at: p.at, width: 0.62, out: { dur: 0.01 } } }, t, { W, H, images: { [p.logo]: ctx.img(p.logo) } });
      const ink = ctx.C.ink || '#151412', accent = ctx.C.copper || '#A86F3F';
      let y = p.at[1] * H + 300 * S;
      const k = ease.architectural(range(t, 1.0, 1.8));
      g.save(); g.globalAlpha *= k; g.fillStyle = ink;
      D.setFont(g, { role: 'display', weight: 500, size: 64 * S, text: p.cta });
      D.text(g, p.cta, W / 2, y + (1 - k) * 30 * S, { align: 'center' });
      g.restore();
      y += 90 * S;
      (p.lines || []).forEach((l, i) => {
        const lk = ease.outCubic(range(t, 1.3 + i * 0.12, 2.0 + i * 0.12));
        g.save(); g.globalAlpha *= lk; g.fillStyle = ink;
        D.setFont(g, { role: 'text', weight: 400, size: 40 * S, text: l });
        D.text(g, l, W / 2, y + i * 62 * S, { align: 'center', tracking: 1 * S });
        g.restore();
      });
      if (p.location) {
        const lk = ease.outCubic(range(t, 1.6, 2.3));
        g.save(); g.globalAlpha *= lk; g.fillStyle = accent;
        D.setFont(g, { role: 'label', weight: 500, size: 34 * S, text: p.location });
        D.text(g, p.location, W / 2, H * 0.9, { align: 'center', tracking: 8 * S });
        g.restore();
      }
    },
  });
})();
