---
name: design-dna-academic-cinematic-skill
description: >
  Visual-direction methodology for SVU AI Studio's V6 refactor. A judgment
  framework, not a code library — used to extract existing tokens, choose one
  coherent "Academic Cinematic" motif, and set the two-speed motion grammar
  (cinematic vs utility) referenced by every other V6 skill file. Run this
  before writing any component code.
version: 1.0.0
---

# Design DNA — Academic Cinematic Direction

## 0. Purpose

This is a **thinking tool**, not an animation library. Every other V6 skill
(GSAP, Lenis, Three.js, Vanta, React Bits) implements *how* to move things.
This skill decides *what* the platform should feel like, so those libraries
get pointed at one coherent direction instead of five competing ones.

Run this analysis first, output the short plan format from the main prompt's
§3, and only then start writing code.

---

## 1. Extract — don't invent — the current system

Before proposing anything new, find and read the actual existing tokens:
- color/surface/border tokens in the theme file(s)
- current type scale and font stack (Arabic + Latin pairing already in use)
- current radius/spacing scale
- current motion durations/easings, if any exist already

Use the same narrow-search discipline as the V5 skill (`rg` for
`theme|tokens|font|typography|tailwind.config|globals.css`) — do not read the
whole repo to find these.

**Rule: the V6 direction evolves this system, it does not replace it wholesale.**
A total rebrand is a different project with different risk; this refactor is
"the same brand, elevated," not "a new brand."

---

## 2. The "Academic Cinematic" brief, translated into concrete choices

The brief (from the owner): more educational/academic, cinematic, creative,
interactive 3D — think Apple keynote pacing crossed with a Netflix title
sequence, applied to a serious study tool, not a toy.

Translate that into decisions, not adjectives:

### Reference register (for internal calibration only — never reproduce any
specific brand's actual assets, logos, or copyrighted footage; these are
*pacing and composition* references, not asset sources)
- **Apple keynote**: generous negative space, one hero idea per screen,
  deliberate slow-in/slow-out easing, product/content treated as the star
  with minimal chrome around it.
- **Netflix title sequence**: confident dark canvas, a single strong motif
  repeated with variation (not five different effects competing), motion
  that builds anticipation rather than just decorating.
- **University admissions microsite** (the register this needs to land in,
  not the two above alone): credibility signals, structured hierarchy,
  outcomes-and-breadth framing (subjects covered, exam bank depth, real
  study outcomes) — the cinematic layer has to still read as *trustworthy
  academic infrastructure*, not a game or a movie trailer.

### Motif menu — pick exactly ONE primary motif for the whole product
Do not mix these. Pick one, use it everywhere a motif is needed (hero
background, dashboard accent, loading states, icon treatment):

1. **Knowledge graph / constellation** — connected nodes and lines,
   representing subjects/concepts linking together. Maps directly onto
   Vanta `NET` and fits naturally with the platform's existing canvas
   neural-network landing background (evolution, not replacement).
2. **Orbit / celestial** — circular motion, subjects as orbiting bodies
   around a core (the student, or the AI agent). Maps onto Vanta
   `RINGS`/`GLOBE` or a custom R3F orbit visualization.
3. **Structured grid / blueprint** — precise geometric grid lines suggesting
   curriculum structure and rigor. Maps onto Vanta `TOPOLOGY` or a React
   Bits minimal shader background. Most "editorial/minimal," least
   "3D-flashy" — good fallback if the team decides the 3D budget should be
   spent mostly on interaction rather than background atmosphere.

State the choice explicitly in the Phase 1 output and justify it in one
sentence tied to the brand, not just "it looks cool."

---

## 3. Typography rules specific to this refactor

- Arabic and Latin/numeral text do not share the same optical rhythm — an
  Arabic type scale generally needs **more line-height** than the equivalent
  Latin scale to read comfortably (Arabic script has more vertical variance
  in letterforms). Don't reuse a Latin-tuned line-height value for Arabic
  body copy.
- Avoid Latin typographic tricks that don't translate: `letter-spacing`
  tricks and all-caps treatments common in "cinematic" Latin headline design
  do not work on Arabic script (Arabic has no case distinction, and
  letter-spacing breaks the connected-letterform shaping) — reserve those
  tricks for Latin/MSA-numeral fragments only, never full Arabic headlines.
- Keep the existing MSA-for-academic-terms / Levantine-for-general-UI split
  intact; the cinematic redesign is a visual layer, not a copy-voice change
  — don't let a design pass accidentally rewrite copy tone.

---

## 4. The two-speed motion grammar

Every other skill file references these two tiers by name — define their
actual numbers here so they're consistent everywhere:

### Cinematic tier (landing page, one-time narrative moments)
- Entrance duration: 0.6–1.0s
- Easing: pronounced, e.g. `power3.out` / `power4.out` — visible deceleration
- Stagger: 0.06–0.12s between related elements
- Fires **once** (`scrollTrigger.once: true`), never re-triggers on scroll-back
- Generous pacing — it's OK for the hero to take a beat to fully resolve

### Utility tier (dashboard, repeated interactions)
- Entrance duration: 0.2–0.4s
- Easing: crisp, e.g. `power2.out`
- Stagger: 0.03–0.06s — fast enough that a returning user never feels made
  to wait
- Hover/press feedback: near-instant, 0.1–0.15s
- Fires once per session mount at most for section entrances; interactive
  feedback (hover/press) always fires, every time, since that's expected UI
  responsiveness, not narrative

**Rule: cinematic-tier timing must never be used on an element the user sees
more than a handful of times total** (i.e., never on dashboard chrome the
user looks at daily). This is the single most common way "cinematic
redesigns" turn into "why is my dashboard slow" complaints two weeks later.

---

## 5. Color/atmosphere direction

- Extract the existing brand accent color(s) — do not introduce a new
  primary accent as part of this pass unless explicitly requested. The
  "cinematic" feeling should come from **composition, motion, and depth**
  (dark canvas, layered elevation, atmospheric background), not from
  swapping the brand palette.
- Dark, high-contrast canvas is the natural direction for both the "Netflix"
  reference and for WebGL atmospheric backgrounds to read well (bright
  backgrounds wash out Vanta/shader effects) — confirm this aligns with the
  existing theme's dark-mode baseline rather than assuming a full switch to
  dark-only is wanted.

---

## 6. Output checklist for Phase 1 (main prompt §3)

- [ ] Existing tokens extracted and listed (not invented)
- [ ] One motif chosen, justified in one sentence
- [ ] Decision made: evolve existing neural-network canvas bg, or replace it
- [ ] Cinematic-tier and utility-tier numbers confirmed (use the defaults
      above unless there's a specific reason to deviate — state the reason)
- [ ] Arabic type scale confirmed distinct from Latin type scale
- [ ] No new brand accent color introduced without explicit sign-off
