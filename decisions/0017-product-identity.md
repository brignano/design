# ADR-0017 — A product page is built from what the product does

**Status:** superseded in part by ADR-0019 from v1.0 · accepted 2026-11-13 · #153
**Supersedes in part:** ADR-0011 ("each looks like itself": the mark, layout and frame choices, and "actions stay cobalt on every product")

## Context

ADR-0011 gave each product a mark, a hero layout and a proof frame. On the
live sites that came to an 8% tint and whether the picture sat left or right.
Driftwood, Guidebook and Sites still shared a header, a ground, a headline
type, a status pill, a cobalt button in the same two places, a rounded stage
and a band order, so switching between them read as one site with the words
swapped. Anthony chose a direction from the wireframe
(`previews/wireframes/product-identity.html`) and accepted the proposal
(`proposals/product-identity.md`) the same day.

## Decision

- **Five choices replace three.** Each product picks a ground, a voice for
  its thesis, a shape, a composition, and one piece of its own interface used
  on the page itself. No two products pick the same value for any of them.
  DESIGN.md §13 keeps the register.
- **The primary button leaves cobalt on a product page.** It fills with the
  product's mark, or with ink. Inside the apps, buttons and links stay cobalt
  (ADR-0004, ADR-0014 unchanged).
- **A product's look lives in its own repo**, written in tokens, with its
  choices in `BRIEF.md`. This package ships the tokens, the shared parts of
  `product-page.css` and the register, not a preset per product.
- **Driftwood is rebuilt first**, then Guidebook, then Sites.
- **A product page follows the visitor's theme** unless its look is a theme:
  Driftwood pins dark; Guidebook and Sites define their ground in both.
- **No typeface per product for now.** Weight, size and mono carry the voice.
  Revisit if the three still read alike once built.

## Consequences

- "One hue, one meaning" now has a second scoped exception on product pages:
  the mark may fill the one primary action and wash the page ground. It still
  never colours a link, text or a state, and never appears as a fill in an app.
- The mark needs fill, label and surface tokens per product hue, each held to
  contrast in both themes by `npm run check`.
- `product-page.css` stops being the look. The brief, show then tell, one
  primary action, the word budgets, `fold.mjs` and the stranger test stay.
- Three pages differ, so a change to the shared rules is checked on three
  layouts. The `A|B` stamp in the footer is the one family resemblance.
