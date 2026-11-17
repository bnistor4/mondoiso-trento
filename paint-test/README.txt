Trento paint test (area trento-duomo). One folder per 1024 px paint window:
  1 = window 0_-1  Duomo + Piazza Duomo
  2 = window 0_-3  Castello del Buonconsiglio
  3 = window -1_-2 Via Belenzani / Santa Maria Maggiore side
Files: input.png (render, the base to edit), height.png (terrain-relative height pass),
style.png = reference.png (pipeline/style/reference.png), trees.png (species sheet),
prompt.txt (exact Codex prompt paint.ts builds, Trento variant), prompt-grok.txt (same text without the Codex tool steps).

Feed back a painting:
  cp painted.png data/derived/trento-duomo/manual/<window>.png      # e.g. manual/0_-1.png, any size/format, resized to 1024
  PAINT_BACKEND=manual npm run paint -- trento-duomo --window=0,-1  # registration QA, writes windows/0_-1.png
