import type { FieldState } from "./types";

// H f = -0.5 * laplacian(f)   (free particle; V=0), Dirichlet edges
export function applyH(N: number, f: Float32Array, out: Float32Array): void {
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = y * N + x;
      const c = f[i];
      const l = x > 0 ? f[i - 1] : 0;
      const r = x < N - 1 ? f[i + 1] : 0;
      const u = y > 0 ? f[i - N] : 0;
      const d = y < N - 1 ? f[i + N] : 0;
      out[i] = -0.5 * (l + r + u + d - 4 * c);
    }
  }
}

// symplectic (semi-implicit) Euler — stable for this Schrodinger form
export function step(state: FieldState): void {
  const { N, DT, SIZE, R, I, tR, tI, frozen } = state;
  applyH(N, I, tI);
  for (let i = 0; i < SIZE; i++) if (!frozen[i]) R[i] += DT * tI[i]; // dR/dt =  H I
  applyH(N, R, tR);
  for (let i = 0; i < SIZE; i++) if (!frozen[i]) I[i] -= DT * tR[i]; // dI/dt = -H R
  // soft absorbing frame so reflections don't pile up
  const b = 3;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const e = Math.min(x, y, N - 1 - x, N - 1 - y);
    if (e < b) { const i = y * N + x; const k = 0.9 + 0.033 * e; R[i] *= k; I[i] *= k; }
  }
}
