# DOMUS Animation Studio

مكتبة 46 وصفة أنيميشن من دليل Shaan Johari، مع إعداد Remotion مستقل لدوموس.
تمت قراءة البطاقات الموسعة وتعليمات الاستخدام والملاحظات الختامية بتاريخ 2026-11-04.
السجلات ملاحظات تنفيذ مكتوبة للمشروع، وليست إعادة نشر حرفية للدليل.
[المصدر الأصلي، بما فيه البرومبتات الكاملة والأمثلة ونسب الإلهام](https://ruby-cotija-fb5.notion.site/Animation-styles-you-can-build-with-Claude-or-Codex-3fa28691eca3814ebb34c73a7cc261bf).

**أربع بدايات منفذة، و42 وصفة تحتاج بناء مشهد عند الطلب.** وجود الوصفة لا يعني أن فيديوها
الأصلي تم تنفيذه. مشاهد 3D تحتاج نماذج ومواد وإضاءة فعلية، ولا يتم ادعاء تنفيذها بصور مسطحة.

## Setup

Node 22.18+ and npm. From `animation-studio/`:

```sh
npm ci --ignore-scripts
npm run prepare:assets
npm run commands
npm run typecheck
npm test
npm run doctor
npm run studio
```

Open http://localhost:3106. On Windows, double-click `Open_DOMUS_Animation_Studio.cmd`.
The launcher stops on errors and does not change global configuration or read API credentials.
`prepare:assets` copies the existing Cairo/Playfair Display fonts and original logos and generates
current colors from `brand/brand.json`. Re-run when the identity changes. Prepared assets and
private media are ignored by Git. Dependencies are locked; no AI service is required.

## Choose a recipe

```sh
npm run styles -- list
npm run styles -- list preferred
npm run styles -- show pencil-to-blueprint
npm run styles -- prompt swiss-grid examples/concept.json
```

Codex uses `node animation-studio/bin/styles.mjs` from the repository root; see `AGENTS.md`.
Claude Code has `/animation-style` plus 46 `/anim-<id>` commands. These are project-scoped.
Command regeneration preserves edited commands; explicit `--replace` is needed to overwrite edits.
A brief must include exact owner text, kind, explicit demo flag and sources. Real property/data/
comparison briefs require dated source records. This records supplied provenance, not automatic
fact verification. The incomplete property template intentionally fails validation.

Source names, palettes, fonts, movement, restrictions, part and link are stored in
`catalog/styles.json`. DOMUS overrides are separate. Fit labels are `preferred`, `adapt`, and
`concept-only`; the last is not permission to reconstruct a real property or add fictional geography.

## Executable starters

| Composition | Reference | Editable content |
|---|---|---|
| DomusSwissGrid | Swiss Grid | Arabic lines, subtitle, demo label |
| DomusEditorial | Magazine Layout and Note | Title, copy, note, optional authorized image |
| DomusStatChart | Stat Chart | Finite nonnegative values, unit and source |
| DomusBeforeAfter | Before and after slider | Two authorized aligned images and truthful labels |

All are original DOMUS adaptations at 1080×1920, 30fps, 5s, silent. Their default abstract shapes
and numeric values are visibly marked **نموذج توضيحي** and are not property or performance claims.
A starter is not a pixel-identical replica of the source demonstration. Keep owner images under
`public/media/` and use relative `media/...` props. Before/after must show actual aligned changes;
decoration proposals must be explicitly labeled. Never upload private client media into Git.

## Existing engine bridge

Keep real footage assembly in `engine/`. Remotion does not directly edit the production timeline.
After approving the exact graphic, render it and import it explicitly:

```sh
npx remotion render src/index.ts DomusSwissGrid out/title.mp4
node ../engine/bin/domus.mjs import ../productions/<slug> out/title.mp4
```

MP4 does not carry alpha. Use Remotion's documented ProRes 4444 alpha export for transparent overlays.
Source-duration, audio and transition instructions remain authoritative. No sound is added by setup.

## Priority

Owner instructions → existing DOMUS rules → confirmed production brief → selected reference recipe.
Use Cairo for joined Arabic and Playfair Display for English. Animate Arabic words or lines; isolate
number runs left-to-right. Keep the original logo unchanged, including its O. A recipe's source
palette or font is not an automatic change to DOMUS identity. Source crossfade restrictions do not
supersede explicit owner directions for real footage. Loop recipes retain their specific endings.
No invented measurements, views, maps, bookings, sales, testimonials or engagement fill template slots.
No paid APIs, publication, client upload or global prompt installation is authorized by these commands.

`npm test` covers provenance, text preservation, chart synchronization and media boundaries.
`typecheck` and `bundle` check actual composition code. Rendered output still needs Arabic/logo,
layout, safe-area and motion review. See `docs/animation-styles-verification.md` for actual results.
