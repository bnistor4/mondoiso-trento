// usage: clean.mts <area> <ctx> [--dry] : zero near-black JPEG/model noise where the render itself is black
// (render-black = outside the modelled area; the brief says those stay pure black). Originals -> archive/prenoise/.
import { existsSync, mkdirSync, readdirSync, copyFileSync, renameSync } from "node:fs";
import sharp from "sharp";
const R = "/workspace/mondoiso-trento/data/derived/";
const [area, ctx, dry] = process.argv.slice(2); const T = 1024, S = 896, W = 1024;
const dir = `${R}${area}/windows/`, arch = `${R}${area}/archive/prenoise/`; mkdirSync(arch, { recursive: true });
let tot = 0;
for (const f of readdirSync(dir).filter((f) => /^-?\d+_-?\d+\.png$/.test(f))) {
  const [i, j] = f.slice(0, -4).split("_").map(Number);
  const mask = new Uint8Array(W * W); // 1 = render has content
  for (let ty = Math.floor(j * S / T); ty <= Math.floor((j * S + W - 1) / T); ty++) for (let tx = Math.floor(i * S / T); tx <= Math.floor((i * S + W - 1) / T); tx++) {
    // keep-mask = content in ANY area's render (own + every ctx area). v7 bug: [area, ctx] took the ctx csv as one path and the
    // first file found, so dark painting inside a neighbour (own render black/missing there) was zeroed (scratch/cleandmg.py).
    for (const rf of [area, ...(ctx ?? "").split(",").filter(Boolean)].map((a) => `${R}${a}/render/${tx}_${ty}.png`).filter(existsSync)) {
    const x0 = Math.max(tx * T, i * S), x1 = Math.min((tx + 1) * T, i * S + W), y0 = Math.max(ty * T, j * S), y1 = Math.min((ty + 1) * T, j * S + W);
    const { data } = await sharp(rf).extract({ left: x0 - tx * T, top: y0 - ty * T, width: x1 - x0, height: y1 - y0 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let k = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++, k += 3) if (data[k] + data[k + 1] + data[k + 2] > 30) mask[(y - j * S) * W + (x - i * S)] = 1;
    }
  }
  // dilate mask by 3 px so anti-aliased edges of real content are kept
  const m2 = new Uint8Array(mask); for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (mask[y * W + x]) for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < W && xx >= 0 && xx < W) m2[yy * W + xx] = 1; }
  const img = await sharp(dir + f).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  if (img.info.width !== W) { console.log("skip", f, img.info.width); continue; }
  const b = img.data; let n = 0;
  for (let p = 0; p < W * W; p++) { const q = p * 3; if (!m2[p] && (b[q] | b[q + 1] | b[q + 2]) && Math.max(b[q], b[q + 1], b[q + 2]) < 90) { b[q] = b[q + 1] = b[q + 2] = 0; n++; } }
  if (n > 500) { tot++; console.log(f.slice(0, -4), n); if (!dry) { if (!existsSync(arch + f)) copyFileSync(dir + f, arch + f); await sharp(b, { raw: { width: W, height: W, channels: 3 } }).png().toFile(dir + f + ".tmp.png"); renameSync(dir + f + ".tmp.png", dir + f); } }
}
console.log("windows cleaned", tot, dry ? "(dry)" : "");
