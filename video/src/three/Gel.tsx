import {ThreeElements} from '@react-three/fiber';
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {roundedBox} from './geom';

export type Deform = {
	/** bending jiggle amplitude (units) */
	wobble?: number;
	/** jiggle phase (radians) */
	phase?: number;
	/** press dent (finger / stone) */
	press?: {x: number; z: number; depth: number; radius: number};
	/** radial ripple travelling outwards */
	ripple?: {x: number; z: number; t: number; amp: number};
};

export const gelMaterial = (opts: Partial<THREE.MeshPhysicalMaterialParameters> = {}) =>
	new THREE.MeshPhysicalMaterial({
		color: '#eef8ff',
		metalness: 0,
		roughness: 0.035,
		transmission: 1,
		thickness: 0.35,
		ior: 1.41,
		attenuationColor: new THREE.Color('#a9dcff'),
		attenuationDistance: 1.2,
		clearcoat: 1,
		clearcoatRoughness: 0.02,
		specularIntensity: 1,
		envMapIntensity: 1.6,
		iridescence: 0.12,
		iridescenceIOR: 1.3,
		side: THREE.DoubleSide,
		...opts,
	});

/** Apply gelatinous deformation to a slab whose thickness axis is Y. */
const deform = (base: Float32Array, out: THREE.BufferAttribute, d: Deform, halfT: number, scale = 1) => {
	const {wobble = 0, phase = 0, press, ripple} = d;
	for (let i = 0; i < out.count; i++) {
		const x = base[i * 3];
		const y = base[i * 3 + 1];
		const z = base[i * 3 + 2];
		let dy = 0;
		if (wobble) dy += wobble * Math.sin((x / scale) * 2.1 + phase) * Math.cos((z / scale) * 1.7 + phase * 0.7);
		const top = (y + halfT) / (2 * halfT); // 0 bottom .. 1 top
		if (press) {
			const r2 = (x - press.x) ** 2 + (z - press.z) ** 2;
			const g = Math.exp(-r2 / (press.radius * press.radius));
			// top face dents most; volume bulges slightly around the rim (incompressible feel)
			const rim = Math.exp(-r2 / (press.radius * press.radius * 4)) - g;
			dy += -press.depth * g * (0.35 + 0.65 * top) + press.depth * 0.22 * rim * top;
		}
		if (ripple && ripple.amp > 0) {
			const r = Math.sqrt((x - ripple.x) ** 2 + (z - ripple.z) ** 2);
			const front = ripple.t * 1.6 * scale;
			const env = Math.exp(-((r - front) ** 2) / (0.08 * scale * scale)) * Math.exp(-ripple.t * 1.3);
			dy += ripple.amp * env * Math.sin(((r - front) / scale) * 18) * (0.4 + 0.6 * top);
		}
		out.setXYZ(i, x, y + dy, z);
	}
	out.needsUpdate = true;
};

export const GelSlab: React.FC<{
	w: number;
	d: number;
	t: number;
	radius?: number;
	deform?: Deform;
	material?: THREE.Material;
	seg?: [number, number, number];
} & ThreeElements['group']> = ({w, d, t, radius, deform: df = {}, material, seg = [72, 6, 72], ...rest}) => {
	const geo = useMemo(() => roundedBox(w, t, d, radius ?? Math.min(t * 0.48, 0.05), seg), [w, d, t, radius, seg]);
	const base = useMemo(() => new Float32Array(geo.attributes.position.array as Float32Array), [geo]);
	const mat = useMemo(() => material ?? gelMaterial(), [material]);
	deform(base, geo.attributes.position as THREE.BufferAttribute, df, t / 2, Math.max(w, d) / 1.8);
	geo.computeVertexNormals();
	return (
		<group {...rest}>
			<mesh geometry={geo} material={mat} />
		</group>
	);
};
