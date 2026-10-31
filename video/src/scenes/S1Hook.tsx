import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {ease, rand, tw} from '../lib/anim';
import {SAFE} from '../theme';
import {Cam, mixV, V3} from '../three/Cam';
import {Car, cabinPoint} from '../three/Car';
import {Canvas3D} from '../three/Canvas3D';
import {Env} from '../three/env';
import {bokehTexture, glowTexture, rockGeometry, roadTexture} from '../three/geom';
import {Flash, Grain, Vignette} from '../ui/Overlays';
import {ArabicTitle} from '../ui/Type';

export const S1_DUR = 156;
const SPEED = 28; // m/s
const LANE_X = 1.8;

/** playback speed: real-time → dramatic slow motion → near-freeze before impact */
const speedAt = (f: number) => tw(f, [0, 38, 88, 122, 150], [1, 1, 0.1, 0.03, 0.012], ease.inOut);
const simTime = (f: number) => {
	let t = 0;
	for (let i = 0; i < Math.floor(f); i++) t += speedAt(i) / 30;
	return t + (f % 1) * (speedAt(f) / 30);
};

const T_START = simTime(36);
const T_HIT = simTime(136);
const FLIGHT = (T_HIT - T_START) / 0.972;

const target = cabinPoint(0.33, Math.PI * 0.56).toArray() as V3;
const S: V3 = [1.25, 0.25, 6.1];
const CTRL: V3 = [0.95, 1.75, 3.4];
const bez = (t: number): V3 => {
	const a = mixV(S, CTRL, t);
	const b = mixV(CTRL, target, t);
	return mixV(a, b, t);
};

const Stone: React.FC<{f: number}> = ({f}) => {
	const geo = useMemo(() => rockGeometry(7, 0.026), []);
	const mat = useMemo(() => new THREE.MeshStandardMaterial({color: '#6f6a62', roughness: 0.9, metalness: 0.05}), []);
	const glow = useMemo(() => new THREE.SpriteMaterial({map: glowTexture(), color: '#9cc9ff', transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending}), []);
	const tau = simTime(f);
	const p = THREE.MathUtils.clamp((tau - T_START) / FLIGHT, 0, 1);
	if (p <= 0) return null;
	const pos = bez(p);
	const trail = [0.02, 0.045, 0.075, 0.11].map((d) => bez(Math.max(0, p - d * (1 - p * 0.6))));
	return (
		<group>
			<pointLight position={[pos[0] + 0.25, pos[1] + 0.35, pos[2] + 0.35]} intensity={0.3} distance={2.5} decay={2} color="#dfeaff" />
			<pointLight position={[pos[0] - 0.3, pos[1] + 0.1, pos[2] - 0.2]} intensity={0.7} distance={1.5} decay={2} color="#3da9ff" />
			<mesh geometry={geo} material={mat} position={pos} rotation={[tau * 31, tau * 23, tau * 17]} />
			{trail.map((q, i) => (
				<sprite key={i} material={glow} position={q} scale={[0.05 - i * 0.008, 0.05 - i * 0.008, 1]} />
			))}
		</group>
	);
};

const Road: React.FC<{tau: number}> = ({tau}) => {
	const tex = useMemo(() => {
		const t = roadTexture();
		t.repeat.set(1, 25);
		return t;
	}, []);
	tex.offset.y = -(tau * SPEED) / 12;
	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[-LANE_X, 0, -100]}>
			<planeGeometry args={[14, 300]} />
			<meshStandardMaterial map={tex} roughness={0.55} metalness={0.15} envMapIntensity={0.6} />
		</mesh>
	);
};

const NightLights: React.FC<{tau: number}> = ({tau}) => {
	const mats = useMemo(() => {
		const b = bokehTexture();
		return {
			head: new THREE.SpriteMaterial({map: b, color: '#f3f7ff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85}),
			street: new THREE.SpriteMaterial({map: glowTexture(), color: '#ffc58a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}),
			city: new THREE.SpriteMaterial({map: b, color: '#3da9ff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5}),
		};
	}, []);
	const cars = [
		{x: -LANE_X - 0.0, z: -34, s: 1.0},
		{x: -LANE_X - 3.6, z: -58, s: 0.8},
		{x: 0.2, z: -80, s: 0.7},
		{x: -LANE_X - 3.6, z: -120, s: 0.6},
	];
	return (
		<group>
			{cars.map((c, i) => {
				const z = c.z + Math.sin(tau * 0.6 + i) * 1.5;
				return (
					<group key={i}>
						<sprite material={mats.head} position={[c.x - 0.75, 0.75, z]} scale={[1.3 * c.s, 1.3 * c.s, 1]} />
						<sprite material={mats.head} position={[c.x + 0.75, 0.75, z]} scale={[1.3 * c.s, 1.3 * c.s, 1]} />
					</group>
				);
			})}
			{Array.from({length: 10}).map((_, i) => {
				const z = 40 - ((i * 30 + tau * SPEED) % 300);
				return (
					<group key={i}>
						{z < -12 && <sprite material={mats.street} position={[-LANE_X - 9, 9, z]} scale={[1.6, 1.6, 1]} />}
						{z < -27 && <sprite material={mats.street} position={[-LANE_X + 9, 9, z - 15]} scale={[1.6, 1.6, 1]} />}
					</group>
				);
			})}
			{Array.from({length: 26}).map((_, i) => (
				<sprite
					key={i}
					material={mats.city}
					position={[(rand(i) - 0.5) * 120, 2 + rand(i + 40) * 9, -150 - rand(i + 80) * 40]}
					scale={[4 + rand(i + 5) * 6, 4 + rand(i + 5) * 6, 1]}
				/>
			))}
		</group>
	);
};

export const S1Hook: React.FC = () => {
	const f = useCurrentFrame();
	const tau = simTime(f);
	const p = THREE.MathUtils.clamp((tau - T_START) / FLIGHT, 0, 1);
	const stone = bez(Math.max(p, 0.001));

	// camera: wide tracking shot → follows stone → macro hold just before impact
	const shake = speedAt(f) * 0.006;
	const sh: V3 = [Math.sin(f * 1.7) * shake, Math.sin(f * 2.3 + 1) * shake, 0];
	const wide: V3 = [1.7, 0.95, 6.6];
	const mid: V3 = [0.75, 1.35, 3.5];
	const macro: V3 = [stone[0] + 0.22, stone[1] + 0.08, stone[2] + 0.6];
	const k1 = tw(f, [30, 95], [0, 1], ease.inOut);
	const k2 = tw(f, [88, 134], [0, 1], ease.inOut);
	const drift = tw(f, [0, 60], [0, 1], ease.soft);
	let pos = mixV(mixV(mixV(wide, [1.45, 0.98, 6.0], drift), mid, k1), macro, k2);
	pos = [pos[0] + sh[0], pos[1] + sh[1], pos[2]];
	const look = mixV(mixV([0, 0.85, 0.6], [0.05, 1.12, 0.45], k1), mixV(stone, target, 0.35), k2);
	const fov = 32 - k2 * 4;

	const flash = tw(f, [140, 152], [0, 1], ease.in);

	return (
		<AbsoluteFill style={{background: '#02060c'}}>
			<Canvas3D exposure={1.35}>
				<hemisphereLight args={['#2a4a74', '#04060a', 0.9]} />
				<directionalLight position={[-4, 7, -6]} intensity={2.2} color="#9cc4ff" />
				<directionalLight position={[3, 4, 8]} intensity={0.35} color="#bcd6ff" />
				{[0.8, -0.8].map((x) => (
					<spotLight key={x} position={[x, 0.72, 2.25]} angle={0.45} penumbra={0.8} intensity={70} distance={45} decay={1.6} color="#eaf3ff">
						<object3D attach="target" position={[x * 1.4, 0, 14]} />
					</spotLight>
				))}
				<Env preset="night" rotation={[0, tau * 0.9, 0]} intensity={0.9} background="#02060c" />
				<fog attach="fog" args={['#030a15', 10, 120]} />
				<Cam pos={pos} look={look} fov={fov} />
				<Car headlights={1} />
				<Road tau={tau} />
				<NightLights tau={tau} />
				<Stone f={f} />
			</Canvas3D>
			<Vignette strength={0.8} />
			<div style={{position: 'absolute', top: SAFE.top + 30, left: SAFE.side, right: SAFE.side}}>
				<ArabicTitle text={"زجاج سيارتك\nيستحق الحماية"} start={64} size={100} weight={600} />
			</div>
			<Grain />
			<Flash opacity={flash} />
		</AbsoluteFill>
	);
};
