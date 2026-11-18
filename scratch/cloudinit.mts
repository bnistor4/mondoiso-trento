import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: Number(process.env.T ?? 1) });
await p.goto("http://127.0.0.1:4391/trento", { waitUntil: "networkidle", timeout: 120000 }); await p.waitForTimeout(5000);
console.log(process.env.T, await p.evaluate("JSON.stringify(window.__clouds)"));
await b.close();
