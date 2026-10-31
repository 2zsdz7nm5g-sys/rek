import {useThree} from '@react-three/fiber';
import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';

export type EnvPreset = 'studio' | 'night' | 'workshop' | 'void';
export type EnvStrip = {dir: [number, number, number]; w: number; h: number; intensity: number; color?: string};

const strip = (
	scene: THREE.Scene,
	color: string,
	intensity: number,
	w: number,
	h: number,
	pos: [number, number, number],
	look: [number, number, number] = [0, 0, 0],
) => {
	const m = new THREE.Mesh(
		new THREE.PlaneGeometry(w, h),
		new THREE.MeshBasicMaterial({
			color: new THREE.Color(color).multiplyScalar(intensity),
			side: THREE.DoubleSide,
		}),
	);
	m.position.set(...pos);
	m.lookAt(...look);
	scene.add(m);
};

/** Builds a deterministic light-form environment (softboxes / strip lights) for reflections. */
const buildEnvScene = (preset: EnvPreset, extra: EnvStrip[] = []) => {
	const s = new THREE.Scene();
	const dome = new THREE.Mesh(
		new THREE.SphereGeometry(50, 32, 16),
		new THREE.MeshBasicMaterial({side: THREE.BackSide, vertexColors: true}),
	);
	// vertical gradient on the dome
	const g = dome.geometry as THREE.SphereGeometry;
	const cols: number[] = [];
	const top = new THREE.Color(preset === 'night' ? '#02060d' : '#03070e');
	const hor = new THREE.Color(preset === 'night' ? '#0b1a2c' : preset === 'workshop' ? '#16222f' : '#07121f');
	const bot = new THREE.Color('#010203');
	const p = g.attributes.position;
	for (let i = 0; i < p.count; i++) {
		const y = p.getY(i) / 50;
		const c = y > 0 ? hor.clone().lerp(top, Math.pow(y, 0.6)) : hor.clone().lerp(bot, Math.pow(-y, 0.4));
		cols.push(c.r, c.g, c.b);
	}
	g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
	s.add(dome);

	if (preset === 'void') {
		// only the explicitly designed strips (see `extra`)
	} else if (preset === 'studio') {
		strip(s, '#ffffff', 6, 22, 1.1, [0, 18, 0]); // overhead long softbox
		strip(s, '#dbe9ff', 4, 2.0, 16, [-14, 6, 4]); // left strip
		strip(s, '#dbe9ff', 4, 2.0, 16, [14, 6, 4]); // right strip
		strip(s, '#3da9ff', 3, 26, 0.6, [0, 2.5, -16]); // electric-blue rim line
		strip(s, '#ffffff', 1.0, 8, 1.2, [0, 6, 15]); // front fill
	} else if (preset === 'night') {
		// periodic streetlights (warm) and cool city glow
		for (let i = 0; i < 12; i++) {
			const a = (i / 12) * Math.PI * 2;
			strip(s, i % 3 === 0 ? '#ffd2a0' : '#dbe8ff', 5, 0.7, 0.22, [Math.cos(a) * 14, 11, Math.sin(a) * 14]);
		}
		strip(s, '#3da9ff', 1.6, 40, 2.5, [0, 1.5, -22]);
		strip(s, '#9fc8ff', 1.2, 40, 1.5, [0, 1.0, 22]);
	} else {
		// workshop: rows of LED ceiling battens + white wall panels
		for (let i = -3; i <= 3; i++) {
			strip(s, '#f4f8ff', 3.2, 0.28, 14, [i * 3.2, 14, 0], [i * 3.2, 0, 0]);
		}
		strip(s, '#cfe3ff', 0.8, 18, 3, [0, 5, -16]);
		strip(s, '#3da9ff', 2.4, 18, 0.5, [0, 2, 16]);
	}
	for (const e of extra) {
		const d = new THREE.Vector3(...e.dir).normalize().multiplyScalar(15);
		strip(s, e.color ?? '#ffffff', e.intensity, e.w, e.h, [d.x, d.y, d.z]);
	}
	return s;
};

/** Sets scene.environment from a procedural light-form scene. Reflections can be rotated per frame. */
export const Env: React.FC<{
	preset: EnvPreset;
	rotation?: [number, number, number];
	intensity?: number;
	background?: string;
	extra?: EnvStrip[];
}> = ({preset, rotation = [0, 0, 0], intensity = 1, background, extra}) => {
	const {gl, scene} = useThree();
	const tex = useMemo(() => {
		const pm = new THREE.PMREMGenerator(gl);
		const rt = pm.fromScene(buildEnvScene(preset, extra), 0.004, 0.1, 100, {size: 512});
		pm.dispose();
		return rt.texture;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [gl, preset, JSON.stringify(extra ?? [])]);

	useLayoutEffect(() => {
		scene.environment = tex;
		scene.background = background ? new THREE.Color(background) : null;
	}, [scene, tex, background]);

	scene.environmentIntensity = intensity;
	scene.environmentRotation.set(rotation[0], rotation[1], rotation[2]);
	return null;
};
