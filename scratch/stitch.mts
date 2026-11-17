// usage: stitch.mts <layer> <z> <out.png> : stitch every exported tile of data/web/regions/trento/tiles/<layer>/<z> into one PNG (cropped to non-empty)
import sharp from "sharp"; import { readdirSync } from "node:fs";
const [layer, z, out] = process.argv.slice(2); const D = `/workspace/mondoiso-trento/data/web/regions/trento/tiles/${layer}/${z}`;
const t: [number, number, string][] = [];
for (const x of readdirSync(D)) for (const f of readdirSync(`${D}/${x}`)) t.push([+x, +f.split(".")[0], `${D}/${x}/${f}`]);
const S = (await sharp(t[0][2]).metadata()).width!;
const xs = t.map((a) => a[0]), ys = t.map((a) => a[1]); const x0 = Math.min(...xs), y0 = Math.min(...ys);
const W = (Math.max(...xs) - x0 + 1) * S, H = (Math.max(...ys) - y0 + 1) * S;
const comp = await Promise.all(t.map(async ([x, y, f]) => ({ input: await sharp(f).png().toBuffer(), left: (x - x0) * S, top: (y - y0) * S })));
const buf = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comp).png().toBuffer();
const tr = await sharp(buf).trim({ threshold: 1 }).png().toFile(out);
console.log("tiles", t.length, "tile px", S, "canvas", W, "x", H, "->", tr.width, "x", tr.height, out);
