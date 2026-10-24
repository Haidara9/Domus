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

## Standing owner instructions
- Keep everything in this one repo (`haidara9/domus`), organized. Source of truth for owner assets: the Drive
  folder `Domus` (https://drive.google.com/drive/folders/1spK-nUyLtCc43-aPMATSiY2NljaY4ytY): skills, repos, logos
  (AR/EN), fonts, reference videos, footage. Pull from there; don't ask for re-uploads.
- The logo must be used **exactly** as the files: the O carries the domed arch with columns and the roof
  chevron above it. Never redraw or simplify it; the temporary text wordmark is for drafts only.
- Study reference videos and past productions as training material (`reference/`), but never copy them.
- Act as a production partner: propose stronger alternatives, inspect outputs, fix deficiencies.

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

## Marketing (added 2026-10-12)
The project now also serves DOMUS content and marketing. Follow `AGENTS.md` and `marketing/README.md`.
Use the pinned Agency Agents roles as references, with the owner's property facts and DOMUS instructions
taking precedence. Draft hooks, captions, CTA, and reel briefs in `marketing/campaigns/`.
Do not describe rented/sold property as available. No social page, ads account, or model API is connected
by the local marketing CLI. Human approval of exact content precedes local export; actual publication,
scheduling, messaging, and paid promotion need the owner's instruction and verified DOMUS account access.

## AI video generation (added 2026-10-24)
Paid generation (Seedance 2.5, Kling, Genjutsu) runs through the owner's Higgsfield app, repo `Haidara9/higgs-studio`
(official SDK `@higgsfield/client`, `HF_CREDENTIALS` in git-ignored `.env.local`; see its AGENTS.md). Tests at 480p.
Always show the exact price and get explicit approval before any generation; never handle the key in chat.
