---
name: motion-reel
description: Make a product or showreel motion graphics video rendered from code (HTML canvas + Playwright + ffmpeg), with synthesized sound. Use when the user asks for a launch video, showreel, product reel, promo, animated explainer, motion ad, or "make a video" for a product or idea.
---

# Motion reel

Videos are programs: `index.html` exposes `window.seek(t)` that paints the exact frame for time t.
A headless browser screenshots every frame and ffmpeg encodes the MP4. Sound is synthesized in code.

All helper files live next to this SKILL.md:
- `scripts/render.mjs`  frames -> out/silent.mp4   (`node render.mjs --fps 60 --dur 15 --sub 4`)
- `scripts/sfx.mjs`     cues.json -> out/sfx.wav   (click, pop, thump, whoosh)
- `scripts/beats.py`    track.wav -> beats.json    (bpm, beats, downbeats, hits)
- `scripts/motion.js`   closed-form springs, track(), swapAlpha(), loopT()
- `templates/index.html`, `templates/cues.json`  starter film and cue list
- `references/rules.md` house rules (look, sound, render contract). Read it before building.
- `references/critique-pass.txt` the critique prompt. `references/brand-reel.txt` a brand brief template.

## 0. First-time setup (check, install only what is missing)
- Node 20+, ffmpeg on PATH, Python 3 (only needed for beats.py).
- In the project folder: `npm init -y`, `npm pkg set type=module`, `npm i -D playwright`, `npx playwright install chromium`.
- Only if a music track is supplied: `pip install numpy librosa soundfile`.
- Copy `scripts/*` and `templates/*` into the project folder (create `out/`, `assets/`, `docs/`).

## 1. Inputs to collect first
Product + URL (or the idea), duration, formats (9:16 / 1:1 / 16:9), language, brand colors + fonts,
a reference (frame, video or image folder), music (file or "synthesize"), voiceover (yes/no).
Ask for what is missing in one message; use sensible defaults for the rest.

## 2. Pipeline
1. Gather assets from the URL with Playwright into ./assets. List them. Never invent product UI.
2. If a reference exists, extract frames with ffmpeg and write docs/style_guide.md from it.
3. Measure the track (beats.py -> beats.json) or plan synthesized music on a 120 BPM grid.
4. Write docs/shotlist.md on the beat grid (shot, seconds, on-screen text, motion, SFX). Show it and wait for OK.
5. Build index.html with window.seek(t) using springs from motion.js. Follow references/rules.md.
6. Critique loop, 3 rounds minimum:
   `ffmpeg -i out/final.mp4 -vf "fps=2,scale=270:-1,tile=6x5" -frames:v 1 out/contact.png`
   Look at the image, run references/critique-pass.txt, fix the 3 worst problems, re-render.
7. Render, write cues.json, `node sfx.mjs cues.json out/sfx.wav`, then mix:
   `ffmpeg -i out/silent.mp4 -i out/sfx.wav -filter_complex "[1:a]loudnorm=I=-14:TP=-1.5[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -shortest out/final.mp4`
   Keep music very low under any voiceover.
8. Deliver out/final.mp4, out/contact.png, out/poster.png. Say what you'd improve next.

## Hard rules
- Pure function of time: no Math.random (seeded rng only), no timers, no CSS transitions in render mode.
- Banned: centered title on gradient, everything fading in, corner labels, frame borders, glow on UI.
- Something new on screen every 2 to 4 seconds. Hook in the first 2 seconds.
- Arabic text: set `direction = 'rtl'` on the canvas context and use a font with Arabic glyphs.
- API keys only via .env, never in prompts.
