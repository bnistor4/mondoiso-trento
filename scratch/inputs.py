# usage: inputs.py <area> <w>... -> /tmp/inputs.png (256px thumbnails of work/<w>/input.png, labelled)
import sys
from PIL import Image, ImageDraw
a=sys.argv[1]; ws=sys.argv[2:]; o=Image.new('RGB',(260*len(ws),270),'white'); d=ImageDraw.Draw(o)
for k,w in enumerate(ws):
  o.paste(Image.open(f'data/derived/{a}/work/{w}/input.png').convert('RGB').resize((256,256)),(k*260,14)); d.text((k*260+2,1),w,fill='red')
o.save('/tmp/inputs.png')
