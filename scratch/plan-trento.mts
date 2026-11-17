// read-only: window counts for candidate Trento superset areas vs painted trento-citta
import { existsSync } from "node:fs";
import { AREAS, areaTiles } from "../pipeline/src/areas.ts";
import { CAMERA, useRegion } from "../pipeline/src/camera.ts";
useRegion("trento");
const T = CAMERA.tile, W = 1024, S = 896, key = (x: number, y: number) => `${x}_${y}`;
const wins = (tiles: Set<string>) => { const w = new Set<string>(); for (const k of tiles) { const [x, y] = k.split("_").map(Number);
  for (let j = Math.floor((y*T-W)/S)+1; j*S < (y+1)*T; j++) for (let i = Math.floor((x*T-W)/S)+1; i*S < (x+1)*T; i++) w.add(`${i}_${j}`); } return w; };
const cover = (w: string) => { const [i, j] = w.split("_").map(Number); const o: string[] = [];
  for (let ty = Math.floor(j*S/T); ty <= Math.floor((j*S+W-1)/T); ty++) for (let tx = Math.floor(i*S/T); tx <= Math.floor((i*S+W-1)/T); tx++) o.push(key(tx, ty)); return o; };
const old = new Set(areaTiles(AREAS["trento-citta"].bbox).map(([x, y]) => key(x, y)));
const cands: Record<string, [number, number, number, number]> = JSON.parse(process.argv[2]);
for (const [n, b] of Object.entries(cands)) {
  const t = new Set(areaTiles(b).map(([x, y]) => key(x, y))); const w = wins(t);
  let reuse = 0, paint = 0; for (const x of w) { const c = cover(x).filter(k => t.has(k));
    if (c.every(k => old.has(k)) && existsSync(`data/derived/trento-citta/windows/${x}.png`)) reuse++; else paint++; }
  const missingOld = [...old].filter(k => !t.has(k)).length;
  console.log(n, b.join(","), `tiles ${t.size} (new ${[...t].filter(k => !old.has(k)).length}, citta tiles not covered ${missingOld})  windows ${w.size}  reuse ${reuse}  paint ${paint}`);
}
