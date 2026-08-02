# Ledger — #0008 Remove the score threshold flash

**Status:** completed
**Date:** 2026-08-02

## Phase sequence — strict chain (single phase)

| Phase | Files created/modified | Accomplishes | Depends on | Status |
|---|---|---|---|---|
| `phase 1 — remove flash and scoreEvents module` | `src/ui.ts` (drop tracker/flash wiring; revert `score()` to `void`), `index.html` (drop `#scoreFlash`), `src/styles.css` (drop flash rules/keyframes), delete `src/scoreEvents.ts`, delete `src/tests/scoreEvents.test.ts`, `CLAUDE.md` (drop `scoreEvents.ts` from module layout — required for brief verification ripgrep) | No score-driven flash in the running game; meters unchanged; no dead scaffolding | — | done |

Strict chain — one phase; nothing to serialize beyond this.

## Open decisions

None — scoreEvents deletion settled before filing.

## Complications found

- `CLAUDE.md` lists `scoreEvents.ts` in the module layout (added during brief #0006 phase 2). Not named in the brief's Scope section, but the Verification ripgrep (`scoreEvent` outside `docs/`) fails if it stays — include in phase 1.

## Branches

- `feature/remove-score-flash` — phase 1 (active)
