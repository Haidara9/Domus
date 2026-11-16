# Automatic editing verification — 2026-11-11

Source now resides inside the existing DOMUS project (`apps/workspace`, `render-worker`, existing `animation-studio` and pinned Video Ad Editor submodule). A local Git integration branch exists; pushing to public GitHub was rejected by automatic approval review. No public GitHub upload completed. The update was instead copied directly into the owner's existing Windows project, preserving its branch and prior source.

Verified on owner's Windows computer DESKTOP-KH1N9JE: Node 24, FFmpeg/FFprobe, Python+NumPy and installed Chrome; existing Remotion dependencies reused. The registered Video Ad Editor commit `60626fd22f1a47f7705e68e19bcc68ac2a01b417` restored in its existing submodule path. Four pipeline tests pass, including real FFmpeg, Remotion and HyperFrames renders of synthetic 2-second footage, duration/no-added-SFX checks and the pinned scope analyzer. UTF-8 subprocess output handles Arabic/emoji on Windows. Browser backends cannot launch in the restricted authoring executor, so actual render tests were performed on the Windows machine instead.

Queue tests use real SQLite and pass anonymous denial, two competing atomic claims, lease isolation, invalid stage rejection, raw-key scope and no automatic retry. Existing team/client and reference-evidence tests pass. TypeScript and Site production build pass. Native publication succeeded, audience remains owner-private. Live D1 includes the new three tables; its renderer heartbeat records `ffmpeg`, `remotion`, `hyperframes` from the owner's machine.

Browser QA on local preview verifies the new panel, mention selection, required duration, multipart upload and queued job persistence. Production browser QA is blocked at ChatGPT sign-in in the cloud browser. No real property file was edited or published by the tests. A complete live UI upload → Windows render → live download has NOT been independently verified yet; first actual request still needs that check. Do not equate a heartbeat with a completed live render.

8 executable initial DOMUS adaptations; 71 catalog cards total. Other guide/motion-pack styles remain indexed references and are rejected by the executable resolver. Arbitrary reference cloning, masks, tracked 3D text, inferred shot selection and all 30 transition recipes are not automatically implemented. The workflow returns `needs_review`, not social publication. Presets preserve input order/duration; the warm/crop presets label their changes. Technical QC is not visual proof of architectural fidelity.

The worker is running in the owner's Windows session and has a current-user startup launcher plus Desktop `DOMUS-Montage.cmd`. It requires that computer and network to remain available. Idle network reconnects do not rerun failed jobs. Credentials stay in ignored local configuration. Uploaded source packs are private and not committed to the public repository. Raw footage/reference image evidence and the live D1/R2 contents remain private; code transfer is not a database export.

Dependency audit of the dedicated render-worker package reports zero known advisories after pinning undici 7.30.1. This is a point-in-time package audit, not a blanket security guarantee.


## Update — 2026-11-16: transitions and four more styles

Written and tested in a Linux cloud session (FFmpeg 6.1.1, Node 22, Chromium), not on the Windows worker.

- 13 executable transitions and 4 new presets (12 executable presets in total, 75 catalog cards). Details in `render-worker/README.md`.
- `node --test render-worker/test/pipeline.test.mjs`: 13 of 13 pass. They render synthetic 2-second clips through FFmpeg, Remotion and HyperFrames and check the duration budget for each transition family, the outro's added 2.6 s, and that a missing input is rejected. `render-worker/test/queue.test.mjs` passes.
- Frames across the joins of all 13 transitions and one full-size frame of each new preset were inspected by eye on test patterns. No real property footage was used.
- QC now subtracts the logo card's seconds before measuring the cut, so an outro cannot hide seconds a transition removed.
- `tsc --noEmit` in `apps/workspace` reports one error, in `app/api/reference-evidence/route.ts`: the private `reference-sheets.json` is not in the repository. `tests/reference-evidence.test.mjs` fails for the same reason, with or without this change.

NOT verified: the Windows worker with this code (its FFmpeg build must provide `xfade` modes `zoomin`, `hblur`, `smoothleft`, `vertopen`, `circleopen`, plus `dblur`, `gblur` and `drawtext`); the Site build and deployment with the transition picker; any real footage. The Site must be rebuilt and published and the worker folder updated before the new options appear. Run the pipeline tests on the Windows machine first.
