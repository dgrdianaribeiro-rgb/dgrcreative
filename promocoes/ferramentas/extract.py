import pdfplumber,sys,json,re
R=sys.argv[1]
PRICE=re.compile(r'^\d{1,3}(\.\d{3})*,\d\d$')
def val(s): return float(s.replace('.','').replace(',','.'))
out=[]
import glob
NP=len(glob.glob(f"{R}/pdf/p*.pdf"))
for n in range(1,NP+1):
    pdf=pdfplumber.open(f"{R}/pdf/p{n}.pdf")
    for pi,p in enumerate(pdf.pages,1):
        W,H=p.width,p.height
        ws=p.extract_words(extra_attrs=["size","fontname"],keep_blank_chars=False)
        for w in ws: w['bold']='Bold' in w['fontname'] or 'Black' in w['fontname'] or 'Heavy' in w['fontname']
        codes=[w for w in ws if re.fullmatch(r'\d{5}',w['text']) and w['bold'] and 5<=w['size']<=12]
        imgs=[]
        for im in p.images:
            x0,t,x1,b=max(im['x0'],0),max(im['top'],0),min(im['x1'],W),min(im['bottom'],H)
            w_,h_=x1-x0,b-t
            if w_<18 or h_<18: continue
            if w_*h_>0.25*W*H: continue
            if h_>320 or h_/w_>5 or w_/h_>4: continue
            imgs.append((x0,t,x1,b))
        for c in codes:
            nxt=[o for o in codes if o is not c and o['top']>c['top']+1 and abs(o['x0']-c['x0'])<40]
            lim=min([o['top'] for o in nxt]+[c['top']+75])
            blk=[w for w in ws if w is not c and c['top']+1<w['top']<lim and c['x0']-110<=w['x0']<c['x0']+115]
            blk.sort(key=lambda w:(round(w['top']),w['x0']))
            # keep only words in lines that start at the code's left edge and are contiguous
            lines={}
            for w in blk: lines.setdefault(round(w['top']/2.5),[]).append(w)
            keep=[]
            for k in sorted(lines):
                L=sorted(lines[k],key=lambda w:w['x0'])
                Lr=[w for w in L if w['x0']>=c['x0']-4]
                if Lr and abs(Lr[0]['x0']-c['x0'])<=6:
                    seq=[Lr[0]]
                    for w in Lr[1:]:
                        if w['x0']-seq[-1]['x1']<9: seq.append(w)
                        else: break
                    keep+=seq; continue
                Ll=[w for w in L if w['x1']<=c['x1']+4]
                if Ll and abs(Ll[-1]['x1']-c['x1'])<=6:
                    seq=[Ll[-1]]
                    for w in reversed(Ll[:-1]):
                        if seq[0]['x0']-w['x1']<9: seq.insert(0,w)
                        else: break
                    keep+=seq
            blk=keep
            name=[];prices=[];eco=None;ended=False;cada=False
            i=0
            while i<len(blk):
                w=blk[i];t=w['text']
                if t=='R$' and i+1<len(blk) and PRICE.match(blk[i+1]['text']):
                    v=val(blk[i+1]['text'])
                    # economize on same line?
                    same=[o for o in blk if abs(o['top']-w['top'])<4 and o['x0']<w['x0'] and o['text'].upper().startswith('ECONOMIZE')]
                    if same: eco=v
                    else: prices.append((v,w['size']))
                    ended=True;i+=2;continue
                if t.upper().startswith('ECONOMIZE'):
                    ended=True
                    if i+1<len(blk) and PRICE.match(blk[i+1]['text']) : pass
                    i+=1;continue
                if t.lower()=='cada': cada=True
                if t.startswith('•'): ended=True
                if not ended and not w['bold'] and w['size']<9: name.append(t)
                i+=1
            nome=" ".join(name).strip(" ,")
            preco=promo=None
            if prices:
                if eco and len(prices)>=1:
                    promo=prices[-1][0]; preco=round(promo+eco,2)
                elif len(prices)>=2 and prices[0][1]<prices[1][1] and prices[0][0]>prices[1][0]:
                    preco,promo=prices[0][0],prices[1][0]
                else: preco=prices[0][0]
            best=None
            out.append(dict(x1=round(c['x1']),parte=n,pag=pi,code=c['text'],nome=nome,preco=preco,promo=promo,cada=cada,x=round(c['x0']),y=round(c['top']),img=best,W=W,H=H))
        # one-to-one image assignment by rect distance
        mine=[r for r in out if r['parte']==n and r['pag']==pi]
        pairs=[]
        for ri,r in enumerate(mine):
            cx0,cy0,cx1=r['x'],r['y'],r['x1']; cy1=cy0+30
            for ii,(x0,t,x1,b) in enumerate(imgs):
                dx=max(x0-cx1,cx0-x1,0); dy=max(t-cy1,cy0-b,0)
                below = t>cy0+5
                s=dx+dy+(80 if below else 0)
                if s<60: pairs.append((s,ri,ii))
        pairs.sort(); ur=set(); ui=set()
        for s,ri,ii in pairs:
            if ri in ur or ii in ui: continue
            ur.add(ri); ui.add(ii); mine[ri]['img']=imgs[ii]
        p.flush_cache()
json.dump(out,open(f"{R}/ext.json","w"),ensure_ascii=False)
print(len(out))
