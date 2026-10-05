<?php
/**
 * REK PROFFSET child theme bootstrap.
 *
 * @package rek-proffset
 */

defined( 'ABSPATH' ) || exit;

define( 'REK_VERSION', '1.8.26' );
define( 'REK_DIR', get_stylesheet_directory() );
define( 'REK_URI', get_stylesheet_directory_uri() );

require REK_DIR . '/inc/contact.php';
require REK_DIR . '/inc/chrome.php';
require REK_DIR . '/inc/seo.php';
require REK_DIR . '/inc/booking.php';
require REK_DIR . '/inc/location.php';
require REK_DIR . '/inc/fs3d.php';
require REK_DIR . '/inc/hero-video.php';
require REK_DIR . '/inc/garage-door.php';
require REK_DIR . '/inc/ppf-studio.php';
require REK_DIR . '/inc/work-gallery.php';

add_action( 'after_setup_theme', function () {
	register_nav_menus( [
		'rek_primary' => __( 'REK primary navigation', 'rek-proffset' ),
		'rek_footer'  => __( 'REK footer navigation', 'rek-proffset' ),
	] );
} );

/**
 * Fonts: one Google Fonts request with only the weights the design uses.
 * Elementor's own per-family requests (every weight and italic) are disabled
 * in the Elementor settings, so this is the single font request on the page.
 */
function rek_fonts_url() {
	return 'https://fonts.googleapis.com/css2?family=Alexandria:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap';
}

add_action( 'wp_head', function () {
	echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
	echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
}, 1 );

add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style( 'rek-fonts', rek_fonts_url(), [], null );
	wp_enqueue_style( 'rek', REK_URI . '/assets/rek.css', [], REK_VERSION );
	wp_enqueue_script( 'rek', REK_URI . '/assets/rek.js', [], REK_VERSION, [ 'strategy' => 'defer', 'in_footer' => true ] );
}, 20 );
