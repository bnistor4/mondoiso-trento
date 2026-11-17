#!/bin/bash
# usage: cycle.sh "<w> <hash> <edges>" ... : accept (asset hash, no path/ext) + next batch + input thumbnails + render|painting sheet of accepted
cd /workspace/mondoiso-trento; A=/cursor/stores/user/grok-bot/agents/d3fc85fc-b4f0-451d-8faf-4c6678c2b9a5/assets; args=(); ws=()
for t in "$@"; do set -- $t; case $2 in /*) f=$2;; *) f=$A/$2.jpg;; esac; args+=("$1 $f $3"); ws+=($1); done
[ ${#args[@]} -gt 0 ] && scratch/accb.sh "${args[@]}" 2>&1 | grep -E "logged|Error|reject|dewhite [^ ]+ [1-9]"
python3 - "${ws[@]}" <<PY
import sys,os
from PIL import Image
S=896;T=1024;a=os.environ['AREA']; ws=sys.argv[1:]
if ws:
  o=Image.new('RGB',(len(ws)*200,400))
  for k,w in enumerate(ws):
    i,j=map(int,w.split('_')); x0,y0=i*S,j*S; c=Image.new('RGB',(1024,1024))
    for ty in range(y0//T,(y0+1023)//T+1):
      for tx in range(x0//T,(x0+1023)//T+1):
        for ar in [a]+os.environ.get('CTX','').split(','):
          f=f'data/derived/{ar}/render/{tx}_{ty}.png'
          if os.path.exists(f): c.paste(Image.open(f).convert('RGB'),(tx*T-x0,ty*T-y0)); break
    o.paste(c.resize((200,200)),(k*200,0))
    f=f'data/derived/{a}/windows/{w}.png'
    if os.path.exists(f): o.paste(Image.open(f).convert('RGB').resize((200,200)),(k*200,200))
  o.save('/tmp/acc.png')
PY
scratch/batch6.sh ${N:-6} | tee /tmp/b.txt
[ -s /tmp/b.txt ] && python3 scratch/inputs.py $AREA $(cut -d' ' -f1 /tmp/b.txt)
true
