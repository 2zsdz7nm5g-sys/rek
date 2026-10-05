/*
 * Homepage entrance: the garage door (enqueued only on the homepage, see inc/garage-door.php).
 *
 * The door never moves on its own: the visitor lifts it with a finger (swipe up), the mouse wheel
 * or trackpad, a mouse drag or the keyboard. It follows the input exactly, stops when the input
 * stops and comes back down if the input reverses. Each section rises, then tips back over the
 * curve onto the ceiling track as it reaches the lintel. Once fully open the door is removed and
 * the homepage continues exactly as before.
 */
(function () {
	'use strict';

	var root = document.documentElement;
	var garage = document.getElementById('rek-garage');
	if (!garage) { return; }
	if (!root.classList.contains('rek-garage-on')) { garage.parentNode.removeChild(garage); return; }
	root.classList.add('rek-garage-ready');

	var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
	var smooth = function (a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
	var q = function (c) { return garage.querySelector('.rek-garage__' + c); };
	var doorEl = q('door'), light = q('light'), sign = q('sign'), lift = q('lift'), seal = q('seal');
	var spill = q('spill'), dark = q('dark'), lintel = q('lintel');
	var jambs = garage.querySelectorAll('.rek-garage__jamb');

	/* ---------- Door geometry ---------- */
	var panels = [], vh = 0, ph = 0, lintelH = 0, travel = 0, throwPx = 0, small = false;
	var layout = function () {
		vh = window.innerHeight;
		small = window.innerWidth < 768;
		// Sections keep a believable height (about 50 cm), so their number follows the screen.
		var n = clamp(Math.round(vh / (small ? 150 : 185)), 4, 8);
		if (panels.length !== n) {
			doorEl.textContent = '';
			panels = [];
			for (var i = 0; i < n; i++) {
				var el = document.createElement('div');
				el.className = 'rek-garage__panel' + (i === 0 ? ' is-first' : '');
				var shade = document.createElement('i');
				el.appendChild(shade);
				doorEl.appendChild(el);
				panels.push({ el: el, shade: shade });
			}
		}
		ph = vh / n;
		panels.forEach(function (pn) { pn.el.style.height = (ph + 1) + 'px'; });
		lintelH = lintel.offsetHeight;
		travel = vh - lintelH + 6;              // until the bottom edge has passed under the lintel
		throwPx = small ? vh * 0.9 : vh * 1.15;  // input distance for a full opening (shorter on phones)
		render();
	};

	/* ---------- Drawing: everything follows the door position p (0 closed, 1 open) ---------- */
	var target = 0, p = 0, last = 0, raf = 0, opened = false, direct = false;
	var render = function () {
		var D = p * travel;
		panels.forEach(function (pn, i) {
			var top = i * ph - D;
			var f = clamp((lintelH - top) / ph, 0, 1); // how far this section has rolled over the curve
			pn.el.style.transform = 'translate3d(0,' + top.toFixed(2) + 'px,0) rotateX(' + (f * 84).toFixed(2) + 'deg)';
			pn.shade.style.opacity = (f * 0.75).toFixed(3);
			pn.el.style.visibility = top + ph < lintelH - 2 ? 'hidden' : 'visible';
		});
		var bottom = vh - D;
		var v = Math.abs(p - last); last = p;
		var tremor = v > 0.0005 ? Math.sin(p * 900) * Math.min(0.6, v * 120) : 0; // a slight shudder only while moving
		seal.style.transform = 'translate3d(0,' + (bottom - 10 + tremor).toFixed(2) + 'px,0)';
		light.style.clipPath = 'inset(0 0 ' + Math.max(0, vh - bottom).toFixed(1) + 'px 0)';
		// The sign is fixed to the door: it rises with it and passes under the lintel.
		sign.style.transform = 'translate(-50%, calc(-50% + ' + (tremor - D).toFixed(2) + 'px))';
		lift.style.opacity = String(1 - smooth(0.01, 0.08, p));
		// Inside: the lights come up with the door and light spills out under its edge.
		var lit = smooth(0, 0.15, p) * 0.5 + smooth(0.1, 0.9, p) * 0.5;
		dark.style.opacity = String((1 - lit) * 0.93);
		spill.style.transform = 'translate3d(0,' + bottom.toFixed(1) + 'px,0)';
		spill.style.opacity = String(smooth(0, 0.05, p) * (1 - smooth(0.4, 0.85, p)));
		var out = smooth(0.94, 1, p);
		lintel.style.transform = 'translate3d(0,' + (-lintelH * out).toFixed(1) + 'px,0)';
		if (jambs[0]) { jambs[0].style.transform = 'translate3d(' + (-jambs[0].offsetWidth * out).toFixed(1) + 'px,0,0)'; }
		if (jambs[1]) { jambs[1].style.transform = 'translate3d(' + (jambs[1].offsetWidth * out).toFixed(1) + 'px,0,0)'; }
	};
	var step = function () {
		raf = 0;
		// Finger and drag follow exactly; wheel notches are eased over a few frames so they do not jolt the door.
		p = direct ? target : p + (target - p) * 0.35;
		if (Math.abs(target - p) < 0.0004) { p = target; }
		render();
		if (p >= 1 && target >= 1) { finish(); return; }
		if (p !== target) { raf = window.requestAnimationFrame(step); }
	};
	var push = function (deltaPx) {
		if (opened) { return; }
		target = clamp(target + deltaPx / throwPx, 0, 1);
		if (!raf) { raf = window.requestAnimationFrame(step); }
	};

	/* ---------- Once open: the homepage as it is ---------- */
	// The rest of the gesture that opened the door is absorbed, so the hero stays in view;
	// the next gesture scrolls the page (wheel: after a 300 ms pause in wheel input; touch: a new touch).
	var settleWheel = false, settleTouch = false, lastWheelT = 0;
	var absorbWheel = function (e) {
		if (!settleWheel) { return; }
		if (e.timeStamp - lastWheelT > 300) { settleWheel = false; window.removeEventListener('wheel', absorbWheel); return; }
		lastWheelT = e.timeStamp;
		e.preventDefault();
	};
	var absorbTouch = function (e) { if (settleTouch) { e.preventDefault(); } };
	var finish = function () {
		opened = true;
		settleWheel = true;
		window.addEventListener('wheel', absorbWheel, { passive: false });
		// Only a touch still in progress is absorbed; once that finger lifts, swipes scroll the page.
		// That touch keeps reporting to the door, so its end is heard on the door (and the window, to be safe).
		settleTouch = ty !== null;
		var removeDoor = function () { if (garage.parentNode) { garage.parentNode.removeChild(garage); } };
		if (settleTouch) {
			var release = function () {
				settleTouch = false;
				window.removeEventListener('touchmove', absorbTouch);
				['touchend', 'touchcancel'].forEach(function (t) { garage.removeEventListener(t, release); window.removeEventListener(t, release); });
				removeDoor();
			};
			window.addEventListener('touchmove', absorbTouch, { passive: false });
			['touchend', 'touchcancel'].forEach(function (t) { garage.addEventListener(t, release); window.addEventListener(t, release); });
		}
		window.removeEventListener('resize', onResize);
		window.removeEventListener('mousemove', onMouseMove);
		window.removeEventListener('mouseup', onMouseUp);
		garage.style.display = 'none';
		if (!settleTouch) { removeDoor(); }
		root.classList.remove('rek-garage-on');
	};

	/* ---------- Input ---------- */
	// Mouse wheel and trackpad: the first movement on the closed door opens it, whichever way the
	// visitor's wheel or trackpad is set; the opposite direction brings it back down.
	var wheelOpens = 0;
	garage.addEventListener('wheel', function (e) {
		e.preventDefault();
		var d = e.deltaMode === 1 ? e.deltaY * 32 : (e.deltaMode === 2 ? e.deltaY * vh : e.deltaY);
		if (!d) { return; }
		if (!wheelOpens) { wheelOpens = d > 0 ? 1 : -1; }
		lastWheelT = e.timeStamp;
		direct = false;
		push(d * wheelOpens);
	}, { passive: false });
	// Touch: swipe up lifts the door, swipe down lowers it.
	var ty = null;
	garage.addEventListener('touchstart', function (e) { ty = e.touches[0].clientY; direct = true; }, { passive: true });
	garage.addEventListener('touchmove', function (e) {
		if (ty === null) { return; }
		e.preventDefault();
		var y = e.touches[0].clientY;
		push(ty - y);
		ty = y;
	}, { passive: false });
	var endTouch = function () { ty = null; };
	garage.addEventListener('touchend', endTouch);
	garage.addEventListener('touchcancel', endTouch);
	// Mouse: drag the door up.
	var my = null;
	var onMouseMove = function (e) { if (my === null) { return; } push(my - e.clientY); my = e.clientY; };
	var onMouseUp = function () { my = null; };
	garage.addEventListener('mousedown', function (e) { my = e.clientY; direct = true; });
	window.addEventListener('mousemove', onMouseMove);
	window.addEventListener('mouseup', onMouseUp);
	// Keyboard: arrows and page keys move it a step; space or enter lifts it a larger step.
	garage.addEventListener('keydown', function (e) {
		var k = e.key, d = 0;
		if (k === 'ArrowUp' || k === 'PageUp') { d = 0.12; } else if (k === 'ArrowDown' || k === 'PageDown') { d = -0.12; } else if (k === ' ' || k === 'Enter') { d = 0.25; }
		if (!d) { return; }
		e.preventDefault();
		direct = false;
		push(throwPx * d);
	});

	var onResize = function () { if (!opened) { layout(); } };
	window.addEventListener('resize', onResize);
	if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }
	window.scrollTo(0, 0);
	layout();
	try { garage.focus({ preventScroll: true }); } catch (e) { garage.focus(); }
})();
