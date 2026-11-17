// usage: seamfix.mts <window.png> <neighbour.png> <side top|bottom|left|right> : copy the neighbour's pixels into the
// window's 128 px overlap band on <side> (exact match there), feathered linearly over a further 96 px into the window.
// Fixes palette-QA "incompatible overlap" pairs without a regeneration. Original -> <dir>/../archive/preseam/.
import sharp from "sharp"; import { mkdirSync, existsSync, copyFileSync, renameSync } from "node:fs"; import { dirname, basename } from "node:path";
const [wf, nf, side] = process.argv.slice(2); const S = 1024, O = 128, F = 96;
const arch = dirname(wf) + "/../archive/preseam/"; mkdirSync(arch, { recursive: true }); if (!existsSync(arch + basename(wf))) copyFileSync(wf, arch + basename(wf));
const w = await sharp(wf).removeAlpha().raw().toBuffer(), n = await sharp(nf).removeAlpha().raw().toBuffer();
for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
  // d = distance into the window from the shared edge; (nx,ny) = same ground pixel in the neighbour
  let d: number, nx = x, ny = y;
  if (side === "top") { d = y; ny = y + S - O; } else if (side === "bottom") { d = S - 1 - y; ny = y - (S - O); }
  else if (side === "left") { d = x; nx = x + S - O; } else { d = S - 1 - x; nx = x - (S - O); }
  const wt = d < O ? 1 : d < O + F ? 1 - (d - O) / F : 0; if (!wt) continue;
  const i = (y * S + x) * 3;
  if (d < O) { const j = (ny * S + nx) * 3; for (let c = 0; c < 3; c++) w[i + c] = n[j + c]; continue; }
  // feather zone: blend toward the colour shift measured at the band edge column/row (keeps structure, removes step)
}
// feather: per-row/col shift = mean diff at the band's inner edge, ramped out over F px
const sh = new Float32Array(S * 3);
for (let k = 0; k < S; k++) { // k = position along the edge
  const at = (dd: number) => side === "top" ? [k, dd] : side === "bottom" ? [k, S - 1 - dd] : side === "left" ? [dd, k] : [S - 1 - dd, k];
  const [ax, ay] = at(O - 1), [bx, by] = at(O); const ia = (ay * S + ax) * 3, ib = (by * S + bx) * 3;
  for (let c = 0; c < 3; c++) sh[k * 3 + c] = w[ia + c] - w[ib + c];
}
const sm = new Float32Array(S * 3); // smooth along the edge (box 31)
for (let k = 0; k < S; k++) for (let c = 0; c < 3; c++) { let s = 0, m = 0; for (let q = Math.max(0, k - 15); q <= Math.min(S - 1, k + 15); q++) { s += sh[q * 3 + c]; m++; } sm[k * 3 + c] = s / m; }
for (let k = 0; k < S; k++) for (let dd = O; dd < O + F; dd++) {
  const [x, y] = side === "top" ? [k, dd] : side === "bottom" ? [k, S - 1 - dd] : side === "left" ? [dd, k] : [S - 1 - dd, k];
  const i = (y * S + x) * 3; if (!(w[i] | w[i + 1] | w[i + 2])) continue; const r = 1 - (dd - O) / F;
  for (let c = 0; c < 3; c++) w[i + c] = Math.max(1, Math.min(255, Math.round(w[i + c] + sm[k * 3 + c] * r)));
}
await sharp(w, { raw: { width: S, height: S, channels: 3 } }).png().toFile(wf + ".seam.png"); renameSync(wf + ".seam.png", wf);
console.log("seamfix", basename(wf), side, "from", basename(nf));
