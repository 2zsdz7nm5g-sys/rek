import { AbsoluteFill, Img, staticFile } from "remotion";
import { C } from "../lib/brand";
import { useFrame } from "../lib/frame";

// Reference A's drifting, heavily blurred colour field, in REK colours.
type Mood = "danger" | "cool" | "deep";

const palettes: Record<Mood, { base: string; blobs: string[] }> = {
  danger: {
    base: "#040405",
    blobs: [C.dangerDeep, "#16181c", "#0c0d10", "#2a0a0d"],
  },
  cool: { base: C.bg, blobs: [C.premium, C.navy, "#0e3a63", "#0a2a4a"] },
  deep: { base: "#03070c", blobs: ["#0b2440", C.navy, "#08182a", "#123F69"] },
};

export const Backdrop: React.FC<{ mood?: Mood; intensity?: number }> = ({
  mood = "cool",
  intensity = 1,
}) => {
  const f = useFrame();
  const p = palettes[mood];
  const blobs = [
    { x: 20 + Math.sin(f / 90) * 6, y: 18 + Math.cos(f / 110) * 5, s: 70 },
    { x: 80 + Math.cos(f / 120) * 7, y: 46 + Math.sin(f / 80) * 6, s: 62 },
    { x: 30 + Math.sin(f / 70) * 8, y: 82 + Math.cos(f / 95) * 4, s: 80 },
    { x: 70 + Math.cos(f / 100) * 5, y: 96, s: 55 },
  ];
  return (
    <AbsoluteFill style={{ background: p.base, overflow: "hidden" }}>
      {/* Soft blobs as radial gradients: same look as a heavy CSS blur at a
          fraction of the render cost. */}
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: `${b.s * 2.2}%`,
            aspectRatio: "1",
            translate: "-50% -50%",
            opacity: 0.85 * intensity,
            background: `radial-gradient(circle closest-side, ${p.blobs[i]} 0%, ${p.blobs[i]}99 35%, ${p.blobs[i]}33 65%, transparent 100%)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

// Film grain + vignette for a photographic finish. The grain is a static
// noise plate shifted every frame (cheap, unlike an SVG turbulence filter).
export const Finish: React.FC<{ vignette?: number }> = ({
  vignette = 0.75,
}) => {
  const f = useFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 60% at 50% 48%, transparent 40%, rgba(0,0,0,${vignette}) 100%)`,
        }}
      />
      <Img
        src={staticFile("fx/grain.png")}
        style={{
          position: "absolute",
          left: -60,
          top: -60,
          width: 1200,
          height: 2040,
          translate: `${((f * 37) % 120) - 60}px ${((f * 53) % 120) - 60}px`,
          opacity: 0.06,
          mixBlendMode: "overlay",
        }}
      />
    </AbsoluteFill>
  );
};

// Darkens the headline zone so type never sits on a hot reflection.
export const TopScrim: React.FC<{ to?: number }> = ({ to = 38 }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(180deg, rgba(5,11,18,0.92) 0%, rgba(5,11,18,0.7) ${to * 0.6}%, transparent ${to}%)`,
    }}
  />
);
