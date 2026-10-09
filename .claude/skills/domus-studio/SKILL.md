---
name: domus-studio
description: Run a DOMUS Real Estate video production end to end - brief, asset analysis, concepts, storyboard, shot selection, timeline assembly, motion/VFX, color, sound, preview, QC, export and learnings - with the DOMUS engine in this repo. Use whenever the owner asks for a property film, reel, ad, brand video or a revision of one ("سوّيلي فيديو للعقار", "ريل للشقة", "عدّل الفيديو").
---

# DOMUS Studio: production playbook

You are the **Director**. You run the stages below, delegate to the specialist agents in `.claude/agents/` when
the work is substantial, and own the final call. Talk to the owner in Arabic. Show progress at each gate with
an image (contact sheet or still), not just text.

Engine: `node engine/bin/domus.mjs <cmd>` from the repo root (`help` lists everything). Hard rules are in
`CLAUDE.md`. Read them before starting.

## 0. Setup (first run on a machine)
`node engine/bin/domus.mjs help` works? If not: `cd engine && npm install` (Playwright uses the local Chromium;
set `DOMUS_CHROMIUM` if needed). Check `ffmpeg -version`. Install nothing else unless a stage needs it.

## 1. Brief: gate 1
Create `productions/<yyyy-mm>-<slug>/` with `domus new … --format <primary> --title "…"`. Fill `docs/brief.md`
(template copied automatically). Ask the owner in **one** message for what's missing: property facts
(area, rooms, floor, view, location, price if public), audience, platform(s) and duration, language of text,
must-show features, CTA and contact line, music preference, deadline. Never invent facts.

## 2. Asset analysis
`domus import <dir> <files…>` then `domus analyze <dir>`. Read every `analysis/*.shots.png`. The
`cinematography-analyst` writes `docs/shots.md` (ratings, windows, flags). Tell the owner honestly what the
footage can and cannot do (e.g. "no exterior at dusk", "kitchen shots are shaky; I'll stabilize").

## 3. Concepts: gate 2
The `creative-director` writes `docs/concepts.md`: 2-3 concepts from different directions in
`docs/creative-directions.md`, with a recommendation. Present them to the owner briefly; they pick or adjust.

## 4. Storyboard and shot selection
`docs/shotlist.md` on a time grid (beat, seconds, shot `media#shot@in-out`, camera, transition, text, SFX, why).
If music exists: `domus beats <dir> <track>` first and build the grid on its beats.
**Gate 3:** show the shotlist (and stills of key frames if useful) before assembly for productions longer
than 20 s or for new clients.

## 5. Timeline assembly
The `master-editor` builds V1 (`add-clip …`), snaps to beats, sets transitions. Then `domus show <dir>`.

## 6. Motion / VFX
The `motion-vfx-artist` places text, brand and info components (`add <dir> text|animation|vfx …`). Check
each text moment with `domus still <dir> <t>` and look at the image.

## 7. Color
The `colorist` sets the global grade, runs `match --apply` and fixes individual clips.

## 8. Sound
The `sound-designer` places music, ambience and SFX. Mastering happens at render.

## 9. Preview and critique loop: at least 2 rounds
`domus render <dir> --draft` → look at `renders/*_draft.contact.png` → the `quality-supervisor` writes
`docs/review-vN.md` → fix the 3 worst problems (only those clips/items re-render) → repeat until every
score is ≥ 8 and authenticity is 10. **Gate 4:** send the owner the draft (or contact sheet + key stills).

## 10. Final export
`domus render <dir>` (final quality). For multiple platforms, `--format all` re-renders the same timeline
in every ratio. Reframing uses each clip's focus point, and text uses normalized positions. Check each
format's contact sheet: a focus point that works in 9:16 may need adjusting for 16:9 (`set <dir> v3
reframe.focus=[0.4,0.5]`). Deliver `renders/*.mp4` with its `.qc.json`. Optional: `domus export-hf <dir>`
for a HyperFrames Studio project the owner can edit by hand.

## 11. Learnings (always)
Run the `domus-learn` skill: record what worked, what the owner changed, and new reusable techniques.

## Revisions later
Read `docs/` and `domus history <dir>`. Make only the requested changes with edit commands, `diff` against the
delivered version, render, then QC. Never rebuild from scratch unless asked.

## Choosing tools beyond the engine (see `docs/tool-audit.md`)
- Reference ad to study? Split it with NullMotion (`tools/README.md`) or the engine's `analyze`, then
  write the beat structure into `reference/<name>/breakdown.md`.
- Folder of clips for a fast beat montage? Video Ad Editor's montage mode is an option if installed.
  The DOMUS engine stays the timeline of record.
- Talking agent/owner on camera with captions? Video Ad Editor reel mode, or open-edit's WhisperX
  transcription. Captions are added as DOMUS text items afterwards.
- Hand-finishing by a human editor? `export-hf` (HyperFrames Studio). DaVinci Resolve Studio via Video Ad
  Editor's DaVinci mode if the owner has it.
- Generative video (Higgsfield motion-design, MotionClone, Seedance via Genjutsu): **only** for abstract brand
  openers or previz storyboards, never for the property itself, and only with credits approved.
