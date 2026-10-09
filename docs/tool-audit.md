# Tool audit

Audited 2026-10-09 by cloning each repository and reading its code, licenses and dependencies.
**Verified** means checked in code, or run in this repo's environment. **Claimed** means stated in the project's
README but not exercised here.

## Summary

| Tool | License | Runs where | Cost | Role in DOMUS | Status |
|---|---|---|---|---|---|
| **DOMUS engine** (this repo) | owner's | Node 20+, FFmpeg, Chromium | free | Timeline of record, render, QC | Verified (tests + renders) |
| **HyperFrames** 0.8.143 | Apache-2.0 | Node 22+, FFmpeg | free (cloud render optional) | Editable Studio project via `domus export-hf` | Verified: `hyperframes check` passes on exports; snapshots render video, camera, transitions, overlays |
| **Video Ad Editor** (`majed-video` 4.3.5) | MIT | Mac-first, Win/Linux fallbacks | free | Montage, semantic shot search, scopes, DaVinci handoff, Arabic captions | Code read; not installed here |
| **open-edit** (`@veedstudio/openedit-cli`) | Apache-2.0 | Node ≥ 20.18 | local parts free; VEED/fal paid | Frame-exact HTML render with segment cache, EDL assembly, WhisperX transcription, audio mix | Code/README read; not installed here |
| **NullMotion** | **no license** | Node 22, Chrome/Edge | free | Reference ad breakdowns (study only) | Code read; not vendored |
| **MotionClone** | **no license file** | NVIDIA GPU (CUDA 11.8) | free, heavy | Abstract motion experiments only | Code read; cannot run here (no GPU) |
| **Genjutsu** | MIT | Python 3.12 + paid APIs | paid (Enhancor, Replicate) | Not for property footage | Code read; not installed |
| **motion-design skill** (Higgsfield) | hosted | Higgsfield connector | credits | Previz storyboards, abstract openers | Connector not connected in the build session |
| **motion-reel skill** | — | Node, Playwright, FFmpeg | free | Reference for the render contract; installed separately | Installed (not duplicated in repo) |

## Details

### HyperFrames (heygen-com/hyperframes)
- HTML compositions with `data-start / data-duration / data-media-start / data-playback-rate / data-volume`,
  tracks, sub-compositions, one paused GSAP timeline per composition, deterministic render to MP4/MOV/WebM.
  CLI: `init, lint, check, snapshot, preview (Studio), render, timeline`.
- **Integration:** `domus export-hf <dir>` writes `hyperframes/index.html` + `compositions/<overlay>.html` +
  `assets/`. Video clips keep their source and trim, so they stay editable in Studio. The camera move becomes GSAP
  keyframes on an untimed wrapper. Grades become CSS-filter approximations. Speed ramps, stabilization,
  shot-match and stills are exported as **baked** segments. Overlays are canvas sub-compositions painted by the
  same DOMUS motion runtime (identical look). GSAP is bundled locally (the CDN can be blocked offline).
- Limits: CSS grades approximate the FFmpeg presets. Music ducking isn't exported (add a `data-automation`
  lane in Studio). The DOMUS renderer remains the reference for delivery.

### Video Ad Editor (majedphotos/video-ad-editor, plugin `majed-video`)
- Six skills: talking-head reels (silence cut, word-timed Arabic captions), motion explainers, podcast, **beat
  montage** of non-speech clips (`12_montage.py`: scores clips on sharpness, motion, light and color), covers
  and thumbnails, **DaVinci Resolve Studio** timeline build (needs the paid Studio edition from Blackmagic plus its
  MCP; the App Store and free versions lack scripting).
- Useful pieces: `26_find_shots.py` (SigLIP2 semantic search across footage, about 1.5 GB model, local),
  `beat.py` (beats, accents, drops, onsets), `25_scopes.py`, `05_sfx.py`, studio timeline UI, safe-zone checker.
- Mac-first: Swift/Vision tools (person masks, face tracking) need macOS. Fallbacks are documented for Windows,
  Linux and cloud.
- **Use:** semantic search through large shoot folders, quick beat montages, DaVinci finishing, and captions for
  talking agents. Install as a plugin only if not already installed; don't copy it into this repo.

### open-edit (veedstudio/open-edit)
- Local and free: `render` (HTML on a virtual clock, frame-exact, `--from/--to` re-renders only overlapping
  segments, ProRes 4444 alpha with `--transparent`), `frames` sheets, `concat-videos`, `apply-edl`
  (frame-snapped EDL with crossfades), `speech-probe`, `mix-audio` / `mux-audio` (−14 LUFS, ducking),
  `fonts`, WhisperX transcription.
- Paid, needing explicit approval: VEED transcription and generation, fal models (background removal,
  lipsync, any model), `veed-project` handoff.
- **Use:** an alternative render backend and transcription for VO/talking-head material.

### NullMotion (blixvip/NullMotion)
- Local Node 22 app with no dependencies. It shows a finished ad over its plain HyperFrames "drafts" in sync,
  plans sections with FFmpeg scene detection (`scripts/plan-sections.mjs`), and exports the breakdown as MP4
  (WebCodecs, Chrome/Edge). Generation endpoints answer `501 NOT_CONNECTED`. Its `import-motionclone.py` expects
  a different "MotionClone" project layout (a `data/` folder), **not** LPengYang's repo.
- **No license**, so run it from its own clone (`tools/README.md`) and never copy its code here.
- **Use:** study reference ads (yours or competitors') and pitch structures.

### MotionClone (LPengYang/MotionClone)
- Research code: training-free motion transfer from a reference video into AnimateDiff/SD-1.5 generations
  (T2V, I2V with SparseCtrl). Default output is 16 frames at 512×512.
- Needs an NVIDIA GPU, CUDA 11.8, PyTorch 2.0.1, diffusers 0.16, xformers, plus several GB of checkpoints
  (SD 1.5, RealisticVision, AnimateDiff v3, SparseCtrl). **No license file.**
- **Use:** none for property footage, because it re-synthesizes pixels and would break authenticity. At most an
  experiment for abstract brand textures on a GPU machine.

### Genjutsu (sirioberati/Genjustsu-Open-Source-Workflow)
- Replaces **people/subjects** in a video (depth + SAM 3 masks + Seedance via Enhancor). Needs paid keys.
- **Use:** not for property footage. Possible only for lifestyle shots with actors, with consent, on explicit
  request.

### motion-design skill (Higgsfield)
- Brief → GPT Image 2 storyboard sheet → Seedance 2.0 video. Hosted and credit-based.
- **Use:** quick previz storyboards for concept approval, or abstract brand openers. Never the property itself.

### GetLayers (reference document)
- A library of web-design prompts (landing pages, three.js/shader backgrounds). No code was supplied.
  Mood inspiration only.
