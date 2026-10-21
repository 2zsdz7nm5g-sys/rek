import React from "react";
import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill, interpolate, staticFile } from "remotion";
import { Grain } from "./components/Grain";
import { SERVICES } from "./data/services";
import { sceneById, TIMELINE } from "./data/timeline";
import { BrandScene } from "./scenes/BrandScene";
import { FinaleScene } from "./scenes/FinaleScene";
import { OpeningScene } from "./scenes/OpeningScene";
import { ServiceScene } from "./scenes/ServiceScene";
import "./fonts";

export type BrandFilmProps = { contact?: string[] };

const MUSIC_BED = 0.4; // ≈ -24 LUFS between lines
const MUSIC_UNDER_VO = 0.17; // ≈ -31 LUFS under narration
const DUCK_RAMP = 12;

/** Music volume for an absolute film frame: ducked under every narration line that exists. */
const musicVolume = (f: number) => {
  let v = MUSIC_BED;
  for (const s of TIMELINE.scenes) {
    if (!s.vo) continue;
    const a = s.start + s.voFrom;
    const b = a + s.voFrames;
    const inside = interpolate(f, [a - DUCK_RAMP, a, b, b + DUCK_RAMP * 2], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    v = Math.min(v, MUSIC_BED - (MUSIC_BED - MUSIC_UNDER_VO) * inside);
  }
  return v;
};

export const BrandFilm: React.FC<BrandFilmProps> = ({ contact }) => {
  const t = TIMELINE.transitionFrames;
  const scenes: Array<{ id: string; node: React.ReactNode }> = [
    { id: "opening", node: <OpeningScene timing={sceneById("opening")} /> },
    { id: "brand", node: <BrandScene timing={sceneById("brand")} /> },
    ...SERVICES.map((s) => ({ id: s.id, node: <ServiceScene service={s} timing={sceneById(s.id)} /> })),
    { id: "finale", node: <FinaleScene timing={sceneById("finale")} contact={contact} /> },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#020407" }}>
      <TransitionSeries>
        {scenes.flatMap(({ id, node }, i) => {
          const seq = (
            <TransitionSeries.Sequence key={id} name={id} durationInFrames={sceneById(id).durationInFrames}>
              {node}
            </TransitionSeries.Sequence>
          );
          return i === 0
            ? [seq]
            : [<TransitionSeries.Transition key={`${id}-in`} presentation={fade()} timing={linearTiming({ durationInFrames: t })} />, seq];
        })}
      </TransitionSeries>
      <Grain />
      <Audio src={staticFile("audio/score.wav")} volume={(f) => musicVolume(f)} />
    </AbsoluteFill>
  );
};
