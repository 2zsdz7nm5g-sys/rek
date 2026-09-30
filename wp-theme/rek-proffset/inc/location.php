<?php
/**
 * Location: one Google Maps link (GOOGLE_MAPS_URL) used by every location
 * element on the site.
 *
 * The link is entered once in Appearance > Customize > REK PROFFSET contact
 * ("Google Maps URL"). It can also be pinned in wp-config.php with
 * define( 'REK_GOOGLE_MAPS_URL', 'https://maps.app.goo.gl/...' ), which takes
 * precedence. Nothing here contains a hard-coded address or coordinates.
 *
 * Used by: the floating location bubble, /?rek=maps (for links placed in
 * Elementor content, such as the homepage location CTA) and the
 * [rek_location] section on the contact page.
 *
 * @package rek-proffset
 */

defined( 'ABSPATH' ) || exit;

/** The Google Maps link for REK PROFFSET, or '' until it is configured. */
function rek_maps_url() {
	$url = defined( 'REK_GOOGLE_MAPS_URL' ) ? REK_GOOGLE_MAPS_URL : rek_get( 'rek_maps_url' );
	return $url ? esc_url_raw( $url ) : '';
}

/**
 * Map embed source. Uses the optional "Google Maps embed URL" (Share > Embed
 * a map > the src value). Without it, a real street address is embedded by
 * search; with neither, no map is embedded and a styled panel is shown.
 */
function rek_maps_embed_src() {
	$embed = rek_get( 'rek_maps_embed' );
	if ( $embed && preg_match( '#^https://(www\.)?google\.[a-z.]+/maps/embed\?#i', $embed ) ) {
		return $embed;
	}
	$address = rek_get( 'rek_address' );
	return $address ? 'https://www.google.com/maps?output=embed&q=' . rawurlencode( $address . ', Baghdad, Iraq' ) : '';
}

/** Where location links go: Google Maps when configured, else the contact page location section. */
function rek_location_href() {
	$maps = rek_maps_url();
	return $maps ? $maps : rek_contact_page_url() . '#location';
}

/** Target attributes for a location link: a new tab only when it leaves the site. */
function rek_location_target_attrs() {
	return rek_maps_url() ? ' target="_blank" rel="noopener noreferrer"' : '';
}

/* /?rek=maps: stable link for Elementor content (homepage CTA). */
add_action( 'template_redirect', function () {
	if ( isset( $_GET['rek'] ) && 'maps' === $_GET['rek'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		wp_redirect( rek_location_href(), 302 ); // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect
		exit;
	}
} );

function rek_pin_svg( $size = 24 ) {
	return sprintf(
		'<svg viewBox="0 0 24 24" width="%1$d" height="%1$d" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 21.5s-7-6.1-7-11.6a7 7 0 0 1 14 0c0 5.5-7 11.6-7 11.6Z" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="9.8" r="2.6" stroke="var(--rek-accent-light)" stroke-width="1.7"/></svg>',
		(int) $size
	);
}

/** Floating glass location bubble, stacked above the WhatsApp bubble. */
function rek_render_location_bubble() {
	?>
	<a class="rek-wa rek-loc" href="<?php echo esc_url( rek_location_href() ); ?>"<?php echo rek_location_target_attrs(); // phpcs:ignore ?>
		aria-label="<?php echo esc_attr( rek_t( 'فتح موقع REK PROFFSET على خرائط Google', 'Open the REK PROFFSET location in Google Maps' ) ); ?>" data-rek-loc>
		<span class="rek-wa__icon" aria-hidden="true"><?php echo rek_pin_svg( 26 ); // phpcs:ignore ?></span>
		<span class="rek-wa__label" dir="<?php echo is_rtl() ? 'rtl' : 'ltr'; ?>"><?php echo esc_html( rek_t( 'موقعنا على الخريطة', 'Find us on the map' ) ); ?></span>
	</a>
	<?php
}

/**
 * [rek_location]: the closing location experience on the contact page:
 * a WhatsApp prompt, then the location heading, map and details with a
 * "Get directions" button. Every link uses rek_maps_url().
 */
add_shortcode( 'rek_location', function () {
	$maps    = rek_maps_url();
	$embed   = rek_maps_embed_src();
	$address = rek_get( 'rek_address' );
	$hours   = rek_get( 'rek_hours' );
	$phone   = rek_get( 'rek_phone' );
	$wa      = rek_whatsapp_digits();
	$ext     = ' target="_blank" rel="noopener noreferrer"';
	ob_start();
	?>
	<div class="rek-loc-section">
		<div class="rek-loc-wa">
			<p class="rek-loc-wa__text"><?php echo esc_html( rek_t( 'للاستفسار السريع، تواصل معنا مباشرة عبر واتساب.', 'For a quick question, message us directly on WhatsApp.' ) ); ?></p>
			<a class="rek-btn rek-btn--ghost" href="<?php echo esc_url( rek_whatsapp_url( 'general' ) ); ?>"<?php echo $wa ? $ext : ''; // phpcs:ignore ?>><?php echo esc_html( rek_t( 'تواصل عبر واتساب', 'Chat on WhatsApp' ) ); ?></a>
		</div>

		<header class="rek-loc-head">
			<p class="rek-loc-head__label">LOCATION</p>
			<h2 class="rek-loc-head__title"><?php echo esc_html( rek_t( 'موقعنا', 'Our location' ) ); ?></h2>
			<p class="rek-loc-head__sub"><?php echo esc_html( rek_t( 'نلتقي بك في REK PROFFSET', 'We look forward to seeing you at REK PROFFSET' ) ); ?></p>
			<p class="rek-loc-head__text"><?php echo esc_html( rek_t( 'يمكنك الوصول إلينا بسهولة عبر خرائط Google.', 'You can reach us easily with Google Maps.' ) ); ?></p>
		</header>

		<div class="rek-loc-grid">
			<div class="rek-loc-map<?php echo $embed ? '' : ' is-placeholder'; ?>">
				<?php if ( $embed ) : ?>
					<iframe title="<?php echo esc_attr( rek_t( 'خريطة موقع REK PROFFSET', 'REK PROFFSET location map' ) ); ?>" src="<?php echo esc_url( $embed ); ?>" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
				<?php else : ?>
					<div class="rek-loc-map__grid" aria-hidden="true"></div>
					<div class="rek-loc-map__pin" aria-hidden="true"><span class="rek-loc-map__pulse"></span><?php echo rek_pin_svg( 34 ); // phpcs:ignore ?></div>
					<div class="rek-loc-map__caption">
						<p class="rek-loc-map__city"><?php echo esc_html( rek_t( 'بغداد، العراق', 'Baghdad, Iraq' ) ); ?></p>
						<?php if ( $maps ) : ?>
							<a class="rek-loc-map__link" href="<?php echo esc_url( $maps ); ?>"<?php echo $ext; // phpcs:ignore ?>><?php echo esc_html( rek_t( 'افتح الموقع على خرائط Google', 'Open the location in Google Maps' ) ); ?></a>
						<?php endif; ?>
					</div>
				<?php endif; ?>
			</div>

			<aside class="rek-loc-info" aria-label="<?php echo esc_attr( rek_t( 'معلومات الموقع', 'Location details' ) ); ?>">
				<p class="rek-loc-info__brand" dir="ltr">REK <span>PROFFSET</span></p>
				<dl class="rek-loc-info__list">
					<div><dt><?php echo esc_html( rek_t( 'العنوان', 'Address' ) ); ?></dt><dd><?php echo esc_html( $address ? $address : rek_t( 'بغداد، العراق', 'Baghdad, Iraq' ) ); ?></dd></div>
					<?php if ( $hours ) : ?>
						<div><dt><?php echo esc_html( rek_t( 'ساعات العمل', 'Opening hours' ) ); ?></dt><dd><?php echo esc_html( $hours ); ?></dd></div>
					<?php endif; ?>
					<?php if ( $phone ) : ?>
						<div><dt><?php echo esc_html( rek_t( 'الهاتف', 'Phone' ) ); ?></dt><dd><a href="tel:<?php echo esc_attr( preg_replace( '/[^\d+]/', '', $phone ) ); ?>" dir="ltr"><?php echo esc_html( $phone ); ?></a></dd></div>
					<?php endif; ?>
					<?php if ( $wa ) : ?>
						<div><dt><?php echo esc_html( rek_t( 'واتساب', 'WhatsApp' ) ); ?></dt><dd><a href="<?php echo esc_url( rek_whatsapp_url( 'general' ) ); ?>"<?php echo $ext; // phpcs:ignore ?> dir="ltr">+<?php echo esc_html( $wa ); ?></a></dd></div>
					<?php endif; ?>
				</dl>
				<?php if ( $maps ) : ?>
					<a class="rek-btn rek-btn--primary rek-loc-info__cta" href="<?php echo esc_url( $maps ); ?>"<?php echo $ext; // phpcs:ignore ?>>
						<?php echo rek_pin_svg( 18 ); // phpcs:ignore ?>
						<span><?php echo esc_html( rek_t( 'احصل على الاتجاهات', 'Get directions' ) ); ?></span>
					</a>
				<?php elseif ( current_user_can( 'edit_theme_options' ) ) : ?>
					<p class="rek-loc-info__admin" dir="ltr"><?php echo esc_html( 'Admins only: enter the Google Maps URL in Appearance > Customize > REK PROFFSET contact to show the map link and the "Get directions" button.' ); ?></p>
				<?php endif; ?>
			</aside>
		</div>
	</div>
	<?php
	return ob_get_clean();
} );
