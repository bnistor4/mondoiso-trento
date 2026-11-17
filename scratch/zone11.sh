#!/bin/bash
# usage: zone11.sh <area,area> [from=1|2|3|4] : v11 deterministic forest harmonization of one zone:
# 1 texfix sigma 1.2 maxgain 2, 2 tonefix sigma 1.2, reassemble; 3 texfix sigma 2.5 maxgain 3, 4 tonefix sigma 2, reassemble (strictall over the zone areas, ALL=16 context)
cd /workspace/mondoiso-trento; Z=$1; F=${2:-1}; A16=$(cat /tmp/all16); export ALL=$A16; ZA=$(echo $Z | sed 's/[^,]*/trento-&/g')
[ $F -le 1 ] && python3 scratch/texfix.py $Z $A16 | rg "^texfix"
if [ $F -le 2 ]; then python3 scratch/tonefix.py $Z $A16 --archive=v11 | rg "^tonefix"; bash scratch/strictall.sh $ZA 2>&1 | rg "over12" | tee /tmp/zone11-qa.txt
  rg -q "Error" /tmp/zone11-qa.txt && { echo "zone11 $Z STOPPED after step 2: palette QA >12, seamfix then rerun from 3 (after a clean reassemble)"; exit 1; }; fi
[ $F -le 3 ] && python3 scratch/texfix.py $Z $A16 --sigma=2.5 --maxgain=3 | rg "^texfix"
[ $F -le 4 ] && { python3 scratch/tonefix.py $Z $A16 --archive=v11 --sigma=2 | rg "^tonefix"; bash scratch/strictall.sh $ZA 2>&1 | rg "over12"; }
echo "zone11 $Z done $(date +%H:%M)"
