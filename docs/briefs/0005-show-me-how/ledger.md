# Ledger — #0005 Add a "Show me how" self-playing demo with explanatory captions

**Status:** initiated
**Date:** 2026-07-23

## Phase sequence — strict chain

| Phase | Files created/modified | Accomplishes | Depends on | Status |
|---|---|---|---|---|
| `phase 1 — demo script core logic` | `src/demo.ts` (new), `src/ui.ts` (export `collapseAt`), `src/tests/demo.test.ts` (new) | DOM-free `DemoPhase[]` sequence (seed vortex ring → freeze cells along the ring via `apply()` → one `collapseAt()`), directly unit tested | — | in-progress |
| `phase 2 — UI wiring` | `src/ui.ts` (demo runner), `index.html` (button + caption overlay), `src/styles.css` (overlay styling, disabled states already exist from #0003) | Wire the "Show me how" button, canvas caption overlay synced to phase changes, disable all other controls while the demo plays, cancel + fully reset state on any real canvas `pointerdown` | phase 1's `DemoPhase[]` must exist | pending |
| `phase 3 — polish and verify` | full-suite verification, `CLAUDE.md` (module layout) | End-to-end Playwright pass including the interrupt/cancel path; readability pass over `demo.ts` and the runner code; document `demo.ts` in `CLAUDE.md` | phase 2 complete | pending |

Strict chain, not parallel — each phase builds directly on the prior.

## Open decisions

None block phase 1. Two defaults were settled at brief-authoring time rather than raised as open questions:
- **Pacing:** ~40 freeze-ticks around the ring over ~2–3 seconds.
- **Button placement:** inside the existing `.hint` panel section.

Neither is revisited unless review flags it.

## Complications found

None new. `ui.ts`'s `apply()` is already exported (from brief #0003); `collapseAt` is not yet exported and phase 1 adds that export — a direct, low-risk extension of the same pattern brief #0003 established.

## Big decisions

- **Phase 1 deviated from the brief's literal `tick(state, tickIndex)` signature.** The brief's
  "Proposed design" had phases call `ui.ts`'s `apply()`/`collapseAt()` directly; the merged
  implementation instead threads them in via an injected `DemoActions` (`tick(state, tickIndex,
  actions)`). Reason: `demo.ts` importing `ui.ts` directly would create a circular import once
  phase 2's `ui.ts` runner needs to import `demo.ts` to drive the button. This was surfaced in
  PR #10's description but not recorded here until this review — added now so the ledger is the
  accurate source of truth. Phase 2's runner must pass `{ apply, collapseAt }` from `ui.ts` into
  each phase's `tick()`, not call phases expecting a two-argument signature.

## Branches

- `feature/show-me-how-demo-logic` — phase 1 (created this session)
- Phases 2–3 branch via `/next-brief-phase` as each completes.

## Big decisions

- **`demo.ts` uses dependency injection, not a direct `ui.ts` import.** The brief's "Proposed design" said `demo.ts` calls `apply()`/`collapseAt()` directly. Implementing it that way would create a circular import once phase 2's `ui.ts` runner needs to import `demo.ts` (`demo.ts → ui.ts → demo.ts`) — a real bug the brief didn't anticipate. Resolved during phase 1's `/review-pr`: `demo.ts` defines a `DemoActions` interface (`{ apply, collapseAt }`) and each `DemoPhase.tick()` takes it as a parameter; `ui.ts`'s phase-2 runner will pass its own local functions straight through, with no import from `demo.ts` back into `ui.ts`'s dependency graph. `demo.ts` stays fully decoupled from `ui.ts`.
