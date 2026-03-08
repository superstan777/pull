import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LogSetDrawer } from "./LogSetDrawer";

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  exerciseName: "Bench Press",
  setNumber: 1,
  totalSets: 3,
  defaultWeight: 60,
  defaultReps: 10,
  onConfirm: vi.fn(),
};

describe("LogSetDrawer", () => {
  it("renders when open=true", () => {
    render(<LogSetDrawer {...defaultProps} />);
    expect(screen.getByText("Bench Press")).toBeInTheDocument();
  });

  it("is not visible when open=false", () => {
    render(<LogSetDrawer {...defaultProps} open={false} />);
    expect(screen.queryByText("Bench Press")).not.toBeInTheDocument();
  });

  it("shows exercise name and set number / total sets", () => {
    render(<LogSetDrawer {...defaultProps} />);
    expect(screen.getByText("Bench Press")).toBeInTheDocument();
    expect(screen.getByText("Set 1 of 3")).toBeInTheDocument();
  });

  it("confirm button label includes current weight and reps", () => {
    render(<LogSetDrawer {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /60 kg × 10 reps/i }),
    ).toBeInTheDocument();
  });

  it("clicking confirm calls onConfirm with correct values", () => {
    const onConfirm = vi.fn();
    render(<LogSetDrawer {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: /60 kg × 10 reps/i }));
    expect(onConfirm).toHaveBeenCalledWith(60, 10);
  });

  it("default weight and reps are reflected in button label on open", () => {
    render(
      <LogSetDrawer {...defaultProps} defaultWeight={100} defaultReps={5} />,
    );
    expect(
      screen.getByRole("button", { name: /100 kg × 5 reps/i }),
    ).toBeInTheDocument();
  });
});
