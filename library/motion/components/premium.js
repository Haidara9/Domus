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

  // Diagonal light band across a clipped region (one pass between t0 and t1).
  function sheenPass(g, x, y, w, h, t, t0, t1, a = 0.22) {
    const k = range(t, t0, t1); if (k <= 0 || k >= 1) return;
    const bx = x - w * 0.4 + (w * 1.8) * ease.inOutSine(k);
    g.save(); D.clipRect(g, x, y, w, h); g.globalCompositeOperation = 'lighter';
    const gr = g.createLinearGradient(bx - h * 0.6, y, bx + h * 0.6, y + h);
    gr.addColorStop(0, 'rgba(255,240,220,0)'); gr.addColorStop(0.5, `rgba(255,240,220,${a})`); gr.addColorStop(1, 'rgba(255,240,220,0)');
    g.fillStyle = gr; g.fillRect(x, y, w, h); g.restore();
  }
  D.sheenPass = sheenPass;

  // ---------------------------------------------------------------------------
  D.register('tagCard', {
    description: 'Architectural tag v2: diamond anchor with rotating dashed ring and copper/teal pulses, metal leader with spark head, petrol-glass card whose metal border traces itself, masked Arabic title + Playfair italic sub, light sweep; exits by reversing. Pair with props.track (trackMode position).',
    defaults: {
      anchor: [0.5, 0.5], offset: [0.14, -0.16], title: 'واجهة زجاجية', sub: 'Glass Frontage', size: 48, subSize: 24,
      trackMode: 'position', in: { dur: 1.1, style: 'none' }, out: { dur: 0.6, style: 'none' },
    },
    draw(g, t, ctx) {
      const { p, S, W, H, dur } = ctx;
      const P = D.PAL();
      const [ax, ay] = D.at(ctx, p.anchor);
      const ex = ax + p.offset[0] * W, ey = ay + p.offset[1] * H;
      const right = ex >= ax, dir = right ? 1 : -1;
      const o = ease.inOutCubic(range(t, dur - ctx.outD, dur));
      const oText = range(o, 0, 0.35), oPlate = ease.inOutCubic(range(o, 0.15, 0.7)), oLead = range(o, 0.45, 0.9), oAnchor = range(o, 0.7, 1);
      // ---- anchor
      const dk = D.springP(t, 'snappy') * (1 - ease.inCubic(oAnchor));
      if (dk > 0.001) {
        g.save();
        for (let r = 0; r < 2; r++) {
          const ph = ((t + r * 0.7) % 1.4) / 1.4;
          g.strokeStyle = r ? D.rgba(P.tealHi, 0.75 * (1 - ph)) : D.rgba(P.goldHi, 0.8 * (1 - ph)); g.lineWidth = 2 * S;
          g.beginPath(); g.arc(ax, ay, (10 + 34 * ph) * S * dk, 0, Math.PI * 2); g.stroke();
        }
        g.save(); g.translate(ax, ay); g.rotate(t * 1.4); g.setLineDash([5 * S, 7 * S]);
        g.strokeStyle = D.rgba(P.goldHi, 0.85); g.lineWidth = 1.6 * S; g.beginPath(); g.arc(0, 0, 21 * S * dk, 0, Math.PI * 2); g.stroke(); g.restore();
        for (let i = 0; i < 4; i++) { const an = (i * Math.PI) / 2; D.line(g, ax + Math.cos(an) * 25 * S * dk, ay + Math.sin(an) * 25 * S * dk, ax + Math.cos(an) * 33 * S * dk, ay + Math.sin(an) * 33 * S * dk, 1, { width: 1.6 * S, color: D.rgba(P.goldHi, 0.9) }); }
        g.translate(ax, ay); g.rotate(Math.PI / 4); const d = 8.5 * S * dk;
        g.shadowColor = D.rgba(P.ember, 0.9); g.shadowBlur = 16 * S;
        g.fillStyle = D.metal(g, -d, -d, d, d, 0.5); g.fillRect(-d, -d, d * 2, d * 2);
        g.shadowBlur = 0; g.fillStyle = '#FFF8EE'; g.fillRect(-d * 0.32, -d * 0.32, d * 0.64, d * 0.64);
        g.restore();
      }
      // ---- leader
      const lead = [[ax, ay], [ex, ey], [ex + dir * 22 * S, ey]];
      const lk = ease.glide(range(t, 0.12, 0.55));
      const lEnd = lk * (1 - oLead);
      if (lEnd > 0) {
        D.polylineRange(g, lead, 0, lEnd, { width: 5 * S, color: 'rgba(10,8,6,0.35)' });
        g.save(); g.shadowColor = D.rgba(P.ember, 0.7); g.shadowBlur = 10 * S;
        D.polylineRange(g, lead, 0, lEnd, { width: 2.4 * S, color: D.metal(g, ax, ay, ex, ey, ((t * 0.7) % 1.6) - 0.3) });
        g.restore();
        if (lk < 1) { const [hx, hy] = D.pathPoint(lead, lk); D.spark(g, hx, hy, 26 * S, 1); }
        else if (o <= 0) { const u = ((t - 0.55) % 1.8) / 1.8; if (u < 0.6) { const [gx, gy] = D.pathPoint(lead, u / 0.6); D.spark(g, gx, gy, 20 * S, 0.8, { flare: 0.7 }); } }
      }
      // ---- card geometry
      D.setFont(g, { role: 'display', weight: 800, size: p.size * S, text: p.title });
      const tw = D.measure(g, p.title);
      g.font = `italic 400 ${Math.round(p.subSize * S)}px ${D.fontFamily('text', 'a', 'en')}`;
      const sw = p.sub ? D.measure(g, p.sub) + 2 * S * p.sub.length * 0.5 : 0;
      const padX = 30 * S, cw = Math.max(tw, sw) + padX * 2 + 8 * S, ch = (p.size + (p.sub ? p.subSize + 26 : 12)) * S + 38 * S;
      const cx0 = right ? ex + 22 * S : ex - 22 * S - cw, cy0 = ey - ch / 2;
      const wk = ease.glide(range(t, 0.42, 0.88)) * (1 - oPlate);
      if (wk > 0) {
        g.save();
        const wpx = cw * wk;
        D.clipRect(g, right ? cx0 - 2 : cx0 + cw - wpx - 2, cy0 - 30 * S, wpx + 4, ch + 60 * S);
        g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 36 * S; g.shadowOffsetY = 10 * S;
        const pg = g.createLinearGradient(right ? cx0 : cx0 + cw, 0, right ? cx0 + cw : cx0, 0);
        pg.addColorStop(0, 'rgba(14,46,50,0.84)'); pg.addColorStop(0.55, 'rgba(16,24,24,0.74)'); pg.addColorStop(1, 'rgba(18,14,11,0.68)');
        g.fillStyle = pg; D.roundRect(g, cx0, cy0, cw, ch, 6 * S); g.fill();
        g.shadowColor = 'transparent';
        // top inner highlight
        const hg = g.createLinearGradient(cx0, 0, cx0 + cw, 0);
        hg.addColorStop(0, 'rgba(127,193,188,0)'); hg.addColorStop(0.5, 'rgba(127,193,188,0.45)'); hg.addColorStop(1, 'rgba(127,193,188,0)');
        g.fillStyle = hg; g.fillRect(cx0 + 10 * S, cy0 + 1.5 * S, cw - 20 * S, 1.2 * S);
        // metal accent bar on the leader side
        g.fillStyle = D.metal(g, 0, cy0, 0, cy0 + ch, ((t * 0.6) % 1.6) - 0.3);
        g.fillRect(right ? cx0 : cx0 + cw - 5 * S, cy0 + 8 * S, 5 * S, ch - 16 * S);
        g.restore();
      }
      // border traces itself from the leader joint around the card
      const bk = ease.inOutCubic(range(t, 0.5, 1.15)) * (1 - ease.inOutCubic(range(o, 0.05, 0.55)));
      if (bk > 0) {
        const jx = right ? cx0 : cx0 + cw, my = cy0 + ch / 2, fx = right ? cx0 + cw : cx0;
        const half1 = [[jx, my], [jx, cy0], [fx, cy0], [fx, my]], half2 = [[jx, my], [jx, cy0 + ch], [fx, cy0 + ch], [fx, my]];
        for (const h of [half1, half2]) D.polyline(g, h, bk, { width: 1.5 * S, color: D.metal(g, cx0, cy0, cx0 + cw, cy0 + ch, ((t * 0.4) % 1.6) - 0.3), cap: 'square', join: 'miter' });
        const ck = ease.architectural(range(t, 0.95, 1.35)) * (1 - oText);
        const L = 14 * S, m = 7 * S;
        D.bracket(g, fx + (right ? m : -m), cy0 - m, L, right ? -1 : 1, 1, ck, { width: 2 * S, color: P.goldHi });
        D.bracket(g, fx + (right ? m : -m), cy0 + ch + m, L, right ? -1 : 1, -1, ck, { width: 2 * S, color: P.goldHi });
      }
      // ---- text
      if (wk > 0) {
        g.save(); g.globalAlpha *= 1 - ease.inCubic(oText);
        D.clipRect(g, cx0, cy0, cw, ch);
        const tx = right ? cx0 + cw - padX : cx0 + cw - padX - 8 * S;
        const ty = cy0 + 20 * S + p.size * S * 0.92 + oText * 20 * S;
        g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 8 * S;
        maskedWords(g, p.title, tx, ty, { size: p.size * S, weight: 800, color: '#FFFFFF', t, t0: 0.6, align: 'right' });
        if (p.sub) {
          const sk = ease.architectural(range(t, 0.88, 1.3));
          // divider: copper rule + teal dot
          const dw = 34 * S * sk;
          g.fillStyle = P.copperLight; g.fillRect(tx - dw, ty + 12 * S, dw, 2 * S);
          D.dot(g, tx - dw - 7 * S, ty + 13 * S, 2.6 * S * sk, P.tealHi);
          g.globalAlpha *= sk; g.fillStyle = P.gold;
          g.font = `italic 400 ${Math.round(p.subSize * S)}px ${D.fontFamily('text', 'a', 'en')}`;
          D.text(g, p.sub, tx, ty + (p.subSize + 22) * S + (1 - sk) * 10 * S, { align: 'right', tracking: 1 * S });
        }
        g.restore();
        sheenPass(g, cx0, cy0, cw, ch, t, 1.05, 1.75, 0.2);
      }
    },
  });

  // ---------------------------------------------------------------------------
  D.register('chapter', {
    description: 'Chapter marker v2: soft dark backdrop, big Playfair number rolls up with a light pass, metal rule draws up with a spark, Arabic title words rise, English small caps settle, chapter progress segments fill.',
    defaults: { index: 1, total: 4, title: 'الواجهة', sub: 'THE FRONTAGE', at: [0.055, 0.86], size: 116, in: { dur: 1.0, style: 'none' }, out: { dur: 0.5, style: 'none' } },
    draw(g, t, ctx) {
      const { p, S, dur, W, H } = ctx;
      const P = D.PAL();
      const [x, y] = D.at(ctx, p.at);
      const outK = ease.exit(range(t, dur - ctx.outD, dur));
      const n = String(p.index).padStart(2, '0');
      // backdrop for legibility
      const bk = ease.outCubic(range(t, 0, 0.6)) * (1 - outK);
      g.save(); g.globalAlpha *= bk;
      const rg = g.createRadialGradient(x + 200 * S, y - 40 * S, 10 * S, x + 200 * S, y - 40 * S, 520 * S);
      rg.addColorStop(0, 'rgba(6,14,16,0.55)'); rg.addColorStop(1, 'rgba(6,14,16,0)');
      g.fillStyle = rg; g.fillRect(0, y - 520 * S, Math.min(W, x + 760 * S), H - (y - 520 * S));
      g.restore();
      // number (white -> gold) rolling up out of its mask
      const nk = ease.architectural(range(t, 0, 0.7));
      g.save(); g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 18 * S;
      g.font = `500 ${Math.round(p.size * S)}px ${D.fontFamily('display', 'a', 'en')}`;
      const nw = D.measure(g, n);
      D.clipRect(g, x - 10 * S, y - p.size * S * 0.95, nw + 20 * S, p.size * S * 1.12);
      const ng = g.createLinearGradient(0, y - p.size * S * 0.75, 0, y);
      ng.addColorStop(0, '#FFFFFF'); ng.addColorStop(0.6, '#FFF3DF'); ng.addColorStop(1, P.gold);
      g.fillStyle = ng;
      D.text(g, n, x, y + (1 - nk) * p.size * S + outK * p.size * S, { align: 'left' });
      g.restore();
      D.sheenMasked(g, x - 10 * S, y - p.size * S * 0.95, nw + 20 * S, p.size * S * 1.12, t, 0.75, 1.35, 0.6, (o) => {
        o.fillStyle = '#fff'; o.font = `500 ${Math.round(p.size * S)}px ${D.fontFamily('display', 'a', 'en')}`; o.textAlign = 'left'; o.direction = 'ltr'; o.fillText(n, x, y);
      });
      // total
      g.save(); g.globalAlpha *= ease.outCubic(range(t, 0.3, 0.8)) * (1 - outK); g.fillStyle = 'rgba(255,255,255,0.78)';
      g.font = `italic 400 ${Math.round(p.size * 0.28 * S)}px ${D.fontFamily('display', 'a', 'en')}`;
      const tot = `/ ${String(p.total).padStart(2, '0')}`;
      D.text(g, tot, x + nw + 10 * S, y, { align: 'left' });
      const totW = D.measure(g, tot);
      g.restore();
      // metal rule drawing upwards with a spark
      const rx = x + nw + 10 * S + totW + 28 * S;
      const rk = ease.glide(range(t, 0.25, 0.75)) * (1 - ease.glide(outK));
      const rp = [[rx, y + 6 * S], [rx, y + 6 * S - p.size * S * 0.9]];
      if (rk > 0) {
        g.save(); g.shadowColor = D.rgba(P.ember, 0.8); g.shadowBlur = 10 * S;
        D.polyline(g, rp, rk, { width: 3 * S, color: D.metal(g, rx, rp[1][1], rx, rp[0][1], ((t * 0.6) % 1.6) - 0.3), cap: 'butt' });
        g.restore();
        if (rk < 1 && outK <= 0) { const [hx, hy] = D.pathPoint(rp, rk); D.spark(g, hx, hy, 22 * S, 1); }
      }
      // titles
      g.save(); g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 16 * S;
      const tx = rx + 26 * S;
      D.setFont(g, { role: 'display', weight: 800, size: p.size * 0.44 * S, text: p.title });
      const tw = D.measure(g, p.title);
      g.globalAlpha *= 1 - outK;
      maskedWords(g, p.title, tx + tw, y - p.size * 0.38 * S, { size: p.size * 0.44 * S, weight: 800, color: '#FFFFFF', t, t0: 0.45, align: 'right' });
      const sk = ease.architectural(range(t, 0.7, 1.1));
      g.globalAlpha *= sk; g.fillStyle = P.gold;
      g.font = `600 ${Math.round(p.size * 0.16 * S)}px ${D.fontFamily('display', 'a', 'en')}`;
      D.text(g, p.sub, tx, y + (1 - sk) * 6 * S, { align: 'left', tracking: 5 * S });
      g.restore();
      // progress segments under the number
      const segW = 30 * S, gap = 7 * S, sy = y + 22 * S;
      for (let i = 0; i < p.total; i++) {
        const k = ease.architectural(range(t, 0.5 + i * 0.06, 0.9 + i * 0.06)) * (1 - outK);
        if (k <= 0) continue;
        const sx = x + i * (segW + gap);
        g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(sx, sy, segW * k, 3 * S);
        if (i + 1 < p.index) { g.fillStyle = P.copperLight; g.fillRect(sx, sy, segW * k, 3 * S); }
        if (i + 1 === p.index) { const f = ease.glide(range(t, 0.8, 1.4)) * (1 - outK); g.fillStyle = D.metal(g, sx, 0, sx + segW, 0, 0.5); g.fillRect(sx, sy, segW * f, 3 * S); if (f > 0 && f < 1) D.spark(g, sx + segW * f, sy + 1.5 * S, 12 * S, 1, { flare: 0.6 }); }
      }
    },
  });

  // ---------------------------------------------------------------------------
  D.register('strokeWord', {
    description: 'Huge display word drawn as a metal (copper -> gold) outline wiping in reading direction with a spark on the wipe edge, then a soft fill breathes in and a sheen travels the outline.',
    defaults: { text: 'مكتب', at: [0.82, 0.62], size: 300, align: 'center', fill: 0.12, color: null, in: { dur: 1.2, style: 'none' }, out: { dur: 0.5, style: 'fade' }, loop: { style: 'drift', amp: 1, period: 8 } },
    draw(g, t, ctx) {
      const { p, S } = ctx;
      const P = D.PAL();
      const [x, y] = D.at(ctx, p.at);
      const rtl = D.isArabic(p.text);
      D.setFont(g, { role: 'display', weight: 900, size: p.size * S, text: p.text });
      const w = D.measure(g, p.text);
      const x0 = p.align === 'center' ? x - w / 2 : p.align === 'right' ? x - w : x;
      const k = ease.glide(range(t, 0, 1.0));
      const pad = p.size * 0.3 * S;
      const edge = rtl ? x0 + w * (1 - k) : x0 + w * k;
      g.save();
      if (rtl) D.clipRect(g, x0 + w * (1 - k) - pad * (k >= 1 ? 1 : 0), y - p.size * S * 1.3, w * k + pad * 2, p.size * S * 1.8);
      else D.clipRect(g, x0 - pad, y - p.size * S * 1.3, w * k + pad * (k >= 1 ? 2 : 0), p.size * S * 1.8);
      g.direction = rtl ? 'rtl' : 'ltr'; g.textAlign = 'left';
      g.lineWidth = (p.width || 2.4) * S + 3 * S; g.strokeStyle = 'rgba(20,12,6,0.3)'; g.strokeText(p.text, x0, y);
      g.lineWidth = (p.width || 2.4) * S; g.strokeStyle = p.color || D.metal(g, x0, y - p.size * S, x0 + w, y, ((t * 0.45) % 1.6) - 0.3, 0.18);
      g.shadowColor = D.rgba(P.ember, 0.6); g.shadowBlur = 14 * S;
      g.strokeText(p.text, x0, y);
      g.shadowColor = 'transparent';
      g.globalAlpha *= p.fill * ease.inOutSine(range(t, 0.8, 1.6));
      const fg = g.createLinearGradient(0, y - p.size * S, 0, y);
      fg.addColorStop(0, '#FFF1DC'); fg.addColorStop(1, P.gold);
      g.fillStyle = fg; g.fillText(p.text, x0, y);
      g.restore();
      if (k > 0 && k < 1) for (let i = 0; i < 3; i++) D.spark(g, edge, y - p.size * S * (0.15 + i * 0.3), 22 * S, 0.8, { flare: 0.8 });
    },
  });

  // ---------------------------------------------------------------------------
  D.register('introTitle', {
    description: 'Opening v2: petrol glow on black, a double metal arch rises from both bases with spark heads and meets at the apex in a flash, columns draw inside, Arabic headline rises word by word with a light pass, metal rule + English italic, gold dust drifts.',
    defaults: { title: 'مكتب للبيع', sub: 'Office for sale', at: [0.5, 0.52], size: 124, in: { dur: 0.01, style: 'none' }, out: { dur: 0.3, style: 'fade' } },
    draw(g, t, ctx) {
      const { p, S, W, H } = ctx;
      const P = D.PAL();
      const [cx, cy] = D.at(ctx, p.at);
      // ambient colour: petrol glow + warm core
      const gk = ease.outCubic(range(t, 0, 0.8));
      g.save(); g.globalAlpha *= gk;
      let rg = g.createRadialGradient(cx, cy, 0, cx, cy, 760 * S);
      rg.addColorStop(0, 'rgba(30,86,92,0.42)'); rg.addColorStop(0.55, 'rgba(18,58,64,0.18)'); rg.addColorStop(1, 'rgba(18,58,64,0)');
      g.fillStyle = rg; g.fillRect(0, 0, W, H);
      rg = g.createRadialGradient(cx, cy - 40 * S, 0, cx, cy - 40 * S, 360 * S);
      rg.addColorStop(0, 'rgba(242,166,90,0.16)'); rg.addColorStop(1, 'rgba(242,166,90,0)');
      g.fillStyle = rg; g.fillRect(0, 0, W, H);
      g.restore();
      // dust
      const r = D.rng(11);
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 46; i++) {
        const x0 = cx + (r() - 0.5) * 900 * S, y0 = cy + (r() - 0.3) * 520 * S, sp = 20 + r() * 50, sz = (0.6 + r() * 1.8) * S;
        const yy = y0 - t * sp * S, a = (0.25 + 0.5 * r()) * gk * (0.6 + 0.4 * Math.sin(t * 3 + i));
        D.dot(g, x0 + Math.sin(t * 0.8 + i) * 8 * S, yy, sz, D.rgba(i % 4 ? P.goldHi : P.tealHi, a));
      }
      g.restore();
      // double arch rising from both bases
      const arches = [[560, 1.8, 0], [606, 1.1, 0.1]];
      for (const [w, lw, d] of arches) {
        const pts = D.archPoints(cx, cy + 150 * S, w * S, 260 * S);
        const k = ease.glide(range(t, d, 0.85 + d));
        if (k <= 0) continue;
        const mg = D.metal(g, cx - w * S / 2, cy - 300 * S, cx + w * S / 2, cy + 150 * S, ((t * 0.5) % 1.6) - 0.3);
        g.save(); g.shadowColor = D.rgba(P.ember, 0.7); g.shadowBlur = 12 * S;
        D.polylineRange(g, pts, 0, k / 2, { width: lw * S, color: mg }); D.polylineRange(g, pts, 1 - k / 2, 1, { width: lw * S, color: mg });
        g.restore();
        if (k < 1 && !d) { const [ax, ay] = D.pathPoint(pts, k / 2), [bx, by] = D.pathPoint(pts, 1 - k / 2); D.spark(g, ax, ay, 26 * S, 1); D.spark(g, bx, by, 26 * S, 1); }
      }
      // apex flash when the halves meet
      const fk = range(t, 0.82, 1.2);
      if (fk > 0 && fk < 1) D.spark(g, cx, cy + 150 * S - 260 * S - 280 * S, 120 * S * (1 - fk * 0.4), 1 - fk, { flare: 1.3 });
      // columns inside the arch
      const ck = ease.architectural(range(t, 0.55, 1.1));
      for (const dx of [-0.3, 0.3]) D.line(g, cx + dx * 560 * S, cy + 150 * S, cx + dx * 560 * S, cy + 150 * S - 250 * S * ck, 1, { width: 1 * S, color: D.rgba(P.gold, 0.55) });
      // title words
      g.save(); g.shadowColor = 'rgba(255,190,120,0.3)'; g.shadowBlur = 34 * S;
      D.setFont(g, { role: 'display', weight: 900, size: p.size * S, text: p.title });
      const tw = D.measure(g, p.title);
      maskedWords(g, p.title, cx + tw / 2, cy, { size: p.size * S, weight: 900, color: '#FFF8EE', t, t0: 0.15, stagger: 0.12, dur: 0.55, align: 'right' });
      g.restore();
      D.sheenMasked(g, cx - tw / 2 - 20 * S, cy - p.size * S * 1.1, tw + 40 * S, p.size * S * 1.5, t, 0.8, 1.35, 0.55, (o) => {
        o.fillStyle = '#fff'; D.setFont(o, { role: 'display', weight: 900, size: p.size * S, text: p.title }); o.direction = 'rtl'; o.textAlign = 'right'; o.fillText(p.title, cx + tw / 2, cy);
      });
      // rule + English
      const rk = ease.architectural(range(t, 0.45, 0.95));
      g.save(); g.fillStyle = D.metal(g, cx - 130 * S, 0, cx + 130 * S, 0, 0.5);
      g.fillRect(cx - 130 * S * rk, cy + 43 * S, 260 * S * rk, 2.5 * S); g.restore();
      const ek = ease.architectural(range(t, 0.6, 1.05));
      g.save(); g.globalAlpha *= ek; g.fillStyle = P.gold;
      g.font = `italic 400 ${Math.round(40 * S)}px ${D.fontFamily('display', 'a', 'en')}`;
      D.text(g, p.sub, cx, cy + 100 * S + (1 - ek) * 10 * S, { align: 'center', tracking: 1 * S });
      g.restore();
      // anamorphic streak across the title
      const sk = range(t, 0.7, 1.3);
      if (sk > 0 && sk < 1) {
        const a = Math.sin(Math.PI * sk), L = W * 0.45 * (0.6 + sk * 0.6);
        g.save(); g.globalCompositeOperation = 'lighter';
        const lg = g.createLinearGradient(cx - L, 0, cx + L, 0);
        lg.addColorStop(0, 'rgba(127,193,188,0)'); lg.addColorStop(0.3, `rgba(127,193,188,${0.25 * a})`); lg.addColorStop(0.5, `rgba(255,236,200,${0.7 * a})`); lg.addColorStop(0.7, `rgba(127,193,188,${0.25 * a})`); lg.addColorStop(1, 'rgba(127,193,188,0)');
        g.fillStyle = lg; g.fillRect(cx - L, cy - p.size * S * 0.38 - 2 * S, L * 2, 4 * S);
        g.restore();
      }
    },
  });
})();
