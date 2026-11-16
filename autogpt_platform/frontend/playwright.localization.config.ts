import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/playwright",
  testMatch: "language-switching.browser.spec.ts",
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    launchOptions: { args: ["--disable-gpu"] },
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
});
