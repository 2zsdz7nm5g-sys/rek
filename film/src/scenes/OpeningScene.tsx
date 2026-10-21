import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ArabicTextBlock } from "../components/ArabicTextBlock";
import { drift, lerp, reveal } from "../components/anim";
import { Narration, Sfx } from "../components/Narration";
import type { SceneTiming } from "../data/timeline";
import { COLORS } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Near darkness → headlights → a thin strip of studio light travels across the hero car,
 * revealing its body lines and reflections. Same hero vehicle as the finale.
 */
export const OpeningScene: React.FC<{ timing: SceneTiming }> = ({ timing }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const vertical = height > width;
  const t = drift(frame, durationInFrames);

  const lightsIn = interpolate(frame, [8, 50, 100, 140], [0, 1, 1, 0], clamp);
  const silhouette = reveal(frame, 92, 50);
  const sweepP = interpolate(frame, [112, 250], [-25, 125], clamp);
  const sweepOn = interpolate(frame, [112, 130, 236, 254], [0, 1, 1, 0], clamp);
  const fullyLit = reveal(frame, 226, 80);
  const titleAt = 262;

  const heroTransform = `translate(${lerp(1.5, -1.5, t)}%, ${lerp(0, -0.8, t)}%) scale(${lerp(1.06, 1.13, t)})`;
  const heroStyle: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: vertical ? "32% 50%" : "50% 50%",
    transform: heroTransform,
  };
  const band = (p: number) =>
    `linear-gradient(100deg, transparent ${p - 22}%, rgba(0,0,0,0.85) ${p - 6}%, black ${p}%, rgba(0,0,0,0.85) ${p + 6}%, transparent ${p + 22}%)`;

  return (
    <AbsoluteFill style={{ backgroundColor: "#020407", overflow: "hidden" }}>
      {/* 1. headlights in the dark */}
      <Img
        src={staticFile("media/rek-final.webp")}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: lightsIn,
          scale: lerp(1.0, 1.08, reveal(frame, 0, 140)),
          filter: "brightness(0.9) saturate(0.8)",
        }}
      />
      {/* 2. silhouette, barely lit */}
      <Img src={staticFile("media/rek-hero.webp")} style={{ ...heroStyle, opacity: silhouette, filter: "brightness(0.28) saturate(0.6)" }} />
      {/* 3. the light strip revealing the body */}
      <Img
        src={staticFile("media/rek-hero.webp")}
        style={{
          ...heroStyle,
          opacity: sweepOn,
          filter: "brightness(1.15) saturate(0.85) contrast(1.1)",
          WebkitMaskImage: band(sweepP),
          maskImage: band(sweepP),
        }}
      />
      {/* 4. settled, fully lit hero */}
      <Img src={staticFile("media/rek-hero.webp")} style={{ ...heroStyle, opacity: fullyLit, filter: "brightness(0.82) saturate(0.85) contrast(1.08)" }} />
      <AbsoluteFill style={{ backgroundColor: COLORS.navy, mixBlendMode: "soft-light", opacity: 0.5 }} />
      {/* the visible studio light strip */}
      <div
        style={{
          position: "absolute",
          top: vertical ? "30%" : "16%",
          left: `${sweepP - 14}%`,
          width: "28%",
          height: 3,
          opacity: sweepOn * 0.9,
          background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(235,245,255,0.95), rgba(255,255,255,0))",
          filter: "blur(1.2px)",
          boxShadow: "0 0 24px rgba(200,230,255,0.45)",
        }}
      />
      <AbsoluteFill
        style={{
          background: vertical
            ? "linear-gradient(0deg, rgba(5,11,18,0.9) 0%, rgba(5,11,18,0.2) 40%, rgba(5,11,18,0) 60%)"
            : "linear-gradient(270deg, rgba(5,11,18,0.7) 0%, rgba(5,11,18,0) 45%)",
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(120% 90% at 45% 50%, rgba(0,0,0,0) 50%, rgba(2,6,10,0.8) 100%)" }} />
      <ArabicTextBlock
        title={<>كل تفصيل يستحق الأفضل</>}
        lines={[]}
        startAt={titleAt}
        titleSize={vertical ? 66 : 72}
        style={vertical ? { top: 1300 } : { left: undefined, right: 150, width: 1100, top: 868 }}
      />
      <Narration timing={timing} />
      <Sfx src="audio/sweep.wav" at={108} volume={0.28} />
    </AbsoluteFill>
  );
};
