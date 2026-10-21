import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CinematicBackground } from "../components/CinematicBackground";
import { conceal, lerp, reveal } from "../components/anim";
import { LogoReveal } from "../components/LogoReveal";
import { Narration, Sfx } from "../components/Narration";
import type { SceneTiming } from "../data/timeline";
import { COLORS, FONTS } from "../theme";

const RECAP = ["PPF", "NANO CERAMIC", "POLISHING", "INTERIOR", "PDR", "WINDSHIELD"];

/** Return to the hero car in the same studio, recap, then the genuine logo and closing line. */
export const FinaleScene: React.FC<{ timing: SceneTiming; contact?: string[] }> = ({ timing, contact }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const vertical = height > width;
  // the brand name falls near the last third of the closing line
  const logoAt = timing.voFrom + Math.round(timing.voFrames * 0.62);
  const dim = reveal(frame, logoAt - 24, 40);
  const recapOut = conceal(frame, logoAt - 6, 24);
  const endFade = interpolate(frame, [durationInFrames - 14, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <CinematicBackground
        src="media/rek-hero.webp"
        move={{ scale: [1.12, 1.2], x: [-1, 1.5], y: [0, -0.5], focus: vertical ? "32% 50%" : "50% 50%" }}
        exposure={0.82}
        textSide="none"
        sweep={[0.08, 0.5]}
      >
        <AbsoluteFill style={{ backgroundColor: "rgba(5,11,18,0.78)", opacity: dim }} />
      </CinematicBackground>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: vertical ? 300 : 120,
          display: vertical ? "grid" : "flex",
          gridTemplateColumns: "repeat(2, auto)",
          justifyContent: "center",
          justifyItems: "center",
          gap: vertical ? "22px 64px" : 34,
          direction: "ltr",
          opacity: recapOut,
        }}
      >
        {RECAP.map((r, i) => {
          const p = reveal(frame, timing.voFrom + 8 + i * 9, 26);
          return (
            <span
              key={r}
              style={{
                fontFamily: FONTS.mono,
                fontWeight: 500,
                fontSize: vertical ? 26 : 20,
                letterSpacing: "0.22em",
                color: i % 2 ? COLORS.ink : COLORS.accentLight,
                opacity: p * 0.9,
                translate: `0px ${lerp(10, 0, p)}px`,
              }}
            >
              {r}
            </span>
          );
        })}
      </div>
      <LogoReveal at={logoAt} tagline="اختار الأفضل لسيارتك" contact={contact} fadeOut={false} />
      <AbsoluteFill style={{ backgroundColor: COLORS.bg, opacity: endFade }} />
      <Narration timing={timing} />
      <Sfx src="audio/sweep.wav" at={logoAt + 4} volume={0.16} />
    </AbsoluteFill>
  );
};
