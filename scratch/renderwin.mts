// usage: renderwin.mts <area> <ctx> <i_j> <out> : the render composite for a window
import { existsSync } from "node:fs"; import sharp from "sharp";
const R="/workspace/mondoiso-trento/data/derived/"; const [area,ctx,w,out]=process.argv.slice(2); const T=1024,S=896,W=1024;
const [i,j]=w.split("_").map(Number); const comps:any[]=[];
for(let ty=Math.floor(j*S/T);ty<=Math.floor((j*S+W-1)/T);ty++) for(let tx=Math.floor(i*S/T);tx<=Math.floor((i*S+W-1)/T);tx++){
 const rf=[area,ctx].map(a=>`${R}${a}/render/${tx}_${ty}.png`).find(existsSync); if(!rf) continue;
 const x0=Math.max(tx*T,i*S),x1=Math.min((tx+1)*T,i*S+W),y0=Math.max(ty*T,j*S),y1=Math.min((ty+1)*T,j*S+W);
 comps.push({input:await sharp(rf).extract({left:x0-tx*T,top:y0-ty*T,width:x1-x0,height:y1-y0}).png().toBuffer(),left:x0-i*S,top:y0-j*S});}
await sharp({create:{width:W,height:W,channels:3,background:"#000"}}).composite(comps).png().toFile(out);
