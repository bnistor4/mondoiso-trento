#!/bin/bash
# usage: acc.sh <w> <painting> <edges csv> : brightness-match + go3 (no auto next). env AREA CTX ORDER LOG
set -u; cd /workspace/mondoiso-trento; w=$1
(cd pipeline && npx tsx ../scratch/match.mts ../data/derived/$AREA/work/$w/input.png "$2" "$3" /tmp/m_$w.png) | sed 's/^/  /'
(cd pipeline && npx tsx ../scratch/blackmask.mts ../data/derived/$AREA/work/$w/input.png /tmp/m_$w.png) | sed "s/^/  /"
PV=T3u scratch/go3.sh $w /tmp/m_$w.png 2>&1 | grep -E "logged|done=|rejected|SOFT"
