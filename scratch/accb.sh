#!/bin/bash
# usage: accb.sh "<w> <img> <edges>" ... : acc.sh + dewhite for each
cd /workspace/mondoiso-trento
for t in "$@"; do set -- $t; echo "== $1"; scratch/acc.sh $1 $2 $3; [ -f data/derived/$AREA/windows/$1.png ] && python3 scratch/dewhite.py $AREA $1; done
