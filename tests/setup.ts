import "@testing-library/jest-dom";
import { vi } from "vitest";

// ── jsdom scroll polyfills ────────────────────────────────────────────────────
// jsdom does not implement scroll methods — polyfill so components that use
// .scrollTo() / .scrollIntoView() don't throw in tests.
const noop = vi.fn();
Element.prototype.scrollTo = noop;
window.scrollTo = noop as typeof window.scrollTo;
Object.defineProperty(Element.prototype, "scrollIntoView", {
  configurable: true,
  writable: true,
  value: noop,
});
Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
  configurable: true,
  writable: true,
  value: noop,
});
Object.defineProperty(HTMLElement.prototype, "scrollTo", {
  configurable: true,
  writable: true,
  value: noop,
});
Object.defineProperty(HTMLElement.prototype, "scrollTop", {
  configurable: true,
  get() {
    return this.__scrollTop ?? 0;
  },
  set(v) {
    this.__scrollTop = v;
  },
});
// vaul (Drawer) uses pointer capture APIs not implemented in jsdom
Element.prototype.setPointerCapture = noop;
Element.prototype.releasePointerCapture = noop;
Element.prototype.hasPointerCapture = vi.fn(() => false);

// Mock firebase modules globally
vi.mock("firebase/auth", async () => {
  const { mockAuth } = await import("./mocks/firebase");
  return mockAuth;
});

vi.mock("firebase/firestore", async () => {
  const { mockFirestore } = await import("./mocks/firebase");
  return mockFirestore;
});

vi.mock("@/lib/firebase", async () => {
  const { mockFirebaseLib } = await import("./mocks/firebase");
  return mockFirebaseLib;
});

// Mock firebase modules globally
vi.mock("firebase/auth", async () => {
  const { mockAuth } = await import("./mocks/firebase");
  return mockAuth;
});

vi.mock("firebase/firestore", async () => {
  const { mockFirestore } = await import("./mocks/firebase");
  return mockFirestore;
});

vi.mock("@/lib/firebase", async () => {
  const { mockFirebaseLib } = await import("./mocks/firebase");
  return mockFirebaseLib;
});
