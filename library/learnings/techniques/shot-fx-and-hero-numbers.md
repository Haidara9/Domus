# Shot-level FX on a finished edit, and hero numbers

Context: Haydara Domus (owner's finished edit, first 25 s). Owner feedback on v3: "the shots themselves have no
effects or animation"; "the area must appear at the end, bold, not thin, as VFX".

## Animate the picture without touching the edit
- Split the owner's single clip at the owner's own cuts (frame-exact, same in/out = same frames, same timing).
  Each shot then carries its own camera and light.
- On each owner cut: a short punch (zoom 1.06-1.14 settling to 1.0 in 0.3-0.5 s), an exposure flash
  (0.1-0.22, `flash` shape), 2 frames of lens fringe, and a shake only on the hardest hits.
- Night exteriors: constant warm bloom (0.5) makes practical lights glow; interiors 0.28-0.35.
- Pulse the bloom when a graphic lands (sync light in the picture with light in the graphics).
- Long takes: a slow breathing zoom (1.0 -> 1.045 -> 1.0) that ends at the next clip's starting zoom.
- Tracked graphics stay locked because the engine feeds the camera move into the overlay (`props._cam`).

## Hero numbers
- Heavy weight (Cairo 900), extruded (20+ layers), gold face with a rim light and a sheen, reflection on a dark floor.
- Odometer digits, staggered, the last digit lands on a beat; the landing gets flash + spark burst + streak + a punch
  on the footage (exposure flash, bloom flash, shake) at the same frame.
- Separate the number from the room: defocus 0.78 + exposure -0.13 on the footage, dark centre + petrol edges.
- Frame it as architecture: dimension line with 45° ticks and extension lines, corner brackets.
- Only show figures the owner gave (130 m² was given in writing).
