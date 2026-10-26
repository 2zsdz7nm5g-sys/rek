import { useMemo } from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import * as THREE from "three";
import { easeInOut, prog, rand } from "../lib/anim";
import { C, H, REELS_SAFE_BOTTOM, W } from "../lib/brand";
import {
  MACRO_CAM,
  MACRO_LOOK,
  PaintPanel,
  Scratch,
  surfY,
} from "../three/Panel";
import { project } from "../three/project";
import { Car } from "../three/Car";
import { Floor, Stage } from "../three/Stage";
import { Stone } from "../three/Stone";
import { Backdrop, Finish, TopScrim } from "../ui/Backdrop";
import { Body, DashedTag, FocusIn, H1, Label, Voice } from "../ui/Type";
import { useFrame } from "../lib/frame";

// Film sheet lying just above the paint, covering x >= edge.
const FilmSheet: React.FC<{ edge: number; lift?: number }> = ({
  edge,
  lift = 0.004,
}) => {
  const geo = useMemo(() => {
    const w = 4 - edge;
    const g = new THREE.PlaneGeometry(w, 8, 80, 160);
    g.rotateX(-Math.PI / 2);
    g.translate(edge + w / 2, 0, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++)
      p.setY(i, surfY(p.getX(i), p.getZ(i)) + lift);
    g.computeVertexNormals();
    return g;
  }, [edge, lift]);
  const edgeGeo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let z = -4; z <= 4; z += 0.05)
      pts.push(new THREE.Vector3(edge, surfY(edge, z) + lift + 0.002, z));
    return new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(pts),
      200,
      0.006,
      6,
      false,
    );
  }, [edge, lift]);
  return (
    <>
      <mesh geometry={geo}>
        <meshPhysicalMaterial
          color="#cfe9ff"
          transparent
          depthWrite={false}
          opacity={0.2}
          roughness={0.04}
          clearcoat={1}
          clearcoatRoughness={0}
          envMapIntensity={1.6}
        />
      </mesh>
      <mesh geometry={edgeGeo}>
        <meshBasicMaterial color={C.accentLight} />
      </mesh>
    </>
  );
};

// 3.1 APPLICATION: film settles across the panel, digital cut line traced.
const ACAM: [number, number, number] = [0.35, 1.7, 2.9];
const ALOOK: [number, number, number] = [0, 0.05, 0.1];
export const S3Apply: React.FC = () => {
  const f = useFrame();
  const edge = interpolate(prog(f, 0, 90, easeInOut), [0, 1], [1.6, -0.75]);
  const outline = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    const x0 = -0.42,
      x1 = 0.42,
      z0 = -0.2,
      z1 = 1.05,
      r = 0.14,
      n = 14;
    const corner = (cx: number, cz: number, a0: number) => {
      for (let i = 0; i <= n; i++) {
        const a = a0 + (i / n) * (Math.PI / 2);
        const x = cx + Math.cos(a) * r;
        const z = cz + Math.sin(a) * r;
        pts.push(project(ACAM, ALOOK, 32, [x, surfY(x, z) + 0.006, z]));
      }
    };
    corner(x1 - r, z1 - r, 0);
    corner(x0 + r, z1 - r, Math.PI / 2);
    corner(x0 + r, z0 + r, Math.PI);
    corner(x1 - r, z0 + r, Math.PI * 1.5);
    return (
      "M" +
      pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L") +
      " Z"
    );
  }, []);
  const trace = prog(f, 20, 110);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage mood="cool" cam={ACAM} look={ALOOK} fov={32}>
        <PaintPanel color="#06080b" />
        <FilmSheet edge={edge} />
      </Stage>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <path
          d={outline}
          fill="none"
          stroke={C.accentLight}
          strokeWidth={3}
          strokeDasharray="14 10"
          pathLength={1000}
          strokeDashoffset={0}
          style={{ opacity: 0.9 }}
          clipPath="url(#reveal)"
        />
        <clipPath id="reveal">
          <rect x={0} y={0} width={W} height={H * trace} />
        </clipPath>
      </svg>
      <TopScrim to={46} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 }}>
        <H1 size={124} weight={800}>
          <FocusIn at={6}>قصٌّ رقميّ</FocusIn>
        </H1>
        <Voice
          size={100}
          color={C.accentLight}
          style={{ marginTop: -10, marginRight: -220 }}
        >
          <FocusIn at={16} dx={-40}>
            دقيق.
          </FocusIn>
        </Voice>
        <div style={{ marginTop: 26, opacity: prog(f, 26, 40) }}>
          <Label size={26}>tpu film · digital cut</Label>
        </div>
      </AbsoluteFill>
      <Finish vignette={0.6} />
    </AbsoluteFill>
  );
};

// 3.2 THE LAYERS: exploded stack, reference B's dashed labels stacking in.
const LCAM: [number, number, number] = [4.2, 3.6, 6.4];
const LLOOK: [number, number, number] = [0.9, 0.5, -0.4];
const layers = [
  { y: 0.0, en: "primer", ar: "طبقة الأساس", color: "#8b9096", kind: "matte" },
  {
    y: 0.42,
    en: "base coat",
    ar: "طبقة اللون",
    color: "#07090c",
    kind: "paint",
  },
  {
    y: 0.84,
    en: "clear coat",
    ar: "الطبقة الشفافة",
    color: "#cfd8e2",
    kind: "clear",
  },
  {
    y: 1.36,
    en: "flexishield tpu",
    ar: "فيلم الحماية",
    color: "#9fd4ff",
    kind: "film",
  },
] as const;

const Slab: React.FC<{ y: number; color: string; kind: string; t: number }> = ({
  y,
  color,
  kind,
  t,
}) => {
  const geo = useMemo(() => new THREE.BoxGeometry(2.6, 0.08, 1.7), []);
  const edges = useMemo(() => new THREE.EdgesGeometry(geo), [geo]);
  const edgeColor =
    kind === "film" ? C.accentLight : kind === "clear" ? "#9fb3c8" : "#3a4654";
  return (
    <group position={[0, y + (1 - t) * 0.8, 0]} scale={[1, 1, 1]}>
      <mesh geometry={geo}>
        {kind === "matte" && (
          <meshStandardMaterial color={color} roughness={0.95} />
        )}
        {kind === "paint" && (
          <meshPhysicalMaterial
            color={color}
            metalness={0.6}
            roughness={0.3}
            clearcoat={1}
            clearcoatRoughness={0.03}
          />
        )}
        {kind === "clear" && (
          <meshPhysicalMaterial
            color={color}
            transparent
            opacity={0.28}
            roughness={0.03}
            clearcoat={1}
            envMapIntensity={1.5}
          />
        )}
        {kind === "film" && (
          <meshPhysicalMaterial
            color={color}
            transparent
            opacity={0.2}
            roughness={0.02}
            clearcoat={1}
            envMapIntensity={1.8}
          />
        )}
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={edgeColor} transparent opacity={t} />
      </lineSegments>
    </group>
  );
};

export const S3Layers: React.FC = () => {
  const f = useFrame();
  const rot = interpolate(f, [0, 240], [-0.12, 0.12]);
  return (
    <AbsoluteFill>
      <Backdrop mood="deep" />
      <Stage
        mood="cool"
        cam={[LCAM[0] + rot * 4, LCAM[1], LCAM[2]]}
        look={LLOOK}
        fov={27}
      >
        {layers.map((l, i) => (
          <Slab
            key={l.en}
            y={l.y}
            color={l.color}
            kind={l.kind}
            t={prog(f, 8 + i * 14, 30 + i * 14)}
          />
        ))}
      </Stage>
      {layers.map((l, i) => {
        const s = project([LCAM[0] + rot * 4, LCAM[1], LCAM[2]], LLOOK, 27, [
          1.3,
          l.y,
          0.85,
        ]);
        const film = l.kind === "film";
        return (
          <div
            key={l.en}
            style={{
              position: "absolute",
              left: s.x + 34,
              top: s.y,
              translate: "0 -50%",
            }}
          >
            <DashedTag
              at={30 + i * 14}
              color={film ? C.accentLight : "#7f8fa3"}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 2,
                }}
              >
                <Body
                  size={36}
                  color={film ? C.ink : "#c3ccd6"}
                  style={{ lineHeight: 1.3 }}
                >
                  {l.ar}
                </Body>
                <Label size={20} color={film ? C.accentLight : C.muted}>
                  {l.en}
                </Label>
              </div>
            </DashedTag>
          </div>
        );
      })}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 }}>
        <H1 size={112} weight={800}>
          <FocusIn at={0}>طبقةٌ شفّافة</FocusIn>
        </H1>
        <Voice size={84} color={C.accentLight}>
          <FocusIn at={10}>فوق طلائك الأصلي</FocusIn>
        </Voice>
      </AbsoluteFill>
      <Finish vignette={0.6} />
    </AbsoluteFill>
  );
};

// 3.4 SELF-HEALING: a warm band of heat passes; fine top-coat scratches fade.
const HCAM = MACRO_CAM;
const HLOOK = MACRO_LOOK;
const scratches = new Array(9).fill(0).map((_, i) => ({
  x: (rand(i * 3.1) - 0.5) * 0.7,
  z: -0.5 + i * 0.16 + rand(i) * 0.08,
  len: 0.35 + rand(i + 7) * 0.5,
  angle: (rand(i + 2) - 0.5) * 0.9,
}));
export const S3Heal: React.FC = () => {
  const f = useFrame();
  const bandZ = interpolate(prog(f, 10, 150, easeInOut), [0, 1], [-0.9, 1.9]);
  const band = project(HCAM, HLOOK, 30, [0, surfY(0, bandZ), bandZ]);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage mood="cool" cam={HCAM} look={HLOOK} fov={30}>
        <PaintPanel color="#06080b" />
        <FilmSheet edge={-4} lift={0.003} />
        {scratches.map((s, i) => (
          <Scratch
            key={i}
            x={s.x}
            z={s.z}
            len={s.len}
            angle={s.angle}
            width={0.011}
            color="#f2f5f8"
            opacity={interpolate(bandZ - s.z, [-0.1, 0.5], [1, 0.04], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}
          />
        ))}
      </Stage>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: band.y - 160,
          height: 320,
          background:
            "linear-gradient(180deg, transparent, rgba(255,150,70,0.20) 40%, rgba(255,200,140,0.28) 50%, rgba(255,150,70,0.20) 60%, transparent)",
          mixBlendMode: "screen",
        }}
      />
      <TopScrim />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 }}>
        <H1 size={112} weight={800}>
          <FocusIn at={0}>الخدوش الدقيقة</FocusIn>
        </H1>
        <Voice size={92} color="#ffc48a">
          <FocusIn at={12}>تتلاشى بالحرارة*</FocusIn>
        </Voice>
        <div style={{ marginTop: 22, opacity: prog(f, 24, 40) }}>
          <Label size={24}>self-healing top coat</Label>
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: REELS_SAFE_BOTTOM,
        }}
      >
        <Body
          size={36}
          color="#C9D2DC"
          style={{
            textAlign: "center",
            maxWidth: 780,
            textWrap: "balance",
            textShadow: "0 2px 14px rgba(0,0,0,0.85)",
            opacity: prog(f, 30, 50),
          }}
        >
          *للخدوش السطحية الخفيفة في الطبقة العليا من الفيلم، في الظروف المناسبة
          وحسب مواصفات الفيلم.
        </Body>
      </AbsoluteFill>
      <Finish vignette={0.6} />
    </AbsoluteFill>
  );
};

// 3.3 IMPACT: slow-motion gravel meets the film. The film flexes locally
// (ripple ring), the stone deflects, the paint underneath stays intact.
const ICAM: [number, number, number] = [0.9, 0.55, 2.2];
const ILOOK: [number, number, number] = [0, 0.05, 0.3];
export const S3Impact: React.FC = () => {
  const f = useFrame();
  const HIT = 46;
  const fly = prog(f, 0, HIT, (t) => t);
  const after = Math.max(0, f - HIT);
  const sx = f < HIT ? interpolate(fly, [0, 1], [-1.4, 0]) : after * 0.012;
  const sy =
    f < HIT
      ? interpolate(fly, [0, 1], [0.9, 0.025])
      : 0.025 + after * 0.01 - after * after * 0.00006;
  const sz =
    f < HIT ? interpolate(fly, [0, 1], [-0.6, 0.3]) : 0.3 + after * 0.01;
  const ripple = after > 0 ? after : 0;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage mood="cool" cam={ICAM} look={ILOOK} fov={30}>
        <PaintPanel color="#06080b" />
        <FilmSheet edge={-4} lift={0.004} />
        <Stone
          seed={5}
          position={[sx, sy, sz]}
          scale={0.035}
          rotation={[f * 0.04, f * 0.03, 0.2]}
        />
        {ripple > 0 &&
          [0, 7, 14].map((d) => {
            const r = Math.max(0, ripple - d);
            return r > 0 ? (
              <mesh
                key={d}
                position={[0, surfY(0, 0.3) + 0.006, 0.3]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <ringGeometry
                  args={[0.02 + r * 0.008, 0.026 + r * 0.0082, 96]}
                />
                <meshBasicMaterial
                  color={C.accentLight}
                  transparent
                  depthWrite={false}
                  opacity={Math.max(0, 0.75 - r * 0.02)}
                />
              </mesh>
            ) : null;
          })}
      </Stage>
      <TopScrim to={42} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 }}>
        <H1 size={88} weight={800} style={{ whiteSpace: "nowrap" }}>
          <FocusIn at={4}>يساعد على امتصاص</FocusIn>
        </H1>
        <Voice size={84} color={C.accentLight} style={{ whiteSpace: "nowrap" }}>
          <FocusIn at={14}>ضربات الحصى الصغيرة</FocusIn>
        </Voice>
        <Body
          size={38}
          color={C.ink}
          style={{ marginTop: 16, opacity: prog(f, 60, 78) }}
        >
          ويحمي من الخدوش اليومية
        </Body>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 380,
          opacity: prog(f, HIT, HIT + 14),
        }}
      >
        <Label size={24}>tpu film · paint intact</Label>
      </AbsoluteFill>
      <Finish vignette={0.6} />
    </AbsoluteFill>
  );
};

// 3.5 FEATURE RING: pull back to the whole car; verified benefits orbit it
// (reference A's ring of avatars around "Built For").
const features = [
  { ar: "شفافية عالية", en: "high clarity" },
  { ar: "مقاوم للاصفرار", en: "anti-yellowing" },
  { ar: "حماية من الأشعة فوق البنفسجية", en: "uv protection" },
  { ar: "طبقة عليا ذاتية الالتئام", en: "self-healing top coat" },
];
export const S3Ring: React.FC = () => {
  const f = useFrame();
  const back = prog(f, 0, 90, easeInOut);
  const dist = interpolate(back, [0, 1], [11, 19]);
  const a = 0.75 + f * 0.0015;
  const cam: [number, number, number] = [
    Math.sin(a) * dist,
    2.4,
    Math.cos(a) * dist,
  ];
  const look: [number, number, number] = [0, 0.5, 0];
  return (
    <AbsoluteFill>
      <Backdrop mood="deep" />
      <Stage mood="cool" cam={cam} look={look} fov={28}>
        <Floor />
        <Car color="#07090c" />
      </Stage>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <ellipse
          cx={540}
          cy={1010}
          rx={470}
          ry={150}
          fill="none"
          stroke={C.accentLight}
          strokeOpacity={0.35 * prog(f, 10, 40)}
          strokeWidth={2}
          strokeDasharray="4 12"
        />
      </svg>
      {features.map((ft, i) => {
        const ang = (i / features.length) * Math.PI * 2 + f * 0.006 + 0.5;
        const x = 540 + Math.cos(ang) * 400;
        const y = 1010 + Math.sin(ang) * 330;
        const front = Math.sin(ang) > 0;
        return (
          <div
            key={ft.en}
            style={{
              position: "absolute",
              left: x,
              top: y,
              translate: "-50% -50%",
              zIndex: front ? 2 : 0,
              scale: front ? 1 : 0.86,
              opacity: front ? 1 : 0.75,
            }}
          >
            <DashedTag at={20 + i * 10} color={C.accentLight}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Body
                  size={34}
                  color={C.ink}
                  style={{ lineHeight: 1.3, whiteSpace: "nowrap" }}
                >
                  {ft.ar}
                </Body>
                <Label size={18} style={{ whiteSpace: "nowrap" }}>
                  {ft.en}
                </Label>
              </div>
            </DashedTag>
          </div>
        );
      })}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 }}>
        <Img
          src={staticFile("brand/flexishield-logo.png")}
          style={{
            width: 600,
            opacity: prog(f, 6, 24),
            filter: `blur(${(1 - prog(f, 6, 24)) * 12}px)`,
          }}
        />
      </AbsoluteFill>
      <Finish vignette={0.6} />
    </AbsoluteFill>
  );
};
