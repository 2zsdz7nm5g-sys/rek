import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";
import { conceal, lerp, reveal } from "./anim";

type Props = {
  /** frame the logo starts appearing */
  at: number;
  /** Arabic line under the wordmark */
  tagline: string;
  /** optional contact lines, shown only when supplied (never invented) */
  contact?: string[];
  fadeOut?: boolean;
};

/** Genuine REK PROFFSET logo (from the company's media library) plus wordmark and tagline. */
export const LogoReveal: React.FC<Props> = ({ at, tagline, contact, fadeOut = true }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const vertical = height > width;
  const logoIn = reveal(frame, at, 40);
  const markIn = reveal(frame, at + 22, 36);
  const tagIn = reveal(frame, at + 40, 36);
  const out = fadeOut ? conceal(frame, durationInFrames - 4, 22) : 1;
  const sheen = interpolate(frame, [at + 8, at + 56], [-40, 150], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const size = vertical ? 260 : 210;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: out,
      }}
    >
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          borderRadius: 2,
          overflow: "hidden",
          opacity: logoIn,
          scale: lerp(0.96, 1, logoIn),
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          border: "1px solid rgba(91,184,242,0.35)",
        }}
      >
        <Img src={staticFile("media/rek-proffset-logo.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(115deg, rgba(255,255,255,0) ${sheen - 18}%, rgba(255,255,255,0.28) ${sheen}%, rgba(255,255,255,0) ${sheen + 18}%)`,
            mixBlendMode: "screen",
          }}
        />
      </div>
      <div
        style={{
          marginTop: 46,
          fontFamily: FONTS.display,
          fontWeight: 700,
          fontSize: vertical ? 78 : 70,
          letterSpacing: "0.16em",
          color: COLORS.ink,
          direction: "ltr",
          opacity: markIn,
          translate: `0px ${lerp(16, 0, markIn)}px`,
        }}
      >
        REK <span style={{ color: COLORS.accentLight, fontWeight: 500 }}>PROFFSET</span>
      </div>
      <div
        style={{
          width: lerp(0, vertical ? 360 : 300, markIn),
          height: 1,
          margin: "26px 0 24px",
          background: `linear-gradient(90deg, rgba(22,137,216,0), ${COLORS.accent}, rgba(22,137,216,0))`,
        }}
      />
      <div
        style={{
          fontFamily: FONTS.body,
          fontWeight: 400,
          fontSize: vertical ? 54 : 48,
          color: COLORS.ink,
          direction: "rtl",
          opacity: tagIn,
          translate: `0px ${lerp(14, 0, tagIn)}px`,
        }}
      >
        {tagline}
      </div>
      {contact && contact.length > 0 ? (
        <div
          style={{
            marginTop: 40,
            fontFamily: FONTS.body,
            fontSize: vertical ? 34 : 30,
            color: COLORS.muted,
            direction: "rtl",
            opacity: tagIn,
            textAlign: "center",
          }}
        >
          {contact.map((c) => (
            <div key={c}>{c}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
