#!/bin/bash
# usage: cyc2.sh "<w> <hashprefix> <edges>" ... : resolves prefix to local paint-test/gen/<full>.jpg (or <prefix>fix.png) and runs cycle.sh
cd /workspace/mondoiso-trento; a=()
for t in "$@"; do set -- $t; f=$(ls $PWD/paint-test/gen/$2fix.png 2>/dev/null || ls $PWD/paint-test/gen/$2*.jpg | head -1); a+=("$1 $f $3"); done
exec scratch/cycle.sh "${a[@]}"
