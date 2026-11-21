# ADR-0003 — The system lives in one public repo, consumed as a package

**Status:** accepted · 2026-08-23

## Decision

A standalone repo — `brignano/design` — installed as `@brignano/design`.

## Rationale

**It cannot live in `life`.** `life` is private and holds confirmation codes and
booking details. `brignano.io` is public. A public site cannot install tokens from
a private repo without handing out credentials to the repo storing your boarding
passes. Hard blocker, not preference.

**It should not live in `brignano.io`.** That makes the site the owner and every
tool a downstream guest, pinning tools to the site's release cycle.

**Copy-paste is what already failed** — two repos, two stylesheets, two accents,
two chart palettes, and a documented decision only one of them followed.

## Distribution

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

## Consequences

- The repo must be **public**: private npm needs a paid plan, jsDelivr only serves
  public repos, and a public `brignano.io` that can't `npm install` is broken.
- Nothing here is secret — hex values and spacing rules aren't a moat — and the
  documented reasoning is itself a portfolio asset.
- Consumers pin the **same tag** and bump together. If one tracks `main` and another
  a tag, the drift this repo exists to prevent comes straight back.
- A token rename is a breaking change.
