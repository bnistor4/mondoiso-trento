#!/bin/bash
# usage: acc11.sh "<area> <w> <img>" ... : accept Grok image (acc.sh+dewhite) in v11 env, compare gate with original (paint-test/v11-orig.tsv);
# if rejected or lower than original: archive the try in archive/v11/rejected and restore the original window/.soft/manual/qa. Prints verdict.
cd /workspace/mondoiso-trento
for t in "$@"; do set -- $t; a=$1; w=$2; img=$3; source scratch/envv11.sh $a; D=data/derived/$a; V=$D/archive/v11
  mkdir -p paint-test/gen11; cp -n "$img" paint-test/gen11/ 2>/dev/null
  scratch/accb.sh "$w $img left,right,top,bottom" 2>&1 | grep -E "logged|Error" | sed 's/^/  /'
  new=$(grep -oE '"score":[0-9.]+' $D/work/$w/qa.json | cut -d: -f2); old=$(awk -F'\t' -v a=$a -v w=$w '$1==a&&$2==w{print $3}' paint-test/v11-orig.tsv | head -1)
  if [ ! -f $D/windows/$w.png ] || python3 -c "import sys;sys.exit(0 if float('${new:-0}')<float('${old:-0}') else 1)"; then
    [ -f $D/windows/$w.png ] && cp $D/windows/$w.png $V/rejected/$w-$(date +%H%M%S).png
    cp -p $V/windows/$w.png $D/windows/$w.png; [ -f $D/windows/$w.png.soft ] && mv $D/windows/$w.png.soft $V/rejected/$w-$(date +%H%M%S).soft; [ -f $V/windows/$w.png.soft ] && cp -p $V/windows/$w.png.soft $D/windows/
    [ -f $V/manual/$w.png ] && cp -p $V/manual/$w.png $D/manual/$w.png; [ -f $V/qa/$w.json ] && cp -p $V/qa/$w.json $D/work/$w/qa.json
    echo "$a $w restored ${new:-none} ${old:-?}" >> paint-test/v11-done.txt; echo "  RESTORED $a $w gate ${new:-none} < orig ${old:-?}"
  else echo "$a $w kept $new ${old:-?}" >> paint-test/v11-done.txt; echo "  KEPT $a $w gate $new (orig ${old:-?})$([ -f $D/windows/$w.png.soft ] && echo ' soft')"; fi; done
