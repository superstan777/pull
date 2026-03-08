import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExerciseCard } from "./ExerciseCard";
import type { ExerciseLog } from "@/lib/firestore";

const makeExercise = (overrides: Partial<ExerciseLog> = {}): ExerciseLog => ({
  exerciseId: "ex-1",
  exerciseName: "Bench Press",
  sets: [
    { setNumber: 1, reps: null, weight: null, loggedAt: null },
    { setNumber: 2, reps: null, weight: null, loggedAt: null },
  ],
  ...overrides,
});

describe("ExerciseCard", () => {
  it("renders exercise name", () => {
    render(
      <ExerciseCard
        exercise={makeExercise()}
        exerciseIndex={0}
        onLog={vi.fn()}
      />,
    );
    expect(screen.getByText("Bench Press")).toBeInTheDocument();
  });

  it("renders correct number of SetRows", () => {
    render(
      <ExerciseCard
        exercise={makeExercise()}
        exerciseIndex={0}
        onLog={vi.fn()}
      />,
    );
    // Two sets → two "Set N" labels
    expect(screen.getByText("Set 1")).toBeInTheDocument();
    expect(screen.getByText("Set 2")).toBeInTheDocument();
  });

  it("shows logged count correctly — 0/2 when none logged", () => {
    render(
      <ExerciseCard
        exercise={makeExercise()}
        exerciseIndex={0}
        onLog={vi.fn()}
      />,
    );
    expect(screen.getByText("0/2")).toBeInTheDocument();
  });

  it("shows logged count correctly — 1/2 when one set logged", () => {
    const now = {
      seconds: 1700000000,
      nanoseconds: 0,
      toDate: () => new Date(),
    } as unknown as import("firebase/firestore").Timestamp;
    const exercise = makeExercise({
      sets: [
        { setNumber: 1, reps: 10, weight: 60, loggedAt: now },
        { setNumber: 2, reps: null, weight: null, loggedAt: null },
      ],
    });
    render(
      <ExerciseCard exercise={exercise} exerciseIndex={0} onLog={vi.fn()} />,
    );
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });
});
