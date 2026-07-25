# CLAUDE.md

Project instructions for Claude Code. Adapt the project-specific sections below to this
repo; the process rules in the first section apply unchanged.

## Process — use the skills, don't go around them

This repo uses the claude-process-automation workflow. The installed skills are the gates;
bypassing them is the defect.

- **`/commit-push-pr`** — the only path to `main`. It runs the review gate before
  committing. Never use raw `git commit && git push` for work headed to `main`.
- **`/review-pr`** — called automatically by `/commit-push-pr`. Can also be run manually
  on a PR number or the staged diff.
- **`/create-brief`** — file a draft into `docs/briefs/`. Non-trivial work gets a brief
  before it starts, not after.
- **`/start-brief` / `/next-brief-phase`** — initiate and continue phased work.
- **`/chronicle`** — generate a narrative history from briefs, ledgers, and git. Run when
  you want the story of how the codebase got here.
- **`/init-briefs`** — one-time setup. Already run if `docs/briefs/` exists.

## Working style

- **Direct challenge over affirmation.** Say when something is wrong and why. Skip
  flattery and padding.
- **Surface friction, don't smooth it.** If two goals conflict or a requirement is
  incoherent, name the tension — that's the useful signal.
- **One change at a time.** Single fix, shown, waited on. If a task implies many edits,
  propose the sequence first.
- **Ask rather than guess** on judgment calls that turn on intent or domain knowledge.
  Mark every assumption inline so it can be corrected.

## Tests

Tests gate `main`. Code merges to `main` only with tests covering it — unit for logic,
integration across boundaries — run and passing. Write them as you go. A genuinely
untestable merge (pure config, generated boilerplate) gets an explicit "test-exempt
because…" in the PR, not a silent gap.

## Code style

- Strongly typed at every boundary. No `any`. Explicit named exported interfaces.
- Generate types from schemas (JSON Schema, DB schema) rather than hand-writing parallel
  interfaces that can drift.
- Comment the *why*, not the *what*. A non-obvious constraint or workaround is worth a
  comment; what the code does is already in the code.
- No speculative abstractions. No error handling for scenarios that can't happen.

## Project-specific

**Stack:** Vite + TypeScript, no framework. `strict: true`, no test-runner-specific
tsconfig split — `vitest` picks up the same `tsconfig.json`.

```bash
npm run dev        # dev server (Vite)
npm run build       # tsc -b && vite build
npm run typecheck   # tsc -b --noEmit
npm run test        # vitest run
```

**Module layout** (`src/`), a `quantum-life.html` single-file prototype split into typed
modules — see `docs/briefs/0002-quantum-life-structured-refactor/`:

- `types.ts` — `Mode`, `FieldState`. `FieldState` is the single explicit boundary object
  every other module below takes as a parameter, rather than closing over shared globals.
- `state.ts` — allocates `FieldState`, plus `clear`/`seedRing`/`seedInterf`/`seedPacket`.
  `createFieldState(stageSizePx)` derives `CELL` (px per grid cell) from the caller-supplied
  stage size rather than a fixed constant, since `CELL` is `readonly` and can only be set
  once, at construction — `stageSizePx` defaults to 728 for callers with no DOM to measure
  (tests, any non-browser context).
- `engine.ts` — `applyH`/`step`, the Schrödinger-style symplectic update.
- `rendering.ts` — `createRenderer(canvas, state)`, canvas draw + hue-for-phase mapping.
- `scoring.ts` — pure `computeScore(state): ScoreResult` (ring coherence, held-state %).
  No DOM access — this is what makes it directly unit-testable.
- `demo.ts` — `createDemoPhases(): DemoPhase[]`, the "Show me how" self-playing
  walkthrough's DOM-free phase sequence (seed vortex ring → freeze along the ring →
  one destructive collapse). Each phase's `tick()` takes an injected `DemoActions`
  (`{ apply, collapseAt }`) rather than importing `ui.ts` directly — `ui.ts`'s demo
  runner imports `demo.ts` to drive it, so the reverse import would be a cycle.
- `scoreEvents.ts` — `createScoreEventTracker(): ScoreEventTracker`, a DOM-free
  `.check(pct)` tracker over a fixed set of ring-coherence thresholds. Reports at most
  one crossing direction (`"up"`/`"down"`) per call, debounced via discrete brackets
  rather than a fixed prior value — its first `.check()` call always seeds the
  starting bracket instead of firing, so a page load never reports a spurious crossing.
- `ui.ts` — pointer/button wiring, the RAF loop, `score()` (a thin wrapper that calls
  `computeScore`, writes the result to the DOM, and returns the ring % so the caller can
  feed a `ScoreEventTracker` without recomputing `computeScore`), a full-canvas flash
  triggered by that tracker's crossings, and the "Show me how" demo runner (steps
  through `demo.ts`'s phases on the same RAF loop, driving the same
  `apply()`/`collapseAt()` a real drag would — never a separate simulated result, and
  the score flash fires from real gameplay and the demo alike since both go through the
  same `score()` call).
- `main.ts` — composition root: measures `.panel`'s rendered height, sizes the canvas to
  match (the stage scales to the panel, not a fixed constant), then
  `createFieldState(stageSizePx)` and `initApp(state)`.

A module that needs a contract shared across boundaries exports it from `types.ts`
(`FieldState`); a module whose contract is local to its own output defines it itself
(`Renderer` in `rendering.ts`, `ScoreResult` in `scoring.ts`).

Unit tests live in `src/tests/` (`engine.test.ts`, `scoring.test.ts`, `state.test.ts`),
one level below the modules they cover — `vitest` discovers them there without any
config change.
