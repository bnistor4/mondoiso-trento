import sharp from "sharp";
const S = 256;
async function edges(file: string, blur = 0.8) {
  const g = await sharp(file).resize(S, S, { fit: "fill" }).greyscale().blur(blur).raw().toBuffer();
  const e = new Float32Array(S * S);
  for (let y = 1; y < S - 1; y++) for (let x = 1; x < S - 1; x++) {
    const i = y * S + x;
    const gx = g[i + 1 - S] + 2 * g[i + 1] + g[i + 1 + S] - g[i - 1 - S] - 2 * g[i - 1] - g[i - 1 + S];
    const gy = g[i + S - 1] + 2 * g[i + S] + g[i + S + 1] - g[i - S - 1] - 2 * g[i - S] - g[i - S + 1];
    e[i] = Math.hypot(gx, gy);
  }
  return e;
}
function ncc(a: Float32Array, b: Float32Array, s: number, dx: number, dy: number, m = 12) {
  let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, n = 0; const c = S / 2;
  for (let y = m; y < S - m; y += 2) for (let x = m; x < S - m; x += 2) {
    const bx = Math.round((x - c - dx) / s + c), by = Math.round((y - c - dy) / s + c);
    if (bx < 0 || by < 0 || bx >= S || by >= S) continue;
    const va = a[y * S + x], vb = b[by * S + bx]; sa += va; sb += vb; saa += va * va; sbb += vb * vb; sab += va * vb; n++;
  }
  return (sab / n - (sa / n) * (sb / n)) / Math.sqrt((saa / n - (sa / n) ** 2) * (sbb / n - (sb / n) ** 2) + 1e-9);
}
const [ref, pnt, out] = process.argv.slice(2);
for (const blur of [0.8, 2, 4]) {
  const a = await edges(ref, blur), b = await edges(pnt, blur);
  let best = { s: 1, dx: 0, dy: 0, v: -1 };
  for (let s = 0.85; s <= 1.151; s += 0.01) for (let dy = -30; dy <= 30; dy++) for (let dx = -30; dx <= 30; dx++) { const v = ncc(a, b, s, dx, dy); if (v > best.v) best = { s, dx, dy, v }; }
  console.log(`blur ${blur}: identity ${ncc(a, b, 1, 0, 0).toFixed(3)} best ${best.v.toFixed(3)} at scale ${best.s.toFixed(2)} shift ${best.dx * 4},${best.dy * 4} px`);
}
// self-consistency: render vs render with jpeg + slight blur
const a = await edges(ref), b = await edges(pnt);
const mx = (e: Float32Array) => { const s = [...e].sort((x, y) => x - y); return s[Math.floor(s.length * 0.98)]; };
const ma = mx(a), mb = mx(b), rgb = Buffer.alloc(S * S * 3);
for (let i = 0; i < S * S; i++) { rgb[i * 3] = Math.min(255, (a[i] / ma) * 255); rgb[i * 3 + 1] = Math.min(255, (b[i] / mb) * 255); }
await sharp(rgb, { raw: { width: S, height: S, channels: 3 } }).resize(768, 768, { kernel: "nearest" }).png().toFile(out);
