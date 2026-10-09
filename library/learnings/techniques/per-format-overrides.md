# Per-format overrides (`byFormat`)

**What:** one timeline, several ratios. When a layout that works in 9:16 crowds in 4:5 or 16:9, add `byFormat` to
that item or clip instead of forking the timeline:
```json
{ "component": "archLines", "props": { "at": [0.66, 0.985], "scale": 1.35 },
  "byFormat": { "feed-4x5": { "props": { "at": [0.66, 1.0], "scale": 0.95 } } } }
```
For clips: `"byFormat": { "wide-16x9": { "reframe": { "focus": [0.4, 0.5] } } }`.

**Check:** `domus still <dir> <t> --format feed-4x5` before rendering every format.

**Proven in:** 2026-10-domus-brand-statement (line-art arches collided with text in 4:5).
