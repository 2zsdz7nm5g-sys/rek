<?php
/**
 * SEO metadata: description, Open Graph, Twitter card and LocalBusiness JSON-LD.
 *
 * Per-page description and share image come from post meta
 * `rek_meta_description` and the featured image. Structured data only
 * includes facts that exist: a telephone or social profile is added only
 * once it has been entered in the Customizer.
 *
 * @package rek-proffset
 */

defined( 'ABSPATH' ) || exit;

function rek_meta_description() {
	if ( is_singular() ) {
		$desc = get_post_meta( get_queried_object_id(), 'rek_meta_description', true );
		if ( $desc ) {
			return $desc;
		}
	}
	return get_bloginfo( 'description' );
}

add_action( 'wp_head', function () {
	$desc  = rek_meta_description();
	$title = wp_get_document_title();
	$url   = is_singular() ? get_permalink() : home_url( add_query_arg( [] ) );
	$image = is_singular() && has_post_thumbnail() ? get_the_post_thumbnail_url( null, 'large' ) : '';
	$lang  = function_exists( 'pll_current_language' ) ? pll_current_language( 'locale' ) : get_locale();

	if ( $desc ) {
		printf( '<meta name="description" content="%s">' . "\n", esc_attr( $desc ) );
	}
	printf( '<meta property="og:site_name" content="%s">' . "\n", esc_attr( get_bloginfo( 'name' ) ) );
	printf( '<meta property="og:type" content="%s">' . "\n", is_front_page() ? 'website' : 'article' );
	printf( '<meta property="og:title" content="%s">' . "\n", esc_attr( $title ) );
	printf( '<meta property="og:url" content="%s">' . "\n", esc_url( $url ) );
	printf( '<meta property="og:locale" content="%s">' . "\n", esc_attr( $lang ) );
	if ( $desc ) {
		printf( '<meta property="og:description" content="%s">' . "\n", esc_attr( $desc ) );
	}
	if ( $image ) {
		printf( '<meta property="og:image" content="%s">' . "\n", esc_url( $image ) );
		echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
	}
	echo '<meta name="theme-color" content="#050B12">' . "\n";
}, 2 );

add_action( 'wp_head', function () {
	if ( ! is_front_page() ) {
		return;
	}

	$data = [
		'@context'   => 'https://schema.org',
		'@type'      => 'AutoRepair',
		'name'       => 'REK PROFFSET',
		'url'        => home_url( '/' ),
		'description' => get_bloginfo( 'description' ),
		'areaServed' => [ '@type' => 'City', 'name' => 'Baghdad' ],
		'address'    => [
			'@type'           => 'PostalAddress',
			'addressLocality' => 'Baghdad',
			'addressCountry'  => 'IQ',
		],
	];

	$logo_id = (int) get_theme_mod( 'custom_logo' );
	if ( $logo_id ) {
		$data['logo'] = wp_get_attachment_image_url( $logo_id, 'full' );
	}
	if ( rek_get( 'rek_address' ) ) {
		$data['address']['streetAddress'] = rek_get( 'rek_address' );
	}
	if ( rek_get( 'rek_phone' ) ) {
		$data['telephone'] = rek_get( 'rek_phone' );
	}
	if ( rek_get( 'rek_instagram' ) ) {
		$data['sameAs'] = [ 'https://instagram.com/' . ltrim( rek_get( 'rek_instagram' ), '@' ) ];
	}

	echo '<script type="application/ld+json">' . wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\n";
}, 3 );
