// Same QA as paint.ts: register(work/<w>/input.png, painting) on the 1024² normalised image.
import sharp from "sharp";
import { register } from "../pipeline/src/register.ts";
const [w, file] = process.argv.slice(2);
const norm = `/tmp/score-${w}.png`;
const m = await sharp(file).metadata();
await sharp(file).resize(1024, 1024, { fit: "fill" }).removeAlpha().png().toFile(norm);
const r = await register(`data/derived/${process.env.AREA ?? "trento-duomo"}/work/${w}/input.png`, norm);
console.log(JSON.stringify({ w, size: `${m.width}x${m.height}`, format: m.format, score: +r.score.toFixed(3), identity: +r.identity.toFixed(3), scale: r.scale, dx: r.dx, dy: r.dy }));
