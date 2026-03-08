export type { Session, ExerciseLog, SetLog } from "./firestore";

import {
  createSession as _createSession,
  getActiveSession as _getActiveSession,
  subscribeToSession as _subscribeToSession,
  logSet as _logSet,
  finishSession as _finishSession,
  getSessions as _getSessions,
  getSession as _getSession,
} from "./firestore";

/**
 * E2E test override layer — when Playwright injects window.__E2E_FIRESTORE__
 * via addInitScript, those mock implementations are used instead of real
 * Firebase SDK calls.  This avoids mocking the complex WebChannel/gRPC-web
 * transport that Firestore SDK v12 uses in the browser.
 * In production the global is always absent and the real functions run.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- need any for generic function wrapper
function e2e(): Record<string, (...args: any[]) => unknown> | undefined {
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- global injected by Playwright
    return (window as any).__E2E_FIRESTORE__;
  }
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic wrapper needs any constraint
function wrap<T extends (...args: any[]) => any>(name: string, fn: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- rest args mirror original signature
  return ((...args: any[]) => {
    const mock = e2e()?.[name];
    return mock ? mock(...args) : fn(...args);
  }) as T;
}

export const createSession = wrap("createSession", _createSession);
export const getActiveSession = wrap("getActiveSession", _getActiveSession);
export const subscribeToSession = wrap(
  "subscribeToSession",
  _subscribeToSession,
);
export const logSet = wrap("logSet", _logSet);
export const finishSession = wrap("finishSession", _finishSession);
export const getSessions = wrap("getSessions", _getSessions);
export const getSession = wrap("getSession", _getSession);
