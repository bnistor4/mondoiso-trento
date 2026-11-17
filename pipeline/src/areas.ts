import { CAMERA, activeRegion, llhToPixel, useRegion } from "./camera.ts";
import { regionGroundH } from "./places.ts";

/** A rendered patch of a region (see places.ts); all pipeline steps work per area. */
export interface Area {
  title: string;
  region: string;
  /** south, west, north, east (WGS84) */
  bbox: [number, number, number, number];
}

export const AREAS: Record<string, Area> = {
  /**
   * Roma centro storico ampio: Vaticano → Termini, Villa Borghese → Testaccio/Aventino.
   * ~3.5 km × 5 km — first painted body while wider rings render.
   */
  "roma-core": {
    title: "Roma · Centro",
    region: "roma-centro",
    bbox: [41.882, 12.452, 41.912, 12.512],
  },
  /**
   * Anello urbano intorno al centro: Prati/Trastevere → San Giovanni, Parioli → Ostiense.
   * Complements roma-core (export merges tiles; the LAST area wins within each layer).
   */
  "roma-inner": {
    title: "Roma · Città",
    region: "roma-centro",
    bbox: [41.860, 12.420, 41.935, 12.545],
  },
  /** Approved expansion; becomes playable only after render + paint + coverage QA. */
  "roma-nord": {
    title: "Flaminio · Ponte Milvio", region: "roma-centro",
    bbox: [41.925, 12.450, 41.950, 12.510],
  },
  /** Small pilot patch (kept for quick tests). */
  pantheon: {
    title: "Pantheon · Piazza Navona",
    region: "roma-centro",
    bbox: [41.8955, 12.4700, 41.9020, 12.4815],
  },
};

/** Trento pilot: Duomo, Piazza Fiera, Via Belenzani, Castello del Buonconsiglio (~1.0 × 1.1 km). */
AREAS["trento-duomo"] = {
  title: "Trento · Centro storico",
  region: "trento",
  bbox: [46.0630, 11.1160, 46.0720, 11.1300],
};

/** Trento valley ring (v2): Piedicastello + Doss Trento west of the Adige, stazione, San Martino,
 *  Cristo Re (south), Bolghera, Clarina (north edge) around the pilot (~2.3 x 3.1 km). Contains
 *  trento-duomo; exported after it, so the LAST area wins where they overlap. Same region/camera. */
AREAS["trento-citta"] = {
  title: "Trento · Citta",
  region: "trento",
  bbox: [46.0540, 11.1060, 46.0820, 11.1360],
};
/** Valley floor north of trento-citta (Gardolo). Shares citta's north edge; paint/assemble with
 *  --context=trento-citta. East edge stops at 11.124, where the Monte Calisio slope starts (DEM > 260 m). */
AREAS["trento-nord"] = {
  title: "Trento · Gardolo",
  region: "trento",
  bbox: [46.0820, 11.0980, 46.1050, 11.1240],
};
/** Valley floor south of trento-citta (San Bartolameo / Clarina / Ravina side, ring S1 toward Mattarello).
 *  Shares citta's south edge; paint/assemble with --context=trento-citta,trento-nord. West edge 11.104: the Bondone
 *  slope west of it passes the ~507 m height-image ceiling (DEM max 759 m); inside the bbox DEM max 394 m. */
AREAS["trento-sud"] = {
  title: "Trento · Sud",
  region: "trento",
  bbox: [46.0320, 11.1040, 46.0540, 11.1340],
};
/** East hill foot (ring E1: Villazzano south, San Donà / Cognola foot north). Adjoins citta's and sud's east edges;
 *  paint/assemble with --context=trento-citta,trento-nord,trento-sud. East edge 11.150: DEM max 473 m inside (0% > 507 m);
 *  at 11.155 already 1.4% > 507 m and Povo/Martignano beyond clip the ~507 m height-image ceiling (not hacked). */
AREAS["trento-est"] = {
  title: "Trento · Villazzano / Cognola",
  region: "trento",
  bbox: [46.0400, 11.1340, 46.0820, 11.1500],
};
/** Spini di Gardolo industrial zone (ring N2), north of trento-nord, sharing its north edge 46.105.
 *  Paint/assemble with --context=trento-citta,trento-nord,trento-sud,trento-est. East edge 11.120: DEM max 412 m inside
 *  (0% > 507); at 11.124 the Calisio foot reaches 506 m, too close to the ~507 m height-image ceiling. */
AREAS["trento-spini"] = {
  title: "Trento · Spini",
  region: "trento",
  bbox: [46.1050, 11.0980, 46.1250, 11.1200],
};
/** 24-bit height gate (test only, not exported): a small tile on the Calisio slope above Martignano, DEM max ~929 m asl. */
AREAS["trento-htest"] = {
  title: "Trento · height test",
  region: "trento",
  bbox: [46.0920, 11.1440, 46.0950, 11.1500],
};
/** Povo (ring E2), east of trento-est, sharing its east edge 11.150. Needs the 24-bit height pass (DEM max 822 m asl inside). */
AREAS["trento-povo"] = {
  title: "Trento · Povo",
  region: "trento",
  bbox: [46.0550, 11.1500, 46.0800, 11.1700],
};
/** Martignano (ring NE1), north of trento-citta/trento-est (edge 46.082), east of trento-nord (edge 11.124). 24-bit height (DEM max 929 m). */
AREAS["trento-martignano"] = {
  title: "Trento · Martignano",
  region: "trento",
  bbox: [46.0820, 11.1240, 46.0950, 11.1500],
};

/** Gardolo west gap (ring NW1): the strip between the Adige and trento-nord/trento-spini (their west edge 11.098), 46.082-46.125.
 *  Adige east bank 11.104 @46.085 -> 11.083 @46.125; the SW corner climbs the Vela/Sardagna slope (DEM max 807 m asl, 15% > 507; 24-bit height). */
AREAS["trento-gardolo"] = {
  title: "Trento · Gardolo ovest",
  region: "trento",
  bbox: [46.0820, 11.0860, 46.1250, 11.0980],
};
/** West bank (ring W1): Piedicastello, Doss Trento, Vela, Sardagna's foot; west of trento-citta (edge 11.106), south of trento-nord/trento-gardolo (edge 46.082).
 *  DEM max 896 m asl at the SW corner (37% > 507; 24-bit height). */
AREAS["trento-ovest"] = {
  title: "Trento · Piedicastello",
  region: "trento",
  bbox: [46.0540, 11.0960, 46.0820, 11.1060],
};

/** v8 rings (Bogdan's red zones, TRENTO-PILOT.md "Run v8 plan"). DEM m asl p50/p95/max per area; 24-bit height. */
/** NE1: Cortesano, Montevaccino; east of trento-spini (11.120), north of trento-martignano/calisio (46.105). 616/819/874. */
AREAS["trento-cortesano"] = { title: "Trento · Cortesano", region: "trento", bbox: [46.1050, 11.1200, 46.1250, 11.1500] };
/** NE3: Villamontagna, east slope of Calisio; east of martignano/calisio (11.150), north of povo (46.080). 656/888/1031. */
AREAS["trento-villamontagna"] = { title: "Trento · Villamontagna", region: "trento", bbox: [46.0800, 11.1500, 46.1050, 11.1750] };
/** NE2: Monte Calisio south slope; north of martignano (46.095), east of nord (11.124). 775/1027/1093. */
AREAS["trento-calisio"] = { title: "Trento · Calisio", region: "trento", bbox: [46.0950, 11.1240, 46.1050, 11.1500] };
/** W3: Cadine, Bus de Vela; west of gardolo (11.086). 550/777/810. */
AREAS["trento-vela-sud"] = { title: "Trento · Bus de Vela", region: "trento", bbox: [46.0820, 11.0600, 46.1030, 11.0860] };
/** W2: Ischia Podetti, Soprasasso; west of gardolo, north of vela-sud. 603/873/918. */
AREAS["trento-vela-nord"] = { title: "Trento · Ischia Podetti", region: "trento", bbox: [46.1030, 11.0600, 46.1250, 11.0860] };
/** W4: Sardagna; west of ovest (11.096), south of vela-sud (46.082). 781/1054/1151. */
AREAS["trento-sardagna"] = { title: "Trento · Sardagna", region: "trento", bbox: [46.0540, 11.0780, 46.0820, 11.0960] };
/** SW1: slope above Ravina/Belvedere; west of sud (11.104), south of ovest/sardagna (46.054). 561/1057/1247. */
AREAS["trento-ravina-monte"] = { title: "Trento · Ravina", region: "trento", bbox: [46.0300, 11.0900, 46.0540, 11.1040] };

/** Proposal only: NOT accepted by openArea or exported until a separate expansion batch is approved.
 * Preserve the region origin/camera. Finish the current playable rectangle before adding these. */
export const AREA_PROPOSALS: Record<string, Area> = {
  "roma-sud": {
    title: "Garbatella · San Paolo", region: "roma-centro",
    bbox: [41.840, 12.455, 41.870, 12.510],
  },
  "roma-est": {
    title: "Pigneto · Torpignattara · Centocelle", region: "roma-centro",
    bbox: [41.865, 12.530, 41.905, 12.580],
  },
};

/** Look up an area and switch the camera to its region: call before any projection. */
export function openArea(name: string): Area {
  const area = AREAS[name];
  if (!area) throw new Error(`unknown area ${name}`);
  useRegion(area.region);
  return area;
}

/** Ground ellipsoid height used for area outlines (geoid ≈ 45–50 m in Rome + low terrain); per region. */
export const GROUND_H = 55;
export const groundH = () => regionGroundH(activeRegion());

type Pt = [number, number];

/** Area outline in global art pixels (the bbox projected at ground level: a slanted quad). */
export function areaPolygon(bbox: [number, number, number, number]): Pt[] {
  const [s, w, n, e] = bbox;
  return [[s, w], [s, e], [n, e], [n, w]].map(([lat, lon]) => llhToPixel(lat, lon, groundH()));
}

export function inside([x, y]: Pt, poly: Pt[]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** Render tiles whose centre lies inside the area outline. */
export function areaTiles(bbox: [number, number, number, number]) {
  const poly = areaPolygon(bbox);
  const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
  const out: Array<[number, number]> = [];
  for (let ty = Math.floor(Math.min(...ys) / CAMERA.tile); ty <= Math.floor(Math.max(...ys) / CAMERA.tile); ty++)
    for (let tx = Math.floor(Math.min(...xs) / CAMERA.tile); tx <= Math.floor(Math.max(...xs) / CAMERA.tile); tx++)
      if (inside([(tx + 0.5) * CAMERA.tile, (ty + 0.5) * CAMERA.tile], poly)) out.push([tx, ty]);
  return out;
}

/** Distance (art px) from a point inside a convex outline to its nearest edge; ≤ 0 outside. */
export function insideDistance([x, y]: Pt, poly: Pt[]) {
  if (!inside([x, y], poly)) return 0;
  let d = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j], [bx, by] = poly[i], dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
    d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy));
  }
  return d;
}

/** Outline edges of a union of convex outlines: each edge minus the parts lying inside (or on, within
 *  `eps` px) another outline, so adjoining areas fade only at their shared OUTER border. */
export function unionEdges(polys: Pt[][], eps = 4): Array<[Pt, Pt]> {
  const out: Array<[Pt, Pt]> = [];
  polys.forEach((poly, pi) => {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[j], b = poly[i], d: Pt = [b[0] - a[0], b[1] - a[1]];
      let keep: Array<[number, number]> = [[0, 1]];
      polys.forEach((q, qi) => {
        if (qi === pi) return;
        // Cyrus-Beck: parameter interval of a->b inside q grown by eps (q is convex, any winding)
        const cx = q.reduce((s, p) => s + p[0], 0) / q.length, cy = q.reduce((s, p) => s + p[1], 0) / q.length;
        let t0 = 0, t1 = 1;
        for (let m = 0, n = q.length - 1; m < q.length && t0 <= t1; n = m++) {
          const e: Pt = [q[m][0] - q[n][0], q[m][1] - q[n][1]], len = Math.hypot(e[0], e[1]);
          let nx = e[1] / len, ny = -e[0] / len; // outward normal
          if ((cx - q[n][0]) * nx + (cy - q[n][1]) * ny > 0) { nx = -nx; ny = -ny; }
          const f0 = (a[0] - q[n][0]) * nx + (a[1] - q[n][1]) * ny - eps, fd = d[0] * nx + d[1] * ny; // inside when f0 + t*fd <= 0
          if (Math.abs(fd) < 1e-9) { if (f0 > 0) t1 = -1; continue; }
          const t = -f0 / fd;
          if (fd > 0) t1 = Math.min(t1, t); else t0 = Math.max(t0, t);
        }
        if (t0 >= t1) return;
        keep = keep.flatMap(([u, v]) => [[u, Math.min(v, t0)], [Math.max(u, t1), v]].filter(([x, y]) => y - x > 1e-6) as Array<[number, number]>);
      });
      for (const [u, v] of keep) out.push([[a[0] + u * d[0], a[1] + u * d[1]], [a[0] + v * d[0], a[1] + v * d[1]]]);
    }
  });
  return out;
}

/** Distance (art px) from a point inside the union of `polys` to the union's outer border; 0 outside. */
export function unionInsideDistance(pt: Pt, polys: Pt[][], edges: Array<[Pt, Pt]>) {
  if (!polys.some((p) => inside(pt, p))) return 0;
  let d = Infinity;
  for (const [[ax, ay], [bx, by]] of edges) {
    const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((pt[0] - ax) * dx + (pt[1] - ay) * dy) / (dx * dx + dy * dy || 1)));
    d = Math.min(d, Math.hypot(pt[0] - ax - t * dx, pt[1] - ay - t * dy));
  }
  return d;
}
