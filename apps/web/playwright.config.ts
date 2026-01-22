import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [
        ["html", { outputFolder: "playwright-report" }],
        ["junit", { outputFile: "playwright-report/results.xml" }],
        ["github"],
      ]
    : [
        ["html", { outputFolder: "playwright-report" }],
        ["list"],
      ],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    cwd: __dirname,
    timeout: 120_000,
  },
  projects: [
    // Public tests - no auth required
    {
      name: "public",
      testMatch: /.*\.spec\.ts/,
      testIgnore: /e2e\//,
      use: { ...devices["Desktop Chrome"] },
    },
    // Admin e2e tests
    {
      name: "admin",
      testMatch: /e2e\/admin\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    // Dealer e2e tests
    {
      name: "dealer",
      testMatch: /e2e\/dealer\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
