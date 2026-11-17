# Music

Tracks DOMUS may use in public, commercial videos, kept in the repository so a dead link cannot take them
away. `catalog.json` records each track's licence, source, sha256, length, tempo and loudness.

```sh
node library/bin/audio.mjs list music                 # everything
node library/bin/audio.mjs list music --no-credit     # CC0 only: nothing to write in the caption
node library/bin/audio.mjs list music --mood calming --max-bpm 80
node library/bin/audio.mjs credits <id> [<id>...]     # paste-ready credit lines
node library/bin/audio.mjs verify                     # files match the catalog

node engine/bin/domus.mjs add <dir> audio music --path library/music/tracks/<id>.mp3 --start 0 --fade-out 1.5
node engine/bin/domus.mjs beats <dir> library/music/tracks/<id>.mp3 --snap
```

## Two licences, one rule each
| Licence | Tracks | What it asks |
|---|---|---|
| **CC0 1.0** | HoliznaCC0 (lo-fi, piano) | Nothing. No credit. |
| **CC BY 4.0** | Kevin MacLeod (piano, strings, guitar) | The credit line from `audio.mjs credits` must appear in the post caption or the video. Without it the licence does not apply. |

Details and what was checked are in `LICENSES.md`.

## What has not been done
- **Nobody has listened to these for DOMUS.** They were chosen from titles, the artists' own tags, the
  composer's catalogue notes, tempo and loudness. Every entry has `auditioned_by_owner: false`. The owner
  listens, removes what does not fit the brand, and only then is a track a default choice.
- Tempo for the CC0 tracks is measured by the engine and may read half or double the felt tempo.
- Loudness differs between tracks. The engine mixes music to its own level, so nothing was normalised here.
- No Arabic or oriental music with a clear free licence was found in this pass.

## Platform claims
Free licences do not stop automated copyright claims on Instagram, Facebook or YouTube. If one appears,
dispute it with the track's `source_url` and licence. Kevin MacLeod's tracks carry ISRC codes (in the catalog),
which is what such systems match on.

## Adding a track
Only CC0, CC BY, or a licence the owner bought. Never CC BY-NC, BY-ND for edited use, "free for personal use",
or anything whose terms forbid redistribution (Pixabay, Mixkit, YouTube Audio Library: use those per
production from `productions/<slug>/media/`, not here). Add the file and a catalog entry with its sha256, then
run `verify`.
