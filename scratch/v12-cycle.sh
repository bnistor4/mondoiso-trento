#!/bin/bash
# usage: v12-cycle.sh <tag> : strictall ALL=16 (stop on palette QA errors), then paint mosaic pm-<tag> + edge scan pe-<tag> + stats
cd /workspace/mondoiso-trento; rm -f /tmp/strict-$1.log; export ALL=$(cat /tmp/all16); T=$1
for a in ${ALL//,/ }; do bash scratch/strictall.sh $a >> /tmp/strict-$T.log 2>&1; tail -1 /tmp/strict-$T.log | cut -c1-200
  rg -q "Error" /tmp/strict-$T.log && { echo "CYCLE $T STOPPED: palette QA errors (seamfix the listed pairs, rerun)"; exit 1; }; done
python3 scratch/v12-pmosaic.py pm-$T && ART=pm-$T.npy OUT=pe-$T python3 scratch/v12-edges.py > /tmp/pe-$T.log 2>&1 && python3 scratch/v12-stats.py /workspace/v12/pe-$T.json
echo "CYCLE $T done $(date +%H:%M)"
