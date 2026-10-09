# Reference study (owner's Drive, 2026-10-09)

Pace measured with `engine/src/analyze.mjs` (scene cuts, threshold 10). Visual notes come from the contact sheets.
Use these as craft training. **Never copy shots, branding or text.** These are other creators' works.

| File | Format | Length | Shots | Avg shot | What to learn |
|---|---|---|---|---|---|
| real-estate-reels/bayleys-pool-house-landscape.mp4 | 640×352 (low-res copy) | 71.9 s | 35 | 2.05 s | Classic listing walk-through: dusk pool hook, gimbal glide through living → kitchen → dining → bath → twilight exterior; agent appears naturally; contact end card on the final dusk shot |
| real-estate-reels/rems-pool-dusk-landscape.mp4 | landscape | 24.9 s | 28 | **0.87 s** | **Speed-ramp reel:** shots enter fast and settle to real speed; dusk exteriors interleaved with interiors; aerial top-down closes; IG handle end card |
| real-estate-reels/rems-countryside-landscape.mp4 | landscape | 21.3 s | 11 | 1.94 s | **Light/white flash transitions** (overexposed wash between shots), mono-ish whip frames, drone reveal of the house in the landscape |
| real-estate-reels/nextlevel-beach-house-vertical.mp4 | 9:16 | 29.5 s | 19 | 1.53 s | **3D tracked title in the scene** (glowing name placed in the ocean/sky, moving with the drone), particle burst transition, sunset/blue-hour drone grammar. Glow and neon are off-brand for DOMUS; keep the *tracking idea*, not the look |
| real-estate-reels/rems-bts-editing-vertical.mp4 | 9:16 | 22.0 s | 7 | 3.12 s | Behind-the-scenes: shows the **speed-ramp curves** (timeline remapping graphs) and gear. Confirms their ramp shape: fast-in / slow-hold / fast-out S-curves |
| motion-graphics/andginja-studio-reel.mp4 | 16:9 | 15.1 s | 9 | 1.66 s | Studio showreel: serif + italic type pairs ("Give people *a reason*"), big kinetic word ("the film"), numbered chapters "04", web/UI cards, dark teal palette |
| motion-graphics/matra-app-launch.mp4 | 9:16 | 30.1 s | 1 (continuous) | — | **One-take morphing launch film:** every scene grows out of the previous one, captions as UI, no cuts |
| motion-graphics/veed-talking-head-styles.mp4 | 16:9 | 37.2 s | 17 | 2.19 s | Caption and style showcase for talking heads: kinetic captions, sticker and comic overlays (useful for agent-on-camera videos) |

## Takeaways adopted into DOMUS
1. **Speed ramps are the signature of the strongest real-estate reels.** S-curve ramps: enter at 2-3×, ease to 1× on
   the subject, sometimes exit fast into the next cut on a beat. DOMUS engine: clip `ramp: [{at:0,speed:2.5},{at:0.3,speed:1},{at:0.85,speed:1},{at:1,speed:2.5}]`.
   Works best on drone/gimbal moves. Cut at the fast part so speed hides the edit.
2. **Pace:** high-energy reels average 0.9-1.5 s per shot. Classic walkthroughs 2 s. The DOMUS "quiet luxury" direction stays slower (3-5 s).
3. **Dusk/blue-hour hooks** dominate openings (`twilight-blue-hour` grade). Aerial top-down shots close.
4. **Light-flash transitions** (`dip-white` / `flash`) between exteriors are common and read as "light". Use with restraint.
5. **In-scene tracked titles** are high-impact. DOMUS can do this with keyframed `callout`/`archTitle` anchors
   (`props.keys.at`) following the drone move, in brand style (Cairo, copper rule), never neon.
6. **End card:** handle/contact on the last exterior beat, or on the paper end card for DOMUS.
