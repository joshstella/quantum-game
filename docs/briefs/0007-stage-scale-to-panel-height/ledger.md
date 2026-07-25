# Ledger — #0007 Scale the stage to match the panel's height, doubling grid resolution

**Status:** completed
**Date:** 2026-07-24

## Phase sequence — strict chain

| Phase | Files created/modified | Accomplishes | Depends on | Status |
|---|---|---|---|---|
| `phase 1 — core sizing` | `src/main.ts` (measure `.panel` height, size the canvas, pass size into `createFieldState`), `src/state.ts` (`N` 104→208, `CELL` computed from the passed size instead of a fixed constant, `RING_R` 30→60, `RING_W` 2.4→4.8), `src/types.ts` (fix stale `CELL` doc comment), `index.html` (drop hardcoded canvas width/height + sync comment), `src/styles.css` (drop fixed `canvas#view` size), `src/ui.ts` (`DEMO_COLLAPSE_BRUSH` 42→84) | Stage renders at the panel's actual rendered height (measured once at startup, not hardcoded), grid resolution doubled to stay crisp at the larger size, ring geometry and the brief #0005 demo's collapse brush scaled to match | — | done (PR #13, merged 2026-07-24) |
| `phase 2 — polish and verify` | `CLAUDE.md` (module layout) | Typecheck/build/test pass; ad-hoc Playwright pass (12/12, after fixing 2 test-artifact failures unrelated to the app) confirming the canvas matches the panel's height, live frame timing stays well within the 60fps budget (~8.3ms avg, ~9.5ms max), the target-ring overlay aligns with the actual ring, and brief #0005's demo plays correctly end-to-end including both cancel paths at the new geometry | phase 1 complete | done (PR #14, merged 2026-07-24) |
| `phase 3 — scale the other two seed patterns` | `src/state.ts` (`seedInterf`/`seedPacket` constants), `src/tests/state.test.ts` (2 tests updated for the new offsets) | Revisited phase 1's explicit out-of-scope call: scaled `seedInterf`'s ±18→±36 offset / 40→160 falloff and `seedPacket`'s -24→-48 offset / 70→280 falloff by the same 2x principle already applied to `RING_R`/`RING_W`; halved `seedPacket`'s momentum `k` (0.9→0.45) since it's radians-per-cell, not a size — the packet's width doubled in grid cells, so halving `k` keeps the same fringe *count* rather than doubling it. Confirmed by before/after screenshot: both patterns now span a footprint comparable to the target ring, not cramped into a fraction of it | phase 1/2 complete | done |

Strict chain — phase 2 verified what phase 1 built. Phase 3 reopens the brief: confirmed by screenshot (not assumed) that phase 1's out-of-scope call needed revisiting — both "Two sources" and "Moving packet" now render visibly smaller/more cramped relative to the canvas and the ring than before the resolution doubling.

## Open decisions — all resolved before phase 1 branched

- **How is "the panel's height" obtained?** → Measured once at runtime: `main.ts` reads `.panel`'s `getBoundingClientRect().height` at startup, before `createFieldState()` runs. Not a `ResizeObserver` — panel content doesn't change dynamically post-load in this app (a continuously-reactive observer was judged unnecessary scope for this brief; a static measurement at the moment the canvas is sized covers the actual described problem).
- **Does doubling `N` (104→208) hit a performance wall?** → Resolved by direct measurement, not by guessing: benchmarked `engine.ts`'s `step()` logic at N=208 with `stepsPerFrame=8` (the slider's max) — ~3.7ms/frame, well inside the 16.6ms/60fps budget. `rendering.ts`'s per-frame cost is a simple offscreen N×N pixel buffer scaled up via `drawImage`, cheap by Canvas2D standards at this size. 2x is safe.
- **Do simulation-space constants scale with `N`?** → Yes: `RING_R` 30→60, `RING_W` 2.4→4.8 (state.ts). `demo.ts` (brief #0005) needs no code change — it already reads `state.RING_R`/`cx`/`cy` at runtime rather than hardcoding numbers. `ui.ts`'s `DEMO_COLLAPSE_BRUSH` (also brief #0005, tuned as "~1.4× RING_R" when RING_R was 30) does need updating — 42→84 — or brief #0005's demo collapse becomes relatively half as dramatic as intended. `seedInterf`/`seedPacket` (state.ts)'s own hardcoded grid-space constants (±18 offset, /40 and /70 falloffs, k=0.9 momentum) were originally left unscaled — out of scope; the brief only asked about the ring. **Revisited in phase 3**: confirmed by screenshot that this call needed revisiting — see phase 3's own row above.
- **Fixed square vs. matching the panel's aspect ratio?** → Stays square, matching brief #0004's prior work and current behavior — only the size changes.

## Complications found

- `src/types.ts:12` — `CELL`'s doc comment already said "N*CELL = 520", stale since brief #0004 changed the actual product to 728. Pre-existing bug, unrelated to this brief's cause, fixed as a drive-by while phase 1 touches this exact area anyway.
- `CELL` is `readonly` on `FieldState` (`types.ts`) — it can only be set once, at construction. This is why the panel must be measured *before* `createFieldState()` runs, not after: `main.ts` becomes responsible for the measure-then-construct ordering, rather than `state.ts` computing `CELL` some other way.
- `.panel`'s rendered height is independent of `.stage`'s height today — `body`'s `align-items:flex-start` (styles.css) overrides the flexbox default `stretch`, so sizing the canvas to match the panel won't create a layout feedback loop. Confirmed by reading the CSS, not assumed.
- Found and fixed during phase 1's `/review-pr`: `getBoundingClientRect().height` returns a float, but canvas `width`/`height` attributes truncate to an integer on assignment — using the raw float for `CELL`'s derivation while the canvas itself ends up truncated meant the two were based on very slightly different numbers. `main.ts` now rounds once, explicitly, before either use.
- Phase 2's ad-hoc Playwright verification hit the same test-authoring trap that brief #0005's verification hit: a manually-computed canvas bounding box goes stale (Y coordinate goes negative/off-screen) once the page scrolls after an earlier interaction — not an app bug both times. Now that the stage is taller (matches the panel, ~1069px in this session vs. the old fixed 728px), this is more likely to recur in future ad-hoc verification scripts for this app; using `locator.click({ position })` (which re-resolves coordinates and auto-scrolls) rather than a cached `boundingBox()` avoids it.

## Branches

- `feature/stage-scale-to-panel-height-core-sizing` — phase 1, merged via PR #13.
- `feature/stage-scale-to-panel-height-polish-verify` — phase 2, merged via PR #14.
- `feature/stage-scale-to-panel-height-seed-patterns` — phase 3, merged via PR #18.
