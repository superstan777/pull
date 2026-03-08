import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { User } from "firebase/auth";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() })),
  usePathname: vi.fn(() => "/"),
}));

vi.mock("@/hooks/useAuth");

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "./AuthGuard";

const mockUseAuth = vi.mocked(useAuth);
const mockUseRouter = vi.mocked(useRouter);

describe("AuthGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state while auth is resolving", () => {
    mockUseRouter.mockReturnValue({
      replace: vi.fn(),
      push: vi.fn(),
      back: vi.fn(),
    } as ReturnType<typeof useRouter>);
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>,
    );
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("redirects to /login when user is null", () => {
    const replace = vi.fn();
    mockUseRouter.mockReturnValue({
      replace,
      push: vi.fn(),
      back: vi.fn(),
    } as ReturnType<typeof useRouter>);
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>,
    );
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("renders children when user is authenticated", () => {
    mockUseRouter.mockReturnValue({
      replace: vi.fn(),
      push: vi.fn(),
      back: vi.fn(),
    } as ReturnType<typeof useRouter>);
    mockUseAuth.mockReturnValue({
      user: { uid: "user-1" } as User,
      loading: false,
    });
    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>,
    );
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
