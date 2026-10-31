import sys, uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

F = sys.argv[1]  # fonts dir
OUT = sys.argv[2]

class Face:
    def __init__(s, path):
        s.tt = TTFont(path); s.gs = s.tt.getGlyphSet(); s.upem = s.tt['head'].unitsPerEm
        blob = hb.Blob.from_file_path(path); s.hbfont = hb.Font(hb.Face(blob))
        s.order = s.tt.getGlyphOrder()

def shape(face, text, size, track=0.0, rtl=False):
    """Return (path_d, width, (xmin,ymin,xmax,ymax)) at origin baseline y=0 (svg coords)."""
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hb.shape(face.hbfont, buf, {"kern": True, "liga": True})
    sc = size / face.upem
    x = 0; pen = SVGPathPen(face.gs); bp = BoundsPen(face.gs)
    n = len(buf.glyph_infos)
    for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
        g = face.order[info.codepoint]
        t = (sc, 0, 0, -sc, x + pos.x_offset*sc, -pos.y_offset*sc)
        face.gs[g].draw(TransformPen(pen, t)); face.gs[g].draw(TransformPen(bp, t))
        x += pos.x_advance*sc
        if i < n-1: x += track
    return pen.getCommands(), x, bp.bounds

rek  = Face(f"{F}/archivo-exp-900.ttf")
pro  = Face(f"{F}/archivo-exp-600.ttf")
ar   = Face(f"{F}/plexar-600.ttf")

# ---------- geometry ----------
REK_SIZE = 300
d_rek, w_rek, b_rek = shape(rek, "REK", REK_SIZE, track=8)
rx0, ry0, rx1, ry1 = b_rek            # ry0 = top (negative), ry1 = 0 baseline
RW, RH = rx1-rx0, ry1-ry0

# PROFFSET justified to the REK width
P_SIZE = 62
d_pro, w_pro, b_pro = shape(pro, "PROFFSET", P_SIZE, track=P_SIZE*0.30)
PW = b_pro[2]-b_pro[0]
PH = b_pro[3]-b_pro[1]

AR_TEXT = "للعناية بالسيارات"
A_SIZE = 66
d_ar, w_ar, b_ar = shape(ar, AR_TEXT, A_SIZE)
AW, AH = b_ar[2]-b_ar[0], b_ar[3]-b_ar[1]

def build(theme):
    dark = theme == "dark"
    transparent = theme == "transparent"
    sky, navy = "#3C9BDF", "#2A3673"
    ink_navy = "#F2F5FA" if dark else "#1F2A5C"
    hair = "#C9A86A"  # unused accent reserve
    PAD = 120
    gap1, gap2 = 54, 50
    W = RW + PAD*2
    # vertical positions (svg y grows down)
    top = PAD
    rek_base = top + RH
    pro_top = rek_base + gap1
    pro_base = pro_top - b_pro[1]
    ar_top = pro_base + (b_pro[3]) + gap2
    ar_base = ar_top - b_ar[1]
    H = ar_base + b_ar[3] + PAD
    ox = PAD - rx0                         # REK x offset
    px = (W - PW)/2 - b_pro[0]             # PROFFSET centred
    ax = (W - AW)/2 - b_ar[0]              # Arabic centred
    # wave across the REK block (local coords: REK origin)
    yb = ry0 + RH*0.46; A = RH*0.07
    x0, x1 = rx0-40, rx1+40; L = x1-x0
    import math
    pts = []
    for i in range(121):
        t = i/120; x = x0 + L*t
        y = yb + A*math.cos(2*math.pi*t*1.15)
        pts.append(f"{x:.1f},{y:.1f}")
    wave = "M" + " L".join(pts)
    lower = wave + f" L{x1:.1f},{ry1+40:.1f} L{x0:.1f},{ry1+40:.1f} Z"
    c0, c1, c2 = ("#D93348", "#B71F35", "#931528") if dark else ("#C8243A", "#A3172C", "#7E0F20")
    bg = "#061A2E" if dark else "#FFFFFF"
    # tagline hairlines
    lw = (RW - PW)/2 - 40
    ly = pro_top + PH/2 - 1.5
    hl = (f'<rect x="{PAD:.1f}" y="{ly:.1f}" width="{lw:.1f}" height="3" fill="url(#crimsonH)"/>'
          f'<rect x="{W-PAD-lw:.1f}" y="{ly:.1f}" width="{lw:.1f}" height="3" fill="url(#crimsonH2)"/>'
          f'<rect x="{PAD+lw-7:.1f}" y="{ly-3.5:.1f}" width="10" height="10" transform="rotate(45 {PAD+lw-2:.1f} {ly+1.5:.1f})" fill="#A3172C"/>'
          f'<rect x="{W-PAD-lw-3:.1f}" y="{ly-3.5:.1f}" width="10" height="10" transform="rotate(45 {W-PAD-lw+2:.1f} {ly+1.5:.1f})" fill="#A3172C"/>')
    sticker = (f'<path d="{d_rek}" transform="translate({ox:.1f},{rek_base:.1f})" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="26" stroke-linejoin="round"/>'
               if dark else "")
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}" width="{W:.0f}" height="{H:.0f}">
  <title>REK PROFFSET — للعناية بالسيارات</title>
  <defs>
    <linearGradient id="crimson" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{c0}"/><stop offset="0.55" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/>
    </linearGradient>
    <linearGradient id="crimsonH" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#A3172C" stop-opacity="0"/><stop offset="1" stop-color="#A3172C"/>
    </linearGradient>
    <linearGradient id="crimsonH2" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#A3172C"/><stop offset="1" stop-color="#A3172C" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4FAAEC"/><stop offset="1" stop-color="{sky}"/>
    </linearGradient>
    <linearGradient id="navy" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#33418A"/><stop offset="1" stop-color="{navy}"/>
    </linearGradient>
    <clipPath id="rekClip"><path d="{d_rek}"/></clipPath>
  </defs>
  {"" if transparent else f'<rect width="100%" height="100%" fill="{bg}"/>'}
  {sticker}
  <g transform="translate({ox:.1f},{rek_base:.1f})">
    <g clip-path="url(#rekClip)">
      <rect x="{rx0-40:.1f}" y="{ry0-40:.1f}" width="{RW+80:.1f}" height="{RH+80:.1f}" fill="url(#sky)"/>
      <path d="{lower}" fill="url(#navy)"/>
      <path d="{wave}" fill="none" stroke="#B01C31" stroke-width="5"/>
    </g>
    <path d="{d_rek}" fill="none" stroke="#A3172C" stroke-width="6" stroke-linejoin="round"/>
  </g>
  <path d="{d_pro}" transform="translate({px:.1f},{pro_base:.1f})" fill="url(#crimson)"/>
  {hl}
  <path d="{d_ar}" transform="translate({ax:.1f},{ar_base:.1f})" fill="{ink_navy}"/>
</svg>'''
    return svg, W, H

for theme in ("light", "dark", "transparent"):
    svg, W, H = build(theme)
    open(f"{OUT}/rek-proffset-logo-{theme}.svg", "w").write(svg)
    print(theme, round(W), round(H))
