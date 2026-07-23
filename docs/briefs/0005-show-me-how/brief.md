# Add a "Show me how" self-playing demo with explanatory captions

**Serial:** #0005 · **Created:** 2026-07-23T05:04:31Z · **Author:** josh.stella@gmail.com · **Depends on:** —

## Overview

Add a button that autoplays a short, scripted demonstration of the game — seeding a
vortex ring, freezing it into coherence via Observe/Zeno drags, then a destructive
Collapse click — while an overlay on the canvas explains what's happening and why, step
by step. The score displays update live and honestly, driven by the same simulation and
scoring code a human player uses; the demo is a scripted driver of real mechanics, not a
separate simulated result.

## Goals

- A "Show me how" button that starts an autoplaying walkthrough: seed the vortex ring →
  switch to Observe · Zeno → freeze cells along the ring (ring coherence climbs) → one
  Collapse click (coherence drops). This mirrors the app's existing hint text
  (`index.html`'s `.hint` copy) rather than inventing a new narrative.
- A caption overlay on the canvas that shows explanatory text synced to each phase of the
  demo (what's happening, and why it affects the score).
- While the demo plays: every other control (mode buttons, seed buttons, sliders,
  play/clear/release, brush-shape picker) is disabled, so the demo's state changes can't
  collide with a simultaneous real interaction.
- Any direct interaction with the canvas itself (a real pointerdown) immediately cancels
  the demo and returns full control to the player.
- The demo drives the same `apply()`/`collapseAt()`/`computeScore()` code paths a human
  drag would — no separate "fake" scoring or simulation just for the demo.

## Non-goals

- Not a general-purpose scripting/tutorial engine for arbitrary future walkthroughs —
  one canonical scripted sequence, not a reusable authoring system.
- Not persisting "seen this demo" state (no localStorage, no dismiss-forever) — it's
  replayable any time via the button.
- Not audio/voice narration — text captions only, matching the app's existing text-only
  hint style.
- Not changing `engine.ts`/`scoring.ts` — the demo is a scripted driver of existing
  mechanics, not a new mechanic.

## Open decisions

None block phase 1. Two implementation details are settled by default rather than
raised as open questions (both low-stakes, easily adjusted in review if wrong):
- **Pacing:** ~40 freeze-ticks traced around the ring over roughly 2–3 seconds, matching
  the rhythm of a natural human drag (similar to the pacing used in this project's own
  Playwright verification scripts).
- **Button placement:** added into the existing `.hint` panel section, since that's
  already where the app explains itself in prose — the demo is that same explanation,
  played back instead of read.

## Proposed design

- `src/demo.ts` (new): exports `createDemoPhases(): DemoPhase[]`, a small, fixed sequence
  of phases. Each phase has a `caption: string` and a `tick(state: FieldState, tickIndex:
  number): void` plus a `ticks: number` (how many ticks the phase spans). No DOM access —
  pure `FieldState` mutation, directly testable like `scoring.ts`.
  - Phase 1: seed the vortex ring, switch to Observe mode. (1 tick)
  - Phase 2: freeze cells along the ring by calling `ui.ts`'s exported `apply()` at
    successive angles around `RING_R` — the same function a real drag calls. (~40 ticks)
  - Phase 3: switch to Collapse mode, call `collapseAt()` once at a point on the ring.
    (1 tick) — requires exporting `collapseAt` from `ui.ts` (currently module-private),
    the same way `apply()` was exported in brief #0003.
- `src/ui.ts`: a demo runner that steps through `DemoPhase[]` on a timer (reusing the
  existing RAF loop's cadence), updating a caption element's text as the active phase
  changes, disabling all other controls for the duration, and canceling (re-enabling
  everything, stopping mid-phase) on any real `pointerdown` on the canvas.
- `index.html`/`src/styles.css`: the "Show me how" button (in `.hint`), and a caption
  overlay positioned over the canvas (absolutely positioned within `.stage`).

## Implementation plan

### Phase 1: demo script core logic

- `src/demo.ts`: `DemoPhase` type and `createDemoPhases()`.
- Export `collapseAt` from `src/ui.ts` (currently private) for phase 3's use.
- Unit tests: running all phases' ticks against a fresh `FieldState` seeds the ring,
  freezes the expected ring cells, and ends with a collapse (verifiable via `frozen`
  before/after and `R`/`I` changes) — reusing the same assertions style as brief #0003's
  `apply()` tests.

### Phase 2: UI wiring — button, overlay, control locking, interrupt

- Add the "Show me how" button and canvas caption overlay to `index.html`/`styles.css`.
- Wire the demo runner in `ui.ts`: start on click, advance one tick per animation frame
  (or every few frames, to match the proposed ~2–3 second pacing), update the caption on
  phase change, disable all other controls for the duration, cancel and re-enable on any
  real canvas `pointerdown`.
- Manual verification: Playwright pass confirming the button starts the demo, captions
  change at each phase, ring coherence visibly climbs then drops, other controls are
  disabled throughout, and a direct canvas click mid-demo cancels it and restores control.

### Phase 3: polish and verify

- Full run-through verification (typecheck, build, test, and an end-to-end Playwright
  pass of the complete demo, including the interrupt path).
- Readability pass over `demo.ts` and the new `ui.ts` runner code.
- Update `CLAUDE.md`'s module-layout section to mention `demo.ts`.

## Acceptance criteria

- Clicking "Show me how" plays the full sequence: seed → Observe/freeze-along-ring →
  Collapse, with ring coherence visibly climbing then dropping, driven by the real
  scoring/engine code.
- Captions on the canvas overlay change to match each phase and explain the *why*, not
  just the *what*.
- All other controls are disabled while the demo plays.
- A real pointerdown on the canvas during the demo cancels it immediately and restores
  full control.
- Unit tests cover `demo.ts`'s phases directly (no DOM).
- Verified running in the browser, not just type-checked.

## Risks and notes

- The biggest risk is state leakage if the demo is canceled mid-phase — e.g. leaving
  `mode` set to `"observe"` with controls re-enabled but the mode button's `.on` class not
  reflecting it. The interrupt handler needs to leave the UI in a fully consistent state,
  not just stop the timer.
- Reusing `apply()`/`collapseAt()` rather than duplicating their logic is the key guard
  against the demo silently drifting out of sync with real gameplay over time.
