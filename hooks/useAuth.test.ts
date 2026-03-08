import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { User } from "firebase/auth";

vi.mock("firebase/auth");
vi.mock("@/lib/firebase", () => ({ auth: { currentUser: null } }));

import { onAuthStateChanged } from "firebase/auth";
import { useAuth } from "./useAuth";

const mockOnAuthStateChanged = vi.mocked(onAuthStateChanged);

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { user: null, loading: true } initially", () => {
    // Make onAuthStateChanged never call back
    mockOnAuthStateChanged.mockImplementation(() => vi.fn());

    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it("returns { user: mockUser, loading: false } after onAuthStateChanged fires", () => {
    const mockUser = { uid: "user-1" } as User;
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      // Fire callback synchronously
      (callback as (user: User | null) => void)(mockUser);
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  it("returns { user: null, loading: false } when signed out", () => {
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      (callback as (user: User | null) => void)(null);
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("unsubscribes on unmount", () => {
    const unsubscribe = vi.fn();
    mockOnAuthStateChanged.mockImplementation(() => unsubscribe);

    const { unmount } = renderHook(() => useAuth());
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
