// usage: blackmask.mts <input.png> <painting> : where the input is pure black (outside the model), force the painting black
import sharp from "sharp";
const [inp, pnt] = process.argv.slice(2); const S = 1024;
const a = await sharp(inp).removeAlpha().resize(S, S).raw().toBuffer();
const p = await sharp(pnt).removeAlpha().resize(S, S).raw().toBuffer(); let n = 0;
for (let i = 0; i < S * S * 3; i += 3) if (a[i] + a[i + 1] + a[i + 2] < 8 && (p[i] | p[i + 1] | p[i + 2])) { p[i] = p[i + 1] = p[i + 2] = 0; n++; }
await sharp(p, { raw: { width: S, height: S, channels: 3 } }).png().toFile(pnt + ".bm.png");
const { renameSync } = await import("node:fs"); renameSync(pnt + ".bm.png", pnt);
console.log(`blackmask ${n}`);
