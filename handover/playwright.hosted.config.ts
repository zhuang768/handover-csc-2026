import { defineConfig, devices } from "@playwright/test";

// Opt in explicitly: this case signs in with the shared student demo account.
// It neither resets the school nor sends a successful profile mutation.
const supplied = process.env.HANDOVER_TEST_ORIGIN;
if (!supplied)
  throw new Error("Set HANDOVER_TEST_ORIGIN to the deployed HTTPS origin.");
const origin = new URL(supplied);
if (
  origin.protocol !== "https:" ||
  origin.username ||
  origin.password ||
  origin.search ||
  origin.hash ||
  origin.pathname !== "/"
)
  throw new Error(
    "Use a plain HTTPS origin without credentials or query parameters.",
  );

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/built-offline.spec.ts",
  timeout: 120_000,
  expect: { timeout: 60_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: { baseURL: origin.origin, trace: "off", ...devices["Desktop Chrome"] },
});
