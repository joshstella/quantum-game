# Ledger — #0003 Add selectable brush shapes to Observe (Zeno-hold) mode

**Status:** initiated
**Date:** 2026-07-22

## Phase sequence — strict chain

| Phase | Files created/modified | Accomplishes | Depends on | Status |
|---|---|---|---|---|
| `phase 1 — brush-shape core logic` | `src/types.ts` (`BrushShape`, `FieldState.brushShape`), `src/ui.ts` (mask predicates), `src/tests/*.test.ts` (new) | Add the closed 4-shape union (circle, hline, vline, square outline) and four pure, directly testable mask predicates. No UI changes. | — | done (PR [#7](https://github.com/joshstella/quantum-game/pull/7)) |
| `phase 2 — UI wiring and verification` | `src/ui.ts` (button wiring), `index.html` (new control group), `src/styles.css` (disabled-button style) | Wire a shape-picker control group into the instrument panel, always visible but disabled/greyed out unless Observe mode is active; Playwright verification that Source/Phase tune are unaffected regardless of selected shape | phase 1's mask predicates exist | in-progress |

Strict chain, not parallel — phase 2 wires UI on top of phase 1's mask predicates.

## Open decisions

- **"etc." (more shapes than 4)** — the brief scoped this closed at authoring time (circle, hline, vline, square outline only). Treated as settled; not blocking either phase. Flag if this should reopen.
- **UI placement — resolved.** The control group is always visible, disabled/greyed out (not `pointer-events` inert — real `disabled` attribute) when Observe isn't the active mode. This reverses the brief's proposed default (hidden-when-not-Observe) per explicit user choice during `/next-brief-phase` planning: more discoverable, at the cost of one disabled control group in 3 of 4 modes. The group's label includes "(Observe)" to explain the disabled state without new tooltip infrastructure.

## Complications found

None. `src/ui.ts`'s current `forBrush`/`apply` structure (as of `main` at initiation) matches the brief's proposed design exactly — `apply()` already branches on `state.mode`, and `forBrush`'s existing radius-bounded iteration already covers the search box the square/line masks need, per the brief's own risk note.

## Branches

- `feature/observe-brush-shapes-core-logic` — phase 1 (done), PR [#7](https://github.com/joshstella/quantum-game/pull/7), merged into `main` as `1f5170d`.
- Phase 2 branches via `/next-brief-phase`.

## Big decisions

- **`apply()` exported for direct testing.** Phase 1's review (`/review-pr` on PR #7) flagged that the mask *predicates* were tested in isolation but the mode-based mask *selection* (observe honors `brushShape`, every other mode forces circle) wasn't — a real gap since that branching logic already existed in the diff, not deferred to phase 2. Resolved by exporting `apply()` from `ui.ts` and adding 3 tests exercising it directly (observe+square, source+square-forced-to-circle, phase+square-forced-to-circle), rather than deferring the gap to phase 2's Playwright-only verification.
