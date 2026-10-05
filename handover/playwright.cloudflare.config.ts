import { defineConfig } from "@playwright/test";
import builtConfig from "./playwright.built.config";

const port = 8790;
const baseURL = `http://127.0.0.1:${port}`;
const persist = `${process.cwd()}/.wrangler/cloudflare-e2e`;

export default defineConfig({
  ...builtConfig,
  use: { ...builtConfig.use, baseURL },
  webServer: {
    command: `node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 migrations apply DB --local --config wrangler.cloudflare.jsonc --persist-to ${persist} && node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js dev --config wrangler.cloudflare.jsonc --local --persist-to ${persist} --ip 127.0.0.1 --port ${port} --inspector-port 0`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
