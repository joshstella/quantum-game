import type { BrushShape, FieldState, Mode } from "./types";
import { clear, seedRing, seedInterf, seedPacket } from "./state";
import { step } from "./engine";
import { createRenderer } from "./rendering";
import { computeScore } from "./scoring";
import { createDemoPhases, type DemoPhase } from "./demo";

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

// 4 frames/tick @ 60fps ~= 40 ring-freeze ticks in ~2.7s, matching the
// brief's "~2-3 seconds, similar to a natural human drag" pacing default.
const DEMO_TICK_EVERY_N_FRAMES = 4;
// Single-tick phases (seed, collapse) would otherwise render and advance in
// the same instant — too fast to read the caption or see the effect. Every
// phase holds for at least this long before the runner moves on.
const DEMO_MIN_PHASE_FRAMES = 90;
// createDemoPhases() (demo.ts) always returns exactly [seed, freeze, collapse]
// — asserted by phase 1's own unit tests. This is the collapse phase's fixed
// index, where the runner pauses for the player's explicit confirmation
// rather than the timed dwell every other phase transition uses.
const COLLAPSE_PHASE_INDEX = 2;
// Roughly 1.4x RING_R (state.ts): wide enough to knock the ring's coherence
// down by about half (a local, default-size brush only dents it a few
// points; the full ring diameter wipes it to ~0, which read as too extreme).
// Scaled alongside RING_R's brief #0007 doubling (30→60) to keep the same
// relative effect: 42→84.
const DEMO_COLLAPSE_BRUSH = 84;

interface DemoRunner {
  active: boolean;
  phases: DemoPhase[];
  phaseIndex: number;
  tickIndex: number;
  frameCount: number;
  phaseFrameCount: number;
  awaitingCollapseConfirm: boolean; // blocks auto-advance until the popup's button is clicked
  wasRunning: boolean; // state.running before the demo forced it on, restored after
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
    // A real interaction always wins over the demo: cancel it and consume
    // this click as the cancel, rather than also applying it as a draw —
    // the brief calls out state leakage (mode/UI left out of sync) as the
    // biggest risk here, so cancellation must fully resync, not just stop.
    if (demo.active) { endDemo(); return; }
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
  const clearBtn = document.getElementById("clear") as HTMLButtonElement;
  clearBtn.addEventListener("click", () => clear(state));
  const releaseBtn = document.getElementById("release") as HTMLButtonElement;
  releaseBtn.addEventListener("click", () => state.frozen.fill(0));
  const brushEl = document.getElementById("brush") as HTMLInputElement, brVal = document.getElementById("brVal") as HTMLElement;
  brushEl.addEventListener("input", () => { state.brush = +brushEl.value; brVal.textContent = String(state.brush); });
  const speedEl = document.getElementById("speed") as HTMLInputElement, spVal = document.getElementById("spVal") as HTMLElement;
  speedEl.addEventListener("input", () => { state.stepsPerFrame = +speedEl.value; spVal.textContent = String(state.stepsPerFrame); });

  // --- "Show me how" demo runner (brief #0005) ---
  // Steps through demo.ts's DemoPhase[] on the same RAF loop as real gameplay,
  // driving apply()/collapseAt() above — never a separate simulated result.
  const demoActions = { apply, collapseAt };
  const demoBtn = document.getElementById("showMeHow") as HTMLButtonElement;
  const demoCaption = document.getElementById("demoCaption") as HTMLElement;
  const demoPopup = document.getElementById("demoPopup") as HTMLElement;
  const demoPopupPct = document.getElementById("demoPopupPct") as HTMLElement;
  const demoPopupContinue = document.getElementById("demoPopupContinue") as HTMLButtonElement;
  const demo: DemoRunner = {
    active: false, phases: [], phaseIndex: 0, tickIndex: 0, frameCount: 0, phaseFrameCount: 0,
    awaitingCollapseConfirm: false, wasRunning: true,
  };

  // Reflects state.mode onto the mode buttons' .on class — needed after a
  // demo phase changes state.mode directly (bypassing the button click
  // handler above), so the UI doesn't drift out of sync with state.
  function syncModeButtonUI(): void {
    document.querySelectorAll<HTMLButtonElement>(".mode").forEach(b => {
      b.classList.toggle("on", b.dataset.mode === state.mode);
    });
    updateShapeButtonsAvailability();
  }

  function setControlsDisabled(disabled: boolean): void {
    document.querySelectorAll<HTMLButtonElement>(".mode, [data-seed], [data-brush-shape]")
      .forEach(b => { b.disabled = disabled; });
    playBtn.disabled = disabled;
    clearBtn.disabled = disabled;
    releaseBtn.disabled = disabled;
    brushEl.disabled = disabled;
    speedEl.disabled = disabled;
    demoBtn.disabled = disabled;
    if (!disabled) updateShapeButtonsAvailability(); // re-gate by mode rather than force-enable
  }

  // collapseAt() reads state.brush; widen it just for the collapse phase's
  // tick so it spans the whole ring (a local, default-size brush only dents
  // the ring's aggregate coherence score by a few points — not dramatic).
  // Restored immediately after, so it never leaks into real gameplay.
  function fireDemoTick(phase: DemoPhase): void {
    if (demo.phaseIndex !== COLLAPSE_PHASE_INDEX) {
      phase.tick(state, demo.tickIndex, demoActions);
      return;
    }
    const realBrush = state.brush;
    state.brush = DEMO_COLLAPSE_BRUSH;
    phase.tick(state, demo.tickIndex, demoActions);
    state.brush = realBrush;
  }

  function runDemoTick(): void {
    const phase = demo.phases[demo.phaseIndex];
    demoCaption.textContent = phase.caption; // shows before the phase's first tick fires, so its action isn't a surprise
    // The phase's own first tick (e.g. the destructive Collapse) waits out the
    // same dwell too — otherwise it fires the instant the prior phase's hold
    // ends, with no visible beat between "ring fully frozen" and "collapsed".
    // Phase 0 is exempt: nothing precedes it, so its tick fires immediately.
    const readyForFirstTick = demo.phaseIndex === 0 || demo.phaseFrameCount >= DEMO_MIN_PHASE_FRAMES;
    if (demo.tickIndex < phase.ticks && (demo.tickIndex > 0 || readyForFirstTick)) {
      fireDemoTick(phase);
      syncModeButtonUI(); // phase.tick() can change state.mode directly; keep the buttons live, not just on end
      demo.tickIndex++;
    }
    // Hold on the phase's final state for DEMO_MIN_PHASE_FRAMES even after its
    // ticks are exhausted, so a single-tick phase's caption/effect is readable.
    if (demo.tickIndex >= phase.ticks && demo.phaseFrameCount >= DEMO_MIN_PHASE_FRAMES) {
      demo.phaseIndex++;
      demo.tickIndex = 0;
      demo.phaseFrameCount = 0;
      if (demo.phaseIndex >= demo.phases.length) { endDemo(); return; }
      demoCaption.textContent = demo.phases[demo.phaseIndex].caption;
      if (demo.phaseIndex === COLLAPSE_PHASE_INDEX) showCollapseConfirmPopup();
    }
  }

  // Live, not a one-time snapshot: the field keeps evolving under the pause
  // (state.running is forced on), so a fixed percentage read at the moment
  // the popup opens would drift out of sync with the score panel by the
  // time the player actually reads it.
  function updateCollapseConfirmPopupText(): void {
    const { ringCoherencePct } = computeScore(state);
    demoPopupPct.textContent = ringCoherencePct + "%";
  }

  // Blocks auto-advance until the player explicitly confirms — the one
  // deliberate pause point in an otherwise autoplaying demo, so the
  // destructive step is never a surprise.
  function showCollapseConfirmPopup(): void {
    demo.awaitingCollapseConfirm = true;
    updateCollapseConfirmPopupText();
    demoPopup.hidden = false;
  }

  demoPopupContinue.addEventListener("click", () => {
    demo.awaitingCollapseConfirm = false;
    demoPopup.hidden = true;
    demo.phaseFrameCount = DEMO_MIN_PHASE_FRAMES; // the click is the confirmation the timed dwell would otherwise wait for
  });

  function endDemo(): void {
    demo.active = false;
    demo.awaitingCollapseConfirm = false;
    demoCaption.hidden = true;
    demoPopup.hidden = true;
    setControlsDisabled(false);
    syncModeButtonUI();
    state.running = demo.wasRunning;
    playBtn.textContent = state.running ? "⏸ Pause" : "▶ Play";
  }

  demoBtn.addEventListener("click", () => {
    demo.active = true;
    demo.phases = createDemoPhases();
    demo.phaseIndex = 0;
    demo.tickIndex = 0;
    demo.frameCount = 0;
    demo.phaseFrameCount = 0;
    demo.wasRunning = state.running;
    demo.awaitingCollapseConfirm = false;
    state.running = true; // the demo's coherence-climb narrative depends on step() actually running
    playBtn.textContent = "⏸ Pause";
    setControlsDisabled(true);
    demoCaption.hidden = false;
    runDemoTick(); // first tick fires immediately, no visible startup delay
  });

  function frame(): void {
    if (state.running) for (let s = 0; s < state.stepsPerFrame; s++) step(state);
    if (demo.active && !demo.awaitingCollapseConfirm) {
      demo.frameCount++;
      demo.phaseFrameCount++;
      if (demo.frameCount % DEMO_TICK_EVERY_N_FRAMES === 0) runDemoTick();
    } else if (demo.awaitingCollapseConfirm) {
      updateCollapseConfirmPopupText();
    }
    renderer.render();
    if ((state.acc++ % 3) === 0) score(state, els);
    requestAnimationFrame(frame);
  }
  seedRing(state);
  frame();
}
