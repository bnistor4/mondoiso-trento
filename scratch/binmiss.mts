// usage: binmiss.mts <area> : buildings whose real on-terrain base pixel falls in a render tile whose scene bin lacks them
// (scene.ts bins at GROUND_GUESS = groundH+15, so hill buildings drift out of their bins). Uses the Copernicus DEM (+48 m geoid).
import sharp from "sharp"; import { readdirSync, readFileSync, existsSync } from "node:fs";
import { useRegion, enuToPixel, CAMERA } from "../pipeline/src/camera.ts"; import { REGIONS } from "../pipeline/src/places.ts";
useRegion("trento"); const R = REGIONS["trento"] as any; const lat0 = 46.0679, lon0 = 11.1211;
const { data } = await sharp("data/raw/dem/Copernicus_DSM_COG_10_N46_00_E011_00_DEM.tif").extractChannel(0).raw({ depth: "float" }).toBuffer({ resolveWithObject: true });
const t = new Float32Array(data.buffer, data.byteOffset, data.length / 4);
const dem = (lat: number, lon: number) => t[Math.min(3599, Math.floor((47 - lat) * 3600)) * 3600 + Math.min(3599, Math.floor((lon - 11) * 3600))];
const d = `data/derived/${process.argv[2]}/scene/`; const bins = new Map<string, Set<string>>(); const all = new Map<string, number[][]>();
for (const f of readdirSync(d)) { const k = f.slice(0, -5); const o = JSON.parse(readFileSync(d + f, "utf8")); const s = new Set<string>();
  for (const b of o.b ?? []) { const id = JSON.stringify(b[0][0]); s.add(id); all.set(id, b[0]); } bins.set(k, s); }
let miss = 0, n = 0, hiMiss = 0, out = 0; const T = CAMERA.tile; const missT = new Map<string, number>();
for (const [id, ring] of all) { const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length, cy = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const lat = lat0 + cy / 111320, lon = lon0 + cx / (111320 * Math.cos(lat0 * Math.PI / 180)); const h = dem(lat, lon) + 48 - (cx * cx + cy * cy) / (2 * 6371000);
  const [px, py] = enuToPixel([cx, cy, h]); const k = `${Math.floor(px / T)}_${Math.floor(py / T)}`; n++;
  if (!existsSync(`data/derived/${process.argv[2]}/render/${k}.png`)) { out++; continue; }
  if (!bins.get(k)?.has(id)) { miss++; missT.set(k, (missT.get(k) ?? 0) + 1); if (h > 400) hiMiss++; } }
console.log(process.argv[2], "buildings", n, "drawn outside own tiles", out, "in own tile but missing from its bin", miss, `(${(100 * miss / n).toFixed(1)}%)`, "of which ground >400 m ell", hiMiss, "tiles affected", missT.size);
