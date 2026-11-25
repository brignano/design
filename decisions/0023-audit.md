# ADR-0023 — Apps are audited against the system

**Status:** accepted · 2026-11-24 · #178
**Part of:** design v1.0 (#171)

## Context

Every check in this repo runs in this repo. An app could hardcode a colour, a
font or a radius and nothing noticed until a review, so apps drifted and the
fix landed in the app instead of here (DESIGN.md §12).

## Decision

- **`npx @brignano/design audit [paths]`** scans CSS, HTML, JSX/TSX, Astro and
  Svelte and exits 1, with `file:line`, on a colour literal, a `font-family`,
  `border-radius`, `box-shadow` or spacing value that isn't a token, a Tailwind
  arbitrary colour, or a `var(--…)` name the package doesn't define. It reads
  the package's own `tokens.css`, kits and themes for the names, so it needs
  no config.
- **One escape hatch**, `design-exception: brignano/design#N`, on or above the
  line. It passes while the issue is open and fails once it is closed. A
  failed lookup passes with a warning, so CI never breaks on a network error.
- **No dependencies**, shipped in the package and exposed as `bin`.
- **Spacing is a warning at first** (`--spacing=error` for an error). Running
  it on this repo's own previews found 175 spacing values against 64 errors
  of every other kind, including on-scale values such as `16px` that should
  have been `var(--space-4)`. The first pass in an app is a cleanup; it
  becomes an error when the apps are clean.

## Consequences

The rule in §12 is enforced where the drift happens. An app that needs
something the system lacks files an issue here and waits or takes an
exception; it never styles around the gap. The fleet workflow that calls the
audit from every app is a separate issue in brignano/ai-tools, filed once this
ships.
