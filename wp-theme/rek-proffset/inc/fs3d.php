<?php
/**
 * [rek_fs3d]: FlexiShield 3D product stage, placed directly under the hero.
 *
 * The markup always contains a rendered still of the product, so reduced
 * motion, missing WebGL or disabled JavaScript still show the product.
 * assets/rek-fs3d.js upgrades it to the scroll-driven Three.js scene;
 * Three.js itself (assets/vendor/three.min.js, r128, MIT) is only fetched
 * when the stage is near the viewport.
 *
 * @package rek-proffset
 */

defined( 'ABSPATH' ) || exit;

add_shortcode( 'rek_fs3d', function () {
	$base = REK_URI . '/assets/fs3d/';
	ob_start();
	?>
	<section class="rek-fs3d" aria-labelledby="rek-fs3d-title">
		<div class="rek-fs3d__stage" data-rek-fs3d
			data-three="<?php echo esc_url( REK_URI . '/assets/vendor/three.min.js?ver=r128' ); ?>"
			data-textures="<?php echo esc_url( $base ); ?>">
			<?php if ( rek_is_rtl_lang() ) : ?>
				<div class="rek-fs3d__words" aria-hidden="true">
					<?php
					// Behind the product (earlier in the markup than the still and the canvas). Revealed one at a time,
					// in this order, one per upward scroll gesture (see rek-fs3d.js).
					foreach ( [ 'حماية', 'أمان', 'لمعان', 'ثقة' ] as $i => $word ) :
						?>
						<span class="rek-bubble rek-bubble--<?php echo (int) $i + 1; ?>"><span class="rek-bubble__word"><?php echo esc_html( $word ); ?></span></span>
					<?php endforeach; ?>
				</div>
			<?php endif; ?>
			<img class="rek-fs3d__still" src="<?php echo esc_url( $base . 'still.webp' ); ?>" width="434" height="1200" loading="lazy" decoding="async"
				alt="<?php echo esc_attr( rek_t( 'عبوة فلم حماية الطلاء FlexiShield', 'FlexiShield paint protection film packaging' ) ); ?>">
			<div class="rek-fs3d__canvas"></div>
			<div class="rek-fs3d__copy">
				<p class="rek-fs3d__label" dir="ltr">FLEXISHIELD<sup>&reg;</sup> PPF</p>
				<h2 class="rek-fs3d__title" id="rek-fs3d-title"><?php echo esc_html( rek_t( 'حماية متقدمة لطلاء سيارتك', 'Advanced protection for your car\'s paint' ) ); ?></h2>
			</div>
		</div>
	</section>
	<?php
	return ob_get_clean();
} );

/* Load the stage script only on pages that contain the stage (Elementor data holds the shortcode). */
add_action( 'wp_enqueue_scripts', function () {
	if ( ! is_singular() ) {
		return;
	}
	$data = get_post_meta( get_queried_object_id(), '_elementor_data', true );
	if ( is_string( $data ) && false !== strpos( $data, 'rek_fs3d' ) ) {
		wp_enqueue_script( 'rek-fs3d', REK_URI . '/assets/rek-fs3d.js', [], REK_VERSION, [ 'strategy' => 'defer', 'in_footer' => true ] );
	}
}, 30 );
