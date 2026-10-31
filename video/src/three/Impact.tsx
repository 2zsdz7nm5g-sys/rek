import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ease, rand, tw} from '../lib/anim';
import {C} from '../theme';
import {V3} from './Cam';
import {edgeGeometry, panelFrame, surfaceGeometry, surfaceQuat, WindshieldPanel} from './Panel';
import {Env, EnvStrip} from './env';
import {glowTexture, rockGeometry} from './geom';
import {Backdrop} from './Stage';

/* ------------------------------------------------------------------------- *
 * One windshield, one camera, one light rig – rendered either unprotected
 * or with the 6 mm gel shield. Used for BEFORE, AFTER and the split screen,
 * so the comparison is like-for-like.
 * ------------------------------------------------------------------------- */

export const IMPACT_UV = {u: 0.16, v: 0.1};
const IMP = panelFrame(IMPACT_UV.u, IMPACT_UV.v);
export const IMPACT_P = IMP.p.clone();
export const IMPACT_N = IMP.n.clone();
const STONE_R = 0.016;
export const SHIELD_T = 0.006; // 6 mm

/** camera rig for the macro impact shot; push 0 → 1 slowly dollies in */
export const impactCamera = (push: number, side = 0): {pos: V3; look: V3; fov: number} => {
	const dist = THREE.MathUtils.lerp(0.95, 0.62, push);
	const pos = IMPACT_P.clone()
		.addScaledVector(IMPACT_N, dist * 0.62)
		.add(new THREE.Vector3(0.26 + side, -0.05, dist * 0.78));
	const look = IMPACT_P.clone().add(new THREE.Vector3(0.02, 0.0, 0.0));
	return {pos: [pos.x, pos.y, pos.z], look: [look.x, look.y, look.z], fov: 30};
};

/**
 * Stone kinematics in local frames. `hit` is the impact frame.
 * Before impact: fast approach → slow motion → near-freeze (dramatic pause) → contact.
 * After impact: rebound (weaker when the shield absorbs part of the energy).
 */
export const stoneAt = (f: number, hit: number, protectedGlass: boolean) => {
	const start = IMPACT_P.clone().add(new THREE.Vector3(0.34, -0.06, 1.25));
	const contact = IMPACT_P.clone().addScaledVector(IMPACT_N, STONE_R + (protectedGlass ? 0.007 : 0.001));
	if (f <= hit) {
		const s = THREE.MathUtils.clamp((f - (hit - 70)) / 70, 0, 1);
		const p = s < 0.62 ? 0.93 * ease.out(s / 0.62) : 0.93 + 0.07 * Math.pow((s - 0.62) / 0.38, 4);
		const pos = start.clone().lerp(contact, p);
		pos.y += Math.sin(p * Math.PI) * 0.05;
		return {pos, rot: p * 7, visible: f >= hit - 70};
	}
	const t = (f - hit) / 30;
	const speed = protectedGlass ? 0.32 : 0.55;
	const dir = IMPACT_N.clone().multiplyScalar(0.8).add(new THREE.Vector3(0.25, 0.1, 0.55)).normalize();
	const pos = contact.clone().addScaledVector(dir, speed * t);
	pos.y -= 0.9 * t * t;
	return {pos, rot: 7 + t * (protectedGlass ? 6 : 14), visible: t < 1.6};
};

export const ImpactStone: React.FC<{f: number; hit: number; prot: boolean}> = ({f, hit, prot}) => {
	const geo = useMemo(() => rockGeometry(7, STONE_R), []);
	const mat = useMemo(() => new THREE.MeshStandardMaterial({color: '#77716a', roughness: 0.88, metalness: 0.04}), []);
	const s = stoneAt(f, hit, prot);
	if (!s.visible) return null;
	return (
		<group>
			<mesh geometry={geo} material={mat} position={s.pos} rotation={[s.rot * 1.3, s.rot, s.rot * 0.6]} />
			<pointLight position={[s.pos.x + 0.12, s.pos.y + 0.16, s.pos.z + 0.18]} intensity={0.12} distance={0.8} decay={2} color="#dfeaff" />
		</group>
	);
};

/* ---------------- unprotected: chip + star cracks (procedural decal) ---------------- */
const crackFrag = `
uniform float uProg; uniform float uFlash; varying vec2 vUv;
float sq(float x){return x*x;}
float h(float n){return fract(sin(n*91.345)*47453.21);}
void main(){
	vec2 p = (vUv - 0.5) * 0.3;              // metres on the glass
	float r = length(p);
	float a = atan(p.y, p.x);
	float col = 0.0;
	// crushed centre (chip / bullseye)
	float core = 1.0 - smoothstep(0.0035, 0.0062, r);
	float frost = 0.55 + 0.45 * h(floor(a * 18.0) + floor(r * 900.0));
	col += core * frost * smoothstep(0.0, 0.15, uProg);
	// half-moon cone ring
	float ring = exp(-sq((r - 0.011) / 0.0018)) * smoothstep(-0.2, 0.9, sin(a + 1.3)) + exp(-sq((r - 0.007) / 0.002)) * 0.35;
	col += ring * smoothstep(0.05, 0.3, uProg) * 0.8;
	// radial star cracks
	for (int k = 0; k < 11; k++) {
		float fk = float(k);
		float ak = fk / 11.0 * 6.2831 + (h(fk) - 0.5) * 0.5;
		float len = (0.03 + h(fk + 7.0) * 0.07) * smoothstep(0.0, 1.0, uProg * (0.8 + h(fk + 3.0) * 0.5));
		float jag = ak + 0.016 * sin(r * 140.0 + fk * 4.0) + 0.012 * sin(r * 610.0 + fk) + step(0.5, h(fk + 9.0)) * 0.12 * smoothstep(0.02, 0.05, r);
		float da = abs(mod(a - jag + 3.14159, 6.28318) - 3.14159);
		float d = da * r;
		float w = 0.00035 + 0.0006 * (1.0 - r / max(len, 0.0001));
		float line = (1.0 - smoothstep(w * 0.4, w, d)) * step(0.004, r) * (1.0 - smoothstep(len * 0.85, len, r));
		col += line * (0.75 + 0.25 * h(floor(r * 2000.0) + fk));
	}
	float flash = uFlash * exp(-r * r / 0.0004);
	vec3 c = vec3(0.92, 0.97, 1.0) * col + vec3(0.7, 0.85, 1.0) * flash;
	gl_FragColor = vec4(c, clamp(col + flash, 0.0, 1.0));
}`;

export const ChipCrack: React.FC<{prog: number; flash: number}> = ({prog, flash}) => {
	const mat = useMemo(
		() =>
			new THREE.ShaderMaterial({
				transparent: true,
				depthWrite: false,
				uniforms: {uProg: {value: 0}, uFlash: {value: 0}},
				vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
				fragmentShader: crackFrag,
			}),
		[],
	);
	mat.uniforms.uProg.value = prog;
	mat.uniforms.uFlash.value = flash;
	const {p, n, tu} = panelFrame(IMPACT_UV.u, IMPACT_UV.v, 0.0012);
	const q = surfaceQuat(tu, n).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2));
	if (prog <= 0 && flash <= 0) return null;
	return (
		<mesh position={p} quaternion={q} material={mat}>
			<planeGeometry args={[0.3, 0.3]} />
		</mesh>
	);
};

const SHARDS = Array.from({length: 26}, (_, i) => ({
	d: new THREE.Vector3(rand(i) - 0.5, rand(i + 11) - 0.3, rand(i + 23) - 0.5).normalize(),
	v: 0.25 + rand(i + 31) * 0.5,
	s: 0.0012 + rand(i + 41) * 0.0028,
}));
const Shards: React.FC<{t: number}> = ({t}) => {
	const mat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#dff6ff', roughness: 0.05, metalness: 0.2, clearcoat: 1, envMapIntensity: 3}), []);
	if (t <= 0 || t > 1.4) return null;
	return (
		<group>
			{SHARDS.map((sh, i) => {
				const dir = sh.d.clone().addScaledVector(IMPACT_N, 0.9).normalize();
				const p = IMPACT_P.clone().addScaledVector(dir, sh.v * t * 0.35);
				p.y -= 0.5 * t * t;
				return (
					<mesh key={i} position={p} rotation={[t * 20 + i, t * 13, i]} material={mat}>
						<tetrahedronGeometry args={[sh.s, 0]} />
					</mesh>
				);
			})}
		</group>
	);
};

/* ---------------- protected: 6 mm gel shield on the windshield ---------------- */
const shieldVert = `
float sq(float x){return x*x;}
uniform vec3 uP; uniform float uDent; uniform float uRip; uniform float uT;
varying vec2 vUv; varying float vDisp;
void main(){
	vUv = uv;
	vec3 pos = position;
	float r = distance(pos, uP);
	float dent = -uDent * exp(-r * r / 0.0012);
	float front = uT * 0.55;
	float rip = uRip * exp(-sq((r - front) / 0.03)) * sin((r - front) * 160.0) * exp(-uT * 1.4);
	float d = dent + rip;
	vDisp = d;
	pos += normal * d;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;

export const ShieldLayer: React.FC<{dent: number; rip: number; t: number; edge: number; sweep: number}> = ({dent, rip, t, edge, sweep}) => {
	const geo = useMemo(() => surfaceGeometry(SHIELD_T, 240, true), []);
	const edgeGeo = useMemo(() => edgeGeometry(0, SHIELD_T), []);
	const edgeMat = useMemo(() => new THREE.MeshPhysicalMaterial({color: '#7cc8ff', roughness: 0.05, clearcoat: 1, transmission: 0.5, thickness: 0.02, emissive: new THREE.Color('#1d5f99'), emissiveIntensity: 0.9 * (0.4 + edge), side: THREE.DoubleSide}), [edge]);
	const U = useMemo(() => ({uP: {value: IMPACT_P}, uDent: {value: 0}, uRip: {value: 0}, uT: {value: 0}}), []);
	const gel = useMemo(() => {
		const m = new THREE.MeshPhysicalMaterial({
			color: '#eaf7ff',
			transmission: 1,
			thickness: 0.006,
			roughness: 0.02,
			ior: 1.41,
			clearcoat: 1,
			clearcoatRoughness: 0.015,
			envMapIntensity: 1.5,
			attenuationColor: new THREE.Color('#b8e2ff'),
			attenuationDistance: 0.4,
			specularIntensity: 1,
			transparent: true,
			depthWrite: false,
			side: THREE.DoubleSide,
		});
		m.onBeforeCompile = (sh) => {
			Object.assign(sh.uniforms, U);
			sh.vertexShader = sh.vertexShader
				.replace('#include <common>', '#include <common>\nfloat sq(float x){return x*x;}\nuniform vec3 uP; uniform float uDent; uniform float uRip; uniform float uT;')
				.replace(
					'#include <begin_vertex>',
					`#include <begin_vertex>
					float rr = distance(position, uP);
					float fr = uT * 0.55;
					float dd = -uDent * exp(-rr * rr / 0.0012) + uRip * exp(-sq((rr - fr) / 0.03)) * sin((rr - fr) * 160.0) * exp(-uT * 1.4);
					transformed += normal * dd;`,
				);
		};
		return m;
	}, [U]);
	const glow = useMemo(
		() =>
			new THREE.ShaderMaterial({
				transparent: true,
				depthWrite: false,
				blending: THREE.AdditiveBlending,
				side: THREE.DoubleSide,
				polygonOffset: true,
				polygonOffsetFactor: -4,
				polygonOffsetUnits: -8,
				uniforms: {uP: {value: IMPACT_P}, uDent: {value: 0}, uRip: {value: 0}, uT: {value: 0}, uEdge: {value: 0}, uSweep: {value: -1}},
				vertexShader: shieldVert.replace('varying vec2 vUv; varying float vDisp;', 'varying vec2 vUv; varying float vDisp; varying vec3 vW;').replace('vUv = uv;', 'vUv = uv; vW = position;'),
				fragmentShader: `float sq(float x){return x*x;}
uniform float uEdge; uniform float uSweep; uniform float uT; uniform vec3 uP; varying vec2 vUv; varying float vDisp; varying vec3 vW;
				void main(){
					float d = min(min(vUv.x,1.0-vUv.x),min(vUv.y,1.0-vUv.y));
					float e = (1.0 - smoothstep(0.0, 0.01, d)) * uEdge;
					float s = (vUv.y * 0.9 + vUv.x * 0.3) - uSweep;
					float band = exp(-s*s*120.0) * 0.9 + exp(-s*s*10.0) * 0.12;
					float r = distance(vW, uP);
					float ring = exp(-sq((r - uT * 0.3) / 0.008)) * exp(-uT * 2.4) * step(0.0001, uT);
					float ring2 = exp(-sq((r - uT * 0.18) / 0.012)) * exp(-uT * 3.0) * step(0.0001, uT) * 0.5;
					float core = exp(-r * r / 0.0009) * exp(-uT * 4.0) * step(0.0001, uT);
					vec3 col = vec3(0.39, 0.78, 1.0) * (e + (ring + ring2) * 1.4 + core * 1.2 + 0.022) + vec3(0.8, 0.93, 1.0) * band;
					gl_FragColor = vec4(col, 1.0);
				}`,
			}),
		[],
	);
	U.uDent.value = dent;
	U.uRip.value = rip;
	U.uT.value = t;
	glow.uniforms.uDent.value = dent;
	glow.uniforms.uRip.value = rip;
	glow.uniforms.uT.value = t;
	glow.uniforms.uEdge.value = edge;
	glow.uniforms.uSweep.value = sweep;
	return (
		<group>
			<mesh geometry={geo} material={gel} renderOrder={2} />
			<mesh geometry={geo} material={glow} renderOrder={3} />
			<mesh geometry={edgeGeo} material={edgeMat} />
		</group>
	);
};

/* ---------------- reflections: strips added to the environment along the mirror direction ---------------- */
const mirrorDir = (camPos: V3, du: number, dv: number): [number, number, number] => {
	const fr = panelFrame(IMPACT_UV.u + du * 2, IMPACT_UV.v + dv * 2);
	const d = fr.p.clone().sub(new THREE.Vector3(...camPos)).normalize();
	const r = d.sub(fr.n.clone().multiplyScalar(2 * d.dot(fr.n)));
	return [r.x, r.y, r.z];
};

export const impactEnvStrips = (camPos: V3): EnvStrip[] => [
	{dir: mirrorDir(camPos, -0.05, 0.24), w: 22, h: 0.12, intensity: 3.2},
	{dir: mirrorDir(camPos, 0.0, 0.36), w: 26, h: 1.2, intensity: 0.22, color: '#cfe3ff'},
	{dir: mirrorDir(camPos, 0.2, -0.3), w: 18, h: 0.1, intensity: 1.6, color: '#9fd0ff'},
	{dir: [-0.8, 0.6, 0.4], w: 3, h: 20, intensity: 1.2, color: '#dbe9ff'},
	{dir: [0, 1, 0], w: 30, h: 30, intensity: 0.08},
];

export type ImpactShotProps = {
	f: number; // local frame
	hit: number; // impact frame
	prot: boolean;
	push?: number; // 0..1 camera dolly
	camSide?: number;
	shieldEdge?: number;
	shieldSweep?: number;
	cam?: {pos: V3; look: V3; fov: number};
};

/** Scene content (put inside a Canvas3D). */
export const ImpactShot: React.FC<ImpactShotProps & {Cam: React.FC<{pos: V3; look: V3; fov: number}>}> = ({
	f,
	hit,
	prot,
	push = 0,
	camSide = 0,
	shieldEdge = 0,
	shieldSweep = -1,
	cam,
	Cam,
}) => {
	const t = Math.max(0, (f - hit) / 30);
	const c = cam ?? impactCamera(push, camSide);
	// tiny camera shake on contact
	const shake = f >= hit ? 0.0025 * Math.exp(-t * 9) * (prot ? 0.5 : 1) : 0;
	const pos: V3 = [c.pos[0] + Math.sin(f * 2.1) * shake, c.pos[1] + Math.cos(f * 2.7) * shake, c.pos[2]];
	const dent = prot ? 0.0036 * (f >= hit ? Math.exp(-t * 10) * Math.min(1, (f - hit + 1) / 2) : 0) : 0;
	const glow = useMemo(() => new THREE.SpriteMaterial({map: glowTexture(), color: C.blueHi, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}), []);
	glow.opacity = prot && f >= hit ? 0.7 * Math.exp(-t * 3) : 0;
	return (
		<>
			<Env preset="void" extra={impactEnvStrips(impactCamera(0.5, 0).pos)} rotation={[0, f * 0.0006, 0]} intensity={0.9} background="#02060c" />
			<Cam pos={pos} look={c.look} fov={c.fov} />
			<hemisphereLight args={['#2a4a74', '#04060a', 0.6]} />
			<directionalLight position={[-4, 7, -6]} intensity={2.0} color="#9cc4ff" />
			<directionalLight position={[3, 5, 6]} intensity={0.5} color="#dfeaff" />
			<Backdrop z={-2.6} y={0.2} dim={0.3} bokeh />
			<WindshieldPanel />
			<ImpactStone f={f} hit={hit} prot={prot} />
			{prot ? (
				<>
					<ShieldLayer dent={dent} rip={f >= hit ? 0.0012 : 0} t={t} edge={shieldEdge} sweep={shieldSweep} />
					<sprite material={glow} position={IMPACT_P.clone().addScaledVector(IMPACT_N, 0.02)} scale={[0.12, 0.12, 1]} />
				</>
			) : (
				<>
					<ChipCrack prog={tw(f, [hit, hit + 14], [0, 1], ease.out)} flash={f >= hit ? Math.exp(-t * 14) : 0} />
					<Shards t={t} />
				</>
			)}
		</>
	);
};
