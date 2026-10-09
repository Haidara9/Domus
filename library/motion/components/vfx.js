// VFX layers composited over footage. They add light and atmosphere only; they never alter
// the architecture underneath (no warping, no object insertion).
(function () {
  const D = window.DOMUS;
  const { ease, range, clamp } = D;

  D.register('lightSweep', {
    description: 'Soft diagonal band of warm light crossing the frame. Motivated by real light direction; use on reveals.',
    defaults: { angle: 22, width: 0.32, color: '255,244,226', strength: 0.32, from: -0.4, to: 1.4, in: { dur: 0.01, style: 'none' }, out: { dur: 0.01, style: 'none' } },
    draw(g, t, ctx) {
      const { p, W, H, dur } = ctx;
      const k = ease.inOutSine(range(t, 0, dur));
      const diag = Math.hypot(W, H);
      const pos = (p.from + (p.to - p.from) * k) * diag;
      g.save();
      g.translate(W / 2, H / 2); g.rotate((p.angle * Math.PI) / 180); g.translate(-diag / 2, -diag / 2);
      const bw = p.width * diag;
      const gr = g.createLinearGradient(pos - bw / 2, 0, pos + bw / 2, 0);
      const a = p.strength * Math.sin(Math.PI * k);
      gr.addColorStop(0, `rgba(${p.color},0)`); gr.addColorStop(0.5, `rgba(${p.color},${a.toFixed(3)})`); gr.addColorStop(1, `rgba(${p.color},0)`);
      g.fillStyle = gr; g.fillRect(0, 0, diag, diag);
      g.restore();
    },
  });

  D.register('letterbox', {
    description: 'Cinematic bars that glide to a target aspect (default 2.39:1) and back out.',
    defaults: { aspect: 2.39, color: '#000000', in: { dur: 0.8, style: 'none' }, out: { dur: 0.8, style: 'none' } },
    draw(g, t, ctx) {
      const { p, W, H } = ctx;
      const target = Math.max(0, (H - W / p.aspect) / 2);
      const k = ease.glide(ctx.pin) * (1 - ease.glide(ctx.pout));
      const b = target * k;
      g.fillStyle = p.color; g.fillRect(0, 0, W, b); g.fillRect(0, H - b, W, b);
    },
  });

  D.register('filmGrain', {
    description: 'Fine seeded grain that changes every frame. Strength 0.03-0.07 keeps detail intact.',
    defaults: { strength: 0.05, size: 1.6, fps: 30, in: { dur: 0.01, style: 'none' }, out: { dur: 0.01, style: 'none' } },
    draw(g, t, ctx) {
      const { p, W, H } = ctx;
      const tile = 256;
      const frame = Math.floor(t * p.fps);
      const c = document.createElement('canvas'); c.width = tile; c.height = tile;
      const o = c.getContext('2d'); const img = o.createImageData(tile, tile);
      const r = D.rng(frame * 7919 + 13);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = r() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
      }
      o.putImageData(img, 0, 0);
      g.save(); g.globalAlpha *= p.strength; g.imageSmoothingEnabled = true;
      const s = p.size;
      for (let y = 0; y < H; y += tile * s) for (let x = 0; x < W; x += tile * s) g.drawImage(c, x, y, tile * s, tile * s);
      g.restore();
    },
  });

  D.register('lightDust', {
    description: 'Dust motes drifting in a light shaft. Atmosphere for sunlit interiors; keep it subtle.',
    defaults: { count: 70, area: [0.15, 0.1, 0.7, 0.75], color: '255,246,230', size: 3, seed: 3, wind: [0.012, -0.02], in: { dur: 1.0, style: 'fade' }, out: { dur: 1.0, style: 'fade' } },
    draw(g, t, ctx) {
      const { p, W, H, S } = ctx;
      const r = D.rng(p.seed);
      const [ax, ay, aw, ah] = p.area;
      for (let i = 0; i < p.count; i++) {
        const x0 = r(), y0 = r(), sp = 0.5 + r(), ph = r() * 6.28, sz = (0.4 + r()) * p.size * S, tw = 0.4 + r() * 0.6;
        let x = (x0 + p.wind[0] * sp * t + 0.01 * Math.sin(t * 0.7 * sp + ph)) % 1; if (x < 0) x += 1;
        let y = (y0 + p.wind[1] * sp * t + 0.008 * Math.cos(t * 0.5 * sp + ph)) % 1; if (y < 0) y += 1;
        const a = (0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.3 * tw + ph))) * 0.7;
        D.dot(g, (ax + x * aw) * W, (ay + y * ah) * H, sz, `rgba(${p.color},${a.toFixed(3)})`);
      }
    },
  });

  D.register('vignette', {
    description: 'Gentle edge darkening to focus the eye. Prefer the grade vignette; use this when it must animate.',
    defaults: { strength: 0.35, radius: 0.75, in: { dur: 0.6, style: 'fade' }, out: { dur: 0.6, style: 'fade' } },
    draw(g, t, ctx) {
      const { p, W, H } = ctx;
      const rg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * p.radius);
      rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, `rgba(0,0,0,${p.strength})`);
      g.fillStyle = rg; g.fillRect(0, 0, W, H);
    },
  });

  D.register('flash', {
    description: 'Short exposure bloom (white or warm) to punctuate a cut on a beat. Max 1-2 per film.',
    defaults: { color: '255,248,236', peak: 0.85, in: { dur: 0.01, style: 'none' }, out: { dur: 0.01, style: 'none' } },
    draw(g, t, ctx) {
      const { p, W, H, dur } = ctx;
      const k = t / dur;
      const a = p.peak * (k < 0.25 ? ease.outCubic(k / 0.25) : 1 - ease.outCubic((k - 0.25) / 0.75));
      g.fillStyle = `rgba(${p.color},${clamp(a).toFixed(3)})`; g.fillRect(0, 0, W, H);
    },
  });
})();

// Architectural line drawing locked to a real surface (glass frame, facade, doorway) through a
// tracked homography. The lines trace edges that exist in the shot; they never add structure.
// v2: metal (copper -> gold sheen) main line with bloom, a spark head while drawing, a second
// inset line that follows, corner brackets and diamond nodes, a flowing dash and a comet glint.
// Exit: the line retracts along its own path instead of fading.
(function () {
  const D = window.DOMUS;
  const { ease, range } = D;
  function inset(pts, d) {
    // move each vertex towards the centroid by d px (works for convex outlines in perspective)
    const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    return pts.map(([x, y]) => { const l = Math.hypot(cx - x, cy - y) || 1; return [x + ((cx - x) / l) * d, y + ((cy - y) / l) * d]; });
  }
  D.register('perspectiveOutline', {
    description: 'Copper/gold metal lines that draw along real edges (points in reference-frame coords) with spark head, inset second line, corner brackets, flowing dash and glint; stays locked via props.track (perspective).',
    defaults: { points: [], closed: true, glint: 0.9, width: 5, glow: true, drawDur: 0.9, inset: 14, brackets: true, dash: true, ticks: true, trackMode: 'perspective', in: { dur: 0.01, style: 'none' }, out: { dur: 0.45, style: 'none' } },
    draw(g, t, ctx) {
      const { p, S, dur } = ctx;
      if (!p.points.length) return;
      const P = D.PAL();
      const base = p.points.map(([x, y]) => ctx.mapH(x, y));
      const pts = p.closed ? [...base, base[0]] : base;
      const k = ease.glide(range(t, 0, p.drawDur));
      const ko = ease.inOutCubic(range(t, dur - ctx.outD, dur)); // retract
      const a0 = ko, a1 = k;
      if (a1 <= a0) return;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const [x, y] of base) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
      const sheen = ((t * 0.55) % 1.6) - 0.3;
      const metal = D.metal(g, minX, minY, maxX, maxY, sheen, 0.25);
      g.save();
      // 1) bloom under-stroke (additive)
      if (p.glow) {
        g.save(); g.globalCompositeOperation = 'lighter';
        g.shadowColor = D.rgba(P.ember, 0.9); g.shadowBlur = 30 * S;
        D.polylineRange(g, pts, a0, a1, { width: p.width * 3.2 * S, color: D.rgba(P.copper, 0.28), join: 'miter' });
        g.restore();
      }
      // 2) dark keyline so the metal reads on bright glass
      D.polylineRange(g, pts, a0, a1, { width: (p.width + 3) * S, color: 'rgba(20,12,6,0.35)', join: 'miter' });
      // 3) metal line
      g.save(); g.shadowColor = D.rgba(P.ember, 0.75); g.shadowBlur = 12 * S;
      D.polylineRange(g, pts, a0, a1, { width: p.width * S, color: metal, join: 'miter' });
      g.restore();
      // 4) inset second line (follows 0.18 s later), thin gold with a flowing dash
      if (p.inset && base.length > 2) {
        const ib = inset(base, p.inset * S), ip = p.closed ? [...ib, ib[0]] : ib;
        const k2 = ease.glide(range(t, 0.18, p.drawDur + 0.18));
        D.polylineRange(g, ip, a0, Math.min(k2, 1), { width: 1.4 * S, color: D.rgba(P.goldHi, 0.75), join: 'miter' });
        if (p.dash && k2 >= 1) {
          const dk = ease.outCubic(range(t, p.drawDur + 0.18, p.drawDur + 0.6)) * (1 - ko);
          D.polylineRange(g, ip, a0, 1, { width: 2.6 * S, color: D.rgba(P.goldHi, 0.85 * dk), dash: [[10 * S, 22 * S], -t * 90 * S], cap: 'butt' });
        }
      }
      // 5) spark head on the drawing tip
      if (k > 0 && k < 1) {
        const [hx, hy] = D.pathPoint(pts, k);
        D.spark(g, hx, hy, 34 * S, 1, { flare: 1.2 });
        D.sparks(g, { seed: 7, n: 10, x: hx, y: hy, tt: (t * 6) % 0.4, life: 0.35, speed: 160, S, size: 2 });
      }
      // 6) nodes + corner brackets once drawn
      const nk = ease.architectural(range(t, p.drawDur * 0.85, p.drawDur + 0.45)) * (1 - ko);
      if (nk > 0) {
        base.forEach(([x, y], i) => {
          const q = p.closed ? base[(i + 1) % base.length] : base[i + 1] || base[i - 1];
          const r = p.closed ? base[(i - 1 + base.length) % base.length] : base[i - 1] || base[i + 1];
          if (p.brackets) {
            const L = 30 * S * nk;
            for (const o of [q, r]) {
              const l = Math.hypot(o[0] - x, o[1] - y) || 1, ux = (o[0] - x) / l, uy = (o[1] - y) / l;
              g.save(); g.strokeStyle = D.rgba(P.goldHi, 0.95); g.lineWidth = 2.2 * S; g.lineCap = 'square';
              g.beginPath(); g.moveTo(x - ux * 10 * S, y - uy * 10 * S); g.lineTo(x - ux * (10 * S + L), y - uy * (10 * S + L)); g.stroke(); g.restore();
            }
          }
          // diamond node
          g.save(); g.translate(x, y); g.rotate(Math.PI / 4); const d = 7 * S * nk;
          g.fillStyle = D.rgba(P.goldHi, 1); g.shadowColor = D.rgba(P.ember, 0.9); g.shadowBlur = 14 * S; g.fillRect(-d, -d, d * 2, d * 2);
          g.strokeStyle = D.rgba(P.copper, 1); g.lineWidth = 1.5 * S; g.strokeRect(-d, -d, d * 2, d * 2); g.restore();
        });
      }
      // 7) comet glint travelling the drawn path
      if (p.glint && k >= 1 && ko <= 0) {
        const u = ((t - p.drawDur) * p.glint * 0.7) % 1;
        const tailU = 0.12;
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let j = 0; j < 6; j++) D.polylineRange(g, pts, Math.max(0, u - tailU * (1 - j / 6)), u, { width: (p.width + 2 * j / 6) * S, color: `rgba(255,240,215,${(0.08 + j * 0.05).toFixed(3)})`, join: 'miter' });
        g.restore();
        const [gx, gy] = D.pathPoint(pts, u);
        D.spark(g, gx, gy, 40 * S, 0.95, { flare: 1 });
      }
      g.restore();
    },
  });
})();
