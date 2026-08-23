# DESIGN.md — the design system

The visual contract for every brignano surface: `brignano.io`, `life`, `homelab`,
`driftwood`, and whatever comes next. Values live in [`tokens.css`](./tokens.css)
and [`tokens.chart.css`](./tokens.chart.css); the reasoning is in
[`DECISIONS.md`](./DECISIONS.md).

**Read this before styling anything.** An agent asked to build a page in any of
these repos should use these tokens, not invent a palette.

---

## 1. The identity in one line

Competence and calm. Warm, not cold; confident, not loud. Near-monochrome, with
colour used so sparingly that when it appears you look at it.

Nothing here should read as a developer-portfolio template, and nothing should
read as a toy.

## 2. Two tiers, one foundation

The professional site should be more polished than a private trip planner. That
is a difference of **density and scale**, not of design system. Colour, type
family, motion and shape are identical; what changes is how much room things get.

| | **Marketing** — `brignano.io` | **Tool** — `life`, `homelab`, `driftwood` |
|---|---|---|
| Opt in | `class="tier-marketing"` on `<html>` | default, no class |
| Body size | 17px | 15px |
| Section rhythm | `--s9` (96px) | `--s6` (32px) |
| Measure | 68ch | 780px |
| Display face | Silkscreen — monogram, hero eyebrows | none (aliases to `--sans`) |
| Motion | the trail, scroll reveal | none |
| Density | whitespace carries the layout | scanning beats reading |

## 3. Colour — one hue, one meaning

> **Colour carries meaning. Never decoration.**
> If a colour doesn't tell you something you'd otherwise have to read, it
> doesn't ship.

Every hue answers exactly one question, on every surface, in both tiers:

| Token | Answers | Hue |
|---|---|---|
| neutral ramp | the page itself | cool grey |
| `--i-*` | *you can act on this* | cobalt |
| `--success` | *settled, confirmed, done* | forest |
| `--attention` | *this wants you* | larch amber |
| `--danger` | *this has gone wrong* | rust |
| `--mark` | identity | larch amber, graphic only |

On a typical tool-tier screen you should see **one or two** coloured things. If
you see five, the rule has slipped.

### Attention is one meaning

A warning toast, the `NEXT UP` strip, and a deposit closing in six days are the
same message at different volumes. They get the same colour. There is no separate
"warning" hue and no separate "now/next" hue — collapsing them is what makes the
system coherent across a marketing site and an operational tool.

### Identity is not a fill

`--mark` inks a **graphic**: the trail line, the `A|B` monogram, a hero rule.
That is its entire permitted use. It is never a button, chip, badge, wash, border,
or link.

This is the resolution of a real problem. Amber used to be both the brand colour
and the warning colour, kept apart by a rule about scale — and rules enforced by
remembering get forgotten. Identity moved to the things that were always carrying
it (the trail, the monogram, the type, restraint), so amber in UI chrome now only
ever means *attention*. If you're reaching for `--mark` to tint an interface
element, the answer is a neutral or a state colour.

### Colour is a surface, not text

A wash (12% light / 20% dark via `color-mix`) behind an element with the text kept
near-ink reads as *a state*. Coloured letters just read as coloured letters and
fight legibility at small sizes. Use the `-surface` and `-line` tokens for the
wash and its edge, and `-ink` when a state genuinely must be a label.

`--attention` (`#b4741f`) is **3.85:1** on white. It is a mark and fill colour,
not a text colour. `--attention-ink` (`#8a5714`, 6.08:1) is the text step.

### Never colour alone

Every state ships with an **icon and a word**. Colour is the accelerant, not the
signal — this covers colour-vision deficiency, greyscale printing, and forced-colours
mode in one rule.

### What does NOT get colour

Event type. Six types in six colours is exactly the complication this avoids —
type is already carried by a text label. Nor `idea`, `planning`, `someday`, or
`parked`: nothing is being asked of you, so nothing should catch your eye.

## 4. Interaction

The part that makes an interface feel built rather than styled.

- `--i` fill, `--i-hover`, `--i-pressed`, `--i-ink` for links/icons/focus.
- **Disabled is neutral, never hued** (`--i-disabled-bg` / `--i-disabled-ink`). A
  greyed-out control must stop signalling "click me".
- Focus is always visible: 2px `--i-ink` outline, 2px offset. Never remove it.
- Hover and pressed surfaces on neutral elements come from `--surface-hover` and
  `--surface-active`, not from opacity tricks.

## 5. Type

Three roles, no more:

- **`--sans` (Geist)** — body and headings, both tiers. Tabular figures (`tnum`) on
  body copy so dates, prices and countdowns align in a column.
- **`--mono` (IBM Plex Mono)** — data that must read *precise*: confirmation codes,
  timestamps, stat numbers, eyebrow labels.
- **`--display` (Silkscreen)** — marketing tier only. The `A|B` monogram and hero
  eyebrows. Used **once, well** — it is memorable precisely because it is
  concentrated. On the tool tier it aliases to `--sans`.

No serif. Abstract over literal — no mascots, clip-art, or stock scenery.

## 6. Space, shape, elevation

4px base (`--s1` … `--s9`). Radius: `--radius-sm` for chips and pills, `--radius`
for cards, `--radius-lg` for hero surfaces.

**Elevation differs by theme.** Light mode separates surfaces with a hairline plus
a shadow (`--shadow-1/2/3`). Dark mode does not use borders — surfaces get
*lighter* with elevation. This is why `--line` can stay nearly invisible in dark.

## 7. Motion

**Content is visible by default. Motion is progressive enhancement layered on top
— never the thing that makes content appear.**

This is a hard contract. `brignano.io` shipped a homepage whose contact CTA
rendered at `opacity: 0` on **100% of loads**, because an animation library owned
the visible state and computed its scroll offsets before a client-side widget grew
the page. Any animation system that can leave content hidden when JS fails, races,
or is disabled is disqualified.

`prefers-reduced-motion` renders the final state immediately, with no transforms —
and that block ships inside `tokens.css` so no surface can forget it. One easing
curve (`--ease`), three durations, compositor-only properties.

## 8. Charts

The one place the restraint rule does **not** apply: a categorical chart needs
enough distinct hues to tell series apart, and eight ambers help nobody. Full
rationale in [`tokens.chart.css`](./tokens.chart.css). The short version:

- Series colours are `--chart-1…8`, **assigned in fixed order, never cycled**.
- Colour follows the entity, never its rank — a filter must not repaint survivors.
- A 9th series folds into `--chart-other`, facets, or gets cut.
- State colours are reserved and never become "series 4".
- ≥2 series always carries a legend; ≤4 are also direct-labelled.
- Text wears text tokens, never the series colour.
- **Never a dual-axis chart.** Two measures of different scale → two charts.

## 9. Accessibility floor

Non-negotiable in both themes:

- Body text ≥ 4.5:1; large text and UI marks ≥ 3:1.
- Touch targets ≥ 44px on coarse pointers, with a `.touch-hit` opt-out for controls
  whose shape is meaningful (a 22px circular checkbox forced to 44px becomes an
  oval — it expands its hit area instead).
- Every state carries an icon and a word.
- Measured ratios sit next to their values in `tokens.css`. Changing a value means
  re-measuring it.

## 10. Integrating with a Tailwind consumer

Tailwind's dark variant keys off a `.dark` class; these tokens key off
`[data-theme]`. **Both must be set together**, by the same code, in both places
that change the theme (the pre-paint script and the toggle):

```js
root.classList.toggle("dark", d);
root.setAttribute("data-theme", d ? "dark" : "light");
```

Setting only the class is a silent, half-broken state: Tailwind utilities flip
but the tokens do not, and the page renders one theme's tokens under the other
theme's utilities. Setting only the attribute leaves every `dark:` utility dead.

The reason the attribute is required rather than relying on
`prefers-color-scheme`: a site with a manual toggle has already *resolved* the
OS preference into an explicit choice. If the tokens also consulted the media
query, a user on a dark OS who chose light would get dark tokens under light
utilities. `[data-theme]` is what makes the choice authoritative.

Import order matters — Tailwind first, then tokens, then the bridge:

```css
@import "tailwindcss";
@import "@brignano/design/tokens.css";
@import "@brignano/design/tailwind.css";
```

## 11. The one rule that keeps this true

**Never hardcode a hex outside `tokens.css`.**

Hardcoded values silently survive a theme change. `life`'s status pills carried
literal greys for months and would have stayed light grey in dark mode.
`brignano.io` carried four literal violet hexes plus ~15 `violet-*` utilities,
which is why changing the accent was a migration rather than a one-line edit.
