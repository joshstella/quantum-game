import type { FieldState } from "./types";

export interface ScoreResult {
  ringCoherencePct: number;
  heldPct: number;
}

function sampleField(state: FieldState, fx: number, fy: number): [number, number] { // bilinear sample of complex field
  const { N, R, I } = state;
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const x1 = Math.min(x0 + 1, N - 1), y1 = Math.min(y0 + 1, N - 1);
  if (x0 < 0 || y0 < 0 || x1 >= N || y1 >= N) return [0, 0];
  const ax = fx - x0, ay = fy - y0;
  const w00 = (1 - ax) * (1 - ay), w10 = ax * (1 - ay), w01 = (1 - ax) * ay, w11 = ax * ay;
  const i00 = y0 * N + x0, i10 = y0 * N + x1, i01 = y1 * N + x0, i11 = y1 * N + x1;
  const re = R[i00] * w00 + R[i10] * w10 + R[i01] * w01 + R[i11] * w11;
  const im = I[i00] * w00 + I[i10] * w10 + I[i01] * w01 + I[i11] * w11;
  return [re, im];
}

export function computeScore(state: FieldState): ScoreResult {
  const { cx, cy, RING_R, R, I, frozen, SIZE, smoothMax } = state;

  // Ring coherence: sample T points round the target ring, measure how
  // smoothly & consistently the phase winds, weighted by amplitude present.
  const T = 180;
  let prevN: [number, number] | null = null;
  let wr = 0, wi = 0; // accumulated phase-step consistency vector
  let magSum = 0, n = 0;
  for (let k = 0; k < T; k++) {
    const a = k / T * 2 * Math.PI;
    const fx = cx + RING_R * Math.cos(a), fy = cy + RING_R * Math.sin(a);
    const [re, im] = sampleField(state, fx, fy);
    const m = Math.hypot(re, im);
    magSum += m; n++;
    if (m < 1e-6) { prevN = null; continue; }
    const ur = re / m, ui = im / m; // unit phase vector
    if (prevN) {
      // relative rotation from previous sample: u * conj(prev)
      const rr = ur * prevN[0] + ui * prevN[1];
      const ii = ui * prevN[0] - ur * prevN[1];
      wr += rr; wi += ii;
    }
    prevN = [ur, ui];
  }
  const consistency = (T > 1) ? Math.hypot(wr, wi) / (T - 1) : 0; // 1 = perfectly regular winding
  const avgMag = magSum / n;
  const presence = Math.min(1, avgMag / (smoothMax * 0.35 + 1e-4)); // is there real amplitude on the ring?
  const ring = Math.max(0, consistency * presence);
  const ringCoherencePct = Math.round(ring * 100);

  // Universe held: fraction of total probability sitting in frozen cells
  let ptot = 0, pfroz = 0;
  for (let i = 0; i < SIZE; i++) { const p = R[i] * R[i] + I[i] * I[i]; ptot += p; if (frozen[i]) pfroz += p; }
  const held = ptot > 1e-9 ? pfroz / ptot : 0;
  const heldPct = Math.round(held * 100);

  return { ringCoherencePct, heldPct };
}
