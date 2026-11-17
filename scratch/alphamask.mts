// usage (from pipeline/): npx tsx ../scratch/alphamask.mts <outdir> <k>... :: <areas...> : export edge-fade alpha per tile at 1/8 (128 px PNG)
import sharp from "sharp"; import { mkdirSync } from "node:fs";
import { AREAS, areaPolygon, unionEdges, unionInsideDistance, openArea } from "../pipeline/src/areas.ts";
import { REGIONS } from "../pipeline/src/places.ts";
const a = process.argv.slice(2), sep = a.indexOf("::"), out = a[0], keys = a.slice(1, sep), areas = a.slice(sep + 1);
openArea(areas[0]); // sets the region projection: must precede areaPolygon
const outlines = areas.map((x) => areaPolygon(AREAS[x].bbox)), edges = unionEdges(outlines);
const [E0, E1] = REGIONS[openArea(areas[0]).region].edgeFadePx ?? [760, 2560];
mkdirSync(out, { recursive: true });
for (const k of keys) { const [tx, ty] = k.split("_").map(Number); const b = Buffer.alloc(128 * 128);
  for (let j = 0; j < 128; j++) for (let i = 0; i < 128; i++) { const d = unionInsideDistance([tx * 1024 + i * 8 + 4, ty * 1024 + j * 8 + 4], outlines, edges);
    const t = Math.min(1, Math.max(0, (d - E0) / (E1 - E0))); b[j * 128 + i] = Math.round(t * t * (3 - 2 * t) * 255); }
  await sharp(b, { raw: { width: 128, height: 128, channels: 1 } }).png().toFile(`${out}/${k}.png`); }
