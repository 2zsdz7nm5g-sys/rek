<?php
/**
 * Company contact details, editable in Appearance > Customize > REK PROFFSET contact.
 *
 * Every value starts empty: nothing is shown on the site until the real
 * detail is entered, so no phone number or address is ever invented.
 *
 * @package rek-proffset
 */

defined( 'ABSPATH' ) || exit;

function rek_contact_fields() {
	return [
		'rek_whatsapp'  => [ 'label' => 'WhatsApp number (international, digits only, e.g. 9647XXXXXXXXX)', 'type' => 'text' ],
		'rek_phone'     => [ 'label' => 'Phone number as displayed', 'type' => 'text' ],
		'rek_instagram' => [ 'label' => 'Instagram username (without @)', 'type' => 'text' ],
		'rek_address'   => [ 'label' => 'Address (Arabic)', 'type' => 'text' ],
		'rek_hours'     => [ 'label' => 'Working hours (Arabic)', 'type' => 'text' ],
		'rek_maps_url'  => [ 'label' => 'Google Maps link', 'type' => 'url' ],
	];
}

add_action( 'customize_register', function ( WP_Customize_Manager $wp_customize ) {
	$wp_customize->add_section( 'rek_contact', [
		'title'    => 'REK PROFFSET contact',
		'priority' => 30,
	] );

	foreach ( rek_contact_fields() as $id => $field ) {
		$wp_customize->add_setting( $id, [
			'default'           => '',
			'sanitize_callback' => 'url' === $field['type'] ? 'esc_url_raw' : 'sanitize_text_field',
		] );
		$wp_customize->add_control( $id, [
			'label'   => $field['label'],
			'section' => 'rek_contact',
			'type'    => $field['type'],
		] );
	}
} );

function rek_get( $key ) {
	return trim( (string) get_theme_mod( $key, '' ) );
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
