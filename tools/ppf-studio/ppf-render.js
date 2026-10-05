/*
 * REK PPF Color Studio: photographic rendering.
 *
 * Everything here is procedural, so the model stays the same 467 KB file:
 * - studioEnvironment(): an HDR studio (overhead softbox, strip lights, rim,
 *   fill) turned into reflections with PMREM;
 * - materials(): automotive PBR materials, replacing the GLB's simple ones
 *   by mesh name; only `body_paint` is ever recoloured;
 * - bakeContactShadow(): real soft shadows rendered from the car's own
 *   geometry (depth from below, blurred), computed once;
 * - studioFloor(): a dark polished floor over a mirrored copy of the car.
 */
import {
	Scene, Mesh, BoxGeometry, PlaneGeometry, CircleGeometry, MeshBasicMaterial, MeshPhysicalMaterial,
	MeshDepthMaterial, BackSide, DoubleSide, Color, PMREMGenerator, WebGLRenderTarget, OrthographicCamera,
	ShaderMaterial, CanvasTexture, SRGBColorSpace, HalfFloatType,
} from 'three';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader.js';

/* ---------- Studio lighting, as reflections ---------- */
export function studioEnvironment(renderer) {
	const s = new Scene();
	const room = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: 0x07090c, side: BackSide }));
	room.scale.set(44, 18, 44);
	room.position.y = 8;
	s.add(room);
	// Studio floor bounce: lower body panels and wheels pick up some light, as on a real cyclorama floor.
	const floor = new Mesh(new PlaneGeometry(44, 44).rotateX(-Math.PI / 2), new MeshBasicMaterial({ color: new Color(0x2a2f36).multiplyScalar(0.55) }));
	s.add(floor);
	const panel = (w, h, intensity, pos, target, tint) => {
		const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(tint || 0xffffff).multiplyScalar(intensity), side: DoubleSide }));
		m.position.set(pos[0], pos[1], pos[2]);
		m.lookAt(target[0], target[1], target[2]);
		s.add(m);
	};
	panel(28, 12, 2.6, [0, 12, 0], [0, 0, 0]);                   // large overhead light ceiling (key): long reflections on roof, hood and glass
	panel(22, 7, 0.32, [-17, 3.5, 0], [0, 1.5, 0]);               // broad, faint side fills for doors and wheels
	panel(22, 7, 0.32, [17, 3.5, 0], [0, 1.5, 0]);
	panel(1.4, 10, 5.0, [-13, 5.5, -1], [0, 1, 0]);               // left strip: long highlight along the body side
	panel(1.4, 10, 5.0, [13, 5.5, 1], [0, 1, 0]);                 // right strip
	panel(14, 2.4, 2.2, [0, 4.5, -15], [0, 1, 0], 0xdfe8ff);       // cool rim light from behind
	panel(12, 3.2, 0.55, [0, 3, 15], [0, 1, 0]);                  // soft frontal fill
	panel(6, 1.2, 1.4, [-9, 0.9, 9], [0, 0.5, 0]);                // low kicker for rocker and wheel detail
	const pm = new PMREMGenerator(renderer);
	const tex = pm.fromScene(s, 0.02).texture;
	pm.dispose();
	return tex;
}

/* ---------- Procedural micro detail (world-space, no UVs needed) ---------- */
function withDetail(mat, key, opts) {
	mat.userData.flake = { value: opts.flake || 0 };
	mat.onBeforeCompile = (sh) => {
		sh.uniforms.uFlake = mat.userData.flake;
		sh.vertexShader = sh.vertexShader
			.replace('#include <common>', '#include <common>\nvarying vec3 vDetailPos;')
			.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvDetailPos = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;');
		sh.fragmentShader = sh.fragmentShader
			.replace('#include <common>', `#include <common>
varying vec3 vDetailPos;
uniform float uFlake;
vec3 detailHash( vec3 p ) { p = fract( p * vec3( .1031, .1030, .0973 ) ); p += dot( p, p.yxz + 33.33 ); return fract( ( p.xxy + p.yxx ) * p.zyx ); }`)
			.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
${opts.roughVar ? `roughnessFactor = clamp( roughnessFactor * ( 1.0 - ${opts.roughVar.toFixed(2)} + 2.0 * ${opts.roughVar.toFixed(2)} * detailHash( floor( vDetailPos * 90.0 ) ).x ), 0.04, 1.0 );` : ''}`)
			.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
if ( uFlake > 0.0 ) { vec3 fr = detailHash( floor( vDetailPos * ${opts.scale || 420}.0 ) ) * 2.0 - 1.0; normal = normalize( normal + fr * uFlake ); }`);
	};
	mat.customProgramCacheKey = () => key;
	return mat;
}

/* PPF finishes: the film's surface over the paint, not just a colour. */
/*
 * Model prepared from r8.fbx: its PBR materials are embedded in the GLB. Only
 * runtime touches are added here: paint flakes / colour-shift capability on
 * `body_color`, rubber micro detail on `tyre`, and cheaper glass on phones.
 */
export function prepareEmbedded(car, tier) {
	let paint = null;
	car.traverse((o) => {
		if (!o.isMesh) { return; }
		const m = o.material;
		if (o.name === 'body_color') {
			withDetail(m, 'rek-paint', { flake: 0, scale: 900 });
			m.iridescenceIOR = 1.8; m.iridescenceThicknessRange = [280, 820];
			paint = m;
		}
		if (o.name === 'tyre') { withDetail(m, 'rek-tire', { flake: 0.05, scale: 380, roughVar: 0.12 }); }
		if (m.transmission > 0 && tier !== 'desktop') {
			m.transmission = 0; m.transparent = true; m.depthWrite = false;
			m.opacity = o.name === 'glass_window' ? 0.86 : 0.22;
		}
		if (m.transmission > 0 || m.transparent) { o.renderOrder = 3; }
	});
	return paint;
}

export const FINISHES = {
	gloss:    { roughness: 0.3,  metalness: 0.0,  clearcoat: 1.0, clearcoatRoughness: 0.012, flake: 0.0,  iridescence: 0 },
	satin:    { roughness: 0.42, metalness: 0.08, clearcoat: 1.0, clearcoatRoughness: 0.3,   flake: 0.0,  iridescence: 0 },
	matte:    { roughness: 0.62, metalness: 0.0,  clearcoat: 1.0, clearcoatRoughness: 0.62,  flake: 0.0,  iridescence: 0 },
	metallic: { roughness: 0.36, metalness: 0.62, clearcoat: 1.0, clearcoatRoughness: 0.015, flake: 0.045, iridescence: 0 },
	special:  { roughness: 0.3,  metalness: 0.55, clearcoat: 1.0, clearcoatRoughness: 0.015, flake: 0.035, iridescence: 1 },
};

/* ---------- Automotive materials, by mesh name ---------- */
export function materials(tier) {
	const hi = tier === 'desktop';
	const glass = (tint, opacity, rough) => hi
		? new MeshPhysicalMaterial({ color: tint, metalness: 0, roughness: rough, transmission: 1, thickness: 0.006, ior: 1.52, specularIntensity: 1, envMapIntensity: 1.25, side: DoubleSide })
		: new MeshPhysicalMaterial({ color: tint, metalness: 0, roughness: rough, transparent: true, opacity, ior: 1.52, specularIntensity: 1, envMapIntensity: 1.3, side: DoubleSide, depthWrite: false });
	const paint = withDetail(new MeshPhysicalMaterial({
		color: 0xc80b2c, side: DoubleSide, specularIntensity: 1, envMapIntensity: 1,
		iridescenceIOR: 1.8, iridescenceThicknessRange: [280, 820],
	}), 'rek-paint', { flake: 0, scale: 900 });
	Object.assign(paint, FINISHES.gloss);
	return {
		body_paint: paint,
		/* Dark-tinted laminated glass: strong reflections, interior visible through it. */
		glass: glass(new Color(0x161a1e), 0.86, 0.012),
		headlights: glass(new Color(0xf2f6fa), 0.16, 0.01),
		taillight_lens: glass(new Color(0xc4241e), 0.5, 0.02),
		/* Taillight internals: deep red reflectors with a faint glow, not flat red. */
		taillights: new MeshPhysicalMaterial({ color: 0xa00808, roughness: 0.2, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04, emissive: 0x6a0000, emissiveIntensity: 0.8, side: DoubleSide }),
		tires: withDetail(new MeshPhysicalMaterial({ color: 0x141414, roughness: 0.86, metalness: 0, specularIntensity: 0.32, side: DoubleSide }), 'rek-tire', { flake: 0.05, scale: 380, roughVar: 0.12 }),
		/* Silver-painted forged aluminium with a clear lacquer. */
		rims: new MeshPhysicalMaterial({ color: 0xc9cbce, roughness: 0.24, metalness: 0.95, clearcoat: 0.6, clearcoatRoughness: 0.08, side: DoubleSide }),
		brakes: withDetail(new MeshPhysicalMaterial({ color: 0x6d7074, roughness: 0.42, metalness: 0.9, side: DoubleSide }), 'rek-brake', { roughVar: 0.18 }),
		chrome: new MeshPhysicalMaterial({ color: 0xf2f3f5, roughness: 0.05, metalness: 1, side: DoubleSide }),
		/* Gloss piano-black trim (wing, blades, window surrounds). */
		black_trim: new MeshPhysicalMaterial({ color: 0x0b0c0e, roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, side: DoubleSide }),
		grille: withDetail(new MeshPhysicalMaterial({ color: 0x08090a, roughness: 0.55, metalness: 0.15, side: DoubleSide }), 'rek-grille', { roughVar: 0.15 }),
		interior: new MeshPhysicalMaterial({ color: 0x3c3a37, roughness: 0.58, metalness: 0, sheen: 0.4, sheenRoughness: 0.6, sheenColor: 0xffffff, side: DoubleSide }),
		interior_dark: new MeshPhysicalMaterial({ color: 0x0e0f10, roughness: 0.7, metalness: 0, side: DoubleSide }),
		mechanical: new MeshPhysicalMaterial({ color: 0x2c2f33, roughness: 0.5, metalness: 0.8, side: DoubleSide }),
	};
}

/* ---------- Contact shadow from the car's own geometry ---------- */
export function bakeContactShadow(renderer, car, { size = 7, res = 512, far = 1.2, blur = 2, passes = 4, opacity = 0.8, darkness = 1.2 }) {
	const opts = { type: HalfFloatType };
	const rt = new WebGLRenderTarget(res, res, opts), rtb = new WebGLRenderTarget(res, res, opts);
	rt.texture.generateMipmaps = rtb.texture.generateMipmaps = false;
	const cam = new OrthographicCamera(-size / 2, size / 2, size / 2, -size / 2, 0, far);
	cam.rotation.x = Math.PI / 2; // look straight up from the floor
	const depth = new MeshDepthMaterial({ side: DoubleSide });
	depth.onBeforeCompile = (sh) => {
		sh.uniforms.uDark = { value: darkness };
		sh.fragmentShader = 'uniform float uDark;\n' + sh.fragmentShader.replace(
			'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
			'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * uDark );');
	};
	const tmp = new Scene();
	tmp.overrideMaterial = depth;
	const parent = car.parent;
	tmp.add(car);
	const prevTarget = renderer.getRenderTarget();
	const prevClear = renderer.getClearColor(new Color()), prevAlpha = renderer.getClearAlpha();
	renderer.setClearColor(0x000000, 0);
	renderer.setRenderTarget(rt);
	renderer.clear();
	renderer.render(tmp, cam);
	parent.add(car);

	const h = new ShaderMaterial(HorizontalBlurShader), v = new ShaderMaterial(VerticalBlurShader);
	h.depthTest = v.depthTest = false;
	const quad = new FullScreenQuad(h);
	for (let i = 0; i < passes; i++) {
		const amt = blur * (1 + i * 0.6);
		quad.material = h; h.uniforms.tDiffuse.value = rt.texture; h.uniforms.h.value = amt / res;
		renderer.setRenderTarget(rtb); renderer.clear(); quad.render(renderer);
		quad.material = v; v.uniforms.tDiffuse.value = rtb.texture; v.uniforms.v.value = amt / res;
		renderer.setRenderTarget(rt); renderer.clear(); quad.render(renderer);
	}
	quad.dispose(); h.dispose(); v.dispose(); rtb.dispose(); depth.dispose();
	renderer.setRenderTarget(prevTarget);
	renderer.setClearColor(prevClear, prevAlpha);

	const plane = new Mesh(new PlaneGeometry(size, size).rotateX(Math.PI / 2),
		new MeshBasicMaterial({ map: rt.texture, transparent: true, opacity, depthWrite: false, side: DoubleSide }));
	plane.renderOrder = 2;
	return plane;
}

/* ---------- Polished studio floor over a mirrored copy of the car ---------- */
export function studioFloor() {
	const cv = document.createElement('canvas');
	cv.width = cv.height = 512;
	const g = cv.getContext('2d');
	const grd = g.createRadialGradient(256, 256, 0, 256, 256, 256);
	// Centre: the overhead softbox pools light under the car; the reflection shows through faintly.
	grd.addColorStop(0, 'rgba(20,26,33,0.915)');
	grd.addColorStop(0.24, 'rgba(12,16,21,0.95)');
	grd.addColorStop(0.5, 'rgba(7,10,14,0.99)');
	grd.addColorStop(1, 'rgba(5,8,11,0)');
	g.fillStyle = grd;
	g.fillRect(0, 0, 512, 512);
	const tex = new CanvasTexture(cv);
	tex.colorSpace = SRGBColorSpace;
	const floor = new Mesh(new CircleGeometry(13, 96).rotateX(-Math.PI / 2),
		new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
	floor.renderOrder = 1;
	return floor;
}
