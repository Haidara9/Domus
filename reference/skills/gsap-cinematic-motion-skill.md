---
name: gsap-cinematic-motion-skill
description: >
  Technical implementation skill for GSAP-driven motion (timelines, ScrollTrigger,
  SplitText) inside SVU AI Studio's Next.js app, with Arabic/RTL-safe patterns
  and correct integration with Lenis smooth scroll. Use whenever implementing
  scroll-reveal, text-reveal, staggered entrances, or pinned scroll storytelling.
version: 1.0.0
---

# GSAP Cinematic Motion Skill

## 0. Licensing note (verified, don't second-guess this)

As of April 2025, **GSAP is 100% free for commercial use, including every
plugin that used to require a paid Club GreenSock membership** — SplitText,
ScrollTrigger, ScrollSmoother, MorphSVG, DrawSVG, Physics2D, CustomEase — all
installable straight from the public npm package. No trial banner, no token,
no private registry. If any tooling or docs still say "requires Club GSAP,"
that's stale — ignore it.

```bash
npm install gsap @gsap/react
```

`@gsap/react` gives you the `useGSAP()` hook, which is the correct way to use
GSAP in React (auto-cleanup on unmount, correct dependency handling). Do not
hand-roll `useEffect` + manual `.kill()` bookkeeping — use `useGSAP`.

---

## 1. Setup pattern (Next.js App Router)

GSAP and its plugins are client-only. Register once, in a client component,
never at module scope of a server component.

```tsx
// components/motion/gsap-provider.tsx
'use client'
import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

let registered = false

export function useRegisterGsap() {
  useEffect(() => {
    if (!registered) {
      gsap.registerPlugin(ScrollTrigger, SplitText)
      registered = true
    }
  }, [])
}
```

Guard registration with a module-level flag — Next.js fast refresh / route
remounts can call this multiple times; double-registration is harmless but
noisy and wastes a tick.

---

## 2. Core pattern: scroll reveal

```tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function RevealSection({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.from('.reveal-item', {
      opacity: 0,
      y: 32,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.08,
      scrollTrigger: {
        trigger: scope.current,
        start: 'top 80%',
        once: true, // cinematic reveals fire once, not every scroll pass
      },
    })
  }, { scope })

  return <div ref={scope}>{children}</div>
}
```

`once: true` matters for the landing page's "cinematic" pacing tier (see
Design DNA skill). Dashboard "utility" tier reveals should also default to
`once: true` — nothing in a repeatedly-visited dashboard should re-animate on
every scroll back-and-forth; that reads as jank, not polish.

---

## 3. Text reveal — Arabic-safe rule (important, non-obvious)

`SplitText` defaults are tuned for Latin scripts. Splitting Arabic text by
**characters** breaks letter-joining (Arabic letters change shape depending
on their neighbor — chopping them into isolated character spans visually
corrupts the word). 

**Rule: for Arabic content, split by `words` or `lines` only. Never `chars`.**

```tsx
useGSAP(() => {
  const split = SplitText.create('.headline', {
    type: 'words, lines', // NOT 'chars' for Arabic
    mask: 'lines',
  })
  gsap.from(split.words, {
    opacity: 0,
    y: 20,
    duration: 0.6,
    stagger: 0.05,
    ease: 'power2.out',
  })
  return () => split.revert()
}, [])
```

For Latin/English UI strings (or the MSA academic-term labels that are set in
a Latin-adjacent numeral context), `chars` splitting is fine and looks great
for hero word-by-word/letter-by-letter reveals — just branch the split `type`
based on which language string is being rendered.

Always call `split.revert()` on cleanup (or via `useGSAP`'s auto-cleanup) —
leftover split spans break text selection and screen readers if left mounted
after the animation library re-runs.

---

## 4. Integrating with Lenis (do not use ScrollSmoother alongside Lenis)

This project uses **Lenis** for smooth scroll (see
`lenis-smooth-scroll-skill.md`), not GSAP ScrollSmoother. Running both is
redundant and they will fight over the scroll position. Wire Lenis into
ScrollTrigger like this, once, at the app root:

```tsx
'use client'
import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function useLenisGsapBridge() {
  useEffect(() => {
    const lenis = new Lenis({ autoRaf: false })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)
    return () => lenis.destroy()
  }, [])
}
```

`autoRaf: false` + driving Lenis from `gsap.ticker` is the correct pattern —
it guarantees a **single** RAF loop for the whole page instead of Lenis and
GSAP each running their own, which is the #1 cause of scroll-jank bug
reports with this combo.

---

## 5. Pinned scroll storytelling (product showcase section)

```tsx
useGSAP(() => {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.showcase-pin',
      start: 'top top',
      end: '+=1500', // tune to content length, not a magic number
      pin: true,
      scrub: 1,
    },
  })
  tl.to('.mock-frame', { rotateY: 0, scale: 1, ease: 'power2.inOut' })
    .to('.feature-caption-1', { opacity: 1 }, '<')
    // ...
}, [])
```

`scrub: 1` (a number, not `true`) adds slight easing so the animation doesn't
feel glued 1:1 to the wheel — reads more cinematic.

---

## 6. RTL correctness

- Never hardcode `x: -100` for "slide in from the edge." Use a signed value
  that's derived from document direction:
  ```ts
  const dir = document.documentElement.dir === 'rtl' ? 1 : -1
  gsap.from(el, { x: 100 * dir, opacity: 0 })
  ```
- Horizontal pinned/scrubbed sections (e.g. a horizontal feature carousel
  driven by vertical scroll) must reverse their internal x-translation logic
  in RTL — test this specifically, it is the single most common thing that
  looks "flipped and wrong" after an LTR-only build.
- `xPercent`/`x` based marquees: same rule, direction must flip with `dir`.

---

## 7. Reduced motion

```ts
gsap.matchMedia().add('(prefers-reduced-motion: reduce)', () => {
  gsap.set('.reveal-item', { opacity: 1, y: 0 }) // show final state instantly
  ScrollTrigger.getAll().forEach(st => st.disable())
})
```

Reduced-motion users must see fully-formed content immediately, not a
frozen mid-animation state. Always set the **end state**, never just disable
the trigger and leave elements at `opacity: 0`.

---

## 8. Do / Don't

**Do**
- Use `useGSAP` for automatic scoped cleanup.
- Kill/revert every SplitText instance and ScrollTrigger on unmount.
- Keep `stagger` values small (0.04–0.1s) — large staggers on long lists feel slow.

**Don't**
- Don't animate `width`/`height`/`top`/`left` — animate `transform`/`opacity` only.
- Don't run GSAP ScrollSmoother and Lenis together.
- Don't `chars`-split Arabic text.
- Don't leave `scrollTrigger` instances un-killed on route change in the App Router.
