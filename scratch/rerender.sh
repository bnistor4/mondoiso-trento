#!/bin/bash
# usage: rerender.sh <pairs-file "area i_j">  : archive render+height to <area>/archive/v10/, re-render with the v10 footprint
cd /workspace/mondoiso-trento
while read a k; do
  for d in render height; do mkdir -p data/derived/$a/archive/v10/$d; [ -f data/derived/$a/archive/v10/$d/$k.png ] || cp data/derived/$a/$d/$k.png data/derived/$a/archive/v10/$d/ 2>/dev/null; done
  for t in 1 2 3; do npm run render -- $a --only=${k/_/,} --force -j 1 2>&1 | grep -qE "^  $k: [0-9.]+s" && { echo "$a $k ok"; break; }; echo "$a $k try$t failed"; done
done < "$1"
