import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { before, test } from "node:test";
import {
  AdaptiveRateLimiter,
  clampTimeout,
  isUnchanged,
  md5Hex,
  parseRetryAfterMs,
  rateLimitWaitMs,
  runPublish,
} from "./publish-lib.ts";

const tsxLoader = import.meta.resolve("tsx");

before(() => {
  process.env.CLOUDFLARE_ACCOUNT_ID = "fixture-account";
  process.env.TILES_ORIGIN = "https://tiles.example";
});

test("clampTimeout never returns negative wait", () => {
  assert.equal(clampTimeout(-1), 0);
  assert.equal(clampTimeout(0), 0);
  assert.equal(clampTimeout(100), 100);
});

test("parseRetryAfterMs honors seconds and caps negative delay", () => {
  assert.equal(parseRetryAfterMs("10"), 10_000);
  const future = new Date(Date.now() + 5000).toUTCString();
  assert.ok(parseRetryAfterMs(future)! >= 0 && parseRetryAfterMs(future)! <= 6000);
});

test("rateLimitWaitMs uses Retry-After when present", () => {
  assert.equal(rateLimitWaitMs("5"), 5000);
  assert.equal(rateLimitWaitMs(null), 30_000);
});

test("isUnchanged matches size and etag md5", () => {
  const body = Buffer.from('{"x":1}');
  const md5 = md5Hex(body);
  assert.ok(isUnchanged(body.length, md5, { size: body.length, etag: md5 }));
  assert.ok(!isUnchanged(body.length, md5, { size: body.length, etag: "other" }));
  assert.ok(isUnchanged(body.length, md5, { size: body.length, custom_metadata: { md5 } }));
});

test("AdaptiveRateLimiter acquire uses non-negative sleep", async () => {
  const limiter = new AdaptiveRateLimiter(100);
  const waited = await limiter.acquire();
  assert.ok(waited >= 0);
});

test("429 with Retry-After waits and retries", async () => {
  const root = mkdtempSync(join(tmpdir(), "publish-429-"));
  try {
    const dir = join(root, "data");
    mkdirSync(join(dir, "tiles"), { recursive: true });
    const body = Buffer.from("{}");
    writeFileSync(join(dir, "tiles/a.avif"), body);
    let puts = 0;
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      if (url.includes("/objects") && !init?.method) {
        return Response.json({ success: true, result: [], result_info: { is_truncated: false } });
      }
      if (init?.method === "PUT") {
        puts++;
        if (puts === 1) {
          return new Response(JSON.stringify({ success: false, errors: [{ code: 10029, message: "rate limited" }] }), {
            status: 429,
            headers: { "retry-after": "1", "content-type": "application/json" },
          });
        }
        return Response.json({ success: true, result: { size: String(body.length) } });
      }
      return new Response(null, { status: 200 });
    };
    const counters = await runPublish({
      region: "trento",
      dir,
      files: ["tiles/a.avif"],
      token: "test",
      refreshToken: () => {},
      pendingStatePath: join(root, "pending.json"),
      webStateDir: join(root, "state"),
      fetchImpl,
      force: true,
    });
    assert.equal(counters.uploaded, 1);
    assert.equal(counters.count429, 1);
    assert.ok(counters.retried >= 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("429 without Retry-After uses 30s default in rateLimitWaitMs", () => {
  assert.equal(rateLimitWaitMs(null), 30_000);
});

test("5xx retries then succeeds", async () => {
  const root = mkdtempSync(join(tmpdir(), "publish-5xx-"));
  try {
    const dir = join(root, "data");
    mkdirSync(join(dir, "tiles"), { recursive: true });
    const body = Buffer.from("tile");
    writeFileSync(join(dir, "tiles/b.avif"), body);
    let puts = 0;
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      if (url.includes("/objects") && !init?.method) {
        return Response.json({ success: true, result: [], result_info: { is_truncated: false } });
      }
      if (init?.method === "PUT") {
        puts++;
        if (puts === 1) {
          return new Response(JSON.stringify({ success: false, errors: [{ code: 1000, message: "internal" }] }), {
            status: 503,
            headers: { "content-type": "application/json" },
          });
        }
        return Response.json({ success: true, result: { size: String(body.length) } });
      }
      return new Response(null, { status: 200 });
    };
    const counters = await runPublish({
      region: "trento",
      dir,
      files: ["tiles/b.avif"],
      token: "test",
      refreshToken: () => {},
      pendingStatePath: join(root, "pending.json"),
      webStateDir: join(root, "state"),
      fetchImpl,
      force: true,
    });
    assert.equal(counters.uploaded, 1);
    assert.equal(counters.count5xx, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("retries exhausted aborts before world.json", async () => {
  const root = mkdtempSync(join(tmpdir(), "publish-exhaust-"));
  try {
    const source = join(root, "pipeline/src");
    const data = join(root, "data/web/regions/trento/data");
    mkdirSync(source, { recursive: true });
    mkdirSync(data, { recursive: true });
    writeFileSync(join(root, "package.json"), '{"type":"module"}');
    for (const file of ["publish.ts", "publish-lib.ts", "publish-references.ts", "hosting.ts", "paths.ts", "places.ts"]) {
      cpSync(new URL(file, import.meta.url), join(source, file));
    }
    const roads = Buffer.from('{"roads":1}');
    const world = { files: { "tiles-map": "tiles-map.json", borders: "b.json", roads: "roads.new.json" } };
    writeFileSync(join(data, "roads.new.json"), roads);
    writeFileSync(join(data, "world.json"), JSON.stringify(world));
    writeFileSync(join(root, "data/web/trento.state.json"), "{}");
    const script = `
      const events = [];
      globalThis.fetch = async (input, init) => {
        const url = new URL(String(input));
        if (url.pathname.includes('/objects') && !init?.method) {
          return Response.json({ success: true, result: [], result_info: { is_truncated: false } });
        }
        if (init?.method === 'PUT') {
          events.push(url.pathname);
          return new Response(JSON.stringify({ success: false, errors: [{ code: 10029, message: 'limited' }] }), { status: 429, headers: { 'retry-after': '0' } });
        }
        return new Response('ok', { status: 200 });
      };
      process.argv = ['node', 'publish.ts', 'trento', '--yes', '--force'];
      let code = 0;
      try { await import('./pipeline/src/publish.ts'); } catch { code = 1; }
      import assert from 'node:assert/strict';
      if (!events.some(e => e.endsWith('world.json'))) {
        process.exitCode = code || 1;
      }
      assert.ok(!events.some(e => e.endsWith('world.json')));
    `;
    const result = spawnSync(process.execPath, ["--import", tsxLoader, "--input-type=module", "-e", script], {
      cwd: root,
      encoding: "utf8",
      timeout: 60_000,
      env: { ...process.env, TILES_ORIGIN: "https://tiles.example", CLOUDFLARE_ACCOUNT_ID: "fixture", CLOUDFLARE_API_TOKEN: "fixture" },
    });
    assert.notEqual(result.status, 0, result.stderr || result.stdout);
    assert.ok(!/world\.json/.test(result.stdout), result.stdout);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("unchanged remote files are skipped unless --force", async () => {
  const root = mkdtempSync(join(tmpdir(), "publish-skip-"));
  try {
    const dir = join(root, "data");
    mkdirSync(join(dir, "tiles"), { recursive: true });
    const body = Buffer.from("same");
    const md5 = createHash("md5").update(body).digest("hex");
    writeFileSync(join(dir, "tiles/c.avif"), body);
    const key = "regions/trento/tiles/c.avif";
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      if (url.includes("/objects") && !init?.method) {
        return Response.json({
          success: true,
          result: [{ key, size: body.length, etag: md5 }],
          result_info: { is_truncated: false },
        });
      }
      if (init?.method === "PUT") throw new Error("unexpected PUT");
      return new Response(null, { status: 200 });
    };
    const counters = await runPublish({
      region: "trento",
      dir,
      files: ["tiles/c.avif"],
      token: "test",
      refreshToken: () => {},
      pendingStatePath: join(root, "pending.json"),
      webStateDir: join(root, "state"),
      fetchImpl,
    });
    assert.equal(counters.skipped, 1);
    assert.equal(counters.uploaded, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("--force uploads despite matching remote", async () => {
  const root = mkdtempSync(join(tmpdir(), "publish-force-"));
  try {
    const dir = join(root, "data");
    mkdirSync(join(dir, "tiles"), { recursive: true });
    const body = Buffer.from("same");
    const md5 = createHash("md5").update(body).digest("hex");
    writeFileSync(join(dir, "tiles/d.avif"), body);
    const key = "regions/trento/tiles/d.avif";
    let puts = 0;
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      if (url.includes("/objects") && !init?.method) {
        return Response.json({
          success: true,
          result: [{ key, size: body.length, etag: md5 }],
          result_info: { is_truncated: false },
        });
      }
      if (init?.method === "PUT") {
        puts++;
        return Response.json({ success: true, result: { size: String(body.length) } });
      }
      return new Response(null, { status: 200 });
    };
    const counters = await runPublish({
      region: "trento",
      dir,
      files: ["tiles/d.avif"],
      token: "test",
      refreshToken: () => {},
      pendingStatePath: join(root, "pending.json"),
      webStateDir: join(root, "state"),
      fetchImpl,
      force: true,
    });
    assert.equal(puts, 1);
    assert.equal(counters.uploaded, 1);
    assert.equal(counters.skipped, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("dry-run reports skip count without PUT", async () => {
  const root = mkdtempSync(join(tmpdir(), "publish-dry-"));
  try {
    const dir = join(root, "data");
    mkdirSync(join(dir, "tiles"), { recursive: true });
    const body = Buffer.from("v");
    const md5 = md5Hex(body);
    writeFileSync(join(dir, "tiles/e.avif"), body);
    writeFileSync(join(dir, "tiles/f.avif"), Buffer.from("new"));
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      if (url.includes("/objects") && !init?.method) {
        return Response.json({
          success: true,
          result: [{ key: "regions/trento/tiles/e.avif", size: body.length, etag: md5 }],
          result_info: { is_truncated: false },
        });
      }
      if (init?.method === "PUT") throw new Error("dry-run must not PUT");
      return new Response(null, { status: 200 });
    };
    const counters = await runPublish({
      region: "trento",
      dir,
      files: ["tiles/e.avif", "tiles/f.avif"],
      token: "test",
      refreshToken: () => {},
      pendingStatePath: join(root, "pending.json"),
      webStateDir: join(root, "state"),
      fetchImpl,
      dryRun: true,
    });
    assert.equal(counters.skipped, 1);
    assert.equal(counters.uploaded, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("mocked throughput reports effective rate", async () => {
  const root = mkdtempSync(join(tmpdir(), "publish-rate-"));
  try {
    const dir = join(root, "data");
    mkdirSync(join(dir, "tiles"), { recursive: true });
    const files: string[] = [];
    for (let i = 0; i < 40; i++) {
      const name = `tiles/t${i}.avif`;
      writeFileSync(join(dir, name), Buffer.from(`tile-${i}`));
      files.push(name);
    }
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      if (url.includes("/objects") && !init?.method) {
        return Response.json({ success: true, result: [], result_info: { is_truncated: false } });
      }
      if (init?.method === "PUT") {
        const len = typeof init.body === "string" ? init.body.length : (init.body as Buffer).length;
        return Response.json({ success: true, result: { size: String(len) } });
      }
      return new Response(null, { status: 200 });
    };
    const t0 = Date.now();
    const counters = await runPublish({
      region: "trento",
      dir,
      files,
      token: "test",
      refreshToken: () => {},
      pendingStatePath: join(root, "pending.json"),
      webStateDir: join(root, "state"),
      fetchImpl,
      force: true,
    });
    const elapsed = (Date.now() - t0) / 1000;
    const rate = counters.uploaded / elapsed;
    assert.equal(counters.uploaded, 40);
    assert.ok(rate > 4, `mocked rate ${rate.toFixed(2)}/s should exceed 4/s`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});