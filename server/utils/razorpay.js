import '../config/env.js';
import crypto from 'crypto';

const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1';

/**
 * Checks whether Razorpay credentials are fully configured in server environment.
 * @returns {boolean}
 */
export const isRazorpayConfigured = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return Boolean(keyId && keySecret && keyId.trim() && keySecret.trim());
};

/**
 * Returns the public Razorpay Key ID for client initialization.
 * Key Secret is NEVER sent to the client.
 * @returns {string|null}
 */
export const getRazorpayKeyId = () => {
  return process.env.RAZORPAY_KEY_ID?.trim() || null;
};

/**
 * Helper to generate HTTP Basic Auth header using RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.
 * @returns {string}
 */
const getAuthHeader = () => {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials are not configured on the server');
  }
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
};

/**
 * Creates a Razorpay Order for advance payment.
 * Amount is strictly in paise as an integer (1 INR = 100 paise).
 * 
 * @param {Object} params
 * @param {number} params.amountPaise - Amount in paise (integer)
 * @param {string} params.receipt - Booking code or unique receipt string
 * @param {Object} [params.notes] - Safe metadata notes (booking code, guest name, stay type)
 * @param {string} [params.currency='INR']
 * @returns {Promise<Object>} Razorpay order document
 */
export const createRazorpayOrder = async ({ amountPaise, receipt, notes = {}, currency = 'INR' }) => {
  if (!isRazorpayConfigured()) {
    const err = new Error('Online payment is not available yet, please contact the host');
    err.status = 503;
    throw err;
  }

  const integerAmount = Math.round(Number(amountPaise));
  if (!integerAmount || integerAmount <= 0) {
    const err = new Error('Invalid order amount for Razorpay payment');
    err.status = 400;
    throw err;
  }

  const payload = {
    amount: integerAmount,
    currency,
    receipt: String(receipt).slice(0, 40),
    notes: {
      bookingCode: notes.bookingCode || receipt,
      bookingType: notes.bookingType || 'room',
      guestName: notes.guestName ? String(notes.guestName).slice(0, 40) : 'Guest'
    }
  };

  const response = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error?.description || `Razorpay order creation failed with status ${response.status}`;
    console.error(`[Razorpay Order Error] Status ${response.status}:`, data?.error?.description || 'Unknown error');
    const err = new Error(errorMsg);
    err.status = response.status >= 400 && response.status < 500 ? 400 : 502;
    err.data = data;
    throw err;
  }

  // Sanitized log (zero secrets or card data)
  console.log(`[Razorpay] Created order ${data.id} for receipt ${receipt} (₹${(integerAmount / 100).toFixed(2)})`);

  return data;
};

/**
 * Verifies Razorpay payment signature using HMAC SHA256 with RAZORPAY_KEY_SECRET.
 * Uses timing-safe string comparison to protect against timing attacks.
 * 
 * @param {Object} params
 * @param {string} params.orderId - razorpay_order_id
 * @param {string} params.paymentId - razorpay_payment_id
 * @param {string} params.signature - razorpay_signature
 * @returns {boolean} True if signature matches exactly
 */
export const verifyRazorpayPaymentSignature = ({ orderId, paymentId, signature }) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keySecret || !orderId || !paymentId || !signature) {
    return false;
  }

  try {
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'utf8');
    const signatureBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch (err) {
    console.warn('[Razorpay] Signature verification threw an exception:', err.message);
    return false;
  }
};

/**
 * Verifies incoming Razorpay Webhook signature using HMAC SHA256 with RAZORPAY_WEBHOOK_SECRET.
 * 
 * @param {Object} params
 * @param {string|Buffer} params.rawBody - Raw request body
 * @param {string} params.signature - Header X-Razorpay-Signature
 * @returns {boolean} True if webhook signature is authentic
 */
export const verifyRazorpayWebhookSignature = ({ rawBody, signature }) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!webhookSecret || !rawBody || !signature) {
    return false;
  }

  try {
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'))
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'utf8');
    const signatureBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch (err) {
    console.warn('[Razorpay Webhook] Signature verification threw an exception:', err.message);
    return false;
  }
};

/**
 * Fetches verified payment details from Razorpay API.
 * 
 * @param {string} paymentId
 * @returns {Promise<Object>} Razorpay payment object
 */
export const fetchRazorpayPayment = async (paymentId) => {
  if (!paymentId) {
    throw new Error('Payment ID is required to fetch Razorpay payment');
  }

  const response = await fetch(`${RAZORPAY_API_BASE}/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      'Authorization': getAuthHeader()
    }
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error?.description || `Failed to fetch payment ${paymentId}`;
    console.error(`[Razorpay Payment Fetch Error] Status ${response.status}:`, data?.error?.description || 'Unknown');
    const err = new Error(errorMsg);
    err.status = response.status;
    throw err;
  }

  return data;
};

/**
 * Creates a Razorpay Refund for a paid booking.
 * 
 * @param {Object} params
 * @param {string} params.paymentId - Razorpay Payment ID to refund
 * @param {number} params.amountPaise - Amount to refund in paise (integer)
 * @param {Object} [params.notes] - Safe notes (e.g. reason, booking code)
 * @returns {Promise<Object>} Razorpay refund object
 */
export const createRazorpayRefund = async ({ paymentId, amountPaise, notes = {} }) => {
  if (!isRazorpayConfigured()) {
    throw new Error('Razorpay credentials not configured for issuing refunds');
  }

  const integerAmount = Math.round(Number(amountPaise));
  if (!integerAmount || integerAmount <= 0) {
    throw new Error('Invalid refund amount in paise');
  }

  const payload = {
    amount: integerAmount,
    notes: {
      bookingCode: notes.bookingCode || '',
      reason: notes.reason || 'Admin rejection or cancellation refund'
    }
  };

  const response = await fetch(`${RAZORPAY_API_BASE}/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader()
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error?.description || `Razorpay refund failed with status ${response.status}`;
    console.error(`[Razorpay Refund Error] Payment ${paymentId}:`, data?.error?.description || 'Unknown');
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  console.log(`[Razorpay] Processed refund ${data.id} for payment ${paymentId} (₹${(integerAmount / 100).toFixed(2)})`);

  return data;
};

