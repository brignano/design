# Wireframes

Where this repo keeps the wireframes the fleet rule asks for. The rule itself
(what counts as substantial, what a wireframe shows, the approval gate) is
"Wireframes before build" in brignano/ai-tools
[`fleet/README.md`](https://github.com/brignano/ai-tools/blob/main/fleet/README.md).
This file only covers how it works here.

- **One file per change:** `previews/wireframes/<slug>.html`, where `<slug>`
  matches the issue or proposal (`app-shell.html` for `proposals/app-shell.md`).
- **Start from [`_template.html`](_template.html).** It draws the same markup
  in a 390px phone frame and a 1280px desktop frame, side by side, with the
  real tokens and `components.css` loaded. Lay the page out with `@container`
  queries, not `@media`: each frame is a container, so one set of rules shows
  both widths at once.
- **Interactive prototypes** can use native `<dialog>`, `popover` and
  `<details>`, which usually need no script at all.
- **How Anthony sees it.** Workers Builds deploys this folder with every PR
  push, so the PR's preview link plus `/previews/wireframes/<slug>.html` opens
  it on his phone. Share that link the way the fleet rule says.
- **Then build.** The implementation PR links the approved wireframe. The
  file stays in the repo as the record of what was agreed.

Files here are not gallery pages: `npm run check` doesn't require them in
`index.html` or `_site.js`, and they don't need a `.docs` block. They still
use tokens only, never a hex.
