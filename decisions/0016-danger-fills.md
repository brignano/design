# ADR-0016 — The danger button has its own fills; the state hue doesn't move

**Status:** accepted · 2026-11-12 · #147
**Follows:** ADR-0015, which left the dark danger button as it was

## Context

After ADR-0015 the primary button in dark is a deep cobalt with a white
label. The danger button still filled with the state hue `--danger`, which in
dark is a pale rust chosen to be read as text and marks on dark surfaces, so
the button carried a dark label and went lighter on hover. Beside the primary
the destructive action looked the softer of the two. Deepening `--danger`
itself would have darkened every message, pill and field error with it.

## Decision

A destructive button fills with tokens of its own: `--danger-fill`,
`--danger-fill-hover` and `--danger-fill-pressed`, under a white
`--on-danger` label in both themes. In light they are `--danger` and
`--danger-ink`, so nothing changes there, and `npm run check` holds them to
those. In dark they sit at rust's hue and chroma, as light as a white label
allows at 4.5:1, stepping darker on hover and press: the method ADR-0015 used
for cobalt.

## Consequences

- `--danger`, `--danger-ink` and the danger washes are untouched, so
  messages, pills, toasts, field errors and diagram states look as before.
- "Fill" and "state" are now separate roles for danger, as `--i` and `--i-ink`
  are for cobalt. Success and attention have no filled control, so they get
  no fill tokens until something needs one.
