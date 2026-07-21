import type { FieldState } from "./types";

export interface Renderer {
  render(): void;
}

function hueToRGB(h: number): [number, number, number] { // h in [0,1) -> full-sat rgb at L=0.5
  const k = h * 6;
  const x = 1 - Math.abs(k % 2 - 1);
  let r = 0, g = 0, b = 0;
  if (k < 1) { r = 1; g = x; } else if (k < 2) { r = x; g = 1; } else if (k < 3) { g = 1; b = x; }
  else if (k < 4) { g = x; b = 1; } else if (k < 5) { r = x; b = 1; } else { r = 1; b = x; }
  return [r, g, b];
}

export function createRenderer(view: HTMLCanvasElement, state: FieldState): Renderer {
  const { N, CELL, SIZE, cx, cy, RING_R } = state;
  const vctx = view.getContext("2d")!;
  const off = document.createElement("canvas"); off.width = N; off.height = N;
  const octx = off.getContext("2d")!;
  const img = octx.createImageData(N, N);
  const buf = img.data;
  vctx.imageSmoothingEnabled = false;

  function render(): void {
    const { R, I, frozen } = state;

    // running peak amplitude, eased, so brightness auto-scales
    let mx = 1e-4;
    for (let i = 0; i < SIZE; i++) { const m = R[i] * R[i] + I[i] * I[i]; if (m > mx) mx = m; }
    mx = Math.sqrt(mx);
    state.smoothMax += (mx - state.smoothMax) * 0.08;
    const scale = 1 / Math.max(state.smoothMax, 1e-3);

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
    vctx.drawImage(off, 0, 0, N, N, 0, 0, view.width, view.height);

    // target ring overlay
    vctx.save();
    vctx.strokeStyle = "rgba(255,255,255,.35)";
    vctx.setLineDash([5, 6]); vctx.lineWidth = 1.5;
    vctx.beginPath();
    vctx.arc(cx * CELL, cy * CELL, RING_R * CELL, 0, Math.PI * 2);
    vctx.stroke();
    vctx.restore();
  }

  return { render };
}
