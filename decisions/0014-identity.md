# ADR-0014 — Identity is a mono voice, a product's mark inside its app, and heavy Geist

**Status:** superseded in part by ADR-0019 from v1.0 · accepted 2026-11-12 · #137, [`proposals/identity.md`](../proposals/identity.md)
**Supersedes:** the identity elements named in ADR-0004 (the trail, Silkscreen)

## Context

ADR-0004 moved identity off amber fills and onto "the things that were always
carrying it": the trail, the `A|B` monogram and the Silkscreen display face.
The trail was later removed from brignano.io because it didn't help the
experience, and neither of the other two ever shipped in the package. An app
built from the system had no identity at all, and the product marks
(ADR-0011) stopped at the product page. Anthony chose a direction from a
wireframe (`previews/wireframes/identity.html`) and accepted the proposal.

## Decision

- **A mono voice.** Every screen opens with one small uppercase mono label,
  and numbers, dates and codes are set in mono. A written rule, not a check.
- **A product's mark follows it into its app.** `data-mark` on `<html>` sets
  the mark for everything below it: the brand glyph in the header and on
  error pages, and the rule above a hero heading. With no attribute the mark
  is the family amber (`--mark`), so personal tools share it. A product gets
  its own hue when it gets a product page.
- **Heavy, tight Geist is the display treatment**, in both tiers, for an
  error code or the `A|B` stamp. Silkscreen is removed in the next minor
  release, after brignano.io has swapped it out.
- A mark is still never a button, link, text or state (ADR-0004, ADR-0011).
  Cobalt stays the only colour that means "you can act on this".

## Consequences

- The trail is no longer part of the identity; DESIGN.md §1, §3 and §5 and
  the comments in `tokens.css` drop it when the build lands.
- `components.css` gains `.eyebrow`, `.num`, `.display`, `.stamp` and
  `.rule`; `tokens.css` gains the `data-mark` rules. `product-page.css`
  reads the same variable, so `.pp[data-mark]` keeps working.
- `--display` stays as a token name, so nothing breaks by name when the
  Silkscreen override and font file go.
- brignano.io, driftwood, guidebook and sites each get an issue: the first to
  swap Silkscreen, the others to set `data-mark`.
