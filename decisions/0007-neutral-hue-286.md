# ADR-0007 — The neutral ramp is one temperature: OKLCH hue 286°

**Status:** accepted · 2026-10-25

## Context

`tokens.css` called the ramp "cool-leaning", and most of it was: light 300–800
and dark 0–800 sit at OKLCH hue 286°. But light 50, 100 and 200 — the hairline,
`--line-soft`, the hover and pressed surfaces — sat at 106°, a faint yellow, and
dark 900, the primary ink, did too. A border and the label beside it disagreed
on temperature. It was too slight to notice as a colour, but enough to make a
surface read slightly dirty next to a cool one.

## Decision

Every tinted step sits at hue 286°. The off-hue steps (light 25, 50, 100, 200,
900; dark 800, 900) are regenerated at **their existing OKLCH lightness**, so
contrast stays within 0.04 of its old value. Their chroma fits the curve
already set by their neighbours: near zero at the ends, peaking in the
mid-tones. Steps already at 286° are untouched. Pure white stays pure white.
`npm run check` fails any step that leaves 286° ±3°.

## Consequences

- A visible change, if a quiet one, so the release that carries it is a minor.
- The cool ground does the job the original comment gave it: the warm mark
  and the amber attention state are the only warm things on a page.
