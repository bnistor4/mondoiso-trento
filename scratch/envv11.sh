# usage: source scratch/envv11.sh <area>  : v11 repaint env (CTX = the other 15 areas), archives under <area>/archive/v11
ALL16=trento-citta,trento-nord,trento-sud,trento-est,trento-spini,trento-povo,trento-martignano,trento-gardolo,trento-ovest,trento-cortesano,trento-villamontagna,trento-calisio,trento-vela-sud,trento-vela-nord,trento-sardagna,trento-ravina-monte
export AREA=$1 CTX=$(echo $ALL16 | tr , '\n' | grep -vx "$1" | paste -sd,) LOG=paint-test/scores-v11.tsv TPL=scratch/t3u-est.txt ORDER=/dev/null LOF=/dev/null
mkdir -p data/derived/$1/manual data/derived/$1/archive/v11/{windows,manual,qa,rejected}
[ -f $LOG ] || printf 'attempt\twindow\tinputs\tprompt\tmatch\tresult\n' > $LOG
