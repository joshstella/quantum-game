# Scale the stage to match the panel's height, doubling grid resolution

**Serial:** #0007 · **Created:** 2026-07-24T21:23:04Z · **Author:** josh.stella@gmail.com · **Depends on:** —

## Overview

The canvas/stage (`canvas#view`, currently a fixed 728×728px per brief #0004) and the side
`.panel` are independently sized today — the panel's height is whatever its content
requires (mode buttons, sliders, score meters, hint text), and the canvas is a fixed
square. Make the stage scale up to match the panel's rendered height, keeping the
canvas's aspect ratio (currently square) intact. Since a taller/wider display canvas
would visibly pixelate the existing 104×104 simulation grid, double the grid resolution
(`N` in `src/state.ts`) alongside the display-size increase to keep detail crisp.

## Goals

- Stage height matches the panel's actual rendered height, not a hardcoded value —
  the panel's height is a function of its content and isn't fixed today.
- Canvas aspect ratio preserved (still square, just larger).
- Grid resolution (`N`) doubled to preserve visual crispness at the larger display size.
- `index.html`'s canvas width/height attributes, `styles.css`'s `canvas#view` size, and
  `src/state.ts`'s `N`/`CELL` stay in sync — the existing "keep all three in sync"
  comments across those three files must still hold after this change.

## Open decisions

These need the author's input before an implementation plan can be written:

- **How is "the panel's height" obtained?** The panel's height isn't a static number —
  it depends on font rendering and content, which can also change over time (e.g. #0006's
  score-feedback work might add elements to the panel). Options: measure it at runtime
  (`ResizeObserver` or a load-time `getBoundingClientRect()` call, so the stage adapts to
  future panel content changes automatically) vs. hardcode a snapshot value now (simpler,
  but silently goes stale the next time panel content changes).
- **Does doubling `N` (104→208) hit a performance wall?** `engine.ts`'s `step()` is
  presumably O(N²) per step, so doubling `N` is ~4x the per-step cost, and `state.ts`'s
  default `stepsPerFrame: 3` runs that multiple times per animation frame. Needs a
  measurement (does frame time still fit inside 16ms/60fps on realistic hardware?)
  before committing to a flat 2x, vs. some smaller resolution bump.
- **Do simulation-space constants scale with `N`?** `RING_R` (30) and `RING_W` (2.4) in
  `state.ts` are defined in grid-cell units, not pixels. If `N` doubles but the display
  size only grows to match the panel (not necessarily also doubling), does the vortex
  ring's simulation-space radius need to scale to keep its on-screen proportions
  consistent? This also touches `demo.ts` (brief #0005), whose freeze/collapse phases
  compute grid coordinates from `RING_R` directly.
- **Fixed square vs. matching the panel's aspect ratio?** The brief as scoped keeps the
  canvas square (matching current behavior) and just changes its size — confirm that's
  still wanted rather than also changing the aspect ratio to fill available space
  differently.

## Non-goals

- Not changing the panel's own layout/content — only the stage scales to match it.
- Not a general responsive/mobile layout pass — this is about matching two fixed-layout
  desktop elements' heights, not adapting to arbitrary viewport sizes.

## Risks and notes

- Filed with open decisions deliberately unresolved (per the working agreement: judgment
  calls on domain intent get raised, not guessed). `/start-brief` should surface these as
  blocking before any implementation plan is written.
- Brief #0005's demo (`demo.ts`) computes ring-relative grid coordinates directly from
  `state.RING_R`/`state.cx`/`state.cy` — any resolution or ring-geometry change here needs
  a compatibility check against that code once #0005 has shipped.
