import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionSummary } from "./SessionSummary";
import type { Session } from "@/lib/firestore";

function makeTimestamp(date: Date) {
  return {
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
  } as unknown as import("firebase/firestore").Timestamp;
}

const baseSession: Session = {
  id: "sess-1",
  planId: "mock-plan-v1",
  planName: "Push Day",
  startedAt: makeTimestamp(new Date("2026-01-01T10:00:00Z")),
  finishedAt: null,
  exercises: [
    {
      exerciseId: "ex-1",
      exerciseName: "Bench Press",
      sets: [
        {
          setNumber: 1,
          reps: 10,
          weight: 60,
          loggedAt: makeTimestamp(new Date()),
        },
        { setNumber: 2, reps: null, weight: null, loggedAt: null },
      ],
    },
  ],
};

describe("SessionSummary", () => {
  it("renders plan name", () => {
    render(<SessionSummary session={baseSession} />);
    expect(screen.getByText("Push Day")).toBeInTheDocument();
  });

  it("renders correct logged/total set count", () => {
    render(<SessionSummary session={baseSession} />);
    expect(screen.getByText("1/2 sets logged")).toBeInTheDocument();
  });

  it("renders 'Finished' badge when finishedAt is set", () => {
    const finishedSession: Session = {
      ...baseSession,
      finishedAt: makeTimestamp(new Date("2026-01-01T11:00:00Z")),
    };
    render(<SessionSummary session={finishedSession} />);
    expect(screen.getByText("Finished")).toBeInTheDocument();
  });

  it("renders 'In Progress' badge when finishedAt is null", () => {
    render(<SessionSummary session={baseSession} />);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });
});
