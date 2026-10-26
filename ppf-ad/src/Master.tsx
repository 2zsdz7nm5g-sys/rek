import { Audio } from "@remotion/media";
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { clamp } from "./lib/anim";
import { H, W } from "./lib/brand";
import { S1Chaos, S1Damage, S1Hook, S1Stakes } from "./scenes/S1";
import { S2Intro, S2Turn } from "./scenes/S2";
import { S3Apply, S3Heal, S3Impact, S3Layers, S3Ring } from "./scenes/S3";
import { S4BeforeAfter, S4End, S4Hero } from "./scenes/S4";
import { SCENES, starts, startOf, Trans, VO, VO_AVAILABLE } from "./timeline";
import { AUTHOR_FPS, useFrame } from "./lib/frame";

const COMPONENTS: Record<string, React.FC> = {
  S1Hook,
  S1Chaos,
  S1Damage,
  S1Stakes,
  S2Turn,
  S2Intro,
  S3Apply,
  S3Layers,
  S3Impact,
  S3Heal,
  S3Ring,
  S4BeforeAfter,
  S4Hero,
  S4End,
};

const ease = Easing.bezier(0.7, 0, 0.3, 1);

// Directional motion blur (reference A's whips, B's vertical slides).
const MotionBlur: React.FC<{ id: string; x: number; y: number }> = ({
  id,
  x,
  y,
}) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation={`${x.toFixed(1)} ${y.toFixed(1)}`} />
    </filter>
  </svg>
);

// Wraps a scene and applies its entry transition and the exit implied by
// the next scene's entry.
const Shell: React.FC<{ i: number; children: React.ReactNode }> = ({
  i,
  children,
}) => {
  const f = useFrame();
  const sc = SCENES[i];
  const next = SCENES[i + 1];
  const enter: Trans = sc.enter;
  const pIn =
    sc.overlap > 0
      ? interpolate(f, [0, sc.overlap], [0, 1], { ...clamp, easing: ease })
      : 1;
  const exitLen = next ? next.overlap : 0;
  const pOut =
    exitLen > 0
      ? interpolate(f, [sc.dur - exitLen, sc.dur], [0, 1], {
          ...clamp,
          easing: ease,
        })
      : 0;
  const exitType: Trans = next ? next.enter : "cut";

  let tx = 0,
    ty = 0,
    scale = 1,
    opacity = 1,
    bx = 0,
    by = 0,
    blur = 0,
    z = 1;
  if (pIn < 1) {
    const k = Math.sin(pIn * Math.PI);
    if (enter === "whip") {
      tx = -W * (1 - pIn);
      bx = 70 * k;
    }
    if (enter === "slideUp") {
      ty = H * (1 - pIn);
      by = 70 * k;
    }
    if (enter === "zoom") {
      scale = 0.82 + 0.18 * pIn;
      opacity = pIn;
      blur = 14 * (1 - pIn);
    }
    if (enter === "fade") {
      opacity = pIn;
    }
  }
  if (pOut > 0) {
    const k = Math.sin(pOut * Math.PI);
    if (exitType === "whip") {
      tx = W * pOut;
      bx = 70 * k;
    }
    if (exitType === "slideUp") {
      ty = -H * pOut;
      by = 70 * k;
    }
    if (exitType === "zoom") {
      scale = 1 + 1.8 * pOut;
      opacity = 1 - pOut;
      blur = 22 * pOut;
      z = 2;
    }
    if (exitType === "fade") {
      opacity = 1;
    }
  }
  const id = `mb-${i}`;
  const filters = [
    bx + by > 0.5 ? `url(#${id})` : "",
    blur > 0.3 ? `blur(${blur}px)` : "",
  ]
    .join(" ")
    .trim();
  return (
    <AbsoluteFill
      style={{
        zIndex: z,
        opacity,
        translate: `${tx}px ${ty}px`,
        scale,
        filter: filters || undefined,
        overflow: "hidden",
      }}
    >
      {bx + by > 0.5 && <MotionBlur id={id} x={bx} y={by} />}
      {children}
    </AbsoluteFill>
  );
};

export const Master: React.FC = () => {
  const { fps } = useVideoConfig();
  const k = fps / AUTHOR_FPS; // timeline is authored in 60fps frames
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {SCENES.map((sc, i) => {
        const C = COMPONENTS[sc.id];
        return (
          <Sequence
            key={sc.id}
            from={Math.round(starts[i] * k)}
            durationInFrames={Math.round(sc.dur * k)}
            name={sc.id}
          >
            <Shell i={i}>
              <C />
            </Shell>
          </Sequence>
        );
      })}
      <Audio src={staticFile("audio/score.wav")} />
      {VO.filter((v) => VO_AVAILABLE.includes(v.line)).map((v) => (
        <Sequence
          key={v.line}
          from={Math.round((startOf(v.scene) + v.at) * k)}
          layout="none"
          name={`VO ${v.line}`}
        >
          <Audio
            src={staticFile(`vo/${String(v.line).padStart(2, "0")}.wav`)}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
