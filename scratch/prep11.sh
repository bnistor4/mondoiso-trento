#!/bin/bash
# usage: prep11.sh <zone> "<area> <w>" ... : archive original window/.soft/manual/qa to <area>/archive/v11 (first time only), record its gate
# score in paint-test/v11-orig.tsv, prep input (painted neighbour strips) + unblack, prompt /tmp/p11/<w>.txt from scratch/t-forest-v11-<zone>.txt; sheet /tmp/inputs11.png
cd /workspace/mondoiso-trento; mkdir -p /tmp/p11; z=$1; shift; ws=()
for t in "$@"; do set -- $t; a=$1; w=$2; source scratch/envv11.sh $a; D=data/derived/$a; V=$D/archive/v11
  if [ ! -f $V/windows/$w.png ]; then
    cp -p $D/windows/$w.png $V/windows/$w.png; [ -f $D/windows/$w.png.soft ] && cp -p $D/windows/$w.png.soft $V/windows/
    [ -f $D/manual/$w.png ] && cp -p $D/manual/$w.png $V/manual/$w.png; cp -p $D/work/$w/qa.json $V/qa/$w.json 2>/dev/null
    printf '%s\t%s\t%s\n' $a $w "$(grep -oE '"score":[0-9.]+' $V/qa/$w.json 2>/dev/null | cut -d: -f2)" >> paint-test/v11-orig.tsv; fi
  e=$(scratch/prep.sh $w | head -1 | sed -E 's/^edges: ?//; s/along the //; s/ edge$//; s/ and /,/g')
  [ -f $D/windows/$w.png ] || cp -p $V/windows/$w.png $D/windows/$w.png   # prep must never lose the accepted window
  [ -f $D/manual/$w.png ] || { [ -f $V/manual/$w.png ] && cp -p $V/manual/$w.png $D/manual/$w.png; }   # prep.sh removes manual/<w>.png; put the current one back
  python3 scratch/unblack.py $a $w >&2
  TPL=scratch/t-forest-v11-$z.txt scratch/pr.sh "$e" > /tmp/p11/$w.txt; echo "$a $w $e"; ws+=("$a:$w"); done
python3 - "${ws[@]}" <<'P'
import sys
from PIL import Image, ImageDraw
ws=sys.argv[1:]; o=Image.new('RGB',(260*len(ws),270),'white'); d=ImageDraw.Draw(o)
for k,aw in enumerate(ws):
  a,w=aw.split(':'); o.paste(Image.open(f'data/derived/{a}/work/{w}/input.png').convert('RGB').resize((256,256)),(k*260,14)); d.text((k*260+2,1),a[7:]+' '+w,fill='red')
o.save('/tmp/inputs11.png')
P
