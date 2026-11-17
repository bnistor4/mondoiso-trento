#!/bin/bash
# usage: rest11.sh "<area> <w> <reason>" ... : visual reject -> archive current try to archive/v11/rejected, restore the original window/.soft/manual/qa from archive/v11
cd /workspace/mondoiso-trento
for t in "$@"; do set -- $t; a=$1; w=$2; r=${3:-visual}; D=data/derived/$a; V=$D/archive/v11; s=$(date +%H%M%S)
  cp $D/windows/$w.png $V/rejected/$w-$s.png; [ -f $D/windows/$w.png.soft ] && mv $D/windows/$w.png.soft $V/rejected/$w-$s.soft
  cp -p $V/windows/$w.png $D/windows/$w.png; [ -f $V/windows/$w.png.soft ] && cp -p $V/windows/$w.png.soft $D/windows/
  [ -f $V/manual/$w.png ] && cp -p $V/manual/$w.png $D/manual/$w.png; [ -f $V/qa/$w.json ] && cp -p $V/qa/$w.json $D/work/$w/qa.json
  echo "$a $w visual-reject-$r" >> paint-test/v11-done.txt; echo "restored $a $w ($r)"; done
