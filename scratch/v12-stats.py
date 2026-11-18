# usage: v12-stats.py <edges.json> : edge stats (score=(mean+max)/2) + per-defect max score (edges whose point is in the defect box)
import sys, json
e=json.load(open(sys.argv[1])); s=lambda a:(a['mean']+a['max'])/2
print('edges',len(e),'>10',sum(s(a)>10 for a in e),'>8',sum(s(a)>8 for a in e),'>15',sum(s(a)>15 for a in e),'max %.1f'%max(map(s,e)),
      'p95 %.1f'%sorted(map(s,e))[int(.95*len(e))])
d=json.load(open('paint-test/v12-defects.json')); out={}
for k,v in d.items():
  x0,y0,x1,y1=v['box']; ins=[a for a in e if x0<=a['x']<=x1 and y0<=a['y']<=y1]
  b=max(ins,key=s) if ins else None; out[k]=round(s(b),1) if b else None
  print(' defect',k,v['name'][:38],'max %.1f'%s(b) if b else '-', b['edge'] if b else '')
json.dump(out,open(sys.argv[1].replace('.json','-defects.json'),'w'))
