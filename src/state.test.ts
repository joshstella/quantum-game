import { describe, expect, it } from "vitest";
import { clear, createFieldState, seedInterf, seedPacket, seedRing } from "./state";

function magAt(R: Float32Array, I: Float32Array, i: number): number {
  return Math.hypot(R[i], I[i]);
}

describe("clear", () => {
  it("zeroes the field, frozen mask, and smoothMax", () => {
    const state = createFieldState();
    seedRing(state);
    state.frozen[0] = 1;
    state.smoothMax = 5;

    clear(state);

    expect(state.R.every(v => v === 0)).toBe(true);
    expect(state.I.every(v => v === 0)).toBe(true);
    expect(state.frozen.every(v => v === 0)).toBe(true);
    expect(state.smoothMax).toBe(1e-3);
  });
});

describe("seedRing", () => {
  it("peaks near the target ring radius and is near-zero at the center", () => {
    const state = createFieldState();
    seedRing(state);

    const centerIdx = state.cy * state.N + state.cx;
    const ringIdx = state.cy * state.N + Math.round(state.cx + state.RING_R);

    expect(magAt(state.R, state.I, centerIdx)).toBeLessThan(0.01);
    expect(magAt(state.R, state.I, ringIdx)).toBeGreaterThan(0.9);
  });
});

describe("seedInterf", () => {
  it("produces non-zero amplitude at both source centers", () => {
    const state = createFieldState();
    seedInterf(state);

    const leftIdx = state.cy * state.N + Math.round(state.cx - 18);
    const rightIdx = state.cy * state.N + Math.round(state.cx + 18);

    expect(magAt(state.R, state.I, leftIdx)).toBeGreaterThan(0.5);
    expect(magAt(state.R, state.I, rightIdx)).toBeGreaterThan(0.5);
  });
});

describe("seedPacket", () => {
  it("produces non-zero amplitude at the packet center", () => {
    const state = createFieldState();
    seedPacket(state);

    const centerIdx = state.cy * state.N + Math.round(state.cx - 24);

    expect(magAt(state.R, state.I, centerIdx)).toBeGreaterThan(0.5);
  });
});
