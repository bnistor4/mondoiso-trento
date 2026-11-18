// usage: v12-gate.mts <render.png> <painting> ... : paint.ts registration gate (register(): best NCC over scale/shift) vs the window render
import sharp from "sharp"; import { register } from "../pipeline/src/register.ts";
const [ref, ...files] = process.argv.slice(2);
for (const f of files) { const n = `/tmp/gate-${Math.random().toString(36).slice(2)}.png`;
  await sharp(f).resize(1024, 1024, { fit: "fill" }).removeAlpha().png().toFile(n);
  const r = await register(ref, n); console.log(JSON.stringify({ f, score: +r.score.toFixed(3), identity: +r.identity.toFixed(3), scale: r.scale, dx: r.dx, dy: r.dy })); }
