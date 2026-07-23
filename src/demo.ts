import type { FieldState } from "./types";
import { seedRing } from "./state";

// Deliberately decoupled from ui.ts: demo.ts never imports it, and never
// will — ui.ts's phase-2 runner will need to import demo.ts to drive the
// "Show me how" button, and demo.ts importing ui.ts back would be a cycle.
// apply()/collapseAt() are supplied here instead, so the runner can pass its
// own local functions straight through.
export interface DemoActions {
  apply(state: FieldState, gx: number, gy: number): void;
  collapseAt(state: FieldState, gx: number, gy: number): void;
}

export interface DemoPhase {
  caption: string;
  ticks: number;
  tick(state: FieldState, tickIndex: number, actions: DemoActions): void;
}

const RING_FREEZE_TICKS = 40;

// Mirrors index.html's own .hint copy: seed the ring, freeze it into
// coherence via Observe/Zeno, then one destructive Collapse. See brief
// #0005 — the demo is a scripted driver of real gameplay code, not a
// separate simulated result.
export function createDemoPhases(): DemoPhase[] {
  return [
    {
      caption: "Seeding a vortex ring — a winding-1 phase pattern with high potential coherence.",
      ticks: 1,
      tick(state) {
        seedRing(state);
        state.mode = "observe";
      },
    },
    {
      caption: "Observing (Zeno effect): freezing cells along the ring locks their phase in place, holding coherence before it can decay.",
      ticks: RING_FREEZE_TICKS,
      tick(state, tickIndex, actions) {
        const angle = (tickIndex / RING_FREEZE_TICKS) * Math.PI * 2;
        const gx = Math.round(state.cx + state.RING_R * Math.cos(angle));
        const gy = Math.round(state.cy + state.RING_R * Math.sin(angle));
        actions.apply(state, gx, gy);
      },
    },
    {
      caption: "One destructive Collapse: a hard measurement destroys coherence where you look — watch the score fall.",
      ticks: 1,
      tick(state, _tickIndex, actions) {
        state.mode = "collapse";
        const gx = Math.round(state.cx + state.RING_R);
        const gy = state.cy;
        actions.collapseAt(state, gx, gy);
      },
    },
  ];
}
