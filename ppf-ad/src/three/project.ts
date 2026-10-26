import * as THREE from "three";
import { H, W } from "../lib/brand";

// Screen position (px) of a 3D point for a CameraRig-style camera, so 2D
// callouts can be pinned to things in the 3D scene.
export const project = (
  cam: [number, number, number],
  look: [number, number, number],
  fov: number,
  p: [number, number, number],
  roll = 0,
) => {
  const c = new THREE.PerspectiveCamera(fov, W / H, 0.01, 200);
  c.position.set(...cam);
  c.up.set(Math.sin(roll), Math.cos(roll), 0);
  c.lookAt(...look);
  c.updateMatrixWorld();
  const v = new THREE.Vector3(...p).project(c);
  return { x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H };
};
