#!/bin/bash
# usage: pr.sh <edges csv> : T3u-est prompt with the painted-edge sentence
e=$(echo "$1" | sed -E 's/,/, /g; s/, ([a-z]+)$/ and \1/')
s="The strips along the $e edge(s) of the attached image are already painted picture content: keep them exactly as they are, never black them out, with the same brightness and colours, and continue them seamlessly into the rest."
sed "s|EDGES\.|$s|" ${TPL:-scratch/t3u-est.txt}
