# ADR-0010 — Product pages show, then tell

**Status:** accepted · 2026-11-01

## Context

The first product page built on §13 (driftwood.brignano.io) was shown on a
phone to a technical reader outside its field. They scrolled once and handed
the phone back. Rendered at iPhone size, the first screen was a 10-word thesis
over four lines and a 47-word subhead, with no picture; the proof started a
screen and a half down and was cropped; the page ran to almost nine screens,
most of it four prose chapters (problem, how it works, who it's for, why now).
The template asked for exactly that: copy before proof on a phone, and a story
of chapters, which reads as a case study.

## Decision

A product page shows, then tells. The hero splits into head (status, a thesis
of 8 words or fewer naming the outcome), proof, and body (one sentence, the
actions), and stacks in that order on a phone, so the proof is on the first
screen. The story chapters give way to two short bands: three "what you get"
cards that each lead with a picture, and three one-line steps. At most one
chapter stays; the longer argument moves to the docs. `scripts/fold.mjs`
checks the first phone screen and the page length in CI.

## Consequences

- The older hero markup still lays out, so existing sites keep working until
  they move to the split; `fold.mjs` fails them until they do.
- The pictures carry the colour (state hues with their words, §3); the page
  around them stays restrained.
- driftwood, guidebook and sites each rewrite their copy to the new limits in
  their own repos.
- A cold read of the first example still left a stranger asking who it was
  for, whether they could try it, and what "Request access" leads to. So the
  hero also carries an audience line (checked), the secondary action is a
  live demo when one exists, the note says what happens next, and unbacked
  claims are cut. Forced scroll animation was considered and rejected: it
  slows phones and loses skimmers; a hero clip carries the motion instead.
