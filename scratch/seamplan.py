# usage: seamplan.py <qa.json> <log> : for each failing pair (>12) seamfix the later-painted window from the other
import json,sys,os
d=json.load(open(sys.argv[1])); order={}
for i,l in enumerate(l for f in sys.argv[2].split(',') for l in open(f)):
    p=l.split('\t')
    if len(p)>1: order[p[1]]=i
def path(w):
    for a in ['trento-martignano','trento-povo','trento-spini','trento-est','trento-sud','trento-citta','trento-nord']:
        f=f'data/derived/{a}/windows/{w}.png'
        if os.path.exists(f): return f
pairs=[x for x in d['residuals'] if x['error']>12]
cmds=[]
for x in pairs:
    a,b=x['a'],x['b']; ai,aj=map(int,a.split('_')); bi,bj=map(int,b.split('_'))
    later,src=(b,a) if order.get(b,-1)>=order.get(a,-1) else (a,b)
    li,lj=map(int,later.split('_')); si,sj=map(int,src.split('_'))
    side={(1,0):'left',(-1,0):'right',(0,1):'top',(0,-1):'bottom'}[(li-si,lj-sj)]
    cmds.append((order.get(later,-1),f'npx tsx scratch/seamfix.mts {path(later)} {path(src)} {side}'))
for _,c in sorted(cmds): print(c)
