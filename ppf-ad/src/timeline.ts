// Single source of truth for the edit (frames at 60fps). The data lives in
// timeline.json so scripts/score.py and scripts/review.sh read the same cuts.
import data from "./timeline.json";

export type Trans = "cut" | "whip" | "slideUp" | "zoom" | "fade";
export type Scene = {
  id: string;
  dur: number;
  enter: Trans;
  overlap: number;
  placeholderCar?: boolean;
};

export const SCENES = data.scenes as Scene[];
// Voice-over line slots; a line plays only once its file is listed in
// voAvailable (public/vo/NN.wav).
export const VO = data.vo;
export const VO_AVAILABLE = data.voAvailable as number[];

export const starts = (() => {
  const out: number[] = [];
  let t = 0;
  SCENES.forEach((s, i) => {
    if (i > 0) t -= s.overlap;
    out.push(t);
    t += s.dur;
  });
  return out;
})();

export const TOTAL = starts[starts.length - 1] + SCENES[SCENES.length - 1].dur;
export const startOf = (id: string) =>
  starts[SCENES.findIndex((s) => s.id === id)];
