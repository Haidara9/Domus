// Speed-ramp redesign for a finished edit: read the perceived camera speed per frame (motion_profile.py),
// then build a time remap for a segment that
//  - keeps the segment's start and end (cuts stay on the music),
//  - shows the same content (total camera travel is preserved),
//  - replaces jerky speed changes with a smooth curve, optionally with more contrast (gamma),
//  - moves the fastest moment of the ramp onto a chosen beat,
//  - removes stutter from repeated frames (no motion = no screen time).
// The new perceived speed is w(t); the remap s(t) solves M(s(t)) = M(a) + integral of w, M = cumulative travel.

const gauss = (arr, sigma) => {
  if (sigma <= 0) return arr.slice();
  const r = Math.ceil(sigma * 3), k = [];
  for (let i = -r; i <= r; i++) k.push(Math.exp(-(i * i) / (2 * sigma * sigma)));
  return arr.map((_, i) => { let s = 0, w = 0; k.forEach((kv, j) => { const x = i + j - r; if (x >= 0 && x < arr.length) { s += arr[x] * kv; w += kv; } }); return s / w; });
};

// profile: {fps, frames:[{t, speed}]}; seg: {a, b, peak?, beat?, sigma (s), gamma, floor (px/frame), rmin, rmax}
export function designRemap(profile, seg) {
  const fps = profile.fps;
  const { a, b, sigma = 0.12, gamma = 1.15, floor = 1.5, rmin = 0.45, rmax = 2.6 } = seg;
  // frames of this shot only: the frame at b already belongs to the next shot (its motion is the cut jump)
  const rows = profile.frames.filter((r) => r.t >= a - 1e-6 && r.t <= b - 1 / fps + 1e-6);
  rows.push({ t: b, speed: rows[rows.length - 1].speed });
  // speed of the motion arriving at each frame; the first frame after a cut is a jump, not motion
  let v = rows.map((r, i) => (i === 0 ? null : r.speed));
  v = v.map((x, i) => x ?? v[i + 1] ?? 0);
  // fill tracking dropouts inside fast moves (blurred frames read as ~0): rolling max 3, then median 5
  const mx = v.map((_, i) => Math.max(...v.slice(Math.max(0, i - 1), i + 2)));
  const med = mx.map((_, i) => { const w = mx.slice(Math.max(0, i - 2), i + 3).sort((x, y) => x - y); return w[w.length >> 1]; });
  const vel = med.map((x) => x + floor); // px per frame, never zero so time always advances
  // cumulative travel at frame times (source)
  const ts = rows.map((r) => r.t);
  const M = [0]; for (let i = 1; i < ts.length; i++) M.push(M[i - 1] + vel[i]);
  const total = M[M.length - 1];
  const smooth = gauss(vel, sigma * fps);
  // locate the peak (or use the one given) and warp profile time so it lands on the beat
  let pk = seg.peak; if (pk === undefined) { let im = 0; smooth.forEach((x, i) => { if (x > smooth[im]) im = i; }); pk = ts[im]; }
  const q = seg.beat ?? pk;
  const phi = (t) => (t <= q ? a + ((t - a) / Math.max(1e-9, q - a)) * (pk - a) : pk + ((t - q) / Math.max(1e-9, b - q)) * (b - pk));
  const at = (arr, t) => { const x = (t - a) * fps, i = Math.floor(x), k = x - i; const i0 = Math.max(0, Math.min(arr.length - 1, i)), i1 = Math.max(0, Math.min(arr.length - 1, i + 1)); return arr[i0] + (arr[i1] - arr[i0]) * k; };
  const N = Math.round((b - a) * fps);
  const integ = (arr) => arr.slice(1).reduce((s, x, i) => s + (x + arr[i]) / 2, 0);
  let w = []; for (let i = 0; i <= N; i++) w.push(Math.pow(at(smooth, phi(a + i / fps)), gamma));
  // normalise so the segment covers exactly the same travel (integral over frames = total)
  const kk = total / integ(w); w = w.map((x) => x * kk);
  // invert M: output frame i -> source time
  const Minv = (m) => { let i = 0; while (i < M.length - 2 && M[i + 1] < m) i++; const k = (m - M[i]) / Math.max(1e-9, M[i + 1] - M[i]); return ts[i] + Math.min(1, Math.max(0, k)) * (ts[i + 1] - ts[i]); };
  const pts = []; let acc = 0;
  for (let i = 0; i <= N; i++) { if (i) acc += (w[i] + w[i - 1]) / 2; pts.push([i / fps, Minv(Math.min(total, acc)) - a]); }
  pts[pts.length - 1][1] = b - a;
  // Fast moves are never slowed (interpolating blurred whips ghosts): per source frame, cap the screen time at
  // one frame where the camera is fast, give the saved time to the calm frames (clean to interpolate), rebuild.
  if (seg.fastAbove) {
    const outAt = (sv) => { let i = 0; while (i < pts.length - 2 && pts[i + 1][1] < sv) i++; const k = (sv - pts[i][1]) / Math.max(1e-9, pts[i + 1][1] - pts[i][1]); return pts[i][0] + Math.min(1, Math.max(0, k)) * (pts[i + 1][0] - pts[i][0]); };
    const nS = Math.round((b - a) * fps);
    const dwell = []; for (let j = 0; j < nS; j++) dwell.push(outAt((j + 1) / fps) - outAt(j / fps));
    const sp = (j) => at(vel, a + (j + 0.5) / fps);
    let saved = 0;
    const fast = dwell.map((_, j) => sp(j) > seg.fastAbove);
    dwell.forEach((d, j) => { if (fast[j] && d > 1 / fps) { saved += d - 1 / fps; dwell[j] = 1 / fps; } });
    const calmW = dwell.map((_, j) => (fast[j] ? 0 : 1 / (1 + sp(j))));
    const cs = calmW.reduce((x, y) => x + y, 0);
    dwell.forEach((_, j) => { dwell[j] += (saved * calmW[j]) / cs; });
    // smooth the calm dwell a little so the slow-down eases in
    const sm = gauss(dwell, 2).map((x, j) => (fast[j] ? dwell[j] : x));
    const tot = sm.reduce((x, y) => x + y, 0), fix = (b - a) / tot;
    const O = [0]; sm.forEach((d, j) => O.push(O[j] + d * fix));
    const srcAt = (o) => { let j = 0; while (j < O.length - 2 && O[j + 1] < o) j++; const k = (o - O[j]) / Math.max(1e-9, O[j + 1] - O[j]); return (j + Math.min(1, Math.max(0, k))) / fps; };
    for (let i = 0; i < pts.length; i++) pts[i][1] = srcAt(pts[i][0]);
    pts[pts.length - 1][1] = b - a;
    // show the camera's own frames inside fast moves (rate >= 1 there, so snapping never repeats a frame)
    for (let i = 1; i < pts.length - 1; i++) if (at(vel, a + pts[i][1]) > seg.fastAbove) pts[i][1] = Math.max(pts[i - 1][1], Math.round(pts[i][1] * fps) / fps);
  }
  // report: rates and predicted perceived speed
  const rate = pts.slice(1).map((p, i) => (p[1] - pts[i][1]) * fps);
  const report = { a, b, peakSource: pk, peakOut: q, gamma, sigma, rateMin: Math.min(...rate), rateMax: Math.max(...rate), clampWarn: Math.min(...rate) < rmin || Math.max(...rate) > rmax };
  // predicted on-screen speed: source speed at the frame shown x playback rate
  const predicted = pts.map((p, i) => { const j = Math.min(pts.length - 1, Math.max(1, i)); const r = (pts[j][1] - pts[j - 1][1]) * fps; return { t: a + p[0], speed: Math.max(0, (at(vel, a + p[1]) - floor) * r), diff: 1 }; });
  let ip = 0; predicted.forEach((x, i) => { if (x.speed > predicted[ip].speed) ip = i; }); report.peakActual = predicted[ip].t;
  return { points: pts.map(([o, s]) => [Number(o.toFixed(4)), Number(s.toFixed(4))]), report, predicted };
}

// Thin a dense monotone point list: drop points that are (nearly) collinear with their neighbours.
export function thinPoints(P, tol = 0.0015) {
  const out = [P[0]];
  for (let i = 1; i < P.length - 1; i++) {
    const p = out[out.length - 1], c = P[i], nx = P[i + 1];
    const k = (c[0] - p[0]) / (nx[0] - p[0]); const s = p[1] + (nx[1] - p[1]) * k;
    if (Math.abs(s - c[1]) > tol) out.push(c);
  }
  out.push(P[P.length - 1]);
  return out;
}
