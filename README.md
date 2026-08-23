# @brignano/design

The shared design system for every brignano surface — `brignano.io`, `life`,
`homelab`, `driftwood`, and whatever comes next.

| File | What it is |
|---|---|
| [`DESIGN.md`](./DESIGN.md) | **Start here.** The rules — the three colour layers, the two tiers, type, motion. |
| [`DECISIONS.md`](./DECISIONS.md) | Why the values are what they are. ADRs. |
| [`tokens.css`](./tokens.css) | Single source of truth for colour, type, space, shape, motion. |
| [`tokens.chart.css`](./tokens.chart.css) | Validated categorical palette for data viz. |

## The shape of it

Three layers, so no colour does two jobs:

- **`--brand-*`** — identity. Larch amber. The trail, the monogram. Never a control.
- **`--i-*`** — affordance. Cobalt. Links, buttons, focus, selection. Semantically inert.
- **`--ok / --warn / --err / --info`** — state. Conventional hues, always with an icon and a word.

Distinctiveness lives in the brand layer; conventionality lives in the control layer.

## Consuming it

```jsonc
"dependencies": { "@brignano/design": "github:brignano/design#v1.0.0" }
```

```css
@import '@brignano/design/tokens.css';
@import '@brignano/design/tokens.chart.css'; /* only if the surface has charts */
```

The tool tier is the default. A marketing surface opts in with
`class="tier-marketing"` on `<html>`, which unlocks the display face and opens the
type scale. Colour is identical across tiers.

## For agents

Read `DESIGN.md` before styling anything. Use the tokens. **Never hardcode a hex
outside `tokens.css`** — a literal survives a theme change silently, which is how
`life`'s status pills sat light grey in dark mode for months.

## Status

Pre-1.0. Not yet published to npm — install from the git tag above. Publishing
`v1.0.0` waits until `brignano.io` is actually consuming it, so the first published
version isn't one that's immediately superseded.
