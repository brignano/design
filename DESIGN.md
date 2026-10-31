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
- A control's own edge — an input, a secondary button — is `--line-control`
  (≥ 3:1). `--line-strong` is a divider, too faint to tell you a control is there.
- Native checkboxes, radios and ranges inherit `accent-color: var(--i)` from
  `tokens.css`; don't restyle them just to recolour them.

## 5. Type

Three roles, no more:

- **`--sans` (Geist)** — body and headings, both tiers. Tabular figures
  (`font-variant-numeric: tabular-nums`) on body copy so dates, prices and
  countdowns align in a column.
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

**Sticky chrome** — a header or toolbar that content scrolls under — is
`--surface-sticky` with `backdrop-filter: blur(8px)`: 92% of the card in light,
of the page ground in dark, so it reads as the surface it sits on, not a new layer.

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

**The tool tier has one exception: motion a person asks for.** A control that
walks through a sequence step by step, such as driftwood's *Trace a request*,
may animate, because the reader started it to follow an order of events, and
the order is the content. It runs only when clicked, never on load; it can be
stopped at any step; every state it passes through is also listed as text; and
under `prefers-reduced-motion` it shows the final state (the whole sequence lit)
at once. Nothing decorative qualifies: no entrance, hover or scroll animation.

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

## 9. Diagrams and diffs

An architecture diagram (`driftwood`, `homelab`) is a picture of a system, read to
answer "what changed, and what is broken". It follows the restraint rule, **not**
the chart exception: node *type* is a category like event type, and is carried by
an icon and a label, never a hue. A diagram where every node is tinted by family
is thirty coloured things, and the one that is down disappears among them.

- **Nodes are neutral.** `--card` fill, `--line-strong` edge, `--radius` corners,
  an icon in `--ink-soft`, the name in `--ink`, the kind in `--mono` at
  `--text-xs` in `--ink-soft`. Grouping is a zone: `--line` hairline, no fill or
  a faint one, a `--mono` eyebrow label.
- **Edges are `--slate`.** They are UI marks (3:1), never text.
- **Only state gets colour**, and always as a tag with a symbol and a word as well:

  | Token | Means | Tag |
  |---|---|---|
  | `--diff-added` | this change created it | `+ added` |
  | `--diff-changed` | this change modified it | `~ changed` |
  | `--diff-removed` | this change removes it — dashed, struck through | `− removed` |
  | `--danger` | it is down | `✕ down` |
  | `--attention` | degraded, or differs from the design | `▲ degraded` |

  The diff tokens alias the state hues on purpose (added is *settled*, a change is
  *informational*, a removal is the change that can lose data), so a diff adds no
  hue to the system. Health wins the fill (`-surface`); a diff only takes the edge.
- **Selection** is the focus treatment: a 2px `--i-ink` outline, offset. Asking
  "what depends on this?" dims everything unrelated to ~30% opacity and inks the
  connecting edges in `--ink`; it never introduces a colour.
- **A path is numbered, not coloured.** A request path drawn over a diagram
  numbers its hops in order (`1`, `2a`/`2b` for a branch) in `--mono`, in a
  `--line-strong` ring, and lists them beside the picture. Tracing it lights each
  hop with the selection treatment above, never with a new hue.
- **Lead with the verdict.** A page about a deploy opens with one sentence saying
  what happened and what needs you, then the pills that back it up, then the
  picture.
- **Diagrams follow the theme.** On a page they use the tokens like everything
  else. A diagram exported as a standalone file (an SVG, a Mermaid block in a pull
  request) cannot use `var()`; it takes the **light** theme's values — the first
  argument of each `light-dark()` — resolved from this file at build time, never
  typed in.

## 10. Accessibility floor

Non-negotiable in both themes:

- Body text ≥ 4.5:1; large text and UI marks ≥ 3:1. `--slate` is the quietest
  text step and clears 4.5:1 in both themes; `--n-500` in light does not, so it
  is never text.
- Touch targets ≥ 44px on coarse pointers, with a `.touch-hit` opt-out for controls
  whose shape is meaningful (a 22px circular checkbox forced to 44px becomes an
  oval — it expands its hit area instead).
- Every state carries an icon and a word.
- Measured ratios sit next to their values in `tokens.css`, and `npm run check`
  (run in CI on every pull request) fails if any floor above is missed, if a colour
  is declared anywhere but once, or if a hex appears outside the token files.

## 11. Themes, and integrating with a Tailwind consumer

### How the theme is chosen

Every colour is one declaration holding both values, `light-dark(<light>, <dark>)`,
and the browser picks a side from the element's `color-scheme`:

- **No attribute** — `color-scheme: light dark`, so the page follows the OS.
- **`data-theme="light"` / `"dark"`** — the explicit choice, which wins over the OS.

The pick happens where a colour is *used*, so **`data-theme` works on any element,
not just `<html>`.** A dark hero band on a light marketing page is
`<section data-theme="dark">`. Give that element its own
`background: var(--bg); color: var(--ink)` — backgrounds don't inherit.

Two consequences for code that touches tokens directly:

- **Don't read a token's value with `getPropertyValue`.** It returns the
  declaration text, `light-dark(#076bd3, #6ba5f3)`, not a colour. To get the
  colour a chart library needs, resolve it on an element in the right subtree:
  set `el.style.color = 'var(--chart-1)'` and read `getComputedStyle(el).color`.
  Re-read it when the theme changes.
- **Don't wrap a token in `color-mix()` or `light-dark()`.** Nesting is valid CSS,
  but not every engine has been verified to resolve it. If you need a wash, it's
  a token (`--*-surface`, `--*-line`, `--surface-sticky`); if it isn't, add it here.

Needs Chrome/Edge 123, Firefox 120, Safari 17.5 or later (all shipped by May 2024).
An older browser drops every colour token and renders unstyled rather than wrong.

### Build tools that lower `light-dark()`

A CSS pipeline that targets browsers older than that floor rewrites
`light-dark()` into a fallback. Lightning CSS (inside Next.js, Vite, Parcel)
turns each token into `var(--lightningcss-light, …) var(--lightningcss-dark, …)`
and flips those two variables wherever `color-scheme` changes. The tokens
resolve on `:root`, so the side is fixed there. Page-wide theming still works,
but **`data-theme` on an inner element stops re-theming that section.**

The fix is to target the same floor the tokens need, which leaves `light-dark()`
alone. In the consumer's `package.json`:

```json
"browserslist": ["chrome >= 123", "edge >= 123", "firefox >= 120", "safari >= 17.5"]
```

Verified with Lightning CSS: older targets lower the tokens; these targets
pass `light-dark(#076bd3, #6ba5f3)` through untouched.

### Tailwind

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

The reason the attribute is required rather than leaving the OS to decide: a
site with a manual toggle has already *resolved* the OS preference into an
explicit choice. Without the attribute, the tokens would still follow the OS, and
a user on a dark OS who chose light would get dark tokens under light utilities.
`[data-theme]` is what makes the choice authoritative.

Import order matters — Tailwind first, then tokens, then the bridge:

```css
@import "tailwindcss";
@import "@brignano/design/tokens.css";
@import "@brignano/design/tailwind.css";
```

## 12. The one rule that keeps this true

**Never hardcode a hex outside `tokens.css`.**

Hardcoded values silently survive a theme change. `life`'s status pills carried
literal greys for months and would have stayed light grey in dark mode.
`brignano.io` carried four literal violet hexes plus ~15 `violet-*` utilities,
which is why changing the accent was a migration rather than a one-line edit.

## 13. Product pages

A product's marketing page is one argument and one ask. `product-page.css` is its
structure; `previews/product-page.html` is the skeleton to copy. Import it after
the tokens, put `tier-marketing` on `<html>` and `pp` on `<body>` (or a wrapper).

```css
@import '@brignano/design/tokens.css';
@import '@brignano/design/product-page.css';
```

The order is fixed, because each band answers the question the last one raised:

1. **Header** (`.pp-header`) — brand, two or three in-page links, the status, the
   primary action. Sticky, on `--surface-sticky`.
2. **Hero** (`.pp-hero`) — the status, a one-line **thesis** (`.pp-thesis`), a
   subhead of one or two sentences, the primary action and one secondary, and a
   **proof slot** (`.pp-media`). The proof is the product itself where it can be
   (a live demo), else a real screenshot or a short screen recording (see
   *Video in the proof slot* below). Never stock imagery.
3. **Story** (`ol.pp-story` of `.pp-chapter`) — three or four numbered chapters,
   usually *the problem*, *how it works*, *who it's for*, *why now*. Each is a mono
   label (`.pp-label`, numbered `01 /` by the list, so reordering renumbers), a
   headline that is a sentence, a short body, and optionally `.pp-points` (two to
   four ruled columns) or a `.pp-figure`.
4. **Close** (`.pp-close`) — the primary action again, with the room a form needs
   (`.pp-panel`). A short form is `.pp-form` of `.pp-field` (label above the
   control), then the button, then a `.pp-note` for the privacy line. Mark the
   optional fields (`.pp-optional`), not the required ones. A field that fails
   takes `aria-invalid="true"` and a `.pp-error` sentence under it; a failed send
   puts its error in the note (`.pp-note.is-error`). On success the form gives
   way to `.pp-done`, a heading and one line with `role="status"`, focused.
5. **Footer** (`.pp-footer`) — the brand and a line about it, a few links, then
   the **legal line** (`.pp-legal`): `© {year} Anthony Brignano. All rights
   reserved.` and, if the product has them, its Privacy and Terms links
   (`<nav aria-label="Legal">`). Leave out a link whose page doesn't exist.

The year is the current year **at build time**. This package is CSS and HTML,
so the consuming site's build fills it in (a template value from
`new Date().getFullYear()`, or a bundler `define`). Never type it by hand, where
it goes stale every January, and never write it from client script, where it
flashes or is missing without JavaScript.

Rules:

- **One primary action per page.** `.pp-button` is that action, everywhere it
  appears. Anything else is `.pp-button.is-secondary` or a link.
- **The status is a word with a dot** (`.pp-status`): "Pilot open", "In
  development". `data-state="open"` takes `--success` (you can join now),
  `"soon"` takes `--attention`; no attribute stays neutral. The word carries the
  meaning on its own (§3, never colour alone).
- **Headlines are sentences.** Calm and declarative, no exclamation marks, no
  claims the page can't back up.
- **Restraint carries the style.** Hairlines between chapters, whitespace, the
  type scale. No gradients, no tinted section backgrounds, no decorative colour.

### Video in the proof slot

When the proof is something a person does, such as editing their site on a
phone and seeing it update, a short clip shows it better than a still.
`.pp-media` takes a `<video>` (or `<img>`) directly, framed like a hero surface,
or inside `.pp-device`, a phone frame. `previews/product-media.html` shows both.

- **The clip.** `<video muted loop playsinline preload="metadata">` with
  `width`/`height` set, a `poster`, and no `autoplay` attribute. Keep it under
  about 15 seconds and silent: it loops, and nobody turns sound on in a hero.
- **The poster is the finished state.** It is what shows before the clip
  loads, without JavaScript, and under `prefers-reduced-motion`, so it has to
  make the argument on its own (§7: content is visible by default).
- **The phone frame** (`.pp-device`) is a 10px bezel in `--device`, which stays
  dark in both themes. A phone is a dark object, and a bezel in `--ink` would
  turn near-white in dark mode. Its one child is the screen, at 9 : 19.5.
  `--pp-device-width` (default 280px) sizes it.
- **Steps** (`ol.pp-steps` in a `figcaption.pp-caption`) name what the clip
  shows, in mono: *1 Change the hours, 2 Press Save, 3 The site updates*. Each
  `<li data-at="3">` gives the second it starts at, and the step the clip is on
  gets `aria-current="step"`, which inks it. The list is the sequence as text,
  so it reads the same with the clip stopped.
- **Pause / Play** (`button.pp-play`) is required. Motion that runs longer than
  five seconds needs a way to stop it (WCAG 2.2.2). It starts `hidden`, and the
  script shows it.

The package is CSS, so the page carries this script, once, after the figure:

```js
for (const fig of document.querySelectorAll('.pp-media')) {
  const video = fig.querySelector('video'), button = fig.querySelector('.pp-play');
  if (!video || !button) continue;
  const steps = [...fig.querySelectorAll('.pp-steps > li[data-at]')];
  const label = () => { button.textContent = video.paused ? 'Play' : 'Pause'; };
  video.addEventListener('timeupdate', () => {
    const now = steps.filter((s) => video.currentTime >= +s.dataset.at).pop();
    for (const s of steps) {
      if (s === now) s.setAttribute('aria-current', 'step');
      else s.removeAttribute('aria-current');
    }
  });
  video.addEventListener('play', label);
  video.addEventListener('pause', label);
  button.addEventListener('click', () => (video.paused ? video.play() : video.pause()));
  button.hidden = false;
  label();
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) video.play().catch(label);
}
```

Under reduced motion the clip waits on its poster with a **Play** button, so it
runs only when the reader asks for it, the same terms as ADR-0009.

Every class starts with `.pp-`, so the file sits beside a site's own stylesheet.
A page can change `--pp-width` (default 1160px) and `--pp-gutter` on `.pp`.

Before a product page ships, check it:

- [ ] Bands in order: header, hero, story, close, footer.
- [ ] One primary action, the same everywhere it appears.
- [ ] A status word with a dot, in the header and the hero.
- [ ] A one-line thesis; every headline is a sentence.
- [ ] The proof slot is the product (a live demo), a real screenshot, or a
      real screen recording.
- [ ] A clip has a finished-state poster, a Pause / Play button, and no
      `autoplay` attribute.
- [ ] Three or four story chapters, numbered by the list.
- [ ] Has a copyright footer: `© {year} Anthony Brignano. All rights reserved.`,
      the year filled in at build time, plus Privacy and Terms links for the
      pages the product has.
- [ ] No hex outside `tokens.css` (`npm run check`).
