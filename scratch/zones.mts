// usage (from pipeline/): npx tsx ../scratch/zones.mts : red loops of shots/bogdan/zone-rosse.png -> lat/lon (inverse of llhToPixel at groundH)
import { readFileSync } from "node:fs";
import { openArea, groundH, AREAS } from "../pipeline/src/areas.ts";
import { llhToPixel } from "../pipeline/src/camera.ts";
openArea("trento-citta"); const H = groundH();
// affine fit lat/lon -> px around Trento, then invert
const P0 = llhToPixel(46.07, 11.12, H), Pa = llhToPixel(46.08, 11.12, H), Pb = llhToPixel(46.07, 11.13, H);
const a = [(Pa[0] - P0[0]) / 0.01, (Pb[0] - P0[0]) / 0.01], b = [(Pa[1] - P0[1]) / 0.01, (Pb[1] - P0[1]) / 0.01];
const det = a[0] * b[1] - a[1] * b[0];
const inv = (x: number, y: number) => { let dx = x - P0[0], dy = y - P0[1]; let lat = 46.07 + (b[1] * dx - a[1] * dy) / det, lon = 11.12 + (-b[0] * dx + a[0] * dy) / det;
  for (let it = 0; it < 5; it++) { const q = llhToPixel(lat, lon, H); dx = x - q[0]; dy = y - q[1]; lat += (b[1] * dx - a[1] * dy) / det; lon += (-b[0] * dx + a[0] * dy) / det; } return [lat, lon]; };
// screenshot px -> fullmap px -> global art px
const SX0 = 107, SY0 = 48, SC = 5120 / 837, X0 = -6 * 512, Y0 = -4 * 512;
const toLL = (sx: number, sy: number) => inv(((sx - SX0) * SC + X0) * 8, ((sy - SY0) * SC + Y0) * 8);
const pts: [number, number][] = JSON.parse(readFileSync("/tmp/red.json", "utf8"));
const groups: Record<string, [number, number][]> = { top: [], left: [], bottom: [] };
for (const [x, y] of pts) { if (y < 300 && x > 255) groups.top.push([x, y]); else if (x < 330 || (x < 360 && y < 360)) groups.left.push([x, y]); else groups.bottom.push([x, y]); }
for (const [g, P] of Object.entries(groups)) {
  const ll = P.map(([x, y]) => toLL(x, y)); const la = ll.map((p) => p[0]), lo = ll.map((p) => p[1]);
  console.log(g, P.length, "lat", Math.min(...la).toFixed(4), Math.max(...la).toFixed(4), "lon", Math.min(...lo).toFixed(4), Math.max(...lo).toFixed(4));
  // a few outline samples for naming
  const step = Math.max(1, Math.floor(P.length / 12)); console.log("  samples", P.filter((_, i) => i % step === 0).map(([x, y]) => toLL(x, y).map((v) => v.toFixed(4)).join(",")).join(" "));
}
for (const n of Object.keys(AREAS).filter((k) => k.startsWith("trento-") && k !== "trento-htest" && k !== "trento-duomo")) console.log(n, AREAS[n].bbox.join(","));
// sanity: ovest SW corner back to screen
const c = llhToPixel(46.054, 11.096, H); console.log("ovest SW corner screen", (c[0] / 8 - X0) / SC + SX0, (c[1] / 8 - Y0) / SC + SY0);
