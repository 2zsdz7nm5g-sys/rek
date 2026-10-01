<?php
/**
 * Appointment requests and contact details for the Contact page.
 *
 * [rek_booking_form] renders the appointment form. Each request is stored as
 * a private "Booking" in wp-admin (so nothing is lost if email delivery
 * fails) and emailed to the site admin address.
 *
 * [rek_contact] lists the contact details entered in the Customizer. Only
 * the details that exist are shown, so no number or address is invented.
 *
 * @package rek-proffset
 */

defined( 'ABSPATH' ) || exit;

add_action( 'init', function () {
	register_post_type( 'rek_booking', [
		'labels'          => [
			'name'          => 'Bookings',
			'singular_name' => 'Booking',
			'menu_name'     => 'Bookings',
			'all_items'     => 'All bookings',
			'edit_item'     => 'Booking',
		],
		'public'          => false,
		'show_ui'         => true,
		'show_in_rest'    => false,
		'menu_icon'       => 'dashicons-calendar-alt',
		'menu_position'   => 25,
		'supports'        => [ 'title' ],
		'capability_type' => 'post',
		'map_meta_cap'    => true,
		'capabilities'    => [ 'create_posts' => 'do_not_allow' ],
	] );
} );

function rek_booking_services() {
	return [
		'ppf'        => rek_t( 'فلم حماية الطلاء PPF', 'Paint protection film (PPF)' ),
		'ceramic'    => rek_t( 'نانو سيراميك', 'Nano ceramic coating' ),
		'correction' => rek_t( 'تصحيح الطلاء والبوليش', 'Paint correction and polishing' ),
		'interior'   => rek_t( 'العناية الداخلية', 'Interior detailing' ),
		'pdr'        => rek_t( 'إصلاح الصدمات بدون صبغ', 'Paintless dent repair' ),
		'windshield' => rek_t( 'حماية الزجاج الأمامي', 'Windshield protection' ),
		'tint'       => rek_t( 'تظليل النوافذ', 'Window tint' ),
		'color-ppf'  => rek_t( 'PPF الملوّن وتغيير اللون', 'Color PPF' ),
		'unsure'     => rek_t( 'لست متأكدًا، أحتاج استشارة', 'Not sure yet, I need advice' ),
	];
}

add_shortcode( 'rek_booking_form', function () {
	$status = isset( $_GET['booking'] ) ? sanitize_key( $_GET['booking'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$id     = 'rek-booking';
	ob_start();
	?>
	<div class="rek-booking">
		<?php if ( 'sent' === $status ) : ?>
			<div class="rek-booking__notice is-success" role="status" tabindex="-1" data-rek-notice>
				<strong><?php echo esc_html( rek_t( 'تم استلام طلبك.', 'Your request has been received.' ) ); ?></strong>
				<?php echo esc_html( rek_t( 'سنتواصل معك لتأكيد الموعد.', 'We will contact you to confirm the appointment.' ) ); ?>
			</div>
		<?php elseif ( 'error' === $status ) : ?>
			<div class="rek-booking__notice is-error" role="alert" tabindex="-1" data-rek-notice>
				<?php echo esc_html( rek_t( 'تعذر إرسال الطلب. تأكد من الاسم ورقم الهاتف ثم حاول مرة أخرى.', 'The request could not be sent. Check your name and phone number, then try again.' ) ); ?>
			</div>
		<?php endif; ?>
		<form class="rek-form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="rek_booking">
			<input type="hidden" name="rek_return" value="<?php echo esc_url( get_permalink() ); ?>">
			<?php wp_nonce_field( 'rek_booking', 'rek_booking_nonce' ); ?>
			<div class="rek-form__trap" aria-hidden="true">
				<label for="<?php echo esc_attr( $id ); ?>-website">Website</label>
				<input type="text" id="<?php echo esc_attr( $id ); ?>-website" name="rek_website" tabindex="-1" autocomplete="off">
			</div>
			<div class="rek-form__grid">
				<p class="rek-field">
					<label for="<?php echo esc_attr( $id ); ?>-name"><?php echo esc_html( rek_t( 'الاسم', 'Name' ) ); ?> <span aria-hidden="true">*</span></label>
					<input type="text" id="<?php echo esc_attr( $id ); ?>-name" name="rek_name" required maxlength="80" autocomplete="name">
				</p>
				<p class="rek-field">
					<label for="<?php echo esc_attr( $id ); ?>-phone"><?php echo esc_html( rek_t( 'رقم الهاتف', 'Phone number' ) ); ?> <span aria-hidden="true">*</span></label>
					<input type="tel" id="<?php echo esc_attr( $id ); ?>-phone" name="rek_phone" required maxlength="20" autocomplete="tel" inputmode="tel" dir="ltr" pattern="[0-9+\s\-]{7,20}">
				</p>
				<p class="rek-field">
					<label for="<?php echo esc_attr( $id ); ?>-vehicle"><?php echo esc_html( rek_t( 'السيارة', 'Vehicle' ) ); ?></label>
					<input type="text" id="<?php echo esc_attr( $id ); ?>-vehicle" name="rek_vehicle" maxlength="80" placeholder="<?php echo esc_attr( rek_t( 'الشركة، الموديل، السنة', 'Make, model, year' ) ); ?>">
				</p>
				<p class="rek-field">
					<label for="<?php echo esc_attr( $id ); ?>-service"><?php echo esc_html( rek_t( 'الخدمة', 'Service' ) ); ?></label>
					<select id="<?php echo esc_attr( $id ); ?>-service" name="rek_service">
						<?php foreach ( rek_booking_services() as $key => $label ) : ?>
							<option value="<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $label ); ?></option>
						<?php endforeach; ?>
					</select>
				</p>
				<p class="rek-field">
					<label for="<?php echo esc_attr( $id ); ?>-date"><?php echo esc_html( rek_t( 'التاريخ المفضل', 'Preferred date' ) ); ?></label>
					<input type="date" id="<?php echo esc_attr( $id ); ?>-date" name="rek_date" min="<?php echo esc_attr( wp_date( 'Y-m-d' ) ); ?>">
				</p>
				<p class="rek-field rek-field--wide">
					<label for="<?php echo esc_attr( $id ); ?>-message"><?php echo esc_html( rek_t( 'رسالتك', 'Message' ) ); ?></label>
					<textarea id="<?php echo esc_attr( $id ); ?>-message" name="rek_message" rows="4" maxlength="1500" placeholder="<?php echo esc_attr( rek_t( 'أخبرنا بحالة السيارة أو بما تريد تنفيذه', 'Tell us about the car or what you would like done' ) ); ?>"></textarea>
				</p>
			</div>
			<div class="rek-form__foot">
				<button type="submit" class="rek-btn rek-btn--primary rek-form__submit"><?php echo esc_html( rek_t( 'احجز موعدك الآن', 'Book your appointment' ) ); ?></button>
				<p class="rek-form__hint"><?php echo esc_html( rek_t( 'الحقول المعلّمة بـ * مطلوبة. نستخدم بياناتك للتواصل بخصوص موعدك فقط.', 'Fields marked * are required. We only use your details to contact you about your appointment.' ) ); ?></p>
			</div>
		</form>
	</div>
	<?php
	return ob_get_clean();
} );

function rek_booking_handle() {
	$return = isset( $_POST['rek_return'] ) ? esc_url_raw( wp_unslash( $_POST['rek_return'] ) ) : '';
	$return = wp_validate_redirect( $return, rek_contact_page_url() );
	$back   = function ( $status ) use ( $return ) {
		wp_safe_redirect( add_query_arg( 'booking', $status, $return ) . '#appointment', 303 );
		exit;
	};

	if ( ! isset( $_POST['rek_booking_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['rek_booking_nonce'] ), 'rek_booking' ) ) {
		$back( 'error' );
	}
	// Bots fill the hidden field; answer as if the request went through.
	if ( ! empty( $_POST['rek_website'] ) ) {
		$back( 'sent' );
	}

	$ip_key = 'rek_booking_' . md5( isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '' );
	$count  = (int) get_transient( $ip_key );
	if ( $count >= 5 ) {
		$back( 'error' );
	}
	set_transient( $ip_key, $count + 1, 10 * MINUTE_IN_SECONDS );

	$field = function ( $key, $max ) {
		return isset( $_POST[ $key ] ) ? mb_substr( sanitize_text_field( wp_unslash( $_POST[ $key ] ) ), 0, $max ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing
	};
	$name     = $field( 'rek_name', 80 );
	$phone    = $field( 'rek_phone', 20 );
	$vehicle  = $field( 'rek_vehicle', 80 );
	$service  = sanitize_key( $field( 'rek_service', 20 ) );
	$date     = $field( 'rek_date', 10 );
	$message  = isset( $_POST['rek_message'] ) ? mb_substr( sanitize_textarea_field( wp_unslash( $_POST['rek_message'] ) ), 0, 1500 ) : '';
	$services = rek_booking_services();

	if ( '' === $name || ! preg_match( '/^[0-9+\s\-]{7,20}$/', $phone ) ) {
		$back( 'error' );
	}
	if ( ! isset( $services[ $service ] ) ) {
		$service = 'unsure';
	}
	if ( $date && ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $date ) ) {
		$date = '';
	}

	$details = [
		'Name'           => $name,
		'Phone'          => $phone,
		'Vehicle'        => $vehicle,
		'Service'        => $services[ $service ],
		'Preferred date' => $date,
		'Message'        => $message,
	];

	$post_id = wp_insert_post( [
		'post_type'    => 'rek_booking',
		'post_status'  => 'private',
		'post_title'   => $name . ' · ' . $services[ $service ],
		'post_content' => implode( "\n", array_map( fn( $k, $v ) => $k . ': ' . $v, array_keys( $details ), $details ) ),
	] );
	if ( is_wp_error( $post_id ) || ! $post_id ) {
		$back( 'error' );
	}
	foreach ( [ 'name' => $name, 'phone' => $phone, 'vehicle' => $vehicle, 'service' => $service, 'date' => $date ] as $key => $value ) {
		update_post_meta( $post_id, '_rek_' . $key, $value );
	}

	$body = implode( "\n", array_map( fn( $k, $v ) => $k . ': ' . ( '' === $v ? '-' : $v ), array_keys( $details ), $details ) );
	wp_mail(
		get_option( 'admin_email' ),
		'New appointment request: ' . $name,
		$body . "\n\n" . admin_url( 'post.php?post=' . $post_id . '&action=edit' )
	);

	$back( 'sent' );
}
add_action( 'admin_post_rek_booking', 'rek_booking_handle' );
add_action( 'admin_post_nopriv_rek_booking', 'rek_booking_handle' );

/* Bookings list: show the request details as columns. */
add_filter( 'manage_rek_booking_posts_columns', function ( $cols ) {
	return [
		'cb'          => $cols['cb'],
		'title'       => 'Request',
		'rek_phone'   => 'Phone',
		'rek_vehicle' => 'Vehicle',
		'rek_date'    => 'Preferred date',
		'date'        => 'Received',
	];
} );
add_action( 'manage_rek_booking_posts_custom_column', function ( $col, $post_id ) {
	$map = [ 'rek_phone' => '_rek_phone', 'rek_vehicle' => '_rek_vehicle', 'rek_date' => '_rek_date' ];
	if ( isset( $map[ $col ] ) ) {
		echo esc_html( get_post_meta( $post_id, $map[ $col ], true ) );
	}
}, 10, 2 );
add_action( 'add_meta_boxes_rek_booking', function ( $post ) {
	add_meta_box( 'rek_booking_details', 'Request details', function () use ( $post ) {
		echo '<pre style="white-space:pre-wrap;font:inherit">' . esc_html( $post->post_content ) . '</pre>';
	}, 'rek_booking', 'normal', 'high' );
} );

/** Icons for the contact cards: official WhatsApp glyph, simple line icons for the rest. */
function rek_contact_icon( $name ) {
	$line = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">%s</svg>';
	$icons = [
		'whatsapp'  => '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path fill="currentColor" d="' . esc_attr( REK_WHATSAPP_ICON_PATH ) . '"/></svg>',
		'phone'     => sprintf( $line, '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>' ),
		'email'     => sprintf( $line, '<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 6.5 9 6.5 9-6.5"/>' ),
		'instagram' => sprintf( $line, '<rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.6" cy="6.4" r=".6" fill="currentColor" stroke="none"/>' ),
		'tiktok'    => '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>',
		'facebook'  => sprintf( $line, '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>' ),
		'location'  => rek_pin_svg( 22 ),
	];
	return $icons[ $name ];
}

/**
 * [rek_contact]: the official contact details as cards in the "تواصل معنا"
 * column of the contact page. Every card is a link (the phone card holds one
 * link per number); all values come from rek_get(), whose defaults are the
 * official details in inc/contact.php.
 */
add_shortcode( 'rek_contact', function () {
	$ext   = ' target="_blank" rel="noopener noreferrer"';
	$arrow = '<span class="rek-cc__go" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M7 17 17 7M8 7h9v9"/></svg></span>';
	$card  = function ( $type, $label, $value, $href, $attrs = '', $value_dir = 'ltr' ) use ( $arrow ) {
		return sprintf(
			'<a class="rek-cc rek-cc--%1$s" href="%2$s"%3$s><span class="rek-cc__icon">%4$s</span><span class="rek-cc__body"><span class="rek-cc__label">%5$s</span><span class="rek-cc__value" dir="%6$s">%7$s</span></span>%8$s</a>',
			esc_attr( $type ),
			esc_url( $href, [ 'http', 'https', 'tel', 'mailto' ] ),
			$attrs,
			rek_contact_icon( $type ),
			esc_html( $label ),
			esc_attr( $value_dir ),
			esc_html( $value ),
			$arrow
		);
	};

	$whatsapp  = rek_get( 'rek_whatsapp' );
	$phones    = array_filter( [ rek_get( 'rek_phone' ), rek_get( 'rek_phone2' ) ] );
	$email     = rek_get( 'rek_email' );
	$instagram = rek_get( 'rek_instagram_url' );
	$tiktok    = rek_get( 'rek_tiktok_url' );
	$facebook  = rek_get( 'rek_facebook_url' );
	$hours     = rek_get( 'rek_hours' );
	$cards     = [];

	if ( rek_whatsapp_digits() ) {
		// Shown as the local number customers know; the link uses the international one.
		$shown   = preg_replace( '/^964(7\d{9})$/', '0$1', rek_whatsapp_digits() );
		$cards[] = $card( 'whatsapp', rek_t( 'واتساب', 'WhatsApp' ), $shown, rek_whatsapp_url( 'general' ), $ext );
	}
	if ( $phones ) {
		$links = '';
		foreach ( $phones as $phone ) {
			$links .= sprintf(
				'<a class="rek-cc__num" href="%1$s" dir="ltr" aria-label="%2$s">%3$s</a>',
				esc_url( rek_tel_href( $phone ), [ 'tel' ] ),
				esc_attr( rek_t( 'اتصال بالرقم ', 'Call ' ) . $phone ),
				esc_html( $phone )
			);
		}
		$cards[] = '<div class="rek-cc rek-cc--phone"><span class="rek-cc__icon">' . rek_contact_icon( 'phone' ) . '</span><span class="rek-cc__body"><span class="rek-cc__label">' . esc_html( rek_t( 'الهاتف', 'Phone' ) ) . '</span><span class="rek-cc__nums">' . $links . '</span></span></div>';
	}
	if ( $email ) {
		$cards[] = $card( 'email', rek_t( 'البريد الإلكتروني', 'Email' ), $email, 'mailto:' . $email );
	}
	if ( $instagram ) {
		$cards[] = $card( 'instagram', 'Instagram', '@' . rek_social_handle( $instagram ), $instagram, $ext );
	}
	if ( $tiktok ) {
		$cards[] = $card( 'tiktok', 'TikTok', '@' . rek_social_handle( $tiktok ), $tiktok, $ext );
	}
	if ( $facebook ) {
		$cards[] = $card( 'facebook', 'Facebook', rek_t( 'صفحتنا على فيسبوك', 'Our Facebook page' ), $facebook, $ext, is_rtl() ? 'rtl' : 'ltr' );
	}
	$cards[] = $card( 'location', rek_t( 'موقعنا', 'Our location' ), rek_t( 'افتح الموقع في خرائط Google', 'Open in Google Maps' ), rek_maps_url(), $ext . ' data-rek-maps', is_rtl() ? 'rtl' : 'ltr' );

	$out = '<div class="rek-cc-grid">' . implode( '', $cards ) . '</div>';
	if ( $hours ) {
		$out .= '<p class="rek-cc-hours"><span>' . esc_html( rek_t( 'ساعات العمل', 'Opening hours' ) ) . '</span> ' . esc_html( $hours ) . '</p>';
	}
	return $out;
} );
