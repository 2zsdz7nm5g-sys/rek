import React, {useMemo} from 'react';
import * as THREE from 'three';
import {glowTexture} from './geom';

/* ------------------------------------------------------------------ *
 * Procedural luxury coupe-sedan. Front faces +Z. Units ≈ metres.
 * Body + cabin are lofted superellipse sections.
 * ------------------------------------------------------------------ */

const sstep = (a: number, b: number, x: number) => {
	const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
	return t * t * (3 - 2 * t);
};
const spow = (v: number, e: number) => Math.sign(v) * Math.pow(Math.abs(v), e);

export const WHEELS = {front: 1.46, rear: -1.56, r: 0.36, x: 0.84};
const NOSE = 2.42;
const TAIL = -2.42;

const yTop = (z: number) => {
	// hood rises from nose to cowl; beltline; rear deck
	if (z > 0.86) return 0.7 + 0.29 * sstep(2.3, 0.86, z);
	if (z > -1.7) return 0.99 + 0.025 * sstep(0.86, -1.0, z);
	return 1.015 - 0.1 * sstep(-1.7, -2.4, z);
};
const archBottom = (z: number, zw: number) => {
	const r = 0.45;
	const d = Math.abs(z - zw);
	return d < r ? WHEELS.r + Math.sqrt(r * r - d * d) * 0.95 : 0;
};
const yBot = (z: number) => Math.max(0.21, archBottom(z, WHEELS.front), archBottom(z, WHEELS.rear));
const halfW = (z: number) => 0.97 - 0.05 * sstep(-1.2, -2.4, z) - 0.04 * sstep(1.6, 2.3, z);
/** rounded closure at nose & tail */
const closure = (z: number) => {
	const fr = 0.34;
	const rr = 0.24;
	const sup = (t: number, p: number) => Math.pow(Math.max(0, 1 - Math.pow(Math.min(1, t), p)), 1 / p);
	if (z > NOSE - fr) return sup((z - (NOSE - fr)) / fr, 2.6);
	if (z < TAIL + rr) return sup((TAIL + rr - z) / rr, 2.4);
	return 1;
};

export const bodyPoint = (z: number, th: number, out = new THREE.Vector3()) => {
	const s = closure(z);
	const top = yTop(z);
	const bot = yBot(z);
	const yc = bot + (top - bot) * 0.52;
	const ht = (top - yc) * Math.pow(s, 0.3);
	const hb = (yc - bot) * Math.pow(s, 0.3);
	const sy = spow(Math.sin(th), 2 / 4.5);
	// tumblehome above the shoulder, tuck-under at the rocker
	const taper = 1 - 0.13 * Math.pow(Math.max(0, sy), 2.2) - 0.07 * Math.pow(Math.max(0, -sy), 2);
	const sx = Math.pow(s, 0.55);
	out.set(halfW(z) * sx * taper * spow(Math.cos(th), 2 / 4.5), yc + (sy > 0 ? ht : hb) * sy, z);
	return out;
};

// cabin / greenhouse
const CAB_FRONT = 0.86;
const WS_TOP = -0.2;
const roofY = (z: number) => {
	if (z > WS_TOP) return yTop(CAB_FRONT) + (1.41 - yTop(CAB_FRONT)) * ((CAB_FRONT - z) / (CAB_FRONT - WS_TOP));
	if (z > -1.15) return 1.41 + 0.01 * Math.sin(((z - WS_TOP) / (-1.15 - WS_TOP)) * Math.PI);
	return 1.41 - 0.41 * sstep(-1.15, -2.0, z);
};
export const cabinPoint = (z: number, th: number, out = new THREE.Vector3()) => {
	const belt = yTop(z) - 0.012;
	const h = Math.max(0, roofY(z) - belt);
	const sy = Math.pow(Math.sin(th), 0.38);
	const hwBase = 0.8 - 0.05 * sstep(-1.2, -2.0, z);
	const hw = hwBase - 0.17 * sy;
	out.set(hw * spow(Math.cos(th), 0.55), belt + h * sy, z);
	return out;
};

const gridGeometry = (
	nu: number,
	nv: number,
	fn: (u: number, v: number, out: THREE.Vector3) => THREE.Vector3,
	closeU = false,
) => {
	const pos: number[] = [];
	const uv: number[] = [];
	const idx: number[] = [];
	const v3 = new THREE.Vector3();
	for (let j = 0; j <= nv; j++) {
		for (let i = 0; i <= nu; i++) {
			fn(i / nu, j / nv, v3);
			pos.push(v3.x, v3.y, v3.z);
			uv.push(i / nu, j / nv);
		}
	}
	const row = nu + 1;
	for (let j = 0; j < nv; j++) {
		for (let i = 0; i < nu; i++) {
			const a = j * row + i;
			const b = a + 1;
			const c = a + row;
			const d = c + 1;
			idx.push(a, c, b, b, c, d);
		}
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
	g.setIndex(idx);
	g.computeVertexNormals();
	if (closeU) g.computeVertexNormals();
	return g;
};

const offsetAlongNormal = (g: THREE.BufferGeometry, d: number) => {
	const p = g.attributes.position;
	const n = g.attributes.normal;
	for (let i = 0; i < p.count; i++) {
		// outward = upward-facing for roof / windshield patches
		const k = n.getY(i) < 0 ? -d : d;
		p.setXYZ(i, p.getX(i) + n.getX(i) * k, p.getY(i) + n.getY(i) * k, p.getZ(i) + n.getZ(i) * k);
	}
	p.needsUpdate = true;
	g.computeVertexNormals();
	const nn = g.attributes.normal;
	for (let i = 0; i < nn.count; i++) {
		if (nn.getY(i) < 0) nn.setXYZ(i, -nn.getX(i), -nn.getY(i), -nn.getZ(i));
	}
	return g;
};

export const WS = {th0: 0.1 * Math.PI, th1: 0.9 * Math.PI, z0: CAB_FRONT - 0.015, z1: WS_TOP};

export const windshieldGeometry = (offset = 0.006) =>
	offsetAlongNormal(
		gridGeometry(48, 32, (u, v, o) => cabinPoint(THREE.MathUtils.lerp(WS.z0, WS.z1, v), THREE.MathUtils.lerp(WS.th1, WS.th0, u), o)),
		offset,
	);

const tubeAlong = (fn: (t: number, o: THREE.Vector3) => THREE.Vector3, n = 40) => {
	const pts: THREE.Vector3[] = [];
	for (let i = 0; i <= n; i++) pts.push(fn(i / n, new THREE.Vector3()));
	return new THREE.CatmullRomCurve3(pts);
};

export type CarProps = {
	paint?: string;
	headlights?: number; // 0..1 intensity
	shieldGlint?: number; // -1..2 sweep position of light across windshield, <0 = off
	windshieldMaterial?: THREE.Material;
};

export const Car: React.FC<CarProps> = ({paint = '#0a0f17', headlights = 1, shieldGlint = -1, windshieldMaterial}) => {
	const geo = useMemo(() => {
		const body = gridGeometry(72, 140, (u, v, o) => bodyPoint(THREE.MathUtils.lerp(NOSE, TAIL, v), u * Math.PI * 2, o));
		const cabin = gridGeometry(48, 90, (u, v, o) => cabinPoint(THREE.MathUtils.lerp(CAB_FRONT, -2.02, v), (1 - u) * Math.PI, o));
		const ws = windshieldGeometry();
		const roof = offsetAlongNormal(
			gridGeometry(40, 40, (u, v, o) => cabinPoint(THREE.MathUtils.lerp(WS.z1 - 0.02, -1.45, v), THREE.MathUtils.lerp(WS.th1, WS.th0, u), o)),
			0.008,
		);
		const pillarR = tubeAlong((t, o) => cabinPoint(THREE.MathUtils.lerp(WS.z0, -1.5, t), WS.th0, o).add(new THREE.Vector3(0.012, 0.004, 0)));
		const pillarL = tubeAlong((t, o) => cabinPoint(THREE.MathUtils.lerp(WS.z0, -1.5, t), WS.th1, o).add(new THREE.Vector3(-0.012, 0.004, 0)));
		const beltR = tubeAlong((t, o) => cabinPoint(THREE.MathUtils.lerp(0.7, -1.9, t), 0.0, o).add(new THREE.Vector3(0.01, 0.01, 0)));
		const beltL = tubeAlong((t, o) => cabinPoint(THREE.MathUtils.lerp(0.7, -1.9, t), Math.PI, o).add(new THREE.Vector3(-0.01, 0.01, 0)));
		// LED headlight signatures (upper front corners)
		const head = (side: 1 | -1) =>
			tubeAlong((t, o) => {
				const z = THREE.MathUtils.lerp(2.3, 1.72, t);
				const th = side === 1 ? THREE.MathUtils.lerp(0.06, 0.2, t) * Math.PI : Math.PI - THREE.MathUtils.lerp(0.06, 0.2, t) * Math.PI;
				const p = bodyPoint(z, th, o);
				const c = new THREE.Vector3(0, (yTop(z) + yBot(z)) / 2, z);
				return p.add(p.clone().sub(c).setZ(0).normalize().multiplyScalar(0.012)).add(new THREE.Vector3(0, -0.02, 0.012));
			}, 30);
		const lowerLed = (side: 1 | -1) =>
			tubeAlong((t, o) => {
				const z = THREE.MathUtils.lerp(2.33, 2.05, t);
				const th = side === 1 ? THREE.MathUtils.lerp(-0.02, -0.12, t) * Math.PI : Math.PI + THREE.MathUtils.lerp(-0.02, -0.12, t) * Math.PI;
				const p = bodyPoint(z, th, o);
				return p.add(new THREE.Vector3(0.0, 0, 0.012));
			}, 20);
		return {
			body,
			cabin,
			ws,
			roof,
			pillars: [new THREE.TubeGeometry(pillarR, 60, 0.022, 8), new THREE.TubeGeometry(pillarL, 60, 0.022, 8)],
			belts: [new THREE.TubeGeometry(beltR, 80, 0.008, 6), new THREE.TubeGeometry(beltL, 80, 0.008, 6)],
			heads: [new THREE.TubeGeometry(head(1), 40, 0.011, 8), new THREE.TubeGeometry(head(-1), 40, 0.011, 8)],
			headGlow: [new THREE.TubeGeometry(head(1), 40, 0.03, 8), new THREE.TubeGeometry(head(-1), 40, 0.03, 8)],
			lows: [new THREE.TubeGeometry(lowerLed(1), 20, 0.006, 6), new THREE.TubeGeometry(lowerLed(-1), 20, 0.006, 6)],
		};
	}, []);

	const mats = useMemo(() => {
		const glow = glowTexture();
		return {
			paint: new THREE.MeshPhysicalMaterial({
				color: paint,
				metalness: 0.55,
				roughness: 0.26,
				clearcoat: 1,
				clearcoatRoughness: 0.025,
				envMapIntensity: 1.25,
				side: THREE.DoubleSide,
			}),
			trim: new THREE.MeshPhysicalMaterial({color: '#05070a', metalness: 0.3, roughness: 0.35, clearcoat: 0.6}),
			chrome: new THREE.MeshStandardMaterial({color: '#dfe7f2', metalness: 1, roughness: 0.12}),
			glassDark: new THREE.MeshPhysicalMaterial({
				color: '#010205',
				side: THREE.DoubleSide,
				transparent: true,
				opacity: 0.82,
				metalness: 0,
				roughness: 0.02,
				clearcoat: 1,
				clearcoatRoughness: 0.0,
				envMapIntensity: 1.6,
			}),
			ws:
				windshieldMaterial ??
				new THREE.MeshPhysicalMaterial({
					color: '#03080e',
					metalness: 0,
					roughness: 0.01,
					clearcoat: 1,
					clearcoatRoughness: 0,
					envMapIntensity: 2.0,
					transparent: true,
					opacity: 0.55,
					side: THREE.DoubleSide,
				}),
			led: new THREE.MeshBasicMaterial({color: new THREE.Color('#e9f6ff').multiplyScalar(3), toneMapped: false}),
			ledGlow: new THREE.MeshBasicMaterial({
				color: new THREE.Color('#63c7ff'),
				transparent: true,
				opacity: 0.35,
				blending: THREE.AdditiveBlending,
				depthWrite: false,
			}),
			tire: new THREE.MeshStandardMaterial({color: '#0b0b0c', roughness: 0.85, metalness: 0}),
			rim: new THREE.MeshStandardMaterial({color: '#262b33', roughness: 0.22, metalness: 1}),
			liner: new THREE.MeshStandardMaterial({color: '#000000', roughness: 1, side: THREE.DoubleSide}),
			glowSprite: new THREE.SpriteMaterial({map: glow, color: '#bfe6ff', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true}),
			glint: new THREE.MeshBasicMaterial({
				color: new THREE.Color('#9fdcff'),
				transparent: true,
				opacity: 0.0,
				blending: THREE.AdditiveBlending,
				depthWrite: false,
				side: THREE.DoubleSide,
			}),
		};
	}, [paint, windshieldMaterial]);

	mats.led.color.set('#e9f6ff').multiplyScalar(0.2 + 2.8 * headlights);
	mats.ledGlow.opacity = 0.4 * headlights;

	// Light sweep across the windshield: a narrow emissive band clipped to the glass
	const glintGeo = useMemo(() => windshieldGeometry(0.011), []);
	const glintMat = useMemo(() => {
		const m = new THREE.ShaderMaterial({
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
			uniforms: {uPos: {value: -1}},
			vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
			fragmentShader: `uniform float uPos; varying vec2 vUv;
			void main(){
				float d = (vUv.x*0.8 + vUv.y*0.6) - uPos;
				float band = exp(-d*d*180.0)*0.9 + exp(-d*d*12.0)*0.12;
				float edge = 1.0 - smoothstep(0.0, 0.035, min(min(vUv.x,1.0-vUv.x),min(vUv.y,1.0-vUv.y)));
				vec3 col = vec3(0.62,0.86,1.0)*band + vec3(0.25,0.66,1.0)*edge*exp(-d*d*6.0)*1.4;
				gl_FragColor = vec4(col, 1.0);
			}`,
		});
		return m;
	}, []);
	glintMat.uniforms.uPos.value = shieldGlint;

	const wheel = (z: number, side: number) => (
		<group key={`${z}${side}`} position={[WHEELS.x * side, WHEELS.r, z]} rotation={[0, 0, Math.PI / 2]}>
			<mesh material={mats.tire}>
				<cylinderGeometry args={[WHEELS.r, WHEELS.r, 0.27, 48, 1]} />
			</mesh>
			<mesh material={mats.rim} position={[side * 0.137, 0, 0]}>
				<cylinderGeometry args={[WHEELS.r * 0.7, WHEELS.r * 0.72, 0.012, 48]} />
			</mesh>
			{Array.from({length: 10}).map((_, k) => (
				<mesh key={k} material={mats.chrome} position={[side * 0.142, 0, 0]} rotation={[(k / 10) * Math.PI * 2, 0, 0]}>
					<boxGeometry args={[0.012, 0.018, WHEELS.r * 1.32]} />
				</mesh>
			))}
		</group>
	);

	return (
		<group>
			<mesh geometry={geo.body} material={mats.paint} />
			<mesh geometry={geo.cabin} material={mats.glassDark} />
			<mesh geometry={geo.roof} material={mats.paint} />
			<mesh geometry={geo.ws} material={mats.ws} />
			<mesh geometry={glintGeo} material={glintMat} visible={shieldGlint > -0.5} />
			{geo.pillars.map((g, i) => (
				<mesh key={i} geometry={g} material={mats.paint} />
			))}
			{geo.belts.map((g, i) => (
				<mesh key={i} geometry={g} material={mats.chrome} />
			))}
			{geo.heads.map((g, i) => (
				<mesh key={i} geometry={g} material={mats.led} />
			))}
			{geo.headGlow.map((g, i) => (
				<mesh key={i} geometry={g} material={mats.ledGlow} />
			))}
			{/* interior silhouettes seen through the glass */}
			<group>
				<mesh position={[0, 0.96, 0.42]} material={mats.trim}>
					<boxGeometry args={[1.5, 0.12, 0.42]} />
				</mesh>
				<mesh position={[0, 1.025, 0.62]}>
					<boxGeometry args={[1.32, 0.006, 0.01]} />
					<meshBasicMaterial color={new THREE.Color('#3da9ff').multiplyScalar(1.6)} toneMapped={false} />
				</mesh>
				<mesh position={[0.38, 1.1, 0.2]} rotation={[-0.35, 0, 0]} material={mats.trim}>
					<torusGeometry args={[0.18, 0.022, 10, 40]} />
				</mesh>
				{[0.4, -0.4].map((x) => (
					<mesh key={x} position={[x, 1.1, -0.45]} rotation={[-0.25, 0, 0]} material={mats.trim}>
						<boxGeometry args={[0.5, 0.62, 0.14]} />
					</mesh>
				))}
				<mesh position={[0, 0.9, -0.4]} material={mats.trim}>
					<boxGeometry args={[1.5, 0.05, 2.0]} />
				</mesh>
			</group>
			{/* lower intake */}
			<mesh position={[0, 0.39, 2.28]} material={mats.trim}>
				<boxGeometry args={[1.15, 0.16, 0.06]} />
			</mesh>
			<mesh position={[0, 0.46, 2.32]} material={mats.chrome}>
				<boxGeometry args={[0.9, 0.008, 0.02]} />
			</mesh>
			{/* wheel arch liners */}
			{[WHEELS.front, WHEELS.rear].map((z) => (
				<mesh key={z} position={[0, WHEELS.r, z]} rotation={[0, 0, Math.PI / 2]} material={mats.liner}>
					<cylinderGeometry args={[0.47, 0.47, 1.9, 40, 1, true, -Math.PI / 2, Math.PI]} />
				</mesh>
			))}
			{[WHEELS.front, WHEELS.rear].flatMap((z) => [wheel(z, 1), wheel(z, -1)])}
			{headlights > 0.05 && (
				<>
					<sprite material={mats.glowSprite} position={[0.8, 0.7, 2.05]} scale={[0.5 * headlights, 0.22 * headlights, 1]} />
					<sprite material={mats.glowSprite} position={[-0.8, 0.7, 2.05]} scale={[0.5 * headlights, 0.22 * headlights, 1]} />
				</>
			)}
		</group>
	);
};

/** Dark reflective studio floor with soft contact shadow */
export const StudioFloor: React.FC<{color?: string}> = ({color = '#05080d'}) => {
	const shadow = useMemo(() => {
		const cv = document.createElement('canvas');
		cv.width = cv.height = 256;
		const c = cv.getContext('2d')!;
		const g = c.createRadialGradient(128, 128, 10, 128, 128, 128);
		g.addColorStop(0, 'rgba(0,0,0,0.95)');
		g.addColorStop(0.55, 'rgba(0,0,0,0.6)');
		g.addColorStop(1, 'rgba(0,0,0,0)');
		c.fillStyle = g;
		c.fillRect(0, 0, 256, 256);
		return new THREE.CanvasTexture(cv);
	}, []);
	return (
		<group>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
				<planeGeometry args={[80, 80]} />
				<meshPhysicalMaterial color={color} roughness={0.32} metalness={0.6} clearcoat={0.5} clearcoatRoughness={0.2} />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, -0.05]}>
				<planeGeometry args={[2.9, 6.0]} />
				<meshBasicMaterial map={shadow} transparent depthWrite={false} />
			</mesh>
		</group>
	);
};

/** Point + frame on the windshield surface. u: 0→1 across (left→right as seen from front), v: 0 (base) → 1 (top). */
export const wsFrame = (u: number, v: number, lift = 0) => {
	const at = (uu: number, vv: number) =>
		cabinPoint(THREE.MathUtils.lerp(WS.z0, WS.z1, vv), THREE.MathUtils.lerp(WS.th1, WS.th0, uu), new THREE.Vector3());
	const p = at(u, v);
	const e = 0.002;
	const tu = at(u + e, v).sub(at(u - e, v)).normalize();
	const tv = at(u, v + e).sub(at(u, v - e)).normalize();
	const n = new THREE.Vector3().crossVectors(tu, tv).normalize();
	if (n.y < 0) n.negate();
	p.addScaledVector(n, lift);
	return {p, n, tu, tv};
};

/** quaternion that maps local X→tu, Y→n, Z→tv (object lying on the glass) */
export const surfaceQuat = (tu: THREE.Vector3, n: THREE.Vector3) => {
	const z = new THREE.Vector3().crossVectors(tu, n).normalize();
	const m = new THREE.Matrix4().makeBasis(tu, n, z);
	return new THREE.Quaternion().setFromRotationMatrix(m);
};
