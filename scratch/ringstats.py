# usage: ringstats.py <log.tsv>... : last row per window; painted (non strip-only) pass/soft, NCC range/median, rows (=gens incl. auto-rejects)
import sys,statistics as st
last={}; rows=0; so=0
for f in sys.argv[1:]:
  for l in open(f):
    p=l.rstrip('\n').split('\t')
    if not p[0].isdigit(): continue
    if 'strip-only' in p[3]: last[p[1]]=('so',1,p[5]); continue
    rows+=1
    try: last[p[1]]=('p',float(p[4]),p[5])
    except: pass
pt=[v for v in last.values() if v[0]=='p']; s=[v[1] for v in pt]
print('painted',len(pt),'strip-only',sum(v[0]=='so' for v in last.values()),'pass',sum(v[2]=='pass' for v in pt),'soft',sum(v[2]=='soft' for v in pt),'other',[v for v in pt if v[2] not in('pass','soft')],
 'NCC %.3f-%.3f median %.3f below0.5 %d'%(min(s),max(s),st.median(s),sum(x<0.5 for x in s)),'logged painting rows',rows)
