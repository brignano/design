# ADR-0012 — Shared components ship as plain CSS in a cascade layer

**Status:** accepted · 2026-11-07 · proposal `proposals/component-layer.md` (#45, #85)

## Context

The package shipped tokens and the product-page template. Buttons, fields,
messages and pills existed only on the preview pages, so every consumer rebuilt
them, and they drifted (brignano.io: about five button styles, an `opacity-40`
disabled state that §4 forbids).

## Decision

- Components ship as **plain CSS classes**: `components.css` for controls and
  patterns, `templates/<name>.css` per page template. No React wrappers, no JS.
- Short unprefixed names (`.btn`, `.field`) inside `@layer brignano.components`,
  so a consumer's own CSS and utilities win without `!important`. States come
  from real attributes (`disabled`, `aria-invalid`, `[open]`), never classes.
- **Native first:** `<dialog>`, `popover`, `<details>`, anchor positioning.
  Where behaviour needs JS, design documents the ARIA contract and the consumer
  owns the script.
- `.pp-button` / `.pp-field` become aliases of the shared classes until 1.0.
- The full catalog is decided now in three waves; wave 3 is built only when a
  product needs it.

## Consequences

- One import gives any surface, React or not, the same controls.
- Every class must appear on a docs page, and contrast is checked in both
  themes (`npm run check`).
- Behaviour bugs live in consumers' JS, not here; the docs pages carry the
  contract so they are written the same way.
