/**
 * E2E session flow test — happy path
 *
 * Auth strategy:
 *   1. page.addInitScript():
 *      - Pre-populate Firebase's IndexedDB auth store with a fake user payload
 *      - Ensures onAuthStateChanged fires with the test user on app load
 *   2. page.route():
 *      - Intercept securetoken.googleapis.com (token refresh)
 *      - Intercept identitytoolkit.googleapis.com (account lookup)
 *      - Intercept firestore.googleapis.com (Firestore reads / writes / listen)
 *
 * The app is started via playwright.config.ts webServer (npm run dev).
 * Requires .env.test to be loaded so Firebase initialises with fake credentials.
 */

import { test, expect, type Page } from "@playwright/test";

// ── constants shared between fixtures ────────────────────────────────────────

const FAKE_API_KEY = "test-api-key";
const FAKE_PROJECT_ID = "test-project";
const FAKE_UID = "test-user-123";
const FAKE_PHONE = "+15550000000";
const SESSION_ID = "test-session-id";

const FAKE_ACCESS_TOKEN = "fake-access-token-xyz";
const FAKE_REFRESH_TOKEN = "fake-refresh-token-xyz";
const TOKEN_EXPIRY = Date.now() + 3600 * 1000;

// ── Firestore mock documents ──────────────────────────────────────────────────

const MOCK_SESSION_DOC = {
  name: `projects/${FAKE_PROJECT_ID}/databases/(default)/documents/users/${FAKE_UID}/sessions/${SESSION_ID}`,
  fields: {
    planId: { stringValue: "mock-plan-v1" },
    planName: { stringValue: "Push Day" },
    startedAt: { timestampValue: new Date().toISOString() },
    finishedAt: { nullValue: "NULL_VALUE" },
    exercises: {
      arrayValue: {
        values: [
          {
            mapValue: {
              fields: {
                exerciseId: { stringValue: "ex-1" },
                exerciseName: { stringValue: "Bench Press" },
                sets: {
                  arrayValue: {
                    values: [
                      {
                        mapValue: {
                          fields: {
                            setNumber: { integerValue: "1" },
                            reps: { nullValue: "NULL_VALUE" },
                            weight: { nullValue: "NULL_VALUE" },
                            loggedAt: { nullValue: "NULL_VALUE" },
                          },
                        },
                      },
                      {
                        mapValue: {
                          fields: {
                            setNumber: { integerValue: "2" },
                            reps: { nullValue: "NULL_VALUE" },
                            weight: { nullValue: "NULL_VALUE" },
                            loggedAt: { nullValue: "NULL_VALUE" },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
          {
            mapValue: {
              fields: {
                exerciseId: { stringValue: "ex-2" },
                exerciseName: { stringValue: "Lateral Raises" },
                sets: {
                  arrayValue: {
                    values: [
                      {
                        mapValue: {
                          fields: {
                            setNumber: { integerValue: "1" },
                            reps: { nullValue: "NULL_VALUE" },
                            weight: { nullValue: "NULL_VALUE" },
                            loggedAt: { nullValue: "NULL_VALUE" },
                          },
                        },
                      },
                      {
                        mapValue: {
                          fields: {
                            setNumber: { integerValue: "2" },
                            reps: { nullValue: "NULL_VALUE" },
                            weight: { nullValue: "NULL_VALUE" },
                            loggedAt: { nullValue: "NULL_VALUE" },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
          {
            mapValue: {
              fields: {
                exerciseId: { stringValue: "ex-3" },
                exerciseName: { stringValue: "Lat Pulldown" },
                sets: {
                  arrayValue: {
                    values: [
                      {
                        mapValue: {
                          fields: {
                            setNumber: { integerValue: "1" },
                            reps: { nullValue: "NULL_VALUE" },
                            weight: { nullValue: "NULL_VALUE" },
                            loggedAt: { nullValue: "NULL_VALUE" },
                          },
                        },
                      },
                      {
                        mapValue: {
                          fields: {
                            setNumber: { integerValue: "2" },
                            reps: { nullValue: "NULL_VALUE" },
                            weight: { nullValue: "NULL_VALUE" },
                            loggedAt: { nullValue: "NULL_VALUE" },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
  createTime: new Date().toISOString(),
  updateTime: new Date().toISOString(),
};

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Inject the fake Firebase auth user into IndexedDB so that
 * onAuthStateChanged fires with the test user immediately on page load.
 */
async function injectFirebaseAuth(page: Page) {
  await page.addInitScript(
    ([uid, phone, apiKey, accessToken, refreshToken, expiryTime]) => {
      // Firebase v9 persists auth state in IndexedDB
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

      // Pre-populate IndexedDB before Firebase SDK initialises
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
        const store = tx.objectStore("firebaseLocalStorage");
        store.put({ fbase_key: AUTH_KEY, value: JSON.stringify(fakeUser) });
      };
    },
    [
      FAKE_UID,
      FAKE_PHONE,
      FAKE_API_KEY,
      FAKE_ACCESS_TOKEN,
      FAKE_REFRESH_TOKEN,
      TOKEN_EXPIRY,
    ] as const,
  );
}

/**
 * Set up page.route() handlers to intercept all Firebase HTTP calls.
 */
async function mockFirebaseRoutes(page: Page) {
  // Token refresh
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
        project_id: FAKE_PROJECT_ID,
      }),
    }),
  );

  // Account lookup (getAccount)
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

  // Firestore: createSession (addDoc → POST to collection)
  await page.route(
    `**/firestore.googleapis.com/**/users/${FAKE_UID}/sessions`,
    (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            name: `projects/${FAKE_PROJECT_ID}/databases/(default)/documents/users/${FAKE_UID}/sessions/${SESSION_ID}`,
            fields: {},
            createTime: new Date().toISOString(),
            updateTime: new Date().toISOString(),
          }),
        });
      } else {
        // GET (getDocs for active session check)
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ documents: [] }),
        });
      }
    },
  );

  // Firestore: session document reads/writes and listen stream
  await page.route(
    `**/firestore.googleapis.com/**/${SESSION_ID}**`,
    (route) => {
      const method = route.request().method();
      if (method === "GET") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_SESSION_DOC),
        });
      } else if (method === "PATCH" || method === "POST") {
        // updateDoc / listen
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_SESSION_DOC),
        });
      } else {
        route.continue();
      }
    },
  );

  // Firestore gRPC-web Listen stream (onSnapshot)
  await page.route("**/google.firestore.v1.Firestore/Listen**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        targetChange: { targetChangeType: "CURRENT", targetIds: [] },
      }),
    });
  });

  // Catch-all: block remaining Firebase calls
  await page.route("**/googleapis.com/**", (route) => route.abort());
}

// ── test ──────────────────────────────────────────────────────────────────────

test.describe("Session happy-path flow", () => {
  test.beforeEach(async ({ page }) => {
    await injectFirebaseAuth(page);
    await mockFirebaseRoutes(page);
  });

  test("complete workout session flow", async ({ page }) => {
    // ── 1. Navigate to home ───────────────────────────────────────────────────
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

    // ── 10. Assert confirm button is visible with weight and reps values ───────
    await expect(confirmBtn).toBeVisible();

    // ── 11. Click confirm button ──────────────────────────────────────────────
    await confirmBtn.click();

    // ── 12. Assert drawer closes ──────────────────────────────────────────────
    await expect(confirmBtn).not.toBeVisible({ timeout: 3_000 });

    // ── 13. Assert RestTimer renders with "1:30" ──────────────────────────────
    await expect(page.getByText("1:30")).toBeVisible({ timeout: 3_000 });

    // ── 14. Click "Skip Rest" ─────────────────────────────────────────────────
    await page.getByRole("button", { name: /skip rest/i }).click();

    // ── 15. Assert set view advances to "Set 2 of 2" ─────────────────────────
    await expect(page.getByText(/Set\s+2\s+of\s+2/i)).toBeVisible({
      timeout: 3_000,
    });

    // ── 16. Repeat for set 2 ──────────────────────────────────────────────────
    await page.getByRole("button", { name: /^done$/i }).click();
    const confirmBtn2 = page.getByRole("button", { name: /kg × \d+ reps/i });
    await expect(confirmBtn2).toBeVisible({ timeout: 3_000 });
    await confirmBtn2.click();

    // ── 17. Assert redirect back to exercise list ─────────────────────────────
    await expect(page.getByText("Lateral Raises")).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText("Lat Pulldown")).toBeVisible();

    // ── 18. Assert first exercise shows done state (CheckCircle icon / Done text) ──
    // When all sets are logged, the exercise button becomes disabled and shows "Done"
    await expect(
      page
        .locator("button")
        .filter({ hasText: "Bench Press" })
        .locator("text=Done"),
    ).toBeVisible({ timeout: 3_000 });
  });
});
