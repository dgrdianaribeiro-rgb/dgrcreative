import json,re,sys,os,subprocess
from PIL import Image
S=sys.argv[1]; OUT=sys.argv[2]
os.makedirs(f"{OUT}/img",exist_ok=True)
CATS=[("Casa",r"\b(VELA|DIFUSOR|HOME SPRAY|CASA 214|AROMATIZADOR)\b"),
("Kits e presentes",r"\b(KIT|PRESENTE|ESTOJO|CALENDÁRIO|CAIXA)\b"),
("Acessórios",r"\b(NÉCESSAIRE|NECESSAIRE|BOLSA|PINCEL|ESPONJA|CHARM|BANDEJA|ESCOVA|APONTADOR|ACESSÓRIO|SACOLA|CHAVEIRO|PENTE)\b"),
("Maquiagem",r"\b(BATOM|BASE|PÓ|BLUSH|SOMBRA|PALETA|MÁSCARA PARA CÍLIOS|MÁSCARA DE CÍLIOS|DELINEADOR|LÁPIS|GLOSS|CORRETIVO|PRIMER|ILUMINADOR|BRONZER|CONTORNO|ESMALTE|FIXADOR|LIP|TINT|CÍLIOS|SOBRANCELHA|BOCA|BALM LABIAL)\b"),
("Cabelos",r"\b(SHAMPOO|CONDICIONADOR|MÁSCARA CAPILAR|MÁSCARA CONDICIONANTE|LEAVE|CAPILAR|FINALIZADOR|CACHOS|HAIR|BOOSTER|ÓLEO DE BARBA|BARBA|TÔNICO)\b"),
("Rosto",r"\b(FACIAL|SÉRUM|SERUM|ANTISSINAIS|MICELAR|PROTETOR|FPS|OLHOS|ROSTO|ESFOLIANTE|LIMPEZA|ÁCIDO|VITAMINA C|RETINOL|HIDRATANTE FACIAL|TÔNICO)\b"),
("Perfumaria",r"\b(PARFUM|COLÔNIA|COLONIA|EDP|EDT|PERFUME|BODY SPRAY|BODY SPLASH|SPLASH|EAU|MIST|DEO PARFUM|ELIXIR)\b"),
("Corpo e banho",r"\b(SABONETE|LOÇÃO|HIDRATANTE|SHOWER|GEL|ÓLEO|CREME|MANTEIGA|ANTITRANSPIRANTE|DESODORANTE|ESFOLIANTE|BANHO|TALCO|MÃOS|PÉS|POLPA)\b")]
def cat(n):
    u=n.upper()
    for c,rx in CATS:
        if re.search(rx,u): return c
    return "Outros"
TAGS=r"^(LIMPAR|ROSTO|PRESENTEÁVEL|ACESSÓRIO|LANÇAMENTO|EDIÇÃO LIMITADA|PROMOÇÃO|PARA MÃOS|MESMA FÓRMULA,? NOVA EMBALAGEM|NOVA EMBALAGEM|NOVIDADE|VEGANO|EXCLUSIVO)\s+"
def clean(n):
    n=re.sub(r"-{3,}","",n); n=re.sub(r"\s+"," ",n).strip(" ,-*")
    for _ in range(3): n=re.sub(TAGS,"",n)
    n=re.sub(r"(?i)\s*DIMENSÕES:.*$","",n)
    n=re.sub(r"\s*\d?\s*\d+(,\d+)?\s*x\s*\d+(,\d+)?(\s*x\s*\d+(,\d+)?)?\s*cm\b","",n).strip(" ,")
    n=n.replace("DESODO- RANTE","DESODORANTE").replace("- ","")
    n=re.sub(r"\*+$","",n)
    return n
prods={}
for marca,sub in (("Boticário","rev"),("Eudora","eud")):
    d=json.load(open(f"{S}/{sub}/ext.json"))
    # split leading lowercase variant label from priced names
    for r in d:
        n=clean(r['nome']); m=re.match(r"^([a-zà-ú0-9][^A-ZÀ-Ú]*?)\s+([A-ZÀ-Ú].*)$",n)
        r['var']=None
        if m and r['preco']: r['var'],r['nome']=m.group(1),m.group(2)
    # attach unpriced variant codes (shades, fragrances) to nearest priced block on same page
    for r in d:
        if r['preco']: continue
        lab=clean(r['nome'])
        lab=re.split(r"\s+(?=[A-ZÀ-Ú]{3})",lab)[0].strip()
        if not lab or len(lab)>40: continue
        shade=bool(re.match(r"(?i)^cor\b",lab))
        cands=[o for o in d if o['parte']==r['parte'] and o['pag']==r['pag'] and o['preco'] and len(clean(o['nome']))>5
               and o.get("var") and not shade and o['y']>=r['y']-10 and o['y']-r['y']<160 and abs(o['x']-r['x'])<(200 if shade else 260)]
        if not cands: continue
        o=min(cands,key=lambda o:(o['y']-r['y'])+abs(o['x']-r['x'])*0.7)
        r['nome']=clean(o['nome']); r['var']=lab; r['preco']=o['preco']; r['promo']=o['promo']; r['cada']=o['cada']
    for r in d:
        nome=clean(r['nome'])
        if r.get('var'): nome=nome+" – "+r['var']
        if not r['preco'] or len(nome)<6 or not re.search(r"[A-ZÀ-Ú]{3}",nome): continue
        if re.search(r"(?i)– cor\b|^(cor|cores)\b",nome): continue
        if re.match(r"^[a-zà-ú&\W]",nome): continue
        if r['preco']<3 or (r['promo'] and r['promo']>=r['preco']): r['promo']=None
        key=(marca,r['code'])
        score=(1 if r['promo'] else 0, 1 if r['img'] else 0, len(nome))
        if key in prods and prods[key]['_s']>=score: continue
        prods[key]=dict(_s=score,_r=r,_sub=sub,codigo=r['code'],marca=marca,nome=nome,categoria=cat(nome),preco=r['preco'],promo=r['promo'],cada=r['cada'],pag=f"Parte {r['parte']}, pág. {r['pag']}")
# crop images
need={}
for k,p in prods.items():
    if p['_r']['img']: need.setdefault((p['_sub'],p['_r']['parte'],p['_r']['pag']),[]).append(p)
DPI=150
for (sub,parte,pag),lst in need.items():
    tmp=f"{S}/tmp_page"
    subprocess.run(["pdftoppm","-r",str(DPI),"-f",str(pag),"-l",str(pag),"-singlefile","-jpeg",f"{S}/{sub}/pdf/p{parte}.pdf",tmp],check=True,stderr=subprocess.DEVNULL)
    im=Image.open(tmp+".jpg"); k=DPI/72
    for p in lst:
        x0,t,x1,b=p['_r']['img']; pad=4
        box=[int(max(0,(x0-pad)*k)),int(max(0,(t-pad)*k)),int(min(im.width,(x1+pad)*k)),int(min(im.height,(b+pad)*k))]
        c=im.crop(box); c.thumbnail((360,360))
        fn=f"{p['marca'][:3].lower().replace('á','a')}-{p['codigo']}.webp"
        c.save(f"{OUT}/img/{fn}","WEBP",quality=72); p['imagem']=f"img/{fn}"
lst=[]
for p in sorted(prods.values(),key=lambda p:(p['marca'],p['categoria'],p['nome'])):
    o={k:p[k] for k in ("codigo","marca","nome","categoria","preco","promo")}
    if p.get('imagem'): o['imagem']=p['imagem']
    if p['cada']: o['cada']=True
    o['pagina']=p['pag']; lst.append(o)
json.dump(lst,open(f"{S}/produtos.json","w"),ensure_ascii=False,indent=0)
print(len(lst),"produtos;",sum(1 for o in lst if o['promo']),"promo;",sum(1 for o in lst if 'imagem' in o),"com foto")
import collections;print(collections.Counter((o['marca'],o['categoria']) for o in lst))

cfg={"nomeVendedora":"Diana Ribeiro","whatsapp":"5585991281467","limiteImperdivel":40,"exemplo":False}
ciclos={"Boticário":{"nome":"Ciclo 16","validoAte":"2026-11-30"},"Eudora":{"nome":"Ciclo 16","validoAte":"2026-11-30"}}
js="/* Gerado automaticamente a partir das revistas do ciclo. Edite 'config' para mudar nome e WhatsApp. */\n"
js+="window.CATALOGO = {\n  config: "+json.dumps(cfg,ensure_ascii=False)+",\n  ciclos: "+json.dumps(ciclos,ensure_ascii=False)+",\n  produtos: [\n"
js+=",\n".join("    "+json.dumps(o,ensure_ascii=False) for o in lst)+"\n  ]\n};\n"
open(f"{OUT}/produtos.js","w").write(js)
