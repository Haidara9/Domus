---
name: threejs-interactive-3d-skill
description: >
  Implementation skill for sparing, performance-budgeted 3D accents in SVU AI
  Studio using three.js + React Three Fiber, with Next.js SSR-safety, mobile
  tiering, and cleanup rules. Use for the landing hero accent and/or one
  dashboard interactive element — never as a default for every section.
version: 1.0.0
---

# Three.js Interactive 3D Skill

## 0. Install

```bash
npm install three @react-three/fiber @react-three/drei
npm install --save-dev @types/three
```

Pin the `three` version and keep `@react-three/fiber`/`drei` on versions that
declare compatibility with it — check each package's peer-dependency range
before bumping either independently. This matters doubly here because
`vanta` (see its own skill file) is version-sensitive to `three` too, and
both libraries must agree on the same installed `three` version in this
project — do not let npm install two copies via mismatched semver ranges.

---

## 1. Where 3D is allowed in this refactor (budget discipline)

Per the main prompt: **at most one heavy interactive 3D element on the
landing hero, and at most one on the dashboard.** This is a deliberate
constraint, not a suggestion — a page with three different WebGL canvases
fighting for GPU time is the fastest way to turn "cinematic" into "the app
that makes my laptop fan spin up."

Good candidates:
- Landing hero: a restrained abstract 3D accent (not a literal 3D model of a
  laptop/book cliché) — e.g. a slowly rotating geometric form, a particle
  field that responds subtly to pointer movement, or a stylized
  knowledge-graph/orbit structure that ties into the Design DNA motif.
- Dashboard: one stat/achievement visualization (e.g. an "orbit" of
  completed subjects), or a 3D icon treatment for a single feature entry
  point (Hermes agent card).

Bad candidates: full 3D scenes with multiple animated models, anything that
requires orbit-controls dragging to understand (this is a study tool, not a
3D configurator), anything placed behind body text that hurts readability/contrast.

---

## 2. Next.js SSR-safety

R3F's `Canvas` touches `window`/WebGL context and must never render on the
server.

```tsx
// components/three/hero-accent.tsx
'use client'
import dynamic from 'next/dynamic'

const HeroAccentCanvas = dynamic(() => import('./hero-accent-canvas'), {
  ssr: false,
  loading: () => <div className="hero-accent-fallback" />, // static gradient/image
})

export default HeroAccentCanvas
```

The `loading` fallback should be a real static asset (gradient/PNG), not an
empty div, so there's no layout-shift flash before hydration.

---

## 3. Lazy-mount on intersection (mandatory)

Never mount a Canvas above the fold unconditionally if it's below the hero.
For the dashboard 3D accent specifically, only mount when scrolled into view:

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'

export function LazyCanvasMount({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        io.disconnect()
      }
    }, { rootMargin: '200px' })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  return <div ref={ref}>{visible ? children : null}</div>
}
```

---

## 4. Render-loop discipline

Use `frameloop="demand"` for anything that isn't constantly animating on its
own, and manually `invalidate()` on the interactions that need a re-render
(pointer move, data change). For continuously-animating accents, keep
`frameloop="always"` but pause on tab-hide:

```tsx
<Canvas
  frameloop="demand"
  dpr={[1, 1.75]} // cap DPR — never raw devicePixelRatio on high-DPI mobile
  gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
>
  {/* scene */}
</Canvas>
```

```tsx
useEffect(() => {
  const onVis = () => {
    // pause/resume your animation driver here based on document.hidden
  }
  document.addEventListener('visibilitychange', onVis)
  return () => document.removeEventListener('visibilitychange', onVis)
}, [])
```

---

## 5. Cleanup (avoid WebGL context leaks)

R3F disposes its own scene graph on unmount by default — but any geometry/
material/texture you create **outside** JSX (in refs, in loaders, in
imperative code) must be disposed manually:

```tsx
useEffect(() => {
  return () => {
    geometry.dispose()
    material.dispose()
    texture?.dispose()
  }
}, [])
```

On route change in the App Router, verify (via browser devtools →
Performance → GPU, or `chrome://gpu`) that navigating away from a 3D-heavy
page actually frees the WebGL context. A leaked context on a SPA-like nav
flow is the most common invisible perf bug with this stack.

---

## 6. Mobile / low-end tiering

Feature-detect before ever importing the 3D bundle:

```ts
function shouldRender3D() {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  const canvas = document.createElement('canvas')
  const hasWebGL = !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  if (!hasWebGL) return false
  const cores = navigator.hardwareConcurrency ?? 4
  const mem = (navigator as any).deviceMemory ?? 4
  return cores >= 4 && mem >= 4
}
```

Below the threshold: render the static fallback image, not a stripped-down
3D scene. A blurry/laggy 3D scene reads worse than a clean static graphic.

---

## 7. RTL note

The 3D canvas itself has no inherent text direction — geometry/camera don't
"flip." What needs checking is:
- Any DOM overlay (captions, labels, controls hints) positioned around the
  canvas must follow the page's `dir="rtl"` flow normally (no special 3D-side
  handling needed there).
- If the scene includes any directional cue (an arrow, a path suggesting
  reading order), reconsider it in RTL — don't silently keep an LTR-implied
  motion direction.

---

## 8. Do / Don't

**Do**
- Cap at one 3D canvas per screen, lazy-mounted, `frameloop="demand"` by default.
- Provide a real static fallback asset for SSR/low-end/reduced-motion.
- Pin `three` version project-wide (shared with Vanta).

**Don't**
- Don't add orbit-controls drag interaction unless it serves a real purpose.
- Don't skip the `dispose()` pass on imperatively-created Three.js objects.
- Don't render a 3D canvas anywhere text needs to sit on top of it without a
  contrast-safe overlay.
