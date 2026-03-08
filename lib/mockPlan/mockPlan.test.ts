import { describe, it, expect } from "vitest";
import { MOCK_PLAN } from "./mockPlan";

describe("MOCK_PLAN", () => {
  it("has id, name, and 3 exercises", () => {
    expect(MOCK_PLAN.id).toBeTruthy();
    expect(MOCK_PLAN.name).toBeTruthy();
    expect(MOCK_PLAN.exercises).toHaveLength(3);
  });

  it("each exercise has id, name, and sets count >= 1", () => {
    for (const exercise of MOCK_PLAN.exercises) {
      expect(exercise.id).toBeTruthy();
      expect(exercise.name).toBeTruthy();
      expect(exercise.sets).toBeGreaterThanOrEqual(1);
    }
  });
});
