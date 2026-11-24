import mongoose from 'mongoose';
import crypto from 'crypto';
import { Room } from '../models/Room.js';
import { Booking } from '../models/Booking.js';
import { RoomNight } from '../models/RoomNight.js';
import { BlockedDate } from '../models/BlockedDate.js';
import { Promo } from '../models/Promo.js';
import { Package } from '../models/Package.js';
import { Experience } from '../models/Experience.js';
import { MenuCategory, MenuItem } from '../models/MenuItem.js';
import { DiningContent } from '../models/DiningContent.js';
import { GalleryImage } from '../models/GalleryImage.js';
import { Review } from '../models/Review.js';
import { Enquiry } from '../models/Enquiry.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { Newsletter } from '../models/Newsletter.js';
import { InclusionItem } from '../models/InclusionItem.js';
import { PolicySection } from '../models/PolicySection.js';
import { SafetyContact } from '../models/SafetyContact.js';
import { DEFAULT_POLICY_SECTIONS } from '../seed/policyDefaults.js';
import {
  DEFAULT_SAFETY_FEATURES,
  normalizeCancellationTiers,
  formatCancellationSummaryText
} from '../utils/refundPolicy.js';
import { normalizeHeroBannerSettings } from '../utils/heroBanner.js';
import { sendBookingEmails, sendEnquiryEmails, resolveHostEmail as resolveSharedHostEmail } from '../utils/email.js';
import {
  toDateStr,
  getTodayISTStr,
  generateNightsArray,
  isNightBlocked,
  withTransaction,
  bookInventoryAtomic,
  releaseInventoryAtomic,
  expireStaleHolds,
  validateStayRules,
  calculateServerQuote,
  getCalendarAvailability,
  getValidCheckoutOptions,
  resolveFullHomeRate,
  calculateFullHomeLimits,
  getActiveBookingOccupancyMap,
  getEffectiveBookedCount
} from '../utils/inventoryEngine.js';

// Helper: Calculate nights count between two dates
const calculateNights = (start, end) => {
  const nights = generateNightsArray(start, end);
  return nights.length > 0 ? nights.length : 1;
};

// Helper: Generate Unique Booking Code e.g. MH-2026-4821
const generateBookingCode = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `MH-${year}-${randomNum}`;
};

// Helper: Check available units for a specific room across a date range
export const getAvailableUnitsForRoom = async (roomDocOrId, checkInDate, checkOutDate, options = {}) => {
  const {
    allowSameDay = false,
    skipExpire = false,
    allRooms: preloadedRooms = null,
    blockedDates: preloadedBlockedDates = null,
    rnDocsMap = null,
    bookingOccupancyMap: preloadedOccupancyMap = null
  } = options || {};

  if (!skipExpire) {
    await expireStaleHolds();
  }

  let room = roomDocOrId;
  if (!room || typeof room === 'string' || (room && room._bsontype === 'ObjectID')) {
    if (String(room).match(/^[0-9a-fA-F]{24}$/)) {
      room = await Room.findById(room);
    } else {
      room = await Room.findOne({ slug: room });
    }
  }
  if (!room) return 0;

  const inStr = toDateStr(checkInDate);
  const outStr = toDateStr(checkOutDate);
  const nights = generateNightsArray(inStr, outStr);
  if (nights.length === 0) return 0;

  const todayStr = getTodayISTStr();
  if (inStr < todayStr || (inStr === todayStr && !allowSameDay)) {
    return 0;
  }

  const totalUnits = Number(room.totalUnits) || 1;
  const blockedDates = Array.isArray(preloadedBlockedDates)
    ? preloadedBlockedDates
    : await BlockedDate.find();

  let roomRnMap = rnDocsMap;
  if (!roomRnMap) {
    const rnDocs = await RoomNight.find({ room: room._id, date: { $in: nights } });
    roomRnMap = new Map();
    for (const rn of rnDocs) {
      roomRnMap.set(`${String(rn.room)}:${rn.date}`, rn.booked || 0);
    }
  }

  const bookingOccupancyMap = preloadedOccupancyMap || await getActiveBookingOccupancyMap({
    targetNights: nights,
    allRooms: Array.isArray(preloadedRooms) && preloadedRooms.length > 0 ? preloadedRooms : [room]
  });

  let minAvailable = totalUnits;
  for (const night of nights) {
    if (
      isNightBlocked(night, room._id, blockedDates) ||
      isNightBlocked(night, room.slug, blockedDates) ||
      isNightBlocked(night, 'all', blockedDates)
    ) {
      return 0;
    }

    const rnBooked = roomRnMap.get(`${String(room._id)}:${night}`) || 0;
    const booked = getEffectiveBookedCount({
      roomId: room._id,
      nightStr: night,
      rnBooked,
      bookingOccupancyMap
    });
    const avail = Math.max(0, totalUnits - booked);
    if (avail < minAvailable) {
      minAvailable = avail;
    }
  }

  return minAvailable;
};

// Helper: Check if homestay or room is available for date range
export const checkRoomAvailability = async (roomId, checkInDate, checkOutDate) => {
  if (roomId && roomId !== 'all') {
    const units = await getAvailableUnitsForRoom(roomId, checkInDate, checkOutDate);
    return units > 0;
  }

  const allRooms = await Room.find({ isActive: true });
  for (const r of allRooms) {
    const units = await getAvailableUnitsForRoom(r, checkInDate, checkOutDate);
    if (units > 0) return true;
  }
  return false;
};

// @desc    Get all active rooms
// @route   GET /api/rooms
export const getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    const settings = await SiteSettings.findOne() || {};
    const fullHomeLimits = calculateFullHomeLimits(rooms);
    res.status(200).json({
      success: true,
      message: 'Rooms retrieved successfully',
      data: rooms,
      fullHome: {
        enabled: settings.fullHomeEnabled !== false,
        pricePerNight: Number(settings.fullHomePricePerNight) || 35000,
        minNights: Number(settings.fullHomeMinNights) || 1,
        mealsNote: settings.fullHomeMealsNote || 'Morning breakfast included',
        limits: fullHomeLimits
      }
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get single room by slug or id
// @route   GET /api/rooms/:slug
export const getRoomBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    let room = await Room.findOne({ slug, isActive: true });
    if (!room && slug.match(/^[0-9a-fA-F]{24}$/)) {
      room = await Room.findById(slug);
    }

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
        data: null
      });
    }

    res.status(200).json({
      success: true,
      message: 'Room retrieved successfully',
      data: room
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Check availability for rooms across a stay range
// @route   GET /api/availability?checkIn=&checkOut=&guests=
export const getAvailability = async (req, res, next) => {
  try {
    await expireStaleHolds();

    const { checkIn, checkOut, guests } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both checkIn and checkOut dates',
        data: null
      });
    }

    const inStr = toDateStr(checkIn);
    const outStr = toDateStr(checkOut);

    if (!inStr || !outStr || inStr >= outStr) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date',
        data: null
      });
    }

    const guestCount = guests ? parseInt(guests, 10) : 1;
    const allRooms = await Room.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    const todayStr = getTodayISTStr();

    if (inStr <= todayStr) {
      const roomsClosed = allRooms.map((room) => ({
        ...room.toObject(),
        totalUnits: room.totalUnits || 1,
        availableUnits: 0,
        isAvailable: false
      }));
      return res.status(200).json({
        success: true,
        message: inStr < todayStr
          ? 'Check-in date cannot be in the past'
          : 'Same-day check-in is closed. Earliest available check-in date is tomorrow.',
        data: {
          isAvailable: false,
          sameDayClosed: true,
          allRoomsOccupied: false,
          rooms: roomsClosed,
          availableRooms: [],
          totalAvailable: 0,
          checkIn: inStr,
          checkOut: outStr,
          guests: guestCount
        }
      });
    }

    const nights = generateNightsArray(inStr, outStr);
    const [blockedDates, rnDocs, bookingOccupancyMap] = await Promise.all([
      BlockedDate.find(),
      RoomNight.find({ date: { $in: nights } }),
      getActiveBookingOccupancyMap({ targetNights: nights, allRooms })
    ]);

    const rnDocsMap = new Map();
    for (const rn of rnDocs) {
      rnDocsMap.set(`${String(rn.room)}:${rn.date}`, rn.booked || 0);
    }

    const roomsWithAvailability = [];
    for (const room of allRooms) {
      const availableUnits = await getAvailableUnitsForRoom(room, inStr, outStr, {
        skipExpire: true,
        allRooms,
        blockedDates,
        rnDocsMap,
        bookingOccupancyMap
      });
      roomsWithAvailability.push({
        ...room.toObject(),
        totalUnits: room.totalUnits || 1,
        availableUnits,
        isAvailable: availableUnits > 0
      });
    }

    const availableRooms = roomsWithAvailability.filter((r) => r.isAvailable);
    const isAvailable = availableRooms.length > 0;
    const allRoomsOccupied = roomsWithAvailability.length > 0 && availableRooms.length === 0;

    res.status(200).json({
      success: true,
      message: isAvailable ? 'Rooms are available' : 'All rooms are occupied for selected dates',
      data: {
        isAvailable,
        sameDayClosed: false,
        allRoomsOccupied,
        rooms: roomsWithAvailability,
        availableRooms,
        totalAvailable: availableRooms.length,
        checkIn: inStr,
        checkOut: outStr,
        guests: guestCount
      }
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get detailed day-by-day availability calendar for specific rooms or Full Home
// @route   GET /api/availability/calendar?rooms=<roomId>&bookingType=full_home&from=YYYY-MM-DD&to=YYYY-MM-DD
export const getAvailabilityCalendar = async (req, res, next) => {
  try {
    const { rooms, room, from, to, bookingType } = req.query;
    const isFullHome = bookingType === 'full_home';
    const roomIdentifier = rooms || room;
    const result = await getCalendarAvailability({
      bookingType: isFullHome ? 'full_home' : 'room',
      roomIdentifier,
      fromDate: from,
      toDate: to
    });
    res.status(200).json({
      success: true,
      message: 'Calendar availability computed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get valid check-out dates starting from checkIn (stops at first night rooms are not free)
// @route   GET /api/availability/checkout-options?rooms=...&bookingType=full_home&checkIn=...
export const getCheckoutOptionsApi = async (req, res, next) => {
  try {
    const { rooms, room, checkIn, bookingType } = req.query;
    if (!checkIn) {
      return res.status(400).json({
        success: false,
        message: 'checkIn query parameter is required (YYYY-MM-DD)',
        data: null
      });
    }

    const isFullHome = bookingType === 'full_home';
    const result = await getValidCheckoutOptions({
      bookingType: isFullHome ? 'full_home' : 'room',
      roomIdentifier: rooms || room,
      checkInDate: checkIn
    });

    res.status(200).json({
      success: true,
      message: 'Valid check-out options retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get verified server price quote (prices, tax, nights, advance options, balance)
// @route   POST /api/bookings/quote
export const getBookingQuote = async (req, res, next) => {
  try {
    const {
      bookingType = 'room',
      rooms: requestRooms,
      roomId,
      roomSlug,
      quantity,
      checkIn,
      checkOut,
      promoCode,
      advanceOption,
      packageSlug,
      package: packageParam
    } = req.body;
    const requestedPackageSlug = packageSlug || packageParam || '';

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Both checkIn and checkOut dates are required',
        data: null
      });
    }

    // 1. FULL HOME QUOTE
    if (bookingType === 'full_home') {
      const allRooms = await Room.find({ isActive: true });
      const totalUnits = allRooms.reduce((sum, r) => sum + (Number(r.totalUnits) || 1), 0);
      if (quantity !== undefined && Number(quantity) !== totalUnits) {
        return res.status(400).json({
          success: false,
          message: `For Full Home booking, quantity must equal all ${totalUnits} units of the homestay.`,
          data: null
        });
      }

      const quote = await calculateServerQuote({
        bookingType: 'full_home',
        checkIn,
        checkOut,
        promoCode,
        advanceOption,
        packageSlug: requestedPackageSlug
      });

      return res.status(200).json({
        success: true,
        message: 'Full Home quote calculated successfully from server data',
        data: quote
      });
    }

    // 2. SINGLE ROOM QUOTE
    // Strict validation: each booking is for exactly one room, quantity must be 1
    if (quantity !== undefined && Number(quantity) !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Each booking is for exactly one room. Quantity must be 1.',
        data: null
      });
    }

    if (Array.isArray(requestRooms) && (requestRooms.length > 1 || requestRooms.some((r) => Number(r.quantity) > 1))) {
      return res.status(400).json({
        success: false,
        message: 'Each booking is for exactly one room. Multiple rooms or quantities greater than 1 are not permitted.',
        data: null
      });
    }

    const targetId = roomId || (requestRooms && (requestRooms[0]?.roomId || requestRooms[0]?.room));
    const targetSlug = roomSlug || (requestRooms && (requestRooms[0]?.roomSlug || requestRooms[0]?.slug));

    let rDoc = null;
    if (targetId && String(targetId).match(/^[0-9a-fA-F]{24}$/)) {
      rDoc = await Room.findById(targetId);
    } else if (targetId) {
      rDoc = await Room.findOne({ slug: targetId });
    }
    if (!rDoc && targetSlug) {
      rDoc = await Room.findOne({ slug: targetSlug });
    }
    if (!rDoc) {
      return res.status(404).json({
        success: false,
        message: `Room not found (${targetId || targetSlug || 'none selected'})`,
        data: null
      });
    }

    const quote = await calculateServerQuote({
      bookingType: 'room',
      roomDoc: rDoc,
      checkIn,
      checkOut,
      promoCode,
      advanceOption,
      packageSlug: requestedPackageSlug
    });

    res.status(200).json({
      success: true,
      message: 'Quote calculated successfully from server data',
      data: quote
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        data: null
      });
    }
    next(error);
  }
};


// @desc    Create a new booking with atomic transaction and collision prevention
// @route   POST /api/bookings
export const createBooking = async (req, res, next) => {
  try {
    await expireStaleHolds();

    const {
      bookingType = 'room',
      roomId,
      roomSlug,
      rooms: requestRooms,
      quantity,
      guestName,
      phone,
      email,
      checkIn,
      checkOut,
      adults = 2,
      children = 0,
      specialRequests = 'None',
      promoCode,
      advanceOption = 20,
      paymentMethod = 'UPI',
      transactionId = '',
      packageSlug,
      package: packageParam
    } = req.body;
    const requestedPackageSlug = packageSlug || packageParam || '';

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

    let targetBookingType = bookingType === 'full_home' ? 'full_home' : 'room';
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

      if (quantity !== undefined && Number(quantity) !== fullUnits) {
        return res.status(400).json({
          success: false,
          message: `For Full Home booking, quantity must equal all ${fullUnits} units of the homestay.`,
          data: null
        });
      }

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
        packageSlug: requestedPackageSlug
      });
    } else {
      // Single room validation
      if (quantity !== undefined && Number(quantity) !== 1) {
        return res.status(400).json({
          success: false,
          message: 'Each booking is for exactly one room. Quantity must be 1.',
          data: null
        });
      }

      if (Array.isArray(requestRooms) && (requestRooms.length > 1 || requestRooms.some((r) => Number(r.quantity) > 1))) {
        return res.status(400).json({
          success: false,
          message: 'Each booking is for exactly one room. Multiple rooms or quantities greater than 1 are not permitted.',
          data: null
        });
      }

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
        return res.status(404).json({
          success: false,
          message: `Room not found (${targetId || targetSlug || 'none selected'})`,
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
        packageSlug: requestedPackageSlug
      });
    }

    const holdMinutes = Number(siteSettings.holdMinutes) || 15;
    const autoConfirm = siteSettings.autoConfirmAfterPayment !== false;

    // Check if immediate payment proof was provided
    let finalStatus = 'payment_pending';
    let holdExpiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);
    let initialPaymentStatus = 'pending';

    const hasImmediatePayment = Boolean(transactionId && transactionId.trim());
    if (hasImmediatePayment) {
      finalStatus = autoConfirm ? 'confirmed' : 'paid_awaiting_confirmation';
      holdExpiresAt = null; // No auto-expiry once payment has been submitted
      initialPaymentStatus = quote.balanceDue === 0 ? 'paid' : 'partial';
    }

    // Generate unique booking code
    let bookingCode = generateBookingCode();
    let codeExists = await Booking.findOne({ bookingCode });
    while (codeExists) {
      bookingCode = generateBookingCode();
      codeExists = await Booking.findOne({ bookingCode });
    }

    // EXECUTE ATOMIC BOOKING INSIDE MONGO TRANSACTION
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

      // 2. Create booking record
      const bookingData = {
        bookingCode,
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
        paymentStatus: initialPaymentStatus,
        paymentMethod,
        transactionId: transactionId || `TXN-${Date.now().toString().slice(-8)}`,
        status: finalStatus,
        holdExpiresAt,
        statusHistory: [
          {
            who: 'guest',
            when: new Date(),
            reason: finalStatus === 'payment_pending'
              ? `Hold placed for ${holdMinutes} minutes pending payment`
              : 'Payment submitted with booking',
            status: finalStatus
          }
        ],
        promoCode: quote.promo ? quote.promo.code : '',
        source: 'website'
      };

      const [newBooking] = await Booking.create([bookingData], session ? { session } : {});

      if (quote.promo) {
        await Promo.findByIdAndUpdate(
          quote.promo._id,
          { $inc: { usedCount: 1 } },
          session ? { session } : {}
        );
      }

      createdBooking = newBooking;
    });

    // Send emails in background
    sendBookingEmails(createdBooking, rDoc).catch((err) => {
      console.warn('Booking email error:', err.message);
    });

    res.status(201).json({
      success: true,
      message: finalStatus === 'payment_pending'
        ? `Hold confirmed for ${holdMinutes} minutes. Please complete payment before the hold expires.`
        : 'Booking submitted successfully. Awaiting confirmation.',
      data: {
        bookingCode: createdBooking.bookingCode,
        holdExpiresAt: createdBooking.holdExpiresAt,
        status: createdBooking.status,
        booking: createdBooking
      }
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        data: {
          nearest: error.nearest || null,
          night: error.night || null,
          room: error.room || null
        }
      });
    }
    next(error);
  }
};


// @desc    Guest confirms payment after creating hold (updates status to paid_awaiting_confirmation or confirmed)
// @route   PUT /api/bookings/:identifier/confirm-payment
export const confirmGuestPayment = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const { transactionId, paymentMethod = 'UPI' } = req.body;

    const booking = await Booking.findOne({
      $or: [
        { bookingCode: identifier },
        ...(mongoose.Types.ObjectId.isValid(identifier) ? [{ _id: identifier }] : [])
      ]
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found', data: null });
    }

    if (booking.status === 'expired' || booking.status === 'cancelled' || booking.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: `This booking is ${booking.status} and rooms have already been released. Please make a new booking.`,
        data: null
      });
    }

    const settings = await SiteSettings.findOne() || {};
    const autoConfirm = settings.autoConfirmAfterPayment !== false;
    const newStatus = autoConfirm ? 'confirmed' : 'paid_awaiting_confirmation';

    booking.status = newStatus;
    booking.holdExpiresAt = null; // Paid bookings awaiting confirmation hold rooms until admin acts
    booking.paymentStatus = booking.balanceDue === 0 ? 'paid' : 'partial';
    if (transactionId) booking.transactionId = transactionId;
    if (paymentMethod) booking.paymentMethod = paymentMethod;

    booking.statusHistory = booking.statusHistory || [];
    booking.statusHistory.push({
      who: 'guest',
      when: new Date(),
      reason: `Guest submitted payment proof (${transactionId || 'UPI'})`,
      status: newStatus
    });

    await booking.save();

    res.status(200).json({
      success: true,
      message: autoConfirm
        ? 'Payment verified. Booking is confirmed!'
        : 'Payment received. Awaiting admin verification.',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Lookup booking by bookingCode and phone
// @route   GET /api/bookings/lookup?code=&phone=
export const lookupBooking = async (req, res, next) => {
  try {
    const { code, phone } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a booking code',
        data: null
      });
    }

    const query = {
      bookingCode: { $regex: new RegExp(`^${code.trim()}$`, 'i') }
    };

    if (phone) {
      query.phone = { $regex: new RegExp(phone.trim().replace(/[+-\s]/g, ''), 'i') };
    }

    const booking = await Booking.findOne(query).populate('room');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'No booking found matching the provided details',
        data: null
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking details found',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Validate a promo code
// @route   POST /api/promos/validate
export const validatePromo = async (req, res, next) => {
  try {
    const { code, nights = 1, amount = 0 } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a promo code',
        data: null
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const promo = await Promo.findOne({ code: cleanCode, isActive: true });

    if (!promo) {
      return res.status(400).json({
        success: false,
        message: 'Invalid promo code. Try MISTDIRECT for 15% off.',
        data: null
      });
    }

    const now = new Date();
    if (promo.validFrom && now < promo.validFrom) {
      return res.status(400).json({
        success: false,
        message: 'This promo code is not yet active',
        data: null
      });
    }

    if (promo.validTo && now > promo.validTo) {
      return res.status(400).json({
        success: false,
        message: 'This promo code has expired',
        data: null
      });
    }

    if (promo.minNights && nights < promo.minNights) {
      return res.status(400).json({
        success: false,
        message: `This promo requires a minimum stay of ${promo.minNights} nights`,
        data: null
      });
    }

    if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'This promo code has reached its usage limit',
        data: null
      });
    }

    let discountAmount = 0;
    if (promo.type === 'percent') {
      discountAmount = Math.round((Number(amount) * promo.value) / 100);
    } else {
      discountAmount = Math.min(Number(amount), promo.value);
    }

    res.status(200).json({
      success: true,
      message: `Promo code '${promo.code}' applied successfully!`,
      data: {
        code: promo.code,
        type: promo.type,
        value: promo.value,
        discountPercent: promo.type === 'percent' ? promo.value : 0,
        discountAmount,
        description: promo.description
      }
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get all packages
// @route   GET /api/packages
export const getPackages = async (req, res, next) => {
  try {
    const packages = await Package.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    res.status(200).json({
      success: true,
      message: 'Packages retrieved successfully',
      data: packages
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get all experiences
// @route   GET /api/experiences
export const getExperiences = async (req, res, next) => {
  try {
    const experiences = await Experience.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    res.status(200).json({
      success: true,
      message: 'Experiences retrieved successfully',
      data: experiences
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get complete dining menu (categories with items)
// @route   GET /api/menu
export const getMenu = async (req, res, next) => {
  try {
    const categories = await MenuCategory.find({ isActive: true }).sort({ displayOrder: 1 });
    const items = await MenuItem.find({ isActive: true }).sort({ displayOrder: 1 });

    const menuWithItems = categories.map((cat) => {
      const catItems = items.filter(
        (i) => i.category === cat.slug || i.category === cat.name || String(i.categoryRef) === String(cat._id)
      );
      return {
        ...cat.toObject(),
        items: catItems
      };
    });

    res.status(200).json({
      success: true,
      message: 'Menu retrieved successfully',
      data: menuWithItems
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get gallery images (visible only)
// @route   GET /api/gallery
export const getGallery = async (req, res, next) => {
  try {
    const images = await GalleryImage.find({ isVisible: true }).sort({ displayOrder: 1, createdAt: 1 });
    res.status(200).json({
      success: true,
      message: 'Gallery retrieved successfully',
      data: images
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get approved guest reviews
// @route   GET /api/reviews
export const getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ status: 'approved' }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: 'Reviews retrieved successfully',
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Submit guest review (publishes immediately to guestbook; host can hide/approve/delete in Admin)
// @route   POST /api/reviews
export const createReview = async (req, res, next) => {
  try {
    const { guestName, city, location, rating = 5, review, text, stayedIn, stayDate } = req.body;

    const reviewContent = text || review;
    const reviewLocation = location || city || 'Karnataka, India';

    if (!guestName || !reviewContent) {
      return res.status(400).json({
        success: false,
        message: 'Please provide guestName and review text',
        data: null
      });
    }

    const formattedStayDate =
      (typeof stayDate === 'string' && stayDate.trim()) ||
      new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

    const newReview = await Review.create({
      guestName: guestName.trim(),
      location: reviewLocation.trim(),
      rating: Math.min(5, Math.max(1, parseInt(rating, 10) || 5)),
      text: reviewContent.trim(),
      stayDate: formattedStayDate,
      stayedIn: (typeof stayedIn === 'string' && stayedIn.trim()) ? stayedIn.trim() : 'Standard Room',
      status: 'approved'
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! Your review has been saved and published.',
      data: newReview
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Submit contact enquiry
// @route   POST /api/enquiries
export const createEnquiry = async (req, res, next) => {
  try {
    const { name, phone, email, message } = req.body;

    if (!name || !phone || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all contact fields (name, phone, email, message)',
        data: null
      });
    }

    const enquiry = await Enquiry.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email.toLowerCase().trim(),
      message: message.trim(),
      status: 'new'
    });

    // Send notifications in background
    sendEnquiryEmails(enquiry).catch((err) => {
      console.warn('Enquiry email error:', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your enquiry has been received. Our team will contact you shortly.',
      data: enquiry
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Subscribe to newsletter
// @route   POST /api/newsletter
export const subscribeNewsletter = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
        data: null
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await Newsletter.findOne({ email: cleanEmail });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'You are already subscribed to our newsletter!',
        data: existing
      });
    }

    const subscriber = await Newsletter.create({ email: cleanEmail });

    res.status(201).json({
      success: true,
      message: 'Thank you for subscribing to Marichin Homestay updates!',
      data: subscriber
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get dining content
// @route   GET /api/dining/content
export const getDiningContent = async (req, res, next) => {
  try {
    let content = await DiningContent.findOne();
    if (!content) {
      content = await DiningContent.create({});
    }

    res.status(200).json({
      success: true,
      message: 'Dining content retrieved',
      data: content
    });
  } catch (error) {
    next(error);
  }
};


const DEFAULT_HOST_PHONE = '+91 95912 09522';
const DEFAULT_INSTAGRAM_URL = 'https://www.instagram.com/coorg_marichin_homestay?utm_source=qr&cplk=bWd6MjhrcHducjVt';
const DEFAULT_FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61596613283636';
const DEFAULT_YOUTUBE_URL = 'https://www.youtube.com/channel/UCaf39e4l1iRDA-CMj72q1gQ';

const resolveServerHostPhone = (val) => {
  if (!val || typeof val !== 'string') return '';
  const clean = val.trim().toLowerCase();
  if (!clean || clean.includes('x') || clean.includes('00000')) return '';
  const digits = clean.replace(/\D/g, '');
  if (digits.length < 8 || /^0+$/.test(digits) || /^(\d)\1+$/.test(digits) || digits === '9876543210' || digits === '9480180455' || digits === '919480180455') {
    return '';
  }
  return val.trim();
};

const resolveServerInstagramUrl = (val) => {
  if (!val || typeof val !== 'string') return DEFAULT_INSTAGRAM_URL;
  const normalized = val.trim().toLowerCase().replace(/\/+$/, '');
  if (
    !normalized ||
    normalized === 'https://instagram.com' ||
    normalized === 'http://instagram.com' ||
    normalized === 'https://www.instagram.com' ||
    normalized === 'http://www.instagram.com' ||
    normalized.includes('instagram.com/marichinhomestay')
  ) {
    return DEFAULT_INSTAGRAM_URL;
  }
  return val.trim();
};

const resolveServerFacebookUrl = (val) => {
  if (!val || typeof val !== 'string') return DEFAULT_FACEBOOK_URL;
  const normalized = val.trim().toLowerCase().replace(/\/+$/, '');
  if (
    !normalized ||
    normalized === 'https://facebook.com' ||
    normalized === 'http://facebook.com' ||
    normalized === 'https://www.facebook.com' ||
    normalized === 'http://www.facebook.com' ||
    normalized.includes('facebook.com/marichinhomestay')
  ) {
    return DEFAULT_FACEBOOK_URL;
  }
  return val.trim();
};

const resolveServerYoutubeUrl = (val) => {
  if (!val || typeof val !== 'string') return DEFAULT_YOUTUBE_URL;
  const normalized = val.trim().toLowerCase().replace(/\/+$/, '');
  if (
    !normalized ||
    normalized === 'https://youtube.com' ||
    normalized === 'http://youtube.com' ||
    normalized === 'https://www.youtube.com' ||
    normalized === 'http://www.youtube.com' ||
    normalized.includes('youtube.com/@marichinhomestay') ||
    normalized.includes('youtube.com/marichinhomestay')
  ) {
    return DEFAULT_YOUTUBE_URL;
  }
  return val.trim();
};

// @desc    Get site settings
// @route   GET /api/settings
export const getSettings = async (req, res, next) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }

    const allRooms = await Room.find({ isActive: true });
    const fullHomeLimits = calculateFullHomeLimits(allRooms);
    const { pricePerNight: canonicalFullHomePrice } = await resolveFullHomeRate(settings);

    const responseData = settings.toJSON ? settings.toJSON({ virtuals: true }) : settings;
    const resolvedPhone = resolveServerHostPhone(settings.phones?.[0]);
    const resolvedWhatsapp = resolveServerHostPhone(settings.whatsappNumber);
    const resolvedTiers = normalizeCancellationTiers(settings.cancellationTiers);
    responseData.name = settings.propertyName;
    responseData.email = resolveSharedHostEmail(settings.email);
    responseData.phone = resolvedPhone;
    responseData.phones = resolvedPhone
      ? [resolvedPhone, ...(settings.phones?.slice(1) || [])]
      : (settings.phones?.slice(1) || []).map(resolveServerHostPhone).filter(Boolean);
    responseData.whatsappNumber = resolvedWhatsapp;
    responseData.whatsapp = resolvedWhatsapp;
    responseData.instagramUrl = resolveServerInstagramUrl(settings.instagramUrl);
    responseData.facebookUrl = resolveServerFacebookUrl(settings.facebookUrl);
    responseData.youtubeUrl = resolveServerYoutubeUrl(settings.youtubeUrl);
    responseData.fullHomePricePerNight = canonicalFullHomePrice;
    responseData.fullHome = {
      enabled: settings.fullHomeEnabled !== false,
      pricePerNight: canonicalFullHomePrice,
      minNights: Number(settings.fullHomeMinNights) || 1,
      mealsNote: settings.fullHomeMealsNote || 'Morning breakfast included',
      limits: fullHomeLimits
    };
    responseData.cancellationTiers = resolvedTiers;
    responseData.noShowRefundPercent = settings.noShowRefundPercent ?? 0;
    responseData.refundTimelineText = settings.refundTimelineText || '5 to 7 working days';
    responseData.hostCancelsRefundPercent = settings.hostCancelsRefundPercent ?? 100;
    responseData.dateChangeRule = settings.dateChangeRule || {};
    responseData.earlyDepartureRule = settings.earlyDepartureRule || {};
    responseData.gatewayFeeNote = settings.gatewayFeeNote || {};
    responseData.policiesLastUpdated = settings.policiesLastUpdated || settings.updatedAt || null;
    responseData.safetyFeatures = {
      ...DEFAULT_SAFETY_FEATURES,
      ...(settings.safetyFeatures && typeof settings.safetyFeatures.toObject === 'function'
        ? settings.safetyFeatures.toObject()
        : settings.safetyFeatures || {})
    };
    responseData.cancellationSummary = {
      en: formatCancellationSummaryText({ ...responseData, cancellationTiers: resolvedTiers }, 'en'),
      kn: formatCancellationSummaryText({ ...responseData, cancellationTiers: resolvedTiers }, 'kn')
    };
    Object.assign(responseData, normalizeHeroBannerSettings(responseData));

    res.status(200).json({
      success: true,
      message: 'Site settings retrieved',
      data: responseData
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get all active inclusion & exclusion items
// @route   GET /api/inclusions
export const getInclusions = async (req, res, next) => {
  try {
    const items = await InclusionItem.find({ isActive: true }).sort({ type: 1, displayOrder: 1, createdAt: 1 });
    res.status(200).json({
      success: true,
      message: 'Inclusions retrieved successfully',
      data: items
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public sanitized booking pass details
// @route   GET /api/pass/:token
export const getBookingPass = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token || typeof token !== 'string') {
      return res.status(404).json({ success: false, message: 'Pass not found' });
    }



    const booking = await Booking.findOne({ passToken: token.trim() });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Pass not found' });
    }

    const siteSettings = (await SiteSettings.findOne()) || {};
    const nightsCount = Array.isArray(booking.nights) ? booking.nights.length : 1;
    const resolvedPassPhone = resolveServerHostPhone(siteSettings.whatsappNumber || (siteSettings.phones && siteSettings.phones[0]));
    const resolvedPassEmail = resolveSharedHostEmail(siteSettings.email);
    const resolvedPassTiers = normalizeCancellationTiers(siteSettings.cancellationTiers);

    const pass = {
      bookingCode: booking.bookingCode,
      status: booking.status,
      bookingType: booking.bookingType || 'room',
      roomName:
        booking.bookingType === 'full_home'
          ? 'Full Home (All 5 Rooms)'
          : booking.roomName || 'Standard Room',
      roomSlug: booking.roomSlug || '',
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      nightsCount,
      guestCount: booking.guestCount || {
        adults: booking.adults || 2,
        children: booking.children || 0
      },
      adults: booking.adults || 2,
      children: booking.children || 0,
      guestName: booking.guestName,
      guestPhone: booking.phone,
      guestEmail: booking.email,
      totalAmount: booking.pricing?.total || booking.totalAmount || 0,
      advancePaid:
        booking.advancePaid ||
        (booking.amountPaidPaise ? Math.round(booking.amountPaidPaise / 100) : 0),
      balanceDue:
        booking.balanceDue !== undefined
          ? booking.balanceDue
          : Math.max(0, (booking.pricing?.total || 0) - (booking.advancePaid || 0)),
      advanceOption: booking.advanceOption || 20,
      pricing: {
        baseAmount: booking.pricing?.baseAmount || 0,
        discount: booking.pricing?.discount || 0,
        taxAmount: booking.pricing?.taxAmount || 0,
        total: booking.pricing?.total || 0
      },
      paymentId: booking.razorpayPaymentId || booking.transactionId || null,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.razorpayPaymentMethod || booking.paymentMethod || 'Razorpay',
      holdExpiresAt: booking.holdExpiresAt,
      cancellationReason: booking.cancellationReason || '',
      refunds: booking.refunds || [],
      createdAt: booking.createdAt,
      passToken: booking.passToken,
      property: {
        propertyName: siteSettings.propertyName || 'Marichin Homestay',
        address:
          siteSettings.address ||
          'Chikkabettageri Village, Gudde Hosur Post, Kushalnagar, Kodagu District, Karnataka 571234',
        phones: resolvedPassPhone ? [resolvedPassPhone] : [],
        phone: resolvedPassPhone,
        email: resolvedPassEmail,
        whatsappNumber: resolvedPassPhone,
        checkInTime: siteSettings.checkInTime || '12:00 PM',
        checkOutTime: siteSettings.checkOutTime || '11:00 AM',
        fullHomeMealsNote: siteSettings.fullHomeMealsNote || 'Morning breakfast included',
        registrationNumber: siteSettings.registrationNumber || '',
        cancellationTiers: resolvedPassTiers,
        refundTimelineText: siteSettings.refundTimelineText || '5 to 7 working days',
        cancellationSummary: {
          en: formatCancellationSummaryText({ ...siteSettings, cancellationTiers: resolvedPassTiers }, 'en'),
          kn: formatCancellationSummaryText({ ...siteSettings, cancellationTiers: resolvedPassTiers }, 'kn')
        },
        googleMapsUrl:
          siteSettings.googleMapsShareUrl ||
          'https://www.google.com/maps/dir/?api=1&destination=12.425583,75.911889',
        directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=12.425583,75.911889',
        coordinates: {
          lat: 12.425583,
          lng: 75.911889,
          dms: "12°25'32.1\"N 75°54'42.8\"E"
        }
      }
    };

    return res.status(200).json({
      success: true,
      data: pass,
      pass
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get visible policy sections & unified refund settings (with draft fallback)
// @route   GET /api/policies
export const getPublicPolicies = async (req, res, next) => {
  try {
    const totalCount = await PolicySection.countDocuments();
    let sections = [];

    if (totalCount === 0) {
      sections = DEFAULT_POLICY_SECTIONS.filter((s) => s.isVisible !== false);
    } else {
      sections = await PolicySection.find({ isVisible: true }).sort({
        page: 1,
        displayOrder: 1,
        createdAt: 1
      });
    }

    const settings = (await SiteSettings.findOne()) || {};
    const resolvedTiers = normalizeCancellationTiers(settings.cancellationTiers);

    const byPage = {
      policies: sections.filter((s) => s.page === 'policies'),
      refund: sections.filter((s) => s.page === 'refund'),
      privacy: sections.filter((s) => s.page === 'privacy')
    };

    res.status(200).json({
      success: true,
      message: 'Policies retrieved successfully',
      data: {
        sections,
        byPage,
        lastUpdated: settings.policiesLastUpdated || settings.updatedAt || null,
        refundRules: {
          cancellationTiers: resolvedTiers,
          noShowRefundPercent: settings.noShowRefundPercent ?? 0,
          refundTimelineText: settings.refundTimelineText || '5 to 7 working days',
          hostCancelsRefundPercent: settings.hostCancelsRefundPercent ?? 100,
          dateChangeRule: settings.dateChangeRule || {},
          earlyDepartureRule: settings.earlyDepartureRule || {},
          gatewayFeeNote: settings.gatewayFeeNote || {},
          summary: {
            en: formatCancellationSummaryText({ ...settings, cancellationTiers: resolvedTiers }, 'en'),
            kn: formatCancellationSummaryText({ ...settings, cancellationTiers: resolvedTiers }, 'kn')
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get visible safety contacts, enabled safety feature flags & national emergency numbers
// @route   GET /api/safety
export const getPublicSafety = async (req, res, next) => {
  try {
    const contacts = await SafetyContact.find({ isVisible: true }).sort({
      displayOrder: 1,
      createdAt: 1
    });

    const settings = (await SiteSettings.findOne()) || {};
    const safetyFeatures = {
      ...DEFAULT_SAFETY_FEATURES,
      ...(settings.safetyFeatures && typeof settings.safetyFeatures.toObject === 'function'
        ? settings.safetyFeatures.toObject()
        : settings.safetyFeatures || {})
    };

    res.status(200).json({
      success: true,
      message: 'Safety details retrieved successfully',
      data: {
        contacts,
        features: safetyFeatures,
        emergencyNumbers: [
          {
            number: '112',
            title: { en: 'National Emergency Helpline', kn: 'ರಾಷ್ಟ್ರೀಯ ತುರ್ತು ಸಹಾಯವಾಣಿ' },
            description: {
              en: 'Single India-wide emergency response number for police, fire, and urgent assistance.',
              kn: 'ಪೊಲೀಸ್, ಅಗ್ನಿಶಾಮಕ ಮತ್ತು ತುರ್ತು ಸಹಾಯಕ್ಕಾಗಿ ರಾಷ್ಟ್ರೀಯ ಏಕೀಕೃತ ತುರ್ತು ಸಂಖ್ಯೆ.'
            }
          },
          {
            number: '108',
            title: { en: 'Ambulance / Medical Emergency', kn: 'ಆಂಬ್ಯುಲೆನ್ಸ್ / ವೈದ್ಯಕೀಯ ತುರ್ತು' },
            description: {
              en: 'Free 24-hour emergency ambulance dispatch across Karnataka.',
              kn: 'ಕರ್ನಾಟಕದಾದ್ಯಂತ ತುರ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್ ಸೇವೆಗಾಗಿ.'
            }
          }
        ],
        lastUpdated: settings.policiesLastUpdated || settings.updatedAt || null
      }
    });
  } catch (error) {
    next(error);
  }
};
