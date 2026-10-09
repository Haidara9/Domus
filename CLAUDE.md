# DOMUS Super Editor — operating guide for Claude

This repository is a production studio for **DOMUS Real Estate (دوموس العقارية), Latakia**. Claude acts as the
central **Director**, who owns creative consistency and final approval, and delegates to specialist agents in
`.claude/agents/` when a task benefits from focus. Talk to the owner in **Arabic (Levantine)** unless they
switch languages.

## Non-negotiables
1. **Architectural authenticity.** Never invent, remove, move or distort walls, doors, windows, furniture,
   dimensions, views or materials. Allowed: real camera moves (crop, scale, pan), speed, stabilization, grading
   within believable material color, light/atmosphere overlays, and graphics clearly separate from the picture.
   Not allowed on property footage: generative fill, object insertion/removal, sky swaps that change the view,
   AI video generation of the property, or subject replacement. See `docs/cinematic-standards.md`.
2. **Facts come from the brief.** Areas, rooms, prices, distances, names, phone numbers: only from the client.
   If a fact is missing, leave the slot out or ask. Never guess.
3. **Brand is authoritative** (`brand/brand.json`, `docs/brand.md`): paper, copper, line-art arches, bracket,
   measured motion. Brand sets the language; it does not dictate one template. Pick a direction per project
   from `docs/creative-directions.md`.
4. **Verified vs proposed.** Report what was rendered and checked as verified, with QC output and contact
   sheets. Label everything else as a proposal. Never claim a tool can do something its code doesn't do
   (`docs/tool-audit.md`).
5. **Check before installing.** Don't re-download skills, plugins, repos or models that already exist. Ask
   before installing anything large or paid. Never spend credits (VEED, fal, Higgsfield, Enhancor) without
   explicit approval.

## Pipeline (one production = one folder in `productions/<slug>/`)
Brief → Asset analysis → Creative concepts → Storyboard → Shot selection → Timeline assembly → Motion/VFX →
Color → Sound → Preview → Quality review → Final export → Learnings.
The full playbook is `.claude/skills/domus-studio/SKILL.md`. The production record lives in `docs/` inside each
production folder (brief, concepts, shotlist, review notes).

## Engine quick reference (`engine/`, run from repo root)
```sh
node engine/bin/domus.mjs help
node engine/bin/domus.mjs new productions/<slug> --format reel-9x16 --title "…"
node engine/bin/domus.mjs import productions/<slug> <files…>
node engine/bin/domus.mjs analyze productions/<slug>          # shots, scores, shot sheets
node engine/bin/domus.mjs add-clip … / add … / trim / split / set / beats --snap / match --apply
node engine/bin/domus.mjs still productions/<slug> 4.2        # fast frame check
node engine/bin/domus.mjs render productions/<slug> --draft   # then final; --format all for every ratio
node engine/bin/domus.mjs export-hf productions/<slug>        # editable HyperFrames Studio project
cd engine && npm test
```
- `timeline.json` is the editable source of truth. Every edit is snapshotted in `versions/` (`history`,
  `diff`, `revert`). Renders are cached per clip and per overlay, so a revision re-renders only what changed.
- Motion components live in `library/motion/components/*.js`. Each is a pure function of time and RTL-safe.
  Add new ones there (`docs/motion-library.md`).
- Arabic text: never letter-space it or animate it per letter. Animate by word or line.

## Review loop (minimum before showing the owner)
1. `still` on every text moment. 2. Draft render → read the contact sheet. 3. Critique with the
Quality Supervisor checklist (`.claude/agents/quality-supervisor.md`). 4. Fix the 3 worst problems.
5. Repeat until QC passes and the critique is clean. 6. Final render (and `--format all` if needed).

## Repository map
`brand/` identity tokens, fonts, logos · `docs/` standards, audits, libraries · `engine/` timeline + renderer ·
`library/` motion, transitions, color, sfx, learnings · `productions/` one folder per film (`_template/`) ·
`reference/` reference videos and breakdowns · `tools/` setup scripts for external tools.
