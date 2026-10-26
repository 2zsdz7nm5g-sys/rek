import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import * as THREE from "three";
import { useVideoConfig } from "remotion";
import { CameraRig } from "./CameraRig";
import { StudioEnv } from "./StudioEnv";

export const Stage: React.FC<{
  mood?: "danger" | "cool";
  cam: [number, number, number];
  look: [number, number, number];
  fov?: number;
  roll?: number;
  envStrength?: number;
  dpr?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({
  mood = "cool",
  cam,
  look,
  fov = 30,
  roll = 0,
  envStrength = 1,
  dpr = 0.75,
  style,
  children,
}) => {
  const { width, height } = useVideoConfig();
  return (
    // Rendered below full resolution (dpr) and scaled up: software WebGL is
    // fill-rate bound, and the 3D layers are soft and dark enough to hide it.
    <ThreeCanvas
      width={width}
      height={height}
      dpr={dpr}
      style={{ position: "absolute", inset: 0, ...style }}
    >
      <StudioEnv mood={mood} strength={envStrength} />
      <CameraRig position={cam} lookAt={look} fov={fov} roll={roll} />
      <directionalLight
        position={[2, 6, 4]}
        intensity={mood === "danger" ? 0.45 : 0.7}
        color="#ffffff"
      />
      <ambientLight intensity={0.08} />
      {children}
    </ThreeCanvas>
  );
};

// Studio "cyc" floor: no hard horizon, just a soft contact shadow and a faint
// pool of light under the car, so the backdrop shows through around it.
const radial = (stops: [number, string][]) => {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  stops.forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
};

export const Floor: React.FC<{ danger?: boolean }> = ({ danger = false }) => {
  const pool = useMemo(
    () =>
      danger
        ? radial([
            [0, "rgba(200,40,50,0.10)"],
            [0.5, "rgba(90,10,16,0.05)"],
            [1, "rgba(0,0,0,0)"],
          ])
        : radial([
            [0, "rgba(120,170,220,0.22)"],
            [0.5, "rgba(40,90,150,0.10)"],
            [1, "rgba(0,0,0,0)"],
          ]),
    [danger],
  );
  const shadow = useMemo(
    () =>
      radial([
        [0, "rgba(0,0,0,0.95)"],
        [0.55, "rgba(0,0,0,0.75)"],
        [1, "rgba(0,0,0,0)"],
      ]),
    [],
  );
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[16, 16]} />
        <meshBasicMaterial map={pool} transparent depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[3.4, 6.2]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} />
      </mesh>
    </>
  );
};
