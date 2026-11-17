// usage: match.mts <input.png> <painting> <edges e.g. "right,top"> <out.png>
// Per-channel mean shift so the painting's already-painted bands match the input's bands (limits palette drift).
import sharp from "sharp";
const [inp, pnt, edges, out] = process.argv.slice(2);
const S = 1024, B = 112;
const a = await sharp(inp).removeAlpha().resize(S, S).raw().toBuffer();
const p = await sharp(pnt).removeAlpha().resize(S, S).raw().toBuffer();
const es = edges.split(",").filter(Boolean);
const inBand = (x: number, y: number) => es.some((e) => (e === "left" && x < B) || (e === "right" && x >= S - B) || (e === "top" && y < B) || (e === "bottom" && y >= S - B));
const sa = [0, 0, 0], sp = [0, 0, 0]; let n = 0;
for (let y = 0; y < S; y += 2) for (let x = 0; x < S; x += 2) {
  if (!inBand(x, y)) continue; const i = (y * S + x) * 3;
  if (a[i] + a[i + 1] + a[i + 2] < 30 || p[i] + p[i + 1] + p[i + 2] < 30) continue;
  for (let c = 0; c < 3; c++) { sa[c] += a[i + c]; sp[c] += p[i + c]; } n++;
}
const d = n > 500 ? sa.map((v, c) => Math.max(-30, Math.min(30, (v - sp[c]) / n))) : [0, 0, 0];
for (let i = 0; i < p.length; i++) { const v = p[i]; if (v === 0 && p[i - (i % 3)] + p[i - (i % 3) + 1] + p[i - (i % 3) + 2] === 0) continue; p[i] = Math.max(0, Math.min(255, Math.round(v + d[i % 3]))); }
await sharp(p, { raw: { width: S, height: S, channels: 3 } }).png().toFile(out);
console.log(`match n=${n} shift=${d.map((v) => v.toFixed(1)).join(",")}`);
