import type OpenSeadragon from "openseadragon";

/**
 * Sea of clouds around the painted map. Outside the areas the tiles fade into the flat page
 * background (export.ts edgeFadePx); this canvas lays clouds over that band and everything beyond, in
 * world coordinates (they pan and zoom with the map); the painted interior stays clear.
 *
 * - clouds/cloud-tile.webp: a seamless RGBA tile of Grok-painted puffs, drawn as two patterns
 *   at unrelated scales so the repeat does not read
 * - clouds/<region>-edge.json: the outline the tiles fade towards (pipeline/src/cloud-mask.ts); turned
 *   once into a coarse distance field → alpha masks: a solid cloud base where the tiles are pure
 *   background, and the puffs reaching over the fade band and a little past it (further when zoomed
 *   far out, where the whole band is only a few CSS px wide)
 *
 * Redrawn only when the view changes, at 0.6 canvas px per CSS px (the clouds are soft), and not at
 * all while no cloud is on screen.
 */
interface Edge { edgeFadePx: [number, number]; outlines: Array<Array<[number, number]>>; edges: number[][] }

const CELL = 128;              // art px per distance-field cell (the fade band is ~4 cells wide)
const MARGIN = 9000;           // field reaches this far past the outline (the view centre stays inside the map)
const BASE_RGB = [238, 233, 224];
const REACH = [650, 2600];     // art px the puffs reach past the fully painted edge: close up, zoomed far out
const FAR_K = [0.02, 0.06];    // CSS px per art px: far reach below the first, near reach above the second
// art px per pattern repeat: ~260 CSS px at the widest zoom out (phones see the whole map, so their
// clouds are bigger in art px), the second layer 1.618 × (no common repeat)
const TILE_MIN = 5200, TILE_MAX = 16000, TILE_CSS = 260, TILE_RATIO = 1.618;

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** distance (art px) to the outline, for a point inside the union: as areas.ts unionInsideDistance */
function distance(x: number, y: number, edges: number[][]) {
  let d2 = Infinity;
  for (const [ax, ay, bx, by] of edges) {
    const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    const ex = x - ax - t * dx, ey = y - ay - t * dy;
    d2 = Math.min(d2, ex * ex + ey * ey);
  }
  return Math.sqrt(d2);
}

export async function startClouds(viewer: OpenSeadragon.Viewer, region: string, origin: [number, number]) {
  const [edge, img] = await Promise.all([
    fetch(`/clouds/${region}-edge.json`).then((r) => (r.ok ? (r.json() as Promise<Edge>) : null)).catch(() => null),
    new Promise<HTMLImageElement | null>((done) => {
      const im = new Image();
      im.onload = () => done(im); im.onerror = () => done(null);
      im.src = "/clouds/cloud-tile.webp";
    }),
  ]);
  if (!edge || !img) return;
  const [E0, E1] = edge.edgeFadePx;
  const tInit = performance.now();
  // ---- distance field → masks (built once: ~20 ms on a desktop CPU) ----
  const xs = edge.outlines.flat().map((p) => p[0]), ys = edge.outlines.flat().map((p) => p[1]);
  const gx0 = Math.min(...xs) - MARGIN, gy0 = Math.min(...ys) - MARGIN;
  const gw = Math.ceil((Math.max(...xs) + MARGIN - gx0) / CELL), gh = Math.ceil((Math.max(...ys) + MARGIN - gy0) / CELL);
  // inside the union: rasterise the area outlines once (the canvas does the point-in-polygon work)
  const fill = document.createElement("canvas");
  fill.width = gw; fill.height = gh;
  const fctx = fill.getContext("2d", { willReadFrequently: true })!;
  fctx.setTransform(1 / CELL, 0, 0, 1 / CELL, -gx0 / CELL, -gy0 / CELL);
  fctx.beginPath();
  for (const o of edge.outlines) { fctx.moveTo(o[0][0], o[0][1]); for (const [x, y] of o.slice(1)) fctx.lineTo(x, y); fctx.closePath(); }
  fctx.fill("nonzero");
  const ins = fctx.getImageData(0, 0, gw, gh).data;
  const baseMask = new ImageData(gw, gh), puffNear = new ImageData(gw, gh), puffFar = new ImageData(gw, gh);
  const any = new Uint8Array(gw * gh); // a puff on this cell
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
    const k = j * gw + i, o = k * 4;
    const d = ins[o + 3] > 127 ? distance(gx0 + (i + 0.5) * CELL, gy0 + (j + 0.5) * CELL, edge.edges) : 0;
    // solid base: the tiles are pure background below E0
    const b = 1 - smooth(E0 * 0.75, E0 + (E1 - E0) * 0.4, d);
    // puffs: over the whole fade band, thinning out REACH art px into the painted edge (far: zoomed out,
    // where the fade band is only a few CSS px wide)
    const p = 1 - smooth(E0 + (E1 - E0) * 0.3, E1 + REACH[0], d), pf = 1 - smooth(E0 + (E1 - E0) * 0.3, E1 + REACH[1], d);
    baseMask.data[o] = BASE_RGB[0]; baseMask.data[o + 1] = BASE_RGB[1]; baseMask.data[o + 2] = BASE_RGB[2];
    baseMask.data[o + 3] = Math.round(b * 255);
    puffNear.data[o + 3] = Math.round(p * 255);
    puffFar.data[o + 3] = Math.round(pf * 255);
    any[k] = pf > 0.004 ? 1 : 0;
  }
  const toCanvas = (data: ImageData) => {
    const c = document.createElement("canvas");
    c.width = gw; c.height = gh;
    c.getContext("2d")!.putImageData(data, 0, 0);
    return c;
  };
  const baseCanvas = toCanvas(baseMask), nearCanvas = toCanvas(puffNear), farCanvas = toCanvas(puffFar);
  // the puff mask in use: near and far mixed by zoom ('lighter' adds the two alphas: a linear mix)
  const puffCanvas = toCanvas(puffNear), mixCtx = puffCanvas.getContext("2d")!;
  let mixed = 0;
  const mix = (t: number) => {
    if (Math.abs(t - mixed) < 0.02) return;
    mixed = t;
    mixCtx.globalCompositeOperation = "source-over";
    mixCtx.clearRect(0, 0, gw, gh);
    mixCtx.globalAlpha = 1 - t; mixCtx.drawImage(nearCanvas, 0, 0);
    mixCtx.globalCompositeOperation = "lighter";
    mixCtx.globalAlpha = t; mixCtx.drawImage(farCanvas, 0, 0);
    mixCtx.globalAlpha = 1;
  };
  /** screen-space box (art px) of the cells with a puff inside the visible art rectangle; null = none */
  const cloudBox = (x0: number, y0: number, x1: number, y1: number): [number, number, number, number] | null => {
    const fi0 = Math.floor((x0 - gx0) / CELL), fj0 = Math.floor((y0 - gy0) / CELL);
    const fi1 = Math.ceil((x1 - gx0) / CELL), fj1 = Math.ceil((y1 - gy0) / CELL);
    let bi0 = Infinity, bj0 = Infinity, bi1 = -Infinity, bj1 = -Infinity;
    const add = (i0: number, j0: number, i1: number, j1: number) => { bi0 = Math.min(bi0, i0); bj0 = Math.min(bj0, j0); bi1 = Math.max(bi1, i1); bj1 = Math.max(bj1, j1); };
    // past the field everything is cloud
    if (fi0 < 0) add(fi0, fj0, 0, fj1);
    if (fj0 < 0) add(fi0, fj0, fi1, 0);
    if (fi1 > gw) add(gw, fj0, fi1, fj1);
    if (fj1 > gh) add(fi0, gh, fi1, fj1);
    for (let j = Math.max(0, fj0); j < Math.min(gh, fj1); j++) for (let i = Math.max(0, fi0); i < Math.min(gw, fi1); i++)
      if (any[j * gw + i]) add(i, j, i + 1, j + 1);
    if (bi0 === Infinity) return null;
    return [gx0 + (bi0 - 1) * CELL, gy0 + (bj0 - 1) * CELL, gx0 + (bi1 + 1) * CELL, gy0 + (bj1 + 1) * CELL];
  };

  // ---- the layer ----
  const canvas = document.createElement("canvas");
  canvas.id = "clouds";
  viewer.element.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  const pattern = ctx.createPattern(img, "repeat")!, pattern2 = ctx.createPattern(img, "repeat")!;
  const [ox, oy] = origin;
  const stats = { initMs: Math.round(performance.now() - tInit), draws: 0, skipped: 0, totalMs: 0, maxMs: 0 };
  Object.assign(window as object, { __clouds: stats });
  let last = "", empty = false, tileArt: [number, number] | null = null;

  const draw = () => {
    const item = viewer.world.getItemAt(0);
    if (!item) return;
    const vp = viewer.viewport;
    const a = vp.viewportToViewerElementCoordinates(item.imageToViewportCoordinates(0, 0, true));
    const b = vp.viewportToViewerElementCoordinates(item.imageToViewportCoordinates(1000, 0, true));
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    const k = (b.x - a.x) / 1000;                     // CSS px per art px
    const tx = a.x - ox * k, ty = a.y - oy * k;       // css = global * k + t
    if (!tileArt) { // fixed for the session: the clouds zoom with the map
      const kMin = (k * vp.getMinZoom()) / vp.getZoom(true);
      const t = Math.min(TILE_MAX, Math.max(TILE_MIN, TILE_CSS / kMin));
      tileArt = [t, t * TILE_RATIO];
    }
    const key = `${k.toFixed(6)},${tx.toFixed(2)},${ty.toFixed(2)},${cw},${ch}`;
    if (key === last) return;
    last = key;
    const t0 = performance.now();
    // only the part of the screen with clouds on it
    const box = cloudBox(-tx / k, -ty / k, (cw - tx) / k, (ch - ty) / k);
    const r = 0.6; // soft clouds: 0.6 canvas px per CSS px is enough (full res costs frames in software raster)
    const w = Math.round(cw * r), h = Math.round(ch * r);
    if (!box) {
      if (!empty) { ctx.clearRect(0, 0, canvas.width, canvas.height); empty = true; }
      stats.skipped++;
      return;
    }
    empty = false;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const s = k * r; // device px per art px
    const toDev = (x: number, y: number): [number, number] => [x * s + tx * r, y * s + ty * r];
    const [mx, my] = toDev(gx0, gy0), mw = gw * CELL * s, mh = gh * CELL * s;
    // dirty rectangle in device px
    const [bx0, by0] = toDev(box[0], box[1]), [bx1, by1] = toDev(box[2], box[3]);
    const X0 = Math.max(0, Math.floor(bx0)), Y0 = Math.max(0, Math.floor(by0));
    const X1 = Math.min(w, Math.ceil(bx1)), Y1 = Math.min(h, Math.ceil(by1));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (X1 <= X0 || Y1 <= Y0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0, X1 - X0, Y1 - Y0); ctx.clip();
    ctx.imageSmoothingEnabled = true;
    mix(1 - smooth(FAR_K[0], FAR_K[1], k));
    // 1. puffs: two world-anchored patterns
    for (const [i, art] of tileArt.entries()) {
      const sc = (art * s) / img.width, p = i ? pattern2 : pattern;
      const [px, py] = toDev(i * 1234, i * 777);
      p.setTransform(new DOMMatrix([sc, 0, 0, sc, px, py]));
      ctx.fillStyle = p;
      ctx.globalAlpha = i ? 0.85 : 1;
      ctx.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    }
    ctx.globalAlpha = 1;
    // 2. cut them to the puff mask (inside the field only: past it everything is cloud)
    ctx.save();
    ctx.beginPath(); ctx.rect(mx, my, mw, mh); ctx.clip();
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(puffCanvas, mx, my, mw, mh);
    ctx.restore();
    // 3. solid cloud base behind them
    ctx.globalCompositeOperation = "destination-over";
    ctx.drawImage(baseCanvas, mx, my, mw, mh);
    ctx.fillStyle = `rgb(${BASE_RGB.join(",")})`;
    if (mx > 0) ctx.fillRect(0, 0, mx, h);
    if (mx + mw < w) ctx.fillRect(mx + mw, 0, w - mx - mw, h);
    if (my > 0) ctx.fillRect(0, 0, w, my);
    if (my + mh < h) ctx.fillRect(0, my + mh, w, h - my - mh);
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
    const dt = performance.now() - t0;
    stats.draws++; stats.totalMs += dt; stats.maxMs = Math.max(stats.maxMs, dt);
  };
  viewer.addHandler("update-viewport", draw);
  viewer.addHandler("resize", () => { last = ""; draw(); });
  draw();
}
