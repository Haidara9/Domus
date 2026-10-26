# Seedance — Apartment Reel (30s · 480p · 9:16)

## Upload order (images)

| Ref | Photo |
|-----|-------|
| @Image1 | Coffee table close-up: brass Ramadan lantern, red fez, brass crescent, crystal bowl, dining table in the background |
| @Image2 | Dining room: carved glass table, triple carved mirror + buffet, ceiling medallion with bulb |
| @Image3 | Living room in daylight: two curved-back sofas, gold-framed oriental painting, embroidered curtains |
| @Image4 | Symmetrical view from the head of the dining table: crystal glass in the foreground, living room at the far end |
| @Image5 | Wide open-plan: dining table + stone pillar + living area, two ceiling medallions |
| @Image6 | From behind the stone-brick pillar: living area on the left, dining table on the right, balcony door at night |

## Upload order (videos)

Seedance 2.0 accepts max 3 reference videos with a combined length of 15s, so each one is trimmed to 5s.

| Ref | Video | Role |
|-----|-------|------|
| @Video1 | `video1_dji_raw_5s.mp4` — DJI raw footage, 0–5s (mirror → barrel roll → view over the dining table) | Raw footage of this apartment, not style |
| @Video2 | `video2_reference_5s.mp4` — `reference_10s.mp4`, 2.5–7.5s (dutch roll, push-in, fireplace punch-in) | Style reference 1 |
| @Video3 | `video3_pires_5s.mp4` — Pires reel cropped to the reel only, 0–5s | Style reference 2 |

## Prompt

```
Vertical 9:16, 480p, 30 seconds, 30fps. Cinematic real-estate interior reel of a classic Levantine apartment (open-plan dining room + living room). No people.

REFERENCES:
- @Video1 = RAW footage shot inside this exact apartment. It is NOT a style reference. Use it only for the real space (geometry, scale, lighting, reflections) and as the source of the opening camera move. Do not copy its handheld look, exposure or color.
- @Video2 = style reference 1: editing rhythm and camera language. Copy its pacing (hard cut every 1.5–3 s, always on the beat), smooth gimbal push-ins, low-angle dutch rolls, a fast punch-in from a wide shot to a close detail, bright clean grade, small Instagram-icon watermark lower-left.
- @Video3 = style reference 2: transitions and finish. Copy its whip-pan / motion-blur transitions with whoosh sound effects, digital pan and zoom moves on every clip (Pan Right, Pan Down, Zoom In, Zoom Out Linear), foreground-wipe reveals (camera passes a wall or pillar to reveal the next shot), a slow 360° rotation under a ceiling light, a light-flash transition, warm cinematic grade, and the ending logo card over a darkened, blurred last shot.
- @Image1–@Image6 = the real apartment. Every shot must stay faithful to these photos: same furniture, same layout, same wallpaper (beige vertical stripes with white and burgundy dots), white stone-brick pillar, plaster ceiling medallions, cove LED lighting, white marble floor, carved dark-wood furniture with gold damask upholstery. Do not add, remove or redesign anything.

SHOT LIST:
0.0–3.0s | @Video1 + @Image2 + @Image4 | HOOK. Recreate the camera move of @Video1, stabilized and graded: start on the carved mirror frame and its reflection, the camera does a fast barrel roll past the ceiling medallion, then rolls level over the glass dining table and settles on the view toward the living room. Hard cut on the beat.
3.0–6.0s | @Image5 | Whip-pan in, then a smooth low gimbal glide along the edge of the dining table toward the white stone pillar; reflections of the recessed lights slide across the glass tabletop.
6.0–9.0s | @Image6 | Foreground wipe: the camera slides sideways past the stone-brick pillar (pillar fills the frame for a moment) and reveals the living room: sofas, carved coffee table, gold-framed painting, embroidered curtains.
9.0–12.0s | @Image3 | Daylight. Slow push-in toward the two sofas and the coffee table, then a fast punch-in on the gold baroque frame of the oriental painting.
12.0–15.0s | @Image1 | Macro detail, very low angle sliding across the gold-beaded tablecloth: brass lantern with red and blue glass, red fez, brass crescent, crystal bowl. Shallow depth of field. Ends with a whip-pan.
15.0–18.5s | @Image1 | Crane up from coffee-table height: lantern and fez slide out the bottom of the frame, revealing the dining table, the carved mirror and the doorway behind.
18.5–21.5s | @Image2 | Close detail of the carved mirror crown, then the camera directly under the ceiling medallion doing a slow 360° rotation.
21.5–25.5s | @Image4 | Symmetrical shot from the head of the dining table: low slide along the glass top, the gold-rimmed crystal glass passes close to the lens as a foreground wipe, rack focus to the living room at the far end. Light-flash transition: the cove LEDs dim and flash back on.
25.5–30.0s | @Image5 | Hero wide of the whole open plan, slow pull-back with a slight rise. Last 2 s: the image darkens and blurs, a centered white Instagram icon with "@YOUR_HANDLE" below it (clean, legible), exactly like the end card of @Video3.

STYLE: cinematic real-estate, stabilized gimbal with an FPV feel, 24mm wide-lens look, straight verticals (no fisheye bending), warm golden-beige grade, soft highlights, clean whites, rich wood tones, gentle contrast. Motion blur only on transitions. Upbeat modern deep-house track, every cut on the beat, whoosh SFX on every whip transition.

AVOID: people, new or changed furniture, a different wallpaper pattern, warped or melting furniture, distorted mirror reflections, flicker outside the planned transition, subtitles, extra text or logos other than the end card.
```

## Notes

- Upload order decides the numbering: images 1→6, then videos 1→3, exactly as in the tables above.
- If the platform caps a single generation at 15s, run the same prompt twice: part 1 = 0–15s, part 2 = 15–30s (renumber its times to 0–15). The whip-pan at 15s is the join.
- Replace `@YOUR_HANDLE` with the real account name.
