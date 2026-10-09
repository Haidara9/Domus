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

## v4 (owner feedback on v3: graphics/animation need more, copper lines more, more colour, shots have no effects, add 130 m²)
- The owner's clip is split at the owner's own cuts (1.367, 4.467, 4.9, 5.3, 6.4, 6.833, 9.3, 21, 24): same frames, same
  timing, nothing removed. Each shot now carries a camera move and light FX (engine `fx`):
  punch-ins settling on every cut, exposure flash + 2-frame lens fringe, shake on the hardest hits, warm bloom
  (strong on the night street, pulsing when graphics land), a slow breathing zoom on the long walkthrough.
- Tracked graphics follow those camera moves automatically (`props._cam`), so labels stay on the real features.
- Copper lines v2: metal copper-to-gold sheen, spark head while drawing, inset second line with a flowing dash,
  corner brackets and diamond nodes, comet glint, retract on exit.
- Graphics v2: tag cards (diamond anchor, rotating ring, petrol glass, border that traces itself, reverse exit),
  chapters (backdrop, light pass, metal rule, progress segments), intro (double arch rising to an apex flash, petrol glow,
  dust, streak), stroke word (metal outline, sparks).
- Colour: extended accents in brand.json (gold, ember, petrol/teal) + light leaks on four transitions + saturation +7%.
- 22.0-25.0: **130 m²** hero (fact from the owner): footage defocuses and darkens, a floor line draws out, the extruded gold
  numeral rises from depth while its digits roll, the last digit lands on the beat at 23.03 with flash, sparks, streak,
  footage bloom flash and shake, riser + impact + hit; dimension line, brackets, «المساحة · AREA», reflection.
  Chapter 04 (office 1) was removed: the area figure is the ending of this 25 s cut.

## v5 (owner feedback on v4) - first 15 s only
- Owner: 130 m² + closing go at the end of the full film, when we return to the frontage (areaReveal now brand copper
  with glow, kept in the library for that moment). Graphics stayed too briefly: each one now holds >= 2 s, with slower,
  smoother entrances (soft-focus word rise, longer leaders/borders, eased exits); the intro title stays locked to its SFX hit.
- Speed ramps analysed per frame (analysis/motion_0-16.json/.png): bursts at 8.45 s and 11.2 s, steep edges, stutter at
  9.4-9.7 s. Redesigned (v9 and the first 3.3 s of v10): same cuts and content, smooth curve, peaks on the downbeats
  8.38 / 11.05 (+-1 frame), fast moves never slowed, stutter removed. Rendered frame-accurately with retime.py.
- Re-tracked for the longer holds: street (to 3.9 s), shopfront (back to 2.37 s), wood column (to 13.7 s).
