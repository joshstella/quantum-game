# Enlarge the main canvas display

**Serial:** #0004 · **Created:** 2026-07-22T00:19:02Z · **Author:** josh.stella@gmail.com · **Depends on:** —

## Overview

The simulation canvas currently renders at a fixed 520×520 CSS pixels (`src/state.ts`'s
`N=104` cells × `CELL=5` px/cell, matched by `index.html`'s `<canvas>` width/height
attributes and `src/styles.css`'s `canvas#view` size). This brief makes the main view —
the canvas, not the side control panel — larger, leaving the side panel's width and the
simulation's underlying grid resolution unchanged.

## Goals

- Increase the on-screen size of the canvas stage noticeably, without touching the
  control panel's width or layout.
- Keep the simulation grid resolution (`N=104`) unchanged — this is a display-scale
  change only, not a fidelity change. The Hamiltonian/scoring math doesn't need to know
  or care that the canvas got bigger.
- Keep `CELL` (px per simulation cell), the canvas's HTML `width`/`height` attributes, and
  its CSS size all in lockstep — a mismatch between any of these would stretch or blur the
  pixelated rendering.

## Non-goals

- Not increasing `N` (simulation resolution) — that changes the physics' visual grain and
  the cost of `render()`'s per-cell loop, which this brief has no reason to touch.
- Not making the canvas responsive/fluid-width to the browser window — a fixed, larger
  pixel size, same as today's fixed 520px, just bigger.
- Not redesigning the panel or overall page layout beyond what naturally follows from a
  wider stage (e.g. `body`'s existing flex-wrap already reflows the panel beside or below
  a taller/wider stage).

## Open decisions

- **Target size.** "Larger" needs a concrete number. `CELL=5` gives 520px; `CELL=6` gives
  624px; `CELL=7` gives 728px; `CELL=8` gives 832px (`N=104` divides all of these evenly,
  keeping the canvas crisp under `image-rendering:pixelated`). Proposed default: `CELL=7`
  (728px) — a clearly larger stage without dominating the viewport. Needs confirmation
  before phase 1 starts; a non-integer-clean target is also possible but would need a
  small adjustment elsewhere (e.g. changing `N`) to stay pixel-crisp.

## Proposed design

- `src/state.ts`: change the `CELL` constant to the confirmed value.
- `index.html`: update `<canvas id="view">`'s `width`/`height` attributes to `N * CELL`.
- `src/styles.css`: update `canvas#view`'s `width`/`height` to match.
- No changes to `src/engine.ts`, `src/scoring.ts`, or `FieldState` — `N`, `RING_R`, and
  `RING_W` all stay in cell units and are unaffected by a change to `CELL`.

## Implementation plan

Single phase — this is a small, mechanical, low-risk change (three constants kept in
sync), not a multi-step effort.

- Update `CELL` in `state.ts`, the canvas attributes in `index.html`, and the CSS size in
  `styles.css` to the confirmed target.
- Manual verification: run the app, confirm the canvas renders at the new size with no
  stretching/blur, the ring overlay still aligns with the vortex-ring seed, and every
  control (all four modes, all three seeds, sliders, pause/clear/release) still works
  exactly as before.

## Acceptance criteria

- The canvas displays visibly larger than 520×520, at the confirmed target size.
- The ring overlay still aligns correctly with the seeded vortex ring at the new size.
- No visual stretching or blur — the canvas's HTML attributes, CSS size, and `CELL` all
  agree.
- The side panel's width and the rest of the page layout are unaffected.
- Verified running in the browser, not just by inspecting the diff.

## Risks and notes

- The only real risk is the three places that must stay in sync (`CELL`, the canvas HTML
  attributes, the CSS size) drifting apart — worth a one-line comment at each site
  cross-referencing the other two, so a future change to one is less likely to silently
  break the others.
