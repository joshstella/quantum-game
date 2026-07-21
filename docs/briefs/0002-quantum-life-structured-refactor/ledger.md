# Ledger — #0002 Refactor the single-file Quantum Life prototype into a structured web app

**Status:** initiated
**Date:** 2026-07-21

## Phase sequence — strict chain

| Phase | Files created/modified | Accomplishes | Depends on | Status |
|---|---|---|---|---|
| `phase 1 — scaffold` | `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `src/styles.css` | Stand up Vite + TypeScript project; move existing HTML/CSS/JS in as-is, no behavior change, single entry file | — | in-progress |
| `phase 2 — extract core behavior` | `src/types.ts`, `src/state.ts`, `src/engine.ts`, `src/rendering.ts`, `src/ui.ts` | Split field state, `step`/`applyH`, canvas rendering, and control/UI wiring out of `main.ts` into typed modules | phase 1 scaffold exists | pending |
| `phase 3 — testability` | `src/scoring.ts`, seed functions in `src/state.ts` made pure, `*.test.ts`, vitest config | Extract scoring and seed logic into pure, directly-testable functions; add unit tests | phase 2 module boundaries (scoring/state must already be separated) | pending |
| `phase 4 — polish and verify` | manual verification pass, readability review, structure doc (`CLAUDE.md` project-specific section or `docs/architecture.md`) | Confirm behavioral equivalence, confirm module boundaries are meaningful, document structure for future contributors | phase 3 complete | pending |

This is a strict chain, not parallel tracks — each phase's modules are inputs the next phase depends on.

## Open decisions

None block phase 1. The brief's proposed file layout (Vite + TypeScript, the module list in "Proposed structure") is treated as settled.

## Complications found

- The brief's proposed structure doesn't say where the RAF animation loop and seed-button wiring land. Plan: fold both into `src/ui.ts` in phase 2 (they're UI/interaction wiring, not simulation or rendering logic). Low-risk, adjustable at phase 2 review if the user prefers `main.ts`.

## Branches

- `feature/quantum-life-refactor-scaffold` — phase 1 (created this session)
- Later phases branch via `/next-brief-phase` as each completes.
