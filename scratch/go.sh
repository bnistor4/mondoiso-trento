#!/bin/bash
# usage: go.sh <i_j> <painting> <next> : accept current (if painting given), then prep next and print the T3 edge phrase
set -u; cd /workspace/mondoiso-trento; export AREA=${AREA:-trento-citta} LOG=${LOG:-paint-test/scores-v2.tsv}
w=$1; img=$2; next=${3:-}
[ "$img" != "-" ] && scratch/step.sh $w $img | grep -E "logged|Error|rejected|SOFT" | tail -2
[ "$next" = auto ] && next=$(scratch/nextwin.sh 1 | tr -d " ")
[ -z "$next" ] && exit 0
e=$(scratch/prep.sh $next | head -1 | sed -E 's/^edges: ?//; s/along the //; s/ edge$//')
if [ -z "$e" ]; then echo "NEXT $next: no strips"; else echo "NEXT $next: $(echo "$e" | sed -E 's/ and /, /g; s/, ([a-z]+)$/ and \1/') edges"; fi
echo "done=$(ls data/derived/$AREA/windows/*.png | wc -l) gens_logged=$(grep -cE "^[0-9]" $LOG)"
d=$(ls data/derived/$AREA/windows/*.png | wc -l); g=$(( 16 + $(grep -cE "^[0-9]" $LOG) - 9 ))
echo "gens_total=$g"
[ $((d % 5)) -eq 0 ] && [ "$img" != "-" ] && echo "- $(date +%H:%M) gens=$g, windows done $d/131 (scores in paint-test/scores-v2.tsv)" >> TRENTO-PILOT.md
true
