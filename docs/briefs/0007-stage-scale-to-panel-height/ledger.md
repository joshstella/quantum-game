# Ledger — #0007 Scale the stage to match the panel's height, doubling grid resolution

**Status:** initiated
**Date:** 2026-07-24

## Phase sequence — strict chain

| Phase | Files created/modified | Accomplishes | Depends on | Status |
|---|---|---|---|---|
| `phase 1 — core sizing` | `src/main.ts` (measure `.panel` height, size the canvas, pass size into `createFieldState`), `src/state.ts` (`N` 104→208, `CELL` computed from the passed size instead of a fixed constant, `RING_R` 30→60, `RING_W` 2.4→4.8), `src/types.ts` (fix stale `CELL` doc comment), `index.html` (drop hardcoded canvas width/height + sync comment), `src/styles.css` (drop fixed `canvas#view` size), `src/ui.ts` (`DEMO_COLLAPSE_BRUSH` 42→84) | Stage renders at the panel's actual rendered height (measured once at startup, not hardcoded), grid resolution doubled to stay crisp at the larger size, ring geometry and the brief #0005 demo's collapse brush scaled to match | — | in-progress |
| `phase 2 — polish and verify` | full-suite verification, `CLAUDE.md` (module layout, if warranted) | Typecheck/build/test pass; ad-hoc Playwright/manual pass confirming the canvas matches the panel's height, the target-ring overlay aligns with the actual ring, brief #0005's demo still plays correctly at the new geometry, and frame time stays smooth | phase 1 complete | pending |

Strict chain — phase 2 verifies what phase 1 builds.

## Open decisions — all resolved before phase 1 branched

- **How is "the panel's height" obtained?** → Measured once at runtime: `main.ts` reads `.panel`'s `getBoundingClientRect().height` at startup, before `createFieldState()` runs. Not a `ResizeObserver` — panel content doesn't change dynamically post-load in this app (a continuously-reactive observer was judged unnecessary scope for this brief; a static measurement at the moment the canvas is sized covers the actual described problem).
- **Does doubling `N` (104→208) hit a performance wall?** → Resolved by direct measurement, not by guessing: benchmarked `engine.ts`'s `step()` logic at N=208 with `stepsPerFrame=8` (the slider's max) — ~3.7ms/frame, well inside the 16.6ms/60fps budget. `rendering.ts`'s per-frame cost is a simple offscreen N×N pixel buffer scaled up via `drawImage`, cheap by Canvas2D standards at this size. 2x is safe.
- **Do simulation-space constants scale with `N`?** → Yes: `RING_R` 30→60, `RING_W` 2.4→4.8 (state.ts). `demo.ts` (brief #0005) needs no code change — it already reads `state.RING_R`/`cx`/`cy` at runtime rather than hardcoding numbers. `ui.ts`'s `DEMO_COLLAPSE_BRUSH` (also brief #0005, tuned as "~1.4× RING_R" when RING_R was 30) does need updating — 42→84 — or brief #0005's demo collapse becomes relatively half as dramatic as intended. `seedInterf`/`seedPacket` (state.ts)'s own hardcoded grid-space constants (±18 offset, /40 and /70 falloffs, k=0.9 momentum) are explicitly left unscaled — out of scope; the brief only asked about the ring, and those two patterns occupying a proportionally smaller area of the doubled grid is a cosmetic side effect, not a functional bug.
- **Fixed square vs. matching the panel's aspect ratio?** → Stays square, matching brief #0004's prior work and current behavior — only the size changes.

## Complications found

- `src/types.ts:12` — `CELL`'s doc comment already said "N*CELL = 520", stale since brief #0004 changed the actual product to 728. Pre-existing bug, unrelated to this brief's cause, fixed as a drive-by while phase 1 touches this exact area anyway.
- `CELL` is `readonly` on `FieldState` (`types.ts`) — it can only be set once, at construction. This is why the panel must be measured *before* `createFieldState()` runs, not after: `main.ts` becomes responsible for the measure-then-construct ordering, rather than `state.ts` computing `CELL` some other way.
- `.panel`'s rendered height is independent of `.stage`'s height today — `body`'s `align-items:flex-start` (styles.css) overrides the flexbox default `stretch`, so sizing the canvas to match the panel won't create a layout feedback loop. Confirmed by reading the CSS, not assumed.

## Branches

- `feature/stage-scale-to-panel-height-core-sizing` — phase 1 (created this session).
- Phase 2 branches via `/next-brief-phase` once phase 1 completes.
