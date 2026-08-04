# Root README and MIT license

**Serial:** #0009 · **Created:** 2026-08-04T16:17:30Z · **Author:** josh.stella@gmail.com · **Depends on:** —

## Overview

The GitHub repo has no root `README.md` and no license file. Visitors (and clone-and-run
contributors) get no product pitch, no run instructions, and no clear permission to use
the code. Add both: a focused README that presents **Observers** (the in-app name) and
an MIT `LICENSE` so the repo is usable and citable.

`CLAUDE.md` and `docs/briefs/` already hold process and architecture detail for agents
and maintainers. The README is for humans landing on the repo — short, accurate, and
runnable in a few minutes.

## Goals

- A root `README.md` that a first-time visitor can skim and run from.
- An MIT `LICENSE` at the repo root, with copyright holder and year filled in (not a
  placeholder).
- README and license linked: a one-line License section in the README that points at
  `LICENSE`.
- No drift into process docs — briefs, skills, and agent workflow stay out of the
  README unless one sentence of "this repo uses briefs under `docs/briefs/`" helps a
  human find them.

## Scope

### `LICENSE`

- Standard MIT text at repo root as `LICENSE` (no extension).
- Copyright line: year `2026`, holder from git/`package.json` author context —
  assume **Josh Stella** / the email already on briefs unless the author corrects
  this at execution. Ask rather than guess if ambiguous at `/start-brief` time.

### `README.md`

Contents, in roughly this order (tighten copy at execution; this is the outline, not
final prose):

1. **Title + one-liner** — lead with **Observers**, not the package name
   `quantum-game`. One sentence: interactive toy quantum wavefunction / field you
   shape by observing, collapsing, sourcing, and phase-tuning.
2. **What it is** — short paragraph: complex amplitudes on a grid; brightness =
   magnitude, hue = phase; Schrödinger-style symplectic update; Observe/Zeno freeze,
   Collapse measure, Source, Phase tune. Mention the "Show me how" demo.
3. **Screenshot or GIF** — optional if an asset already exists or is trivial to
   capture; do not block the brief on polished marketing media. If none, leave a
   clear place for one later rather than inventing a fake image.
4. **Requirements** — Node.js (note a reasonable current LTS floor if known from the
   toolchain; otherwise "recent Node" + `npm`).
5. **Run locally**
   ```bash
   npm install
   npm run dev
   ```
   Plus `npm run build` / `npm run test` / `npm run typecheck` as a short secondary
   list, not a wall of scripts.
6. **Controls (cheat sheet)** — compact: modes (Observe, Collapse, Source, Phase),
   seeds (vortex ring, two sources, packet), brush / speed, Show me how. Point at the
   in-app panel rather than duplicating every label.
7. **Stack** — Vite + TypeScript, no framework; vitest for tests. One line is enough.
8. **License** — MIT; link to `LICENSE`.

Touch points:

- New: `README.md`, `LICENSE`
- Possibly: `package.json` `"license": "MIT"` if unset (it is unset today) so npm
  metadata matches the file — small, in-scope.

## Non-goals

- Not rewriting `CLAUDE.md` or the briefs README.
- Not adding CONTRIBUTING.md, CODE_OF_CONDUCT, or GitHub templates unless they fall
  out for free; out of scope here.
- Not changing app UI, copy, or gameplay.
- Not publishing to npm or setting up GitHub Pages hosting docs.
- Not a long architecture tour — module layout stays in `CLAUDE.md` / brief #0002.

## Settled decisions

- License is **MIT** (user request).
- Product name in the README is **Observers**; repo/package name `quantum-game` may
  appear once as the clone directory / package name.
- README stays human-facing and short; agent/process detail stays elsewhere.

## Open decisions

- Exact copyright holder string on the MIT line (name vs. email vs. both) — confirm at
  execution if not already obvious from git author.
- Whether to include a screenshot in the same PR or leave a follow-up — prefer include
  only if capture is cheap; otherwise ship text + license first.

## Verification

- `LICENSE` is present, MIT-shaped, with a filled copyright line (no `TODO` /
  `<year>` placeholders).
- `README.md` renders sanely on GitHub (headings, fenced commands, relative link to
  `LICENSE`).
- From a clean clone mindset: `npm install && npm run dev` instructions match what
  actually works (`package.json` scripts).
- `package.json` `"license"` is `"MIT"` if that field is added.
- No product claims the app does not support (e.g. don't invent multiplayer or a
  published URL).
