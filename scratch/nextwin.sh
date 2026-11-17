#!/bin/bash
# prints the next N windows of $AREA (order file $ORDER, centre-first) with no accepted painting yet;
# windows touching an already painted neighbour (own or $CTX areas) come first so strips always exist
cd /workspace/mondoiso-trento; A=${AREA:-trento-citta}
has() { [ -f data/derived/$A/windows/$1.png ] && return 0; for c in ${CTX//,/ }; do [ -f data/derived/$c/windows/$1.png ] && return 0; done; return 1; }
todo=(); for w in $(cat ${ORDER:-paint-test/order-v2.txt}); do has $w || todo+=($w); done
first=(); rest=()
for w in "${todo[@]}"; do i=${w%_*}; j=${w#*_}
  if has $((i-1))_$j || has $((i+1))_$j || has ${i}_$((j-1)) || has ${i}_$((j+1)); then first+=($w); else rest+=($w); fi; done
echo "${first[@]} ${rest[@]}" | tr -s ' ' | sed 's/^ //' | cut -d' ' -f1-${1:-5}
