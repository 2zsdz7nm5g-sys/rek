<?php
/**
 * Site chrome: header, full-screen mobile menu, footer and floating WhatsApp.
 * Replaces Astra's header and footer output through Astra's own hooks.
 *
 * @package rek-proffset
 */

defined( 'ABSPATH' ) || exit;

add_action( 'wp', function () {
	if ( is_admin() ) {
		return;
	}
	remove_all_actions( 'astra_header' );
	remove_all_actions( 'astra_footer' );
	add_action( 'astra_header', 'rek_render_header' );
	add_action( 'astra_footer', 'rek_render_footer' );
} );

function rek_is_rtl_lang() {
	return is_rtl();
}

function rek_t( $ar, $en ) {
	return rek_is_rtl_lang() ? $ar : $en;
}

function rek_logo_html( $size = 40 ) {
	$logo_id = (int) get_theme_mod( 'custom_logo' );
	$img     = $logo_id ? wp_get_attachment_image( $logo_id, 'thumbnail', false, [
		'class'    => 'rek-logo-img',
		'width'    => $size,
		'height'   => $size,
		'alt'      => '',
		'loading'  => 'eager',
		'decoding' => 'async',
	] ) : '';

	return $img . '<span class="rek-wordmark" dir="ltr">REK <span>PROFFSET</span></span>';
}

function rek_lang_switcher() {
	if ( ! function_exists( 'pll_the_languages' ) ) {
		return '';
	}
	$langs = pll_the_languages( [ 'raw' => 1, 'hide_if_empty' => 0 ] );
	if ( empty( $langs ) || count( $langs ) < 2 ) {
		return '';
	}
	$out = '<div class="rek-lang" role="group" aria-label="' . esc_attr( rek_t( 'اللغة', 'Language' ) ) . '">';
	$i   = 0;
	foreach ( $langs as $lang ) {
		if ( $i++ ) {
			$out .= '<span class="rek-lang-sep" aria-hidden="true">|</span>';
		}
		$label = 'ar' === $lang['slug'] ? 'العربية' : strtoupper( $lang['slug'] );
		$out  .= sprintf(
			'<a href="%s" lang="%s" hreflang="%s"%s>%s</a>',
			esc_url( $lang['url'] ),
			esc_attr( $lang['slug'] ),
			esc_attr( $lang['slug'] ),
			$lang['current_lang'] ? ' aria-current="true" class="is-current"' : '',
			esc_html( $label )
		);
	}
	return $out . '</div>';
}

function rek_appointment_url() {
	return rek_contact_page_url() . '#appointment';
}

function rek_render_header() {
	$home = function_exists( 'pll_home_url' ) ? pll_home_url() : home_url( '/' );
	?>
	<a class="rek-skip" href="#content"><?php echo esc_html( rek_t( 'تخطَّ إلى المحتوى', 'Skip to content' ) ); ?></a>
	<header class="rek-header" data-rek-header>
		<div class="rek-header__inner">
			<a class="rek-brand" href="<?php echo esc_url( $home ); ?>" aria-label="REK PROFFSET">
				<?php echo rek_logo_html(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</a>
			<nav class="rek-nav" aria-label="<?php echo esc_attr( rek_t( 'القائمة الرئيسية', 'Main navigation' ) ); ?>">
				<?php
				wp_nav_menu( [
					'theme_location' => 'rek_primary',
					'container'      => false,
					'menu_class'     => 'rek-nav__list',
					'depth'          => 1,
					'fallback_cb'    => false,
				] );
				?>
			</nav>
			<div class="rek-header__actions">
				<?php echo rek_lang_switcher(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<a class="rek-btn rek-btn--primary rek-header__cta" href="<?php echo esc_url( rek_appointment_url() ); ?>">
					<?php echo esc_html( rek_t( 'احجز موعدك', 'Book an appointment' ) ); ?>
				</a>
				<button class="rek-menu-toggle" type="button" aria-expanded="false" aria-controls="rek-menu" data-rek-menu-open>
					<span class="rek-menu-toggle__bars" aria-hidden="true"></span>
					<span class="rek-sr"><?php echo esc_html( rek_t( 'فتح القائمة', 'Open menu' ) ); ?></span>
				</button>
			</div>
		</div>
	</header>

	<div class="rek-menu" id="rek-menu" role="dialog" aria-modal="true" aria-label="<?php echo esc_attr( rek_t( 'القائمة', 'Menu' ) ); ?>" hidden data-rek-menu>
		<div class="rek-menu__top">
			<a class="rek-brand" href="<?php echo esc_url( $home ); ?>" aria-label="REK PROFFSET"><?php echo rek_logo_html( 36 ); // phpcs:ignore ?></a>
			<button class="rek-menu__close" type="button" data-rek-menu-close>
				<span aria-hidden="true">&times;</span>
				<span class="rek-sr"><?php echo esc_html( rek_t( 'إغلاق القائمة', 'Close menu' ) ); ?></span>
			</button>
		</div>
		<nav aria-label="<?php echo esc_attr( rek_t( 'القائمة الرئيسية', 'Main navigation' ) ); ?>">
			<?php
			wp_nav_menu( [
				'theme_location' => 'rek_primary',
				'container'      => false,
				'menu_class'     => 'rek-menu__list',
				'depth'          => 1,
				'fallback_cb'    => false,
			] );
			?>
		</nav>
		<div class="rek-menu__foot">
			<?php echo rek_lang_switcher(); // phpcs:ignore ?>
			<a class="rek-btn rek-btn--primary rek-btn--block" href="<?php echo esc_url( rek_appointment_url() ); ?>">
				<?php echo esc_html( rek_t( 'احجز موعدك', 'Book an appointment' ) ); ?>
			</a>
			<?php if ( rek_whatsapp_digits() ) : ?>
				<a class="rek-btn rek-btn--ghost rek-btn--block" href="<?php echo esc_url( rek_whatsapp_url() ); ?>" target="_blank" rel="noopener">
					<?php echo esc_html( rek_t( 'تواصل عبر واتساب', 'Chat on WhatsApp' ) ); ?>
				</a>
			<?php endif; ?>
		</div>
	</div>
	<?php
}

function rek_render_footer() {
	$phone     = rek_get( 'rek_phone' );
	$instagram = ltrim( rek_get( 'rek_instagram' ), '@' );
	$address   = rek_get( 'rek_address' );
	$hours     = rek_get( 'rek_hours' );
	?>
	<footer class="rek-footer">
		<div class="rek-footer__inner">
			<div class="rek-footer__brand">
				<?php echo rek_logo_html( 48 ); // phpcs:ignore ?>
				<p><?php echo esc_html( rek_t( 'استوديو متخصص في حماية السيارات والعناية بها في بغداد.', 'An automotive protection and detailing studio in Baghdad.' ) ); ?></p>
			</div>
			<nav class="rek-footer__nav" aria-label="<?php echo esc_attr( rek_t( 'روابط الموقع', 'Site links' ) ); ?>">
				<?php
				wp_nav_menu( [
					'theme_location' => 'rek_primary',
					'container'      => false,
					'menu_class'     => 'rek-footer__list',
					'depth'          => 1,
					'fallback_cb'    => false,
				] );
				?>
			</nav>
			<div class="rek-footer__contact">
				<p class="rek-footer__label"><?php echo esc_html( rek_t( 'تواصل', 'Contact' ) ); ?></p>
				<ul>
					<li><?php echo esc_html( $address ? $address : rek_t( 'بغداد، العراق', 'Baghdad, Iraq' ) ); ?></li>
					<?php if ( $hours ) : ?>
						<li><?php echo esc_html( $hours ); ?></li>
					<?php endif; ?>
					<?php if ( $phone ) : ?>
						<li><a href="tel:<?php echo esc_attr( preg_replace( '/[^\d+]/', '', $phone ) ); ?>" dir="ltr"><?php echo esc_html( $phone ); ?></a></li>
					<?php endif; ?>
					<?php if ( rek_whatsapp_digits() ) : ?>
						<li><a href="<?php echo esc_url( rek_whatsapp_url() ); ?>" target="_blank" rel="noopener">WhatsApp</a></li>
					<?php endif; ?>
					<?php if ( $instagram ) : ?>
						<li><a href="<?php echo esc_url( 'https://instagram.com/' . $instagram ); ?>" target="_blank" rel="noopener" dir="ltr">@<?php echo esc_html( $instagram ); ?></a></li>
					<?php endif; ?>
				</ul>
			</div>
		</div>
		<div class="rek-footer__base">
			<span dir="ltr">&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> REK PROFFSET</span>
		</div>
	</footer>

	<?php
	rek_render_whatsapp_bubble();
}

/**
 * Floating glass WhatsApp bubble, shown on every page. It opens the chat
 * with the general message; before a number is configured it links to the
 * contact page instead (same tab, since it stays on this site).
 */
function rek_render_whatsapp_bubble() {
	$external = (bool) rek_whatsapp_digits();
	?>
	<a class="rek-wa" href="<?php echo esc_url( rek_whatsapp_url( 'general' ) ); ?>"<?php echo $external ? ' target="_blank" rel="noopener"' : ''; ?>
		aria-label="<?php echo esc_attr( rek_t( 'التواصل مع REK PROFFSET عبر واتساب', 'Contact REK PROFFSET on WhatsApp' ) ); ?>" data-rek-wa>
		<span class="rek-wa__icon" aria-hidden="true">
			<svg viewBox="0 0 24 24" width="26" height="26" focusable="false"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
		</span>
		<span class="rek-wa__label" dir="<?php echo is_rtl() ? 'rtl' : 'ltr'; ?>"><?php echo esc_html( rek_t( 'تواصل معنا عبر واتساب', 'Chat with us on WhatsApp' ) ); ?></span>
	</a>
	<?php
}
