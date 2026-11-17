#!/bin/bash
# usage: strictall.sh <area,...> : strict assemble each listed area with all other painted trento areas as --context; prints tiles + union max residual
set -u; cd /workspace/mondoiso-trento/pipeline; export PAINT_BACKEND=manual
ALL=${ALL:-trento-citta,trento-nord,trento-sud,trento-est,trento-spini,trento-povo,trento-martignano}
for a in ${1//,/ }; do
  ctx=$(echo $ALL | tr , '\n' | grep -vx $a | paste -sd,)
  r=$(npx tsx src/paint.ts $a --context=$ctx --assemble 2>&1 | grep -E "assembled|Error:" | tail -1)
  q=$(python3 -c "import json;d=json.load(open('../data/derived/$a/palette-qa.json'));r=d['residuals'];print(len(r),'overlaps max %.2f'%max(x['error'] for x in r),'over12',sum(x['error']>12 for x in r),[(x['a'],x['b'],round(x['error'],2)) for x in r if x['error']>12])")
  echo "$a: $r | $q"
done
