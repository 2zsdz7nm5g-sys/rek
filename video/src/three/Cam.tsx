import {useThree} from '@react-three/fiber';
import React from 'react';
import * as THREE from 'three';

export type V3 = [number, number, number];

/** Frame-driven camera rig. Optional roll (radians). */
export const Cam: React.FC<{pos: V3; look: V3; fov: number; roll?: number}> = ({pos, look, fov, roll = 0}) => {
	const cam = useThree((s) => s.camera) as THREE.PerspectiveCamera;
	cam.position.set(...pos);
	cam.fov = fov;
	cam.near = 0.01;
	cam.far = 400;
	cam.up.set(Math.sin(roll), Math.cos(roll), 0);
	cam.lookAt(...look);
	cam.updateProjectionMatrix();
	return null;
};

export const mixV = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Project a world point to pixel coordinates for a given camera setup (for 2D overlays). */
export const projectToScreen = (p: V3, pos: V3, look: V3, fov: number, w: number, h: number) => {
	const cam = new THREE.PerspectiveCamera(fov, w / h, 0.01, 400);
	cam.position.set(...pos);
	cam.lookAt(...look);
	cam.updateMatrixWorld();
	cam.updateProjectionMatrix();
	const v = new THREE.Vector3(...p).project(cam);
	return {x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h};
};
