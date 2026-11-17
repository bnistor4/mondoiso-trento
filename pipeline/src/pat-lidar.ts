/**
 * Building heights for the Trento region from Provincia autonoma di Trento LiDAR (2014/2018, 0.5 m,
 * CC BY 4.0): DSM first pulse minus DTM, median over each OSM footprint (courtyards excluded).
 * Rasters: 500 m tiles in UTM 32N, ESRI ASCII grid, cached under data/raw/pat-lidar/ (+ .f32 binary).
 *   DTM  https://siatservices.provincia.tn.it/stemdata/2014_lidar_dtm_asc/
 *   DSM  https://siatservices.provincia.tn.it/stemdata/2014_lidar_dsmfirst_asc/
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RAW } from "./paths.ts";
import { llToUtm } from "./utm.ts";

const BASE = "https://siatservices.provincia.tn.it/stemdata";
const PRODUCTS = { dtm: ["2014_lidar_dtm_asc", "DTM"], dsm: ["2014_lidar_dsmfirst_asc", "DSMFirst"] } as const;
const DIR = join(RAW, "pat-lidar");
const TILE = 500, N = 1000, CELL = 0.5;

/** Tile names covering a WGS84 bbox [s, w, n, e]: "5h" + E/100 (4 digits) + N/100 (5 digits) of the SW corner. */
export function lidarTiles([s, w, n, e]: [number, number, number, number]) {
  const c = [[s, w], [s, e], [n, w], [n, e]].map(([la, lo]) => llToUtm(la, lo));
  const x0 = Math.floor(Math.min(...c.map((p) => p[0])) / TILE) * TILE, x1 = Math.max(...c.map((p) => p[0]));
  const y0 = Math.floor(Math.min(...c.map((p) => p[1])) / TILE) * TILE, y1 = Math.max(...c.map((p) => p[1]));
  const out: Array<{ name: string; x: number; y: number }> = [];
  for (let x = x0; x <= x1; x += TILE) for (let y = y0; y <= y1; y += TILE)
    out.push({ name: `5h${String(x / 100).padStart(4, "0")}${String(y / 100).padStart(5, "0")}`, x, y });
  return out;
}

/** Download the DTM + DSM tiles of a bbox (skips cached ones). */
export async function fetchLidar(bbox: [number, number, number, number]) {
  mkdirSync(DIR, { recursive: true });
  for (const t of lidarTiles(bbox)) for (const [dir, suffix] of Object.values(PRODUCTS)) {
    const file = join(DIR, `${t.name}_${suffix}.asc`);
    if (existsSync(file)) continue;
    for (let attempt = 1; ; attempt++) {
      try {
        const r = await fetch(`${BASE}/${dir}/${t.name}_${suffix}.asc`, { signal: AbortSignal.timeout(300_000) });
        if (r.status === 404) { console.warn(`  pat-lidar: ${t.name}_${suffix} not published`); break; }
        if (!r.ok) throw new Error(String(r.status));
        writeFileSync(file, Buffer.from(await r.arrayBuffer()));
        console.log(`  pat-lidar: ${t.name}_${suffix}`);
        break;
      } catch (err) {
        if (attempt >= 4) throw err;
        await new Promise((res) => setTimeout(res, 5000 * attempt));
      }
    }
  }
}

/** Parse (once) an ASCII grid into Float32 (row 0 = north), cached as .f32 next to it. */
function grid(file: string): { x0: number; y0: number; v: Float32Array } | null {
  if (!existsSync(file)) return null;
  const bin = `${file}.f32`, txt = readFileSync(file, "latin1");
  const head = txt.slice(0, 400).split(/\r?\n/).slice(0, 6).map((l) => l.trim().split(/\s+/));
  const h = Object.fromEntries(head.map(([k, v]) => [k.toUpperCase(), Number(v)]));
  if (h.NCOLS !== N || h.NROWS !== N || h.CELLSIZE !== CELL) throw new Error(`${file}: unexpected grid`);
  const x0 = (h.XLLCENTER ?? h.XLLCORNER + CELL / 2) - CELL / 2, y0 = (h.YLLCENTER ?? h.YLLCORNER + CELL / 2) - CELL / 2;
  if (existsSync(bin)) return { x0, y0, v: new Float32Array(readFileSync(bin).buffer.slice(0)) };
  let p = 0; for (let k = 0; k < 6; k++) p = txt.indexOf("\n", p) + 1;
  const v = new Float32Array(N * N);
  let i = 0;
  for (const tok of txt.slice(p).split(/\s+/)) if (tok) v[i++] = tok === "-9999.0" || tok === "-9999" ? NaN : Number(tok);
  if (i !== N * N) throw new Error(`${file}: ${i} values`);
  writeFileSync(bin, Buffer.from(v.buffer));
  return { x0, y0, v };
}

export interface FootprintHeight { median: number; p90: number; max: number; cells: number; valid: number }

/** Sampler for one bbox: footprint (lon/lat rings) -> DSM−DTM statistics, or null without data. */
export function lidarSampler(bbox: [number, number, number, number]) {
  const tiles = new Map<string, { dtm: ReturnType<typeof grid>; dsm: ReturnType<typeof grid> }>();
  for (const t of lidarTiles(bbox)) tiles.set(`${t.x}_${t.y}`, {
    dtm: grid(join(DIR, `${t.name}_${PRODUCTS.dtm[1]}.asc`)), dsm: grid(join(DIR, `${t.name}_${PRODUCTS.dsm[1]}.asc`)) });
  const ndsm = (x: number, y: number) => {
    const tx = Math.floor(x / TILE) * TILE, ty = Math.floor(y / TILE) * TILE, t = tiles.get(`${tx}_${ty}`);
    if (!t?.dtm || !t.dsm) return NaN;
    const c = Math.floor((x - t.dtm.x0) / CELL), r = N - 1 - Math.floor((y - t.dtm.y0) / CELL);
    if (c < 0 || r < 0 || c >= N || r >= N) return NaN;
    return t.dsm.v[r * N + c] - t.dtm.v[r * N + c];
  };
  const inRing = (x: number, y: number, ring: number[][]) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++)
      if ((ring[i][1] > y) !== (ring[j][1] > y) && x < ((ring[j][0] - ring[i][0]) * (y - ring[i][1])) / (ring[j][1] - ring[i][1]) + ring[i][0]) inside = !inside;
    return inside;
  };
  return (outer: number[][], holes: number[][][] = []): FootprintHeight | null => {
    const o = outer.map(([lon, lat]) => llToUtm(lat, lon)), hs = holes.map((h) => h.map(([lon, lat]) => llToUtm(lat, lon)));
    const xs = o.map((p) => p[0]), ys = o.map((p) => p[1]);
    const vals: number[] = [];
    let cells = 0;
    for (let y = Math.floor(Math.min(...ys) / CELL) * CELL + CELL / 2; y < Math.max(...ys); y += CELL)
      for (let x = Math.floor(Math.min(...xs) / CELL) * CELL + CELL / 2; x < Math.max(...xs); x += CELL) {
        if (!inRing(x, y, o) || hs.some((h) => inRing(x, y, h))) continue;
        cells++;
        const v = ndsm(x, y);
        if (Number.isFinite(v)) vals.push(v);
      }
    if (!vals.length) return null;
    vals.sort((a, b) => a - b);
    const q = (f: number) => vals[Math.min(vals.length - 1, Math.floor(vals.length * f))];
    return { median: q(0.5), p90: q(0.9), max: vals[vals.length - 1], cells, valid: vals.length };
  };
}
