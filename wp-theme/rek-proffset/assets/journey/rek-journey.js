/*
 * Homepage space journey (enqueued only on the homepage, see inc/journey.php).
 *
 * The homepage's own sections become stations in a 3D space: a camera travels
 * from one to the next along a gently curving route (forward, a little left and
 * right, up and down), and each section glides in from its own direction as it
 * approaches. The FlexiShield product is a real 3D object on the route; the
 * camera orbits it while it turns.
 *
 * Scroll position is the only input: every value is derived from it, frames are
 * drawn only when it changes, so the journey stops when scrolling stops and
 * plays backwards when scrolling back. Content and language come from the page
 * itself, so the Arabic and English homepages are each shown as they are.
 */
(function () {
	'use strict';

	var html = document.documentElement;
	var root = document.querySelector('[data-elementor-type="wp-page"]');
	var stage = document.querySelector('[data-rek-fs3d]');
	// Homepage only (flag set by the theme), and only where the scene can run.
	if (!html.hasAttribute('data-rek-home') || !html.classList.contains('rek-journey-boot') || !root || !window.THREE) {
		html.classList.remove('rek-journey-boot');
		return;
	}
	var THREE = window.THREE;

	var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
	var lerp = function (a, b, t) { return a + (b - a) * t; };
	var smooth = function (a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
	var inOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
	var small = window.matchMedia('(max-width: 767px)').matches;
	var BOX_H = 8.13, D_DOM = 20;

	/* ---------- Renderer ---------- */
	var canvas = document.createElement('canvas');
	canvas.id = 'rek-space';
	canvas.setAttribute('aria-hidden', 'true');
	var renderer;
	try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' }); } catch (e) { html.classList.remove('rek-journey-boot'); return; }
	var PR = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
	renderer.setPixelRatio(PR);
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.setClearColor(0x050b12, 1);
	renderer.autoClear = false;
	document.body.insertBefore(canvas, document.body.firstChild);
	var track = document.createElement('div');
	track.className = 'rek-journey-track';
	track.setAttribute('aria-hidden', 'true');
	document.body.appendChild(track);

	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 6000);
	var header = document.querySelector('.rek-header');
	var headerH = 0;

	/* ======================= Stations ======================= */
	var PLAN = [], total = 1, camCurve, lookCurve, rollIndex = -1;
	var OFFS = [[9, 2.5], [-6, -1], [5, 0.5], [-1, 2.2], [-7, 0.5], [-3, -2], [4, -2.5], [8, -0.5], [4, 1.5], [-5, 3], [10, -1.5], [3, -4], [-6, -2], [-11, 1], [-4, 3.5], [4, 2]];
	var FROMS = [[34, 4], [0, 22], [-30, 0], [24, -16], [0, 20], [32, 2], [0, -20], [-26, 16], [30, 10], [-32, -12], [34, -8], [0, -24], [-34, 6], [26, 18], [-30, -6], [6, 22]];
	var rollDist = function () { var a = camera.aspect; return a < 0.8 ? 33 : (a < 1.2 ? 30 : 28); };

	var reset = function () {
		html.classList.remove('rek-journey');
		document.querySelectorAll('.rek-st, .rek-st-host').forEach(function (el) {
			el.classList.remove('rek-st', 'rek-st-host', 'is-active');
			el.removeAttribute('data-rek-off');
			['width', '--rek-t', '--rek-o', '--rek-z', 'filter'].forEach(function (p) { el.style.removeProperty(p); });
		});
	};

	// Reads the page in its journey layout and decides the stations: tall sections are split into their parts.
	var build = function () {
		// Where we are, as a station and a point within it, so a new plan resumes at the same place.
		var keep = PLAN.length ? locate(progress()) : null;
		var keepEl = keep ? PLAN[keep.i].el : null;
		reset();
		html.classList.add('rek-jm');
		headerH = header ? header.getBoundingClientRect().height : 64;
		var avail = window.innerHeight - headerH - 40;
		var tops = Array.prototype.filter.call(root.children, function (el) { return el.offsetHeight > 0; });
		var footer = document.querySelector('.rek-footer');
		var hero = root.querySelector(':scope > .rk-hero');
		var roll = root.querySelector(':scope > .rk-fs3d-host');
		var flex = root.querySelector(':scope > .rek-id-flexishield');

		// Route order: hero, the sections up to the services, the FlexiShield agent, the product, then the rest.
		var others = tops.filter(function (el) { return el !== hero && el !== roll && el !== flex; });
		var services = others.reduce(function (best, el) { return el.querySelectorAll('img').length > (best ? best.querySelectorAll('img').length : 4) ? el : best; }, null);
		var at = services ? others.indexOf(services) + 1 : 0;
		var order = [].concat(hero ? [hero] : [], others.slice(0, at), flex ? [flex] : [], roll ? [roll] : [], others.slice(at), footer ? [footer] : []);

		// Layout sizes (offsetWidth/Height), so entrance animations in progress cannot distort them.
		var list = [];
		var collect = function (el, group, depth, split) {
			var parts = Array.prototype.filter.call(el.children, function (c) { return c.offsetHeight > 1; });
			var layered = parts.some(function (c) { var pos = getComputedStyle(c).position; return pos === 'absolute' || pos === 'fixed'; });
			// A single wrapper is looked through; a tall section made of substantial parts (the service cards)
			// becomes one station per part. Anything else stays whole and the camera pans along it.
			var substantial = parts.length > 1 && parts.every(function (c) { return c.offsetHeight >= avail * 0.2; });
			if (el !== hero && el !== roll && el.offsetHeight > avail * 1.1 && depth < 4 && !layered && (parts.length === 1 || substantial)) {
				el.classList.add('rek-st-host');
				parts.forEach(function (c) { collect(c, group, depth + 1, split || parts.length > 1); });
				return;
			}
			list.push({ el: el, w: el.offsetWidth, h: el.offsetHeight, group: group, split: !!split, hero: el === hero, roll: el === roll });
		};
		order.forEach(function (el, g) { collect(el, g, 0, false); });

		// Measure each station as it will be shown: fixed, at its measured width.
		html.classList.add('rek-journey');
		list.forEach(function (s) {
			s.el.classList.add('rek-st');
			if (!s.hero) { s.el.style.setProperty('width', s.w + 'px', 'important'); }
			s.el.querySelectorAll('img[loading="lazy"]').forEach(function (img) { img.loading = 'eager'; });
		});
		list.forEach(function (s) { if (!s.hero) { s.w = s.el.offsetWidth; s.h = s.el.offsetHeight; } });

		// Spacing and timing along the route (scroll units of about half a screen).
		var z = 0, k = 0;
		PLAN = list.map(function (s, i) {
			var next = list[i + 1];
			var sameGroup = next && next.group === s.group;
			s.fit = s.hero ? 1 : Math.min(1, (window.innerWidth - 24) / Math.max(1, s.w));
			s.pan = s.hero ? 0 : Math.max(0, s.h * s.fit - avail); // taller than the screen: panned during the stop
			s.hold = (s.hero ? 0.8 : (s.roll ? 2.4 : (s.split ? 0.55 : 1.0))) + s.pan / avail * 1.3;
			s.travel = !next ? 0 : (next.roll ? 3.4 : (s.hero ? 1.6 : (sameGroup ? 0.7 : 1.3)));
			s.gap = !next ? 0 : (next.roll ? 430 : (s.hero ? 120 : (sameGroup ? 48 : 110)));
			var o = s.hero ? [0, 0] : (s.roll ? [2, 0] : OFFS[k % OFFS.length]);
			var f = (s.hero || s.roll) ? [0, 0] : FROMS[k % FROMS.length];
			if (sameGroup || (list[i - 1] && list[i - 1].group === s.group)) { o = [o[0] * 0.6, o[1] * 0.6]; }
			if (!s.hero && !s.roll) { k++; }
			s.off = o; s.from = f;
			s.pos = [o[0], o[1], z];
			z -= s.gap;
			return s;
		});
		total = 0;
		PLAN.forEach(function (s) { s.start = total; total += s.hold; s.holdEnd = total; total += s.travel; });
		rollIndex = -1;
		PLAN.forEach(function (s, i) { if (s.roll) { rollIndex = i; } });

		PLAN.forEach(function (s) { s.el.setAttribute('data-rek-off', ''); });
		track.style.height = (total * (small ? 0.5 : 0.55) * 100 + 100) + 'vh';
		html.classList.remove('rek-journey-boot');
		buildRoute();
		var u = 0;
		if (keep) {
			var j = -1;
			PLAN.forEach(function (s, i) { if (s.el === keepEl) { j = i; } });
			if (j >= 0) { u = keep.travel > 0 ? PLAN[j].holdEnd + PLAN[j].travel * keep.travel : PLAN[j].start + PLAN[j].hold * keep.hold; }
		}
		scrollToP(clamp(u / total, 0, 1));
		if (sizes) { sizes.disconnect(); PLAN.forEach(function (s) { sizes.observe(s.el); }); }
	};

	// When a station's real size changes (images arriving, fonts), the journey is planned again from where it is.
	var replan = false;
	var sizes = 'ResizeObserver' in window ? new ResizeObserver(function () {
		if (replan || !html.classList.contains('rek-journey')) { return; }
		var changed = PLAN.some(function (s) { return !s.hero && s.el.offsetHeight && Math.abs(s.el.offsetHeight - s.h) > 8; });
		if (!changed) { return; }
		replan = true;
		window.requestAnimationFrame(function () { replan = false; build(); scatter(); request(); });
	}) : null;

	var buildRoute = function () {
		var camPts = PLAN.map(function (s) { var d = s.roll ? rollDist() : D_DOM; return new THREE.Vector3(s.pos[0], s.pos[1] + (s.roll ? -2.2 : 0), s.pos[2] + d); });
		var lookPts = PLAN.map(function (s) { return new THREE.Vector3(s.pos[0], s.pos[1] + (s.roll ? -2.2 : 0), s.pos[2]); });
		if (camPts.length < 2) { camPts.push(camPts[0].clone().add(new THREE.Vector3(0, 0, -1))); lookPts.push(lookPts[0].clone().add(new THREE.Vector3(0, 0, -1))); }
		camCurve = new THREE.CatmullRomCurve3(camPts, false, 'centripetal');
		lookCurve = new THREE.CatmullRomCurve3(lookPts, false, 'centripetal');
		if (rollIndex >= 0) { var s = PLAN[rollIndex]; product.position.set(s.pos[0], s.pos[1] + 1.2, s.pos[2]); placeLights(); }
	};

	/* ---------- Scroll is the only input ---------- */
	var maxScroll = function () { return Math.max(1, html.scrollHeight - window.innerHeight); };
	var progress = function () { return clamp(window.scrollY / maxScroll(), 0, 1); };
	var scrollToP = function (p, smoothly) { window.scrollTo({ top: p * maxScroll(), behavior: smoothly ? 'smooth' : 'instant' }); };
	var locate = function (p) {
		var u = p * total;
		for (var i = 0; i < PLAN.length; i++) {
			var s = PLAN[i];
			if (u < s.holdEnd || i === PLAN.length - 1) { return { i: i, travel: 0, hold: s.hold ? clamp((u - s.start) / s.hold, 0, 1) : 1 }; }
			if (u < s.holdEnd + s.travel) { return { i: i, travel: (u - s.holdEnd) / s.travel, hold: 1 }; }
		}
		return { i: PLAN.length - 1, travel: 0, hold: 1 };
	};

	/* ======================= Space ======================= */
	/* Nebula: full-screen, turns with the camera like a sky at infinity. */
	var bgScene = new THREE.Scene(), bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	var bgMat = new THREE.ShaderMaterial({
		depthWrite: false, depthTest: false,
		uniforms: { uRes: { value: new THREE.Vector2(1, 1) }, uP: { value: 0 }, uLook: { value: new THREE.Vector2(0, 0) }, uGlow: { value: new THREE.Vector2(0, 0) }, uGlowAmt: { value: 0 } },
		vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
		fragmentShader: [
			'precision highp float;',
			'uniform vec2 uRes; uniform float uP; uniform vec2 uLook; uniform vec2 uGlow; uniform float uGlowAmt;',
			'float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
			'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);',
			'  return mix(mix(hash(i), hash(i + vec2(1,0)), u.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y); }',
			'float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; } return v; }',
			'void main(){',
			'  vec2 q = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;',
			'  vec2 w = q + uLook + vec2(uP * 1.6, sin(uP * 6.0) * 0.12);',
			'  vec2 warp = vec2(fbm(w * 1.5 + 4.0), fbm(w * 1.5 + 9.0));',
			'  float n = fbm(w * 1.2 + warp * 1.15 + vec2(2.3, 0.7));',
			'  float n2 = fbm(w * 3.1 + warp * 2.0 + 11.0);',
			'  float band = 0.35 + 0.65 * smoothstep(0.25, 0.75, fbm(w * 0.45 + 30.0));',
			'  float cloud = smoothstep(0.44, 0.86, n) * band;',
			'  float wisps = smoothstep(0.56, 0.9, n2) * cloud;',
			'  float dust = smoothstep(0.5, 0.95, fbm(w * 7.0 + 50.0)) * 0.5;',
			'  vec3 bg = vec3(0.016, 0.035, 0.06);',
			'  vec3 navy = vec3(0.043, 0.114, 0.188), premium = vec3(0.071, 0.247, 0.412), accent = vec3(0.086, 0.537, 0.847), cyan = vec3(0.357, 0.722, 0.949);',
			'  float r = length(q * vec2(0.85, 1.0));',
			'  vec3 col = mix(bg, navy, 0.35 * exp(-r * r * 1.4));',
			'  col += premium * 0.30 * cloud + accent * (0.03 * cloud + 0.055 * wisps) + cyan * 0.018 * wisps;',
			'  col += navy * 0.12 * dust * cloud;',
			'  vec2 g = q - uGlow;',
			'  col += accent * 0.12 * uGlowAmt * exp(-dot(g * vec2(1.6, 0.9), g * vec2(1.6, 0.9)) / 0.09);',
			'  col += cyan * 0.03 * uGlowAmt * exp(-dot(g, g) / 0.02);',
			'  col *= 1.0 - 0.45 * smoothstep(0.55, 1.25, r);',
			'  col += (hash(gl_FragCoord.xy + uP) - 0.5) / 255.0;',
			'  gl_FragColor = vec4(col, 1.0);',
			'}'
		].join('\n')
	});
	bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat));

	/* Stars and dust: GPU points, size and fade from true depth. */
	var pointMat = function (nearFade, farFade, maxPx) {
		return new THREE.ShaderMaterial({
			transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
			uniforms: { uScale: { value: 1 }, uPR: { value: PR } },
			vertexShader: [
				'attribute float aSize; attribute vec3 aColor;',
				'uniform float uScale; uniform float uPR;',
				'varying vec3 vColor; varying float vAlpha;',
				'void main(){',
				'  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
				'  float d = max(0.001, -mv.z);',
				'  float size = aSize * uScale / d;',
				'  float px = max(size, 1.1 * uPR);',
				'  gl_PointSize = min(px, ' + maxPx.toFixed(1) + ' * uPR);',
				'  vAlpha = min(1.0, size / px + 0.1) * smoothstep(' + nearFade[0].toFixed(1) + ', ' + nearFade[1].toFixed(1) + ', d) * (1.0 - smoothstep(' + farFade[0].toFixed(1) + ', ' + farFade[1].toFixed(1) + ', d));',
				'  vColor = aColor;',
				'  gl_Position = projectionMatrix * mv;',
				'}'
			].join('\n'),
			fragmentShader: [
				'varying vec3 vColor; varying float vAlpha;',
				'void main(){ vec2 c = gl_PointCoord - 0.5; float r = length(c) * 2.0;',
				'  float a = exp(-r * r * 5.0) * (1.0 - smoothstep(0.85, 1.0, r));',
				'  gl_FragColor = vec4(vColor * a * vAlpha, 1.0); }'
			].join('\n')
		});
	};
	var starMat = pointMat([2, 10], [1300, 1900], 8);
	var dustMat = pointMat([0.6, 4], [60, 140], 5);
	var farMat = pointMat([0, 1], [5000, 5600], 4);
	var seed = 11;
	var rand = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
	var color = function (bMin, bMax) {
		var t = rand(), b = bMin + Math.pow(rand(), 3.0) * (bMax - bMin);
		var c = t < 0.6 ? [0.80, 0.89, 1.0] : (t < 0.9 ? [1, 1, 1] : [1.0, 0.92, 0.82]);
		return [c[0] * b, c[1] * b, c[2] * b];
	};
	var pointsFrom = function (n, mat, place, sizeRange, bright) {
		var pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sz = new Float32Array(n);
		for (var i = 0; i < n; i++) {
			pos.set(place(), i * 3);
			col.set(color(bright[0], bright[1]), i * 3);
			sz[i] = lerp(sizeRange[0], sizeRange[1], Math.pow(rand(), 2.4));
		}
		var g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
		g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
		g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
		var pts = new THREE.Points(g, mat);
		pts.frustumCulled = false;
		scene.add(pts);
		return pts;
	};
	var k = small ? 0.55 : 1;
	var starfield = null, dust = null;
	// Stars are scattered along the route (rebuilt when the route length changes).
	var scatter = function () {
		[starfield, dust].forEach(function (o) { if (o) { scene.remove(o); o.geometry.dispose(); } });
		seed = 11;
		var pt = new THREE.Vector3();
		var along = function (radius, minR) {
			return function () {
				lookCurve.getPoint(rand(), pt);
				var a = rand() * Math.PI * 2, r = minR + Math.pow(rand(), 0.8) * radius;
				return [pt.x + Math.cos(a) * r, pt.y + Math.sin(a) * r * 0.72, pt.z + 40 - rand() * 160];
			};
		};
		starfield = pointsFrom(Math.round(16000 * k), starMat, along(150, 6), [0.9, 3.6], [0.16, 1.1]);
		dust = pointsFrom(Math.round(5000 * k), dustMat, along(26, 1.5), [0.05, 0.16], [0.05, 0.22]);
	};
	var far = pointsFrom(Math.round(3200 * k), farMat, function () {
		var u = rand() * 2 - 1, a = rand() * Math.PI * 2, s = Math.sqrt(1 - u * u), R = 4200;
		return [s * Math.cos(a) * R, u * R, s * Math.sin(a) * R];
	}, [14, 60], [0.1, 0.8]);

	/* ---------- The FlexiShield product (1 : 8.13), the packaging photos as its faces ---------- */
	var env = (function () {
		var e = new THREE.Scene(); e.background = new THREE.Color(0x05080d);
		var soft = function (w, h, c, m, x, y, zz) { var me = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(m), side: THREE.DoubleSide })); me.position.set(x, y, zz); me.lookAt(0, y * 0.4, 0); e.add(me); };
		soft(6, 14, 0xffffff, 2.2, -7, 2, 6); soft(3, 16, 0x5bb8f2, 1.6, 8, 0, -4); soft(10, 3, 0xffffff, 0.9, 0, 9, 2);
		var pm = new THREE.PMREMGenerator(renderer); var t = pm.fromScene(e, 0.04).texture; pm.dispose(); return t;
	})();
	var texBase = stage ? stage.getAttribute('data-textures') : '';
	var loader = new THREE.TextureLoader(), mats = [];
	var face = function (n) { var t = loader.load(texBase + n, function () { request(); }); t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); var m = new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.32, envMap: env, envMapIntensity: 0.38 }); mats.push(m); return m; };
	var capM = function (hex) { var m = new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.6, clearcoat: 0.3, clearcoatRoughness: 0.35, envMap: env, envMapIntensity: 0.35 }); mats.push(m); return m; };
	var product = new THREE.Group();
	var box = null;
	if (stage) {
		var s1 = face('side-1.jpg');
		box = new THREE.Mesh(new THREE.BoxGeometry(1, BOX_H, 1), [face('side-2.jpg'), s1, capM(0x2c2623), capM(0xe2000d), s1, face('side-3.jpg')]);
		product.add(box);
		scene.add(product);
	}
	var hemi = new THREE.HemisphereLight(0xcfe3f5, 0x05080d, 0.1);
	var key = new THREE.DirectionalLight(0xffffff, 0), fill = new THREE.DirectionalLight(0xffffff, 0);
	var rim = new THREE.DirectionalLight(0x5bb8f2, 0.9), rim2 = new THREE.DirectionalLight(0x9fd6ff, 0.5);
	scene.add(hemi);
	[key, fill, rim, rim2].forEach(function (l) { scene.add(l); scene.add(l.target); });
	var placeLights = function () {
		var P = product.position;
		[key, fill, rim, rim2].forEach(function (l) { l.target.position.copy(P); });
		key.position.set(P.x - 4, P.y + 6, P.z + 8);
		fill.position.set(P.x + 5, P.y + 1, P.z + 6);
		rim.position.set(P.x + 6, P.y + 3, P.z - 6);
		rim2.position.set(P.x - 6, P.y + 2, P.z - 5);
		glint.position.copy(P).setZ(P.z + 1);
	};
	var glint = (function () {
		var c = document.createElement('canvas'); c.width = c.height = 64;
		var g = c.getContext('2d'), grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
		grd.addColorStop(0, 'rgba(220,240,255,1)'); grd.addColorStop(0.18, 'rgba(120,195,245,0.55)'); grd.addColorStop(1, 'rgba(91,184,242,0)');
		g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
		var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
		if (stage) { scene.add(s); }
		return s;
	})();

	/* ---------- Size ---------- */
	var size = new THREE.Vector2(), vw = 0, vh = 0;
	var resize = function () {
		var w = window.innerWidth, h = window.innerHeight;
		var relayout = w !== vw || Math.abs(h - vh) > vh * 0.15;
		vw = w; vh = h;
		renderer.setSize(vw, vh, false);
		camera.aspect = vw / vh; camera.updateProjectionMatrix();
		renderer.getDrawingBufferSize(size);
		bgMat.uniforms.uRes.value.copy(size);
		[starMat, dustMat, farMat].forEach(function (m) { m.uniforms.uScale.value = size.y * 0.9; });
		if (relayout) { build(); scatter(); }
	};

	/* ======================= Frame ======================= */
	var yAxis = new THREE.Vector3(0, 1, 0);
	var cam = new THREE.Vector3(), look = new THREE.Vector3(), tmp = new THREE.Vector3(), fwd = new THREE.Vector3(), right = new THREE.Vector3(), upv = new THREE.Vector3();
	var render = function () {
		var p = progress();
		var at = locate(p);
		var N = Math.max(1, PLAN.length - 1);
		var sParam = at.i + (at.travel > 0 ? inOut(at.travel) : 0);
		var t = sParam / N;
		camCurve.getPoint(Math.min(1, t), cam);
		lookCurve.getPoint(Math.min(1, t), look);
		if (at.travel > 0) { // look a little ahead while travelling, so turns lead the eye
			lookCurve.getPoint(Math.min(1, (sParam + 0.45) / N), tmp);
			look.lerp(tmp, Math.sin(at.travel * Math.PI) * 0.55);
		} else { // a slow dolly while a section is read
			cam.z += (0.03 - 0.06 * at.hold) * (PLAN[at.i].roll ? rollDist() : D_DOM);
		}

		// Around the product the camera also orbits it, driven by the same scroll.
		var u = p * total, rollPhase = 0;
		if (rollIndex > 0) {
			var rA = PLAN[rollIndex - 1].holdEnd, rB = PLAN[rollIndex].start, rC = PLAN[rollIndex].holdEnd, rD = rC + PLAN[rollIndex].travel;
			var orbit = 0, lift = 0;
			if (u > rA && u < rD) {
				if (u < rB) { orbit = -0.5 * smooth(rA + (rB - rA) * 0.55, rB, u); }
				else if (u <= rC) { var h = (u - rB) / (rC - rB); orbit = lerp(-0.5, 0.5, inOut(h)); lift = Math.sin(h * Math.PI) * 2.2; }
				else { orbit = 0.5 * (1 - inOut((u - rC) / Math.max(0.001, rD - rC))); }
				tmp.copy(cam).sub(product.position).applyAxisAngle(yAxis, orbit);
				cam.copy(product.position).add(tmp);
				cam.y += lift;
			}
			rollPhase = clamp((u - rA) / Math.max(0.001, rD - rA), 0, 1);
		}
		camera.position.copy(cam);
		camera.up.set(0, 1, 0);
		camera.lookAt(look);
		camCurve.getTangent(clamp(t, 0.0001, 0.9999), tmp);
		camera.rotateZ(clamp(-tmp.x * 0.35, -0.06, 0.06) * Math.sin(at.travel * Math.PI)); // bank into turns
		camera.updateMatrixWorld();
		camera.getWorldDirection(fwd);
		right.set(1, 0, 0).applyQuaternion(camera.quaternion);
		upv.set(0, 1, 0).applyQuaternion(camera.quaternion);
		bgMat.uniforms.uLook.value.set(Math.atan2(fwd.x, -fwd.z) * 1.2, fwd.y * 1.2);
		bgMat.uniforms.uP.value = p;
		far.position.copy(camera.position);

		// The product: lit as the camera arrives, turning, tilting and leaning with the scroll.
		if (box) {
			var dist = camera.position.distanceTo(product.position);
			var reveal = 1 - smooth(rollDist() * 1.1, 260, dist);
			box.rotation.y = lerp(-2.6, 3.4, rollPhase);
			box.rotation.x = 0.03 + 0.09 * Math.sin(rollPhase * Math.PI * 2.0) * (1 - reveal * 0.4);
			box.rotation.z = 0.06 * Math.sin(rollPhase * Math.PI * 1.5 + 0.6);
			key.intensity = lerp(0.02, 0.85, reveal); fill.intensity = lerp(0, 0.32, reveal); hemi.intensity = lerp(0.08, 0.4, reveal);
			mats.forEach(function (m) { m.envMapIntensity = lerp(0.12, 0.38, reveal); });
			glint.scale.setScalar(dist * 0.016);
			glint.material.opacity = smooth(520, 380, dist) * smooth(90, 170, dist) * 0.9;
			tmp.copy(product.position).project(camera);
			var onScreen = tmp.z < 1 && Math.abs(tmp.x) < 1.3 && Math.abs(tmp.y) < 1.3;
			bgMat.uniforms.uGlow.value.set(tmp.x * 0.5 * camera.aspect, tmp.y * 0.5);
			bgMat.uniforms.uGlowAmt.value = onScreen ? smooth(300, 40, dist) : 0;
		}

		// Sections: projected with the same camera; they glide in from their direction, sharpen at reading distance, fade as we pass.
		var f = vh / (2 * Math.tan(camera.fov * Math.PI / 360));
		for (var i = 0; i < PLAN.length; i++) {
			var s = PLAN[i], el = s.el;
			var D = s.roll ? rollDist() : D_DOM;
			tmp.set(s.pos[0], s.pos[1] + (s.roll ? -BOX_H / 2 - 1.6 : 0), s.pos[2]).sub(camera.position);
			var depth = tmp.dot(fwd);
			var away = smooth(D * 1.15, D * 6, depth);
			if (away > 0 && (s.from[0] || s.from[1])) { tmp.x += s.from[0] * away; tmp.y += s.from[1] * away; depth = tmp.dot(fwd); }
			var op = depth <= 0 ? 0 : smooth(D * 12, D * 3, depth) * (1 - smooth(D * 0.8, D * 0.5, depth));
			op *= lerp(0.45, 1, smooth(D * 4, D * 2.2, depth));
			if (s.hero) { op = depth <= 0 ? 0 : 1 - smooth(D * 0.86, D * 0.5, depth); }
			if (op < 0.01) {
				if (!el.hasAttribute('data-rek-off')) { el.setAttribute('data-rek-off', ''); el.classList.remove('is-active'); }
				continue;
			}
			el.removeAttribute('data-rek-off');
			var sc = D / depth;
			var px = tmp.dot(right) / depth * f, py = -tmp.dot(upv) / depth * f;
			var tf;
			if (s.hero) {
				tf = 'translate(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px) scale(' + sc.toFixed(4) + ')';
			} else {
				var yaw = Math.atan2(tmp.dot(right), depth) * 0.5, pitch = Math.atan2(tmp.dot(upv), depth) * 0.4;
				var yOff = headerH / 2;
				if (s.pan) { // a tall section: its top edge meets the header at the start of the stop, its bottom edge the screen's at the end
					var Hs = s.h * s.fit * sc, top = headerH + 20, bottom = vh - 20;
					var cy = lerp(top + Hs / 2, bottom - Hs / 2, clamp((u - s.start) / s.hold, 0, 1));
					yOff = lerp(headerH / 2, cy - vh / 2, 1 - smooth(D * 1.05, D * 1.8, depth));
				}
				tf = 'translate(-50%,-50%) translate(' + px.toFixed(1) + 'px,' + (py + yOff).toFixed(1) + 'px) perspective(1400px) rotateY(' + (-yaw).toFixed(4) + 'rad) rotateX(' + pitch.toFixed(4) + 'rad) scale(' + (sc * s.fit).toFixed(4) + ')';
			}
			el.style.setProperty('--rek-t', tf);
			el.style.setProperty('--rek-o', op.toFixed(3));
			el.style.setProperty('--rek-z', String(10 + Math.min(70, Math.round(400 / Math.max(depth, 1)))));
			var dof = (small || s.hero) ? 0 : clamp(Math.abs(Math.log(depth / D)) * 3.2 - 0.4, 0, 5); // depth of field (desktop)
			if (dof > 0.2) { el.style.setProperty('filter', 'blur(' + dof.toFixed(2) + 'px)'); } else { el.style.removeProperty('filter'); }
			el.classList.toggle('is-active', op > 0.85 && Math.abs(Math.log(depth / D)) < 0.2);
		}

		renderer.clear();
		renderer.render(bgScene, bgCam);
		renderer.render(scene, camera);
	};

	var queued = false;
	var request = function () { if (!queued) { queued = true; window.requestAnimationFrame(function () { queued = false; render(); }); } };

	/* In-page links (for example to the booking section) travel to the station that holds their target. */
	document.addEventListener('click', function (e) {
		var a = e.target.closest('a[href*="#"]');
		if (!a || a.pathname !== window.location.pathname) { return; }
		var id = decodeURIComponent(a.hash.slice(1));
		var target = id && document.getElementById(id);
		if (!target) { return; }
		for (var i = 0; i < PLAN.length; i++) {
			if (PLAN[i].el === target || PLAN[i].el.contains(target) || target.contains(PLAN[i].el)) {
				e.preventDefault();
				scrollToP((PLAN[i].start + PLAN[i].hold * 0.5) / total, true);
				return;
			}
		}
	});

	if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }
	window.addEventListener('scroll', request, { passive: true });
	window.addEventListener('resize', function () { resize(); request(); });
	resize();
	window.scrollTo({ top: 0, behavior: 'instant' });
	var rebuild = function () { build(); scatter(); request(); };
	if (document.fonts && document.fonts.ready) { document.fonts.ready.then(rebuild); }
	window.addEventListener('load', rebuild);
	request();
})();
