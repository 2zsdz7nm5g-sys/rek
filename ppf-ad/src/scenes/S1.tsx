import { AbsoluteFill, interpolate } from "remotion";
import { clamp, easeInOut, prog, rand } from "../lib/anim";
import { C } from "../lib/brand";
import { display } from "../lib/fonts";
import { Floor, Stage } from "../three/Stage";
import { Car } from "../three/Car";
import {
  Chip,
  MACRO_CAM,
  MACRO_LOOK,
  PaintPanel,
  Scratch,
  Swirls,
  surfY,
} from "../three/Panel";
import { Stone } from "../three/Stone";
import { project } from "../three/project";
import { Backdrop, Finish, TopScrim } from "../ui/Backdrop";
import { LightLine } from "../ui/Line";
import { DashedTag, FocusIn, H1, Label, SwapBox, Voice } from "../ui/Type";
import { useFrame } from "../lib/frame";

// 1.1 HOOK: one stone, extreme close-up, impact freezes.
export const S1Hook: React.FC = () => {
  const f = useFrame();
  const IMPACT = 60;
  const fly = prog(f, 20, IMPACT, easeInOut);
  const after = Math.max(0, f - IMPACT);
  // Stone path: from above-camera down onto the paint, then a small rebound.
  const sx = interpolate(fly, [0, 1], [0.7, 0.14]) - after * 0.003;
  const sy =
    f < IMPACT
      ? interpolate(fly, [0, 1], [0.7, 0.02])
      : 0.02 + after * 0.004 - after * after * 0.00004;
  const sz = interpolate(fly, [0, 1], [1.6, 0.6]) + after * 0.004;
  const chip = prog(f, IMPACT, IMPACT + 6);
  const push = prog(f, 0, 160, easeInOut);
  return (
    <AbsoluteFill style={{ background: "#030202" }}>
      <Stage
        mood="danger"
        cam={[0.05 - push * 0.08, 0.42 - push * 0.06, 1.55 - push * 0.2]}
        look={[0.1, -0.02, 0.45]}
        fov={28}
        roll={-0.06}
      >
        <PaintPanel color="#050505" />
        {chip > 0 && <Chip x={0.12} z={0.55} r={0.03 * chip} seed={7} />}
        {chip > 0 && (
          <mesh position={[0.12, 0.004, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[0.05 + after * 0.007, 0.0525 + after * 0.0071, 96]}
            />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={Math.max(0, 0.7 - after * 0.022)}
            />
          </mesh>
        )}
        <Stone
          seed={11}
          position={[sx, sy, sz]}
          scale={0.018}
          rotation={[f * 0.05, f * 0.03, 0.4]}
        />
        {chip > 0 &&
          new Array(9)
            .fill(0)
            .map((_, i) => (
              <Stone
                key={i}
                seed={40 + i}
                tint="#c9cdd2"
                scale={0.0025 + rand(i) * 0.003}
                position={[
                  0.12 + Math.cos(i * 0.7) * after * 0.004 * (1 + rand(i + 3)),
                  0.002 + after * 0.003 * (0.5 + rand(i + 9)),
                  0.55 + Math.sin(i * 0.7) * after * 0.004 * (1 + rand(i + 5)),
                ]}
              />
            ))}
      </Stage>
      {/* Streak that leads the stone in, the first appearance of "the line". */}
      <LightLine
        x={interpolate(fly, [0, 1], [1100, 610])}
        y={interpolate(fly, [0, 1], [380, 1090])}
        length={520}
        angle={124}
        thickness={5}
        color={C.bone}
        opacity={
          f < IMPACT
            ? interpolate(fly, [0, 0.15, 1], [0, 1, 1])
            : interpolate(after, [0, 10], [1, 0], clamp)
        }
      />
      <TopScrim to={44} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 420 }}>
        <H1 size={150} weight={900}>
          <FocusIn at={IMPACT + 8}>حجرٌ</FocusIn>{" "}
          <FocusIn at={IMPACT + 18}>واحد.</FocusIn>
        </H1>
      </AbsoluteFill>
      <Finish vignette={0.85} />
    </AbsoluteFill>
  );
};

// 1.2 CHAOS: debris field past the front of the car, swapping risk word.
export const S1Chaos: React.FC = () => {
  const f = useFrame();
  const t = f / 60;
  const stones = new Array(26).fill(0).map((_, i) => {
    const depth = rand(i * 3.3);
    return {
      i,
      x: (rand(i) - 0.5) * 5,
      y: 0.2 + rand(i + 1) * 1.6,
      z: 3.6 - ((t * (2 + depth * 3) + rand(i + 2) * 6) % 7),
      s: 0.02 + rand(i + 4) * 0.05,
      fg: depth > 0.72,
    };
  });
  return (
    <AbsoluteFill style={{ background: "#030202" }}>
      <Stage
        mood="danger"
        cam={[2.6 + t * 0.12, 0.5, 6.8 - t * 0.2]}
        look={[0, 0.75, 0.2]}
        fov={34}
        envStrength={1.6}
      >
        <Floor danger />
        <spotLight
          position={[-3, 4, 4]}
          intensity={30}
          angle={0.6}
          penumbra={1}
          color="#ffffff"
        />
        <Car color="#050505" />
        {stones
          .filter((s) => !s.fg)
          .map((s) => (
            <Stone
              key={s.i}
              seed={s.i}
              position={[s.x, s.y, s.z]}
              scale={s.s}
              rotation={[f * 0.08 + s.i, f * 0.05, s.i]}
            />
          ))}
      </Stage>
      {/* Foreground debris on its own layer, blurred for depth of field. */}
      <Stage
        mood="danger"
        cam={[2.6 + t * 0.12, 0.5, 6.8 - t * 0.2]}
        look={[0, 0.75, 0.2]}
        fov={34}
        dpr={0.3}
        style={{ filter: "blur(8px)" }}
      >
        {stones
          .filter((s) => s.fg)
          .map((s) => (
            <Stone
              key={s.i}
              seed={s.i}
              position={[s.x * 0.4 + 2.2, s.y * 0.7 + 0.1, 4.6 + (s.z % 1.4)]}
              scale={s.s * 1.6}
              rotation={[f * 0.1, s.i, 0]}
            />
          ))}
      </Stage>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 300, gap: 26 }}>
        <Voice size={70} color={C.bone}>
          <FocusIn at={4}>كلّ يومٍ على الطريق</FocusIn>
        </Voice>
        <SwapBox
          words={["تطاير الحصى", "الخدوش", "رمال الطريق", "خدوش الغسيل"]}
          at={14}
          every={40}
        />
      </AbsoluteFill>
      <Finish vignette={0.8} />
    </AbsoluteFill>
  );
};

// 1.3 DAMAGE marks (shown in the before/after too) + 1.4 STAKES.
// World positions of the marks, so callouts can be pinned to them.
export const DMG = {
  chip: [0.12, 0, 0.85] as [number, number, number],
  scratch: [-0.12, 0, 0.15] as [number, number, number],
  swirl: [0.1, 0, -0.75] as [number, number, number],
};

export const DamageSet: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <>
    <Chip x={DMG.chip[0]} z={DMG.chip[2]} r={0.05} seed={3} opacity={opacity} />
    <Chip x={-0.22} z={1.0} r={0.04} seed={9} opacity={opacity} />
    <Chip x={0.26} z={0.45} r={0.03} seed={21} opacity={opacity} />
    <Scratch
      x={DMG.scratch[0]}
      z={DMG.scratch[2]}
      len={1.3}
      angle={0.35}
      width={0.009}
      opacity={opacity}
    />
    <Scratch
      x={0.05}
      z={0.5}
      len={0.8}
      angle={-0.15}
      width={0.006}
      opacity={opacity * 0.8}
    />
    <Swirls
      x={DMG.swirl[0]}
      z={DMG.swirl[2]}
      r={1.0}
      seed={4}
      opacity={opacity}
    />
  </>
);

export const S1Stakes: React.FC = () => {
  const f = useFrame();
  const ring = prog(f, 6, 40);
  return (
    <AbsoluteFill>
      <Backdrop mood="danger" />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 330 }}>
        <Voice size={78} color={C.bone}>
          <FocusIn at={0}>لسيارتك</FocusIn>
        </Voice>
        {/* Reference B's dotted ring + glowing counter, carrying an honest "1". */}
        <div
          style={{
            position: "relative",
            width: 470,
            height: 470,
            marginTop: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width={470}
            height={470}
            style={{ position: "absolute", rotate: `${f * 0.15}deg` }}
          >
            <circle
              cx={235}
              cy={235}
              r={225}
              fill="none"
              stroke={C.danger}
              strokeOpacity={0.7}
              strokeWidth={2.5}
              strokeDasharray="3 11"
              pathLength={1000}
              strokeDashoffset={0}
              style={{ opacity: ring }}
            />
          </svg>
          <div
            style={{
              fontFamily: display,
              fontWeight: 900,
              fontSize: 380,
              lineHeight: 1,
              color: C.ink,
              textShadow: `0 0 50px ${C.danger}66, 0 0 120px ${C.danger}33`,
              opacity: prog(f, 10, 26),
              scale: interpolate(prog(f, 10, 30), [0, 1], [1.25, 1]),
              filter: `blur(${(1 - prog(f, 10, 26)) * 20}px)`,
            }}
          >
            1
          </div>
        </div>
        <H1 size={104} weight={800} style={{ marginTop: 18 }}>
          <FocusIn at={24}>طلاءٌ أصليّ</FocusIn>
        </H1>
        <Voice size={92} color={C.danger} style={{ marginTop: -6 }}>
          <FocusIn at={34}>واحد فقط.</FocusIn>
        </Voice>
        <div style={{ height: 70 }} />
        <DashedTag at={56} color="#9aa0a8">
          <H1 size={46} weight={500} color={C.bone}>
            الإصلاح مكلف، والطلاء الأصلي لا يُعوَّض.
          </H1>
        </DashedTag>
        <div style={{ marginTop: 26 }}>
          <Label color="#8a9099" size={24} style={{ opacity: prog(f, 66, 80) }}>
            factory paint · one chance
          </Label>
        </div>
      </AbsoluteFill>
      <Finish vignette={0.7} />
    </AbsoluteFill>
  );
};

// 1.3 DAMAGE close-up with dashed callouts pinned to the marks.
const DCAM = MACRO_CAM;
const DLOOK = MACRO_LOOK;
const Callout: React.FC<{
  p: [number, number, number];
  at: number;
  text: string;
  dx: number;
  dy: number;
}> = ({ p, at, text, dx, dy }) => {
  const f = useFrame();
  const s = project(DCAM, DLOOK, 30, [p[0], surfY(p[0], p[2]), p[2]]);
  const k = prog(f, at, at + 14);
  return (
    <>
      <svg
        width={1080}
        height={1920}
        style={{ position: "absolute", inset: 0 }}
      >
        <circle
          cx={s.x}
          cy={s.y}
          r={10 * k}
          fill="none"
          stroke={C.danger}
          strokeWidth={3}
        />
        <line
          x1={s.x}
          y1={s.y}
          x2={s.x + dx * k}
          y2={s.y + dy * k}
          stroke={C.danger}
          strokeWidth={2}
          strokeDasharray="6 6"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: s.x + dx,
          top: s.y + dy,
          translate: dx < 0 ? "-100% -50%" : "0 -50%",
        }}
      >
        <DashedTag at={at + 6} color={C.danger}>
          <Label color={C.bone}>{text}</Label>
        </DashedTag>
      </div>
    </>
  );
};

export const S1Damage: React.FC = () => (
  <AbsoluteFill style={{ background: "#030202" }}>
    <Stage mood="danger" cam={DCAM} look={DLOOK} fov={30} envStrength={1.3}>
      <PaintPanel color="#050505" dull={0.25} />
      <DamageSet />
    </Stage>
    <Callout p={DMG.chip} at={4} text="chip" dx={-150} dy={170} />
    <Callout p={DMG.scratch} at={14} text="scratch" dx={-120} dy={-190} />
    <Callout p={DMG.swirl} at={24} text="swirl marks" dx={110} dy={-170} />
    <Finish />
  </AbsoluteFill>
);
