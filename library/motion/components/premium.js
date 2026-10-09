// Premium DOMUS components: architectural tag cards, chapter markers, stroked display words.
// Language: copper accents, dark glass plates, Cairo (AR) paired with Playfair italic (EN), masked word reveals.
(function () {
  const D = window.DOMUS;
  const { ease, range, clamp } = D;

  function words(str) { return String(str || '').split(/\s+/).filter(Boolean); }

  // Draw a line of text word by word, each word rising out of its own mask (RTL-aware layout).
  function maskedWords(g, str, x, y, { size, role = 'display', weight = 700, color, t0 = 0, stagger = 0.07, dur = 0.5, t, align = 'right', lang } = {}) {
    const ws = words(str); if (!ws.length) return 0;
    const rtl = D.isArabic(str);
    D.setFont(g, { role, weight, size, text: str, lang });
    const space = D.measure(g, ' ');
    const widths = ws.map((w) => D.measure(g, w));
    const total = widths.reduce((a, b) => a + b, 0) + space * (ws.length - 1);
    let cursor = align === 'right' ? x : align === 'left' ? x : x - total / 2;
    // visual order: RTL places the first word at the right edge
    const order = ws.map((w, i) => ({ w, i, wd: widths[i] }));
    if (rtl) {
      let px = align === 'left' ? x + total : align === 'center' ? x + total / 2 : x;
      for (const o of order) { o.x = px - o.wd; px -= o.wd + space; }
    } else {
      let px = align === 'right' ? x - total : align === 'center' ? x - total / 2 : x;
      for (const o of order) { o.x = px; px += o.wd + space; }
    }
    for (const o of order) {
      const k = ease.architectural(range(t, t0 + o.i * stagger, t0 + o.i * stagger + dur));
      if (k <= 0) continue;
      g.save();
      D.clipRect(g, o.x - size * 0.3, y - size * 1.15, o.wd + size * 0.6, size * 1.55);
      g.fillStyle = color;
      D.setFont(g, { role, weight, size, text: o.w, lang });
      D.text(g, o.w, o.x, y + (1 - k) * size * 1.1, { align: 'left' });
      g.restore();
    }
    void cursor;
    return total;
  }
  D.maskedWords = maskedWords;

  // ---------------------------------------------------------------------------
  D.register('tagCard', {
    description: 'Architectural tag: pulsing copper anchor on a real feature, elbow leader that draws, dark glass card with copper edge; Arabic title (Cairo) + English sub (Playfair italic), words rise from masks. Pair with props.track (trackMode position).',
    defaults: {
      anchor: [0.5, 0.5], offset: [0.14, -0.16], title: 'واجهة زجاجية', sub: 'Glass Frontage', size: 46, subSize: 24,
      trackMode: 'position', in: { dur: 1.1, style: 'none' }, out: { dur: 0.45, style: 'none' },
    },
    draw(g, t, ctx) {
      const { p, S, W, H, dur } = ctx;
      const copper = ctx.C.copperLight || '#C08A5A', deep = ctx.C.copper || '#A86F3F';
      const [ax, ay] = D.at(ctx, p.anchor);
      const ex = ax + p.offset[0] * W, ey = ay + p.offset[1] * H;
      const right = ex >= ax;
      const outK = ease.exit(range(t, dur - ctx.outD, dur));
      const vis = 1 - outK;
      // anchor: dot + two expanding rings
      const dk = D.springP(t, 'snappy');
      g.save(); g.globalAlpha *= vis;
      for (let r = 0; r < 2; r++) {
        const ph = ((t + r * 0.7) % 1.4) / 1.4;
        g.strokeStyle = `rgba(232,178,122,${(0.7 * (1 - ph)).toFixed(3)})`; g.lineWidth = 2 * S;
        g.beginPath(); g.arc(ax, ay, (8 + 30 * ph) * S * dk, 0, Math.PI * 2); g.stroke();
      }
      D.dot(g, ax, ay, 8 * S * dk, copper); D.dot(g, ax, ay, 3.2 * S * dk, '#FFF6EA');
      // leader: anchor -> elbow -> card edge
      const lk = ease.glide(range(t, 0.1, 0.55)) * (1 - ease.glide(range(t, dur - ctx.outD, dur - ctx.outD * 0.4)));
      g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 8 * S;
      D.polyline(g, [[ax, ay], [ex, ey], [ex + (right ? 1 : -1) * 18 * S, ey]], lk, { width: 2 * S, color: '#F4E3CC', cap: 'round', join: 'round' });
      g.restore();
      // card
      D.setFont(g, { role: 'display', weight: 700, size: p.size * S, text: p.title });
      const tw = D.measure(g, p.title);
      D.setFont(g, { role: 'text', weight: 400, size: p.subSize * S, text: p.sub, lang: 'en' });
      const sw = p.sub ? D.measure(g, p.sub) : 0;
      const padX = 26 * S, cw = Math.max(tw, sw) + padX * 2, ch = (p.size + (p.sub ? p.subSize + 22 : 10)) * S + 34 * S;
      const cx0 = right ? ex + 18 * S : ex - 18 * S - cw, cy0 = ey - ch / 2;
      const wk = ease.glide(range(t, 0.4, 0.9)) * vis;
      if (wk > 0) {
        g.save();
        const wpx = cw * wk;
        D.clipRect(g, right ? cx0 : cx0 + cw - wpx, cy0 - 4 * S, wpx, ch + 8 * S);
        g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 30 * S; g.shadowOffsetY = 8 * S;
        g.fillStyle = 'rgba(18,15,12,0.58)';
        D.roundRect(g, cx0, cy0, cw, ch, 10 * S); g.fill();
        g.shadowColor = 'transparent';
        // copper edge on the leader side + hairline border
        g.fillStyle = deep; g.fillRect(right ? cx0 : cx0 + cw - 4 * S, cy0 + 10 * S, 4 * S, ch - 20 * S);
        g.strokeStyle = 'rgba(232,178,122,0.35)'; g.lineWidth = 1 * S; D.roundRect(g, cx0 + 0.5, cy0 + 0.5, cw - 1, ch - 1, 10 * S); g.stroke();
        g.restore();
        g.save(); g.globalAlpha *= vis;
        D.clipRect(g, cx0, cy0, cw, ch);
        const ty = cy0 + 18 * S + p.size * S * 0.92;
        maskedWords(g, p.title, cx0 + cw - padX, ty, { size: p.size * S, color: '#FFFFFF', t, t0: 0.55, align: 'right' });
        if (p.sub) {
          const sk = ease.architectural(range(t, 0.85, 1.25));
          g.globalAlpha *= sk; g.fillStyle = '#E8B27A';
          D.setFont(g, { role: 'text', weight: 400, size: p.subSize * S, text: p.sub, lang: 'en' });
          g.font = `italic 400 ${Math.round(p.subSize * S)}px ${D.fontFamily('text', 'a', 'en')}`;
          D.text(g, p.sub, cx0 + cw - padX, ty + (p.subSize + 14) * S + (1 - sk) * 8 * S, { align: 'right', tracking: 0.5 * S });
        }
        g.restore();
      }
    },
  });

  // ---------------------------------------------------------------------------
  D.register('chapter', {
    description: 'Chapter marker: large Playfair number rolls up, copper rule draws, Arabic title + English small caps wipe in. Brand counter language, for 2-4 s per section.',
    defaults: { index: 1, total: 4, title: 'الواجهة', sub: 'THE FRONTAGE', at: [0.055, 0.86], size: 110, in: { dur: 1.0, style: 'none' }, out: { dur: 0.5, style: 'none' } },
    draw(g, t, ctx) {
      const { p, S, dur } = ctx;
      const copper = ctx.C.copperLight || '#C08A5A';
      const [x, y] = D.at(ctx, p.at);
      const outK = ease.exit(range(t, dur - ctx.outD, dur));
      const n = String(p.index).padStart(2, '0');
      g.save(); g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 18 * S;
      // number
      const nk = ease.architectural(range(t, 0, 0.7));
      D.clipRect(g, x - 10 * S, y - p.size * S * 0.95, 400 * S, p.size * S * 1.12);
      g.fillStyle = '#FFFFFF';
      g.font = `400 ${Math.round(p.size * S)}px ${D.fontFamily('display', 'a', 'en')}`;
      D.text(g, n, x, y + (1 - nk) * p.size * S + outK * p.size * S, { align: 'left' });
      const nw = D.measure(g, n);
      g.restore();
      // total
      g.save(); g.globalAlpha *= ease.outCubic(range(t, 0.3, 0.8)) * (1 - outK); g.fillStyle = 'rgba(255,255,255,0.75)';
      g.font = `italic 400 ${Math.round(p.size * 0.28 * S)}px ${D.fontFamily('display', 'a', 'en')}`;
      D.text(g, `/ ${String(p.total).padStart(2, '0')}`, x + nw + 10 * S, y, { align: 'left' });
      g.restore();
      // vertical copper rule (after the number and its "/ 04")
      g.save(); g.font = `italic 400 ${Math.round(p.size * 0.28 * S)}px ${D.fontFamily('display', 'a', 'en')}`;
      const totW = D.measure(g, `/ ${String(p.total).padStart(2, '0')}`); g.restore();
      const rx = x + nw + 10 * S + totW + 28 * S;
      const rk = ease.glide(range(t, 0.25, 0.75)) * (1 - ease.glide(outK));
      g.save(); g.strokeStyle = copper; g.lineWidth = 2.5 * S;
      D.line(g, rx, y + 6 * S, rx, y + 6 * S - p.size * S * 0.85, rk); g.restore();
      // titles (left aligned after the rule; Arabic still shapes RTL)
      g.save(); g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 16 * S;
      const tx = rx + 26 * S;
      D.setFont(g, { role: 'display', weight: 700, size: p.size * 0.42 * S, text: p.title });
      const tw = D.measure(g, p.title);
      g.globalAlpha *= 1 - outK;
      maskedWords(g, p.title, tx + tw, y - p.size * 0.38 * S, { size: p.size * 0.42 * S, color: '#FFFFFF', t, t0: 0.45, align: 'right' });
      const sk = ease.architectural(range(t, 0.7, 1.1));
      g.globalAlpha *= sk; g.fillStyle = '#E8B27A';
      g.font = `500 ${Math.round(p.size * 0.17 * S)}px ${D.fontFamily('display', 'a', 'en')}`;
      D.text(g, p.sub, tx, y + (1 - sk) * 6 * S, { align: 'left', tracking: 5 * S });
      g.restore();
    },
  });

  // ---------------------------------------------------------------------------
  D.register('strokeWord', {
    description: 'Huge display word drawn as a copper outline (wiping in reading direction), then a soft fill breathes in. Architectural typography beside a subject.',
    defaults: { text: 'مكتب', at: [0.82, 0.62], size: 300, align: 'center', fill: 0.12, color: 'rgba(240,190,130,0.95)', in: { dur: 1.2, style: 'none' }, out: { dur: 0.5, style: 'fade' }, loop: { style: 'drift', amp: 1, period: 8 } },
    draw(g, t, ctx) {
      const { p, S } = ctx;
      const [x, y] = D.at(ctx, p.at);
      const rtl = D.isArabic(p.text);
      D.setFont(g, { role: 'display', weight: 900, size: p.size * S, text: p.text });
      const w = D.measure(g, p.text);
      const x0 = p.align === 'center' ? x - w / 2 : p.align === 'right' ? x - w : x;
      const k = ease.glide(range(t, 0, 1.0));
      g.save();
      const pad = p.size * 0.3 * S;
      if (rtl) D.clipRect(g, x0 + w * (1 - k) - pad, y - p.size * S * 1.3, w * k + pad * 2, p.size * S * 1.8);
      else D.clipRect(g, x0 - pad, y - p.size * S * 1.3, w * k + pad * 2, p.size * S * 1.8);
      g.direction = rtl ? 'rtl' : 'ltr'; g.textAlign = 'left';
      g.lineWidth = (p.width || 2.2) * S; g.strokeStyle = p.color;
      g.shadowColor = 'rgba(255,170,90,0.6)'; g.shadowBlur = 12 * S;
      g.strokeText(p.text, x0, y);
      g.shadowColor = 'transparent';
      g.globalAlpha *= p.fill * ease.inOutSine(range(t, 0.8, 1.6));
      g.fillStyle = '#FFE6C8'; g.fillText(p.text, x0, y);
      g.restore();
    },
  });

  // ---------------------------------------------------------------------------
  D.register('introTitle', {
    description: 'Opening: copper arch draws on black, Arabic headline rises word by word, English italic line and rule settle, light streak passes.',
    defaults: { title: 'مكتب للبيع', sub: 'Office for sale', at: [0.5, 0.52], size: 120, in: { dur: 0.01, style: 'none' }, out: { dur: 0.3, style: 'fade' } },
    draw(g, t, ctx) {
      const { p, S, W, H } = ctx;
      const [cx, cy] = D.at(ctx, p.at);
      const copper = ctx.C.copperLight || '#C08A5A';
      // arch (line art) framing the title
      const ak = ease.glide(range(t, 0, 0.9));
      g.save(); g.strokeStyle = 'rgba(196,161,119,0.9)'; g.lineWidth = 1.6 * S;
      D.polyline(g, D.archPoints(cx, cy + 150 * S, 560 * S, 260 * S), ak, { width: 1.6 * S, color: 'rgba(196,161,119,0.85)' });
      D.polyline(g, D.archPoints(cx, cy + 150 * S, 600 * S, 260 * S), ease.glide(range(t, 0.1, 1.0)), { width: 1 * S, color: 'rgba(196,161,119,0.45)' });
      g.restore();
      // title words
      g.save(); g.shadowColor = 'rgba(255,190,120,0.25)'; g.shadowBlur = 30 * S;
      D.setFont(g, { role: 'display', weight: 800, size: p.size * S, text: p.title });
      const tw = D.measure(g, p.title);
      maskedWords(g, p.title, cx + tw / 2, cy, { size: p.size * S, weight: 800, color: '#FFFFFF', t, t0: 0.15, stagger: 0.12, dur: 0.55, align: 'right' });
      g.restore();
      // rule + English
      const rk = ease.architectural(range(t, 0.45, 0.95));
      g.save(); g.strokeStyle = copper; g.lineWidth = 2 * S;
      D.line(g, cx - 120 * S * rk, cy + 44 * S, cx + 120 * S * rk, cy + 44 * S, 1); g.restore();
      const ek = ease.architectural(range(t, 0.6, 1.05));
      g.save(); g.globalAlpha *= ek; g.fillStyle = '#E8B27A';
      g.font = `italic 400 ${Math.round(40 * S)}px ${D.fontFamily('display', 'a', 'en')}`;
      D.text(g, p.sub, cx, cy + 100 * S + (1 - ek) * 10 * S, { align: 'center', tracking: 1 * S });
      g.restore();
      void W; void H;
    },
  });
})();
