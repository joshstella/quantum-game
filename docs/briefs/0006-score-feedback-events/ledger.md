# Ledger — #0006 Add on-screen feedback events when score thresholds are crossed

**Status:** in-progress
**Date:** 2026-07-25

## Phase sequence — strict chain

| Phase | Files created/modified | Accomplishes | Depends on | Status |
|---|---|---|---|---|
| `phase 1 — core crossing logic` | `src/scoreEvents.ts` (new), `src/tests/scoreEvents.test.ts` (new) | DOM-free `createScoreEventTracker(): ScoreEventTracker` (`.check(pct): 'up' \| 'down' \| null`) over a fixed threshold list — directly unit testable, no scoring.ts changes | — | done (PR #16, merged 2026-07-25) |
| `phase 2 — UI wiring and verify` | `src/ui.ts` (one tracker instance, feed it the ring % each `score()` call, trigger the flash), `index.html` (flash overlay element), `src/styles.css` (flash animation), `CLAUDE.md` (module layout) | Full-canvas flash fires on real gameplay ring-coherence crossings (and incidentally during brief #0005's demo, since it drives the same scoring code); full-suite verification + ad-hoc Playwright pass | phase 1's tracker must exist | in-progress |

Strict chain — phase 2 wires what phase 1 computes. Re-planned scope: phase 1's `/review-pr` flagged that `CLAUDE.md` doesn't yet list `scoreEvents.ts`, unlike `demo.ts`'s precedent (brief #0005 phase 3) — added to phase 2's file list rather than left inconsistent.

## Open decisions — all resolved before phase 1 branched

- **Which score(s) trigger it** → Ring coherence only (the panel's own "target" metric; held % is secondary/diagnostic).
- **What "crossing a threshold" means** → Fixed thresholds, both directions (climbing up *or* falling down) — matches the app's existing "coherence climbs / coherence dies" narrative.
- **What the feedback looks like** → A full-canvas flash (not a meter-glow or toast) — `var(--good)` tint on an upward crossing, `var(--warn)` tint on a downward crossing, ~300ms fade. Reuses this app's existing color language rather than inventing new colors.
- **Repeat-fire behavior** → Once per crossing, debounced. Implemented via discrete brackets (below 25 / 25–50 / 50–75 / 75–90 / 90+): fires only when the current bracket differs from the last-fired bracket, which gives the debounce for free — hovering at a boundary without actually crossing it doesn't change the bracket.

Settled as low-stakes implementation defaults (not raised as separate questions), adjustable in review:
- **Threshold values:** 25/50/75/90% — round milestones spanning the range.

## Complications found

- Verified by direct simulation (not assumed): `renderer.render()`'s `smoothMax` convergence at page load does *not* cause spurious oscillation in ring-coherence % — a freshly-seeded ring's `presence` term clamps to 1 immediately, so the score is stable at 100% from frame 1, not jittering across multiple thresholds during the ~200ms ramp-up.
- Real complication phase 2 must handle: the very first `score()` call has no prior reading to compare against. `detectCrossing` needs its first call seeded from the current value (establishing the starting bracket) rather than compared against an assumed `0`, or it will fire a spurious flash immediately on every page load.

## Big decisions

- **Phase 1 deviated from the ledger's planned `detectCrossing(prevPct, currPct)` pure function, in favor of a stateful `createScoreEventTracker(): ScoreEventTracker` with a `.check(pct)` method.** The ledger's own "Complications found" flagged that the first call needs its baseline seeded rather than compared against an assumed 0 — a two-arg pure function would leave that discipline up to whichever caller uses it (phase 2's `ui.ts`, and any future caller). The stateful tracker closes this off structurally: `lastBracket` starts as `null` internally, and the first `.check()` call always establishes the baseline and returns `null`, so it's impossible for a caller to get this wrong. Same testability characteristic as the pure-function plan (a sequence of `.check()` calls asserts the same behavior a sequence of `detectCrossing(prev, curr)` calls would), just self-contained. Phase 2's `ui.ts` integration is a single tracker instance fed the ring % each `score()` call, not manual prev/curr tracking.

## Branches

- `feature/score-feedback-events-core-logic` — phase 1, merged via PR #16.
- `feature/score-feedback-events-ui-wiring` — phase 2 (created this session).
