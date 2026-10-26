import * as THREE from "three";
import { rand } from "../lib/anim";

// Tiny random normal map = metallic flake under a mirror-smooth clear coat.
let flakeTex: THREE.DataTexture | null = null;
export const flakeNormal = () => {
  if (flakeTex) return flakeTex;
  const n = 256;
  const data = new Uint8Array(n * n * 4);
  for (let i = 0; i < n * n; i++) {
    data[i * 4] = 128 + (rand(i * 1.3) - 0.5) * 150;
    data[i * 4 + 1] = 128 + (rand(i * 7.7 + 3) - 0.5) * 150;
    data[i * 4 + 2] = 255;
    data[i * 4 + 3] = 255;
  }
  flakeTex = new THREE.DataTexture(data, n, n);
  flakeTex.wrapS = flakeTex.wrapT = THREE.RepeatWrapping;
  flakeTex.needsUpdate = true;
  return flakeTex;
};

export const makePaint = ({
  color = "#07090c",
  repeat = 40,
  dull = 0,
}: { color?: string; repeat?: number; dull?: number } = {}) => {
  const nm = flakeNormal().clone();
  nm.repeat.set(repeat, repeat);
  nm.needsUpdate = true;
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.55,
    roughness: 0.32,
    normalMap: nm,
    normalScale: new THREE.Vector2(0.14, 0.14),
    clearcoat: 1,
    clearcoatRoughness: 0.02 + dull * 0.35,
    envMapIntensity: 1.25 - dull * 0.4,
  });
};
