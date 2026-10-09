prompts for motion graphics you should training from them:
make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. go all out.



2-make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. go all out.

3-<inputs>
Ask me for: a one-word brand name for the wordmark (a verb works best), 9 to 12 high-res photos, a royalty-free song around 120 BPM with a drop and a quiet breakdown (Mixkit, free for commercial use), and a free stock clip of a plain wall with moving plant shadows (Pexels).
</inputs>

<direction>
An Apple-keynote launch film, 2D only, one continuous take. Every scene is made out of the previous one: nothing fades, blurs or cuts. Objects change shape instead: text rises out of a mask line, icons pop from zero on a spring, bars draw across, pages push, and a black shape floods the whole frame and contracts into the next scene. Warm off-white canvas, black UI, iOS 26 liquid glass over the photos. Archivo (wdth 125, weight 800) for the wordmark, Geist for UI. A cursor drives every change with real clicks, drags and long-presses. The camera zooms screen-studio style so each moment fills the square, and the cursor scales with it.
Banned: crossfades, blur-ins, brightness "developing", 3D flips, particles, glows, holds longer than 1s, anything that looks like a template.
</direction>

<structure>
120 BPM, 54 beats, something happens on every beat.
Open: the wordmark squeezes into its own period like an accordion, the dot grows into a black pill, a label rises inside it. Click: six iris blades close over the label and snap open onto a photo. The circle becomes a square, shrinks, the grid unfolds from behind it like a paper map (center, plus, corners), reflows into a bento, and a click zooms into one tile, landing exactly on the drop.
Glass: a glass word pops in letter by letter, melts into a droplet that stretches into a glass toolbar. The adjust icon turns it into a slider. Dragging relights the photo from day to golden hour (two aligned shots), and the knob turns into a glass lens while held. It lifts into a glass orb, the next photo opens inside it as a circle, and the orb expands into a lock screen: glass clock digits, date, and a home bar that stretches into a glass music player.
Stage: the lock screen pulls back into a phone (the bezel grows out of the screen edge). The Dynamic Island stretches like liquid, pinches off, flies over and grows into a Mac window that rolls up like a blind. Long-press the wallpaper, drag it onto a Safari tab, the page pushes in, drop it and it becomes the hero of a landing page. Scroll: the hero morphs into a framed print on a product card, with the mat and molding growing out of the photo's edge. Pick a frame color (it paints across) and a size, then the nav button flies down into "Order print".
Order: one black shape keeps morphing: Ordered ✓ → Printing % → On its way (a van on a route) → Delivered ✓.
Wall: the delivered circle floods the frame edge to edge, holds black for a beat, and contracts into the framed print hanging on the real wall footage. The same iris opens onto the print, closes again, the frame floods the screen and contracts into the pill → the dot → the letters spring back out, landing on the beat return. Last frame = first frame.
</structure>

<build>
1. One HTML file, square 1440x1440. Every style is computed from time inside an async seek(t): no CSS transitions, no timers, no state between frames.
2. Springs are closed-form step responses. A value with many targets is the sum of one spring per change, so it stays a pure function of time.
3. Liquid glass: each glass element holds its own clone of the scene behind it, filtered with an SVG feImage displacement map (a rounded-rect distance field) through three feDisplacementMaps at slightly different scales for chromatic edges, plus a rim light. Glass letters: a canvas distance field per glyph gives the map, mask and highlights.
4. Goo: blur + alpha threshold, then composite the source atop it so the glass stays sharp inside.
5. Iris: 6 blades around a hexagonal aperture. Each blade is its two vertices, both edge extensions and the SHORT arc between them.
6. Wordmark squeeze: every letter moves toward the dot by the same factor and its drawn width follows (narrow the wdth axis, scale the rest), so the letters stay touching.
7. Footage: re-encode all-intra (ffmpeg -g 1), load it as a blob URL, await 'seeked' before drawing each frame.
8. Sound: a downloaded SFX for every event (Mixkit), never synthesized, each placed by its measured peak. The song starts on a downbeat: the zoom lands on the drop, the wall sits in the breakdown, the wordmark returns with the beat. Loudnorm to -14 LUFS.
9. Render with Playwright: 4 subframes per frame blended with ffmpeg tmix, 60fps. Check one frame per beat, then scan for single-frame pops (frame-difference spikes 3x their neighbours).
</build>

<gotchas>
backdrop-filter: url() misreads displacement maps in Chromium, so clone the scene instead. A flood must overscale past the corners and take about 0.3s, or half the screen changes in one frame. A child with visibility: visible shows through a hidden parent, so use inherit. Text that swaps inside a morphing shape needs its own mask. python http.server can't range-seek video, so use the blob URL.
</gotchas>

<start>
Ask me for the inputs, then show me the beat map and 4 stills (open, glass, stage, wall) before you write the full film.
</start> .

4-make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. go all out.

5-Make a dynamic [24]-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a resume. Go all out.

Only about [TOPIC]. Style: [BRAND COLORS], sound synced to the cuts.

6-make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. go all out.



7-Create a 15s motion-graphics film explaining {{PRODUCT}}. HyperFrames + GSAP, no voiceover, no footage.
Style: paper-light canvas, marker notes that draw on, real physics, huge kinetic type,
hard light/dark switches, a new idea every 1.5–2 s, a sound on every hit.

COPY: read {{POSITIONING_DOCS}} first. {{ONE_LINER}} For {{AUDIENCE}}. {{WHAT_IT_DOES}}
Name what the product learns, never the abstraction.

RULES
- No chrome (scrubber, timecode, fps, headers). No animator jargon on screen
  ("squash", "stagger", "easing"...). Every word speaks to the buyer.
- No invented results: no %, multipliers, customer names or figures.
- Never use: {{BANNED_WORDS}}.
- Logo: real mark {{LOGO_FILE}} + "{{PRODUCT}}" in {{WORDMARK_FONT}}; never a boxed logo file.

CRAFT
- Colours {{COLOR_CANVAS}} / {{COLOR_INK}} / {{COLOR_ACCENT_1}} / {{COLOR_ACCENT_2}}; notes in the
  accents; dark mode = charcoal matching the palette.
- Fonts {{BRAND_FONTS}}; Anton for kinetic type; Caveat handwriting via stroke-dashoffset.
- Real easing, squash/stretch, stagger, overlap, onion skin, smear, follow-through. Check the
  HyperFrames registry first. Set every from-state at t=0 (seek-safe); never cover an exit.
  One primary move per transition; no generic push/slide/rotate-swing.
- Music in sections: drums drop on the dark switch and while the ball is airborne, slam back
  on the type and the logo. SFX: pops, pen scribbles, whooshes, logo sub-hit. CC0 or generated
  only; log sources. Master -14 LUFS, -2 dBTP, re-measured after AAC encode.

8-make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. go all out  do this to thank the first 100 users>. 

9-make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. go all out.

10-make a dynamic lyrics motion graphics video based on the attached music, perfectly syncing the lyrics and animation to the vocals and beat. make it feel like an incredible motion designer’s showreel for a résumé. go all out.


diagrams prompts for training:
1-Adopt the role of an expert motion designer. Build a 30-second animated explainer for my business as a single HTML page. 5 scenes. The customer's problem, what I do, how it works in 3 steps, one proof point, and my name at the end. Bold text, smooth transitions, my brand colours. My business [DESCRIBE WHAT YOU SELL, WHO IT'S FOR AND YOUR COLOURS]
2-make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. go all out.
3-make a dynamic 20-second motion graphics video related to mathematics that shows what an incredible motion designer with mathematics skills you are, like it's your showreel for a résumé. go all out.
4-make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. go all out.
5-make a dynamic 30-seconds motion graphic video about the distilbook like a product explainer the video has to be very incredible (product url)>
-------------

1-make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a resume. go all out.
This video will be same styling as landing page. showcasing viralgrow. be creative with what you show for viralgrow.

2-Create a high energy launch video, showing live stats from the website, show that users can play on desktop and mobile and multiple themes, if need, give me a prompt to generate the song using Suno.

3-make a dynamic motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. go all out.

4-create 15+ sec self-promotion promo.

5-an Apple-style 30s video of my app.

6-<inputs>
Ask me for: the product name and a one-line promise, 3 to 5 UI moments to show, one accent color, 10 to 20 real vertical clips I own, and a royalty-free song with a clear drop (e.g. Mixkit, free for commercial use).
</inputs>

<direction>
High-end minimal. One idea per shot, lots of empty space, one accent color, one clean sans (Geist or Inter) with tight tracking. Masked type reveals, match cuts, one smooth camera language. Real footage only, never placeholder cards. No full stops in on-screen text.
Banned: shockwave rings, particle bursts, RGB split, camera shake, lens flares, neon glows, grid floors, flashing backgrounds, bouncy easing.
</direction>

<structure>
10 bars at 120 BPM, 2 seconds each.
Bar 1: the hook lands word by word on the beats.
Bar 2: one hook word morphs into the product UI. A cursor types and clicks.
The drop: a circle opens out of the button into a dark scene.
Then one move per bar: a wall of real clips with a scan line and 3 winners, the key output as big type, a 3D carousel of real videos with floor reflections and a motion-blurred whip onto one hero clip, the hero in a phone next to a panel that flips into results, big stats on push cuts, a 3-word ticker, a logo reveal, a fade to black.
</structure>

<build>
1. One HTML file at 1920x1080. Every style is computed from time inside 
http://
window.seek(t): no CSS animations, no timers, no state between frames.
2. Real video: extract clips to 30fps JPEG sequences with ffmpeg and swap img sources per frame. seek awaits the image decodes.
3. Analyze the song with numpy: tempo, beat grid, energy per bar, the drop. Calibrate the grid to the real kick hits. Every cut sits on a downbeat, every UI hit on a beat.
4. Render with Playwright: 3 subframes per frame at t minus, at, and plus 1/240s, then blend with ffmpeg tmix for real motion blur at 60fps.
5. Place each sound effect so its measured peak, not its file start, lands on the event. Keep the effects quiet under the music. Loudnorm to -14 LUFS.
6. Probe 20 or more frames before the full render. Fix anything cluttered, overlapping or hard to read.
</build>

<gotchas>
Never set opacity or filter on a preserve-3d element, because it flattens and both faces show. Fade its wrapper instead. Measure element positions at runtime for match cuts. Only use music and sound effects whose license allows commercial use.
</gotchas>

<start>
Ask me for the inputs, then show me a storyboard with every timing on the beat grid before you write any code.
</start>
Show all
This prompt was taken directly from @twoclipping’s post(opens in a new tab).

Model
Opus 5.5
Stack
HTML + Playwright.

7-A Claude Code skill that learns your product's design system, interviews you about the film, then builds and renders a launch or landing-page video in Remotion using your real components, logo and music.

/plugin marketplace add Rieranthony/product-film-skill /plugin install product-film@product-film-skill
View repo(opens in a new tab)
Model
Opus 5.5
Iterations
Many rounds
Stack
Remotion.


8-Cut a raw talking-head clip into a punchy, fun edit with subtitles, graphics and music.

Model
Opus 5.5
Stack
OpenEdit.

9-<inputs>
Ask me for: my product name, a one-line pitch, my logo, 3 to 6 screenshots of the product, 40+ images of what it creates (or photos of it), my brand colors and font, an ElevenLabs API key and voice ID, plus a royalty-free track with a clear drop (the audio file and the drop timestamp). If I skip anything, use these defaults: "Ora 2", "an image model made for taste", free images from Unsplash and Pixabay, Geist, ink #111214, the voice Samara X (19STyYD15bswVz51nqLf) on eleven_v4, and Pixabay "Cascade Breathe" (129.83 BPM, drop at 75.39s).
</inputs>

<script>
Write a 9-line voiceover in this format and adapt every line to my product:
"This is [name]. A [category]... built for [value]. [Verb] in ANY style. Give it a [input] - and it just... understands. The more you use it, the BETTER it gets. Adjust its [setting]. Its [setting]. Its [setting]. Every [output] - exactly as you pictured it. [Name]. Out now."
Use emotion tags sparingly: [softly] on the quiet lines and [excited] on the [Verb] line. Don't tag the opener, and end it with a plain full stop.
</script>

<voice>
Call the ElevenLabs API directly using my key, without an MCP. Generate 4 full-script takes in one pass and let me choose. If a line doesn't sound right, regenerate just that line 4 times and splice the best version into my take.
Shorten pauses longer than 0.28s to 0.2s, then bring each phrase 85% of the way toward the median level, adjusting gain only during pauses.
For word timings, split the read at pauses of 100ms or longer, transcribe each segment separately with Whisper, and align its first word to the measured onset. A single Whisper pass can place words up to half a second late.
</voice>

<direction>
A 22-second square launch film, 1440x1440 at 60fps, in the style of an AI lab launch: white canvas, one typeface, black ink, real images, and captions typed word by word at the exact time they're spoken.
Every control (prompt bar, settings panel, caption pill) uses liquid glass: frost the scene behind it, bend that scene along the edge like thick glass, then add a top sheen, bright rim and soft lift shadow. Glass disappears on plain white, so add a slow pastel aura in my brand colors or a blurred wash of the photo behind it.
The one emphasized word types in a gradient of my brand colors, with a faint glow behind it.
Motion rules: keep the camera drifting (push from 1.0 to 1.04 per scene; when content moves to the next scene, start at the zoom where the previous scene ended). Nothing appears instantly: use eased fades of at least 0.3s. Change images on 16th notes, with a click for each. Land scene changes on phrase starts, and align the music drop with the [Verb] line. Don't show full stops on screen.
Banned: selection-box highlights, beat-snapped slams, white flashes, 3D, templates.
</direction>

<structure>
Seven scenes, timed to the voice:

1. "This is [name]": a collage of my images drifts out as the name types in large, then gives way to the category line.
2. "made for [value]": full-screen flashes of my best images switch on 16th notes into the drop, with the line typed in white over them.
3. The drop: a glass prompt bar types a short prompt. The result card changes style every 16th note, while a black style chip rolls to each new name above a thumbnail strip.
4. "Show it a moodboard": 9 images fly into a 3x3 grid, then circle the result as "It gets you" types on screen.
5. "The more you use it, the better it gets": type two lines, with the emphasized word in the gradient.
6. The settings: show a glass panel with 3 sliders, each moving as she names it. Shift the image's hue, roll new seeds on 16ths, then turn it into a poster. Shift a blurred wash of its colors behind the glass in sync.
7. "Every [output], exactly how you see it": burst 120 of my images outward from the center behind a glass caption pill, then bring them together into my logo as the name types on. Put "Out now" underneath and hold for 2s.

Replace the prompt bar, results and sliders with my product's real input, outputs and settings.
</structure>

<sound>
Set the song so the drop lands on the [Verb] line, and anchor the beat grid there.
Duck the music under the voice with a 3-band sidechain (lows 30%, mids 85%, air 55%; 0.3s hold, 50ms look-ahead, 0.5s release). Then adjust the mids of each phrase until the voice sits about 9 dB above the music between 300 Hz and 4 kHz.
Use one downloaded Mixkit SFX per event, positioned by its measured peak: a click for each image change, a key sound for every typed letter, a soft landing on the emphasized word, whooshes, and impacts on the drop and logo. Trim each around its peak (many risers are 4 seconds). Fade the music along a dB curve under the end card. Loudnorm to -14 LUFS.
</sound>

<build>
1. One HTML canvas. Every frame is a pure function of time inside seek(t), and every caption and cut follows the word table.
2. Glass: capture the canvas behind the shape, blur it about 14px for the body, draw a lightly blurred copy magnified about 1.06x in a 12px band along the edge, then add the milk, sheen, rim and shadow.
3. Render with Playwright at 60fps using 8 motion-blur subframes, then encode with ffmpeg.
4. Before showing me anything, make a contact sheet of stills, scan frame differences for single-frame pops (only the 16th-note runs may jump), and check the voice-to-music ratio for every phrase.
</build>

<gotchas>
A [warmly] opener can sound whispered, while [excited] can feel fake. A highlight box behind a word looks like a Windows text selection. If the camera resets to 1.0 during a handoff, the zoom snaps. A 0.05s fade looks like an instant pop-in.
</gotchas>

<start>
Ask me for the inputs, write the script, send me 4 voice takes to choose from, then show me 8 stills before the full render.
</start>.

Model
Opus 5.5
Stack
HTML canvas + Playwright + ffmpeg.

10-Make a professional explainer video for https://anuprerna.com for a first-time visitor.
This prompt was taken directly from @AmitSingha89’s post(opens in a new tab).

Model
Opus 5.5
Iterations
One-shot.

11-Make a fast-paced ad for Claude, about 10–15 s (closer to 15). Reference video attached.

1. research:
- Study Claude's earlier brand designs first.
- Find every photo and asset that fits: artistic, editorial, whatever the idea needs.

2. design/direction
- An art reimagine: bold, light mode.
- Clean and perfect: no beige "artsy" look, no eyebrow labels.
- Paint elements on top of the images.
- Above all: fast-paced and very creative.

3. rules
- No slop. Study the reference closely: smoothness, timing, shot durations, fonts, elements.
- Take some inspiration and borrow techniques, but change the design overall, it should look like something you did completely on yourself with your own taste 
- Every morph has to be perfect.

ideas: (since everything moves fast)
- Clean, varied Claude SVG animations
- Images small, bigger, several at once
- Morphing text
- Clean 3D animation
- Zooms

extra notes:
- Feel free to work 10+ hours 
- Give me the final video, ending on the Claude logo.



skills: npx skills add Leonxlnx/cinetic.
/plugin marketplace add Rieranthony/product-film-skill
/plugin install product-film@product-film-skill