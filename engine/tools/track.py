#!/usr/bin/env python3
"""Planar camera tracking for pinning graphics into footage.

Tracks feature points inside a region (normalized x,y,w,h in the frame at t0) from t0 to t1 and writes
one homography per frame that maps normalized coordinates at t0 to normalized coordinates at t.
Graphics drawn in t0 coordinates then stay locked to the surface (glass facade, wall, door...).

usage: python3 track.py VIDEO T0 T1 --roi x,y,w,h --out track.json [--width 960] [--back]
  --back  also track backwards from T0 to an earlier start (use T1 < T0)
The motion is real (from the footage). Nothing in the picture is altered.
"""
import argparse, json, sys
import numpy as np
import cv2

ap = argparse.ArgumentParser()
ap.add_argument('video'); ap.add_argument('t0', type=float); ap.add_argument('t1', type=float)
ap.add_argument('--roi', default='0.1,0.1,0.8,0.8'); ap.add_argument('--out', required=True)
ap.add_argument('--width', type=int, default=960)
a = ap.parse_args()

cap = cv2.VideoCapture(a.video)
fps = cap.get(cv2.CAP_PROP_FPS) or 30
start, end = min(a.t0, a.t1), max(a.t0, a.t1)
cap.set(cv2.CAP_PROP_POS_MSEC, start * 1000)
frames = []
while True:
    t = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000
    ok, f = cap.read()
    if not ok or t > end + 1e-3: break
    h, w = f.shape[:2]; s = a.width / w
    frames.append((t, cv2.cvtColor(cv2.resize(f, (a.width, int(h * s))), cv2.COLOR_BGR2GRAY)))
if len(frames) < 2: sys.exit('not enough frames')
reverse = a.t1 < a.t0
if reverse: frames = frames[::-1]
H_img, W_img = frames[0][1].shape
x, y, rw, rh = [float(v) for v in a.roi.split(',')]
N = np.array([[W_img, 0, 0], [0, H_img, 0], [0, 0, 1]], float)  # normalized -> pixels

def detect(img, H_acc):
    mask = np.zeros_like(img)
    # region at the current frame = initial region mapped by accumulated motion
    P = (N @ H_acc @ np.linalg.inv(N))
    corners = np.array([[x * W_img, y * H_img], [(x + rw) * W_img, y * H_img], [(x + rw) * W_img, (y + rh) * H_img], [x * W_img, (y + rh) * H_img]], np.float32)
    cur = cv2.perspectiveTransform(corners[None], P)[0].astype(np.int32)
    cv2.fillConvexPoly(mask, cur, 255)
    pts = cv2.goodFeaturesToTrack(img, 400, 0.01, 8, mask=mask, blockSize=7)
    if pts is None or len(pts) < 30:  # region drifted off-frame: fall back to the whole frame
        pts = cv2.goodFeaturesToTrack(img, 500, 0.01, 8, blockSize=7)
    return None if pts is None else pts.astype(np.float32)

H_acc = np.eye(3)  # normalized(t0) -> normalized(t)
out = [{'t': round(frames[0][0], 4), 'H': H_acc.flatten().tolist()}]
prev = frames[0][1]
p0 = detect(prev, H_acc)
lk = dict(winSize=(21, 21), maxLevel=3, criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 30, 0.01))
lost = 0
for t, img in frames[1:]:
    if p0 is None or len(p0) < 40: p0 = detect(prev, H_acc)
    if p0 is None or len(p0) < 8:
        lost += 1; out.append({'t': round(t, 4), 'H': H_acc.flatten().tolist()}); prev = img; continue
    p0 = p0.astype(np.float32)
    p1, st, _ = cv2.calcOpticalFlowPyrLK(prev, img, p0, None, **lk)
    pb, st2, _ = cv2.calcOpticalFlowPyrLK(img, prev, p1, None, **lk)
    good = (st.ravel() == 1) & (st2.ravel() == 1) & (np.linalg.norm((p0 - pb).reshape(-1, 2), axis=1) < 1.5)
    a0, a1 = p0[good].reshape(-1, 2), p1[good].reshape(-1, 2)
    inl = None
    if len(a0) >= 8:
        Hs, inl = cv2.findHomography(a0, a1, cv2.RANSAC, 2.0)
        if Hs is None: Hs = np.eye(3); lost += 1
    else:
        Hs = np.eye(3); lost += 1
    Hn = np.linalg.inv(N) @ Hs @ N  # pixel step -> normalized step
    H_acc = Hn @ H_acc
    H_acc /= H_acc[2, 2]
    out.append({'t': round(t, 4), 'H': H_acc.flatten().tolist()})
    prev, p0 = img, (a1.reshape(-1, 1, 2) if len(a1) else None)
    if p0 is not None and inl is not None and len(a0) >= 8:
        p0 = a1[inl.ravel() == 1].reshape(-1, 1, 2)
if reverse: out = out[::-1]
json.dump({'video': a.video, 't0': a.t0, 'fps': fps, 'roi': [x, y, rw, rh], 'lostFrames': lost, 'frames': out}, open(a.out, 'w'))
print(f'tracked {len(out)} frames ({out[0]["t"]:.2f}-{out[-1]["t"]:.2f}s), lost {lost} -> {a.out}')
