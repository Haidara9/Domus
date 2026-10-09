// Typography components: architectural reveals, kinetic words, lower thirds, price, counter.
// All sizes are in 1080-base units and multiplied by ctx.S, so one timeline renders to any format.
(function () {
  const D = window.DOMUS;
  const { ease, range, clamp } = D;
  const toLines = (v) => (Array.isArray(v) ? v : String(v || '').split('\n')).filter((s) => s !== '');

  function textShadow(g, ctx, on) {
    if (!on) return;
    g.shadowColor = 'rgba(0,0,0,0.32)';
    g.shadowBlur = 28 * ctx.S;
    g.shadowOffsetY = 2 * ctx.S;
  }

  // ---------------------------------------------------------------------------
  // archTitle: headline rises from behind an invisible architectural line,
  // copper rule draws under it, subtitle follows. The DOMUS signature title.
  D.register('archTitle', {
    description: 'Architectural mask reveal: headline lines rise from behind a baseline, copper rule draws, subtitle settles. IN/OUT built in.',
    defaults: {
      title: 'عنوان', subtitle: '', at: [0.5, 0.42], align: 'auto', size: 104, subSize: 40,
      weight: 600, color: '#FFFFFF', subColor: 'rgba(255,255,255,0.86)', accent: null, rule: true,
      shadow: true, maxWidth: 0.84, lineGap: 1.18, in: { dur: 1.2, style: 'none' }, out: { dur: 0.6, style: 'none' },
    },
    draw(g, t, ctx) {
      const { p, S, W, H } = ctx;
      const accent = p.accent || ctx.C.copper || '#A86F3F';
      const size = p.size * S, sub = p.subSize * S;
      const lines0 = toLines(p.title);
      D.setFont(g, { role: 'display', weight: p.weight, size, text: lines0.join(' ') });
      const lines = lines0.flatMap((l) => D.wrap(g, l, p.maxWidth * W));
      const align = D.alignFor(lines.join(' '), p.align);
      const [ax, ay] = D.at(ctx, p.at);
      const lh = size * p.lineGap;
      const blockH = lh * lines.length;
      let y0 = ay - blockH / 2 + size * 0.8;
      const widths = lines.map((l) => D.measure(g, l));
      const maxW = Math.max(...widths, 1);
      const xFor = (w) => (align === 'right' ? ax + maxW / 2 : align === 'left' ? ax - maxW / 2 : ax);
      const outK = ease.exit(ctx.pout);

      lines.forEach((line, i) => {
        const k = ease.architectural(range(t, 0.12 + i * 0.09, 0.95 + i * 0.09));
        const y = y0 + i * lh;
        g.save();
        D.clipRect(g, 0, y - size * 1.05, W, size * 1.38);
        g.globalAlpha *= clamp(k * 3) * (1 - outK);
        textShadow(g, ctx, p.shadow);
        D.setFont(g, { role: 'display', weight: p.weight, size, text: line });
        g.fillStyle = p.color;
        const dy = (1 - k) * size * 1.15 - outK * size * 1.2;
        D.text(g, line, xFor(widths[i]), y + dy, { align });
        g.restore();
      });

      let yRule = y0 + (lines.length - 1) * lh + size * 0.55;
      if (p.rule) {
        const rk = ease.architectural(range(t, 0.05, 0.85)) * (1 - ease.glide(ctx.pout));
        const len = Math.min(maxW * 0.38, 240 * S);
        const startX = align === 'right' ? xFor(maxW) : align === 'left' ? xFor(maxW) : ax - len / 2;
        const dir = align === 'right' ? -1 : 1;
        g.save(); g.strokeStyle = accent; g.lineWidth = Math.max(2, 3 * S);
        D.line(g, startX, yRule, startX + dir * len, yRule, rk);
        g.restore();
      }
      if (p.subtitle) {
        const sk = ease.architectural(range(t, 0.45, 1.25));
        g.save();
        g.globalAlpha *= sk * (1 - outK);
        textShadow(g, ctx, p.shadow);
        D.setFont(g, { role: 'text', weight: 400, size: sub, text: p.subtitle });
        g.fillStyle = p.subColor;
        const subLines = toLines(p.subtitle).flatMap((l) => D.wrap(g, l, p.maxWidth * W));
        subLines.forEach((l, i) => D.text(g, l, xFor(maxW), yRule + sub * 1.7 + i * sub * 1.45 + (1 - sk) * 18 * S, { align, tracking: 1.5 * S }));
        g.restore();
      }
    },
  });

  // ---------------------------------------------------------------------------
  // kineticWords: high-energy word-by-word build (springs). Arabic animates per word, never per letter.
  D.register('kineticWords', {
    description: 'Word-by-word spring build for energetic social cuts. times[] can lock each word to a beat.',
    defaults: {
      text: 'بيتك يبدأ من هنا', at: [0.5, 0.45], size: 128, weight: 700, color: '#FFFFFF', highlight: [],
      highlightColor: null, stagger: 0.16, times: null, align: 'center', maxWidth: 0.86, spring: 'snappy',
      shadow: true, in: { dur: 0.6, style: 'none' }, out: { dur: 0.35, style: 'blur' },
    },
    draw(g, t, ctx) {
      const { p, S, W } = ctx;
      const size = p.size * S;
      const words = String(p.text).split(/\s+/).filter(Boolean);
      const rtl = D.isArabic(p.text);
      D.setFont(g, { role: 'display', weight: p.weight, size, text: p.text });
      const space = D.measure(g, ' ');
      // lay out lines (logical order), then place words in visual order per direction
      const lines = []; let cur = [], curW = 0;
      for (const w of words) {
        const ww = D.measure(g, w);
        if (cur.length && curW + space + ww > p.maxWidth * W) { lines.push(cur); cur = []; curW = 0; }
        cur.push({ w, ww }); curW += (cur.length > 1 ? space : 0) + ww;
      }
      if (cur.length) lines.push(cur);
      const [ax, ay] = D.at(ctx, p.at);
      const lh = size * 1.12;
      let idx = 0;
      lines.forEach((ln, li) => {
        const lw = ln.reduce((s, x) => s + x.ww, 0) + space * (ln.length - 1);
        let x = p.align === 'center' ? ax - lw / 2 : (rtl ? ax - lw : ax);
        const order = rtl ? [...ln].reverse() : ln;
        const y = ay - ((lines.length - 1) * lh) / 2 + li * lh + size * 0.35;
        // logical index for timing
        const startIdx = idx; idx += ln.length;
        order.forEach((o, vi) => {
          const logical = startIdx + (rtl ? ln.length - 1 - vi : vi);
          const t0 = p.times ? p.times[logical] ?? logical * p.stagger : logical * p.stagger;
          const s = D.springP(t - t0, p.spring);
          if (t >= t0) {
            g.save();
            textShadow(g, ctx, p.shadow);
            g.globalAlpha *= clamp((t - t0) * 8);
            const cx = x + o.ww / 2;
            g.translate(cx, y + (1 - s) * size * 0.35);
            const sc = 0.72 + 0.28 * s; g.scale(sc, sc);
            const hl = p.highlight.includes(o.w);
            g.fillStyle = hl ? p.highlightColor || ctx.C.copperLight || '#C08A5A' : p.color;
            D.setFont(g, { role: 'display', weight: p.weight, size, text: o.w });
            D.text(g, o.w, 0, 0, { align: 'center' });
            g.restore();
          }
          x += o.ww + space;
        });
      });
    },
  });

  // ---------------------------------------------------------------------------
  // lowerThird: copper bar + title + subtitle wiping out from the bar. Reading-direction aware.
  D.register('lowerThird', {
    description: 'Location / property name lower third. Bar grows, text wipes out of the bar, sub fades.',
    defaults: {
      title: 'فيلا الشاطئ الأزرق', subtitle: 'اللاذقية', at: [0.08, 0.80], side: 'auto', size: 58, subSize: 34,
      color: '#FFFFFF', subColor: 'rgba(255,255,255,0.82)', accent: null, shadow: true,
      in: { dur: 0.9, style: 'none' }, out: { dur: 0.5, style: 'none' },
    },
    draw(g, t, ctx) {
      const { p, S, W, H } = ctx;
      const rtl = p.side === 'auto' ? D.isArabic(p.title) : p.side === 'right';
      const accent = p.accent || ctx.C.copper || '#A86F3F';
      const size = p.size * S, sub = p.subSize * S;
      const margin = p.at[0] * W;
      const x = rtl ? W - margin : margin;
      const y = p.at[1] * H;
      const barH = size + sub * 1.6;
      const bk = ease.architectural(range(t, 0, 0.55)) * (1 - ease.exit(range(t, ctx.dur - ctx.outD + 0.15, ctx.dur)));
      g.save(); g.fillStyle = accent;
      g.fillRect(rtl ? x - 4 * S : x, y - barH / 2 + (barH * (1 - bk)) / 2, 4 * S, barH * bk);
      g.restore();
      const gap = 22 * S;
      const tx = rtl ? x - 4 * S - gap : x + 4 * S + gap;
      const wk = ease.glide(range(t, 0.2, 0.85)) * (1 - ease.glide(ctx.pout));
      D.setFont(g, { role: 'display', weight: 600, size, text: p.title });
      const tw = Math.max(D.measure(g, p.title), 10);
      D.setFont(g, { role: 'text', weight: 400, size: sub, text: p.subtitle });
      const sw = D.measure(g, p.subtitle || '', 2 * S);
      // generous box: Arabic finals (م ن ى) and descenders reach past the advance width
      const boxW = Math.max(tw, sw) + size * 0.45;
      g.save();
      if (rtl) D.clipRect(g, tx - boxW * wk, y - barH, boxW * wk, barH * 2.4);
      else D.clipRect(g, tx, y - barH, boxW * wk, barH * 2.4);
      textShadow(g, ctx, p.shadow);
      const slide = (1 - wk) * 40 * S * (rtl ? 1 : -1);
      D.setFont(g, { role: 'display', weight: 600, size, text: p.title });
      g.fillStyle = p.color;
      D.text(g, p.title, tx + slide, y - barH / 2 + size * 0.95, { align: rtl ? 'right' : 'left' });
      if (p.subtitle) {
        g.globalAlpha *= ease.outCubic(range(t, 0.45, 1.0));
        D.setFont(g, { role: 'text', weight: 400, size: sub, text: p.subtitle });
        g.fillStyle = p.subColor;
        D.text(g, p.subtitle, tx + slide, y - barH / 2 + size + sub * 1.25, { align: rtl ? 'right' : 'left', tracking: 2 * S });
      }
      g.restore();
    },
  });

  // ---------------------------------------------------------------------------
  // priceTag: label + value. The value never animates through fake numbers unless count:true.
  D.register('priceTag', {
    description: 'Price reveal: label, value rising from a mask, copper underline. Values come only from the brief.',
    defaults: {
      label: 'السعر', value: '', currency: '', at: [0.5, 0.7], align: 'auto', size: 110, labelSize: 34,
      color: '#FFFFFF', accent: null, count: false, shadow: true, in: { dur: 1.0, style: 'none' }, out: { dur: 0.5, style: 'fade' },
    },
    draw(g, t, ctx) {
      const { p, S, W } = ctx;
      const accent = p.accent || ctx.C.copperLight || '#C08A5A';
      const [ax, ay] = D.at(ctx, p.at);
      const align = D.alignFor(p.label + p.value, p.align);
      const size = p.size * S;
      let value = String(p.value);
      if (p.count) {
        const num = Number(String(p.value).replace(/[^\d.]/g, ''));
        if (num) {
          const k = ease.outExpo(range(t, 0.2, 1.4));
          value = Math.round(num * k).toLocaleString('en-US');
        }
      }
      const full = p.currency ? `${value} ${p.currency}` : value;
      g.save(); textShadow(g, ctx, p.shadow);
      D.setFont(g, { role: 'text', weight: 400, size: p.labelSize * S, text: p.label });
      g.globalAlpha *= ease.outCubic(range(t, 0, 0.5));
      g.fillStyle = 'rgba(255,255,255,0.8)';
      D.text(g, p.label, ax, ay - size * 0.95, { align: align === 'center' ? 'center' : align, tracking: 3 * S });
      g.restore();
      g.save();
      D.clipRect(g, 0, ay - size * 0.9, W, size * 1.15);
      textShadow(g, ctx, p.shadow);
      const k = ease.architectural(range(t, 0.15, 0.95));
      D.setFont(g, { role: 'display', weight: 600, size, text: full });
      g.fillStyle = p.color;
      D.text(g, full, ax, ay + (1 - k) * size, { align });
      g.restore();
      const w = D.measure(g, full);
      const uk = ease.architectural(range(t, 0.5, 1.2));
      const x0 = align === 'right' ? ax : align === 'left' ? ax : ax - w / 2;
      const dir = align === 'right' ? -1 : 1;
      g.save(); g.strokeStyle = accent; g.lineWidth = 3 * S;
      D.line(g, x0, ay + size * 0.28, x0 + dir * w, ay + size * 0.28, uk);
      g.restore();
    },
  });

  // ---------------------------------------------------------------------------
  // counter: "01 / 03" with a short rule above (brand pagination). Number slides in.
  D.register('counter', {
    description: 'Brand pagination "01 / 03" with a rule above it. Use on carousels and chaptered films.',
    defaults: { index: 1, total: 3, at: [0.085, 0.86], size: 64, color: null, accent: null, in: { dur: 0.8, style: 'none' }, out: { dur: 0.4, style: 'fade' } },
    draw(g, t, ctx) {
      const { p, S } = ctx;
      const color = p.color || ctx.C.ink || '#151412';
      const accent = p.accent || ctx.C.copper || '#A86F3F';
      const [x, y] = D.at(ctx, p.at);
      const rk = ease.architectural(range(t, 0, 0.7));
      g.save(); g.strokeStyle = accent; g.lineWidth = 2.5 * S;
      D.line(g, x, y - p.size * S * 1.05, x + 130 * S, y - p.size * S * 1.05, rk); g.restore();
      const n = String(p.index).padStart(2, '0'), tot = ` / ${String(p.total).padStart(2, '0')}`;
      g.save();
      D.clipRect(g, x - 4 * S, y - p.size * S, 400 * S, p.size * S * 1.25);
      const k = ease.architectural(range(t, 0.15, 0.8));
      g.fillStyle = color;
      D.setFont(g, { role: 'label', weight: 500, size: p.size * S, text: n });
      D.text(g, n, x, y + (1 - k) * p.size * S, { align: 'left' });
      const nw = D.measure(g, n);
      D.setFont(g, { role: 'label', weight: 400, size: p.size * S * 0.5, text: tot });
      g.globalAlpha *= ease.outCubic(range(t, 0.35, 0.9));
      D.text(g, tot, x + nw + 6 * S, y, { align: 'left' });
      g.restore();
    },
  });
})();
