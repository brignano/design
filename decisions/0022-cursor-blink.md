# ADR-0022 — The logo's cursor blinks three times on load

**Status:** accepted · 2026-11-23 · #202
**Supersedes in part:** "at most one blink on a page's first load" in DESIGN.md §5

## Context

The `ab` logo (ADR-0021) ends in a block cursor. Anthony expected it to blink
in a site's header, the way a text cursor does. §5 allowed at most one blink,
which reads as a flicker more than a cursor. A cursor that blinks forever
would pull the eye on every page.

## Decision

The cursor blinks three times when the page loads, at a text cursor's pace
(530ms on, 530ms off), then rests solid. `.cursor-blink` in `components.css`
does it: on the inlined logo's `bar` path, or on a `.stamp` for the stamp's
cursor. Only opacity moves, the resting state is the visible one (so a browser
that skips the animation shows a solid cursor), and nothing runs under
`prefers-reduced-motion`. The tab icon doesn't blink: browsers don't reliably
animate one, and a moving tab icon reads as a notification.

## Consequences

- This is the one piece of motion on load the system allows. It is the logo,
  not content: nothing appears or disappears because of it.
- A site that keeps its header across client-side navigation blinks once per
  full page load, not on every route change.
- The caret after a page's H1 (#189) can take the same class and count.
