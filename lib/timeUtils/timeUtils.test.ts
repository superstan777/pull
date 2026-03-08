import { describe, it, expect } from "vitest";
import { formatDate, formatDuration } from "./timeUtils";

describe("formatDate", () => {
  it("returns a formatted string for a known date", () => {
    const date = new Date("2026-01-15T14:30:00.000Z");
    const result = formatDate(date);
    // Should contain year, month, day info
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
    expect(result).toContain("2026");
  });
});

describe("formatDuration", () => {
  it("returns '1h 30m' for 90 minutes", () => {
    const start = new Date("2026-01-01T10:00:00Z");
    const end = new Date("2026-01-01T11:30:00Z");
    expect(formatDuration(start, end)).toBe("1h 30m");
  });

  it("returns '45m' for 45 minutes", () => {
    const start = new Date("2026-01-01T10:00:00Z");
    const end = new Date("2026-01-01T10:45:00Z");
    expect(formatDuration(start, end)).toBe("45m");
  });

  it("returns '0m' for 0 seconds", () => {
    const date = new Date("2026-01-01T10:00:00Z");
    expect(formatDuration(date, date)).toBe("0m");
  });
});
