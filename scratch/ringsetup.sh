#!/bin/bash
# usage: ringsetup.sh <area> <ctx csv> <order-out> <lo-out> : order (MAXR 40) -> shared windows (owner, gap) -> archive gap>=0.01 shared windows
# from their owner (archive/shared-<short>) and keep them; drop gap<0.01 (reused via --context); own-render coverage <0.3 and not a repainted shared window -> tail (strip-only list)
set -eu; cd /workspace/mondoiso-trento; A=$1; C=$2; O=$3; L=$4; short=${A#trento-}
all=$(AREA=$A MAXR=40 npx tsx scratch/order.mts | tail -1)
: > /tmp/shared_$short.txt
for w in $all; do for c in ${C//,/ }; do [ -f data/derived/$c/windows/$w.png ] && echo "$w $c" >> /tmp/shared_$short.txt && break; done; done
reuse=""; rep=""
if [ -s /tmp/shared_$short.txt ]; then
  while read w o est gapl gap; do
    if awk "BEGIN{exit !($gap>=0.01)}"; then rep="$rep $w:$o"; else reuse="$reuse $w"; fi
  done < <(npx tsx scratch/sharedgap.mts $A $C < /tmp/shared_$short.txt)
fi
for p in $rep; do w=${p%%:*}; o=${p#*:}; mkdir -p data/derived/$o/archive/shared-$short; mv data/derived/$o/windows/$w.png data/derived/$o/archive/shared-$short/; done
keep=""; for w in $all; do [[ " $reuse " == *" $w "* ]] || keep="$keep $w"; done
hi=""; lo=""
# a repainted shared window carries the owner's painted content: it is ALWAYS painted, never strip-only (a strip-only render
# copy of it showed raw render inside the neighbour; v7 defect fix 14:30)
while read w c; do if awk "BEGIN{exit !($c>=0.3)}" || [[ " $rep " == *" $w:"* ]]; then hi="$hi $w"; else lo="$lo $w"; fi; done < <(npx tsx scratch/cov.mts $A $A $keep)
echo $hi $lo > $O; echo $lo > $L
echo "windows $(echo $all | wc -w) shared $(wc -l < /tmp/shared_$short.txt) repaint:$(echo $rep | wc -w) [$rep ] reuse:$(echo $reuse | wc -w) [$reuse ] -> order $(echo $hi $lo | wc -w) (paint $(echo $hi | wc -w), strip-only $(echo $lo | wc -w))"
