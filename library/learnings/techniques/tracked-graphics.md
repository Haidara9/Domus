# Camera-tracked graphics (labels and architectural outlines locked to the scene)

1. Pick a planar, textured surface (facade, door frame, slat panel). Avoid ceilings with parallax and glass you see through.
2. `python3 engine/tools/track.py <video> <refT> <endT> --roi x,y,w,h --out tracks/x.json` (and `<refT> <startT>` backwards).
3. Take the anchor coordinates from the reference frame at refT (grid still), then put the track into the item:
   `props.track = {frames: [[localT, h0..h8], …]}`. Labels use `trackMode: "position"`, outlines use `perspectiveOutline`.
4. Check stills across the item. If anything drifts, shorten the item or drop it.
5. With an owner's edit as the source: keep their timing, never re-ramp, hide burned-in text with a motivated push-in.
