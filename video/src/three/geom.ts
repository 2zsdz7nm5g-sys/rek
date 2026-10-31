import * as THREE from 'three';
import {rand} from '../lib/anim';

/** Rounded box with dense segments (good for soft-body vertex deformation). */
export const roundedBox = (w: number, h: number, d: number, r: number, seg = [64, 40, 6]) => {
	const g = new THREE.BoxGeometry(w, h, d, seg[0], seg[1], seg[2]);
	const p = g.attributes.position;
	const v = new THREE.Vector3();
	const inner = new THREE.Vector3(w / 2 - r, h / 2 - r, d / 2 - r);
	for (let i = 0; i < p.count; i++) {
		v.fromBufferAttribute(p, i);
		const c = new THREE.Vector3(
			THREE.MathUtils.clamp(v.x, -inner.x, inner.x),
			THREE.MathUtils.clamp(v.y, -inner.y, inner.y),
			THREE.MathUtils.clamp(v.z, -inner.z, inner.z),
		);
		const n = v.clone().sub(c);
		if (n.lengthSq() > 0) {
			n.normalize().multiplyScalar(r);
			v.copy(c.add(n));
		}
		p.setXYZ(i, v.x, v.y, v.z);
	}
	g.computeVertexNormals();
	return g;
};

/** Irregular rock / gravel stone. */
export const rockGeometry = (seed: number, size = 1) => {
	const g = new THREE.IcosahedronGeometry(size, 5);
	const p = g.attributes.position;
	const v = new THREE.Vector3();
	// deterministic lumpy displacement from a few random planes (chipped look)
	const planes = Array.from({length: 9}, (_, k) => {
		const n = new THREE.Vector3(rand(seed + k) - 0.5, rand(seed + k + 50) - 0.5, rand(seed + k + 99) - 0.5).normalize();
		return {n, d: size * (0.55 + rand(seed * 3 + k) * 0.3)};
	});
	for (let i = 0; i < p.count; i++) {
		v.fromBufferAttribute(p, i);
		const dir = v.clone().normalize();
		let len = size * (0.93 + 0.05 * Math.sin(dir.x * 9 + seed) * Math.cos(dir.y * 7 - seed) + 0.02 * Math.sin(dir.x * 41 + dir.y * 37 + dir.z * 29));
		for (const pl of planes) {
			const c = dir.dot(pl.n);
			if (c > 0) len = Math.min(len, pl.d / c);
		}
		v.copy(dir.multiplyScalar(len));
		p.setXYZ(i, v.x * 1.15, v.y * 0.8, v.z);
	}
	g.computeVertexNormals();
	return g;
};

const canvasTex = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
	const cv = document.createElement('canvas');
	cv.width = w;
	cv.height = h;
	const ctx = cv.getContext('2d')!;
	draw(ctx);
	const t = new THREE.CanvasTexture(cv);
	t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 8;
	return t;
};

/** Soft radial glow sprite (for bokeh, headlight glare, energy). */
export const glowTexture = () =>
	canvasTex(256, 256, (c) => {
		const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
		g.addColorStop(0, 'rgba(255,255,255,1)');
		g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
		g.addColorStop(0.6, 'rgba(255,255,255,0.12)');
		g.addColorStop(1, 'rgba(255,255,255,0)');
		c.fillStyle = g;
		c.fillRect(0, 0, 256, 256);
	});

