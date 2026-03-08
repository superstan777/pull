import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseSetView } from "./ExerciseSetView";
import type { ExerciseLog } from "@/lib/firestore";
import type { SetDrawerConfig } from "@/types/session";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() })),
  usePathname: vi.fn(() => "/"),
}));

function makeTimestamp(date = new Date()) {
  return {
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
  } as unknown as import("firebase/firestore").Timestamp;
}

const makeExercise = (setsLogged: boolean[] = [false, false]): ExerciseLog => ({
  exerciseId: "ex-1",
  exerciseName: "Bench Press",
  sets: setsLogged.map((logged, i) => ({
    setNumber: i + 1,
    reps: logged ? 10 : null,
    weight: logged ? 60 : null,
    loggedAt: logged ? makeTimestamp() : null,
  })),
});

const drawerConfig: SetDrawerConfig = {
  exerciseName: "Bench Press",
  setNumber: 1,
  totalSets: 2,
  defaultWeight: 60,
  defaultReps: 10,
};

const activeView = { exerciseIndex: 0, setIndex: 0, phase: "active" as const };
const restingView = {
  exerciseIndex: 0,
  setIndex: 0,
  phase: "resting" as const,
};

const defaultProps = {
  ex: makeExercise(),
  view: activeView,
  drawerOpen: false,
  drawerConfig,
  onBack: vi.fn(),
  onOpenDrawer: vi.fn(),
  onTimerDone: vi.fn(),
  onDrawerOpenChange: vi.fn(),
  onConfirmSet: vi.fn(),
};

describe("ExerciseSetView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── active phase ───────────────────────────────────────────────────────────

  it("renders exercise name in header", () => {
    render(<ExerciseSetView {...defaultProps} />);
    expect(screen.getByText("Bench Press")).toBeInTheDocument();
  });

  it("shows 'Set 1 of 2' in active phase", () => {
    render(<ExerciseSetView {...defaultProps} />);
    expect(screen.getByText(/Set/)).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(/of 2/)).toBeInTheDocument();
  });

  it("renders 'Done' button in active phase", () => {
    render(<ExerciseSetView {...defaultProps} />);
    expect(screen.getByRole("button", { name: /^done$/i })).toBeInTheDocument();
  });

  it("'Done' button calls onOpenDrawer when clicked", async () => {
    const onOpenDrawer = vi.fn();
    render(<ExerciseSetView {...defaultProps} onOpenDrawer={onOpenDrawer} />);
    await userEvent.click(screen.getByRole("button", { name: /^done$/i }));
    expect(onOpenDrawer).toHaveBeenCalledTimes(1);
  });

  it("'Done' button is disabled when currentSet is already logged", () => {
    const loggedExercise = makeExercise([true, false]);
    render(
      <ExerciseSetView
        {...defaultProps}
        ex={loggedExercise}
        view={{ exerciseIndex: 0, setIndex: 0, phase: "active" }}
      />,
    );
    expect(screen.getByRole("button", { name: /^done$/i })).toBeDisabled();
  });

  it("back button calls onBack", async () => {
    const onBack = vi.fn();
    render(<ExerciseSetView {...defaultProps} onBack={onBack} />);
    await userEvent.click(
      screen.getByRole("button", { name: /back to exercises/i }),
    );
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders previous sets when setIndex > 0 and sets are logged", () => {
    const ex = makeExercise([true, false]);
    render(
      <ExerciseSetView
        {...defaultProps}
        ex={ex}
        view={{ exerciseIndex: 0, setIndex: 1, phase: "active" }}
      />,
    );
    expect(screen.getByText("Previous sets")).toBeInTheDocument();
    expect(screen.getByText(/60 kg × 10 reps/)).toBeInTheDocument();
  });

  it("does not render previous sets section at setIndex 0", () => {
    render(<ExerciseSetView {...defaultProps} view={activeView} />);
    expect(screen.queryByText("Previous sets")).not.toBeInTheDocument();
  });

  it("renders LogSetDrawer when drawerConfig is provided and drawerOpen=true", () => {
    render(<ExerciseSetView {...defaultProps} drawerOpen={true} />);
    // Drawer open — confirm button should be visible
    expect(
      screen.getByRole("button", { name: /60 kg × 10 reps/i }),
    ).toBeInTheDocument();
  });

  it("does not render LogSetDrawer when drawerConfig is null", () => {
    render(
      <ExerciseSetView
        {...defaultProps}
        drawerConfig={null}
        drawerOpen={false}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /kg × \d+ reps/i }),
    ).not.toBeInTheDocument();
  });

  // ── resting phase ──────────────────────────────────────────────────────────

  describe("resting phase", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows RestTimer with '1:30' in resting phase", () => {
      render(<ExerciseSetView {...defaultProps} view={restingView} />);
      expect(screen.getByText("1:30")).toBeInTheDocument();
    });

    it("shows 'Next: Set 2 of 2' in resting phase at setIndex 0", () => {
      render(<ExerciseSetView {...defaultProps} view={restingView} />);
      expect(screen.getByText("Next: Set 2 of 2")).toBeInTheDocument();
    });

    it("does not render 'Done' button in resting phase", () => {
      render(<ExerciseSetView {...defaultProps} view={restingView} />);
      expect(
        screen.queryByRole("button", { name: /^done$/i }),
      ).not.toBeInTheDocument();
    });

    it("'Skip Rest' button calls onTimerDone", () => {
      const onTimerDone = vi.fn();
      render(
        <ExerciseSetView
          {...defaultProps}
          view={restingView}
          onTimerDone={onTimerDone}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: /skip rest/i }));
      expect(onTimerDone).toHaveBeenCalledTimes(1);
    });
  });
});
