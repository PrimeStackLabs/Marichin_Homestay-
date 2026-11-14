import nodemailer from 'nodemailer';
import { SiteSettings } from '../models/SiteSettings.js';
import { formatCancellationSummaryText } from './refundPolicy.js';

let transporter = null;

const getSiteUrl = () => process.env.SITE_URL || process.env.CLIENT_URL || 'http://localhost:3000';
const getPassUrl = (booking) => `${getSiteUrl()}/pass/${booking.passToken || booking.bookingCode}`;
const getRefundPolicyUrl = () => `${getSiteUrl()}/refund-policy`;

const getSettings = async () => {
  try {
    return (await SiteSettings.findOne()) || {};
  } catch {
    return {};
  }
};

const getTransporter = () => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587', 10),
    secure: parseInt(SMTP_PORT || '587', 10) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  return transporter;
};

const getRoomName = (booking) => {
  if (booking.bookingType === 'full_home') {
    return 'Full Home (All 5 Rooms)';
  }
  return booking.roomName || 'Standard Room';
};

const getNightsCount = (booking) => {
  return Array.isArray(booking.nights) ? booking.nights.length : (Number(booking.nights) || 1);
};

const isPlaceholderEmailPhone = (val) => {
  if (!val || typeof val !== 'string') return true;
  const clean = val.trim().toLowerCase();
  if (!clean || clean.includes('x') || clean.includes('00000')) return true;
  const digits = clean.replace(/\D/g, '');
  if (digits.length < 8 || /^0+$/.test(digits) || /^(\d)\1+$/.test(digits) || digits === '9876543210' || digits === '9480180455' || digits === '919480180455') {
    return true;
  }
  return false;
};

const getConfiguredEmailPhone = (settings = {}) => {
  const raw = settings.whatsappNumber || (settings.phones && settings.phones[0]) || '';
  return isPlaceholderEmailPhone(raw) ? '' : String(raw).trim();
};

export const resolveHostEmail = (val) => {
  if (!val || typeof val !== 'string') return '';
  const clean = val.trim().toLowerCase();
  if (
    !clean ||
    !clean.includes('@') ||
    clean.includes('xxxxx') ||
    clean.endsWith('@example.com') ||
    clean === 'info@marichinhomestay.com' ||
    clean === 'contact@marichinhomestay.com' ||
    clean === 'support@marichinhomestay.com' ||
    clean === 'stay@marichinhomestay.com'
  ) {
    return '';
  }
  return val.trim();
};

const buildConfiguredContactLine = (hostPhone, hostEmail) => {
  const parts = [];
  if (hostPhone) parts.push(`WhatsApp/Phone: ${hostPhone}`);
  if (hostEmail) parts.push(`Email: <a href="mailto:${hostEmail}">${hostEmail}</a>`);
  if (parts.length === 0) return '';
  return `<p>Need help or arrival coordination? Reach us via ${parts.join(' | ')}.</p>`;
};

const buildPolicyLinksBlock = (settings) => {
  const summary = formatCancellationSummaryText(settings, 'en');
  return `
    <div style="background-color: #F4EFE3; padding: 12px 16px; border-radius: 8px; margin: 18px 0; border-left: 3px solid #B8964A; font-size: 13px; color: #1A2A21;">
      <p style="margin: 0 0 6px 0;"><strong>Cancellation &amp; Refund Policy:</strong> ${summary}</p>
      <p style="margin: 0;">
        <a href="${getRefundPolicyUrl()}" style="color: #0F2A20; font-weight: bold;">Read Full Refund &amp; Cancellation Policy</a>
        &nbsp;|&nbsp;
        <a href="${getSiteUrl()}/policies" style="color: #0F2A20; font-weight: bold;">Homestay Policies &amp; House Rules</a>
      </p>
    </div>
  `;
};

const getHostSenderAddress = (hostEmail) => {
  return process.env.SMTP_USER || hostEmail || undefined;
};

const getAdminNotificationRecipient = (settings) => {
  const configured = resolveHostEmail(settings?.email);
  return configured || process.env.ADMIN_EMAIL || process.env.SMTP_USER || '';
};

/**
 * 1. Guest: Payment received and confirmed
 */
export const sendPaymentReceivedGuestEmail = async (booking) => {
  const mailer = getTransporter();
  if (!mailer) {
    console.log('⚠️ [Email] SMTP not configured. Skipping payment received email for:', booking.bookingCode);
    return;
  }

  const settings = await getSettings();
  const roomName = getRoomName(booking);
  const nightsCount = getNightsCount(booking);
  const passUrl = getPassUrl(booking);
  const checkInTime = settings.checkInTime || '12:00 PM';
  const checkOutTime = settings.checkOutTime || '11:00 AM';
  const hostPhone = getConfiguredEmailPhone(settings);
  const hostEmail = resolveHostEmail(settings.email);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A2A21;">
      <h2 style="color: #0F2A20; border-bottom: 2px solid #B8964A; padding-bottom: 8px;">
        Payment Received — Booking Confirmed
      </h2>
      <p>Dear ${booking.guestName},</p>
      <p>We have successfully received your payment of <strong>₹${booking.advancePaid?.toLocaleString('en-IN')}</strong> for your stay at Marichin Homestay.</p>
      <p>Your booking is <strong>confirmed</strong>! You can view and download your official check-in pass below:</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${passUrl}" style="background-color: #B8964A; color: #0F2A20; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
          View Official Digital Pass & QR
        </a>
      </div>

      <div style="background-color: #FAF6EC; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #D9BC7A;">
        <h3 style="margin-top: 0; color: #0F2A20;">Reservation Details</h3>
        <p><strong>Booking Code:</strong> ${booking.bookingCode}</p>
        <p><strong>Accommodation:</strong> ${roomName}</p>
        <p><strong>Check-In:</strong> ${new Date(booking.checkIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} (${checkInTime})</p>
        <p><strong>Check-Out:</strong> ${new Date(booking.checkOut).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} (${checkOutTime})</p>
        <p><strong>Nights:</strong> ${nightsCount}</p>
        <p><strong>Guests:</strong> ${booking.adults || 2} Adults, ${booking.children || 0} Children</p>
        <p><strong>Amount Paid (Razorpay):</strong> ₹${booking.advancePaid?.toLocaleString('en-IN')}</p>
        <p><strong>Balance Due at Check-In:</strong> ₹${booking.balanceDue?.toLocaleString('en-IN')}</p>
      </div>

      ${buildPolicyLinksBlock(settings)}
      ${buildConfiguredContactLine(hostPhone, hostEmail)}
      <p>Warm regards,<br/>Marichin Homestay Team, Kushalnagar, Coorg</p>
    </div>
  `;

  try {
    await mailer.sendMail({
      from: `"Marichin Homestay" <${getHostSenderAddress(hostEmail)}>`,
      ...(hostEmail ? { replyTo: hostEmail } : {}),
      to: booking.email,
      subject: `Payment Received & Confirmed [${booking.bookingCode}] - Marichin Homestay`,
      html
    });
    console.log(`✅ [Email] Dispatched payment received email to ${booking.email}`);
  } catch (err) {
    console.warn('⚠️ [Email] Could not send payment received email:', err.message);
  }
};

/**
 * 2. Admin: New paid booking alert
 */
export const sendNewPaidBookingAdminEmail = async (booking) => {
  const mailer = getTransporter();
  const settings = await getSettings();
  const hostEmail = resolveHostEmail(settings.email);
  const adminEmail = getAdminNotificationRecipient(settings);
  if (!mailer || !adminEmail) {
    console.log('⚠️ [Email] SMTP not configured. Skipping admin alert for new paid booking:', booking.bookingCode);
    return;
  }

  const roomName = getRoomName(booking);
  const nightsCount = getNightsCount(booking);
  const passUrl = getPassUrl(booking);
  const checkInTime = settings.checkInTime || '12:00 PM';
  const checkOutTime = settings.checkOutTime || '11:00 AM';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A2A21;">
      <h2 style="color: #0F2A20; border-bottom: 2px solid #B8964A; padding-bottom: 8px;">
        New Paid Booking Confirmed
      </h2>
      <p>A new guest has paid online and their reservation is confirmed.</p>
      
      <div style="background-color: #FAF6EC; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Booking Code:</strong> ${booking.bookingCode}</p>
        <p><strong>Guest Name:</strong> ${booking.guestName}</p>
        <p><strong>Phone:</strong> ${booking.phone}</p>
        <p><strong>Email:</strong> ${booking.email}</p>
        <p><strong>Accommodation:</strong> ${roomName}</p>
        <p><strong>Dates:</strong> ${new Date(booking.checkIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} to ${new Date(booking.checkOut).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} (${nightsCount} nights)</p>
        <p><strong>Check-In / Out:</strong> ${checkInTime} / ${checkOutTime}</p>
        <p><strong>Amount Paid via Razorpay:</strong> ₹${booking.advancePaid?.toLocaleString('en-IN')} (Payment ID: ${booking.razorpayPaymentId || 'N/A'})</p>
        <p><strong>Balance Due:</strong> ₹${booking.balanceDue?.toLocaleString('en-IN')}</p>
        <p><strong>Special Requests:</strong> ${booking.specialRequests || 'None'}</p>
      </div>

      <div style="text-align: center; margin: 20px 0;">
        <a href="${passUrl}" style="background-color: #B8964A; color: #0F2A20; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          View Guest Check-In Pass
        </a>
      </div>
    </div>
  `;

  try {
    await mailer.sendMail({
      from: `"Marichin Alerts" <${getHostSenderAddress(hostEmail)}>`,
      to: adminEmail,
      replyTo: booking.email || hostEmail || undefined,
      subject: `New Paid Booking Confirmed [${booking.bookingCode}] - ${booking.guestName}`,
      html
    });
    console.log(`✅ [Email] Dispatched admin alert email for ${booking.bookingCode}`);
  } catch (err) {
    console.warn('⚠️ [Email] Could not send admin alert email:', err.message);
  }
};

/**
 * 3. Guest: Booking confirmed
 */
export const sendBookingConfirmedEmail = async (booking) => {
  const mailer = getTransporter();
  if (!mailer) {
    console.log('⚠️ [Email] SMTP not configured. Skipping booking confirmed email for:', booking.bookingCode);
    return;
  }

  const settings = await getSettings();
  const roomName = getRoomName(booking);
  const nightsCount = getNightsCount(booking);
  const passUrl = getPassUrl(booking);
  const checkInTime = settings.checkInTime || '12:00 PM';
  const checkOutTime = settings.checkOutTime || '11:00 AM';
  const hostPhone = getConfiguredEmailPhone(settings);
  const hostEmail = resolveHostEmail(settings.email);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A2A21;">
      <h2 style="color: #0F2A20; border-bottom: 2px solid #B8964A; padding-bottom: 8px;">
        Booking Confirmed — Marichin Homestay
      </h2>
      <p>Dear ${booking.guestName},</p>
      <p>We are delighted to confirm your reservation at Marichin Homestay near Kushalnagar, Coorg!</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${passUrl}" style="background-color: #B8964A; color: #0F2A20; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
          View Official Digital Pass & QR
        </a>
      </div>

      <div style="background-color: #FAF6EC; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #D9BC7A;">
        <h3 style="margin-top: 0; color: #0F2A20;">Your Confirmed Stay Details</h3>
        <p><strong>Booking Reference:</strong> ${booking.bookingCode}</p>
        <p><strong>Accommodation:</strong> ${roomName}</p>
        <p><strong>Check-In Date:</strong> ${new Date(booking.checkIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} (${checkInTime})</p>
        <p><strong>Check-Out Date:</strong> ${new Date(booking.checkOut).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} (${checkOutTime})</p>
        <p><strong>Total Duration:</strong> ${nightsCount} Night${nightsCount > 1 ? 's' : ''}</p>
        <p><strong>Advance Paid:</strong> ₹${booking.advancePaid?.toLocaleString('en-IN')}</p>
        <p><strong>Balance Due at Check-In:</strong> ₹${booking.balanceDue?.toLocaleString('en-IN')}</p>
      </div>

      ${buildPolicyLinksBlock(settings)}
      ${buildConfiguredContactLine(hostPhone, hostEmail)}
      <p>Warm regards,<br/>Marichin Homestay Team</p>
    </div>
  `;

  try {
    await mailer.sendMail({
      from: `"Marichin Homestay" <${getHostSenderAddress(hostEmail)}>`,
      ...(hostEmail ? { replyTo: hostEmail } : {}),
      to: booking.email,
      subject: `Confirmed: Your Stay at Marichin Homestay [${booking.bookingCode}]`,
      html
    });
    console.log(`✅ [Email] Dispatched booking confirmed email to ${booking.email}`);
  } catch (err) {
    console.warn('⚠️ [Email] Could not send booking confirmed email:', err.message);
  }
};

/**
 * 4. Guest: Booking rejected with refund
 */
export const sendBookingRejectedWithRefundEmail = async (booking, refundDetails = {}) => {
  const mailer = getTransporter();
  if (!mailer) {
    console.log('⚠️ [Email] SMTP not configured. Skipping rejection refund email for:', booking.bookingCode);
    return;
  }

  const settings = await getSettings();
  const hostEmail = resolveHostEmail(settings.email);
  const hostPhone = getConfiguredEmailPhone(settings);
  const refundAmt = refundDetails.amount ?? booking.advancePaid ?? 0;
  const refundId = refundDetails.refundId || 'Processing';
  const refundTimeline = settings.refundTimelineText || '5 to 7 working days';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A2A21;">
      <h2 style="color: #A8654A; border-bottom: 2px solid #A8654A; padding-bottom: 8px;">
        Reservation Update &amp; Refund Notice
      </h2>
      <p>Dear ${booking.guestName},</p>
      <p>We regret to inform you that we are unable to accommodate your reservation request for booking <strong>${booking.bookingCode}</strong>.</p>
      
      <div style="background-color: #FAF6EC; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #D9BC7A;">
        <h3 style="margin-top: 0; color: #0F2A20;">Refund Information</h3>
        <p><strong>Booking Code:</strong> ${booking.bookingCode}</p>
        <p><strong>Refund Amount:</strong> ₹${Number(refundAmt).toLocaleString('en-IN')}</p>
        <p><strong>Razorpay Refund ID:</strong> ${refundId}</p>
        <p><strong>Status:</strong> Processed</p>
        <p>The refunded amount will reflect in your original payment method within ${refundTimeline} per banking guidelines.</p>
      </div>

      ${buildPolicyLinksBlock(settings)}
      ${buildConfiguredContactLine(hostPhone, hostEmail)}
      <p>Warm regards,<br/>Marichin Homestay Team</p>
    </div>
  `;

  try {
    await mailer.sendMail({
      from: `"Marichin Homestay" <${getHostSenderAddress(hostEmail)}>`,
      ...(hostEmail ? { replyTo: hostEmail } : {}),
      to: booking.email,
      subject: `Reservation Update & Refund Notice [${booking.bookingCode}] - Marichin Homestay`,
      html
    });
    console.log(`✅ [Email] Dispatched rejection refund email to ${booking.email}`);
  } catch (err) {
    console.warn('⚠️ [Email] Could not send rejection refund email:', err.message);
  }
};

/**
 * 5. Guest: Booking cancelled & refund notice (admin or guest initiated)
 */
export const sendBookingCancelledRefundEmail = async (booking, refundDetails = {}) => {
  const mailer = getTransporter();
  if (!mailer || !booking?.email) {
    console.log('⚠️ [Email] SMTP not configured or missing email. Skipping cancellation notice for:', booking?.bookingCode);
    return;
  }

  const settings = await getSettings();
  const hostEmail = resolveHostEmail(settings.email);
  const hostPhone = getConfiguredEmailPhone(settings);
  const refundAmt = Number(refundDetails.amount ?? 0);
  const refundId = refundDetails.refundId || (refundAmt > 0 ? 'Processed via Razorpay' : 'Not applicable');
  const reason = refundDetails.reason || booking.cancellationReason || 'Cancelled';
  const refundTimeline = settings.refundTimelineText || '5 to 7 working days';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A2A21;">
      <h2 style="color: #A8654A; border-bottom: 2px solid #A8654A; padding-bottom: 8px;">
        Booking Cancellation &amp; Refund Summary
      </h2>
      <p>Dear ${booking.guestName},</p>
      <p>Your booking <strong>${booking.bookingCode}</strong> has been marked as cancelled.</p>

      <div style="background-color: #FAF6EC; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #D9BC7A;">
        <p><strong>Booking Code:</strong> ${booking.bookingCode}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Refund Amount:</strong> ₹${refundAmt.toLocaleString('en-IN')}</p>
        <p><strong>Razorpay Refund Reference:</strong> ${refundId}</p>
        ${refundAmt > 0 ? `<p>Approved online refunds are returned to your original payment method within ${refundTimeline}.</p>` : ''}
      </div>

      ${buildPolicyLinksBlock(settings)}
      ${buildConfiguredContactLine(hostPhone, hostEmail)}
      <p>Warm regards,<br/>Marichin Homestay Team</p>
    </div>
  `;

  try {
    await mailer.sendMail({
      from: `"Marichin Homestay" <${getHostSenderAddress(hostEmail)}>`,
      ...(hostEmail ? { replyTo: hostEmail } : {}),
      to: booking.email,
      subject: `Booking Cancelled [${booking.bookingCode}] - Marichin Homestay`,
      html
    });
    console.log(`✅ [Email] Dispatched cancellation email to ${booking.email}`);
  } catch (err) {
    console.warn('⚠️ [Email] Could not send cancellation email:', err.message);
  }
};

/**
 * 6. Guest: Booking hold expired (no payment within 15 minutes)
 */
export const sendBookingExpiredEmail = async (booking) => {
  const mailer = getTransporter();
  if (!mailer) {
    console.log('⚠️ [Email] SMTP not configured. Skipping hold expired email for:', booking.bookingCode);
    return;
  }

  const settings = await getSettings();
  const hostEmail = resolveHostEmail(settings.email);
  const hostPhone = getConfiguredEmailPhone(settings);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A2A21;">
      <h2 style="color: #0F2A20; border-bottom: 2px solid #B8964A; padding-bottom: 8px;">
        Reservation Hold Expired
      </h2>
      <p>Dear ${booking.guestName},</p>
      <p>Your 15-minute temporary reservation hold for booking <strong>${booking.bookingCode}</strong> has expired as payment was not completed within the allotted window.</p>
      <p>The held dates have been released back to general availability. If you still wish to stay with us, you are welcome to make a new booking on our website at any time.</p>
      ${buildPolicyLinksBlock(settings)}
      ${buildConfiguredContactLine(hostPhone, hostEmail)}
      <p>Warm regards,<br/>Marichin Homestay Team</p>
    </div>
  `;

  try {
    await mailer.sendMail({
      from: `"Marichin Homestay" <${getHostSenderAddress(hostEmail)}>`,
      ...(hostEmail ? { replyTo: hostEmail } : {}),
      to: booking.email,
      subject: `Reservation Hold Expired [${booking.bookingCode}] - Marichin Homestay`,
      html
    });
    console.log(`✅ [Email] Dispatched hold expired email to ${booking.email}`);
  } catch (err) {
    console.warn('⚠️ [Email] Could not send hold expired email:', err.message);
  }
};

// Backward-compatible export
export const sendBookingEmails = sendBookingConfirmedEmail;

export const sendEnquiryEmails = async (enquiry) => {
  const mailer = getTransporter();
  if (!mailer) {
    console.log('⚠️ [Email] SMTP not configured. Skipping enquiry email notification for:', enquiry.name);
    return;
  }

  const settings = await getSettings();
  const hostEmail = resolveHostEmail(settings.email);
  const adminEmail = getAdminNotificationRecipient(settings);

  try {
    if (adminEmail) {
      await mailer.sendMail({
        from: `"Marichin Contact" <${getHostSenderAddress(hostEmail)}>`,
        to: adminEmail,
        replyTo: enquiry.email || hostEmail,
        subject: `New Guest Enquiry from ${enquiry.name}`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h3>New Contact Enquiry Received</h3>
            <p><strong>Name:</strong> ${enquiry.name}</p>
            <p><strong>Email:</strong> ${enquiry.email}</p>
            <p><strong>Phone:</strong> ${enquiry.phone}</p>
            <p><strong>Message:</strong></p>
            <blockquote style="background: #FAF6EC; padding: 10px;">${enquiry.message}</blockquote>
          </div>
        `
      });
    }

    await mailer.sendMail({
      from: `"Marichin Homestay" <${getHostSenderAddress(hostEmail)}>`,
      ...(hostEmail ? { replyTo: hostEmail } : {}),
      to: enquiry.email,
      subject: `We have received your enquiry - Marichin Homestay`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <p>Dear ${enquiry.name},</p>
          <p>Thank you for reaching out to Marichin Homestay. We have received your message and our host will respond shortly.${hostEmail ? ` You can also write directly to <a href="mailto:${hostEmail}">${hostEmail}</a>.` : ''}</p>
          <p>Warm regards,<br/>Marichin Homestay Team</p>
        </div>
      `
    });
  } catch (err) {
    console.warn('⚠️ [Email] Could not send enquiry email:', err.message);
  }
};
