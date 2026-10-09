# DOMUS brand in motion

Source: the owner's social posts and logo (seen 2026-10-09). Tokens live in `brand/brand.json`.
**Status: provisional.** Official fonts, logo files and guidelines are still to be added (see below).

## Identity
- **DOMUS — REAL ESTATE / دوموس — العقارية**, Latakia (اللاذقية).
- Values: الثقة • الوضوح • الشفافية (trust, clarity, transparency). The films should *feel* like these:
  clear information, honest images, calm confidence.
- Voice (Arabic): formal-friendly, short, warm. «نساعدكم على فهم السوق… واتخاذ القرار العقاري بثقة.»

## Visual language
| Element | Description | Engine |
|---|---|---|
| Paper | Warm parchment `#F1E6D3` with fibre texture; architecture fades into it | `paperBackground` |
| Ink | Near-black `#151412` headlines | `brand.colors.ink` |
| Copper | `#A86F3F` accents: rules, bracket, emblem | `brand.colors.copper` |
| Line art | Gold hairline arches and a column `#C4A177` | `archLines` |
| Bracket | Vertical copper line with end caps and a midpoint dot, on the outer side of the text | `brandStatement` |
| Rule | Short copper rule under the headline | `archTitle`, `brandStatement` |
| Counter | "01 / 03" bottom-left with a rule above | `counter` |
| Wordmark | Classical serif DOMUS whose O is an arch emblem under a roof chevron; "REAL ESTATE" spaced, between rules | `logoReveal` (real file only) |

## Motion rules
- Measured tempo: titles settle in 0.8-1.4 s with the `architectural` ease. Lines **draw**, they don't pop.
- Signature sequence: line art draws → bracket draws → headline rises from its mask → rule grows → body settles.
- Logo: center-out reveal, rules extend, one light sweep on the logo pixels, then a 1.5-2 s hold.
- Avoid: bouncy springs on brand text, glitch, neon, letter-by-letter Arabic, zoom-blur on the logo.

## Assets (from the owner's Drive, 2026-10-09)
- Fonts: **Cairo** (Arabic, `brand/fonts/arabic/Cairo`), **Playfair Display** (English, `brand/fonts/english/PlayfairDisplay`). OFL.
- Logos: `brand/logos/domus-en.png`, `brand/logos/domus-ar.png` (transparent, extracted from the originals in
  `brand/logos/source/` with alpha un-mixing, no redrawing), `brand/logos/domus-en-dark.jpg` (metallic on black,
  for dark end cards). Logo rule: use the files exactly (`brand.json` → `logoRules`).

## Still pending
- [ ] Vector logo (SVG/AI) for perfectly sharp large sizes
- [ ] Brand guidelines PDF (exact colors, clear space)
- [ ] Contact details for end cards (phone, Instagram, website)
