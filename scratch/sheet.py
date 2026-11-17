# usage: sheet.py <area> <out-prefix> : contact sheets of render|painting pairs, 4 per row, 24 per sheet
import sys,os,glob
from PIL import Image, ImageDraw
sys.argv=[sys.argv[0]]+sys.argv[1:]
area,out=sys.argv[1],sys.argv[2]; S=896;T=1024
def crop(i,j):
  x0,y0=i*S,j*S; c=Image.new('RGB',(1024,1024))
  for ty in range(y0//T,(y0+1023)//T+1):
    for tx in range(x0//T,(x0+1023)//T+1):
      f=f'data/derived/{area}/render/{tx}_{ty}.png'
      if os.path.exists(f): c.paste(Image.open(f).convert('RGB'),(tx*T-x0,ty*T-y0))
  return c
fs=sorted(glob.glob(f'data/derived/{area}/windows/*.png'))
for k in range(0,len(fs),24):
  sh=Image.new('RGB',(4*400,6*210),'white'); d=ImageDraw.Draw(sh)
  for n,f in enumerate(fs[k:k+24]):
    w=os.path.basename(f)[:-4]; i,j=map(int,w.split('_')); x,y=(n%4)*400,(n//4)*210
    sh.paste(crop(i,j).resize((195,195)),(x,y+14)); sh.paste(Image.open(f).convert('RGB').resize((195,195)),(x+198,y+14)); d.text((x+2,y+1),w,fill='red')
  sh.save(f'{out}{k//24}.png')
print(len(fs))
