import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders without crashing", () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.firstChild).toBeTruthy();
  });

  it("applies animate-spin class", () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });
});
