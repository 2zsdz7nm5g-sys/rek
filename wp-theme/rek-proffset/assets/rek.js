/*
 * REK PROFFSET behaviours. No dependencies; every feature is progressive:
 * content stays readable and usable if this script never runs.
 */
(function () {
	'use strict';

	var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/*
	 * Section anchors. Elementor atomic containers have no id setting, so a
	 * rek-id-{name} class becomes the element id (services#ppf, contact#appointment).
	 */
	document.querySelectorAll('[class*="rek-id-"]').forEach(function (el) {
		var m = el.className.match(/(?:^|\s)rek-id-([a-z0-9-]+)/);
		if (m && !document.getElementById(m[1])) { el.id = m[1]; }
	});
	if (window.location.hash.length > 1) {
		var anchor = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
		if (anchor) { window.requestAnimationFrame(function () { anchor.scrollIntoView({ block: 'start' }); }); }
	}

	/* Booking result notice: move focus to it so screen readers announce it. */
	var notice = document.querySelector('[data-rek-notice]');
	if (notice) { window.requestAnimationFrame(function () { notice.focus({ preventScroll: true }); }); }

	/* Header: transparent over the hero, solid once the page scrolls. */
	var header = document.querySelector('[data-rek-header]');
	if (header) {
		var ticking = false;
		var update = function () {
			header.classList.toggle('is-scrolled', window.scrollY > 24);
			ticking = false;
		};
		update();
		window.addEventListener('scroll', function () {
			if (!ticking) {
				window.requestAnimationFrame(update);
				ticking = true;
			}
		}, { passive: true });
	}

	/* Full-screen mobile menu with focus trap and Escape to close. */
	var menu = document.querySelector('[data-rek-menu]');
	var opener = document.querySelector('[data-rek-menu-open]');
	if (menu && opener) {
		var closer = menu.querySelector('[data-rek-menu-close]');
		var focusables = function () {
			return menu.querySelectorAll('a[href], button:not([disabled])');
		};
		var close = function () {
			menu.classList.remove('is-open');
			document.documentElement.classList.remove('rek-menu-open');
			opener.setAttribute('aria-expanded', 'false');
			window.setTimeout(function () { menu.hidden = true; }, reduceMotion ? 0 : 300);
			opener.focus();
		};
		var open = function () {
			menu.hidden = false;
			document.documentElement.classList.add('rek-menu-open');
			opener.setAttribute('aria-expanded', 'true');
			window.requestAnimationFrame(function () { menu.classList.add('is-open'); });
			(closer || focusables()[0]).focus();
		};
		opener.addEventListener('click', open);
		if (closer) { closer.addEventListener('click', close); }
		menu.addEventListener('click', function (e) {
			if (e.target.closest('a')) { close(); }
		});
		menu.addEventListener('keydown', function (e) {
			if (e.key === 'Escape') { close(); return; }
			if (e.key !== 'Tab') { return; }
			var items = focusables();
			var first = items[0];
			var last = items[items.length - 1];
			if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
			else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
		});
		window.matchMedia('(min-width: 1025px)').addEventListener('change', function (mq) {
			if (mq.matches && !menu.hidden) { close(); }
		});
	}

	/* Before / after: drag, tap or use arrow keys. The "before" layer is clipped from the right. */
	document.querySelectorAll('.rek-ba').forEach(function (frame) {
		var pos = 50;
		var dragging = false;
		var label = document.documentElement.lang && document.documentElement.lang.indexOf('ar') === 0 ? 'مقارنة قبل وبعد' : 'Before and after comparison';
		frame.setAttribute('tabindex', '0');
		frame.setAttribute('role', 'slider');
		frame.setAttribute('aria-label', label);
		frame.setAttribute('aria-valuemin', '0');
		frame.setAttribute('aria-valuemax', '100');
		frame.querySelectorAll('img').forEach(function (img) { img.setAttribute('draggable', 'false'); });
		frame.addEventListener('dragstart', function (e) { e.preventDefault(); });
		var set = function (value) {
			pos = Math.max(0, Math.min(100, value));
			frame.style.setProperty('--pos', pos + '%');
			frame.setAttribute('aria-valuenow', String(Math.round(pos)));
		};
		var fromEvent = function (e) {
			var r = frame.getBoundingClientRect();
			set(((e.clientX - r.left) / r.width) * 100);
		};
		set(50);
		frame.addEventListener('pointerdown', function (e) {
			dragging = true;
			frame.classList.add('is-dragging');
			if (e.pointerType === 'mouse') { frame.setPointerCapture(e.pointerId); }
			fromEvent(e);
		});
		frame.addEventListener('pointermove', function (e) { if (dragging) { fromEvent(e); } });
		var stop = function () { dragging = false; frame.classList.remove('is-dragging'); };
		frame.addEventListener('pointerup', stop);
		frame.addEventListener('pointercancel', stop);
		frame.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { stop(); } });
		frame.addEventListener('keydown', function (e) {
			var step = e.shiftKey ? 10 : 2;
			if (e.key === 'ArrowLeft') { e.preventDefault(); set(pos - step); }
			if (e.key === 'ArrowRight') { e.preventDefault(); set(pos + step); }
			if (e.key === 'Home') { e.preventDefault(); set(0); }
			if (e.key === 'End') { e.preventDefault(); set(100); }
		});
	});

	/* Project filters: a rek-f-{cat} button shows the cards tagged rek-c-{cat}; rek-f-all shows every card. */
	var tagOf = function (el, prefix) {
		var m = el.className.match(new RegExp('(?:^|\\s)' + prefix + '([a-z0-9-]+)'));
		return m ? m[1] : '';
	};
	document.querySelectorAll('.rek-filter').forEach(function (bar) {
		var buttons = bar.querySelectorAll('[class*="rek-f-"]');
		var cards = (bar.closest('section') || document).querySelectorAll('[class*="rek-c-"]');
		if (!buttons.length) { return; }
		var show = function (btn) {
			var cat = tagOf(btn, 'rek-f-');
			buttons.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
			cards.forEach(function (card) { card.hidden = !(cat === 'all' || tagOf(card, 'rek-c-') === cat); });
		};
		bar.setAttribute('role', 'group');
		buttons.forEach(function (b) {
			b.setAttribute('type', 'button');
			b.addEventListener('click', function (e) { e.preventDefault(); show(b); });
		});
		show(buttons[0]);
	});

	/* Colour configurator: swatches are Elementor buttons whose own background colour is the paint colour. */
	document.querySelectorAll('.rek-cfg').forEach(function (cfg) {
		var paint = cfg.querySelector('.rek-cfg-paint');
		var name = cfg.querySelector('.rek-cfg-name');
		var swatches = cfg.querySelectorAll('.rek-sw');
		if (!paint || !swatches.length) { return; }
		var choose = function (sw) {
			var colour = window.getComputedStyle(sw).backgroundColor;
			var cls = sw.className;
			var finish = cls.indexOf('-matte') > -1 ? 'matte' : (cls.indexOf('-satin') > -1 ? 'satin' : 'gloss');
			paint.style.backgroundColor = colour;
			cfg.setAttribute('data-finish', finish);
			swatches.forEach(function (s) { s.setAttribute('aria-pressed', s === sw ? 'true' : 'false'); });
			if (name) { name.textContent = sw.getAttribute('aria-label') || sw.textContent.trim(); }
		};
		swatches.forEach(function (sw) {
			sw.setAttribute('type', 'button');
			sw.setAttribute('aria-pressed', 'false');
			if (!sw.getAttribute('aria-label')) { sw.setAttribute('aria-label', sw.textContent.trim()); }
			sw.addEventListener('click', function (e) { e.preventDefault(); choose(sw); });
		});
		choose(swatches[0]);
	});
})();
