import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {ease, rand, tw} from '../lib/anim';
import {C, SAFE} from '../theme';
import {Cam, mixV, projectToScreen, V3} from '../three/Cam';
import {Canvas3D} from '../three/Canvas3D';
import {Env} from '../three/env';
import {GelSlab, gelMaterial} from '../three/Gel';
import {glowTexture, rockGeometry} from '../three/geom';
import {Backdrop, GridFloor} from '../three/Stage';
import {Grain, Streak, Vignette} from '../ui/Overlays';
import {ArabicTitle, TechLabel} from '../ui/Type';

export const S3_DUR = 246;

// true proportions: glass 2.1 mm · PVB 0.76 mm · glass 2.1 mm · shield 6 mm
const MM = 0.019;
const GLASS = 2.1 * MM;
const PVB = 0.76 * MM;
const SHIELD = 6 * MM;

const glassMat = () =>
	new THREE.MeshPhysicalMaterial({
		color: '#d9fff4',
		transmission: 1,
		thickness: 0.2,
		roughness: 0.02,
		ior: 1.52,
		attenuationColor: new THREE.Color('#7fe0c6'),
		attenuationDistance: 0.25,
		clearcoat: 1,
		envMapIntensity: 1.4,
	});
const pvbMat = () => new THREE.MeshPhysicalMaterial({color: '#9fb6cc', transmission: 0.75, roughness: 0.45, thickness: 0.05, envMapIntensity: 0.5, transparent: true, opacity: 0.8});

/** windshield laminate (inner glass / PVB / outer glass); top surface at y = 0 */
const Laminate: React.FC<{w: number; d: number; explode?: number}> = ({w, d, explode = 0}) => {
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

const Cracks: React.FC<{progress: number; z: number; yTop: number; yMin: number}> = ({progress, z, yTop, yMin}) => {
	const segs = useCracks(11);
	const mat = useMemo(() => new THREE.MeshBasicMaterial({color: '#f4fbff', transparent: true, opacity: 0.95, toneMapped: false}), []);
	return (
		<group position={[0, yTop, z]}>
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
						<planeGeometry args={[len, 0.0045]} />
					</mesh>
				);
			})}
		</group>
	);
};

const EnergyWaves: React.FC<{t: number; y: number; z: number}> = ({t, y, z}) => {
	const mat = useMemo(
		() => new THREE.MeshBasicMaterial({map: glowTexture(), color: C.blueHi, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false}),
		[],
	);
	if (t <= 0) return null;
	const spread = t * 0.5;
	const fade = Math.exp(-t * 1.6);
	mat.opacity = fade;
	return (
		<group position={[0, y, z]}>
			{[1, -1].map((dir) => (
				<group key={dir}>
					{[0, 0.08, 0.16].map((lag, i) => (
						<mesh key={i} material={mat} position={[dir * Math.max(0, spread - lag), 0, 0.001 * i]}>
							<planeGeometry args={[0.16 - i * 0.03, SHIELD * 1.7]} />
						</mesh>
					))}
				</group>
			))}
			<mesh material={mat} position={[0, 0, 0.002]} scale={[1 + t * 2, 1, 1]}>
				<planeGeometry args={[0.3, SHIELD * 2.4]} />
			</mesh>
		</group>
	);
};

const Stone: React.FC<{pos: V3; rot: number; size?: number}> = ({pos, rot, size = 0.032}) => {
	const geo = useMemo(() => rockGeometry(7, size), [size]);
	return (
		<mesh geometry={geo} position={pos} rotation={[rot * 1.3, rot, rot * 0.7]}>
			<meshStandardMaterial color="#9a9488" roughness={0.85} />
		</mesh>
	);
};

/** stone path: falls in from upper-left, impacts at IMPACT, rebounds */
const IMPACT = 150;
const stonePath = (f: number, rebound: number): V3 => {
	if (f <= IMPACT) {
		const t = tw(f, [112, IMPACT], [0, 1], (x) => x * x * 0.4 + x * 0.6);
		return [-0.34 + 0.34 * t, 0.3 - 0.3 * t, 0];
	}
	const t = (f - IMPACT) / 30;
	return [t * 0.28 * rebound, t * 0.42 * rebound - t * t * 0.3, 0];
};

const W = 2.2;
const D = 0.5;

export const S3Science: React.FC = () => {
	const f = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const gelMat = useMemo(() => gelMaterial({attenuationDistance: 0.6}), []);

	// ---------- Part A : exploded laminate ----------
	const partA = f < 112;
	const explode = tw(f, [10, 78], [1, 0], ease.inOut);
	const aCamPos: V3 = mixV([2.7, 1.9, 3.4], [2.3, 1.35, 2.9], tw(f, [0, 110], [0, 1], ease.soft));
	const aLook: V3 = [0, 0.05, 0];
	const aFov = 32;
	const shieldY = SHIELD / 2 + explode * 0.42;
	const lblShield = projectToScreen([0.75, shieldY, 0.35], aCamPos, aLook, aFov, width, height);
	const lblGlass = projectToScreen([0.75, -GLASS - explode * 0.18, 0.35], aCamPos, aLook, aFov, width, height);
	const labelsIn = tw(f, [40, 60], [0, 1], ease.out) * (1 - tw(f, [98, 108], [0, 1]));

	// ---------- Part B : comparison ----------
	const bIn = tw(f, [104, 118], [0, 1], ease.out);
	const bCam: V3 = [0, 0.22, 5.6];
	const bLook: V3 = [0, 0, 0];
	const topY = 0.2; // unprotected rig (glass top surface)
	const botY = -0.24; // protected rig (glass top surface)
	const sinceHit = Math.max(0, f - IMPACT) / 30;
	const crack = tw(f, [IMPACT, IMPACT + 20], [0, 1], ease.out);
	const pressT = f >= IMPACT ? Math.exp(-sinceHit * 9) * Math.min(1, (f - IMPACT + 1) / 3) : 0;

	const topScr = projectToScreen([0, topY, D / 2], bCam, bLook, 14, width, height);
	const botScr = projectToScreen([0, botY + SHIELD, D / 2], bCam, bLook, 14, width, height);
	const stoneA = stonePath(f, 0.75);
	const stoneB = stonePath(f, 0.45);

	return (
		<AbsoluteFill style={{background: C.black}}>
			<Canvas3D exposure={1.05}>
				<Env preset="studio" rotation={[0, 0.8 + f * 0.003, 0]} intensity={1.15} background="#03070d" />
				<pointLight position={[0, 1.2, 1.2]} intensity={4} distance={6} color="#eaf4ff" />
				<pointLight position={[-1.5, -0.5, 1]} intensity={3} distance={5} color={C.blue} />
				{partA ? (
					<>
						<Cam pos={aCamPos} look={aLook} fov={aFov} />
						<Backdrop z={-3} y={0.6} dim={0.75} />
						<GridFloor y={-0.55} />
						<group rotation={[0, -0.15, 0]}>
							<GelSlab w={1.3} d={0.8} t={SHIELD} radius={0.02} position={[0, shieldY, 0]} seg={[60, 4, 40]} />
							<group position={[0, -explode * 0.0, 0]}>
								<Laminate w={1.3} d={0.8} explode={explode} />
							</group>
						</group>
					</>
				) : (
					<>
						<Cam pos={bCam} look={bLook} fov={14} />
						<Backdrop z={-3} y={0} dim={0.55} />
						{/* unprotected */}
						<group position={[0, topY, 0]}>
							<Laminate w={W} d={D} />
							<Cracks progress={crack} z={D / 2 + 0.002} yTop={0} yMin={-(GLASS * 2 + PVB) + 0.004} />
							<Stone pos={[stoneA[0], stoneA[1] + 0.032, 0]} rot={f * 0.12} />
						</group>
						{/* protected */}
						<group position={[0, botY, 0]}>
							<Laminate w={W} d={D} />
							<GelSlab
								w={W}
								d={D}
								t={SHIELD}
								radius={0.012}
								position={[0, SHIELD / 2, 0]}
								seg={[120, 4, 30]}
								deform={{
									press: {x: 0, z: 0, depth: SHIELD * 0.55 * pressT, radius: 0.06},
									ripple: f > IMPACT ? {x: 0, z: 0, t: sinceHit, amp: SHIELD * 0.18} : undefined,
								}}
								material={gelMat}
							/>
							<EnergyWaves t={sinceHit} y={SHIELD / 2} z={D / 2 + 0.004} />
							<Stone pos={[stoneB[0], stoneB[1] + SHIELD + 0.032 - pressT * SHIELD * 0.5, 0]} rot={f * 0.12} />
						</group>
					</>
				)}
			</Canvas3D>

			{/* Part A labels */}
			{partA && labelsIn > 0 && (
				<svg width={width} height={height} style={{position: 'absolute', inset: 0, opacity: labelsIn}}>
					{[lblShield, lblGlass].map((p, i) => (
						<g key={i}>
							<circle cx={p.x} cy={p.y} r={7} fill={C.blueHi} />
							<line x1={p.x} y1={p.y} x2={p.x + 70} y2={p.y - 60} stroke={C.blueHi} strokeWidth={2} />
							<line x1={p.x + 70} y1={p.y - 60} x2={960} y2={p.y - 60} stroke={C.blueHi} strokeWidth={2} />
						</g>
					))}
				</svg>
			)}
			{partA && (
				<>
					<div style={{position: 'absolute', left: 0, width: 960, top: lblShield.y - 150, opacity: labelsIn}}>
						<ArabicTitle text="درع الحماية 6mm" start={44} size={58} weight={600} style={{textAlign: 'right'}} />
					</div>
					<div style={{position: 'absolute', left: 0, width: 960, top: lblGlass.y - 150, opacity: labelsIn}}>
						<ArabicTitle text="الزجاج الأمامي" start={50} size={58} weight={500} color={C.silver} style={{textAlign: 'right'}} />
					</div>
				</>
			)}

			{/* Part B labels */}
			{!partA && (
				<>
					<div style={{position: 'absolute', top: topScr.y - 230, left: SAFE.side, right: SAFE.side, opacity: bIn}}>
						<ArabicTitle text="بدون حماية" start={112} end={238} size={60} weight={500} color={C.silver} glow={false} />
					</div>
					<div style={{position: 'absolute', top: botScr.y + 300, left: SAFE.side, right: SAFE.side, opacity: bIn}}>
						<ArabicTitle text="مع درع الحماية" start={116} end={238} size={60} weight={600} color={C.blueHi} />
					</div>
					<div style={{position: 'absolute', top: SAFE.top, left: 60, right: 60}}>
						<TechLabel text="Additional Windshield Protection" start={176} end={238} size={46} color={C.silverHi} weight={700} />
					</div>
				</>
			)}

			<Streak y={height * 0.5} opacity={tw(f, [100, 110, 122], [0, 0.9, 0])} />
			<Vignette strength={0.65} />
			<Grain />
			<AbsoluteFill style={{background: '#000', opacity: tw(f, [104, 110, 116], [0, 0.85, 0])}} />
		</AbsoluteFill>
	);
};
