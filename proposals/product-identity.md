Status: building · Tracking issue: #153 · ADR-0017

# Product identity: each product page is built from what the product does

## Why

ADR-0011 gave each product three choices: a mark, a hero layout and a proof
frame. On the live sites that comes to an 8% tint and whether the picture is
on the left or the right. Driftwood, Guidebook and Sites still share a white
sticky header, the same grey ground, the same headline type, the same status
pill, the same cobalt button in the same two places, the same rounded stage
and the same band order. Flipping between them reads as one site with the
words swapped.

Anthony chose the direction from the wireframe on 2026-11-13, and allowed the
primary button to leave cobalt on product pages only.

## Wireframe

[`previews/wireframes/product-identity.html`](../previews/wireframes/product-identity.html)
draws the first screen of all three at phone and desktop width.

## What changes for a visitor

- **Driftwood** opens as an incident console: always dark, all mono, square
  corners. The system map is the page's background with the broken box in
  red, and the headline is the added line of a diff.
- **Guidebook** opens bright and loud: heavy type as large as the screen
  allows, pills. Its own coach mark points at the page's button, and the
  header counts the page's steps as you scroll.
- **Sites** opens warm and soft: a wash of its mark over the whole page,
  medium-weight type, round corners. The hero is a text message and the site
  answering it.
- On all three the main button is the product's colour or ink, not blue.
  Inside the apps nothing changes: buttons and links stay cobalt.

## The rule that replaces "three choices"

Each product picks five things and writes them in its `BRIEF.md` under
**Look**. No two products pick the same value for any of them.

| Choice | What it is | Driftwood | Guidebook | Sites |
|---|---|---|---|---|
| **Ground** | the page's own surface | always dark | bright (`--card`) | a wash of the mark |
| **Voice** | how the thesis is set | mono 600 | Geist 800, very large | Geist 500 |
| **Shape** | corners on the button and surfaces | square | pill | soft and round |
| **Composition** | where the product sits | it is the background | it annotates the page | it leans in from the edge |
| **The page does the thing** | one piece of the product's interface, used on the page itself | a diff and a status line | a coach mark and a step counter | a message and its reply |

DESIGN.md §13 keeps this table as the register, so a fourth product can see
what is taken.

## What stays shared

The five-line brief, show then tell, one primary action, the word budgets and
`fold.mjs`, the stranger test, tokens only, the two typefaces, the state
colours, the accessibility floor, and the `A|B` stamp in the footer. The stamp
is the one family resemblance.

## What ships

| Piece | Where | Notes |
|---|---|---|
| `product-page.css` stops dictating the look | `product-page.css` | It keeps what every page needs and nobody should rewrite: the skip link, `.pp-wrap`, the form and its states, prices, `.pp-done`, the clip's Pause control and captions, the legal line. The header, hero, stage and band styles become a **starting point**, each product overrides them in its own stylesheet. |
| Mark tokens a page can fill and wash with | `tokens.css` | Per mark: `--mark-fill` with `--on-mark` (a button, 4.5:1 label in both themes) and `--mark-surface` (a page ground that body text reads on). Contrast pairs added to `check.mjs`. |
| `.pp-button` takes the mark | `product-page.css` | Fill is `--mark-fill`, or `--ink` when the page chooses `data-button="ink"`. Focus ring stays `--i-ink`. |
| A pinned theme | `DESIGN.md` §11, §13 | A product page may set `data-theme` and ignore the OS (Driftwood: dark). |
| §13 rewritten | `DESIGN.md` | "Make it look like this product" becomes the five choices and the register. |
| ADR-0017 | `DECISIONS.md` | Already recorded with this proposal: these decisions, and that the cobalt-everywhere line in ADR-0011 now ends at the product page. |
| Example pages | `previews/` | `product-page-example.html` becomes three short examples, one per product, so the template is never shown as one look. |

Then one issue each in driftwood, guidebook and sites to rebuild the page
from its own Look, starting with the first screen.

## Decisions (accepted 2026-11-13)

| # | Question | Recommendation | Rejected, and why |
|---|---|---|---|
| D1 | Direction | **Accepted 2026-11-13:** the five choices, as wireframed. | More knobs on the template: the sameness is the shared header, button and stage. |
| D2 | Button colour | **Accepted 2026-11-13:** the mark or ink on product pages; cobalt in apps. | Cobalt everywhere: the same blue button in the same place on all three. |
| D3 | Where does a product's look live? | **In the product's own repo**, in tokens, with its choices in `BRIEF.md`. Design ships the tokens, the shared parts and the register. | In `product-page.css` as `data-look="console"` presets: three looks baked into the package is the same cookie cutter with more cutters, and the fourth product starts from someone else's look. |
| D4 | Order of rollout | **Driftwood first**, then Guidebook, then Sites. Driftwood's is the largest change and proves the dark ground and the mark button. | All three at once: three size M rebuilds in review together. |
| D5 | Do Guidebook and Sites follow the OS theme? | **Yes.** Each defines its ground in both themes. Only a product whose look is a theme (Driftwood) pins one. | Pin all three: Sites' visitors on a dark phone get a bright pink page at night. |
| D6 | A typeface per product? | **Not now.** Try weight, size and mono first. Revisit if the three still read alike once built. | Three display faces now: three more fonts to load and license, and "two typefaces" is what still ties the family together. |

All six were accepted by Anthony on 2026-11-13, as recommended.

## What it costs

- **Build:** in this repo, about four size S issues (tokens, `product-page.css`,
  docs and ADR, examples) and one minor release. Then one size M rebuild in
  each of driftwood, guidebook and sites.
- **Running cost:** none. No new fonts, no new hosting, no JavaScript beyond
  what each page's own demo already needs.
- **Maintenance:** three pages now differ, so a change to the shared rules is
  checked on three layouts, not one. The register in §13 has to be kept.

## Out of scope

The apps themselves (they keep `data-mark` and cobalt as in ADR-0014), the
bands below the first screen (each product designs those in its own rebuild),
receipts, breakeven and card (no product page yet), and a typeface per
product (D6).
