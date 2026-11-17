// usage (from pipeline/): npx tsx ../scratch/holecheck.mts <area> ... [--limit=0.002] [--map=/tmp/holes.png]
// v10 gate for "beige triangles": on an 8 px lattice per exported art tile, count points that are well inside the map
// footprint (union outline edge-fade alpha >= 0.5, as export.ts edgeAlpha) but where EVERY area's render is black
// (sum <= 30), i.e. points export rbfade1 fades to the page background. Exit 1 if any tile's hole share > --limit.
import sharp from "sharp";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { AREAS, areaPolygon, unionEdges, unionInsideDistance, openArea } from "../pipeline/src/areas.ts";
import { REGIONS } from "../pipeline/src/places.ts";
const args = process.argv.slice(2), areas = args.filter((a) => !a.startsWith("--"));
const limit = Number(args.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? 0.002);
const mapOut = args.find((a) => a.startsWith("--map="))?.split("=")[1];
const D = "/workspace/mondoiso-trento/data/derived", T = 1024, STEP = 8, N = T / STEP;
const region = openArea(areas[0]).region;
const outlines = areas.map((a) => areaPolygon(AREAS[a].bbox)), edges = unionEdges(outlines);
const [E0, E1] = REGIONS[region].edgeFadePx ?? [760, 2560];
const art = new Set<string>(), rendAll = new Map<string, string[]>();
for (const a of areas) for (const layer of ["paint", "render"]) {
  const dir = join(D, a, layer); if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) if (/^-?\d+_-?\d+\.png$/.test(f)) { const k = f.slice(0, -4); if (layer === "paint") art.add(k); else rendAll.set(k, [...(rendAll.get(k) ?? []), join(dir, f)]); }
}
const keys = [...art].sort(); let fails = 0, total = 0; const rows: string[] = [];
const holeTiles = new Map<string, Uint8Array>();
for (const k of keys) {
  const [tx, ty] = k.split("_").map(Number);
  const content = new Uint8Array(N * N);
  for (const f of rendAll.get(k) ?? []) {
    const b = await sharp(f).removeAlpha().resize(N, N, { kernel: "nearest" }).raw().toBuffer();
    for (let q = 0; q < N * N; q++) if (b[q * 3] + b[q * 3 + 1] + b[q * 3 + 2] > 30) content[q] = 1;
  }
  let inside = 0, holes = 0; const hm = new Uint8Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const d = unionInsideDistance([tx * T + i * STEP + STEP / 2, ty * T + j * STEP + STEP / 2], outlines, edges);
    const t = Math.min(1, Math.max(0, (d - E0) / (E1 - E0))), a = t * t * (3 - 2 * t);
    if (a < 0.5) continue; inside++;
    if (!content[j * N + i]) { holes++; hm[j * N + i] = 1; }
  }
  total += holes;
  if (holes) holeTiles.set(k, hm);
  const share = holes / (N * N);
  if (holes) rows.push(`${k} holes ${holes} pts (${(share * 100).toFixed(2)}%) of ${inside} inside`);
  if (share > limit) fails++;
}
console.log(rows.join("\n"));
console.log(`holecheck ${areas.length} areas: ${keys.length} art tiles, ${holeTiles.size} with holes, ${total} hole pts (8 px lattice = ${(total * 64 / 1e6).toFixed(2)} Mpx), ${fails} tiles > ${(limit * 100).toFixed(1)}%`);
if (mapOut) {
  const xs = keys.map((k) => +k.split("_")[0]), ys = keys.map((k) => +k.split("_")[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys), W = (Math.max(...xs) - x0 + 1) * N, H = (Math.max(...ys) - y0 + 1) * N;
  const img = Buffer.alloc(W * H * 3, 0);
  for (const k of keys) { const [tx, ty] = k.split("_").map(Number); const hm = holeTiles.get(k);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const p = ((ty - y0) * N + j) * W + (tx - x0) * N + i; if (hm?.[j * N + i]) { img[p * 3] = 255; } else { img[p * 3 + 1] = 60; img[p * 3 + 2] = 60; } } }
  await sharp(img, { raw: { width: W, height: H, channels: 3 } }).png().toFile(mapOut);
  console.log(`map ${mapOut} ${W}x${H} origin tile ${x0}_${y0}`);
}
process.exit(fails ? 1 : 0);
