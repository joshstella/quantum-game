# Ledger — #0003 Add selectable brush shapes to Observe (Zeno-hold) mode

**Status:** initiated
**Date:** 2026-07-22

## Phase sequence — strict chain

| Phase | Files created/modified | Accomplishes | Depends on | Status |
|---|---|---|---|---|
| `phase 1 — brush-shape core logic` | `src/types.ts` (`BrushShape`, `FieldState.brushShape`), `src/ui.ts` (mask predicates), `src/tests/*.test.ts` (new) | Add the closed 4-shape union (circle, hline, vline, square outline) and four pure, directly testable mask predicates. No UI changes. | — | in-progress |
| `phase 2 — UI wiring and verification` | `src/ui.ts` (button wiring), `index.html` (new control group) | Wire a shape-picker control group into the instrument panel, visible only while Observe mode is active; Playwright verification that Source/Phase tune are unaffected regardless of selected shape | phase 1's mask predicates exist | pending |

Strict chain, not parallel — phase 2 wires UI on top of phase 1's mask predicates.

## Open decisions

- **"etc." (more shapes than 4)** — the brief scoped this closed at authoring time (circle, hline, vline, square outline only). Treated as settled; not blocking either phase. Flag if this should reopen.
- **UI placement — blocks phase 2 only.** Hidden-when-not-Observe (brief's proposed default) vs. always-visible-but-disabled. Phase 1 has no UI surface, so it isn't blocked. Must resolve before phase 2 starts.

## Complications found

None. `src/ui.ts`'s current `forBrush`/`apply` structure (as of `main` at initiation) matches the brief's proposed design exactly — `apply()` already branches on `state.mode`, and `forBrush`'s existing radius-bounded iteration already covers the search box the square/line masks need, per the brief's own risk note.

## Branches

- `feature/observe-brush-shapes-core-logic` — phase 1 (created this session)
- Phase 2 branches via `/next-brief-phase` once phase 1 completes.
