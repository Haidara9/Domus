# Seedance inserts: guest room, second bathroom, balcony (v1)

Status: PROPOSAL. Five new photos to add to the generated 30 s film (generated/seedance_v1_excerpt.mp4 = its first 15.8 s).
Look of the generated film (measured): 9:16 1080x1920, warm golden practicals, deep blacks, ultra-wide FPV glides,
whips about every 2.8-3 s (2.98, 5.28, 9.15, 12.23, 15.12 s), ~167-172 BPM.

## New references
| Ref | File | Space | Key details to lock |
|---|---|---|---|
| @Image1 | refs/10.jpg | Guest room seen through open double wooden doors | brown panelled double doors with brass handle, white walls, round domed ceiling medallion with 8 radial ribs and scroll relief, two quarter-dome corner ornaments, bronze chandelier with amber glass tulip shades, cream lace curtains on a brass rod, mint-green medallion rug with a crown motif, cement-tile floor border |
| @Image2 | refs/11.jpg | Second bathroom: vanity | narrow passage, black-marble vanity, white-marble wall, backlit mirror with black Greek-key frame, glass ceiling panel with Greek-key border, frosted glass door with Greek-key frame and black sun motif, light wood-grain panel on the left, grey runner rug |
| @Image3 | refs/12.jpg | Second bathroom: niche | white marble walls with grey veins, recessed black-marble niche lit from above, two white pots with green plants (yellow and blue flowers), chrome edge trims |
| @Image4 | refs/13.jpg | Second bathroom: toilet corner | white/brown-veined marble walls, warm gold LED-lit black niche with two plants, white toilet, chrome hand shower |
| @Image5 | refs/14.jpg | Balcony view at night | white stone minaret lit warm-white with balconies and a lit top, stone buildings left and behind, the mosque wall with pointed-arch panel and three windows, street with cars below, black sky |

## Edit plan
Three inserts, each an exact multiple of 2 bars at 172 BPM, starting and ending inside a whip blur, so they cut into any
whip of the existing film and the music can be extended by whole bars:
- Insert A (0.00-5.58, 2 segments): guest room, placed after the formal salon.
- Insert B (5.58-13.95, 3 segments): second bathroom, placed next to the first bathroom.
- Insert C (13.95-19.53, 2 segments): balcony and minaret, the new finale before the end card.

## Prompt (attach @Image1 ... @Image5 in the order above)
```
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
```
