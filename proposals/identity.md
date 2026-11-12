Status: proposed · Tracking issue: #137

# Identity: a mono voice, product marks inside the apps, and a heavy display treatment

## Why

DESIGN.md says identity lives in the trail, the `A|B` monogram and the
Silkscreen display face. The trail has since been removed from brignano.io,
and neither of the other two ships in the package: `--display` and `--mark`
are never used in `components.css` or any template. So an app built from the
system (life, homelab, driftwood) is consistent and anonymous. The product
marks (`teal`, `violet`, `magenta`) stop at the product page, so once you are
inside an app nothing says which one it is.

Anthony chose a direction from the wireframe on 2026-11-12: **1 + 2 + 3b**.
This proposal turns that choice into what ships. Five choices are still open;
each has a recommendation, and accepting the proposal accepts all five unless
he says otherwise.

## Wireframe

[`previews/wireframes/identity.html`](../previews/wireframes/identity.html)
shows each direction on a marketing hero, an app screen and an error page, at
phone and desktop width. The build follows rows 1, 2 and 3b together.

## What changes for the person using an app

- **Every screen opens with a small uppercase mono label** saying where they
  are ("PRODUCTION" above "Services"), and every number, date and code is set
  in mono. This is the voice all the products share.
- **Each product keeps its colour inside the app.** Driftwood's glyph is teal
  in its header and on its error pages, as it already is on its marketing
  page. Buttons and links stay cobalt everywhere.
- **Big moments are set in heavy, tight Geist:** an error page's "404", the
  `A|B` stamp in a footer. Silkscreen is retired.

## What a consumer writes

```html
<html data-mark="teal">                      <!-- once, per product -->

<p class="eyebrow">Production</p>            <!-- opens the screen -->
<h1>Services</h1>

<td class="num">2026-11-07 09:30</td>        <!-- any number, date or code -->

<p class="display">404</p>                   <!-- a big moment -->

<span class="stamp" aria-label="Anthony Brignano">A|B</span>
```

The brand glyph in `.site-brand` and `.error-page-mark`, and a new `.rule`
(the short bar above a hero heading), take the product's mark on their own.

## What ships

| Piece | Where | Notes |
|---|---|---|
| `.eyebrow` | `components.css` | `--mono`, `--text-xs`, uppercase through CSS, `--tracking-caps`, `--ink-soft`. Written in sentence case (§15). |
| `.num` | `components.css` | `--mono` with tabular figures, for numbers, dates and codes outside a table's numeric column (which gets it too). |
| `.display` | `components.css` | Geist 800, `--tracking-display` tightened further, `--leading-display`. For an error code or one headline number, once a screen. |
| `.stamp` | `components.css` | `A|B` in the display treatment, in `--ink`. The family mark, in a footer or an about page. |
| `.rule` | `components.css` | The 56px bar above a hero heading, in the current mark. |
| `data-mark` | `tokens.css` | `data-mark="teal|violet|magenta"` on any element sets `--mark-current` for that subtree. With no attribute it is the family amber (`--mark`). `product-page.css` reads the same variable, so `.pp[data-mark]` keeps working. |
| Glyph colour | `components.css`, `templates/error.css` | `.site-brand > svg` and `.error-page-mark > svg` take `--mark-current`. The words beside them stay `--ink`. |
| `--display` | `tokens.css` | Becomes the heavy Geist treatment in both tiers. The `.tier-marketing` Silkscreen override and `fonts/silkscreen-*` are removed. |
| Docs | `DESIGN.md` §1, §3, §5, `tokens.css` comments | The trail is no longer cited. A new rule: one eyebrow per screen, numbers in mono. An ADR records the decision. |

Each row above is a size S issue once this is accepted, filed with its
Decisions taken from here. The preview pages (`type.html`, `site-chrome.html`,
`error.html`, `app-shell.html`) show the new classes, as the check requires.

## Decisions for Anthony

| # | Question | Recommendation | Rejected, and why |
|---|---|---|---|
| D1 | Where is a product's mark set? | **`data-mark` on `<html>`**, read by everything below it. One attribute per product. | A class per component (`.site-brand-teal`): easy to forget on the error page, which is the drift this fixes. |
| D2 | What does an app with no mark look like? | **The family amber** (`--mark`), so life and homelab are "Anthony's own tools" and brignano.io keeps its colour. | Plain ink: what ships today, and the reason the apps look anonymous. |
| D3 | Do life, homelab, breakeven and receipts each need their own hue? | **No, not now.** Three product hues exist. Personal tools use the family amber; a product gets a hue when it gets a product page. | Four more hues now: each has to sit clear of cobalt and the three state colours in both themes, and most of these apps have one user. |
| D4 | What happens to Silkscreen? | **Removed in the next minor release**, with an issue in brignano.io to swap its monogram and eyebrows first. `--display` stays as a token so nothing breaks by name. | Keeping both: two display faces is the "used once, well" rule broken. Removing it with no notice: brignano.io would fall back to Plex Mono mid-page. |
| D5 | Is "one eyebrow per screen" enforced? | **Documented, not checked.** A rule in DESIGN.md §5 and on the preview pages. | A check in `check.mjs`: it can't tell a screen from a fragment, and a false failure teaches people to ignore it. |

## What it costs

- **Build:** five or six size S issues in this repo, one release, then one
  issue each in brignano.io (Silkscreen swap), driftwood, guidebook and sites
  (add `data-mark`). No new font, no JavaScript, about 40 lines of CSS.
- **Running cost:** none. One font file fewer to load on brignano.io.
- **Maintenance:** one more attribute to set when a product starts. A new
  product hue is a token plus a contrast check, as today.

## Rejected

- **Bringing back the trail.** It was removed for hurting the experience.
- **A brand colour on buttons or links.** It breaks "one hue, one meaning":
  cobalt is the only colour that says "you can act on this".
- **Illustrations or a mascot.** DESIGN.md §5: abstract over literal.
- **A separate `brand.css`.** One more import for every consumer to forget;
  the pieces are small enough for `components.css`.

## Out of scope

Favicons (each product draws its own), the email template (it has no
glyph today), the dark-mode primary button, control
radius and motion (#136), and any change to the state colours or cobalt.
