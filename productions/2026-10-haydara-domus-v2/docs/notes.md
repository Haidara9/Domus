# Haydara Domus v2: first 25 s, enhancement on top of the owner's edit

Owner feedback on v1: cutting shots + only lower thirds wasn't professional; ramping on top of an edited video broke the motion.
v2 rules: keep every shot, the timing and the owner's own speed ramps. Add motion design only.

- 0-1.37: owner's "FOR SALE" card replaced by an Arabic title reveal («مكتب للبيع») with a horizontal light streak + impact.
- Camera-tracked graphics (engine/tools/track.py, OpenCV LK + homography; real motion from the footage):
  street label «على الشارع مباشرة», copper outline drawn exactly on the shopfront glass frame (perspective),
  «واجهة زجاجية», «تكسية خشبية» on the slat column, «مكتبة جدارية», «الحمام» on the bathroom door, «مكتب 1».
  Labels use position-only tracking (constant size, readable).
- 21-24: motivated push-in to the bathroom (1.0 → 1.33, no quality loss from 2560 source) that frames out the
  owner's burned-in corner label and corner logo.
- Sound: owner's track kept; impact, swish, click per label, shimmer on the outline, swell into the push-in.

Dropped after review: a second shopfront outline (5.3-6.4) and a desk label: the tracking drifted there (fast motion + parallax
through glass), and inaccurate lines are worse than none.

Engine bug found and fixed here: ffmpeg crop freezes iw/ih at the first frame, so animated push-ins never moved their framing.
