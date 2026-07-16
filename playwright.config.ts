import { defineConfig } from "@playwright/test";
import env from "@support/environments/env.config";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ["html", { open: "never" }],
    ["list"],
  ],
  use: {
    baseURL: env.BASE_URL,
    ignoreHTTPSErrors: true,
    trace: "retain-on-first-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: "sanity",
      testMatch: /sanity\/.*\.spec\.ts/,
      use: { browserName: "chromium", viewport: { width: 1440, height: 800 } },
    },
    {
      name: "regression",
      testMatch: /regression\/.*\.spec\.ts/,
      use: { browserName: "chromium", viewport: { width: 1440, height: 800 } },
    },
    {
      name: "api",
      testMatch: /api\/.*\.spec\.ts/,
    },
  ],
});
