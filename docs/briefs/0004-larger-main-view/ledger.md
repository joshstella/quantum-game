# Ledger — #0004 Enlarge the main canvas display

**Status:** completed
**Date:** 2026-07-22

## Phase sequence — single phase

| Phase | Files created/modified | Accomplishes | Depends on | Status |
|---|---|---|---|---|
| `phase 1 — enlarge canvas to 728px` | `src/state.ts` (`CELL`), `index.html` (canvas `width`/`height`), `src/styles.css` (`canvas#view` size) | Bump the canvas display size from 520px to 728px (`CELL` 5→7) with no change to simulation resolution (`N=104`) or any other module | — | done (PR [#6](https://github.com/joshstella/quantum-game/pull/6)) |

Brief closed — this was its only phase.

Single phase, no chain or parallel structure — this is a small, mechanical, three-constant change.

## Open decisions

**Resolved before initiation.** Target size confirmed as `CELL=7` (728px) — the brief's proposed default. No open decisions remain.

## Complications found

None yet — codebase context re-read during initiation matches the brief's proposed design exactly: `CELL` is a single constant in `src/state.ts`, the canvas's HTML attributes in `index.html` and its CSS size in `src/styles.css` are the only other two places size is declared.

## Branches

- `feature/larger-main-view` — phase 1 (done), PR [#6](https://github.com/joshstella/quantum-game/pull/6), merged into `main` as `aa67f48`.
