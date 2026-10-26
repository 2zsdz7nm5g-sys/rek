import { useCurrentFrame, useVideoConfig } from "remotion";

// All animation is authored in 60fps frames. This returns the current time in
// those units whatever the composition's fps, so the 30fps master plays
// exactly like the 60fps one.
export const AUTHOR_FPS = 60;
export const useFrame = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (f * AUTHOR_FPS) / fps;
};
