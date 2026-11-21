# ADR-0015 — A white label on cobalt in both themes; controls answer a press and a switch

**Status:** accepted · 2026-11-12 · #136
**Amends:** ADR-0001 (the dark steps of cobalt), ADR-0013 (what may move)

## Context

A review of the whole system found three things that made the components
read as a default kit. In dark the primary button was a pale blue with a dark
label, and its hover and pressed steps were paler still, so the most
important control on a screen looked washed out. Buttons, inputs, cards and
dialogs shared corners that didn't say which was nested in which (a 12px
button in a 12px card, beside a 6px input). And a control gave no feedback
beyond a colour step, while switching a tab was an instant swap.

## Decision

- **The cobalt fill takes a white label in both themes.** Dark `--i` is a
  saturated mid-cobalt (hue 256°, as light as a white label allows at 4.5:1),
  and `--i-hover` and `--i-pressed` step darker, as they do in light. `--i-ink`
  is unchanged, so in dark the fill and the ink are now different steps.
  `--on-i` is white everywhere; a `--danger` fill gets its own `--on-danger`,
  because rust still lifts to a pale fill with a dark label in dark.
- **Controls have their own radius.** `--radius-control` (8px) for buttons,
  inputs, selects, the segmented control and menu items, between
  `--radius-sm` (chips, pills) and `--radius` (cards).
- **A control may answer the person who used it.** A button settles by 2%
  while pressed, and a switch of view (a tab, a segment) may cross-fade
  through `document.startViewTransition()`, at the browser's default 250ms.
  The package styles nothing on the transition, so it can't change a site's
  own. Both are only ever started by the person, and neither happens under
  `prefers-reduced-motion`.

## Consequences

- Everything drawn in `--i` in dark gets more saturated and darker: the
  checked checkbox and switch, the selected segment, the current page number,
  progress bars, the info dot, and the washes (`--i-surface`, `--i-line`,
  `--i-selection`), which mix the fill. All still clear their floors.
- The danger button in dark keeps its pale fill and dark label. Bringing it
  in line means moving a state hue, which is a separate decision.
- §7's list of what may move gains a third entry. Entrance, hover and scroll
  animation are still out.
- Sheets and dialogs already move under ADR-0013 and get nothing new.
