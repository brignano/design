# ADR-0001 — The interactive hue is cobalt

**Status:** superseded by ADR-0019 from v1.0 · accepted 2026-08-23
**Supersedes:** `brignano.io/docs/tsd-site-modernization.md` §10.3

## Context

`brignano.io` shipped electric indigo/violet (`#6d28d9` / `#a78bfa`). `life`
shipped a warm functional ramp. Neither was chosen as an interactive colour —
§10.3 records violet as resolving a *negative* constraint:

> **Accent color:** ✅ **Shift the hue** away from emerald. Candidate: an
> **electric indigo/violet** … **amber as fallback**.

That decision answered "not green." A long argument followed about whether amber
or violet should replace it, which was the wrong argument — see ADR-0004. Once
identity, affordance and state were separated, the only question left was what
colour a *control* should be.

## Decision

Cobalt (`#2563eb` / `#60a5fa`), with a full hover / pressed / focus / disabled ramp.

## Rationale

Cobalt, indigo and violet were all measured against both grounds. **All three
cleared every gate**, so contrast did not decide it:

| Candidate | Text (light) | Fill (light) | Text (dark) | Pressed (dark) |
|---|---|---|---|---|
| cobalt | 6.70 | 5.17 | 7.64 | 10.77 |
| indigo | 7.90 | 6.29 | 6.51 | 9.74 |
| violet | 7.10 | 5.70 | 7.13 | 10.52 |

It was decided on the two things contrast can't measure:

1. **Semantically inert.** Amber means caution, green means success, red means
   error — all of them arrive with meaning already attached. Blue arrives with
   none, which is exactly why product UIs converged on it. That is a functional
   property, not a fashion.
2. **Complementary to the mark hue.** Cobalt sits opposite larch on the wheel, so
   identity and affordance never compete for the same attention.

Cobalt over indigo/violet specifically: it has the most dark-mode headroom of the
three, and blue is the most conventional link colour in existence — the lowest
cognitive cost and the highest affordance. **Distinctiveness belongs in the brand
layer; conventionality belongs in the control layer.** That is how you get both.

## Consequences

- `brignano.io` migration surface: 4 literal hexes in `app/globals.css` plus ~15
  `violet-*` utilities. Map **by job**, not find-and-replace: `.text-primary-color`
  → `--i-ink`, filled buttons → `--i`, focus rings → `--i-ink`.
- The trail's summit zone (`tsd-signature-experience.md` §5.2, "summit
  indigo/violet") is re-inked with `--mark`.
- `life` is unaffected — it has no interactive colour today.
