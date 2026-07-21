# Refactor the single-file Quantum Life prototype into a structured web app

**Serial:** #0002 · **Created:** 2026-07-21T21:27:46Z · **Author:** josh.stella@gmail.com · **Depends on:** —

## Overview

The current prototype lives in a single HTML file that mixes markup, styles, simulation logic, rendering, scoring, and UI wiring. That makes the behavior hard to evolve, test, and reason about. This work will turn it into a small but well-structured program with clear modules, typed boundaries, and a straightforward development workflow.

## Goals

- Preserve the existing interactive experience and core physics model.
- Split the implementation into discrete modules with clear responsibilities.
- Introduce a simple build/tooling setup that supports modern web development.
- Add tests for simulation and scoring logic so behavior is guarded as the app evolves.
- Keep the initial refactor focused on structure and maintainability rather than adding new gameplay features.

## Non-goals

- Reworking the underlying quantum metaphor or inventing a new simulation model.
- Adding a large feature set beyond the existing controls, seeds, scoring, and canvas interaction.
- Over-abstracting the codebase before the initial modular structure is proven.

## Proposed structure

A practical starting point is:

- index.html for the document shell
- src/main.ts as the entry point
- src/types.ts for shared interfaces and types
- src/state.ts for field state and initialization
- src/engine.ts for the Schrödinger-style update step
- src/rendering.ts for canvas drawing and overlay rendering
- src/scoring.ts for ring coherence and held-state scoring
- src/ui.ts for control wiring and DOM interaction
- src/styles.css for presentation

If the project stays intentionally small, a Vite + TypeScript setup is the best fit: it keeps the app easy to run locally while allowing proper module boundaries and type checking.

## Implementation plan

### Phase 1: establish the scaffold

- Create a simple Vite + TypeScript project structure.
- Move the current HTML/CSS/JS into the new module layout without changing behavior.
- Preserve the current UI labels, controls, and seeded states.

### Phase 2: extract core behavior

- Move the field array logic, update step, and seed functions into dedicated modules.
- Keep the simulation loop and interaction model intact while separating concerns.
- Keep comments focused on the why behind non-obvious behavior, not on obvious code.

### Phase 3: improve testability

- Extract pure logic for scoring and field initialization into functions that can be tested directly.
- Add unit tests for at least the main scoring and seed behaviors.
- Keep the test surface small and valuable rather than broad and brittle.

### Phase 4: polish and verify

- Ensure the refactored app still renders correctly and responds to the same controls.
- Check that the code remains readable and that module boundaries are meaningful.
- Document the project structure in the repository so future work is easier to extend.

## Acceptance criteria

- The app runs from a structured project layout rather than a single inline script.
- The UI behavior remains functionally equivalent to the current prototype.
- Core simulation and scoring code is organized into separate modules.
- Type checking and tests are in place for the extracted logic.
- The refactor is understandable at a glance for the next contributor.

## Risks and notes

- The current file is compact and self-contained, so the main risk is over-splitting too early.
- The first refactor should prioritize clean boundaries over clever abstractions.
- Any new tooling should remain lightweight enough that the project still feels approachable.
