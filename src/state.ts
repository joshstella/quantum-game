import type { FieldState } from "./types";

const N = 208; // brief #0007: doubled from 104 to stay crisp at the panel-matched display size
const DT = 0.22;
const SIZE = N * N;
const cx = N / 2, cy = N / 2;
const RING_R = 60; // brief #0007: doubled alongside N to keep the ring's on-screen proportions
const RING_W = 4.8;

// stageSizePx is the canvas's actual rendered size in CSS pixels — measured at
// startup from the panel's height (main.ts), since the stage now matches the
// panel rather than a fixed constant. CELL (px per simulation cell) is derived
// from it here, once, since FieldState.CELL is readonly. The 728 default only
// serves callers with no DOM to measure (tests, and any non-browser context).
export function createFieldState(stageSizePx: number = 728): FieldState {
  const CELL = stageSizePx / N;
  return {
    N, CELL, DT, SIZE, cx, cy, RING_R, RING_W,
    R: new Float32Array(SIZE),
    I: new Float32Array(SIZE),
    tR: new Float32Array(SIZE),
    tI: new Float32Array(SIZE),
    frozen: new Uint8Array(SIZE),
    running: true,
    mode: "observe",
    brushShape: "circle",
    brush: 6,
    stepsPerFrame: 3,
    smoothMax: 1e-3,
    dragging: false,
    acc: 0,
  };
}

export function clear(state: FieldState): void {
  state.R.fill(0); state.I.fill(0); state.frozen.fill(0); state.smoothMax = 1e-3;
}

export function seedRing(state: FieldState): void {
  clear(state);
  const { N, cx, cy, RING_R, RING_W, R, I } = state;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy);
    const env = Math.exp(-Math.pow(r - RING_R, 2) / (2 * RING_W * RING_W));
    const ph = Math.atan2(dy, dx); // winding-1 vortex phase
    R[y * N + x] = env * Math.cos(ph);
    I[y * N + x] = env * Math.sin(ph);
  }
}

export function seedInterf(state: FieldState): void {
  clear(state);
  const { N, cx, cy, R } = state;
  // brief #0007 phase 3: offset and falloff doubled/quadrupled alongside
  // RING_R/RING_W (r scales 2x, so r² in the falloff scales 4x) — without
  // this, the pattern renders at roughly half its intended on-screen size.
  const sources: Array<[number, number]> = [[cx - 36, cy], [cx + 36, cy]];
  for (const [sx, sy] of sources)
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const r2 = (x - sx) * (x - sx) + (y - sy) * (y - sy);
      const g = Math.exp(-r2 / 160);
      R[y * N + x] += g; // same phase -> they will interfere
    }
}

export function seedPacket(state: FieldState): void {
  clear(state);
  const { N, cx, cy, R, I } = state;
  // brief #0007 phase 3: offset/falloff scaled the same way as seedInterf
  // above. Momentum k halved (0.9→0.45): it's radians of phase per grid
  // cell, not a size — with the packet's width now doubled in grid cells,
  // halving k keeps the same number of visible fringes across it rather
  // than cramming twice as many into the same relative on-screen space.
  const k = 0.45; // momentum
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const r2 = (x - (cx - 48)) * (x - (cx - 48)) + (y - cy) * (y - cy);
    const g = Math.exp(-r2 / 280);
    R[y * N + x] = g * Math.cos(k * x);
    I[y * N + x] = g * Math.sin(k * x);
  }
}
