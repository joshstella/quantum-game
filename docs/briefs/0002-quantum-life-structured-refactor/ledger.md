# Ledger — #0002 Refactor the single-file Quantum Life prototype into a structured web app

**Status:** initiated
**Date:** 2026-07-21

## Phase sequence — strict chain

| Phase | Files created/modified | Accomplishes | Depends on | Status |
|---|---|---|---|---|
| `phase 1 — scaffold` | `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `src/styles.css` | Stand up Vite + TypeScript project; move existing HTML/CSS/JS in as-is, no behavior change, single entry file | — | done (PR [#1](https://github.com/joshstella/quantum-game/pull/1)) |
| `phase 2 — extract core behavior` | `src/types.ts`, `src/state.ts`, `src/engine.ts`, `src/rendering.ts`, `src/ui.ts` | Split field state, `step`/`applyH`, canvas rendering, and control/UI wiring out of `main.ts` into typed modules | phase 1 scaffold exists | done (PR [#2](https://github.com/joshstella/quantum-game/pull/2)) |
| `phase 3 — testability` | `src/scoring.ts`, seed functions in `src/state.ts` made pure, `*.test.ts`, vitest config | Extract scoring and seed logic into pure, directly-testable functions; add unit tests | phase 2 module boundaries (scoring/state must already be separated) | pending |
| `phase 4 — polish and verify` | manual verification pass, readability review, structure doc (`CLAUDE.md` project-specific section or `docs/architecture.md`) | Confirm behavioral equivalence, confirm module boundaries are meaningful, document structure for future contributors | phase 3 complete | pending |

This is a strict chain, not parallel tracks — each phase's modules are inputs the next phase depends on.

## Open decisions

None block phase 1 (resolved — see Big decisions). Phase 2's state-boundary shape (below) is now settled, not open.

## Complications found

- The brief's proposed structure doesn't say where the RAF animation loop and seed-button wiring land. Plan: fold both into `src/ui.ts` in phase 2 (they're UI/interaction wiring, not simulation or rendering logic). Confirmed in phase 2 planning — no objection raised, proceeding as planned.

## Branches

- `feature/quantum-life-refactor-scaffold` — phase 1 (done), PR [#1](https://github.com/joshstella/quantum-game/pull/1), merged into `main` as `289e849`.
- `feature/quantum-life-refactor-extract-core` — phase 2 (done), PR [#2](https://github.com/joshstella/quantum-game/pull/2), merged into `main` as `2409f3f`.
- Later phases branch via `/next-brief-phase` as each completes.

## Big decisions

- **Phase 1 is test-exempt.** The cross-project preference "tests gate main" is satisfied here by treating the brief's own phasing as authoritative: phase 1 is a verbatim structural move (TS-typing pass only, no new logic), and unit testing is explicitly scoped to phase 3. Resolved during `/review-pr` on PR #1 — behavioral equivalence was instead verified at runtime (typecheck, build, and a Playwright-driven pass through every control) rather than via unit tests. Applies to phase 1 only; phase 3 still owes real unit tests before it merges.
- **Phase 2 state boundary: single `FieldState` object, not exported loose `let`s.** `main.ts`'s flat module-level mutable state (arrays + scalars) needs an explicit shape to cross module boundaries per CLAUDE.md's "explicit named exported interfaces at every boundary." Resolved during `/next-brief-phase` planning: `state.ts` owns and exports a typed `FieldState` interface; `engine.ts`/`rendering.ts`/`ui.ts` take it as an explicit parameter rather than importing individual global bindings. Scoring extraction (still using this same `FieldState` shape) is phase 3's job.
