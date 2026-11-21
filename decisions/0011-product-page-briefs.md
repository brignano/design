# ADR-0011 — Product pages start from a brief, and each looks like itself

**Status:** accepted · 2026-11-02
**Superseded in part by:** ADR-0017 (the three identity choices, and cobalt actions on a product page)

## Context

ADR-0010 fixed the layout, and every product page still needed several rounds
of "explain it to a stranger" review. Driftwood, Guidebook and Sites were
each rebuilt on §13, then reworked again in their own repos: pain-first
subheads, captions inside the clip, plain words in the mock, the person
behind it, a plain price. Three causes:

- Nothing fixed the **message** before the page. The words came from the
  repo, README and spec, so they described how the product works; each
  review was a positioning debate held through page edits.
- Each review **added a required element** (an audience line, a "what happens
  next" note, the status in two places), so the first screen grew to ~100
  words while passing every check. `fold.mjs` counted the thesis and subhead
  but not the page.
- The only clarity test, "hand it to someone outside the field", was a
  manual checkbox, so it didn't run.

Put side by side, the three pages were also the same page: one grey ground,
one cobalt audience line, one black thesis, one status pill twice, one proof
on the right, one band order. Only the picture changed, so nobody looking
across the projects could tell them apart.

## Decision

- **Brief first.** Five lines (Who, Pain, Promise, Moment, Ask) in
  `BRIEF.md`, approved before any page; the page is built from it.
- **Budgets, checked.** 40 words of copy on the first phone screen, 180 on the
  page, the status once. `fold.mjs` fails a page over them.
- **The stranger test is a step, not a checkbox.** The first-screen shot goes
  to a person or a context-free agent with a fixed prompt; the answers go in
  the PR and must match the brief.
- **Each product looks like itself.** A product mark (`--mark-teal`,
  `--mark-violet`, `--mark-magenta`) chosen with `data-mark`, a hero layout
  (`split`, `mirror`, `stage`) and a proof frame (bare, phone, browser). No two
  products share all three. Each page also picks its own signature band
  (cards, a comparison, or something of its own) instead of always having
  three cards.
- Learned in the product repos and now in the template: the subhead is the Pain
  then the fix; clips carry captions; the mock speaks plain words; the
  audience line is ink, not cobalt.

## Consequences

- A product mark is the one place a hue appears as a wash: the stage behind
  the hero proof, at 8%. That is a scoped exception to "identity is not a
  fill" (§3). It is safe because the product hues mean nothing else in the
  system, and the stage never sits behind a control or a state.
- Actions stay cobalt on every product, so "you can click this" still means
  one thing everywhere.
- §13 is shorter: the rules that drive clarity stay, and the ones that only
  added words are gone.
- Driftwood, Guidebook and Sites each add a `BRIEF.md`, pick their identity
  and cut to the budgets in their own repos.
