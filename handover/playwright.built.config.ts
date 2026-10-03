import { defineConfig, devices } from "@playwright/test";

const port = 8788;
const baseURL = `http://127.0.0.1:${port}`;
const persist = `${process.cwd()}/.wrangler/built-e2e`;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/built-*.spec.ts",
  timeout: 120_000,
  expect: { timeout: 60_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "off",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: `HANDOVER_PERSIST=${persist} npm run db:migrate && HANDOVER_PERSIST=${persist} node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js dev --config dist/server/wrangler.json --local --persist-to ${persist} --ip 127.0.0.1 --port ${port} --inspector-port 0`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
