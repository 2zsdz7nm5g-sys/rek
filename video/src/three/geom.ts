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

/** Bokeh disc (flat-ish with soft rim) */
export const bokehTexture = () =>
	canvasTex(128, 128, (c) => {
		const g = c.createRadialGradient(64, 64, 0, 64, 64, 62);
		g.addColorStop(0, 'rgba(255,255,255,0.75)');
		g.addColorStop(0.82, 'rgba(255,255,255,0.9)');
		g.addColorStop(0.92, 'rgba(255,255,255,0.35)');
		g.addColorStop(1, 'rgba(255,255,255,0)');
		c.fillStyle = g;
		c.fillRect(0, 0, 128, 128);
	});

/** Asphalt with lane dashes, tiles along V. */
export const roadTexture = () => {
	const t = canvasTex(512, 1024, (c) => {
		c.fillStyle = '#121418';
		c.fillRect(0, 0, 512, 1024);
		for (let i = 0; i < 26000; i++) {
			const x = rand(i) * 512;
			const y = rand(i + 7777) * 1024;
			const l = 14 + rand(i + 333) * 34;
			c.fillStyle = `rgb(${l},${l + 1},${l + 4})`;
			c.fillRect(x, y, 1.6, 1.6);
		}
		c.fillStyle = 'rgba(235,238,245,0.85)';
		c.fillRect(250, 80, 12, 420); // dashed centre
		c.fillStyle = 'rgba(235,238,245,0.7)';
		c.fillRect(14, 0, 9, 1024); // edge lines
		c.fillRect(489, 0, 9, 1024);
	});
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	return t;
};

/** Microfibre / brushed panel noise for floors & walls */
export const noiseTexture = (seed = 1, base = 18, amp = 14) => {
	const t = canvasTex(512, 512, (c) => {
		c.fillStyle = `rgb(${base},${base + 2},${base + 6})`;
		c.fillRect(0, 0, 512, 512);
		for (let i = 0; i < 20000; i++) {
			const l = base + (rand(i * seed) - 0.5) * amp;
			c.fillStyle = `rgba(${l},${l + 2},${l + 6},0.5)`;
			c.fillRect(rand(i + seed * 91) * 512, rand(i * 1.3 + seed) * 512, 2, 2);
		}
	});
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	return t;
};
