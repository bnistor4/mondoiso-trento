import sharp from "sharp"; import {overlapDelta} from "./src/palette.ts"; import {existsSync} from "node:fs";
const f=(k:string)=>["trento-nord","trento-citta"].map(a=>`/workspace/mondoiso-trento/data/derived/${a}/windows/${k}.png`).find(existsSync)!;
const s=async(k:string)=>sharp(f(k)).removeAlpha().resize(256,256).blur(1).raw().toBuffer();
for(const [a,b,v] of process.argv.slice(2).map(x=>x.split(":")).map(([a,b])=>{const [ax,ay]=a.split("_").map(Number),[bx,by]=b.split("_").map(Number);return [a,b,by>ay] as const;}))
  console.log(a,b,overlapDelta(await s(a),await s(b),256,32,v).join(","));
