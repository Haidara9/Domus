# Seedance 2.5 prompt: apartment reel in the style of the reference (v2)

Status: PROPOSAL (not generated yet). Built from the analysis of reference/reference.mp4.

## Reference analysis (reference/reference.mp4, 35 s, 16:9, 30 fps; motion.png, contact.png)
- Camera: FPV cinewhoop one-take feel, ultra-wide ~14 mm with slight barrel, flown low (30-120 cm), banked turns with
  gentle roll, flies through door and window openings, dives close past surfaces (kitchen cabinets, fireplace).
- Rhythm (measured): long smooth glides at 3-10 px/frame (about 0.5-0.7x feel), broken every 1.4-2.8 s by a sharp
  exponential acceleration (whip) that peaks right on a downbeat (2.0, 4.4, 6.6, 9.8, 13.3, 16.9, 19.2, 21.3, 22.8, 25.0,
  28.8 s). Most cuts are hidden inside the whip blur; one white-flash transition (6.5 s). Tempo ~172 BPM (bar = 1.395 s).
- Graphics: big white extruded 3D words standing on the ground/floor, camera-tracked with real shadows, popping on lyric
  hits ("JUMP"); a white outline drawn around the plot on the aerial; small Instagram handle top-right all along;
  end card 31-35 s: Instagram logo animating colour to white + handle.
- Grade: crisp, high clarity, clean whites, cool skies, golden sun flares, rich contrast.
- Music: energetic electronic track with vocal hook; SFX: whooshes on every whip, sub hits on flashes.

## Adaptation decisions
- Interior night-lit apartment, 9 photos, no exterior/aerial: the aerial and plot-outline beats are replaced by light
  events (lights switching on) and a high rise toward the stained-glass skylights. Nothing that is not in the photos is invented.
- 3D floor words, handle watermark and end card are added in post with the DOMUS engine (camera-tracked), not by
  Seedance: AI video garbles text, especially Arabic.
- Structure: 10 segments of 2 bars (2.79 s) at 172 BPM = 27.9 s, generated as two 13.95 s parts (Part B starts from
  Part A's last frame), + 4 s end card in post = ~32 s.

## Reference order (upload in this exact order)
| Ref | File | Space | Key details to lock |
|---|---|---|---|
| @Image1 | refs/01.jpg | Entrance courtyard, side view | wrought-iron grille with gold scrolls, gold-framed doorway, cream brick-pattern walls with brown joints, wall sconces, potted plant, beige stone floor |
| @Image2 | refs/02.jpg | Entrance corridor, axial | same doorway on axis, long corridor, wood door at the far end, lit interior beyond |
| @Image3 | refs/03.jpg | Kitchen, axial | white-marble-look ceiling with ring LED lights, dark gloss cabinets, black counter, LED strip under cabinets, red floral rug, steel fridge, water dispenser, bathroom door at the end |
| @Image4 | refs/04.jpg | Kitchen, angle | same kitchen from the counter side, gas hob, sink, washing machine |
| @Image5 | refs/05.jpg | Family living room | blue LED cove, round gold carved medallion, square spotlight boxes, TV wall, blue sofa, patterned cream rug, AC unit, square-pattern curtain |
| @Image6 | refs/06.jpg | Formal salon | wood-slat ceiling with orange/red stained-glass skylight panel, cream brick walls, crimson curtain with valance, burgundy sofas, traditional rug, two gold vases, framed calligraphy |
| @Image7 | refs/07.jpg | Children's bedroom | twin beds with cream/brown headboards, ceramic-pattern floor, pendant lamp, geometric ceiling motif, peach wall, AC |
| @Image8 | refs/08.jpg | Master bedroom | dark wood ceiling with yellow stained-glass panel, red heart on white textured wall, carved cream bed, vanity with oval mirror, red/white curtains, grey rugs |
| @Image9 | refs/09.jpg | Bathroom | white marble-look walls and ceiling, round ceiling light, frosted glass shower with Greek-key border, frosted door with sun motif, black-framed cabinet |


## Shared style block (included in both parts)
See the prompts below; each part is self-contained so it can be pasted alone.

## PART A (00.00-13.95) - attach @Image1 @Image2 @Image3 @Image4 @Image5
```
FORMAT: vertical 9:16, 1080x1920, 30 fps, 13.95 seconds, photoreal real-estate FPV reel of ONE real apartment at night,
all interior lights on. Style: FPV cinewhoop one-take, ultra-wide 14mm lens with slight barrel distortion, flown low
(30-120 cm above the floor), smooth banked turns with gentle roll, flies through door openings, passes close to surfaces.
Grade: crisp high-clarity commercial look, clean whites, rich contrast, warm practical lights with soft halation and bloom.

FIDELITY (highest priority): every space must match its reference photo exactly: walls, doors, ceilings, light fixtures,
furniture, rugs, materials, colours and layout. Do not add, remove, move or restyle anything. Do not invent rooms, windows,
views or extra space; when the camera moves, reveal only what the photo shows. Straight architectural lines stay straight
and rigid. No people, no hands, no text, no logos, no watermarks in the picture.

RHYTHM (172 BPM, one bar = 1.395 s): each segment is a smooth slow glide (0.6x feel) that, in its last 0.25 s, accelerates
exponentially into a fast whip (3-4x, strong directional motion blur) landing exactly on the downbeat; the next space
starts from that blur and settles instantly into the next slow glide. Speed changes are S-curves, never jerky.

SHOTS:
00.00-02.79 @Image1 ENTRANCE. Start 40 cm above the stone floor, glide toward the gold-framed doorway, banking right to
  reveal the gold wrought-iron scrolls and the cream brick walls; the wall sconces bloom on at 01.40. At 02.55 accelerate
  and whip straight through the doorway. Keep empty floor space in the lower third for a graphic added later.
02.79-05.58 @Image2 CORRIDOR. Exit the whip centred on the corridor axis, slow glide down the corridor toward the lit wooden
  door at the far end, slight roll left-right with the beat; at 05.30 accelerate through the far doorway into a clean
  WHITE FLASH (full-frame bloom, 4 frames).
05.58-08.37 @Image3 KITCHEN. Out of the white flash, the ceiling ring lights snap on one by one front to back on the beats
  (06.28, 06.63, 06.98, 07.33). Skim 30 cm above the red floral rug, then rise and dive close past the glossy dark upper
  cabinets with a 20-degree roll, reflections sliding across them; whip left at 08.15.
08.37-11.16 @Image4 KITCHEN ANGLE. Settle into a slow lateral glide along the black counter, LED strip under the cabinets
  sweeping on left to right, passing the sink and the washing machine; at 10.90 whip right.
11.16-13.95 @Image5 LIVING ROOM. Arrive low over the patterned cream rug, tilt up while the blue LED cove ignites around the
  ceiling and the gold carved medallion glows; slow 15-degree orbit; spotlights pop on in sequence. End on a stable,
  well-lit frame of the ceiling medallion at 13.95 (Part B continues from this frame).

AUDIO: native stereo. Energetic, premium electronic track at 172 BPM (driving drums, bright synth stabs, a short vocal chop
hook, no lyrics in Arabic or English words), SFX: airy whoosh on every whip (02.79, 05.58, 08.37, 11.16), deep sub "boom"
on the white flash at 05.58, crisp light-switch clicks on the kitchen ring lights, rising riser into the blue cove ignition
at 12.56 with a bass hit. No voice-over, no dialogue.

NEGATIVE: people, hands, pets, camera or photographer reflections, warped or melting walls, bent lines, extra furniture,
changed patterns on rugs and floors, new windows or doors, outdoor views, text, captions, logos, watermarks, cartoon look,
oversaturation, flicker, jitter, morphing between rooms, stutter in the slow glides.
```

## PART B (13.95-27.90) - attach the LAST FRAME of Part A as first reference, then @Image6 @Image7 @Image8 @Image9 @Image2 @Image1
```
FORMAT: vertical 9:16, 1080x1920, 30 fps, 13.95 seconds, photoreal real-estate FPV reel of ONE real apartment at night,
all interior lights on. CONTINUITY: the video starts exactly on the first reference frame (the living-room ceiling medallion)
and continues the same flight. Style: FPV cinewhoop one-take, ultra-wide 14mm lens with slight barrel distortion, flown low
(30-120 cm), smooth banked turns with gentle roll, flies through door openings, passes close to surfaces.
Grade: crisp high-clarity commercial look, clean whites, rich contrast, warm practical lights with soft halation and bloom.

FIDELITY (highest priority): every space must match its reference photo exactly: walls, doors, ceilings, light fixtures,
furniture, rugs, materials, colours and layout. Do not add, remove, move or restyle anything. Do not invent rooms, windows,
views or extra space; reveal only what the photos show. Straight architectural lines stay straight and rigid.
No people, no hands, no text, no logos, no watermarks in the picture.

RHYTHM (172 BPM, one bar = 1.395 s): smooth slow glides (0.6x feel) that accelerate exponentially in their last 0.25 s into
a fast whip (3-4x, directional motion blur) landing exactly on the downbeat; the next space settles instantly into a glide.

SHOTS (times relative to this clip):
00.00-02.79 @Image6 FORMAL SALON. From the whip, perfectly symmetrical one-point view down the centre axis, flying low over
  the traditional rug between the burgundy sofas toward the crimson curtained window; at 01.80 rise smoothly toward the
  orange-red stained-glass skylight panel which glows brighter; whip up-right at 02.55.
02.79-05.58 @Image8 MASTER BEDROOM. Slide past the dark wooden door edge in the foreground (natural wipe), glide toward the
  carved cream bed and the red heart wall while the yellow stained-glass ceiling panel glows; whip left at 05.35.
05.58-08.37 @Image7 CHILDREN'S ROOM. Start on the brass pendant lamp and the geometric ceiling motif, smooth crane down to
  reveal the twin beds and the patterned floor; the pendant glows warmer; whip right at 08.15.
08.37-11.16 @Image9 BATHROOM. Push through the open door into the white marble bathroom, the round ceiling light flares,
  reflections glide across the marble; dive close to the frosted door with the sun motif and whip out backwards at 10.90.
11.16-13.95 @Image2 then @Image1 FINALE. Fly back down the corridor toward the entrance, continuously accelerating
  (building to 3x), burst out through the gold-framed doorway and brake hard into a calm, stable, symmetric hero frame of
  the entrance with the sconces glowing; hold perfectly still for the last 0.8 s (clean frame for the end card).

AUDIO: native stereo, same 172 BPM electronic track continuing, SFX: whoosh on every whip (02.79, 05.58, 08.37, 11.16),
shimmer as the stained-glass panels glow, soft door-wood brush on the bedroom wipe, tiny chime on the pendant lamp, water-drop
"plink" in the bathroom, long rising whoosh on the corridor acceleration into a final bass hit at 13.15 and a reverb tail.
No voice-over, no dialogue.

NEGATIVE: people, hands, pets, camera or photographer reflections, warped or melting walls, bent lines, extra furniture,
changed patterns on rugs and floors, new windows or doors, outdoor views, text, captions, logos, watermarks, cartoon look,
oversaturation, flicker, jitter, morphing between rooms, stutter in the slow glides.
```

## Post-production (DOMUS engine, after generation)
- Join A + B on the 13.95 s frame; check every room against its photo (reject any shot that changed the architecture).
- Camera-tracked 3D extruded words standing on the floor (the reference's "JUMP" beat), on 3-4 hits:
  e.g. entrance 01.4, kitchen 06.3, living 12.6, finale 26.5 (words: from the owner).
- Account handle small top-right all along; end card 27.9-31.9: logo + handle (owner's account/logo).
- Final loudness -14 LUFS.

## SINGLE PROMPT (all 9 photos + reference video in one generation, 27.9 s)
Attach in this order: @Image1 ... @Image9 (table above), then @Video1 = reference/reference.mp4 (camera motion and rhythm only).
```
FORMAT: vertical 9:16, 1080x1920, 30 fps, 27.9 seconds, photoreal real-estate FPV reel of ONE real apartment at night,
all interior lights on, one continuous flight through @Image1 to @Image9.

MOTION REFERENCE: copy the camera language and editing rhythm of @Video1 exactly: FPV cinewhoop one-take, ultra-wide 14mm
lens with slight barrel distortion, flown low (30-120 cm), banked turns with gentle roll, flying through door openings,
passing close to surfaces, long smooth glides broken by sharp whips on the downbeat, cuts hidden inside the whip blur,
one white-flash transition. Use @Video1 ONLY for camera motion, speed and rhythm: none of its locations, house, text,
graphics, logos, people or music.

FIDELITY (highest priority): every space must match its reference photo exactly: walls, doors, ceilings, light fixtures,
furniture, rugs, materials, colours and layout. Do not add, remove, move or restyle anything. Do not invent rooms, windows,
views or extra space; reveal only what the photos show. Straight architectural lines stay straight and rigid.
No people, no hands, no text, no logos, no watermarks in the picture.

GRADE: crisp high-clarity commercial look, clean whites, rich contrast, warm practical lights with soft halation and bloom.

RHYTHM (172 BPM, one bar = 1.395 s, every segment = 2 bars = 2.79 s): each segment is a smooth slow glide (0.6x feel) that,
in its last 0.25 s, accelerates exponentially into a fast whip (3-4x, strong directional motion blur) landing exactly on
the downbeat; the next space starts from that blur and settles instantly into the next glide. Speed changes are S-curves.

SHOTS:
00.00-02.79 @Image1 ENTRANCE. Start 40 cm above the stone floor, glide toward the gold-framed doorway, banking right to
  reveal the gold wrought-iron scrolls and cream brick walls; wall sconces bloom on at 01.40; whip through the doorway at 02.55.
  Keep empty floor space in the lower third for a graphic added later.
02.79-05.58 @Image2 CORRIDOR. Centred on the corridor axis, slow glide toward the lit wooden door at the far end, slight
  roll with the beat; at 05.30 accelerate through the far doorway into a clean WHITE FLASH (4 frames).
05.58-08.37 @Image3 KITCHEN. Out of the flash, the ceiling ring lights snap on one by one front to back on the beats
  (06.28, 06.63, 06.98, 07.33); skim 30 cm above the red floral rug, rise and dive close past the glossy dark upper cabinets
  with a 20-degree roll; whip left at 08.15.
08.37-11.16 @Image4 KITCHEN ANGLE. Slow lateral glide along the black counter, the LED strip under the cabinets sweeps on
  left to right, passing the sink and washing machine; whip right at 10.90.
11.16-13.95 @Image5 LIVING ROOM. Low over the patterned cream rug, tilt up as the blue LED cove ignites and the gold carved
  medallion glows; slow 15-degree orbit; spotlights pop on in sequence; whip at 13.70.
13.95-16.74 @Image6 FORMAL SALON. Perfectly symmetrical one-point view down the centre axis, flying low over the traditional
  rug between the burgundy sofas toward the crimson curtained window; at 15.75 rise toward the glowing orange-red
  stained-glass skylight; whip up-right at 16.50.
16.74-19.53 @Image8 MASTER BEDROOM. Slide past the dark wooden door edge in the foreground (natural wipe), glide toward the
  carved cream bed and the red heart wall as the yellow stained-glass ceiling panel glows; whip left at 19.30.
19.53-22.32 @Image7 CHILDREN'S ROOM. Start on the brass pendant lamp and the geometric ceiling motif, crane down smoothly to
  the twin beds and the patterned floor; the pendant glows warmer; whip right at 22.10.
22.32-25.11 @Image9 BATHROOM. Push through the open door into the white marble bathroom, the round ceiling light flares,
  reflections glide across the marble; dive close to the frosted door with the sun motif; whip out backwards at 24.85.
25.11-27.90 @Image2 then @Image1 FINALE. Fly back down the corridor, continuously accelerating to 3x, burst out through the
  gold-framed doorway and brake hard into a calm, symmetric hero frame of the entrance with the sconces glowing; hold
  perfectly still for the last 0.8 s (clean frame for the end card).

AUDIO: native stereo. Energetic premium electronic track at 172 BPM (driving drums, bright synth stabs, short wordless vocal
chop), original music, not the track of @Video1. SFX: airy whoosh on every whip (02.79, 05.58, 08.37, 11.16, 13.95, 16.74,
19.53, 22.32, 25.11), deep sub boom on the white flash at 05.58, crisp light-switch clicks on the kitchen ring lights,
riser into the blue cove at 12.56 with a bass hit, shimmer on the stained-glass glows, door-wood brush on the bedroom wipe,
tiny chime on the pendant lamp, water-drop plink in the bathroom, long rising whoosh on the corridor run into a final bass
hit at 27.10 and a reverb tail. No voice-over, no dialogue.

NEGATIVE: people, hands, pets, camera or photographer reflections, warped or melting walls, bent lines, extra furniture,
changed patterns on rugs and floors, new windows or doors, outdoor views, anything from @Video1's house, text, captions,
logos, watermarks, cartoon look, oversaturation, flicker, jitter, morphing between rooms, stutter in the slow glides.
```

## SINGLE PROMPT, PHOTOS ONLY (reference video too long to upload; its motion is described in words)
Attach in this order: @Image1 ... @Image9 (table above).
```
FORMAT: vertical 9:16, 1080x1920, 30 fps, 27.9 seconds, photoreal real-estate FPV reel of ONE real apartment at night,
all interior lights on, one continuous flight through @Image1 to @Image9.

CAMERA LANGUAGE: a professional FPV cinewhoop drone reel, edited to feel like one continuous take. Ultra-wide 14mm lens
with slight barrel distortion, the drone flown low (30-120 cm above the floor), smooth banked turns with a gentle 10-20 degree
roll, flying straight through door openings, passing close to walls, cabinets and furniture, rising and diving in one fluid
motion. Long, smooth, floating glides broken by sharp, aggressive whips that hit exactly on the downbeat; every cut is hidden
inside the whip's motion blur, so rooms flow into each other; one clean white-flash transition. Confident, precise, premium
real-estate drone piloting: never shaky, never wobbly, horizon stable except during deliberate banked turns.

FIDELITY (highest priority): every space must match its reference photo exactly: walls, doors, ceilings, light fixtures,
furniture, rugs, materials, colours and layout. Do not add, remove, move or restyle anything. Do not invent rooms, windows,
views or extra space; reveal only what the photos show. Straight architectural lines stay straight and rigid.
No people, no hands, no text, no logos, no watermarks in the picture.

GRADE: crisp high-clarity commercial look, clean whites, rich contrast, warm practical lights with soft halation and bloom.

RHYTHM (172 BPM, one bar = 1.395 s, every segment = 2 bars = 2.79 s): each segment is a smooth slow glide (0.6x feel) that,
in its last 0.25 s, accelerates exponentially into a fast whip (3-4x, strong directional motion blur) landing exactly on
the downbeat; the next space starts from that blur and settles instantly into the next glide. Speed changes are S-curves.

SHOTS:
00.00-02.79 @Image1 ENTRANCE. Start 40 cm above the stone floor, glide toward the gold-framed doorway, banking right to
  reveal the gold wrought-iron scrolls and cream brick walls; wall sconces bloom on at 01.40; whip through the doorway at 02.55.
  Keep empty floor space in the lower third for a graphic added later.
02.79-05.58 @Image2 CORRIDOR. Centred on the corridor axis, slow glide toward the lit wooden door at the far end, slight
  roll with the beat; at 05.30 accelerate through the far doorway into a clean WHITE FLASH (4 frames).
05.58-08.37 @Image3 KITCHEN. Out of the flash, the ceiling ring lights snap on one by one front to back on the beats
  (06.28, 06.63, 06.98, 07.33); skim 30 cm above the red floral rug, rise and dive close past the glossy dark upper cabinets
  with a 20-degree roll; whip left at 08.15.
08.37-11.16 @Image4 KITCHEN ANGLE. Slow lateral glide along the black counter, the LED strip under the cabinets sweeps on
  left to right, passing the sink and washing machine; whip right at 10.90.
11.16-13.95 @Image5 LIVING ROOM. Low over the patterned cream rug, tilt up as the blue LED cove ignites and the gold carved
  medallion glows; slow 15-degree orbit; spotlights pop on in sequence; whip at 13.70.
13.95-16.74 @Image6 FORMAL SALON. Perfectly symmetrical one-point view down the centre axis, flying low over the traditional
  rug between the burgundy sofas toward the crimson curtained window; at 15.75 rise toward the glowing orange-red
  stained-glass skylight; whip up-right at 16.50.
16.74-19.53 @Image8 MASTER BEDROOM. Slide past the dark wooden door edge in the foreground (natural wipe), glide toward the
  carved cream bed and the red heart wall as the yellow stained-glass ceiling panel glows; whip left at 19.30.
19.53-22.32 @Image7 CHILDREN'S ROOM. Start on the brass pendant lamp and the geometric ceiling motif, crane down smoothly to
  the twin beds and the patterned floor; the pendant glows warmer; whip right at 22.10.
22.32-25.11 @Image9 BATHROOM. Push through the open door into the white marble bathroom, the round ceiling light flares,
  reflections glide across the marble; dive close to the frosted door with the sun motif; whip out backwards at 24.85.
25.11-27.90 @Image2 then @Image1 FINALE. Fly back down the corridor, continuously accelerating to 3x, burst out through the
  gold-framed doorway and brake hard into a calm, symmetric hero frame of the entrance with the sconces glowing; hold
  perfectly still for the last 0.8 s (clean frame for the end card).

AUDIO: native stereo. Energetic premium electronic track at 172 BPM (driving drums, bright synth stabs, short wordless vocal
chop), original music. SFX: airy whoosh on every whip (02.79, 05.58, 08.37, 11.16, 13.95, 16.74,
19.53, 22.32, 25.11), deep sub boom on the white flash at 05.58, crisp light-switch clicks on the kitchen ring lights,
riser into the blue cove at 12.56 with a bass hit, shimmer on the stained-glass glows, door-wood brush on the bedroom wipe,
tiny chime on the pendant lamp, water-drop plink in the bathroom, long rising whoosh on the corridor run into a final bass
hit at 27.10 and a reverb tail. No voice-over, no dialogue.

NEGATIVE: people, hands, pets, camera or photographer reflections, warped or melting walls, bent lines, extra furniture,
changed patterns on rugs and floors, new windows or doors, outdoor views, text, captions,
logos, watermarks, cartoon look, oversaturation, flicker, jitter, morphing between rooms, stutter in the slow glides.
```
