# ADR-0002 — Charts keep a full categorical palette, re-derived and validated

**Status:** accepted · 2026-08-23

## Context

An earlier draft suggested the `/coding` chart palette was "undercutting the
identity" and should derive from the brand accent. **That was wrong**, and it is
worth recording why.

Series colour answers *"which of these eight things am I looking at?"*, which needs
eight hues a human can separate at a glance. Deriving eight series colours from one
hue produces eight of that hue nobody can tell apart. **Charts genuinely need the
range.** The constraint is *separability*, not restraint.

## The actual problem

`components/stats/chart-colors.ts` is not too colourful — it is insufficiently
separable. Validated (light, 10 slots):

```
[FAIL] Lightness band      outside band: #ef9aa3, #34d399
[WARN] CVD separation      worst adjacent #a78bfa <-> #06b6d4  dE 6.6 (deutan)
[FAIL] Normal-vision floor worst adjacent #ef9aa3 <-> #f97316  dE 13.7
[WARN] Contrast vs surface 8 of 10 below 3:1
```

ΔE 13.7 means those two are hard to separate **with full colour vision**, before
colourblindness is considered.

## Decision

Keep a full 8-hue categorical palette, capped at 8 + "Other". Replace the values
with a set that passes every hard gate in both modes (adjacent CVD ΔE 9.1 light /
8.4 dark; normal-vision ΔE 19.6 / 19.3). Values in `tokens.chart.css`.

## Consequences

- **Slot order is load-bearing** — the gates measure *adjacent* pairs, so
  re-ordering silently breaks colourblind safety. Fixed order, never cycled.
- Three light-mode slots sit below 3:1; that is legal only with relief (visible
  labels or a table view). The donut's centre readout and legend already satisfy it.
- `stats-pie.tsx` already takes the top 8 and aggregates the rest — now the
  documented rule rather than an implementation detail.
- Colour must follow the **entity**, not its rank. The current code indexes by
  sorted position, so a data shift repaints every series. Map name → slot once.
- `chart-colors.ts` should read the CSS custom properties rather than literal hex,
  or the two will drift the way everything else did.
