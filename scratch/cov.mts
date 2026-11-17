import { existsSync } from "node:fs";
import sharp from "sharp";
const [area, ctx, ...ws] = process.argv.slice(2); const T=1024,S=896,W=1024;
for (const w of ws) { const [i,j]=w.split("_").map(Number); let nb=0, tot=W*W;
  for (let ty=Math.floor(j*S/T); ty<=Math.floor((j*S+W-1)/T); ty++) for (let tx=Math.floor(i*S/T); tx<=Math.floor((i*S+W-1)/T); tx++) {
    const f=[area,ctx].map(a=>`/workspace/mondoiso-trento/data/derived/${a}/render/${tx}_${ty}.png`).find(existsSync); if(!f) continue;
    const x0=Math.max(tx*T,i*S), x1=Math.min((tx+1)*T,i*S+W), y0=Math.max(ty*T,j*S), y1=Math.min((ty+1)*T,j*S+W);
    const {data,info}=await sharp(f).extract({left:x0-tx*T,top:y0-ty*T,width:x1-x0,height:y1-y0}).removeAlpha().raw().toBuffer({resolveWithObject:true});
    for(let k=0;k<data.length;k+=3) if(data[k]+data[k+1]+data[k+2]>30) nb++; }
  console.log(w,(nb/tot).toFixed(2)); }
