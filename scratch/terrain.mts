// read-only: Copernicus DEM stats (m asl) over candidate bboxes; height image ceiling ~507 m asl
import sharp from "sharp";
const { data } = await sharp("data/raw/dem/Copernicus_DSM_COG_10_N46_00_E011_00_DEM.tif").extractChannel(0).raw({ depth: "float" }).toBuffer({ resolveWithObject: true });
const t = new Float32Array(data.buffer, data.byteOffset, data.length / 4);
const dem = (lat: number, lon: number) => t[Math.min(3599, Math.floor((47 - lat) * 3600)) * 3600 + Math.min(3599, Math.floor((lon - 11) * 3600))];
const c: Record<string, number[]> = JSON.parse(process.argv[2]);
for (const [n, [a, b, cc, d]] of Object.entries(c)) { const v: number[] = []; let hi = [0, 0, 0];
  for (let la = a; la <= cc; la += 0.0005) for (let lo = b; lo <= d; lo += 0.0005) { const h = dem(la, lo); v.push(h); if (h > hi[0]) hi = [h, la, lo]; }
  v.sort((x, y) => x - y); const over = (m: number) => (100 * v.filter(h => h > m).length / v.length).toFixed(1);
  console.log(n, `min ${v[0].toFixed(0)} p50 ${v[v.length >> 1].toFixed(0)} p95 ${v[Math.floor(v.length * .95)].toFixed(0)} max ${hi[0].toFixed(0)} @${hi[1].toFixed(4)},${hi[2].toFixed(4)}  >450m ${over(450)}%  >507m ${over(507)}%  >707m ${over(707)}%  >907m ${over(907)}%`); }
