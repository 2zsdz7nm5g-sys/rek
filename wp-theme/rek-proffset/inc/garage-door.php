<?php
/**
 * Homepage entrance: a closed sectional garage door the visitor lifts by
 * swiping or scrolling up (assets/garage/). Homepage only (the front page and
 * its Polylang translation), in the page's language. Visitors who prefer
 * reduced motion, or whose browser does not run the script, get the homepage
 * directly.
 *
 * @package rek-proffset
 */

defined( 'ABSPATH' ) || exit;

/* The homepage in any language: the front page, or a translation of it. */
function rek_garage_is_home() {
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
	if ( ! rek_garage_is_home() ) {
		return;
	}
	wp_enqueue_style( 'rek-garage', REK_URI . '/assets/garage/garage.css', [ 'rek' ], REK_VERSION );
	wp_enqueue_script( 'rek-garage', REK_URI . '/assets/garage/garage.js', [], REK_VERSION, [ 'strategy' => 'defer', 'in_footer' => true ] );
}, 30 );

/*
 * Before the page paints: show the closed door (unless reduced motion is preferred
 * or the visitor arrives at a section link). If the door script has not taken over
 * after a few seconds, the door steps aside so the homepage is never blocked.
 */
add_action( 'wp_head', function () {
	if ( ! rek_garage_is_home() ) {
		return;
	}
	?>
	<script>(function(d,w){var r=d.documentElement;try{if(w.matchMedia('(prefers-reduced-motion: reduce)').matches||w.location.hash){return;}}catch(e){return;}r.classList.add('rek-garage-on');w.setTimeout(function(){if(!r.classList.contains('rek-garage-ready')){r.classList.remove('rek-garage-on');}},6000);})(document,window);</script>
	<?php
}, 1 );

add_action( 'wp_body_open', function () {
	if ( ! rek_garage_is_home() ) {
		return;
	}
	$logo_id = (int) get_theme_mod( 'custom_logo' );
	$logo    = $logo_id ? wp_get_attachment_image( $logo_id, 'medium', false, [
		'class'    => 'rek-garage__logo',
		'alt'      => 'REK PROFFSET',
		'loading'  => 'eager',
		'decoding' => 'async',
	] ) : '';
	?>
	<div class="rek-garage" id="rek-garage" role="button" tabindex="0" aria-label="<?php echo esc_attr( rek_t( 'ارفع باب المرآب لدخول الموقع', 'Raise the garage door to enter the site' ) ); ?>">
		<div class="rek-garage__dark"></div>
		<div class="rek-garage__spill"></div>
		<div class="rek-garage__door"></div>
		<div class="rek-garage__light"></div>
		<div class="rek-garage__sign" dir="<?php echo esc_attr( rek_t( 'rtl', 'ltr' ) ); ?>">
			<?php echo $logo; // phpcs:ignore WordPress.Security.EscapeOutput -- core image markup ?>
			<p class="rek-garage__brand" dir="ltr">REK <span>PROFFSET</span></p>
			<p class="rek-garage__company"><?php echo esc_html( rek_t( 'شركة ريك بروفسيت للعناية بالسيارات', 'Automotive Care Company' ) ); ?></p>
			<p class="rek-garage__motto"><?php echo esc_html( rek_t( 'العناية ليست خيارًا، إنها هويتنا.', 'Care Is Not an Option. It\'s Our Identity.' ) ); ?></p>
			<p class="rek-garage__lift"><span><?php echo esc_html( rek_t( 'ارفع الباب… واكتشف عالم REK', 'Raise the Door… Discover the REK World' ) ); ?> <b aria-hidden="true">↑</b></span></p>
		</div>
		<div class="rek-garage__seal"></div>
		<div class="rek-garage__lintel"></div>
		<div class="rek-garage__jamb rek-garage__jamb--l"></div>
		<div class="rek-garage__jamb rek-garage__jamb--r"></div>
	</div>
	<?php
}, 1 );
