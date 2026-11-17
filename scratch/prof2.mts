import sharp from "sharp";
const { data } = await sharp("data/raw/dem/Copernicus_DSM_COG_10_N46_00_E011_00_DEM.tif").extractChannel(0).raw({ depth: "float" }).toBuffer({ resolveWithObject: true });
const t = new Float32Array(data.buffer, data.byteOffset, data.length / 4);
const dem = (lat: number, lon: number) => t[Math.floor((47 - lat) * 3600) * 3600 + Math.floor((lon - 11) * 3600)];
for (let la = 46.135; la >= 46.050; la -= 0.005) { let s = la.toFixed(3) + " "; for (let lo = 11.080; lo <= 11.126; lo += 0.002) s += String(Math.round(dem(la, lo))).padStart(4); console.log(s); }
let h="       "; for (let lo = 11.080; lo <= 11.126; lo += 0.002) h += String(Math.round((lo-11)*1000)).padStart(4); console.log(h);
