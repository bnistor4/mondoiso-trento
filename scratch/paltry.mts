import { readdirSync } from "fs";
import sharp from "sharp";
import { overlapDelta, solvePalette, type PaletteEdge } from "../pipeline/src/palette.ts";
const dir = "data/derived/trento-citta/windows";
const samples = new Map<string, Buffer>();
for (const f of readdirSync(dir).filter(f => f.endsWith(".png"))) samples.set(f.slice(0, -4), await sharp(`${dir}/${f}`).removeAlpha().resize(256,256).blur(1).raw().toBuffer());
const edges: PaletteEdge[] = [];
for (const [key, a] of samples) { const [x,y]=key.split("_").map(Number);
  for (const [n, v] of [[`${x+1}_${y}`,false],[`${x}_${y+1}`,true]] as const) { const b=samples.get(n); if (b) edges.push({a:key,b:n,delta:overlapDelta(a,b,256,32,v)}); } }
for (const lim of [24, 32, 40, 64]) { const {offsets,residuals}=solvePalette([...samples.keys()].sort(),edges,lim);
  const bad=residuals.filter(r=>r.error>12); const mx=Math.max(...[...offsets.values()].flat().map(Math.abs));
  console.log(`limit ${lim}: >12 ${bad.length}, max residual ${Math.max(...residuals.map(r=>r.error)).toFixed(2)}, max |offset| ${mx.toFixed(1)}`, bad.map(r=>`${r.a}/${r.b}:${r.error.toFixed(1)}`).join(" ")); }
