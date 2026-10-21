import React from "react";
import { Composition } from "remotion";
import { BrandFilm, type BrandFilmProps } from "./BrandFilm";
import { TIMELINE } from "./data/timeline";

const defaults: BrandFilmProps = { contact: [] };

export const RemotionRoot: React.FC = () => (
  <>
    {/* Landscape master */}
    <Composition
      id="BrandFilm"
      component={BrandFilm}
      width={1920}
      height={1080}
      fps={TIMELINE.fps}
      durationInFrames={TIMELINE.durationInFrames}
      defaultProps={defaults}
    />
    {/* Vertical edit for Reels/TikTok: same scenes, recomposed layouts */}
    <Composition
      id="BrandFilmVertical"
      component={BrandFilm}
      width={1080}
      height={1920}
      fps={TIMELINE.fps}
      durationInFrames={TIMELINE.durationInFrames}
      defaultProps={defaults}
    />
  </>
);
