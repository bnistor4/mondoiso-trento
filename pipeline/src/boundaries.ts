/**
 * Fetch a region's municipal boundaries (OSM admin_level=8) from Overpass.
 *
 *   npm -w pipeline run boundaries -- roma-centro      -> data/raw/boundaries/<region>.json
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REGIONS } from "./places.ts";
import { RAW } from "./paths.ts";

// Same mirrors as fetch.ts: overpass-api.de first, overpass.openstreetmap.fr when it 5xx/resets.
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.openstreetmap.fr/api/interpreter"];

async function overpass(query: string) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const url = OVERPASS[(attempt - 1) % OVERPASS.length];
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "User-Agent": "isometric-world/0.3", "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data: query }),
      });
      if (r.ok) return r.json();
      console.warn(`  overpass ${r.status} (${new URL(url).host}), retrying…`);
    } catch (err) {
      console.warn(`  overpass error (${new URL(url).host}): ${(err as Error).message}, retrying…`);
    }
    await new Promise((res) => setTimeout(res, 5_000 * attempt));
  }
  throw new Error("overpass failed");
}

const id = process.argv[2] ?? "roma-centro", region = REGIONS[id];
if (!region) throw new Error(`unknown region ${id}`);
const names = region.municipalities.map((c) => c.replace(/[-]/g, "\\-")).join("|");
const data = await overpass(`[out:json][timeout:240];
area["name:en"="${region.country}"]["admin_level"="2"]->.il;
relation["boundary"="administrative"]["admin_level"="8"]["name"~"^(${names})$"](area.il);
out body geom;`);
mkdirSync(join(RAW, "boundaries"), { recursive: true });
writeFileSync(join(RAW, "boundaries", `${id}.json`), JSON.stringify(data));
console.log("  boundaries:", data.elements.map((e: any) => e.tags["name:en"] ?? e.tags.name).join(", "));
