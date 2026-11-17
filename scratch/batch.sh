#!/bin/bash
# usage: batch.sh "<w> <hashprefix>" ... : copy assets locally, score, darkchk; auto-patch black-over-content (out black where input not) into paint-test/gen/<h>fix.png
cd /workspace/mondoiso-trento; A=/cursor/stores/user/grok-bot/agents/d3fc85fc-b4f0-451d-8faf-4c6678c2b9a5/assets
for p in "$@"; do set -- $p; f=$(ls $A/$2*.jpg | head -1); cp $f paint-test/gen/; i=data/derived/$AREA/work/$1/input.png
 d=$(python3 scratch/darkchk.py $i $f)
 if [ "$d" != "[]" ]; then python3 -c "
from PIL import Image;import numpy as np
i=np.asarray(Image.open('$i').convert('RGB').resize((1024,1024))).astype(int);o=np.asarray(Image.open('$f').convert('RGB').resize((1024,1024))).astype(int).copy()
m=(o.max(2)<30)&(i.max(2)>=30);o[m]=i[m];Image.fromarray(o.astype('uint8')).save('paint-test/gen/$2fix.png')"; f=$PWD/paint-test/gen/$2fix.png; d="$d -> fixed $(python3 scratch/darkchk.py $i $f)"; fi
 s=$(npx tsx scratch/score.mts $1 $f 2>&1 | tail -1 | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['score'],d['identity'])")
 echo "$1 $f $s dark=$d"; done
