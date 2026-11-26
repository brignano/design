# ADR-0025 — An icon's stroke is three tokens, one rule per kit

**Status:** accepted · 2026-11-26 · #182 (first part)

## Context

The icon set is Lucide, drawn at a 2px round stroke. Each kit draws its own
stroke (ADR-0019): Split 1.5px with square ends and sharp joins, Ledger 1.5px
flat ends and sharp joins, Larch 1.75px round. Redrawing 46 icons three times
would give three sets to keep in step.

## Decision

- The rule is carried by `--icon-stroke`, `--icon-cap` and `--icon-join`. The
  root values are Lucide's (2, round, round), so nothing changes until a kit is
  chosen (ADR-0020). Each kit sets its own.
- Under `[data-kit]`, `svg[stroke="currentColor"]` takes the three tokens, so
  inline icons (which carry presentation attributes) follow the kit with no
  edit.
- Each file in `icons/` carries one `style=` that reads the tokens with Lucide's
  values as the fallback, written by `scripts/icons.mjs`. One file serves every
  kit, and an `<img>` still draws.
- `npm run check` fails an icon that hardcodes `stroke-width`, `stroke-linecap`
  or `stroke-linejoin`, or lacks the tokens.

## Consequences

- No file per kit. A new icon is added from Lucide, then `node scripts/icons.mjs`.
- Filled selected variants, the larger set and the product marks are the rest
  of #182 and follow separately.
