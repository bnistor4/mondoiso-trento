// usage: rebase2.mts <new-area> <base-areas csv> [--apply] : generalised rebase.mts. Solve the unclamped union palette over
// base+new windows; with --apply bake ONE uniform per-channel shift into every <new-area> window so the base areas keep
// their gauge. Originals -> <new-area>/archive/prebase/.
import { readdirSync, existsSync, mkdirSync, copyFileSync, renameSync } from "node:fs"; import sharp from "sharp";
import { windowPalette } from "../pipeline/src/palette.ts";
const R="/workspace/mondoiso-trento/data/derived/"; const [na, base] = process.argv.slice(2); const apply=process.argv.includes("--apply");
const files=new Map<string,string>(); const nw=new Set<string>();
for(const a of [...base.split(","), na]) for(const f of readdirSync(`${R}${a}/windows`).filter(f=>/^-?\d+_-?\d+\.png$/.test(f))) { const k=f.slice(0,-4); files.set(k,`${R}${a}/windows/${f}`); if(a===na) nw.add(k); else nw.delete(k); }
const {offsets,residuals}=await windowPalette(files,1000);
const mean=(ks:string[])=>[0,1,2].map(c=>ks.reduce((s,k)=>s+offsets.get(k)![c],0)/ks.length);
const ks=[...files.keys()], mn=mean(ks.filter(k=>nw.has(k))), mb=mean(ks.filter(k=>!nw.has(k)));
const shift=mn.map((v,c)=>Math.round(v-mb[c]));
const rs=residuals.map(r=>r.error).sort((a,b)=>b-a);
console.log("windows",files.size,na,nw.size,"new mean",mn.map(v=>v.toFixed(1)),"base mean",mb.map(v=>v.toFixed(1)),"shift",shift,"max resid(unclamped)",rs[0]?.toFixed(2),"top5",rs.slice(0,5).map(v=>v.toFixed(1)).join(","));
if(apply){ const arch=`${R}${na}/archive/prebase/`; mkdirSync(arch,{recursive:true});
  for(const k of nw){ const f=files.get(k)!; if(!existsSync(arch+k+".png")) copyFileSync(f,arch+k+".png");
    const {data,info}=await sharp(f).removeAlpha().raw().toBuffer({resolveWithObject:true});
    for(let i=0;i<data.length;i+=3){ if(!(data[i]|data[i+1]|data[i+2])) continue; for(let c=0;c<3;c++) data[i+c]=Math.max(1,Math.min(255,data[i+c]+shift[c])); }
    await sharp(data,{raw:{width:info.width,height:info.height,channels:3}}).png().toFile(f+".tmp.png"); renameSync(f+".tmp.png", f); }
  console.log("applied to",nw.size); }
