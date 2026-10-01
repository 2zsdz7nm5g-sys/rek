<?php
/**
 * Company contact details, editable in Appearance > Customize > REK PROFFSET contact.
 *
 * The official details supplied by REK PROFFSET are the defaults below
 * (rek_contact_defaults); a value entered in the Customizer replaces its
 * default. Fields without an official detail (address, hours) stay empty and
 * are not shown, so nothing is ever invented.
 *
 * @package rek-proffset
 */

defined( 'ABSPATH' ) || exit;

function rek_contact_fields() {
	return [
		'rek_whatsapp'      => [ 'label' => 'WhatsApp number (international, digits only, e.g. 9647XXXXXXXXX)', 'type' => 'text' ],
		'rek_phone'         => [ 'label' => 'Phone number as displayed', 'type' => 'text' ],
		'rek_phone2'        => [ 'label' => 'Second phone number as displayed', 'type' => 'text' ],
		'rek_email'         => [ 'label' => 'Email address', 'type' => 'email' ],
		'rek_instagram_url' => [ 'label' => 'Instagram profile URL', 'type' => 'url' ],
		'rek_tiktok_url'    => [ 'label' => 'TikTok profile URL', 'type' => 'url' ],
		'rek_facebook_url'  => [ 'label' => 'Facebook page URL', 'type' => 'url' ],
		'rek_address'   => [ 'label' => 'Address (Arabic)', 'type' => 'text' ],
		'rek_hours'     => [ 'label' => 'Working hours (Arabic)', 'type' => 'text' ],
		'rek_maps_url'   => [ 'label' => 'Google Maps URL (GOOGLE_MAPS_URL): the one link used by every location button', 'type' => 'url' ],
		'rek_maps_embed' => [ 'label' => 'Google Maps embed URL (optional): Share > Embed a map, the src="..." value', 'type' => 'url' ],
	];
}

add_action( 'customize_register', function ( WP_Customize_Manager $wp_customize ) {
	$wp_customize->add_section( 'rek_contact', [
		'title'    => 'REK PROFFSET contact',
		'priority' => 30,
	] );

	foreach ( rek_contact_fields() as $id => $field ) {
		$defaults = rek_contact_defaults();
		$sanitize = [ 'url' => 'esc_url_raw', 'email' => 'sanitize_email' ];
		$wp_customize->add_setting( $id, [
			'default'           => isset( $defaults[ $id ] ) ? $defaults[ $id ] : '',
			'sanitize_callback' => isset( $sanitize[ $field['type'] ] ) ? $sanitize[ $field['type'] ] : 'sanitize_text_field',
		] );
		$wp_customize->add_control( $id, [
			'label'   => $field['label'],
			'section' => 'rek_contact',
			'type'    => $field['type'],
		] );
	}
} );

/** Official WhatsApp glyph (Simple Icons), shared by the floating bubble and the contact cards. */
const REK_WHATSAPP_ICON_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z';

/** The official REK PROFFSET contact details, exactly as supplied by the business. */
function rek_contact_defaults() {
	return [
		'rek_whatsapp'      => '9647707555332',
		'rek_phone'         => '07707555332',
		'rek_phone2'        => '07807555332',
		'rek_email'         => 'iraqrekproffset@gmail.com',
		'rek_instagram_url' => 'https://www.instagram.com/rek.proffset?stkn=aXh0eHY1djBueWpv&utm_source=qr',
		'rek_tiktok_url'    => 'https://www.tiktok.com/@rekproffsetlraq_45',
		'rek_facebook_url'  => 'https://www.facebook.com/share/1FJkBDJzJP/?mibextid=wwXIfr',
	];
}

/** A contact detail: the Customizer value, else the official default, else ''. */
function rek_get( $key ) {
	$value = trim( (string) get_theme_mod( $key, '' ) );
	if ( '' === $value ) {
		$defaults = rek_contact_defaults();
		$value    = isset( $defaults[ $key ] ) ? $defaults[ $key ] : '';
	}
	return $value;
}

/** tel: target for an Iraqi number as displayed: 07707555332 becomes +9647707555332. */
function rek_tel_href( $number ) {
	$digits = preg_replace( '/[^\d+]/', '', $number );
	if ( preg_match( '/^0(7\d{9})$/', $digits, $m ) ) {
		$digits = '+964' . $m[1];
	}
	return 'tel:' . $digits;
}

/** The handle in a social profile URL, for display: instagram.com/rek.proffset?... gives "rek.proffset". */
function rek_social_handle( $url ) {
	$path = trim( (string) wp_parse_url( $url, PHP_URL_PATH ), '/' );
	$path = explode( '/', $path );
	return ltrim( $path[0], '@' );
}

function rek_whatsapp_digits() {
	return preg_replace( '/\D+/', '', rek_get( 'rek_whatsapp' ) );
}

/**
 * Current Polylang language slug. Falls back to the language of the queried
 * post, which is what previews and early template hooks need.
 */
function rek_lang() {
	if ( ! function_exists( 'pll_current_language' ) ) {
		return '';
	}
	$lang = pll_current_language();
	if ( ! $lang && is_singular() ) {
		$lang = pll_get_post_language( get_queried_object_id() );
	}
	return $lang ? $lang : '';
}

function rek_contact_page_url() {
	$page = get_page_by_path( 'contact' );
	// With Polylang, point to the contact page in the visitor's language.
	if ( $page && function_exists( 'pll_get_post' ) ) {
		$lang       = rek_lang();
		$translated = $lang ? pll_get_post( $page->ID, $lang ) : 0;
		$page       = $translated ? get_post( $translated ) : $page;
	}
	return $page ? get_permalink( $page ) : home_url( '/' );
}

/**
 * Pre-filled WhatsApp messages, one per topic. `general` is used by the
 * floating bubble; the others serve service-specific buttons.
 */
function rek_whatsapp_message( $topic = 'general' ) {
	$messages = [
		'general'     => rek_t( 'مرحباً REK PROFFSET، أريد الاستفسار عن خدماتكم.', 'Hello REK PROFFSET, I would like to ask about your services.' ),
		'ppf'         => rek_t( 'مرحباً REK PROFFSET، أريد الاستفسار عن خدمة PPF.', 'Hello REK PROFFSET, I would like to ask about your PPF service.' ),
		'flexishield' => rek_t( 'مرحباً REK PROFFSET، أريد الاستفسار عن FlexiShield PPF.', 'Hello REK PROFFSET, I would like to ask about FlexiShield PPF.' ),
		'ceramic'     => rek_t( 'مرحباً REK PROFFSET، أريد الاستفسار عن النانو سيراميك.', 'Hello REK PROFFSET, I would like to ask about nano ceramic coating.' ),
		'polishing'   => rek_t( 'مرحباً REK PROFFSET، أريد الاستفسار عن البوليش وتصحيح الطلاء.', 'Hello REK PROFFSET, I would like to ask about polishing and paint correction.' ),
		'interior'    => rek_t( 'مرحباً REK PROFFSET، أريد الاستفسار عن خدمة الحمام الداخلي.', 'Hello REK PROFFSET, I would like to ask about interior detailing.' ),
		'pdr'         => rek_t( 'مرحباً REK PROFFSET، أريد الاستفسار عن خدمة PDR.', 'Hello REK PROFFSET, I would like to ask about paintless dent repair (PDR).' ),
	];
	return isset( $messages[ $topic ] ) ? $messages[ $topic ] : $messages['general'];
}

/**
 * WhatsApp click-to-chat link built from the one number in the Customizer.
 * Until that number is entered, links fall back to the contact page.
 */
function rek_whatsapp_url( $topic = 'general' ) {
	$digits = rek_whatsapp_digits();
	if ( ! $digits ) {
		return rek_contact_page_url();
	}
	return 'https://wa.me/' . $digits . '?text=' . rawurlencode( rek_whatsapp_message( $topic ) );
}

/*
 * One stable URL for WhatsApp calls to action in page content:
 * /?rek=whatsapp opens the chat, and &topic=ppf (flexishield, ceramic,
 * polishing, interior, pdr) pre-fills a service-specific message.
 */
add_action( 'template_redirect', function () {
	if ( isset( $_GET['rek'] ) && 'whatsapp' === $_GET['rek'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$topic = isset( $_GET['topic'] ) ? sanitize_key( $_GET['topic'] ) : 'general'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		wp_redirect( rek_whatsapp_url( $topic ), 302 ); // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect
		exit;
	}
} );
