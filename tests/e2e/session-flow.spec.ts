/**
 * E2E session flow test — happy path
 *
 * Auth strategy:
 *   Real Firebase phone auth using the dedicated E2E test account:
 *     Phone : +48500500500
 *     OTP   : 500500  (static code configured in Firebase Console → Auth → Test phone numbers)
 *
 *   The test goes through the actual login UI so the phone-auth flow is
 *   covered end-to-end.  reCAPTCHA is set to invisible size; Firebase
 *   test phone numbers bypass real SMS and skip the reCAPTCHA challenge.
 *
 * Firestore strategy:
 *   All Firestore endpoints are intercepted via page.route() so no real data
 *   is written to the production database.
 *
 * The app is started via playwright.config.ts webServer (npm run dev).
 * Real Firebase credentials are loaded from .env.local locally and from
 * GitHub Actions secrets in CI.
 */

import { test, expect, type Page } from "@playwright/test";

// ── constants ─────────────────────────────────────────────────────────────────

/** Firebase test phone number configured in Firebase Console */
const TEST_PHONE = "+48500500500";
/** Static OTP paired with TEST_PHONE in Firebase Console */
const TEST_OTP = "500500";

const SESSION_ID = "test-session-id";
const MOCK_PROJECT_ID = "pull-3d186";

// ── Firestore mock documents ──────────────────────────────────────────────────

const MOCK_SESSION_DOC = {
  name: `projects/${MOCK_PROJECT_ID}/databases/(default)/documents/users/e2e-test-user/sessions/${SESSION_ID}`,
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
 * Sign in through the login UI using the Firebase test phone account.
 * Firebase test phone numbers bypass real SMS; the static OTP is accepted
 * server-side without a reCAPTCHA challenge (invisible reCAPTCHA + test number).
 * After successful login the page is redirected to "/".
 */
async function loginWithTestAccount(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/phone number/i).fill(TEST_PHONE);
  await page.getByRole("button", { name: /send code/i }).click();
  await page.getByLabel(/verification code/i).waitFor({ timeout: 15_000 });
  await page.getByLabel(/verification code/i).fill(TEST_OTP);
  await page.getByRole("button", { name: /^verify$/i }).click();
  await page.waitForURL("/", { timeout: 15_000 });
}

/**
 * Intercept all Firestore endpoints so no real data is written to the
 * production database.  Firebase Auth requests pass through to the real
 * Firebase project (real credentials + test phone number).
 */
async function mockFirestoreRoutes(page: Page) {
  // createSession (addDoc → POST to collection) — * wildcard matches any UID
  await page.route(
    "**/firestore.googleapis.com/**/users/*/sessions",
    (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            name: `projects/${MOCK_PROJECT_ID}/databases/(default)/documents/users/e2e-test-user/sessions/${SESSION_ID}`,
            fields: {},
            createTime: new Date().toISOString(),
            updateTime: new Date().toISOString(),
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ documents: [] }),
        });
      }
    },
  );

  // getActiveSession uses getDocs+orderBy which sends a runQuery POST
  await page.route("**/firestore.googleapis.com/**:runQuery**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      // Empty runQuery result: single element with only readTime = no documents
      body: JSON.stringify([{ readTime: new Date().toISOString() }]),
    }),
  );

  // Session document reads (GET) and writes (PATCH / updateDoc)
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

  // gRPC-web Listen stream (onSnapshot)
  await page.route("**/google.firestore.v1.Firestore/Listen**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        targetChange: { targetChangeType: "CURRENT", targetIds: [] },
      }),
    });
  });

  // Block any remaining Firestore calls not matched above
  await page.route("**/firestore.googleapis.com/**", (route) => route.abort());
}

// ── test ──────────────────────────────────────────────────────────────────────

test.describe("Session happy-path flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockFirestoreRoutes(page);
  });

  test("complete workout session flow", async ({ page }) => {
    // ── 1. Sign in with the Firebase test account ─────────────────────────────
    await loginWithTestAccount(page);
    // loginWithTestAccount ends with a redirect to "/" — no extra goto needed

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
