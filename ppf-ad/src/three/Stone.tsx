import { useMemo } from "react";
import * as THREE from "three";
import { rand } from "../lib/anim";

const stoneGeo = (seed: number) => {
  const g = new THREE.IcosahedronGeometry(1, 3);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n =
      0.75 +
      0.18 * Math.sin(v.x * 3.1 + seed) * Math.cos(v.y * 2.3 + seed * 0.7) +
      0.1 * Math.sin(v.z * 7.7 + seed * 1.9) +
      0.06 * rand(seed + i);
    v.multiplyScalar(n);
    v.y *= 0.72;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
};

export const Stone: React.FC<{
  seed: number;
  position: [number, number, number];
  scale: number;
  rotation?: [number, number, number];
  tint?: string;
}> = ({ seed, position, scale, rotation = [0, 0, 0], tint }) => {
  const geo = useMemo(() => stoneGeo(seed), [seed]);
  const color = tint ?? ["#8a8178", "#6f6a64", "#9b9184", "#5d5853"][Math.floor(rand(seed) * 4)];
  return (
    <mesh geometry={geo} position={position} scale={scale} rotation={rotation}>
      <meshStandardMaterial color={color} roughness={0.92} metalness={0.02} />
    </mesh>
  );
};
