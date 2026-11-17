import { readFileSync } from "node:fs";
import { openArea, groundH } from "../pipeline/src/areas.ts";
import { CAMERA, llhToPixel } from "../pipeline/src/camera.ts";
openArea(process.env.AREA ?? "trento-duomo");
const T = CAMERA.tile, WIN = 1024, STRIDE = 896;
const m = JSON.parse(readFileSync(`data/derived/${process.env.AREA ?? "trento-duomo"}/manifest.json`, "utf8"));
const set = new Set<string>();
for (const { x: tx, y: ty } of m.tiles)
  for (let j = Math.floor((ty * T - WIN) / STRIDE) + 1; j * STRIDE < (ty + 1) * T; j++)
    for (let i = Math.floor((tx * T - WIN) / STRIDE) + 1; i * STRIDE < (tx + 1) * T; i++) set.add(`${i}_${j}`);
const [px, py] = llhToPixel(46.0679, 11.1211, groundH() - 30);
const ci = Math.floor(px / STRIDE), cj = Math.floor(py / STRIDE);
const order: string[] = [];
const maxR = Number(process.env.MAXR ?? 12);
for (let r = 0; r <= maxR; r++) {
  const ring: Array<[number, number]> = [];
  if (r === 0) ring.push([ci, cj]); else {
    for (let k = 0; k < 2 * r; k++) ring.push([ci - r + k, cj - r]);
    for (let k = 0; k < 2 * r; k++) ring.push([ci + r, cj - r + k]);
    for (let k = 0; k < 2 * r; k++) ring.push([ci + r - k, cj + r]);
    for (let k = 0; k < 2 * r; k++) ring.push([ci - r, cj + r - k]);
  }
  for (const pass of [0, 1]) ring.forEach(([i, j], k) => { if (k % 2 === pass && set.has(`${i}_${j}`)) order.push(`${i}_${j}`); });
}
console.log(set.size, "centre", `${ci}_${cj}`); console.log(order.join(" "));
