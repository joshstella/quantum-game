// ---------- field ----------
const N = 104; // grid cells per side
const CELL = 5; // display px per cell (N*CELL = 520)
const DT = 0.22; // evolution step
const SIZE = N * N;
const cx = N / 2, cy = N / 2;
const RING_R = 30; // target ring radius (cells)
const RING_W = 2.4; // ring thickness for seeding

const R = new Float32Array(SIZE); // real part of amplitude
const I = new Float32Array(SIZE); // imaginary part
const tR = new Float32Array(SIZE); // scratch: H applied to R
const tI = new Float32Array(SIZE); // scratch: H applied to I
const frozen = new Uint8Array(SIZE); // Zeno-held cells
let running = true;
type Mode = "observe" | "collapse" | "source" | "phase";
let mode: Mode = "observe";
let brush = 6;
let stepsPerFrame = 3;
let smoothMax = 1e-3; // running peak for auto-brightness

// H f = -0.5 * laplacian(f)   (free particle; V=0), Dirichlet edges
function applyH(f: Float32Array, out: Float32Array): void {
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
function step(): void {
  applyH(I, tI);
  for (let i = 0; i < SIZE; i++) if (!frozen[i]) R[i] += DT * tI[i]; // dR/dt =  H I
  applyH(R, tR);
  for (let i = 0; i < SIZE; i++) if (!frozen[i]) I[i] -= DT * tR[i]; // dI/dt = -H R
  // soft absorbing frame so reflections don't pile up
  const b = 3;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const e = Math.min(x, y, N - 1 - x, N - 1 - y);
    if (e < b) { const i = y * N + x; const k = 0.9 + 0.033 * e; R[i] *= k; I[i] *= k; }
  }
}

// ---------- render ----------
const view = document.getElementById("view") as HTMLCanvasElement;
const vctx = view.getContext("2d")!;
const off = document.createElement("canvas"); off.width = N; off.height = N;
const octx = off.getContext("2d")!;
const img = octx.createImageData(N, N);
const buf = img.data;
vctx.imageSmoothingEnabled = false;

function hueToRGB(h: number): [number, number, number] { // h in [0,1) -> full-sat rgb at L=0.5
  const k = h * 6;
  const x = 1 - Math.abs(k % 2 - 1);
  let r = 0, g = 0, b = 0;
  if (k < 1) { r = 1; g = x; } else if (k < 2) { r = x; g = 1; } else if (k < 3) { g = 1; b = x; }
  else if (k < 4) { g = x; b = 1; } else if (k < 5) { r = x; b = 1; } else { r = 1; b = x; }
  return [r, g, b];
}

function render(): void {
  // running peak amplitude, eased, so brightness auto-scales
  let mx = 1e-4;
  for (let i = 0; i < SIZE; i++) { const m = R[i] * R[i] + I[i] * I[i]; if (m > mx) mx = m; }
  mx = Math.sqrt(mx);
  smoothMax += (mx - smoothMax) * 0.08;
  const scale = 1 / Math.max(smoothMax, 1e-3);

  for (let i = 0; i < SIZE; i++) {
    const re = R[i], im = I[i];
    let mag = Math.sqrt(re * re + im * im) * scale;
    if (mag > 1) mag = 1;
    const val = Math.pow(mag, 0.75); // gamma for visible faint structure
    let hue = Math.atan2(im, re) / (2 * Math.PI); if (hue < 0) hue += 1;
    const [r, g, b] = hueToRGB(hue);
    const L = 0.55 * val;
    let rr = r * L, gg = g * L, bb = b * L;
    if (frozen[i]) { rr = rr * 0.75 + 0.22; gg = gg * 0.75 + 0.24; bb = bb * 0.75 + 0.28; } // pinned = frosted
    const p = i * 4;
    buf[p] = (rr * 255) | 0;
    buf[p + 1] = (gg * 255) | 0;
    buf[p + 2] = (bb * 255) | 0;
    buf[p + 3] = 255;
  }
  octx.putImageData(img, 0, 0);
  vctx.drawImage(off, 0, 0, N, N, 0, 0, 520, 520);

  // target ring overlay
  vctx.save();
  vctx.strokeStyle = "rgba(255,255,255,.35)";
  vctx.setLineDash([5, 6]); vctx.lineWidth = 1.5;
  vctx.beginPath();
  vctx.arc(cx * CELL, cy * CELL, RING_R * CELL, 0, Math.PI * 2);
  vctx.stroke();
  vctx.restore();
}

// ---------- scoring ----------
const ringScoreEl = document.getElementById("ringScore") as HTMLElement;
const ringBar = document.getElementById("ringBar") as HTMLElement;
const heldScoreEl = document.getElementById("heldScore") as HTMLElement;
const heldBar = document.getElementById("heldBar") as HTMLElement;

function sampleField(fx: number, fy: number): [number, number] { // bilinear sample of complex field
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

function score(): void {
  // Ring coherence: sample T points round the target ring, measure how
  // smoothly & consistently the phase winds, weighted by amplitude present.
  const T = 180;
  let prevN: [number, number] | null = null;
  let wr = 0, wi = 0; // accumulated phase-step consistency vector
  let magSum = 0, n = 0;
  for (let k = 0; k < T; k++) {
    const a = k / T * 2 * Math.PI;
    const fx = cx + RING_R * Math.cos(a), fy = cy + RING_R * Math.sin(a);
    const [re, im] = sampleField(fx, fy);
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
  ringScoreEl.textContent = rpct + "%";
  ringBar.style.width = rpct + "%";

  // Universe held: fraction of total probability sitting in frozen cells
  let ptot = 0, pfroz = 0;
  for (let i = 0; i < SIZE; i++) { const p = R[i] * R[i] + I[i] * I[i]; ptot += p; if (frozen[i]) pfroz += p; }
  const held = ptot > 1e-9 ? pfroz / ptot : 0;
  const hpct = Math.round(held * 100);
  heldScoreEl.textContent = hpct + "%";
  heldBar.style.width = hpct + "%";
}

// ---------- interaction ----------
let dragging = false;
function toCell(ev: PointerEvent): [number, number] {
  const r = view.getBoundingClientRect();
  const x = Math.floor((ev.clientX - r.left) / r.width * N);
  const y = Math.floor((ev.clientY - r.top) / r.height * N);
  return [x, y];
}
function forBrush(gx: number, gy: number, fn: (i: number, t: number, x: number, y: number) => void): void {
  const br = brush;
  for (let dy = -br; dy <= br; dy++) for (let dx = -br; dx <= br; dx++) {
    const x = gx + dx, y = gy + dy;
    if (x < 0 || y < 0 || x >= N || y >= N) continue;
    const rr = Math.hypot(dx, dy); if (rr > br) continue;
    fn(y * N + x, rr / br, x, y);
  }
}

function apply(gx: number, gy: number): void {
  if (mode === "source") {
    forBrush(gx, gy, (i, t) => { const g = Math.exp(-t * t * 2.2) * 0.9; R[i] += g; }); // pour real amplitude
  } else if (mode === "observe") {
    forBrush(gx, gy, (i) => { frozen[i] = 1; }); // Zeno: pin in place
  } else if (mode === "phase") {
    const ang = 0.28;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    forBrush(gx, gy, (i) => { const re = R[i], im = I[i]; R[i] = re * ca - im * sa; I[i] = re * sa + im * ca; });
  }
}

function collapseAt(gx: number, gy: number): void {
  // destructive projective measurement: sample one outcome weighted by |psi|^2,
  // localise there, annihilate the rest of the looked-at region.
  const cells: Array<[number, number]> = []; let tot = 0;
  forBrush(gx, gy, (i) => { const p = R[i] * R[i] + I[i] * I[i]; cells.push([i, p]); tot += p; });
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

view.addEventListener("pointerdown", e => {
  view.setPointerCapture(e.pointerId); dragging = true;
  const [gx, gy] = toCell(e);
  if (mode === "collapse") collapseAt(gx, gy); else apply(gx, gy);
});
view.addEventListener("pointermove", e => {
  if (!dragging) return;
  const [gx, gy] = toCell(e);
  if (mode !== "collapse") apply(gx, gy); // collapse is a single deliberate click
});
view.addEventListener("pointerup", () => { dragging = false; });
view.addEventListener("pointerleave", () => { dragging = false; });

// ---------- seeds ----------
function clear(): void { R.fill(0); I.fill(0); frozen.fill(0); smoothMax = 1e-3; }

function seedRing(): void {
  clear();
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy);
    const env = Math.exp(-Math.pow(r - RING_R, 2) / (2 * RING_W * RING_W));
    const ph = Math.atan2(dy, dx); // winding-1 vortex phase
    R[y * N + x] = env * Math.cos(ph);
    I[y * N + x] = env * Math.sin(ph);
  }
}
function seedInterf(): void {
  clear();
  const s: Array<[number, number]> = [[cx - 18, cy], [cx + 18, cy]];
  for (const [sx, sy] of s)
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const r2 = (x - sx) * (x - sx) + (y - sy) * (y - sy);
      const g = Math.exp(-r2 / 40);
      R[y * N + x] += g; // same phase -> they will interfere
    }
}
function seedPacket(): void {
  clear();
  const k = 0.9; // momentum
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const r2 = (x - (cx - 24)) * (x - (cx - 24)) + (y - cy) * (y - cy);
    const g = Math.exp(-r2 / 70);
    R[y * N + x] = g * Math.cos(k * x);
    I[y * N + x] = g * Math.sin(k * x);
  }
}

// ---------- ui wiring ----------
document.querySelectorAll<HTMLButtonElement>(".mode").forEach(b => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".mode").forEach(m => m.classList.remove("on"));
    b.classList.add("on"); mode = b.dataset.mode as Mode;
  });
});
document.querySelectorAll<HTMLButtonElement>("[data-seed]").forEach(b => {
  b.addEventListener("click", () => {
    const s = b.dataset.seed;
    if (s === "ring") seedRing(); else if (s === "interf") seedInterf(); else seedPacket();
  });
});
const playBtn = document.getElementById("play") as HTMLButtonElement;
playBtn.addEventListener("click", () => { running = !running; playBtn.textContent = running ? "⏸ Pause" : "▶ Play"; });
document.getElementById("clear")!.addEventListener("click", clear);
document.getElementById("release")!.addEventListener("click", () => frozen.fill(0));
const brushEl = document.getElementById("brush") as HTMLInputElement, brVal = document.getElementById("brVal") as HTMLElement;
brushEl.addEventListener("input", () => { brush = +brushEl.value; brVal.textContent = String(brush); });
const speedEl = document.getElementById("speed") as HTMLInputElement, spVal = document.getElementById("spVal") as HTMLElement;
speedEl.addEventListener("input", () => { stepsPerFrame = +speedEl.value; spVal.textContent = String(stepsPerFrame); });

// ---------- loop ----------
let acc = 0;
function frame(): void {
  if (running) for (let s = 0; s < stepsPerFrame; s++) step();
  render();
  if ((acc++ % 3) === 0) score();
  requestAnimationFrame(frame);
}
seedRing();
frame();
