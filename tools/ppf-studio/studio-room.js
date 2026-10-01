/*
 * REK PPF Color Studio: the room around the car.
 *
 * A dark architectural wall with two wall-mounted, halo-lit signs made from
 * the official logo files (never redrawn: the image is used as-is on the
 * sign face, its own silhouette gives the sign depth, halo and shadow), a
 * polished floor, and the architectural lights that wash the wall.
 * Everything here is fixed in the room; only the car's turntable rotates.
 */
import {
	Group, Mesh, PlaneGeometry, MeshStandardMaterial, MeshBasicMaterial, CanvasTexture, TextureLoader,
	SRGBColorSpace, RepeatWrapping, AdditiveBlending, Color, SpotLight, Object3D, LinearFilter,
} from 'three';

export const WALL_Z = -5.4;
const WALL_W = 44, WALL_H = 9;

/* Large-format wall panels: subtle tonal variation and shadow-gap joints, as a normal + colour map. */
function wallTextures() {
	const W = 1024, H = 512, PANEL = 256; // one texture = 4 panels of 1.2 m
	const c = document.createElement('canvas'); c.width = W; c.height = H;
	const g = c.getContext('2d');
	g.fillStyle = '#5a5d62'; g.fillRect(0, 0, W, H);
	// very soft mottling, like honed stone composite
	let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	for (let i = 0; i < 2600; i++) {
		const x = rnd() * W, y = rnd() * H, r = 6 + rnd() * 40, a = 0.015 + rnd() * 0.03;
		g.fillStyle = rnd() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
		g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
	}
	// panel joints (vertical) and one horizontal joint
	g.fillStyle = 'rgba(0,0,0,0.55)';
	for (let x = 0; x <= W; x += PANEL) { g.fillRect(x - 2, 0, 4, H); }
	g.fillRect(0, H - 3, W, 3);
	const map = new CanvasTexture(c); map.colorSpace = SRGBColorSpace;

	// normal map: bevels either side of each joint so the grazing wall lights catch them
	const n = document.createElement('canvas'); n.width = W; n.height = H;
	const ng = n.getContext('2d');
	ng.fillStyle = 'rgb(128,128,255)'; ng.fillRect(0, 0, W, H);
	for (let x = 0; x <= W; x += PANEL) {
		ng.fillStyle = 'rgb(88,128,240)'; ng.fillRect(x - 5, 0, 3, H);   // left bevel faces left
		ng.fillStyle = 'rgb(168,128,240)'; ng.fillRect(x + 2, 0, 3, H);  // right bevel faces right
	}
	ng.fillStyle = 'rgb(128,168,240)'; ng.fillRect(0, H - 6, W, 3);
	const normal = new CanvasTexture(n);
	[map, normal].forEach((t) => { t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(WALL_W / 4.8, WALL_H / 2.4); t.anisotropy = 8; });
	return { map, normal };
}

/* Soft silhouette from the logo's own alpha (downscale-upscale blur works everywhere, unlike canvas filters). */
function silhouetteGlow(img, pad, passes) {
	const w = img.width, h = img.height, P = Math.round(w * pad);
	const c = document.createElement('canvas'); c.width = w + P * 2; c.height = h + P * 2;
	const g = c.getContext('2d');
	g.drawImage(img, P, P);
	g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
	let src = c;
	for (let i = 0; i < passes; i++) {
		const s = document.createElement('canvas'); s.width = Math.max(8, src.width >> 3); s.height = Math.max(8, src.height >> 3);
		const sg = s.getContext('2d'); sg.imageSmoothingQuality = 'high'; sg.drawImage(src, 0, 0, s.width, s.height);
		const u = document.createElement('canvas'); u.width = c.width; u.height = c.height;
		const ug = u.getContext('2d'); ug.imageSmoothingQuality = 'high'; ug.drawImage(s, 0, 0, u.width, u.height);
		src = u;
	}
	const t = new CanvasTexture(src); t.colorSpace = SRGBColorSpace; t.minFilter = LinearFilter;
	return { tex: t, scale: c.width / w };
}

/*
 * One wall sign. The face is the exact logo image (proportions locked to the
 * image), mounted 45 mm off the wall on stand-offs; three silhouette layers
 * behind it give the sign physical depth; a halo of warm light spills onto
 * the wall from behind it and a soft shadow falls below it.
 */
function wallSign(img, widthM, { halo = 0xfff0dc, haloStrength = 0.55, faceGlow = 0.42 }) {
	const aspect = img.width / img.height, w = widthM, h = widthM / aspect;
	const group = new Group();
	const map = new CanvasTexture(img); map.colorSpace = SRGBColorSpace; map.anisotropy = 8;
	const geo = new PlaneGeometry(w, h);

	const face = new Mesh(geo, new MeshStandardMaterial({
		map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: faceGlow, roughness: 0.35, metalness: 0.05,
		transparent: true, alphaTest: 0.4, envMapIntensity: 0.6,
	}));
	face.position.z = 0.045; face.renderOrder = 2;
	group.add(face);

	const edgeMat = new MeshStandardMaterial({ map, color: 0x0d0e10, roughness: 0.5, metalness: 0.6, alphaTest: 0.4, transparent: true });
	for (let i = 0; i < 3; i++) {
		const e = new Mesh(geo, edgeMat); e.position.z = 0.012 + i * 0.011; e.renderOrder = 1; group.add(e);
	}

	const glow = silhouetteGlow(img, 0.16, 3);
	const haloMesh = new Mesh(new PlaneGeometry(w * glow.scale, h * (img.height + (glow.scale - 1) * img.width) / img.height),
		new MeshBasicMaterial({ map: glow.tex, color: new Color(halo).multiplyScalar(haloStrength), transparent: true, blending: AdditiveBlending, depthWrite: false }));
	haloMesh.position.z = 0.004; haloMesh.renderOrder = 1;
	group.add(haloMesh);

	const shadow = new Mesh(haloMesh.geometry, new MeshBasicMaterial({ map: glow.tex, color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false }));
	shadow.position.set(0, -0.05, 0.002); shadow.scale.set(0.98, 0.98, 1); shadow.renderOrder = 0;
	group.add(shadow);

	group.userData = { width: w, height: h, face };
	return group;
}

function loadImage(url) {
	return new Promise((resolve, reject) => {
		const img = new Image(); img.crossOrigin = 'anonymous';
		img.onload = () => resolve(img); img.onerror = reject; img.src = url;
	});
}

export async function buildRoom(scene, { logos, tier }) {
	const room = new Group(); room.name = 'room';
	const hi = tier === 'desktop';

	/* Wall */
	const tex = wallTextures();
	const wall = new Mesh(new PlaneGeometry(WALL_W, WALL_H), new MeshStandardMaterial({
		color: 0x2e3135, map: tex.map, normalMap: tex.normal, normalScale: { x: 0.6, y: 0.6 }, roughness: 0.8, metalness: 0, envMapIntensity: 0.32,
	}));
	wall.position.set(0, WALL_H / 2, WALL_Z);
	wall.name = 'wall';
	room.add(wall);

	/* Floor: dark polished resin; near the car it is slightly translucent over the mirrored car, which reads as a reflection. */
	const fc = document.createElement('canvas'); fc.width = fc.height = 256;
	const fg = fc.getContext('2d'); const grd = fg.createRadialGradient(128, 128, 0, 128, 128, 128);
	grd.addColorStop(0, '#d0d0d0'); grd.addColorStop(0.1, '#dcdcdc'); grd.addColorStop(0.16, '#fff'); grd.addColorStop(1, '#fff');
	fg.fillStyle = grd; fg.fillRect(0, 0, 256, 256);
	const floor = new Mesh(new PlaneGeometry(40, 40).rotateX(-Math.PI / 2), new MeshStandardMaterial({
		color: 0x07080a, roughness: 0.3, metalness: 0, transparent: true, alphaMap: new CanvasTexture(fc), envMapIntensity: 0.07, depthWrite: false,
	}));
	floor.position.set(0, 0, 0);
	floor.renderOrder = 1; floor.name = 'floor';
	room.add(floor);

	/* Signs (exact logo files) */
	const [rekImg, flexiImg] = await Promise.all([loadImage(logos.rek), loadImage(logos.flexi)]);
	const rek = wallSign(rekImg, 1.7, { halo: 0xdcecff, haloStrength: 0.5, faceGlow: 0.38 });
	const flexi = wallSign(flexiImg, 2.9, { halo: 0xffe2b8, haloStrength: 0.55, faceGlow: 0.5 });
	rek.name = 'sign-rek'; flexi.name = 'sign-flexishield';
	[rek, flexi].forEach((s) => { s.position.z = WALL_Z; room.add(s); });

	/* Architectural lights: a narrow down-wash above each sign, grazing the wall (they also give the signs their shadow). */
	const spots = [];
	const spot = (x) => {
		const s = new SpotLight(0xfff2e0, hi ? 46 : 40, 11, 0.85, 1, 1.6);
		const t = new Object3D(); s.target = t;
		s.position.set(x, 6.4, WALL_Z + 1.1); t.position.set(x, 1.2, WALL_Z);
		room.add(s, t); spots.push(s);
		return s;
	};
	spot(-2.6); spot(2.6);
	if (hi) { spot(0); spots[2].intensity = 22; }

	/* scene.environment ignores per-material envMapIntensity; give the room its own envMap so those values apply. */
	room.traverse((o) => { if (o.isMesh && o.material.isMeshStandardMaterial) { o.material.envMap = scene.environment; } });
	scene.add(room);
	return { room, wall, floor, rek, flexi, spots };
}

/*
 * Sign layout, chosen from the shape of the visible frame: side by side on
 * wide screens, stacked and centred on tall phones. The signs never move
 * with the car; this only runs on resize.
 */
export function layoutSigns(r, freeAspect) {
	if (freeAspect >= 1.25) {
		r.flexi.position.set(-2.15, 2.55, WALL_Z); r.flexi.scale.setScalar(1);
		r.rek.position.set(2.15, 2.55, WALL_Z); r.rek.scale.setScalar(1);
		r.spots[0].position.x = r.spots[0].target.position.x = -2.15;
		r.spots[1].position.x = r.spots[1].target.position.x = 2.15;
	} else {
		r.rek.position.set(0, 3.2, WALL_Z); r.rek.scale.setScalar(1.05);
		r.flexi.position.set(0, 2.32, WALL_Z); r.flexi.scale.setScalar(1);
		r.spots[0].position.x = r.spots[0].target.position.x = -0.9;
		r.spots[1].position.x = r.spots[1].target.position.x = 0.9;
	}
}
