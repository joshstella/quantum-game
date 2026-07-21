# Ledger — #0002 Refactor the single-file Quantum Life prototype into a structured web app

**Status:** initiated
**Date:** 2026-07-21

## Phase sequence — strict chain

| Phase | Files created/modified | Accomplishes | Depends on | Status |
|---|---|---|---|---|
| `phase 1 — scaffold` | `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `src/styles.css` | Stand up Vite + TypeScript project; move existing HTML/CSS/JS in as-is, no behavior change, single entry file | — | done (PR [#1](https://github.com/joshstella/quantum-game/pull/1)) |
| `phase 2 — extract core behavior` | `src/types.ts`, `src/state.ts`, `src/engine.ts`, `src/rendering.ts`, `src/ui.ts` | Split field state, `step`/`applyH`, canvas rendering, and control/UI wiring out of `main.ts` into typed modules | phase 1 scaffold exists | done (PR [#2](https://github.com/joshstella/quantum-game/pull/2)) |
| `phase 3 — testability` | `src/scoring.ts`, `src/scoring.test.ts`, `src/state.test.ts`, `vitest.config.ts`, `package.json` | Extract scoring math into a pure `computeScore(state): ScoreResult`; `ui.ts` becomes a thin DOM-writing wrapper; add unit tests for scoring and seeds | phase 2 module boundaries (scoring/state must already be separated) | done (PR [#3](https://github.com/joshstella/quantum-game/pull/3)) |
| `phase 4 — polish and verify` | `src/scoring.test.ts` (extended), `src/engine.test.ts` (new), `CLAUDE.md` (project-specific section) | Close the two carried-forward test gaps (mid-range coherence, engine.ts coverage), final manual verification pass, readability review, document module layout | phase 3 complete | in-progress |

This is a strict chain, not parallel tracks — each phase's modules are inputs the next phase depends on.

## Open decisions

None block phase 1 (resolved — see Big decisions). Phase 2's state-boundary shape (below) is now settled, not open.

## Complications found

- The brief's proposed structure doesn't say where the RAF animation loop and seed-button wiring land. Plan: fold both into `src/ui.ts` in phase 2 (they're UI/interaction wiring, not simulation or rendering logic). Confirmed in phase 2 planning — no objection raised, proceeding as planned.
- Phase 2 already left `state.ts`'s seed functions (`seedRing`/`seedInterf`/`seedPacket`) with zero DOM dependencies — they're already directly unit-testable as-is. Phase 3 found no code change needed there, just test coverage; the "made pure" framing in the original phase-3 row overstated what was left to do.
- Phase 3's `/review-pr` (PR #3) surfaced two open items, neither blocking, both still unresolved: (1) no test distinguishes "no signal" from "signal but phase-incoherent" in the middle of `computeScore`'s ring-coherence range — existing tests only cover the two extremes; (2) `engine.ts`'s `step`/`applyH` has no unit tests despite being DOM-free, pure numeric logic — out of phase 3's scope as brief-defined, but worth a look if phase 4's "readability review" touches it.

## Branches

- `feature/quantum-life-refactor-scaffold` — phase 1 (done), PR [#1](https://github.com/joshstella/quantum-game/pull/1), merged into `main` as `289e849`.
- `feature/quantum-life-refactor-extract-core` — phase 2 (done), PR [#2](https://github.com/joshstella/quantum-game/pull/2), merged into `main` as `2409f3f`.
- `feature/quantum-life-refactor-testability` — phase 3 (done), PR [#3](https://github.com/joshstella/quantum-game/pull/3), merged into `main` as `63b2f5c`.
- `feature/quantum-life-refactor-polish` — phase 4 (created this session)
- Later phases branch via `/next-brief-phase` as each completes.

## Big decisions

- **Phase 1 is test-exempt.** The cross-project preference "tests gate main" is satisfied here by treating the brief's own phasing as authoritative: phase 1 is a verbatim structural move (TS-typing pass only, no new logic), and unit testing is explicitly scoped to phase 3. Resolved during `/review-pr` on PR #1 — behavioral equivalence was instead verified at runtime (typecheck, build, and a Playwright-driven pass through every control) rather than via unit tests. Applies to phase 1 only; phase 3 still owes real unit tests before it merges.
- **Phase 2 state boundary: single `FieldState` object, not exported loose `let`s.** `main.ts`'s flat module-level mutable state (arrays + scalars) needs an explicit shape to cross module boundaries per CLAUDE.md's "explicit named exported interfaces at every boundary." Resolved during `/next-brief-phase` planning: `state.ts` owns and exports a typed `FieldState` interface; `engine.ts`/`rendering.ts`/`ui.ts` take it as an explicit parameter rather than importing individual global bindings. Scoring extraction (still using this same `FieldState` shape) is phase 3's job.
- **Phase 3: `ScoreResult` lives in `scoring.ts`, not `types.ts`.** Follows phase 2's own precedent — `Renderer` was defined in `rendering.ts` rather than the shared types file, since it's a contract local to one module's output, not shared across module boundaries the way `FieldState` is. `ScoreResult` gets the same treatment.
- **Phase 4 structure doc placement: `CLAUDE.md`'s project-specific section, not a new `docs/architecture.md`.** The brief allowed either; `CLAUDE.md` already has a templated placeholder for exactly this, so filling it in avoids adding a new file for a doc that fits the existing one. Decided during phase 4 planning, not raised as an open question — low-stakes enough not to need a stop-and-ask.
