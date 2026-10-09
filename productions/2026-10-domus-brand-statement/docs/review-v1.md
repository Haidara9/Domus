# Review: stills before the first full render

Fixed before rendering:
1. Body text wrapped early (orphan «من / اللاذقية»): text block widened to 0.82 and body set to 37 px.
2. Line-art arches crossed behind the body text: moved to the lower half (y 0.985, scale 1.35), as in the posts.
3. Temporary wordmark was clipped by the logo mask (width measured with the wrong font): fixed in `logoReveal`.

Known, accepted for the draft:
- Placeholder fonts: Alexandria draws final «ي» without dots in some words («العقاري»). The official font fixes it.
- Temporary text wordmark instead of the real logo.
