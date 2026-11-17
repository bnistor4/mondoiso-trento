// list paint windows of an area (windows covering its render tiles); mark reusable pilot windows
import { readFileSync, existsSync } from "node:fs";
const area = process.argv[2] ?? "trento-citta", T = 1024, S = 896, W = 1024;
const tiles = (a: string) => new Set<string>(JSON.parse(readFileSync(`data/derived/${a}/manifest.json`, "utf8")).tiles.map((t: any) => `${t.x}_${t.y}`));
const mine = tiles(area), pilot = tiles("trento-duomo");
const cover = (i: number, j: number) => { const out: string[] = [];
  for (let ty = Math.floor(j * S / T); ty <= Math.floor((j * S + W - 1) / T); ty++) for (let tx = Math.floor(i * S / T); tx <= Math.floor((i * S + W - 1) / T); tx++) out.push(`${tx}_${ty}`); return out; };
const wins = new Set<string>();
for (const k of mine) { const [tx, ty] = k.split("_").map(Number);
  for (let j = Math.floor((ty * T - W) / S) + 1; j * S < (ty + 1) * T; j++) for (let i = Math.floor((tx * T - W) / S) + 1; i * S < (tx + 1) * T; i++) wins.add(`${i}_${j}`); }
let reuse = 0, fresh = 0; const list: string[] = [];
for (const w of wins) { const [i, j] = w.split("_").map(Number); const c = cover(i, j);
  const pilotFull = c.every((t) => pilot.has(t)) && existsSync(`data/derived/trento-duomo/windows/${w}.png`);
  const mineAny = c.some((t) => mine.has(t));
  if (pilotFull) reuse++; else fresh++; list.push(`${w}:${pilotFull ? "reuse" : "paint"}:${c.filter((t) => mine.has(t)).length}/${c.length}`); }
console.log(JSON.stringify({ area, tiles: mine.size, windows: wins.size, reuse, fresh }));
if (process.argv[3]) console.log(list.join(" "));
