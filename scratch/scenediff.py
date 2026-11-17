# usage: scenediff.py <area> : tiles whose scene bin changed vs archive/prebin (and have a render tile)
import json,os,sys
a=sys.argv[1]; D=f'data/derived/{a}'; ch=[]
for f in sorted(os.listdir(f'{D}/scene')):
  n=json.load(open(f'{D}/scene/{f}')); p=f'{D}/archive/prebin/scene/{f}'
  o=json.load(open(p)) if os.path.exists(p) else {}
  nb={json.dumps(b[0][0]) for b in n.get('b',[])}; ob={json.dumps(b[0][0]) for b in o.get('b',[])}
  nt=len(n.get('t',[]) or []); ot=len(o.get('t',[]) or [])
  if nb!=ob or nt!=ot:
    k=f[:-5]; r=os.path.exists(f'{D}/render/{k}.png')
    ch.append(k); print(k,'render' if r else 'norender','+b',len(nb-ob),'-b',len(ob-nb),'trees',ot,'->',nt)
print('changed',len(ch))
