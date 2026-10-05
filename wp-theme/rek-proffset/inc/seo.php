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

/*
 * Search titles: a page can set its own document title in the `rek_seo_title`
 * post meta (used for the Arabic pages); otherwise WordPress builds it as usual.
 */
add_filter( 'pre_get_document_title', function ( $title ) {
	if ( is_singular() ) {
		$custom = get_post_meta( get_queried_object_id(), 'rek_seo_title', true );
		if ( $custom ) {
			return $custom;
		}
	}
	return $title;
}, 20 );

/*
 * Structured data on the homepage: the business (AutoRepair, a LocalBusiness
 * type) and the website, linked by @id. Only details the business has
 * supplied are used: the contact details from rek_get(), the logo, the
 * Google Maps listing (its address: Al-Sinaa Street near Al-Rubaie Bridge,
 * Baghdad, see inc/location.php) and the social profiles. No coordinates or
 * opening hours are given, so none are claimed.
 */
add_action( 'wp_head', function () {
	if ( ! is_front_page() ) {
		return;
	}
	$home = 'https://rekproffsetiraq.com/';

	$business = [
		'@type'         => 'AutoRepair',
		'@id'           => $home . '#business',
		'name'          => 'شركة ريك بروفسيت للعناية بالسيارات',
		'alternateName' => [ 'REK Proffset', 'REK PROFFSET', 'ريك بروفسيت', 'شركة ريك بروفسيت', 'ريك للعناية بالسيارات' ],
		'url'           => $home,
		'description'   => rek_t(
			'شركة ريك بروفسيت للعناية بالسيارات في بغداد: فلم حماية الطلاء PPF، النانو سيراميك، التلميع والعناية المتكاملة بالسيارات.',
			'REK Proffset, an automotive care company in Baghdad: paint protection film (PPF), nano ceramic coating, polishing and complete car care.'
		),
		'address'       => [
			'@type'           => 'PostalAddress',
			'streetAddress'   => 'شارع الصناعة، قرب جسر الربيعي',
			'addressLocality' => 'بغداد',
			'addressCountry'  => 'IQ',
		],
		'areaServed'    => [ '@type' => 'City', 'name' => 'بغداد' ],
		'hasMap'        => rek_maps_url(),
	];

	$logo_id = (int) get_theme_mod( 'custom_logo' );
	if ( $logo_id ) {
		$business['logo']  = wp_get_attachment_image_url( $logo_id, 'full' );
		$business['image'] = $business['logo'];
	}
	$phones = array_values( array_filter( array_map( function ( $number ) {
		return $number ? substr( rek_tel_href( $number ), 4 ) : '';
	}, [ rek_get( 'rek_phone' ), rek_get( 'rek_phone2' ) ] ) ) );
	if ( $phones ) {
		$business['telephone']    = $phones[0];
		$business['contactPoint'] = array_map( function ( $phone ) {
			return [
				'@type'             => 'ContactPoint',
				'telephone'         => $phone,
				'contactType'       => 'customer service',
				'areaServed'        => 'IQ',
				'availableLanguage' => [ 'ar', 'en' ],
			];
		}, $phones );
	}
	if ( rek_get( 'rek_email' ) ) {
		$business['email'] = rek_get( 'rek_email' );
	}
	// Social profiles; the Instagram link loses its QR tracking parameters.
	$instagram = rek_get( 'rek_instagram_url' );
	$profiles  = array_values( array_filter( [
		$instagram ? strtok( $instagram, '?' ) : '',
		rek_get( 'rek_facebook_url' ),
		rek_get( 'rek_tiktok_url' ),
	] ) );
	if ( $profiles ) {
		$business['sameAs'] = $profiles;
	}

	$website = [
		'@type'         => 'WebSite',
		'@id'           => $home . '#website',
		'url'           => $home,
		'name'          => 'ريك بروفسيت',
		'alternateName' => [ 'REK Proffset', 'شركة ريك بروفسيت للعناية بالسيارات' ],
		'inLanguage'    => [ 'ar', 'en' ],
		'publisher'     => [ '@id' => $home . '#business' ],
	];

	$data = [ '@context' => 'https://schema.org', '@graph' => [ $business, $website ] ];
	echo '<script type="application/ld+json">' . wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\n";
}, 3 );

/* hreflang: Arabic, the default language, is also the x-default for visitors in any other language. */
add_filter( 'pll_rel_hreflang_attributes', function ( $hreflangs ) {
	if ( isset( $hreflangs['ar'] ) && count( $hreflangs ) > 1 ) {
		$hreflangs['x-default'] = $hreflangs['ar'];
	}
	return $hreflangs;
} );

/*
 * Sitemap (WordPress core, /wp-sitemap.xml): only the site's pages. No author
 * sitemap (it lists the admin account), and no posts or categories while the
 * only post is WordPress's default "Hello world!".
 */
add_filter( 'wp_sitemaps_add_provider', function ( $provider, $name ) {
	return 'users' === $name ? false : $provider;
}, 10, 2 );
function rek_has_real_posts() {
	static $has = null;
	if ( null === $has ) {
		$posts = get_posts( [
			'post_type'      => 'post',
			'post_status'    => 'publish',
			'posts_per_page' => 2,
			'lang'           => '',
		] );
		$has = (bool) array_filter( $posts, function ( $post ) {
			return 'hello-world' !== $post->post_name;
		} );
	}
	return $has;
}
add_filter( 'wp_sitemaps_post_types', function ( $types ) {
	if ( ! rek_has_real_posts() ) {
		unset( $types['post'] );
	}
	return $types;
} );
add_filter( 'wp_sitemaps_taxonomies', function ( $taxonomies ) {
	if ( ! rek_has_real_posts() ) {
		unset( $taxonomies['category'] );
	}
	return $taxonomies;
} );

/*
 * Image alt text per language: attachments keep their Arabic alt text, and
 * an English version lives in the `_rek_alt_en` attachment meta. Elementor
 * reads the alt meta directly, so the swap happens at the meta level
 * (front end only, so the media library always shows the stored value).
 */
add_filter( 'get_post_metadata', function ( $value, $object_id, $meta_key, $single ) {
	if ( '_wp_attachment_image_alt' !== $meta_key || is_admin() || 'en' !== rek_lang() ) {
		return $value;
	}
	$alt = get_post_meta( $object_id, '_rek_alt_en', true );
	if ( '' === $alt ) {
		return $value;
	}
	return $single ? $alt : [ $alt ];
}, 10, 4 );
