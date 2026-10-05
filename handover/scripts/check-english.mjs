// Check maintained project text; never inspect or rewrite saved user data.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const cwd = path.dirname(fileURLToPath(import.meta.url));
const root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  cwd, encoding: "utf8",
}).trim();
const files = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
  cwd: root, encoding: "utf8",
}).split("\0").filter(Boolean);
const binaryExtensions = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".woff", ".woff2",
  ".ttf", ".otf", ".pdf", ".zip", ".gz", ".mp4", ".mov", ".mp3", ".wav",
]);
const failures = [];
let checked = 0;
for (const file of new Set(files)) {
  const absolute = path.join(root, file);
  if (binaryExtensions.has(path.extname(file)) || !existsSync(absolute)) continue;
  checked++;
  let source;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(absolute));
  } catch {
    failures.push(`${file}: invalid UTF-8`);
    continue;
  }
  const lines = source.split("\n");
  for (let index = 0; index < lines.length; index++) {
    if (/\p{Script=Han}/u.test(lines[index])) failures.push(`${file}:${index + 1}`);
  }
}
if (failures.length) {
  process.stderr.write(`English-only check failed at:\n${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`English-only check passed (${checked} text files).\n`);
}
