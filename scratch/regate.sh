#!/bin/bash
# usage: regate.sh "<area> <w>" ... : re-run the paint.ts gate on the accepted manual/<w>.png (inputs rebuilt from current neighbours)
cd /workspace/mondoiso-trento
for t in "$@"; do set -- $t; source scratch/envv10.sh $1; rm -f data/derived/$1/windows/$2.png.soft
  PAINT_BACKEND=manual MONDO_SOFT_PALETTE=1 npm run paint -- $1 --context=$CTX --window=${2/_/,} --force 2>&1 | grep -E "^  $2" | tail -1
  echo "  regate $1 $2 $(grep -oE '"score":[0-9.]{5}' data/derived/$1/work/$2/qa.json) soft=$([ -f data/derived/$1/windows/$2.png.soft ] && echo y || echo n)"; done
