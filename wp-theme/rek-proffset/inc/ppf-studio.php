<?php
/**
 * [rek_ppf_studio]: REK PPF Color Studio.
 *
 * The approved Audi R8 model (/models/r8-rek-studio.glb) on a turntable in a
 * dark studio, with the official FlexiShield and REK logos as illuminated
 * wall signs behind it, and 99 PPF colours. Only the car's `body_color`
 * material is recoloured. The script, styles, decoder and logos load only on
 * pages that contain this shortcode; the 3D scene itself starts when the
 * studio scrolls into view.
 *
 * @package rek-proffset
 */

defined( 'ABSPATH' ) || exit;

function rek_ppf_studio_base() {
	return REK_URI . '/assets/ppf-studio/';
}

add_shortcode( 'rek_ppf_studio', function () {
	$base   = rek_ppf_studio_base();
	$colors = file_get_contents( REK_DIR . '/assets/ppf-studio/colors.json' ); // phpcs:ignore WordPress.WP.AlternativeFunctions
	$counts = array_count_values( array_column( json_decode( $colors, true ), 'cat' ) );
	$wa     = rek_whatsapp_digits();
	$logos  = [ 'rek' => $base . 'rek-logo.png?ver=' . REK_VERSION, 'flexi' => $base . 'flexishield-logo.png?ver=' . REK_VERSION ];
	$i18n   = [ 'original' => rek_t( 'اللون الأصلي', 'Original colour' ), 'originalFinish' => rek_t( 'لامع · Gloss', 'Gloss' ) ];
	$cats   = [
		'all'      => [ rek_t( 'الكل', 'All' ), 'ALL', array_sum( $counts ) ],
		'gloss'    => [ rek_t( 'لامع', 'Gloss' ), 'GLOSS', $counts['gloss'] ],
		'matte'    => [ rek_t( 'مطفي', 'Matte' ), 'MATTE', $counts['matte'] ],
		'satin'    => [ rek_t( 'ساتان', 'Satin' ), 'SATIN', $counts['satin'] ],
		'metallic' => [ rek_t( 'معدني', 'Metallic' ), 'METALLIC', $counts['metallic'] ],
		'special'  => [ rek_t( 'خاص', 'Special' ), 'SPECIAL', $counts['special'] ],
	];
	$icon = function ( $d ) {
		return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' . $d . '</svg>';
	};
	ob_start();
	?>
	<section class="rek-ppf" id="ppf-studio" aria-labelledby="rek-ppf-title" data-rek-ppf
		data-lang="<?php echo esc_attr( is_rtl() ? 'ar' : 'en' ); ?>"
		data-model="<?php echo esc_url( site_url( '/models/r8-rek-studio.glb' ) ); ?>"
		data-draco="<?php echo esc_url( $base . 'draco/' ); ?>"
		data-logos="<?php echo esc_attr( wp_json_encode( $logos ) ); ?>"
		data-wa="<?php echo esc_attr( $wa ); ?>"
		data-i18n="<?php echo esc_attr( wp_json_encode( $i18n ) ); ?>">
		<header class="rek-ppf__head">
			<p class="rek-ppf__label" dir="ltr">REK PPF COLOR STUDIO</p>
			<h1 class="rek-ppf__title" id="rek-ppf-title"><?php echo esc_html( rek_t( 'استوديو ألوان PPF', 'PPF Color Studio' ) ); ?></h1>
			<p class="rek-ppf__lead"><?php echo esc_html( rek_t( 'أدِر السيارة 360° واختر من 99 لون PPF لترى كيف يبدو فلم الحماية الملوّن على الطلاء.', 'Turn the car 360° and choose from 99 PPF colours to see how coloured protection film looks on the paint.' ) ); ?></p>
		</header>

		<div class="rek-ppf__frame">
			<div class="rek-ppf__stage" data-ppf-stage tabindex="0" role="img"
				aria-label="<?php echo esc_attr( rek_t( 'سيارة Audi R8 ثلاثية الأبعاد في استوديو REK. اسحب أو استخدم الأسهم للتدوير، و + و - للتقريب.', 'Audi R8 in 3D in the REK studio. Drag or use the arrow keys to turn it, + and - to zoom.' ) ); ?>">
				<img class="rek-ppf__poster" src="<?php echo esc_url( $base . 'poster.webp?ver=' . REK_VERSION ); ?>" alt="" width="1600" height="900" decoding="async">
				<p class="rek-ppf__hint" aria-hidden="true">
					<span class="rek-ppf__hint--mouse"><?php echo esc_html( rek_t( 'اسحب للتدوير · عجلة الفأرة للتقريب', 'Drag to turn · scroll to zoom' ) ); ?></span>
					<span class="rek-ppf__hint--touch"><?php echo esc_html( rek_t( 'اسحب أفقياً للتدوير · قرّب بإصبعين', 'Swipe to turn · pinch to zoom' ) ); ?></span>
				</p>
				<div class="rek-ppf__tools" role="group" aria-label="<?php echo esc_attr( rek_t( 'التحكم بالعرض', 'View controls' ) ); ?>">
					<button type="button" class="rek-ppf__tool" data-ppf-action="spin" aria-pressed="false" disabled title="360°" aria-label="<?php echo esc_attr( rek_t( 'تدوير 360° تلقائي', 'Auto-rotate 360°' ) ); ?>"><span dir="ltr">360°</span></button>
					<button type="button" class="rek-ppf__tool" data-ppf-action="zoomin" disabled aria-label="<?php echo esc_attr( rek_t( 'تقريب', 'Zoom in' ) ); ?>"><?php echo $icon( '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2M11 8v6M8 11h6"/>' ); // phpcs:ignore ?></button>
					<button type="button" class="rek-ppf__tool" data-ppf-action="zoomout" disabled aria-label="<?php echo esc_attr( rek_t( 'تبعيد', 'Zoom out' ) ); ?>"><?php echo $icon( '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2M8 11h6"/>' ); // phpcs:ignore ?></button>
				</div>
				<div class="rek-ppf__loader" aria-live="polite">
					<span class="rek-ppf__status" data-ppf-status
						data-nowebgl="<?php echo esc_attr( rek_t( 'العرض ثلاثي الأبعاد غير مدعوم على هذا الجهاز.', '3D view is not supported on this device.' ) ); ?>"
						data-error="<?php echo esc_attr( rek_t( 'تعذّر تحميل الاستوديو ثلاثي الأبعاد.', 'The 3D studio could not be loaded.' ) ); ?>"><?php echo esc_html( rek_t( 'جاري تحميل الاستوديو', 'Loading the studio' ) ); ?></span>
					<i class="rek-ppf__track"><b class="rek-ppf__bar" data-ppf-bar></b></i>
				</div>
			</div>

			<div class="rek-ppf__panel">
				<div class="rek-ppf__readout" aria-live="polite">
					<span class="rek-ppf__dot" data-ppf-dot></span>
					<span class="rek-ppf__meta">
						<small dir="ltr"><?php echo esc_html( rek_t( 'اللون المختار', 'SELECTED' ) ); ?> <b data-ppf-id></b></small>
						<span class="rek-ppf__name" data-ppf-name></span>
						<span class="rek-ppf__sub" data-ppf-sub dir="ltr"></span>
						<span class="rek-ppf__finish" data-ppf-finish></span>
					</span>
				</div>
				<div class="rek-ppf__tabs" role="tablist" aria-label="<?php echo esc_attr( rek_t( 'أنواع الفلم', 'Film finishes' ) ); ?>">
					<?php foreach ( $cats as $key => $c ) : ?>
						<button type="button" role="tab" class="rek-ppf__tab" data-ppf-cat="<?php echo esc_attr( $key ); ?>" aria-label="<?php echo esc_attr( $c[0] . ' (' . $c[2] . ')' ); ?>" title="<?php echo esc_attr( $c[0] ); ?>" aria-selected="<?php echo 'all' === $key ? 'true' : 'false'; ?>">
							<span class="rek-ppf__tab-en" dir="ltr"><?php echo esc_html( $c[1] ); ?></span>
							<span class="rek-ppf__tab-n"><?php echo (int) $c[2]; ?></span>
						</button>
					<?php endforeach; ?>
				</div>
				<ul class="rek-ppf__grid" data-ppf-grid tabindex="-1" aria-label="<?php echo esc_attr( rek_t( 'ألوان PPF', 'PPF colours' ) ); ?>"></ul>
				<div class="rek-ppf__actions">
					<a class="rek-ppf__order is-disabled" data-ppf-order aria-disabled="true" target="_blank" rel="noopener noreferrer">
						<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="<?php echo esc_attr( REK_WHATSAPP_ICON_PATH ); ?>"/></svg>
						<span><?php echo esc_html( rek_t( 'اطلب هذا اللون', 'Order this colour' ) ); ?></span>
					</a>
					<div class="rek-ppf__row">
						<button type="button" class="rek-ppf__btn" data-ppf-action="original" disabled><?php echo esc_html( rek_t( 'الأصلي', 'Original' ) ); ?></button>
						<button type="button" class="rek-ppf__btn" data-ppf-action="reset" disabled><?php echo esc_html( rek_t( 'إعادة الضبط', 'Reset' ) ); ?></button>
					</div>
					<p class="rek-ppf__note"><?php echo esc_html( rek_t( 'الألوان للمعاينة؛ قد يختلف اللون الحقيقي قليلاً حسب الإضاءة والشاشة. اطلب عيّنة في المركز.', 'Colours are a preview; the real film can look slightly different with lighting and screens. Ask for a sample at the studio.' ) ); ?></p>
				</div>
			</div>
		</div>
		<script type="application/json" data-ppf-colors><?php echo $colors; // phpcs:ignore WordPress.Security.EscapeOutput -- static JSON file shipped with the theme ?></script>
	</section>
	<?php
	return ob_get_clean();
} );

/* Assets only on pages that contain the studio. */
add_action( 'wp_enqueue_scripts', function () {
	if ( ! is_singular() ) {
		return;
	}
	$data = get_post_meta( get_queried_object_id(), '_elementor_data', true );
	$post = get_post( get_queried_object_id() );
	$has  = ( is_string( $data ) && false !== strpos( $data, 'rek_ppf_studio' ) ) || ( $post && has_shortcode( $post->post_content, 'rek_ppf_studio' ) );
	if ( $has ) {
		wp_enqueue_style( 'rek-ppf-studio', rek_ppf_studio_base() . 'ppf-studio.css', [ 'rek' ], REK_VERSION );
		wp_enqueue_script( 'rek-ppf-studio', rek_ppf_studio_base() . 'ppf-studio.min.js', [], REK_VERSION, [ 'strategy' => 'defer', 'in_footer' => true ] );
	}
}, 30 );
