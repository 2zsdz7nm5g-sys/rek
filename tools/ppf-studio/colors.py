"""REK PPF Color Studio: the 99-colour library (source of truth -> colors.json)."""
import json, math, itertools
# finish presets (PBR): film surface over paint
F = {
 'gloss':    dict(roughness=0.28, metalness=0.0,  clearcoat=1.0, clearcoatRoughness=0.012, flake=0.0,   iridescence=0.0),
 'matte':    dict(roughness=0.62, metalness=0.0,  clearcoat=1.0, clearcoatRoughness=0.62,  flake=0.0,   iridescence=0.0),
 'satin':    dict(roughness=0.42, metalness=0.06, clearcoat=1.0, clearcoatRoughness=0.3,   flake=0.0,   iridescence=0.0),
 'metallic': dict(roughness=0.34, metalness=0.6,  clearcoat=1.0, clearcoatRoughness=0.015, flake=0.045, iridescence=0.0),
}
FIN = {'gloss': ('Gloss', 'لامع'), 'matte': ('Matte', 'مطفي'), 'satin': ('Satin', 'ساتان'), 'metallic': ('Metallic', 'معدني'), 'special': ('Special', 'خاص')}
C = []
def add(cat, code, en, ar, hexv, finish=None, **over):
    m = dict(F[finish or cat]); m.update(over)
    fin_en, fin_ar = FIN[cat] if not finish or cat != 'special' else FIN[cat]
    C.append({'id': code, 'en': en, 'ar': ar, 'cat': cat, 'hex': hexv, 'm': m})
G='gloss'
for c in [('GL-01','Obsidian Black','أسود أوبسيديان','#0a0b0d'),('GL-02','Arctic White','أبيض قطبي','#f2f3f1'),('GL-03','Ivory White','أبيض عاجي','#ece3cf'),
          ('GL-04','Racing Red','أحمر سباق','#b3121f'),('GL-05','Crimson Red','أحمر قرمزي','#7e0c18'),('GL-06','Signal Orange','برتقالي إشاري','#e8590c'),
          ('GL-07','Burnt Orange','برتقالي محروق','#a8461c'),('GL-08','Solar Yellow','أصفر شمسي','#f2c200'),('GL-09','Lime Green','أخضر ليموني','#8cc63f'),
          ('GL-10','Racing Green','أخضر سباق','#0f3d2a'),('GL-11','Emerald Green','أخضر زمردي','#0c7a4f'),('GL-12','Mint Green','أخضر نعناعي','#9fd8bf'),
          ('GL-13','Aqua Teal','فيروزي مائي','#1a9c9a'),('GL-14','Sky Blue','أزرق سماوي','#6cb4e6'),('GL-15','Royal Blue','أزرق ملكي','#1f4fbf'),
          ('GL-16','Deep Ocean Blue','أزرق محيطي عميق','#0f2f5c'),('GL-17','Electric Blue','أزرق كهربائي','#0a84ff'),('GL-18','Midnight Purple','بنفسجي منتصف الليل','#2c1847'),
          ('GL-19','Amethyst Violet','بنفسجي جمشتي','#6a2fb5'),('GL-20','Hot Pink','وردي حار','#e0318a'),('GL-21','Rose Pink','وردي زهري','#e9a2b8'),
          ('GL-22','Burgundy','عنابي','#5c0f22'),('GL-23','Chocolate Brown','بني شوكولا','#3f2318'),('GL-24','Sand Beige','بيج رملي','#c9b28a'),
          ('GL-25','Cement Grey','رمادي إسمنتي','#8a8d8f'),('GL-26','Graphite Grey','رمادي غرافيتي','#3a3d41')]: add(G,*c)
M='matte'
for c in [('MT-01','Matte Black','أسود مطفي','#111214'),('MT-02','Matte White','أبيض مطفي','#e8e8e4'),('MT-03','Military Green','أخضر عسكري','#4b5320'),
          ('MT-04','Desert Khaki','كاكي صحراوي','#8f8463'),('MT-05','Battleship Grey','رمادي حربي','#5f6368'),('MT-06','Dark Slate','رمادي داكن','#2e3135'),
          ('MT-07','Navy Blue','أزرق كحلي','#1c2a44'),('MT-08','Steel Blue','أزرق فولاذي','#4a6680'),('MT-09','Matte Red','أحمر مطفي','#9b1b1f'),
          ('MT-10','Dark Burgundy','عنابي داكن','#4f1420'),('MT-11','Matte Orange','برتقالي مطفي','#d4581c'),('MT-12','Matte Yellow','أصفر مطفي','#e0b21a'),
          ('MT-13','Dune Sand','رملي كثباني','#b9a27c'),('MT-14','Coffee Brown','بني قهوة','#4a3426'),('MT-15','Deep Purple','بنفسجي عميق','#3e2a5a'),
          ('MT-16','Dark Teal','فيروزي داكن','#1f5e5b'),('MT-17','Pastel Blue','أزرق باستيل','#9cb8cf'),('MT-18','Pastel Pink','وردي باستيل','#d9a9b4'),
          ('MT-19','Light Cement','إسمنتي فاتح','#a3a39d'),('MT-20','Acid Lime','ليموني حمضي','#9bb53a')]: add(M,*c)
S='satin'
for c in [('ST-01','Satin Black','أسود ساتان','#141517'),('ST-02','Satin Pearl White','أبيض لؤلؤي ساتان','#ecebe5'),('ST-03','Satin Dark Grey','رمادي داكن ساتان','#3d4146'),
          ('ST-04','Satin Grey','رمادي ساتان','#6e7378'),('ST-05','Satin Silver Grey','رمادي فضي ساتان','#a7abaf'),('ST-06','Satin Midnight Blue','أزرق ليلي ساتان','#1a2440'),
          ('ST-07','Satin Ocean Blue','أزرق محيطي ساتان','#245b8f'),('ST-08','Satin Ice Blue','أزرق جليدي ساتان','#a9c7dd'),('ST-09','Satin Racing Green','أخضر سباق ساتان','#1d4a35'),
          ('ST-10','Satin Khaki Green','أخضر كاكي ساتان','#6f7350'),('ST-11','Satin Red','أحمر ساتان','#a0161f'),('ST-12','Satin Dark Red','أحمر داكن ساتان','#5e1520'),
          ('ST-13','Satin Orange','برتقالي ساتان','#c8571e'),('ST-14','Satin Champagne','شامبين ساتان','#c9b48f'),('ST-15','Satin Bronze Brown','بني برونزي ساتان','#6a4a32'),
          ('ST-16','Satin Purple','بنفسجي ساتان','#4b2d6b'),('ST-17','Satin Teal','فيروزي ساتان','#2d6e6b'),('ST-18','Satin Rose','وردي ساتان','#c98d98')]: add(S,*c)
T='metallic'
for c in [('MC-01','Black Pearl Metallic','أسود لؤلؤي معدني','#14171c'),('MC-02','Silver Metallic','فضي معدني','#b9bcc0'),('MC-03','Titanium Grey','رمادي تيتانيوم','#6c7075'),
          ('MC-04','Gunmetal','رمادي معدني داكن','#3a3f45'),('MC-05','Champagne Gold','ذهبي شامبين','#c6a96c'),('MC-06','Bronze Metallic','برونزي معدني','#8a5a2b'),
          ('MC-07','Copper Metallic','نحاسي معدني','#a4532a'),('MC-08','Fire Orange Metallic','برتقالي ناري معدني','#d9661e'),('MC-09','Candy Red Metallic','أحمر حلوى معدني','#9e0d1a'),
          ('MC-10','Burgundy Metallic','عنابي معدني','#5a0f1f'),('MC-11','Royal Blue Metallic','أزرق ملكي معدني','#1d48a8'),('MC-12','Deep Blue Metallic','أزرق داكن معدني','#14316e'),
          ('MC-13','Ice Blue Metallic','أزرق جليدي معدني','#7fa9cf'),('MC-14','Teal Metallic','فيروزي معدني','#13706e'),('MC-15','Emerald Metallic','زمردي معدني','#0e5e3b'),
          ('MC-16','Forest Green Metallic','أخضر غابي معدني','#2f4a2a'),('MC-17','Purple Metallic','بنفسجي معدني','#4b237a'),('MC-18','Plum Metallic','برقوقي معدني','#6e2a55'),
          ('MC-19','Gold Metallic','ذهبي معدني','#c9a227'),('MC-20','Rose Gold Metallic','ذهبي وردي معدني','#c88a7a')]: add(T,*c)
P='special'
CHROME = dict(roughness=0.05, metalness=1.0, clearcoat=0.6, clearcoatRoughness=0.02, flake=0.0, iridescence=0.0)
for c in [
  ('SP-01','Pearl White','أبيض لؤلؤي','#f1efe8','gloss',dict(iridescence=0.35,irRange=[180,420],flake=0.02,metalness=0.15)),
  ('SP-02','Black Pearl','أسود لؤلؤي','#101216','gloss',dict(iridescence=0.55,irRange=[300,600],flake=0.025,metalness=0.3)),
  ('SP-03','Chrome Silver','كروم فضي','#d9dde2',None,dict(CHROME)),
  ('SP-04','Satin Chrome','كروم ساتان','#b8bcc2',None,dict(CHROME,roughness=0.28,clearcoatRoughness=0.22)),
  ('SP-05','Chrome Gold','كروم ذهبي','#d4af37',None,dict(CHROME,roughness=0.06)),
  ('SP-06','Chrome Rose Gold','كروم ذهبي وردي','#d9a08c',None,dict(CHROME,roughness=0.07)),
  ('SP-07','Chrome Blue','كروم أزرق','#3d6fb5',None,dict(CHROME,roughness=0.07)),
  ('SP-08','Chrome Red','كروم أحمر','#b0222f',None,dict(CHROME,roughness=0.07)),
  ('SP-09','Chameleon Purple-Green','حرباء بنفسجي أخضر','#3a2a6a','metallic',dict(iridescence=1.0,irRange=[250,750],flake=0.03)),
  ('SP-10','Chameleon Blue-Violet','حرباء أزرق بنفسجي','#233a8a','metallic',dict(iridescence=1.0,irRange=[350,900],flake=0.03)),
  ('SP-11','Chameleon Gold-Green','حرباء ذهبي أخضر','#6b6a2a','metallic',dict(iridescence=1.0,irRange=[300,620],flake=0.03)),
  ('SP-12','Chameleon Red-Gold','حرباء أحمر ذهبي','#6a1a1e','metallic',dict(iridescence=1.0,irRange=[420,820],flake=0.03)),
  ('SP-13','Iridescent Pearl Blue','أزرق لؤلؤي قزحي','#8fb3d6','gloss',dict(iridescence=0.8,irRange=[500,900],flake=0.02,metalness=0.2)),
  ('SP-14','Holographic Silver','فضي هولوغرافي','#9eaabb',None,dict(CHROME,roughness=0.12,metalness=0.9,iridescence=1.0,irRange=[200,1000])),
  ('SP-15','Magnetic Grey Pearl','رمادي لؤلؤي مغناطيسي','#4a4e54','satin',dict(iridescence=0.4,irRange=[250,500],flake=0.025,metalness=0.35))]:
    code,en,ar,hexv,base,over=c
    m = dict(F[base]) if base else {}
    m.update(over); C.append({'id': code, 'en': en, 'ar': ar, 'cat': 'special', 'hex': hexv, 'm': m})
# finish label for the readout
KIND={'SP-01':('Pearl','لؤلؤي'),'SP-02':('Pearl','لؤلؤي'),'SP-03':('Chrome','كروم'),'SP-04':('Satin Chrome','كروم ساتان'),'SP-05':('Chrome','كروم'),'SP-06':('Chrome','كروم'),
      'SP-07':('Chrome','كروم'),'SP-08':('Chrome','كروم'),'SP-09':('Color-Shift','متغير اللون'),'SP-10':('Color-Shift','متغير اللون'),'SP-11':('Color-Shift','متغير اللون'),
      'SP-12':('Color-Shift','متغير اللون'),'SP-13':('Iridescent Pearl','لؤلؤي قزحي'),'SP-14':('Holographic','هولوغرافي'),'SP-15':('Pearl Satin','لؤلؤي ساتان')}
for c in C:
    fe, fa = KIND.get(c['id'], FIN[c['cat']])
    c['finish'] = {'en': fe, 'ar': fa}
    c['m'] = {k: (round(v, 3) if isinstance(v, float) else v) for k, v in c['m'].items()}
# ---- checks ----
from collections import Counter
cnt = Counter(c['cat'] for c in C); assert len(C) == 99, len(C)
assert len({c['id'] for c in C}) == 99 and len({c['en'] for c in C}) == 99 and len({c['ar'] for c in C}) == 99
def lab(h):
    r,g,b=[int(h[i:i+2],16)/255 for i in (1,3,5)]
    r,g,b=[x/12.92 if x<=0.04045 else ((x+0.055)/1.055)**2.4 for x in (r,g,b)]
    X=(0.4124*r+0.3576*g+0.1805*b)/0.95047; Y=(0.2126*r+0.7152*g+0.0722*b); Z=(0.0193*r+0.1192*g+0.9505*b)/1.08883
    f=lambda t: t**(1/3) if t>0.008856 else 7.787*t+16/116
    return 116*f(Y)-16, 500*(f(X)-f(Y)), 200*(f(Y)-f(Z))
def de2000(l1,l2):
    L1,a1,b1=l1; L2,a2,b2=l2; C1=math.hypot(a1,b1); C2=math.hypot(a2,b2); Cb=(C1+C2)/2
    G=0.5*(1-math.sqrt(Cb**7/(Cb**7+25**7))); a1p=(1+G)*a1; a2p=(1+G)*a2; C1p=math.hypot(a1p,b1); C2p=math.hypot(a2p,b2)
    h1=math.degrees(math.atan2(b1,a1p))%360; h2=math.degrees(math.atan2(b2,a2p))%360
    dL=L2-L1; dC=C2p-C1p; dh=h2-h1
    if C1p*C2p==0: dh=0
    elif dh>180: dh-=360
    elif dh<-180: dh+=360
    dH=2*math.sqrt(C1p*C2p)*math.sin(math.radians(dh/2)); Lb=(L1+L2)/2; Cbp=(C1p+C2p)/2
    hb=(h1+h2)/2 if abs(h1-h2)<=180 else (h1+h2+360)/2
    if C1p*C2p==0: hb=h1+h2
    T=1-0.17*math.cos(math.radians(hb-30))+0.24*math.cos(math.radians(2*hb))+0.32*math.cos(math.radians(3*hb+6))-0.20*math.cos(math.radians(4*hb-63))
    SL=1+0.015*(Lb-50)**2/math.sqrt(20+(Lb-50)**2); SC=1+0.045*Cbp; SH=1+0.015*Cbp*T
    dT=30*math.exp(-((hb-275)/25)**2); RC=2*math.sqrt(Cbp**7/(Cbp**7+25**7)); RT=-math.sin(math.radians(2*dT))*RC
    return math.sqrt((dL/SL)**2+(dC/SC)**2+(dH/SH)**2+RT*(dC/SC)*(dH/SH))
worst=[]
for cat in cnt:
    items=[c for c in C if c['cat']==cat]
    for a,b in itertools.combinations(items,2): worst.append((de2000(lab(a['hex']),lab(b['hex'])),cat,a['id'],b['id']))
worst.sort()
print('counts', dict(cnt))
print('closest pairs within a category (CIEDE2000):'); [print('  %.1f %s %s~%s'%w) for w in worst[:8]]
json.dump(C, open('colors.json','w'), ensure_ascii=False, separators=(',',':'))
print('colors.json bytes', len(json.dumps(C,ensure_ascii=False,separators=(',',':')).encode()))
