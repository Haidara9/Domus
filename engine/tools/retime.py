#!/usr/bin/env python3
"""Frame-accurate time remap (speed-ramp redesign) for one clip.

For every output frame i the remap gives a source time s_i. If s_i lands on (or is snapped to) a real source
frame, that exact frame is used. Otherwise the frame comes from a motion-compensated 120 fps interpolation.
Real frames are never resynthesized, so fast camera moves keep their original pixels.

usage: python3 retime.py SRC IN OUT MAP.json OUT.mp4 --size WxH [--fps 30] [--draft]
MAP.json: {"frames": N, "src": [s_0 .. s_N-1]}  (source times local to IN)
"""
import argparse, json, os, subprocess, tempfile
import numpy as np, cv2

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('t_in', type=float); ap.add_argument('t_out', type=float)
ap.add_argument('map'); ap.add_argument('out'); ap.add_argument('--size', required=True)
ap.add_argument('--fps', type=float, default=30); ap.add_argument('--draft', action='store_true')
a = ap.parse_args()
W, H = [int(x) for x in a.size.split('x')]
M = json.load(open(a.map)); S = M['src']
fps, up = a.fps, 4
tmp = tempfile.mkdtemp(prefix='retime_')
base = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', f'{a.t_in:.6f}', '-to', f'{a.t_out + 0.3:.6f}', '-i', a.src]
grid = f'setpts=N/({fps}*TB),scale={W}:{H}:flags=lanczos'
orig, interp = os.path.join(tmp, 'orig.mkv'), os.path.join(tmp, 'interp.mkv')
need_interp = any(abs(s * fps - round(s * fps)) > 0.12 for s in S)
subprocess.run(base + ['-vf', grid, '-c:v', 'ffv1', orig], check=True)
if need_interp:
    mi = f'framerate=fps={fps * up}' if a.draft else f'minterpolate=fps={fps * up}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=none'
    subprocess.run(base + ['-vf', f'{grid},{mi}', '-c:v', 'libx264', '-crf', '10', '-preset', 'veryfast', interp], check=True)

class Reader:
    def __init__(self, path):
        self.cap = cv2.VideoCapture(path); self.idx = -1; self.frame = None
    def get(self, k):
        k = max(0, k)
        while self.idx < k:
            ok, f = self.cap.read()
            if not ok: break
            self.idx += 1; self.frame = f
        return self.frame

ro = Reader(orig); ri = Reader(interp) if need_interp else None
enc = subprocess.Popen(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', f'{fps}', '-i', '-',
                        '-c:v', 'libx264', '-crf', '12', '-preset', 'medium', '-pix_fmt', 'yuv420p', a.out], stdin=subprocess.PIPE)
used = {'orig': 0, 'interp': 0}
for s in S:
    q = s * fps
    if abs(q - round(q)) <= 0.12 or ri is None:
        f = ro.get(int(round(q))); used['orig'] += 1
    else:
        f = ri.get(int(round(s * fps * up))); used['interp'] += 1
    enc.stdin.write(np.ascontiguousarray(f).tobytes())
enc.stdin.close(); enc.wait()
for p in (orig, interp):
    if os.path.exists(p): os.remove(p)
os.rmdir(tmp)
print(json.dumps(used))
