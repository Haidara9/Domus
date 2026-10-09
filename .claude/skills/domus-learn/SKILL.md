---
name: domus-learn
description: After a DOMUS production is delivered (or a revision round closes), extract what worked into the studio's reusable library - log entry, technique notes, new presets or motion components - without locking future films into one style. Use when the owner approves a film, or says "احفظ هالأسلوب" / "save this technique".
---

# DOMUS Learn: turn productions into reusable craft

1. **Gather evidence.** Read `productions/<slug>/docs/` (brief, concepts, shotlist, reviews), `domus history
   <dir>` (what changed between draft and final, especially changes the owner asked for), the final QC report
   and the final contact sheet.
2. **Log entry.** Append one entry to `library/learnings/LOG.md`:
   date · production · direction used · format/duration · what the owner loved · what the owner changed (and
   why, if known) · what we'd do differently · reusable techniques (links).
3. **Extract techniques.** For each genuinely reusable idea (a transition pairing, a pacing pattern, a text
   treatment, an SFX recipe, a grade tweak), write `library/learnings/techniques/<kebab-name>.md` with:
   what it is, when to use it and when not, exact engine settings (JSON snippets), and the production where it
   was proven. One technique per file.
4. **Promote to code only when proven twice.** If a technique was used successfully in two productions,
   promote it to the library: a grade preset in `library/color/grades.json`, a transition in
   `library/transitions/transitions.json`, or a new motion component in `library/motion/components/`. Run
   `cd engine && npm test` after any library change.
5. **Avoid style lock-in.** In the log, record the direction used, and note which directions haven't been
   used recently. The Creative Director reads this to rotate looks. Never turn a one-off client preference
   into a global default without the owner's say.
6. Commit with a message like `learn: <production> — <technique names>`.
