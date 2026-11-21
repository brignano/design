# ADR-0005 — Diagrams are not charts: neutral nodes, colour for state only

**Status:** accepted · 2026-10-13

## Context

`driftwood` draws architecture diagrams and was the first consumer to need them.
Its first pass on these tokens took the chart exception (§8, ADR-0002) and tinted
each node by family (edge, compute, data, messaging…) with `--chart-1…6`. On a
real 46-resource platform that put six hues on screen before anything was wrong,
and the database that was down was one more tinted box among them.

## Decision

A diagram follows the restraint rule. The chart exception exists because a chart
has nothing *but* colour to tell series apart; a diagram node has an icon, a name
and a kind label, so family is already carried three times. Nodes are neutral.
Colour is reserved for state: health (`--danger`, `--attention`) and what a change
did, via three new aliases — `--diff-added`, `--diff-changed`, `--diff-removed` —
over the existing state hues. No new hue enters the system.

## Consequences

- On a healthy, unchanged system the diagram is grey, and that is correct:
  nothing is asking for you.
- `--diff-changed` shares cobalt with links. Context separates them (a node edge
  with a `~ changed` tag is not underlined text), the same way feedback and domain
  status share hues in ADR-0004.
- Standalone exports (SVG files, Mermaid in a pull request) take the light theme's
  values, resolved from `tokens.css` by the consumer at build time.
