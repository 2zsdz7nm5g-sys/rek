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

PAL = {
  "light": dict(bg="#FFFFFF", top="#2E8FDB", bot="#1B2A61", rib="#A01D33", pro="#A01D33", ar="#1B2A61", rule="#A01D33"),
  "dark":  dict(bg="#061A2E", top="#3FA2EE", bot="#FFFFFF", rib="#C92A42", pro="#D3374E", ar="#FFFFFF", rule="#C92A42"),
}
PAL["transparent"] = dict(PAL["light"], bg=None)

def rek_mark(x, y, p, uid, sc=1.0):
    x0, x1 = REK.x0-20, REK.x1+20; L = x1-x0
    yb = REK.y0 + RH*0.50; A = RH*0.06; th = RH*0.042
    def wy(t): return yb + A*math.cos(2*math.pi*1.15*t) - A*0.35*t
    N = 160
    up = [(x0+L*i/N, wy(i/N)-th/2) for i in range(N+1)]
    dn = [(x0+L*i/N, wy(i/N)+th/2) for i in range(N+1)]
    pts = lambda P: " L".join(f"{a:.1f},{b:.1f}" for a, b in P)
    ribbon = "M" + pts(up) + " L" + pts(dn[::-1]) + " Z"
    lower = "M" + pts(dn) + f" L{x1:.1f},{REK.y1+20:.1f} L{x0:.1f},{REK.y1+20:.1f} Z"
    return (f'<g transform="translate({x:.2f},{y:.2f}) scale({sc:.4f}) translate({-REK.x0:.2f},{-REK.y0:.2f})">'
            f'<clipPath id="c{uid}"><path d="{REK.d}"/></clipPath>'
            f'<g clip-path="url(#c{uid})">'
            f'<rect x="{x0:.1f}" y="{REK.y0-20:.1f}" width="{L:.1f}" height="{RH+40:.1f}" fill="{p["top"]}"/>'
            f'<path d="{lower}" fill="{p["bot"]}"/><path d="{ribbon}" fill="{p["rib"]}"/></g></g>')

# secondary type, sized off the REK cap height
PRO = T(semi, "PROFFSET", 100, track=100*0.52)
pro_sc = (RH*0.165)/PRO.h
AR = T(arM, "للعناية بالسيارات", 100)
alef = T(arM, "ا", 100)
ar_sc = (RH*0.30)/alef.h * (alef.h/AR.h) * (AR.h/alef.h)  # alef height = 0.30 RH
ar_sc = (RH*0.205)/alef.h

def svgwrap(W, H, body, bg, title="REK PROFFSET"):
    bgr = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}" width="{W:.0f}" height="{H:.0f}">'
            f'<title>{title}</title>{bgr}{body}</svg>')

def stacked(p, uid, ox=0, oy=0):
    """returns body, W, H with origin at REK top-left = (ox,oy)"""
    pw, ph = PRO.w*pro_sc, PRO.h*pro_sc
    aw, ah = AR.w*ar_sc, AR.h*ar_sc
    g1, g2 = RH*0.22, RH*0.24
    b = rek_mark(ox, oy, p, uid)
    py = oy + RH + g1
    b += PRO.at(ox + (RW-pw)/2, py, p["pro"], pro_sc)
    # hairline rules flanking PROFFSET, running to the REK edges
    gap = ph*1.1; lw = (RW-pw)/2 - gap; ly = py + ph/2 - RH*0.006; t = RH*0.012
    b += f'<rect x="{ox:.1f}" y="{ly:.1f}" width="{lw:.1f}" height="{t:.1f}" fill="{p["rule"]}"/>'
    b += f'<rect x="{ox+RW-lw:.1f}" y="{ly:.1f}" width="{lw:.1f}" height="{t:.1f}" fill="{p["rule"]}"/>'
    ay = py + ph + g2
    b += AR.at(ox + (RW-aw)/2, ay, p["ar"], ar_sc)
    return b, RW, (ay+ah) - oy

def horizontal(p, uid, ox=0, oy=0):
    b = rek_mark(ox, oy, p, uid)
    dx = ox + RW + RH*0.26
    b += f'<rect x="{dx:.1f}" y="{oy:.1f}" width="{RH*0.014:.1f}" height="{RH:.1f}" fill="{p["rule"]}"/>'
    bx = dx + RH*0.26
    # block: PROFFSET over Arabic, same width, filling the REK height
    s1 = (RH*0.20)/PRO.h; h1 = PRO.h*s1; bw = PRO.w*s1
    s2 = bw*0.86/AR.w; h2 = AR.h*s2
    g = RH*0.22; tot = h1 + g + h2; top = oy + (RH-tot)/2
    b += PRO.at(bx, top, p["pro"], s1)
    b += AR.at(bx + bw - AR.w*s2, top + h1 + g, p["ar"], s2)
    return b, (bx + PRO.w*s1) - ox, RH

def write(name, svg): open(f"{OUT}/{name}.svg", "w").write(svg); print(name)

for th, p in PAL.items():
    pad = RH*0.55
    b, w, h = stacked(p, "s"+th, pad, pad)
    write(f"rek-proffset-logo-{th}", svgwrap(w+2*pad, h+2*pad, b, p["bg"]))
    pad = RH*0.45
    b, w, h = horizontal(p, "h"+th, pad, pad)
    write(f"rek-proffset-horizontal-{th}", svgwrap(w+2*pad, h+2*pad, b, p["bg"]))

# app / social icon
S = 1024; pd = PAL["dark"]; sc = (S*0.76)/RW
icon = f'<rect width="{S}" height="{S}" rx="{S*0.2}" fill="{pd["bg"]}"/>' + rek_mark((S-RW*sc)/2, (S-RH*sc)/2, pd, "icon", sc)
write("rek-proffset-icon", svgwrap(S, S, icon, None))

# ---------- brand board ----------
lbl = lambda s, size=22, face=med, tr=0.25: T(face, s, size, track=size*tr)
BW, BH = 2400, 1500
L, D = PAL["light"], PAL["dark"]
bb = f'<rect width="{BW}" height="{BH}" fill="#F4F5F8"/>'
# hero light panel
bb += f'<rect x="60" y="60" width="1400" height="900" fill="#FFFFFF"/>'
b, w, h = stacked(L, "bb1"); sc = 900/w
bb += f'<g transform="translate({60+(1400-w*sc)/2:.1f},{60+(900-h*sc)/2:.1f}) scale({sc:.4f})">{b}</g>'
# dark panel
bb += f'<rect x="1500" y="60" width="840" height="560" fill="{D["bg"]}"/>'
b, w, h = stacked(D, "bb2"); sc = 560/w
bb += f'<g transform="translate({1500+(840-w*sc)/2:.1f},{60+(560-h*sc)/2:.1f}) scale({sc:.4f})">{b}</g>'
# icon + horizontal on light
bb += f'<rect x="1500" y="660" width="840" height="300" fill="#FFFFFF"/>'
bb += f'<g transform="translate(1540,710) scale({200/1024:.4f})">{icon}</g>'
b, w, h = horizontal(L, "bb3"); sc = 540/w
bb += f'<g transform="translate({1770:.1f},{810-h*sc/2:.1f}) scale({sc:.4f})">{b}</g>'
# palette
sw = [("#1B2A61", "ROYAL NAVY"), ("#2E8FDB", "SKY BLUE"), ("#A01D33", "CARMINE RED"), ("#061A2E", "MIDNIGHT"), ("#FFFFFF", "PURE WHITE")]
x = 60
for hexv, name in sw:
    bb += f'<rect x="{x}" y="1000" width="260" height="260" fill="{hexv}" stroke="#D9DCE3" stroke-width="2"/>'
    bb += lbl(name, 20).at(x, 1285, "#1B2A61")
    bb += lbl(hexv.upper(), 20, face=semi, tr=0.12).at(x, 1322, "#7A8199")
    x += 284
# typography
tx = 1500
bb += lbl("TYPOGRAPHY", 20).at(tx, 1000, "#7A8199")
bb += T(black, "Archivo Expanded", 54).at(tx, 1045, "#1B2A61")
bb += lbl("WORDMARK  ·  HEADLINES  ·  LATIN", 18).at(tx, 1122, "#7A8199")
bb += T(arS, "IBM Plex Sans Arabic", 46).at(tx, 1170, "#1B2A61")
bb += T(arM, "العناية والحماية الاحترافية للسيارات", 40).at(tx, 1235, "#A01D33")
bb += lbl("REK PROFFSET  —  BRAND IDENTITY GUIDELINES", 20).at(60, 1420, "#1B2A61")
bb += lbl("V 2.0  ·  2026", 20).at(BW-60-lbl("V 2.0  ·  2026", 20).w, 1420, "#7A8199")
write("rek-proffset-brand-board", svgwrap(BW, BH, bb, None))
