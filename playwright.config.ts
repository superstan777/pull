import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

// Load .env.local so NEXT_PUBLIC_* vars are available to the test process
// (Next.js loads them for the dev server, but not for the Playwright runner).
// In CI these vars come from GitHub Actions secrets — dotenv is a no-op there.
dotenv.config({ path: ".env.local" });

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 390, height: 844 },
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // In CI: build + start production server (faster, closer to production).
    // Locally: reuse the already-running dev server to avoid double builds.
    command: process.env.CI ? "npm run build && npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000, // build can take a while on CI runners
  },
});
