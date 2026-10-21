import React from "react";
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";
import type { SceneTiming } from "../data/timeline";

/** Plays a scene's narration at its cue. Renders nothing while the segment is missing. */
export const Narration: React.FC<{ timing: SceneTiming }> = ({ timing }) =>
  timing.vo ? <Audio src={staticFile(timing.vo)} from={timing.voFrom} volume={1} /> : null;

export const Sfx: React.FC<{ src: string; at: number; volume: number }> = ({ src, at, volume }) => (
  <Audio src={staticFile(src)} from={at} volume={volume} />
);
