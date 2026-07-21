import { describe, expect, it } from "vitest";
import { createFieldState, seedRing } from "./state";
import { computeScore } from "./scoring";

describe("computeScore", () => {
  it("reports near-zero ring coherence and zero held on an empty field", () => {
    const state = createFieldState();

    const result = computeScore(state);

    expect(result.ringCoherencePct).toBe(0);
    expect(result.heldPct).toBe(0);
  });

  it("reports high ring coherence for a clean winding-1 vortex ring", () => {
    const state = createFieldState();
    seedRing(state);

    const result = computeScore(state);

    expect(result.ringCoherencePct).toBeGreaterThan(90);
  });

  it("reports 100% held when every cell is frozen", () => {
    const state = createFieldState();
    seedRing(state);
    state.frozen.fill(1);

    const result = computeScore(state);

    expect(result.heldPct).toBe(100);
  });

  it("reports near-zero held when only a low-amplitude region is frozen", () => {
    const state = createFieldState();
    seedRing(state);
    // the field center sits far from the seeded ring, so amplitude there is ~0
    state.frozen[state.cy * state.N + state.cx] = 1;

    const result = computeScore(state);

    expect(result.heldPct).toBeLessThan(5);
  });
});
