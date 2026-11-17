#!/bin/bash
# usage: striponly.sh : for every $LOF window without a painting: prep, copy its render input, log as strip-only. env AREA CTX ORDER LOG LOF
cd /workspace/mondoiso-trento
for w in $(cat $LOF); do
  [ -f data/derived/$AREA/windows/$w.png ] && continue
  scratch/prep.sh $w >/dev/null 2>&1; cp data/derived/$AREA/work/$w/input.png /tmp/so_$w.png
  PV=strip-only scratch/go3.sh $w /tmp/so_$w.png 2>&1 | grep -E "logged|rejected|Error"
done
