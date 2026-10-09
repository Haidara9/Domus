# Timeline format `domus.timeline/1`

`productions/<slug>/timeline.json` is the editable, non-destructive source of truth. Source media are never
modified. All times are seconds, snapped to the `1/fps` grid on every edit.

```jsonc
{
  "schema": "domus.timeline/1",
  "title": "Sea View Villa",
  "format": "reel-9x16", "width": 1080, "height": 1920, "fps": 30,
  "brand": "brand/brand.json",
  "grade": { "global": "architectural-neutral" },
  "audioTarget": { "lufs": -14, "truePeak": -1.5 },          // optional
  "media": {
    "ext-drone": { "path": "media/DJI_0012.MP4", "kind": "video", "duration": 32.1, "width": 3840, "height": 2160, "fps": 29.97, "hasAudio": false }
  },
  "tracks": {
    "video": [            // V1, magnetic: each clip starts where the previous ends, minus the transition
      { "id": "v1", "media": "ext-drone", "in": 4.0, "out": 8.5,
        "camera": { "move": "push-in", "amount": 0.06, "ease": "inOutSine" },   // or keys: [[t, zoom, fx, fy], …], shake: [{at, dur, amp, freq}]
        "timemap": [[0, 0], [1.2, 0.9], [2.4, 2.4]],   // optional speed curve (keeps duration); see motion-library.md
        "fx": [ { "type": "bloom", "amount": 0.3 }, { "type": "exposure", "at": 0, "dur": 0.4, "amount": 0.15, "shape": "flash" } ],
        "reframe": { "focus": [0.55, 0.6] },
        "speed": 1, "ramp": null, "stabilize": null,
        "grade": "golden-hour",
        "transition": { "type": "dissolve", "dur": 0.6 },
        "label": "approach" }
    ],
    "text":      [ { "id": "t1", "component": "archTitle", "start": 0.4, "dur": 2.8, "props": { "title": "…" } } ],
    "animation": [ { "id": "g1", "component": "paperBackground", "start": 20, "dur": 4, "props": {} } ],
    "vfx":       [ { "id": "x1", "component": "lightSweep", "start": 0.2, "dur": 2 } ],
    "audio": [
      { "id": "a1", "kind": "music", "path": "media/track.wav", "start": 0, "in": 12, "gain": -16, "fadeIn": 0.5, "fadeOut": 2 },
      { "id": "a2", "kind": "sfx", "type": "whoosh", "start": 4.2, "gain": -8 },
      { "id": "a3", "kind": "vo", "path": "media/vo.wav", "start": 1.0 }
    ]
  },
  "markers": [ { "t": 12.0, "label": "drop" } ]
}
```

## Rules
- **Layering** (bottom → top): V1 → `animation` → `vfx` → `text`. Override with `layer` (number). Hide with `hidden: true`.
- **Overlay items** (`text/animation/vfx`) have an absolute `start` and `dur`.
- **Duration** = end of the last V1 clip (or the latest overlay/audio end when V1 is empty), or `duration` if set.
- **IDs** are prefixed by track (`v`, `t`, `g`, `x`, `a`) and unique across the timeline.
- **Versioning:** `versions/NNNN.json` snapshots plus `versions/log.json`. `domus history | diff vA vB | revert v`.
- **Caching:** `cache/segments` (per clip: hash of clip + source + canvas + grade presets), `cache/overlays`
  (hash of component source + props + fonts + images), `cache/base`, `cache/audio`. Delete `cache/` to force
  a clean render; it is never committed.
- **Formats:** `render --format <f>` swaps the canvas. Per-format overrides: any clip or item may carry `byFormat: {"feed-4x5": {props: {...}}, "wide-16x9": {reframe: {...}}}`, deep-merged for that format only. Clips re-crop around `reframe.focus` and overlay
  positions are normalized, so one timeline drives every ratio.
