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
| Motion | the trail, scroll reveal, overlays opening and closing (ADR-0013) | none, except overlays opening and closing (ADR-0013) |
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

### Code is the one non-interactive cobalt

Syntax keywords (`--code-keyword`) and a highlighted line (`--code-highlight`)
borrow the cobalt ink and wash, though nothing there can be acted on. It's
deliberate and contained: inside a code block, a reader scanning for structure
needs one accent, and cobalt is the only hue that can't be misread as a state.
Everything else in code is neutral (§9). Nowhere outside a code block does
cobalt mean anything but *you can act on this*.

### What does NOT get colour

Event type. Six types in six colours is exactly the complication this avoids —
type is already carried by a text label. Nor `idea`, `planning`, `someday`, or
`parked`: nothing is being asked of you, so nothing should catch your eye.

## 4. Interaction

The part that makes an interface feel built rather than styled.

- `--i` fill, `--i-hover`, `--i-pressed`, `--i-ink` for links/icons/focus.
- **Disabled is neutral, never hued** (`--i-disabled-bg` / `--i-disabled-ink`). A
  greyed-out control must stop signalling "click me". Its low contrast is allowed
  only because WCAG 1.4.3 exempts *inactive* controls, so the state must be real:
  `disabled` on a button or input, `aria-disabled="true"` otherwise. Disabled
  styling on an element that isn't marked disabled is just low-contrast text.
- Focus is always visible: 2px `--i-ink` outline, 2px offset. Never remove it.
- Hover and pressed surfaces on neutral elements come from `--surface-hover` and
  `--surface-active`, not from opacity tricks.
- A control's own edge — an input, a secondary button — is `--line-control`
  (≥ 3:1). `--line-strong` is a divider, too faint to tell you a control is there.
- Checkboxes and radios in a `.choice` row are drawn from tokens
  (`components.css`), so they look the same on every OS. Bare ones, ranges and
  progress bars stay native and inherit `accent-color: var(--i)` from
  `tokens.css`; don't restyle those just to recolour them. `.progress` and
  `.meter` on a native `<progress>` or `<meter>` draw it from tokens, for
  when a bar must look the same everywhere.

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

Sizes change with the tier (`--text-xs` … `--text-4xl`); weight, leading and
tracking don't:

| Token | Value | For |
|---|---|---|
| `--weight-regular` / `-medium` / `-semibold` | 400 / 500 / 600 | text / controls and labels / headings. Nothing lighter or bolder. |
| `--leading-tight` | 1.15 | display headings |
| `--leading-snug` | 1.3 | titles |
| `--leading-normal` | 1.4 | interface text |
| `--leading-relaxed` | 1.6 | paragraphs |
| `--tracking-tight` / `-tighter` | -0.01em / -0.025em | headings / large display headings |
| `--tracking-caps` | 0.08em | uppercase mono eyebrows |

A heading or title balances its lines (`text-wrap: balance`) and running text
avoids a one-word last line (`pretty`). On a touch screen the tool tier's
`--text-xs` rises from 11px to 12px.

## 6. Space, shape, elevation

4px base (`--s1` … `--s9`). Radius: `--radius-sm` for chips and pills, `--radius`
for cards, `--radius-lg` for hero surfaces.

**Elevation differs by theme.** Light mode separates surfaces with a hairline plus
a shadow (`--shadow-1/2/3`). Dark mode does not use borders — surfaces get
*lighter* with elevation. This is why `--line` can stay nearly invisible in dark.

**Stacking** is named, not numbered: `--z-raised` (a control above its card's
stretched link), `--z-sticky` (a header), `--z-float` (a floating label),
`--z-skip` (the skip link), `--z-toast`. Dialogs, popovers and sheets sit in the
browser's top layer and need none.

**Breakpoints are a short list, not tokens**, because a CSS variable can't be
used in a media query. Components and templates size to their own container
(`@container`) wherever they can, so the same markup works in a narrow column
and a wide page. The steps in use: 30rem (480px) and 35rem (560px) for a
phone, 48rem (768px) where a second column appears, 60rem (960px) for a
desktop layout, 75rem (1200px) where a third column appears. Reach for one of
these before adding another.

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

**The tool tier has two exceptions. The first is motion a person asks for.** A control that
walks through a sequence step by step, such as driftwood's *Trace a request*,
may animate, because the reader started it to follow an order of events, and
the order is the content. It runs only when clicked, never on load; it can be
stopped at any step; every state it passes through is also listed as text; and
under `prefers-reduced-motion` it shows the final state (the whole sequence lit)
at once. Nothing decorative qualifies: no entrance, hover or scroll animation,
except the overlay case below.

**The second: overlays may move as they open and close, in both tiers**
(ADR-0013). A dialog, sheet, popover, menu or toast that someone opened, or that answers what they
just did, fades and slides a few pixels (a sheet from its own edge) over
`--dur-fast`. Only opacity and transform move; the open state is always fully
shown, so a browser without `@starting-style` shows it at once; and under
`prefers-reduced-motion` it is instant, backdrop included. An overlay that is
already open when the page loads doesn't animate. That is the whole
exception: content on the page itself still never animates in.

**Print is the light theme.** `tokens.css` forces `color-scheme: light` on
paper whatever the screen was showing, and `components.css` drops sticky
chrome, shadows and controls that do nothing on paper, keeps cards and table
rows whole across a page break, and writes an outside link's address after it
in `.prose`.

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
- **Code is neutral too.** `--code-keyword` is the cobalt ink; strings are
  `--code-string` (`--ink-soft`), comments `--code-comment` (`--slate`, italic),
  everything else `--code-ink`. A highlighted line is `--code-highlight`. No
  syntax rainbow: a reader scanning code needs the keywords, not a palette.
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

A product's marketing page has about five seconds on a phone to land, with
someone who has never heard of it: a buyer, a stranger at a meetup, your mum.
**Show, then tell**: the first phone screen says who it's for, shows the
product doing the thing, and offers one thing to do, without a paragraph.
The longer argument belongs in the docs.

Pages built from layout rules alone kept failing the same way (ADR-0011): the
words came from the repo, so they described how the product works instead of
why anyone should want it, and each review added another required line. So
the order of work is fixed: **brief, page, checks, stranger test.**

### 1. Write the brief first

Five lines, in the words a stranger would use, kept as `BRIEF.md` in the
product's repo and approved before any page work. Every word on the page comes
from it; a change of message is a change to the brief, then the page.

| Line | Answers | Becomes |
|---|---|---|
| **Who** | who it's for, as they'd say it | `.pp-audience` |
| **Pain** | what goes wrong for them today | the first half of `.pp-subhead` |
| **Promise** | what they get, 8 words or fewer | `.pp-thesis` |
| **Moment** | the 10 seconds that prove it | the proof (`.pp-media`) |
| **Ask** | the one action, and what happens next | `.pp-button`, `.pp-note` |

No jargon in Who, Pain or Promise. Tool names (Terraform, CI, AWS) go in the
how-it-works steps. If a person outside the field can't repeat the Promise
back, rewrite the brief, not the page.

### 2. Build the page from it

`product-page.css` is the structure; `previews/product-page.html` is the
skeleton (the brief template is at its top) and
`previews/product-page-example.html` is a worked example. Import it after the
tokens, put `tier-marketing` on `<html>` and `pp` on `<body>`.

```css
@import '@brignano/design/tokens.css';
@import '@brignano/design/product-page.css';
```

The bands, in order:

1. **Header** (`.pp-header`): brand, two or three in-page links, the primary
   action. The status is not repeated here.
2. **Hero** (`.pp-hero`), three parts: `.pp-hero-head` (the status, the
   audience line, the thesis), the **proof** (`.pp-media`), then
   `.pp-hero-body` (the subhead, the primary action and one secondary, and a
   note). On a phone they stack in that order, so the proof is on the first
   screen.
   - The **subhead** is one sentence, the Pain then the fix: "When your app
     goes down, Driftwood shows the broken piece, why, and what the last
     deploy changed."
   - The **proof** is the Moment: the product doing the thing, ideally
     mid-story. In order of preference: a short captioned clip (*Video in the
     proof slot*, below), a live demo, a real screenshot, a faithful mock from
     the product's own components. Never stock imagery. Words inside the proof
     are the product's own, in plain language ("Your shop is down"), not log
     lines.
   - **Demo first.** If anything can be tried without signing up, the
     secondary action is "Try the live demo" and opens it directly.
   - The **note** says what happens after the click, in about ten words
     ("Demo needs no signup. We reply within two days.").
3. **The signature band**: one band only this product could have. Three
   "you get" cards (`ul.pp-gets`, each a picture, a heading, one line); the
   product beside the obvious alternative (`.pp-compare`, below); or a band of
   its own, such as a library of ready-made guides or the live demo itself.
   Pick the one that answers the stranger's next question for *this* product.
4. **How it works** (`ol.pp-how`): three numbered steps, a heading and one
   line each.
5. **Close** (`.pp-close`): the primary action again, with the room a form
   needs (`.pp-panel`), and prices if any.
6. **Footer** (`.pp-footer`): the brand and its promise, a few links, then the
   legal line (`.pp-legal`): `© {year} Anthony Brignano. All rights
   reserved.` and the product's Privacy and Terms links if it has them.

**Budgets** (`fold.mjs` enforces them): the thesis 8 words or fewer; the
subhead one sentence of 25 or fewer; **40 words of copy on the first phone
screen; 180 on the whole page**; 7 phone screens. Copy is what the reader has
to read: words inside pictures, the form, the header and footer don't count.
When a page is over, cut sentences, don't shrink type.

### 3. Make it look like this product

Shared structure is what makes a page fast to build; shared looks is what made
Driftwood, Guidebook and Sites read as one page with the words swapped. Each
product makes three choices, and **no two products make all three the same**:

- **A mark** (`data-mark` on `.pp`: `teal`, `violet` or `magenta`; tokens
  `--mark-teal` and so on). It inks the product's glyph (an inline SVG in
  `currentColor`), the hero rule above the thesis, the **stage** (a faint field
  behind the hero proof), the clip's current step and the how-it-works
  numerals. Like `--mark` (§3), it is never a button, link, text or state: the
  actions stay cobalt on every product, so "you can click this" means the same
  thing everywhere.
- **A hero layout** (`data-layout` on `.pp-hero`): `split` (the default, proof
  on the right), `mirror` (proof on the left, for a picture that should be
  read first) or `stage` (centred words and actions, the proof full width
  under them, for a wide picture such as a map). Phones stack all three the same.
- **A frame for the proof** that matches where the product lives: bare, a
  phone (`.pp-device`) for something used on a phone, or a browser window
  (`.pp-browser`, with `.pp-browser-bar` and `.pp-browser-url`) for an
  extension or web app.

Then the voice: the thesis, the signature band and the close are written for
this product's reader, not copied from the last page.

### Compare

`.pp-compare` holds two `<div>`s, each an `<h3>` and a `<ul>` of the same
three rows: the obvious alternative first, then ours with `.is-ours`, which
takes the mark on its top rule and stacks first on a phone. The rows are
words ("Pay monthly, forever" beside "Pay once"), never ticks and crosses
alone.

### Rules

- **One primary action per page.** `.pp-button` is that action, everywhere it
  appears. Anything else is `.pp-button.is-secondary` or a link.
- **The status is a word with a dot** (`.pp-status`), shown once in the hero
  and again in the close: "Pilot open", "Private beta". `data-state="open"`
  takes `--success`, `"soon"` takes `--attention`; the word carries the meaning
  on its own (§3).
- **Every claim is backed or cut.** A time, a number or a superlative needs a
  source the page can point to. Without one, drop it.
- **Prices sit beside the ask.** `dl.pp-price` holds two to four options, one
  `<div>` each: the price as `<dt>`, one line of condition as `<dd>`, in the
  close band under its subhead. A single price goes in the subhead. No option
  gets its own button; no strike-through prices, badges or highlighted tiers.
- **Headlines are sentences.** Calm and declarative, no exclamation marks.
- **Scroll stays the reader's.** No scroll-jacking, pinned sections or
  scroll-driven reveals. Motion lives in the hero clip (§7, ADR-0009).
- **Pictures over paragraphs.** Every band after the hero leads with a picture,
  a list or a comparison, never prose. At most one story chapter
  (`ol.pp-story`), and only when one point truly needs a paragraph.
- **Restraint carries the style; the product and its mark carry the colour.**
  Hairlines between bands, whitespace, the type scale. No gradients, no tinted
  bands. Colour lives in the proof (a red box with its word, a diff) and in
  the product's mark.
- **Forms** (`.pp-form` of `.pp-field`, label above the control) mark the
  optional fields, not the required ones. A field that fails takes
  `aria-invalid="true"` and a `.pp-error` sentence; a failed send puts its
  error in the note (`.pp-note.is-error`); on success the form gives way to
  `.pp-done`, focused, with `role="status"`.
- **The year** in the legal line is filled in at build time (a template value,
  a bundler `define`, or the Worker as it serves the page). Never typed, and
  never written by client script.

### Video in the proof slot

When the proof is something a person does, such as editing their site on a
phone and seeing it update, a short clip shows it better than a still.
`.pp-media` takes a `<video>` (or `<img>`) directly, framed like a hero surface,
or inside `.pp-device`, a phone frame. `previews/product-media.html` shows both.

- **The clip.** `<video muted loop playsinline preload="metadata">` with
  `width`/`height` set, a `poster`, and no `autoplay` attribute. Keep it under
  about 15 seconds and silent: it loops, and nobody turns sound on in a hero.
- **Captions in the clip.** A stranger can't tell what a clip shows without
  them. Burn a plain sentence into each beat ("You deploy an update to your
  shop", "The shop goes down"), about three seconds each, three or four beats.
  The first frame already shows the product and its first caption, never an
  empty screen.
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

### 4. Check it, then hand it to a stranger

`scripts/fold.mjs` checks the first phone screen and the budgets
(Playwright, 390 × 844):

```sh
npm i --no-save playwright && npx playwright install chromium
node node_modules/@brignano/design/scripts/fold.mjs https://product.example/ --shots shots
```

Then the **stranger test**, which no script can do. Give the first-screen shot
from `--shots` to someone outside the field for five seconds, or to a fresh
agent with no other context, and ask:

> You're seeing this website for the first time, on a phone. In one sentence
> each: what is it, who is it for, and what would you get? Would you tap the
> button, and what do you expect to happen if you do?

Compare the answers to the brief. If What, Who or Get doesn't match it, the
page fails: fix the words or the proof, and test again. An agent building a
page runs this before asking for review, and puts the answers in the PR.

- [ ] `BRIEF.md` exists and was approved before the page.
- [ ] `fold.mjs` passes: thesis, audience, proof and action on the first
      screen; within the word budgets; 7 screens or fewer; no sideways scroll.
- [ ] The stranger test's answers match the brief (in the PR).
- [ ] The subhead is the Pain, then the fix.
- [ ] If anything can be tried without signing up, "Try the live demo" is the
      secondary action.
- [ ] A mark, a hero layout and a proof frame chosen, not all three shared
      with another product.
- [ ] One signature band, then three how-it-works steps.
- [ ] One primary action, the same everywhere; the status once in the hero.
- [ ] Every time, number or superlative is backed, or cut.
- [ ] A clip has a finished-state poster, a Pause / Play button, and no
      `autoplay` attribute.
- [ ] Copyright footer with the year filled in at build time.
- [ ] No hex outside `tokens.css` (`npm run check`).

## 14. Components

Shared controls and patterns ship as plain CSS in
[`components.css`](./components.css), and whole-page layouts as
`templates/<name>.css`. Why plain CSS and not React: ADR-0012. What gets built
and in what order: [`proposals/component-layer.md`](./proposals/component-layer.md).

```css
@import '@brignano/design/tokens.css';
@import '@brignano/design/components.css';
```

- **One layer.** Everything is inside `@layer brignano.components`. A consumer's
  unlayered CSS and Tailwind utilities beat it without `!important`, so a site
  can adjust a component without fighting it.
- **Names.** `.name` for the component, `.name-variant` for a variant
  (`.btn`, `.btn-primary`). State is never a class: it comes from the attribute
  that makes it true (`disabled`, `aria-invalid="true"`, `aria-current`,
  `aria-expanded`, `[open]`), so the look can't disagree with what assistive
  tech is told.
- **Native first.** `<dialog>`, the `popover` attribute, `<details>` and CSS
  anchor positioning before any script. Where a component needs JS (a toast
  queue, tab arrow keys), its preview page documents the ARIA contract and the
  consumer writes the script. Design ships no JS.
- **Tokens only.** No hex. Every rule here that sets a background is
  contrast-checked in both themes (`npm run check`): its text colour at 4.5:1,
  its border or outline at 3:1. A control's edge is `--line-control`; the
  divider tokens (`--line`, `--line-soft`, `--line-strong`) are exempt from the
  edge check because they are never a control's edge.
- **Every class is shown.** A class in `components.css` or a template that no
  preview page uses fails the check: if it isn't shown, it isn't reviewed.
- **Every preview is its docs page.** A component or template page carries
  `data-status` on `<html>` (`stable`, `beta` or `planned`; the header shows it
  and the index card repeats it) and, under its live examples, a `.docs` block
  with four sections tagged `data-doc`: **Use it** (`usage`, a copy-paste
  snippet), **Use when** (`use-when`), **Don't use when** (`dont-use`, naming
  the better choice) and **Accessibility** (`a11y`: keyboard, screen reader,
  required attributes). Other sections (variants, states, behaviour your script
  owns) sit between them. `npm run check` fails on a missing section or a status
  the index disagrees with. Planned components are listed on the index with a
  link to their issue.
- **One icon set.** `icons/` holds the only icons a surface uses: outline
  icons from Lucide (ISC, `icons/LICENSE`) on a 24px grid at a 2px stroke, in
  `currentColor`, so pasted inline they take their text's colour (through
  `<img>` they draw black). Size them with `.icon-sm`,
  `.icon` or `.icon-lg` (1.25× the text beside them). Decorative icons are
  `aria-hidden`; an icon-only button carries an `aria-label`. Need one that
  isn't there? Add it from Lucide in a PR; don't draw one or pull in another
  set. Brand logos are the exception and stay with their brands.
- **Switch or checkbox.** A switch (`.switch`, `role="switch"`) is only for a
  setting that takes effect the moment it flips. Anything sent with a form's
  submit button is a checkbox, because a switch promises an effect the form
  hasn't made yet.


## 15. Content

Words are part of the interface. A product that labels one button "Save" and
the next "Submit changes" reads as inconsistent as one with two greys. These
rules cover the words inside a product: controls, messages, data. Marketing copy
follows the brief in §13. English only for now.

Each rule has one do and one don't. The live page is
[`previews/writing.html`](./previews/writing.html); `npm run check` fails when
a rule here has no section there.

### Voice

Competent, calm, plain words. Say what happened and what to do next, the way a
colleague who knows the system would. No hype, no jokes, no apology theatre.

- Do: "Changes saved."
- Don't: "Awesome! Your changes have been successfully saved!"

### Sentence case

Everything is in sentence case: buttons, headings, labels, menu items, tabs,
page titles. Capitalise only the first word and proper nouns. An eyebrow can be
uppercase through CSS, but it is written in sentence case.

- Do: "Account settings", "Sign in with GitHub"
- Don't: "Account Settings", "SIGN IN"

### Buttons and links

A button is a verb and its object, so it still makes sense read on its own. A
link names where it goes. The button that confirms an action repeats that
action's verb.

- Do: "Delete trip", "Read the release notes"
- Don't: "OK", "Click here"

### Form labels

A label is a short noun phrase above its field, never a placeholder. Mark the
optional fields with "(optional)", not the required ones, and put formats in
the hint below.

- Do: "Phone (optional)", with the hint "We only call about bookings."
- Don't: "Phone*", or "Please enter your phone number" as the placeholder

### Errors

Say what happened and how to fix it, in that order, next to the thing that
went wrong. Name the field or the action, never the person. No codes unless
someone will search for them, and then in mono after the words.

- Do: "That date has passed. Pick today or later."
- Don't: "Invalid input.", "You entered a wrong date."

### Empty states

Say what will be here and give the one action that fills it. If the person
can't fill it (no results, nothing assigned yet), say why it's empty and what
would change that.

- Do: "No trips yet", then "Plan one and it shows up here." and a "Plan a trip" button
- Don't: "Nothing to see here!"

### Confirmations

Ask only before something that can't be undone. The title names the action and
the object, the body says what goes with it, and the buttons are the verb and
a way out ("Cancel", or "Keep trip" when that reads better). Where an action
can be undone, do it and offer Undo instead of asking.

- Do: "Delete Lisbon 2027?" / "Its 12 photos go with it. This can't be undone." / "Delete trip", "Keep trip"
- Don't: "Are you sure?" / "Yes", "No"

### Success messages

Past tense, the object first, and Undo when there is one. A success message
is quiet: a toast or an inline line, never a dialog.

- Do: "Trip deleted", with Undo
- Don't: "Success!"

### Dates

In the interface a date is day, short month, year: "7 Nov 2026", with the
weekday first when it helps planning ("Sat 7 Nov 2026"). Drop the year inside
the current year when nothing is ambiguous. Data a person might copy, sort or
search (logs, IDs, exports, timestamps in a table) uses ISO 8601 in `--mono`.

- Do: "7 Nov 2026" in a sentence, `2026-11-07` in a log row
- Don't: "11/07/2026", "November 7th, 2026"

### Times

Twelve-hour, with a space and capital AM or PM; drop ":00" on the hour in prose.
Add the zone when the reader might be elsewhere. 24-hour time is not used,
except inside ISO 8601 data in mono (`2026-11-07T21:30Z` in a log). For
something in the last day, a relative time ("5 min ago") is fine, with the full
date and time in a tooltip or `title`.

- Do: "9:30 AM", "3 PM ET", "2–3 AM UTC"
- Don't: "21:30", "9:30am"

### Numbers

Numerals for every number, a comma every three digits, and a space before a
unit except %. Compact durations in tables and mono data ("2h 11m", "150ms")
can drop the space. Words a person typed, like a quoted message, stay as
written. Figures that line up in a column use tabular figures, which the
type tokens already set.

- Do: "3 trips · 10,482 photos · 64 GB · 64%"
- Don't: "three trips · 10482 photos · 64GB · 64 %"

### Currency

The symbol before the number with no space. Whole amounts drop ".00" in prose;
a table of prices shows two decimals on every row so they line up. Name the
currency ("US$", "€") only when the reader could mistake it.

- Do: "$1,240", "$12.50"
- Don't: "$1240.00", "12.5 USD"

### What never appears

These don't appear in a product's interface: exclamation marks; "simply",
"just" or "easy" when they play a task down (they blame the person when it
isn't); "Oops" or "Uh-oh"; emoji as words; ALL CAPS typed into the text; and,
on marketing pages, jargon the reader has to look up.

- Do: "Couldn't load your trips. Try again."
- Don't: "Oops! Something went wrong!! Simply refresh."
