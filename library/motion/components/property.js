// Property information components. HARD RULE: every number, name and distance shown here must
// come from the brief or the client. Components never invent data.
(function () {
  const D = window.DOMUS;
  const { ease, range, clamp } = D;
  const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
  const digits = (s, mode) => (mode === 'arabic' ? String(s).replace(/\d/g, (d) => AR_DIGITS[d]) : String(s));

  // Line icons in a 64-unit box, drawn at progress k.
  const ICONS = {
    area(g, k) { D.polyline(g, [[8, 8], [56, 8], [56, 56], [8, 56], [8, 8]], k); D.polyline(g, [[18, 46], [46, 18]], k); D.polyline(g, [[36, 18], [46, 18], [46, 28]], k); D.polyline(g, [[18, 36], [18, 46], [28, 46]], k); },
    bed(g, k) { D.polyline(g, [[6, 50], [6, 22]], k); D.polyline(g, [[6, 38], [58, 38], [58, 50]], k); D.polyline(g, [[6, 30], [26, 30], [26, 38]], k); D.polyline(g, [[26, 30], [52, 30], [58, 38]], k); },
    bath(g, k) { D.polyline(g, [[6, 32], [58, 32], [54, 48], [10, 48], [6, 32]], k); D.polyline(g, [[14, 48], [12, 56]], k); D.polyline(g, [[50, 48], [52, 56]], k); D.polyline(g, [[14, 32], [14, 12], [22, 8], [28, 14]], k); },
    parking(g, k) { D.polyline(g, [[10, 6], [54, 6], [58, 10], [58, 54], [54, 58], [10, 58], [6, 54], [6, 10], [10, 6]], k); D.polyline(g, [[24, 46], [24, 18], [36, 18], [42, 24], [36, 32], [24, 32]], k); },
    floors(g, k) { for (let i = 0; i < 4; i++) D.polyline(g, [[10, 14 + i * 12], [54, 14 + i * 12]], clamp(k * 4 - i)); D.polyline(g, [[10, 8], [10, 56]], k); D.polyline(g, [[54, 8], [54, 56]], k); },
    view(g, k) { D.polyline(g, [[4, 44], [14, 40], [24, 44], [34, 40], [44, 44], [54, 40], [60, 42]], k); D.polyline(g, [[4, 54], [14, 50], [24, 54], [34, 50], [44, 54], [54, 50], [60, 52]], k); const pts = []; for (let i = 0; i <= 20; i++) { const a = Math.PI + (Math.PI * i) / 20; pts.push([32 + 12 * Math.cos(a), 32 + 12 * Math.sin(a)]); } D.polyline(g, pts, k); },
    garden(g, k) { D.polyline(g, [[32, 58], [32, 24]], k); D.polyline(g, [[32, 34], [20, 24], [16, 10], [30, 16], [32, 24]], k); D.polyline(g, [[32, 42], [44, 32], [50, 18], [36, 24], [32, 34]], k); },
    pool(g, k) { D.polyline(g, [[6, 30], [16, 26], [26, 30], [36, 26], [46, 30], [58, 26]], k); D.polyline(g, [[6, 44], [16, 40], [26, 44], [36, 40], [46, 44], [58, 40]], k); D.polyline(g, [[18, 26], [18, 8], [24, 8]], k); D.polyline(g, [[42, 26], [42, 8], [48, 8]], k); },
    elevator(g, k) { D.polyline(g, [[12, 6], [52, 6], [52, 58], [12, 58], [12, 6]], k); D.polyline(g, [[32, 6], [32, 58]], k); D.polyline(g, [[20, 26], [24, 20], [28, 26]], k); D.polyline(g, [[36, 38], [40, 44], [44, 38]], k); },
  };
  D.ICONS = ICONS;

  function drawIcon(g, name, x, y, size, k, color, width) {
    const f = ICONS[name]; if (!f) return;
    g.save(); g.translate(x - size / 2, y - size / 2); g.scale(size / 64, size / 64);
    g.strokeStyle = color; g.lineWidth = width * (64 / size); g.lineCap = 'round'; g.lineJoin = 'round';
    f(g, k); g.restore();
  }

  // ---------------------------------------------------------------------------
  D.register('specCard', {
    description: 'Property specs row: line icons draw, values count up, labels settle. items: [{icon, value, unit, label}].',
    defaults: {
      items: [], at: [0.5, 0.74], width: 0.88, card: 'paper', color: null, labelColor: null, accent: null,
      digits: 'latin', count: true, stagger: 0.14, in: { dur: 1.2, style: 'none' }, out: { dur: 0.5, style: 'sink' },
    },
    draw(g, t, ctx) {
      const { p, S, W } = ctx;
      const items = p.items || []; if (!items.length) return;
      const onPaper = p.card === 'paper';
      const ink = p.color || (onPaper ? ctx.C.ink || '#151412' : '#FFFFFF');
      const lab = p.labelColor || (onPaper ? 'rgba(21,20,18,0.72)' : 'rgba(255,255,255,0.82)');
      const accent = p.accent || ctx.C.copper || '#A86F3F';
      const [cx, cy] = D.at(ctx, p.at);
      const w = p.width * W, h = 300 * S;
      const rtl = items.some((it) => D.isArabic(it.label || ''));
      const ck = ease.architectural(range(t, 0, 0.7));
      if (p.card !== 'none') {
        g.save();
        g.globalAlpha *= ck;
        g.fillStyle = onPaper ? (ctx.C.paper || '#F1E6D3') + 'F2' : 'rgba(20,18,16,0.42)';
        g.shadowColor = 'rgba(0,0,0,0.18)'; g.shadowBlur = 40 * S; g.shadowOffsetY = 10 * S;
        D.roundRect(g, cx - w / 2, cy - h / 2 + (1 - ck) * 30 * S, w, h, 6 * S); g.fill();
        g.restore();
      }
      const n = items.length, colW = w / n;
      items.forEach((it, i) => {
        const vi = rtl ? n - 1 - i : i; // first item sits on the reading-start side
        const x = cx - w / 2 + colW * (vi + 0.5);
        const t0 = 0.25 + i * p.stagger;
        const k = ease.architectural(range(t, t0, t0 + 0.8));
        if (i > 0) {
          const sx = rtl ? x + colW / 2 : x - colW / 2;
          g.save(); g.strokeStyle = onPaper ? (ctx.C.line || '#C4A177') : 'rgba(255,255,255,0.3)'; g.lineWidth = 1.2 * S;
          D.line(g, sx, cy - h * 0.32, sx, cy - h * 0.32 + h * 0.64 * ease.glide(range(t, t0 - 0.1, t0 + 0.5)));
          g.restore();
        }
        drawIcon(g, it.icon, x, cy - h * 0.24, 54 * S, ease.glide(range(t, t0, t0 + 0.9)), accent, 2.2 * S);
        let val = String(it.value ?? '');
        if (p.count && /^\d+(\.\d+)?$/.test(val)) {
          const num = Number(val), dec = (val.split('.')[1] || '').length;
          val = (num * ease.outExpo(range(t, t0 + 0.1, t0 + 1.2))).toFixed(dec);
        }
        val = digits(val, p.digits);
        g.save(); g.globalAlpha *= clamp(k * 2); g.fillStyle = ink;
        const lang = rtl ? 'ar' : undefined;
        const unit = it.unit ? digits(it.unit, p.digits) : '';
        D.setFont(g, { role: 'display', weight: 600, size: 66 * S, text: val, lang });
        const vw = D.measure(g, val);
        D.setFont(g, { role: 'text', weight: 400, size: 30 * S, text: unit, lang });
        const uw = unit ? D.measure(g, unit) + 8 * S : 0;
        const vy = cy + h * 0.08 + (1 - k) * 20 * S;
        // number + unit centered as one group; in RTL the unit reads after the number (to its left)
        const left = x - (vw + uw) / 2;
        const numX = rtl ? left + uw : left, unitX = rtl ? left : left + vw + 8 * S;
        D.setFont(g, { role: 'display', weight: 600, size: 66 * S, text: val, lang });
        D.text(g, val, numX, vy, { align: 'left' });
        if (unit) { D.setFont(g, { role: 'text', weight: 400, size: 30 * S, text: unit, lang }); D.text(g, unit, unitX, vy, { align: 'left' }); }
        g.fillStyle = lab;
        D.setFont(g, { role: 'text', weight: 400, size: 30 * S, text: it.label || '' });
        D.text(g, it.label || '', x, cy + h * 0.32, { align: 'center' });
        g.restore();
      });
    },
  });

  // ---------------------------------------------------------------------------
  // callout: point at a real feature. `anchor` can be keyframed (props.keys.anchor) to follow
  // camera movement (manual tracking: set 3-6 keys and interpolate).
  D.register('callout', {
    description: 'Feature callout: pulsing dot on a real feature, leader line, label. Keyframe anchor to follow the shot.',
    defaults: {
      anchor: [0.5, 0.5], offset: [0.18, -0.12], label: 'أرضيات رخام', sub: '', color: '#FFFFFF', accent: null,
      in: { dur: 1.0, style: 'none' }, out: { dur: 0.45, style: 'fade' },
    },
    draw(g, t, ctx) {
      const { p, S, W, H } = ctx;
      const accent = p.accent || ctx.C.copperLight || '#C08A5A';
      const [ax, ay] = D.at(ctx, p.anchor);
      const lx = ax + p.offset[0] * W, ly = ay + p.offset[1] * H;
      const dk = D.springP(t, 'playful');
      const pulse = (t % 1.6) / 1.6;
      g.save();
      g.strokeStyle = accent; g.globalAlpha *= (1 - pulse) * 0.8 * clamp(t * 3);
      g.lineWidth = 2 * S; g.beginPath(); g.arc(ax, ay, (10 + 26 * pulse) * S, 0, Math.PI * 2); g.stroke();
      g.restore();
      D.dot(g, ax, ay, 9 * S * dk, accent);
      D.dot(g, ax, ay, 4 * S * dk, '#FFFFFF');
      const lk = ease.glide(range(t, 0.2, 0.7));
      const elbowX = lx, elbowY = ly;
      const endX = elbowX + (lx >= ax ? 1 : -1) * 120 * S;
      g.save(); g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 12 * S;
      D.polyline(g, [[ax, ay], [elbowX, elbowY], [endX, elbowY]], lk, { width: 2 * S, color: p.color });
      g.restore();
      const tk = ease.architectural(range(t, 0.55, 1.1));
      const right = lx >= ax;
      g.save(); g.globalAlpha *= tk; g.fillStyle = p.color; g.shadowColor = 'rgba(0,0,0,0.4)'; g.shadowBlur = 18 * S;
      D.setFont(g, { role: 'display', weight: 600, size: 46 * S, text: p.label });
      const align = right ? 'left' : 'right';
      const x = endX + (right ? 14 : -14) * S;
      D.text(g, p.label, x, elbowY + 16 * S + (1 - tk) * 14 * S, { align });
      if (p.sub) {
        D.setFont(g, { role: 'text', weight: 400, size: 30 * S, text: p.sub }); g.globalAlpha *= 0.85;
        D.text(g, p.sub, x, elbowY + 60 * S, { align });
      }
      g.restore();
    },
  });

  // ---------------------------------------------------------------------------
  D.register('mapPin', {
    description: 'Location moment: pin drops with a spring, ripple loops, label and up to 3 real distances list.',
    defaults: {
      at: [0.5, 0.42], label: 'اللاذقية', items: [], color: '#FFFFFF', accent: null, card: true,
      in: { dur: 1.2, style: 'none' }, out: { dur: 0.5, style: 'fade' },
    },
    draw(g, t, ctx) {
      const { p, S, W } = ctx;
      const accent = p.accent || ctx.C.copper || '#A86F3F';
      const [x, y] = D.at(ctx, p.at);
      const s = D.springP(t, 'playful');
      const ripple = (t % 2) / 2;
      g.save(); g.strokeStyle = accent; g.lineWidth = 2.5 * S; g.globalAlpha *= (1 - ripple) * clamp(t * 2);
      g.beginPath(); g.ellipse(x, y, 90 * S * ripple, 28 * S * ripple, 0, 0, Math.PI * 2); g.stroke(); g.restore();
      g.save(); g.translate(x, y - (1 - s) * 220 * S); g.scale(S, S);
      g.fillStyle = accent; g.beginPath();
      g.moveTo(0, 0); g.bezierCurveTo(-14, -22, -38, -44, -38, -74); g.arc(0, -74, 38, Math.PI, 0); g.bezierCurveTo(38, -44, 14, -22, 0, 0); g.fill();
      D.dot(g, 0, -74, 14, ctx.C.paper || '#F1E6D3');
      g.restore();
      const lk = ease.architectural(range(t, 0.4, 1.1));
      g.save(); g.globalAlpha *= lk; g.fillStyle = p.color; g.shadowColor = 'rgba(0,0,0,0.4)'; g.shadowBlur = 18 * S;
      D.setFont(g, { role: 'display', weight: 600, size: 70 * S, text: p.label });
      D.text(g, p.label, x, y + 100 * S + (1 - lk) * 20 * S, { align: 'center' });
      g.restore();
      (p.items || []).slice(0, 3).forEach((it, i) => {
        const k = ease.architectural(range(t, 0.8 + i * 0.15, 1.5 + i * 0.15));
        const rowY = y + 190 * S + i * 78 * S;
        g.save(); g.globalAlpha *= k; g.fillStyle = p.color; g.shadowColor = 'rgba(0,0,0,0.4)'; g.shadowBlur = 14 * S;
        const txt = `${it.label}  ·  ${it.value}`;
        D.setFont(g, { role: 'text', weight: 400, size: 38 * S, text: txt });
        D.text(g, txt, x, rowY + (1 - k) * 14 * S, { align: 'center' });
        g.restore();
      });
      void W;
    },
  });
})();
