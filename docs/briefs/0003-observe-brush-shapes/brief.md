# Add selectable brush shapes to Observe (Zeno-hold) mode

**Serial:** #0003 · **Created:** 2026-07-22T00:15:44Z · **Author:** josh.stella@gmail.com · **Depends on:** —

## Overview

Right now every brush-based interaction — Source, Phase tune, and Observe — uses the same
circular brush mask (`forBrush` in `src/ui.ts`, radius-gated by `Math.hypot(dx,dy) <=
brush`). This brief adds a small menu of alternate brush shapes for Observe mode
specifically: horizontal line, vertical line, and a hollow square outline (its perimeter,
not its filled interior), alongside the existing circle. The shape only changes which
cells get frozen when the player drags in Observe mode — it does not change Source or
Phase tune's brushes, and it does not change the freeze/hold mechanic itself.

## Goals

- Let the player pick a brush shape (circle, horizontal line, vertical line, square
  outline) that determines which cells `forBrush` selects while in Observe mode.
- Keep Source and Phase tune's brush behavior exactly as it is today — circular, always —
  regardless of which shape is selected for Observe.
- Keep the shape set small and reuse the existing `brush` size slider as each shape's
  sizing parameter (radius for circle, half-length for the lines, half-width for the
  square), rather than adding per-shape size controls.

## Non-goals

- Not touching Source or Phase tune's brush shape — they stay circular. If that's ever
  wanted, it's a separate brief.
- Not building a generic, arbitrarily-extensible shape/plugin system. Four shapes, a
  closed union type, no runtime registration.
- Not changing the Zeno-hold mechanic itself (what freezing does) — only which cells a
  drag touches.
- Not persisting the chosen shape across sessions (no localStorage/settings) — session
  state only, same as brush size and mode already are.

## Open decisions

- **Diagonal/other shapes ("etc.").** The request mentioned "etc." after listing three
  shapes. This brief scopes to exactly four (circle, horizontal line, vertical line,
  square outline) and treats the shape union as closed for this brief. Additional shapes
  (diagonal line, diamond, ring) are explicitly deferred — flag if any of these should be
  in scope now rather than a follow-up brief.
- **UI placement.** Proposed: a new control group ("Brush shape") in the instrument
  panel, visible only when Observe mode is the active mode (hidden/disabled otherwise,
  mirroring how the mode buttons themselves toggle `.on`). Alternative: always show it,
  disabled (greyed out) rather than hidden, when a different mode is active. Needs a
  call before phase 2 (UI wiring) starts.

## Proposed design

- `src/types.ts`: add `BrushShape = "circle" | "hline" | "vline" | "square"` and a
  `brushShape: BrushShape` field on `FieldState` (defaults to `"circle"`).
- `src/ui.ts`: `forBrush` gains a per-shape mask predicate. When `state.mode === "observe"`,
  the active predicate is `state.brushShape`'s; for every other mode, the predicate is
  always the circle mask, regardless of what `state.brushShape` is currently set to (this
  is the mechanism that keeps Source/Phase tune unaffected per the non-goals above).
- New UI buttons (mirroring the existing `.mode`/`data-seed` button pattern) with
  `data-brush-shape` attributes, wired the same way mode buttons are, but shown only while
  Observe is active.

## Implementation plan

### Phase 1: brush-shape core logic

- Add `BrushShape` type and `FieldState.brushShape` field.
- Implement the four mask predicates as small, pure, directly testable functions.
- Unit tests: for a fixed brush size, each shape selects the expected cell set (spot-check
  a handful of `(dx,dy)` offsets per shape — inside vs. outside the mask).

### Phase 2: UI wiring and verification

- Add the brush-shape control group and button wiring in `ui.ts`/`index.html`.
- Resolve the UI-placement open decision above before starting.
- Manual verification: Playwright pass confirming each shape freezes the expected cells
  when dragged in Observe mode, and that Source/Phase tune are visibly unaffected by
  whatever shape is selected.

## Acceptance criteria

- Selecting a shape in Observe mode changes which cells freeze on drag, matching that
  shape's mask.
- Source and Phase tune modes are behaviorally identical to before this brief, regardless
  of the selected brush shape.
- Unit tests cover all four shape masks.
- The feature is verified running in the browser, not just type-checked.

## Risks and notes

- The biggest risk is scope creep into a general shape system — the closed 4-shape union
  and the explicit non-goal against a plugin system are meant to guard against that.
- `forBrush`'s existing radius-based iteration (`for dy in -br..br, dx in -br..br`) already
  bounds the search box correctly for the square and line shapes, not just the circle — no
  change needed there, only the inclusion predicate changes.
