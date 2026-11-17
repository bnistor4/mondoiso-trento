// usage (from pipeline/): npx tsx ../scratch/zoneplan.mts : terrain (Copernicus DSM m asl) + estimated windows for proposed areas,
// window estimate calibrated on the 9 painted areas (windows whose 1024 px square meets the projected bbox polygon).
import sharp from "sharp"; import { readFileSync, existsSync } from "node:fs";
import { openArea, groundH, AREAS, areaPolygon, inside } from "../pipeline/src/areas.ts";
openArea("trento-citta");
const { data } = await sharp("../data/raw/dem/Copernicus_DSM_COG_10_N46_00_E011_00_DEM.tif").extractChannel(0).raw({ depth: "float" }).toBuffer({ resolveWithObject: true });
const t = new Float32Array(data.buffer, data.byteOffset, data.length / 4);
const dem = (lat: number, lon: number) => t[Math.min(3599, Math.floor((47 - lat) * 3600)) * 3600 + Math.min(3599, Math.floor((lon - 11) * 3600))];
const S = 896, T = 1024;
const P: Record<string, [number, number, number, number]> = {
  "trento-meano": [46.105, 11.120, 46.125, 11.150], "trento-calisio": [46.095, 11.124, 46.105, 11.150],
  "trento-montevaccino": [46.080, 11.150, 46.105, 11.175], "trento-vela": [46.082, 11.060, 46.125, 11.086],
  "trento-sardagna": [46.054, 11.065, 46.082, 11.096], "trento-ravina": [46.030, 11.080, 46.054, 11.104],
  "trim:ravina-11.090": [46.030, 11.090, 46.054, 11.104], "trim:sardagna-11.078": [46.054, 11.078, 46.082, 11.096], "split:vela-nord": [46.103, 11.060, 46.125, 11.086], "split:vela-sud": [46.082, 11.060, 46.103, 11.086], "merge:calisio+montevaccino-east": [46.080, 11.150, 46.105, 11.175] };
function windows(b: [number, number, number, number]) {
  const poly = areaPolygon(b); const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]); let n = 0;
  for (let i = Math.floor((Math.min(...xs) - T) / S); i * S <= Math.max(...xs); i++) for (let j = Math.floor((Math.min(...ys) - T) / S); j * S <= Math.max(...ys); j++) {
    let hit = false; for (let y = j * S; y <= j * S + T && !hit; y += 64) for (let x = i * S; x <= i * S + T && !hit; x += 64) if (inside([x, y], poly)) hit = true;
    if (hit) n++; }
  return n;
}
const orders: Record<string, string> = { "trento-povo": "order-v7-povo.txt", "trento-martignano": "order-v7-mart.txt", "trento-gardolo": "order-v7-gardolo.txt", "trento-ovest": "order-v7-ovest.txt" };
let rs = 0, rn = 0;
for (const [a, f] of Object.entries(orders)) { const real = readFileSync(`../paint-test/${f}`, "utf8").trim().split(/\s+/).length, est = windows(AREAS[a].bbox); rs += real; rn += est; console.log(`calib ${a}: geometric ${est}, real order ${real}`); }
const k = rs / rn; console.log(`calibration factor ${k.toFixed(2)}`);
for (const [a, b] of Object.entries(P)) {
  const hs: number[] = []; let mx = -1, mxAt = "";
  for (let lat = b[0]; lat <= b[2]; lat += 0.0003) for (let lon = b[1]; lon <= b[3]; lon += 0.0003) { const h = dem(lat, lon); hs.push(h); if (h > mx) { mx = h; mxAt = `${lat.toFixed(4)},${lon.toFixed(4)}`; } }
  hs.sort((x, y) => x - y); const q = (p: number) => hs[Math.floor(p * (hs.length - 1))].toFixed(0);
  const w = Math.round(windows(b) * k);
  console.log(`${a} bbox ${b.join(",")} | DEM min ${q(0)} p50 ${q(0.5)} p95 ${q(0.95)} max ${mx.toFixed(0)} @${mxAt} | >707 ${(100 * hs.filter((h) => h > 707).length / hs.length).toFixed(0)}% >1000 ${(100 * hs.filter((h) => h > 1000).length / hs.length).toFixed(0)}% | est windows ${w}`);
}
