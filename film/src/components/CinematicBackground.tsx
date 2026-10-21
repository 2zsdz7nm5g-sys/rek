import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { drift, lerp, reveal } from "./anim";

export type CameraMove = {
  /** start and end scale of the still (≥1 so edges never show) */
  scale: [number, number];
  /** start and end offset in % of the frame, applied as translate */
  x: [number, number];
  y: [number, number];
  /** CSS object-position focal point of the photo */
  focus?: string;
  flip?: boolean;
};

type Props = {
  src: string;
  move: CameraMove;
  /** brightness of the graded plate (0–1) */
  exposure?: number;
  saturation?: number;
  /** which side carries text and needs the protective gradient */
  textSide?: "left" | "bottom" | "none";
  /** frames for the opening focus pull (blur → sharp) */
  focusPull?: number;
  /** start/end of the slow light sweep across the plate, as fractions of the scene */
  sweep?: [number, number] | null;
  children?: React.ReactNode;
};

/**
 * Full-frame animated still: slow push/pan, a focus pull, the brand grade, a moving
 * reflection sweep and a legibility gradient on the text side. This is still-image
 * animation (2.5D), not video footage.
 */
export const CinematicBackground: React.FC<Props> = ({
  src,
  move,
  exposure = 0.72,
  saturation = 0.85,
  textSide = "left",
  focusPull = 40,
  sweep = [0.15, 0.75],
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const vertical = height > width;
  const t = drift(frame, durationInFrames);
  const blur = lerp(5, 0, reveal(frame, 0, focusPull));
  const sweepT = sweep ? (frame / durationInFrames - sweep[0]) / (sweep[1] - sweep[0]) : -1;

  const textGradient =
    textSide === "left" && !vertical
      ? `linear-gradient(90deg, rgba(5,11,18,0.93) 0%, rgba(5,11,18,0.82) 30%, rgba(5,11,18,0.35) 58%, rgba(5,11,18,0.30) 100%)`
      : textSide !== "none"
        ? `linear-gradient(0deg, rgba(5,11,18,0.95) 0%, rgba(5,11,18,0.82) 34%, rgba(5,11,18,0.25) 62%, rgba(5,11,18,0.45) 100%)`
        : "none";

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: move.focus ?? "50% 50%",
          scale: `${move.flip ? -1 : 1} 1`,
          transform: `translate(${lerp(move.x[0], move.x[1], t)}%, ${lerp(move.y[0], move.y[1], t)}%) scale(${lerp(move.scale[0], move.scale[1], t)})`,
          filter: `brightness(${exposure}) saturate(${saturation}) contrast(1.08) blur(${blur}px)`,
        }}
      />
      {/* cool midnight tint so mixed photography reads as one grade */}
      <AbsoluteFill style={{ backgroundColor: COLORS.navy, mixBlendMode: "soft-light", opacity: 0.55 }} />
      {sweepT > -0.2 && sweepT < 1.2 ? (
        <AbsoluteFill
          style={{
            background: `linear-gradient(105deg, rgba(255,255,255,0) ${lerp(-40, 110, sweepT)}%, rgba(214,236,255,0.10) ${lerp(-30, 120, sweepT)}%, rgba(255,255,255,0) ${lerp(-20, 130, sweepT)}%)`,
            mixBlendMode: "screen",
          }}
        />
      ) : null}
      <AbsoluteFill style={{ background: textGradient }} />
      <AbsoluteFill
        style={{
          background: "radial-gradient(120% 90% at 55% 50%, rgba(0,0,0,0) 55%, rgba(2,6,10,0.75) 100%)",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
