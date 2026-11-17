import { openArea } from "../pipeline/src/areas.ts";
import { llhToPixel } from "../pipeline/src/camera.ts";
openArea("trento-duomo");
for (const [n, la, lo, msl] of [["Duomo/Piazza Duomo", 46.0672, 11.1216, 197], ["Castello", 46.0709, 11.1271, 205], ["Piazza Fiera", 46.0655, 11.1228, 198], ["Via Belenzani", 46.0690, 11.1215, 199]] as const) {
  const [x, y] = llhToPixel(la, lo, msl + 48.5);
  const i = Math.round((x - 512) / 896), j = Math.round((y - 512) / 896);
  console.log(n, "px", x.toFixed(0), y.toFixed(0), "window", `${i},${j}`, "pos in window", (x - i * 896).toFixed(0), (y - j * 896).toFixed(0));
}
