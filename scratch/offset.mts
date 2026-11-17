import { readFileSync } from "node:fs";
import { lidarSampler } from "../pipeline/src/pat-lidar.ts";
import { AREAS } from "../pipeline/src/areas.ts";
const osm = JSON.parse(readFileSync("data/raw/trento-duomo/osm.json", "utf8"));
const bbox = AREAS["trento-duomo"].bbox, S = lidarSampler(bbox);
const ways = osm.elements.filter((e: any) => e.type === "way" && e.tags?.building && e.geometry?.length > 4).slice(0, 400);
const lat0 = 46.067, mLat = 111132, mLon = 111320 * Math.cos(lat0 * Math.PI / 180);
for (const [dx, dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2],[1,1],[-1,-1],[1,-1],[-1,1],[2,2],[-2,-2],[2,-2],[-2,2]]) {
  let sum = 0, n = 0;
  for (const w of ways) { const st = S(w.geometry.map((q: any) => [q.lon + dx / mLon, q.lat + dy / mLat])); if (st) { sum += st.median; n++; } }
  console.log(dx, dy, (sum / n).toFixed(3));
}
const tc = osm.elements.find((e: any) => e.tags?.name === "Torre Civica");
let best = [0, 0, 0];
for (let dx = -6; dx <= 6; dx++) for (let dy = -6; dy <= 6; dy++) { const st = S(tc.geometry.map((q: any) => [q.lon + dx / mLon, q.lat + dy / mLat])); if (st && st.median > best[2]) best = [dx, dy, st.median]; }
console.log("Torre Civica best offset", best, "cells", S(tc.geometry.map((q: any) => [q.lon, q.lat]))?.cells);
