#!/bin/bash
# usage: gm.sh <i_j> <painting> <edges csv>  -> brightness-match to painted bands, then go3 auto
set -u; cd /workspace/mondoiso-trento
w=$1; out=/tmp/m_$w.png
(cd pipeline && npx tsx ../scratch/match.mts ../data/derived/$AREA/work/$w/input.png "$2" "$3" $out)
PV=T3u scratch/go3.sh $w $out auto
