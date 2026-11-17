#!/bin/bash
# batch.sh minus the strip-only tail listed in /tmp/lo6.txt
cd /workspace/mondoiso-trento; N=${1:-5}; picked=(); LO=" $(cat ${LOF:-/tmp/lo6.txt}) "
adj() { local a=$1 b=$2; local ai=${a%_*} aj=${a#*_} bi=${b%_*} bj=${b#*_}; local di=$((ai-bi)) dj=$((aj-bj)); [ $((di*di+dj*dj)) -eq 1 ]; }
for w in $(scratch/nextwin.sh 40); do
  [[ "$LO" == *" $w "* ]] && continue
  ok=1; for p in "${picked[@]}"; do adj $w $p && ok=0; done; [ $ok = 1 ] || continue
  e=$(scratch/prep.sh $w | head -1 | sed -E 's/^edges: ?//; s/along the //; s/ edge$//; s/ and /,/g')
  [ -z "$e" ] && continue
  picked+=($w); echo "$w $e"; [ ${#picked[@]} -ge $N ] && break
done
