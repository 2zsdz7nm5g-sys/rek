<?php
/**
 * Homepage space journey.
 *
 * Only on the homepage (the front page and its Polylang translations): the
 * existing homepage sections become stations along a scroll-driven camera
 * journey through space (assets/journey/). No other page loads or runs any of it.
 * Visitors who prefer reduced motion, or whose browser has no WebGL, keep the
 * regular homepage.
 *
 * @package rek-proffset
 */

defined( 'ABSPATH' ) || exit;

/* The homepage in any language: the front page, or a translation of it. */
function rek_is_home() {
	if ( is_front_page() ) {
		return true;
	}
	if ( ! is_page() || ! function_exists( 'pll_get_post_translations' ) ) {
		return false;
	}
	$front = (int) get_option( 'page_on_front' );
	return $front && in_array( (int) get_queried_object_id(), array_map( 'intval', pll_get_post_translations( $front ) ), true );
}

add_action( 'wp_enqueue_scripts', function () {
	if ( ! rek_is_home() ) {
		return;
	}
	// The journey draws the FlexiShield product itself.
	wp_dequeue_script( 'rek-fs3d' );
	wp_enqueue_style( 'rek-journey', REK_URI . '/assets/journey/rek-journey.css', [ 'rek' ], REK_VERSION );
	wp_enqueue_script( 'rek-three', REK_URI . '/assets/vendor/three.min.js', [], 'r128', [ 'strategy' => 'defer', 'in_footer' => true ] );
	wp_enqueue_script( 'rek-journey', REK_URI . '/assets/journey/rek-journey.js', [ 'rek-three' ], REK_VERSION, [ 'strategy' => 'defer', 'in_footer' => true ] );
}, 31 );

/*
 * Marks the page as the homepage before it paints, and hides the sections after
 * the hero until the journey has placed them (the hero stays visible). Falls back
 * to the regular page if the journey has not started after a few seconds.
 */
add_action( 'wp_head', function () {
	if ( ! rek_is_home() ) {
		return;
	}
	?>
	<script>(function(d){var r=d.documentElement;r.setAttribute('data-rek-home','');try{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){return;}var c=d.createElement('canvas');if(!(window.WebGLRenderingContext&&(c.getContext('webgl2')||c.getContext('webgl')))){return;}r.classList.add('rek-journey-boot');window.setTimeout(function(){if(!r.classList.contains('rek-journey')){r.classList.remove('rek-journey-boot');}},8000);}catch(e){}})(document);</script>
	<?php
}, 1 );
