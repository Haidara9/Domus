# Motion, transition, color and sound libraries

List them live with `node engine/bin/domus.mjs library components|transitions|grades|sfx|formats`.

## Motion components (`library/motion/components/`)
| Component | Track | Key props |
|---|---|---|
| `archTitle` | text | `title`, `subtitle`, `at:[x,y]`, `size`, `align:auto\|left\|right\|center`, `color`, `rule`, `shadow`, `maxWidth` |
| `kineticWords` | text | `text`, `highlight:[words]`, `times:[t per word]` (beat lock), `stagger`, `spring` |
| `lowerThird` | text | `title`, `subtitle`, `at:[margin,y]`, `side:auto\|left\|right` |
| `priceTag` | text | `label`, `value`, `currency`, `count` (default false) |
| `counter` | text | `index`, `total`, `at` |
| `specCard` | text | `items:[{icon,value,unit,label}]`, `card:paper\|dark\|none`, `digits:latin\|arabic`, `count` |
| `callout` | text | `anchor:[x,y]` (keyframe it to track), `offset`, `label`, `sub` |
| `mapPin` | text | `at`, `label`, `items:[{label,value}]` (max 3, real distances only) |
| `paperBackground` | animation | `seed`, `fibres`, `light` |
| `archLines` | animation | `at`, `scale`, `arches`, `column`, `drawDur` |
| `brandStatement` | text/animation | `title`, `body`, `at:[edgeX, y]`, `bracket` |
| `logoReveal` | animation | `logo` (image key from `brand.json` logos or `props.images`), `width`, `sweep`, `rules` |
| `endCard` | animation | `cta`, `lines:[…]`, `location`, `bg` |
| `lightSweep` | vfx | `angle`, `width`, `strength`, `color` |
| `letterbox` | vfx | `aspect` |
| `filmGrain` | vfx | `strength` (rendered by FFmpeg `noise` in the composite; canvas version is used in HyperFrames exports) |
| `lightDust` | vfx | `area:[x,y,w,h]`, `count`, `wind` |
| `vignette` | vfx | `strength`, `radius` |
| `flash` | vfx | `peak`, `color` |
| `perspectiveOutline` | animation | `points` (reference-frame coords on real edges), `track`, `closed`, `drawDur`, `inset` (second line), `brackets`, `dash`, `glint`, `width`. Metal line with spark head; retracts on exit |
| `tagCard` | text | `anchor`, `offset`, `title`, `sub`, `track` (position). Diamond anchor, metal leader with spark, petrol glass card whose border traces itself, reverse exit |
| `chapter` | text | `index`, `total`, `title`, `sub`, `at`. Backdrop, rolling number with a light pass, metal rule, progress segments |
| `strokeWord` | animation | `text`, `at`, `size`, `fill`, `width`. Metal outline wipe with sparks on the edge |
| `introTitle` | animation | `title`, `sub`, `at`, `size`. Double arch rising from both bases, apex flash, petrol glow, dust, streak |
| `areaReveal` | animation | `value`, `unit`, `sup`, `label`, `sub`, `at` (baseline), `size`, `land` (beat time), `depth`. Extruded gold numeral, odometer digits, landing burst, dimension line, brackets, reflection. Pair with clip `fx` defocus + darken |
| `lightLeak` | vfx | `colors` (palette names or hex), `dir`, `strength`, `seed`. 0.4-0.8 s on a cut |

Shared helpers in the runtime: `D.PAL()` (brand + extended accents), `D.metal` (copper/gold sheen gradient),
`D.polylineRange`, `D.pathPoint`, `D.spark`, `D.sparks` (deterministic bursts), `D.bracket`, `D.sheenMasked`, `D.offscreen`.

Icons for `specCard`: `area, bed, bath, parking, floors, view, garden, pool, elevator`.

### Generic controls (every component)
- `in: {style, dur, ease}` / `out: {…}`. Styles: `none, fade, rise, sink, blur, scale, mask-up, wipe-start, wipe-end`.
- `loop: {style: float|drift|breathe, amp, period}`.
- `keys: {prop: [[t, value, ease], …]}` keyframes any numeric or `[x,y]` prop (e.g. `anchor` for manual tracking).
- Eases: `architectural` (house default), `glide`, `snap`, `exit`, plus `inOutSine`, `outCubic`, `outExpo`, `outBack`, …
- Springs: `D.springP(t, 'snappy'|'default'|'heavy'|'playful')`.

## Camera moves (V1 clips: `camera`)
`static, push-in, pull-out, pan-left, pan-right, tilt-up, tilt-down, drift` with `amount` (zoom fraction),
`span` (pan travel), `ease`, plus `keys: [[t, zoom, fx, fy], …]` for custom moves. `reframe: {focus:[x,y], zoom}`
positions the crop when the source aspect differs from the canvas. `stabilize: {smoothing, zoom}` (vid.stab two-pass).
`speed` or `ramp: [{at, speed}]` (smooth ramps; `interpolate: true` enables motion interpolation, test before use).
`camera.shake: [{at, dur, amp (px), freq}]` adds a damped shake (needs zoom > 1 for margin; use on impact cuts only).
Tracked overlays automatically follow the clip's camera (keys, moves, shake): the engine attaches the move as `props._cam`.

## Speed-ramp redesign (V1 clips: `timemap`)
`timemap: [[outLocal, srcLocal], …]` is a free speed curve that keeps the clip's duration (cuts stay on the music).
Rendered by `engine/tools/retime.py`: a frame whose remapped time lands on a real source frame is that exact frame;
only in-betweens come from motion-compensated 120 fps interpolation, so fast moves keep their original pixels.
Design it from the footage, not by hand:
`domus motion <dir> <mediaId> <t0> <t1>` (per-frame camera-speed profile; `engine/tools/plot_profile.py` draws it with
cuts and beats), then `domus ramp-redesign <dir> <clipId> --profile … --beat <downbeat> [--end t]`
(smooth curve, same content, fastest moment on the beat, never slows a fast move, removes repeated-frame stutter).
Tracked overlays read their track at the remapped source time automatically (`props.trackOrigin` = source time of track t=0).

## Footage FX (V1 clips: `fx`)
Light and optics on the picture itself; geometry never changes. Times are local to the clip.
| type | what | props |
|---|---|---|
| `exposure`, `saturation`, `contrast` | animated `eq` pulses (or constant without `at`) | `at`, `dur`, `amount`, `shape` |
| `bloom` | warm highlight glow (screen blend) | `amount`, `threshold`, `radius`, `tint:[r,g,b]`, optional pulse `at/dur/shape` |
| `defocus` | lens defocus (rack or hold), e.g. behind a hero number | `amount` 0..1, `radius`, `at`, `dur`, `shape: hold` |
| `fringe` | lens colour fringe for 2-3 frames on an impact cut | `at`, `dur`, `px` |

Shapes: `bell`, `flash` (fast attack), `hold` (rises over `rise`/`dur` and stays), `fall`. Bloom/defocus opacities are
sent per frame with `sendcmd` (per-pixel blend expressions are ~6x slower).

## Transitions (`library/transitions/transitions.json`)
`cut, dissolve, dip-black, dip-white, dip-paper, whip-left/right/up/down, push-left/right, zoom-through,
focus-blur, iris, wipe-arch`. Set on the outgoing clip: `transition: {type, dur}`.

## Grades (`library/color/grades.json`)
`architectural-neutral, domus-warm-paper, golden-hour, twilight-blue-hour, apple-minimal, editorial-soft,
commercial-crisp, documentary-natural, mono-architectural`. Per-clip override object: `preset, exposure,
temperature, saturation, contrast, gamma, vibrance, sharpen, vignette, lut, match`.

## Sound (synthesized in `engine/src/audio.mjs`)
`whoosh, swish, riser, impact, hit, click, shimmer, swell, roomtone, air`. Real recordings (licensed or CC0)
can go in `library/sfx/` and be placed with `add <dir> audio sfx --path …`.
