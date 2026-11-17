# usage: wcmp.py <area> <w> [painting] -> /tmp/wcmp_<w>.png : render crop | painting (512 each)
import sys,os
from PIL import Image
area,w=sys.argv[1],sys.argv[2]; i,j=map(int,w.split('_')); S=896;T=1024
x0,y0=i*S,j*S; c=Image.new('RGB',(1024,1024))
for ty in range(y0//T,(y0+1023)//T+1):
  for tx in range(x0//T,(x0+1023)//T+1):
    f=f'data/derived/{area}/render/{tx}_{ty}.png'
    if os.path.exists(f): c.paste(Image.open(f).convert('RGB'),(tx*T-x0,ty*T-y0))
p=sys.argv[3] if len(sys.argv)>3 else f'data/derived/{area}/windows/{w}.png'
o=Image.new('RGB',(1024,512)); o.paste(c.resize((512,512)),(0,0)); o.paste(Image.open(p).convert('RGB').resize((512,512)),(512,0)); o.save(f'/tmp/wcmp_{w}.png')
