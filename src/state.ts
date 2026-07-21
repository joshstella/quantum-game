import type { FieldState } from "./types";

const N = 104;
const CELL = 5;
const DT = 0.22;
const SIZE = N * N;
const cx = N / 2, cy = N / 2;
const RING_R = 30;
const RING_W = 2.4;

export function createFieldState(): FieldState {
  return {
    N, CELL, DT, SIZE, cx, cy, RING_R, RING_W,
    R: new Float32Array(SIZE),
    I: new Float32Array(SIZE),
    tR: new Float32Array(SIZE),
    tI: new Float32Array(SIZE),
    frozen: new Uint8Array(SIZE),
    running: true,
    mode: "observe",
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
  const sources: Array<[number, number]> = [[cx - 18, cy], [cx + 18, cy]];
  for (const [sx, sy] of sources)
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const r2 = (x - sx) * (x - sx) + (y - sy) * (y - sy);
      const g = Math.exp(-r2 / 40);
      R[y * N + x] += g; // same phase -> they will interfere
    }
}

export function seedPacket(state: FieldState): void {
  clear(state);
  const { N, cx, cy, R, I } = state;
  const k = 0.9; // momentum
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const r2 = (x - (cx - 24)) * (x - (cx - 24)) + (y - cy) * (y - cy);
    const g = Math.exp(-r2 / 70);
    R[y * N + x] = g * Math.cos(k * x);
    I[y * N + x] = g * Math.sin(k * x);
  }
}
