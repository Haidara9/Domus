# DOMUS render worker

This worker belongs to the existing DOMUS repository. The Site is the authenticated upload/queue/review UI, not the render computer. Run the worker on the owner's Windows computer while Node, FFmpeg, FFprobe, Python+NumPy and Chrome are available. No inbound port, model key, paid generation, ads or social publishing is used.

1. Restore the already-pinned `tools/video-ad-editor` submodule once if absent; never install a second plugin copy.
2. `npm ci --ignore-scripts` in `render-worker`; existing `animation-studio` Remotion dependencies are reused. For a fresh machine install that folder's locked dependencies too.
3. Configure the private `.env` from `.env.example`. The render token is queue-scoped; the Sites access credential is site-scoped. Neither goes in Git, browser code, screenshots or logs.
4. `node doctor.mjs` then `Start-DOMUS.cmd` on Windows. Keep the terminal open. The application shows the actual heartbeat and supported backends.
5. Upload raw clips in **المونتاج التلقائي**; choose an implemented mention, enter permitted trim and actual text, then start. Review/download the returned result.

The 8 initial presets are DOMUS adaptations, not exact replicas. The other guide/motion-pack cards are indexed references and are rejected by the executable resolver until implemented. Original uploaded PDF/ZIP files stay private under ignored `private-inputs/`, with only filenames/hashes in docs. Never run uploaded scripts automatically. Talking-head masks/3D assets are not inferred from property footage.

Current assembly preserves full clip order and duration, pads to the selected aspect ratio, and optionally renders a DOMUS graphic through Remotion or HyperFrames. It does not automatically infer an arbitrary reference edit, pick creative shot windows, create an FPV camera move, isolate SFX or recover hidden LUTs. Mild warm grade and 3% digital crop are explicitly named presets. Original audio content is normalized to stereo AAC; it is not bit-identical to the input. No new SFX. Muting is explicit. Input HDR is rejected pending an approved transform.

Jobs are atomically claimed with a lease, heartbeat every 15s, and are never automatically retried after failure/interruption. Cancellation invalidates the lease; the worker aborts on heartbeat. Checkpoints, raw files, renders and QC live in ignored `jobs/<id>/`. Keep them for review; clean them up deliberately. Multipart source/output supports up to 1 GiB. Partial upload sessions are aborted on a detected client failure; abrupt browser closure can leave a multipart session for later administrative cleanup.

Run `node --test test/queue.test.mjs` from the repo root for real SQLite lease tests; `node --test render-worker/test/pipeline.test.mjs` exercises FFmpeg, Remotion and HyperFrames on synthetic footage. Chromium cannot launch in some restricted cloud executors; validate the browser backends on the actual worker machine. Visual fidelity, Arabic layout and truthful property presentation still require review before publication.
