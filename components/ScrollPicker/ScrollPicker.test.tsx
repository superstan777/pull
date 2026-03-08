import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScrollPicker } from "./ScrollPicker";

const items = ["10", "20", "30", "40", "50"];

describe("ScrollPicker", () => {
  it("renders the correct number of items", () => {
    render(<ScrollPicker items={items} value="10" onChange={vi.fn()} />);
    items.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });

  it("renders a label when provided", () => {
    render(
      <ScrollPicker items={items} value="10" onChange={vi.fn()} label="kg" />,
    );
    expect(screen.getByText("kg")).toBeInTheDocument();
  });

  it("selected item has opacity-100 class, adjacent items have reduced opacity", () => {
    render(<ScrollPicker items={items} value="30" onChange={vi.fn()} />);
    // "30" is at index 2 — selected
    const selectedEl = screen.getByText("30");
    expect(selectedEl).toHaveClass("opacity-100");

    // "20" and "40" are adjacent (dist=1) → opacity-40
    expect(screen.getByText("20")).toHaveClass("opacity-40");
    expect(screen.getByText("40")).toHaveClass("opacity-40");

    // "10" and "50" are dist=2 → opacity-15
    expect(screen.getByText("10")).toHaveClass("opacity-15");
    expect(screen.getByText("50")).toHaveClass("opacity-15");
  });

  it("initial liveIdx matches value prop position", () => {
    render(<ScrollPicker items={items} value="30" onChange={vi.fn()} />);
    // index 2 (value "30") is the selected one
    const thirdItem = screen.getByText("30");
    expect(thirdItem).toHaveClass("opacity-100");
  });
});
