import React, {useMemo} from 'react';
import * as THREE from 'three';
import {rand} from '../lib/anim';
import {C} from '../theme';
import {V3} from './Cam';
import {glowTexture, rockGeometry} from './geom';

// true proportions: glass 2.1 mm · PVB 0.76 mm · glass 2.1 mm · shield 6 mm
export const MM = 0.019;
export const GLASS = 2.1 * MM;
export const PVB = 0.76 * MM;
export const SHIELD = 6 * MM;

const glassMat = () =>
	new THREE.MeshPhysicalMaterial({
		color: '#5fae9c',
		roughness: 0.04,
		metalness: 0,
		clearcoat: 1,
		clearcoatRoughness: 0.02,
		envMapIntensity: 1.6,
		transparent: true,
		opacity: 0.55,
	});
const pvbMat = () => new THREE.MeshPhysicalMaterial({color: '#c9d7e4', roughness: 0.5, transparent: true, opacity: 0.75, envMapIntensity: 0.6});

/** crisp translucent gel for the cross-section (graphic, no transmission blur) */
export const sectionGelMat = () =>
	new THREE.MeshPhysicalMaterial({
		color: '#5fb8ff',
		roughness: 0.03,
		clearcoat: 1,
		clearcoatRoughness: 0.02,
		envMapIntensity: 1.8,
		transparent: true,
		opacity: 0.38,
		emissive: new THREE.Color('#0b3a66'),
		emissiveIntensity: 0.35,
	});

/** windshield laminate (inner glass / PVB / outer glass); top surface at y = 0 */
export const Laminate: React.FC<{w: number; d: number; explode?: number}> = ({w, d, explode = 0}) => {
	const m = useMemo(() => ({g: glassMat(), p: pvbMat()}), []);
	return (
		<group>
			<mesh material={m.g} position={[0, -GLASS / 2 + explode * 0.0, 0]}>
				<boxGeometry args={[w, GLASS, d]} />
			</mesh>
			<mesh material={m.p} position={[0, -GLASS - PVB / 2 - explode * 0.18, 0]}>
				<boxGeometry args={[w, PVB, d]} />
			</mesh>
			<mesh material={m.g} position={[0, -GLASS * 1.5 - PVB - explode * 0.36, 0]}>
				<boxGeometry args={[w, GLASS, d]} />
			</mesh>
		</group>
	);
};

/** deterministic radial crack network on the visible cut face */
const useCracks = (seed: number) =>
	useMemo(() => {
		const segs: {a: THREE.Vector2; b: THREE.Vector2; order: number}[] = [];
		const arms = 7;
		for (let k = 0; k < arms; k++) {
			let ang = Math.PI * (1.08 + (k / (arms - 1)) * 0.84) + (rand(seed + k) - 0.5) * 0.25;
			let p = new THREE.Vector2(0, 0);
			const n = 5 + Math.floor(rand(seed + k * 3) * 4);
			for (let i = 0; i < n; i++) {
				ang += (rand(seed + k * 17 + i) - 0.5) * 0.7;
				const len = 0.035 + rand(seed + k * 7 + i) * 0.05;
				const q = p.clone().add(new THREE.Vector2(Math.cos(ang) * len, Math.sin(ang) * len * 0.35));
				segs.push({a: p, b: q, order: i / n});
				if (rand(seed + k * 31 + i) > 0.7) {
					const ba = ang + (rand(seed + i) > 0.5 ? 0.9 : -0.9);
					segs.push({a: q, b: q.clone().add(new THREE.Vector2(Math.cos(ba) * len * 0.6, Math.sin(ba) * len * 0.25)), order: (i + 0.5) / n});
				}
				p = q;
			}
		}
		return segs;
	}, [seed]);

export const Cracks: React.FC<{progress: number; z: number; yTop: number; yMin: number; width?: number; spread?: number}> = ({progress, z, yTop, yMin, width = 0.0045, spread = 1}) => {
	const segs = useCracks(11);
	const mat = useMemo(() => new THREE.MeshBasicMaterial({color: '#f4fbff', transparent: true, opacity: 0.95, toneMapped: false}), []);
	return (
		<group position={[0, yTop, z]} scale={[spread, 1, 1]}>
			{segs.map((s, i) => {
				const local = THREE.MathUtils.clamp((progress - s.order * 0.7) / 0.3, 0, 1);
				if (local <= 0) return null;
				const a = s.a;
				const b = s.a.clone().lerp(s.b, local);
				// keep cracks inside the glass layers
				const ay = Math.max(a.y, yMin);
				const by = Math.max(b.y, yMin);
				const mid = new THREE.Vector2((a.x + b.x) / 2, (ay + by) / 2);
				const len = Math.hypot(b.x - a.x, by - ay);
				const rot = Math.atan2(by - ay, b.x - a.x);
				return (
					<mesh key={i} material={mat} position={[mid.x, mid.y, 0]} rotation={[0, 0, rot]}>
						<planeGeometry args={[len, width]} />
					</mesh>
				);
			})}
		</group>
	);
};

export const EnergyWaves: React.FC<{t: number; y: number; z: number}> = ({t, y, z}) => {
	const mat = useMemo(
		() => new THREE.MeshBasicMaterial({map: glowTexture(), color: C.blueHi, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false}),
		[],
	);
	if (t <= 0) return null;
	const spread = t * 0.5;
	const fade = Math.exp(-t * 1.6);
	mat.opacity = fade * 0.75;
	return (
		<group position={[0, y, z]}>
			{[1, -1].map((dir) => (
				<group key={dir}>
					{[0, 0.08, 0.16].map((lag, i) => (
						<mesh key={i} material={mat} position={[dir * Math.max(0, spread - lag), 0, 0.001 * i]}>
							<planeGeometry args={[0.1 - i * 0.02, SHIELD * 1.1]} />
						</mesh>
					))}
				</group>
			))}
			<mesh material={mat} position={[0, 0, 0.002]} scale={[1 + t * 2, 1, 1]}>
				<planeGeometry args={[0.16, SHIELD * 1.6]} />
			</mesh>
		</group>
	);
};

export const Stone: React.FC<{pos: V3; rot: number; size?: number}> = ({pos, rot, size = 0.032}) => {
	const geo = useMemo(() => rockGeometry(7, size), [size]);
	return (
		<mesh geometry={geo} position={pos} rotation={[rot * 1.3, rot, rot * 0.7]}>
			<meshStandardMaterial color="#9a9488" roughness={0.85} />
		</mesh>
	);
};

