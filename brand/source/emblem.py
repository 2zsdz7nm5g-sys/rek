import math
SKY, NAVY, RED, WHITE = "#3893D0", "#323C77", "#D3212D", "#FFFFFF"
SHIELD = "M100,6 C130,6 160,12 186,22 L186,118 C186,172 148,210 100,236 C52,210 14,172 14,118 L14,22 C40,12 70,6 100,6 Z"
def wave(y0, A, x0=-10, x1=210, k=1.25, ph=0.0, N=120):
    pts = [(x0+(x1-x0)*i/N, y0 + A*math.sin(2*math.pi*(k*i/N)+ph)) for i in range(N+1)]
    return pts
def emblem(uid, sky=SKY, navy=NAVY, red=RED, car=WHITE):
    w = wave(160, 5, ph=0.9)
    line = "M" + " L".join(f"{a:.1f},{b:.1f}" for a, b in w)
    lower = line + " L210,250 L-10,250 Z"
    body = ("M19,150 C14,150 13,146 14,143 C16,139 22,138 30,137 L64,131 C78,119 96,111 116,109 C138,108 156,114 172,126 "
            "C180,130 186,134 188,140 L188,145 C188,148 186,150 182,150 L167,150 A16,16 0 0 0 135,150 L67,150 A16,16 0 0 0 35,150 Z")
    glass = "M76,129 C88,121 101,116 116,115 C133,114 146,119 157,127 Z"
    wheels = "".join(f'<circle cx="{cx}" cy="151" r="11" fill="{car}"/><circle cx="{cx}" cy="151" r="4" fill="{navy}"/>' for cx in (51, 151))
    spark = lambda cx, cy, r: (f'<path d="M{cx},{cy-r} C{cx+r*0.12},{cy-r*0.12} {cx+r*0.12},{cy-r*0.12} {cx+r},{cy} '
                               f'C{cx+r*0.12},{cy+r*0.12} {cx+r*0.12},{cy+r*0.12} {cx},{cy+r} C{cx-r*0.12},{cy+r*0.12} {cx-r*0.12},{cy+r*0.12} {cx-r},{cy} '
                               f'C{cx-r*0.12},{cy-r*0.12} {cx-r*0.12},{cy-r*0.12} {cx},{cy-r} Z" fill="{car}"/>')
    return (f'<clipPath id="e{uid}"><path d="{SHIELD}"/></clipPath>'
            f'<g clip-path="url(#e{uid})"><rect x="0" y="0" width="200" height="240" fill="{sky}"/>'
            f'<path d="{lower}" fill="{navy}"/><path d="{line}" fill="none" stroke="{red}" stroke-width="4"/>'
            f'<g transform="translate(100,149) scale(0.84) translate(-101,-146)"><path d="{body}" fill="{car}"/><path d="{glass}" fill="{navy}"/>{wheels}</g>'
            f'{spark(148, 58, 20)}{spark(118, 44, 9)}</g>'
            f'<path d="{SHIELD}" fill="none" stroke="{red}" stroke-width="7" stroke-linejoin="round"/>')
if __name__ == "__main__":
    import sys
    open(sys.argv[1], "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 280" width="240" height="280"><g transform="translate(20,20)"><rect x="-20" y="-20" width="240" height="280" fill="#fff"/>{emblem("t")}</g></svg>')
