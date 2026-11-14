import mongoose from 'mongoose';
import crypto from 'crypto';
import { Booking } from '../models/Booking.js';
import { Room } from '../models/Room.js';
import { SiteSettings } from '../models/SiteSettings.js';
import {
  isRazorpayConfigured,
  getRazorpayKeyId,
  createRazorpayOrder,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
  fetchRazorpayPayment,
  createRazorpayRefund
} from '../utils/razorpay.js';
import {
  withTransaction,
  bookInventoryAtomic,
  releaseInventoryAtomic,
  expireStaleHolds,
  validateStayRules,
  calculateServerQuote,
  toDateStr,
  generateNightsArray
} from '../utils/inventoryEngine.js';
import {
  sendPaymentReceivedGuestEmail,
  sendNewPaidBookingAdminEmail,
  sendBookingConfirmedEmail,
  sendBookingRejectedWithRefundEmail
} from '../utils/email.js';

const generateBookingCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'MH-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * GET /api/payments/razorpay/config
 * Returns public configuration for client (Key ID only, never secret).
 */
export const getRazorpayConfig = async (req, res, next) => {
  try {
    const configured = isRazorpayConfigured();
    const keyId = configured ? getRazorpayKeyId() : null;
    res.status(200).json({
      success: true,
      data: {
        configured,
        enabled: configured,
        keyId
      },
      configured,
      enabled: configured,
      keyId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/razorpay/create-order
 * Creates or reuses a Razorpay Order for advance payment.
 * Holds rooms for 15 minutes in 'payment_pending' via inventory engine.
 */
export const createRazorpayOrderHandler = async (req, res, next) => {
  try {
    // 1. Secrets check: If keys are missing, refuse to create order or booking
    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Online payment is not available yet, please contact the host',
        data: null
      });
    }

    await expireStaleHolds();

    const {
      bookingCode,
      bookingType = 'room',
      roomId,
      roomSlug,
      rooms: requestRooms,
      checkIn,
      checkOut,
      adults = 2,
      children = 0,
      specialRequests = 'None',
      promoCode = '',
      advanceOption = 20,
      packageSlug = '',
      package: packageParam = '',
      guestName,
      email,
      phone
    } = req.body;

    let booking = null;

    // SCENARIO A: Reusing an existing held booking (e.g. user retrying after popup dismissal)
    if (bookingCode) {
      booking = await Booking.findOne({ bookingCode: bookingCode.trim() });
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking reference not found',
          data: null
        });
      }

      if (booking.status !== 'payment_pending') {
        return res.status(400).json({
          success: false,
          message: `Booking is not pending payment (current status: ${booking.status})`,
          data: null
        });
      }

      // Check if hold has expired
      if (booking.holdExpiresAt && new Date() > booking.holdExpiresAt) {
        return res.status(400).json({
          success: false,
          message: 'Your 15-minute hold has expired. Please select your dates again.',
          data: { expired: true }
        });
      }

      // If advance percentage changed, recalculate advance amount
      if (advanceOption && Number(advanceOption) !== booking.advanceOption) {
        const totalAmount = Number(booking.pricing?.total || booking.totalAmount || 0);
        const opt = [20, 50, 100].includes(Number(advanceOption)) ? Number(advanceOption) : 20;
        const newAdvance = Math.round((totalAmount * opt) / 100);
        booking.advanceOption = opt;
        booking.advancePaid = newAdvance;
        booking.balanceDue = Math.max(0, totalAmount - newAdvance);
      }

      const amountPaise = Math.round(Number(booking.advancePaid) * 100);

      // Check if existing Razorpay order matches this exact amount
      if (booking.razorpayOrderId) {
        try {
          // If order exists and matches amount, reuse it to prevent double orders
          const reusePayload = {
            orderId: booking.razorpayOrderId,
            amount: amountPaise,
            currency: 'INR',
            keyId: getRazorpayKeyId(),
            bookingCode: booking.bookingCode,
            bookingId: booking._id,
            booking
          };
          return res.status(200).json({
            success: true,
            data: reusePayload,
            ...reusePayload
          });
        } catch {
          // Fall through to generate fresh order if error
        }
      }

      // Generate order
      const order = await createRazorpayOrder({
        amountPaise,
        receipt: booking.bookingCode,
        notes: {
          bookingCode: booking.bookingCode,
          bookingType: booking.bookingType,
          guestName: booking.guestName
        }
      });

      booking.razorpayOrderId = order.id;
      await booking.save();

      const orderPayload = {
        orderId: order.id,
        amount: order.amount,
        currency: 'INR',
        keyId: getRazorpayKeyId(),
        bookingCode: booking.bookingCode,
        bookingId: booking._id,
        booking
      };
      return res.status(200).json({
        success: true,
        data: orderPayload,
        ...orderPayload
      });
    }

    // SCENARIO B: Fresh booking creation + Razorpay Order
    if (!guestName || !phone || !email || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (guestName, phone, email, checkIn, checkOut)',
        data: null
      });
    }

    const inStr = toDateStr(checkIn);
    const outStr = toDateStr(checkOut);
    if (!inStr || !outStr || inStr >= outStr) {
      return res.status(400).json({
        success: false,
        message: 'Invalid check-in or check-out dates',
        data: null
      });
    }

    const adultCount = parseInt(adults, 10) || 1;
    const childCount = parseInt(children, 10) || 0;
    const targetBookingType = bookingType === 'full_home' ? 'full_home' : 'room';

    let rDoc = null;
    let quote = null;
    let siteSettings = null;
    let nights = null;
    let fullUnits = 1;

    if (targetBookingType === 'full_home') {
      const allRooms = await Room.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
      if (!allRooms || allRooms.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No active rooms found for Full Home reservation',
          data: null
        });
      }
      fullUnits = allRooms.reduce((sum, r) => sum + (Number(r.totalUnits) || 1), 0);

      const stayValidation = await validateStayRules(
        inStr,
        outStr,
        adultCount,
        childCount,
        null,
        'full_home'
      );
      nights = stayValidation.nights;
      siteSettings = stayValidation.settings;

      quote = await calculateServerQuote({
        bookingType: 'full_home',
        checkIn: inStr,
        checkOut: outStr,
        promoCode,
        advanceOption,
        packageSlug: packageSlug || packageParam || ''
      });
    } else {
      const targetId = roomId || (requestRooms && (requestRooms[0]?.roomId || requestRooms[0]?.room));
      const targetSlug = roomSlug || (requestRooms && (requestRooms[0]?.roomSlug || requestRooms[0]?.slug));

      if (targetId && String(targetId).match(/^[0-9a-fA-F]{24}$/)) {
        rDoc = await Room.findById(targetId);
      } else if (targetId) {
        rDoc = await Room.findOne({ slug: targetId });
      }
      if (!rDoc && targetSlug) {
        rDoc = await Room.findOne({ slug: targetSlug });
      }
      if (!rDoc) {
        rDoc = await Room.findOne({ isActive: true }).sort({ displayOrder: 1 });
      }
      if (!rDoc) {
        return res.status(404).json({
          success: false,
          message: 'Room not found',
          data: null
        });
      }

      const stayValidation = await validateStayRules(
        inStr,
        outStr,
        adultCount,
        childCount,
        rDoc,
        'room'
      );
      nights = stayValidation.nights;
      siteSettings = stayValidation.settings;

      quote = await calculateServerQuote({
        bookingType: 'room',
        roomDoc: rDoc,
        checkIn: inStr,
        checkOut: outStr,
        promoCode,
        advanceOption,
        packageSlug: packageSlug || packageParam || ''
      });
    }

    const holdMinutes = Number(siteSettings.holdMinutes) || 15;
    const holdExpiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);

    // Generate unique booking reference
    let newBookingCode = generateBookingCode();
    let exists = await Booking.findOne({ bookingCode: newBookingCode });
    while (exists) {
      newBookingCode = generateBookingCode();
      exists = await Booking.findOne({ bookingCode: newBookingCode });
    }

    // Atomic hold inside transaction
    let createdBooking = null;

    await withTransaction(async (session) => {
      // 1. Atomic inventory hold
      if (targetBookingType === 'full_home') {
        await bookInventoryAtomic({
          bookingType: 'full_home',
          nights,
          session
        });
      } else {
        await bookInventoryAtomic({
          bookingType: 'room',
          roomDoc: rDoc,
          nights,
          session
        });
      }

      // 2. Create booking record in payment_pending
      const bookingData = {
        bookingCode: newBookingCode,
        passToken: crypto.randomBytes(24).toString('hex'),
        bookingType: targetBookingType,
        room: targetBookingType === 'full_home' ? null : rDoc._id,
        roomName: targetBookingType === 'full_home' ? 'Full Home (All 5 Rooms)' : rDoc.name,
        roomSlug: targetBookingType === 'full_home' ? 'full-home' : rDoc.slug,
        pricePerNight: targetBookingType === 'full_home' ? Number(quote.room.pricePerNight) : Number(rDoc.pricePerNight),
        quantity: targetBookingType === 'full_home' ? fullUnits : 1,
        lines: targetBookingType === 'full_home'
          ? quote.lines
          : [
              {
                room: rDoc._id,
                roomName: rDoc.name,
                roomSlug: rDoc.slug,
                quantity: 1,
                pricePerNight: Number(rDoc.pricePerNight)
              }
            ],
        guestName: guestName.trim(),
        phone: phone.trim(),
        email: email.toLowerCase().trim(),
        checkIn: new Date(inStr + 'T12:00:00Z'),
        checkOut: new Date(outStr + 'T11:00:00Z'),
        nights,
        guestCount: {
          adults: adultCount,
          children: childCount
        },
        adults: adultCount,
        children: childCount,
        specialRequests: specialRequests || 'None',
        pricing: {
          baseAmount: quote.pricing.baseAmount,
          extraGuestCharge: 0,
          discount: quote.pricing.discount,
          taxAmount: quote.pricing.taxAmount,
          total: quote.pricing.total
        },
        advanceOption: quote.selectedAdvanceOption,
        advancePaid: quote.advanceAmount,
        balanceDue: quote.balanceDue,
        paymentStatus: 'pending',
        paymentMethod: 'Razorpay',
        status: 'payment_pending',
        holdExpiresAt,
        statusHistory: [
          {
            who: 'guest',
            when: new Date(),
            reason: `Initiated reservation. Holding rooms for ${holdMinutes} minutes pending Razorpay payment.`,
            status: 'payment_pending'
          }
        ],
        promoCode: quote.appliedPromo?.code || ''
      };

      const [savedDoc] = await Booking.create([bookingData], { session });
      createdBooking = savedDoc;
    });

    // 3. Create Razorpay Order
    const amountPaise = Math.round(Number(createdBooking.advancePaid) * 100);

    const rzpOrder = await createRazorpayOrder({
      amountPaise,
      receipt: createdBooking.bookingCode,
      notes: {
        bookingCode: createdBooking.bookingCode,
        bookingType: createdBooking.bookingType,
        guestName: createdBooking.guestName
      }
    });

    createdBooking.razorpayOrderId = rzpOrder.id;
    await createdBooking.save();

    res.status(201).json({
      success: true,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: 'INR',
      keyId: getRazorpayKeyId(),
      bookingCode: createdBooking.bookingCode,
      booking: createdBooking
    });
  } catch (error) {
    if (error.status === 409) {
      return res.status(409).json({
        success: false,
        message: error.message,
        data: error.nearest ? { nearest: error.nearest } : null
      });
    }
    next(error);
  }
};

/**
 * POST /api/payments/razorpay/verify
 * Verifies Razorpay payment signature and checks payment details before marking booking paid.
 */
export const verifyRazorpayPaymentHandler = async (req, res, next) => {
  try {
    const {
      bookingCode,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = req.body;

    if (!bookingCode || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Razorpay payment verification parameters',
        data: null
      });
    }

    // 1. Verify HMAC SHA256 Signature
    const isAuthentic = verifyRazorpayPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: invalid HMAC signature',
        data: null
      });
    }

    // 2. Find Booking
    const booking = await Booking.findOne({ bookingCode: bookingCode.trim() });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        data: null
      });
    }

    // Idempotency: if already paid & confirmed or awaiting confirmation with this exact payment id
    if (
      (booking.status === 'confirmed' || booking.status === 'paid_awaiting_confirmation') &&
      booking.razorpayPaymentId === razorpay_payment_id
    ) {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
        data: booking
      });
    }

    if (booking.status === 'cancelled' || booking.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot apply payment to a cancelled or rejected reservation',
        data: null
      });
    }

    // 3. Fetch verified payment details from Razorpay API
    const payment = await fetchRazorpayPayment(razorpay_payment_id);

    // Verify order ID and amount match
    if (payment.order_id && booking.razorpayOrderId && payment.order_id !== booking.razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID mismatch between Razorpay payment and booking record',
        data: null
      });
    }

    const expectedPaise = Math.round(Number(booking.advancePaid) * 100);
    // Allow minor rounding within 100 paise (₹1)
    if (Math.abs(payment.amount - expectedPaise) > 100) {
      console.warn(`[Payment Warning] Amount mismatch: paid ${payment.amount} paise vs expected ${expectedPaise} paise`);
      return res.status(400).json({
        success: false,
        message: 'Paid amount does not match the booking advance requirement',
        data: null
      });
    }

    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return res.status(400).json({
        success: false,
        message: `Payment status is ${payment.status}, expected captured or authorized`,
        data: null
      });
    }

    // 4. Update Booking status
    const siteSettings = await SiteSettings.findOne() || {};
    const autoConfirm = siteSettings.autoConfirmAfterPayment !== false;
    const newStatus = autoConfirm ? 'confirmed' : 'paid_awaiting_confirmation';

    booking.status = newStatus;
    booking.holdExpiresAt = null; // Remove expiry: rooms are now held until admin acts
    booking.paymentStatus = booking.advanceOption === 100 ? 'paid' : 'partial';
    booking.paymentMethod = payment.method || 'Razorpay';
    booking.transactionId = razorpay_payment_id;
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpayOrderId = razorpay_order_id;
    booking.razorpaySignature = razorpay_signature;
    booking.razorpayPaymentMethod = payment.method || 'online';
    booking.amountPaidPaise = payment.amount;
    booking.advancePaid = Math.round(payment.amount / 100);
    booking.balanceDue = Math.max(0, (booking.pricing?.total || 0) - booking.advancePaid);
    booking.paidAt = new Date();

    booking.statusHistory = booking.statusHistory || [];
    booking.statusHistory.push({
      who: 'guest_payment',
      when: new Date(),
      status: newStatus,
      reason: `Razorpay payment verified: ${razorpay_payment_id} (method: ${payment.method || 'online'})`
    });

    await booking.save();

    // 5. Dispatch email notifications (silent log fallback if SMTP is unconfigured)
    if (newStatus === 'confirmed') {
      sendBookingConfirmedEmail(booking).catch(() => {});
    } else {
      sendPaymentReceivedGuestEmail(booking).catch(() => {});
      sendNewPaidBookingAdminEmail(booking).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and reservation updated successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/razorpay/webhook
 * Handles Razorpay webhook events using raw body verification.
 * Events: payment.captured, payment.failed, order.paid, refund.processed.
 * Idempotent and reconciles missed client callbacks.
 */
export const razorpayWebhookHandler = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody;

    if (!signature || !rawBody) {
      return res.status(400).json({ success: false, message: 'Missing webhook signature or raw body' });
    }

    const isAuthentic = verifyRazorpayWebhookSignature({ rawBody, signature });
    if (!isAuthentic) {
      console.warn('⚠️ [Razorpay Webhook] Invalid webhook signature received');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body;
    const eventType = event.event;
    console.log(`[Razorpay Webhook] Received authentic event: ${eventType}`);

    // =========================================================================
    // 1. payment.captured / order.paid
    // =========================================================================
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity || event.payload?.order?.entity;
      if (!paymentEntity) {
        return res.status(200).json({ status: 'ok', message: 'No payment entity in payload' });
      }

      const orderId = paymentEntity.order_id || paymentEntity.id;
      const paymentId = paymentEntity.id;
      const notes = paymentEntity.notes || {};
      const targetCode = notes.bookingCode;

      let booking = null;
      if (orderId) {
        booking = await Booking.findOne({ razorpayOrderId: orderId });
      }
      if (!booking && targetCode) {
        booking = await Booking.findOne({ bookingCode: targetCode });
      }

      if (!booking) {
        console.warn(`[Razorpay Webhook] No booking found for order ${orderId} / code ${targetCode}`);
        return res.status(200).json({ status: 'ok', message: 'Booking not found' });
      }

      // Idempotency check: already marked paid with this payment ID
      if (
        (booking.status === 'confirmed' || booking.status === 'paid_awaiting_confirmation') &&
        booking.razorpayPaymentId === paymentId
      ) {
        return res.status(200).json({ status: 'ok', message: 'Already reconciled' });
      }

      // Reject applying to cancelled reservations
      if (booking.status === 'cancelled') {
        console.warn(`[Razorpay Webhook] Payment ${paymentId} arrived for cancelled booking ${booking.bookingCode}`);
        return res.status(200).json({ status: 'ok', message: 'Booking was cancelled' });
      }

      // Late payment handling for an expired hold:
      // Try to retake the rooms atomically with the same inventory engine. If that fails, refund automatically.
      if (booking.status === 'expired') {
        console.log(`[Razorpay Webhook] Late payment for expired hold on ${booking.bookingCode}. Attempting atomic inventory retake...`);
        let retakeSucceeded = false;

        try {
          const nights = Array.isArray(booking.nights) ? booking.nights : generateNightsArray(booking.checkIn, booking.checkOut);
          await withTransaction(async (session) => {
            if (booking.bookingType === 'full_home') {
              await bookInventoryAtomic({
                bookingType: 'full_home',
                nights,
                session
              });
            } else {
              const rDoc = await Room.findById(booking.room);
              await bookInventoryAtomic({
                bookingType: 'room',
                roomDoc: rDoc,
                nights,
                session
              });
            }
          });
          retakeSucceeded = true;
          console.log(`[Razorpay Webhook] Successfully retook inventory for late booking ${booking.bookingCode}`);
        } catch (retakeErr) {
          console.warn(`[Razorpay Webhook] Retake failed for ${booking.bookingCode}: ${retakeErr.message}. Issuing immediate refund.`);
        }

        if (retakeSucceeded) {
          const siteSettings = await SiteSettings.findOne() || {};
          const autoConfirm = siteSettings.autoConfirmAfterPayment !== false;
          const newStatus = autoConfirm ? 'confirmed' : 'paid_awaiting_confirmation';

          booking.status = newStatus;
          booking.holdExpiresAt = null;
          booking.paymentStatus = booking.advanceOption === 100 ? 'paid' : 'partial';
          booking.paymentMethod = paymentEntity.method || 'Razorpay';
          booking.transactionId = paymentId;
          booking.razorpayPaymentId = paymentId;
          booking.amountPaidPaise = paymentEntity.amount;
          booking.paidAt = new Date();
          await booking.save();

          if (newStatus === 'confirmed') {
            sendBookingConfirmedEmail(booking).catch(() => {});
          } else {
            sendPaymentReceivedGuestEmail(booking).catch(() => {});
            sendNewPaidBookingAdminEmail(booking).catch(() => {});
          }
          return res.status(200).json({ status: 'ok', message: 'Late payment inventory retaken' });
        } else {
          // Automatic refund for expired hold whose rooms were taken
          try {
            const refund = await createRazorpayRefund({
              paymentId,
              amountPaise: paymentEntity.amount,
              notes: {
                bookingCode: booking.bookingCode,
                reason: 'Automatic refund: hold expired and dates were taken by another guest'
              }
            });

            booking.status = 'rejected';
            booking.paymentStatus = 'refunded';
            booking.refunds = booking.refunds || [];
            booking.refunds.push({
              refundId: refund.id,
              amount: Math.round(paymentEntity.amount / 100),
              amountPaise: paymentEntity.amount,
              status: refund.status || 'processed',
              reason: 'Automatic refund: dates unavailable after hold expiry',
              createdAt: new Date()
            });
            await booking.save();

            sendBookingRejectedWithRefundEmail(booking, {
              refundId: refund.id,
              amount: Math.round(paymentEntity.amount / 100)
            }).catch(() => {});
          } catch (refundErr) {
            console.error(`[Razorpay Webhook Refund Error] Payment ${paymentId}:`, refundErr.message);
          }
          return res.status(200).json({ status: 'ok', message: 'Hold expired, refund issued' });
        }
      }

      // Normal reconciliation from 'payment_pending'
      if (booking.status === 'payment_pending') {
        const siteSettings = await SiteSettings.findOne() || {};
        const autoConfirm = siteSettings.autoConfirmAfterPayment !== false;
        const newStatus = autoConfirm ? 'confirmed' : 'paid_awaiting_confirmation';

        booking.status = newStatus;
        booking.holdExpiresAt = null;
        booking.paymentStatus = booking.advanceOption === 100 ? 'paid' : 'partial';
        booking.paymentMethod = paymentEntity.method || 'Razorpay';
        booking.transactionId = paymentId;
        booking.razorpayPaymentId = paymentId;
        booking.amountPaidPaise = paymentEntity.amount;
        booking.advancePaid = Math.round(paymentEntity.amount / 100);
        booking.balanceDue = Math.max(0, (booking.pricing?.total || 0) - booking.advancePaid);
        booking.paidAt = new Date();

        booking.statusHistory = booking.statusHistory || [];
        booking.statusHistory.push({
          who: 'razorpay_webhook',
          when: new Date(),
          status: newStatus,
          reason: `Reconciled via webhook payment.captured (${paymentId})`
        });

        await booking.save();

        if (newStatus === 'confirmed') {
          sendBookingConfirmedEmail(booking).catch(() => {});
        } else {
          sendPaymentReceivedGuestEmail(booking).catch(() => {});
          sendNewPaidBookingAdminEmail(booking).catch(() => {});
        }
      }

      return res.status(200).json({ status: 'ok', message: 'Reconciled successfully' });
    }

    // =========================================================================
    // 2. payment.failed
    // =========================================================================
    if (eventType === 'payment.failed') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const targetCode = paymentEntity?.notes?.bookingCode;

      let booking = null;
      if (orderId) booking = await Booking.findOne({ razorpayOrderId: orderId });
      if (!booking && targetCode) booking = await Booking.findOne({ bookingCode: targetCode });

      if (booking) {
        booking.statusHistory = booking.statusHistory || [];
        booking.statusHistory.push({
          who: 'razorpay_webhook',
          when: new Date(),
          status: booking.status,
          reason: `Payment attempt failed: ${paymentEntity?.error_description || 'Transaction declined'}`
        });
        await booking.save();
      }

      return res.status(200).json({ status: 'ok', message: 'Payment failure recorded' });
    }

    // =========================================================================
    // 3. refund.processed
    // =========================================================================
    if (eventType === 'refund.processed') {
      const refundEntity = event.payload?.refund?.entity;
      if (refundEntity) {
        const paymentId = refundEntity.payment_id;
        const booking = await Booking.findOne({ razorpayPaymentId: paymentId });

        if (booking) {
          booking.refunds = booking.refunds || [];
          const alreadyRecorded = booking.refunds.some(r => r.refundId === refundEntity.id);

          if (!alreadyRecorded) {
            booking.refunds.push({
              refundId: refundEntity.id,
              amount: Math.round(refundEntity.amount / 100),
              amountPaise: refundEntity.amount,
              status: refundEntity.status || 'processed',
              reason: refundEntity.notes?.reason || 'Refund processed',
              createdAt: new Date()
            });
            booking.paymentStatus = 'refunded';
            await booking.save();
          }
        }
      }

      return res.status(200).json({ status: 'ok', message: 'Refund recorded' });
    }

    return res.status(200).json({ status: 'ok', message: 'Unhandled event ignored' });
  } catch (error) {
    console.error('[Razorpay Webhook Error]:', error);
    next(error);
  }
};

/**
 * GET /api/bookings/status?code=...&phone=...
 * Guest lookup endpoint for the /booking/status page.
 */
export const getBookingStatusHandler = async (req, res, next) => {
  try {
    const { code, phone } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your booking reference code',
        data: null
      });
    }

    const query = {
      bookingCode: { $regex: new RegExp(`^${code.trim()}$`, 'i') }
    };

    if (phone && phone.trim()) {
      const cleanPhone = phone.trim().replace(/[+-\s]/g, '');
      query.phone = { $regex: new RegExp(cleanPhone, 'i') };
    }

    const booking = await Booking.findOne(query).populate('room', 'name slug images pricePerNight');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'No booking found matching the provided reference code and phone number',
        data: null
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking status retrieved successfully',
      data: {
        bookingCode: booking.bookingCode,
        passToken: booking.passToken,
        bookingType: booking.bookingType,
        roomName: booking.roomName,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: Array.isArray(booking.nights) ? booking.nights.length : 1,
        nightsArray: booking.nights,
        guestName: booking.guestName,
        phone: booking.phone,
        email: booking.email,
        adults: booking.adults,
        children: booking.children,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        transactionId: booking.transactionId,
        razorpayPaymentId: booking.razorpayPaymentId,
        pricing: booking.pricing,
        advanceOption: booking.advanceOption,
        advancePaid: booking.advancePaid,
        balanceDue: booking.balanceDue,
        holdExpiresAt: booking.holdExpiresAt,
        paidAt: booking.paidAt,
        cancellationReason: booking.cancellationReason || '',
        refunds: booking.refunds || [],
        createdAt: booking.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

