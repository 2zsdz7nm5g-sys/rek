import React, {useMemo} from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {ease, rand, tw} from '../lib/anim';
import {arabicFont, C, latinFont, SAFE} from '../theme';
import {Cam, mixV, V3} from '../three/Cam';
import {Car, StudioFloor, surfaceQuat, windshieldGeometry, wsFrame} from '../three/Car';
import {Canvas3D} from '../three/Canvas3D';
import {Env} from '../three/env';
import {glowTexture} from '../three/geom';
import {useTex} from '../three/useTex';
import {Grain, Vignette} from '../ui/Overlays';

export const S4_DUR = 306;

const STEPS = [
	{from: 0, to: 60, n: '01', label: 'تنظيف وتحضير الزجاج'},
	{from: 60, to: 118, n: '02', label: 'وضع درع الحماية'},
	{from: 118, to: 186, n: '03', label: 'تثبيت بأدوات احترافية'},
	{from: 186, to: 240, n: '04', label: 'إزالة السائل والفقاعات'},
	{from: 240, to: 306, n: '05', label: 'الفحص النهائي'},
];

// ---------------- helpers ----------------
const v3 = (v: THREE.Vector3): V3 => [v.x, v.y, v.z];

const SurfaceObject: React.FC<{u: number; v: number; lift: number; children: React.ReactNode; spin?: number}> = ({u, v, lift, children, spin = 0}) => {
	const {p, n, tu} = wsFrame(u, v, lift);
	const q = surfaceQuat(tu, n);
	if (spin) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), spin));
	return (
		<group position={p} quaternion={q}>
			{children}
		</group>
	);
};

// ---------------- props / tools ----------------
const Squeegee: React.FC<{tilt?: number}> = ({tilt = 0.35}) => (
	<group rotation={[0, 0, tilt]}>
		<mesh position={[0, 0.035, 0]}>
			<boxGeometry args={[0.014, 0.06, 0.24]} />
			<meshPhysicalMaterial color="#1e74ff" roughness={0.3} clearcoat={0.8} />
		</mesh>
		<mesh position={[0, 0.003, 0]}>
			<boxGeometry args={[0.006, 0.01, 0.235]} />
			<meshStandardMaterial color="#0a0a0c" roughness={0.9} />
		</mesh>
		<mesh position={[-0.035, 0.11, 0]} rotation={[0, 0, 0.55]}>
			<cylinderGeometry args={[0.016, 0.018, 0.16, 20]} />
			<meshPhysicalMaterial color="#1a1d22" roughness={0.4} clearcoat={0.5} />
		</mesh>
	</group>
);

const Cloth: React.FC = () => {
	const geo = useMemo(() => {
		const g = new THREE.PlaneGeometry(0.32, 0.28, 30, 30);
		g.rotateX(-Math.PI / 2);
		const p = g.attributes.position;
		for (let i = 0; i < p.count; i++) {
			const x = p.getX(i);
			const z = p.getZ(i);
			const edge = Math.max(Math.abs(x) / 0.16, Math.abs(z) / 0.14);
			p.setY(i, 0.012 * Math.sin(x * 60 + z * 23) * Math.cos(z * 47) + 0.03 * Math.pow(edge, 3));
		}
		g.computeVertexNormals();
		return g;
	}, []);
	return (
		<mesh geometry={geo}>
			<meshStandardMaterial color="#2b4a73" roughness={1} side={THREE.DoubleSide} />
		</mesh>
	);
};

/** milky dust / haze layer, wiped off progressively from the top */
const Haze: React.FC<{wipeV: number; amount: number}> = ({wipeV, amount}) => {
	const geo = useMemo(() => windshieldGeometry(0.009), []);
	const mat = useMemo(
		() =>
			new THREE.ShaderMaterial({
				transparent: true,
				depthWrite: false,
				uniforms: {uWipe: {value: 1}, uAmt: {value: 1}},
				vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
				fragmentShader: `uniform float uWipe; uniform float uAmt; varying vec2 vUv;
				float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
				void main(){
					float speck = step(0.93, h(floor(vUv*vec2(380.0,260.0))));
					float smear = 0.5+0.5*sin(vUv.x*40.0+vUv.y*13.0);
					float a = (0.16 + 0.1*smear + 0.35*speck) * uAmt;
					a *= 1.0 - smoothstep(uWipe, uWipe+0.06, vUv.y);
					gl_FragColor = vec4(vec3(0.78,0.74,0.66), a);
				}`,
			}),
		[],
	);
	mat.uniforms.uWipe.value = wipeV;
	mat.uniforms.uAmt.value = amount;
	return <mesh geometry={geo} material={mat} />;
};

/** the transparent gelatinous protection sheet lying on the windshield */
const ShieldSheet: React.FC<{lift: number; edge: number; sweep: number}> = ({lift, edge, sweep}) => {
	const geo = useMemo(() => windshieldGeometry(0.016), []);
	const glowGeo = useMemo(() => windshieldGeometry(0.02), []);
	const mat = useMemo(
		() =>
			new THREE.MeshPhysicalMaterial({
				color: '#e6f6ff',
				transmission: 1,
				thickness: 0.12,
				roughness: 0.03,
				ior: 1.41,
				clearcoat: 1,
				clearcoatRoughness: 0.02,
				envMapIntensity: 0.9,
				attenuationColor: new THREE.Color('#a9dcff'),
				attenuationDistance: 0.8,
				side: THREE.DoubleSide,
			}),
		[],
	);
	const glow = useMemo(
		() =>
			new THREE.ShaderMaterial({
				transparent: true,
				depthWrite: false,
				blending: THREE.AdditiveBlending,
				uniforms: {uEdge: {value: 0}, uSweep: {value: -1}},
				vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
				fragmentShader: `uniform float uEdge; uniform float uSweep; varying vec2 vUv;
				void main(){
					float d = min(min(vUv.x,1.0-vUv.x),min(vUv.y,1.0-vUv.y));
					float e = (1.0 - smoothstep(0.0, 0.028, d)) * uEdge * 1.6 + (1.0 - smoothstep(0.0, 0.006, d)) * uEdge;
					float s = (vUv.y*0.9 + vUv.x*0.25) - uSweep;
					float band = exp(-s*s*260.0)*0.85 + exp(-s*s*14.0)*0.08;
					vec3 col = vec3(0.39,0.78,1.0)*e + vec3(0.75,0.9,1.0)*band;
					gl_FragColor = vec4(col, 1.0);
				}`,
			}),
		[],
	);
	glow.uniforms.uEdge.value = edge;
	glow.uniforms.uSweep.value = sweep;
	const n = wsFrame(0.5, 0.5).n;
	return (
		<group position={[n.x * lift, n.y * lift + lift * 0.2, n.z * lift + lift * 0.35]}>
			<mesh geometry={geo} material={mat} />
			<mesh geometry={glowGeo} material={glow} renderOrder={5} />
		</group>
	);
};

const BUBBLES = Array.from({length: 46}, (_, i) => ({
	u: 0.08 + rand(i * 3.1) * 0.84,
	v: 0.1 + rand(i * 7.7 + 2) * 0.8,
	r: 0.006 + rand(i * 1.9 + 5) * 0.011,
}));
const STROKES = [
	{v: 0.8, dir: 1},
	{v: 0.8, dir: -1},
	{v: 0.52, dir: 1},
	{v: 0.52, dir: -1},
	{v: 0.24, dir: 1},
	{v: 0.24, dir: -1},
];
const SQ_FROM = 122;
const SQ_LEN = 10.5;
const strokeState = (f: number) => {
	const k = Math.min(STROKES.length - 1, Math.max(0, Math.floor((f - SQ_FROM) / SQ_LEN)));
	const t = THREE.MathUtils.clamp((f - SQ_FROM - k * SQ_LEN) / SQ_LEN, 0, 1);
	const s = STROKES[k];
	const e = ease.inOut(t);
	return {k, t, u: 0.5 + s.dir * 0.46 * e, v: s.v};
};
const bubbleCleared = (b: (typeof BUBBLES)[number], f: number) => {
	for (let k = 0; k < STROKES.length; k++) {
		const s = STROKES[k];
		if (Math.abs(b.v - s.v) > 0.15) continue;
		const t = THREE.MathUtils.clamp((f - SQ_FROM - k * SQ_LEN) / SQ_LEN, 0, 1);
		const u = 0.5 + s.dir * 0.46 * ease.inOut(t);
		if ((s.dir > 0 && b.u >= 0.5 && b.u <= u) || (s.dir < 0 && b.u <= 0.5 && b.u >= u)) return true;
	}
	return false;
};

const Bubbles: React.FC<{f: number; visible: boolean}> = ({f, visible}) => {
	const mat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#ffffff', roughness: 0, metalness: 0, transmission: 0.6, clearcoat: 1, envMapIntensity: 2.5, transparent: true, opacity: 0.85}), []);
	if (!visible) return null;
	return (
		<group>
			{BUBBLES.map((b, i) => {
				if (bubbleCleared(b, f)) return null;
				const {p} = wsFrame(b.u, b.v, 0.012);
				return (
					<mesh key={i} position={p} material={mat} scale={[1, 0.45, 1]}>
						<sphereGeometry args={[b.r, 16, 10]} />
					</mesh>
				);
			})}
		</group>
	);
};

const DROPS = Array.from({length: 28}, (_, i) => ({u: 0.05 + (i / 27) * 0.9 + (rand(i) - 0.5) * 0.02, s: 0.006 + rand(i + 9) * 0.006}));
const EdgeDrops: React.FC<{f: number}> = ({f}) => {
	const mat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#ffffff', roughness: 0, transmission: 0.7, clearcoat: 1, envMapIntensity: 2.5, transparent: true, opacity: 0.9}), []);
	if (f < 180 || f > 244) return null;
	const cardU = tw(f, [192, 232], [0.02, 0.98], ease.inOut);
	return (
		<group>
			{DROPS.map((d, i) => {
				const passed = d.u < cardU;
				const slide = passed ? Math.min(1, (cardU - d.u) * 6) : 0;
				const {p, tv} = wsFrame(d.u, 0.035, 0.018);
				p.addScaledVector(tv, -slide * 0.12);
				p.y -= slide * 0.05;
				return (
					<mesh key={i} position={p} material={mat} scale={[1, 0.6 - slide * 0.4, 1]} visible={slide < 0.95}>
						<sphereGeometry args={[d.s, 14, 10]} />
					</mesh>
				);
			})}
		</group>
	);
};

const SprayMist: React.FC<{f: number}> = ({f}) => {
	const mat = useMemo(() => new THREE.SpriteMaterial({map: glowTexture(), color: '#e8f4ff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5}), []);
	if (f > 34) return null;
	const nozzle = new THREE.Vector3(1.0, 2.0, 1.4);
	return (
		<group>
			{Array.from({length: 70}).map((_, i) => {
				const born = rand(i) * 18;
				const t = (f - born) / 12;
				if (t < 0 || t > 1) return null;
				const tgt = wsFrame(0.2 + rand(i + 3) * 0.6, 0.25 + rand(i + 7) * 0.6, 0.02).p;
				const p = nozzle.clone().lerp(tgt, ease.out(t));
				const s = 0.02 + t * 0.05;
				return <sprite key={i} material={mat} position={p} scale={[s, s, 1]} />;
			})}
		</group>
	);
};

const Workshop: React.FC = () => {
	const logo = useTex(staticFile('brand/rek-proffset-logo.png'));
	const led = useMemo(() => new THREE.MeshBasicMaterial({color: new THREE.Color('#eef6ff').multiplyScalar(2.2), toneMapped: false}), []);
	return (
		<group>
			{/* back wall with REK Proffset sign */}
			<mesh position={[0, 2.5, -4.2]}>
				<planeGeometry args={[16, 6]} />
				<meshStandardMaterial color="#0d141c" roughness={0.6} metalness={0.2} />
			</mesh>
			<mesh position={[0, 2.35, -4.15]}>
				<planeGeometry args={[1.5, 1.5]} />
				<meshBasicMaterial map={logo} toneMapped={false} />
			</mesh>
			{[-3.2, 3.2].map((x) => (
				<mesh key={x} position={[x, 2.35, -4.14]} material={led}>
					<boxGeometry args={[3.2, 0.03, 0.02]} />
				</mesh>
			))}
			{/* ceiling LED battens */}
			{[-2.4, -0.8, 0.8, 2.4].map((x) => (
				<mesh key={x} position={[x, 4.2, -0.5]} material={led}>
					<boxGeometry args={[0.08, 0.03, 6]} />
				</mesh>
			))}
		</group>
	);
};

// ---------------- scene ----------------
export const S4Install: React.FC = () => {
	const f = useCurrentFrame();


	// cleaning
	const clothT = tw(f, [6, 58], [0, 1], (x) => x);
	const clothU = 0.5 + 0.36 * Math.sin(clothT * Math.PI * 5);
	const clothV = 0.9 - 0.82 * clothT;
	const wipeV = f < 6 ? 1.2 : clothV + 0.05;
	const hazeAmt = 1 - tw(f, [56, 66], [0, 1]);

	// sheet placement
	const lift = tw(f, [62, 104], [0.55, 0], ease.out) + (f > 104 ? 0.006 * Math.sin((f - 104) * 0.9) * Math.exp(-(f - 104) / 6) : 0);
	const sheetOn = f >= 60;
	const edge = tw(f, [62, 80], [0, 1]) * (1 - tw(f, [112, 140], [0, 0.75]));

	// squeegee
	const sq = strokeState(f);
	const sqVisible = f >= 116 && f < 188;
	const sqLift = f < SQ_FROM ? tw(f, [116, SQ_FROM], [0.12, 0.02]) : 0.02 + (f > 182 ? (f - 182) * 0.03 : 0);

	// edge card
	const cardU = tw(f, [192, 232], [0.02, 0.98], ease.inOut);

	// inspection
	const sweep = f >= 244 ? tw(f, [246, 296], [-0.3, 1.4], ease.inOut) : -1;
	const lampV = tw(f, [246, 296], [1.05, -0.1], ease.inOut);

	// camera per step (smoothly blended)
	const cen = wsFrame(0.5, 0.45);
	const n = cen.n;
	const camFor = (look: THREE.Vector3, dist: number, side: number, up = 0.0): {pos: V3; look: V3} => {
		const pos = look.clone().addScaledVector(n, dist).add(new THREE.Vector3(side, up, dist * 0.55));
		return {pos: v3(pos), look: v3(look)};
	};
	const c1 = camFor(wsFrame(clothU * 0.3 + 0.35, Math.max(0.25, clothV * 0.5 + 0.25)).p, 1.7, 0.45, 0.1);
	const c2 = camFor(cen.p, 2.5, 0.6, 0.2);
	const c3 = camFor(wsFrame(sq.u * 0.8 + 0.1, sq.v * 0.7 + 0.15).p, 1.5, 0.4, 0.1);
	const c4 = camFor(wsFrame(cardU * 0.5 + 0.25, 0.1).p, 1.05, 0.3, 0.12);
	const c5 = camFor(cen.p, 2.9, -0.7, 0.3);
	const b12 = tw(f, [52, 72], [0, 1], ease.inOut);
	const b23 = tw(f, [110, 126], [0, 1], ease.inOut);
	const b34 = tw(f, [180, 196], [0, 1], ease.inOut);
	const b45 = tw(f, [234, 254], [0, 1], ease.inOut);
	const blend = (k: 'pos' | 'look') => mixV(mixV(mixV(mixV(c1[k], c2[k], b12), c3[k], b23), c4[k], b34), c5[k], b45);
	const pos = blend('pos');
	const look = blend('look');

	const step = STEPS.find((s) => f >= s.from && f < s.to) ?? STEPS[STEPS.length - 1];
	const stepIn = tw(f, [step.from + 2, step.from + 14], [0, 1], ease.out) * (1 - tw(f, [step.to - 8, step.to], [0, 1]));
	const done = tw(f, [272, 286], [0, 1], ease.out);

	return (
		<AbsoluteFill style={{background: '#070b10'}}>
			<Canvas3D exposure={1.2}>
				<Env preset="workshop" rotation={[0, 0.3 + f * 0.002, 0]} intensity={0.7} background="#080d13" />
				<Cam pos={pos} look={look} fov={34} />
				<hemisphereLight args={['#c9dcf2', '#0a0d12', 0.6]} />
				<directionalLight position={[2, 5, 3]} intensity={1.0} color="#f2f7ff" />
				<Workshop />
				<Car headlights={0.15} shieldGlint={-1} />
				<StudioFloor color="#151a20" />
				<Haze wipeV={wipeV} amount={hazeAmt} />
				<SprayMist f={f} />
				{f < 60 && (
					<SurfaceObject u={clothU} v={clothV} lift={0.018} spin={Math.sin(f * 0.3) * 0.3}>
						<Cloth />
					</SurfaceObject>
				)}
				{sheetOn && <ShieldSheet lift={lift} edge={edge} sweep={sweep} />}
				<Bubbles f={f} visible={f >= 100} />
				{sqVisible && (
					<SurfaceObject u={sq.u} v={sq.v} lift={sqLift}>
						<Squeegee tilt={-0.35 * STROKES[sq.k].dir} />
					</SurfaceObject>
				)}
				<EdgeDrops f={f} />
				{f >= 188 && f < 238 && (
					<SurfaceObject u={cardU} v={0.06} lift={0.022}>
						<group scale={[0.8, 0.8, 0.6]}>
							<Squeegee tilt={-0.3} />
						</group>
					</SurfaceObject>
				)}
				{f >= 240 && (
					<SurfaceObject u={0.5} v={lampV} lift={0.22}>
						<mesh>
							<boxGeometry args={[0.03, 0.02, 1.7]} />
							<meshBasicMaterial color={new THREE.Color('#f2f9ff').multiplyScalar(3)} toneMapped={false} />
						</mesh>
						<pointLight position={[0, -0.05, 0]} intensity={3} distance={1.2} color="#e6f3ff" />
					</SurfaceObject>
				)}
			</Canvas3D>

			<Vignette strength={0.6} />

			{/* step chip */}
			<div
				dir="rtl"
				style={{
					position: 'absolute',
					top: SAFE.top,
					right: SAFE.side + 20,
					display: 'flex',
					alignItems: 'center',
					gap: 22,
					opacity: stepIn,
					transform: `translateX(${(1 - stepIn) * 40}px)`,
				}}
			>
				<span style={{fontFamily: latinFont, fontWeight: 700, fontSize: 64, color: C.blueHi, textShadow: '0 0 24px rgba(61,169,255,0.5)'}}>{step.n}</span>
				<span style={{width: 2, height: 56, background: 'rgba(195,211,227,0.5)'}} />
				<span style={{fontFamily: arabicFont, fontWeight: 500, fontSize: 52, color: C.silverHi, textShadow: '0 2px 16px rgba(0,0,0,0.7)'}}>{step.label}</span>
			</div>

			{/* progress rail */}
			<div style={{position: 'absolute', top: SAFE.top + 104, right: SAFE.side + 20, width: 560, height: 3, background: 'rgba(195,211,227,0.18)'}}>
				<div style={{position: 'absolute', right: 0, top: 0, height: 3, width: `${(f / S4_DUR) * 100}%`, background: C.blueHi, boxShadow: `0 0 12px ${C.blue}`}} />
			</div>

			{/* final check */}
			<div style={{position: 'absolute', top: 1260, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: done}}>
				<svg width={150} height={150} viewBox="0 0 150 150">
					<circle cx={75} cy={75} r={66} fill="rgba(6,26,46,0.55)" stroke={C.blueHi} strokeWidth={3} />
					<path d="M44 78 L66 99 L108 55" fill="none" stroke={C.silverHi} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={110} strokeDashoffset={110 * (1 - tw(f, [278, 292], [0, 1], ease.out))} />
				</svg>
			</div>
			<Grain />
		</AbsoluteFill>
	);
};
