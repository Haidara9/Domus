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
(function () {
  const D = window.DOMUS;
  const { ease, range } = D;
  D.register('perspectiveOutline', {
    description: 'Copper/gold lines that draw along real edges (points in reference-frame coords) and stay locked to the surface via props.track (perspective).',
    defaults: { points: [], closed: true, color: '#F2B878', width: 5, glow: true, drawDur: 0.9, ticks: true, trackMode: 'perspective', in: { dur: 0.01, style: 'none' }, out: { dur: 0.35, style: 'fade' } },
    draw(g, t, ctx) {
      const { p, S } = ctx;
      if (!p.points.length) return;
      const col = p.color || ctx.C.copperLight || '#C08A5A';
      const pts = p.points.map(([x, y]) => ctx.mapH(x, y));
      if (p.closed) pts.push(pts[0]);
      const k = ease.glide(range(t, 0, p.drawDur));
      g.save();
      if (p.glow) { g.shadowColor = 'rgba(255,170,90,0.95)'; g.shadowBlur = 22 * S; }
      D.polyline(g, pts, k, { width: p.width * 2.4 * S, color: 'rgba(168,111,63,0.35)', cap: 'round', join: 'miter' });
      D.polyline(g, pts, k, { width: p.width * S, color: col, cap: 'round', join: 'miter' });
      if (p.ticks) {
        const tk = ease.architectural(range(t, p.drawDur * 0.8, p.drawDur + 0.4));
        const L = 34 * S * tk;
        pts.slice(0, p.closed ? -1 : undefined).forEach(([x, y]) => { D.dot(g, x, y, 4.5 * S * tk, col); g.strokeStyle = col; g.lineWidth = 1.5 * S; g.beginPath(); g.moveTo(x - L, y); g.lineTo(x + L, y); g.moveTo(x, y - L); g.lineTo(x, y + L); g.stroke(); });
      }
      g.restore();
    },
  });
})();
