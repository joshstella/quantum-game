# Ledger — #0005 Add a "Show me how" self-playing demo with explanatory captions

**Status:** completed
**Date:** 2026-07-24

## Phase sequence — strict chain

| Phase | Files created/modified | Accomplishes | Depends on | Status |
|---|---|---|---|---|
| `phase 1 — demo script core logic` | `src/demo.ts` (new), `src/ui.ts` (export `collapseAt`), `src/tests/demo.test.ts` (new) | DOM-free `DemoPhase[]` sequence (seed vortex ring → freeze cells along the ring via `apply()` → one `collapseAt()`), directly unit tested | — | done (PR #10, merged 2026-07-24) |
| `phase 2 — UI wiring` | `src/ui.ts` (demo runner), `index.html` (button + caption overlay + confirm popup), `src/styles.css` (overlay + popup styling), `src/demo.ts` (caption wording) | Wire the "Show me how" button, canvas caption overlay synced to phase changes, per-phase minimum dwell, a blocking pre-Collapse confirmation popup, a demo-only widened collapse brush, disable all other controls while the demo plays, cancel + fully reset state on any real canvas `pointerdown` | phase 1's `DemoPhase[]` must exist | done (PR #11, merged 2026-07-24) |
| `phase 3 — polish and verify` | `src/ui.ts` (readability), `src/demo.ts` (comment fix), `CLAUDE.md` (module layout) | Scripted Playwright pass covering the full sequence including the popup confirmation click and cancel-while-popup-is-open (16/16, ad hoc — not committed, matching this project's existing verification convention); readability pass extracting `fireDemoTick()`; documented `demo.ts`/`ui.ts`'s demo runner in `CLAUDE.md` | phase 2 complete | done (PR #12, merged 2026-07-24) |

Strict chain, not parallel — each phase built directly on the prior. Sequence held as originally planned once re-scoped after phases 1–2: both big decisions below (DI, and the non-autoplaying confirmation pause) turned out to be implementation details that refined phase 3's Playwright coverage rather than reasons to split, reorder, or add a phase.

## Open decisions

None block phase 1. Two defaults were settled at brief-authoring time rather than raised as open questions:
- **Pacing:** ~40 freeze-ticks around the ring over ~2–3 seconds.
- **Button placement:** inside the existing `.hint` panel section.

Neither is revisited unless review flags it.

## Complications found

None new. `ui.ts`'s `apply()` is already exported (from brief #0003); `collapseAt` is not yet exported and phase 1 adds that export — a direct, low-risk extension of the same pattern brief #0003 established.

## Branches

- `feature/show-me-how-demo-logic` — phase 1, merged via PR #10.
- `feature/show-me-how-ui-wiring` — phase 2, merged via PR #11.
- `feature/show-me-how-polish-verify` — phase 3, merged via PR #12.

## Big decisions

- **`demo.ts` uses dependency injection, not a direct `ui.ts` import.** The brief's "Proposed design" said `demo.ts` calls `apply()`/`collapseAt()` directly. Implementing it that way would create a circular import once phase 2's `ui.ts` runner needs to import `demo.ts` (`demo.ts → ui.ts → demo.ts`) — a real bug the brief didn't anticipate. Resolved during phase 1's `/review-pr`: `demo.ts` defines a `DemoActions` interface (`{ apply, collapseAt }`) and each `DemoPhase.tick()` takes it as a parameter; `ui.ts`'s phase-2 runner will pass its own local functions straight through, with no import from `demo.ts` back into `ui.ts`'s dependency graph. `demo.ts` stays fully decoupled from `ui.ts`.
- **The demo is no longer fully autoplaying — one deliberate confirmation pause was added before Collapse.** The brief's Goals describe "an autoplaying walkthrough" throughout. During phase 2 dev, informal manual testing surfaced that the freeze→collapse transition was too fast to read (single-tick phases advanced instantly) and, once paced out, still gave no beat between "ring fully frozen" and "collapsed" — the destructive step felt like a surprise rather than an explained consequence. The user explicitly chose to make this one transition blocking: `ui.ts`'s runner now shows a popup (`#demoPopup`, distinct from the caption overlay `#demoCaption`) stating the current ring-coherence % and what Collapse is about to do, and the demo pauses (via `DemoRunner.awaitingCollapseConfirm`) until the player clicks "Collapse now →". Every other transition (seed→freeze) remains a timed auto-advance (`DEMO_MIN_PHASE_FRAMES`). This is a deliberate, informed deviation from "autoplaying," not an oversight — recorded here since it changes what "Clicking 'Show me how' plays the full sequence" (an acceptance criterion) actually means: the sequence now includes one required click partway through.
- **The demo's Collapse uses a wider brush than the real default, by design.** Live testing found that `collapseAt()` at the real default brush (6) only dents the ring's aggregate `consistency` score by a few points — `scoring.ts`'s metric is an aggregate over 180 samples around the whole ring, so a small local gap barely registers, contradicting the demo's own caption ("watch the score fall"). Simulated the actual numbers: brush 6 → 95%, brush 30 (full ring radius) → 68%, brush 60+ (spans the ring's diameter) → ~0% (too extreme, per the user). Settled on `DEMO_COLLAPSE_BRUSH = 42` (`ui.ts`), applied only for the duration of the demo's collapse tick (temporarily overrides `state.brush`, restored immediately after) — knocks the score to roughly half. This is demo-only tuning; it does not change `collapseAt()`, `scoring.ts`, or real gameplay's default brush behavior.
