// usage (from pipeline/): npx tsx ../scratch/planzones.mts : shots/v8-plan-zones.png = current fullmap + proposed bboxes + Bogdan's loops
import sharp from "sharp"; import { readFileSync } from "node:fs";
import { openArea, areaPolygon, AREAS } from "../pipeline/src/areas.ts";
openArea("trento-citta");
const Z: [string, [number, number, number, number], string][] = [
  ["NE1 cortesano", [46.105, 11.120, 46.125, 11.150], "#ff3b30"], ["NE2 calisio", [46.095, 11.124, 46.105, 11.150], "#ff9500"],
  ["NE3 villamontagna", [46.080, 11.150, 46.105, 11.175], "#ffcc00"], ["W2 vela-nord", [46.103, 11.060, 46.125, 11.086], "#34c759"],
  ["W3 vela-sud", [46.082, 11.060, 46.103, 11.086], "#00c7be"], ["W4 sardagna", [46.054, 11.078, 46.082, 11.096], "#007aff"],
  ["SW1 ravina-monte", [46.030, 11.090, 46.054, 11.104], "#af52de"]];
const F = 0.5, X0 = -6 * 512, Y0 = -4 * 512; // fullmap 5120x3584 -> 2560x1792
const px = ([x, y]: [number, number]) => [((x / 8) - X0) * F, ((y / 8) - Y0) * F];
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2560" height="1792">`;
for (const a of Object.keys(AREAS).filter((k) => k.startsWith("trento-") && !["trento-htest", "trento-duomo"].includes(k))) {
  const p = areaPolygon(AREAS[a].bbox).map((q) => px(q as [number, number]));
  svg += `<polygon points="${p.map((q) => q.join(",")).join(" ")}" fill="none" stroke="#ffffff" stroke-opacity="0.6" stroke-width="2" stroke-dasharray="8 6"/>`;
}
for (const [n, b, c] of Z) {
  const p = areaPolygon(b).map((q) => px(q as [number, number])); const cx = p.reduce((s, q) => s + q[0], 0) / 4, cy = p.reduce((s, q) => s + q[1], 0) / 4;
  svg += `<polygon points="${p.map((q) => q.join(",")).join(" ")}" fill="${c}" fill-opacity="0.22" stroke="${c}" stroke-width="5"/>`;
  svg += `<text x="${cx}" y="${cy}" font-family="DejaVu Sans" font-size="34" font-weight="bold" fill="#000" stroke="#fff" stroke-width="6" paint-order="stroke" text-anchor="middle">${n}</text>`;
}
svg += `<text x="30" y="1760" font-family="DejaVu Sans" font-size="30" fill="#000">v8 plan: proposed bboxes (filled), painted areas (white dashed), Bogdan's loops (red, thin). Heading 40°.</text></svg>`;
// Bogdan's red loops, mapped from zone-rosse.png (screenshot px -> fullmap px)
const red: [number, number][] = JSON.parse(readFileSync("/tmp/red.json", "utf8")); const SC = 5120 / 837;
let loops = `<svg xmlns="http://www.w3.org/2000/svg" width="2560" height="1792">`;
for (let i = 0; i < red.length; i += 3) loops += `<circle cx="${((red[i][0] - 107) * SC * F).toFixed(0)}" cy="${((red[i][1] - 48) * SC * F).toFixed(0)}" r="2.5" fill="#e00000" fill-opacity="0.7"/>`;
loops += "</svg>";
await sharp("../shots/v7-zoomout-fullmap.png").resize(2560, 1792).composite([{ input: Buffer.from(loops) }, { input: Buffer.from(svg) }]).png().toFile("../shots/v8-plan-zones.png");
console.log("wrote shots/v8-plan-zones.png");
