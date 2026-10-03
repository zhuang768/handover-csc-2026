import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const persist = process.env.HANDOVER_PERSIST ?? path.join(root, ".wrangler/state");
const wrangler = path.join(root, "node_modules/wrangler/bin/wrangler.js");
const result = spawnSync(
  process.execPath,
  [
    wrangler,
    "d1",
    "migrations",
    "apply",
    "site-creator-d1",
    "--local",
    "--persist-to",
    persist,
    "--config",
    path.join(root, "wrangler.migrate.json"),
  ],
  { cwd: root, stdio: "inherit" },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
