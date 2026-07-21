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
- `engine.ts` — `applyH`/`step`, the Schrödinger-style symplectic update.
- `rendering.ts` — `createRenderer(canvas, state)`, canvas draw + hue-for-phase mapping.
- `scoring.ts` — pure `computeScore(state): ScoreResult` (ring coherence, held-state %).
  No DOM access — this is what makes it directly unit-testable.
- `ui.ts` — pointer/button wiring, the RAF loop, and `score()` (a thin wrapper that calls
  `computeScore` and writes the result to the DOM).
- `main.ts` — composition root: `createFieldState()` then `initApp(state)`.

A module that needs a contract shared across boundaries exports it from `types.ts`
(`FieldState`); a module whose contract is local to its own output defines it itself
(`Renderer` in `rendering.ts`, `ScoreResult` in `scoring.ts`).
