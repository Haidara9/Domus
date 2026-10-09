# Cinematic real-estate standards

## 1. Authenticity (non-negotiable)
| Allowed | Not allowed on property footage |
|---|---|
| Crop, reframe, scale, pan/tilt/push within the frame | Warping or bending walls; "fixing" perspective with distortion |
| Speed changes, ramps, stabilization | Generative fill, object insertion or removal |
| Exposure/WB correction, grading within believable material color | Changing the color of paint, stone, wood or fabric |
| Light sweeps, dust, grain, letterbox, vignette (atmosphere) | Sky replacement that changes the view; adding views or water |
| Graphics clearly separate from the picture (titles, cards, callouts) | AI-generated shots presented as the property |
| Callouts pointing at features that exist | Callouts, specs or distances that aren't in the brief |
| Recovering window highlights from the real exposure | Inventing what's outside a window |

If a needed shot doesn't exist, say so and propose a reshoot or a graphic alternative.

## 2. Camera language
- **Approach → threshold → hero → details → life → location → brand** is the default spatial story. Each shot
  should orient the viewer: where am I, where am I going?
- **Lens/perspective:** keep verticals vertical. Wide lenses exaggerate space, so be careful about implying size the
  room doesn't have. Hold wide shots long enough to read the space.
- **Movement:** slow, motivated, continuous. Push-ins 4-10% over 3-5 s. Pans reveal adjacency (only real
  adjacency). Drone: rise to reveal context, descend to arrive.
- **Duration:** wide/hero 3-5 s, medium 2-3 s, detail 1-2 s (energetic formats about half that).
- **Continuity:** keep the direction of travel across cuts. Match light (don't cut from noon to dusk without a
  reason). Match moves for seamless transitions.

## 3. Editing grammar
- The cut is the default. Every other transition must be motivated:
  dissolve = time or mood; dip-paper = brand chapter; whip = same-direction motion on both sides;
  zoom-through = physically moving through an opening; push = graphic, commercial.
- Match cuts: shape (arch → arch), line (stair rail → corridor), color (copper fixture → copper title rule),
  motion (pan → pan).
- Hook in 2 s. Something new every 2-4 s. Hold the hero space longer than anything else.
- Speed ramps: ramp into a reveal (1 → 0.5 → 1) only with ≥ 50 fps sources; otherwise keep ≥ 0.9.

## 4. Typography on screen
- Arabic first (RTL), short lines, calm voice. Never letter-space Arabic or animate it per letter.
- Text sits over quiet areas (sky, wall, floor), never over the feature it describes. Use the shadow or card
  option on busy footage.
- Stay inside the platform safe zone (QC checks it). Readable on a phone: ≥ 40 px body and ≥ 90 px titles at 1080 width.
- Numerals inside Arabic layouts use the Arabic face. Choose Latin or Arabic-Indic digits consistently per film.

## 5. Delivery specs
| Format | Size | Use |
|---|---|---|
| reel-9x16 | 1080×1920 @30 | Instagram Reels, TikTok, Shorts, Stories |
| feed-4x5 | 1080×1350 @30 | Instagram/Facebook feed |
| square-1x1 | 1080×1080 @30 | Square feed |
| wide-16x9 | 1920×1080 @30 | YouTube, website, TV |
| wide-4k | 3840×2160 @30 | YouTube 4K, screens |
| cinema-239 | 1920×804 @24 | Cinematic web film |

H.264 High, yuv420p, BT.709 tags, AAC 48 kHz, −14 LUFS integrated, ≤ −1.5 dBTP (set `audioTarget` for
broadcast, e.g. −23 LUFS), `+faststart`. Duration exact to ±1 frame.
