import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {ease, tw} from '../lib/anim';
import {C, latinFont, SAFE} from '../theme';
import {Cam, mixV, projectToScreen, V3} from '../three/Cam';
import {Canvas3D} from '../three/Canvas3D';
import {Env} from '../three/env';
import {GelSlab} from '../three/Gel';
import {Backdrop, GridFloor} from '../three/Stage';
import {Flash, Grain, Streak, Vignette} from '../ui/Overlays';
import {TechLabel} from '../ui/Type';

export const S2_DUR = 216;

const SW = 0.82; // sample width
const SD = 0.6; // sample depth
const ST = 0.05; // 6 mm, shown on a magnified sample swatch
const EDGE_Z = SD / 2;

/** Backdrop of thin light lines – refracted through the gel to show clarity & thickness */
const LightLines: React.FC<{f: number}> = ({f}) => {
	const mat = useMemo(() => new THREE.MeshBasicMaterial({color: new THREE.Color(C.blue).multiplyScalar(1.4), toneMapped: false}), []);
	const matW = useMemo(() => new THREE.MeshBasicMaterial({color: new THREE.Color('#dbeeff').multiplyScalar(1.2), toneMapped: false}), []);
	return (
		<group position={[0, 0, -3.2]}>
			{Array.from({length: 15}).map((_, i) => (
				<mesh key={i} position={[(i - 7) * 0.3 + Math.sin(f * 0.01 + i) * 0.02, 0, 0]} material={i % 4 === 0 ? matW : mat}>
					<boxGeometry args={[0.012, 9, 0.01]} />
				</mesh>
			))}
			<mesh position={[0, -0.55, 1.0]} rotation={[0, 0, 0]} material={matW}>
				<boxGeometry args={[12, 0.012, 0.01]} />
			</mesh>
		</group>
	);
};

const Probe: React.FC<{y: number; visible: boolean}> = ({y, visible}) => (
	<mesh position={[0, y, 0]} visible={visible}>
		<sphereGeometry args={[0.07, 64, 32]} />
		<meshStandardMaterial color="#f2f6fb" metalness={1} roughness={0.05} envMapIntensity={1.8} />
	</mesh>
);

export const S2Reveal: React.FC = () => {
	const f = useCurrentFrame();
	const {width, height} = useVideoConfig();

	// --- shot blending ---
	const toMacro = tw(f, [52, 82], [0, 1], ease.inOut);
	const toFlex = tw(f, [134, 160], [0, 1], ease.inOut);

	// slab pose
	const tiltA = 0.55 + Math.sin(f * 0.02) * 0.04;
	const tilt = (1 - toMacro) * tiltA + toFlex * 0.32;
	const spin = (1 - toMacro) * (-0.5 + f * 0.006) + toFlex * (0.35 + (f - 140) * 0.004);
	const rise = (1 - toMacro) * tw(f, [0, 40], [-0.25, 0], ease.out);

	// gelatinous behaviour
	const settle = 0.03 * Math.exp(-f / 16) * (1 - toMacro);
	const pressT = tw(f, [158, 176, 186, 192], [0, 1, 1, 0], ease.inOut);
	const release = Math.max(0, f - 190);
	const probeY = ST / 2 + 0.07 - pressT * 0.035 + (f < 158 ? 0.9 * (1 - tw(f, [140, 158], [0, 1], ease.out)) : 0) + (release > 0 ? Math.min(0.25, release * 0.012) : 0);
	const deform = {
		wobble: settle + (release > 0 ? 0.018 * Math.exp(-release / 9) : 0),
		phase: f * 0.55,
		press: {x: 0, z: 0, depth: 0.035 * pressT, radius: 0.11},
		ripple: release > 0 ? {x: 0, z: 0, t: release / 45, amp: 0.008} : undefined,
	};

	// camera
	const camA: V3 = [0, 0.95, 3.5];
	const camB: V3 = [0.02, 0.0, EDGE_Z + 0.66];
	const camC: V3 = [0.85, 1.55, 2.7];
	const lookA: V3 = [0, -0.05, 0];
	const lookB: V3 = [0, 0, EDGE_Z];
	const lookC: V3 = [0, -0.02, 0];
	const dollyB = tw(f, [82, 134], [0, 1], ease.soft);
	const pos = mixV(mixV(camA, [camB[0] - 0.05 + dollyB * 0.1, camB[1], camB[2] - dollyB * 0.06], toMacro), camC, toFlex);
	const look = mixV(mixV(lookA, lookB, toMacro), lookC, toFlex);
	const fov = THREE.MathUtils.lerp(THREE.MathUtils.lerp(36, 20, toMacro), 33, toFlex);

	// measurement overlay (projected from the actual slab edge)
	const inMeasure = toMacro > 0.98 && toFlex < 0.02;
	const top = projectToScreen([0.15, ST / 2, EDGE_Z], pos, look, fov, width, height);
	const bot = projectToScreen([0.15, -ST / 2, EDGE_Z], pos, look, fov, width, height);
	const mIn = tw(f, [86, 104], [0, 1], ease.out) * (1 - tw(f, [128, 136], [0, 1]));
	const count = tw(f, [92, 118], [0, 6], ease.out);

	const lightSweep = tw(f, [8, 70], [-1.2, 1.4], ease.inOut);
	const flashIn = tw(f, [0, 10], [1, 0], ease.out);

	return (
		<AbsoluteFill style={{background: C.black}}>
			<Canvas3D exposure={1.15}>
				<Env preset="studio" rotation={[0, -0.6 + f * 0.004, 0]} intensity={1.1} background="#020409" />
				<Cam pos={pos} look={look} fov={fov} />
				<spotLight position={[lightSweep * 3, 3, 1.5]} angle={0.5} penumbra={1} intensity={14} decay={1.5} color="#dff0ff" />
				<pointLight position={[0, -1.2, -1]} intensity={6} distance={6} color={C.blue} />
				<Backdrop />
				<LightLines f={f} />
				<group position={[0, rise, 0]} rotation={[tilt, spin, 0]}>
					<GelSlab w={SW} d={SD} t={ST} radius={0.022} deform={deform} seg={[90, 6, 66]} />
				</group>
				<Probe y={probeY} visible={f > 138} />
				<GridFloor y={-0.6} />
			</Canvas3D>

			{inMeasure || mIn > 0 ? (
				<svg width={width} height={height} style={{position: 'absolute', inset: 0, opacity: mIn}}>
					<defs>
						<linearGradient id="g6" x1="0" x2="1">
							<stop offset="0" stopColor={C.blueHi} stopOpacity="0" />
							<stop offset="0.5" stopColor={C.blueHi} />
							<stop offset="1" stopColor={C.blueHi} stopOpacity="0" />
						</linearGradient>
					</defs>
					{/* guide lines at the top & bottom faces */}
					<rect x={80} y={top.y - 1} width={(width - 160) * mIn} height={2} fill="url(#g6)" />
					<rect x={80} y={bot.y - 1} width={(width - 160) * mIn} height={2} fill="url(#g6)" />
					{/* dimension arrow */}
					<line x1={860} y1={top.y + 10} x2={860} y2={bot.y - 10} stroke={C.silverHi} strokeWidth={3} />
					<path d={`M850 ${top.y + 18} L860 ${top.y + 4} L870 ${top.y + 18}`} fill="none" stroke={C.silverHi} strokeWidth={3} />
					<path d={`M850 ${bot.y - 18} L860 ${bot.y - 4} L870 ${bot.y - 18}`} fill="none" stroke={C.silverHi} strokeWidth={3} />
					<line x1={835} y1={top.y} x2={885} y2={top.y} stroke={C.silverHi} strokeWidth={2} />
					<line x1={835} y1={bot.y} x2={885} y2={bot.y} stroke={C.silverHi} strokeWidth={2} />
				</svg>
			) : null}

			{/* big counter */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 1150,
					textAlign: 'center',
					fontFamily: latinFont,
					color: C.silverHi,
					opacity: mIn,
					transform: `translateY(${(1 - mIn) * 30}px)`,
				}}
			>
				<span style={{fontSize: 200, fontWeight: 700, letterSpacing: '-0.02em', textShadow: '0 0 40px rgba(61,169,255,0.55)'}}>
					{count.toFixed(1)}
				</span>
				<span style={{fontSize: 80, fontWeight: 500, color: C.blueHi, marginLeft: 16}}>mm</span>
			</div>
			<div style={{position: 'absolute', top: 1400, left: 0, right: 0, opacity: mIn}}>
				<TechLabel text="6mm Thickness" start={98} end={136} size={48} color={C.silver} />
			</div>

			<div style={{position: 'absolute', top: SAFE.top + 40, left: SAFE.side, right: SAFE.side}}>
				<TechLabel text="Transparent" start={168} end={210} size={64} color={C.silverHi} weight={700} />
				<TechLabel text="Gelatinous Shield" start={174} end={210} size={64} color={C.blueHi} weight={700} />
			</div>

			<Streak y={height * 0.5} opacity={tw(f, [134, 146, 160], [0, 0.8, 0])} />
			<Vignette strength={0.7} />
			<Grain />
			<Flash opacity={flashIn} />
		</AbsoluteFill>
	);
};
