# Ledger — #0008 Remove the score threshold flash

**Status:** initiated
**Date:** 2026-08-02

## Phase sequence — strict chain (single phase)

| Phase | Files created/modified | Accomplishes | Depends on | Status |
|---|---|---|---|---|
| `phase 1 — remove flash and scoreEvents module` | `src/ui.ts` (drop tracker/flash wiring; revert `score()` to `void`), `index.html` (drop `#scoreFlash`), `src/styles.css` (drop flash rules/keyframes), delete `src/scoreEvents.ts`, delete `src/tests/scoreEvents.test.ts` | No score-driven flash in the running game; meters unchanged; no dead scaffolding | — | pending |

Strict chain — one phase; nothing to serialize beyond this.

## Open decisions

None — scoreEvents deletion settled before filing.

## Complications found

None yet — initiation only; codebase read confirms touch points match brief scope (`ui.ts` lines ~7, 128–157, 355–356; `#scoreFlash` in `index.html`; `.score-flash` rules in `styles.css`).

## Branches

(none yet — branch after ledger lands on `main`)
