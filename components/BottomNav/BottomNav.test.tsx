import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomNav } from "./BottomNav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
  useRouter: vi.fn(() => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() })),
}));

import { usePathname } from "next/navigation";

const mockUsePathname = vi.mocked(usePathname);

describe("BottomNav", () => {
  it("renders Home and History links", () => {
    mockUsePathname.mockReturnValue("/");
    render(<BottomNav />);
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /history/i })).toBeInTheDocument();
  });

  it("Home link is active when pathname is /", () => {
    mockUsePathname.mockReturnValue("/");
    render(<BottomNav />);
    const homeLink = screen.getByRole("link", { name: /home/i });
    const historyLink = screen.getByRole("link", { name: /history/i });
    expect(homeLink).toHaveClass("text-foreground");
    expect(historyLink).toHaveClass("text-muted-foreground");
  });

  it("History link is active when pathname is /history", () => {
    mockUsePathname.mockReturnValue("/history");
    render(<BottomNav />);
    const historyLink = screen.getByRole("link", { name: /history/i });
    const homeLink = screen.getByRole("link", { name: /home/i });
    expect(historyLink).toHaveClass("text-foreground");
    expect(homeLink).toHaveClass("text-muted-foreground");
  });
});
