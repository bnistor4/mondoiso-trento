// usage: pasteband.mts <input.png> <painting> <x0> <out.png> : restore input's painted right band (x>=x0)
import sharp from "sharp";
const [inp,pnt,x0s,out]=process.argv.slice(2); const x0=+x0s;
const band=await sharp(inp).removeAlpha().extract({left:x0,top:0,width:1024-x0,height:1024}).png().toBuffer();
await sharp(pnt).removeAlpha().resize(1024,1024).composite([{input:band,left:x0,top:0}]).png().toFile(out);
