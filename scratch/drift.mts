import { readdirSync } from "node:fs";
import sharp from "sharp";
const D="/workspace/mondoiso-trento/data/derived/";
const files=new Map<string,string>();
for (const a of ["trento-citta","trento-nord"]) for (const f of readdirSync(D+a+"/windows")) if(f.endsWith(".png")) files.set(f.replace(".png",""),D+a+"/windows/"+f);
const s=new Map<string,Buffer>();
for (const [k,f] of files) s.set(k,await sharp(f).removeAlpha().resize(256,256).blur(1).raw().toBuffer());
const mean=(b:Buffer,x0:number,x1:number,y0:number,y1:number)=>{let t=0,n=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*256+x)*3;const v=(b[i]+b[i+1]+b[i+2])/3;if(v>12){t+=v;n++;}}return n>200?t/n:NaN};
const nord=new Set(readdirSync(D+"trento-nord/windows").map(f=>f.replace(".png","")));
for (const [k,a] of s){const [x,y]=k.split("_").map(Number);
 for(const [nk,v] of [[`${x+1}_${y}`,false],[`${x}_${y+1}`,true]] as const){const b=s.get(nk);if(!b)continue; if(!nord.has(k)&&!nord.has(nk))continue;
  const ma=v?mean(a,0,256,224,256):mean(a,224,256,0,256), mb=v?mean(b,0,256,0,32):mean(b,0,32,0,256);
  console.log(k,"->",nk,(ma-mb).toFixed(1));}}
