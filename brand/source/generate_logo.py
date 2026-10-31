import sys, math, uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
F, OUT = sys.argv[1], sys.argv[2]

class Face:
    def __init__(s, p):
        s.tt = TTFont(p); s.gs = s.tt.getGlyphSet(); s.upem = s.tt['head'].unitsPerEm
        s.hb = hb.Font(hb.Face(hb.Blob.from_file_path(p))); s.order = s.tt.getGlyphOrder()

class T:  # shaped text: path d with baseline at y=0
    def __init__(s, face, text, size, track=0.0):
        buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
        hb.shape(face.hb, buf, {"kern": True, "liga": True})
        sc = size/face.upem; x = 0; pen = SVGPathPen(face.gs); bp = BoundsPen(face.gs)
        n = len(buf.glyph_infos)
        for i, (gi, gp) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
            g = face.order[gi.codepoint]; tr = (sc, 0, 0, -sc, x+gp.x_offset*sc, -gp.y_offset*sc)
            face.gs[g].draw(TransformPen(pen, tr)); face.gs[g].draw(TransformPen(bp, tr))
            x += gp.x_advance*sc + (track if i < n-1 else 0)
        s.d = pen.getCommands(); s.x0, s.y0, s.x1, s.y1 = bp.bounds
        s.w, s.h = s.x1-s.x0, s.y1-s.y0
    def at(s, x, y, fill, sc=1.0):
        """ink top-left at (x,y)"""
        return f'<path d="{s.d}" fill="{fill}" transform="translate({x:.2f},{y:.2f}) scale({sc:.4f}) translate({-s.x0:.2f},{-s.y0:.2f})"/>'

black = Face(f"{F}/archivo-exp-900.ttf"); semi = Face(f"{F}/archivo-exp-600.ttf")
med = Face(f"{F}/archivo-exp-500.ttf"); arM = Face(f"{F}/plexar-500.ttf"); arS = Face(f"{F}/plexar-600.ttf")

REK = T(black, "REK", 300, track=14)
RW, RH = REK.w, REK.h
import re
def outer_only(d):
    subs = [m for m in re.findall(r'M[^M]*', d)]
    boxes = []
    for sp in subs:
        n = list(map(float, re.findall(r'-?\d+\.?\d*', sp)))
        xs, ys = n[0::2], n[1::2]; boxes.append((min(xs), min(ys), max(xs), max(ys)))
    keep = [sp for i, sp in enumerate(subs) if not any(j != i and boxes[j][0] < boxes[i][0] and boxes[j][1] < boxes[i][1]
            and boxes[j][2] > boxes[i][2] and boxes[j][3] > boxes[i][3] for j in range(len(subs)))]
    return "".join(keep)
REK_OUTER = outer_only(REK.d)

sys.path.insert(0, __import__("os").path.dirname(__file__)); from emblem import emblem
SKY, NAVY, RED, PRED, MID = "#3893D0", "#323C77", "#D3212D", "#C42130", "#061A2E"
SK = math.tan(math.radians(12))  # forward lean for the new wordmark

def rek_italic(x, y, uid, sc, top=SKY, bot=NAVY, red=RED):
    """two-tone REK with red wave + keyline, slanted; ink top-left at (x,y), cap height = RH*sc"""
    x0, x1 = REK.x0-40, REK.x1+40; N = 300
    yb = REK.y0 + RH*0.52; A = RH*0.07
    pts = [(x0+(x1-x0)*i/N, yb + A*math.sin(2*math.pi*1.25*i/N + 0.9)) for i in range(N+1)]
    line = "M" + " L".join(f"{a:.1f},{b:.1f}" for a, b in pts)
    lower = line + f" L{x1:.1f},{REK.y1+40:.1f} L{x0:.1f},{REK.y1+40:.1f} Z"
    # skew about the baseline so the ink keeps its footprint
    return (f'<g transform="translate({x+RH*SK*sc:.2f},{y:.2f}) scale({sc:.4f}) matrix(1,0,{-SK:.4f},1,0,0) translate({-REK.x0:.2f},{-REK.y0:.2f})">'
            f'<clipPath id="r{uid}"><path d="{REK.d}"/></clipPath><g clip-path="url(#r{uid})">'
            f'<rect x="{x0:.1f}" y="{REK.y0-40:.1f}" width="{x1-x0:.1f}" height="{RH+80:.1f}" fill="{top}"/>'
            f'<path d="{lower}" fill="{bot}"/><path d="{line}" fill="none" stroke="{red}" stroke-width="{RH*0.022:.1f}"/></g>'
            f'<path d="{REK.d}" fill="none" stroke="{red}" stroke-width="{RH*0.024:.1f}" stroke-linejoin="round"/></g>')
REK_W_IT = lambda sc: (RW + RH*SK)*sc

PRO = T(semi, "PROFFSET", 100, track=100*0.50)
AR = T(arM, "للعناية بالسيارات", 100)

def emb(x, y, h, uid, **kw):  # emblem viewBox 0..200 x 0..240 ; place top-left
    s = h/240
    return f'<g transform="translate({x:.2f},{y:.2f}) scale({s:.4f})">{emblem(uid, **kw)}</g>', 200*s

def horizontal(uid, dark=False):
    H = 300
    b, ew = emb(0, 0, H, uid+"e")
    bx = ew + H*0.16
    cap = H*0.40; sc = cap/RH
    b += rek_italic(bx, H*0.06, uid, sc)
    rw = REK_W_IT(sc)
    # PROFFSET justified-ish to REK width under it
    ps = (H*0.085)/PRO.h; pw = PRO.w*ps
    py = H*0.06 + cap + H*0.10
    b += PRO.at(bx + RH*SK*sc*0.0, py, "#E0354A" if dark else PRED, ps)
    # thin red rule from PROFFSET end to REK right edge
    rx = bx + pw + H*0.05
    if rx < bx + rw - 10:
        b += f'<rect x="{rx:.1f}" y="{py + PRO.h*ps/2 - 1.2:.1f}" width="{bx+rw-rx:.1f}" height="2.4" fill="{"#E0354A" if dark else PRED}"/>'
    asz = (H*0.13)/AR.h; aw = AR.w*asz; ay = py + PRO.h*ps + H*0.10
    b += AR.at(bx + rw - aw, ay, "#FFFFFF" if dark else NAVY, asz)
    lx1 = bx + rw - aw - H*0.05
    b += f'<rect x="{bx:.1f}" y="{ay + AR.h*asz*0.55 - 1.2:.1f}" width="{lx1-bx:.1f}" height="2.4" fill="{"#E0354A" if dark else PRED}"/>'
    W = bx + max(rw, pw)
    return b, W, H

def stacked(uid, dark=False):
    eh = 330
    cap = 150; sc = cap/RH; rw = REK_W_IT(sc)
    W = max(rw, 200*eh/240)
    b, ew = emb((W-200*eh/240)/2, 0, eh, uid+"e")
    ry = eh + 46
    b += rek_italic((W-rw)/2, ry, uid, sc)
    ps = (cap*0.17)/PRO.h; pw = PRO.w*ps; py = ry + cap + 36
    col = "#E0354A" if dark else PRED
    b += PRO.at((W-pw)/2, py, col, ps)
    lw = (rw-pw)/2 - 26
    if lw > 10:
        ly = py + PRO.h*ps/2 - 1.2
        b += f'<rect x="{(W-rw)/2:.1f}" y="{ly:.1f}" width="{lw:.1f}" height="2.4" fill="{col}"/>'
        b += f'<rect x="{(W+rw)/2-lw:.1f}" y="{ly:.1f}" width="{lw:.1f}" height="2.4" fill="{col}"/>'
    asz = (cap*0.30)/AR.h; aw = AR.w*asz; ay = py + PRO.h*ps + 34
    b += AR.at((W-aw)/2, ay, "#FFFFFF" if dark else NAVY, asz)
    return b, W, ay + AR.h*asz

def svgwrap(W, H, body, bg, pad):
    bgr = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W+2*pad:.0f} {H+2*pad:.0f}" width="{W+2*pad:.0f}" height="{H+2*pad:.0f}">'
            f'<title>REK PROFFSET</title>{bgr}<g transform="translate({pad},{pad})">{body}</g></svg>')

def write(name, svg): open(f"{OUT}/{name}.svg", "w").write(svg)
for th, bg, dark in (("light", "#FFFFFF", False), ("dark", MID, True), ("transparent", None, False)):
    b, w, h = horizontal("h"+th, dark); write(f"rek-proffset-horizontal-{th}", svgwrap(w, h, b, bg, 110))
    b, w, h = stacked("s"+th, dark);    write(f"rek-proffset-logo-{th}", svgwrap(w, h, b, bg, 120))
# icon = emblem alone
b, ew = emb(0, 0, 840, "icon")
write("rek-proffset-icon", svgwrap(700, 840, b, None, 92))

# brand board
lbl = lambda s, size=22, face=med, tr=0.25: T(face, s, size, track=size*tr)
BW, BH = 2400, 1500
bb = f'<rect width="{BW}" height="{BH}" fill="#F4F5F8"/><rect x="60" y="60" width="1400" height="900" fill="#FFFFFF"/>'
b, w, h = stacked("bb1"); sc = min(1000/w, 760/h)
bb += f'<g transform="translate({60+(1400-w*sc)/2:.1f},{60+(900-h*sc)/2:.1f}) scale({sc:.4f})">{b}</g>'
bb += f'<rect x="1500" y="60" width="840" height="560" fill="{MID}"/>'
b, w, h = horizontal("bb2", True); sc = 720/w
bb += f'<g transform="translate({1500+(840-w*sc)/2:.1f},{60+(560-h*sc)/2:.1f}) scale({sc:.4f})">{b}</g>'
bb += f'<rect x="1500" y="660" width="840" height="300" fill="#FFFFFF"/>'
for i, (bgc) in enumerate(("#FFFFFF", MID, SKY)):
    cx = 1540 + i*270
    bb += f'<rect x="{cx}" y="690" width="240" height="240" rx="40" fill="{bgc}" stroke="#E2E4EA" stroke-width="2"/>'
    e, ew = emb(cx + (240-200*190/240)/2, 715, 190, f"bbi{i}")
    bb += e
sw = [(NAVY, "REK NAVY"), (SKY, "REK SKY"), (RED, "REK RED"), (PRED, "PROFFSET RED"), (MID, "MIDNIGHT")]
x = 60
for hexv, name in sw:
    bb += f'<rect x="{x}" y="1000" width="260" height="260" fill="{hexv}"/>'
    bb += lbl(name, 20).at(x, 1285, NAVY) + lbl(hexv, 20, face=semi, tr=0.12).at(x, 1322, "#7A8199")
    x += 284
tx = 1500
bb += lbl("TYPOGRAPHY", 20).at(tx, 1000, "#7A8199")
bb += T(black, "Archivo Expanded", 54).at(tx, 1045, NAVY)
bb += lbl("WORDMARK  ·  HEADLINES  ·  LATIN", 18).at(tx, 1122, "#7A8199")
bb += T(arS, "IBM Plex Sans Arabic", 46).at(tx, 1170, NAVY)
bb += T(arM, "العناية والحماية الاحترافية للسيارات", 40).at(tx, 1235, PRED)
bb += lbl("REK PROFFSET  —  BRAND IDENTITY GUIDELINES", 20).at(60, 1420, NAVY)
v = lbl("V 3.0  ·  2026", 20); bb += v.at(BW-60-v.w, 1420, "#7A8199")
open(f"{OUT}/rek-proffset-brand-board.svg", "w").write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {BW} {BH}" width="{BW}" height="{BH}">{bb}</svg>')
print("done")
