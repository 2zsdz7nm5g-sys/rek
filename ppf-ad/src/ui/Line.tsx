import { C } from "../lib/brand";

// "The line": the one recurring light element. Stone streak in Section 1,
// film edge in Section 2, scan light in Section 3, logo underline in Section 4.
export const LightLine: React.FC<{
  x: number;
  y: number;
  length: number;
  angle: number;
  thickness?: number;
  color?: string;
  opacity?: number;
}> = ({ x, y, length, angle, thickness = 6, color = C.accentLight, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: length,
      height: thickness,
      translate: "-100% -50%",
      transformOrigin: "100% 50%",
      rotate: `${angle}deg`,
      opacity,
      borderRadius: thickness,
      background: `linear-gradient(90deg, transparent, ${color}55 40%, ${color} 85%, #ffffff)`,
      boxShadow: `0 0 ${thickness * 3}px ${color}66`,
    }}
  />
);
