import React, {useMemo} from 'react';
import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 * Isolated automotive windshield panel (no vehicle).
 * Rounded trapezoid, cylindrical bow + slight vertical curvature,
 * 5.5 mm laminated thickness, green-tinted edges and the black
 * ceramic "frit" border with its half-tone dot fade.
 * Geometry is baked in world space: centred at the origin, facing +Z,
 * top leaning back like an installed windshield.
 * ------------------------------------------------------------------ */

export const PANEL = {wBottom: 1.56, wTop: 1.24, h: 0.88, bow: 0.075, bowV: 0.025, thick: 0.0055, tilt: -0.32};
const N_SE = 9; // superellipse exponent → corner roundness

const tilt = new THREE.Matrix4().makeRotationX(PANEL.tilt);

/** square param (u,v ∈ [-1,1]) → squircle → trapezoid → curved surface (local, before tilt) */
const local = (u: number, v: number, offset = 0) => {
	const s = Math.max(Math.abs(u), Math.abs(v));
	let x = 0;
	let y = 0;
	if (s > 1e-6) {
		const th = Math.atan2(v, u);
		const c = Math.abs(Math.cos(th));
		const sn = Math.abs(Math.sin(th));
		const r = Math.pow(Math.pow(c, N_SE) + Math.pow(sn, N_SE), -1 / N_SE);
		x = s * r * Math.cos(th);
		y = s * r * Math.sin(th);
	}
	const yy = (y * PANEL.h) / 2;
	const hw = THREE.MathUtils.lerp(PANEL.wBottom, PANEL.wTop, (y + 1) / 2) / 2;
	const xx = x * hw;
	const z = -PANEL.bow * Math.pow(xx / (PANEL.wBottom / 2), 2) - PANEL.bowV * Math.pow(yy / (PANEL.h / 2), 2);
	return new THREE.Vector3(xx, yy, z + offset);
};

/** world point + frame on the outer surface */
export const panelFrame = (u: number, v: number, lift = 0) => {
	const e = 0.002;
	const at = (a: number, b: number) => local(a, b).applyMatrix4(tilt);
	const p = at(u, v);
	const tu = at(u + e, v).sub(at(u - e, v)).normalize();
	const tv = at(u, v + e).sub(at(u, v - e)).normalize();
	const n = new THREE.Vector3().crossVectors(tu, tv).normalize();
	if (n.z < 0) n.negate();
	p.addScaledVector(n, lift);
	return {p, n, tu, tv};
};

/** quaternion: local X→tu, Y→n, Z→ tu×n (object lying on the surface) */
export const surfaceQuat = (tu: THREE.Vector3, n: THREE.Vector3) => {
	const z = new THREE.Vector3().crossVectors(tu, n).normalize();
	return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(tu, n, z));
};

/** grid surface over the squircle; attribute `ring` = 0 centre … 1 edge */
export const surfaceGeometry = (offset: number, seg = 140, outward = true) => {
	const pos: number[] = [];
	const uv: number[] = [];
	const ring: number[] = [];
	const idx: number[] = [];
	for (let j = 0; j <= seg; j++) {
		for (let i = 0; i <= seg; i++) {
			const u = (i / seg) * 2 - 1;
			const v = (j / seg) * 2 - 1;
			const p = local(u, v, offset).applyMatrix4(tilt);
			pos.push(p.x, p.y, p.z);
			uv.push(i / seg, j / seg);
			ring.push(Math.max(Math.abs(u), Math.abs(v)));
		}
	}
	const row = seg + 1;
	for (let j = 0; j < seg; j++) {
		for (let i = 0; i < seg; i++) {
			const a = j * row + i;
			const b = a + 1;
			const c = a + row;
			const d = c + 1;
			if (outward) idx.push(a, b, c, b, d, c);
			else idx.push(a, c, b, b, c, d);
		}
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
	g.setAttribute('ring', new THREE.Float32BufferAttribute(ring, 1));
	g.setIndex(idx);
	g.computeVertexNormals();
	return g;
};

/** side band joining the front and back boundary */
export const edgeGeometry = (z0: number, z1: number, n = 480) => {
	const pos: number[] = [];
	const idx: number[] = [];
	const boundary = (k: number) => {
		const t = (k / n) * 4;
		const side = Math.floor(t) % 4;
		const f = t - Math.floor(t);
		const m = f * 2 - 1;
		if (side === 0) return [1, m];
		if (side === 1) return [-m, 1];
		if (side === 2) return [-1, -m];
		return [m, -1];
	};
	for (let k = 0; k <= n; k++) {
		const [u, v] = boundary(k);
		const a = local(u, v, z0).applyMatrix4(tilt);
		const b = local(u, v, z1).applyMatrix4(tilt);
		pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
	}
	for (let k = 0; k < n; k++) {
		const a = k * 2;
		idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	g.setIndex(idx);
	g.computeVertexNormals();
	return g;
};

const fritFrag = `
varying float vRing; varying vec2 vUv;
void main(){
	// solid black band at the edge, half-tone dot fade inward (real windshield frit)
	float solid = smoothstep(0.935, 0.945, vRing);
	vec2 g = vUv * vec2(170.0, 120.0);
	vec2 cell = fract(g) - 0.5;
	float fade = smoothstep(0.86, 0.94, vRing);
	float dotR = 0.5 * sqrt(fade);
	float dots = 1.0 - smoothstep(dotR - 0.06, dotR, length(cell));
	float a = max(solid, dots * step(0.86, vRing));
	if (a < 0.5) discard;
	gl_FragColor = vec4(vec3(0.012, 0.014, 0.018), 1.0);
}`;

export const WindshieldPanel: React.FC<{glassOpacity?: number}> = () => {
	const g = useMemo(
		() => ({
			front: surfaceGeometry(0, 140, true),
			back: surfaceGeometry(-PANEL.thick, 140, false),
			edge: edgeGeometry(-PANEL.thick, 0),
			frit: surfaceGeometry(-PANEL.thick * 0.55, 140, true),
		}),
		[],
	);
	const m = useMemo(
		() => ({
			glass: new THREE.MeshPhysicalMaterial({
				color: '#f2fffb',
				metalness: 0,
				roughness: 0.0,
				transmission: 1,
				thickness: 0.02,
				ior: 1.52,
				attenuationColor: new THREE.Color('#9fe6d2'),
				attenuationDistance: 0.6,
				clearcoat: 1,
				clearcoatRoughness: 0,
				envMapIntensity: 1.7,
				specularIntensity: 1,
				side: THREE.DoubleSide,
			}),
			edge: new THREE.MeshPhysicalMaterial({
				color: '#58b89c',
				roughness: 0.05,
				transmission: 0.4,
				thickness: 0.02,
				clearcoat: 1,
				envMapIntensity: 1.4,
				emissive: new THREE.Color('#0d3a30'),
				emissiveIntensity: 0.6,
				side: THREE.DoubleSide,
			}),
			frit: new THREE.ShaderMaterial({
				// opaque (discard-based) so it is captured by the glass transmission pass
				side: THREE.DoubleSide,
				vertexShader: `attribute float ring; varying float vRing; varying vec2 vUv; void main(){vRing=ring; vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
				fragmentShader: fritFrag,
			}),
		}),
		[],
	);
	return (
		<group>
			<mesh geometry={g.frit} material={m.frit} renderOrder={1} />
			<mesh geometry={g.back} material={m.glass} />
			<mesh geometry={g.front} material={m.glass} />
			<mesh geometry={g.edge} material={m.edge} />
		</group>
	);
};
