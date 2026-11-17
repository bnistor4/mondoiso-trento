// usage (from pipeline/): npx tsx ../scratch/blackscan.mts <area> ... : per art tile, points (8 px lattice) inside the union
// (inside distance > E0, i.e. fade alpha > 0) where art is black (sum<30), split by render black / render content.
import sharp from "sharp"; import { existsSync, readdirSync } from "node:fs"; import { join } from "node:path";
import { AREAS, areaPolygon, unionEdges, unionInsideDistance, openArea } from "../pipeline/src/areas.ts";
import { REGIONS } from "../pipeline/src/places.ts";
const areas = process.argv.slice(2), D = "/workspace/mondoiso-trento/data/derived", T = 1024, STEP = 8;
const REG = openArea(areas[0]).region; // sets groundH: must precede areaPolygon
const outlines = areas.map((a) => areaPolygon(AREAS[a].bbox)), edges = unionEdges(outlines);
const [E0, E1] = REGIONS[REG].edgeFadePx ?? [760, 2560];
const art = new Map<string, [string, string]>();
for (const a of areas) { const dir = join(D, a, "paint"); if (!existsSync(dir)) continue; for (const f of readdirSync(dir)) if (/^-?\d+_-?\d+\.png$/.test(f)) art.set(f.slice(0, -4), [join(dir, f), a]); }
const rendOf = (k: string) => { for (const a of [...areas].reverse()) { const f = join(D, a, "render", k + ".png"); if (existsSync(f)) return f; } };
const raw = async (f: string) => sharp(f).removeAlpha().resize(T, T).raw().toBuffer();
for (const [k, [f, a]] of [...art].sort()) {
  const r = rendOf(k); if (!r) continue; const [tx, ty] = k.split("_").map(Number);
  const pts: [number, number][] = [];
  for (let y = STEP / 2; y < T; y += STEP) for (let x = STEP / 2; x < T; x += STEP) { const d = unionInsideDistance([tx * T + x, ty * T + y], outlines, edges); if (d > E0) pts.push([y * T + x, d]); }
  if (!pts.length) continue;
  const A = await raw(f), R = await raw(r); let rb = 0, rc = 0, rbDeep = 0;
  for (const [p, d] of pts) if (A[p * 3] + A[p * 3 + 1] + A[p * 3 + 2] < 30) { if (R[p * 3] + R[p * 3 + 1] + R[p * 3 + 2] <= 45) { rb++; if (d > (E0 + E1) / 2) rbDeep++; } else rc++; }
  if (rb + rc > 0.005 * pts.length) console.log(`${a} ${k} pts ${pts.length} artblack/renderblack ${rb} (${(100 * rb / pts.length).toFixed(1)}%, deep ${rbDeep}) artblack/rendercontent ${rc}`);
}
