import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LoadingSpinner } from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders without crashing", () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.firstChild).not.toBeNull();
  });

  it("applies animate-spin class", () => {
    const { container } = render(<LoadingSpinner />);
    const spinEl = container.querySelector(".animate-spin");
    expect(spinEl).not.toBeNull();
  });

  it("has min-h-[200px] container for proper centering", () => {
    const { container } = render(<LoadingSpinner />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("min-h-[200px]");
  });
});
