import sharp from "sharp";
const [d,out,...ks]=process.argv.slice(2);
const ims=await Promise.all(ks.map(k=>sharp(d+k+".png").resize(384,384).toBuffer()));
await sharp({create:{width:384*ks.length,height:384,channels:3,background:"#f0f"}}).composite(ims.map((input,i)=>({input,left:i*384,top:0}))).png().toFile(out);
