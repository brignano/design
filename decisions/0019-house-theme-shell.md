# ADR-0019 — One house look, with a theme and a shell per product

**Status:** accepted · 2026-11-22 · #171, [`proposals/design-v1.md`](../proposals/design-v1.md)
**Supersedes, from v1.0:** ADR-0001 and ADR-0008 (cobalt as the interactive hue); in part ADR-0014 ("cobalt stays the only colour that means you can act on this", heavy Geist as the display treatment) and ADR-0017 ("inside the apps, buttons and links stay cobalt", "no typeface per product", the mark "never appears as a fill in an app")

## Context

The system was sound underneath but read as the default stack: Geist, a blue
primary, stock icons, white cards. Every app looked like every other app, and
like most other people's. Anthony chose to re-found the look rather than
evolve it (2026-11-21). Three candidate looks were drawn; picking one for
every app would have made them alike again. A first drawing of "one look,
themed per product" put all five products on the same sidebar, stats and
table, and he called it "still really cookie cutter".

Options on the table: one look everywhere; a house look with a colour and
type theme per product; the same, plus a different main-screen shape per
product; cobalt kept as the action colour with only type and shape varying.

## Decision

- **A house look, Split**, shared by everything: the layout rules, how every
  control behaves, mono for data, the `product | section` bar above a heading,
  the `A|B` stamp, state colours, and the accessibility floor.
- **A theme per product**, written as a small file: a kit (Split, Ledger or
  Larch), ground, scheme, action hue, typeface, heading weight, corners. The
  system generates the palette from it and refuses one that fails contrast.
- **A shell per product**: console, canvas, player, conversation or document.
  A product's main screen is built around the one thing it does.
- **The action colour belongs to the theme.** Cobalt is no longer the house's
  interactive colour. Within one product a single hue still means "you can
  act on this"; green, amber and red for state never change.
- **Tokens are generated from a JSON source** in this repo; consumers still
  import plain CSS.
- First assignments: homelab Split/console; Driftwood Split/canvas, dark,
  mono, teal; Guidebook Larch/player, violet; Sites Larch/conversation,
  magenta wash; Receipts Ledger/document. Others are assigned when built.

## Consequences

- Apps differ from one another inside, and match their own marketing pages.
- "Blue means clickable" no longer holds across the family; it holds within
  each product. The audit and the contrast gate carry that weight instead.
- More to build and keep: three kits, five shells, a theme generator, and
  each shared component shown in every kit.
- Nothing changes for an app until v1.0; the ADRs above describe what ships
  until then.
- ADR-0004 (one hue, one meaning) stands. ADR-0015 (a white label on cobalt)
  and ADR-0016 (danger fills) describe today's buttons; they are revisited
  when the kits are built (#179) and get their own ADR then.
- The plain Larch kit must not use one green for both "settled" and "act".
