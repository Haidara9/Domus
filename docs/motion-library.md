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
