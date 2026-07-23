import type { BrushShape, FieldState, Mode } from "./types";
import { clear, seedRing, seedInterf, seedPacket } from "./state";
import { step } from "./engine";
import { createRenderer } from "./rendering";
import { computeScore } from "./scoring";

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

// Brush shape masks — pure predicates over an offset (dx,dy) from the brush
// center and the current brush size. `br` doubles as each shape's sizing
// parameter: radius for circle, half-length for the lines, half-width for
// the square outline (brief #0003's proposed design).
export type BrushMask = (dx: number, dy: number, br: number) => boolean;

export function circleMask(dx: number, dy: number, br: number): boolean {
  return Math.hypot(dx, dy) <= br;
}
export function hlineMask(dx: number, dy: number, br: number): boolean {
  return dy === 0 && Math.abs(dx) <= br;
}
export function vlineMask(dx: number, dy: number, br: number): boolean {
  return dx === 0 && Math.abs(dy) <= br;
}
export function squareMask(dx: number, dy: number, br: number): boolean {
  return Math.max(Math.abs(dx), Math.abs(dy)) === br; // outline only, not filled
}

export const BRUSH_MASKS: Record<BrushShape, BrushMask> = {
  circle: circleMask,
  hline: hlineMask,
  vline: vlineMask,
  square: squareMask,
};

function forBrush(state: FieldState, gx: number, gy: number, mask: BrushMask, fn: (i: number, t: number, x: number, y: number) => void): void {
  const { N, brush } = state;
  for (let dy = -brush; dy <= brush; dy++) for (let dx = -brush; dx <= brush; dx++) {
    const x = gx + dx, y = gy + dy;
    if (x < 0 || y < 0 || x >= N || y >= N) continue;
    if (!mask(dx, dy, brush)) continue;
    const rr = Math.hypot(dx, dy);
    fn(y * N + x, rr / brush, x, y);
  }
}

// Exported for direct testing of the mode-based mask selection below —
// forcing circle outside Observe mode is the mechanism that keeps
// Source/Phase tune unaffected by whatever shape is selected.
export function apply(state: FieldState, gx: number, gy: number): void {
  const { R, I, frozen } = state;
  if (state.mode === "source") {
    forBrush(state, gx, gy, BRUSH_MASKS.circle, (i, t) => { const g = Math.exp(-t * t * 2.2) * 0.9; R[i] += g; }); // pour real amplitude
  } else if (state.mode === "observe") {
    forBrush(state, gx, gy, BRUSH_MASKS[state.brushShape], (i) => { frozen[i] = 1; }); // Zeno: pin in place
  } else if (state.mode === "phase") {
    const ang = 0.28;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    forBrush(state, gx, gy, BRUSH_MASKS.circle, (i) => { const re = R[i], im = I[i]; R[i] = re * ca - im * sa; I[i] = re * sa + im * ca; });
  }
}

// Exported for brief #0005's demo runner, which drives the exact same
// destructive-measurement code path a real Collapse click would.
export function collapseAt(state: FieldState, gx: number, gy: number): void {
  // destructive projective measurement: sample one outcome weighted by |psi|^2,
  // localise there, annihilate the rest of the looked-at region.
  // Always circular — collapse isn't Observe, so it's outside brief #0003's scope.
  const { R, I, frozen } = state;
  const cells: Array<[number, number]> = []; let tot = 0;
  forBrush(state, gx, gy, BRUSH_MASKS.circle, (i) => { const p = R[i] * R[i] + I[i] * I[i]; cells.push([i, p]); tot += p; });
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

function score(state: FieldState, els: ScoreElements): void {
  const { ringCoherencePct, heldPct } = computeScore(state);
  els.ringScoreEl.textContent = ringCoherencePct + "%";
  els.ringBar.style.width = ringCoherencePct + "%";
  els.heldScoreEl.textContent = heldPct + "%";
  els.heldBar.style.width = heldPct + "%";
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

  const shapeButtons = document.querySelectorAll<HTMLButtonElement>("[data-brush-shape]");
  function updateShapeButtonsAvailability(): void {
    const enabled = state.mode === "observe";
    shapeButtons.forEach(b => { b.disabled = !enabled; });
  }

  document.querySelectorAll<HTMLButtonElement>(".mode").forEach(b => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".mode").forEach(m => m.classList.remove("on"));
      b.classList.add("on"); state.mode = b.dataset.mode as Mode;
      updateShapeButtonsAvailability();
    });
  });
  shapeButtons.forEach(b => {
    b.addEventListener("click", () => {
      shapeButtons.forEach(m => m.classList.remove("on"));
      b.classList.add("on"); state.brushShape = b.dataset.brushShape as BrushShape;
    });
  });
  updateShapeButtonsAvailability(); // reflects the default mode ("observe") on load

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
