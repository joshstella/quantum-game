import { describe, expect, it } from "vitest";
import { apply, circleMask, hlineMask, squareMask, vlineMask } from "../ui";
import { createFieldState } from "../state";

describe("circleMask", () => {
  it("includes cells within the radius and excludes cells beyond it", () => {
    expect(circleMask(0, 0, 3)).toBe(true);
    expect(circleMask(3, 0, 3)).toBe(true);
    expect(circleMask(0, 3, 3)).toBe(true);
    expect(circleMask(2, 2, 3)).toBe(true); // hypot(2,2) ≈ 2.83 <= 3
    expect(circleMask(3, 3, 3)).toBe(false); // hypot(3,3) ≈ 4.24 > 3
    expect(circleMask(4, 0, 3)).toBe(false);
  });
});

describe("hlineMask", () => {
  it("includes only the center row, within half-length", () => {
    expect(hlineMask(0, 0, 3)).toBe(true);
    expect(hlineMask(3, 0, 3)).toBe(true);
    expect(hlineMask(-3, 0, 3)).toBe(true);
    expect(hlineMask(4, 0, 3)).toBe(false); // beyond half-length
    expect(hlineMask(0, 1, 3)).toBe(false); // off the center row
    expect(hlineMask(2, 1, 3)).toBe(false);
  });
});

describe("vlineMask", () => {
  it("includes only the center column, within half-length", () => {
    expect(vlineMask(0, 0, 3)).toBe(true);
    expect(vlineMask(0, 3, 3)).toBe(true);
    expect(vlineMask(0, -3, 3)).toBe(true);
    expect(vlineMask(0, 4, 3)).toBe(false); // beyond half-length
    expect(vlineMask(1, 0, 3)).toBe(false); // off the center column
    expect(vlineMask(1, 2, 3)).toBe(false);
  });
});

describe("squareMask", () => {
  it("includes only the outline (perimeter) of the square, not its interior", () => {
    // corners and edge midpoints of a half-width-3 square are on the outline
    expect(squareMask(3, 3, 3)).toBe(true); // corner
    expect(squareMask(3, 0, 3)).toBe(true); // right edge midpoint
    expect(squareMask(0, 3, 3)).toBe(true); // bottom edge midpoint
    expect(squareMask(-3, -3, 3)).toBe(true); // opposite corner
    // interior and center are excluded
    expect(squareMask(0, 0, 3)).toBe(false);
    expect(squareMask(1, 1, 3)).toBe(false);
    expect(squareMask(2, 0, 3)).toBe(false);
    // outside the square entirely
    expect(squareMask(4, 0, 3)).toBe(false);
  });
});

describe("apply — mode-based mask selection", () => {
  const idx = (state: ReturnType<typeof createFieldState>, gx: number, gy: number, dx: number, dy: number) =>
    (gy + dy) * state.N + (gx + dx);

  it("honors the selected brush shape only in observe mode", () => {
    const state = createFieldState();
    state.mode = "observe";
    state.brushShape = "square";
    state.brush = 3;

    apply(state, 50, 50);

    expect(state.frozen[idx(state, 50, 50, 3, 3)]).toBe(1); // corner: on the outline
    expect(state.frozen[idx(state, 50, 50, 0, 0)]).toBe(0); // center: interior, excluded
    expect(state.frozen[idx(state, 50, 50, 1, 1)]).toBe(0); // interior, excluded
  });

  it("forces circle in source mode regardless of the selected brush shape", () => {
    const state = createFieldState();
    state.mode = "source";
    state.brushShape = "square"; // deliberately non-circle — must be ignored here
    state.brush = 3;

    apply(state, 50, 50);

    // a square corner (hypot(3,3)≈4.24) sits outside the radius-3 circle,
    // so if source truly ignores brushShape, that cell stays untouched
    expect(state.R[idx(state, 50, 50, 3, 3)]).toBe(0);
    // the center, well within the circle, should have received amplitude
    expect(state.R[idx(state, 50, 50, 0, 0)]).toBeGreaterThan(0);
  });

  it("forces circle in phase mode regardless of the selected brush shape", () => {
    const state = createFieldState();
    state.mode = "phase";
    state.brushShape = "square";
    state.brush = 3;
    const cIdx = idx(state, 50, 50, 3, 3);
    state.R[cIdx] = 1; // give the corner cell something to rotate, if it were touched

    apply(state, 50, 50);

    // phase-tune rotates R/I in place; an untouched cell keeps its seeded value exactly
    expect(state.R[cIdx]).toBe(1);
    expect(state.I[cIdx]).toBe(0);
  });
});
