#!/bin/bash
# usage: go3.sh <i_j> <painting|-> [auto|<next>]  ring version of go.sh (env AREA, CTX, ORDER, LOG)
set -u; cd /workspace/mondoiso-trento
export AREA=${AREA:-trento-nord} CTX=${CTX:-trento-citta} ORDER=${ORDER:-paint-test/order-v3-nord.txt} LOG=${LOG:-paint-test/scores-v3.tsv}
[ -f $LOG ] || printf 'attempt\twindow\tinputs\tprompt\tmatch\tresult\n' > $LOG
w=$1; img=$2; next=${3:-}
[ "$img" != "-" ] && scratch/step.sh $w $img | grep -E "logged|Error|rejected|SOFT" | tail -2
[ "$next" = auto ] && next=$(scratch/nextwin.sh 1 | tr -d " ")
N=$(wc -w < $ORDER); d=0; for x in $(cat $ORDER); do [ -f data/derived/$AREA/windows/$x.png ] && d=$((d+1)); done  # real count: order windows done (not all area windows)
g=$(awk -F'\t' '$1~/^[0-9]/ && $4!~/strip-only/' $LOG | wc -l)
echo "done=$d/$N gens_ring=$g"
[ "$img" != "-" ] && [ $((d % 5)) -eq 0 ] && echo "- $(date +%H:%M) $AREA: gens=$g, windows done $d/$N ($LOG)" >> TRENTO-PILOT.md
[ -z "$next" ] && exit 0
e=$(scratch/prep.sh $next | head -1 | sed -E 's/^edges: ?//; s/along the //; s/ edge$//')
if [ -z "$e" ]; then echo "NEXT $next: no strips"; else echo "NEXT $next: $(echo "$e" | sed -E 's/ and /, /g; s/, ([a-z]+)$/ and \1/') edges"; fi
mkdir -p /tmp/th; scratch/th.sh $next
true
