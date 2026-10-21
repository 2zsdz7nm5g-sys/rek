import React from "react";
import { AbsoluteFill } from "remotion";
import { CinematicBackground } from "../components/CinematicBackground";
import { LogoReveal } from "../components/LogoReveal";
import { Narration, Sfx } from "../components/Narration";
import type { SceneTiming } from "../data/timeline";

/** Brand introduction: care detail in the studio, genuine logo, wordmark and Arabic line. */
export const BrandScene: React.FC<{ timing: SceneTiming }> = ({ timing }) => (
  <AbsoluteFill>
    <CinematicBackground
      src="media/rek-quality.webp"
      move={{ scale: [1.1, 1.18], x: [1.5, -2], y: [0, -1], focus: "50% 45%" }}
      exposure={0.5}
      textSide="none"
      sweep={[0.05, 0.6]}
    >
      <AbsoluteFill style={{ background: "radial-gradient(60% 60% at 50% 50%, rgba(5,11,18,0.72) 0%, rgba(5,11,18,0.35) 70%, rgba(5,11,18,0.1) 100%)" }} />
    </CinematicBackground>
    <LogoReveal at={26} tagline="العناية بالسيارات" />
    <Narration timing={timing} />
    <Sfx src="audio/sweep.wav" at={30} volume={0.18} />
  </AbsoluteFill>
);
