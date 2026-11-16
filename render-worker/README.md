# DOMUS render worker

This worker belongs to the existing DOMUS repository. The Site is the authenticated upload/queue/review UI, not the render computer. Run the worker on the owner's Windows computer while Node, FFmpeg, FFprobe, Python+NumPy and Chrome are available. No inbound port, model key, paid generation, ads or social publishing is used.

1. Restore the already-pinned `tools/video-ad-editor` submodule once if absent; never install a second plugin copy.
2. `npm ci --ignore-scripts` in `render-worker`; existing `animation-studio` Remotion dependencies are reused. For a fresh machine install that folder's locked dependencies too.
3. Configure the private `.env` from `.env.example`. The render token is queue-scoped; the Sites access credential is site-scoped. Neither goes in Git, browser code, screenshots or logs.
4. `node doctor.mjs` then `Start-DOMUS.cmd` on Windows. Keep the terminal open. The application shows the actual heartbeat and supported backends.
5. Upload raw clips in **المونتاج التلقائي**; choose an implemented mention, enter permitted trim and actual text, then start. Review/download the returned result.

The 12 executable presets are DOMUS adaptations, not exact replicas. Four were added on 2026-11-16: `domus-lower-third` and `domus-spec-card` (HyperFrames overlays, owner text only), `domus-logo-outro` (appends a 2.6 s paper card with the original Arabic logo) and `domus-counter` (per-clip `01 / 03` counter in Playfair). The other guide/motion-pack cards are indexed references and are rejected by the executable resolver until implemented. Original uploaded PDF/ZIP files stay private under ignored `private-inputs/`, with only filenames/hashes in docs. Never run uploaded scripts automatically. Talking-head masks/3D assets are not inferred from property footage.

**Transitions.** 13 of the 30 recipes in `apps/workspace/app/transitions-catalog.json` are executable (`ready: true`); the FFmpeg recipe for each is in `lib/transitions.mjs`. They act only on the joins between uploaded clips, in upload order:

- No duration change: `tr-cut`, `tr-black`, `tr-beige` (fade inside each clip's own frames), `tr-defocus` (blend into a blurred copy around a hard cut; an approximation, not a lens rack).
- Overlap, each join shortens the film by the listed seconds: `tr-dissolve`, `tr-whip`, `tr-vertical`, `tr-directional`, `tr-radial`, `tr-wipe`, `tr-iris`, `tr-split`, `tr-push`. The request is refused unless «أقصى تقصير مسموح» covers `seconds × (clips − 1)`. Audio is cross-faded over the same overlap.

Every clip must be longer than twice the transition length plus 0.2 s. The other 17 recipes (shape, motion or colour match, door/wall/foreground occlusion, luma matte, exposure bridge, spin, day-night, staging...) need shot analysis, masks or tracking and are still rejected. After changing a style, run `node render-worker/bin/sync-catalog.mjs` to refresh the list the Site imports; a test fails if it is stale.

Current assembly preserves full clip order and, with a no-overlap transition, duration, pads to the selected aspect ratio, and optionally renders a DOMUS graphic through Remotion or HyperFrames. It does not automatically infer an arbitrary reference edit, pick creative shot windows, create an FPV camera move, isolate SFX or recover hidden LUTs. Mild warm grade and 3% digital crop are explicitly named presets. Original audio content is normalized to stereo AAC; it is not bit-identical to the input. No new SFX. Muting is explicit. Input HDR is rejected pending an approved transform.

Jobs are atomically claimed with a lease, heartbeat every 15s, and are never automatically retried after failure/interruption. Cancellation invalidates the lease; the worker aborts on heartbeat. Checkpoints, raw files, renders and QC live in ignored `jobs/<id>/`. Keep them for review; clean them up deliberately. Multipart source/output supports up to 1 GiB. Partial upload sessions are aborted on a detected client failure; abrupt browser closure can leave a multipart session for later administrative cleanup.

Run `node --test test/queue.test.mjs` from the repo root for real SQLite lease tests; `node --test render-worker/test/pipeline.test.mjs` exercises FFmpeg, Remotion and HyperFrames on synthetic footage. Chromium cannot launch in some restricted cloud executors; validate the browser backends on the actual worker machine. Visual fidelity, Arabic layout and truthful property presentation still require review before publication.
