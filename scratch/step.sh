#!/bin/bash
# usage: step.sh <i_j> <painting> [next] : accept + log row in scores.tsv + prep next window
set -u; cd /workspace/mondoiso-trento
w=$1; img=$2; next=${3:-}
s=$(npx tsx scratch/score.mts $w $img | grep -oE '"score":[0-9.]+' | cut -d: -f2)
out=$(scratch/accept.sh $w $img 2>&1 | tail -2)
echo "$out"
edges=$(echo "$out" | grep -oE 'edges=[a-z+]*' | cut -d= -f2)
st=pass; [ -f data/derived/${AREA:-trento-duomo}/windows/$w.png.soft ] && st=soft; [ -f data/derived/${AREA:-trento-duomo}/windows/$w.png ] || st=rejected
n=$(( $(grep -cE '^[0-9]' ${LOG:-paint-test/scores.tsv}) + 1 ))
printf '%02d\t%s\tinput\t%s (strips: %s)\t%s\t%s\n' $n $w "${PV:-T3b}" "${edges:-none}" "$s" "$st" >> ${LOG:-paint-test/scores.tsv}
echo "logged $n $w $s $st"
[ -n "$next" ] && scratch/prep.sh $next | head -1
