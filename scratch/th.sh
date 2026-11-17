#!/bin/bash
# thumb of a window input: scratch/th.sh <w>
cd /workspace/mondoiso-trento && node -e 'require("sharp")(process.argv[1]).resize(256).toFile("/tmp/th/"+process.argv[2]+".png")' data/derived/${AREA:-trento-citta}/work/$1/input.png $1
