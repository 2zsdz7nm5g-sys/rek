/*
 * FlexiShield 3D product stage ([rek_fs3d]).
 *
 * A real closed box (square section, 1 : 8.13, the proportions of the actual
 * packaging) with the four photographed sides as textures, lit by a small
 * studio environment. Its position and rotation are driven by scroll:
 * it rises from below the hero, turns about 100 degrees while it reaches the
 * centre, then keeps turning slowly (170 degrees more) while the stage is pinned,
 * while benefit words appear, one more per upward scroll gesture (see below). Scrolling up
 * plays the product backwards because every value is derived from the scroll
 * position, never from time.
 *
 * Three.js is self-hosted and loaded only when the stage is near the viewport,
 * after the page has finished loading. Nothing renders while the page is
 * still. Reduced motion or missing WebGL keeps the static rendered image.
 */
(function () {
	'use strict';

	var stageEl = document.querySelector('[data-rek-fs3d]');
	if (!stageEl) { return; }
	var section = stageEl.closest('.rek-fs3d');
	var canvasWrap = stageEl.querySelector('.rek-fs3d__canvas');
	var copy = stageEl.querySelector('.rek-fs3d__copy');
	var hero = document.querySelector('.rk-hero');
	var heroContent = hero ? hero.querySelector('.rk-hero-content') : null;

	var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
	var hasWebGL = (function () {
		try {
			var c = document.createElement('canvas');
			return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
		} catch (e) { return false; }
	})();

	/* Static mode: no scroll choreography, the rendered still image stays. */
	if (reduce.matches || !hasWebGL) {
		section.classList.add('is-static');
		copy.classList.add('is-visible');
		return;
	}
	section.classList.add('is-live');

	var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
	var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }; // easeInOutCubic

	/* ---------- Scroll state (always cheap, runs without Three.js) ---------- */
	var target = { enter: 0, pin: 0 };
	var readScroll = function () {
		var vh = window.innerHeight;
		var r = section.getBoundingClientRect();
		target.enter = clamp((vh - r.top) / vh, 0, 1);                    // 0: stage below the fold, 1: stage pinned
		target.pin = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);      // progress while pinned
		// The hero gently recedes as the product takes over, and comes back on the way up.
		// filter/translate are used (not opacity/transform) so Elementor's own entrance animation on the hero is untouched.
		if (heroContent) {
			var h = clamp(window.scrollY / (vh * 0.8), 0, 1);
			heroContent.style.filter = h ? 'opacity(' + (1 - 0.75 * h).toFixed(3) + ')' : '';
			heroContent.style.translate = h ? '0 ' + (-48 * h).toFixed(1) + 'px' : '';
		}
		copy.classList.toggle('is-visible', target.enter > 0.98 && target.pin > 0.04);
	};

	/*
	 * Benefit bubbles. The first one is shown from the start. Each distinct upward
	 * scroll gesture while the section is on screen shows exactly one more, the
	 * moment the gesture begins, while the product turns with the scroll as usual.
	 * Shown bubbles never go away (scrolling down only turns the product back).
	 * Gestures are told apart without timers: a new upward gesture starts when the
	 * page was scrolling down before, or when GAP ms passed since the last scroll event.
	 */
	var bubbles = Array.prototype.slice.call(stageEl.querySelectorAll('.rek-bubble')).map(function (el, i) {
		return { el: el, word: el.querySelector('.rek-bubble__word'), on: i === 0 };
	});
	var lastDeg = 0;
	var updateBubbles = function (deg) {
		lastDeg = deg;
		bubbles.forEach(function (b, i) {
			var v = b.on ? 1 : 0;
			// A gentle drift that is also a function of rotation: it moves only when the product does.
			var fy = Math.sin(deg * 0.035 + i * 1.7) * 6;
			var fx = Math.cos(deg * 0.028 + i * 2.3) * 3;
			b.el.style.opacity = String(v);
			b.el.style.transform = 'translate3d(' + fx.toFixed(1) + 'px,' + (fy + (1 - v) * 14).toFixed(1) + 'px,0) scale(' + (0.82 + 0.18 * v).toFixed(3) + ')';
			b.word.style.filter = v ? '' : 'blur(6px)';
		});
	};
	updateBubbles(0);

	var GAP = 400;
	var lastY = window.scrollY, lastScrollT = 0, goingUp = false;
	var sectionOnScreen = function () {
		var r = section.getBoundingClientRect();
		return r.top < window.innerHeight && r.bottom > 0;
	};
	window.addEventListener('scroll', function () {
		var now = window.performance.now(), y = window.scrollY, dy = y - lastY;
		var newGesture = !goingUp || now - lastScrollT > GAP;
		lastY = y;
		lastScrollT = now;
		if (dy < 0) {
			if (newGesture && sectionOnScreen()) {
				var next = bubbles.filter(function (b) { return !b.on; })[0];
				if (next) { next.on = true; updateBubbles(lastDeg); }
			}
			goingUp = true;
		} else if (dy > 0) {
			goingUp = false;
		}
	}, { passive: true });

	var THREE, renderer, scene, camera, box, shadow, running = false, ready = false, visible = true;
	var cur = { enter: 0, pin: 0 };
	var BOX_H = 8.13;

	var requestFrame = function () {
		if (!running && ready && visible) { running = true; window.requestAnimationFrame(frame); }
	};
	var onScroll = function () { readScroll(); requestFrame(); };
	window.addEventListener('scroll', onScroll, { passive: true });
	readScroll();

	/* ---------- Lazy load Three.js ---------- */
	var loadThree = function () {
		if (window.THREE) { return Promise.resolve(window.THREE); }
		return new Promise(function (resolve, reject) {
			var s = document.createElement('script');
			s.src = stageEl.getAttribute('data-three');
			s.async = true;
			s.onload = function () { resolve(window.THREE); };
			s.onerror = reject;
			document.head.appendChild(s);
		});
	};

	var start = function () {
		loadThree().then(function (T) {
			THREE = T;
			build();
		}).catch(function () {
			section.classList.remove('is-live');
			section.classList.add('is-static');
			copy.classList.add('is-visible');
		});
	};

	var near = new IntersectionObserver(function (entries) {
		if (!entries[0].isIntersecting) { return; }
		near.disconnect();
		var go = function () { ('requestIdleCallback' in window) ? window.requestIdleCallback(start, { timeout: 1200 }) : window.setTimeout(start, 200); };
		if (document.readyState === 'complete') { go(); } else { window.addEventListener('load', go, { once: true }); }
	}, { rootMargin: '150% 0px' });
	near.observe(section);

	new IntersectionObserver(function (entries) {
		visible = entries[0].isIntersecting;
		if (visible) { requestFrame(); }
	}, { rootMargin: '20% 0px' }).observe(section);

	/* ---------- Scene ---------- */
	function studioEnvironment() {
		// A dark room with three soft boxes: gives the film-like surface believable reflections.
		var env = new THREE.Scene();
		env.background = new THREE.Color(0x05080d);
		var soft = function (w, h, color, intensity, x, y, z, ry) {
			var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
			m.position.set(x, y, z); m.rotation.y = ry || 0; m.lookAt(0, y * 0.4, 0);
			env.add(m);
		};
		soft(6, 14, 0xffffff, 2.2, -7, 2, 6);     // key softbox, front left
		soft(3, 16, 0x5bb8f2, 1.4, 8, 0, -4);     // cool blue rim, back right
		soft(10, 3, 0xffffff, 0.9, 0, 9, 2);      // overhead strip
		var pmrem = new THREE.PMREMGenerator(renderer);
		var tex = pmrem.fromScene(env, 0.04).texture;
		pmrem.dispose();
		return tex;
	}

	function shadowTexture() {
		var c = document.createElement('canvas');
		c.width = c.height = 128;
		var g = c.getContext('2d');
		var grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
		grd.addColorStop(0, 'rgba(0,0,0,0.85)');
		grd.addColorStop(0.45, 'rgba(0,0,0,0.35)');
		grd.addColorStop(1, 'rgba(0,0,0,0)');
		g.fillStyle = grd;
		g.fillRect(0, 0, 128, 128);
		return new THREE.CanvasTexture(c);
	}

	function build() {
		var small = window.matchMedia('(max-width: 767px)').matches;
		renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
		renderer.outputEncoding = THREE.sRGBEncoding;
		// Neutral tone mapping keeps the printed FlexiShield reds and blacks true to the packaging.
		renderer.toneMapping = THREE.NoToneMapping;
		renderer.setClearColor(0x000000, 0);
		canvasWrap.appendChild(renderer.domElement);
		renderer.domElement.setAttribute('aria-hidden', 'true');

		scene = new THREE.Scene();
		scene.environment = studioEnvironment();
		camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

		var loader = new THREE.TextureLoader();
		var base = stageEl.getAttribute('data-textures');
		var aniso = renderer.capabilities.getMaxAnisotropy();
		var face = function (name) {
			var t = loader.load(base + name, function () { requestFrame(); });
			t.encoding = THREE.sRGBEncoding;
			t.anisotropy = Math.min(8, aniso);
			return new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.55, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.32, envMapIntensity: 0.38 });
		};
		var side1 = face('side-1.jpg');
		var cap = function (hex) { return new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.6, clearcoat: 0.3, clearcoatRoughness: 0.35, envMapIntensity: 0.35 }); };
		// BoxGeometry material order: +x, -x, +y, -y, +z, -z.
		// Front (+z) is the first side; the fourth side (-x) repeats it exactly.
		var mats = [face('side-2.jpg'), side1, cap(0x2c2623), cap(0xe2000d), side1, face('side-3.jpg')];
		box = new THREE.Mesh(new THREE.BoxGeometry(1, BOX_H, 1, 1, 1, 1), mats);

		// Two lights shape the edges; the environment supplies the reflections.
		scene.add(new THREE.HemisphereLight(0xcfe3f5, 0x05080d, 0.4));
		var key = new THREE.DirectionalLight(0xffffff, 0.8);
		key.position.set(-4, 6, 8);
		scene.add(key);
		var fill = new THREE.DirectionalLight(0xffffff, 0.35);
		fill.position.set(5, 1, 6);
		scene.add(fill);
		var rim = new THREE.DirectionalLight(0x5bb8f2, 0.45);
		rim.position.set(6, 3, -6);
		scene.add(rim);

		shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.7 }));
		shadow.rotation.x = -Math.PI / 2 + 0.35; // tilted toward the camera so the soft contact shadow reads

		var group = new THREE.Group();
		group.add(box);
		scene.add(group);
		scene.add(shadow);
		box.userData.group = group;

		resize();
		window.addEventListener('resize', function () { resize(); requestFrame(); });
		section.classList.add('is-ready');
		ready = true;
		requestFrame();
	}

	function resize() {
		var w = canvasWrap.clientWidth, h = canvasWrap.clientHeight;
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		// Distance so the box fills a set share of the stage height (smaller on phones).
		var share = w < 768 ? 0.5 : (w < 1200 ? 0.56 : 0.6);
		var d = BOX_H / (share * 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
		camera.position.set(0, BOX_H * 0.06, d);
		camera.lookAt(0, 0, 0);
		camera.updateProjectionMatrix();
	}

	var lastT = 0;
	function frame(now) {
		running = false;
		// Time-based damping: the same smooth follow at 30, 60 or 120 fps, always converging on the scroll position.
		var dt = lastT ? Math.min(0.1, (now - lastT) / 1000) : 1 / 60;
		lastT = now;
		var k = 1 - Math.exp(-dt * 9);
		cur.enter += (target.enter - cur.enter) * k;
		cur.pin += (target.pin - cur.pin) * k;
		var settled = Math.abs(target.enter - cur.enter) < 0.0005 && Math.abs(target.pin - cur.pin) < 0.0005;
		if (settled) { cur.enter = target.enter; cur.pin = target.pin; }

		var e = ease(cur.enter);
		var group = box.userData.group;
		// Rises from below while the stage scrolls in, then rests at the centre.
		group.position.y = -BOX_H * 0.62 * (1 - e) + BOX_H * 0.03 * cur.pin;
		// About 100 degrees on the way in, then a slow further 170 degrees while pinned (270 in all),
		// so each benefit word gets a similar share of the scroll.
		var deg = -35 + 100 * e + 170 * cur.pin;
		group.rotation.y = THREE.MathUtils.degToRad(deg);
		updateBubbles(deg);
		group.rotation.x = 0.1 * (1 - e) + 0.03;
		group.rotation.z = 0.04 * (1 - e);
		shadow.position.set(0, group.position.y - BOX_H / 2 - 0.35, 0);
		shadow.material.opacity = 0.7 * e;

		renderer.render(scene, camera);
		if (settled) { lastT = 0; } else { running = true; window.requestAnimationFrame(frame); }
	}
})();
