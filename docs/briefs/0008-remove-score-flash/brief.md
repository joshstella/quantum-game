# Remove the score threshold flash

**Serial:** #0008 · **Created:** 2026-08-02T17:15:00Z · **Author:** josh.stella@gmail.com · **Depends on:** #0006

## Overview

Brief #0006 added a full-stage colour flash fired when ring coherence crosses one of the
`SCORE_THRESHOLDS` brackets (25/50/75/90), green upward and amber downward. In play the
event carries no information: the thresholds were settled as "round numbers spanning the
range, not tied to any particular gameplay balance" (#0006 ledger), so crossing one does
not correspond to anything a player was trying to do. The flash reads as the game
reacting to itself, and the same numbers are already visible on the coherence meter a
few pixels away.

Remove it. A real goal — something the player is aiming at, whose achievement is worth
announcing — is a separate piece of design work, not a retune of these brackets.

## Goals

- No score-driven flash remains in the running game.
- The two live meters (ring coherence %, held %) keep updating exactly as they do now;
  `scoring.ts`'s `computeScore` is untouched.
- No dead scaffolding left behind "for later" — whatever is removed is removed, and git
  history is the record.

## Scope

Touch points as they stand:

- `src/ui.ts` — `scoreTracker`, `scoreFlash`, `triggerScoreFlash`, the
  `createScoreEventTracker` / `CrossingDirection` import, and the `if (crossing)` call in
  the frame loop. `score()`'s return value exists only to feed the tracker; if nothing
  else consumes it, it goes back to `void`.
- `index.html` — the `#scoreFlash` div.
- `src/styles.css` — `.score-flash`, `.flash-up`, `.flash-down`, and the
  `score-flash-up` / `score-flash-down` keyframes.
- `src/scoreEvents.ts` and `src/tests/scoreEvents.test.ts` — both deleted. The module is
  a threshold-bracket tracker with no remaining caller, and keeping it unwired would
  imply a plan the next goal design may not want; whatever replaces it will likely
  trigger on a different quantity than ring-coherence brackets. Git history holds the
  code if that shape turns out to be right after all.

## Non-goals

- Not designing the replacement goal or its feedback. That is the next brief, and this
  one should not constrain it by leaving a half-wired mechanism in place.
- Not changing scoring itself — no edits to `scoring.ts`, the meters, or the score
  copy in the side panel.
- Not touching the "Show me how" demo (#0005). It drives the same `score()` call and
  will simply stop producing flashes.

## Verification

- `npm run test` and `npm run typecheck` pass with the removed module's tests deleted
  rather than skipped.
- `npm run dev`: run the vortex ring, freeze it with Observe/Zeno up through high
  coherence, then collapse it — the meters move across every former threshold and
  nothing flashes.
- No remaining references: `rg -i 'scoreflash|score-flash|scoreEvent|CrossingDirection'`
  returns nothing outside `docs/`.
