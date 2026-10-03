import { defineConfig, devices } from "@playwright/test";

const port = 5199;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: "**/built-*.spec.ts",
  timeout: 120_000,
  expect: { timeout: 60_000 },
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "off",
  },
  webServer: {
    command: `HANDOVER_PERSIST=${process.cwd()}/.wrangler/e2e-state npm run dev -- --port ${port} --host 127.0.0.1 --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
