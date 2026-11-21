# ADR-0008 — Cobalt is our own: OKLCH hue 256°, not Tailwind's blue

**Status:** accepted · 2026-10-25
**Amends:** ADR-0001 (the hue stays cobalt; the values change)

## Context

ADR-0001 chose cobalt for two reasons: it's semantically inert, and it's
complementary to larch, so identity and affordance don't compete. The values
it shipped, `#2563eb` / `#1d4ed8` / `#1e40af` / `#1e3a8a` and `#60a5fa` /
`#93c5fd` / `#bfdbfe`, are exactly Tailwind's `blue-600…900` and `blue-300…400`,
and the sequential chart ramp was Tailwind's blues too. That undercut both the
second reason and DESIGN.md §1's "nothing here should read as a template":

- Tailwind's blue is at OKLCH 263–266°, leaning violet. Larch is ≈68°, so its
  opposite is ≈248°. The stock values were 15° further from that than they
  needed to be.
- It isn't even one hue. Across the ramp the stock steps wander from 251.8°
  to 265.6°, so hover and pressed shift colour as well as depth.
- It is the single most recognisable colour in the Tailwind default theme.

## Decision

Every cobalt step, interactive and sequential, sits at **OKLCH hue 256°**, and
`npm run check` holds it there ±3°. 256° is as near to larch's opposite as sRGB
allows while keeping cobalt's chroma (≈0.18 at the fill). At 248–252° the gamut
caps chroma near 0.14–0.16, which reads as steel or ocean blue, and links lose
some of the "you can act on this" that ADR-0001 chose blue for.

Each step's lightness was **solved for the contrast its predecessor met**, so
every ratio is within 0.07 of before: fill 5.18:1 under a white label, link
6.78:1 on white, dark fill 7.07:1 on card. The sequential ramp keeps each
step's OKLCH lightness and stays monotonic.

## Consequences

- The blue is deeper and calmer than Tailwind's electric violet-blue, and it is
  one colour from fill to pressed. It still reads unmistakably as a link.
- A visible change, so the release that carries it is a minor.
- `--chart-1` is a separately validated categorical slot (ADR-0002) and is
  unchanged.
