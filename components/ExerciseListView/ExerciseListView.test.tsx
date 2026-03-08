import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseListView } from "./ExerciseListView";
import type { Session, ExerciseLog } from "@/lib/firestore";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() })),
  usePathname: vi.fn(() => "/"),
}));

import { useRouter } from "next/navigation";

const mockUseRouter = vi.mocked(useRouter);

function makeTimestamp(date = new Date()) {
  return {
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
  } as unknown as import("firebase/firestore").Timestamp;
}

const makeSet = (logged = false) => ({
  setNumber: 1,
  reps: logged ? 10 : null,
  weight: logged ? 60 : null,
  loggedAt: logged ? makeTimestamp() : null,
});

const makeExercise = (
  name: string,
  sets: ReturnType<typeof makeSet>[],
): ExerciseLog => ({
  exerciseId: name,
  exerciseName: name,
  sets,
});

const baseSession: Session = {
  id: "sess-1",
  planId: "mock-plan-v1",
  planName: "Push Day",
  startedAt: makeTimestamp(),
  finishedAt: null,
  exercises: [],
};

const defaultExercises: ExerciseLog[] = [
  makeExercise("Bench Press", [makeSet(false), makeSet(false)]),
  makeExercise("Lateral Raises", [makeSet(false), makeSet(false)]),
];

const defaultProps = {
  session: baseSession,
  exercises: defaultExercises,
  loggedSets: 0,
  totalSets: 4,
  allDone: false,
  finishing: false,
  onSelectExercise: vi.fn(),
  onFinish: vi.fn(),
};

describe("ExerciseListView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
  });

  it("renders the plan name and set progress", () => {
    render(<ExerciseListView {...defaultProps} />);
    expect(screen.getByText("Push Day")).toBeInTheDocument();
    expect(screen.getByText("0/4 sets")).toBeInTheDocument();
  });

  it("renders all exercise names", () => {
    render(<ExerciseListView {...defaultProps} />);
    expect(screen.getByText("Bench Press")).toBeInTheDocument();
    expect(screen.getByText("Lateral Raises")).toBeInTheDocument();
  });

  it("clicking an incomplete exercise calls onSelectExercise with correct indices", async () => {
    const onSelectExercise = vi.fn();
    render(
      <ExerciseListView
        {...defaultProps}
        onSelectExercise={onSelectExercise}
      />,
    );
    await userEvent.click(screen.getByText("Bench Press"));
    expect(onSelectExercise).toHaveBeenCalledWith(0, 0);
  });

  it("clicking second exercise calls onSelectExercise with index 1", async () => {
    const onSelectExercise = vi.fn();
    render(
      <ExerciseListView
        {...defaultProps}
        onSelectExercise={onSelectExercise}
      />,
    );
    await userEvent.click(screen.getByText("Lateral Raises"));
    expect(onSelectExercise).toHaveBeenCalledWith(1, 0);
  });

  it("a fully-logged exercise is disabled and shows 'Done'", () => {
    const exercises: ExerciseLog[] = [
      makeExercise("Bench Press", [makeSet(true), makeSet(true)]),
    ];
    render(
      <ExerciseListView
        {...defaultProps}
        exercises={exercises}
        totalSets={2}
        loggedSets={2}
      />,
    );
    const btn = screen.getByRole("button", { name: /bench press/i });
    expect(btn).toBeDisabled();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("does not show 'Finish Workout' button when allDone=false", () => {
    render(<ExerciseListView {...defaultProps} allDone={false} />);
    expect(
      screen.queryByRole("button", { name: /finish workout/i }),
    ).not.toBeInTheDocument();
  });

  it("shows 'Finish Workout' button when allDone=true", () => {
    render(<ExerciseListView {...defaultProps} allDone={true} />);
    expect(
      screen.getByRole("button", { name: /finish workout/i }),
    ).toBeInTheDocument();
  });

  it("clicking 'Finish Workout' calls onFinish", async () => {
    const onFinish = vi.fn();
    render(
      <ExerciseListView {...defaultProps} allDone={true} onFinish={onFinish} />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /finish workout/i }),
    );
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("'Finish Workout' is disabled while finishing=true", () => {
    render(
      <ExerciseListView {...defaultProps} allDone={true} finishing={true} />,
    );
    expect(screen.getByRole("button", { name: /finishing/i })).toBeDisabled();
  });

  it("back button navigates to '/'", async () => {
    const push = vi.fn();
    mockUseRouter.mockReturnValue({
      push,
      replace: vi.fn(),
      back: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    render(<ExerciseListView {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(push).toHaveBeenCalledWith("/");
  });

  it("shows next-set label for partially-logged exercise", () => {
    const exercises: ExerciseLog[] = [
      makeExercise("Bench Press", [makeSet(true), makeSet(false)]),
    ];
    render(
      <ExerciseListView
        {...defaultProps}
        exercises={exercises}
        loggedSets={1}
        totalSets={2}
      />,
    );
    // First set done → shows "Set 2 of 2"
    expect(screen.getByText("Set 2 of 2")).toBeInTheDocument();
  });
});
