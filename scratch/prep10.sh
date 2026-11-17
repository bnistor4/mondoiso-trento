#!/bin/bash
# usage: prep10.sh "<area> <w>" ... : prep + unblack + prompt file /tmp/p10/<w>.txt ; prints "<area> <w> <edges csv>"; sheet /tmp/inputs10.png
cd /workspace/mondoiso-trento; mkdir -p /tmp/p10; ws=()
for t in "$@"; do set -- $t; a=$1; w=$2; source scratch/envv10.sh $a
  e=$(scratch/prep.sh $w | head -1 | sed -E 's/^edges: ?//; s/along the //; s/ edge$//; s/ and /,/g')
  python3 scratch/unblack.py $a $w >&2
  TPL=${TPL10:-scratch/t3u-v10.txt} scratch/pr.sh "$e" > /tmp/p10/$w.txt; echo "$a $w $e"; ws+=("$a:$w"); done
python3 - "${ws[@]}" <<'P'
import sys
from PIL import Image, ImageDraw
ws=sys.argv[1:]; o=Image.new('RGB',(260*len(ws),270),'white'); d=ImageDraw.Draw(o)
for k,aw in enumerate(ws):
  a,w=aw.split(':'); o.paste(Image.open(f'data/derived/{a}/work/{w}/input.png').convert('RGB').resize((256,256)),(k*260,14)); d.text((k*260+2,1),a[7:]+' '+w,fill='red')
o.save('/tmp/inputs10.png')
P
