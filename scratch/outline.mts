import sharp from "sharp";
const [dir] = process.argv.slice(2), S = 1024;
const h = await sharp(`${dir}/height.png`).greyscale().raw().toBuffer();
const img = await sharp(`${dir}/input.png`).removeAlpha().raw().toBuffer();
const out = Buffer.from(img);
for (let y = 1; y < S - 1; y++) for (let x = 1; x < S - 1; x++) {
  const i = y * S + x;
  const gx = h[i + 1] - h[i - 1], gy = h[i + S] - h[i - S];
  if (Math.hypot(gx, gy) > 18) for (let c = 0; c < 3; c++) out[i * 3 + c] = 25;
}
await sharp(out, { raw: { width: S, height: S, channels: 3 } }).png().toFile(`${dir}/outline.png`);
