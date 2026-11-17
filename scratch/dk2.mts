import sharp from "sharp";
const g=async(f:string)=>sharp(f).removeAlpha().resize(8,8,{fit:"fill"}).raw().toBuffer();
const a=await g(process.argv[2]), b=await g(process.argv[3]);
for(let k=0;k<64;k++){const v=(a[k*3]+a[k*3+1]+a[k*3+2])/3, n=(b[k*3]+b[k*3+1]+b[k*3+2])/3; if(v<40&&n>=24) console.log(k%8,k>>3,v.toFixed(0),[a[k*3],a[k*3+1],a[k*3+2]].join("/"),n.toFixed(0))}
