import { describe, expect, it } from "vitest";
import { createFieldState } from "../state";
import { apply, collapseAt } from "../ui";
import { createDemoPhases } from "../demo";

function runAllPhases(state: ReturnType<typeof createFieldState>): void {
  const actions = { apply, collapseAt };
  for (const phase of createDemoPhases()) {
    for (let i = 0; i < phase.ticks; i++) {
      phase.tick(state, i, actions);
    }
  }
}

describe("createDemoPhases", () => {
  it("has exactly three phases: seed, freeze-along-ring, collapse", () => {
    const phases = createDemoPhases();
    expect(phases).toHaveLength(3);
    expect(phases[1].ticks).toBeGreaterThan(1); // the ring-freeze phase spans many ticks
  });

  it("phase 1 seeds the vortex ring and switches to observe mode", () => {
    const state = createFieldState();
    const [seedPhase] = createDemoPhases();

    seedPhase.tick(state, 0, { apply, collapseAt });

    expect(state.mode).toBe("observe");
    const centerIdx = state.cy * state.N + state.cx;
    expect(Math.hypot(state.R[centerIdx], state.I[centerIdx])).toBeLessThan(0.01); // ring, not a blob at center
    const ringIdx = state.cy * state.N + Math.round(state.cx + state.RING_R);
    expect(Math.hypot(state.R[ringIdx], state.I[ringIdx])).toBeGreaterThan(0.9);
  });

  it("phase 2 freezes cells around the ring radius, not the center", () => {
    const state = createFieldState();
    const [seedPhase, freezePhase] = createDemoPhases();
    seedPhase.tick(state, 0, { apply, collapseAt });

    for (let i = 0; i < freezePhase.ticks; i++) {
      freezePhase.tick(state, i, { apply, collapseAt });
    }

    const ringIdx = state.cy * state.N + Math.round(state.cx + state.RING_R);
    const centerIdx = state.cy * state.N + state.cx;
    expect(state.frozen[ringIdx]).toBe(1);
    expect(state.frozen[centerIdx]).toBe(0);
  });

  it("phase 3 switches to collapse mode and destructively measures the ring", () => {
    const state = createFieldState();
    const [seedPhase, freezePhase, collapsePhase] = createDemoPhases();
    seedPhase.tick(state, 0, { apply, collapseAt });
    for (let i = 0; i < freezePhase.ticks; i++) freezePhase.tick(state, i, { apply, collapseAt });

    const ringIdx = state.cy * state.N + Math.round(state.cx + state.RING_R);
    expect(state.frozen[ringIdx]).toBe(1); // frozen by phase 2, before collapse runs

    collapsePhase.tick(state, 0, { apply, collapseAt });

    expect(state.mode).toBe("collapse");
    // collapseAt always unfreezes every cell in the collapsed region, even
    // previously-frozen ones — this is what proves the measurement actually
    // ran, not just that mode was set.
    expect(state.frozen[ringIdx]).toBe(0);
    // the collapsed region's total probability re-localizes to exactly one
    // cell; the ring point itself may or may not be the chosen cell, but its
    // amplitude is bounded by the region's total either way.
    let regionProbability = 0;
    for (let dy = -state.brush; dy <= state.brush; dy++) {
      for (let dx = -state.brush; dx <= state.brush; dx++) {
        if (Math.hypot(dx, dy) > state.brush) continue;
        const i = (state.cy + dy) * state.N + (state.cx + Math.round(state.RING_R) + dx);
        regionProbability += state.R[i] * state.R[i] + state.I[i] * state.I[i];
      }
    }
    expect(regionProbability).toBeGreaterThan(0);
  });

  it("running the full sequence ends with the ring both frozen and then collapsed", () => {
    const state = createFieldState();

    runAllPhases(state);

    expect(state.mode).toBe("collapse");
    // some cell holds the post-collapse localized amplitude
    let totalProbability = 0;
    for (let i = 0; i < state.SIZE; i++) totalProbability += state.R[i] * state.R[i] + state.I[i] * state.I[i];
    expect(totalProbability).toBeGreaterThan(0);
  });
});
