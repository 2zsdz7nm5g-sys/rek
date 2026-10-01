<?php
/**
 * [rek_work_gallery]: REK PROFFSET project gallery (the "أعمالنا" page).
 *
 * Real project photos, grouped Service > Vehicle > Colour / finish > Photos.
 * The data lives in assets/work-gallery/projects.json (built by
 * tools/work-gallery/build.py); the photos are web-optimised WebP files in
 * uploads/rek-work/ at 480, 960 and up to 1600 px wide. The markup is rendered
 * here so it works without JavaScript; work-gallery.js adds the service
 * filter and the lightbox. Assets load only on pages that use the shortcode.
 *
 * @package rek-proffset
 */

defined( 'ABSPATH' ) || exit;

function rek_wg_data() {
	static $data = null;
	if ( null === $data ) {
		$data = json_decode( (string) file_get_contents( REK_DIR . '/assets/work-gallery/projects.json' ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions
	}
	return $data;
}

function rek_wg_photo_url( $file, $width ) {
	return wp_upload_dir()['baseurl'] . '/rek-work/' . $file . '-' . $width . '.webp';
}

/* Arabic counts: 1 / 2 / 3-10 / 11+ forms; English singular / plural. */
function rek_wg_count( $n, $forms_ar, $forms_en ) {
	if ( ! is_rtl() ) {
		return 1 === $n ? '1 ' . $forms_en[0] : $n . ' ' . $forms_en[1];
	}
	if ( 1 === $n ) {
		return $forms_ar[0];
	}
	if ( 2 === $n ) {
		return $forms_ar[1];
	}
	return $n . ' ' . ( $n <= 10 ? $forms_ar[2] : $forms_ar[3] );
}

function rek_wg_photos_label( $n ) {
	return rek_wg_count( $n, [ 'صورة واحدة', 'صورتان', 'صور', 'صورة' ], [ 'photo', 'photos' ] );
}

function rek_wg_projects_label( $n ) {
	return rek_wg_count( $n, [ 'مشروع واحد', 'مشروعان', 'مشاريع', 'مشروعًا' ], [ 'project', 'projects' ] );
}

function rek_wg_srcset( $photo ) {
	/* Files are named by target width (480 / 960 / 1600); "s" holds each file's real width. */
	$set = [];
	foreach ( [ 480, 960, 1600 ] as $i => $target ) {
		$set[ (int) $photo['s'][ $i ] ] = esc_url( rek_wg_photo_url( $photo['f'], $target ) ) . ' ' . (int) $photo['s'][ $i ] . 'w';
	}
	return implode( ', ', $set );
}

add_shortcode( 'rek_work_gallery', function () {
	$data = rek_wg_data();
	if ( ! $data ) {
		return '';
	}
	$lang     = is_rtl() ? 'ar' : 'en';
	$projects = $data['projects'];
	$by_svc   = [];
	foreach ( $projects as $p ) {
		$by_svc[ $p['service'] ][] = $p;
	}
	$services = array_values( array_filter( $data['services'], function ( $s ) use ( $by_svc ) {
		return ! empty( $by_svc[ $s['key'] ] );
	} ) );
	$total_photos = array_sum( array_map( function ( $p ) {
		return count( $p['photos'] );
	}, $projects ) );
	$i18n = [
		'close'   => rek_t( 'إغلاق', 'Close' ),
		'prev'    => rek_t( 'الصورة السابقة', 'Previous photo' ),
		'next'    => rek_t( 'الصورة التالية', 'Next photo' ),
		'dialog'  => rek_t( 'صور المشروع', 'Project photos' ),
	];
	ob_start();
	?>
	<div class="rek-wg" data-rek-wg data-i18n="<?php echo esc_attr( wp_json_encode( $i18n ) ); ?>">
		<div class="rek-wg__chips" role="toolbar" aria-label="<?php echo esc_attr( rek_t( 'تصفية حسب الخدمة', 'Filter by service' ) ); ?>">
			<button type="button" class="rek-wg__chip" data-wg-filter="all" aria-pressed="true"><?php echo esc_html( rek_t( 'الكل', 'All' ) ); ?> <span class="rek-wg__n"><?php echo (int) count( $projects ); ?></span></button>
			<?php foreach ( $services as $s ) : ?>
				<button type="button" class="rek-wg__chip" data-wg-filter="<?php echo esc_attr( $s['key'] ); ?>" aria-pressed="false"><?php echo esc_html( $s[ $lang ] ); ?> <span class="rek-wg__n"><?php echo (int) count( $by_svc[ $s['key'] ] ); ?></span></button>
			<?php endforeach; ?>
		</div>
		<p class="rek-wg__summary"><?php echo esc_html( rek_wg_projects_label( count( $projects ) ) . ' · ' . rek_wg_photos_label( $total_photos ) ); ?></p>

		<?php
		foreach ( $services as $si => $s ) :
			$families = [];
			foreach ( $by_svc[ $s['key'] ] as $p ) {
				$families[ $p['family'] ][] = $p;
			}
			$photo_n = array_sum( array_map( function ( $p ) {
				return count( $p['photos'] );
			}, $by_svc[ $s['key'] ] ) );
			?>
			<section class="rek-wg__svc" data-wg-svc="<?php echo esc_attr( $s['key'] ); ?>" aria-labelledby="rek-wg-<?php echo esc_attr( $s['key'] ); ?>">
				<header class="rek-wg__svc-head">
					<p class="rek-wg__label" dir="ltr"><?php echo esc_html( sprintf( '%02d', $si + 1 ) . ' / ' . strtoupper( $s['en'] ) ); ?></p>
					<h3 class="rek-wg__svc-title" id="rek-wg-<?php echo esc_attr( $s['key'] ); ?>"><?php echo esc_html( $s[ $lang ] ); ?></h3>
					<p class="rek-wg__meta"><?php echo esc_html( rek_wg_projects_label( count( $by_svc[ $s['key'] ] ) ) . ' · ' . rek_wg_photos_label( $photo_n ) ); ?></p>
				</header>
				<div class="rek-wg__families">
				<?php foreach ( $families as $fam => $items ) : ?>
					<div class="rek-wg__family rek-wg__family--n<?php echo (int) min( 3, count( $items ) ); ?>">
						<h4 class="rek-wg__family-title"><?php echo esc_html( $data['families'][ $fam ][ $lang ] ); ?> <span class="rek-wg__family-n"><?php echo esc_html( rek_wg_projects_label( count( $items ) ) ); ?></span></h4>
						<div class="rek-wg__grid">
							<?php
							foreach ( $items as $p ) :
								$n       = count( $p['photos'] );
								$finish  = $p['finish'] ? $p['finish'][ $lang ] : '';
								$label   = strtoupper( $s['en'] ) . ( $p['finish'] ? ' · ' . strtoupper( $p['finish']['en'] ) : '' );
								$sub     = $p['colour'][ $lang ] . ( $finish ? ' · ' . $finish : '' );
								$caption = $p['model'][ $lang ] . ' · ' . $sub;
								$cover   = $p['photos'][0];
								$photos  = array_map( function ( $ph ) {
									return [ 'src' => rek_wg_photo_url( $ph['f'], 960 ), 'srcset' => rek_wg_srcset( $ph ), 'w' => $ph['w'], 'h' => $ph['h'] ];
								}, $p['photos'] );
								?>
								<article class="rek-wg__proj" data-wg-project="<?php echo esc_attr( $p['id'] ); ?>" data-wg-photos="<?php echo esc_attr( wp_json_encode( $photos ) ); ?>" data-wg-caption="<?php echo esc_attr( $caption ); ?>">
									<a class="rek-wg__cover" data-elementor-open-lightbox="no" href="<?php echo esc_url( rek_wg_photo_url( $cover['f'], 1600 ) ); ?>" data-wg-open="0" aria-label="<?php echo esc_attr( $caption . ' · ' . rek_wg_photos_label( $n ) ); ?>">
										<img src="<?php echo esc_url( rek_wg_photo_url( $cover['f'], 960 ) ); ?>" srcset="<?php echo rek_wg_srcset( $cover ); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped in rek_wg_srcset ?>" sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1024px) 45vw, 30vw" width="<?php echo (int) $cover['w']; ?>" height="<?php echo (int) $cover['h']; ?>" alt="<?php echo esc_attr( $caption ); ?>" loading="lazy" decoding="async">
										<span class="rek-wg__badge"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M4 7h12v12H4zM8 4h12v12"/></svg><?php echo esc_html( rek_wg_photos_label( $n ) ); ?></span>
									</a>
									<?php if ( $n > 1 ) : ?>
										<div class="rek-wg__thumbs">
											<?php
											$shown = min( 4, $n - 1 );
											for ( $t = 1; $t <= $shown; $t++ ) :
												$ph   = $p['photos'][ $t ];
												$more = ( $t === $shown && $n - 1 > $shown ) ? $n - 1 - $shown : 0;
												?>
												<a class="rek-wg__thumb" data-elementor-open-lightbox="no" href="<?php echo esc_url( rek_wg_photo_url( $ph['f'], 1600 ) ); ?>" data-wg-open="<?php echo (int) $t; ?>" aria-label="<?php echo esc_attr( $caption . ' · ' . ( $t + 1 ) . ' / ' . $n ); ?>">
													<img src="<?php echo esc_url( rek_wg_photo_url( $ph['f'], 480 ) ); ?>" width="<?php echo (int) $ph['s'][0]; ?>" height="<?php echo (int) round( $ph['h'] * $ph['s'][0] / $ph['w'] ); ?>" alt="" loading="lazy" decoding="async">
													<?php if ( $more ) : ?><span class="rek-wg__more" dir="ltr">+<?php echo (int) $more; ?></span><?php endif; ?>
												</a>
											<?php endfor; ?>
										</div>
									<?php endif; ?>
									<div class="rek-wg__info">
										<p class="rek-wg__label" dir="ltr"><?php echo esc_html( $label ); ?></p>
										<h5 class="rek-wg__title"><?php echo esc_html( $p['model'][ $lang ] ); ?></h5>
										<p class="rek-wg__sub"><?php echo esc_html( $sub ); ?></p>
										<?php if ( ! empty( $p['vehicle'] ) ) : ?>
											<p class="rek-wg__vehicle"><?php echo esc_html( rek_t( 'السيارة: ', 'Vehicle: ' ) . $p['vehicle'][ $lang ] ); ?></p>
										<?php endif; ?>
									</div>
								</article>
							<?php endforeach; ?>
						</div>
					</div>
				<?php endforeach; ?>
				</div>
			</section>
		<?php endforeach; ?>
	</div>
	<?php
	return ob_get_clean();
} );

/* Assets only on pages that contain the gallery. */
add_action( 'wp_enqueue_scripts', function () {
	if ( ! is_singular() ) {
		return;
	}
	$id   = get_queried_object_id();
	$data = get_post_meta( $id, '_elementor_data', true );
	$post = get_post( $id );
	if ( ( is_string( $data ) && false !== strpos( $data, 'rek_work_gallery' ) ) || ( $post && has_shortcode( $post->post_content, 'rek_work_gallery' ) ) ) {
		wp_enqueue_style( 'rek-work-gallery', REK_URI . '/assets/work-gallery/work-gallery.css', [ 'rek' ], REK_VERSION );
		wp_enqueue_script( 'rek-work-gallery', REK_URI . '/assets/work-gallery/work-gallery.js', [], REK_VERSION, [ 'strategy' => 'defer', 'in_footer' => true ] );
	}
}, 30 );
