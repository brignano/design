# ADR-0018 — A product's card may carry its stage

**Status:** accepted · 2026-11-15 · #164
**Extends:** ADR-0011 (the stage behind a hero proof), ADR-0017

## Context

brignano.io/projects lists products as cards, each with a drawing of what
the product does. The approved wireframe puts each drawing on a faint field
of its product's mark, so Driftwood's card reads as Driftwood before its
name does. DESIGN.md §3 kept the mark grounds to product pages, and
`.card-media` crops a photo to 16:9, which cuts a drawing's edges. Without a
rule each site would invent its own tint.

## Decision

- **`.card-media.card-stage`** draws the stage on a card: a
  `color-mix(in srgb, var(--mark-current) 8%, transparent)` field, with the
  picture padded and contained in its 16:9 box rather than cropped.
- **Same strength as the product page.** `--pp-stage` and `.card-stage` mix
  the mark at 8%, so a product looks the same on its card and its page. No new
  token: `product-page.css` stays self-contained, so the value is repeated,
  and `npm run check` (gate 13) keeps the copies equal.
- **Only on a card that stands for a product**, and only as its picture's
  ground. Buttons, links, text, chips and state on the card stay as they are.
- **Unmarked products stay amber.** A product gets its own hue with its
  product page (§3); until then its card's stage is the family amber.

## Consequences

- "Identity is not a fill" has a third scoped exception, the smallest: a
  translucent field behind one picture.
- A site listing products gets the tint from the package instead of a local
  copy (brignano.io#340 drops its own).
- Changing the stage strength means changing both files; the check fails
  until they agree.
