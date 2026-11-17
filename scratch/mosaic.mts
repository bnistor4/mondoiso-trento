// usage: mosaic.mts <layer> <out> <area...> : low-res mosaic of a tile layer across areas (later areas on top)
import sharp from "sharp"; import {readdirSync,existsSync} from "node:fs";
const [layer,out,...areas]=process.argv.slice(2); const R="/workspace/mondoiso-trento/data/derived/"; const s=48;
const t=new Map<string,string>(); for(const a of areas){const d=`${R}${a}/${layer}`; if(existsSync(d)) for(const f of readdirSync(d).filter(f=>/^-?\d+_-?\d+\.png$/.test(f))) t.set(f.slice(0,-4),`${d}/${f}`);}
const ks=[...t.keys()].map(k=>k.split("_").map(Number)); const x0=Math.min(...ks.map(k=>k[0])),y0=Math.min(...ks.map(k=>k[1])),x1=Math.max(...ks.map(k=>k[0])),y1=Math.max(...ks.map(k=>k[1]));
const comps=await Promise.all([...t].map(async([k,f])=>{const [x,y]=k.split("_").map(Number);return {input:await sharp(f).resize(s,s).png().toBuffer(),left:(x-x0)*s,top:(y-y0)*s};}));
await sharp({create:{width:(x1-x0+1)*s,height:(y1-y0+1)*s,channels:3,background:"#f0f"}}).composite(comps).png().toFile(out); console.log(t.size,x0,y0,x1,y1);
