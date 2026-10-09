# DOMUS Super Editor

<div dir="rtl">

**استوديو إنتاج سينمائي ذكي لـ دوموس العقارية (اللاذقية).** نظام متعدد الوكلاء يحوّل لقطات العقار
إلى أفلام وريلات بمستوى After Effects وPremiere وDaVinci، بهوية دوموس، ومن غير ما يغيّر أي شي حقيقي بالعقار.

- **محرك تايملاين** قابل للتعديل وغير مدمّر ودقيق للفريم، بمسارات منفصلة للفيديو والنص والموشن والمؤثرات والصوت. كل تعديل محفوظ كنسخة، وكل تعديل بيعيد رندر بس الجزء اللي تغيّر.
- **مكتبات جاهزة:** حركات كاميرا، انتقالات (whip وdissolve وdip وغيرها)، عناوين معمارية، بطاقات مواصفات، لوغو، مؤثرات ضوء، تدرجات لون، ومؤثرات صوتية مولّدة بلا حقوق.
- **سبع وكلاء متخصصين** بإدارة مخرج واحد: إبداعي، تحليل تصوير، مونتاج، موشن، تلوين، صوت، جودة.
- **تصدير** لكل المنصات من نفس التايملاين، مع فحص جودة تلقائي (المدة، الدقة، الفريمات، الصوت، المناطق الآمنة)، ومشروع HyperFrames قابل للتعديل باليد.

</div>

## Quick start
```sh
cd engine && npm install && cd ..            # Node 20+, FFmpeg required
node engine/bin/domus.mjs new productions/2026-10-villa --format reel-9x16 --title "Villa"
node engine/bin/domus.mjs import productions/2026-10-villa ~/shoot/*.mp4
node engine/bin/domus.mjs analyze productions/2026-10-villa
node engine/bin/domus.mjs add-clip productions/2026-10-villa <mediaId> --in 2 --out 5.5 --camera push-in:0.06 --transition dissolve
node engine/bin/domus.mjs add productions/2026-10-villa text archTitle --start 0.4 --dur 3 --props '{"title":"فيلا على البحر"}'
node engine/bin/domus.mjs render productions/2026-10-villa --draft
```
With Claude: ask for a production and the `domus-studio` skill runs the whole pipeline
(Brief → Analysis → Concepts → Storyboard → Shots → Timeline → Motion → Color → Sound → Preview → QC → Export → Learnings).

## What's verified
| Capability | Status |
|---|---|
| Timeline edits (add/trim/slip/split/move/set), frame snapping, versions/diff/revert | ✅ unit tests |
| Render: segments with camera moves, speed/ramps, stabilization, grades; transitions; alpha overlays; two-pass loudness | ✅ end-to-end test + rendered films |
| Targeted re-render (only changed clips/overlays) | ✅ test asserts the cache |
| Arabic RTL typography (shaping, alignment, RTL units) | ✅ visually checked |
| QC (spec, loudness, black/frozen, safe zones, contact sheet) | ✅ |
| HyperFrames export (`hyperframes check` = 0 errors; snapshots render) | ✅ |
| Analysis: shots, sharpness/exposure/motion scoring, beats, shot matching | ✅ runs; scoring heuristics need tuning on real footage |
| Official brand fonts & logo | ⏳ waiting for files (placeholders in use) |

## Map
| Path | What |
|---|---|
| `CLAUDE.md` | Operating rules for Claude (authenticity, facts, brand, review loop) |
| `.claude/agents/` | Creative Director, Cinematography Analyst, Master Editor, Motion/VFX Artist, Colorist, Sound Designer, Quality Supervisor |
| `.claude/skills/` | `domus-studio` (production playbook), `domus-learn` (turn productions into reusable craft) |
| `engine/` | `domus` CLI: timeline, renderer, overlays, audio, analysis, QC, HyperFrames export |
| `library/` | motion components, transitions, grades, SFX, learnings |
| `brand/` | brand tokens, fonts, logos, guidelines |
| `docs/` | [tool audit](docs/tool-audit.md) · [cinematic standards](docs/cinematic-standards.md) · [creative directions](docs/creative-directions.md) · [brand](docs/brand.md) · [motion library](docs/motion-library.md) · [timeline spec](docs/timeline-spec.md) |
| `productions/` | one folder per film (`_template/`) |
| `reference/` | reference videos and breakdowns |
| `tools/` | environment check and optional external tools |
