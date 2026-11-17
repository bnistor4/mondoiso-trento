# usage: grid.py <area> <w>... -> /tmp/grid.png 3 per row at 400px
import sys
from PIL import Image, ImageDraw
a=sys.argv[1]; ws=sys.argv[2:]; S=400; n=len(ws); cols=3; rows=(n+cols-1)//cols
g=Image.new('RGB',(cols*S,rows*(S+16)),'white'); d=ImageDraw.Draw(g)
for k,w in enumerate(ws):
  im=Image.open(f'/workspace/mondoiso-trento/data/derived/{a}/work/{w}/input.png').convert('RGB').resize((S,S))
  x=(k%cols)*S; y=(k//cols)*(S+16); g.paste(im,(x,y+16)); d.text((x+4,y+2),w,fill='red')
import os; g.save(os.environ.get('OUT','/tmp/grid.png'))
