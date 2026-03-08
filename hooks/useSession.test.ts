import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import type { Session } from "@/lib/firestore";

vi.mock("@/lib/firestore");

import { subscribeToSession } from "@/lib/firestore";
import { useSession } from "./useSession";

const mockSubscribeToSession = vi.mocked(subscribeToSession);

const mockSession: Session = {
  id: "sess-1",
  planId: "mock-plan-v1",
  planName: "Push Day",
  startedAt: {
    seconds: 1700000000,
    nanoseconds: 0,
    toDate: () => new Date(),
  } as unknown as import("firebase/firestore").Timestamp,
  finishedAt: null,
  exercises: [],
};

describe("useSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { session: null, loading: true } initially", () => {
    mockSubscribeToSession.mockImplementation(() => vi.fn());

    const { result } = renderHook(() => useSession("uid-1", "sess-1"));
    expect(result.current.session).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it("returns { session: null, loading: false } when uid or sessionId is null", () => {
    const { result } = renderHook(() => useSession(null, null));
    expect(result.current.session).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("returns session data after onSnapshot fires", () => {
    mockSubscribeToSession.mockImplementation((_uid, _sid, onData) => {
      onData(mockSession);
      return vi.fn();
    });

    const { result } = renderHook(() => useSession("uid-1", "sess-1"));
    expect(result.current.session).toEqual(mockSession);
    expect(result.current.loading).toBe(false);
  });

  it("unsubscribes from snapshot on unmount", () => {
    const unsubscribe = vi.fn();
    mockSubscribeToSession.mockImplementation(() => unsubscribe);

    const { unmount } = renderHook(() => useSession("uid-1", "sess-1"));
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
