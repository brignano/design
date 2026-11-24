# Working on @brignano/design

Read `DESIGN.md` (the rules) and `decisions/` (why, one ADR per file) before changing a token.
Before every commit: `npm run check`.

Tokens are generated. Edit `tokens/*.json` (never `tokens.css`,
`tokens.chart.css`, `tailwind.css`, `kits/*.css` or `themes/*.css`), then
`npm run build`. A product's look is `themes/<product>.theme`.

## Wireframes before UI work

The fleet rule applies ("Wireframes before build" in brignano/ai-tools
`fleet/README.md`). In this repo, wireframes go in `previews/wireframes/`:
see its README and `_template.html`.

## Adding or changing a component

Reviews keep catching the same gaps. Check each before opening a PR that
touches `components.css` or `templates/*.css`:

- **44px on coarse pointers.** Every interactive element (link, button,
  `summary`, tab, sort control) reaches 44px under `@media (pointer: coarse)`,
  as DESIGN.md §10 requires. The one exception §10 names: a control whose shape
  is meaningful takes `.touch-hit` and grows its hit area instead of its box.
  Links inside running text (`.prose` paragraphs) are text, not controls, and
  are not given a 44px box.
- **A marketing-tier demo.** Every `.tier-marketing` rule has a demo inside
  `.tier-marketing` on the component's preview page, so the override is seen.
- **Specificity against earlier rules.** When a rule restyles something an
  earlier rule in the same block already styles (`.prose h2`, the prose link
  rule), check that the new selector actually wins. A rule that silently loses
  passes `npm run check`.
- **Demos outside the preview chrome.** `_preview.css` (`h1`) and `_docs.css`
  (`.docs p`, `ul`, `li`, `code`, `h2`) are unlayered, so they beat every rule
  in `@layer brignano.components`. Put demos outside `.docs`; a demo that needs
  a bare `h1` uses `all: revert-layer` so the component's own style shows.
  `npm run check` only sees that a class name appears, so it can't catch this.
- **Collapse with container queries.** An element can't container-query
  itself, so to collapse a component put the grid on an inner element. Use
  container queries, not viewport queries, for component collapse.
- **Motion under reduced motion.** `tokens.css`'s reduced-motion block is
  unlayered `!important`, so a layered animation override never applies there.
  Keep animations to transform and opacity.
- **CSS details that fail silently.** No hex anywhere, preview data URIs
  included. Set `font: inherit` on inputs. Put each vendor pseudo-element in its
  own rule: one unknown selector drops the whole rule.
- **Contrast and class names.** Status `-line` tokens fall under 3:1 on status
  washes, so don't use them for text there. A page's own class named like a
  component (e.g. `.pill`) picks up the shared rules.
- **Overlays.** A modal dialog makes top-layer popovers inert, which is why the
  app-shell phone nav is a popover. Nested live regions are unreliable.
- **Keep the PR to the component.** Leave `AGENTS.md` and `package.json` out of
  component PRs.

## How to release

Only when Anthony says "publish X" explicitly. An npm version can never be
reused.

1. Write `releases/v<version>.md` and merge it to `main`. Its contents become
   the GitHub release body verbatim.
2. Run the **Release** workflow (`.github/workflows/release.yml`) with
   `version` (no leading `v`) and `prerelease` (publishes to the `next` npm
   tag). It checks the tag, release and npm version don't exist, creates the
   release, and dispatches `publish.yml`.
3. Verify the Publish run and `npm view @brignano/design version`.

`publish.yml` must keep its filename: npm trusted publishing is configured for
it by name. Pushing a `v*` tag by hand still publishes, as before; a dispatched
publish takes the version from the tag, so no version-bump commit is needed.
