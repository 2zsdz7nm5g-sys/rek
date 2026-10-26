import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { easeInOut, prog } from "../lib/anim";
import { C } from "../lib/brand";
import { MACRO_CAM, MACRO_LOOK, PaintPanel } from "../three/Panel";
import { Stage } from "../three/Stage";
import { Stone } from "../three/Stone";
import { Backdrop, Finish, TopScrim } from "../ui/Backdrop";
import { Body, FocusIn, H1, Label, Voice } from "../ui/Type";
import { DamageSet } from "./S1";
import { useFrame } from "../lib/frame";

const CAM = MACRO_CAM;
const LOOK = MACRO_LOOK;

// 2.1 THE TURN: the film sweeps across (right to left, the Arabic reading
// direction). Behind its edge the grade flips from the black/red danger look to REK blue.
export const S2Turn: React.FC = () => {
  const f = useFrame();
  const sweep = interpolate(prog(f, 10, 70, easeInOut), [0, 1], [1180, -100]);
  const bounce = Math.max(0, f - 40);
  return (
    <AbsoluteFill style={{ background: "#030202" }}>
      <Stage mood="danger" cam={CAM} look={LOOK} fov={30} envStrength={1.3}>
        <PaintPanel color="#050505" dull={0.25} />
        <DamageSet />
      </Stage>
      <AbsoluteFill
        style={{
          clipPath: `polygon(${sweep + 90}px 0, 1080px 0, 1080px 1920px, ${sweep - 90}px 1920px)`,
        }}
      >
        <AbsoluteFill style={{ background: C.bg }} />
        <Stage mood="cool" cam={CAM} look={LOOK} fov={30}>
          <PaintPanel color="#06080b" />
          <Stone
            seed={11}
            position={[
              0.2 + bounce * 0.004,
              0.06 + bounce * 0.012 - bounce * bounce * 0.00008,
              0.9 + bounce * 0.01,
            ]}
            scale={0.03}
            rotation={[f * 0.1, 0.4, 0]}
          />
        </Stage>
        {/* Film sheen across the protected side. */}
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(115deg, transparent 30%, rgba(91,184,242,0.10) 45%, rgba(255,255,255,0.06) 50%, transparent 62%)",
          }}
        />
      </AbsoluteFill>
      {/* The film's leading edge: "the line" turns blue. */}
      <div
        style={{
          position: "absolute",
          left: sweep,
          top: -40,
          width: 5,
          height: 2000,
          rotate: "5.4deg",
          background: `linear-gradient(180deg, transparent, ${C.accentLight} 15%, #ffffff 50%, ${C.accentLight} 85%, transparent)`,
          boxShadow: `0 0 26px ${C.accentLight}aa, 0 0 80px ${C.accent}66`,
        }}
      />
      <TopScrim />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 330 }}>
        <Voice size={96} color={C.bone}>
          <FocusIn at={0}>لكن يمكنك…</FocusIn>
        </Voice>
        <H1 size={128} weight={800}>
          <FocusIn at={44}>أن تحميه.</FocusIn>
        </H1>
      </AbsoluteFill>
      <Finish vignette={0.7} />
    </AbsoluteFill>
  );
};

// 2.2 INTRODUCTION: reference B's title box, stretched open from a hairline,
// with a small node riding its corner (B's lime ball, made sharp and blue).
export const S2Intro: React.FC = () => {
  const f = useFrame();
  const w = prog(f, 4, 26);
  const h = prog(f, 22, 40);
  return (
    <AbsoluteFill>
      <Backdrop mood="deep" />
      <Stage
        mood="cool"
        cam={[0, 0.7, 2.6]}
        look={[0, -0.2, 0]}
        fov={30}
        style={{ opacity: 0.55 }}
      >
        <PaintPanel color="#06080b" />
      </Stage>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 120,
        }}
      >
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: interpolate(w, [0, 1], [0, 860]),
              height: interpolate(h, [0, 1], [6, 430]),
              background: `linear-gradient(160deg, ${C.navy}, ${C.surface})`,
              border: `1.5px solid ${C.premium}`,
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              gap: 8,
            }}
          >
            <div style={{ opacity: prog(f, 36, 50) }}>
              <Label size={26}>flexishield usa</Label>
            </div>
            {/* Official FlexiShield logo, never recoloured. */}
            <Img
              src={staticFile("brand/flexishield-logo.png")}
              style={{
                width: 720,
                marginTop: 10,
                marginBottom: 10,
                opacity: prog(f, 40, 58),
                translate: `0 ${(1 - prog(f, 40, 58)) * 50}px`,
                filter: `blur(${(1 - prog(f, 40, 58)) * 14}px)`,
              }}
            />
            <H1
              size={64}
              weight={500}
              color={C.accentLight}
              style={{ opacity: prog(f, 52, 68) }}
            >
              فيلم حماية الطلاء
            </H1>
          </div>
          <div
            style={{
              position: "absolute",
              left: -14,
              top: -14,
              width: 30,
              height: 30,
              background: C.accent,
              borderRadius: 2,
              scale: interpolate(prog(f, 40, 52), [0, 1], [0, 1]),
              boxShadow: `0 0 30px ${C.accent}88`,
            }}
          />
        </div>
        <div style={{ height: 70 }} />
        <Body size={42} color={C.ink} style={{ opacity: prog(f, 66, 84) }}>
          الوكيل الحصري في العراق
        </Body>
        <div style={{ opacity: prog(f, 72, 90), marginTop: 6 }}>
          <Label size={30} color={C.muted}>
            rek proffset
          </Label>
        </div>
      </AbsoluteFill>
      <Finish vignette={0.6} />
    </AbsoluteFill>
  );
};
