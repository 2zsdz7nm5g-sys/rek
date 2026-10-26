import { useMemo } from "react";
import * as THREE from "three";
import { rand } from "../lib/anim";
import { makePaint } from "./paint";

// Shared close-up camera: paint fills the lower frame, reflections sit
// mid-frame and the headline area above stays dark.
export const MACRO_CAM: [number, number, number] = [0, 1.5, 3.6];
export const MACRO_LOOK: [number, number, number] = [0, 0.1, 0.2];

// A gently domed body panel (think: a bonnet) lying in the XZ plane.
export const CURVE_X = 0.05;
export const CURVE_Z = 0.025;
export const surfY = (x: number, z: number) =>
  -CURVE_X * x * x - CURVE_Z * z * z;

const panelGeo = (w: number, d: number) => {
  const g = new THREE.PlaneGeometry(w, d, 160, 160);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, surfY(p.getX(i), p.getZ(i)));
  g.computeVertexNormals();
  return g;
};

export const PaintPanel: React.FC<{
  w?: number;
  d?: number;
  color?: string;
  dull?: number;
}> = ({ w = 8, d = 12, color, dull = 0 }) => {
  const geo = useMemo(() => panelGeo(w, d), [w, d]);
  const mat = useMemo(
    () => makePaint({ color, dull, repeat: 60 }),
    [color, dull],
  );
  return <mesh geometry={geo} material={mat} />;
};

// --- Damage -----------------------------------------------------------------

const jagged = (seed: number, r: number, spikes = 22) => {
  const s = new THREE.Shape();
  for (let i = 0; i <= spikes; i++) {
    const a = (i / spikes) * Math.PI * 2;
    const rr = r * (0.55 + rand(seed + i * 3.1) * 0.6);
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  const g = new THREE.ShapeGeometry(s);
  g.rotateX(-Math.PI / 2);
  return g;
};

// A stone chip: bright fractured clear-coat rim, grey primer crater, a speck
// of bare metal, and a few micro-chips around it.
export const Chip: React.FC<{
  x: number;
  z: number;
  r: number;
  seed: number;
  opacity?: number;
}> = ({ x, z, r, seed, opacity = 1 }) => {
  const rim = useMemo(() => jagged(seed, r, 26), [seed, r]);
  const crater = useMemo(() => jagged(seed + 50, r * 0.78, 20), [seed, r]);
  const core = useMemo(() => jagged(seed + 90, r * 0.28, 10), [seed, r]);
  const specks = useMemo(
    () =>
      new Array(7).fill(0).map((_, i) => {
        const a = rand(seed + i * 4.1) * Math.PI * 2;
        const d = r * (1.4 + rand(seed + i * 2.7) * 1.2);
        return {
          g: jagged(seed + 200 + i, r * (0.08 + rand(seed + i) * 0.1), 7),
          x: Math.cos(a) * d,
          z: Math.sin(a) * d,
        };
      }),
    [seed, r],
  );
  const y = surfY(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh geometry={rim} position={[0, 0.0012, 0]}>
        <meshStandardMaterial
          color="#e4e6ea"
          emissive="#ffffff"
          emissiveIntensity={0.08}
          roughness={0.35}
          transparent
          opacity={opacity}
        />
      </mesh>
      <mesh geometry={crater} position={[0, 0.0016, 0]}>
        <meshStandardMaterial
          color="#5f6368"
          roughness={0.95}
          transparent
          opacity={opacity}
        />
      </mesh>
      <mesh geometry={core} position={[0, 0.002, 0]}>
        <meshStandardMaterial
          color="#2a2d31"
          roughness={0.3}
          metalness={0.9}
          transparent
          opacity={opacity}
        />
      </mesh>
      {specks.map((sp, i) => (
        <mesh key={i} geometry={sp.g} position={[sp.x, 0.0012, sp.z]}>
          <meshStandardMaterial
            color="#d4d7db"
            roughness={0.4}
            transparent
            opacity={opacity * 0.85}
          />
        </mesh>
      ))}
    </group>
  );
};

// A hairline scratch: a thin ribbon that follows the surface and catches light.
export const Scratch: React.FC<{
  x: number;
  z: number;
  len: number;
  angle: number;
  bend?: number;
  width?: number;
  opacity?: number;
  color?: string;
}> = ({
  x,
  z,
  len,
  angle,
  bend = 0.08,
  width = 0.006,
  opacity = 1,
  color = "#d9dde2",
}) => {
  const geo = useMemo(() => {
    const n = 48;
    const pos: number[] = [];
    const idx: number[] = [];
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    for (let i = 0; i <= n; i++) {
      const t = i / n - 0.5;
      const lx = t * len;
      const lz = bend * (t * t * 4 - 1) * len * 0.25;
      const taper = Math.sin((i / n) * Math.PI) ** 0.6;
      for (const side of [-1, 1]) {
        const ox = lx;
        const oz = lz + side * width * 0.5 * taper;
        const wx = x + ox * ca - oz * sa;
        const wz = z + ox * sa + oz * ca;
        pos.push(wx, surfY(wx, wz) + 0.0015, wz);
      }
      if (i < n) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, [x, z, len, angle, bend, width]);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.45}
        roughness={0.45}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// Swirl marks: concentric arcs, as left by careless washing.
export const Swirls: React.FC<{
  x: number;
  z: number;
  r: number;
  seed: number;
  opacity?: number;
}> = ({ x, z, r, seed, opacity = 1 }) => (
  <group>
    {new Array(14).fill(0).map((_, i) => {
      const rr = r * (0.3 + rand(seed + i) * 0.7);
      const a0 = rand(seed + i * 2.3) * Math.PI * 2;
      return (
        <Scratch
          key={i}
          x={x + Math.cos(a0) * rr * 0.4}
          z={z + Math.sin(a0) * rr * 0.4}
          len={rr * 0.9}
          angle={a0 + Math.PI / 2}
          bend={0.35}
          width={0.0025}
          opacity={opacity * (0.35 + rand(seed + i * 5) * 0.45)}
        />
      );
    })}
  </group>
);
