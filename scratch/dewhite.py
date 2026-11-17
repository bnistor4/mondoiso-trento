# usage: dewhite.py <area> <w> [thr] : pixels the model painted near-white (min>thr, low chroma) where the render is NOT
# near-white get the render's flat colour back (Grok sometimes paints bare ground as blank paper). Original -> archive/prewhite/.
import sys, os, shutil
from PIL import Image
a, w = sys.argv[1], sys.argv[2]; thr = int(sys.argv[3]) if len(sys.argv) > 3 else 236
D = f'data/derived/{a}'; f = f'{D}/windows/{w}.png'; os.makedirs(f'{D}/archive/prewhite', exist_ok=True)
shutil.copy(f, f'{D}/archive/prewhite/{w}.png')
i, j = map(int, w.split('_')); X0, Y0 = i * 896, j * 896
im = Image.open(f'{D}/archive/prewhite/{w}.png').convert('RGB'); P = im.load(); tiles = {}; n = 0
def rp(x, y):
    tx, ty = x // 1024, y // 1024
    if (tx, ty) not in tiles:
        p = f'{D}/render/{tx}_{ty}.png'; tiles[(tx, ty)] = Image.open(p).convert('RGB').load() if os.path.exists(p) else None
    t = tiles[(tx, ty)]; return t[x - tx * 1024, y - ty * 1024] if t else None
import numpy as np
A = np.asarray(im).astype(int); Wm = (A.min(2) > thr) & (A.max(2) - A.min(2) < 16)
from numpy.lib.stride_tricks import sliding_window_view as sw
pad = np.pad(Wm, 4); flat = sw(pad, (9, 9)).all(axis=(2, 3))  # whole 9x9 neighbourhood blank = paper, not a facade
for y, x in zip(*np.nonzero(flat)):
        if True:
            r = rp(X0 + x, Y0 + y)
            if r and min(r) < 225 and sum(r) > 24: P[x, y] = r; n += 1
im.save(f); print('dewhite', w, n)
