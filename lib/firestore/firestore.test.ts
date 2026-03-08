import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("firebase/firestore");
vi.mock("@/lib/firebase", () => ({ db: {} }));

import {
  addDoc,
  updateDoc,
  getDocs,
  collection,
  doc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import {
  createSession,
  logSet,
  finishSession,
  getActiveSession,
  getSessions,
  type ExerciseLog,
} from "./firestore";

import { MOCK_PLAN } from "@/lib/mockPlan";

const mockAddDoc = vi.mocked(addDoc);
const mockUpdateDoc = vi.mocked(updateDoc);
const mockGetDocs = vi.mocked(getDocs);
const mockServerTimestamp = vi.mocked(serverTimestamp);
const mockTimestampNow = vi.mocked(Timestamp.now);

describe("firestore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddDoc.mockResolvedValue({ id: "session-123" } as Awaited<
      ReturnType<typeof addDoc>
    >);
    mockUpdateDoc.mockResolvedValue(undefined);
    mockServerTimestamp.mockReturnValue({
      seconds: 0,
      nanoseconds: 0,
    } as unknown as ReturnType<typeof serverTimestamp>);
    mockTimestampNow.mockReturnValue({
      seconds: 1700000000,
      nanoseconds: 0,
      toDate: () => new Date(),
    } as ReturnType<typeof Timestamp.now>);
  });

  describe("createSession", () => {
    it("calls addDoc with correct shape", async () => {
      await createSession("uid-1");
      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      const [, data] = mockAddDoc.mock.calls[0];
      expect(data).toMatchObject({
        planId: MOCK_PLAN.id,
        planName: MOCK_PLAN.name,
        finishedAt: null,
      });
      expect(Array.isArray((data as Record<string, unknown>).exercises)).toBe(
        true,
      );
      expect((data as Record<string, unknown>).startedAt).toBeDefined();
    });

    it("returns the new document id", async () => {
      const id = await createSession("uid-1");
      expect(id).toBe("session-123");
    });
  });

  describe("logSet", () => {
    const exercises: ExerciseLog[] = [
      {
        exerciseId: "ex-1",
        exerciseName: "Bench Press",
        sets: [
          { setNumber: 1, reps: null, weight: null, loggedAt: null },
          { setNumber: 2, reps: null, weight: null, loggedAt: null },
        ],
      },
    ];

    it("calls updateDoc with updated exercises array reflecting new weight/reps/loggedAt", async () => {
      await logSet("uid-1", "sess-1", 0, 0, 80, 10, exercises);
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      const [, data] = mockUpdateDoc.mock.calls[0];
      const updated = (data as unknown as { exercises: ExerciseLog[] })
        .exercises;
      expect(updated[0].sets[0].weight).toBe(80);
      expect(updated[0].sets[0].reps).toBe(10);
      expect(updated[0].sets[0].loggedAt).toBeDefined();
      // Second set should remain untouched
      expect(updated[0].sets[1].loggedAt).toBeNull();
    });
  });

  describe("finishSession", () => {
    it("calls updateDoc with finishedAt: serverTimestamp()", async () => {
      await finishSession("uid-1", "sess-1");
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      const [, data] = mockUpdateDoc.mock.calls[0];
      expect(
        (data as unknown as Record<string, unknown>).finishedAt,
      ).toBeDefined();
    });
  });

  describe("getActiveSession", () => {
    it("returns first session where finishedAt is null", async () => {
      const mockDocs = [
        {
          id: "sess-1",
          data: () => ({
            planId: "p1",
            planName: "Push Day",
            startedAt: { seconds: 1700000000, nanoseconds: 0 },
            finishedAt: null,
            exercises: [],
          }),
        },
        {
          id: "sess-0",
          data: () => ({
            planId: "p1",
            planName: "Push Day",
            startedAt: { seconds: 1699000000, nanoseconds: 0 },
            finishedAt: { seconds: 1699001000, nanoseconds: 0 },
            exercises: [],
          }),
        },
      ];
      mockGetDocs.mockResolvedValue({ docs: mockDocs } as Awaited<
        ReturnType<typeof getDocs>
      >);

      const result = await getActiveSession("uid-1");
      expect(result?.id).toBe("sess-1");
      expect(result?.finishedAt).toBeNull();
    });

    it("returns null when all sessions are finished", async () => {
      const mockDocs = [
        {
          id: "sess-0",
          data: () => ({
            planId: "p1",
            planName: "Push Day",
            startedAt: { seconds: 1699000000, nanoseconds: 0 },
            finishedAt: { seconds: 1699001000, nanoseconds: 0 },
            exercises: [],
          }),
        },
      ];
      mockGetDocs.mockResolvedValue({ docs: mockDocs } as Awaited<
        ReturnType<typeof getDocs>
      >);

      const result = await getActiveSession("uid-1");
      expect(result).toBeNull();
    });
  });

  describe("getSessions", () => {
    it("returns all sessions ordered by startedAt", async () => {
      const mockDocs = [
        {
          id: "sess-2",
          data: () => ({
            planId: "p1",
            planName: "Push Day",
            startedAt: { seconds: 1700100000, nanoseconds: 0 },
            finishedAt: null,
            exercises: [],
          }),
        },
        {
          id: "sess-1",
          data: () => ({
            planId: "p1",
            planName: "Push Day",
            startedAt: { seconds: 1700000000, nanoseconds: 0 },
            finishedAt: null,
            exercises: [],
          }),
        },
      ];
      mockGetDocs.mockResolvedValue({ docs: mockDocs } as Awaited<
        ReturnType<typeof getDocs>
      >);

      const results = await getSessions("uid-1");
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe("sess-2");
      expect(results[1].id).toBe("sess-1");
    });
  });
});
