# ADR-0006 — One declaration per colour, via `light-dark()`

**Status:** accepted · 2026-10-25

## Context

Dark mode lived in three lists: a `prefers-color-scheme` block (the OS default),
a `[data-theme='dark']` block (the toggle, which has to win), and a copy in
`previews/_preview.css` so a preview could show both themes at once. CSS can't
share one declaration block between a media query and a selector, so the
duplication was structural, and the file's own rule — "edit one, edit the other"
— was enforced by remembering. The preview copy had already fallen behind
(`--i-selection`, `--scrim` and `--on-dark` were missing).

## Decision

Every colour is declared once, on `:root`, as `light-dark(<light>, <dark>)`. The
theme is `color-scheme`: `light dark` by default, pinned by `[data-theme]`.

Arguments are always concrete colours, never a `var()` to another
theme-dependent token. Nested `light-dark()` — directly, or inside
`color-mix()` — is valid CSS, but support across engines couldn't be verified
when this was written, and getting it wrong would blank colours in one browser.
Where that forces a repeat (a wash repeats its hue, `--bg` repeats a ramp step),
`npm run check` holds the copy to its source.

Shadows differ in blur as well as colour, and `light-dark()` only switches
colour, so the two themes' shadows are separate layers, each transparent in the
other theme.

## Rationale

- **Drift becomes impossible rather than checked.** There's no second list.
- **Theming becomes scoped for free.** The value is picked where a colour is
  used, so `data-theme="dark"` on a `<section>` themes that section. The preview's
  forced-dark panel is now `color-scheme: dark` and nothing else.
- **No change in output.** Verified in Chromium against the previous file: all
  119 tokens are identical in five setups (OS light, OS dark, a toggle forcing
  each way, and both agreeing). The shadows and every preview page are
  identical pixel for pixel.

## Consequences

- Browser floor: Chrome/Edge 123, Firefox 120, Safari 17.5.
- `getPropertyValue('--x')` returns the `light-dark(…)` text. JavaScript that
  needs a colour resolves it through `getComputedStyle` on an element
  (DESIGN.md §11). ADR-0002's advice that `chart-colors.ts` read the custom
  properties still stands, but by that route.
- Consumers shouldn't wrap tokens in `color-mix()`; washes are tokens. The
  first consumer that needed one (`life`'s sticky bars) got `--surface-sticky`
  in 0.3.1 rather than a local mix.
- A build that lowers `light-dark()` for older browsers (Lightning CSS, inside
  Next.js and Vite) fixes the theme at `:root`, losing scoped theming. Found in
  `brignano.io`; consumers set `browserslist` to the floor (DESIGN.md §11).
- Not a token rename and not a visual change, so a patch release.
