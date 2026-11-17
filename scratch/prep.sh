#!/bin/bash
# usage: prep.sh <i_j> -> builds work/<i_j>/input.png (with painted neighbour strips) + prompt.txt; prints edges + landmarks
set -u; cd /workspace/mondoiso-trento
w=$1; rm -f data/derived/${AREA:-trento-duomo}/manual/$w.png
PAINT_BACKEND=manual npm run paint -- ${AREA:-trento-duomo} ${CTX:+--context=$CTX} --window=${w/_/,} --force >/dev/null 2>&1
p=data/derived/${AREA:-trento-duomo}/work/$w/prompt.txt
echo "edges: $(grep -oE 'along the [a-z ]+ edge' $p | head -1)"
grep -oE '^- [^(]{3,60}\(' $p | grep -v "Image\|Same\|Every\|Streets\|Layering" | sed 's/ (//' | head -4
