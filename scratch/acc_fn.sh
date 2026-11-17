acc () 
{ 
    scratch/acc.sh $1 $A/$2.jpg $3 && python3 scratch/dewhite.py trento-est $1
}
