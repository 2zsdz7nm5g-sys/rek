import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";

/**
 * Technical illustration (not footage): reflection lines from an inspection board bend
 * around a small dent, then relax back to straight lines as the panel is reshaped.
 * Used because no genuine PDR photograph was available.
 */
export const PdrIllustration: React.FC<{ w: number; h: number; repairFrom: number; repairTo: number }> = ({
  w,
  h,
  repairFrom,
  repairTo,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const depth = interpolate(frame, [repairFrom, repairTo], [1, 0.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.25, 1),
  });
  // inspection light drifts slowly across the panel
  const lightX = interpolate(frame, [0, durationInFrames], [0.25, 0.75]);
  const cx = w * 0.52;
  const cy = h * 0.52;
  const sigma = w * 0.11;
  const lines = 11;

  const paths = Array.from({ length: lines }, (_, i) => {
    const y0 = (h / (lines + 1)) * (i + 1);
    const pts: string[] = [];
    for (let x = -10; x <= w + 10; x += 6) {
      const g = Math.exp(-(((x - cx) ** 2 + (y0 - cy) ** 2) / (2 * sigma ** 2)));
      const dy = depth * 34 * g * ((y0 - cy) / sigma);
      pts.push(`${x.toFixed(1)},${(y0 + dy).toFixed(1)}`);
    }
    return { d: `M${pts.join(" L")}`, y0 };
  });

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d1824" />
          <stop offset="0.55" stopColor="#081019" />
          <stop offset="1" stopColor="#04080d" />
        </linearGradient>
        <radialGradient id="light" cx={lightX} cy="0.45" r="0.55">
          <stop offset="0" stopColor="rgba(91,184,242,0.20)" />
          <stop offset="1" stopColor="rgba(91,184,242,0)" />
        </radialGradient>
        <radialGradient id="dent" cx={cx / w} cy={cy / h} r="0.2">
          <stop offset="0" stopColor={`rgba(0,0,0,${0.55 * depth})`} />
          <stop offset="1" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <filter id="glow" x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>
      <rect width={w} height={h} fill="url(#panel)" />
      <rect width={w} height={h} fill="url(#light)" />
      <rect width={w} height={h} fill="url(#dent)" />
      {paths.map((p, i) => (
        <g key={i} opacity={0.35 + 0.65 * Math.exp(-(((p.y0 - h * 0.45) / (h * 0.45)) ** 2))}>
          <path d={p.d} stroke="rgba(214,236,255,0.55)" strokeWidth={5} fill="none" filter="url(#glow)" />
          <path d={p.d} stroke="#EAF4FF" strokeWidth={1.6} fill="none" />
        </g>
      ))}
      <text
        x={w - 16}
        y={h - 16}
        textAnchor="end"
        fontFamily={FONTS.mono}
        fontSize={13}
        letterSpacing="0.2em"
        fill={COLORS.muted}
      >
        ILLUSTRATION
      </text>
    </svg>
  );
};
