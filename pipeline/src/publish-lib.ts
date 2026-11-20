/**
 * R2 publish helpers: rate limiting, skip-if-unchanged, retries and counters.
 * Used by publish.ts and unit tests (mocked fetch only in tests).
 */
import { createHash } from "node:crypto";
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { HOSTING } from "./hosting.ts";
import { verifyWorldReferences, type WorldReferences } from "./publish-references.ts";

/** Cloudflare REST API: 1200 requests per 5 minutes per account (see R2 platform limits). */
export const CF_R2_REST_LIMIT_PER_5MIN = 1200;
export const CF_R2_REST_LIMIT_WINDOW_MS = 5 * 60_000;
export const DEFAULT_RATE_PER_SEC = CF_R2_REST_LIMIT_PER_5MIN / (CF_R2_REST_LIMIT_WINDOW_MS / 1000);
export const MAX_UPLOAD_ATTEMPTS = 8;
export const WORKER_COUNT = 6;
export const STALL_WARN_MS = 120_000;
export const PROGRESS_EVERY_OBJECTS = 100;
export const PROGRESS_EVERY_MS = 30_000;

export const MD5_META_KEY = "md5";

const TYPES: Record<string, string> = { avif: "image/avif", webp: "image/webp", json: "application/json" };

export interface RemoteObject {
  size: number;
  etag?: string;
  custom_metadata?: Record<string, string>;
}

export interface CfErrorBody {
  success?: boolean;
  errors?: { code: number; message: string }[];
  messages?: string[];
  result?: { size?: string | number; etag?: string };
}

export interface PublishCounters {
  uploaded: number;
  skipped: number;
  retried: number;
  count429: number;
  count5xx: number;
  networkErrors: number;
  backoffWaitMs: number;
}

export interface PublishEvent {
  at: number;
  key: string;
  attempt: number;
  kind: "upload" | "skip" | "error" | "retry";
  status?: number;
  cfCode?: number;
  cfMessage?: string;
  retryAfter?: string;
  waitMs?: number;
  message?: string;
}

export interface RunPublishOptions {
  region: string;
  dir: string;
  files: string[];
  yes?: boolean;
  keep?: boolean;
  force?: boolean;
  dryRun?: boolean;
  token: string;
  refreshToken: () => void;
  pendingStatePath: string;
  webStateDir: string;
  fetchImpl?: typeof fetch;
  logEvents?: boolean;
  eventLogPath?: string;
  onStdout?: (line: string) => void;
}

export function clampTimeout(ms: number): number {
  return Math.max(0, ms);
}

export function parseRetryAfterMs(header: string | null): number | null {
  if (!header?.trim()) return null;
  const sec = Number(header.trim());
  if (Number.isFinite(sec)) return sec * 1000;
  const when = Date.parse(header);
  if (Number.isFinite(when)) return clampTimeout(when - Date.now());
  return null;
}

export function rateLimitWaitMs(retryAfter: string | null, fallbackMs = 30_000): number {
  return clampTimeout(parseRetryAfterMs(retryAfter) ?? fallbackMs);
}

export function md5Hex(body: Buffer): string {
  return createHash("md5").update(body).digest("hex");
}

export function normalizeEtag(etag: string | undefined): string | undefined {
  return etag?.replace(/^"|"$/g, "").toLowerCase();
}

export function isUnchanged(localSize: number, localMd5: string, remote: RemoteObject | undefined): boolean {
  if (!remote || remote.size !== localSize) return false;
  const etag = normalizeEtag(remote.etag);
  if (etag === localMd5.toLowerCase()) return true;
  const meta = remote.custom_metadata?.[MD5_META_KEY];
  return !!meta && meta.toLowerCase() === localMd5.toLowerCase();
}

export function parseCfErrors(j: CfErrorBody): { code?: number; message?: string } {
  const e = j.errors?.[0];
  return e ? { code: e.code, message: e.message } : {};
}

export class AdaptiveRateLimiter {
  private tokens: number;
  private lastRefill = Date.now();
  private rate: number;
  private pauseUntil = 0;
  private last429 = 0;

  constructor(initialRate = DEFAULT_RATE_PER_SEC * 0.95) {
    this.rate = initialRate;
    this.tokens = initialRate * 2;
  }

  get ratePerSec() {
    return this.rate;
  }
  get pausedUntil() {
    return this.pauseUntil;
  }

  note429(waitMs: number) {
    this.last429 = Date.now();
    this.rate = Math.max(0.5, this.rate * 0.65);
    this.pauseUntil = Math.max(this.pauseUntil, Date.now() + waitMs);
  }

  noteSuccess() {
    if (Date.now() - this.last429 > 60_000) {
      this.rate = Math.min(DEFAULT_RATE_PER_SEC, this.rate * 1.02 + 0.01);
    }
  }

  async acquire(): Promise<number> {
    let waitMs = 0;
    for (;;) {
      const now = Date.now();
      if (now < this.pauseUntil) {
        const w = clampTimeout(this.pauseUntil - now);
        await sleep(w);
        waitMs += w;
        continue;
      }
      const elapsed = (now - this.lastRefill) / 1000;
      if (elapsed > 0) {
        this.tokens = Math.min(this.rate * 2, this.tokens + elapsed * this.rate);
        this.lastRefill = now;
      }
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return waitMs;
      }
      const need = clampTimeout((1 - this.tokens) / this.rate * 1000);
      await sleep(need);
      waitMs += need;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, clampTimeout(ms)));
}

function encodeObjectKey(key: string): string {
  return key.split("/").map((p) => encodeURIComponent(p)).join("/");
}

export async function listRemoteObjects(
  accountId: string,
  bucket: string,
  prefix: string,
  token: string,
  fetchImpl: typeof fetch,
  onListError?: (msg: string) => void,
): Promise<Map<string, RemoteObject>> {
  const base = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects`;
  const out = new Map<string, RemoteObject>();
  let cursor: string | undefined;
  for (;;) {
    const url = new URL(base);
    url.searchParams.set("prefix", prefix);
    url.searchParams.set("per_page", "1000");
    if (cursor) url.searchParams.set("cursor", cursor);
    const r = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` } });
    const j = (await r.json()) as {
      success: boolean;
      result?: { key: string; size: number; etag?: string; custom_metadata?: Record<string, string> }[];
      result_info?: { is_truncated?: boolean; cursor?: string };
      errors?: { code: number; message: string }[];
    };
    if (!r.ok || !j.success) {
      onListError?.(`list objects ${r.status}: ${JSON.stringify(j.errors)}`);
      break;
    }
    for (const obj of j.result ?? []) {
      out.set(obj.key, { size: obj.size, etag: obj.etag, custom_metadata: obj.custom_metadata });
    }
    if (!j.result_info?.is_truncated || !j.result_info.cursor) break;
    cursor = j.result_info.cursor;
  }
  return out;
}

export async function runPublish(opts: RunPublishOptions): Promise<PublishCounters> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const log = opts.onStdout ?? ((s: string) => console.log(s));
  const events: PublishEvent[] = [];
  const writeEvent = (ev: PublishEvent) => {
    events.push(ev);
    if (opts.eventLogPath) {
      mkdirSync(join(opts.eventLogPath, ".."), { recursive: true });
      appendFileSync(opts.eventLogPath, `${JSON.stringify(ev)}\n`);
    }
  };

  const counters: PublishCounters = {
    uploaded: 0,
    skipped: 0,
    retried: 0,
    count429: 0,
    count5xx: 0,
    networkErrors: 0,
    backoffWaitMs: 0,
  };

  const limiter = new AdaptiveRateLimiter();
  const prefix = `regions/${opts.region}/`;
  let remote = new Map<string, RemoteObject>();
  if (!opts.force) {
    remote = await listRemoteObjects(HOSTING.accountId, HOSTING.bucket, prefix, opts.token, fetchImpl, (m) =>
      log(`  list bucket: ${m} (will upload all local files)`),
    );
  }

  const apiPut = (key: string) =>
    `https://api.cloudflare.com/client/v4/accounts/${HOSTING.accountId}/r2/buckets/${HOSTING.bucket}/objects/${encodeObjectKey(key)}`;

  let lastComplete = Date.now();
  const stallTimer = setInterval(() => {
    const idle = Date.now() - lastComplete;
    if (idle >= STALL_WARN_MS) {
      log(
        `  publish stall: no upload completed for ${(idle / 1000).toFixed(0)}s. rate=${limiter.ratePerSec.toFixed(2)}/s pauseUntil=${limiter.pausedUntil ? new Date(limiter.pausedUntil).toISOString() : "none"}`,
      );
    }
  }, PROGRESS_EVERY_MS);
  stallTimer.unref?.();

  const t0 = Date.now();
  let progressDone = 0;
  let lastProgressAt = t0;

  const progress = () => {
    const now = Date.now();
  const elapsed = (now - t0) / 1000;
    const done = progressDone;
    const total = opts.files.length;
    if (done % PROGRESS_EVERY_OBJECTS !== 0 && now - lastProgressAt < PROGRESS_EVERY_MS) return;
    lastProgressAt = now;
    const rate = done > 0 ? done / elapsed : 0;
    const eta = rate > 0 ? (total - done) / rate : 0;
    log(`  ${done}/${total} · ${rate.toFixed(2)}/s · ETA ${eta.toFixed(0)}s · elapsed ${elapsed.toFixed(0)}s`);
  };

  const putOne = async (rel: string): Promise<void> => {
    const body = readFileSync(join(opts.dir, rel));
    const key = `${prefix}${rel}`;
    const localMd5 = md5Hex(body);
    const remoteMeta = remote.get(key);
    if (!opts.force && !opts.dryRun && isUnchanged(body.length, localMd5, remoteMeta)) {
      counters.skipped++;
      progressDone++;
      lastComplete = Date.now();
      writeEvent({ at: Date.now(), key, attempt: 0, kind: "skip" });
      progress();
      return;
    }
    if (opts.dryRun) {
      if (!opts.force && isUnchanged(body.length, localMd5, remoteMeta)) counters.skipped++;
      else counters.uploaded++;
      progressDone++;
      progress();
      return;
    }

    const headers = (): Record<string, string> => ({
      Authorization: `Bearer ${opts.token}`,
      "Content-Type": TYPES[rel.split(".").pop()!] ?? "application/octet-stream",
      "Cache-Control": rel.endsWith("world.json") ? HOSTING.cacheData : HOSTING.cacheTiles,
    });

    for (let attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt++) {
      const slotWait = await limiter.acquire();
      counters.backoffWaitMs += slotWait;
      try {
        const r = await fetchImpl(apiPut(key), { method: "PUT", headers: headers(), body });
        const text = await r.text();
        let j: CfErrorBody = {};
        try {
          j = JSON.parse(text) as CfErrorBody;
        } catch {
          j = {};
        }
        const { code: cfCode, message: cfMessage } = parseCfErrors(j);
        const retryAfter = r.headers.get("retry-after");

        if (r.status === 429) {
          counters.count429++;
          const waitMs = rateLimitWaitMs(retryAfter);
          counters.backoffWaitMs += waitMs;
          limiter.note429(waitMs);
          if (attempt < MAX_UPLOAD_ATTEMPTS) counters.retried++;
          writeEvent({
            at: Date.now(),
            key,
            attempt,
            kind: "retry",
            status: 429,
            cfCode,
            cfMessage,
            retryAfter: retryAfter ?? undefined,
            waitMs,
            message: "rate limited",
          });
          log(`  ${key} attempt ${attempt}: 429${cfMessage ? ` ${cfMessage}` : ""} wait ${(waitMs / 1000).toFixed(1)}s`);
          await sleep(waitMs);
          continue;
        }

        if (r.status >= 500) {
          counters.count5xx++;
          const waitMs = clampTimeout(2000 * attempt);
          counters.backoffWaitMs += waitMs;
          if (attempt < MAX_UPLOAD_ATTEMPTS) counters.retried++;
          writeEvent({ at: Date.now(), key, attempt, kind: "retry", status: r.status, cfCode, cfMessage, waitMs });
          log(`  ${key} attempt ${attempt}: ${r.status}${cfMessage ? ` ${cfMessage}` : ""} wait ${(waitMs / 1000).toFixed(1)}s`);
          await sleep(waitMs);
          continue;
        }

        if (r.status === 401 || r.status === 403) {
          if (!process.env.CLOUDFLARE_API_TOKEN) opts.refreshToken();
          throw new Error(`auth ${r.status}`);
        }

        if (!r.ok || !j.success) {
          writeEvent({ at: Date.now(), key, attempt, kind: "error", status: r.status, cfCode, cfMessage, message: text.slice(0, 200) });
          log(`  ${key} attempt ${attempt}: ${r.status} ${cfMessage ?? text.slice(0, 120)}`);
          if (attempt >= MAX_UPLOAD_ATTEMPTS) throw new Error(`${key}: ${r.status} ${cfMessage ?? JSON.stringify(j.errors)}`);
          counters.retried++;
          const waitMs = clampTimeout(2000 * attempt);
          counters.backoffWaitMs += waitMs;
          await sleep(waitMs);
          continue;
        }

        if (Number(j.result?.size) !== body.length) {
          throw new Error(`stored ${j.result?.size} bytes, local ${body.length}`);
        }
        limiter.noteSuccess();
        counters.uploaded++;
        progressDone++;
        lastComplete = Date.now();
        writeEvent({ at: Date.now(), key, attempt, kind: "upload", status: r.status });
        progress();
        return;
      } catch (e) {
        const err = e as Error;
        if (err.message.startsWith("auth ") || err.message.includes("stored ")) throw err;
        counters.networkErrors++;
        writeEvent({ at: Date.now(), key, attempt, kind: "error", message: err.message });
        log(`  ${key} attempt ${attempt}: network ${err.message}`);
        if (attempt >= MAX_UPLOAD_ATTEMPTS) throw new Error(`${key}: ${err.message}`);
        counters.retried++;
        const waitMs = clampTimeout(2000 * attempt);
        counters.backoffWaitMs += waitMs;
        await sleep(waitMs);
      }
    }
    throw new Error(`${key}: retries exhausted`);
  };

  const tileFiles = opts.files.filter((f) => !f.startsWith("data/"));
  const dataFiles = opts.files.filter((f) => f.startsWith("data/"));
  const worldRel = dataFiles.find((f) => f.endsWith("world.json"));
  const dataFirst = dataFiles.filter((f) => f !== worldRel);

  const queue = [...tileFiles];
  try {
    await Promise.all(
      Array.from({ length: WORKER_COUNT }, async () => {
        for (let f = queue.shift(); f !== undefined; f = queue.shift()) await putOne(f);
      }),
    );
    for (const f of dataFirst) await putOne(f);
    if (worldRel) {
      const world = JSON.parse(readFileSync(join(opts.dir, worldRel), "utf8")) as WorldReferences;
      if (!opts.dryRun) await verifyWorldReferences(world, `${HOSTING.origin}/regions/${opts.region}`, fetchImpl);
      await putOne(worldRel);
    }
  } finally {
    clearInterval(stallTimer);
  }

  const elapsed = (Date.now() - t0) / 1000;
  const done = counters.uploaded + counters.skipped;
  const effectiveRate = elapsed > 0 ? done / elapsed : 0;
  log(
    `  summary: uploaded=${counters.uploaded} skipped=${counters.skipped} retried=${counters.retried} 429=${counters.count429} 5xx=${counters.count5xx} network=${counters.networkErrors} backoff_wait=${(counters.backoffWaitMs / 1000).toFixed(1)}s elapsed=${elapsed.toFixed(1)}s rate=${effectiveRate.toFixed(2)}/s`,
  );
  return counters;
}

export function fileMd5FromPath(path: string): string {
  return md5Hex(readFileSync(path));
}

export function dryRunSkipCount(
  dir: string,
  files: string[],
  remote: Map<string, RemoteObject>,
  region: string,
  force: boolean,
): { upload: number; skip: number } {
  let upload = 0;
  let skip = 0;
  const prefix = `regions/${region}/`;
  for (const rel of files) {
    const body = readFileSync(join(dir, rel));
    const key = `${prefix}${rel}`;
    if (!force && isUnchanged(body.length, md5Hex(body), remote.get(key))) skip++;
    else upload++;
  }
  return { upload, skip };
}