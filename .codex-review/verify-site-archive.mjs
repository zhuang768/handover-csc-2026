// Read-only release provenance and packaged public/migration byte verification.
// No build, extraction, remote Git operation, credential access, or payload output.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const PROJECT_ID = "appgprj_6ac11cc258608191ba6f05fcd6e031fb";
const MAX_BYTES = 256 * 1024 * 1024;
const parentRepo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const report = { ok: false };
let stage = "arguments";

function requireCheck(condition, code) {
  if (!condition) {
    const error = new Error(code);
    error.safeCode = code;
    throw error;
  }
}
function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
function git(cwd, args) {
  const env = { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_OPTIONAL_LOCKS: "0" };
  for (const key of ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_COMMON_DIR"]) delete env[key];
  return execFileSync("git", ["-C", cwd, ...args], {
    env, stdio: ["ignore", "pipe", "pipe"], maxBuffer: MAX_BYTES,
  });
}
function gitText(cwd, args) {
  return git(cwd, args).toString("utf8").trim();
}
function parseJson(bytes) {
  return JSON.parse(bytes.toString("utf8"));
}

// Parse standard tar, PAX and GNU long names in memory; never extract paths.
function tarNumber(field) {
  let number;
  if (field[0] & 0x80) {
    let value = BigInt(field[0] & 0x7f);
    for (const byte of field.subarray(1)) value = value * 256n + BigInt(byte);
    requireCheck(value <= BigInt(MAX_BYTES), "TAR_NUMBER_LIMIT");
    number = Number(value);
  } else {
    const text = field.toString("ascii").replaceAll("\0", "").trim();
    requireCheck(!text || /^[0-7]+$/.test(text), "TAR_NUMBER_INVALID");
    number = text ? Number.parseInt(text, 8) : 0;
  }
  requireCheck(Number.isSafeInteger(number) && number >= 0 && number <= MAX_BYTES, "TAR_NUMBER_LIMIT");
  return number;
}
function tarText(field) {
  return field.toString("utf8").split("\0", 1)[0];
}
function paxEntries(bytes) {
  const values = {};
  for (let offset = 0; offset < bytes.length;) {
    const space = bytes.indexOf(32, offset);
    requireCheck(space > offset, "PAX_INVALID");
    const lengthText = bytes.toString("ascii", offset, space);
    requireCheck(/^\d+$/.test(lengthText), "PAX_INVALID");
    const length = Number(lengthText);
    requireCheck(Number.isSafeInteger(length) && length > space - offset + 2 && offset + length <= bytes.length, "PAX_INVALID");
    requireCheck(bytes[offset + length - 1] === 10, "PAX_INVALID");
    const entry = bytes.toString("utf8", space + 1, offset + length - 1);
    const equals = entry.indexOf("=");
    requireCheck(equals > 0, "PAX_INVALID");
    const key = entry.slice(0, equals);
    if (key === "path" || key === "size") values[key] = entry.slice(equals + 1);
    offset += length;
  }
  return values;
}
function tarFiles(compressed) {
  const bytes = gunzipSync(compressed, { maxOutputLength: MAX_BYTES });
  const files = new Map();
  let globalPax = {}, nextPax = {}, longName;
  for (let offset = 0; offset + 512 <= bytes.length;) {
    const header = bytes.subarray(offset, offset + 512);
    if (header.every(byte => byte === 0)) break;
    const checksum = tarNumber(header.subarray(148, 156));
    let sum = 0;
    for (let index = 0; index < 512; index++) sum += index >= 148 && index < 156 ? 32 : header[index];
    requireCheck(sum === checksum, "TAR_CHECKSUM_INVALID");
    const type = String.fromCharCode(header[156] || 48);
    let size = tarNumber(header.subarray(124, 136));
    const metadata = { ...globalPax, ...nextPax };
    if (!["x", "g", "L", "K"].includes(type) && metadata.size !== undefined) {
      requireCheck(/^\d+$/.test(metadata.size), "PAX_SIZE_INVALID");
      size = Number(metadata.size);
      requireCheck(Number.isSafeInteger(size) && size <= MAX_BYTES, "PAX_SIZE_LIMIT");
    }
    const start = offset + 512;
    requireCheck(start + size <= bytes.length, "TAR_TRUNCATED");
    const data = bytes.subarray(start, start + size);
    offset = start + Math.ceil(size / 512) * 512;
    if (type === "x") { nextPax = paxEntries(data); continue; }
    if (type === "g") { globalPax = { ...globalPax, ...paxEntries(data) }; continue; }
    if (type === "L") { longName = tarText(data).replace(/\n$/, ""); continue; }
    requireCheck(type !== "K" && type !== "1" && type !== "2", "TAR_LINK_NOT_ALLOWED");
    requireCheck(type === "0" || type === "5", "TAR_ENTRY_TYPE_NOT_ALLOWED");
    const prefix = header.toString("ascii", 257, 263) === "ustar\0"
      ? tarText(header.subarray(345, 500)) : "";
    const raw = metadata.path ?? longName ?? [prefix, tarText(header.subarray(0, 100))].filter(Boolean).join("/");
    nextPax = {}; longName = undefined;
    requireCheck(raw && !raw.includes("\\") && !path.posix.isAbsolute(raw) && !raw.split("/").includes(".."), "TAR_PATH_UNSAFE");
    const name = path.posix.normalize(raw).replace(/\/$/, "");
    // macOS bsdtar emits AppleDouble xattr sidecars that its listing hides.
    // They are metadata, not deployable files; accept only the real binary format.
    if (path.posix.basename(name).startsWith("._")) {
      const companion = path.posix.join(path.posix.dirname(name), path.posix.basename(name).slice(2));
      requireCheck(type === "0" && data.length >= 4 && data.readUInt32BE(0) === 0x00051607, "TAR_APPLEDOUBLE_INVALID");
      requireCheck(companion === "dist" || companion.startsWith("dist/"), "TAR_ROOT_NOT_DIST");
      continue;
    }
    requireCheck(name === "dist" || name.startsWith("dist/"), "TAR_ROOT_NOT_DIST");
    if (type === "5") continue;
    requireCheck(!files.has(name), "TAR_DUPLICATE_FILE");
    files.set(name, data);
  }
  return files;
}

try {
  const flags = new Map();
  const args = process.argv.slice(2);
  requireCheck(args.length === 6, "USAGE_REQUIRE_THREE_FLAGS");
  for (let index = 0; index < args.length; index += 2) {
    requireCheck(["--reviewed-parent-sha", "--release-checkout", "--archive"].includes(args[index]) && !flags.has(args[index]), "USAGE_INVALID_FLAG");
    flags.set(args[index], args[index + 1]);
  }
  const reviewed = flags.get("--reviewed-parent-sha");
  const checkoutArg = flags.get("--release-checkout");
  const archiveArg = flags.get("--archive");
  requireCheck(/^[a-f0-9]{40}$/i.test(reviewed ?? ""), "REQUIRE_FULL_PARENT_SHA");
  requireCheck(path.isAbsolute(checkoutArg ?? "") && path.isAbsolute(archiveArg ?? ""), "REQUIRE_ABSOLUTE_PATHS");
  const checkout = realpathSync(checkoutArg);
  const archive = realpathSync(archiveArg);
  requireCheck(lstatSync(archive).isFile(), "ARCHIVE_NOT_REGULAR_FILE");
  const repoRoot = realpathSync(gitText(parentRepo, ["rev-parse", "--show-toplevel"]));
  const relative = path.relative(repoRoot, checkout);
  requireCheck(relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative), "RELEASE_CHECKOUT_MUST_BE_OUTSIDE_PARENT");
  requireCheck(realpathSync(gitText(checkout, ["rev-parse", "--show-toplevel"])) === checkout, "RELEASE_GIT_ROOT_MISMATCH");

  stage = "source_tree";
  const parentSha = gitText(repoRoot, ["rev-parse", `${reviewed}^{commit}`]);
  const parentTree = gitText(repoRoot, ["rev-parse", `${parentSha}:handover`]);
  const releaseSha = gitText(checkout, ["rev-parse", "HEAD^{commit}"]);
  const releaseTree = gitText(checkout, ["rev-parse", "HEAD^{tree}"]);
  Object.assign(report, { reviewedParentSha: parentSha, reviewedAppTree: parentTree, releaseCommitSha: releaseSha, releaseTree });
  requireCheck(parentTree === releaseTree, "SOURCE_TREE_MISMATCH");
  requireCheck(!gitText(checkout, ["status", "--porcelain=v1", "--untracked-files=normal"]), "RELEASE_SOURCE_NOT_CLEAN");

  stage = "archive_manifest";
  const compressed = readFileSync(archive);
  const files = tarFiles(compressed);
  const sourceManifest = parseJson(git(repoRoot, ["show", `${parentSha}:handover/.openai/hosting.json`]));
  const archivedManifest = parseJson(files.get("dist/.openai/hosting.json"));
  for (const manifest of [sourceManifest, archivedManifest]) {
    requireCheck(manifest.project_id === PROJECT_ID && manifest.d1 === "DB", "SITE_ID_OR_DB_BINDING_MISMATCH");
    requireCheck(!manifest.static && manifest.r2 === null, "WORKER_MANIFEST_MISMATCH");
  }
  requireCheck(files.has("dist/server/index.js"), "WORKER_ENTRY_MISSING");
  const wrangler = parseJson(files.get("dist/server/wrangler.json"));
  requireCheck(Array.isArray(wrangler.d1_databases) && wrangler.d1_databases.some(binding => binding.binding === "DB"), "BUILT_DB_BINDING_MISSING");
  Object.assign(report, { projectId: PROJECT_ID, d1Binding: "DB", archiveSha256: sha256(compressed) });

  stage = "public_asset_bytes";
  const assets = [
    "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png",
    "icons/icon-maskable-512.png", "icons/apple-touch-icon.png", "sw.js", "offline.htm", "favicon.svg",
  ];
  const checks = [];
  for (const asset of assets) {
    const expected = git(repoRoot, ["show", `${parentSha}:handover/public/${asset}`]);
    const actual = files.get(`dist/client/${asset}`);
    requireCheck(actual && expected.equals(actual), "PUBLIC_ASSET_BYTES_MISMATCH");
    checks.push({ path: `public/${asset}`, bytes: actual.length, sha256: sha256(actual) });
  }

  stage = "drizzle_bytes";
  const drizzle = git(repoRoot, ["ls-tree", "-r", "-z", "--name-only", `${parentSha}:handover`, "--", "drizzle/"])
    .toString("utf8").split("\0").filter(Boolean).sort();
  requireCheck(drizzle.length > 0 && drizzle.includes("drizzle/meta/_journal.json"), "REVIEWED_MIGRATIONS_MISSING");
  const archivedDrizzle = [...files.keys()].filter(name => name.startsWith("dist/.openai/drizzle/"))
    .map(name => name.slice("dist/.openai/".length)).sort();
  requireCheck(JSON.stringify(drizzle) === JSON.stringify(archivedDrizzle), "DRIZZLE_INVENTORY_MISMATCH");
  for (const file of drizzle) {
    const expected = git(repoRoot, ["show", `${parentSha}:handover/${file}`]);
    const actual = files.get(`dist/.openai/${file}`);
    requireCheck(actual && expected.equals(actual), "DRIZZLE_BYTES_MISMATCH");
    checks.push({ path: file, bytes: actual.length, sha256: sha256(actual) });
  }
  Object.assign(report, {
    ok: true, publicAssetsChecked: assets.length, migrationFilesChecked: drizzle.length, checks,
    coverage: "Reviewed app tree equals release HEAD; Site/DB identity; Worker entry; public PWA and complete drizzle bytes. Not a build, runtime, HTTPS, migration-apply, browser, or install test.",
  });
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
} catch (error) {
  // Git stderr, full manifests, Wrangler vars, credentials and response bodies stay private.
  process.stdout.write(JSON.stringify({ ...report, ok: false, failedStage: stage, code: error?.safeCode ?? "CHECK_FAILED" }, null, 2) + "\n");
  process.exitCode = 1;
}
