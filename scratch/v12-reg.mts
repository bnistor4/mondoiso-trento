// usage: v12-reg.mts <render.png> <in> <out.png> : register (paint.ts gate) then warp the painting onto the render (applyRegistration)
import sharp from "sharp"; import { register, applyRegistration } from "../pipeline/src/register.ts";
const [ref, f, out] = process.argv.slice(2); const n = `/tmp/reg-${Math.random().toString(36).slice(2)}.png`;
await sharp(f).resize(1024, 1024, { fit: "fill" }).removeAlpha().png().toFile(n);
const r = await register(ref, n); await applyRegistration(n, out, r);
console.log(JSON.stringify({ f, score: +r.score.toFixed(3), scale: r.scale, dx: r.dx, dy: r.dy }));
