# Ledger — #0006 Add on-screen feedback events when score thresholds are crossed

**Status:** initiated
**Date:** 2026-07-25

## Phase sequence — strict chain

| Phase | Files created/modified | Accomplishes | Depends on | Status |
|---|---|---|---|---|
| `phase 1 — core crossing logic` | `src/scoreEvents.ts` (new), `src/tests/scoreEvents.test.ts` (new) | Pure, DOM-free `detectCrossing(prevPct, currPct): 'up' \| 'down' \| null` over a fixed threshold list — directly unit testable, no scoring.ts changes | — | in-progress |
| `phase 2 — UI wiring and verify` | `src/ui.ts` (track previous ring %, call `detectCrossing`, trigger the flash), `index.html` (flash overlay element), `src/styles.css` (flash animation) | Full-canvas flash fires on real gameplay ring-coherence crossings (and incidentally during brief #0005's demo, since it drives the same scoring code); full-suite verification + ad-hoc Playwright pass | phase 1's `detectCrossing` must exist | pending |

Strict chain — phase 2 wires what phase 1 computes.

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

## Branches

- `feature/score-feedback-events-core-logic` — phase 1 (created this session).
- Phase 2 branches via `/next-brief-phase` once phase 1 completes.
