# External tools

The DOMUS engine needs only **Node 20+, FFmpeg and Chromium** (`cd engine && npm install`). Everything below is
optional and is added only when a production needs it. **Always check first. Never reinstall what exists.**

```sh
bash tools/check-env.sh            # report only, installs nothing
bash tools/get-tool.sh NullMotion  # clone into tools/vendor/ (git-ignored), skipped if present
```

| Tool | How to get it | Use it for |
|---|---|---|
| HyperFrames | nothing to install for the export; `npx hyperframes@0.8.143 check/preview/render` inside `productions/<x>/hyperframes` | Studio editing of an exported timeline |
| Video Ad Editor | Claude plugin (`majed-video`), if not installed | montage, semantic shot search, DaVinci handoff, Arabic captions |
| open-edit | `npx @veedstudio/openedit-cli …` | WhisperX transcription, EDL assembly, segment-cached HTML render |
| NullMotion | vendored in `tools/NullMotion` (owner request; no upstream license, keep repo private): `cd tools/NullMotion && npm start` | breaking down reference ads |
| MotionClone | GPU machine only; see `docs/tool-audit.md` | abstract experiments, never property footage |

Paid services (VEED, fal, Higgsfield, Enhancor/Seedance, Replicate) need the owner's explicit approval per use.
