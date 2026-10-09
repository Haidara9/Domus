// Hero moments: the area reveal (a solid, extruded metal numeral that lands on the beat) and
// coloured light leaks for transitions. Facts shown here come from the brief only (value/unit props).
(function () {
  const D = window.DOMUS;
  const { ease, range, clamp } = D;

  // ---------------------------------------------------------------------------
  D.register('areaReveal', {
    description: 'Hero area figure (e.g. 130 m²): metal floor line draws out with sparks, an extruded gold numeral rises from depth while its digits roll like an odometer and lands on `land` (flash, streak, spark burst), architectural dimension line + brackets frame it, m² wipes in, Arabic label + English small caps, reflection on a dark floor, petrol/teal ambience. Pair with footage defocus/darken fx on the clip under it.',
    defaults: {
      value: '130', unit: 'm', sup: '2', label: 'المساحة', sub: 'AREA', at: [0.5, 0.6], size: 330, land: 1.03, depth: 24,
      in: { dur: 0.01, style: 'none' }, out: { dur: 0.01, style: 'none' },
    },
    draw(g, t, ctx) {
      const { p, S, W, H } = ctx;
      const P = D.PAL();
      const [cx, cy] = D.at(ctx, p.at); // cy = numeral baseline
      const L = p.land;
      const size = p.size * S;
      const digits = String(p.value).split('');

      // ---- 0) colour ambience: dark centre for contrast, petrol/teal at the edges
      const ak = ease.outCubic(range(t, 0, 0.7));
      g.save(); g.globalAlpha *= ak;
      let rg = g.createRadialGradient(cx, cy - size * 0.35, size * 0.2, cx, cy - size * 0.35, Math.max(W, H) * 0.75);
      rg.addColorStop(0, 'rgba(4,8,9,0.62)'); rg.addColorStop(0.45, 'rgba(8,30,34,0.5)'); rg.addColorStop(1, 'rgba(10,40,45,0.72)');
      g.fillStyle = rg; g.fillRect(0, 0, W, H);
      g.restore();

      // ---- layout
      const fontNum = `900 ${Math.round(size)}px ${D.fontFamily('display', '0', 'ar')}`;
      g.save(); g.font = fontNum;
      let slotW = 0; for (let d = 0; d <= 9; d++) slotW = Math.max(slotW, g.measureText(String(d)).width);
      const m0 = g.measureText('0'), asc = m0.actualBoundingBoxAscent, desc = Math.max(0, m0.actualBoundingBoxDescent);
      g.restore();
      slotW *= 0.92;
      const uSize = size * 0.34, sSize = size * 0.2;
      const fontUnit = `800 ${Math.round(uSize)}px ${D.fontFamily('display', 'm', 'ar')}`, fontSup = `800 ${Math.round(sSize)}px ${D.fontFamily('display', '2', 'ar')}`;
      g.save(); g.font = fontUnit; const uw = g.measureText(p.unit).width; g.font = fontSup; const sw = g.measureText(p.sup).width; g.restore();
      const gap = 18 * S, numW = slotW * digits.length, blockW = numW + gap + uw + sw + 4 * S;
      const bx = cx - blockW / 2, top = cy - asc;

      // ---- 1) floor line drawing out from the centre, sparks at both heads
      const fk = ease.glide(range(t, 0, 0.6));
      const fl = blockW * 0.8 * fk + 40 * S * fk;
      const fy = cy + 10 * S;
      if (fk > 0) {
        g.save(); g.shadowColor = D.rgba(P.ember, 0.9); g.shadowBlur = 16 * S;
        g.fillStyle = D.metal(g, cx - fl, 0, cx + fl, 0, 0.5 + 0.35 * Math.sin(t * 1.3), 0.2);
        g.fillRect(cx - fl, fy, fl * 2, 3 * S);
        g.restore();
        g.fillStyle = D.rgba(P.goldHi, 0.35); g.fillRect(cx - fl * 1.08, fy + 9 * S, fl * 2.16, 1 * S);
        if (fk < 1) { D.spark(g, cx - fl, fy + 1.5 * S, 30 * S, 1, { flare: 1.3 }); D.spark(g, cx + fl, fy + 1.5 * S, 30 * S, 1, { flare: 1.3 }); }
      }

      // ---- 2) numeral face mask (white), rolling digits per slot + unit
      const pad = 70 * S;
      const fw = Math.ceil(blockW + pad * 2), fh = Math.ceil(asc + desc + pad * 2);
      const ox = bx - pad, oy = top - pad; // canvas -> frame offset
      const [F, f] = D.offscreen('area_face', fw, fh);
      f.fillStyle = '#fff'; f.textAlign = 'center'; f.textBaseline = 'alphabetic';
      const rowH = asc + 40 * S;
      digits.forEach((ch, i) => {
        const d = Number(ch);
        if (Number.isNaN(d)) return;
        const te = L - (digits.length - 1 - i) * 0.14, ts = 0.22;
        const laps = 1 + i;
        const u = range(t, ts, te);
        const v = (d + 10 * laps) * (1 - Math.pow(1 - u, 3));
        let bounce = 0;
        if (t > te) bounce = -rowH * 0.09 * Math.exp(-(t - te) * 9) * Math.sin((t - te) * 26);
        const a = Math.floor(v) % 10, frac = u >= 1 ? 0 : v - Math.floor(v);
        const sx = pad + i * slotW, base = pad + asc;
        f.save(); f.beginPath(); f.rect(sx - 6 * S, pad - 12 * S, slotW + 12 * S, asc + desc + 24 * S); f.clip();
        f.font = fontNum;
        f.fillText(String(a), sx + slotW / 2, base - frac * rowH + bounce);
        if (frac > 0) f.fillText(String((a + 1) % 10), sx + slotW / 2, base + (1 - frac) * rowH + bounce);
        f.restore();
      });
      // unit wipes in after the landing
      const uk = ease.architectural(range(t, L + 0.02, L + 0.4));
      if (uk > 0) {
        const ux = pad + numW + gap;
        f.save(); f.beginPath(); f.rect(ux - 4 * S, 0, (uw + sw + 12 * S) * uk, fh); f.clip();
        f.textAlign = 'left'; f.font = fontUnit; f.fillText(p.unit, ux, pad + asc + (1 - uk) * 30 * S);
        f.font = fontSup; f.fillText(p.sup, ux + uw + 3 * S, pad + asc - uSize * 0.52 + (1 - uk) * 30 * S);
        f.restore();
      }
      // tinted copies
      const tint = (key, paint) => { const [c, x] = D.offscreen(key, fw, fh); x.drawImage(F, 0, 0); x.globalCompositeOperation = 'source-in'; paint(x); x.fillRect(0, 0, fw, fh); return [c, x]; };
      const [Dk] = tint('area_dark', (x) => { const gr = x.createLinearGradient(0, pad, 0, pad + asc); gr.addColorStop(0, '#3A2312'); gr.addColorStop(1, '#1C1108'); x.fillStyle = gr; });
      const [Md] = tint('area_mid', (x) => { const gr = x.createLinearGradient(0, pad, 0, pad + asc); gr.addColorStop(0, '#B07743'); gr.addColorStop(1, '#6E4322'); x.fillStyle = gr; });
      const [Hi] = tint('area_hi', (x) => { x.fillStyle = '#FFF7EA'; });
      const [Gd, gx] = tint('area_gold', (x) => {
        const gr = x.createLinearGradient(0, pad - asc * 0.05, 0, pad + asc);
        gr.addColorStop(0, '#FFF6E2'); gr.addColorStop(0.3, '#FFE2AE'); gr.addColorStop(0.58, '#E7B46C'); gr.addColorStop(0.8, '#C68B52'); gr.addColorStop(1, '#9C6233');
        x.fillStyle = gr;
      });
      // sheen on the gold face: a pass after landing, then every 2.4 s
      const sp = t < L + 0.1 ? -1 : ((t - L - 0.1) % 2.4) / 0.8;
      if (sp >= 0 && sp <= 1) {
        gx.globalCompositeOperation = 'source-atop';
        const bxp = -fw * 0.3 + fw * 1.6 * ease.inOutSine(sp);
        const sg = gx.createLinearGradient(bxp - fh * 0.5, 0, bxp + fh * 0.5, fh);
        sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,250,0.75)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
        gx.fillStyle = sg; gx.fillRect(0, 0, fw, fh);
      }
      // assemble: extrusion (depth grows as it lands), mid layer, rim light, gold face
      const [N, nx] = D.offscreen('area_num', fw, fh);
      const th = -0.55 + 0.9 * ease.inOutSine(range(t, 0, 3.2));
      const step = 1.15 * S, depth = Math.round(p.depth * (0.35 + 0.65 * ease.outCubic(range(t, 0.3, L))));
      const ddx = Math.sin(th) * step, ddy = Math.cos(th) * step;
      for (let i = depth; i >= 2; i--) nx.drawImage(Dk, ddx * i, ddy * i);
      nx.drawImage(Md, ddx * 1.6, ddy * 1.6);
      nx.drawImage(Md, ddx * 0.8, ddy * 0.8);
      nx.drawImage(Hi, -1.4 * S, -1.6 * S);
      nx.drawImage(Gd, 0, 0);

      // ---- 3) glow behind, then the numeral with entrance + land punch
      const vis = ease.outCubic(range(t, 0.12, 0.45));
      const lp = t > L ? Math.exp(-(t - L) * 3.2) : 0;
      if (vis > 0) {
        g.save(); g.globalCompositeOperation = 'lighter';
        const gr2 = g.createRadialGradient(cx, cy - asc * 0.5, 0, cx, cy - asc * 0.5, blockW * 0.85);
        gr2.addColorStop(0, D.rgba(P.ember, 0.18 * vis + 0.32 * lp)); gr2.addColorStop(0.5, D.rgba(P.copper, 0.08 * vis + 0.12 * lp)); gr2.addColorStop(1, D.rgba(P.copper, 0));
        g.fillStyle = gr2; g.fillRect(cx - blockW, cy - asc * 0.5 - blockW, blockW * 2, blockW * 2);
        g.restore();
        const ek = D.spring(range(t, 0.12, 2) * 1.9, 120, 16);
        const punch = t > L ? 0.035 * Math.exp(-(t - L) * 7) * Math.cos((t - L) * 22) : 0;
        const sc = (1.38 - 0.38 * ek) * (1 + punch) * (1 + 0.025 * ease.inOutSine(range(t, L, L + 2.2)));
        const blur = (1 - clamp(ek)) * 16 * S;
        // reflection on the floor
        const [R, rx] = D.offscreen('area_refl', fw, fh);
        rx.save(); rx.translate(0, fh); rx.scale(1, -1); rx.drawImage(N, 0, 0); rx.restore();
        rx.globalCompositeOperation = 'destination-in';
        const rgm = rx.createLinearGradient(0, fh - pad - asc - desc, 0, fh - pad - asc * 0.45);
        rgm.addColorStop(0, 'rgba(0,0,0,0.5)'); rgm.addColorStop(1, 'rgba(0,0,0,0)');
        rx.fillStyle = rgm; rx.fillRect(0, 0, fw, fh);
        g.save();
        g.translate(cx, cy); g.scale(sc, sc); g.translate(-cx, -cy);
        g.globalAlpha *= vis;
        if (blur > 0.3) g.filter = `blur(${blur.toFixed(1)}px)`;
        g.save(); g.globalAlpha *= 0.55; g.drawImage(R, ox, cy + 14 * S - (fh - pad - asc)); g.restore();
        g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 40 * S; g.shadowOffsetY = 18 * S;
        g.drawImage(N, ox, oy);
        g.restore();
      }

      // ---- 4) landing: hot spark, anamorphic streak, burst along the floor line
      const lt = t - L;
      if (lt > -0.02 && lt < 0.9) {
        const a = clamp(1 - lt / 0.9);
        // hot spark where the last digit lands
        D.spark(g, bx + numW - slotW * 0.5, top + asc * 0.1, 130 * S * (0.6 + 0.4 * a), a * a, { flare: 1.1 });
        const Ls = W * 0.5 * (0.5 + lt);
        g.save(); g.globalCompositeOperation = 'lighter';
        const sg = g.createLinearGradient(cx - Ls, 0, cx + Ls, 0);
        sg.addColorStop(0, 'rgba(127,193,188,0)'); sg.addColorStop(0.3, `rgba(127,193,188,${(0.35 * a).toFixed(3)})`); sg.addColorStop(0.5, `rgba(255,240,210,${(0.9 * a).toFixed(3)})`); sg.addColorStop(0.7, `rgba(127,193,188,${(0.35 * a).toFixed(3)})`); sg.addColorStop(1, 'rgba(127,193,188,0)');
        g.fillStyle = sg; g.fillRect(cx - Ls, top + asc * 0.1 - 3 * S, Ls * 2, 6 * S);
        g.restore();
        D.sparks(g, { seed: 21, n: 46, x: cx - blockW * 0.42, y: fy, tt: lt, life: 1.1, speed: 900, angle: Math.PI + 0.25, spread: 1.4, gravity: 900, size: 3, S });
        D.sparks(g, { seed: 22, n: 46, x: cx + blockW * 0.42, y: fy, tt: lt, life: 1.1, speed: 900, angle: -0.25, spread: 1.4, gravity: 900, size: 3, S });
        D.sparks(g, { seed: 23, n: 30, x: cx, y: top + asc * 0.4, tt: lt, life: 0.9, speed: 700, spread: Math.PI * 2, size: 2.4, S, area: [numW, asc * 0.6] });
      }

      // ---- 5) architectural dimension line above the numeral + extension lines + ticks
      const dy = top - 46 * S, half = blockW / 2 + 10 * S;
      const dk = ease.glide(range(t, 0.55, 1.05));
      if (dk > 0) {
        g.save(); g.shadowColor = D.rgba(P.ember, 0.7); g.shadowBlur = 10 * S;
        g.fillStyle = D.metal(g, cx - half, 0, cx + half, 0, ((t * 0.5) % 1.6) - 0.3);
        g.fillRect(cx - half * dk, dy - 1.2 * S, half * 2 * dk, 2.4 * S);
        g.restore();
        if (dk < 1) { D.spark(g, cx - half * dk, dy, 22 * S, 1); D.spark(g, cx + half * dk, dy, 22 * S, 1); }
        const xk = ease.architectural(range(t, 0.95, 1.35));
        for (const sx of [-1, 1]) {
          const x = cx + sx * half;
          D.line(g, x, dy - 14 * S, x, dy + (26 * S) * xk, xk > 0 ? 1 : 0, { width: 1.6 * S, color: D.rgba(P.goldHi, 0.9) });
          // 45° architectural tick
          D.line(g, x - 9 * S, dy + 9 * S, x + 9 * S, dy - 9 * S, xk, { width: 2.6 * S, color: P.goldHi });
        }
        // centre node
        const ck = D.springP(range(t, 1.0, 2) * 1, 'snappy');
        g.save(); g.translate(cx, dy); g.rotate(Math.PI / 4); const d = 6 * S * ck;
        g.fillStyle = P.goldHi; g.shadowColor = D.rgba(P.ember, 0.9); g.shadowBlur = 12 * S; g.fillRect(-d, -d, d * 2, d * 2); g.restore();
      }

      // ---- 6) label row: Arabic (right) · teal node · English small caps (left)
      const ly = dy - 34 * S;
      g.save(); g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 14 * S;
      D.setFont(g, { role: 'display', weight: 800, size: 62 * S, text: p.label });
      const lw = D.measure(g, p.label);
      D.maskedWords(g, p.label, cx + 24 * S + lw, ly, { size: 62 * S, weight: 800, color: '#FFFFFF', t, t0: 0.75, align: 'right' });
      const sk = ease.architectural(range(t, 0.95, 1.4));
      D.dot(g, cx, ly - 18 * S, 5 * S * sk, P.tealHi);
      g.globalAlpha *= sk; g.fillStyle = P.gold;
      g.font = `600 ${Math.round(30 * S)}px ${D.fontFamily('display', 'a', 'en')}`;
      try { g.letterSpacing = `${8 * S}px`; } catch (e) { /* older engines */ }
      g.textAlign = 'right'; g.direction = 'ltr';
      g.fillText(p.sub, cx - 24 * S, ly - 6 * S + (1 - sk) * 8 * S);
      try { g.letterSpacing = '0px'; } catch (e) { /* noop */ }
      g.restore();

      // ---- 7) frame brackets around the composition
      const bk = ease.architectural(range(t, L + 0.1, L + 0.6));
      if (bk > 0) {
        const x0 = cx - half - 60 * S, x1 = cx + half + 60 * S, y0 = ly - 80 * S, y1 = fy + 70 * S, Lb = 46 * S;
        const col = D.rgba(P.goldHi, 0.95);
        D.bracket(g, x0, y0, Lb, 1, 1, bk, { width: 2.4 * S, color: col }); D.bracket(g, x1, y0, Lb, -1, 1, bk, { width: 2.4 * S, color: col });
        D.bracket(g, x0, y1, Lb, 1, -1, bk, { width: 2.4 * S, color: col }); D.bracket(g, x1, y1, Lb, -1, -1, bk, { width: 2.4 * S, color: col });
      }

      // ---- 8) drifting gold / teal dust in the light
      const dr = D.rng(77), dv = ease.outCubic(range(t, L - 0.2, L + 0.6));
      if (dv > 0) {
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 60; i++) {
          const x0 = cx + (dr() - 0.5) * blockW * 1.8, y0 = cy - asc * 0.4 + (dr() - 0.5) * asc * 1.6, spd = 18 + dr() * 40, sz = (0.7 + dr() * 2) * S, ph = dr() * 6.28;
          const a = dv * (0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.2 + ph)));
          D.dot(g, x0 + Math.sin(t * 0.7 + ph) * 10 * S, y0 - (t - L) * spd * S, sz, D.rgba(i % 5 ? P.goldHi : P.tealHi, a * 0.8));
        }
        g.restore();
      }
    },
  });

  // ---------------------------------------------------------------------------
  D.register('lightLeak', {
    description: 'Organic coloured light leak (ember, gold, teal) washing across the frame for a transition. Light only; keep it 0.4-0.8 s on a cut.',
    defaults: { colors: ['ember', 'goldHi', 'teal'], dir: 1, strength: 0.55, seed: 3, in: { dur: 0.01, style: 'none' }, out: { dur: 0.01, style: 'none' } },
    draw(g, t, ctx) {
      const { p, W, H, dur } = ctx;
      const P = D.PAL();
      const k = clamp(t / dur), env = Math.sin(Math.PI * k) ** 1.4;
      const r = D.rng(p.seed);
      g.save();
      p.colors.forEach((cn, i) => {
        const col = P[cn] || cn;
        const sx = r(), sy = r(), rad = (0.35 + r() * 0.4) * Math.max(W, H), sp = 0.5 + r() * 0.6;
        const x = W * (p.dir > 0 ? -0.3 + (sx * 0.4 + k * 1.2 * sp) : 1.3 - (sx * 0.4 + k * 1.2 * sp)), y = H * (0.1 + sy * 0.8);
        const gr = g.createRadialGradient(x, y, 0, x, y, rad);
        gr.addColorStop(0, D.rgba(col, p.strength * env * (i ? 0.7 : 1))); gr.addColorStop(0.5, D.rgba(col, p.strength * env * 0.3)); gr.addColorStop(1, D.rgba(col, 0));
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
      });
      g.restore();
    },
  });
})();
