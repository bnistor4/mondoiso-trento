/**
 * Publish a region's exported files to R2 and empty the local cache.
 *
 *   npm run publish -- <region> [--yes] [--keep] [--force] [--dry-run]
 *
 * Uploads everything in data/web/regions/<region>/ (only what `npm run export` changed) to the
 * bucket in hosting.ts: tiles first, then previews and the content-hashed data files, world.json last
 * (it names the current files, so the live site never points at one that is not there yet).
 *
 * Rate: Cloudflare R2 REST API is limited to 1200 requests per 5 minutes per account
 * (https://developers.cloudflare.com/r2/platform/limits/). This tool uses a token bucket near 4/s,
 * a small worker pool, skip-if-unchanged via size + MD5/etag, and backs off on 429 using Retry-After.
 *
 * Auth: CLOUDFLARE_API_TOKEN (R2 write) if set, else the wrangler login (`npx wrangler login`).
 * Optional higher throughput: set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY for the S3-compatible API
 * (not implemented here; would need AWS SigV4 or an SDK dependency).
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { HOSTING } from "./hosting.ts";
import { WEB_CACHE, WEB_STATE } from "./paths.ts";
import { REGIONS } from "./places.ts";
import { runPublish } from "./publish-lib.ts";

const args = process.argv.slice(2);
const region = args.find((a) => !a.startsWith("--")) ?? "roma-centro";
if (!REGIONS[region]) throw new Error(`unknown region ${region}`);
const dir = join(WEB_CACHE, "regions", region);
const pending = join(WEB_CACHE, `${region}.state.json`);
const force = args.includes("--force");
const dryRun = args.includes("--dry-run");
if (!existsSync(dir)) {
  console.log(`nothing to publish: ${dir} is empty (run npm run export first)`);
  process.exit(0);
}

const rank = (f: string) => (f.startsWith("tiles/") ? 0 : f.endsWith("world.json") ? 2 : 1);
const files = readdirSync(dir, { recursive: true })
  .map(String)
  .filter((f) => /\.(avif|webp|json)$/.test(f))
  .sort((a, b) => rank(a) - rank(b));
const bytes = files.reduce((s, f) => s + statSync(join(dir, f)).size, 0);
const tiles = files.filter((f) => f.startsWith("tiles/")).length;
const mode = dryRun ? "dry-run" : "publish";
console.log(
  `${region} (${mode}): ${tiles} tiles + ${files.length - tiles} data files, ${(bytes / 1e6).toFixed(1)} MB → r2://${HOSTING.bucket}/regions/${region}/ (${HOSTING.origin})${force ? " · --force" : ""}`,
);

if (dryRun) {
  console.log("  dry-run: no uploads, no cache or state changes");
} else if (!args.includes("--yes")) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ok = /^y(es)?$/i.test((await rl.question("publish? [y/N] ")).trim());
  rl.close();
  if (!ok) process.exit(1);
}

if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
  console.log(
    "  note: R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are set but this publish path uses the Cloudflare REST API only (S3 API would need extra signing code or a dependency)",
  );
}

let token = process.env.CLOUDFLARE_API_TOKEN ?? "";
const refresh = () => {
  token = execFileSync("npx", ["-y", "wrangler@4", "auth", "token"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  })
    .trim()
    .split("\n")
    .at(-1)!;
};
if (!dryRun && !token) refresh();

const logDir = join(WEB_CACHE, "..", "publish-logs");
const eventLogPath = dryRun
  ? undefined
  : join(logDir, `publish-${region}-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`);

try {
  const counters = await runPublish({
    region,
    dir,
    files,
    yes: args.includes("--yes"),
    keep: args.includes("--keep"),
    force,
    dryRun,
    token: token || "dry-run",
    refreshToken: refresh,
    pendingStatePath: pending,
    webStateDir: WEB_STATE,
    eventLogPath,
  });

  if (dryRun) {
    console.log(`  dry-run: would upload ${counters.uploaded}, would skip ${counters.skipped}`);
    process.exit(0);
  }

  const worldRel = files.find((f) => f.endsWith("world.json"));
  const probe = worldRel ?? files.find((f) => f.startsWith("tiles/")) ?? files[0];
  const r = await fetch(`${HOSTING.origin}/regions/${region}/${probe}?check=${Date.now()}`);
  if (!r.ok) throw new Error(`${HOSTING.origin}/regions/${region}/${probe}: ${r.status} (uploaded, cache kept)`);
  console.log(`  ${HOSTING.origin}/regions/${region}/${probe}: ${r.status}`);

  mkdirSync(WEB_STATE, { recursive: true });
  if (existsSync(pending)) renameSync(pending, join(WEB_STATE, `${region}.json`));
  if (!args.includes("--keep")) {
    rmSync(dir, { recursive: true, force: true });
    console.log(`  cache emptied: ${dir}`);
  }
  if (eventLogPath) console.log(`  event log: ${eventLogPath}`);
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}