// move windows whose 1024² box is mostly outside rendered tiles (own + context areas) to the end of an order file
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const [file, ...areas] = process.argv.slice(2); const T = 1024, S = 896, W = 1024;
const order = readFileSync(file, "utf8").trim().split(/\s+/);
const frac = (w: string) => { const [i, j] = w.split("_").map(Number); let a = 0;
  for (let ty = Math.floor(j*S/T); ty <= Math.floor((j*S+W-1)/T); ty++) for (let tx = Math.floor(i*S/T); tx <= Math.floor((i*S+W-1)/T); tx++) {
    if (!areas.some(ar => existsSync(`data/derived/${ar}/render/${tx}_${ty}.png`))) continue;
    const ox = Math.max(0, Math.min((tx+1)*T, i*S+W) - Math.max(tx*T, i*S)), oy = Math.max(0, Math.min((ty+1)*T, j*S+W) - Math.max(ty*T, j*S)); a += ox*oy; }
  return a / (W*W); };
const lo = order.filter(w => frac(w) < 0.3), hi = order.filter(w => frac(w) >= 0.3);
writeFileSync(file, [...hi, ...lo].join(" ") + "\n"); console.log(`${hi.length} main, ${lo.length} mostly-black moved last:`, lo.join(" "));
