#!/usr/bin/env python3
"""Per-frame camera-motion profile of a finished edit (to read its speed ramps).

For each frame pair: global motion from tracked corners (RANSAC similarity): translation (px at --width),
rotation, zoom; the magnitude is the perceived camera speed. Also the mean abs frame difference to spot
duplicated frames (stutter from slow-motion without interpolation) and blended frames.

usage: python3 motion_profile.py VIDEO T0 T1 --out profile.json [--width 640]
"""
import argparse, json, math
import numpy as np
import cv2

ap = argparse.ArgumentParser()
ap.add_argument('video'); ap.add_argument('t0', type=float); ap.add_argument('t1', type=float)
ap.add_argument('--out', required=True); ap.add_argument('--width', type=int, default=640)
a = ap.parse_args()
cap = cv2.VideoCapture(a.video)
fps = cap.get(cv2.CAP_PROP_FPS) or 30
cap.set(cv2.CAP_PROP_POS_FRAMES, int(round(a.t0 * fps)))
prev = None; rows = []
i = int(round(a.t0 * fps))
while i <= int(round(a.t1 * fps)):
    ok, f = cap.read()
    if not ok: break
    h, w = f.shape[:2]; s = a.width / w
    g = cv2.cvtColor(cv2.resize(f, (a.width, int(h * s))), cv2.COLOR_BGR2GRAY)
    row = {'t': round(i / fps, 4), 'speed': None, 'dx': 0, 'dy': 0, 'rot': 0, 'zoom': 0, 'diff': 0, 'n': 0}
    if prev is not None:
        row['diff'] = float(np.mean(cv2.absdiff(g, prev)))
        p0 = cv2.goodFeaturesToTrack(prev, 400, 0.01, 8)
        if p0 is not None and len(p0) >= 8:
            p1, st, _ = cv2.calcOpticalFlowPyrLK(prev, g, p0, None, winSize=(21, 21), maxLevel=4)
            good = st.ravel() == 1
            if good.sum() >= 8:
                M, inl = cv2.estimateAffinePartial2D(p0[good], p1[good], method=cv2.RANSAC, ransacReprojThreshold=2.0)
                if M is not None:
                    sc = math.hypot(M[0, 0], M[1, 0]); rot = math.atan2(M[1, 0], M[0, 0])
                    # speed: mean displacement of a grid under M (translation + rotation + zoom), px/frame
                    H_, W_ = g.shape
                    xs, ys = np.meshgrid(np.linspace(0.1, 0.9, 5) * W_, np.linspace(0.1, 0.9, 5) * H_)
                    P = np.stack([xs.ravel(), ys.ravel(), np.ones(25)])
                    Q = M @ P
                    disp = np.hypot(Q[0] - P[0], Q[1] - P[1]).mean()
                    flow = np.hypot(*(p1[good] - p0[good]).reshape(-1, 2).T)
                    row.update(speed=float(disp), flow=float(np.median(flow)), dx=float(M[0, 2]), dy=float(M[1, 2]), rot=float(math.degrees(rot)), zoom=float(sc - 1), n=int(inl.sum()) if inl is not None else 0)
    rows.append(row); prev = g; i += 1
json.dump({'video': a.video, 'fps': fps, 'width': a.width, 'frames': rows}, open(a.out, 'w'))
print(f'{len(rows)} frames -> {a.out}')
