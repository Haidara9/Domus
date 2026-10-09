# Where assets live

| Asset | Where | How |
|---|---|---|
| Fonts, logos, guidelines | `brand/` (git) | add files, update `brand/brand.json` |
| Reference films | `reference/<name>/` (git if < 95 MB, else manifest) | `domus fetch` |
| Footage, photos, music, VO for a production | `productions/<slug>/media/` | `domus fetch <dir> <url> --import` or `domus import` |
| Renders (deliverables) | `productions/<slug>/renders/` (git, < 95 MB each) | `domus render` |
| Render cache | `productions/<slug>/cache/` (never committed) | regenerated |

## Linked files (the owner sends links)
```sh
node engine/bin/domus.mjs fetch productions/<slug> "<url>" --import   # download + probe + add to timeline media
node engine/bin/domus.mjs fetch productions/<slug>                    # on a fresh clone: restore missing files
```
- Each download is recorded in `media/manifest.json` (url, sha256, size). Already-downloaded links are skipped.
- Files ≤ 95 MB are committed. Larger files are git-ignored automatically and restored from the manifest. GitHub
  rejects files over 100 MB, and Git LFS uploads are refused from cloud sessions.
- Google Drive and Dropbox share links are converted to direct downloads. **Cloud sessions:** `drive.google.com`,
  `dropbox.com` and `wetransfer.com` are blocked by the environment's network policy unless added under
  *Allowed domains* (environment settings → Network access). Alternative for Drive: the Google Drive connector
  can download the file, then use `domus import`.
- For very large shoots (many GB), keep the originals in Drive and commit H.264 proxies (`ffmpeg -i in.mov -vf
  scale=-2:1080 -c:v libx264 -crf 18 proxy.mp4`). The engine edits proxies fine. Swap to the originals for a 4K master.
