# ADR-0021 — The logo is "ab" with a cursor after it

**Status:** accepted · 2026-11-23 · #196
**Supersedes in part:** the `A|B` shape of the logo in DESIGN.md §5

## Context

The `A|B` logo put a full-height bar between the initials. Anthony found it
odd and bland: the tall bar reads as a divider, or as a capital I, more than
as a cursor. He wanted it more modern while staying minimal. Four concepts
were drawn (a lowercase prompt, an A and B sharing a stem, a single B with a
cursor spine, and a `brignano_` wordmark) and he picked the prompt.

## Decision

The logo is `ab` in lowercase Geist 800, set tight (-0.065em), with a block
cursor after it in the mark colour, as tall as the a. It keeps the cursor and
the ink-plus-amber rule of the old logo; only the shape changes.
`scripts/logo.py` draws it from the font so it can be redrawn exactly.

`logo/paths.mjs` keeps its `MARK`/`TILE` names and `letters`/`bar` keys, so a
site that inlines the logo needs only the new package version.

## Consequences

- The `.stamp` text treatment (`A|B` set in a footer) still shows the old
  monogram. Moving it to the new shape is a follow-up.
- The `brignano_` wordmark stays an option for a place that needs the full
  name.
