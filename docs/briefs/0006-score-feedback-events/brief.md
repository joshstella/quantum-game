# Add on-screen feedback events when score thresholds are crossed

**Serial:** #0006 · **Created:** 2026-07-24T20:47:38Z · **Author:** josh.stella@gmail.com · **Depends on:** —

## Overview

`computeScore` already drives the two live meters (ring coherence %, held %) shown in the
side panel during real gameplay. Right now those numbers only update silently as
`score()` (`src/ui.ts`) redraws them each frame. Add a lightweight visual event — a toast
or flash — that fires when a score crosses a meaningful threshold, so a player gets
feedback *at the moment* something notable happens, not just a number ticking on a bar.
This applies to real gameplay generally, not just the "Show me how" demo (#0005) — the
demo will incidentally trigger the same events since it drives the same scoring code, but
this is not demo-specific work.

## Goals

- Visual feedback (toast, flash, or similar — TBD, see open decisions) triggered by
  `computeScore`'s output crossing some threshold.
- Fires during normal player-driven gameplay, not just the scripted demo.
- Reuses the existing score computation (`scoring.ts`'s `computeScore`) — no separate
  scoring path for the feedback trigger.

## Open decisions

These need the author's input before an implementation plan can be written — this brief
is filed to hold the identity/serial, not to start work:

- **Which score(s) trigger it** — ring coherence only, held %, both, or a combined
  condition (e.g. ring crossing 80% *while* held is also high)?
- **What "crossing a threshold" means** — a fixed number (e.g. 80%), crossing upward vs.
  downward (climbing into coherence vs. collapsing out of it), or relative deltas (score
  jumped by N% since last frame)?
- **What the feedback looks like** — a toast (transient text, where positioned?), a
  full-canvas flash, a border/glow pulse on the meter itself, a sound (brief #0005
  explicitly ruled out audio for the demo; unclear if that constraint was demo-specific
  or general)?
- **Repeat-fire behavior** — once per threshold crossing, debounced so hovering near a
  threshold doesn't spam repeatedly, or unlimited?

## Non-goals

- Not part of brief #0005's demo scope — the demo will trigger these events as a side
  effect of driving real scoring code, but this brief's work is independent and not
  gated on #0005.
- Not new scoring logic — `scoring.ts`'s `computeScore` is the only source of truth this
  reads from.

## Risks and notes

- Filed with open decisions deliberately unresolved (per the working agreement: judgment
  calls on domain intent get raised, not guessed). `/start-brief` should surface these as
  blocking before any implementation plan is written.
