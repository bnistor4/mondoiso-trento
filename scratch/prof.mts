import sharp from "sharp";
const { data } = await sharp("data/raw/dem/Copernicus_DSM_COG_10_N46_00_E011_00_DEM.tif").extractChannel(0).raw({ depth: "float" }).toBuffer({ resolveWithObject: true });
const t = new Float32Array(data.buffer, data.byteOffset, data.length / 4);
const dem = (lat: number, lon: number) => t[Math.floor((47 - lat) * 3600) * 3600 + Math.floor((lon - 11) * 3600)];
const [a, b, s] = process.argv.slice(2).map(Number);
for (let la = b; la >= a; la -= s) { let row = `${la.toFixed(3)} `; for (let lo = 11.090; lo <= 11.160; lo += 0.0025) row += String(Math.round(dem(la, lo) / 10)).padStart(4); console.log(row); }
console.log("lon      " + Array.from({ length: 29 }, (_, k) => (11.090 + k * 0.0025).toFixed(4).slice(-3)).map(x => x.padStart(4)).join(""));
