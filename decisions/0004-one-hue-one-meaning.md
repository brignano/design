# ADR-0004 — One hue, one meaning

**Status:** accepted · 2026-08-23
**Supersedes:** the "single accent" model in the first draft of this system

## Context

The first draft had one accent carrying identity, affordance *and* warning. That is
what produced a long amber-versus-violet argument, and the argument was unwinnable
because the question was wrong: no hue can be all three without one meaning bleeding
into the others.

Worse, the founding rule of this system — *colour carries meaning, never
decoration* — was being violated by the system itself. A hue with two meanings is
exactly the thing the rule forbids, just relocated.

## Decision

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

## Consequences

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
