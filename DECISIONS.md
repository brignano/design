# Design decisions

Why the values in `tokens.css` are what they are. Each entry supersedes whatever
came before it; nothing here is re-litigated without a new entry.

---

## ADR-0001 — The interactive hue is cobalt

**Status:** accepted · 2026-08-23
**Supersedes:** `brignano.io/docs/tsd-site-modernization.md` §10.3

### Context

`brignano.io` shipped electric indigo/violet (`#6d28d9` / `#a78bfa`). `life`
shipped a warm functional ramp. Neither was chosen as an interactive colour —
§10.3 records violet as resolving a *negative* constraint:

> **Accent color:** ✅ **Shift the hue** away from emerald. Candidate: an
> **electric indigo/violet** … **amber as fallback**.

That decision answered "not green." A long argument followed about whether amber
or violet should replace it, which was the wrong argument — see ADR-0004. Once
identity, affordance and state were separated, the only question left was what
colour a *control* should be.

### Decision

Cobalt (`#2563eb` / `#60a5fa`), with a full hover / pressed / focus / disabled ramp.

### Rationale

Cobalt, indigo and violet were all measured against both grounds. **All three
cleared every gate**, so contrast did not decide it:

| Candidate | Text (light) | Fill (light) | Text (dark) | Pressed (dark) |
|---|---|---|---|---|
| cobalt | 6.70 | 5.17 | 7.64 | 10.77 |
| indigo | 7.90 | 6.29 | 6.51 | 9.74 |
| violet | 7.10 | 5.70 | 7.13 | 10.52 |

It was decided on the two things contrast can't measure:

1. **Semantically inert.** Amber means caution, green means success, red means
   error — all of them arrive with meaning already attached. Blue arrives with
   none, which is exactly why product UIs converged on it. That is a functional
   property, not a fashion.
2. **Complementary to the mark hue.** Cobalt sits opposite larch on the wheel, so
   identity and affordance never compete for the same attention.

Cobalt over indigo/violet specifically: it has the most dark-mode headroom of the
three, and blue is the most conventional link colour in existence — the lowest
cognitive cost and the highest affordance. **Distinctiveness belongs in the brand
layer; conventionality belongs in the control layer.** That is how you get both.

### Consequences

- `brignano.io` migration surface: 4 literal hexes in `app/globals.css` plus ~15
  `violet-*` utilities. Map **by job**, not find-and-replace: `.text-primary-color`
  → `--i-ink`, filled buttons → `--i`, focus rings → `--i-ink`.
- The trail's summit zone (`tsd-signature-experience.md` §5.2, "summit
  indigo/violet") is re-inked with `--mark`.
- `life` is unaffected — it has no interactive colour today.

---

## ADR-0002 — Charts keep a full categorical palette, re-derived and validated

**Status:** accepted · 2026-08-23

### Context

An earlier draft suggested the `/coding` chart palette was "undercutting the
identity" and should derive from the brand accent. **That was wrong**, and it is
worth recording why.

Series colour answers *"which of these eight things am I looking at?"*, which needs
eight hues a human can separate at a glance. Deriving eight series colours from one
hue produces eight of that hue nobody can tell apart. **Charts genuinely need the
range.** The constraint is *separability*, not restraint.

### The actual problem

`components/stats/chart-colors.ts` is not too colourful — it is insufficiently
separable. Validated (light, 10 slots):

```
[FAIL] Lightness band      outside band: #ef9aa3, #34d399
[WARN] CVD separation      worst adjacent #a78bfa <-> #06b6d4  dE 6.6 (deutan)
[FAIL] Normal-vision floor worst adjacent #ef9aa3 <-> #f97316  dE 13.7
[WARN] Contrast vs surface 8 of 10 below 3:1
```

ΔE 13.7 means those two are hard to separate **with full colour vision**, before
colourblindness is considered.

### Decision

Keep a full 8-hue categorical palette, capped at 8 + "Other". Replace the values
with a set that passes every hard gate in both modes (adjacent CVD ΔE 9.1 light /
8.4 dark; normal-vision ΔE 19.6 / 19.3). Values in `tokens.chart.css`.

### Consequences

- **Slot order is load-bearing** — the gates measure *adjacent* pairs, so
  re-ordering silently breaks colourblind safety. Fixed order, never cycled.
- Three light-mode slots sit below 3:1; that is legal only with relief (visible
  labels or a table view). The donut's centre readout and legend already satisfy it.
- `stats-pie.tsx` already takes the top 8 and aggregates the rest — now the
  documented rule rather than an implementation detail.
- Colour must follow the **entity**, not its rank. The current code indexes by
  sorted position, so a data shift repaints every series. Map name → slot once.
- `chart-colors.ts` should read the CSS custom properties rather than literal hex,
  or the two will drift the way everything else did.

---

## ADR-0003 — The system lives in one public repo, consumed as a package

**Status:** accepted · 2026-08-23

### Decision

A standalone repo — `brignano/design` — installed as `@brignano/design`.

### Rationale

**It cannot live in `life`.** `life` is private and holds confirmation codes and
booking details. `brignano.io` is public. A public site cannot install tokens from
a private repo without handing out credentials to the repo storing your boarding
passes. Hard blocker, not preference.

**It should not live in `brignano.io`.** That makes the site the owner and every
tool a downstream guest, pinning tools to the site's release cycle.

**Copy-paste is what already failed** — two repos, two stylesheets, two accents,
two chart palettes, and a documented decision only one of them followed.

### Distribution

Three channels, because there are three kinds of consumer:

| Consumer | Channel |
|---|---|
| npm projects with a build (`brignano.io`, `life`) | git dependency pinned to a tag |
| no-build surfaces (`homelab`, a static page) | jsDelivr against the public repo |
| **projects that don't exist yet** | a Claude skill generated from this repo |

The third is the one that matters for "as I create new things" — a skill follows
the account, so a new project gets the system without anyone wiring it up.

npm publishing is deferred until `brignano.io` actually consumes it, so the first
published version isn't one that's immediately superseded. The scope `@brignano` is
already owned (it is the npm username), so no org setup is needed.

### Consequences

- The repo must be **public**: private npm needs a paid plan, jsDelivr only serves
  public repos, and a public `brignano.io` that can't `npm install` is broken.
- Nothing here is secret — hex values and spacing rules aren't a moat — and the
  documented reasoning is itself a portfolio asset.
- Consumers pin the **same tag** and bump together. If one tracks `main` and another
  a tag, the drift this repo exists to prevent comes straight back.
- A token rename is a breaking change.

---

## ADR-0004 — One hue, one meaning

**Status:** accepted · 2026-08-23
**Supersedes:** the "single accent" model in the first draft of this system

### Context

The first draft had one accent carrying identity, affordance *and* warning. That is
what produced a long amber-versus-violet argument, and the argument was unwinnable
because the question was wrong: no hue can be all three without one meaning bleeding
into the others.

Worse, the founding rule of this system — *colour carries meaning, never
decoration* — was being violated by the system itself. A hue with two meanings is
exactly the thing the rule forbids, just relocated.

### Decision

Every hue answers exactly one question, on every surface, in both tiers. Two
specific consequences:

**1. Attention is one meaning.** A warning toast, the `NEXT UP` strip, and a
deposit closing in six days are the same message at different volumes, so they are
the same colour. There is no separate "warning" hue and no separate "now/next" hue.
This is what lets a marketing site and an operational tool share one palette
honestly rather than by coincidence.

**2. Identity is not a fill.** `--mark` inks a graphic — the trail, the monogram, a
hero rule — and nothing else.

The intermediate proposal was to keep a `--brand-*` family and manage the overlap
with amber's warning meaning by convention: brand only at large decorative scale,
warning always with an icon. That works, and warm-brand companies do it. It was
rejected because it is enforced by remembering, every time, forever — and rules
enforced by remembering get forgotten by a version of you in a hurry. Naming is
cheaper and more reliable enforcement: `--brand` invites someone to tint a button
with it; `--mark` does not.

### Consequences

- `brignano.io` gives up a brand fill for tinting eyebrows and section rules. Those
  go to ink and neutrals — arguably better, since tinted eyebrow rules are the
  portfolio-template tell the modernization TSD set out to escape.
- Identity now rests on the trail, the monogram, the type, and restraint. If that
  feels thin in place, the fix is a stronger *mark*, not a tinted interface.
- Feedback state (success/attention/danger) and domain status (booked/active/
  overdue) share hue families deliberately. Context plus the mandatory icon-and-word
  separates them; a form error is not "rust means overdue", but they are the same
  register of message.
- Nothing amber is clickable anywhere in the system.
