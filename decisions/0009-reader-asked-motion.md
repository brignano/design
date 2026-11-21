# ADR-0009 — Motion the reader asks for is allowed in the tool tier

**Status:** accepted · 2026-10-31

## Context

The tool tier has no motion (§2). driftwood's request flow view answers the
first question on an incident call, "where does traffic come in and what does
it pass through", and its *Trace a request* control walks a request through the
diagram one hop at a time. Shown all at once, the order is only in the numbers;
walked, it is obvious.

## Decision

Motion is allowed in the tool tier when the reader starts it and it shows an
order: it runs only on a click, can be stopped, every step it shows is also
listed as text, and `prefers-reduced-motion` gets the final state at once (the
whole path lit). It uses the selection treatment from §9, so it adds no hue.
Decorative motion stays out.

## Consequences

- The §7 contract still holds: nothing is hidden until an animation runs, and
  the page reads the same with the script off.
- Any later animation in a tool has to meet the same four conditions or it is
  decorative.
