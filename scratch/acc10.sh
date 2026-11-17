#!/bin/bash
# usage: acc10.sh "<area> <w> <hashprefix>" ... : copy Grok asset to paint-test/gen, accept (acc.sh+dewhite) in that area's v10 env
cd /workspace/mondoiso-trento; G=/cursor/stores/user/grok-bot/agents/d3fc85fc-b4f0-451d-8faf-4c6678c2b9a5/assets
for t in "$@"; do set -- $t; f=$(ls $G/$3*.jpg | head -1); cp -n $f paint-test/gen/; source scratch/envv10.sh $1
  scratch/accb.sh "$2 $f left,right,top,bottom" 2>&1 | grep -E "logged|dewhite [^ ]+ [1-9]|Error"
  echo "  gate $1 $2 $(grep -oE '"score":[0-9.]{5}' data/derived/$1/work/$2/qa.json)"; done
