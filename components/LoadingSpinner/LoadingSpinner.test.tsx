import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders without crashing", () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("applies animate-spin class", () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toHaveClass("animate-spin");
  });
});
