import sharp from "sharp";
const c = async (f: string) => { const d = await sharp(f).removeAlpha().resize(8,8,{fit:"fill"}).raw().toBuffer(); return Array.from({length:64},(_,k)=>(d[k*3]+d[k*3+1]+d[k*3+2])/3); };
const [o,n] = [await c(process.argv[2]), await c(process.argv[3])];
o.forEach((v,k)=>{ if (v<40 && v<0.5*n[k] && n[k]>=24) console.log(k%8, Math.floor(k/8), v.toFixed(0), n[k].toFixed(0)); });
