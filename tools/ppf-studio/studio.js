/*
 * REK PPF Color Studio.
 *
 * The Audi R8 stands on a turntable in a dark studio; the wall and its two
 * illuminated signs are part of the room and never move. Drag turns the
 * car (one finger on phones), the wheel or a pinch zooms. Choosing a PPF
 * colour changes only the `body_color` material (colour and the film's
 * finish), never glass, wheels, tyres, lights, chrome, trim or interior.
 */
import {
	WebGLRenderer, Scene, PerspectiveCamera, ACESFilmicToneMapping, SRGBColorSpace, Color, Vector3, Group, MathUtils,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { studioEnvironment, prepareEmbedded, bakeContactShadow } from './ppf-render.js';
import { buildRoom, layoutSigns, WALL_Z } from './studio-room.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TIER = (window.matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 768) ? 'mobile' : 'desktop';
const PAINT_KEYS = ['roughness', 'metalness', 'clearcoat', 'clearcoatRoughness', 'iridescence'];
const HOME_YAW = MathUtils.degToRad(-38);

function hasWebGL() {
	try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
}

export class Studio {
	constructor(root) {
		this.root = root;
		this.stage = root.querySelector('[data-ppf-stage]');
		this.listeners = {};
		this.anims = new Map();
		this.dirty = true;
		this.visible = true;
		this.yaw = HOME_YAW; this.yawVel = 0;
		this.zoom = 1; this.zoomTarget = 1;
		this.spin = false;
	}
	on(n, f) { (this.listeners[n] = this.listeners[n] || []).push(f); }
	emit(n, d) { (this.listeners[n] || []).forEach((f) => f(d)); }

	async init() {
		const root = this.root, tier = this.tier = root.getAttribute('data-tier') || TIER;
		const r = this.renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
		r.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier === 'desktop' ? 2 : 1.5));
		r.outputColorSpace = SRGBColorSpace;
		r.toneMapping = ACESFilmicToneMapping;
		r.toneMappingExposure = 0.92;
		r.setClearColor(0x07090c, 1);
		r.domElement.className = 'rek-ppf__canvas';
		/* One-finger vertical swipes keep scrolling the page; horizontal drags turn the car; pinch zooms. */
		r.domElement.style.touchAction = 'pan-y';
		this.stage.appendChild(r.domElement);

		const scene = this.scene = new Scene();
		scene.background = new Color(0x07090c);
		scene.environment = studioEnvironment(r);
		this.camera = new PerspectiveCamera(24, 1, 0.1, 80);

		const logos = JSON.parse(root.getAttribute('data-logos'));
		const [room, gltf] = await Promise.all([
			buildRoom(scene, { logos, tier }),
			new GLTFLoader()
				.setDRACOLoader(new DRACOLoader().setDecoderPath(root.getAttribute('data-draco')))
				.setMeshoptDecoder(MeshoptDecoder)
				.loadAsync(root.getAttribute('data-model'), (e) => { if (e.total) { this.emit('progress', e.loaded / e.total); } }),
		]);
		this.room = room;

		/* The turntable carries the car, its contact shadows and its floor reflection. */
		const car = gltf.scene;
		this.paint = prepareEmbedded(car, tier);
		this.original = { color: this.paint.color.clone(), roughness: this.paint.roughness, metalness: this.paint.metalness,
			clearcoat: this.paint.clearcoat, clearcoatRoughness: this.paint.clearcoatRoughness, iridescence: 0, flake: 0, irRange: [280, 820] };
		const table = this.table = new Group();
		table.add(car);
		scene.add(table);
		table.add(bakeContactShadow(r, car, { size: 6, res: tier === 'desktop' ? 1024 : 512, far: 0.35, blur: 1.2, passes: 2, opacity: 0.92, darkness: 1.5 }));
		table.add(bakeContactShadow(r, car, { size: 8, res: 512, far: 1.6, blur: 3, passes: 5, opacity: 0.62, darkness: 1.1 }));
		const reflection = car.clone(); reflection.scale.y = -1; table.add(reflection);
		table.rotation.y = this.yaw;

		this.resize();
		new ResizeObserver(() => this.resize()).observe(this.stage);
		r.compile(scene, this.camera);
		this.bindInput();
		this.observe();
		this.loop();
		this.idle();
		this.emit('ready');
	}

	/*
	 * Framing: the camera looks straight at the wall (so the signs stay square
	 * to the viewer) and is placed as close as possible while the whole car,
	 * at any rotation, and both signs stay inside the visible frame.
	 */
	resize() {
		const w = this.stage.clientWidth, h = this.stage.clientHeight;
		if (!w || !h || !this.renderer) { return; }
		const cam = this.camera, panel = this.root.querySelector('.rek-ppf__panel');
		const overlay = panel && getComputedStyle(panel).position === 'absolute';
		const px = overlay ? panel.offsetWidth + 24 : 0, free = w - px;
		this.renderer.setSize(w, h, false);
		cam.fov = free / h < 0.8 ? 34 : (free / h < 1.25 ? 29 : 24);
		cam.aspect = (w + px) / h;
		const rtl = getComputedStyle(this.root).direction === 'rtl';
		if (px) { cam.setViewOffset(w + px, h, rtl ? px : 0, 0, w, h); } else { cam.clearViewOffset(); }
		cam.updateProjectionMatrix();
		layoutSigns(this.room, free / h);

		// points that must stay in frame: the car's swept footprint (any yaw) and the sign corners
		const pts = [];
		for (let a = 0; a < 16; a++) {
			const t = a / 16 * Math.PI * 2, x = Math.cos(t) * 2.36, z = Math.sin(t) * 2.36;
			pts.push(new Vector3(x, 0, z), new Vector3(x * 0.8, 1.2, z * 0.8));
		}
		[this.room.rek, this.room.flexi].forEach((s) => {
			const hw = s.userData.width * s.scale.x / 2 * 1.05, hh = s.userData.height * s.scale.y / 2 * 1.15;
			[[-hw, -hh], [hw, -hh], [-hw, hh], [hw, hh]].forEach(([dx, dy]) => pts.push(new Vector3(s.position.x + dx, s.position.y + dy, WALL_Z)));
		});
		const sx = free / w; // horizontal share of the frame that is free of the panel
		const lo = rtl || !px ? 0.015 : 1 - sx + 0.015, hi = rtl || !px ? sx - 0.015 : 0.985;
		const extent = (D, ty) => {
			cam.position.set(0, ty + 0.06 * D, D); cam.lookAt(0, ty, 0); cam.updateMatrixWorld();
			let x0 = 1, x1 = 0, y0 = 1, y1 = -1;
			for (const p of pts) { const v = p.clone().project(cam), nx = (v.x + 1) / 2; x0 = Math.min(x0, nx); x1 = Math.max(x1, nx); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
			return { x0, x1, y0, y1 };
		};
		let best = null;
		for (let ty = 0.5; ty <= 2.2; ty += 0.05) {
			for (let D = 5; D <= 24; D += 0.1) {
				const e = extent(D, ty);
				if (e.x0 >= lo && e.x1 <= hi && e.y0 >= -0.95 && e.y1 <= 0.93) { if (!best || D < best.D) { best = { D, ty }; } break; }
			}
		}
		if (best) {
			// centre the composition vertically at that distance (slightly low, like a product shot)
			for (let i = 0; i < 6; i++) { const e = extent(best.D, best.ty); best.ty += ((e.y0 + e.y1) / 2 + 0.02) * best.D * Math.tan(MathUtils.degToRad(cam.fov / 2)) * 0.5; }
		}
		this.frame = best || { D: 14, ty: 1.2 };
		this.applyCamera();
	}

	applyCamera() {
		const { D, ty } = this.frame, d = D * this.zoom;
		this.camera.position.set(0, ty + 0.06 * D - (1 - this.zoom) * 0.35, d);
		this.camera.lookAt(0, ty - (1 - this.zoom) * 0.55, 0);
		this.dirty = true;
	}

	/* ---------- Input: turntable rotation, pinch / wheel zoom, keyboard ---------- */
	bindInput() {
		const el = this.renderer.domElement, ptrs = new Map();
		let pinch0 = 0, zoom0 = 1;
		el.addEventListener('pointerdown', (e) => {
			el.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
			this.active();
			if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = this.zoomTarget; }
		});
		el.addEventListener('pointermove', (e) => {
			const p = ptrs.get(e.pointerId); if (!p) { return; }
			if (ptrs.size === 1) {
				const dx = e.clientX - p.x;
				const k = 5.5 / Math.max(320, el.clientWidth);   // about a full turn across the stage width
				this.yaw += dx * k; this.yawVel = dx * k; this.dirty = true;
			}
			p.x = e.clientX; p.y = e.clientY;
			if (ptrs.size === 2 && pinch0) {
				const [a, b] = [...ptrs.values()];
				this.setZoom(zoom0 * pinch0 / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)));
			}
		});
		const up = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) { pinch0 = 0; } if (!ptrs.size) { this.idle(); } };
		el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
		el.addEventListener('wheel', (e) => { e.preventDefault(); this.active(); this.setZoom(this.zoomTarget * Math.exp(e.deltaY * 0.0012)); this.idle(); }, { passive: false });
		this.stage.addEventListener('keydown', (e) => {
			const map = { ArrowLeft: () => { this.yaw -= 0.26; }, ArrowRight: () => { this.yaw += 0.26; }, '+': () => this.setZoom(this.zoomTarget * 0.9), '=': () => this.setZoom(this.zoomTarget * 0.9), '-': () => this.setZoom(this.zoomTarget * 1.1) };
			if (map[e.key]) { e.preventDefault(); this.active(); map[e.key](); this.yawVel = 0; this.dirty = true; this.idle(); }
		});
	}
	setZoom(z) { this.zoomTarget = MathUtils.clamp(z, 0.6, 1.12); this.dirty = true; }
	active() { clearTimeout(this.idleTimer); this.autoSpin = false; }
	idle() {
		clearTimeout(this.idleTimer);
		if (reduceMotion) { return; }
		this.idleTimer = setTimeout(() => { this.autoSpin = true; this.dirty = true; }, 4000);
	}
	toggleSpin() { this.spin = !this.spin; this.active(); if (!this.spin) { this.idle(); } this.dirty = true; return this.spin; }

	resetView() {
		const y0 = this.yaw, y1 = HOME_YAW + Math.round((y0 - HOME_YAW) / (Math.PI * 2)) * Math.PI * 2, z0 = this.zoom;
		this.active(); this.spin = false; this.yawVel = 0; this.zoomTarget = 1;
		if (reduceMotion) { this.yaw = y1; this.zoom = 1; this.applyCamera(); return; }
		this.tween('view', 900, (k) => { this.yaw = y0 + (y1 - y0) * k; this.zoom = this.zoomTarget = z0 + (1 - z0) * k; if (k >= 1) { this.idle(); } });
	}

	/* ---------- Paint ---------- */
	setPaint(c) {
		const p = this.paint;
		const to = c ? { color: new Color(c.hex), flake: c.m.flake || 0, irRange: c.m.irRange || [280, 820], ...c.m } : { ...this.original, color: this.original.color.clone() };
		PAINT_KEYS.forEach((k) => { if (to[k] === undefined) { to[k] = 0; } });
		p.iridescenceThicknessRange = to.irRange;
		const from = { color: p.color.clone(), flake: p.userData.flake.value };
		PAINT_KEYS.forEach((k) => { from[k] = p[k]; });
		const apply = (k) => {
			if (k >= 1) { p.color.copy(to.color); PAINT_KEYS.forEach((key) => { p[key] = to[key]; }); p.userData.flake.value = to.flake; return; }
			p.color.lerpColors(from.color, to.color, k);
			PAINT_KEYS.forEach((key) => { p[key] = from[key] + (to[key] - from[key]) * k; });
			p.userData.flake.value = from.flake + (to.flake - from.flake) * k;
		};
		if (reduceMotion) { apply(1); this.dirty = true; } else { this.tween('paint', 520, apply); }
	}

	tween(ch, ms, step) {
		const t0 = performance.now(), ease = (x) => 1 - Math.pow(1 - x, 3);
		this.anims.set(ch, (now) => { const k = Math.min(1, (now - t0) / ms); step(ease(k)); if (k >= 1) { this.anims.delete(ch); } });
		this.dirty = true;
	}

	observe() {
		new IntersectionObserver((en) => { this.visible = en[0].isIntersecting; if (this.visible) { this.dirty = true; this.loop(); } }).observe(this.stage);
		document.addEventListener('visibilitychange', () => { if (!document.hidden) { this.dirty = true; this.loop(); } });
	}

	loop() {
		if (this.running) { return; }
		this.running = true;
		let last = performance.now();
		const frame = (now) => {
			if (!this.visible || document.hidden) { this.running = false; return; }
			const dt = Math.min(0.05, (now - last) / 1000); last = now;
			const animating = this.anims.size > 0;
			this.anims.forEach((s) => s(now));
			let moved = false;
			if (this.spin || this.autoSpin) { this.yaw += dt * 0.42; moved = true; }
			else if (Math.abs(this.yawVel) > 1e-4 && !reduceMotion) { this.yaw += this.yawVel; this.yawVel *= Math.pow(0.04, dt); moved = true; }
			if (Math.abs(this.zoom - this.zoomTarget) > 1e-4) { this.zoom += (this.zoomTarget - this.zoom) * (reduceMotion ? 1 : 1 - Math.pow(0.0005, dt)); moved = true; }
			if (moved || animating || this.dirty) {
				this.table.rotation.y = this.yaw;
				this.applyCamera();
				this.renderer.render(this.scene, this.camera);
				this.dirty = false;
			}
			requestAnimationFrame(frame);
		};
		requestAnimationFrame(frame);
	}
}

/* ---------- UI ---------- */
function mount(root) {
	const $ = (s) => root.querySelector(s);
	const status = $('[data-ppf-status]'), bar = $('[data-ppf-bar]');
	const colors = JSON.parse($('[data-ppf-colors]').textContent);
	const lang = root.getAttribute('data-lang') === 'en' ? 'en' : 'ar';
	const grid = $('[data-ppf-grid]'), tabs = root.querySelectorAll('[data-ppf-cat]');
	const nameEl = $('[data-ppf-name]'), subEl = $('[data-ppf-sub]'), finishEl = $('[data-ppf-finish]'), dot = $('[data-ppf-dot]'), idEl = $('[data-ppf-id]');
	const cta = $('[data-ppf-order]'), wa = root.getAttribute('data-wa');
	const t = JSON.parse(root.getAttribute('data-i18n'));

	/* Swatches: built once from the colour library. */
	const frag = document.createDocumentFragment();
	colors.forEach((c) => {
		const li = document.createElement('li');
		const b = document.createElement('button');
		b.type = 'button'; b.className = 'rek-ppf__sw rek-ppf__sw--' + c.cat; b.disabled = true;
		b.style.setProperty('--sw', c.hex);
		b.dataset.id = c.id; b.dataset.cat = c.cat;
		b.setAttribute('aria-pressed', 'false');
		b.setAttribute('aria-label', (lang === 'ar' ? c.ar : c.en) + ' · ' + c.finish[lang] + ' (' + c.id + ')');
		b.title = (lang === 'ar' ? c.ar + ' · ' + c.en : c.en) + ' · ' + c.finish[lang];
		li.appendChild(b); frag.appendChild(li);
	});
	grid.appendChild(frag);
	const swatches = grid.querySelectorAll('.rek-ppf__sw');
	const byId = Object.fromEntries(colors.map((c) => [c.id, c]));

	tabs.forEach((tab) => tab.addEventListener('click', () => {
		const cat = tab.getAttribute('data-ppf-cat');
		tabs.forEach((x) => x.setAttribute('aria-selected', x === tab ? 'true' : 'false'));
		swatches.forEach((s) => { s.parentNode.hidden = !(cat === 'all' || s.dataset.cat === cat); });
		grid.scrollTop = 0;
	}));

	let selected = null;
	const show = (c) => {
		swatches.forEach((s) => s.setAttribute('aria-pressed', c && s.dataset.id === c.id ? 'true' : 'false'));
		if (c) {
			nameEl.textContent = lang === 'ar' ? c.ar : c.en;
			subEl.textContent = lang === 'ar' ? c.en : '';
			finishEl.textContent = c.finish[lang] + (lang === 'ar' ? ' · ' + c.finish.en : '');
			idEl.textContent = c.id;
			dot.style.background = c.hex;
			dot.className = 'rek-ppf__dot rek-ppf__dot--' + c.cat;
			const msg = 'REK PPF COLOR STUDIO\n\nSelected Color: ' + c.en + ' (' + c.id + ')\nFinish: ' + c.finish.en;
			cta.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(msg);
			cta.removeAttribute('aria-disabled'); cta.classList.remove('is-disabled');
		} else {
			nameEl.textContent = t.original; subEl.textContent = ''; finishEl.textContent = t.originalFinish; idEl.textContent = '';
			dot.style.background = '#c80b2c'; dot.className = 'rek-ppf__dot';
			cta.removeAttribute('href'); cta.setAttribute('aria-disabled', 'true'); cta.classList.add('is-disabled');
		}
	};
	show(null);

	if (!hasWebGL()) { root.classList.add('is-fallback'); status.textContent = status.getAttribute('data-nowebgl'); return; }
	const studio = new Studio(root);
	root.__ppf = studio;
	studio.on('progress', (k) => { bar.style.transform = 'scaleX(' + k.toFixed(3) + ')'; });
	studio.on('ready', () => {
		root.classList.add('is-ready');
		root.querySelectorAll('.rek-ppf__sw, [data-ppf-action]').forEach((b) => { b.disabled = false; });
	});
	grid.addEventListener('click', (e) => {
		const b = e.target.closest('.rek-ppf__sw'); if (!b || b.disabled) { return; }
		selected = byId[b.dataset.id]; studio.setPaint(selected); show(selected);
	});
	cta.addEventListener('click', (e) => { if (!selected) { e.preventDefault(); grid.focus(); } });
	const act = {
		original: () => { selected = null; studio.setPaint(null); show(null); },
		reset: () => { selected = null; studio.setPaint(null); show(null); studio.resetView(); },
		spin: (b) => { b.setAttribute('aria-pressed', studio.toggleSpin() ? 'true' : 'false'); },
		zoomin: () => { studio.active(); studio.setZoom(studio.zoomTarget * 0.85); studio.idle(); },
		zoomout: () => { studio.active(); studio.setZoom(studio.zoomTarget / 0.85); studio.idle(); },
	};
	root.querySelectorAll('[data-ppf-action]').forEach((b) => b.addEventListener('click', () => act[b.getAttribute('data-ppf-action')](b)));

	const go = () => studio.init().catch((err) => {
		root.classList.add('is-fallback'); status.textContent = status.getAttribute('data-error');
		if (window.console) { console.error(err); }
	});
	const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { io.disconnect(); go(); } }, { rootMargin: '300px 0px' });
	io.observe(root);
}

document.querySelectorAll('[data-rek-ppf]').forEach(mount);
