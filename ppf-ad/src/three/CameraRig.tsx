import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import * as THREE from "three";

export const CameraRig: React.FC<{
  position: [number, number, number];
  lookAt: [number, number, number];
  fov?: number;
  roll?: number;
}> = ({ position, lookAt, fov = 30, roll = 0 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...position);
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.lookAt(...lookAt);
    camera.fov = fov;
    camera.near = 0.01;
    camera.far = 200;
    camera.updateProjectionMatrix();
  });
  return null;
};
