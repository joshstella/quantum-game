# Ledger — #0005 Add a "Show me how" self-playing demo with explanatory captions

**Status:** in-progress
**Date:** 2026-07-24

## Phase sequence — strict chain

| Phase | Files created/modified | Accomplishes | Depends on | Status |
|---|---|---|---|---|
| `phase 1 — demo script core logic` | `src/demo.ts` (new), `src/ui.ts` (export `collapseAt`), `src/tests/demo.test.ts` (new) | DOM-free `DemoPhase[]` sequence (seed vortex ring → freeze cells along the ring via `apply()` → one `collapseAt()`), directly unit tested | — | done (PR #10, merged 2026-07-24) |
| `phase 2 — UI wiring` | `src/ui.ts` (demo runner), `index.html` (button + caption overlay), `src/styles.css` (overlay styling, disabled states already exist from #0003) | Wire the "Show me how" button, canvas caption overlay synced to phase changes, disable all other controls while the demo plays, cancel + fully reset state on any real canvas `pointerdown` | phase 1's `DemoPhase[]` must exist | in-progress |
| `phase 3 — polish and verify` | full-suite verification, `CLAUDE.md` (module layout) | End-to-end Playwright pass including the interrupt/cancel path; readability pass over `demo.ts` and the runner code; document `demo.ts` in `CLAUDE.md` | phase 2 complete | pending |

Strict chain, not parallel — each phase builds directly on the prior. Sequence unchanged by phase 1: the DI finding (below) is an implementation detail within phase 2's existing scope, not a reason to split or reorder phases.

## Open decisions

None block phase 1. Two defaults were settled at brief-authoring time rather than raised as open questions:
- **Pacing:** ~40 freeze-ticks around the ring over ~2–3 seconds.
- **Button placement:** inside the existing `.hint` panel section.

Neither is revisited unless review flags it.

## Complications found

None new. `ui.ts`'s `apply()` is already exported (from brief #0003); `collapseAt` is not yet exported and phase 1 adds that export — a direct, low-risk extension of the same pattern brief #0003 established.

## Branches

- `feature/show-me-how-demo-logic` — phase 1, merged via PR #10.
- `feature/show-me-how-ui-wiring` — phase 2 (created this session).
- Phase 3 branches via `/next-brief-phase` once phase 2 completes.

## Big decisions

- **`demo.ts` uses dependency injection, not a direct `ui.ts` import.** The brief's "Proposed design" said `demo.ts` calls `apply()`/`collapseAt()` directly. Implementing it that way would create a circular import once phase 2's `ui.ts` runner needs to import `demo.ts` (`demo.ts → ui.ts → demo.ts`) — a real bug the brief didn't anticipate. Resolved during phase 1's `/review-pr`: `demo.ts` defines a `DemoActions` interface (`{ apply, collapseAt }`) and each `DemoPhase.tick()` takes it as a parameter; `ui.ts`'s phase-2 runner will pass its own local functions straight through, with no import from `demo.ts` back into `ui.ts`'s dependency graph. `demo.ts` stays fully decoupled from `ui.ts`.
- **The demo is no longer fully autoplaying — one deliberate confirmation pause was added before Collapse.** The brief's Goals describe "an autoplaying walkthrough" throughout. During phase 2 dev, informal manual testing surfaced that the freeze→collapse transition was too fast to read (single-tick phases advanced instantly) and, once paced out, still gave no beat between "ring fully frozen" and "collapsed" — the destructive step felt like a surprise rather than an explained consequence. The user explicitly chose to make this one transition blocking: `ui.ts`'s runner now shows a popup (`#demoPopup`, distinct from the caption overlay `#demoCaption`) stating the current ring-coherence % and what Collapse is about to do, and the demo pauses (via `DemoRunner.awaitingCollapseConfirm`) until the player clicks "Collapse now →". Every other transition (seed→freeze) remains a timed auto-advance (`DEMO_MIN_PHASE_FRAMES`). This is a deliberate, informed deviation from "autoplaying," not an oversight — recorded here since it changes what "Clicking 'Show me how' plays the full sequence" (an acceptance criterion) actually means: the sequence now includes one required click partway through.
