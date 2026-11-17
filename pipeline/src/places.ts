/**
 * Regions and cities of Mondo Isometrico. Pure data, shared by the pipeline and the web viewer.
 *
 * A REGION is one flat map: one orthographic camera in a local East-North-Up frame at its origin,
 * one tile pyramid (web/public/regions/<id>/). A flat map is accurate to ~1° of building lean at
 * 100 km from its origin, so a region can hold all cities within ~150 km and you scroll between them.
 * Far-apart cities get their own region (joined later by a world overview).
 *
 * A CITY is a named view into a region: /<city-slug> opens the region centred on it.
 *
 * Research notes (Rome, 2026):
 * - Buildings/heights: start with OSM (`building` + `height` / `building:levels`). Planned upgrade:
 *   Regione Lazio DBT 2014 (CC BY 4.0) and/or Roma Capitale GeoRoma WFS
 *   (https://geoportale.comune.roma.it/geoserver/ows) — cite when wired in fetch.ts.
 * - Trees: OSM natural=tree / landuse=forest / leisure=park (Mediterranean: stone pine, umbrella pine,
 *   cypress, plane, olive; TLV tree sheet is a starting palette until a Rome sheet is painted).
 * - Municipal border: OSM admin_level=8 name "Roma", country name:en "Italy".
 * - Street grid: centro storico is irregular; heading 45° keeps two façades on roughly N–S / E–W
 *   blocks around the Pantheon and puts the Tiber toward the left of the frame.
 * - Airport: Fiumicino (FCO) runway 16L ~163°.
 * - Terrain: Copernicus GLO-30 (global).
 */

export interface Region {
  title: string;
  /** ENU origin. Fixed forever once tiles exist: changing it moves every tile of the region. */
  origin: { lat: number; lon: number; h: number };
  /** Compass bearing the camera looks toward (pick it diagonal to the main street grid). */
  headingDeg: number;
  /** OSM country (name:en of the admin_level=2 area) and municipality names (admin_level=8) for the border overlay. */
  country: string;
  municipalities: string[];
  /** Airliners on final approach drawn over the map (optional). */
  airport?: { lat: number; lon: number; runwayHeadingDeg: number };
  /** Credit lines (video mode and footer). */
  credits: string[];
  /**
   * Typical ellipsoid height of the ground (m): MSL elevation + geoid. Used only for tile binning,
   * area outlines and opening views before the real terrain is sampled. Default 55 (Rome centro).
   * Alpine valleys (Trento ~194 m MSL) need it or every guess lands ~500 art px off.
   */
  groundH?: number;
  /** Surveyed building heights replacing OSM tags/fallbacks (pat-lidar = PAT LiDAR DSM−DTM, Trento). */
  buildingHeights?: "pat-lidar";
  /** Soft map edge in art px [transparent within, opaque from] the area outline. Default [760, 2560]
   *  suits Rome; a small pilot area (Trento: ~1590 px max inside distance) would never reach opaque. Keep the
   *  first value >= half a render tile diagonal (~724 px) so the missing-tile staircase stays hidden. */
  edgeFadePx?: [number, number];
  /** Max per-window palette correction (RGB levels) in assemble. Default 24 (Rome). Trento's big ring
   *  drifts smoothly centre-to-edge and needs ~40 to close every seam under the 12 limit. */
  paletteLimit?: number;
}

/** Ground guess for a region (see Region.groundH). */
export const regionGroundH = (id: string) => REGIONS[id]?.groundH ?? 55;

export interface City {
  title: string;
  region: string;
  /** Opening view: centre and on-screen width in metres. */
  center: [number, number];
  widthM: number;
}

export const REGIONS: Record<string, Region> = {
  "roma-centro": {
    title: "Roma · Centro",
    origin: { lat: 41.8955, lon: 12.4823, h: 0 }, // Piazza Venezia
    headingDeg: 45, // NE: diagonal to centro blocks, Tiber toward the left
    country: "Italy",
    municipalities: [
      "Roma",
    ],
    airport: { lat: 41.8003, lon: 12.2389, runwayHeadingDeg: 163 }, // Fiumicino FCO, runway 16L
    credits: [
      "Map data © OpenStreetMap contributors",
      "Terrain: Copernicus DEM © DLR, Airbus DS · Painted with AI",
    ],
  },
  /**
   * Trento pilot (2026-11). Research notes:
   * - Buildings: OSM footprints; heights from PAT LiDAR 2014/2018 (DSM first − DTM, 0.5 m, CC BY 4.0),
   *   median per footprint (pat-lidar.ts); OSM height/levels/fallback only where LiDAR has no reading.
   * - Trees: OSM natural=tree / parks (alpine valley: lime, horse chestnut, plane, maple, some conifers).
   * - Municipal border: OSM admin_level=8 "Trento", country "Italy".
   * - Street grid: centro storico (Roman Tridentum grid) is rotated ~5° west of N-S / E-W. Length-weighted
   *   OSM road bearings in trento-duomo (mod 90°): peak 80-90° (32%), secondary 20-25° (11%). Heading 40°
   *   (NE) is the exact diagonal of the main grid, so two facades of every block show; the Adige (west of
   *   the centre) falls toward the left/back of the frame, the Castello del Buonconsiglio (east) right.
   * - No airport animation (Trento Mattarello is a small GA field).
   * - Terrain: Copernicus GLO-30. Valley floor ~190-200 m MSL; Doss Trento and the Marzola/Bondone
   *   slopes rise just outside the pilot area.
   */
  trento: {
    title: "Trento",
    origin: { lat: 46.0679, lon: 11.1211, h: 0 }, // Piazza Duomo
    headingDeg: 40,
    country: "Italy",
    municipalities: ["Trento"],
    credits: [
      "Map data © OpenStreetMap contributors",
      "Building heights: LiDAR © Provincia autonoma di Trento (CC BY 4.0)",
      "Terrain: Copernicus DEM © DLR, Airbus DS · Painted with AI",
    ],
    groundH: 242, // ~194 m MSL (Piazza Duomo) + ~48 m geoid
    buildingHeights: "pat-lidar", edgeFadePx: [760, 1250], paletteLimit: 40,
  },
};

export const CITIES: Record<string, City> = {
  // Pantheon / Piazza della Rotonda — opening view of the historic centre
  // Opening view ~6.5 km across so the first frame reads as a city, not a single block
  roma: { title: "Roma", region: "roma-centro", center: [41.8986, 12.4769], widthM: 6500 },
  // Piazza Duomo; pilot patch is ~1 km, so open at 1.4 km across
  trento: { title: "Trento", region: "trento", center: [46.0676, 11.1215], widthM: 6000 }, // v4: citta + nord + sud (~3.6 x 7.3 km)
};

export const DEFAULT_CITY = "roma";
