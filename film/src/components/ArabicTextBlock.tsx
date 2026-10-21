import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";
import { conceal, lerp, reveal } from "./anim";

/** Light-blue emphasis for one key word or term. Use sparingly. */
export const Hl: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: COLORS.accentLight }}>{children}</span>
);

type Props = {
  title: React.ReactNode;
  lines: React.ReactNode[];
  /** frame the title starts revealing; lines follow with a short delay */
  startAt?: number;
  /** extra frames between the title and the first line */
  lineDelay?: number;
  /** override placement for non-service scenes */
  style?: React.CSSProperties;
  align?: "right" | "center";
  titleSize?: number;
};

export const TEXT_BOX = {
  landscape: { left: 130, width: 860, top: 352 },
  vertical: { left: 90, right: 90, top: 980 },
};

export const ArabicTextBlock: React.FC<Props> = ({
  title,
  lines,
  startAt = 16,
  lineDelay = 18,
  style,
  align = "right",
  titleSize,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const vertical = height > width;
  const out = conceal(frame, durationInFrames - 6, 20);

  const box: React.CSSProperties = vertical
    ? { left: TEXT_BOX.vertical.left, right: TEXT_BOX.vertical.right, top: TEXT_BOX.vertical.top }
    : { left: TEXT_BOX.landscape.left, width: TEXT_BOX.landscape.width, top: TEXT_BOX.landscape.top };

  const tIn = reveal(frame, startAt, 30);
  const rule = reveal(frame, startAt + 12, 34);

  return (
    <div
      style={{
        position: "absolute",
        ...box,
        ...style,
        direction: "rtl",
        textAlign: align,
        opacity: out,
        translate: `0px ${lerp(0, -14, 1 - out)}px`,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.display,
          fontWeight: 600,
          fontSize: titleSize ?? (vertical ? 80 : 84),
          lineHeight: 1.15,
          color: COLORS.ink,
          opacity: tIn,
          translate: `0px ${lerp(26, 0, tIn)}px`,
          textShadow: "0 6px 36px rgba(0,0,0,0.5)",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </div>
      <div
        style={{
          height: 2,
          width: vertical ? 180 : 160,
          margin: align === "center" ? "30px auto 26px" : "30px 0 26px auto",
          background: `linear-gradient(270deg, ${COLORS.accent}, rgba(22,137,216,0))`,
          transformOrigin: align === "center" ? "50% 50%" : "100% 50%",
          scale: `${rule} 1`,
        }}
      />
      {lines.map((line, i) => {
        const p = reveal(frame, startAt + lineDelay + 10 + i * 14, 30);
        return (
          <div
            key={i}
            style={{
              fontFamily: FONTS.body,
              fontWeight: 400,
              fontSize: vertical ? 46 : 46,
              lineHeight: 1.6,
              color: i === 0 ? COLORS.ink : "#C9D3DE",
              opacity: p,
              translate: `0px ${lerp(18, 0, p)}px`,
            }}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
};
