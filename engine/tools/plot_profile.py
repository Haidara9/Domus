#!/usr/bin/env python3
"""Draw a motion profile (speed per frame) with cuts and beats as a PNG (OpenCV only).
usage: python3 plot_profile.py profile.json beats.json out.png [--cuts 1.367,4.467] [--overlay other.json]"""
import argparse, json
import numpy as np, cv2
ap = argparse.ArgumentParser(); ap.add_argument('profile'); ap.add_argument('beats'); ap.add_argument('out')
ap.add_argument('--cuts', default=''); ap.add_argument('--overlay', default=''); ap.add_argument('--key', default='speed')
a = ap.parse_args()
P = json.load(open(a.profile))['frames']; B = json.load(open(a.beats))
t0, t1 = P[0]['t'], P[-1]['t']
W, H, pad = 2400, 700, 60
img = np.full((H, W, 3), 22, np.uint8)
X = lambda t: int(pad + (t - t0) / (t1 - t0) * (W - 2 * pad))
vals = [r.get(a.key) or 0 for r in P]
vmax = max(1e-6, np.percentile(vals, 99) * 1.1)
Y = lambda v: int(H - pad - min(v, vmax) / vmax * (H - 2 * pad))
for s in range(int(t0), int(t1) + 1):
    cv2.line(img, (X(s), pad), (X(s), H - pad), (45, 45, 45), 1); cv2.putText(img, f'{s}s', (X(s) - 10, H - 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (160, 160, 160), 1)
for b in B.get('beats', []):
    if t0 <= b <= t1: cv2.line(img, (X(b), H - pad), (X(b), H - pad + 12), (90, 200, 230), 2)
for b in B.get('downbeats', []):
    if t0 <= b <= t1: cv2.line(img, (X(b), H - pad), (X(b), H - pad + 24), (60, 160, 255), 3)
for c in [float(x) for x in a.cuts.split(',') if x]:
    cv2.line(img, (X(c), pad), (X(c), H - pad), (80, 80, 220), 2)
def curve(rows, col):
    pts = np.array([[X(r['t']), Y(r.get(a.key) or 0)] for r in rows], np.int32)
    cv2.polylines(img, [pts], False, col, 2, cv2.LINE_AA)
curve(P, (90, 170, 230))
if a.overlay: curve(json.load(open(a.overlay))['frames'], (120, 230, 120))
# duplicate frames (diff ~ 0) as red dots
for r in P:
    if r['t'] > t0 and r['diff'] < 0.15: cv2.circle(img, (X(r['t']), H - pad - 4), 4, (60, 60, 255), -1)
cv2.putText(img, f'{a.key} (px/frame @640w), max {vmax:.1f}; red lines = cuts, blue ticks = beats, red dots = repeated frames', (pad, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (220, 220, 220), 1)
cv2.imwrite(a.out, img)
