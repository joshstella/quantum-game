import { describe, expect, it } from "vitest";
import { createScoreEventTracker } from "../scoreEvents";

describe("createScoreEventTracker", () => {
  it("does not fire on the first check, whatever the starting value", () => {
    const tracker = createScoreEventTracker();
    expect(tracker.check(0)).toBeNull();
  });

  it("fires 'up' when crossing a threshold upward", () => {
    const tracker = createScoreEventTracker();
    tracker.check(20); // establishes the below-25 bracket
    expect(tracker.check(30)).toBe("up"); // crosses 25
  });

  it("fires 'down' when crossing a threshold downward", () => {
    const tracker = createScoreEventTracker();
    tracker.check(80); // establishes the 75-90 bracket
    expect(tracker.check(60)).toBe("down"); // crosses back below 75
  });

  it("does not fire when moving within the same bracket", () => {
    const tracker = createScoreEventTracker();
    tracker.check(30);
    expect(tracker.check(45)).toBeNull(); // still in the 25-50 bracket
  });

  it("does not re-fire while hovering at a boundary without actually crossing it", () => {
    const tracker = createScoreEventTracker();
    tracker.check(24); // below-25 bracket
    expect(tracker.check(26)).toBe("up"); // crosses 25 once
    expect(tracker.check(24)).toBe("down"); // crosses back down once
    expect(tracker.check(24)).toBeNull(); // steady at 24 — no re-fire
    expect(tracker.check(23)).toBeNull(); // moving within the same bracket — no re-fire
  });

  it("only reports one direction even when a jump skips multiple thresholds", () => {
    const tracker = createScoreEventTracker();
    tracker.check(10); // below-25 bracket
    expect(tracker.check(95)).toBe("up"); // jumps clear past 25/50/75/90 in one step
  });

  it("treats exactly-at-threshold as having crossed it", () => {
    const tracker = createScoreEventTracker();
    tracker.check(24);
    expect(tracker.check(25)).toBe("up");
  });
});
