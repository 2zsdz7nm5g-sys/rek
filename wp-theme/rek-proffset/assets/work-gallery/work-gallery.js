/*
 * REK work gallery: service filter and project lightbox.
 * Without this script the gallery still works: every photo is a plain link to its large version.
 */
(function () {
	'use strict';
	var root = document.querySelector('[data-rek-wg]');
	if (!root) { return; }
	var rtl = (document.documentElement.getAttribute('dir') || getComputedStyle(root).direction) === 'rtl';
	var t = {};
	try { t = JSON.parse(root.getAttribute('data-i18n') || '{}'); } catch (e) { /* keep defaults */ }

	/* ---------- Service filter ---------- */
	var chips = root.querySelectorAll('[data-wg-filter]');
	var sections = root.querySelectorAll('[data-wg-svc]');
	chips.forEach(function (chip) {
		chip.addEventListener('click', function () {
			var key = chip.getAttribute('data-wg-filter');
			chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
			sections.forEach(function (s) { s.hidden = key !== 'all' && s.getAttribute('data-wg-svc') !== key; });
		});
	});

	/* ---------- Lightbox ---------- */
	var icon = function (d) { return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + d + '</svg>'; };
	var lb = document.createElement('div');
	lb.className = 'rek-wg-lb';
	lb.hidden = true;
	lb.setAttribute('role', 'dialog');
	lb.setAttribute('aria-modal', 'true');
	lb.setAttribute('aria-label', t.dialog || 'Project photos');
	lb.innerHTML =
		'<div class="rek-wg-lb__bar"><p class="rek-wg-lb__caption"></p><span class="rek-wg-lb__count" dir="ltr"></span>' +
		'<button type="button" class="rek-wg-lb__btn" data-lb="close" aria-label="' + (t.close || 'Close') + '">' + icon('<path d="M6 6l12 12M18 6L6 18"/>') + '</button></div>' +
		'<div class="rek-wg-lb__stage"><img class="rek-wg-lb__img" alt="" decoding="async">' +
		'<button type="button" class="rek-wg-lb__btn rek-wg-lb__nav rek-wg-lb__nav--prev" data-lb="prev" aria-label="' + (t.prev || 'Previous') + '">' + icon('<path d="M15 6l-6 6 6 6"/>') + '</button>' +
		'<button type="button" class="rek-wg-lb__btn rek-wg-lb__nav rek-wg-lb__nav--next" data-lb="next" aria-label="' + (t.next || 'Next') + '">' + icon('<path d="M9 6l6 6-6 6"/>') + '</button></div>' +
		'<div class="rek-wg-lb__strip"></div>';
	document.body.appendChild(lb);
	var img = lb.querySelector('.rek-wg-lb__img'), cap = lb.querySelector('.rek-wg-lb__caption'),
		count = lb.querySelector('.rek-wg-lb__count'), strip = lb.querySelector('.rek-wg-lb__strip');
	var photos = [], caption = '', index = 0, opener = null;

	function show(i) {
		index = (i + photos.length) % photos.length;
		var p = photos[index];
		img.classList.add('is-loading');
		img.onload = function () { img.classList.remove('is-loading'); };
		img.sizes = '100vw';
		img.srcset = p.srcset;
		img.src = p.src;
		img.width = p.w; img.height = p.h;
		img.alt = caption + ' · ' + (index + 1) + ' / ' + photos.length;
		count.textContent = (index + 1) + ' / ' + photos.length;
		strip.querySelectorAll('button').forEach(function (b, k) { b.setAttribute('aria-current', k === index ? 'true' : 'false'); });
		var cur = strip.children[index];
		if (cur && cur.scrollIntoView) { cur.scrollIntoView({ block: 'nearest', inline: 'center' }); }
		[index + 1, index - 1].forEach(function (k) { /* warm the neighbours */
			var n = photos[(k + photos.length) % photos.length];
			if (n) { var pre = new Image(); pre.sizes = '100vw'; pre.srcset = n.srcset; pre.src = n.src; }
		});
	}
	function open(project, i, from) {
		try { photos = JSON.parse(project.getAttribute('data-wg-photos')); } catch (e) { return false; }
		caption = project.getAttribute('data-wg-caption') || '';
		cap.textContent = caption;
		opener = from;
		strip.innerHTML = '';
		photos.forEach(function (p, k) {
			var b = document.createElement('button');
			b.type = 'button'; b.className = 'rek-wg-lb__dot';
			b.setAttribute('aria-label', (k + 1) + ' / ' + photos.length);
			b.innerHTML = '<img alt="" loading="lazy" decoding="async" src="' + p.src.replace(/-960\.webp$/, '-480.webp') + '">';
			b.addEventListener('click', function () { show(k); });
			strip.appendChild(b);
		});
		strip.hidden = photos.length < 2;
		lb.querySelectorAll('.rek-wg-lb__nav').forEach(function (b) { b.hidden = photos.length < 2; });
		lb.hidden = false;
		document.documentElement.classList.add('rek-wg-lock');
		requestAnimationFrame(function () { lb.classList.add('is-open'); });
		show(i);
		lb.querySelector('[data-lb="close"]').focus();
		return true;
	}
	function close() {
		lb.classList.remove('is-open');
		lb.hidden = true;
		img.removeAttribute('src'); img.removeAttribute('srcset');
		document.documentElement.classList.remove('rek-wg-lock');
		if (opener) { opener.focus(); }
	}

	root.addEventListener('click', function (e) {
		var a = e.target.closest('[data-wg-open]');
		if (!a) { return; }
		var project = a.closest('[data-wg-project]');
		if (project && open(project, parseInt(a.getAttribute('data-wg-open'), 10) || 0, a)) { e.preventDefault(); }
	});
	lb.addEventListener('click', function (e) {
		var b = e.target.closest('[data-lb]');
		if (b) {
			var act = b.getAttribute('data-lb');
			if (act === 'close') { close(); } else { show(index + (act === 'next' ? 1 : -1)); }
		} else if (e.target === lb || e.target.classList.contains('rek-wg-lb__stage')) {
			close();
		}
	});
	document.addEventListener('keydown', function (e) {
		if (lb.hidden) { return; }
		if (e.key === 'Escape') { close(); }
		else if (e.key === 'ArrowRight') { show(index + (rtl ? -1 : 1)); }
		else if (e.key === 'ArrowLeft') { show(index + (rtl ? 1 : -1)); }
		else if (e.key === 'Tab') { /* keep focus inside the dialog */
			var f = lb.querySelectorAll('button:not([hidden])');
			var first = f[0], last = f[f.length - 1];
			if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
			else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
		}
	});
	/* Swipe: follow the reading direction (in RTL, swiping right shows the next photo). */
	var x0 = null, y0 = null;
	lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
	lb.addEventListener('touchend', function (e) {
		if (x0 === null) { return; }
		var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
		x0 = null;
		if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2 && photos.length > 1) {
			show(index + ((dx < 0) !== rtl ? 1 : -1));
		}
	}, { passive: true });
})();
