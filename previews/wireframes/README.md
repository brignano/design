# Wireframes

Wireframes for substantial UI changes to this repo, made and approved before
the real work starts. The rule, what counts as substantial and what a
wireframe has to show are in [DESIGN.md §16](../../DESIGN.md#16-wireframes-before-building).

- **One file per change:** `previews/wireframes/<slug>.html`, where `<slug>`
  matches the issue or proposal (`app-shell.html` for `proposals/app-shell.md`).
- **Start from [`_template.html`](_template.html).** It draws the same markup
  in a 390px phone frame and a 1280px desktop frame, side by side, with the
  real tokens and `components.css` loaded. Lay the page out with `@container`
  queries, not `@media`: each frame is a container, so one set of rules shows
  both widths at once.
- **Interactive when it matters.** If the change is a flow, a state change or
  motion, wire it up in the file (buttons that open the dialog, steps that
  advance, the animation at real speed). Native `<dialog>`, `popover` and
  `<details>` usually need no script at all.
- **How Anthony sees it.** Workers Builds deploys this folder with every PR
  push, so the PR's preview link plus `/previews/wireframes/<slug>.html` opens
  it on his phone. Post that link and phone and desktop screenshots in the
  thread, add `needs:anthony`, and stop until he says OK.
- **Then build.** The implementation PR links the approved wireframe. The
  file stays in the repo as the record of what was agreed.

Files here are not gallery pages: `npm run check` doesn't require them in
`index.html` or `_site.js`, and they don't need a `.docs` block. They still
use tokens only, never a hex.
