---
name: react-bits-components-skill
description: >
  Implementation skill for selectively pulling React Bits animated components
  (reactbits.dev) into SVU AI Studio via CLI, not as a monolithic npm
  dependency. Covers component selection for the Academic Cinematic direction
  and RTL fixes for directional components.
version: 1.0.0
---

# React Bits Components Skill

## 0. This is not a normal npm package — read before "installing"

React Bits (reactbits.dev, github.com/DavidHDev/react-bits) does **not**
ship as one importable package. Each component is pulled **individually** as
source code into the project via CLI, in the variant matching this project's
stack (**TypeScript + Tailwind → `TS-TW` variant**):

```bash
# via shadcn-style CLI
npx shadcn@latest add @react-bits/<ComponentName>-TS-TW

# or via jsrepo
npx jsrepo add https://reactbits.dev/tailwind/<Category>/<ComponentName>
```

This means: do not `npm install react-bits` as if it were a single package —
that is not how this library works and pulling a random same-named package
from npm will not give you these components. Pull only the specific
components chosen below, one command each.

Per-component peer dependencies (install only what the chosen components
actually need):

```bash
npm install motion        # most text animations / lightweight components
npm install gsap           # GSAP-powered components (already installed, see gsap skill)
npm install three @types/three  # 3D components (already installed, see three.js skill)
npm install ogl            # shader-based backgrounds (Aurora, Iridescence, LiquidChrome)
```

---

## 1. Component picks for Academic Cinematic (starting list — confirm each
still exists under this name on reactbits.dev before pulling, the catalog
grows/renames weekly)

**Landing hero / headline**
- A word/line-based text-reveal component (equivalent family to
  `BlurText`/`SplitText`-style reveals) — but for Arabic headline copy,
  follow the same words/lines-not-chars rule as the GSAP skill, and verify
  the pulled component's split mode before using it on Arabic strings.

**Backgrounds (only if the Design DNA decision in the main prompt picks a
React-Bits shader background over Vanta for a given section — do not stack
both on the same screen, same one-heavy-WebGL-context budget rule as the
Vanta/three.js skills)**
- Aurora / Iridescence / LiquidChrome-family components — good fit for a
  more abstract, editorial "academic ambient" feel than Vanta's more literal
  network/orbit effects. Pick one register (Vanta's network motif OR a
  React-Bits shader wash) for the whole product, not both.

**Feature/value-prop cards**
- Scroll-reveal wrapper components (`AnimatedContent`-family) around each
  value-prop card instead of hand-rolling GSAP ScrollTrigger for every single
  card — reserve hand-written GSAP timelines for the sections that need
  bespoke choreography (hero, pinned showcase), and use React Bits' ready
  wrappers for repetitive card-grid reveals to save implementation time.

**Stats / social proof**
- A count-up/number-animation component for the stats section, driven by
  real numbers from wherever that data already lives (see main prompt §4 —
  never invent stat values).

---

## 2. RTL fixes required on directional components

Any React Bits component with an inherent left-to-right assumption needs an
explicit check before shipping in this RTL product:

- **Marquee/ticker components** — default direction is almost always
  authored LTR. Flip the direction prop based on `document.dir`, the same
  pattern as the GSAP skill's RTL rule:
  ```ts
  const dir = document.documentElement.dir === 'rtl' ? 'right' : 'left'
  ```
- **Carousel/slider components with arrow controls** — swap the visual
  arrow icons (prev/next) so they point the correct way for RTL reading
  order, not just mirror the whole component blindly (mirroring can flip
  content that shouldn't flip, like numerals or logos).
- **Hyperspeed/streak-style backgrounds** — if the effect implies a travel
  direction, decide deliberately whether it should reverse in RTL or stay
  direction-neutral (a background streak effect usually reads fine either
  way since it's ambient, not textual — but confirm this isn't perceived as
  "wrong" by an Arabic-reading eye trained to scan right-to-left).

Test every directional component pulled from this library against the
actual Arabic RTL build — not the English dev preview — before merging.

---

## 3. Licensing

The core reactbits.dev library (165+ components) is free/open-source (MIT on
the DavidHDev repo). A separate paid "Pro" tier exists for additional
components/blocks/templates — if the Design DNA phase wants a Pro-only
component, flag it explicitly as a paid decision rather than silently
assuming it's free.

---

## 4. Do / Don't

**Do**
- Pull only the specific components actually used, in the `TS-TW` variant.
- Install only the peer dependency a given component needs.
- Verify direction-sensitive components against the real Arabic RTL build.

**Don't**
- Don't `npm install` a generic same-named package expecting the reactbits.dev catalog.
- Don't stack a React Bits shader background and a Vanta background on the
  same screen — pick one per the shared WebGL budget rule.
- Don't blindly CSS-mirror a whole component to "fix" RTL — fix the
  direction-sensitive prop/logic instead.
