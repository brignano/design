# ADR-0013 — Overlays may move as they open and close

**Status:** accepted · 2026-11-09 · #116, from #55

## Context

The tool tier has no motion (§2), and §7 rules out entrance animation.
ADR-0009 allowed one exception: motion the reader starts that shows an order.
The component catalog (#55 dialog, #56 popover and menu, #58 toast) asked for
open and close motion on overlays, which meets none of ADR-0009's conditions.
Dialogs and sheets first shipped still (#115). A sheet that appears from
nowhere doesn't say which edge it belongs to, and a dialog that blinks in
reads as a page jump. Anthony chose to allow the motion with its own entry.

## Decision

An overlay (dialog, sheet, popover or menu, toast) may animate as it opens
and closes, in both tiers, when:

- the person opened it, or it answers something they just did;
- only `opacity` and `transform` move, for `--dur-fast` on `--ease`: a fade
  plus a slide of a few pixels, or a sheet sliding from its own edge;
- the open state is fully shown without the animation (it comes from
  `@starting-style`), so a browser that lacks it shows the overlay at once;
- `prefers-reduced-motion` makes it instant, `::backdrop` included.

## Consequences

- §2's motion row and §7 name this as the one exception beside ADR-0009.
  Content on the page itself still never animates in.
- `.dialog` and `.sheet` get the motion now. Popover, menu and toast use the
  same timing when they are built. The site header's phone menu (#54) can
  adopt it in a later change.
- Anything else that wants to move still has to meet ADR-0009 or it is
  decorative.
