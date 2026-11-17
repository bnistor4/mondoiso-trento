// usage: snap.mts <out.json> : sha1 of the decoded Float32 heights for a fixed sample of height tiles (3 per area, every area with height/)
import { readdirSync, existsSync, writeFileSync } from "node:fs"; import { createHash } from "node:crypto"; import sharp from "sharp";
import { readHeights } from "../../pipeline/src/heights.ts";
const R = "/workspace/mondoiso-trento/data/derived/"; const out: Record<string, string> = {}; let bmax = 0;
for (const a of readdirSync(R)) { const d = `${R}${a}/height/`; if (!existsSync(d)) continue;
  const fs = readdirSync(d).filter((f) => f.endsWith(".png")).sort(); const pick = [fs[0], fs[fs.length >> 1], fs[fs.length - 1]].filter(Boolean);
  for (const f of pick) { const h = await readHeights(d + f); out[`${a}/${f}`] = createHash("sha1").update(Buffer.from(h.buffer)).digest("hex");
    const b = await sharp(d + f).ensureAlpha().raw().toBuffer(); for (let i = 2; i < b.length; i += 4) if (b[i] > bmax) bmax = b[i]; } }
writeFileSync(process.argv[2], JSON.stringify(out, null, 1)); console.log("tiles", Object.keys(out).length, "max B byte", bmax);
