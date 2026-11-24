# Select menu

Issue #198. Size M: proposal and build in one PR.

## Problem

A native `<select>` opens the operating system's list, which differs on every
device and does not match the kit. Rule (2026-11-23): no site shows a native
dropdown. Products were each building their own (the homelab Work page's
`.sortbtn` + `.menu`), which is the drift this system exists to stop.

## Decision

- A **select menu**: a `.select-menu` button (looks like a field, shows the
  choice and a chevron) that opens the existing `.popover` holding a `.menu` of
  `role="menuitemradio"` items. Anchoring, light dismiss and flipping stay the
  popover's. Items may carry a one-line `<small>` hint; the checked item has a
  check mark.
- CSS lives in `components.css` (and `controls.css`). Behaviour is the product's,
  as with tabs; the contract script is on `previews/select-menu.html`.
- Keyboard: arrows move and wrap, Home/End, type-to-jump, Enter/Space choose,
  Esc closes and returns focus, Tab closes. 44px targets on touch.
- `.field select` stays styled only as the no-script and forced-colours
  fallback. Docs say never to use a native `<select>` in product UI.

## Rejected

- Shipping the script in the npm package: the system is CSS-only; tabs set the
  precedent that behaviour belongs to the product.
- Styling `::picker(select)` (customisable select): not in every browser yet,
  so the open list would still differ by device.

## Follow-ups

- Homelab Work page sort and repo menus switch over (separate issue there).
- Fleet reviewer and ux-review check "no `<select>` in product UI" (ai-tools).
