import type { FieldState, Mode } from "./types";
import { clear, seedRing, seedInterf, seedPacket } from "./state";
import { step } from "./engine";
import { createRenderer } from "./rendering";

interface ScoreElements {
  ringScoreEl: HTMLElement;
  ringBar: HTMLElement;
  heldScoreEl: HTMLElement;
  heldBar: HTMLElement;
}

function toCell(view: HTMLCanvasElement, state: FieldState, ev: PointerEvent): [number, number] {
  const r = view.getBoundingClientRect();
  const x = Math.floor((ev.clientX - r.left) / r.width * state.N);
  const y = Math.floor((ev.clientY - r.top) / r.height * state.N);
  return [x, y];
}

function forBrush(state: FieldState, gx: number, gy: number, fn: (i: number, t: number, x: number, y: number) => void): void {
  const { N, brush } = state;
  for (let dy = -brush; dy <= brush; dy++) for (let dx = -brush; dx <= brush; dx++) {
    const x = gx + dx, y = gy + dy;
    if (x < 0 || y < 0 || x >= N || y >= N) continue;
    const rr = Math.hypot(dx, dy); if (rr > brush) continue;
    fn(y * N + x, rr / brush, x, y);
  }
}

function apply(state: FieldState, gx: number, gy: number): void {
  const { R, I, frozen } = state;
  if (state.mode === "source") {
    forBrush(state, gx, gy, (i, t) => { const g = Math.exp(-t * t * 2.2) * 0.9; R[i] += g; }); // pour real amplitude
  } else if (state.mode === "observe") {
    forBrush(state, gx, gy, (i) => { frozen[i] = 1; }); // Zeno: pin in place
  } else if (state.mode === "phase") {
    const ang = 0.28;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    forBrush(state, gx, gy, (i) => { const re = R[i], im = I[i]; R[i] = re * ca - im * sa; I[i] = re * sa + im * ca; });
  }
}

function collapseAt(state: FieldState, gx: number, gy: number): void {
  // destructive projective measurement: sample one outcome weighted by |psi|^2,
  // localise there, annihilate the rest of the looked-at region.
  const { R, I, frozen } = state;
  const cells: Array<[number, number]> = []; let tot = 0;
  forBrush(state, gx, gy, (i) => { const p = R[i] * R[i] + I[i] * I[i]; cells.push([i, p]); tot += p; });
  if (cells.length === 0) return;
  if (tot < 1e-9) { // nothing there: looking finds vacuum, wipe region
    cells.forEach(([i]) => { R[i] = 0; I[i] = 0; frozen[i] = 0; });
    return;
  }
  let pick = Math.random() * tot, chosen = cells[0][0];
  for (const [i, p] of cells) { pick -= p; if (pick <= 0) { chosen = i; break; } }
  cells.forEach(([i]) => { R[i] = 0; I[i] = 0; frozen[i] = 0; });
  R[chosen] = Math.sqrt(tot); I[chosen] = 0; // reality snaps to one spot
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

// Scoring lives here (not scoring.ts) until phase 3 extracts it into pure,
// directly testable functions — this version still writes straight to the DOM.
function score(state: FieldState, els: ScoreElements): void {
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
  const rpct = Math.round(ring * 100);
  els.ringScoreEl.textContent = rpct + "%";
  els.ringBar.style.width = rpct + "%";

  // Universe held: fraction of total probability sitting in frozen cells
  let ptot = 0, pfroz = 0;
  for (let i = 0; i < SIZE; i++) { const p = R[i] * R[i] + I[i] * I[i]; ptot += p; if (frozen[i]) pfroz += p; }
  const held = ptot > 1e-9 ? pfroz / ptot : 0;
  const hpct = Math.round(held * 100);
  els.heldScoreEl.textContent = hpct + "%";
  els.heldBar.style.width = hpct + "%";
}

export function initApp(state: FieldState): void {
  const view = document.getElementById("view") as HTMLCanvasElement;
  const renderer = createRenderer(view, state);

  const els: ScoreElements = {
    ringScoreEl: document.getElementById("ringScore") as HTMLElement,
    ringBar: document.getElementById("ringBar") as HTMLElement,
    heldScoreEl: document.getElementById("heldScore") as HTMLElement,
    heldBar: document.getElementById("heldBar") as HTMLElement,
  };

  view.addEventListener("pointerdown", e => {
    view.setPointerCapture(e.pointerId); state.dragging = true;
    const [gx, gy] = toCell(view, state, e);
    if (state.mode === "collapse") collapseAt(state, gx, gy); else apply(state, gx, gy);
  });
  view.addEventListener("pointermove", e => {
    if (!state.dragging) return;
    const [gx, gy] = toCell(view, state, e);
    if (state.mode !== "collapse") apply(state, gx, gy); // collapse is a single deliberate click
  });
  view.addEventListener("pointerup", () => { state.dragging = false; });
  view.addEventListener("pointerleave", () => { state.dragging = false; });

  document.querySelectorAll<HTMLButtonElement>(".mode").forEach(b => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".mode").forEach(m => m.classList.remove("on"));
      b.classList.add("on"); state.mode = b.dataset.mode as Mode;
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-seed]").forEach(b => {
    b.addEventListener("click", () => {
      const s = b.dataset.seed;
      if (s === "ring") seedRing(state); else if (s === "interf") seedInterf(state); else seedPacket(state);
    });
  });
  const playBtn = document.getElementById("play") as HTMLButtonElement;
  playBtn.addEventListener("click", () => { state.running = !state.running; playBtn.textContent = state.running ? "⏸ Pause" : "▶ Play"; });
  document.getElementById("clear")!.addEventListener("click", () => clear(state));
  document.getElementById("release")!.addEventListener("click", () => state.frozen.fill(0));
  const brushEl = document.getElementById("brush") as HTMLInputElement, brVal = document.getElementById("brVal") as HTMLElement;
  brushEl.addEventListener("input", () => { state.brush = +brushEl.value; brVal.textContent = String(state.brush); });
  const speedEl = document.getElementById("speed") as HTMLInputElement, spVal = document.getElementById("spVal") as HTMLElement;
  speedEl.addEventListener("input", () => { state.stepsPerFrame = +speedEl.value; spVal.textContent = String(state.stepsPerFrame); });

  function frame(): void {
    if (state.running) for (let s = 0; s < state.stepsPerFrame; s++) step(state);
    renderer.render();
    if ((state.acc++ % 3) === 0) score(state, els);
    requestAnimationFrame(frame);
  }
  seedRing(state);
  frame();
}
