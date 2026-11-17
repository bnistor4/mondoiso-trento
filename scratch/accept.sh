#!/bin/bash
# usage: accept.sh <i_j> <painting>  -> manual/<i_j>.png, pipeline registration QA, prints the match line
set -u; cd /workspace/mondoiso-trento
w=$1; cp "$2" data/derived/${AREA:-trento-duomo}/manual/$w.png
PAINT_BACKEND=manual MONDO_SOFT_PALETTE=1 npm run paint -- ${AREA:-trento-duomo} ${CTX:+--context=$CTX} --window=${w/_/,} --force 2>&1 | grep -E "^  $w|palette|Error" | head -5
