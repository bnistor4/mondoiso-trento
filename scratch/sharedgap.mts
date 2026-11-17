// usage: sharedgap.mts <area> <ctx csv> < "w owner" lines : fraction of each shared window that the new area's render covers
// but the existing painting leaves black (=> must be repainted from the new area); else it can be reused via --context.
import sharp from "sharp"; import { existsSync, readFileSync } from "node:fs";
const R = "/workspace/mondoiso-trento/data/derived/"; const [area, ctx] = process.argv.slice(2); const T = 1024, S = 896, W = 1024;
for (const line of readFileSync(0, "utf8").trim().split("\n")) {
  const [w, owner] = line.split(" "); const [i, j] = w.split("_").map(Number);
  const p = await sharp(`${R}${owner}/windows/${w}.png`).removeAlpha().raw().toBuffer(); let gap = 0, cov = 0;
  for (let ty = Math.floor(j * S / T); ty <= Math.floor((j * S + W - 1) / T); ty++) for (let tx = Math.floor(i * S / T); tx <= Math.floor((i * S + W - 1) / T); tx++) {
    const rf = `${R}${area}/render/${tx}_${ty}.png`; if (!existsSync(rf)) continue;
    const x0 = Math.max(tx * T, i * S), x1 = Math.min((tx + 1) * T, i * S + W), y0 = Math.max(ty * T, j * S), y1 = Math.min((ty + 1) * T, j * S + W);
    const d = await sharp(rf).extract({ left: x0 - tx * T, top: y0 - ty * T, width: x1 - x0, height: y1 - y0 }).removeAlpha().raw().toBuffer();
    for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) { const k = ((y - y0) * (x1 - x0) + (x - x0)) * 3; if (d[k] + d[k + 1] + d[k + 2] < 8) continue; cov++;
      const q = ((y - j * S) * W + (x - i * S)) * 3; if (p[q] + p[q + 1] + p[q + 2] < 8) gap++; }
  }
  console.log(w, owner, "estcov", (cov / (W * W / 4)).toFixed(2), "gap", (gap / (W * W / 4)).toFixed(3));
}
