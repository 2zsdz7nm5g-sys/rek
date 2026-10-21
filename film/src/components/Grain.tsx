import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";

/**
 * Fine, deterministic film grain: a 2560px noise plate shifted every frame.
 * The plate is larger than either orientation plus the maximum shift, so edges never show.
 */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.045 }) => {
  const frame = useCurrentFrame();
  const x = (frame * 197) % 480;
  const y = (frame * 331) % 480;
  return (
    <AbsoluteFill style={{ overflow: "hidden", mixBlendMode: "overlay", opacity, pointerEvents: "none" }}>
      <Img
        src={staticFile("media/grain.jpg")}
        style={{ position: "absolute", left: -x, top: -y, width: 2560, height: 2560, maxWidth: "none" }}
      />
    </AbsoluteFill>
  );
};
