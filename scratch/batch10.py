# usage: batch10.py <listfile> [N] : next N non-adjacent "area w" from the list not yet accepted in paint-test/scores-v10.tsv
import sys,csv,os
L=[l.split() for l in open(sys.argv[1]) if l.strip()]; N=int(sys.argv[2]) if len(sys.argv)>2 else 6
done=set()
if os.path.exists('paint-test/scores-v10.tsv'):
  for r in csv.DictReader(open('paint-test/scores-v10.tsv'),delimiter='\t'):
    if r['result'] in('pass','soft','kept-old'): done.add(r['window'])
pick=[]
for a,w in L:
  if w in done: continue
  i,j=map(int,w.split('_'))
  if any(abs(i-int(p[1].split('_')[0]))+abs(j-int(p[1].split('_')[1]))<=1 for p in pick): continue
  pick.append((a,w))
  if len(pick)>=N: break
print(' '.join(f'"{a} {w}"' for a,w in pick))
