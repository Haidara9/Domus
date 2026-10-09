# RTL numerals and units

**What:** In Arabic layouts, numbers + units read right-to-left: the number sits on the right, the unit (م², غرف)
on its left. Numerals use the Arabic font face (`lang: 'ar'` in `D.setFont`) so they match the labels.

**When:** every spec, price or statistic shown in an Arabic film. Choose `digits: 'latin'` (240) or
`digits: 'arabic'` (٢٤٠) once per film and keep it consistent across all components.

**Proven in:** engine pipeline test, 2026-10-09 (the first render had the unit on the wrong side; fixed in `specCard`).
