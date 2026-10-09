# DOMUS Super Editor — Handoff (cloud session → Windows desktop)

Written 2026-10-09 by the cloud session that started this project. The work moves to the owner's
Windows desktop. Read this file first: the conversation that produced it is not available to you.

## 1. The mission (owner's brief, condensed)

Build **DOMUS Super Editor**: a reusable, multi-agent, AI-assisted cinematic video production
studio for **DOMUS Real Estate (دوموس العقارية), Latakia**. It is not an automated cutter. It acts as
film director, editor, motion designer, VFX supervisor, colorist and sound designer.

1. **Brand and creative direction.** Brand identity is authoritative, but don't copy the reference editing
   style. Build a direction library: Apple-like luxury minimalism, cinematic architectural
   storytelling, high-energy commercial, premium 3D motion, lifestyle/documentary, social reels,
   editorial/experimental. Pick per property, audience, platform and brief. No repeated templates.
2. **Tool orchestration.** Audit MotionClone, NullMotion and Video Ad Editor (and now open-edit,
   Genjutsu, the motion-design skill) and integrate only what they **actually** implement, together with
   HyperFrames, Claude skills and FFmpeg. Check licenses, dependencies and hardware. Prefer local,
   editable and cheap tools.
3. **Agent swarm.** Creative Director, Cinematography Analyst, Master Editor, Motion/VFX Artist,
   Colorist, Sound Designer, Quality Supervisor. One central director owns consistency and final approval.
4. **Libraries.** Transitions and match cuts, whip pans, speed ramps, 2D/3D typography and
   architectural text reveals, IN/OUT/LOOP animation, keyframes, easing, parallax, tracking,
   masks, glow, light sweeps, SFX (whoosh, riser, impact, ambience), logo animation, lower thirds,
   property spec cards. Every effect must serve the story.
5. **Timeline engine.** Editable, non-destructive and frame-accurate, with separate video, audio, text,
   animation and VFX tracks. Supports trim, split, transitions, keyframes, version history, previews and
   **targeted re-renders** (no full rebuild). Reuse an existing timeline/editor where possible.
6. **Architectural authenticity is non-negotiable.** Never invent or distort rooms, walls, doors,
   windows, furniture, dimensions or spatial relations. Camera physics, light and materials stay
   real. Use AI generation selectively and never to depict the property itself.
7. **Pipeline:** Brief → Asset Analysis → Concepts → Storyboard → Shot Selection → Timeline →
   Motion/VFX → Color → Sound → Preview → QC → Export. Exports are platform-optimized and validated
   for duration, resolution, fps, continuity, typography, A/V sync and brand.
8. **Continuous learning.** After each production, extract the techniques that worked into documented
   skills. Clearly separate verified results from proposed capabilities.

### Owner's standing instructions (from Arabic messages)
- Put everything in the **single GitHub repo `haidara9/domus`**, organized properly.
- **Skills that already exist: do not download or copy them again.** Check before installing anything.
- More files (fonts, logos, reference videos, previous productions) will come as links because of
  upload limits. Download them into the project and organize them.
- Conversation language with the owner: **Arabic (Levantine)**.

## 2. What the uploads contained

| Upload | Finding | Action |
|---|---|---|
| `motion-reel-skill.zip` | Byte-identical to the already-installed `motion-reel` skill (canvas `window.seek(t)` + Playwright + ffmpeg, synthesized SFX, springs). | **Not copied** (owner rule). Use the installed skill; the DOMUS engine follows the same render contract. |
| `GetLayers — AI-native library of templates.md` | Page dump of getlayers (Textura Agency): prompt library of web landing pages and three.js/shader/particle backgrounds. No code. | Reference only. It can inspire abstract brand intros/backgrounds, never property imagery. |
| Two font files (Arabic + English) | **Did not arrive.** Only the zip came through. | Ask the owner again. |
| Brand images (logo AR, 4 social posts) | Seen inline in chat only, **not as files**. | Ask the owner for logo files (SVG / transparent PNG). The identity was extracted below. |

## 3. Brand identity (extracted visually from the owner's posts; confirm with the guidelines)

- **Name:** DOMUS — REAL ESTATE / دوموس — العقارية. Based in **Latakia (اللاذقية)**.
- **Values line:** الثقة • الوضوح • الشفافية ("trust, clarity, transparency").
- **Wordmark (EN):** "DOMUS" in a classical, high-contrast Roman serif, near-black. The **O** is a
  circle holding an arch emblem (dome plus columns) in copper, with a copper **roof chevron** above it.
  Under it, "REAL ESTATE" in a widely letter-spaced sans, copper, flanked by thin rules.
- **Wordmark (AR):** "دوموس" in a geometric modern Arabic face, with the same arch-O and chevron;
  "العقارية" in copper with kashida, flanked by rules.
- **Palette (approximate, sample from real files when they arrive):**
  background cream/parchment `#F1E6D3`–`#EFE3CF` with a subtle paper texture; ink `#151412`;
  copper/bronze accent `#A86F3F`–`#B98A5C`; thin gold line art `#C4A177`.
- **Layout language:** RTL, right-aligned headline with a short copper rule under it, body text below.
  A signature **vertical bracket** on the right (a thin vertical line with horizontal end caps and a
  dot at its midpoint). Thin **line-art arches and a column** drawn behind. Sepia architectural
  rendering anchored bottom-right that **fades into the paper**. Page counter "01 / 03" bottom-left
  with a short rule above.
- **Motion ideas derived from the identity:** line-draw of arches/column/bracket, the copper rule
  growing under titles, the roof chevron landing on the O, paper-fade reveals, the counter ticking.
  Calm, architectural, and premium.

## 4. Tool audit (verified by cloning and reading the code on 2026-10-09)

| Tool | What it really is | License | Hardware/deps | Use in DOMUS |
|---|---|---|---|---|
| **MotionClone** (LPengYang) | Research code: training-free motion transfer from a reference video into **AnimateDiff / SD 1.5** generations (T2V, I2V with SparseCtrl RGB/sketch). Default output is **16 frames at 512×512**. | **No license file** (some files carry Apache headers). Treat as not redistributable; run locally only, never vendor. | NVIDIA GPU + CUDA 11.8, PyTorch 2.0.1, diffusers 0.16, xformers; SD1.5 + RealisticVision + AnimateDiff v3 + SparseCtrl checkpoints (several GB). | Very limited. Short abstract/atmospheric brand inserts, or experiments cloning a camera move onto **non-property** imagery. **Never** for depicting a real property (it re-synthesizes pixels). |
| **NullMotion** (blixvip) | Local Node 22 app (no deps): shows a finished motion ad above its rough HyperFrames "drafts", synced frame by frame. FFmpeg scene-detect section planner (`scripts/plan-sections.mjs`), WebCodecs MP4 export of the breakdown. Has an earlier editor at `/editor`. Generation endpoints return `501 NOT_CONNECTED`. Its `import-motionclone.py` expects a *different* "MotionClone" project with a `data/` folder, **not** LPengYang's repo. | **No project license** ("No project-wide open-source license has been selected"); GSAP and mp4-muxer bundled under their own licenses. | Node 22+, Chrome/Edge for export, optional FFmpeg/Python. | **Reference analysis / motion breakdowns:** split reference ads into sections at real cuts, study timing, and export side-by-side breakdowns. Run it from its own clone; don't copy its code into this repo. |
| **Video Ad Editor** (majedphotos, plugin `majed-video` v4.3.5) | Claude Code plugin with 6 skills: talking-head reels (Arabic word-timed captions), motion explainers, podcast, **beat-synced montage of non-speech clips** (`12_montage.py`: scores clips by sharpness, motion, light and color), thumbnails/covers, **DaVinci Resolve Studio** timeline build. Also `26_find_shots.py` (SigLIP2 semantic shot search), `25_scopes.py`, `beat.py` beat/onset grid, `05_sfx.py`, a studio timeline UI (`studio.py`), `08_safe_check.js`. Mac-first (Swift Vision tools), with Windows/Linux fallbacks documented. | **MIT** | Python 3, ffmpeg, Node, optional torch/transformers; DaVinci mode needs **Resolve Studio (paid, from Blackmagic, not App Store)** + its MCP. | **Strong fit:** montage mode (property b-roll on the beat), semantic shot search across footage, beat grid, scopes, DaVinci handoff for manual finishing, Arabic caption know-how. Install it as a plugin **only if not already installed**. |
| **HyperFrames** (heygen-com, npm `hyperframes` 0.8.x) | Open framework: HTML + `data-*` timing (tracks, clips, sub-compositions, `data-media-start`, `data-playback-rate`, volume automation) → deterministic MP4/MOV/WebM. CLI: `init / lint / check / snapshot / preview / render / timeline`. Studio timeline editor. 21 skills. | **Apache-2.0** | Node 22+, FFmpeg. | **Primary editable timeline/composition layer.** DOMUS timeline JSON compiles to a HyperFrames composition so the owner can open it in Studio. Install skills via `npx hyperframes skills update` **only if missing**. |
| **open-edit** (veedstudio, `@veedstudio/openedit-cli`) | Agent video CLI. **Local, free parts:** `render` (HTML→video on a virtual clock, frame-exact, `--from/--to` re-renders only touched segments, ProRes 4444 alpha with `--transparent`), `frames` contact sheets, `concat-videos`, `apply-edl` (frame-snapped EDL assembly with crossfades), `speech-probe`, `mix-audio`/`mux-audio` (-14 LUFS, music ducked under voice), `fonts`, WhisperX transcription. **Paid parts:** VEED transcription/generation and fal (bg removal, lipsync, any fal model on your own key), `veed-project` handoff to VEED's editor. | **Apache-2.0** | Node ≥ 20.18, Chrome headless shell (auto), FFmpeg. | **Good fit for render/QC plumbing:** segment-cached HTML render for overlays and targeted re-renders, EDL assembly, audio mix/loudness, contact sheets. Never spend credits without the owner's explicit approval. |
| **Genjutsu** (sirioberati, TEIN) | Local FastAPI UI for **replacing people/subjects** in a video: depth + SAM 3 masks + Seedance (via Enhancor), Demucs on Replicate. | **MIT** | Python 3.12+, Rubber Band, cloudflared; **paid API keys** (Enhancor, Replicate). | **Not for property footage.** Subject replacement would break authenticity. At most, swap a lifestyle actor in non-property shots with consent, and only on explicit request. Do not install by default. |
| **motion-design skill** (installed, Higgsfield) | Brief → GPT Image 2 storyboard sheet → Seedance 2.0 video. Needs the **Higgsfield connector**, which was **not connected** in the cloud session. | Hosted, credits | Higgsfield account | Optional **storyboard/previz** and abstract brand openers only. Never generate the property itself. |
| **motion-reel skill** (installed) | Canvas `seek(t)` films + Playwright + ffmpeg, synthesized SFX, springs, critique loop. | — | Node, Playwright, ffmpeg | Template for DOMUS motion components and the critique loop. Don't duplicate it. |

## 5. Planned architecture (not yet built; nothing was committed except this file)

```
.claude/agents/            7 role agents (creative-director … quality-supervisor)
.claude/skills/domus-studio/   director pipeline skill (Brief → Export)
.claude/skills/domus-learn/    post-production technique extraction
brand/                     brand.json (tokens above), fonts/{arabic,english}, logos/, guidelines/
docs/                      architecture, tool-audit, pipeline, cinematic-standards, creative-directions,
                           timeline-spec, motion/color/sound library docs, HANDOFF.md
engine/                    Node ESM CLI `domus` (timeline JSON → render)
library/motion/            canvas components (pure functions of t), easing/springs, IN/OUT/LOOP presets
library/transitions/       transition catalog
library/color/             grade presets (ffmpeg chains / .cube)
library/sfx/               synthesized SFX presets
library/learnings/         LOG.md + extracted techniques
productions/_template/     brief.md, shotlist.md, timeline.json, notes.md
reference/                 reference videos (from the owner's links)
tools/                     setup scripts for external tools (check-before-install)
```

**Timeline (`domus.timeline/1`):** fps, canvas, media table; tracks `video` (magnetic V1: in/out,
reframe focus point, camera move push/pull/pan/tilt with easing, speed or ramp, grade, transition to
next), `text`, `animation`, `vfx` (component + start/dur + props, normalized coords), `audio` (music,
vo, sfx, ambience; gain, fades, ducking). All times snapped to the frame grid. Each mutation writes a
numbered snapshot in `versions/`. Renders cache per-clip segments and per-overlay alpha clips by
content hash, so a revision re-renders only what changed. Also exports to a HyperFrames composition.

**Findings from experiments in the cloud session:**
- ffmpeg 6.1 `xfade=transition=custom` with a per-pixel expression is far too slow at 1080×1920
  (≈30 s for a 0.4 s whip). Build whip pans from built-in `xfade` slide transitions plus
  `avgblur=sizeX=…:enable='between(t,a,b)'` (both C-fast; avgblur supports timeline `enable`).
- Smooth push-in: `scale=w='iw*(1+a*ease)':h=-2:eval=frame,crop=W:H:x:y`. Avoid `zoompan` on
  video (it jitters).
- **Arabic typography rules:** never letter-space or animate Arabic per letter (it breaks joining).
  Animate by word or line, use canvas `direction='rtl'`, and use the brand Arabic font.
- Real-estate copy: never invent specs (area, rooms, price). They come only from the brief.

## 6. Next steps on the Windows desktop

1. Check before installing anything. List installed skills/plugins (motion-reel, motion-design,
   hyperframes, majed-video) and tools (git, git-lfs, node ≥ 22, python, ffmpeg, NVIDIA GPU via
   `nvidia-smi`, DaVinci Resolve Studio). Install **only what's missing**, after asking the owner.
2. Get the fonts, logos and brand guidelines from the owner, then fill `brand/` and sample the real colors.
3. Build the engine and libraries per §5, test them on real footage, and commit/push to this branch.
4. Download the owner's large files from the links into `reference/` and `productions/…`. Use
   **Git LFS** for video (>50 MB files can't go in plain git; mind GitHub LFS quota).
