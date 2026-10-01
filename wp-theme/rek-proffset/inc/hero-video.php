<?php
/**
 * Homepage hero video.
 *
 * Two ready-made H.264 files are served as they are (no re-encoding):
 * assets/video/hero-desktop-1920x1080.mp4 for landscape screens and
 * assets/video/hero-mobile-1080x1920.mp4 for phones and portrait screens.
 *
 * The existing hero image stays in place as the poster and fallback: the
 * <video> is layered over it with the same rk-cover class, carries no src
 * in the markup, and rek.js gives it the right file after the page has
 * loaded, fading it in only once it is actually playing. So the image
 * remains the first paint, and wherever autoplay is not possible (Low Power
 * Mode, Save-Data, reduced motion, no JavaScript) the hero looks as before.
 *
 * @package rek-proffset
 */

defined( 'ABSPATH' ) || exit;

/**
 * Screens that get the portrait file: the site's mobile breakpoint, plus any
 * screen that is taller than it is wide (tablets in portrait).
 */
const REK_HERO_VIDEO_PORTRAIT_QUERY = '(max-width: 767px), (max-aspect-ratio: 1/1)';

/** The homepage in every language: the static front page when one is set, else the Arabic homepage (page 138). */
function rek_home_page_ids() {
	$front = (int) get_option( 'page_on_front' );
	$front = $front ? $front : 138;
	$ids   = function_exists( 'pll_get_post_translations' ) ? array_values( pll_get_post_translations( $front ) ) : [];
	$ids[] = $front;
	return array_map( 'intval', array_unique( $ids ) );
}

/* Insert the video right after the hero image, on the homepage only. */
add_filter( 'elementor/frontend/the_content', function ( $content ) {
	if ( ! is_singular() || ! in_array( get_queried_object_id(), rek_home_page_ids(), true ) ) {
		return $content;
	}
	$base  = REK_URI . '/assets/video/';
	$video = sprintf(
		'<video class="rk-cover rek-hero-video" muted autoplay loop playsinline webkit-playsinline preload="none" disablepictureinpicture disableremoteplayback aria-hidden="true" tabindex="-1" data-rek-hero-video data-src-desktop="%1$s" data-src-mobile="%2$s" data-portrait="%3$s"></video>',
		esc_url( $base . 'hero-desktop-1920x1080.mp4?ver=' . REK_VERSION ),
		esc_url( $base . 'hero-mobile-1080x1920.mp4?ver=' . REK_VERSION ),
		esc_attr( REK_HERO_VIDEO_PORTRAIT_QUERY )
	);
	return preg_replace_callback( '#<img\b[^>]*\brk-hero-img\b[^>]*>#', function ( $m ) use ( $video ) {
		return $m[0] . $video;
	}, $content, 1 );
} );
