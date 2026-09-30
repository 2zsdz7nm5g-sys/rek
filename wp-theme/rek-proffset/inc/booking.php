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

add_shortcode( 'rek_contact', function () {
	$phone     = rek_get( 'rek_phone' );
	$instagram = ltrim( rek_get( 'rek_instagram' ), '@' );
	$address   = rek_get( 'rek_address' );
	$hours     = rek_get( 'rek_hours' );
	$rows      = [];

	if ( $phone ) {
		$rows[] = [ rek_t( 'الهاتف', 'Phone' ), sprintf( '<a href="tel:%s" dir="ltr">%s</a>', esc_attr( preg_replace( '/[^\d+]/', '', $phone ) ), esc_html( $phone ) ) ];
	}
	if ( rek_whatsapp_digits() ) {
		$rows[] = [ rek_t( 'واتساب', 'WhatsApp' ), sprintf( '<a href="%s" target="_blank" rel="noopener">%s</a>', esc_url( rek_whatsapp_url() ), esc_html( rek_t( 'ابدأ محادثة', 'Start a chat' ) ) ) ];
	}
	if ( $instagram ) {
		$rows[] = [ 'Instagram', sprintf( '<a href="%s" target="_blank" rel="noopener" dir="ltr">@%s</a>', esc_url( 'https://instagram.com/' . $instagram ), esc_html( $instagram ) ) ];
	}
	$place  = $address ? $address : rek_t( 'بغداد، العراق', 'Baghdad, Iraq' );
	// The map itself lives in the [rek_location] section at the end of this page.
	$rows[] = [ rek_t( 'الموقع', 'Location' ), esc_html( $place ) . sprintf( ' <a class="rek-contact__map-link" href="#location">%s</a>', esc_html( rek_t( 'عرض الموقع', 'View location' ) ) ) ];
	if ( $hours ) {
		$rows[] = [ rek_t( 'ساعات العمل', 'Opening hours' ), esc_html( $hours ) ];
	}

	$out = '<dl class="rek-contact">';
	foreach ( $rows as $row ) {
		$out .= '<div class="rek-contact__row"><dt>' . esc_html( $row[0] ) . '</dt><dd>' . $row[1] . '</dd></div>';
	}
	$out .= '</dl>';
	return $out;
} );
