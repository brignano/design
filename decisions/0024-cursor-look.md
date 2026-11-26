# ADR-0024 — The cursor look: a caret, a comment label, heavy headings

**Status:** accepted · 2026-11-26 · #189

## Context

brignano.io chose the direction "the cursor" (brignano.io#358). Its wireframe
asks the system for a caret after each H1, `// comment` labels in amber, and
800-weight headings everywhere. DESIGN.md §3 keeps amber out of text, §5 allows
one eyebrow and one heavy moment a screen, and the logo's cursor may blink.

## Decision

- **Caret:** `.caret` draws a bar after a heading in `--mark-current`.
  `.cursor-blink` gives it ADR-0022's three blinks. That answers "one blink or
  none": the logo's cursor already blinks three times, and the caret is the same
  cursor, so it counts the same and stops.
- **Comment label:** `.comment-label`. The `//` is the mark, the words are
  `--ink-soft`. It is a section label, separate from `.eyebrow`, so §5's
  one-eyebrow rule is untouched; a section has a label or an eyebrow, not both.
- **Heavy headings:** `data-headings="heavy"`, a site-wide opt-in. Headings stay
  at 600 by default and `.display` stays at once a screen. A site that opts in
  has chosen the cursor look and says so once.
- **Holiday tints:** the system ships no holiday colours. A site points
  `--mark-current` at one that holds the mark's 3:1 on `--bg` and `--card` in
  both themes. brignano.io has 18 holidays and owns the list.

## Consequences

- No new tokens; everything reads `--mark-current`, so the logo bar, caret,
  `.rule` and label slashes tint together.
- brignano.io drops its local caret and label rules once it takes this version.
- The amber `//` fails 4.5:1 as text on purpose: it is a graphic, and the words
  beside it carry the meaning.
