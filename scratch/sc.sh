#!/bin/bash
# usage: sc.sh "<w> <hashprefix>" ... : score assets against AREA inputs
cd /workspace/mondoiso-trento; A=/cursor/stores/user/grok-bot/agents/d3fc85fc-b4f0-451d-8faf-4c6678c2b9a5/assets
for p in "$@"; do set -- $p; f=$(ls $A/$2*.jpg | head -1); npx tsx scratch/score.mts $1 $f 2>&1 | tail -1 | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['w'],'$(basename $f .jpg)',d['score'],d['identity'])"; done
