// fraction of window that is rendered (non-black) but outside painted strip bands of input
import sharp from "sharp";
const [w, edges] = process.argv.slice(2); const S=1024,B=128;
const es=(edges||"").split(",").filter(Boolean);
const a=await sharp(`/workspace/mondoiso-trento/data/derived/trento-nord/work/${w}/input.png`).removeAlpha().resize(S,S).raw().toBuffer();
let n=0; for(let y=0;y<S;y++)for(let x=0;x<S;x++){const i=(y*S+x)*3; if(a[i]+a[i+1]+a[i+2]<30) continue;
 const inb=es.some(e=>(e==="left"&&x<B)||(e==="right"&&x>=S-B)||(e==="top"&&y<B)||(e==="bottom"&&y>=S-B)); if(!inb) n++;}
console.log(w, (n/S/S).toFixed(3));
