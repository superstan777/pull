import { vi } from "vitest";

// ── firebase/auth mock ────────────────────────────────────────────────────────
export const mockOnAuthStateChanged = vi.fn();
export const mockSignInWithPhoneNumber = vi.fn();
export const mockSignOut = vi.fn();

export const mockAuth = {
  onAuthStateChanged: mockOnAuthStateChanged,
  signInWithPhoneNumber: mockSignInWithPhoneNumber,
  signOut: mockSignOut,
  RecaptchaVerifier: vi.fn().mockImplementation(() => ({
    clear: vi.fn(),
    render: vi.fn().mockResolvedValue(0),
  })),
  getAuth: vi.fn(() => null),
};

// ── firebase/firestore mock ───────────────────────────────────────────────────
export const mockAddDoc = vi.fn().mockResolvedValue({ id: "session-123" });
export const mockGetDocs = vi.fn().mockResolvedValue({ docs: [] });
export const mockGetDoc = vi
  .fn()
  .mockResolvedValue({ exists: () => false, id: "", data: () => ({}) });
export const mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
export const mockOnSnapshot = vi.fn(() => vi.fn()); // returns unsubscribe fn
export const mockCollection = vi.fn(() => ({ type: "collection" }));
export const mockDoc = vi.fn(() => ({ type: "doc" }));
export const mockQuery = vi.fn((ref) => ref);
export const mockOrderBy = vi.fn();
export const mockServerTimestamp = vi.fn(() => ({
  seconds: 0,
  nanoseconds: 0,
}));

export const MockTimestamp = {
  now: vi.fn(() => ({
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: 0,
    toDate: () => new Date(),
  })),
  fromDate: vi.fn((d: Date) => ({
    seconds: Math.floor(d.getTime() / 1000),
    nanoseconds: 0,
    toDate: () => d,
  })),
};

export const mockFirestore = {
  addDoc: mockAddDoc,
  getDocs: mockGetDocs,
  getDoc: mockGetDoc,
  updateDoc: mockUpdateDoc,
  onSnapshot: mockOnSnapshot,
  collection: mockCollection,
  doc: mockDoc,
  query: mockQuery,
  orderBy: mockOrderBy,
  serverTimestamp: mockServerTimestamp,
  Timestamp: MockTimestamp,
};

// ── lib/firebase mock ─────────────────────────────────────────────────────────
export const mockFirebaseLib = {
  auth: null,
  db: null,
};
