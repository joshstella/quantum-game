// Ring-coherence milestones, both directions — settled as a low-stakes default
// per brief #0006's ledger (round numbers spanning the range, not tied to any
// particular gameplay balance).
export const SCORE_THRESHOLDS = [25, 50, 75, 90] as const;

export type CrossingDirection = "up" | "down";

export interface ScoreEventTracker {
  // Feeds the latest ring-coherence percentage. Returns the crossing direction
  // if pct moved into a different threshold bracket since the last check, or
  // null if it stayed in the same bracket — this is what gives "once per
  // crossing, debounced" for free: hovering at a boundary without actually
  // crossing it never changes the bracket.
  check(pct: number): CrossingDirection | null;
}

// Which bracket a percentage falls into: 0 = below SCORE_THRESHOLDS[0], up to
// SCORE_THRESHOLDS.length = at/above the last threshold.
function bracketFor(pct: number): number {
  let bracket = 0;
  for (const t of SCORE_THRESHOLDS) if (pct >= t) bracket++;
  return bracket;
}

// The first check() call establishes the starting bracket rather than firing
// a crossing — without this, every page load would report a spurious "up"
// crossing on its very first reading (see brief #0006's ledger).
export function createScoreEventTracker(): ScoreEventTracker {
  let lastBracket: number | null = null;
  return {
    check(pct: number): CrossingDirection | null {
      const bracket = bracketFor(pct);
      if (lastBracket === null) {
        lastBracket = bracket;
        return null;
      }
      if (bracket === lastBracket) return null;
      const direction: CrossingDirection = bracket > lastBracket ? "up" : "down";
      lastBracket = bracket;
      return direction;
    },
  };
}
