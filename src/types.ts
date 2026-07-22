export type Mode = "observe" | "collapse" | "source" | "phase";

// Closed set, deliberately not extensible without a code change — see brief #0003's
// non-goal against a generic shape/plugin system. Only Observe mode honors this; every
// other mode always uses "circle" regardless of what's selected here.
export type BrushShape = "circle" | "hline" | "vline" | "square";

// Shared, mutable simulation state — the single explicit boundary that
// engine/rendering/ui take as a parameter rather than reading module globals.
export interface FieldState {
  readonly N: number; // grid cells per side
  readonly CELL: number; // display px per cell (N*CELL = 520)
  readonly DT: number; // evolution step
  readonly SIZE: number;
  readonly cx: number;
  readonly cy: number;
  readonly RING_R: number; // target ring radius (cells)
  readonly RING_W: number; // ring thickness for seeding

  R: Float32Array; // real part of amplitude
  I: Float32Array; // imaginary part
  tR: Float32Array; // scratch: H applied to R
  tI: Float32Array; // scratch: H applied to I
  frozen: Uint8Array; // Zeno-held cells

  running: boolean;
  mode: Mode;
  brushShape: BrushShape; // only consulted while mode === "observe"
  brush: number;
  stepsPerFrame: number;
  smoothMax: number; // running peak for auto-brightness
  dragging: boolean;
  acc: number; // frame counter, used to throttle scoring
}
