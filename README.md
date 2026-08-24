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

```sh
npm install @brignano/design
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

`0.x`, and deliberately so. `brignano.io` consumes it; `life`, `homelab` and
`driftwood` don't yet. Token *names* may still move while those land, and a `0.x`
range says that out loud — a caret on `0.x` pins the minor, so `^0.1.1` won't
silently take a breaking rename the way `^1.1.0` would. `1.0.0` gets cut when the
names stop changing, not on a date.

Versions track the *tokens*, not the plumbing. A release that changes only
packaging or docs is a patch; the minor is reserved for the first release where
something actually looks different.

## Releasing

The tag is the trigger. `.github/workflows/release.yml` publishes to npm on any
`v*` tag, after checking the tag agrees with `package.json` — npm versions are
immutable, so a mismatch is caught before it's permanent.

```sh
npm version minor   # bumps package.json, commits, tags
git push --follow-tags
```

Publishing is done by CI, never from a laptop. There is no npm token anywhere in
this repo and there should never be one — the runner exchanges its OIDC identity
for a short-lived credential via npm [trusted publishing][tp], which is also what
produces the provenance attestation. A laptop has no such identity.

[tp]: https://docs.npmjs.com/trusted-publishers/
