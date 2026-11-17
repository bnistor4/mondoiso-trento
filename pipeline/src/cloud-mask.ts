/**
 * Map outline for the cloud border (web/src/scripts/clouds.ts): the outer outline of the exported
 * areas that export.ts fades the tiles towards (fully background within edgeFadePx[0] of it, fully
 * painted from edgeFadePx[1] in). The browser turns it into a coarse distance field once.
 *
 *   npx tsx src/cloud-mask.ts [region]   # default trento → web/public/clouds/<region>-edge.json
 *
 * Reads the areas from the export cache (data/web/regions/<region>/data/world.json): re-run after an
 * export that adds areas.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AREAS, areaPolygon, openArea, unionEdges } from "./areas.ts";
import { ROOT, WEB_CACHE, readJson } from "./paths.ts";
import { REGIONS } from "./places.ts";

const region = process.argv[2] ?? "trento";
const world = readJson(join(WEB_CACHE, "regions", region, "data", "world.json")) as { areas: Array<{ id: string }> };
const ids = world.areas.map((a) => a.id).filter((id) => AREAS[id]);
if (!ids.length) throw new Error(`${region}: no known areas in world.json`);
openArea(ids[0]); // sets the region projection before any outline
const outlines = ids.map((id) => areaPolygon(AREAS[id].bbox));
const edges = unionEdges(outlines);
const r = (p: [number, number]) => p.map(Math.round);
const out = join(ROOT, "web", "public", "clouds");
mkdirSync(out, { recursive: true });
writeFileSync(join(out, `${region}-edge.json`), JSON.stringify({
  edgeFadePx: REGIONS[region].edgeFadePx ?? [760, 2560],
  outlines: outlines.map((o) => o.map(r)),
  edges: edges.map(([a, b]) => [...r(a), ...r(b)]),
}) + "\n");
console.log(`${region}: ${ids.length} areas, ${edges.length} outline edges → web/public/clouds/${region}-edge.json`);
