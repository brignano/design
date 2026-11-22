# ADR-0020 — Kits are opt-in until 1.0, and a fill's label is whatever reads on it

**Status:** accepted · 2026-11-22 · #179
**Amends:** ADR-0019 (when Split becomes the default). **Supersedes in part, inside a kit:** ADR-0015 ("a white label on cobalt in both themes")

## Context

ADR-0019 made Split the house look. #179 was written so that Split applied as
soon as the kits landed. But releases are cut from `main`, and `main` is what
design.brignano.io shows. A default of Split on `main` would have reached every
app at the next publish, before any component was restyled for it, and left the
public site half-built until #183.

Building the kits also forced two things ADR-0019 left open: what labels a
fill once cobalt is not the only fill, and what Larch's action colour is,
since the wireframe drew it in the same forest green as "settled".

Options for the default: Split now; a long-lived `next` branch; or kits that
are opt-in until 1.0.

## Decision

- **Opt-in until 1.0** (Anthony, 2026-11-22). Today's look stays the default.
  A page takes a kit with `data-kit="split"`, `"ledger"` or `"larch"` and that
  kit's file, `kits/<kit>.css`. The default flips to Split in the 1.0 release.
- **A kit may set only names `:root` defines**, and is one rule scoped to
  `[data-kit]`, so it works on `<html>` or on any element.
- **A fill's label is `--on-action`, whatever colour reads on it**: ink on
  Split's lime, the page on Ledger's ink, cream on Larch's spruce. ADR-0015's
  white label stands for the default look only.
- **The primary button is found by its fill or by its edge.** `--action-edge`
  is the fill everywhere except Split in light, where lime is 1.24:1 on white
  and the edge is ink. There, lime is a fill only: marks, lines and links take
  `--action-ink`. The check accepts `--action` as a mark where its edge
  reaches 3:1 instead.
- **Larch's action colour is spruce**, a blue-green about 40° from the forest
  green of `--success`, so "act" and "settled" stay two colours (ADR-0004).
- **Larch's surfaces are lighter than its page**, not darker as the wireframe
  drew them. On a tinted card the amber "attention" mark fell to 2.89:1 on its
  own wash; it needs a surface near white. Charts sit on Larch's lightest
  paper for the same reason (the orange series was 2.72:1 on the card).
- **ADR-0016 stands in every kit**: the danger fills and every state hue are
  the same tokens, measured again on each kit's surfaces.
- `npm run check` holds each kit, in both schemes, to every token floor the
  default look is held to, to its washes, and to the act-versus-settled hue
  gap. A kit may not set a state colour.

## Consequences

- `main` stays releasable and the public site doesn't change early.
- 1.0 has one more step: flip the default, and move today's look out or drop it.
- Until #183, components inside a kit are unstyled for it; the component
  pairs the check reads from `components.css` are measured against the
  default look only, and join the kit floors then.
- In Split, `--info` and the other aliases of `--action` become lime; #183
  must not draw them as marks on a light page.
