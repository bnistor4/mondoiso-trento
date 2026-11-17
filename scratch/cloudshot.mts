// clouds: shots + perf. env VW VH DPR MOBILE=1 THROTTLE=4 NAME=clouds-1440x900 NOCLOUDS=1
import { chromium } from "playwright-core";
const VW = Number(process.env.VW ?? 1440), VH = Number(process.env.VH ?? 900), mobile = process.env.MOBILE === "1";
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: Number(process.env.DPR ?? 1), isMobile: mobile, hasTouch: mobile });
const p = await ctx.newPage();
const errs: string[] = [], failed: string[] = [];
p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
p.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });
p.on("response", (r) => { if (r.status() >= 400) failed.push(r.status() + " " + r.url()); });
const NAME = process.env.NAME ?? `clouds-${VW}x${VH}`, S = "/workspace/mondoiso-trento/shots/";
await p.goto("http://127.0.0.1:4391/trento" + (process.env.NOCLOUDS ? "?noclouds" : ""), { waitUntil: "networkidle", timeout: 90000 });
await p.waitForTimeout(9000);
await p.screenshot({ path: S + NAME + "-default.png" });
const settle = async (ms = 7000) => { await p.waitForTimeout(ms); };
// zoomed out to the minimum (centre clamped inside the map by map.ts)
await p.evaluate(() => { const v = (window as any).__viewer; v.viewport.zoomTo(v.viewport.getMinZoom(), null, true); });
await settle();
await p.screenshot({ path: S + NAME + "-zoomout.png" });
// corners at minimum zoom: pan far, the clamp stops at the playable edge
const corners: Array<[string, number, number]> = [["nw", -1, -1], ["se", 1, 1], ["sw", -1, 1]];
for (const [c, dx, dy] of corners) {
  await p.evaluate(([dx, dy]) => { const v = (window as any).__viewer, O = (window as any).OpenSeadragon;
    v.viewport.panBy(new O.Point(dx * 2, dy * 2), true); v.viewport.applyConstraints(true); }, [dx, dy]);
  await settle(5000);
  await p.screenshot({ path: S + NAME + `-zoomout-${c}.png` });
}
// perf: animated pans/zooms along the edge, CPU throttled
const cdp = await ctx.newCDPSession(p);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: Number(process.env.THROTTLE ?? 1) });
await p.evaluate(`(() => {
  const w = window; w.__perf = { frames: [], long: [] };
  if (w.__clouds) Object.assign(w.__clouds, { draws: 0, skipped: 0, totalMs: 0, maxMs: 0 });
  new PerformanceObserver((l) => l.getEntries().forEach((e) => w.__perf.long.push(e.duration))).observe({ type: "longtask", buffered: false });
  let last = performance.now();
  const f = (t) => { w.__perf.frames.push(t - last); last = t; if (!w.__perf.stop) requestAnimationFrame(f); };
  requestAnimationFrame(f);
})()`);
const O = "OpenSeadragon";
for (let i = 0; i < 6; i++) {
  await p.evaluate(([i, O]) => { const v = (window as any).__viewer, OS = (window as any)[O];
    if (i % 2) v.viewport.zoomBy(i % 4 === 1 ? 1.6 : 1 / 1.6); else v.viewport.panBy(new OS.Point((i % 4 ? -1 : 1) * 0.15, 0.1)); }, [i, O] as [number, string]);
  await p.waitForTimeout(1200);
}
const perf = await p.evaluate(`(() => { const w = window; w.__perf.stop = true; const f = w.__perf.frames.slice(2).sort((a, b) => a - b);
  const q = (x) => f[Math.min(f.length - 1, Math.floor(f.length * x))];
  return { frames: f.length, p50: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1), max: +f[f.length - 1].toFixed(1), over50: f.filter((x) => x > 50).length,
    longtasks: w.__perf.long.length, longMax: Math.round(Math.max(0, ...w.__perf.long)), clouds: w.__clouds ? {...w.__clouds} : null }; })()`) as any;
console.log(JSON.stringify({ name: NAME, throttle: Number(process.env.THROTTLE ?? 1), perf, errs, failed: failed.slice(0, 10), nFailed: failed.length }));
await b.close();
