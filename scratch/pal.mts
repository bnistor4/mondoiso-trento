import sharp from "sharp"; import { overlapDelta } from "../pipeline/src/palette.ts";
const W="data/derived/trento-duomo/windows/";
const s=async(k:string)=>sharp(W+k+".png").removeAlpha().resize(256,256).blur(1).raw().toBuffer();
for (const [a,b,v] of [["0_-4","1_-4",false],["1_-4","1_-3",true],["0_-3","1_-3",false],["1_-3","1_-2",true]] as const)
  console.log(a,b,overlapDelta(await s(a),await s(b),256,32,v).map(Math.round));
