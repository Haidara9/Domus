# Codex + Higgsfield API: generate the three inserts (owner-approved: 480p, 19.53 s, max $2.00)

Paste everything inside the box into Codex.

```
You are working in the GitHub repo haidara9/domus, branch claude/wonderful-knuth-iu8u4x
(production folder: productions/2026-10-apartment-seedance/).

TASK: generate three short real-estate video inserts with the Higgsfield API (Seedance, image-to-video with reference
images), then save them in the repo. The owner approved the spend below. Nothing else may be generated.

BUDGET (hard rules, owner-approved):
- Resolution 480p only. Aspect ratio 9:16 (vertical). Model: Seedance 2.5 (if unavailable through the API, Seedance 2.0;
  never a more expensive model).
- Total output: 19.53 s (round each clip up to the nearest duration the API accepts, nothing longer).
- TOTAL COST CEILING: US$2.00 for everything, retries included.
- Before ANY generation: read Higgsfield's official API price for this model, resolution and duration (price list,
  estimate or dry-run endpoint) and print a table: clip, seconds, price per second, clip cost, running total.
  If the total is above $2.00, STOP and generate nothing; report the numbers.
- No automatic retries. If a generation fails or looks wrong, stop and report; do not re-run without the owner.
- Read the API key only from the environment variable HIGGSFIELD_API_KEY (and HIGGSFIELD_API_SECRET if the API needs it).
  Never print, log or commit keys.

REFERENCE IMAGES (in productions/2026-10-apartment-seedance/refs/):
- 10.jpg guest room seen through open double wooden doors
- 11.jpg second bathroom: vanity with Greek-key mirror
- 12.jpg second bathroom: lit black-marble niche with two plants
- 13.jpg second bathroom: marble corner with gold-lit niche
- 14.jpg balcony view at night: illuminated minaret

WHAT TO GENERATE:
Preferred: ONE generation of 19.53 s (or the nearest accepted length, max 20 s) with all five images in this order:
@Image1 = 10.jpg, @Image2 = 11.jpg, @Image3 = 12.jpg, @Image4 = 13.jpg, @Image5 = 14.jpg, using MASTER PROMPT below.
If the API cannot do 19.53-20 s in one generation or with 5 images, make THREE generations instead, using the CLIP
PROMPTS below (A: 10.jpg, about 6 s; B: 11.jpg + 12.jpg + 13.jpg, about 9 s; C: 14.jpg, about 6 s). The 3-clip total
must still be priced first and stay under $2.00.

OUTPUT: download the results to productions/2026-10-apartment-seedance/generated/inserts/ as
insert_A_guest-room.mp4, insert_B_bathroom2.mp4, insert_C_balcony.mp4 (or inserts_all.mp4 for one generation).
Write generated/inserts/RUN.md with: model, resolution, durations, the exact prompt(s) sent, price per clip,
total spent, and the API job ids. Commit and push to the same branch. Then report the total spent.

MASTER PROMPT (one generation):
<<<
FORMAT: vertical 9:16, 1080x1920, 19.53 seconds, photoreal real-estate FPV reel of ONE real apartment at night, all lights
on. This video continues an existing reel: match its look exactly: warm golden practical lights with soft bloom and
halation, deep clean blacks, crisp high-clarity commercial grade, rich but natural colour.

CAMERA LANGUAGE: professional FPV cinewhoop drone, edited to feel like one continuous take. Ultra-wide 14mm lens with slight
barrel distortion, flown low (30-120 cm), smooth banked turns with a gentle 10-20 degree roll, flying straight through
doorways, passing close to surfaces. Each segment is a smooth floating glide that, in its last 0.25 s, accelerates
exponentially into a fast whip (3-4x, strong directional motion blur) landing exactly on the downbeat; the next segment
emerges from that blur and settles instantly into a glide. Speed changes are smooth S-curves. Never shaky, never wobbly.

FIDELITY (highest priority): every space must match its reference photo exactly: walls, doors, ceilings, light fixtures,
furniture, rugs, marble veins, materials, colours and layout. Do not add, remove, move or restyle anything. Do not invent
rooms, windows or extra space; reveal only what the photos show. Straight architectural lines stay straight and rigid.
The minaret, the mosque and the surrounding buildings stay exactly as in @Image5: same shape, proportions, lights and windows.
No people, no hands, no text, no logos, no watermarks in the picture.

RHYTHM: 172 BPM, one bar = 1.395 s, every segment = 2 bars = 2.79 s.

SHOTS:
00.00-02.79 @Image1 GUEST ROOM, DOORWAY REVEAL. The first 0.3 s are inside a left-to-right motion blur. Then a low, centred
  glide straight between the two open wooden doors: the door panels and the brass handle pass close on both sides of the
  frame, over the patterned cement-tile threshold and onto the mint-green rug, the lace curtains ahead.
02.79-05.58 @Image1 GUEST ROOM, CEILING. Keep gliding over the rug and tilt up slowly to the domed ceiling medallion; the
  amber glass tulips of the bronze chandelier bloom on; a slow 20-degree roll under the medallion; at 05.35 whip upward and
  end inside the motion blur.
05.58-08.37 @Image2 SECOND BATHROOM, VANITY. Emerge from the blur and push slowly down the narrow passage toward the black
  marble vanity; the backlit mirror with the Greek-key frame glows brighter, reflections slide across the black marble and
  the frosted Greek-key door on the right; whip left at 08.15.
08.37-11.16 @Image3 SECOND BATHROOM, NICHE. Slow lateral glide along the white marble wall; the light inside the black marble
  niche fades on, revealing the two potted plants; marble veins slide past in parallax; whip right at 10.90.
11.16-13.95 @Image4 SECOND BATHROOM, MARBLE CORNER. Start on the warm gold-lit niche with the two plants and crane down
  slowly along the veined marble wall; elegant, calm; at 13.70 whip and end inside the motion blur.
13.95-19.53 @Image5 BALCONY FINALE (two segments, no whip in between). Emerge from the blur at the balcony viewpoint at night,
  then float forward very slowly and rise: the stone building on the left slides past in parallax while the illuminated
  minaret rises in the frame; tilt up along the minaret to its glowing top against the black sky; brake gently and hold
  perfectly still for the last 1.0 s on a calm, symmetric, well-exposed frame (clean frame for the end card).

AUDIO: no music (the reel's own music is extended in editing). Sound effects only: airy whoosh on the whips at 00.00, 05.35,
08.15, 10.90 and 13.70; a soft door-wood brush as the camera passes between the doors; a warm shimmer when the chandelier
blooms on; a soft electric hum and glassy shimmer when the mirror light glows; a water-drop plink in the second bathroom;
on the balcony a calm night city ambience (distant traffic, light wind) building into a deep bass swell under the minaret
tilt and a long reverb tail at the end. No voice-over, no dialogue, no call to prayer.

NEGATIVE: people, hands, pets, camera or photographer reflections in the mirror, warped or melting walls, bent lines,
extra or missing furniture, changed rug or marble patterns, new windows or doors, changed minaret or mosque shape, extra
buildings, moon, stars or fireworks, text, captions, logos, watermarks, music, cartoon look, oversaturation, flicker,
jitter, morphing between rooms, stutter in the slow glides.
>>>

CLIP PROMPTS (only if three generations are needed). Each clip uses the same STYLE/FIDELITY/NEGATIVE text as the
master prompt, with these timelines:
- CLIP A (about 6 s, image 10.jpg as @Image1): use master shots 00.00-05.58, then hold the last 0.4 s inside the whip blur.
  Sound effects: whoosh at 0.0 s and at the end, soft door-wood brush, warm shimmer when the chandelier blooms on.
- CLIP B (about 9 s, images 11.jpg, 12.jpg, 13.jpg as @Image1-@Image3): use master shots 05.58-13.95 re-timed to
  start at 0.0 (vanity 0.0-2.8, niche 2.8-5.6, marble corner 5.6-8.4, then whip blur to the end).
  Sound effects: whooshes on each whip, electric hum and glassy shimmer on the mirror light, a water-drop plink.
- CLIP C (about 6 s, image 14.jpg as @Image1): use master shot 13.95-19.53 re-timed to start at 0.0 (emerge from blur,
  slow forward float and rise, tilt up the minaret, hold still for the last 1.0 s).
  Sound effects: calm night city ambience, deep bass swell under the tilt, long reverb tail. No call to prayer.
All clips: no music, no text, no people.
```
