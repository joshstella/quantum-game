import { describe, expect, it } from "vitest";
import type { FieldState } from "./types";
import { createFieldState, seedRing } from "./state";
import { computeScore } from "./scoring";

// A ring with real amplitude but a winding direction that flips at x=0 —
// present but phase-incoherent, distinct from both "no signal" and "clean winding".
function seedIncoherentRing(state: FieldState): void {
  const { N, cx, cy, RING_R, RING_W, R, I } = state;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy);
    const env = Math.exp(-Math.pow(r - RING_R, 2) / (2 * RING_W * RING_W));
    const winding = dx >= 0 ? 1 : -1;
    const ph = winding * Math.atan2(dy, dx);
    R[y * N + x] = env * Math.cos(ph);
    I[y * N + x] = env * Math.sin(ph);
  }
}

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

  it("reports mid-range ring coherence when amplitude is present but winding is inconsistent", () => {
    const clean = createFieldState();
    seedRing(clean);
    const cleanScore = computeScore(clean);

    const incoherent = createFieldState();
    seedIncoherentRing(incoherent);
    const incoherentScore = computeScore(incoherent);

    // amplitude is present (not the "no signal" case), but the winding-direction
    // flip should cost real coherence relative to a clean, single-direction ring.
    expect(incoherentScore.ringCoherencePct).toBeGreaterThan(0);
    expect(incoherentScore.ringCoherencePct).toBeLessThan(cleanScore.ringCoherencePct);
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
