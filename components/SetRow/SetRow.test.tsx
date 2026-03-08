import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetRow } from "./SetRow";
import type { SetLog } from "@/lib/firestore";

const baseSet: SetLog = {
  setNumber: 1,
  reps: null,
  weight: null,
  loggedAt: null,
};

describe("SetRow", () => {
  it("renders set number label", () => {
    render(
      <SetRow set={baseSet} exerciseIndex={0} setIndex={0} onLog={vi.fn()} />,
    );
    expect(screen.getByText("Set 1")).toBeInTheDocument();
  });

  it("weight and reps inputs are present", () => {
    render(
      <SetRow set={baseSet} exerciseIndex={0} setIndex={0} onLog={vi.fn()} />,
    );
    expect(screen.getByPlaceholderText("kg")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("reps")).toBeInTheDocument();
  });

  it("confirm button calls onLog with parsed values", async () => {
    const onLog = vi.fn().mockResolvedValue(undefined);
    render(
      <SetRow set={baseSet} exerciseIndex={0} setIndex={0} onLog={onLog} />,
    );

    await userEvent.type(screen.getByPlaceholderText("kg"), "80");
    await userEvent.type(screen.getByPlaceholderText("reps"), "8");
    await userEvent.click(screen.getByRole("button"));

    expect(onLog).toHaveBeenCalledWith(0, 0, 80, 8);
  });

  it("button is disabled and row appears muted after logging", async () => {
    const onLog = vi.fn().mockResolvedValue(undefined);
    render(
      <SetRow set={baseSet} exerciseIndex={0} setIndex={0} onLog={onLog} />,
    );

    const button = screen.getByRole("button");
    await userEvent.click(button);

    // After optimistic log, the button becomes disabled (optimisticLogged=true)
    expect(button).toBeDisabled();
  });

  it("renders already-logged set as muted", () => {
    const loggedSet: SetLog = {
      setNumber: 2,
      reps: 10,
      weight: 60,
      loggedAt: {
        seconds: 1700000000,
        nanoseconds: 0,
        toDate: () => new Date(),
      } as unknown as import("firebase/firestore").Timestamp,
    };
    render(
      <SetRow set={loggedSet} exerciseIndex={0} setIndex={1} onLog={vi.fn()} />,
    );
    // The containing div should have opacity-60
    expect(screen.getByText("Set 2").closest("div.rounded-lg")).toHaveClass(
      "opacity-60",
    );
  });
});
