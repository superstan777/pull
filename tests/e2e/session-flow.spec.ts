/**
 * E2E session flow test — happy path
 *
 * Auth strategy:
 *   IndexedDB injection — pre-populate Firebase's auth store before the page
 *   loads so onAuthStateChanged fires with a fake user immediately.  All
 *   Firebase Auth HTTP calls (token refresh, account lookup) are intercepted
 *   via page.route() and fulfilled with canned responses.
 *
 *   The IndexedDB key includes the real Firebase API key
 *   (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) because Firebase constructs the
 *   key as `firebase:authUser:{apiKey}:[DEFAULT]`.  Using the wrong key means
 *   the SDK never finds the stored user.
 *
 *   Locally:  playwright.config.ts loads .env.local via dotenv, so the var is
 *             available in the test process.
 *   In CI:    the var is injected from GitHub Actions secrets at workflow level.
 *
 * Firestore strategy:
 *   Application-level mocking — the lib/firestore/index.ts module checks for
 *   window.__E2E_FIRESTORE__ (injected via addInitScript) and delegates to
 *   those mock implementations instead of calling the Firebase SDK.
 *   This avoids mocking the complex WebChannel/gRPC-web transport that
 *   Firestore SDK v12 uses in the browser.  All Firestore network endpoints
 *   are blocked by a catch-all route.abort() as a safety net.
 */

import { test, expect, type Page } from "@playwright/test";

// ── constants ─────────────────────────────────────────────────────────────────

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";
const FAKE_UID = "e2e-test-user-123";
const FAKE_PHONE = "+48500500500";
const FAKE_ACCESS_TOKEN = "fake-access-token-e2e";
const FAKE_REFRESH_TOKEN = "fake-refresh-token-e2e";
const TOKEN_EXPIRY = Date.now() + 3600 * 1000;

const SESSION_ID = "test-session-id";
const MOCK_PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "pull-3d186";

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Pre-populate Firebase's IndexedDB auth store with a fake user so that
 * onAuthStateChanged fires with the test user immediately on page load,
 * bypassing the login UI and reCAPTCHA entirely.
 *
 * The IndexedDB key MUST use the actual Firebase API key the app was built
 * with (`FIREBASE_API_KEY`), not a hard-coded fake — otherwise the SDK looks
 * up a different key and finds nothing.
 *
 * The value MUST be a plain object — Firebase reads it with `data.value` and
 * calls `UserImpl._fromJSON()` on it.  A JSON string would be treated as an
 * ID token, triggering a `getAccountInfo` network call.
 */
async function injectFirebaseAuth(page: Page) {
  await page.addInitScript(
    ([uid, phone, apiKey, accessToken, refreshToken, expiryTime]) => {
      const AUTH_KEY = `firebase:authUser:${apiKey}:[DEFAULT]`;
      const fakeUser = {
        uid,
        phoneNumber: phone,
        isAnonymous: false,
        emailVerified: false,
        providerData: [
          {
            providerId: "phone",
            uid: phone,
            displayName: null,
            email: null,
            phoneNumber: phone,
            photoURL: null,
          },
        ],
        stsTokenManager: {
          refreshToken,
          accessToken,
          expirationTime: expiryTime,
        },
        createdAt: "1700000000000",
        lastLoginAt: "1700000000000",
        appName: "[DEFAULT]",
        apiKey,
      };

      const req = indexedDB.open("firebaseLocalStorageDb", 1);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("firebaseLocalStorage")) {
          db.createObjectStore("firebaseLocalStorage", {
            keyPath: "fbase_key",
          });
        }
      };
      req.onsuccess = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        const tx = db.transaction("firebaseLocalStorage", "readwrite");
        tx.objectStore("firebaseLocalStorage").put({
          fbase_key: AUTH_KEY,
          value: fakeUser, // plain object — NOT JSON.stringify()
        });
      };
    },
    [
      FAKE_UID,
      FAKE_PHONE,
      FIREBASE_API_KEY,
      FAKE_ACCESS_TOKEN,
      FAKE_REFRESH_TOKEN,
      TOKEN_EXPIRY,
    ] as const,
  );
}

/**
 * Mock all Firebase HTTP calls so no real network requests are made.
 * Auth calls return canned responses; Firestore WebChannel endpoints are
 * blocked by the catch-all.  Actual Firestore logic is handled by the
 * application-level mocks in injectFirestoreMocks().
 *
 * IMPORTANT — Playwright matches routes LIFO (last registered = highest
 * priority).  The catch-all abort must be registered FIRST so that every
 * specific mock registered afterwards overrides it for its own pattern.
 */
async function mockAllFirebaseRoutes(page: Page) {
  // ── Catch-all (lowest priority — registered first) ────────────────────────
  // Block any Firebase call not explicitly handled below.
  await page.route("**/googleapis.com/**", (route) => route.abort());

  // ── Auth ──────────────────────────────────────────────────────────────────

  // Account lookup (getAccountInfo — triggered on auth state restore)
  await page.route("**/identitytoolkit.googleapis.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        kind: "identitytoolkit#GetAccountInfoResponse",
        users: [
          {
            localId: FAKE_UID,
            phoneNumber: FAKE_PHONE,
            lastLoginAt: "1700000000000",
            createdAt: "1700000000000",
          },
        ],
      }),
    }),
  );

  // Token refresh (proactive refresh + forced refresh)
  await page.route("**/securetoken.googleapis.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: FAKE_ACCESS_TOKEN,
        expires_in: "3600",
        token_type: "Bearer",
        refresh_token: FAKE_REFRESH_TOKEN,
        id_token: FAKE_ACCESS_TOKEN,
        user_id: FAKE_UID,
        project_id: MOCK_PROJECT_ID,
      }),
    }),
  );
}

/**
 * Inject application-level Firestore mocks via window.__E2E_FIRESTORE__.
 *
 * The lib/firestore/index.ts module checks this global at the top of each
 * exported function.  When present, mock implementations run instead of real
 * Firebase SDK calls — completely bypassing the WebChannel/gRPC-web transport.
 */
async function injectFirestoreMocks(page: Page) {
  await page.addInitScript(
    ([sessionId]) => {
      const fakeTimestamp = {
        toDate: () => new Date(),
        seconds: 1700000000,
        nanoseconds: 0,
      };

      const mockSession = {
        id: sessionId,
        planId: "mock-plan-v1",
        planName: "Push Day",
        startedAt: fakeTimestamp,
        finishedAt: null,
        exercises: [
          {
            exerciseId: "ex-1",
            exerciseName: "Bench Press",
            sets: [
              { setNumber: 1, reps: null, weight: null, loggedAt: null },
              { setNumber: 2, reps: null, weight: null, loggedAt: null },
            ],
          },
          {
            exerciseId: "ex-2",
            exerciseName: "Lateral Raises",
            sets: [
              { setNumber: 1, reps: null, weight: null, loggedAt: null },
              { setNumber: 2, reps: null, weight: null, loggedAt: null },
            ],
          },
          {
            exerciseId: "ex-3",
            exerciseName: "Lat Pulldown",
            sets: [
              { setNumber: 1, reps: null, weight: null, loggedAt: null },
              { setNumber: 2, reps: null, weight: null, loggedAt: null },
            ],
          },
        ],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__E2E_FIRESTORE__ = {
        createSession: async () => sessionId,
        getActiveSession: async () => null,
        subscribeToSession: (
          _uid: string,
          _sid: string,
          onData: (s: typeof mockSession) => void,
        ) => {
          setTimeout(() => onData(mockSession), 0);
          return () => {}; // unsubscribe
        },
        logSet: async () => [],
        finishSession: async () => {},
        getSessions: async () => [],
        getSession: async (_uid: string, sid: string) =>
          sid === sessionId ? mockSession : null,
      };
    },
    [SESSION_ID] as const,
  );
}

// ── test ──────────────────────────────────────────────────────────────────────

test.describe("Session happy-path flow", () => {
  test.beforeEach(async ({ page }) => {
    await injectFirebaseAuth(page);
    await injectFirestoreMocks(page);
    await mockAllFirebaseRoutes(page);
  });

  test("complete workout session flow", async ({ page }) => {
    // ── 1. Navigate to home (auth injected via IndexedDB — no login UI needed)
    await page.goto("/");

    // ── 2. Assert "Start Workout" button is visible ───────────────────────────
    const startBtn = page.getByRole("button", { name: /start workout/i });
    await expect(startBtn).toBeVisible({ timeout: 10_000 });

    // ── 3. Click "Start Workout" ──────────────────────────────────────────────
    await startBtn.click();

    // ── 4. Assert redirect to /session/[id] ───────────────────────────────────
    await expect(page).toHaveURL(new RegExp(`/session/`), { timeout: 10_000 });

    // ── 5. Assert exercise list renders 3 exercises ───────────────────────────
    await expect(page.getByText("Bench Press")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Lateral Raises")).toBeVisible();
    await expect(page.getByText("Lat Pulldown")).toBeVisible();

    // ── 6. Click first exercise ───────────────────────────────────────────────
    await page.getByText("Bench Press").click();

    // ── 7. Assert set view renders "Set 1 of 2" and "Done" button ─────────────
    await expect(page.getByText(/Set\s+1\s+of\s+2/i)).toBeVisible({
      timeout: 5_000,
    });
    const doneBtn = page.getByRole("button", { name: /^done$/i });
    await expect(doneBtn).toBeVisible();

    // ── 8. Click "Done" ───────────────────────────────────────────────────────
    await doneBtn.click();

    // ── 9. Assert LogSetDrawer opens ──────────────────────────────────────────
    const confirmBtn = page.getByRole("button", { name: /kg × \d+ reps/i });
    await expect(confirmBtn).toBeVisible({ timeout: 3_000 });

    // ── 10. Click confirm button ──────────────────────────────────────────────
    await confirmBtn.click();

    // ── 11. Assert drawer closes ──────────────────────────────────────────────
    await expect(confirmBtn).not.toBeVisible({ timeout: 3_000 });

    // ── 12. Assert RestTimer renders with "1:30" ──────────────────────────────
    await expect(page.getByText("1:30")).toBeVisible({ timeout: 3_000 });

    // ── 13. Click "Skip Rest" ─────────────────────────────────────────────────
    await page.getByRole("button", { name: /skip rest/i }).click();

    // ── 14. Assert set view advances to "Set 2 of 2" ─────────────────────────
    await expect(page.getByText(/Set\s+2\s+of\s+2/i)).toBeVisible({
      timeout: 3_000,
    });

    // ── 15. Repeat for set 2 ──────────────────────────────────────────────────
    await page.getByRole("button", { name: /^done$/i }).click();
    const confirmBtn2 = page.getByRole("button", { name: /kg × \d+ reps/i });
    await expect(confirmBtn2).toBeVisible({ timeout: 3_000 });
    await confirmBtn2.click();

    // ── 16. Assert redirect back to exercise list ─────────────────────────────
    await expect(page.getByText("Lateral Raises")).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText("Lat Pulldown")).toBeVisible();

    // ── 17. Assert first exercise shows done state ────────────────────────────
    await expect(
      page
        .locator("button")
        .filter({ hasText: "Bench Press" })
        .locator("text=Done"),
    ).toBeVisible({ timeout: 3_000 });
  });
});
