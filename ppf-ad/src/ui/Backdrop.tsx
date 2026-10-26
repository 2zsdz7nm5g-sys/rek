import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../lib/brand";

// Reference A's drifting, heavily blurred colour field, in REK colours.
type Mood = "warm" | "cool" | "deep";

const palettes: Record<Mood, { base: string; blobs: string[] }> = {
  warm: { base: "#070403", blobs: [C.amberDeep, "#3b1a07", "#1a0c04", "#5a2a0a"] },
  cool: { base: C.bg, blobs: [C.premium, C.navy, "#0e3a63", "#0a2a4a"] },
  deep: { base: "#03070c", blobs: ["#0b2440", C.navy, "#08182a", "#123F69"] },
};

export const Backdrop: React.FC<{ mood?: Mood; intensity?: number }> = ({
  mood = "cool",
  intensity = 1,
}) => {
  const f = useCurrentFrame();
  const p = palettes[mood];
  const blobs = [
    { x: 20 + Math.sin(f / 90) * 6, y: 18 + Math.cos(f / 110) * 5, s: 70 },
    { x: 80 + Math.cos(f / 120) * 7, y: 46 + Math.sin(f / 80) * 6, s: 62 },
    { x: 30 + Math.sin(f / 70) * 8, y: 82 + Math.cos(f / 95) * 4, s: 80 },
    { x: 70 + Math.cos(f / 100) * 5, y: 96, s: 55 },
  ];
  return (
    <AbsoluteFill style={{ background: p.base, overflow: "hidden" }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: `${b.s}%`,
            aspectRatio: "1",
            translate: "-50% -50%",
            borderRadius: "50%",
            background: p.blobs[i],
            opacity: 0.85 * intensity,
            filter: "blur(140px)",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

// Film grain + vignette for a photographic finish.
export const Finish: React.FC<{ vignette?: number }> = ({ vignette = 0.75 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 60% at 50% 48%, transparent 40%, rgba(0,0,0,${vignette}) 100%)`,
        }}
      />
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.07, mixBlendMode: "overlay" }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 30} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
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
