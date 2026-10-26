import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { prog } from "../lib/anim";
import { C } from "../lib/brand";
import { body, display, mono, serif } from "../lib/fonts";

// Reference B: a word that starts soft, offset and blurred, then snaps sharp.
export const FocusIn: React.FC<{
  at: number;
  dur?: number;
  dy?: number;
  dx?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ at, dur = 18, dy = 26, dx = 0, children, style }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, at + dur);
  return (
    <span
      style={{
        display: "inline-block",
        opacity: p,
        filter: `blur(${(1 - p) * 18}px)`,
        translate: `${(1 - p) * dx}px ${(1 - p) * dy}px`,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export const H1: React.FC<{ children: React.ReactNode; size?: number; color?: string; weight?: number; style?: React.CSSProperties }> = ({
  children,
  size = 120,
  color = C.ink,
  weight = 800,
  style,
}) => (
  <div dir="rtl" style={{ fontFamily: display, fontWeight: weight, fontSize: size, lineHeight: 1.12, color, ...style }}>
    {children}
  </div>
);

// The contrasting voice (reference B's italic serif), here Amiri naskh.
export const Voice: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({
  children,
  size = 84,
  color = C.ink,
  style,
}) => (
  <div dir="rtl" style={{ fontFamily: serif, fontWeight: 400, fontSize: size, lineHeight: 1.25, color, ...style }}>
    {children}
  </div>
);

export const Body: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({
  children,
  size = 40,
  color = C.muted,
  style,
}) => (
  <div dir="rtl" style={{ fontFamily: body, fontWeight: 400, fontSize: size, lineHeight: 1.6, color, ...style }}>
    {children}
  </div>
);

export const Label: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({
  children,
  size = 26,
  color = C.accentLight,
  style,
}) => (
  <span
    dir="ltr"
    style={{
      fontFamily: mono,
      fontWeight: 500,
      fontSize: size,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color,
      ...style,
    }}
  >
    {children}
  </span>
);

// Reference B: dashed "selection box" with corner handles around a label.
export const DashedTag: React.FC<{
  at: number;
  color?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ at, color = C.accentLight, children, style }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, at + 16);
  const handle = (pos: React.CSSProperties) => (
    <span style={{ position: "absolute", width: 9, height: 9, background: color, ...pos }} />
  );
  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        padding: "14px 26px",
        border: `2px dashed ${color}`,
        background: "rgba(4,6,9,0.55)",
        opacity: p,
        scale: interpolate(p, [0, 1], [0.86, 1]),
        filter: `blur(${(1 - p) * 8}px)`,
        ...style,
      }}
    >
      {handle({ left: -6, top: -6 })}
      {handle({ right: -6, top: -6 })}
      {handle({ left: -6, bottom: -6 })}
      {handle({ right: -6, bottom: -6 })}
      {children}
    </div>
  );
};

// Reference A: the word-swap highlight box with end bars.
export const SwapBox: React.FC<{
  words: string[];
  at: number;
  every: number;
  color?: string;
  size?: number;
  textColor?: string;
}> = ({ words, at, every, color = C.danger, textColor = C.ink, size = 104 }) => {
  const f = useCurrentFrame();
  const i = Math.max(0, Math.min(words.length - 1, Math.floor((f - at) / every)));
  const local = f - at - i * every;
  const p = prog(local, 0, 14);
  return (
    <div
      dir="rtl"
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 40px 18px",
        background: `${color}22`,
        borderLeft: `6px solid ${color}`,
        borderRight: `6px solid ${color}`,
      }}
    >
      <span
        style={{
          fontFamily: display,
          fontWeight: 800,
          fontSize: size,
          color: textColor,
          lineHeight: 1.15,
          opacity: p,
          filter: `blur(${(1 - p) * 14}px)`,
          translate: `0 ${(1 - p) * 30}px`,
        }}
      >
        {words[i]}
      </span>
    </div>
  );
};
