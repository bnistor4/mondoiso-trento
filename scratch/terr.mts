import { readFileSync, readdirSync } from "node:fs";
import sharp from "sharp";
import { openArea } from "/workspace/mondoiso-trento/pipeline/src/areas.ts";
import { ecefToEnu, llhToEcef } from "/workspace/mondoiso-trento/pipeline/src/camera.ts";
const a = openArea("trento-duomo");
const d = "/workspace/mondoiso-trento/data/derived/trento-duomo/ground/";
const meta = JSON.parse(readFileSync(d + "meta.json", "utf8"));
const b = readFileSync(d + "height.bin"); const h = new Float32Array(b.buffer, b.byteOffset, b.length / 4);
const at = (lat: number, lon: number) => { const [x, y] = ecefToEnu(llhToEcef(lat, lon, 0)); const ix = Math.round((x - meta.x0) / meta.step), iy = Math.round((y - meta.y0) / meta.step); return h[iy * meta.nx + ix] - 48.5; };
// raw DEM
const f = readdirSync("/workspace/mondoiso-trento/data/raw/dem")[0];
const { data } = await sharp("/workspace/mondoiso-trento/data/raw/dem/" + f).extractChannel(0).raw({ depth: "float" }).toBuffer({ resolveWithObject: true });
const t = new Float32Array(data.buffer, data.byteOffset, data.length / 4);
const raw = (lat: number, lon: number) => t[Math.round((47 - lat) * 3600) * 3600 + Math.round((lon - 11) * 3600)];
const [S, W, N, E] = a.bbox; let lo = 1e9, hi = -1e9;
for (let la = S; la <= N; la += 0.0002) for (let lo2 = W; lo2 <= E; lo2 += 0.0002) { const v = at(la, lo2); lo = Math.min(lo, v); hi = Math.max(hi, v); }
console.log(`inside bbox, pipeline bare-earth MSL: ${lo.toFixed(1)}..${hi.toFixed(1)} m`);
for (const [n, la, lo2] of [["Piazza Duomo", 46.0672, 11.1213], ["Castello Buonconsiglio (Castelvecchio)", 46.0705, 11.1275], ["Piazza Fiera", 46.0655, 11.1228], ["Via Belenzani N", 46.0698, 11.1218], ["Torre Verde / Adige side", 46.0700, 11.1190], ["Doss Trento summit (outside)", 46.0735, 11.1080], ["Bbox NE corner", 46.072, 11.130]] as const)
  console.log(`${n}: raw GLO-30 ${raw(la, lo2).toFixed(1)} m, pipeline ${at(la, lo2).toFixed(1)} m`);
let best = [-1, 0, 0];
for (let la = 46.068; la <= 46.082; la += 0.0003) for (let lo2 = 11.100; lo2 <= 11.114; lo2 += 0.0003) { const v = raw(la, lo2); if (v > best[0]) best = [v, la, lo2]; }
console.log(`Doss Trento max raw ${best[0].toFixed(1)} m at ${best[1].toFixed(4)},${best[2].toFixed(4)}; pipeline there ${at(best[1], best[2]).toFixed(1)} m`);
