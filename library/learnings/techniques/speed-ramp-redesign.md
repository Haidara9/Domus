# Redesigning the speed ramps of a finished edit

Context: Haydara Domus (owner's edit, ramps baked in). Owner: don't just speed up or slow down; analyse the ramps,
speeds, keyframes, rhythm and music, and make an improved, smoother version of the original ramp.

1. Measure, don't guess: `domus motion` gives the perceived camera speed per frame (RANSAC similarity on tracked
   corners) and flags repeated frames. Plot it against cuts and beats (`plot_profile.py`).
2. Read the ramp: in the first 15 s the edit has two bursts (peaks 8.45 s and 11.2 s) with steep edges, the peaks
   slightly off the downbeats (8.38, 11.05), and stutter (repeated frames) at 9.4-9.7 s.
3. Redesign per shot: keep both ends (cuts stay on the music) and the total camera travel (same content), smooth the
   speed curve, place the fastest moment on the downbeat.
4. Never slow a fast move: interpolating blurred whips ghosts. Cap screen time at one frame per source frame where
   speed > 25 px/frame, give the saved time to calm frames (clean to interpolate), and snap to real frames there.
5. Render frame-accurately (`retime.py`): real frames pass through untouched; only in-betweens are synthesized.
   (ffmpeg minterpolate re-synthesizes every frame, even aligned ones: never use it as the picker.)
