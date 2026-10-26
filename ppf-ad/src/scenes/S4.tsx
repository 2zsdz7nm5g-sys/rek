import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { easeInOut, prog } from "../lib/anim";
import { C } from "../lib/brand";
import { display } from "../lib/fonts";
import { Car } from "../three/Car";
import { MACRO_CAM, MACRO_LOOK, PaintPanel } from "../three/Panel";
import { Floor, Stage } from "../three/Stage";
import { Backdrop, Finish, TopScrim } from "../ui/Backdrop";
import { LightLine } from "../ui/Line";
import { Body, FocusIn, H1, Label, Voice } from "../ui/Type";
import { DamageSet } from "./S1";

const CAM = MACRO_CAM;
const LOOK = MACRO_LOOK;

// 4.1 BEFORE / AFTER: same panel, same light. Right (read first in Arabic):
// unprotected after daily driving. Left: protected.
export const S4BeforeAfter: React.FC = () => {
  const f = useCurrentFrame();
  const split = interpolate(prog(f, 0, 50, easeInOut), [0, 1], [1080, 540]);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage mood="cool" cam={CAM} look={LOOK} fov={30}>
        <PaintPanel color="#06080b" />
      </Stage>
      <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${split}px)` }}>
        <AbsoluteFill style={{ background: C.bg }} />
        <Stage mood="cool" cam={CAM} look={LOOK} fov={30}>
          <PaintPanel color="#06080b" dull={0.45} />
          <DamageSet />
        </Stage>
        <AbsoluteFill style={{ background: "rgba(40,30,20,0.25)", mixBlendMode: "multiply" }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: split - 2, top: 0, width: 4, height: 1920, background: `linear-gradient(180deg, transparent, ${C.accentLight}, #fff 50%, ${C.accentLight}, transparent)`, boxShadow: `0 0 24px ${C.accentLight}99` }} />
      <TopScrim />
      <div style={{ position: "absolute", top: 640, left: 0, width: 540, display: "flex", justifyContent: "center", opacity: prog(f, 40, 56) }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <H1 size={52} weight={600} color={C.ink}>مع FlexiShield</H1>
          <Label size={20}>protected</Label>
        </div>
      </div>
      <div style={{ position: "absolute", top: 640, left: 540, width: 540, display: "flex", justifyContent: "center", opacity: prog(f, 30, 46) }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <H1 size={52} weight={600} color="#cbb9a6">بدون PPF</H1>
          <Label size={20} color="#a08a74">unprotected</Label>
        </div>
      </div>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 }}>
        <H1 size={110} weight={800}>
          <FocusIn at={56}>نفس الطريق.</FocusIn>
        </H1>
        <Voice size={96} color={C.accentLight}>
          <FocusIn at={68}>نتيجة مختلفة.</FocusIn>
        </Voice>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 360 }}>
        <Body size={26} color={C.muted}>تمثيل توضيحي</Body>
      </AbsoluteFill>
      <Finish vignette={0.6} />
    </AbsoluteFill>
  );
};

// 4.2 HERO: slow orbit, reflections sweeping over flawless paint.
export const S4Hero: React.FC = () => {
  const f = useCurrentFrame();
  const a = interpolate(f, [0, 240], [0.55, 0.85]);
  return (
    <AbsoluteFill>
      <Backdrop mood="deep" intensity={0.8} />
      <Stage mood="cool" cam={[Math.sin(a) * 15, 2.0, Math.cos(a) * 15]} look={[0, 0.55, 0]} fov={28} envStrength={1.2}>
        <Floor />
        <Car color="#07090c" />
      </Stage>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 330 }}>
        <Voice size={100} color={C.ink}>
          <FocusIn at={10}>أبقِها</FocusIn>
        </Voice>
        <H1 size={150} weight={900} style={{ marginTop: -16 }}>
          <FocusIn at={22}>أصليّة.</FocusIn>
        </H1>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 420 }}>
        <Body size={40} color={C.muted} style={{ opacity: prog(f, 40, 60) }}>
          الطلاء · اللمعان · القيمة
        </Body>
      </AbsoluteFill>
      <Finish vignette={0.65} />
    </AbsoluteFill>
  );
};

// 4.3 END CARD: brand reveal + call to action (reference A's end layout).
export const S4End: React.FC = () => {
  const f = useCurrentFrame();
  const line = prog(f, 14, 40);
  return (
    <AbsoluteFill>
      <Backdrop mood="deep" />
      <Stage mood="cool" cam={[4.6, 1.0, 6.2]} look={[0, 0.45, 0]} fov={28} style={{ opacity: 0.9, translate: "0 640px" }}>
        <Floor />
        <Car color="#07090c" />
      </Stage>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.bg} 30%, transparent 55%, transparent 80%, ${C.bg} 100%)` }} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 260 }}>
        {/* Official REK logo. In motion it is revealed by a rising wave,
            echoing the wave inside the mark and the film covering paint. */}
        <Img
          src={staticFile("brand/rek-logo.png")}
          style={{
            width: 460,
            opacity: prog(f, 0, 18),
            filter: `blur(${(1 - prog(f, 0, 18)) * 14}px)`,
            clipPath: `inset(${(1 - prog(f, 0, 24)) * 100}% 0 0 0)`,
          }}
        />
        <div style={{ marginTop: 14, opacity: prog(f, 10, 26) }}>
          <Label size={30} color={C.ink} style={{ letterSpacing: "0.5em" }}>proffset</Label>
        </div>
        <div style={{ position: "relative", width: 620, height: 8, marginTop: 22 }}>
          <LightLine x={interpolate(line, [0, 1], [0, 620])} y={4} length={interpolate(line, [0, 1], [0, 620])} angle={0} thickness={4} />
        </div>
        <Img src={staticFile("brand/flexishield-logo.png")} style={{ width: 430, marginTop: 34, opacity: prog(f, 30, 46) }} />
        <Body size={36} color={C.muted} style={{ marginTop: 4, opacity: prog(f, 34, 50) }}>
          الوكيل الحصري في العراق
        </Body>
        <div
          dir="rtl"
          style={{
            marginTop: 40,
            padding: "24px 64px",
            background: C.accent,
            color: C.bg,
            borderRadius: 2,
            fontFamily: display,
            fontWeight: 700,
            fontSize: 52,
            opacity: prog(f, 40, 56),
            scale: interpolate(prog(f, 40, 56), [0, 1], [0.9, 1]),
          }}
        >
          احجز استشارة PPF
        </div>
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: prog(f, 52, 70) }}>
          <Body size={42} color={C.ink}>
            واتساب <bdi dir="ltr">0770 755 5332</bdi>
          </Body>
          <Label size={28} color={C.accentLight}>@rek.proffset · baghdad</Label>
        </div>
      </AbsoluteFill>
      <Finish vignette={0.55} />
    </AbsoluteFill>
  );
};
