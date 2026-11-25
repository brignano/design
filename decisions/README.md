# Decisions

Why the values in `tokens.css` are what they are. Each entry supersedes whatever
came before it; nothing here is re-litigated without a new entry.

One file per decision, `NNNN-slug.md`, numbered in date order. A merged
record is only edited to mark it superseded; a change of mind is a new record.

| ADR | Decision | Date |
|---|---|---|
| [0001](0001-cobalt.md) | The interactive hue is cobalt | 2026-08-23 |
| [0002](0002-chart-palette.md) | Charts keep a full categorical palette, re-derived and validated | 2026-08-23 |
| [0003](0003-one-public-package.md) | The system lives in one public repo, consumed as a package | 2026-08-23 |
| [0004](0004-one-hue-one-meaning.md) | One hue, one meaning | 2026-08-23 |
| [0005](0005-diagrams-are-not-charts.md) | Diagrams are not charts: neutral nodes, colour for state only | 2026-10-13 |
| [0006](0006-light-dark.md) | One declaration per colour, via `light-dark()` | 2026-10-25 |
| [0007](0007-neutral-hue-286.md) | The neutral ramp is one temperature: OKLCH hue 286° | 2026-10-25 |
| [0008](0008-cobalt-hue-256.md) | Cobalt is our own: OKLCH hue 256°, not Tailwind's blue | 2026-10-25 |
| [0009](0009-reader-asked-motion.md) | Motion the reader asks for is allowed in the tool tier | 2026-10-31 |
| [0010](0010-product-pages-show-then-tell.md) | Product pages show, then tell | 2026-11-01 |
| [0011](0011-product-page-briefs.md) | Product pages start from a brief, and each looks like itself | 2026-11-02 |
| [0012](0012-components-in-a-cascade-layer.md) | Shared components ship as plain CSS in a cascade layer | 2026-11-07 |
| [0013](0013-overlay-motion.md) | Overlays may move as they open and close | 2026-11-09 |
| [0014](0014-identity.md) | Identity is a mono voice, a product's mark inside its app, and heavy Geist | 2026-11-12 |
| [0015](0015-white-label-on-cobalt.md) | A white label on cobalt in both themes; controls answer a press and a switch | 2026-11-12 |
| [0016](0016-danger-fills.md) | The danger button has its own fills; the state hue doesn't move | 2026-11-12 |
| [0017](0017-product-identity.md) | A product page is built from what the product does | 2026-11-13 |
| [0018](0018-card-stage.md) | A product's card may carry its stage | 2026-11-15 |
| [0019](0019-house-theme-shell.md) | One house look, with a theme and a shell per product | 2026-11-22 |
| [0020](0020-kits-opt-in.md) | Kits are opt-in until 1.0, and a fill's label is whatever reads on it | 2026-11-22 |
| [0021](0021-ab-logo.md) | The logo is `ab` with a cursor after it | 2026-11-23 |
| [0022](0022-cursor-blink.md) | The logo's cursor blinks three times on load | 2026-11-23 |
| [0023](0023-audit.md) | Apps are audited against the system, with one escape hatch | 2026-11-24 |
