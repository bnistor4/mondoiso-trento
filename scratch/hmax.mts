// usage: hmax.mts <area> : max decoded ellipsoid height (m) over the area's height tiles; px at the 24-bit ceiling (167672.15 m)
// and px above the old 16-bit ceiling (555.35 m, needs B>0).
import { readdirSync } from "node:fs"; import { readHeights } from "../pipeline/src/heights.ts";
const d = `/workspace/mondoiso-trento/data/derived/${process.argv[2]}/height/`; let mx = -1e9, sat = 0, old = 0, n = 0;
for (const f of readdirSync(d).filter((f) => f.endsWith(".png"))) for (const h of await readHeights(d + f)) { if (!Number.isFinite(h)) continue; n++; if (h > mx) mx = h; if (h >= 167671.15) sat++; if (h > 555.35) old++; }
console.log(process.argv[2], "max ellipsoid h", mx.toFixed(2), "m (~", (mx - 48).toFixed(0), "m asl); px at 24-bit ceiling", sat, "; px above old 16-bit ceiling", old, "of", n);
