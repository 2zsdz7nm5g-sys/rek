import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";
import { conceal, drift, lerp, reveal } from "./anim";

type Props = {
  /** photo in public/, or omit and pass children (e.g. an illustration) */
  src?: string;
  focus?: string;
  /** small Latin technical label shown above the frame */
  label: string;
  /** frame the thumbnail starts entering */
  enterAt?: number;
  children?: React.ReactNode;
};

export const THUMB = {
  landscape: { width: 540, height: 352, right: 150, top: 372 },
  vertical: { width: 640, height: 418, top: 440 },
};

export const ServiceThumbnail: React.FC<Props> = ({ src, focus = "50% 50%", label, enterAt = 14, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const vertical = height > width;
  const box = vertical ? THUMB.vertical : THUMB.landscape;

  const inP = reveal(frame, enterAt, 34);
  const outP = conceal(frame, durationInFrames - 4, 22);
  const float = Math.sin(frame / 48) * 5;
  const t = drift(frame, durationInFrames);
  const sheen = interpolate(frame, [enterAt + 10, enterAt + 52], [-60, 160], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const position: React.CSSProperties = vertical
    ? { left: (width - box.width) / 2, top: box.top }
    : { right: (THUMB.landscape as { right: number }).right, top: box.top };

  return (
    <div
      style={{
        position: "absolute",
        ...position,
        width: box.width,
        opacity: inP * outP,
        translate: `${lerp(vertical ? 0 : 90, 0, inP) + (1 - outP) * (vertical ? 0 : -40)}px ${float + (vertical ? lerp(40, 0, inP) : 0)}px`,
        scale: lerp(0.94, 1, inP),
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          fontFamily: FONTS.mono,
          fontWeight: 500,
          fontSize: vertical ? 24 : 21,
          letterSpacing: "0.2em",
          color: COLORS.accentLight,
          direction: "ltr",
        }}
      >
        <span>{label}</span>
        <span style={{ width: 64, height: 1, background: COLORS.premium }} />
      </div>
      <div
        style={{
          position: "relative",
          width: box.width,
          height: box.height,
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid rgba(91,184,242,0.42)",
          boxShadow: "0 38px 90px rgba(0,0,0,0.62), 0 0 0 1px rgba(5,11,18,0.6)",
          backgroundColor: COLORS.surface,
        }}
      >
        {src ? (
          <Img
            src={staticFile(src)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: focus,
              scale: lerp(1.04, 1.14, t),
              filter: "brightness(0.92) saturate(0.9) contrast(1.05)",
            }}
          />
        ) : (
          children
        )}
        {/* soft entrance sheen */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(110deg, rgba(255,255,255,0) ${sheen - 20}%, rgba(220,240,255,0.22) ${sheen}%, rgba(255,255,255,0) ${sheen + 20}%)`,
            mixBlendMode: "screen",
          }}
        />
        {/* accent edge */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 3, height: "38%", background: COLORS.accent }} />
      </div>
    </div>
  );
};
