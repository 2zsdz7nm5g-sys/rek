import { Easing, interpolate } from "remotion";
import { EASE_OUT } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 over [start, start+dur] with a soft cinematic ease-out. */
export const reveal = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: Easing.bezier(...EASE_OUT) });

/** 1→0 over the last `dur` frames before `end`. */
export const conceal = (frame: number, end: number, dur: number) =>
  interpolate(frame, [end - dur, end], [1, 0], { ...clamp, easing: Easing.bezier(0.4, 0, 0.6, 1) });

/** Linear progress through a scene, eased in and out (for camera moves). */
export const drift = (frame: number, duration: number) =>
  interpolate(frame, [0, duration], [0, 1], { ...clamp, easing: Easing.bezier(0.37, 0, 0.63, 1) });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
