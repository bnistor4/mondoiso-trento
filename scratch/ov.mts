// usage: ov.mts <a> <b> <h|v> <out> : overlap strips side by side (a's band | b's band)
import sharp from "sharp"; import {existsSync} from "node:fs";
const f=(k:string)=>["trento-nord","trento-citta"].map(a=>`/workspace/mondoiso-trento/data/derived/${a}/windows/${k}.png`).find(existsSync)!;
const [a,b,o,out]=process.argv.slice(2);
const ea=o==="h"?{left:896,top:0,width:128,height:1024}:{left:0,top:896,width:1024,height:128};
const eb=o==="h"?{left:0,top:0,width:128,height:1024}:{left:0,top:0,width:1024,height:128};
const A=await sharp(f(a)).extract(ea).toBuffer(), B=await sharp(f(b)).extract(eb).toBuffer();
const W=o==="h"?272:1024, H=o==="h"?1024:272;
await sharp({create:{width:W,height:H,channels:3,background:"#f0f"}}).composite([{input:A,left:0,top:0},{input:B,left:o==="h"?144:0,top:o==="h"?0:144}]).png().toFile(out);
