/*
 * REK PPF Color Studio: 3D viewer (preview build).
 *
 * Mounts on [data-rek-ppf]. Three.js and the model are only fetched when the
 * studio comes near the viewport. Only the `body_paint` material is ever
 * changed; every other part of the car keeps its own material.
 */
import {
	WebGLRenderer, Scene, PerspectiveCamera, AgXToneMapping, ACESFilmicToneMapping, NeutralToneMapping, SRGBColorSpace,
	Color, Vector3, MathUtils,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { studioEnvironment, materials, prepareEmbedded, bakeContactShadow, studioFloor, FINISHES } from './ppf-render.js';

export { FINISHES };
const PAINT_KEYS = ['roughness', 'metalness', 'clearcoat', 'clearcoatRoughness', 'iridescence'];

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Quality tier: desktop gets glass transmission, higher resolution and finer shadows. */
const TIER = (window.matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 768) ? 'mobile' : 'desktop';

function hasWebGL() {
	try {
		const c = document.createElement('canvas');
		return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
	} catch (e) { return false; }
}

export class PPFStudio {
	constructor(root) {
		this.root = root;
		this.stage = root.querySelector('[data-ppf-stage]');
		this.listeners = {};
		this.dirty = true;
		this.anims = new Map(); // one running animation per channel: 'camera', 'paint'
		this.visible = true;
	}

	on(name, fn) { (this.listeners[name] = this.listeners[name] || []).push(fn); }
	emit(name, data) { (this.listeners[name] || []).forEach((fn) => fn(data)); }

	async init(src) {
		const stage = this.stage;
		const tier = this.tier = this.root.getAttribute('data-tier') || TIER;
		const dpr = Math.min(window.devicePixelRatio || 1, tier === 'desktop' ? 2 : 1.5);

		const r = this.renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
		r.setPixelRatio(dpr);
		r.outputColorSpace = SRGBColorSpace;
		const tone = this.root.getAttribute('data-tone') || 'aces';
		r.toneMapping = { agx: AgXToneMapping, aces: ACESFilmicToneMapping, neutral: NeutralToneMapping }[tone];
		r.toneMappingExposure = parseFloat(this.root.getAttribute('data-exposure') || '0.9');
		r.domElement.className = 'rek-ppf__canvas';
		stage.appendChild(r.domElement);

		const scene = this.scene = new Scene();
		scene.environment = studioEnvironment(r);

		const cam = this.camera = new PerspectiveCamera(30, 1, 0.1, 60);
		const ctl = this.controls = new OrbitControls(cam, r.domElement);
		ctl.target.set(0, 0.52, 0);
		ctl.enableDamping = !reduceMotion;
		ctl.dampingFactor = 0.075;
		ctl.enablePan = false;
		ctl.rotateSpeed = 0.75;
		ctl.zoomSpeed = 0.8;
		ctl.minDistance = 4.4;
		ctl.maxDistance = 9.5;
		ctl.minPolarAngle = MathUtils.degToRad(45);
		ctl.maxPolarAngle = MathUtils.degToRad(87);
		ctl.autoRotateSpeed = 0.55;
		/* One-finger vertical swipes keep scrolling the page; horizontal drags turn the car; pinch zooms. */
		r.domElement.style.touchAction = 'pan-y';
		ctl.addEventListener('change', () => { this.dirty = true; });
		ctl.addEventListener('start', () => this.userActive());
		ctl.addEventListener('end', () => this.userIdle());

		this.resize();
		new ResizeObserver(() => this.resize()).observe(stage);

		const draco = new DRACOLoader().setDecoderPath(this.root.getAttribute('data-draco') || 'draco/');
		const t0 = performance.now();
		const gltf = await new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder).loadAsync(src, (e) => {
			if (e.total) { this.emit('progress', e.loaded / e.total); }
		});
		this.loadMs = performance.now() - t0;
		const car = gltf.scene;
		let paintMat = prepareEmbedded(car, tier);
		if (!paintMat) {
			/* Earlier model without embedded PBR materials: assign them by mesh name. */
			const mats = materials(tier);
			car.traverse((o) => {
				if (o.isMesh && mats[o.name]) {
					o.material.dispose();
					o.material = mats[o.name];
					if (o.material.transparent) { o.renderOrder = 3; }
				}
			});
			paintMat = mats.body_paint;
		}
		scene.add(car);
		this.paint = paintMat;
		this.original = { color: this.paint.color.clone(), flake: 0, ...FINISHES.gloss };
		/* Soft shadows from the car's own geometry: a tight one at the tyres, a broad one under the body. */
		scene.add(bakeContactShadow(r, car, { size: 6, res: tier === 'desktop' ? 1024 : 512, far: 0.35, blur: 1.2, passes: 2, opacity: 0.92, darkness: 1.5 }));
		scene.add(bakeContactShadow(r, car, { size: 8, res: 512, far: 1.6, blur: 3, passes: 5, opacity: 0.62, darkness: 1.1 }));
		/* Polished floor: a mirrored copy of the car (same materials) seen faintly through it. */
		const reflection = car.clone();
		reflection.scale.y = -1;
		scene.add(reflection);
		scene.add(studioFloor());
		r.compile(scene, cam);

		/* Opening move: the camera glides in from a wider front angle. */
		const end = this.homePosition();
		if (reduceMotion) {
			cam.position.copy(end);
		} else {
			const start = new Vector3(7.8, 1.1, 2.2).setLength(this.fit * 1.2).add(ctl.target);
			cam.position.copy(start);
			this.tween('camera', 1700, (k) => { cam.position.lerpVectors(start, end, k); });
		}
		ctl.update();

		this.bindKeys();
		this.observe();
		this.loop();
		this.userIdle();
		this.emit('ready');
	}

	/*
	 * Fit the car to the stage. When the control panel floats over the stage
	 * (desktop sidebar), the view is offset so the car centres in the free
	 * space beside it, and the camera distance is chosen so the whole car
	 * (about 4.4 m long, 1.2 m high) fits with a margin on any screen shape.
	 */
	resize() {
		const w = this.stage.clientWidth, h = this.stage.clientHeight;
		if (!w || !h || !this.renderer) { return; }
		const cam = this.camera, ctl = this.controls;
		const panel = this.root.querySelector('.rek-ppf__panel');
		const overlay = panel && getComputedStyle(panel).position === 'absolute';
		const px = overlay ? panel.offsetWidth + 24 : 0;
		const free = w - px;
		this.renderer.setSize(w, h, false);
		/* Automotive photography lens: about 60 mm on wide screens, wider only on tall phones. */
		cam.fov = free / h < 0.85 ? 34 : (free / h < 1.25 ? 28 : 22);
		cam.aspect = (w + px) / h;
		const rtl = getComputedStyle(this.root).direction === 'rtl';
		if (px) { cam.setViewOffset(w + px, h, rtl ? px : 0, 0, w, h); } else { cam.clearViewOffset(); }
		cam.updateProjectionMatrix();
		const tv = Math.tan(MathUtils.degToRad(cam.fov / 2));
		const fit = Math.max(2.3 / (tv * free / h), 1.9 / tv);
		const old = this.fit;
		this.fit = fit;
		ctl.minDistance = fit * 0.6;
		ctl.maxDistance = fit * 1.4;
		if (old && this.paint) {
			/* Keep the same framing when the stage changes size. */
			const off = cam.position.clone().sub(ctl.target).multiplyScalar(fit / old);
			cam.position.copy(ctl.target).add(off);
			ctl.update();
		}
		this.dirty = true;
	}

	homePosition() {
		return new Vector3(4.6, 0.62, 5.1).setLength(this.fit).add(this.controls.target);
	}

	/* Slow turntable after a few idle seconds; never with reduced motion. */
	userActive() { clearTimeout(this.idleTimer); this.controls.autoRotate = false; }
	userIdle() {
		clearTimeout(this.idleTimer);
		if (reduceMotion) { return; }
		this.idleTimer = setTimeout(() => { this.controls.autoRotate = true; this.dirty = true; }, 3500);
	}

	/* Time-based easing, so the result is the same at any frame rate. */
	tween(channel, ms, step) {
		const t0 = performance.now();
		const ease = (x) => 1 - Math.pow(1 - x, 3);
		this.anims.set(channel, (now) => {
			const k = Math.min(1, (now - t0) / ms);
			step(ease(k));
			if (k >= 1) { this.anims.delete(channel); }
		});
		this.dirty = true;
	}

	/* Only the body paint: colour fades, and the film's finish (gloss, satin, matte, metallic flake, colour shift) changes with it. */
	setPaint(hex, finishKey) {
		const p = this.paint;
		const f = finishKey === 'original' ? this.original : FINISHES[finishKey || 'gloss'];
		const to = { color: hex ? new Color(hex) : this.original.color.clone(), ...f };
		const from = { color: p.color.clone(), flake: p.userData.flake.value };
		PAINT_KEYS.forEach((key) => { from[key] = p[key]; });
		const apply = (k) => {
			if (k >= 1) {
				/* Land exactly on the target, so Original/Reset restores the paint bit for bit. */
				p.color.copy(to.color);
				PAINT_KEYS.forEach((key) => { p[key] = to[key]; });
				p.userData.flake.value = to.flake;
				return;
			}
			p.color.lerpColors(from.color, to.color, k);
			PAINT_KEYS.forEach((key) => { p[key] = from[key] + (to[key] - from[key]) * k; });
			p.userData.flake.value = from.flake + (to.flake - from.flake) * k;
		};
		if (reduceMotion) { apply(1); this.dirty = true; } else { this.tween('paint', 450, apply); }
	}

	resetView() {
		const cam = this.camera, ctl = this.controls;
		const from = cam.position.clone(), to = this.homePosition();
		if (reduceMotion) { cam.position.copy(to); ctl.update(); this.dirty = true; return; }
		this.tween('camera', 900, (k) => { cam.position.lerpVectors(from, to, k); ctl.update(); });
	}

	/* Keyboard: arrows turn the car, + and - zoom. */
	bindKeys() {
		const el = this.stage;
		el.addEventListener('keydown', (e) => {
			const ctl = this.controls, cam = this.camera;
			const off = cam.position.clone().sub(ctl.target);
			let handled = true;
			if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
				off.applyAxisAngle(new Vector3(0, 1, 0), (e.key === 'ArrowLeft' ? -1 : 1) * MathUtils.degToRad(15));
			} else if (e.key === '+' || e.key === '=') {
				off.multiplyScalar(0.9);
			} else if (e.key === '-' || e.key === '_') {
				off.multiplyScalar(1.1);
			} else { handled = false; }
			if (!handled) { return; }
			e.preventDefault();
			this.userActive();
			const len = MathUtils.clamp(off.length(), ctl.minDistance, ctl.maxDistance);
			cam.position.copy(ctl.target).add(off.setLength(len));
			ctl.update();
			this.dirty = true;
			this.userIdle();
		});
	}

	/* Stop drawing while the studio is off screen or the tab is hidden. */
	observe() {
		new IntersectionObserver((entries) => {
			this.visible = entries[0].isIntersecting;
			if (this.visible) { this.dirty = true; this.loop(); }
		}).observe(this.stage);
		document.addEventListener('visibilitychange', () => { if (!document.hidden) { this.dirty = true; this.loop(); } });
	}

	loop() {
		if (this.running) { return; }
		this.running = true;
		const frame = (now) => {
			if (!this.visible || document.hidden) { this.running = false; return; }
			const animating = this.anims.size > 0;
			this.anims.forEach((step) => step(now));
			const moved = this.controls.update();
			if (moved || this.dirty || animating) {
				this.renderer.render(this.scene, this.camera);
				this.dirty = false;
			}
			requestAnimationFrame(frame);
		};
		requestAnimationFrame(frame);
	}
}

/* ---------- Preview UI ---------- */
function mount(root) {
	const status = root.querySelector('[data-ppf-status]');
	const bar = root.querySelector('[data-ppf-bar]');
	const swatches = root.querySelectorAll('[data-ppf-color]');
	const nameEl = root.querySelector('[data-ppf-name]');
	const finishEl = root.querySelector('[data-ppf-finish]');
	const dot = root.querySelector('[data-ppf-dot]');

	if (!hasWebGL()) {
		root.classList.add('is-fallback');
		status.textContent = status.getAttribute('data-nowebgl');
		return;
	}

	const studio = new PPFStudio(root);
	root.__ppf = studio;
	studio.on('progress', (k) => { bar.style.transform = 'scaleX(' + k.toFixed(3) + ')'; });
	studio.on('ready', () => {
		root.classList.add('is-ready');
		swatches.forEach((b) => { b.disabled = false; });
	});

	/* Colour and finish are chosen independently; only the body paint changes. */
	const current = { hex: null, finish: 'original', label: '', finishLabel: '' };
	const finishBtns = root.querySelectorAll('[data-ppf-setfinish]');
	const apply = () => {
		studio.setPaint(current.hex, current.finish);
		nameEl.textContent = current.label;
		finishEl.textContent = current.finishLabel;
	};
	const markFinish = () => finishBtns.forEach((b) => b.setAttribute('aria-pressed', b.getAttribute('data-ppf-setfinish') === current.finish ? 'true' : 'false'));
	const select = (btn) => {
		swatches.forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
		const hex = btn.getAttribute('data-ppf-color');
		current.hex = hex === 'original' ? null : hex;
		current.finish = btn.getAttribute('data-ppf-finish-key');
		current.label = btn.getAttribute('data-ppf-label');
		current.finishLabel = btn.getAttribute('data-ppf-finish-label');
		dot.style.background = btn.style.getPropertyValue('--sw');
		markFinish(); apply();
	};
	swatches.forEach((b) => b.addEventListener('click', () => select(b)));
	finishBtns.forEach((b) => b.addEventListener('click', () => {
		current.finish = b.getAttribute('data-ppf-setfinish');
		current.finishLabel = b.getAttribute('data-ppf-finish-label');
		markFinish(); apply();
	}));
	studio.on('ready', () => { finishBtns.forEach((b) => { b.disabled = false; }); });
	root.querySelector('[data-ppf-reset]').addEventListener('click', () => {
		select(root.querySelector('[data-ppf-color="original"]'));
		studio.resetView();
	});

	/* Lazy start: only when the studio is about to scroll into view. */
	const go = () => studio.init(root.getAttribute('data-model')).catch(() => {
		root.classList.add('is-fallback');
		status.textContent = status.getAttribute('data-error');
	});
	const io = new IntersectionObserver((entries) => {
		if (entries[0].isIntersecting) { io.disconnect(); go(); }
	}, { rootMargin: '300px 0px' });
	io.observe(root);
}

document.querySelectorAll('[data-rek-ppf]').forEach(mount);
