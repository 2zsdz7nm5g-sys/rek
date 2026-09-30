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

function rek_contact_page_url() {
	$page = get_page_by_path( 'contact' );
	return $page ? get_permalink( $page ) : home_url( '/' );
}

/**
 * One stable URL for every WhatsApp call to action in the page content:
 * /?rek=whatsapp opens the chat when a number is set, otherwise the contact page.
 */
function rek_whatsapp_url() {
	$digits = rek_whatsapp_digits();
	return $digits ? 'https://wa.me/' . $digits : rek_contact_page_url();
}

add_action( 'template_redirect', function () {
	if ( isset( $_GET['rek'] ) && 'whatsapp' === $_GET['rek'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		wp_redirect( rek_whatsapp_url(), 302 ); // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect
		exit;
	}
} );
