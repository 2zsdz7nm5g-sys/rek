import timeline from "./timeline.json";

export type SceneTiming = {
  id: string;
  /** narration file in public/, or null while the segment has not been generated */
  vo: string | null;
  voSeconds: number;
  voEstimated: boolean;
  /** narration start, in frames from the scene start */
  voFrom: number;
  voFrames: number;
  durationInFrames: number;
  /** absolute start frame on the film timeline */
  start: number;
};

export const TIMELINE = timeline as {
  fps: number;
  transitionFrames: number;
  durationInFrames: number;
  scenes: SceneTiming[];
};

export const sceneById = (id: string) => {
  const s = TIMELINE.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`No timing for scene ${id}`);
  return s;
};
