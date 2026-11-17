# SFX

Two kinds of sound effect, both free of licensing risk:

1. **Synthesized** by the engine (`node engine/bin/domus.mjs library sfx`): no files.
2. **Recorded, CC0** in `files/` — 86 sounds in nine categories (whoosh, transition, riser, impact, ding, pop,
   click, tick, ambience). `catalog.json` records each file's author, source page, licence and sha256.

```sh
node library/bin/audio.mjs list sfx --category whoosh
node engine/bin/domus.mjs add <dir> audio sfx --path library/sfx/files/whoosh/kit-whoosh.ogg --start 4.2
```

The files are small OGG previews (peak-normalised to -3 dBFS, ambience at -35 LUFS). Each catalog entry links
to the original if a cleaner copy is needed. Glitch, UI-blip and typing sounds from the same collection were
left out: they do not suit property films.

Use them sparingly. One sound per real event (a cut, a title landing), never as decoration.

Add a recorded effect only with a clear licence (CC0 or purchased) and a catalog entry. Sources and terms are
in `LICENSES.md`.

## Not stored here
- **HyperFrames bundled set** (19 files: whoosh, riser, impact, chime...). Pixabay Content License: free in
  videos, but not to be redistributed as standalone files, so they stay out of this public repository. On a
  machine with the render worker installed they are at
  `render-worker/node_modules/hyperframes/dist/skills/media-use/audio/assets/sfx/` and can be passed with
  `--path` like any other file.
- **Mixkit, Pixabay, Sonniss**: free to use in videos, no redistribution. Download per production into
  `productions/<slug>/media/` and note the source in the production's notes.
