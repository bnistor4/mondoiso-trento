// usage: rebase.mts [--apply] : nord paintings drifted darker than citta, so the union palette's mean-zero gauge
// pushes citta windows into the ±40 clamp. Measure the unclamped solve, then (with --apply) bake ONE uniform
// per-channel shift into every trento-nord window so citta keeps its standalone gauge. Originals -> archive/prebase/.
import { readdirSync, existsSync, mkdirSync, copyFileSync } from "node:fs"; import sharp from "sharp";
import { windowPalette } from "../pipeline/src/palette.ts";
const R="/workspace/mondoiso-trento/data/derived/"; const apply=process.argv.includes("--apply");
const files=new Map<string,string>(); const nord=new Set<string>();
for(const a of ["trento-citta","trento-nord"]) for(const f of readdirSync(`${R}${a}/windows`).filter(f=>/^-?\d+_-?\d+\.png$/.test(f))) { const k=f.slice(0,-4); files.set(k,`${R}${a}/windows/${f}`); if(a==="trento-nord") nord.add(k); }
const {offsets,residuals}=await windowPalette(files,1000);
const mean=(ks:string[])=>[0,1,2].map(c=>ks.reduce((s,k)=>s+offsets.get(k)![c],0)/ks.length);
const ks=[...files.keys()], mn=mean(ks.filter(k=>nord.has(k))), mc=mean(ks.filter(k=>!nord.has(k)));
const shift=mn.map((v,c)=>Math.round(v-mc[c]));
console.log("windows",files.size,"nord",nord.size,"nord mean",mn.map(v=>v.toFixed(1)),"citta mean",mc.map(v=>v.toFixed(1)),"shift",shift,"max resid(unclamped)",Math.max(...residuals.map(r=>r.error)).toFixed(2));
if(apply){ const arch=`${R}trento-nord/archive/prebase/`; mkdirSync(arch,{recursive:true});
  for(const k of nord){ const f=files.get(k)!; if(!existsSync(arch+k+".png")) copyFileSync(f,arch+k+".png");
    const {data,info}=await sharp(f).removeAlpha().raw().toBuffer({resolveWithObject:true});
    for(let i=0;i<data.length;i+=3){ if(!(data[i]|data[i+1]|data[i+2])) continue; for(let c=0;c<3;c++) data[i+c]=Math.max(1,Math.min(255,data[i+c]+shift[c])); }
    await sharp(data,{raw:{width:info.width,height:info.height,channels:3}}).png().toFile(f+".tmp.png"); }
  console.log("applied to",nord.size); }
