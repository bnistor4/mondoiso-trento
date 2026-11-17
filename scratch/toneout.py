# usage: toneout.py <dump.json> <area+area> [thr=4] : forest cells of the zone whose mean Lab differs > thr dE76 from the median of their forest 8-neighbours
import sys,json,numpy as np
d=json.load(open(sys.argv[1])); ZA=sys.argv[2].split('+'); thr=float(sys.argv[3]) if len(sys.argv)>3 else 4
C={tuple(map(int,k.split('_'))):(v[0],np.array(v[1])) for k,v in d['cells'].items()}
out=[]
for (i,j),(a,L) in C.items():
  if a not in ZA: continue
  nb=[C[(i+di,j+dj)][1] for di in(-1,0,1) for dj in(-1,0,1) if (di or dj) and (i+di,j+dj) in C]
  if len(nb)<2: continue
  med=np.median(nb,0); dev=float(np.linalg.norm(L-med))
  if dev>thr: out.append((dev,a,f'{i}_{j}',L-med))
for dev,a,w,dl in sorted(out,reverse=True): print(f'{dev:5.2f} {a} {w} dL{dl[0]:+.1f} da{dl[1]:+.1f} db{dl[2]:+.1f}')
print(len(out),'outliers >',thr)
