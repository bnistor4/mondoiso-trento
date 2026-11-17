// read-only: windows of a candidate area adjoining painted areas (paint --context model)
import { existsSync } from "node:fs";
import { AREAS, areaTiles } from "../pipeline/src/areas.ts";
import { CAMERA, useRegion } from "../pipeline/src/camera.ts";
useRegion("trento");
const T = CAMERA.tile, W = 1024, S = 896, key = (x: number, y: number) => `${x}_${y}`;
const wins = (tiles: Set<string>) => { const w = new Set<string>(); for (const k of tiles) { const [x, y] = k.split("_").map(Number);
  for (let j = Math.floor((y*T-W)/S)+1; j*S < (y+1)*T; j++) for (let i = Math.floor((x*T-W)/S)+1; i*S < (x+1)*T; i++) w.add(`${i}_${j}`); } return w; };
const ctx = (process.env.CTX ?? "trento-citta").split(",");
const painted = new Set<string>(); for (const a of ctx) areaTiles(AREAS[a].bbox).forEach(([x, y]) => painted.add(key(x, y)));
const ctxWin = (w: string) => ctx.some(a => existsSync(`data/derived/${a}/windows/${w}.png`));
for (const [n, b] of Object.entries(JSON.parse(process.argv[2]) as Record<string, [number, number, number, number]>)) {
  const t = new Set(areaTiles(b).map(([x, y]) => key(x, y))); const overlap = [...t].filter(k => painted.has(k)).length;
  const w = wins(t); let reuse = 0, border = 0, fresh = 0;
  for (const x of w) if (ctxWin(x)) reuse++; else fresh++;
  // context windows that cover tiles of the new area (painted black there) must be repainted
  const bw = [...w].filter(x => ctxWin(x)); const cw = wins(painted); const borderList = [...wins(t)].filter(x => cw.has(x));
  console.log(n, b.join(","), `tiles ${t.size} (overlap with context ${overlap})  windows ${w.size}: shared-with-context ${borderList.length} (repaint), new ${fresh}`);
  if (process.env.LIST) console.log(borderList.join(" "));
}
