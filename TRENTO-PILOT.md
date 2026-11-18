# Trento pilot (local only, nothing published)

Region `trento` (origin Piazza Duomo 46.0679,11.1211, heading 40°, groundH 242), city `/trento`, area `trento-duomo`
(bbox 46.0630,11.1160 – 46.0720,11.1300, ~1.0 × 1.08 km). Code diff: `trento-pilot.patch`.

Resume (from this folder; .env has placeholder TILES_ORIGIN + CHROME_PATH):
  npm run fetch -- trento-duomo && npm run ground -- trento-duomo && npm run scene -- trento-duomo
  npm run render -- trento-duomo -j 3
  # paint (Grok GenerateImage only): per window <i_j>, centre-first (order: npx tsx scratch/order.mts)
  scratch/prep.sh <i_j>                       # builds work/<i_j>/input.png with painted neighbour strips, prints edges
  #   GenerateImage(reference = work/<i_j>/input.png only, 1:1, recipe T3 = paint-test/RECIPE-T3.txt)
  scratch/step.sh <i_j> <painting.jpg> [next] # manual backend QA (>=0.4), logs paint-test/scores.tsv, preps next
  MONDO_SOFT_PALETTE=1 npm run paint -- trento-duomo --assemble   # 1 seam (1_-4/1_-3, 14.5 > 12) still open
  npm run export -- trento-duomo
  npx tsx scratch/shot.mts   # env VW/VH/Q/OUT0/OUT; dev server must run
  cd web && ../node_modules/.bin/astro dev --port 4391 --host 127.0.0.1   # open /trento, press P for the render layer
Never run publish/deploy from here.

Status 12 Nov 2026 15:29 (Europe/Rome): 31/31 windows accepted by PAINT_BACKEND=manual QA (0 soft, 0 rejected),
building heights from PAT LiDAR 2014 (DSM first - DTM median per footprint), Rome tests 31/31 pass.

## Run v2 (started 12 Nov 2026 15:54 Europe/Rome)
- [x] seam 1_-4/1_-3 (v3 0.864, max residual 8.37, strict assemble ok)  - [x] credits (footer: LiDAR PAT + Painted with AI)  - [x] ring areas  - [x] export/shots v2 (soft palette preview)  - [x] tests
- [x] ring trento-citta (bbox 46.0540,11.1060 - 46.0820,11.1360; 78 tiles, 131 windows). Renderer fix: per-tile footprint extension + ground texture dispose on resize (hillside clipping). 15 paintings on the broken first render archived in data/derived/trento-citta/archive/ext-paint.
  Resume: `export AREA=trento-citta LOG=paint-test/scores-v2.tsv; scratch/nextwin.sh 5` -> GenerateImage (recipe T3b) on data/derived/trento-citta/work/<w>/input.png -> `scratch/go.sh <w> <painting> auto`.
  Generations used so far (whole v2 run): see "gens" lines below.
- 16:45 gens=25 (1 seam + 15 archived + 9 accepted/rejected), windows done 16/131
- 16:55 gens=34, windows done 25/131 (scores in paint-test/scores-v2.tsv)
- 17:00 gens=39, windows done 30/131 (scores in paint-test/scores-v2.tsv)
- 17:06 gens=45, windows done 35/131 (scores in paint-test/scores-v2.tsv)
- 17:11 gens=49, windows done 40/131 (scores in paint-test/scores-v2.tsv)
- 17:17 gens=54, windows done 45/131 (scores in paint-test/scores-v2.tsv)
- 17:23 gens=59, windows done 50/131 (scores in paint-test/scores-v2.tsv)
- 17:31 gens=65, windows done 55/131 (scores in paint-test/scores-v2.tsv)
- 17:37 gens=70, windows done 60/131 (scores in paint-test/scores-v2.tsv)
- 17:43 gens=76, windows done 65/131 (scores in paint-test/scores-v2.tsv)
- 17:48 gens=81, windows done 70/131 (scores in paint-test/scores-v2.tsv)
- 17:52 gens=86, windows done 75/131 (scores in paint-test/scores-v2.tsv)
- 17:53 gens=87, windows done 75/131 (scores in paint-test/scores-v2.tsv)
- 17:59 gens=93, windows done 80/131 (scores in paint-test/scores-v2.tsv)
- 18:06 gens=100, windows done 85/131 (scores in paint-test/scores-v2.tsv)
- 18:11 gens=105, windows done 90/131 (scores in paint-test/scores-v2.tsv)
- 18:16 gens=110, windows done 95/131 (scores in paint-test/scores-v2.tsv)
- 18:21 gens=115, windows done 100/131 (scores in paint-test/scores-v2.tsv)
- 18:27 gens=120, windows done 105/131 (scores in paint-test/scores-v2.tsv)
- 18:33 gens=125, windows done 110/131 (scores in paint-test/scores-v2.tsv)
- 18:36 gens=130, windows done 115/131 (scores in paint-test/scores-v2.tsv)
- 18:40 gens=135, windows done 120/131 (scores in paint-test/scores-v2.tsv)
- 18:43 gens=140, windows done 125/131 (scores in paint-test/scores-v2.tsv)
- 18:47 gens=146, windows done 130/131 (scores in paint-test/scores-v2.tsv)
- 18:48 all 131/131 trento-citta windows done (gens_logged=140). Palette: 8 seams >12 at limit 24 (clamp-bound drift; dry run scratch/paltry.mts: limit 32 -> 2, limit 40 -> 0, max 11.6). Next: soft-palette preview export, shots, tests.
- 19:05 DONE v2: 131/131 windows (125 pass, 6 soft 0.353-0.396), 138 v2 generations total. LiDAR: 3998/4202 buildings measured (95.1%), 42 PAT tiles on disk.
  Export: `MONDO_SOFT_PALETTE=1 PAINT_BACKEND=manual npm run paint -- trento-citta --assemble && npm run export -- trento-citta` (strict fails: 8 seams 12.0-16.6, clamp-bound; see scratch/paltry.mts). publish-guard blocks publish while soft.
  Shots: shots/v2-1440x900(.png|-render.png), v2-390x844, v2-zoomout-1440x900. CITIES.trento.widthM 1400 -> 3000.
  Tests: pipeline 31 pass / 1 skipped; tsc pipeline + web OK; `astro check` refuses TypeScript 7 (environment).
  Open before publish: decide palette (raise solvePalette limit for Trento to ~40, or repaint drift ring), optionally repaint -6_-3 (invented buildings, 0.438).

## Run v2b (12 Nov 2026 19:05 Europe/Rome): palette +-40 for Trento only
- [x] Region.paletteLimit (places.ts), trento: 40; windowPalette(files, limit) -> solvePalette; paint.ts assemble passes REGIONS[region].paletteLimit (Rome default 24 unchanged)
- [x] -6_-3 repainted once (no invented buildings): 0.438 -> 0.653
- [x] STRICT assemble+export trento-citta (no MONDO_SOFT_PALETTE): 232 edges, 0 > 12, max residual 11.61, max |offset| 40
- [x] shots v2-1440x900 / v2-390x844 / v2-zoomout-1440x900 (+ -render), Rome tests 31 pass 1 skip, tsc pipeline + web OK

## Run v3 (12 Nov 2026 19:20 Europe/Rome): expansion rings
Model: adjoining areas share ONE window grid. paint.ts --context=<areas>: neighbour windows, palette and (new) render/height tiles
fall back to the context area, so windows on the border see both sides. Windows shared with a painted area (its version is black
over the new tiles) are archived (data/derived/<old>/archive/shared-<new>/) and repainted once from the new area.
Assemble every area with the others as --context, export all areas together.
Terrain (Copernicus, m asl; ceiling ~507): valley north to 46.105 ok west of 11.124 (Calisio slope 886 m east of it);
south 46.005-46.054 x 11.103-11.137 max ~406; Villazzano max 447, Cognola max 473 (ok); Povo 8.6% > 507 (max 658), Martignano 41.5% > 507 (max 929).
- [x] ring N1 trento-nord (Gardolo) bbox 46.0820,11.0980 - 46.1050,11.1240: 56 tiles rendered, 101 windows (9 shared with citta, archived in citta/archive/shared-nord), LiDAR 1349/1446 (93.3%), 26 new PAT tiles
  Resume: `export AREA=trento-nord CTX=trento-citta ORDER=paint-test/order-v3-nord.txt LOG=paint-test/scores-v3.tsv; scratch/nextwin.sh 5`
  -> GenerateImage (T3u) on data/derived/trento-nord/work/<w>/input.png -> `scratch/gm.sh <w> <painting> <painted edges csv>` (brightness-match to strips, then go3 auto)
- 19:27 trento-nord: gens=1, windows done 0/101 (paint-test/scores-v3.tsv)
- 19:30 trento-nord: gens=5, windows done 5/101 (paint-test/scores-v3.tsv)
- 19:35 trento-nord: gens=10, windows done 10/101 (paint-test/scores-v3.tsv)
- 19:42 trento-nord: gens=17, windows done 15/101 (paint-test/scores-v3.tsv)
- 19:47 trento-nord: gens=22, windows done 20/101 (paint-test/scores-v3.tsv)
- 19:52 trento-nord: gens=28, windows done 25/101 (paint-test/scores-v3.tsv)
- 19:58 trento-nord: gens=33, windows done 30/101 (paint-test/scores-v3.tsv)
- 20:03 trento-nord: gens=38, windows done 35/101 (paint-test/scores-v3.tsv)
- 20:07 trento-nord: gens=43, windows done 40/101 (paint-test/scores-v3.tsv)
- 20:13 trento-nord: gens=48, windows done 45/101 (paint-test/scores-v3.tsv)
- 20:18 trento-nord: gens=53, windows done 50/101 (paint-test/scores-v3.tsv)
- 20:23 trento-nord: gens=58, windows done 55/101 (paint-test/scores-v3.tsv)
- 20:28 trento-nord: gens=63, windows done 60/101 (paint-test/scores-v3.tsv)
- 20:34 trento-nord: gens=69, windows done 65/101 (paint-test/scores-v3.tsv)
- 20:39 trento-nord: gens=74, windows done 70/101 (paint-test/scores-v3.tsv)
- 20:44 trento-nord: gens=79, windows done 75/101 (paint-test/scores-v3.tsv)
- 20:51 trento-nord: gens=84, windows done 80/101 (paint-test/scores-v3.tsv)
- 20:55 trento-nord: gens=89, windows done 85/101 (paint-test/scores-v3.tsv)
- 20:57 trento-nord: gens=90, windows done 90/101 (paint-test/scores-v3.tsv)
- 21:00 trento-nord: gens=94, windows done 95/101 (paint-test/scores-v3.tsv)
- 21:03 trento-nord: gens=97, windows done 100/101 (paint-test/scores-v3.tsv)
- 21:36 DONE ring N1 trento-nord: 101/101 windows, all pass (0 soft), 93 painted + 8 strip-only (input = neighbour strips, <2% unpainted), scores 0.402-0.988 (6 below 0.5),
  Grok gens: 98 logged (incl. 4 rejected + 1 repaint of -15_-5) + 3 discarded first tries = ~101 (budget ~100). LiDAR 1349/1446 (93.3%).
  Palette QA STRICT (no MONDO_SOFT_PALETTE), citta+nord union: 401 edges, 0 > 12, max residual 11.54, max |offset| 40.
  Close-out fixes: (1) -15_-5 repainted once (old right band had a hallucinated road vs -14_-5: residual 28 -> ok; v1 in nord/archive/repaint/);
  (2) scratch/clean.mts zeroed near-black model noise where the render is black (36 nord windows, originals in nord/archive/prenoise/);
  (3) nord paintings had drifted ~30 levels darker than citta, so the union mean-zero gauge pushed citta windows into the ±40 clamp (0_-1/0_0 13.2):
      scratch/rebase.mts baked ONE uniform shift (+29,+32,+22 RGB) into every nord window (unclamped union solve max residual 11.37), citta untouched; originals in nord/archive/prebase/.
  (4) export.ts: edge fade now measures distance to the OUTER border of the union of exported areas (areas.ts unionEdges/unionInsideDistance), so adjoining areas
      no longer fade to fog along their shared edge; the fade outline hash is in the tile stamp so edge tiles re-export. CITIES.trento.widthM 3000 -> 4500.
  Export: `npm run export -- trento-citta trento-nord` (134 painted tiles). Shots: shots/v3-1440x900, v3-390x844, v3-zoomout-1440x900 (?at=46.0835,11.1175,4.5) (+ -render). shot2.mts WAIT=15000 (6 s left low-zoom tiles unloaded).
  Rome tests 31 pass 1 skip; tsc pipeline + web OK.

## Run v4 (12 Nov 2026 21:40 Europe/Rome): ring S1 trento-sud
Area trento-sud bbox 46.0320,11.1040 - 46.0540,11.1340 (adjoins citta's south edge; DEM 181-394 m asl, 0% > 507).
Setup: `npm run fetch -- trento-sud && npm run ground -- trento-sud && npm run scene -- trento-sud && npm run render -- trento-sud -j 3`
Resume: `export AREA=trento-sud CTX=trento-citta,trento-nord ORDER=paint-test/order-v4-sud.txt LOG=paint-test/scores-v4.tsv; scratch/nextwin.sh 5`
  -> GenerateImage (T3u) on data/derived/trento-sud/work/<w>/input.png -> `scratch/gm.sh <w> <painting> <painted edges csv>`
  low-coverage windows: strip-only (`PV=strip-only scratch/go3.sh <w> data/derived/trento-sud/work/<w>/input.png auto`).
  Close-out: clean.mts, rebase if drift, strict assemble each area with the others as --context, export all three.
11 shared windows archived in citta/archive/shared-sud (4_3 2_3 4_2 3_3 5_2 1_4 2_4 6_1 6_2 1_5 7_1); 99 windows, 60 tiles, LiDAR 1329/1472 (90.3%)
- 21:51 trento-sud: gens=5, windows done 5/99 (paint-test/scores-v4.tsv)
- 21:54 trento-sud: gens=10, windows done 10/99 (paint-test/scores-v4.tsv)
- 21:57 trento-sud: gens=15, windows done 15/99 (paint-test/scores-v4.tsv)
- 22:02 trento-sud: gens=20, windows done 20/99 (paint-test/scores-v4.tsv)
- 22:05 trento-sud: gens=25, windows done 25/99 (paint-test/scores-v4.tsv)
- 22:08 trento-sud: gens=30, windows done 30/99 (paint-test/scores-v4.tsv)
- 22:11 trento-sud: gens=35, windows done 35/99 (paint-test/scores-v4.tsv)
- 22:16 trento-sud: gens=40, windows done 40/99 (paint-test/scores-v4.tsv)
- 22:19 trento-sud: gens=45, windows done 45/99 (paint-test/scores-v4.tsv)
- 22:22 trento-sud: gens=50, windows done 50/99 (paint-test/scores-v4.tsv)
- 22:25 trento-sud: gens=55, windows done 55/99 (paint-test/scores-v4.tsv)
- 22:29 trento-sud: gens=60, windows done 60/99 (paint-test/scores-v4.tsv)
- 22:32 trento-sud: gens=65, windows done 65/99 (paint-test/scores-v4.tsv)
- 22:34 trento-sud: gens=70, windows done 70/99 (paint-test/scores-v4.tsv)
- 22:37 trento-sud: gens=75, windows done 75/99 (paint-test/scores-v4.tsv)
- 22:40 trento-sud: gens=80, windows done 80/99 (paint-test/scores-v4.tsv)
- 22:43 trento-sud: gens=86, windows done 85/99 (paint-test/scores-v4.tsv)
- 22:45 trento-sud: gens=87, windows done 90/99 (paint-test/scores-v4.tsv)
- 22:45 trento-sud: gens=87, windows done 95/99 (paint-test/scores-v4.tsv)
- 23:09 trento-sud: gens=87, windows done 99/99 (paint-test/scores-v4.tsv)
- DONE ring S1 trento-sud (23:09 Europe/Rome): 99/99 windows (86 painted with Grok GenerateImage T3u + 13 strip-only low-coverage), 97 pass / 2 soft (7_7, 5_8), 0 rejected;
  painted NCC 0.365-0.995 (median 0.673), threshold 0.4 unchanged; 87 logged generations (incl. one style repaint of 5_10, photo-look -> flat; first take in sud/archive/repaint/).
  LiDAR 1329/1472 (90.3%). 11 shared windows repainted from sud (citta originals in citta/archive/shared-sud). Brightness drift vs citta+nord: shift (-2,-3,-1) -> no rebase
  (scratch/rebase2.mts = generalised rebase, measure-only). clean.mts: 1 window. Strict palette first failed on 3 overlaps (4_5/4_6 18.6, 4_6/5_6 12.7, citta 0_4/0_5 12.7):
  fixed without regeneration by scratch/seamfix.mts (copy neighbour's 128 px overlap band + 96 px feathered colour ramp) on sud 4_6 (top, right) and citta 0_5 (top); originals in */archive/preseam/.
  Strict assemble (no MONDO_SOFT_PALETTE): citta 78, nord 56, sud 60 art tiles, each with the other two as --context; union palette 311 windows / 565 overlaps, max residual 11.33, 0 > 12, 2 windows at the +-40 clamp.
  Export: `npm run export -- trento-citta trento-nord trento-sud` -> 194 painted tiles (z8 776 updated). CITIES.trento.widthM 4500 -> 6000 (zoom-out is still capped by min(playW, playH)).
  Shots: shots/v4-1440x900, v4-390x844, v4-zoomout-1440x900 (?at=46.0530,11.1200,8: citta/sud seam) + -render variants; 0 failed requests. Rome tests 31 pass 1 skip; tsc pipeline + web OK.

## Run v5 (12 Nov 2026 23:20 Europe/Rome): ring E1 trento-est (Villazzano / Cognola hill foot)
Area trento-est bbox 46.0400,11.1340 - 46.0820,11.1500 (adjoins citta's and sud's east edges; DEM 207-473 m asl, 0% > 507; rendered height max 461 m asl, 0 px at the ceiling).
OSM 1897 buildings, LiDAR 1799/1896 (94.9%). 115 windows: 33 shared (23 with est content the old painting left black -> archived in citta|sud/archive/shared-est and repainted;
10 with gap < 1% reused via --context: 2_-4 3_-3 4_-2 -2_-6 5_-1 -2_-7 6_1 6_0 7_0 7_1 ). Order paint-test/order-v5-est.txt (105; cov<0.3 last = strip-only).
Setup: `npm run fetch -- trento-est && npm run ground -- trento-est && npm run scene -- trento-est && npm run render -- trento-est -j 3`
Resume: `export AREA=trento-est CTX=trento-citta,trento-nord,trento-sud ORDER=paint-test/order-v5-est.txt LOG=paint-test/scores-v5.tsv; scratch/batch.sh 5`
  -> GenerateImage (T3u) on data/derived/trento-est/work/<w>/input.png -> `scratch/acc.sh <w> <painting> <painted edges csv>` (match + blackmask + go3, logs every 5)
  low-coverage windows: strip-only (prep, then `PV=strip-only scratch/go3.sh <w> <copy of input.png>`).
  Close-out: clean.mts, rebase2.mts (measure; apply if drift), strict assemble each area with the other three as --context, seamfix.mts on failing pairs, export all four.
- 23:23 trento-est: gens=5, windows done 5/105 (paint-test/scores-v5.tsv)
- 23:26 trento-est: gens=10, windows done 10/105 (paint-test/scores-v5.tsv)
- 23:30 trento-est: gens=15, windows done 15/105 (paint-test/scores-v5.tsv)
- 23:34 trento-est: gens=20, windows done 20/105 (paint-test/scores-v5.tsv)
- 23:37 trento-est: gens=25, windows done 25/105 (paint-test/scores-v5.tsv)
- 23:43 trento-est: gens=31, windows done 30/105 (paint-test/scores-v5.tsv)
- 23:46 trento-est: gens=36, windows done 35/105 (paint-test/scores-v5.tsv)
- 23:51 trento-est: gens=41, windows done 40/105 (paint-test/scores-v5.tsv)
- 23:54 trento-est: gens=46, windows done 45/105 (paint-test/scores-v5.tsv)
- 23:57 trento-est: gens=51, windows done 50/105 (paint-test/scores-v5.tsv)
- 00:00 trento-est: gens=57, windows done 55/105 (paint-test/scores-v5.tsv)
- 00:03 trento-est: gens=62, windows done 60/105 (paint-test/scores-v5.tsv)
- 00:06 trento-est: gens=67, windows done 65/105 (paint-test/scores-v5.tsv)
- 00:08 trento-est: gens=72, windows done 70/105 (paint-test/scores-v5.tsv)
- 00:11 trento-est: gens=77, windows done 75/105 (paint-test/scores-v5.tsv)
- 00:14 trento-est: gens=82, windows done 80/105 (paint-test/scores-v5.tsv)
- 00:19 trento-est: gens=87, windows done 85/105 (paint-test/scores-v5.tsv)
- 00:19 trento-est: gens=88, windows done 86/105 (paint-test/scores-v5.tsv)
- 00:21 trento-est: gens=89, windows done 90/105 (paint-test/scores-v5.tsv)
- 00:22 trento-est: gens=89, windows done 95/105 (paint-test/scores-v5.tsv)
- 00:23 trento-est: gens=89, windows done 100/105 (paint-test/scores-v5.tsv)
- 00:24 trento-est: gens=89, windows done 105/105 (paint-test/scores-v5.tsv)
- DONE ring E1 trento-est (01:03 Europe/Rome, 13 Nov 2026): 105/105 windows (87 painted with Grok GenerateImage T3u + 18 strip-only low-coverage), 103 pass / 2 soft (3_-5 0.302, 1_-8 0.337), 2 rejected+repainted (5_-7 dark band, 10_-2 0.17);
  painted NCC 0.302-0.921 (median 0.631, 17 below 0.5), threshold 0.4 unchanged; 89 logged generations (budget ~100). LiDAR 1799/1896 (94.9%). 23 shared windows repainted from est
  (originals in citta|sud/archive/shared-est), 10 reused via --context. Post-process per window: match.mts + blackmask + dewhite.py. clean.mts: 17 windows.
  Drift vs citta+nord+sud (rebase2.mts, unclamped): shift (-6,-6,-7) -> no rebase. Strict palette first failed on 20 overlaps (worst 14_2/15_2 47.2, 15_2/15_3 39.5, 14_3/15_3 33.0, 9_-2/9_-1 29.3):
  fixed without regeneration by 20 seamfix.mts passes on 17 est windows (later-painted window takes the earlier one's band; plan = scratch/seamplan.py; originals in est/archive/preseam/).
  Strict assemble (no MONDO_SOFT_PALETTE), each area with the other three as --context: citta 78, nord 56, sud 60, est 63 art tiles; union palette 393 windows / 724 overlaps,
  max residual 11.19, 0 > 12, 1 window at the +-40 clamp.
  Export: `npm run export -- trento-citta trento-nord trento-sud trento-est` -> 251 painted tiles (paint coverage 251/251, 0 missing; z8 1004 updated, z2-7 368).
  Shots: shots/v5-1440x900, v5-390x844, v5-zoomout-1440x900 (?at=46.0640,11.1290,8, viewer min zoom) + -render variants, 0 failed requests;
  shots/v5-zoomout-fullmap.png = whole painted map stitched from exported z5 tiles (3712x2560; the viewer's min zoom is capped by min(playW, playH) so no single viewport shows all 7.4 x 5.1 km).
  Rome tests 31 pass 1 skip; tsc pipeline + web OK.
  Totals all rings: 251 painted tiles; windows citta 131 + nord 101 + sud 99 + est 105; Grok gens 138 (v2 citta) + ~101 (N1) + 87 (S1) + 89 (E1) = ~415 (+42 v1 pilot tests in scores.tsv);
  LiDAR per area 3998/4202, 1349/1446, 1329/1472, 1799/1896 = 8475/9016 (94.0%).

## Povo / Martignano vs the ~507 m height-image ceiling (options only, not implemented)
Measured (Copernicus DEM, m asl, scratch/terrain.mts, 0.0005 deg grid): Povo 46.058-46.075 x 11.150-11.172: p50 483, max 842, 39.8% > 507, 4.1% > 707, 0% > 907;
Martignano 46.082-46.100 x 11.124-11.150: p50 473, max 1093, 43.2% > 507, 22.1% > 707, 9.5% > 907; Povo west strip 11.150-11.160 only: max 578, 5.0% > 507.
Cause: renderer.ts writes v = (h_ellipsoid + 100) * 100 into 16 bits (R<<8|G), B unused -> h <= 555.35 m ellipsoid (~507 m asl); heights.ts decodes.
1. 24-bit height (use B as high byte): v = (h+100)*100 up to 16,777,215 -> ceiling ~167 km, same 1 cm precision. Change 2 lines (renderer.ts shader clamp/B, heights.ts decode
   B*65536+R*256+G) + rebuild page/dist/renderer.js. Existing tiles have B=0 so they decode identically: no re-render of Rome or the 4 Trento areas, Rome tests unaffected.
   Covers Povo (842) and Martignano (1093) 100%. Cost: highp float in the shader (exact to 2^24, ok); need to verify every reader (export/paint/hmax) goes through readHeights; new areas
   only. Trade-off: the hills are 40-60% forest/meadow slope, so expect more strip-only/meadow windows and more hallucination risk per generation (cf. est needed 2 rejects in 89).
2. Per-region height base (v = (h - base + 100)*100, e.g. trento base 200 m): ceiling ~707 m asl. Povo 4.1% still clipped, Martignano 22.1% clipped -> does not solve Martignano.
   Needs a region field threaded through renderer + readHeights + all callers and re-rendering all Trento height tiles (4 areas, 257 tiles) -> more work than option 1 for less range.
3. No format change: crop to the sub-ceiling foot. The Povo strip 11.150-11.160 already has 5.0% > 507 (est stopped at 11.150 because 11.155 was 1.4% > 507), so only a
   ~400 m sliver of Povo's foot and none of Martignano's core would be added; clipped pixels would render flat at 507 (wrong roofs/terrain). Lowest effort, little value.
Recommendation: option 1 (smallest change, backward compatible, full range), gated by a hmax.mts check (0 px at the new ceiling) on a test area before painting.

## Run v6 (13 Nov 2026 07:45 Europe/Rome): ring N2 trento-spini (Spini di Gardolo industrial zone)
Terrain (Copernicus, m asl): 46.105-46.125 x 11.098-11.124 max 506 (Calisio foot at the SE corner, 1 m under the ~507 ceiling) -> east edge cut to 11.120:
max 412, p95 365, 0% > 450, 0% > 507. Area trento-spini bbox 46.1050,11.0980 - 46.1250,11.1200 (shares nord's north edge).
Setup: `npm run fetch -- trento-spini && npm run ground -- trento-spini && npm run scene -- trento-spini && npm run render -- trento-spini -j 3`
Resume: `export AREA=trento-spini CTX=trento-citta,trento-nord,trento-sud,trento-est ORDER=paint-test/order-v6-spini.txt LOG=paint-test/scores-v6.tsv; scratch/batch.sh 5`
  -> GenerateImage (T3u, scratch/pr.sh) on data/derived/trento-spini/work/<w>/input.png -> `scratch/accb.sh "<w> <painting> <edges>" ...` (match + blackmask + go3 + dewhite, logs every 5)
  low-coverage windows: strip-only (prep, cp input, `PV=strip-only scratch/go3.sh <w> <copy>`).
  Close-out: clean.mts then mv *.png.tmp.png into place, rebase2.mts (measure), strict assemble all five with the other four as --context, seamplan.py + seamfix.mts on failing pairs, export all five.
Shared windows: 10 with trento-nord (-13_-11 -14_-11 -14_-10 -15_-10 -16_-10 -17_-10 -17_-9 -18_-7 -18_-9 -18_-8), all with spini content nord left black (gap 9-97%) -> archived in nord/archive/shared-spini, repainted from spini. 41 render tiles, max rendered 386 m asl (0 px at ceiling). OSM 906 buildings, LiDAR 851/906 (93.9%). Order paint-test/order-v6-spini.txt: 71 windows (cov<0.3 last = strip-only).
- 07:57 trento-spini: gens=5, windows done 5/71 (paint-test/scores-v6.tsv)
- 08:01 trento-spini: gens=10, windows done 10/71 (paint-test/scores-v6.tsv)
- 08:05 trento-spini: gens=16, windows done 15/71 (paint-test/scores-v6.tsv)
- 08:09 trento-spini: gens=21, windows done 20/71 (paint-test/scores-v6.tsv)
- 08:14 trento-spini: gens=26, windows done 25/71 (paint-test/scores-v6.tsv)
- 08:19 trento-spini: gens=31, windows done 30/71 (paint-test/scores-v6.tsv)
- 08:22 trento-spini: gens=36, windows done 35/71 (paint-test/scores-v6.tsv)
- 08:26 trento-spini: gens=41, windows done 40/71 (paint-test/scores-v6.tsv)
- 08:29 trento-spini: gens=46, windows done 45/71 (paint-test/scores-v6.tsv)
- 08:36 trento-spini: gens=51, windows done 50/71 (paint-test/scores-v6.tsv)
- 08:36 trento-spini: gens=54, windows done 52/71 (paint-test/scores-v6.tsv)
- 08:39 trento-spini: gens=56, windows done 55/71 (paint-test/scores-v6.tsv)
- 08:40 trento-spini: gens=59, windows done 57/71 (paint-test/scores-v6.tsv)
- 08:41 trento-spini: gens=61, windows done 60/71 (paint-test/scores-v6.tsv)
- 08:43 trento-spini: gens=61, windows done 65/71 (paint-test/scores-v6.tsv)
- 08:44 trento-spini: gens=61, windows done 70/71 (paint-test/scores-v6.tsv)
- 08:44 trento-spini: gens=62 (61 accepted + 1 discarded -14_-11), windows done 71/71 (60 painted + 11 strip-only) (paint-test/scores-v6.tsv)
  (correction: the 08:3x-08:44 lines counted gens one too high (54, 59, 62); the scores log has 61 painted rows = 60 windows + 1 repaint of -14_-11, so gens=61.)
- DONE ring N2 trento-spini (09:12 Europe/Rome, 13 Nov 2026): 71/71 windows (60 painted with Grok GenerateImage T3u-spini + 11 strip-only low-coverage), 58 pass / 2 soft (-18_-8 0.345, -22_-13 0.348), 0 rejected;
  painted NCC 0.345-0.935 (median 0.732, 9 below 0.5), threshold 0.4 unchanged; 61 Grok generations (60 + 1 repaint: -14_-11 first try had a flat neon-green patch, archived, repainted as woodland 0.46)
  (+4 GenerateImage calls that aborted with no image, retried). Terrain: bbox 46.1050,11.0980 - 46.1250,11.1200, DEM max 412 m asl (0% > 507); rendered max 386 m asl, 0 px at the ceiling.
  LiDAR 851/906 (93.9%). 10 shared windows with nord repainted from spini (originals in nord/archive/shared-spini). Post-process per window: match.mts + blackmask + dewhite.py (2 windows touched: -22_-13 39535 px, -23_-14 1324 px).
  clean.mts: 4 windows. Drift vs the other four (rebase2.mts, unclamped): shift (+7,+8,+9) -> no rebase (strict palette passes without it).
  Strict palette first failed on 2 overlaps (-18_-8/-17_-8 nord 19.4, -17_-13/-16_-13 13.2): fixed by 2 seamfix.mts passes on spini windows (originals in spini/archive/preseam/).
  Strict assemble (no MONDO_SOFT_PALETTE), each area with the other four as --context: citta 78, nord 56, sud 60, est 63, spini 41 art tiles; union palette 454 windows / 834 overlaps,
  max residual 11.2, 0 > 12, 1 window at the +-40 clamp.
  Export: `npm run export -- trento-citta trento-nord trento-sud trento-est trento-spini` -> 292 painted tiles (paint coverage 292/292, 0 missing; z8 1168 updated, z2-7 431; 3254 files; ~20 min).
  Shots: shots/v6-1440x900 (?at=46.1150,11.1090,1.5, Spini), v6-390x844 (?at=46.1150,11.1090,0.7), v6-zoomout-1440x900 (?at=46.0800,11.1200,8, viewer min zoom) + -render variants, 0 failed requests;
  shots/v6-zoomout-fullmap.png = whole painted map stitched from exported z5 map tiles (scratch/stitch.mts, 30 tiles, 5120x3584) + v6-zoomout-fullmap-render.png (photo layer).
  Rome tests 32: 31 pass 1 skip 0 fail; tsc pipeline + web OK.
  Totals all rings: 292 painted tiles; windows citta 131 + nord 101 + sud 99 + est 105 + spini 71; Grok gens ~415 (previous) + 61 (N2) = ~476;
  LiDAR 8475/9016 + 851/906 = 9326/9922 (94.0%).

## Run v7 (13 Nov 2026 09:22 Europe/Rome): 24-bit height (option 1) + rings E2 trento-povo, NE1 trento-martignano
24-bit height implemented: pipeline/page/renderer.ts fragment shader writes v=(h+100)*100 clamped to 16777215 as B=hi, R=mid, G=lo; pipeline/src/heights.ts readHeights decodes
B*65536+R*256+G (render.ts doc updated); page/dist/renderer.js rebuilt (esbuild). Readers: export.ts (Heights cache), paint.ts (heightTile/windowGround/QA ground), scratch/hmax.mts all go
through readHeights; no other decoder in pipeline/src, web/src or tests (rg). New ceiling 167,672 m ellipsoid.
Backward compatibility: all 310 existing height tiles (trento-citta/duomo/est/nord/spini/sud) have B=0 everywhere -> decode is mathematically identical; sha1 of the decoded
Float32 heights for 18 sampled tiles (3 per area) identical before/after (scratch/hcheck/before.json == after.json). No Rome derived data on this box; Rome tests 31 pass 1 skip 0 fail; tsc OK.
Gate: test area trento-htest (46.0920,11.1440-46.0950,11.1500, Calisio slope, DEM 681-929 m asl; not exported): 2 tiles, decoded max 765.22 m ell (~717 m asl), 0 px at the 24-bit
ceiling, 131072/131072 px above the old 555.35 m ceiling (all would have clipped), B=1 in every pixel.
Found while gating: scene.ts binned buildings/trees into render tiles at GROUND_GUESS (groundH+15), but an object on terrain H is drawn ~2.83 px/m higher -> hill buildings fell
out of the bin of the tile they are drawn in and were never rendered. Fix (scene.ts): bin at the union of GROUND_GUESS and the real terrain (ground/height.bin via groundAt);
flat areas keep every old bin. htest after fix: 0 missing. Measured on existing renders (scratch/binmiss.mts, DEM-based): est 238/1886 buildings (12.6%, 33 tiles) are in a
rendered est tile but missing from it; citta 8, sud 9, spini 8, nord 0. NOT re-rendered (would invalidate the painted est windows) -> est fix = re-scene + re-render + repaint 33 tiles (open item).
Terrain (Copernicus, m asl, scratch/terrain.mts): povo 46.055-46.075 x 11.150-11.168 p50 467 max 822, 30.6% > 507; martignano 46.082-46.095 x 11.124-11.150 p50 427 max 929, 32% > 507.
Areas: trento-povo 46.0550,11.1500 - 46.0800,11.1700 (shares est's east edge 11.150); trento-martignano 46.0820,11.1240 - 46.0950,11.1500 (shares citta/est north edge 46.082, nord east edge 11.124).
Setup (scene.ts with the binning fix): povo 47 render tiles, OSM 1056 buildings, LiDAR 938/1056 (88.8%), rendered max 887.34 m ell (~839 m asl), 0 px at the 24-bit ceiling, 732246 px above the old one;
  binmiss 0 in-tile misses. martignano 32 tiles, OSM 564, LiDAR 520/564 (92.2%), rendered max 765.22 m ell (~717 m asl), 0 px at ceiling, 414802 px above the old one; binmiss 0.
Ring setup = scratch/ringsetup.sh (order MAXR 40, shared windows via sharedgap.mts, archive gap>=1% from the owner, own-render coverage <0.3 -> strip-only tail).
Povo: 87 windows, 16 shared with est, all with povo content est left black -> archived in est/archive/shared-povo, repainted from povo; 73 paint + 14 strip-only. Order paint-test/order-v7-povo.txt.
Resume povo: `export AREA=trento-povo CTX=trento-est,trento-citta,trento-sud,trento-nord,trento-spini ORDER=paint-test/order-v7-povo.txt LOG=paint-test/scores-v7-povo.tsv LOF=paint-test/lo-v7-povo.txt TPL=scratch/t3u-est.txt; scratch/batch6.sh 6`
  -> GenerateImage (TPL via scratch/pr.sh <edges>) on data/derived/trento-povo/work/<w>/input.png -> `scratch/accb.sh "<w> <painting> <edges>" ...`; strip-only tail as in v6. Martignano set up after povo is painted (possible shared windows).
- 09:36 trento-povo: gens=5, windows done 5/87 (paint-test/scores-v7-povo.tsv)
- 09:39 trento-povo: gens=10, windows done 10/87 (paint-test/scores-v7-povo.tsv)
- 09:43 trento-povo: gens=15, windows done 15/87 (paint-test/scores-v7-povo.tsv)
- 09:47 trento-povo: gens=20, windows done 20/87 (paint-test/scores-v7-povo.tsv)
- 09:51 trento-povo: gens=25, windows done 25/87 (paint-test/scores-v7-povo.tsv)
- 09:52 trento-povo: gens=30, windows done 30/87 (paint-test/scores-v7-povo.tsv)
- 09:56 trento-povo: gens=35, windows done 35/87 (paint-test/scores-v7-povo.tsv)
- 10:00 trento-povo: gens=40, windows done 40/87 (paint-test/scores-v7-povo.tsv)
- 10:06 trento-povo: gens=45, windows done 45/87 (paint-test/scores-v7-povo.tsv)
- 10:10 trento-povo: gens=50, windows done 50/87 (paint-test/scores-v7-povo.tsv)
- 10:13 trento-povo: gens=55, windows done 55/87 (paint-test/scores-v7-povo.tsv)
- 10:14 trento-povo: gens=60, windows done 60/87 (paint-test/scores-v7-povo.tsv)
- 10:19 trento-povo: gens=65, windows done 65/87 (paint-test/scores-v7-povo.tsv)
- 10:28 trento-povo: gens=71, windows done 70/87 (paint-test/scores-v7-povo.tsv)
- 10:29 trento-povo: gens=71, windows done 75/87 (paint-test/scores-v7-povo.tsv)
- 10:31 trento-povo: gens=71, windows done 80/87 (paint-test/scores-v7-povo.tsv)
- 10:33 trento-povo: gens=72, windows done 85/87 (paint-test/scores-v7-povo.tsv)
- 10:35 trento-povo painting DONE: 87/87 windows (73 painted + 14 strip-only), 71 pass + 2 soft (10_-6 0.372, 12_-7 0.398), NCC 0.372-0.969 median 0.654 (8 below 0.5); 75 Grok gens (73 accepted + 15_-7 rejected by visual check: hallucinated row houses on meadow that NCC passed at 0.759 + 1 discarded 15_-6 built on that strip); meadow windows repainted with scratch/t3u-meadow.txt. Bug fixed: scratch/dewhite.py reused a stale archive/prewhite copy on re-accept and silently restored the rejected painting (hit povo 15_-7 and spini -14_-11: spini exported the discarded neon-green try in v6!). Now always re-copies; both windows re-accepted from manual/ (spini old in spini/archive/dewhitebug).
Martignano: 61 windows, 20 shared (nord 9, citta 4, est 7), all gap>=1% -> archived in <owner>/archive/shared-martignano, repainted from martignano; 43 paint + 18 strip-only. Order paint-test/order-v7-mart.txt.
Resume martignano: `export AREA=trento-martignano CTX=trento-citta,trento-est,trento-nord,trento-povo,trento-spini,trento-sud ORDER=paint-test/order-v7-mart.txt LOG=paint-test/scores-v7-mart.tsv LOF=paint-test/lo-v7-mart.txt TPL=scratch/t3u-est.txt; scratch/batch6.sh 6`
  -> view inputs (python3 scratch/inputs.py), flat-meadow windows use TPL=scratch/t3u-meadow.txt; accept with scratch/accb.sh; visual check every window vs render (scratch/wcmp.py / sheet.py), NCC alone passes hallucinations on flat inputs.
- 10:37 trento-martignano: gens=1, windows done 0/61 (paint-test/scores-v7-mart.tsv)
- 10:38 trento-martignano: gens=2, windows done 0/61 (paint-test/scores-v7-mart.tsv)
- 10:38 trento-martignano: gens=3, windows done 0/61 (paint-test/scores-v7-mart.tsv)
- 10:38 trento-martignano: gens=4, windows done 0/61 (paint-test/scores-v7-mart.tsv)
- 10:44 trento-martignano: gens=5, windows done 5/61 (paint-test/scores-v7-mart.tsv)
- 10:46 trento-martignano: gens=10, windows done 10/61 (paint-test/scores-v7-mart.tsv)
- 10:49 trento-martignano: gens=15, windows done 15/61 (paint-test/scores-v7-mart.tsv)
- 10:54 trento-martignano: gens=20, windows done 20/61 (paint-test/scores-v7-mart.tsv)
- 10:58 trento-martignano: gens=25, windows done 25/61 (paint-test/scores-v7-mart.tsv)
- 11:02 trento-martignano: gens=31, windows done 30/61 (paint-test/scores-v7-mart.tsv)
- 11:05 trento-martignano: gens=36, windows done 35/61 (paint-test/scores-v7-mart.tsv)
- 11:08 trento-martignano: gens=41, windows done 40/61 (paint-test/scores-v7-mart.tsv)
- 11:11 trento-martignano: gens=44, windows done 45/61 (paint-test/scores-v7-mart.tsv)
- 11:13 trento-martignano: gens=44, windows done 50/61 (paint-test/scores-v7-mart.tsv)
- 11:14 trento-martignano: gens=44, windows done 55/61 (paint-test/scores-v7-mart.tsv)
- 11:15 trento-martignano: gens=44, windows done 60/61 (paint-test/scores-v7-mart.tsv)
- 11:15 trento-martignano painting DONE: 61/61 windows (43 painted + 18 strip-only), 43 pass + 0 soft, NCC 0.430-0.950 median 0.676 (2 below 0.5); 45 Grok gens
  (43 accepted + -6_-10 auto-rejected by the dark-patch check (black block wider than the render's, NCC 0.705) + -1_-10 rejected by visual check (flat unpainted farmland), repainted with scratch/t3u-field.txt).
  Templates: t3u-est (town), t3u-field (farmland/vineyards), meadow wording for the open Calisio slope.
- 11:24 close-out povo+martignano: clean.mts povo 11 / martignano 15 windows; rebase2 drift povo (-3,-5,-6), martignano (+1,0,-2) -> no rebase.
  Strict palette first failed on 8 overlaps (max 29.5 povo 11_-9/11_-8): 7 seamfix.mts passes on povo windows + 3 on citta (-9_-2 left/top, -8_-2 right; originals in <area>/archive/preseam/;
  the citta pair -10_-2/-9_-2 had crept to 12.006 with the larger union). Strict assemble (no MONDO_SOFT_PALETTE) povo 47 / martignano 32 art tiles; union 566 windows / 1053 overlaps, max residual 11.31, 0 > 12.

### est binning fix (13 Nov 2026 11:30 Europe/Rome)
Archived est/citta/sud/spini scene+render+height in <area>/archive/prebin/. Re-scene trento-est with the fixed scene.ts: 69 tile bins changed (all additions, 0 removals), 46 with a render tile
-> re-rendered those 46 (npm run render after moving the changed tiles out; old ones in archive/prebin/render). Pixel diff (scratch/rdiff.py, |dRGB|>40): 40 tiles, 751828 px changed.
Repaint = est windows with >= 5000 changed px: 37 windows (originals in est/archive/prebin/windows), + povo-owned 4_-8 (27771 px), 4_-7 (9002 px) afterwards. Order paint-test/order-v7-estfix.txt.
Resume estfix: `export AREA=trento-est CTX=trento-citta,trento-nord,trento-sud,trento-spini,trento-povo,trento-martignano ORDER=paint-test/order-v7-estfix.txt LOG=paint-test/scores-v7-estfix.tsv LOF=paint-test/lo-v7-estfix.txt TPL=scratch/t3u-est.txt; scratch/cycle.sh`
- 11:28 trento-est: gens=6, windows done 50/37 (paint-test/scores-v7-estfix.tsv)
- 11:32 trento-est: gens=11, windows done 55/37 (paint-test/scores-v7-estfix.tsv)
- 11:39 trento-est: gens=16, windows done 60/37 (paint-test/scores-v7-estfix.tsv)
- 11:43 trento-est: gens=21, windows done 65/37 (paint-test/scores-v7-estfix.tsv)
- 11:49 trento-est: gens=26, windows done 25/37 (paint-test/scores-v7-estfix.tsv)
- 11:52 trento-est: gens=31, windows done 30/37 (paint-test/scores-v7-estfix.tsv)
- 11:54 trento-est: gens=36, windows done 35/37 (paint-test/scores-v7-estfix.tsv)
- 12:20 estfix painting DONE: 37/37 est windows repainted, 37 pass + 0 soft, NCC 0.430-0.854 median 0.636; 38 Grok gens (37 + 13_0 rejected at 0.298, repainted).
  Templates: t3u-est (town), t3u-field (farmland: 12_1 0_-8 11_0 7_-4 6_-4 10_-2 11_1 15_2). 0_-8 re-accepted after the interrupted run had written windows/ without a log row.
  New scratch/dedot.py: fills isolated near-black blobs (model's black tree-marker dots, NCC/dark-patch pass them): 2_-5 (2 dots), 1_-5 (2 dots), originals in est/archive/predot.
  Counter fix: scratch/go3.sh "windows done" now counts only ORDER windows present in windows/ (was: all area windows -> "65/37").
  povo 4_-8 (0.469), 4_-7 (0.508) repainted: 2 pass, 2 gens (old in povo/archive/prebin/windows, log paint-test/scores-v7-povofix.tsv).
- 12:35 estfix close-out: clean.mts est 3 / povo 11 windows; seamfix est 9_-2 L, 15_3 L, 10_-2 T+L, 14_2 B, 15_2 L+B, 9_-1 T (originals in est/archive/preseam). Strict assemble est 63 / povo 47 art tiles, union 1053 overlaps, max 11.32, 0 > 12.
- 12:12 trento-sud: gens=5, windows done 5/5 (paint-test/scores-v7-binfix-sud.tsv)
- 12:55 binfix citta/sud/spini (cheap, done): re-scene with fixed scene.ts -> changed bins citta 63 / sud 39 / spini 20; re-rendered changed render tiles citta 51 / sud 37 / spini 11
  (old render+height in <area>/archive/prebin). rdiff >= 5000 px: citta -2_-5 -1_-5, sud 5_9 5_10 5_8 4_8 4_9, spini -19_-16 -20_-16 = 9 windows (old in <area>/archive/prebin/windows).
  Repainted 9/9 pass, NCC 0.550-0.897, 10 Grok gens (citta -1_-5 rejected once at 0.665 by the dark-patch check, regenerated -> 0.794). Logs paint-test/scores-v7-binfix-{citta,sud,spini}.tsv.
  clean.mts + strict assemble citta 78 art tiles, union 1053 overlaps, max 11.31, 0 > 12. (sud/spini re-assembled in the final close-out.)

### Run v7 rings NW1 trento-gardolo + W1 trento-ovest (Bogdan's extra request) — RESUME BLOCK
Terrain (Copernicus DSM, m asl, scratch/terrain.mts, 0.0005 deg): Adige east bank (OSM water polygon) 11.1038 @46.085, 11.091 @46.100, 11.0826 @46.125 -> the gap between
the river and nord/spini (west edge 11.098) is the Gardolo west strip; north of spini (46.125) is Lavis, not Gardolo, so no northern ring.
- trento-gardolo bbox 46.0820,11.0860 - 46.1250,11.0980: min 173 p50 201 p95 687 max 807 @46.0925,11.0860 (Vela/Sardagna slope at the SW corner), 15.0% > 507 m, 3.4% > 707.
- trento-ovest bbox 46.0540,11.0960 - 46.0820,11.1060 (Piedicastello, Doss Trento, Vela, Sardagna foot): min 190 p50 414 p95 689 max 896 @46.0540,11.0960, 37.4% > 507, 4.5% > 707.
Both need the 24-bit height (done). Setup: npm run fetch/ground/scene/render -- <area> -j 3 (scene.ts with the real-terrain binning).
Method: same as povo/martignano (ringsetup.sh, cycle.sh with AREA/CTX/ORDER/LOG/LOF, ~100 Grok gens per ring, threshold 0.4, paletteLimit 40, clean/rebase2/seamfix, strictall.sh).
Logs: paint-test/scores-v7-gardolo.tsv, paint-test/scores-v7-ovest.tsv.
- 12:31 trento-gardolo: gens=5, windows done 5/95 (paint-test/scores-v7-gardolo.tsv)
- 12:36 trento-gardolo: gens=10, windows done 10/95 (paint-test/scores-v7-gardolo.tsv)
- 12:40 trento-gardolo: gens=18, windows done 15/95 (paint-test/scores-v7-gardolo.tsv)
- 12:44 trento-gardolo: gens=23, windows done 20/95 (paint-test/scores-v7-gardolo.tsv)
- 12:45 trento-gardolo: gens=25, windows done 22/72 paint (95 incl. 23 strip-only) (paint-test/scores-v7-gardolo.tsv)
- 12:47 trento-gardolo: gens=28, windows done 25/95 (paint-test/scores-v7-gardolo.tsv)
- 12:48 trento-gardolo: gens=29, windows done 25/95 (paint-test/scores-v7-gardolo.tsv)
- 12:52 trento-gardolo: gens=36, windows done 30/95 (paint-test/scores-v7-gardolo.tsv)
- 12:53 trento-gardolo: gens=38, windows done 32/72 paint (paint-test/scores-v7-gardolo.tsv)
- 12:55 trento-gardolo: gens=41, windows done 35/95 (paint-test/scores-v7-gardolo.tsv)
- 12:58 trento-gardolo: gens=45, windows done 39/72 paint (paint-test/scores-v7-gardolo.tsv)
- 13:00 trento-gardolo: gens=46, windows done 40/95 (paint-test/scores-v7-gardolo.tsv)
- 13:02 trento-gardolo: gens=51, windows done 45/95 (paint-test/scores-v7-gardolo.tsv)
- 13:03 trento-gardolo: gens=52, windows done 46/72 paint (paint-test/scores-v7-gardolo.tsv)
- 13:09 trento-gardolo: gens=56, windows done 50/95 (paint-test/scores-v7-gardolo.tsv)
- 13:13 trento-gardolo: gens=61, windows done 55/72 paint (retries: -22_-7 villas on a warehouse roof (visual), -20_-9 0.397 soft + -21_-8 0.379 soft (meadow over rail yard) archived in archive/soft and repainted with specific prompts -> 0.908/0.782)
- 13:16 trento-gardolo: gens=63, windows done 55/95 (paint-test/scores-v7-gardolo.tsv)
- 13:18 trento-gardolo: gens=68, windows done 60/95 (paint-test/scores-v7-gardolo.tsv)
- 13:19 trento-gardolo: gens=68, windows done 62/72 paint (paint-test/scores-v7-gardolo.tsv)
- 13:25 trento-gardolo: gens=74, windows done 65/95 (paint-test/scores-v7-gardolo.tsv)
- 13:28 trento-gardolo: gens=77, windows done 70/72 paint (-25_-9 auto-rejected at 0.898 by the dark-patch check (black band full width), regenerated with exact black-rectangle wording -> 0.924; re-accepted after the aborted run lost its work/input.png)
- 13:30 trento-gardolo: gens=79, windows done 70/95 (paint-test/scores-v7-gardolo.tsv)
- 13:33 trento-gardolo: gens=81, windows done 75/95 (paint-test/scores-v7-gardolo.tsv)
- 13:34 trento-gardolo: gens=81, windows done 80/95 (paint-test/scores-v7-gardolo.tsv)
- 13:36 trento-gardolo: gens=81, windows done 85/95 (paint-test/scores-v7-gardolo.tsv)
- 13:37 trento-gardolo: gens=81, windows done 90/95 (paint-test/scores-v7-gardolo.tsv)
- 13:39 trento-gardolo: gens=81, windows done 95/95 (paint-test/scores-v7-gardolo.tsv)
- 13:55 trento-gardolo painting DONE: 95/95 windows (72 painted + 23 strip-only), 70 pass + 2 soft (-14_-2 0.391, -14_-3 0.411 flagged), NCC 0.391-0.975 median 0.738 (6 below 0.5); 83 Grok gens
  (72 accepted + 5 auto-rejected by score/dark-patch + 6 visual rejects: -15_-4 flat field, -19_-7 tracks as roads, -15_-1/-18_-4 returned unpainted, -22_-7 villas on a warehouse roof, -27_-11 flat field; plus -20_-9/-21_-8 softs repainted).
  Progress-line gens after 13:05 were one low (61->62, 68->69, 77->78). Templates t3u-est, t3u-spini (industrial), t3u-field (fields), explicit black-rectangle wording for edge windows. New scratch/striponly.sh, scratch/ringstats.py.
  Close-out gardolo: clean.mts 12 windows; rebase2 drift (-2,-1,+1) -> no rebase; seamfix -23_-11 bottom + -24_-10 right from -23_-10 (originals in gardolo/archive/preseam). Strict assemble 49 art tiles, union 1187 overlaps, max 11.37, 0 > 12.
- 14:05 trento-ovest ring setup: 56 windows, 22 shared (21 archived from owners and repainted here: citta 16, nord 3, gardolo 2 -> <owner>/archive/shared-ovest; -10_-3 reused), order 55 = paint 40 + strip-only 15.
  Resume ovest: `source scratch/env-ovest.sh; N=7 scratch/cycle.sh "<w> <assethash> <edges>" ...` (strip-only tail: scratch/striponly.sh).
- 13:49 trento-ovest: gens=1, windows done 0/55 (paint-test/scores-v7-ovest.tsv)
- 13:49 trento-ovest: gens=2, windows done 0/55 (paint-test/scores-v7-ovest.tsv)
- 13:49 trento-ovest: gens=3, windows done 0/55 (paint-test/scores-v7-ovest.tsv)
- 13:49 trento-ovest: gens=4, windows done 0/55 (paint-test/scores-v7-ovest.tsv)
- 13:49 trento-ovest: gens=5, windows done 0/55 (paint-test/scores-v7-ovest.tsv)
- 13:49 trento-ovest: gens=6, windows done 0/55 (paint-test/scores-v7-ovest.tsv)
- 13:49 trento-ovest: gens=7, windows done 0/55 (paint-test/scores-v7-ovest.tsv)
- 13:51 trento-ovest: gens=6, windows done 5/55 (paint-test/scores-v7-ovest.tsv)
- 13:59 trento-ovest: gens=12, windows done 10/55 (paint-test/scores-v7-ovest.tsv)
- 14:04 trento-ovest: gens=17, windows done 15/55 (paint-test/scores-v7-ovest.tsv)
- 14:12 trento-ovest: gens=22, windows done 20/55 (paint-test/scores-v7-ovest.tsv)
- 14:14 trento-ovest: gens=27, windows done 25/55 (paint-test/scores-v7-ovest.tsv)
- 14:15 trento-ovest: gens=28, windows done 25/55 (paint-test/scores-v7-ovest.tsv; -2_4 visual reject: invented houses/roads in forest)
- 14:20 PROGRESS MAP (ovest paused at 25/55, gens=30 incl. 5 aborted calls not counted as gens -> 30 = 28 + -2_4b + -5_4, both not yet accepted): shots/v7-progress-fullmap.png = stitched exported map z5 (scratch/stitch.mts map 5), 42 tiles x 512 px, 5120x3584. Export = 8 finished areas (citta, nord, sud, est, spini, povo, martignano, gardolo; ovest excluded), paint art assembled 13:40-13:44 (strictall, 0 > 12) before the ovest ring setup; export: 420 rendered / 420 painted tiles, map z8 1680 + z2-7 609, photo same, 4639 files.
  DEFECT seen in the map: unpainted flat render patches + a dark band at the citta/est/martignano/nord junction north of the centre. Paint tiles that are largely raw render: citta -1_-6 (57%), -3_-5 (34%), -2_-5 (21%), est -1_-6 (54%), sud 8_2 (51%), 9_3 (32%), nord -12_-4 (41%). Suspected cause: shared windows archived from an owner and then filled as strip-only (render copy) by the new ring (found: est->povo 3_-10,5_-7,6_-6,7_-5; nord->gardolo -12_-3,-13_-4,-14_-5; spini->gardolo -19_-9,-20_-10,-21_-11,-23_-12). Not fixed yet.
  Pending ovest: accept -2_4b (ab277a47...) right,left,top and -5_4 (177e97e8...) right,top; regenerate -4_5 -6_3 -7_2 -7_0 -8_1 (GenerateImage aborted).

## Raw-render defect fix (rawfix, 14:30)
Cause (confirmed): scratch/ringsetup.sh archived every shared window with a gap from its owner (archive/shared-<ring>) and then classified windows by the NEW area's own render coverage only; shared windows with <0.3 own coverage went to the strip-only tail and were filled with a raw render copy. That copy replaced the owner's painted content, and assemble (which takes the window via --context) put raw render inside the neighbour (and export last-wins put it on the map). Tools: scratch/winraw.py (per-window raw share), scratch/rawcheck.mts (close-out gate, 15x15 exactly-flat patches in art AND render inside the visible union, limit 5%, --windows blames covering windows), scratch/rawviz2.py (overlay).
Measured before fix (8 areas, 420 art tiles): 37 tiles > 5% raw (max: est 2_-8 89%, est -1_-6 45%, nord -4_-5 40%, citta -2_-5 32%, -3_-5 32%, -1_-5 25%; dark 0.0% everywhere). All 37 blame 23 strip-only windows that replaced painted shared windows:
  v5 est (from citta/sud): -1_-6 8_1 9_2 10_3; v6 spini (from nord): -14_-10; v7 povo (from est): 5_-7 6_-6 7_-5; v7 martignano (from citta/nord/est): -1_-7 -2_-6 -3_-6 -4_-6 -5_-6 -6_-6 -7_-7 2_-9; v7 gardolo (from nord/spini): -12_-3 -13_-4 -14_-5 -19_-9 -20_-10 -21_-11 -23_-12.
  The citta junction tiles: citta -1_-5 <- est -1_-6 + martignano -2_-6; citta -2_-5 <- martignano -2_-6/-3_-6; citta -3_-5 <- martignano -4_-6/-3_-6.
  Restore-only rejected: the archived owner versions are 3-28% black where the current render has content (the new ring's part was outside the owner's render).
Fix: ringsetup.sh now always paints repainted shared windows (never strip-only). Ovest (already set up) had 7 such windows in its strip-only list (-6_-1 -6_0 -7_-2 -7_-1 -8_-2 -11_-2 -12_-2): moved to paint (ovest order 55 = paint 47 + strip-only 8; old lists *.bak).
  The 23 windows: strip-only copies moved to <area>/archive/rawfix/, repainted with Grok (prep input = current render + painted neighbour strips). Resume: `source scratch/env-rawfix-<short>.sh; N=7 scratch/cycle.sh ...` (short = gardolo spini martignano est povo).
- 14:38 trento-martignano: gens=5, windows done 5/8 (paint-test/scores-v7-rawfix-martignano.tsv)
- 14:52 trento-gardolo: gens=5, windows done 5/7 (paint-test/scores-v7-rawfix-gardolo.tsv)
- 15:05 trento-ovest: gens=32, windows done 30/55 (paint-test/scores-v7-ovest.tsv)
- 15:10 rawfix painting DONE: 23/23 windows (martignano 8, gardolo 7, est 4, povo 3, spini 1), 23 Grok gens, 22 pass + 1 soft (gardolo -20_-10 0.39), scores 0.39-0.839. Seamfix gardolo -13_-4 bottom, -14_-4 bottom. strictall 8 areas: 1143 overlaps, max 11.74, 0 > 12.
  rawcheck after (8 areas): 2 failing (was 37): nord -10_-2 35.8%, gardolo -11_-2 7.3% -- both stale art tiles: they also need -12_-2, archived to gardolo/archive/shared-ovest and not repainted yet, so assemble skipped them. They reassemble once ovest paints -12_-2.
- 15:10 trento-ovest: gens=37, windows done 35/55 (paint-test/scores-v7-ovest.tsv)
- 15:14 trento-ovest: gens=42, windows done 40/55 (paint-test/scores-v7-ovest.tsv)
- 15:19 trento-ovest: gens=47, windows done 45/55 (paint-test/scores-v7-ovest.tsv)
- 15:22 trento-ovest: gens=49, windows done 50/55 (paint-test/scores-v7-ovest.tsv)
- 15:24 trento-ovest: gens=49, windows done 55/55 (paint-test/scores-v7-ovest.tsv)
- 15:36 ovest painting DONE 55/55; strictall 9 areas 1255 overlaps max 11.70 0>12; rawcheck 9 areas 447 tiles 0 failing. Export all 9 started.
- 16:20 DONE run v7 (Europe/Rome): export all 9 areas complete: paint coverage expected 447 / painted 447 / missing 0, map z8 1788 + z2-7 643, photo same, 4928 files. strictall 9 areas: 1255 overlaps, max 11.70, 0 > 12. rawcheck 9 areas: 447 art tiles, 0 > 5% (warn: gardolo -20_-11 2.4%, -20_-9 4.4%); before fix 37 tiles > 5% (8 areas, 420 tiles).
  Ovest: 55/55 (47 painted + 8 strip-only), 42 pass + 5 soft (-3_2 0.321, -2_3 0.339, -4_1 0.375, -4_3 0.329, -10_0 0.302), NCC 0.302-0.874 median 0.709, 49 scored Grok gens (+8 aborted calls, no image); clean 19 windows, drift (+2,+6,+8) -> no rebase, seamfix -8_-2 top (from nord -8_-3) + right (from -7_-2).
  Rome tests 32: 31 pass 1 skip 0 fail; tsc pipeline + web OK. Shots: shots/v7-1440x900, v7-390x844 (?at=46.0680,11.1010, Piedicastello/Sardagna foot), v7-zoomout-1440x900 (?at=46.0900,11.1100,8) + -render variants, 0 failed requests; shots/v7-zoomout-fullmap.png (stitch map z5, 43 tiles, 5120x3584) + v7-zoomout-fullmap-render.png.

### Run v8: black wedges / dark patch fix (16:10-)
Cause, two classes (measured with scratch/blackscan.mts, per art tile, art black vs render black inside the union):
- A) render-black inside the fade outline (ovest -3_3 11.2%, -2_3 5.5%, -2_4 8.5%, -3_4 7.5%, -4_3 6.4%; gardolo -17_-5 8.3%, -15_-4 1.0%, -13_-3 0.4%): the outline is the bbox
  projected at groundH (242 m), but at ovest/gardolo's south-west edge the terrain is 600-900 m, so the rendered ground ends up to ~1250 px inside the outline
  (ovest -3_3 black at inside-distance 1060-1240 px, fade EDGE1 1250 -> nearly opaque). Painting correctly kept it black; the export showed it (v7-1440x900 bottom-right, fullmap lower middle).
  Fix: export.ts fades render-black too: alpha = min(edge fade, blurred union-of-renders content mask (sigma 24 px, 0 at the content edge)); stamp +rbfade1 (all tiles re-exported).
- B) painting zeroed by clean.mts (v7-1440x900 top-centre = citta 2_-3 via est window 3_-4, 9.8% of it black): clean.mts built its keep-mask from `[area, ctx]` with ctx a csv,
  so only the own area's render counted; dark painted pixels (forest) where the own render was black/missing, i.e. inside a neighbour, were zeroed. Later runs wrote
  *.tmp.png without renaming (no-op: gardolo 12, ovest 19 leftovers moved to archive/cleantmp).
  Fix: scratch/cleandmg.py restored 36 windows pixel-exactly from the newest archived copy of the SAME painting (prenoise/predot/prebase, other pixels agree >99%):
  citta 1, est 9, martignano 7, nord 1, povo 7, sud 11 (old versions in <area>/archive/cleanbug/). No Grok repaint needed. clean.mts fixed (union of own + every ctx render, rename).
- rawcheck.mts gate extended: "black" = art pure black where ANY area's render has content (point-wise, catches speckled zeroing), limit 3% (BLIM), warn 1%.
  rawcheck before restore: 2 failing (citta 2_-3 black 6.3%, citta 2_2 black 3.3%); warn 1_-4 3.0%, 3_2 2.0%, 1_3 1.7%, 5_-6 1.7%, 0_0 1.1%, 0_4 1.0%.

### Run v8 plan: Bogdan's 3 red zones (shots/bogdan/zone-rosse.png) -> proposed rings (NOT painted yet)
Mapping: screenshot px -> fullmap px (map z5, 5120x3584 shown at x 107-943, y 48-633, scale 0.1635) -> global art px (x8, origin z5 tile -6,-4) -> lat/lon (inverse llhToPixel at groundH 242 m; scratch/zones.mts).
Loops: top lat 46.069-46.124 lon 11.095-11.175 (NE hills above nord/spini/martignano/povo); left lat 46.072-46.125 lon 11.058-11.096 (west bank NW: Vela/Soprasasso/Ischia Podetti/Cadine, NOT Lavis/Lamar);
bottom lat 46.031-46.089 lon 11.064-11.116 (Sardagna, Belvedere/upper Ravina; Romagnano at 46.020 is south of the loop).
Proposed areas (scratch/zoneplan.mts, Copernicus DSM m asl, windows from projected bbox x 0.96 calibrated on povo/martignano/gardolo/ovest, gens ~0.9 x windows):
| ring | area | bbox s,w,n,e | localities | DEM p50/p95/max | est windows | est gens |
| NE1 | trento-cortesano | 46.105,11.120,46.125,11.150 | Cortesano (46.124,11.133), Montevaccino (46.108,11.146), slopes below Gazzadina/Vigo Meano | 616/819/874 | 97 | ~87 |
| NE3 | trento-villamontagna | 46.080,11.150,46.105,11.175 | Villamontagna (46.086,11.159), east slope of Calisio | 656/888/1031 | 101 | ~91 |
| NE2 | trento-calisio | 46.095,11.124,46.105,11.150 | Monte Calisio (46.098,11.143) south slope, forest | 775/1027/1093 | 50 | ~45 |
| W3 | trento-vela-sud | 46.082,11.060,46.103,11.086 | Cadine (46.087,11.064), Bus de Vela gorge | 550/777/810 | 92 | ~83 |
| W2 | trento-vela-nord | 46.103,11.060,46.125,11.086 | Ischia Podetti (46.111,11.084), Soprasasso slope | 603/873/918 | 92 | ~83 |
| W4 | trento-sardagna | 46.054,11.078,46.082,11.096 | Sardagna (46.063,11.097, straddles ovest's west edge), slopes above Vela/Piedicastello | 781/1054/1151 | 85 | ~77 |
| SW1 | trento-ravina | 46.030,11.090,46.054,11.104 | slope above Ravina/Belvedere (Belvedere 46.046,11.105 is already in sud) | 561/1057/1247 | 63 | ~57 |
Totals: 7 areas, ~580 windows, ~523 Grok gens. Trimmed west edges: full-loop W4 (11.065) = 133 windows, max 1290; SW1 (11.080) = 95 windows, max 1557 (Bondone slope).
Localities geocoded with Nominatim (lat,lon above). Not covered by any loop: Meano (46.124,11.117) and Lamar (46.123,11.109) are already inside trento-spini; Vigo Meano (46.133) / Gazzadina (46.131) are north of the top loop (46.124) -> optional NE1 north extension to 46.136 (+~50 windows); Sopramonte (46.073,11.060) west of W4; Romagnano (46.018) south of the bottom loop.
Ring order: NE1 -> NE3 -> NE2 (adjoin nord/spini/martignano/povo, most built-up first) -> W3 -> W2 (adjoin gardolo) -> W4 -> SW1 (adjoin ovest/sud, steepest last).
Risks: steep slopes = forest-heavy, foreshortened windows and render-black gaps at outer edges (now faded by export rbfade1); 24-bit height covers 1557 m.
Overlay: shots/v8-plan-zones.png (proposed bboxes filled, painted areas dashed, Bogdan's loops red).
- 17:35 DONE v8 black-wedge close-out: seamfix est 1_-5 bottom (from citta 1_-4; restored pixels broke palette QA 13.17). strictall 9 areas: 1255 overlaps, max 11.35, 0 > 12.
  rawcheck after: 447 art tiles, 0 failing (before: 2 failing, citta 2_-3 black 6.3%, 2_2 3.3%); warn -20_-9 raw 4.4%, -20_-11 raw 2.4%, 0_0 black 1.1%.
  Export all 9 (rbfade1, every tile re-exported): 447/447 painted, map z8 1788 + z2-7 643, photo same, 4932 files. Exported z8 tiles with >1% pure black: 28 before (max 25.6%, ovest -3_3 quadrants) -> 4 after (max 1.9%, natural dark content).
  Rome tests 32: 31 pass 1 skip 0 fail; tsc pipeline + web OK. Shots: shots/v8-1440x900, v8-390x844, v8-zoomout-1440x900 (+ -render), 0 failed requests; shots/v8-zoomout-fullmap.png (+ -render), 43 z5 tiles, 5120x3584.
  The ovest/gardolo SW gaps now fade to the page background (beige wedge outline remains; W4 sardagna / SW1 ravina-monte will paint over them).

### Run v8 rings (Bogdan approved 17:16: 7 zones in the proposed order, no Vigo Meano extension) — RESUME BLOCK
Areas added to areas.ts: trento-cortesano, -villamontagna, -calisio, -vela-sud, -vela-nord, -sardagna, -ravina-monte (bboxes = v8 plan table).
Order: NE1 cortesano -> NE3 villamontagna -> NE2 calisio -> W3 vela-sud -> W2 vela-nord -> W4 sardagna -> SW1 ravina-monte.
Method per ring: npm run fetch/ground/scene/render -- <area> -j 3; scratch/ringsetup.sh <area> <ctx> paint-test/order-v8-<short>.txt paint-test/lo-v8-<short>.txt;
scratch/env-<short>.sh; N=7 scratch/cycle.sh (Grok GenerateImage, visual check every window), striponly.sh; clean.mts (fixed), rebase2, seamfix; strictall all areas; rawcheck all areas (0 failing).
- 17:26 trento-cortesano: gens=1, windows done 0/103 (paint-test/scores-v8-cortesano.tsv)
- 17:26 trento-cortesano: gens=2, windows done 0/103 (paint-test/scores-v8-cortesano.tsv)
- 17:26 trento-cortesano: gens=3, windows done 0/103 (paint-test/scores-v8-cortesano.tsv)
- 17:26 trento-cortesano: gens=4, windows done 0/103 (paint-test/scores-v8-cortesano.tsv)
- 17:26 trento-cortesano: gens=5, windows done 0/103 (paint-test/scores-v8-cortesano.tsv)
- 17:26 trento-cortesano: gens=6, windows done 0/103 (paint-test/scores-v8-cortesano.tsv)
- 17:26 trento-cortesano: gens=7, windows done 0/103 (paint-test/scores-v8-cortesano.tsv)
- 17:27 trento-cortesano: gens=8, windows done 0/103 (paint-test/scores-v8-cortesano.tsv)
- 17:29 trento-cortesano: gens=5, windows done 5/103 (paint-test/scores-v8-cortesano.tsv)
- 17:34 trento-cortesano: gens=10, windows done 10/104 (paint-test/scores-v8-cortesano.tsv)
- 17:40 trento-cortesano: gens=15, windows done 15/104 (paint-test/scores-v8-cortesano.tsv)
- 17:42 trento-cortesano: gens=20, windows done 20/104 (paint-test/scores-v8-cortesano.tsv)
- 17:58 NE1 cortesano: ringsetup 103 windows, shared 16 (repaint 16: nord 3, spini 13), paint 94 + strip-only 9; +1 extra shared: spini -14_-11 (its pale flat top-left lay inside cortesano) archived to spini/archive/shared-cortesano and repainted -> order 104.
  Note: data/derived/<new>/manual/ must exist before accept (first 7 accepts were logged 'rejected' for that reason; rows dropped, re-accepted). progress 20/104 done, gens 22 (2 rejected: -13_-11 pale flat area x2).
- 17:46 trento-cortesano: gens=27, windows done 25/104 (paint-test/scores-v8-cortesano.tsv)
- 17:51 trento-cortesano: gens=32, windows done 30/104 (paint-test/scores-v8-cortesano.tsv)
- 18:20 NE1 cortesano progress: 32/104 accepted, gens 36 (rejected: -13_-11 x2, -11_-15 0.216, -15_-16 0.211; -11_-15 pending regen).
- 17:57 trento-cortesano: gens=38, windows done 35/104 (paint-test/scores-v8-cortesano.tsv)
- 18:02 trento-cortesano: gens=44, windows done 40/104 (paint-test/scores-v8-cortesano.tsv)
- 18:06 trento-cortesano: gens=49, windows done 45/104 (paint-test/scores-v8-cortesano.tsv)
- 18:13 trento-cortesano: gens=54, windows done 50/104 (paint-test/scores-v8-cortesano.tsv)
- 18:15 trento-cortesano: gens=59, windows done 55/104 (paint-test/scores-v8-cortesano.tsv)
- 18:17 NE1 cortesano RESUME: 56/104 accepted, gens 64 (rejected: -13_-11 x2, -11_-15, -15_-16, -13_-16, -16_-16 by score; -8_-15 visual (invented houses), -11_-16 visual (left flat placeholder)). Continue: source scratch/env-cortesano.sh; N=7 scratch/cycle.sh
- 18:21 trento-cortesano: gens=64, windows done 60/104 (paint-test/scores-v8-cortesano.tsv)
- 18:26 trento-cortesano: gens=69, windows done 65/104 (paint-test/scores-v8-cortesano.tsv)
- 18:31 trento-cortesano: gens=75, windows done 70/104 (paint-test/scores-v8-cortesano.tsv)
- 18:37 trento-cortesano: gens=80, windows done 75/104 (paint-test/scores-v8-cortesano.tsv)
- 18:39 trento-cortesano: gens=85, windows done 80/104 (paint-test/scores-v8-cortesano.tsv)
- 18:40 NE1 cortesano: 80/104 accepted, gens 92
- 18:45 trento-cortesano: gens=90, windows done 85/104 (paint-test/scores-v8-cortesano.tsv)
- 18:51 trento-cortesano: gens=95, windows done 90/104 (paint-test/scores-v8-cortesano.tsv)
- 18:59 trento-cortesano: gens=100, windows done 95/104 (paint-test/scores-v8-cortesano.tsv)
- 19:00 trento-cortesano: gens=100, windows done 100/104 (paint-test/scores-v8-cortesano.tsv)
- 19:27 DONE NE1 trento-cortesano (Europe/Rome): 104 windows = 95 painted + 9 strip-only; 87 pass + 8 soft (0.3-0.4), NCC 0.317-0.984 (median 0.639); Grok gens 109 (incl. visual rejects + 2 palette repaints); 56 render tiles, OSM 314, LiDAR 270/314 (86.0%).
  Close-out: clean.mts 1 window (-6_-17); rebase2 drift (+12,+9,+9) -> --apply made strict worse (max 16.37), reverted from archive/prebase; seamfix -14_-11 T/L/B, -14_-18 T/R, -15_-19 R/T, -20_-14 (spini) R (originals archive/preseam);
  -14_-20 baked +20/+15/+10 RGB on non-black px (offset clamped at 40; original archive/preshift); -13_-19 + -14_-19 repainted (Grok, 0.656/0.887; old in archive/prerepaint).
  strictall 10 areas: 1420 overlaps, max 11.55, 0 > 12. rawcheck 10 areas: 503 art tiles, 0 failing (warn -20_-11 raw 2.4%, -20_-9 raw 4.4%, 0_0 black 1.1%).
  Prepared ahead: fetch/ground/scene/render calisio 23, vela-sud 51, vela-nord 52 tiles; sardagna (4 tiles failed: -4_6 -7_7 -6_7 -5_7) and ravina-monte render incomplete -> rerun before their ring.
- 19:28 NE3 villamontagna RESUME BLOCK: ringsetup 97 windows, shared 17 repainted (povo 10, martignano 7; originals in <owner>/archive/shared-villamontagna), paint 86 + strip-only 11.
  Continue: source scratch/env-villamontagna.sh; N=7 scratch/cycle.sh "<w> <asset-hash> <edges>" ...; then striponly.sh; close-out as cortesano.
- 19:33 trento-villamontagna: gens=5, windows done 5/97 (paint-test/scores-v8-villamontagna.tsv)
- 19:38 trento-villamontagna: gens=10, windows done 10/97 (paint-test/scores-v8-villamontagna.tsv)
- 19:42 trento-villamontagna: gens=15, windows done 15/97 (paint-test/scores-v8-villamontagna.tsv)
- 19:45 trento-villamontagna: gens=20, windows done 20/97 (paint-test/scores-v8-villamontagna.tsv)
- 19:45 trento-villamontagna: gens=21, windows done 20/97 (paint-test/scores-v8-villamontagna.tsv)
- 19:50 trento-villamontagna: gens=25, windows done 25/97 (paint-test/scores-v8-villamontagna.tsv)
- 19:56 trento-villamontagna: gens=30, windows done 30/97 (paint-test/scores-v8-villamontagna.tsv)
- 20:04 trento-villamontagna: gens=35, windows done 35/97 (paint-test/scores-v8-villamontagna.tsv)
- 20:09 trento-villamontagna: gens=41, windows done 40/97 (paint-test/scores-v8-villamontagna.tsv)
- 20:14 trento-villamontagna: gens=46, windows done 45/97 (paint-test/scores-v8-villamontagna.tsv)
- 20:21 trento-villamontagna: gens=51, windows done 50/97 (paint-test/scores-v8-villamontagna.tsv)
- 20:23 villamontagna progress: 53/86 paint windows accepted (log rows 55 incl. 1 rejected+retry); depurple.py added (recolours model's purple tree balls; 4_-12, -4_-15). Resume: source scratch/env-villamontagna.sh, next batch from cycle output (0_-15 3_-15 5_-15 -3_-16 -1_-16 2_-16 4_-16).
- 20:29 trento-villamontagna: gens=56, windows done 55/97 (paint-test/scores-v8-villamontagna.tsv)
- 20:32 trento-villamontagna: gens=61, windows done 60/97 (paint-test/scores-v8-villamontagna.tsv)
- 20:36 trento-villamontagna: gens=66, windows done 65/97 (paint-test/scores-v8-villamontagna.tsv)
- 20:47 trento-villamontagna: gens=73, windows done 70/97 (paint-test/scores-v8-villamontagna.tsv)
- 20:52 trento-villamontagna: gens=78, windows done 75/97 (paint-test/scores-v8-villamontagna.tsv)
- 20:58 trento-villamontagna: gens=84, windows done 80/97 (paint-test/scores-v8-villamontagna.tsv)
- 21:02 trento-villamontagna: gens=89, windows done 85/97 (paint-test/scores-v8-villamontagna.tsv)
- 21:05 trento-villamontagna: gens=90, windows done 90/97 (paint-test/scores-v8-villamontagna.tsv)
- 21:07 trento-villamontagna: gens=90, windows done 95/97 (paint-test/scores-v8-villamontagna.tsv)
- 21:40 DONE NE3 trento-villamontagna (Europe/Rome): 97 windows = 86 painted + 11 strip-only; 66 pass + 20 soft (paint.ts gate), logged match NCC 0.177-0.929 (median 0.524); 4 gate rejects regenerated; Grok gens 93 (90 logged + 3 unlogged visual/score rejects: 2_-18 invented asphalt road, -2_-17 x2 flat/unpainted look); 56 render tiles, OSM 366, LiDAR 322/366 (88.0%).
  Close-out: depurple.py 4_-12, -4_-15; clean.mts 0 windows; seamfix -2_-13 L(from martignano -3_-13)/B(-2_-12), 7_-11 B(povo 7_-10), 9_-12 B(povo 9_-11), martignano -3_-13 B(-3_-12) (originals archive/preseam); first strict had 5 > 12 (max 18.54).
  strictall 11 areas: 1578 overlaps, max 11.81, 0 > 12. rawcheck 11 areas: 559 art tiles, 0 failing (warn -20_-11 raw 2.4%, -20_-9 raw 4.4%, 0_0 black 1.3%).
- 21:24 NE2 calisio RESUME BLOCK: ringsetup 42 windows, shared 28 repainted (martignano 12, nord 3, cortesano 13... see /tmp/setup-calisio-ring.log; originals in <owner>/archive/shared-calisio), paint 42 + strip-only 0. Continue: source scratch/env-calisio.sh; N=7 scratch/cycle.sh ...; close-out as villamontagna.
- 21:27 trento-calisio: gens=1, windows done 0/42 (paint-test/scores-v8-calisio.tsv)
- 21:27 trento-calisio: gens=2, windows done 0/42 (paint-test/scores-v8-calisio.tsv)
- 21:27 trento-calisio: gens=3, windows done 0/42 (paint-test/scores-v8-calisio.tsv)
- 21:27 trento-calisio: gens=4, windows done 0/42 (paint-test/scores-v8-calisio.tsv)
- 21:27 trento-calisio: gens=5, windows done 0/42 (paint-test/scores-v8-calisio.tsv)
- 21:27 trento-calisio: gens=6, windows done 0/42 (paint-test/scores-v8-calisio.tsv)
- 21:30 trento-calisio: gens=5, windows done 5/42 (paint-test/scores-v8-calisio.tsv)
- 21:37 trento-calisio: gens=10, windows done 10/42 (paint-test/scores-v8-calisio.tsv)
- 21:53 trento-calisio: gens=15, windows done 15/42 (paint-test/scores-v8-calisio.tsv)
- 21:57 trento-calisio: gens=21, windows done 20/42 (paint-test/scores-v8-calisio.tsv)
- 22:02 trento-calisio: gens=28, windows done 25/42 (paint-test/scores-v8-calisio.tsv)
- 22:12 trento-calisio: gens=35, windows done 30/42 (paint-test/scores-v8-calisio.tsv)
- 22:19 trento-calisio: gens=40, windows done 35/42 (paint-test/scores-v8-calisio.tsv)
- 22:25 trento-calisio: gens=46, windows done 40/42 (paint-test/scores-v8-calisio.tsv)
- 22:52 DONE NE2 trento-calisio (Europe/Rome): 42 windows = 42 painted (28 shared repainted) + 0 strip-only; 33 pass + 9 soft (paint.ts gate), logged match NCC 0.310-0.885 (median 0.532); gate rejects regenerated: -3_-13, -11_-11 x2, -9_-13 x2, -8_-13 (6 logged rejects); Grok gens 63 (assets 21:24-22:50; 48 logged rows + 15 unlogged visual/score rejects, mostly flat-forest prompt trials: gouache-flat look, wrong window match); 23 render tiles, 13 scene bins, few buildings (Rifugio Calisio, LiDAR median 6 m).
  Close-out: clean.mts 0 windows; seamfix calisio -7_-11 B(-7_-10), cortesano -7_-18 L(-8_-18), cortesano -7_-17 L(-8_-17) (first strict 2 > 12, max 15.65; originals archive/preseam).
  rawcheck found nord -8_-8 raw 37.4%: martignano -9_-9 was a strip-only copy (v7 ringsetup bug) whose raw core had been hidden by martignano's old -9_-10; calisio's repaint of -9_-10 exposed it. Fix: restored nord's painted -9_-9 (archive/shared-martignano) into martignano/windows (raw copy -> martignano/archive/rawfix2). No Grok.
  strictall 12 areas: 1616 overlaps, max 11.58, 0 > 12. rawcheck 12 areas: 582 art tiles, 0 failing (warn -20_-11 raw 2.4%, -20_-9 raw 4.4%, 0_0 black 1.3%).
- 22:55 W3 vela-sud RESUME BLOCK: ringsetup 95 windows, shared 14 repainted (gardolo 14; originals in trento-gardolo/archive/shared-vela-sud), paint 81 + strip-only 14 (paint-test/lo-v8-vela-sud.txt). Continue: source scratch/env-vela-sud.sh; N=5 scratch/cycle.sh "<w> <asset-hash> <edges>" ...; then striponly.sh; close-out as calisio.
- 22:59 trento-vela-sud: gens=1, windows done 0/95 (paint-test/scores-v8-vela-sud.tsv)
- 22:59 trento-vela-sud: gens=2, windows done 0/95 (paint-test/scores-v8-vela-sud.tsv)
- 22:59 trento-vela-sud: gens=3, windows done 0/95 (paint-test/scores-v8-vela-sud.tsv)
- 23:06 trento-vela-sud: gens=6, windows done 5/95 (paint-test/scores-v8-vela-sud.tsv)
- 23:08 vela-sud progress: 7/95 windows accepted (7 painted). Notes: manual/ dir had to be created (first 3 accepts were falsely rejected; log reset). Forest prompt that passes the gate: "muted, low-contrast woodland seen from far away ... soft painterly dabs" (sharp textured crowns score 0.16-0.22 vs flat input; "Edit ... fill only" prompts return the input unpainted). -20_-5: 1500 px of model black outside the render-black corner restored from the input strip before accept. Unlogged visual/score rejects so far: b7866a2b d3521382 d3608953 e089102d dda06a2b d8862e10 9cf108d7 + 3 aborted gens.
  Resume: source scratch/env-vela-sud.sh; pending -19_-4 asset 7a953ba2 (scored 0.577); next batch -15_0 -16_-1 -18_-2 -21_-5 (right,top).
- 23:11 trento-vela-sud: gens=11, windows done 10/95 (paint-test/scores-v8-vela-sud.tsv)
- 23:17 trento-vela-sud: gens=16, windows done 15/95 (paint-test/scores-v8-vela-sud.tsv)
- 23:22 trento-vela-sud: gens=21, windows done 20/95 (paint-test/scores-v8-vela-sud.tsv)
- 23:29 trento-vela-sud: gens=27, windows done 25/95 (paint-test/scores-v8-vela-sud.tsv)
- 23:31 vela-sud progress: 25/95 accepted (log rows 27).
- 23:36 trento-vela-sud: gens=32, windows done 30/95 (paint-test/scores-v8-vela-sud.tsv)
- 23:41 trento-vela-sud: gens=37, windows done 35/95 (paint-test/scores-v8-vela-sud.tsv)
- 23:43 vela-sud progress: 35/95 accepted (gens 37 logged + 18 unlogged rejects). Assets now copied to paint-test/gen/ right after generation (one asset went 0 bytes in the store before accept).
- 23:47 trento-vela-sud: gens=42, windows done 40/95 (paint-test/scores-v8-vela-sud.tsv)
- 23:53 trento-vela-sud: gens=47, windows done 45/95 (paint-test/scores-v8-vela-sud.tsv)
- 23:54 vela-sud progress: 45/95 accepted (log rows 47).
- 23:58 trento-vela-sud: gens=52, windows done 50/95 (paint-test/scores-v8-vela-sud.tsv)
- 00:01 vela-sud progress: 50/95 accepted (log rows 52). Resume: source scratch/env-vela-sud.sh; next batch from /tmp/cyc14.log.
- 00:05 trento-vela-sud: gens=57, windows done 55/95 (paint-test/scores-v8-vela-sud.tsv)
- 00:07 vela-sud progress: 55/95 accepted (log rows 57).
- 00:12 trento-vela-sud: gens=62, windows done 60/95 (paint-test/scores-v8-vela-sud.tsv)
- 00:13 vela-sud progress: 60/95 accepted (log rows 62).
- 00:18 trento-vela-sud: gens=67, windows done 65/95 (paint-test/scores-v8-vela-sud.tsv)
- 00:20 vela-sud progress: 65/95 accepted (log rows 67); -23_2 out-of-union black over strip patched from input (3.1% px).
- 00:28 vela-sud: -25_0 gen a1f2e5cb visual reject (flat/unpainted look, unscored). -25_-2 0.28 + -25_0 0.363 logged rejects, regenerated.
- 00:28 trento-vela-sud: gens=74, windows done 70/95 (paint-test/scores-v8-vela-sud.tsv)
- 00:35 trento-vela-sud: gens=79, windows done 75/95 (paint-test/scores-v8-vela-sud.tsv)
- 00:37 vela-sud progress: 76/95 accepted (log rows 80).
- 00:41 vela-sud: -26_1 gen af5c58b3 filled out-of-union black with pale green; re-blacked from input (65.6% px, all outside union) -> paint-test/gen/af5c58b3reblack.png. -27_0 gen 482df96c visual reject (band left flat/raw, 0.99), regenerated.
- 00:47 trento-vela-sud: gens=84, windows done 80/95 (paint-test/scores-v8-vela-sud.tsv)
- 00:49 vela-sud progress: 80/95 accepted (log rows 84); remaining paint -28_-1, then striponly.sh (14).
- 00:54 trento-vela-sud: gens=85, windows done 85/95 (paint-test/scores-v8-vela-sud.tsv)
- 00:58 trento-vela-sud: gens=85, windows done 90/95 (paint-test/scores-v8-vela-sud.tsv)
- 01:01 trento-vela-sud: gens=85, windows done 95/95 (paint-test/scores-v8-vela-sud.tsv)
- 01:25 DONE W3 trento-vela-sud (Europe/Rome): 95 windows = 81 painted (14 shared gardolo repainted) + 14 strip-only; 81 pass + 0 soft (paint.ts gate), logged match NCC 0.403-0.967 (median 0.764, 4 below 0.5); logged gate rejects regenerated: -25_-2 0.28, -25_0 0.363 (+1 earlier), 1 lost-file row; Grok gens ~97 (85 logged painting rows + ~12 unlogged visual rejects: flat/unpainted looks, -27_0 band left raw, -25_0 flat trace). Post-fixes: -23_2 and -20_-5 model black over strip restored from input; -26_1 out-of-union fill re-blacked from input; depurple -20_-1 -21_1, dedot -22_-2.
  Close-out: clean.mts 0 windows; strictall 13 areas: 1769 overlaps, max 11.58, 0 > 12 (no seamfix needed). rawcheck 13 areas: 633 art tiles, 0 failing (warn -20_-11 raw 2.4%, -20_-9 raw 4.4%, 0_-1 black 1.0%, 0_0 black 1.3%).
- 01:30 W2 vela-nord RESUME BLOCK: ringsetup 91 windows, shared 24 repainted (gardolo 12, vela-sud 12; originals in <owner>/archive/shared-vela-nord), paint 82 + strip-only 9 (paint-test/lo-v8-vela-nord.txt). Continue: source scratch/env-vela-nord.sh; N=5 scratch/cycle.sh "<w> <asset-hash|/abs/path> <edges>" ...; scratch/batch.sh to copy+score+darkfix; then striponly.sh; close-out as vela-sud.
- 01:39 vela-nord progress: 4/91 accepted (log rows 4); -21_-6 gen 392649e7 visual reject (flat raw-looking bank band, 0.912), regenerated b6d6df2e.
- 01:41 trento-vela-nord: gens=6, windows done 5/91 (paint-test/scores-v8-vela-nord.tsv)
- 01:47 trento-vela-nord: gens=12, windows done 10/91 (paint-test/scores-v8-vela-nord.tsv)
- 01:52 vela-nord progress: 13/91 accepted (log rows 15).
- 01:54 trento-vela-nord: gens=17, windows done 15/91 (paint-test/scores-v8-vela-nord.tsv)
- 02:00 vela-nord: -26_-5 gen 1d40ce54 visual reject (left third left flat/unpainted), regenerated 4794945c.
- 02:01 trento-vela-nord: gens=22, windows done 20/91 (paint-test/scores-v8-vela-nord.tsv)
- 02:09 trento-vela-nord: gens=27, windows done 25/91 (paint-test/scores-v8-vela-nord.tsv)
- 02:14 vela-nord progress: 30/91 accepted; depurple -26_-10.
- 02:16 vela-nord: -26_-6 gen 066b70a9 visual reject (middle left flat); -27_-4 gen 400f8261 gate reject 0.251, gen bfe1e169 visual reject (unpainted).
- 02:18 trento-vela-nord: gens=34, windows done 30/91 (paint-test/scores-v8-vela-nord.tsv)
- 02:28 trento-vela-nord: gens=40, windows done 35/91 (paint-test/scores-v8-vela-nord.tsv)
- 02:33 vela-nord progress: 37/91 accepted. Note: -27_-3 and -27_-5 woodland painted as grassy/shrub texture (passes, softer than neighbours).
- 02:35 trento-vela-nord: gens=45, windows done 40/91 (paint-test/scores-v8-vela-nord.tsv)
- 02:45 trento-vela-nord: gens=52, windows done 45/91 (paint-test/scores-v8-vela-nord.tsv)
- 02:47 trento-vela-nord: gens=57, windows done 50/91 (paint-test/scores-v8-vela-nord.tsv)
- 02:49 vela-nord progress: 50/91 accepted; -29_-7 rejects 0.197, 0.296 (gate), accepted ed51fe8c 0.404.
- 02:52 vela-nord: -29_-8 rejects 0.377/0.363 (dense wood); sparse faint-dab wording scored 0.783 (0cb2eca6) — using as T-wood-sparse.
- 03:01 trento-vela-nord: gens=64, windows done 55/91 (paint-test/scores-v8-vela-nord.tsv)
- 03:06 vela-nord progress: 59/91 accepted.
- 03:08 vela-nord: -30_-8 a0d660b1 and -31_-7 e204a4a1 visual reject (sparse wording went too flat/near-raw); -30_-8 b690bf9d gate reject 0.043.
- 03:08 trento-vela-nord: gens=70, windows done 60/91 (paint-test/scores-v8-vela-nord.tsv)
- 03:15 vela-nord: -30_-8 gate rejects 0.286, 0.335; accepting a0d660b1 (0.659, sparse, matches accepted -30_-7 look).
- 03:17 trento-vela-nord: gens=77, windows done 65/91 (paint-test/scores-v8-vela-nord.tsv)
- 03:21 trento-vela-nord: gens=82, windows done 70/91 (paint-test/scores-v8-vela-nord.tsv)
- 03:25 vela-nord progress: 70/91 accepted.
- 03:29 trento-vela-nord: gens=87, windows done 75/91 (paint-test/scores-v8-vela-nord.tsv)
- 03:44 vela-nord progress: 79/91 accepted.
- 03:46 trento-vela-nord: gens=92, windows done 80/91 (paint-test/scores-v8-vela-nord.tsv)
- 03:58 vela-nord: 82/82 paint windows accepted; running striponly (9).
- 03:59 trento-vela-nord: gens=94, windows done 85/91 (paint-test/scores-v8-vela-nord.tsv)
- 04:02 trento-vela-nord: gens=94, windows done 90/91 (paint-test/scores-v8-vela-nord.tsv)
- 04:10 vela-nord: striponly 9/9 logged (rows 95-103); 91/91 windows. Close-out starting.
  vela-nord close-out: clean.mts 0 windows; rebase2 drift (-6,-5,-6) -> no rebase.
  05:00 vela-nord strictall 14 areas (first): 1902 overlaps, 1 > 12: vela-nord -24_-7 / gardolo -24_-8 13.83 -> seamfix vela-nord -24_-7 top from gardolo -24_-8 (original archive/preseam).
  05:00 vela-nord strictall 14 areas (after seamfix): 1902 overlaps, max 11.62, 0 > 12 (all 14 assembled OK).
  05:13 vela-nord rawcheck 14 areas: 685 art tiles, 0 failing (warn -20_-11 raw 2.4%, -20_-9 raw 4.4%, -26_-6 raw 3.5% [new, vela-nord], 0_0 black 1.3%).
  05:34 vela-nord export: npm run export -- trento-vela-nord trento-gardolo trento-vela-sud -> 152/152 painted, 6050 files, exit 0 (note: world.json now lists only these 3 areas; the final all-16 export restores the full set).
- 05:34 DONE W2 trento-vela-nord (Europe/Rome): 91 windows = 82 painted (24 shared repainted: gardolo 12, vela-sud 12) + 9 strip-only; 82 pass + 0 soft (paint.ts gate), logged match NCC 0.403-0.987 (median 0.786, 9 below 0.5, 0 below 0.4); 12 logged gate rejects regenerated (-24_-5 0.296, -24_-7 0.385, -27_-4 0.251/0.313, -28_-7 0.196, -29_-7 0.197/0.296, -29_-8 0.377/0.363, -30_-8 0.043/0.286/0.335); Grok gens ~100 (98 archived in paint-test/gen + unscored visual rejects: -21_-6 flat bank, -26_-5/-26_-6 flat left, -27_-4 unpainted, -31_-7 too sparse); depurple -26_-10. Learned: on flat forest inputs a sparse faint-dab wording scores 0.6-0.97 where dense canopy scores 0.04-0.38.
  Close-out: clean.mts 0 windows; rebase2 drift (-6,-5,-6) -> no rebase; seamfix -24_-7 T(gardolo -24_-8); strictall 14 areas 1902 overlaps max 11.62, 0 > 12; rawcheck 14 areas 685 art tiles 0 failing; 52 render tiles.
- 05:40 W4 sardagna prep: render tiles -6_7 -5_7 -4_6 -7_7 fail consistently as 'blank render'; they lie fully below the terrain edge (row-6 tiles above are 100% black in their bottom 50 px), so written as empty renders (opaque black, zero height); 45/45 render tiles, manifest written.
- 05:41 W4 sardagna RESUME BLOCK: ringsetup 79 windows, shared 22 repainted (ovest 16, gardolo 3, vela-sud 3; originals in <owner>/archive/shared-sardagna), paint 67 + strip-only 12 (paint-test/lo-v8-sardagna.txt). Continue: source scratch/env-sardagna.sh; N=5 scratch/cycle.sh "<w> <asset-hash|/abs/path> <edges>" ...; scratch/batch.sh; then striponly.sh; close-out as vela-nord.
- 05:47 trento-sardagna: gens=5, windows done 5/79 (paint-test/scores-v8-sardagna.tsv)
- 05:47 SW1 ravina-monte prep: render -j 1 retries filled -1_7 0_7 0_8 1_8; -3_7 -2_7 -1_8 return 'blank render' every time (singly, fresh browser, ss 1 and 2). -3_7 lies below a 100%-black edge (genuinely empty); -2_7 and -1_8 touch neighbours whose edges have content, so they are probably a renderer footprint/edge limitation at the south rim. Written as empty renders (black, zero height) so the ring can proceed; at export rbfade1 fades these to the page background. Caveat for the report. 31/31 render tiles.
- 05:50 sardagna progress: 6/79 accepted (rows 1-6).
- 05:53 sardagna: -7_3 gen 11901932 visual reject (returned unpainted).
- 05:56 trento-sardagna: gens=10, windows done 10/79 (paint-test/scores-v8-sardagna.tsv)
- 05:58 sardagna progress: 12/79 accepted (rows 12). Note: cycle.sh needs full hash/abs path; use scratch/cyc2.sh "<w> <prefix> <edges>" (resolves to paint-test/gen). Bogus rows 7-11 from a prefix-only call were removed from the log.
- 06:01 trento-sardagna: gens=15, windows done 15/79 (paint-test/scores-v8-sardagna.tsv)
- 06:04 sardagna progress: 18/79 accepted (rows 18).
- 06:07 trento-sardagna: gens=20, windows done 20/79 (paint-test/scores-v8-sardagna.tsv)
- 06:10 sardagna progress: 24/79 accepted (rows 24).
- 06:12 sardagna: -11_2 gen 8528d98c visual reject (meadow + gravel patches left flat, 0.897).
- 06:12 trento-sardagna: gens=25, windows done 25/79 (paint-test/scores-v8-sardagna.tsv)
- 06:16 sardagna progress: 29/79 accepted (rows 29); -11_2 retry a1756718 scored 0.906 (pending accept).
- 06:18 trento-sardagna: gens=30, windows done 30/79 (paint-test/scores-v8-sardagna.tsv)
- 06:20 trento-sardagna: gens=35, windows done 35/79 (paint-test/scores-v8-sardagna.tsv)
- 06:21 sardagna progress: 35/79 accepted (rows 35).
- 06:23 sardagna: -9_6 gen f1b9fcb4 visual reject (model blacked out the bottom road band; darkfix would leave it raw).
- 06:26 trento-sardagna: gens=40, windows done 40/79 (paint-test/scores-v8-sardagna.tsv)
- 06:27 sardagna progress: 40/79 accepted (rows 40); -9_6 retry dc335483 0.848 pending.
- 06:31 trento-sardagna: gens=45, windows done 45/79 (paint-test/scores-v8-sardagna.tsv)
- 06:33 sardagna progress: 46/79 accepted (rows 46).
- 06:36 sardagna batch -9_7 -10_6 -12_5 -12_3 -13_4 -13_0 scored 0.748-0.912, accepting (csd11).
- 06:38 trento-sardagna: gens=50, windows done 50/79 (paint-test/scores-v8-sardagna.tsv)
- 06:43 sardagna progress: 52/67 paint windows accepted (rows 52; -9_6 retry dc335483 accepted as row 41, 0.851).
- 06:44 sardagna: -13_1 c5b3b898 0.409 visual reject (dropped top black band); -13_-1 01f89228 0.403 held (marginal, retry); accepting -10_7 0.875 -11_6 0.875 -13_5 0.955 -13_3 0.856.
- 06:46 trento-sardagna: gens=55, windows done 55/79 (paint-test/scores-v8-sardagna.tsv)
- 06:49 sardagna progress: 56/67 paint accepted; -13_1 retry 61361a75 0.955 and -13_-1 retry f620ec20 0.523 pending.
- 06:50 sardagna: accepting -13_1 0.955 -13_-1 0.523 -11_7 0.958 -12_6 0.973 -14_3 0.841 -15_2 0.963 (csd13).
- 06:52 trento-sardagna: gens=60, windows done 60/79 (paint-test/scores-v8-sardagna.tsv)
- 06:55 sardagna progress: 62/67 paint accepted.
- 06:56 sardagna: accepting -14_1 0.925 -14_4 0.91 -15_3 0.939 (csd14).
- 06:57 trento-sardagna: gens=65, windows done 65/79 (paint-test/scores-v8-sardagna.tsv)
- 06:59 sardagna progress: 65/67 paint accepted.
- 07:00 sardagna: accepting -14_2 0.889 -15_1 0.843 (csd15, last paint windows).
- 07:03 sardagna: 67/67 paint windows accepted; running striponly (12).
- 07:04 trento-sardagna: gens=67, windows done 70/79 (paint-test/scores-v8-sardagna.tsv)
- 07:06 trento-sardagna: gens=67, windows done 75/79 (paint-test/scores-v8-sardagna.tsv)
- 07:09 sardagna: striponly 12/12 logged (rows 68-79); 79/79 windows. Assembly flagged 1 overlap > 12: sardagna -4_6 / ovest -3_6 12.29. Close-out starting.
  sardagna close-out: clean.mts 1 window (-11_5, 1169 px); rebase2 drift (-3,+1,+7) -> no rebase.
  07:23 sardagna seamfix -4_6 R(ovest -3_6) (original archive/preseam); strictall 15 areas: 2016 overlaps, max 11.56, 0 > 12 (all 15 assembled OK, sardagna 45 art tiles).
  07:38 sardagna rawcheck 15 areas: 730 art tiles, 0 failing (warn -20_-11 raw 2.4%, -20_-9 raw 4.4%, -26_-6 raw 3.5%, 0_0 black 1.3%; nothing new from sardagna).
  07:46 sardagna export: npm run export -- trento-sardagna trento-ovest trento-gardolo trento-vela-sud -> 172/172 painted, 6534 files, exit 0 (world.json lists these 4; final all-16 export restores the set). Not published.
- 07:46 DONE W4 trento-sardagna (Europe/Rome): 79 windows = 67 painted (22 shared repainted: ovest 16, gardolo 3, vela-sud 3) + 12 strip-only; 67 pass + 0 soft (paint.ts gate), logged match NCC 0.524-0.994 (median 0.853, 0 below 0.5); 0 logged gate rejects; Grok gens ~73 (67 accepted + visual rejects -7_3 unpainted, -11_2 flat patches, -9_6 blacked road band, -13_1 dropped black band, -13_-1 0.403 held and regenerated to 0.523).
  Close-out: clean.mts 1 window (-11_5); rebase2 drift (-3,+1,+7) -> no rebase; seamfix -4_6 R(ovest -3_6); strictall 15 areas 2016 overlaps max 11.56, 0 > 12; rawcheck 15 areas 730 art tiles 0 failing; 45 render tiles (4 empty below terrain edge: -6_7 -5_7 -4_6 -7_7).
- 07:46 SW1 ravina-monte RESUME BLOCK: ringsetup 62 windows, shared 19 repainted (sud 12, ovest 4, sardagna 2, citta 1; originals in <owner>/archive/shared-ravina-monte), paint 48 + strip-only 14 (paint-test/lo-v8-ravina-monte.txt). Continue: source scratch/env-ravina-monte.sh; N=6 scratch/cyc2.sh "<w> <prefix> <edges>" ...; scratch/batch.sh; then striponly.sh; close-out as sardagna.
- 07:48 ravina-monte batch 1: 0_5 0.747 -2_5 0.857 -3_6 0.798 2_6 0.578 -4_7 0.89 3_7 0.716, accepting (crm1); 3_7 kept purple tree ball -> depurple after accept.
- 07:48 trento-ravina-monte: gens=1, windows done 0/62 (paint-test/scores-v8-ravina-monte.tsv)
- 07:48 trento-ravina-monte: gens=2, windows done 0/62 (paint-test/scores-v8-ravina-monte.tsv)
- 07:48 trento-ravina-monte: gens=3, windows done 0/62 (paint-test/scores-v8-ravina-monte.tsv)
- 07:48 trento-ravina-monte: gens=4, windows done 0/62 (paint-test/scores-v8-ravina-monte.tsv)
- 07:48 trento-ravina-monte: gens=5, windows done 0/62 (paint-test/scores-v8-ravina-monte.tsv)
- 07:48 trento-ravina-monte: gens=6, windows done 0/62 (paint-test/scores-v8-ravina-monte.tsv)
  07:52 ravina-monte: crm1 logged all 6 as rejected because data/derived/trento-ravina-monte/manual/ did not exist (accept.sh cp failed); created manual/, removed the 6 bogus rows, re-accepting (crm1b).
- 07:55 trento-ravina-monte: gens=5, windows done 5/62 (paint-test/scores-v8-ravina-monte.tsv)
- 07:56 ravina-monte progress: 6/48 paint accepted (rows 6); depurple 3_7 (410 px).
- 07:58 ravina-monte batch 2: 1_5 0.74 -1_5 0.741 0_6 0.609 -2_6 0.952 -4_6 0.917 2_7 0.718, accepting (crm2); depurple 2_7 after.
- 08:00 trento-ravina-monte: gens=10, windows done 10/62 (paint-test/scores-v8-ravina-monte.tsv)
- 08:02 ravina-monte progress: 12/48 paint accepted; depurple 2_7 (828 px).
- 08:04 ravina-monte batch 3: 1_6 0.533 -1_6 0.874 0_7 0.946 -2_7 0.91 3_8 0.634 4_9 0.71, accepting (crm3); depurple 3_8 after.
- 08:05 trento-ravina-monte: gens=15, windows done 15/62 (paint-test/scores-v8-ravina-monte.tsv)
- 08:08 ravina-monte progress: 18/48 paint accepted; depurple 3_8 (1582 px).
- 08:10 ravina-monte: -1_7 gen 70307ea0 visual reject (central square returned flat/unpainted).
- 08:10 ravina-monte batch 4: 1_7 0.696 -1_7 retry 90df69cf 0.5 -3_7 0.92 2_8 0.69 0_8 0.744 3_9 0.65, accepting (crm4).
- 08:11 trento-ravina-monte: gens=20, windows done 20/62 (paint-test/scores-v8-ravina-monte.tsv)
- 08:14 ravina-monte progress: 24/48 paint accepted.
- 08:16 ravina-monte batch 5: -1_8 0.563 2_9 0.702 5_10 0.764 3_10 0.731 accepting (crm5); 1_8 47eee8ac 0.307 and 0_9 0f8f07d5 0.22 held (low score on flat input), regenerating with muted wording.
- 08:17 trento-ravina-monte: gens=25, windows done 25/62 (paint-test/scores-v8-ravina-monte.tsv)
- 08:20 ravina-monte: retries 1_8 e67e64da 0.938, 0_9 0020e71b 0.479 accepting (crm6); progress 28/48.
- 08:21 trento-ravina-monte: gens=30, windows done 30/62 (paint-test/scores-v8-ravina-monte.tsv)
- 08:22 ravina-monte batch 6: 4_10 0.695 2_10 0.718 6_11 0.862 3_11 0.794, accepting (crm7); progress 30/48.
- 08:26 ravina-monte progress: 34/48 paint accepted (crm7 done).
- 08:27 ravina-monte batch 7: 1_9 0.938 0_10 0.667 4_11 0.783 2_11 0.768 3_12 0.98 6_12 0.966, accepting (crm8).
- 08:28 trento-ravina-monte: gens=35, windows done 35/62 (paint-test/scores-v8-ravina-monte.tsv)
- 08:31 trento-ravina-monte: gens=40, windows done 40/62 (paint-test/scores-v8-ravina-monte.tsv)
- 08:31 ravina-monte progress: 40/48 paint accepted.
- 08:33 ravina-monte: 2_12 gen d971dd70 visual reject (lower square left flat/unpainted).
- 08:34 ravina-monte batch 8: 1_10 7a57b5df 0.300 held -> retry 893c1bdb 0.425; 0_11 0.948 5_11 0.693 4_12 0.966 2_12 retry 6cbd628f 0.965; accepting (crm9).
- 08:36 trento-ravina-monte: gens=45, windows done 45/62 (paint-test/scores-v8-ravina-monte.tsv)
- 08:37 ravina-monte progress: 45/48 paint accepted.
- 08:38 ravina-monte: 1_11 0.943 5_12 0.909 accepting (crm10).
- 08:41 ravina-monte: 1_12 0.964 accepting (crm11, last paint window); then striponly 14.
- 08:43 trento-ravina-monte: gens=48, windows done 50/62 (paint-test/scores-v8-ravina-monte.tsv)
- 08:45 trento-ravina-monte: gens=48, windows done 55/62 (paint-test/scores-v8-ravina-monte.tsv)
- 08:48 trento-ravina-monte: gens=48, windows done 60/62 (paint-test/scores-v8-ravina-monte.tsv)
- 08:49 ravina-monte: striponly 14/14 logged (rows 49-62); 62/62 windows. Assembly flagged 1 overlap > 12: ravina-monte 1_5 / sud 1_4 13.52. Close-out starting.
  08:50 ravina-monte close-out: clean.mts 0 windows; rebase2 drift (-4,-3,+3) -> no rebase.
  08:50 ravina-monte seamfix 1_5 T(sud 1_4) (original archive/preseam); strictall 16 areas starting.
  09:00 strictall 16 areas: all assembled OK, per-area union 1492-1663 overlaps, max 11.68 (vela-nord), 0 > 12; ravina-monte 31 art tiles (sardagna now 43: 2 shared windows moved to ravina-monte). rawcheck 16 starting.
  09:11 rawcheck 16 areas: 761 art tiles, 3 failing (ravina-monte -1_7 raw 6.2%, ovest -3_5 raw 15.5%, sud 5_9 raw 6.4%); locating windows.
  09:14 cause: strictall.sh was run without ALL= so each area's --context was only the 7 base areas (union 1492-1663 overlaps instead of ~2100); ovest -3_5 / sud 5_9 / ravina -1_7 art tiles were assembled without the neighbouring ring windows (raw render filled the gap). Rerunning strictall with ALL=all 16.
  09:24 strictall 16 areas (ALL=16): all assembled OK, 2104 overlaps, max 11.56, 0 > 12. rawcheck 16 rerun.
  09:34 rawcheck 16 rerun: 761 art tiles, 1 failing: ravina-monte -1_7 raw 6.2% <- strip-only window -2_8 (render copy). ovest -3_5 and sud 5_9 now pass. Painting -2_8 instead of strip-only.
  09:36 ravina-monte -2_8 painted (gen 1517036b, 0.949, row 63; strip-only copy kept /tmp/-2_8-striponly.png); re-assembling ravina-monte, sardagna, ovest.
  09:47 rawcheck 16 areas: 761 art tiles, 0 failing (warn -20_-11 raw 2.4%, -20_-9 raw 4.4%, -26_-6 raw 3.5%, 0_0 black 1.3%). Final export all 16 starting.
- 09:47 DONE SW1 trento-ravina-monte (Europe/Rome): 62 windows = 49 painted (19 shared repainted: sud 12, ovest 4, sardagna 2, citta 1; -2_8 promoted from strip-only to fix raw share) + 13 strip-only; 49 pass + 0 soft (paint.ts gate), logged match NCC 0.425-0.991 (median 0.767, 2 below 0.5, 0 below 0.4); 0 logged gate rejects; Grok gens 54 (49 accepted + visual rejects -1_7 flat centre, 2_12 flat square; held low scores 1_8 0.307, 0_9 0.22, 1_10 0.300, all regenerated); depurple 3_7 2_7 3_8.
  Close-out: clean.mts 0; rebase2 drift (-4,-3,+3) -> no rebase; seamfix 1_5 T(sud 1_4) 13.52; strictall 16 areas (ALL=16) 2104 overlaps max 11.56, 0 > 12; rawcheck 16 areas 761 art tiles 0 failing; 31 render tiles (3 written empty: -3_7 genuinely empty, -2_7 and -1_8 south-rim blank renders, see caveat 05:47). Process slip: crm1 logged 6 bogus rejects (missing manual/ dir) and the first 16-area strictall ran without ALL=; both corrected.
- 10:04 final export all 16 in progress: paint coverage 761/761, map z8 3044 tiles written.
  10:34 final export all 16 (rbfade1): 761/761 painted, map z8 3044 + z2-7 1068, photo same, world.json 761 rendered/761 painted, areas = all 16, 8312 files, exit 0. Not published.
  10:34 Rome tests 32: 31 pass 1 skip 0 fail; tsc pipeline + web OK.
  10:37 Shots: shots/v9-1440x900 + -render (?at=46.0680,11.1010), v9-390x844 + -render, v9-zoomout-1440x900 + -render (?at=46.0800,11.1050,8), 0 failed requests, 0 page errors; shots/v9-zoomout-fullmap.png + -render (stitch z5, 62 tiles, 6144x4096).
  Visible in v9: (1) small beige triangles scattered over the W/SW rings (vela-sud, vela-nord, sardagna, ravina-monte) = render-black wedges inside the union, faded to page background by rbfade1; (2) blocky tone steps between flat-forest windows on the west slope (vela-nord/vela-sud), within palette QA (<12) but visible at z5-z6. Neither is gated by strictall/rawcheck.
- 10:37 DONE v8 rings close-out (Europe/Rome): 7/7 rings painted, 16 areas, strictall 2104 overlaps max 11.56 0 > 12, rawcheck 761 tiles 0 failing, export 761/761, tests 31/1 skip/0 fail, tsc OK. Not published.
  Final audit (all 16 areas, current windows): 1099 owned windows (75 logged strip-only), 56 .soft flags (villamontagna 20, calisio 9, cortesano 8, citta 6, ovest 5, gardolo 3, spini 2, povo 2, sud 1); only window below 0.3 on either measure = villamontagna 1_-12 (0.177, texture 0.0497 < MIN_TEXTURE 0.05 -> low-texture bypass, no .soft flag). Low-texture windows passed below 0.4 without .soft: villamontagna -1_-16 0.311, cortesano -12_-11 0.317, -6_-16 0.363, calisio -7_-13 0.380. Logged NCC == gate score at accept time (acc.sh logs paint.ts match=); qa.json differs only where windows were re-registered later (citta 0_0 0.37->0.412, 0_-2 0.398->0.479, gardolo -14_-2 0.391->0.356, -14_-3 0.411->0.395).

## v10 fix round (approved 14 Nov 10:40 Europe/Rome: "Si chiudi il rimanente e fixa gli errori")
- 10:40 v10 RESUME BLOCK: order = (1) beige triangles: holecheck + root-cause fix, (2) ravina-monte south rim -2_7/-1_8, (3) west-slope forest tone: tonecheck + harmonize, (4) repaint ranked low-score windows (accept only if score improves + visual OK), then close-out (strictall ALL=16, rawcheck, holecheck, tonecheck, export 16, Rome tests, tsc, v10 shots, shots/v10-zoomout-fullmap.png). Constraints: Grok GenerateImage only, local only, no publish, origin/heading untouched, no deletes in data/derived or data/web-state, archive every replaced file under data/derived/<area>/archive/v10/.
- 10:43 v10 fix1 baseline: scratch/holecheck.mts (new): 761 art tiles, 76 with holes, 80630 hole pts (8px lattice, ~5.16 Mpx), 63 tiles > 0.2% (worst ovest -3_5 46.6%, sardagna -5_5 43.8%, -4_4 40.9%). Root cause: renderer.ts footprint() extended the ground box only once; higher ground beyond projects into the tile and the cut mesh edge leaves ridge-shaped black holes. Patched to iterate to a fixed point (archive data/derived/archive-v10/renderer.ts.pre-v10). Test render ovest -3_5.
- 10:49 v10 fix1: renderer footprint also shrunk to the ground that projects into the tile (fixed-point box was km deep -> canvas over GPU limit -> blank; that was the cause of the ravina-monte -2_7/-1_8 blanks too). scratch/rerender.sh re-rendered all 76 hole tiles (ovest 13, sardagna 29, ravina-monte 10 incl. -2_7 -1_8, gardolo 7, villamontagna 8, vela-nord 5, citta 2, cortesano 2), 0 failures; originals in <area>/archive/v10/{render,height}/. Render content on those tiles 86.4% -> 100%, 0 lost pixels; on common pixels most tiles identical (mean |d| < 2) but gardolo -13_-3 -17_-5 -19_-6 changed 9-16% (old render showed the Adige through the cut slope; now correctly occluded).
  holecheck after re-render: 761 tiles, 0 with holes, 0 hole pts (was 76 tiles / 80630 pts).
  Art over the changed render pixels is stale (black/river) -> repaint windows with changed render share >= 2%: 77 windows (scratch/changedwin.py -> /tmp/changedwin.txt, copied to paint-test/v10-changed.txt). Repaint log paint-test/scores-v10.tsv.
  scratch/tonecheck.py (new) baseline 16 areas: 413 forest cells, 642 pairs, dE76 median 3.50 p90 11.51 max 51.19 (rim/hole contaminated), 159 pairs > 6.
- 10:54 trento-sardagna: gens=1, windows done 0/0 (paint-test/scores-v10.tsv)
- 10:55 trento-sardagna: gens=2, windows done 0/0 (paint-test/scores-v10.tsv)
- 10:56 trento-sardagna: gens=3, windows done 0/0 (paint-test/scores-v10.tsv)
- 10:57 v10: gate vs log mismatch found: accept.sh re-prepares work/<w>/input.png from neighbour windows that are still black over old holes, so the gate registered against black strips (sardagna -5_6 gate 0.46 vs logged 0.79). Fix: scratch/unblack.py filled black-over-render-content in the 89 changed windows (>=0.5%) with the new render (temporary, all >=2% get repainted); archives in <area>/archive/v10/windows.
- 10:58 trento-sardagna: gens=4, windows done 0/0 (paint-test/scores-v10.tsv)
- 10:59 trento-sardagna: gens=5, windows done 0/0 (paint-test/scores-v10.tsv)
- 10:59 trento-sardagna: gens=6, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:02 trento-ravina-monte: gens=7, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:02 trento-sardagna: gens=8, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:03 trento-sardagna: gens=9, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:03 trento-sardagna: gens=10, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:04 trento-ravina-monte: gens=11, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:04 v10 fix1 repaint: 8/63 accepted (sardagna -5_6 -7_7 -4_5 -5_5 -6_6 -7_8, ravina-monte -4_6 -2_6); visual rejects: ravina-monte -3_6 (invented houses), -2_8 x2 (flat unpainted; invented houses), -1_9 (flat unpainted). Prompt scratch/t3u-v10.txt (sparse faint-dab woodland + scree + no-invented-buildings).
- 11:06 trento-ravina-monte: gens=12, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:07 trento-ravina-monte: gens=13, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:07 trento-ravina-monte: gens=14, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:08 trento-ravina-monte: gens=15, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:08 trento-sardagna: gens=16, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:09 trento-sardagna: gens=17, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:14 v10 fix1 repaint 14/63 accepted. Unblacked all 197 windows over the 76 re-rendered tiles (black over new render content -> render; outside-footprint neighbours were still black and pulled the gate down); scratch/regate.sh re-ran the gate: logged == gate again (ravina-monte -4_6 0.662, -2_8 0.793, -1_9 0.217 low-texture, sardagna -8_8 0.740, -7_8 0.287 low-texture).
- 11:17 trento-ovest: gens=18, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:17 trento-vela-sud: gens=19, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:18 trento-sardagna: gens=20, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:18 trento-sardagna: gens=21, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:19 v10 fix1 repaint 18/63 (visual rejects so far: ravina -3_6, -2_8 x2, -1_9, -2_7 flat; sardagna -6_7 desaturated olive).
- 11:21 trento-ovest: gens=22, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:21 trento-ravina-monte: gens=23, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:22 trento-sardagna: gens=24, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:23 trento-sardagna: gens=25, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:23 trento-gardolo: gens=26, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:24 trento-vela-nord: gens=27, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:24 v10 fix1 repaint 24/63.
- 11:26 trento-ovest: gens=28, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:27 trento-gardolo: gens=29, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:28 trento-ravina-monte: gens=30, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:28 trento-sardagna: gens=31, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:29 trento-vela-nord: gens=32, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:29 trento-sardagna: gens=33, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:29 v10 fix1 repaint 30/63.
- 11:30 v10 RESUME BLOCK (2): fix1 = renderer footprint fix done + 76 tiles re-rendered (holecheck 0) + 197 windows unblacked; repaint list paint-test/v10-repaint1.txt (63, visible render change >= 2%), 30 accepted (log paint-test/scores-v10.tsv). Next batch: python3 scratch/batch10.py paint-test/v10-repaint1.txt 6 -> scratch/prep10.sh (inputs /tmp/inputs10.png, prompt scratch/t3u-v10.txt via /tmp/p10/<w>.txt) -> Grok GenerateImage(ref work/<w>/input.png) -> scratch/acc10.sh "<area> <w> <hashprefix>". fix2 status: -2_7 and -1_8 now render (footprint fix), -2_7 repainted; -1_8 tile covered by windows in list. Then fix3 (scratch/tonecheck.py), fix4 (paint-test/v10-lowscore.txt, archives in <area>/archive/v10/{windows,qa}), close-out.
- 11:32 v10 fix1 batch7 gens: -20_-6 (unpainted centre) and 0_7 (black wall) rejected; 4 accepting. Windows with visible change < 3.5% are left render-filled and only repainted if rawcheck flags them.
- 11:33 trento-sardagna: gens=34, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:33 trento-vela-nord: gens=35, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:34 trento-sardagna: gens=36, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:35 trento-sardagna: gens=37, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:35 trento-gardolo: gens=38, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:35 trento-ravina-monte: gens=39, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:36 trento-sardagna: gens=40, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:36 trento-sardagna: gens=41, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:37 trento-villamontagna: gens=42, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:38 trento-gardolo: gens=43, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:38 v10 fix1 batch7+8 accepted (gate): sardagna -9_6 .844, -10_5 .737, -10_2 .711, -8_3 .743, -11_2 .692; vela-nord -23_-6 .404; gardolo -20_-6 .779 (regen), -22_-7 .855; ravina-monte 0_7 .691 (regen); villamontagna -3_-16 .695. 40/63 done. Next: 2_12 -1_7 -21_-7 -8_6 -14_2 -3_-15.
- 11:40 trento-ravina-monte: gens=44, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:41 trento-ravina-monte: gens=45, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:41 trento-gardolo: gens=46, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:42 trento-sardagna: gens=47, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:43 trento-sardagna: gens=48, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:43 trento-villamontagna: gens=49, windows done 0/0 (paint-test/scores-v10.tsv)
- 11:43 v10 fix1 batch9 accepted: ravina-monte 2_12 .951, -1_7 .709; gardolo -21_-7 .612; sardagna -8_6 .745, -14_2 .347 (soft); villamontagna -3_-15 .585. 46/63 repainted; remaining 17 (<3.5% change) stay render-filled pending rawcheck. Next: strictall ALL=16 + rawcheck.
- 11:46 v10 strictall ALL=16 (1st): palette QA 19 overlaps > 12 (max 43.66 ravina-monte -3_7/-3_8) on the south rim / gardolo / vela-nord seams of the v10 repaints -> seamfix 19 passes (v10-painted side is the source; pre-seam originals in <area>/archive/v10/preseam). Paint tiles of all 16 archived to archive/v10/paint-prestrict. strictall rerun.
- 11:49 strictall rerun 2: 2 > 12 (-2_9/-1_9 14.67, 3_12/3_13 12.46) -> seamfix -2_9 R(-1_9), 3_12 B(3_13); rerun 3: 3_12/3_13 12.45 (offset pull from 3_13's other neighbours) -> seamfix 3_13 L(2_13), R(4_13).
- 12:06 strictall ALL=16 (4th, after 23 seamfix passes): all 16 assembled, 2104 overlaps, max 11.54, 0 > 12.
- 12:15 rawcheck 16: 2 failing (sardagna tile -6_7 raw 47.8%, -7_7 7.6%) <- window sardagna -7_8 was never accepted (regate 'rejected attempt 3, match=0.29'; windows/-7_8.png is still the render fill). holecheck 16: 761 tiles, 0 hole pts. Repainting -7_8.
- 12:17 trento-sardagna: gens=50, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:18 trento-villamontagna: gens=51, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:18 trento-ovest: gens=52, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:19 trento-calisio: gens=53, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:20 trento-villamontagna: gens=54, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:21 RESUME after abort (12:20). Accepted: sardagna -7_8 .726 (rawcheck culprit); fix4 villamontagna 1_-12 .177->.448, ovest -10_0 .302->.478, calisio -2_-13 .310->.374 (soft), villamontagna -1_-16 .311->.378 (soft). Next: cortesano -12_-11, ovest -3_2 accept, then fix4 batches 2-3.
- 12:22 trento-cortesano: gens=55, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:22 trento-ovest: gens=56, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:23 fix4: ovest -3_2 .321->.460 accepted (buildings present in prior window too). cortesano -12_-11 gate .317->.431 but VISUAL REJECT (forest strip lost, large flat meadow) -> restored archived window (try kept in archive/v10/rejected). Batch2 (-4_3, -3_-14, 0_-17, -2_3, -12_-16) accepting; -1_-14 gen rejected (visible square). Prepping batch3.
- 12:23 trento-ovest: gens=57, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:24 trento-calisio: gens=58, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:25 trento-villamontagna: gens=59, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:26 trento-ovest: gens=60, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:26 trento-cortesano: gens=61, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:31 fix4 batch2: ovest -4_3 .329->.394 (soft) kept, ovest -2_3 .339->.400 kept; calisio -3_-14 .333->.300, villamontagna 0_-17 .338->.328, cortesano -12_-16 .340->.298 not better -> archived windows restored (tries in archive/v10/rejected).
- 12:33 trento-cortesano: gens=62, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:33 trento-villamontagna: gens=63, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:34 trento-villamontagna: gens=64, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:35 trento-villamontagna: gens=65, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:36 trento-spini: gens=66, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:36 trento-spini: gens=67, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:37 fix4 batch3 kept: cortesano -12_-11 .317->.436 (2nd try, structure kept), villamontagna -1_-13 .340->.393, 4_-17 .346->.409, 0_-12 .349->.397, spini -18_-8 .345->.421, -22_-13 .348->.352. fix3: tonecheck --focus added; baseline (post-fix1) 16 areas 659 pairs median 3.72 p90 10.86 max 27.35, 175 > 6; focus vela-nord+vela-sud 212 pairs median 2.70 p90 8.31 max 23.29, 36 > 6. scratch/tonefix.py colour-match applied to 118 vela-nord/vela-sud windows (|delta| median 2.09 max 12.85; originals archive/v10/windows-tone). Batch4 prep.
- 12:39 trento-villamontagna: gens=68, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:39 trento-calisio: gens=69, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:40 trento-villamontagna: gens=70, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:41 trento-cortesano: gens=71, windows done 0/0 (paint-test/scores-v10.tsv)
- 12:41 fix4 batch4: villamontagna -1_-14 .340->.446 (2nd try, no square), 0_-17 .338->.376 (2nd try), cortesano -12_-16 .340->.373 (2nd try) kept; calisio -4_-14 .340->.297 restored. Fix4 result: 16/18 improved, calisio -3_-14 and -4_-14 kept original (no better try). strictall ALL=16 (close-out) starting.
- 12:56 strictall ALL=16 close-out: all 16 assembled, 2104 overlaps, max 11.52, 0 > 12.
- 13:05 tonecheck after fix3 (+fix4): 16 areas 659 pairs median 3.21 p90 10.54 max 28.01, 154 > 6 (was 3.72/10.86/27.35, 175); focus vela-nord+vela-sud 212 pairs median 1.66 p90 4.81 max 14.62, 15 > 6 (was 2.70/8.31/23.29, 36). rawcheck 16: 761 tiles 0 failing. holecheck 16: 761 tiles 0 hole pts. Web export v9 archived to data/derived/archive-v10/web-trento-v9.tgz. Final export all 16 starting.
- 13:11 RESUME (13:11): strictall close-out already logged (12:56, 0 > 12). tsc pipeline + web OK (12:58). Export all 16 still running (pid 1136184, started ~12:57).
- 13:38 final export all 16: 761/761 painted, map z8 3044 updated, world.json 761 rendered/761 painted, 8318 files. Not published.
- 13:38 Rome tests 32: 31 pass, 1 skip, 0 fail. tsc pipeline + web OK.
- 13:46 v10 fullmap inspection: no beige wedges inside footprint, but 3 near-black spots visible (villamontagna bar at tile -1_-15, two ravina-monte specks at 0_7/-1_7) + scratch/blackcheck.py on exported z8 found more black wedges (ovest -8_-2, vela-nord -21_-6/gardolo -20_-6). Cause: window black (old hole) won the overlap over the painted neighbour. Fix: scratch/unblack2.py (black-over-render -> neighbour paint) on villamontagna -2_-18, ravina-monte -1_7 -1_8, ovest -10_-2 -9_-3, vela-nord -23_-6; archives <area>/archive/v10/windows-unblack2. Re-running strictall + export.
- 14:01 RESUME: strictall ALL=16 after unblack2 already complete (/tmp/strict10f.log): all 16 assembled, 2104 overlaps, max 11.52, 0 > 12. blackcheck (scratch/blackcheck.py, opaque near-black blob >=150 px in exported z8) baseline: v9 export 85 tiles, v10 pre-unblack2 export 25 tiles (incl. legit dark shadows). rawcheck + holecheck running.
- 14:10 rawcheck 16: 761 tiles 0 failing. holecheck 16: 0 hole pts. Re-export all 16 starting (/tmp/export10b.log).
- 14:41 re-export all 16: 761/761, 8321 files, not published. blackcheck z8: 20 tiles with near-black blob >=150 px, all inspected = dark painted tree crowns/shadows (city + 5/-15, 10/-11, -2/-9, 12/-10); 0 black wedges (the 5 wedge tiles -16/-4 -41/-11 -40/-11 0/14 -2/14 are gone). Before: v9 export 85 tiles, v10 first export 25. Rome tests + shots next.
- 14:44 v10 fullmap re-inspection after re-export: villamontagna/ravina/ovest/vela-nord wedges gone, but one dark vertical band remained (z8 -14/-16, -14/-15 left edge, paint martignano -7_-8 x0-42): window martignano -9_-9 was black there (palette lifted it to sum 43, so the <=30 tile scan and blackcheck missed it). Fix: MINB=150 unblack2 on all 23 windows with black-over-render blobs >500 px (martignano -9_-9 111739 px, est -1_-6, citta -1_-5, martignano 2_-9 -1_-7, povo 5_-7 6_-6 12_-3 13_-8 13_-7 13_-4, cortesano -11_-21 -6_-17, sardagna -14_3 -6_7 -15_3, villamontagna 5_-17 6_-16 6_-15, est 15_3; 3 already clean); fill from neighbour paint, edge strips without a neighbour from render (<=1500 px each). strictall ALL=16 + rawcheck + holecheck rerun (/tmp/strict10g.log).
- 14:52 RESUME (14:52): strictall/rawcheck/holecheck chain still running (12/16 areas done, max 11.70, 0 > 12).
- 15:05 strictall ALL=16 (after unblack2 x23): 2104 overlaps max 11.70, 0 > 12. rawcheck 761 tiles 0 failing. holecheck 0 hole pts. Re-export all 16 starting (/tmp/export10c.log).
- 15:42 RESUME (15:42): export10c still running (map z8 3044 done), waiting; no second export started.
- 15:50 export10c done: 761/761, 8324 files, not published. blackcheck z8: 14 tiles (all city-centre tree shadows inspected earlier: 1/-1 0/1 19/6 -1/0 0/0 -2/0 0/-1 2/-2 1/1 1/2 3/-3 3/-2 -1/1 -2/1), 0 wedges. Sequence: v9 85 -> v10 export1 25 -> export2 20 -> export3 14.
- 15:53 v10 CLOSE-OUT DONE: Rome tests 32 (31 pass, 1 skip, 0 fail), tsc pipeline+web OK; v10 shots 1440x900/390x844/zoomout (+ -render), shots/v10-zoomout-fullmap.png (6144x4096) + -render + -small (2400x1600); earlier v10 shot sets archived in shots/archive-v10a, archive-v10b. Fullmap scan: 0 near-black blobs >30 px at z5 (was 1 bar = martignano -9_-9). Visual: no beige wedges or black bars/specks left inside the footprint. Residual (not fixed, by instruction): blocky window-square tone steps in flat forest on the west slope (vela-nord/vela-sud), Calisio/Villamontagna forest, and the Bondone slope SW of the centre (dark block below Sardagna, pale washed squares near the ravina-monte rim); one pale washed square at the Martignano/Cortesano forest edge. Not published.

## v11 forest tone round (approved pt69u 'Okey fallo', 17:11)
- 17:11 v11 RESUME BLOCK: goal = remove square tone steps in flat forest. Zones in order: Z1 west slope vela-nord+vela-sud; Z2 calisio+villamontagna; Z3 Bondone slope (dark block below sardagna, pale squares near ravina-monte rim); Z4 martignano/cortesano forest-edge pale square. Method: one shared style anchor + prompt per zone (sparse faint brush-dab wording), contiguous windows repainted in wavefront order so strips come from fresh paint, tonefix only as finishing. Measure tonecheck per zone before/after + gate per window (keep original if worse/visual worse). Constraints: Grok GenerateImage only, local only, no publish, origin/heading untouched, no deletes in data/derived or data/web-state, archives under <area>/archive/v11 and data/derived/archive-v11. Close-out: clean.mts, rebase2, strictall ALL=16 (0>12), seamfix, rawcheck, holecheck 0, blackcheck, export, Rome tests, tsc, v11 shots + fullmap + -small.
- 17:19 v11 setup: tonecheck --zones/--dump added (v10 copy in data/derived/archive-v11), baseline paint-test/tone-v11-before.json: Z1 212 pairs median 1.56 p90 4.81 max 14.54, 15 >6; Z2 140 pairs 3.92/9.86/20.94, 38 >6; Z3 180 pairs 3.74/8.20/20.84, 39 >6; Z4 87 pairs 4.84/15.72/20.94, 34 >6 (all 16: 659 pairs 3.25/10.51/27.30, 151 >6). Repaint lists paint-test/v11-Z{1..4}.txt (tone dev >4 dE vs 8-neighbour median via scratch/toneout.py, or forest texture dev >40% via scratch/texout.py): Z1 25, Z2 30, Z3 34, Z4 34. Anchors paint-test/anchors11 (Z1 -25_-6). Tools: scratch/envv11.sh prep11.sh acc11.sh batch11.py, prompt scratch/t-forest-v11-Z1.txt; decisions in paint-test/v11-done.txt, orig gate in paint-test/v11-orig.tsv, log paint-test/scores-v11.tsv. web export v10 archived data/derived/archive-v11/web-trento-v10.tgz.
- 17:23 trento-vela-nord: gens=1, windows done 0/0 (paint-test/scores-v11.tsv)
- 17:23 trento-vela-nord: gens=2, windows done 0/0 (paint-test/scores-v11.tsv)
- 17:24 trento-vela-nord: gens=3, windows done 0/0 (paint-test/scores-v11.tsv)
- 17:25 v11 Z1 try1 (input = render centre + painted strips, + anchor image): gates -33_-6 .653->.738, -31_-7 .632->.769, -30_-8 .677->.588 (auto-restored), but both 'better' ones are VISUAL REJECTS: Grok paints the flat centre as a pale lime meadow framed by dense crowns from the strips = a new square. Restored (scratch/rest11.sh; tries in archive/v11/rejected). Switching method: edit the existing painted window (keeps layout, only re-textures woodland to the anchor).
- 17:28 trento-vela-nord: gens=4, windows done 0/0 (paint-test/scores-v11.tsv)
- 17:32 trento-vela-nord: gens=5, windows done 0/0 (paint-test/scores-v11.tsv)
- 17:33 v11 Z1 method trials on vela-nord -31_-7 (dense-crown outlier among faint-dab windows): B (Grok edit of the existing window + anchor) gate .624 < .632 auto-restored and still a lighter square; 2x2 block edit (paint-test/b11/Z1a) keeps the dense|flat split (Grok preserves existing texture); C (forest prefilled with a Grok-generated zone texture paint-test/anchors11/texture-Z1.jpg, then Grok clean-up) gate .655 > .632 but after accept brightness match it is again a dense dark square -> visual reject, restored. Root cause: each window repaint inherits the neighbours' border strips and the accept match, so per-window Grok repaints keep window-shaped texture/tone steps. Next: deterministic continuous harmonization (scratch/texfix.py: forest detail-gain + tone field, bilinear across window centres, so overlaps agree), Grok repaint only where a window is structurally wrong.
- 17:54 v11 Z1 done (deterministic): scratch/texfix.py (new) vela-nord,vela-sud sigma 1.2 maxgain 2 (112 windows, gain p10 .71 p90 1.44), tonefix --archive=v11 sigma 1.2 (118), texfix 2nd pass vela-nord,vela-sud,gardolo sigma 2.5 maxgain 3 (122, gain .35-2.15), tonefix sigma 2 (128 windows); seamfix gardolo -22_-7 bottom<-(-22_-6) (13.42 > 12 after tone shift); strictall 3 areas max 11.69, 0>12. tonecheck Z1: 212 pairs median 1.56->0.88, p90 4.81->1.81, max 14.54->6.33, >6 15->1. texout Z1 (>40% texture dev): 20->1, tex p10/p90 1.86/5.95->2.31/4.52. Archives: <area>/archive/v11/windows-tex (pre-v11 originals), windows-tone, preseam. Crops paint-test/cmp11/Z1-before.png, Z1-after.png, Z1-before-after.png. Visual: dark/dense squares softened, some style steps (dense crowns vs faint dabs) still readable at close zoom.
- 17:56 v11 RESUME BLOCK: method switched to deterministic per-zone harmonization scratch/zone11.sh <areas> [from-step] (texfix s1.2 -> tonefix s1.2 -> reassemble -> texfix s2.5 maxgain3 -> tonefix s2 -> reassemble). Z1 done. Z2 running (log /tmp/zone11-Z2.log, texfix step1 already done 18:16). Next: Z3 sardagna,ravina-monte; Z4 martignano,cortesano; per zone seamfix any >12, tonecheck --zones, texout, crops paint-test/cmp11/Z*-before/after.png; then optional Grok block test; then close-out.
- 18:03 Z2 zone11 finished 18:03 (texfix gain .75-1.71, tonefix 83 windows x2, strictall calisio/villamontagna max 11.67 0>12). (note: '18:16' in the 17:56 block was a typo, Z2 texfix step1 ran ~17:58.) Starting Z3: setsid zone11.sh sardagna,ravina-monte > /tmp/zone11-Z3.log
- 18:17 Z3 zone11 done 18:16 (texfix gain .52-2.00 then .47-3.00, tonefix 102 windows x2, strictall sardagna/ravina-monte max 11.65 0>12). Starting Z4 martignano,cortesano > /tmp/zone11-Z4.log
- 18:23 Z4 first run aborted: step-2 reassemble failed palette QA (-7_-14/-7_-13 12.11) so step-3 texfix measured stale art (would double the gains) -> killed, restored the 54 Z4 windows to pre-v11 originals (current tries kept in <area>/archive/v11/aborted-z4), zone11.sh now stops when a reassemble fails. Rerunning Z4 step 1-2.
- 18:28 Z4 steps 1-2 done (texfix 50, tonefix 54); reassemble failed on calisio -7_-14/-7_-13 12.11 -> seamfix calisio -7_-13 top<-(-7_-14) (preseam in calisio/archive/v11/preseam); reassemble martignano/cortesano/calisio max 11.66 0>12. Running Z4 steps 3-4.
- 18:33 tonecheck after Z1-Z4: largest remaining steps are in trento-ovest on the Bondone slope (-6_0/-5_0 27.30, -2_4/-2_5 20.49, -3_3/-3_4 19.42 ...), i.e. the 'darker block below Sardagna' belongs to ovest windows -> extending Z3 with ovest: zone11.sh ovest
- 18:37 ovest zone11 done 18:36 (texfix 21 windows gain .54-1.35 then .53-1.08, tonefix 21 x2, ovest max 11.77 0>12). Remaining step at ovest -6_x (light) | citta -5_x (dense dark, Doss Trento slope) -> running zone11.sh citta (only >=40% forest cells are touched).
- 18:41 citta zone11 done 18:40 (2 forest windows on the Doss Trento slope, texfix .73-.82 then .60, tonefix ~13 dE twice: the palette solve pulls these back, delta did not converge). Grok block test SKIPPED by decision: no window in Z1-Z4 is structurally wrong (layout matches the render everywhere), and the 17:2x-17:33 trials showed per-window/block Grok repaints re-create window-shaped steps; the generated block paint-test/b11 Z1c (gen 7a2b4fb5...) was not accepted. Starting close-out: clean.mts x16, rebase2 drift check (no --apply) for the 8 touched areas, strictall ALL=16.
- 18:50 close-out: clean.mts dry x16 -> 1 window (cortesano -15_-19, 1622 px) cleaned (copy in cortesano/archive/v11/preclean + script's prenoise). rebase2 drift (no --apply, solver handles uniform offsets as in v7-v10): vela-nord (-5,-4,-4), vela-sud (-3,-2,2), gardolo (0,2,-3), calisio (1,0,-2), villamontagna (5,1,2), sardagna (-3,0,5), ravina-monte (-3,-3,4), martignano (-3,-4,-7), cortesano (18,15,8), ovest (1,4,5), citta (-4,-3,-2); unclamped max resid 11.76 in all -> no rebase (cortesano drift large, noted). strictall ALL=16 starting /tmp/strict11.log
- 18:54 RESUME: strictall ALL=16 (/tmp/strict11.log) still running, 5/16 assembled, all max 11.77 0>12 so far; not restarted, waiting.
- 19:01 strictall ALL=16 done: all 16 assembled, 2104 overlaps, max 11.77, 0 > 12 -> no seamfix needed. rawcheck + holecheck next.
- 19:10 rawcheck 16: 761 art tiles, 0 failing (warn only: -20_-9 raw 4.4%, -25_-8 2.2%, 2_-15 2.8%, 0_0 black 1.3%). holecheck 16: 0 hole pts. Export all 16 starting /tmp/export11.log (v10 export archived in data/derived/archive-v11/web-trento-v10.tgz).
- 19:12 final tonecheck (paint-test/tone-v11-final.json): all 16 659 pairs median 3.25->1.30, p90 10.51->4.04, max 27.30->13.78, >6 151->27. Z1 212 pairs 1.56/4.81/14.54 15>6 -> 0.88/1.94/6.33 1>6; Z2 140 3.92/9.86/20.94 38 -> 1.35/3.58/10.62 4; Z3 180 3.74/8.20/20.84 39 -> 1.36/3.32/8.16 5; Z3+ovest 205 4.02/10.70/27.30 59 -> 1.42/4.05/10.86 11; Z4 87 4.84/15.72/20.94 34 -> 1.60/5.07/13.78 5. texout outliers (>40%): Z1 20->1, Z2 5->0, Z3 21->1, Z4 12->0. Crops paint-test/cmp11/Z{1,2,3,4,3-ovest}-before|after|before-after.png. Export running.
- 19:27 tsc pipeline + web OK. Export running (/tmp/export11.log), map z8 3044 written.
- 19:31 blackcheck z8 (map z8 of export11): 16 tiles with near-black blob >=150 px (v10: 14). The 14 v10 city tree-shadow tiles + 2 new: -50/-14 (239 near-black px, v10 had 222) and -14/7 (451, v10 327) = pre-existing 1-2 px black hairlines at the footprint edge that grew past the 150 px blob threshold; cause: texfix/tonefix Lab blur base near render-black edges darkens a thin fringe (scratch/fringe11.py: 24 windows, 1045 px total). Not fixed (would need strictall + re-export loop), listed as residual.
- 19:44 RESUME: export11 still running (map z8 done, lower zooms in progress), not restarted.
- 19:44 Rome tests (npx tsx --test src/*.test.ts): 32 tests, 31 pass, 1 skipped, 0 fail.
- 19:55 export11 done: 761 rendered / 761 painted tiles, map z8 3044 + z2-7 1068, 8327 files in data/web/regions/trento, not published. Shots next.
- 19:57 v11 shots (dev server 4391, shot2 WAIT 15000, 0 failed requests each): shots/v11-1440x900(.png,-render.png), v11-390x844(+render), v11-zoomout-1440x900(+render); stitch z5 62 tiles -> shots/v11-zoomout-fullmap.png 6144x4096 (+ v11-zoomout-fullmap-render.png), shots/v11-zoomout-fullmap-small.png 2400x1600 (composited on BG 232,228,219). v10 sets kept. Visual vs v10 fullmap: Z1-Z4 dark/dense squares softer and closer in tone, no new black wedges/beige triangles; still readable square steps at zoomout on the Bondone/ovest slope south of the Adige (centre-left), around Sardagna/Doss Trento (citta forest windows unchanged), and a few faint style steps (dense crowns vs faint dabs) on the west slope; blackcheck fringe (-50/-14, -14/7) remains as residual.
- 19:57 v11 DONE (local only, nothing published/pushed; Grok-only painting; all replaced files archived under <area>/archive/v11 and data/derived/archive-v11).

## Clouds border (branch clouds, 2026-11-17)
- 10:24 ask (Bogdan pt84u): clouds around the map instead of the flat grey #e8e4dc past the edge fade. Local only, PR, no deploy/R2.
- Assets, Grok GenerateImage only: 2 cloud-sea textures (rejected: perspective/horizon, not top-down) and 2 puff sheets on flat blue; puffs-b unmatted (alpha from blue-red difference, colour un-mixed, faint fringe forced to cream: no blue/white halo; scratch/clouds-unmat.py) into 7 sprites, scattered toroidally into a seamless 1024 tile (scratch/clouds-tile.py) → web/public/clouds/cloud-tile.webp 768², 162910 B. Seam check: wrap column/row diff 1.79/1.87 vs interior neighbour diff 2.68/4.00.
- Mask: pipeline/src/cloud-mask.ts writes web/public/clouds/trento-edge.json (1532 B: the 16 area outlines + 22 union edges + edgeFadePx), the outline export.ts fades to.
- Render: web/src/scripts/clouds.ts (own 4.6 KB chunk, loaded after open; ?noclouds disables): distance field at 128 art px cells (canvas-rasterised inside test), solid cream base where tiles are pure BG, two world-anchored pattern layers of the puff tile (1:1.618) cut to a puff mask reaching 650 art px past the full-paint edge close up / 2600 when zoomed far out (mixed by zoom), dirty-rect only, canvas at 0.6 px per CSS px, redrawn only on view change, z-index 1 under #overlay and the credits. No re-export, no change to the tiles; the edge fade can stay #e8e4dc.
- Checks: pipeline tsc + web tsc OK, npm run build OK, Rome tests 32/31 pass/1 skipped (browser test with MONDO_BROWSER_TESTS=1 passes). Perf (headless Chrome, SwiftShader, scripted pans/zooms, scratch/cloudshot.mts): 1440x900 p95 frame 16.7 ms, 0 long tasks (no clouds: 16.7, 0); 390x844 dpr3 16.8 ms, 0 long tasks; 390x844 CPU 4x: p95 100 ms / 49 long tasks vs 83 ms / 51 without clouds (OSD itself dominates); clouds JS per redraw avg 0.1-1.4 ms, max 10.7 ms at 4x; one-time init 21-30 ms (70 ms at 4x). Full-res canvas cost one frame (p95 33 ms) in software raster, hence 0.6.
- Shots: shots/clouds-{1440x900,390x844}-{default,zoomout,zoomout-nw,zoomout-se,zoomout-sw}.png, baseline shots/noclouds-*.png.

## v12 diagnosis (read-only, 2026-11-18)
- 11:50 ask: Bogdan on live map "alcune aree sono completamente sbagliate ... linee distintive" (7 screenshots described). Read-only: no repaint/export/commit/publish. Live tiles-map.66a0691907 == local data/web export (so local export = what Bogdan sees).
- Tools (new, scratch/): v12-mosaic.py (z6 art + render mosaics, 1 px = 4 art px), v12-owner.py (export owner area per 1024 tile), v12-edges.py (CIELAB step on every window edge at offsets 0/64/128, minus texture median, minus the same step on the render), v12-lines.py (any long axis-aligned step), v12-defects.py, v12-sheet.py, v12-z8.py. Data: paint-test/v12-edges.json, v12-defects.json, v12-edges-duomo.json, v12-outliers.json.
- Root cause (measured): of 361 window edges with score > 8 (dE76 excess), 310 (86%) sit exactly at an overlap BOUNDARY (offset 0: 167, offset 128: 143) and only 51 at the feather centre (64); score > 15: 67 of 72 at 0/128. The later-painted window holds a pasted copy of its neighbour in its 128 px overlap, and its own content starts at the strip edge with a different tone/style; the 64 px feather is centred inside that copy, so the step is inside one window's pixels and no assemble feather can hide it. Steps are mostly +L +b (pale/yellow meadow vs dark forest, dE 25-60).
- Bogdan's 7: 1 cortesano -13_-16|-13_-15, -14_-15|-14_-14 (h, dE step 36-40); 2 ovest -3_4|-3_5, -3_5|-3_6, -4_4|-4_5, citta -1_3|-1_4 (27-30); 3 sud 3_6|3_7, 3_7|4_7 (ravina-monte window 3_7 pale, 29-30); 4 sud 5_10|6_10 v (33), 5_9|5_10; 5 gardolo -15_-5|-15_-4, -16_-4|-16_-3, -15_-3|-15_-2 (28-38); 6 vela-nord -24_-7 (vines with hard top/left cut at its strip edge, tone step only dE ~5 but content mismatch; rainbow haze band is in the Grok painting itself since v10); 7 gardolo -23_-9|-23_-8 (pale cream, 41.5), -22_-10|-22_-9 (tan field bottom edge, 20), -23_-10|-22_-10, spini -18_-9|-18_-8 (feather seam, 24) and -19_-8|-18_-8 (darker tracks window ending in a vertical line, 17).
- Shots: shots/v12-bogdan-defects.png, shots/v12-def-{1..7}.png (+ -edges.png with the measured edges), shots/v12-top30-{a,b}.png.
- Plan proposed (not started): new deterministic stripfix (seamfix-style CIELAB offset at the strip edge diffused ~320 px into the later window, split both sides) on ~220 edges / ~330 windows (score > 10), Grok repaints only for wrong content (~15 windows, ~30-45 generations, estimate), then full close-out and re-export; R2 publish only with Bogdan's yes via Esperto Cloudflare.

## v12 seams round (approved by Bogdan, local only, 2026-11-18)
- 12:00 start. Branch v12-seams (local, off clouds; no push). Archives -> data/derived/archive-v12/ (web-trento-v11.tgz, windows-v11.tar incl. palette-qa + manual, paint-v11.tar). Plan: Grok repaints (GenerateImage only) of ~15 wrong-content windows, composited with a wide soft mask + gate; then scratch/stripfix.py (CIELAB, 320 px fade, split both sides) on flagged strip edges; strictall ALL=16; rescan; close-out.
- 12:20 Grok repaints (GenerateImage only). Round a = trace render+painted band (input) with the 3x3 art as style ref; round b = edit of the current window. Gate = register.ts vs window render (NCC). Composite = scratch/v12-comp.py (registered Grok, mask 0 at window border -> 1 at 128 px smoothstep, render-black and Grok-black kept old; `veg` = render-green only; `--full` = whole window + same pixels into the 8 neighbours' bands). Accepted (gate of the composite, old window in brackets): gardolo -23_-8 b .776 (.785), gardolo -19_-8 b .739 (.797), sud 6_10 b --full .712 (.622; strip of houses not in the render removed, bands written into 5_9 5_10 5_11 6_9 6_11 7_9 7_10 7_11), sardagna -14_1 b .645 (.745; meadow -> forest), ravina-monte 3_7 a .583 (.56), vela-nord -24_-7 a .417 (.501; rainbow band gone), vela-sud -14_0 a .424 (.729; pale meadow -> forest), martignano -2_-12 b veg .502 (.679), cortesano -14_-11 b veg .567 (.729; haze over the forest replaced). Rejected: ovest -3_5 (a .126, b .196 <.3; old .121, left to stripfix). Raw Grok scores: -14_-11 a .152 b .174, -23_-8 a .133, 6_10 a .224, -2_-12 a .209 b .31, -24_-7 b .223, -14_0 b .26, -19_-8 a .634, -14_1 a .347 (free repaints re-layout the scene; only edits or masked composites pass). Not repainted after a look: calisio -11_-12, povo 5_-9, ravina-monte 5_10 (layout fine, tone only -> stripfix). Originals in data/derived/archive-v12/windows/<area>/. strictall of the 8 touched areas running (/tmp/strict12a.log).
- 12:41 cycle v12b (strictall ALL=16 after the --full composites): all 16 assembled, 2104 overlaps max 11.73, 0 > 12. Scan pm-v12b: 1606 edges, >10 245, >8 391, >15 74, max 36.9 (repaints add new strip edges; stripfix next). Defects 1-7 max: 27.3 24.7 20.4 15.7 27.0 13.8 36.9.
- Preview (stripfix field applied to the mosaic, pm-v12a): one pass t=10 predicts >10 234 -> 26, max 19.
- 12:46 stripfix pass 1 (t=10, 245 edges on 216 lines) applying to windows, chained to cycle v12c (/tmp/stripfix1.log, /tmp/cycle-v12c.log).
- 12:51 RESUME BLOCK: if pid of 'stripfix.py ... pe-v12b' or v12-cycle.sh v12c alive -> wait. Else: if /tmp/stripfix1.log lacks 'applied' -> restore windows from data/derived/archive-v12/windows/ ONLY for files changed after 12:46 is NOT needed (stripfix is additive on archived originals? no: it edits current files) -> safest: rerun from windows-v11.tar + composites. If applied but cycle v12c missing -> scratch/v12-cycle.sh v12c. Then pass 2: stripfix pe-v12c pm-v12c --t=8, cycle v12d; then close-out.
- 12:54 stripfix pass 1 applied: 643 window files changed (originals in archive-v12). cycle v12c (strictall 16 + scan) running, /tmp/cycle-v12c.log. RESUME: if not running and log lacks 'CYCLE v12c done' -> setsid scratch/v12-cycle.sh v12c.
- 13:05 cycle v12c stopped: palette QA 1 overlap -18_-16|-18_-15 12.17 -> seamfix -18_-15 top from -18_-16; v12-cycle.sh now strictalls area by area and stops at the first QA error. cycle v12c restarted (setsid, /tmp/cycle-v12c.log).
- 13:20 cycle v12c (after stripfix pass 1): strictall 16 OK max 11.71 0>12. pm-v12c scan: >10 28, >8 198, >15 4, max 19.0. Defects: 10.9 18.8 9.1 5.7 11.4 12.2 12.8. Next: preview pass 2 t=8, then apply + cycle v12d.
- 13:21 preview pass 2 (t=8, 198 edges): predicts >10 5, >8 21, max 15.1, defects 8.9 10.8 7.7 5.7 8.4 7.9 8.5. Applying pass 2 + cycle v12d (setsid; /tmp/stripfix2.log, /tmp/cycle-v12d.log). RESUME: if neither alive and no 'CYCLE v12d done' -> if stripfix2.log has 'applied' run setsid scratch/v12-cycle.sh v12d, else rerun the chain.
- 13:38 cycle v12d (after stripfix pass 2, t=8, 198 edges on 195 lines, 602 window files): strictall 16 OK, 2104 overlaps max 11.83, 0 > 12. Scan pm-v12d: 1605 edges, >10 6, >8 21, >15 1, max 15.1, p95 7.5. Defects 1-7: 8.9, 10.8 (ovest -3_5|-3_6), 7.7, 5.6, 8.4, 7.9, 7.8. Top: -20_-6|-20_-5 gardolo 15.1 (off 64), 9_-7|10_-7 povo 11.8, -3_5|-3_6 ovest 10.8, -24_-11|-24_-10 gardolo 10.7, -11_-12|-11_-11 nord 10.4.
- 13:45 targeted stripfix --only=-3_5|-3_6 (t=6, 6 windows), strictall ovest/ravina-monte/sardagna OK (max 11.83, 0>12). Scan pm-v12e: >10 5, >8 20, >15 1, max 15.1; defect 2 10.8 -> 10.1 (now -4_4|-4_5).
- tonecheck after that showed a regression: the forest repaints sardagna -14_1 + vela-sud -14_0 made a dark 2-window block (pairs 22.0/22.0/20.7/19.6). Fix: scratch/v12-blocktone.py = Lab shift (ring - block, +15.4 -3.1 +8.8) inside the block, 320 px cosine fade, 12 window files; strictall nord/gardolo/ovest/vela-sud/sardagna OK (max 11.83, 0>12).
- 13:55 tonecheck 16 final (paint-test/tone-v12-final.json): 659 pairs median 1.42, p90 4.42, max 11.75, 26 > 6 (v11 final 1.30 / 4.04 / 13.78 / 27). Final scan pm-v12f running (/tmp/stats-v12f.txt). RESUME: next clean.mts dry x16, rebase2 drift, rawcheck, holecheck, blackcheck(after export), export detached /tmp/export12.log.
- 14:03 clean.mts dry x16: 0 windows. rawcheck 16: 761 tiles, 0 failing (warn -20_-9 raw 2.3%, -25_-8 2.2%, 2_-15 2.4%, 0_0 black 1.3%). holecheck 16: 0 hole pts. Final scan pm-v12f (after blocktone) = pm-v12e numbers: >10 5, >8 20, >15 1, max 15.1; defects 8.9 10.1 7.7 5.6 8.4 7.9 7.8. EXPORT all 16 started detached (/tmp/export12.log), rebase2 drift running (/tmp/rebase12.log). RESUME: if export not running and log has no final summary -> rerun export (setsid); after it: blackcheck z8, export-scan (v12-mosaic.py 6 + v12-edges.py OUT=edges-v12), ba crops (AFTER=/workspace/v12/edges-v12.json python3 scratch/v12-ba.py), shots, commit on v12-seams.
- 14:10 rebase2 drift (no --apply): same pattern as v11 (cortesano 18,15,8; povo -5,-7,-7; martignano -4,-5,-7; others <=6), unclamped max resid 11.83 in all -> no rebase. web tsc + pipeline tsc OK; Rome tests 32: 31 pass, 1 skipped, 0 fail.
- Before/after crops (BEFORE = v11 export z8, AFTER = v12 assembled art; scores = assembled-art scans pe-v11 -> pe-v12f): shots/v12-ba-1..7 (defects 27.4->8.9, 24.7->10.1, 28.6->7.7, 27.9->5.6, 27.1->8.4, 9.9->7.9, 34.7->7.8), v12-ba-8..10 (top edges spini -14_-12|-14_-11 48.3->6.0, martignano -2_-13|-2_-12 35.9->7.8, gardolo -23_-9|-23_-8 34.7->7.9). Assembled-art scan totals v11 -> v12: >10 235->5, >8 387->20, >15 74->1, max 48.3->15.1, p95 14.7->7.5 (the 221 of the diagnosis was on the export z6 mosaic). Still visible: defect 2 forest block texture (dense vs faint crowns) below Doss Trento, faint window lines in defect 1, light rectangle on the right of defect 7. Export running (/tmp/export12.log). RESUME: after export -> blackcheck, export-scan, AFTER_SRC unset ba crops from export, v12 shots + fullmap.
- 14:18 export12 still running (1693 tile files written), not restarted. Texture-match estimate (detail amp mean|L-gauss(L,1.5)| on pm-v12f, green px, window interiors; ESTIMATE): -14_0 2.82 / -14_1 3.32 vs ring ~1.1 (gain ~0.35, beyond texfix maxgain 2 -> partial only); defect 2 row j=3 ~2.0-2.2 vs j=4 1.3-1.6 / j=5 ~1.1 (gain ~0.65, inside texfix range); defect 7 rail yard is non-forest (texfix n/a, tone/haze). RESUME: wait export, then blackcheck/scan/ba/shots.
- 14:42 export12: map z8 3044 done, lower zooms running (not restarted). blackcheck z8: 20 tiles with blob >=150 px (v11 16): new -2/-5 365, 4/-3 221, 4/-2 214, 3/1 202, 3/0 174, 1/0 156; gone 1/2, 3/-3 = city tree shadows/dark crowns slightly darker after palette solve (visual check -2/-5, 4/-3: no wedge/hole artefact). ba crops regenerated from export z8: shots/v12-ba-1..17 (8..17 = top-10 v11 edges).
- 15:05 export12: map z8 3044 + z2-7 1068 done, photo z8 3044 done, photo z2-7 running (not restarted). Export scan (z6 of exported map, /workspace/v12/ex-v12.npy, edges-v12.json; v11 mosaic kept as mosaic-z6.npy / -v11): v11 -> v12 >10 221->10, >8 361->35, >15 72->2, max 48.7->16.2 (calisio -6_-11|-6_-10 off 64), p95 14.3->7.5; defects 27.0->8.2, 24.3->10.0, 28.2->7.8, 25.2->7.7, 26.7->8.2, 9.7->8.4, 35.3->11.0. Shots (map layer, 0 failed requests): shots/v12-1440x900.png, v12-390x844.png, v12-zoomout-1440x900.png; fullmap z5 62 tiles shots/v12-zoomout-fullmap.png 6144x4096 + -small.png 2400x1600 (faint square texture steps still readable on the west forest slope). -render variants taken while photo z2-7 was still exporting.
- 15:17 export12 DONE: world.json 761 rendered / 761 painted, 8331 files in data/web/regions/trento (not published). All 6 v12 shots retaken after export end (0 failed requests): shots/v12-{1440x900,390x844,zoomout-1440x900}{,-render}.png.
