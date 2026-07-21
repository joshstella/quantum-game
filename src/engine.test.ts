import { describe, expect, it } from "vitest";
import { createFieldState } from "./state";
import { applyH, step } from "./engine";

describe("applyH", () => {
  it("computes the discrete Laplacian with Dirichlet (zero) edges", () => {
    // 3x3 grid, single unit amplitude at the center, zero elsewhere.
    // f = [0,0,0, 0,1,0, 0,0,0]  (row-major, y*3+x)
    const N = 3;
    const f = new Float32Array([0, 0, 0, 0, 1, 0, 0, 0, 0]);
    const out = new Float32Array(9);

    applyH(N, f, out);

    // center: -0.5*(0+0+0+0-4*1) = 2
    expect(out[4]).toBeCloseTo(2, 5);
    // the four edge-adjacent-to-center cells each see exactly one "1" neighbor
    expect(out[1]).toBeCloseTo(-0.5, 5);
    expect(out[3]).toBeCloseTo(-0.5, 5);
    expect(out[5]).toBeCloseTo(-0.5, 5);
    expect(out[7]).toBeCloseTo(-0.5, 5);
    // corners have no neighbors touching the center
    expect(out[0]).toBeCloseTo(0, 5);
    expect(out[2]).toBeCloseTo(0, 5);
    expect(out[6]).toBeCloseTo(0, 5);
    expect(out[8]).toBeCloseTo(0, 5);
  });
});

describe("step", () => {
  it("leaves frozen cells untouched", () => {
    const state = createFieldState();
    const idx = state.cy * state.N + state.cx;
    state.R[idx] = 1;
    state.I[idx] = 0;
    state.frozen[idx] = 1;

    step(state);

    expect(state.R[idx]).toBe(1);
    expect(state.I[idx]).toBe(0);
  });

  it("propagates amplitude from a seeded cell into its unfrozen neighbor", () => {
    const state = createFieldState();
    const idx = state.cy * state.N + state.cx;
    const neighborIdx = idx - 1; // one cell to the left, well away from the absorbing frame
    state.R[idx] = 1;

    step(state);

    // dR/dt = H I is zero on the first step (I starts at zero everywhere),
    // but dI/dt = -H R already picks up the neighbor's Laplacian contribution.
    expect(state.I[neighborIdx]).toBeCloseTo(0.11, 4);
  });
});
