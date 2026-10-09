# Productions

One folder per film: `productions/<yyyy-mm>-<slug>/`, created with
`node engine/bin/domus.mjs new productions/<yyyy-mm>-<slug> --format reel-9x16 --title "…"`.

```
timeline.json        source of truth (edit with domus commands)
versions/            snapshots + log.json
docs/                brief.md, concepts.md, shots.md, shotlist.md, review-vN.md, notes.md
media/               footage, photos, music, VO (large files go through Git LFS)
analysis/            shot analysis JSON + shot sheets, beats
renders/             deliverables (+ .qc.json, .contact.png)
cache/               render cache (never committed)
hyperframes/         optional Studio export
```
