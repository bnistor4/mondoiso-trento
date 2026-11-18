# v12 diag: Bogdan's 7 defects -> boxes (global art px), windows/edges inside, overview + crops in shots/
import json, os, glob, numpy as np
from PIL import Image, ImageDraw, ImageFont
exec(open('scratch/v12-z8.py').read().split("if __name__")[0])
D={1:('hills+villages, window tone steps',(-13500,-15000,-8500,-11500)),
   2:('west slope below Doss Trento by the Adige',(-6000,1500,0,7000)),
   3:('pale meadow rectangle around a hamlet',(1500,5000,5500,8000)),
   4:('forest + hairpin road, square step',(3600,8000,7600,11000)),
   5:('forest slope by the rail line, checkerboard',(-16000,-3500,-11500,-500)),
   6:('vineyard terraces cut at window edge + rainbow',(-22500,-7000,-19500,-5200)),
   7:('Trento scalo / Roncafort rail yard',(-20200,-8600,-15400,-5400))}
E=json.load(open('/workspace/v12/edges.json')); A=[a['id'] for a in json.load(open('data/web/regions/trento/data/world.json'))['areas']]
own=json.load(open('/workspace/v12/owner.json'))
def src(w):  # areas whose windows/ dir has w (the tile owner resolves its own first, then context areas)
  return [a.replace('trento-','') for a in A if os.path.exists(f'data/derived/{a}/windows/{w}.png')]
def v11(w): return [a.replace('trento-','') for a in A if glob.glob(f'data/derived/{a}/archive/v11/**/{w}.png',recursive=True)]
rank={a['edge']+a['axis']:n+1 for n,a in enumerate(E)}
out={}
for n,(name,(x0,y0,x1,y1)) in D.items():
  es=[a for a in E if x0<=a['x']<x1 and y0<=a['y']<y1 and (a['max']+a['mean'])/2>6]
  es.sort(key=lambda a:-(a['max']+a['mean'])/2)
  out[n]=dict(name=name,box=[x0,y0,x1,y1],areas=sorted({own.get(f'{x//1024}_{y//1024}','-').replace('trento-','') for x in range(x0,x1,512) for y in range(y0,y1,512)}-{'-'}),
    edges=[dict(edge=a['edge'],axis=a['axis'],off=a['off'],score=round((a['max']+a['mean'])/2,1),max=a['max'],step=a['step'],dLab=a['dLab'],area=a['area'].replace('trento-',''),rank=rank[a['edge']+a['axis']],src={w:src(w) for w in a['edge'].split('|')},v11={w:v11(w) for w in a['edge'].split('|')}) for a in es[:8]])
  # crop
  W,H=x1-x0,y1-y0; s=max(3,int(np.ceil(max(W/1400,H/1000))))
  im=Image.fromarray(z8(x0,y0,x1,y1)).resize((W//s,H//s),Image.LANCZOS); im.save(f'shots/v12-def-{n}.png')
  g=im.copy(); d=ImageDraw.Draw(g)
  for a in es[:8]:
    i,j=map(int,a['edge'].split('|')[1].split('_'))
    if a['axis']=='v': gx=i*896+a['off']; d.line([((gx-x0)/s,(j*896-y0)/s),((gx-x0)/s,(j*896+896-y0)/s)],fill=(255,0,255),width=2)
    else: gy=j*896+a['off']; d.line([((i*896-x0)/s,(gy-y0)/s),((i*896+896-x0)/s,(gy-y0)/s)],fill=(255,0,255),width=2)
  g.save(f'shots/v12-def-{n}-edges.png')
json.dump(out,open('/workspace/v12/defects.json','w'),indent=1)
# overview: z6 mosaic at 1/4 (1 px = 16 art px) with numbered boxes
m=json.load(open('/workspace/v12/mosaic-z6.json')); Image.MAX_IMAGE_PIXELS=None
O=Image.open('/workspace/v12/mosaic-z6.png'); O=O.resize((O.width//4,O.height//4),Image.LANCZOS); d=ImageDraw.Draw(O)
try: f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',36)
except Exception: f=None
for n,(name,(x0,y0,x1,y1)) in D.items():
  b=[(x0-m['X0'])/16,(y0-m['Y0'])/16,(x1-m['X0'])/16,(y1-m['Y0'])/16]
  d.rectangle(b,outline=(230,0,40),width=5); d.text((b[0]+6,b[1]+2),str(n),fill=(230,0,40),font=f,stroke_width=3,stroke_fill=(255,255,255))
O.save('shots/v12-bogdan-defects.png'); print(O.size)
for n,v in out.items():
  print(n,v['name'],v['areas'])
  for e in v['edges'][:5]: print('   ',e)
