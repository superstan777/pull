import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { RestTimer } from "./RestTimer";

describe("RestTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders initial time as '1:30'", () => {
    render(<RestTimer onDone={vi.fn()} />);
    expect(screen.getByText("1:30")).toBeInTheDocument();
  });

  it("counts down each second", () => {
    render(<RestTimer onDone={vi.fn()} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("1:29")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText("1:24")).toBeInTheDocument();
  });

  it("calls onDone after 90 seconds", () => {
    const onDone = vi.fn();
    render(<RestTimer onDone={onDone} />);
    act(() => {
      vi.advanceTimersByTime(90_000);
    });
    // The component calls onDone via setTimeout(onDone, 400) after reaching 0
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("'Skip Rest' button calls onDone immediately", () => {
    const onDone = vi.fn();
    render(<RestTimer onDone={onDone} />);
    // fireEvent.click is synchronous — no timer interaction needed
    fireEvent.click(screen.getByRole("button", { name: /skip rest/i }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
