import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
import { User } from '../models/User.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { InclusionItem } from '../models/InclusionItem.js';
import { PolicySection } from '../models/PolicySection.js';
import { SafetyContact } from '../models/SafetyContact.js';
import { DEFAULT_POLICY_SECTIONS } from '../seed/policyDefaults.js';
import {
  DEFAULT_SAFETY_FEATURES,
  normalizeCancellationTiers,
  calculateTierRefund,
  formatCancellationSummaryText
} from '../utils/refundPolicy.js';
import {
  DEFAULT_HERO_BANNER,
  validateHeroVideoUrl,
  validateHeroPosterUrl,
  validateBilingualHeroField,
  validateHeroOverlay,
  normalizeHeroBannerSettings,
  deleteUploadedFileIfSafe
} from '../utils/heroBanner.js';
import { logActivity } from '../middleware/activityLogger.js';
import {
  toDateStr,
  getTodayISTStr,
  addDays,
  isNightBlocked,
  getActiveBookingOccupancyMap,
  getEffectiveBookedCount,
  generateNightsArray,
  withTransaction,
  bookInventoryAtomic,
  releaseInventoryAtomic,
  expireStaleHolds,
  validateStayRules,
  calculateServerQuote,
  getCalendarAvailability
} from '../utils/inventoryEngine.js';
import { createRazorpayRefund } from '../utils/razorpay.js';
import {
  sendBookingRejectedWithRefundEmail,
  sendBookingCancelledRefundEmail,
  sendBookingConfirmedEmail
} from '../utils/email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

// ==========================================
// 1. DASHBOARD STATS
// ==========================================
const SHORT_MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const toISTDateStr = (val) => {
  if (!val) return '';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
    return val.trim();
  }
  const dt = new Date(val);
  if (Number.isNaN(dt.getTime())) return '';
  return new Date(dt.getTime() + 19800000).toISOString().split('T')[0];
};

const formatShortDayLabel = (dateStr) => {
  const [, m, d] = String(dateStr || '').split('-').map(Number);
  if (!m || !d) return dateStr;
  return `${d} ${SHORT_MONTHS_EN[m - 1] || ''}`;
};

const getBookingNightsLen = (b) => {
  if (Array.isArray(b.nights) && b.nights.length > 0) return b.nights.length;
  if (b.checkIn && b.checkOut) {
    const diff = Math.round((new Date(b.checkOut) - new Date(b.checkIn)) / 86400000);
    if (diff > 0) return diff;
  }
  return 1;
};

const getBookingPaidAmount = (b) => {
  const pStatus = String(b.paymentStatus || '').toLowerCase();
  if (pStatus === 'refunded' || pStatus === 'failed') return 0;
  const adv = Number(b.advancePaid);
  if (Number.isFinite(adv) && adv > 0) return adv;
  const paise = Number(b.amountPaidPaise);
  if (Number.isFinite(paise) && paise > 0) return Math.round(paise / 100);
  return 0;
};

export const getDashboardStats = async (req, res, next) => {
  try {
    await expireStaleHolds().catch(() => {});

    const todayStr = getTodayISTStr();
    const [todayY, todayM] = todayStr.split('-').map(Number);
    const pad2 = (n) => String(n).padStart(2, '0');

    const rawRange = String(req.query.range || '6m').toLowerCase();
    const chartRange = ['6m', '12m', 'year'].includes(rawRange) ? rawRange : '6m';

    // Current & previous month keys + calendar bounds
    const curMonthKey = `${todayY}-${pad2(todayM)}`;
    const daysInCurMonth = new Date(Date.UTC(todayY, todayM, 0)).getUTCDate();
    const curMonthStartStr = `${curMonthKey}-01`;
    const curMonthEndStr = `${curMonthKey}-${pad2(daysInCurMonth)}`;

    const prevMonthDt = new Date(Date.UTC(todayY, todayM - 2, 1));
    const prevY = prevMonthDt.getUTCFullYear();
    const prevM = prevMonthDt.getUTCMonth() + 1;
    const prevMonthKey = `${prevY}-${pad2(prevM)}`;
    const daysInPrevMonth = new Date(Date.UTC(prevY, prevM, 0)).getUTCDate();
    const prevMonthStartStr = `${prevMonthKey}-01`;
    const prevMonthEndStr = `${prevMonthKey}-${pad2(daysInPrevMonth)}`;

    const weekEndStr = addDays(todayStr, 6);
    const next30EndStr = addDays(todayStr, 29);

    // Build month buckets for requested chart range
    const chartDataset = [];
    const bucketMap = new Map();
    if (chartRange === 'year') {
      for (let mIdx = 0; mIdx < 12; mIdx++) {
        const key = `${todayY}-${pad2(mIdx + 1)}`;
        const bucket = {
          key,
          month: SHORT_MONTHS_EN[mIdx],
          monthIndex: mIdx,
          year: todayY,
          bookings: 0,
          revenue: 0,
          nights: 0
        };
        chartDataset.push(bucket);
        bucketMap.set(key, bucket);
      }
    } else {
      const span = chartRange === '12m' ? 12 : 6;
      for (let i = span - 1; i >= 0; i--) {
        const dt = new Date(Date.UTC(todayY, todayM - 1 - i, 1));
        const y = dt.getUTCFullYear();
        const mIdx = dt.getUTCMonth();
        const key = `${y}-${pad2(mIdx + 1)}`;
        const bucket = {
          key,
          month: SHORT_MONTHS_EN[mIdx],
          monthIndex: mIdx,
          year: y,
          bookings: 0,
          revenue: 0,
          nights: 0
        };
        chartDataset.push(bucket);
        bucketMap.set(key, bucket);
      }
    }

    const [
      activeRooms,
      allBookings,
      blockedDates,
      pendingEnquiries,
      pendingReviews
    ] = await Promise.all([
      Room.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 }),
      Booking.find().populate('room', 'name slug category').sort({ checkIn: 1 }),
      BlockedDate.find(),
      Enquiry.countDocuments({ status: 'new' }),
      Review.countDocuments({ status: 'pending' })
    ]);

    const totalRoomUnits = activeRooms.reduce((sum, r) => sum + (Number(r.totalUnits) || 1), 0) || 5;
    const roomUnitsMap = new Map(activeRooms.map((r) => [String(r._id), Number(r.totalUnits) || 1]));
    const activeRoomIds = activeRooms.map((r) => r._id);

    const rnMinStr = prevMonthStartStr < curMonthStartStr ? prevMonthStartStr : curMonthStartStr;
    const rnMaxStr = next30EndStr > curMonthEndStr ? next30EndStr : curMonthEndStr;

    const [roomNights, todayOccMap] = await Promise.all([
      RoomNight.find({
        room: { $in: activeRoomIds },
        date: { $gte: rnMinStr, $lte: rnMaxStr }
      }),
      getActiveBookingOccupancyMap({
        targetNights: [todayStr],
        allRooms: activeRooms
      })
    ]);

    // Index RoomNight booked counts per date and room
    const rnByDate = new Map();
    const todayRNMap = new Map();
    let bookedRoomNightsThisMonth = 0;
    let bookedRoomNightsLastMonth = 0;

    for (const rn of roomNights) {
      const cap = roomUnitsMap.get(String(rn.room)) || 1;
      const clamped = Math.min(cap, Math.max(0, Number(rn.booked) || 0));
      rnByDate.set(rn.date, (rnByDate.get(rn.date) || 0) + clamped);

      if (rn.date === todayStr) {
        todayRNMap.set(String(rn.room), clamped);
      }
      if (rn.date >= curMonthStartStr && rn.date <= curMonthEndStr) {
        bookedRoomNightsThisMonth += clamped;
      }
      if (rn.date >= prevMonthStartStr && rn.date <= prevMonthEndStr) {
        bookedRoomNightsLastMonth += clamped;
      }
    }

    const totalRoomNightsThisMonth = Math.max(1, totalRoomUnits * daysInCurMonth);
    const totalRoomNightsLastMonth = Math.max(1, totalRoomUnits * daysInPrevMonth);

    const occupancyPercentage = Math.min(
      100,
      Math.round((bookedRoomNightsThisMonth / totalRoomNightsThisMonth) * 100)
    );
    const lastMonthOccupancyPercentage = Math.min(
      100,
      Math.round((bookedRoomNightsLastMonth / totalRoomNightsLastMonth) * 100)
    );

    // Rooms available tonight (out of totalRoomUnits)
    let bookedTonight = 0;
    let blockedTonight = 0;
    for (const r of activeRooms) {
      const units = Number(r.totalUnits) || 1;
      const isRoomBlocked =
        isNightBlocked(todayStr, r._id, blockedDates) ||
        isNightBlocked(todayStr, r.slug, blockedDates) ||
        isNightBlocked(todayStr, 'all', blockedDates);

      if (isRoomBlocked) {
        blockedTonight += units;
      } else {
        const effBooked = getEffectiveBookedCount({
          roomId: r._id,
          nightStr: todayStr,
          rnBooked: todayRNMap.get(String(r._id)) || 0,
          bookingOccupancyMap: todayOccMap
        });
        bookedTonight += Math.min(units, effBooked);
      }
    }
    const roomsAvailableToday = Math.max(0, totalRoomUnits - bookedTonight - blockedTonight);

    // Next 30 Days Occupancy strictly from RoomNight
    const next30DaysOccupancy = [];
    for (let offset = 0; offset < 30; offset++) {
      const dStr = addDays(todayStr, offset);
      const bookedCount = Math.min(totalRoomUnits, Math.max(0, rnByDate.get(dStr) || 0));
      const anyBlocked =
        isNightBlocked(dStr, 'all', blockedDates) ||
        activeRooms.some(
          (r) => isNightBlocked(dStr, r._id, blockedDates) || isNightBlocked(dStr, r.slug, blockedDates)
        );
      next30DaysOccupancy.push({
        date: dStr,
        label: formatShortDayLabel(dStr),
        booked: bookedCount,
        total: totalRoomUnits,
        occupancyPercent: Math.min(100, Math.round((bookedCount / totalRoomUnits) * 100)),
        isBlocked: anyBlocked
      });
    }

    // Aggregate bookings metrics
    const COUNTED_STATUSES = new Set(['confirmed', 'checked_in', 'checked_out']);
    const todayCheckIns = [];
    const todayCheckOuts = [];
    const upcomingBookingsAll = [];

    let revenueThisMonth = 0;
    let revenueLastMonth = 0;
    let refundsThisMonth = 0;
    let refundsCountThisMonth = 0;
    let bookingsThisMonthCount = 0;
    let bookingsLastMonthCount = 0;
    let guestsArrivingThisWeek = 0;
    let bookingsArrivingThisWeekCount = 0;
    let totalConfirmedBookings = 0;
    let pendingPaymentHolds = 0;
    let dateChangeFlagsCount = 0;
    let refundsDueCount = 0;
    let refundsDueAmount = 0;
    let failedPaymentsCount = 0;

    const roomTypeMap = new Map();

    for (const b of allBookings) {
      const status = String(b.status || '').toLowerCase();
      const payStatus = String(b.paymentStatus || '').toLowerCase();
      const inStr = toISTDateStr(b.checkIn);
      const outStr = toISTDateStr(b.checkOut);
      const inMonthKey = inStr.slice(0, 7);

      if (b.dateChangeRequested) dateChangeFlagsCount += 1;
      if (Number(b.refundDue) > 0) {
        refundsDueCount += 1;
        refundsDueAmount += Number(b.refundDue) || 0;
      }
      if (payStatus === 'failed') failedPaymentsCount += 1;
      if (status === 'payment_pending' || status === 'paid_awaiting_confirmation') {
        pendingPaymentHolds += 1;
      }
      if (status === 'confirmed' || status === 'checked_in') {
        totalConfirmedBookings += 1;
      }

      // Today's check-ins and check-outs
      if (inStr === todayStr && (status === 'confirmed' || status === 'checked_in')) {
        todayCheckIns.push(b);
      }
      if (outStr === todayStr && (status === 'confirmed' || status === 'checked_in')) {
        todayCheckOuts.push(b);
      }

      // Upcoming bookings (today onward, confirmed or paid_awaiting_confirmation)
      if (inStr >= todayStr && (status === 'confirmed' || status === 'paid_awaiting_confirmation')) {
        upcomingBookingsAll.push(b);
      }

      // Guests arriving this week (next 7 days including today)
      if (
        inStr >= todayStr &&
        inStr <= weekEndStr &&
        (status === 'confirmed' || status === 'paid_awaiting_confirmation' || status === 'checked_in')
      ) {
        const adults = Number(b.adults ?? b.guestCount?.adults) || 0;
        const children = Number(b.children ?? b.guestCount?.children) || 0;
        guestsArrivingThisWeek += adults + children;
        bookingsArrivingThisWeekCount += 1;
      }

      // Refunds issued this month (tracked separately from revenue)
      if (Array.isArray(b.refunds) && b.refunds.length > 0) {
        for (const rf of b.refunds) {
          const rfMonth = toISTDateStr(rf.createdAt || b.updatedAt || b.createdAt).slice(0, 7);
          if (rfMonth === curMonthKey) {
            const rfAmt = Number(rf.amount) || (rf.amountPaise ? Math.round(rf.amountPaise / 100) : 0);
            if (rfAmt > 0) {
              refundsThisMonth += rfAmt;
              refundsCountThisMonth += 1;
            }
          }
        }
      } else if (payStatus === 'refunded') {
        const rfMonth = toISTDateStr(b.updatedAt || b.createdAt).slice(0, 7);
        if (rfMonth === curMonthKey) {
          const fallbackAmt = Number(b.advancePaid) || (b.amountPaidPaise ? Math.round(b.amountPaidPaise / 100) : 0);
          refundsThisMonth += fallbackAmt;
          refundsCountThisMonth += 1;
        }
      }

      // Trend series, monthly revenue & room-type breakdown (only confirmed, checked_in, checked_out)
      if (COUNTED_STATUSES.has(status)) {
        const paidAmt = getBookingPaidAmount(b);
        const nightsCnt = getBookingNightsLen(b);

        if (bucketMap.has(inMonthKey)) {
          const bucket = bucketMap.get(inMonthKey);
          bucket.bookings += 1;
          bucket.revenue += paidAmt;
          bucket.nights += nightsCnt;
        }

        if (inMonthKey === curMonthKey) {
          revenueThisMonth += paidAmt;
          bookingsThisMonthCount += 1;
        } else if (inMonthKey === prevMonthKey) {
          revenueLastMonth += paidAmt;
          bookingsLastMonthCount += 1;
        }

        const isFullHome = b.bookingType === 'full_home' || b.roomSlug === 'full-home';
        const rtName = isFullHome ? 'Full Home' : (b.room?.name || b.roomName || 'Standard Room');
        const rtSlug = isFullHome ? 'full-home' : (b.room?.slug || b.roomSlug || rtName.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        const existingRt = roomTypeMap.get(rtName) || {
          roomType: rtName,
          slug: rtSlug,
          bookings: 0,
          nights: 0,
          revenue: 0
        };
        existingRt.bookings += 1;
        existingRt.nights += nightsCnt;
        existingRt.revenue += paidAmt;
        roomTypeMap.set(rtName, existingRt);
      }
    }

    const bookingsByRoomType = Array.from(roomTypeMap.values()).sort(
      (a, b) => b.bookings - a.bookings
    );

    res.status(200).json({
      success: true,
      message: 'Dashboard stats retrieved',
      data: {
        todayStr,
        todayCheckIns,
        todayCheckInsCount: todayCheckIns.length,
        todayCheckOuts,
        todayCheckOutsCount: todayCheckOuts.length,
        upcomingBookings: upcomingBookingsAll.slice(0, 10),
        upcomingBookingsCount: upcomingBookingsAll.length,
        guestsArrivingThisWeek,
        bookingsArrivingThisWeekCount,
        roomsAvailableToday,
        totalRoomUnits,
        bookedTonight,
        blockedTonight,
        revenueThisMonth,
        revenueLastMonth,
        refundsThisMonth,
        refundsCountThisMonth,
        bookingsThisMonthCount,
        bookingsLastMonthCount,
        occupancyPercentage,
        lastMonthOccupancyPercentage,
        bookedRoomNightsThisMonth,
        totalRoomNightsThisMonth,
        pendingEnquiries,
        pendingReviews,
        pendingPaymentHolds,
        dateChangeFlagsCount,
        refundsDueCount,
        refundsDueAmount,
        failedPaymentsCount,
        totalRooms: totalRoomUnits,
        totalConfirmedBookings,
        chartRange,
        chartGrouping: 'checkInMonth',
        chartDataset,
        next30DaysOccupancy,
        bookingsByRoomType
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. ROOMS CRUD
// ==========================================
export const getAllRoomsAdmin = async (req, res, next) => {
  try {
    const rooms = await Room.find().sort({ displayOrder: 1, createdAt: -1 });
    res.status(200).json({ success: true, message: 'All rooms retrieved', data: rooms });
  } catch (error) {
    next(error);
  }
};

export const createRoom = async (req, res, next) => {
  try {
    const slug = req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const pricePerNight = req.body.pricePerNight ?? req.body.price ?? 4500;
    const maxGuests = req.body.maxGuests ?? req.body.capacity ?? 2;
    const roomPayload = { ...req.body, slug, pricePerNight, maxGuests };

    if (roomPayload.image) {
      const imgUrl = typeof roomPayload.image === 'string' ? roomPayload.image : roomPayload.image?.url;
      if (imgUrl) {
        roomPayload.image = imgUrl;
        roomPayload.images = [{ url: imgUrl, alt: roomPayload.name || 'Room Photo' }];
        roomPayload.isRealPhoto = true;
      }
    } else if (Array.isArray(roomPayload.images) && roomPayload.images.length > 0) {
      roomPayload.images = roomPayload.images.map(img => typeof img === 'string' ? { url: img, alt: roomPayload.name || 'Room Photo' } : img);
      roomPayload.image = roomPayload.images[0].url;
      roomPayload.isRealPhoto = true;
    }

    const room = await Room.create(roomPayload);

    await logActivity({
      req,
      action: 'CREATE_ROOM',
      entityType: 'Room',
      entityId: room._id,
      details: { name: room.name, price: room.pricePerNight }
    });

    res.status(201).json({ success: true, message: 'Room created successfully', data: room });
  } catch (error) {
    next(error);
  }
};

export const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.price !== undefined && updateData.pricePerNight === undefined) {
      updateData.pricePerNight = updateData.price;
    }
    if (updateData.pricePerNight !== undefined) {
      const parsedRate = Number(updateData.pricePerNight);
      if (!isNaN(parsedRate) && parsedRate >= 0) {
        updateData.pricePerNight = parsedRate;
      }
    }
    if (updateData.weekendPrice !== undefined) {
      const parsedWknd = Number(updateData.weekendPrice);
      if (!isNaN(parsedWknd) && parsedWknd >= 0) {
        updateData.weekendPrice = parsedWknd;
      }
    }
    if (updateData.maxAdults !== undefined || updateData.maxChildren !== undefined) {
      const parsedAdults = Number(updateData.maxAdults);
      const parsedChildren = Number(updateData.maxChildren);
      if (Number.isFinite(parsedAdults) && parsedAdults >= 1 && Number.isFinite(parsedChildren) && parsedChildren >= 0 && updateData.maxGuests === undefined) {
        updateData.maxGuests = parsedAdults + parsedChildren;
      }
    }
    delete updateData.price;
    delete updateData._id;
    delete updateData.id;

    if (Array.isArray(updateData.images) && updateData.images.length > 0) {
      const normalizedArr = updateData.images
        .map((img) => (typeof img === 'string' ? { url: img, alt: updateData.name || 'Room Photo' } : img))
        .filter((img) => img && img.url);
      if (updateData.image) {
        const imgUrl = typeof updateData.image === 'string' ? updateData.image : updateData.image?.url;
        if (imgUrl && (!normalizedArr[0] || normalizedArr[0].url !== imgUrl)) {
          updateData.images = [{ url: imgUrl, alt: updateData.name || 'Room Photo' }, ...normalizedArr.filter((i) => i.url !== imgUrl)];
        } else {
          updateData.images = normalizedArr;
        }
        updateData.image = imgUrl || normalizedArr[0]?.url || '';
      } else {
        updateData.images = normalizedArr;
        updateData.image = normalizedArr[0]?.url || '';
      }
      if (updateData.image) updateData.isRealPhoto = true;
    } else if (updateData.image) {
      const imgUrl = typeof updateData.image === 'string' ? updateData.image : updateData.image?.url;
      if (imgUrl) {
        updateData.image = imgUrl;
        updateData.images = [{ url: imgUrl, alt: updateData.name || 'Room Photo' }];
        updateData.isRealPhoto = true;
      }
    }

    let room;
    if (mongoose.Types.ObjectId.isValid(id)) {
      room = await Room.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      });
    } else {
      room = await Room.findOneAndUpdate({ slug: id }, updateData, {
        new: true,
        runValidators: true
      });
    }

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found', data: null });
    }

    await logActivity({
      req,
      action: 'UPDATE_ROOM',
      entityType: 'Room',
      entityId: room._id,
      details: { name: room.name, price: room.pricePerNight }
    });

    res.status(200).json({ success: true, message: 'Room updated successfully', data: room });
  } catch (error) {
    next(error);
  }
};

export const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    let room;
    if (mongoose.Types.ObjectId.isValid(id)) {
      room = await Room.findByIdAndDelete(id);
    } else {
      room = await Room.findOneAndDelete({ slug: id });
    }

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found', data: null });
    }

    await logActivity({
      req,
      action: 'DELETE_ROOM',
      entityType: 'Room',
      entityId: room._id,
      details: { name: room.name }
    });

    res.status(200).json({ success: true, message: 'Room deleted successfully', data: null });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. BOOKINGS MANAGEMENT
// ==========================================
export const getAllBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', status = '', paymentStatus = '', from = '', to = '' } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status.toLowerCase();
    }

    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus.toLowerCase();
    }

    if (from || to) {
      query.checkIn = {};
      if (from) query.checkIn.$gte = new Date(from);
      if (to) query.checkIn.$lte = new Date(to);
    }

    if (search) {
      query.$or = [
        { bookingCode: { $regex: search, $options: 'i' } },
        { guestName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('room', 'name category slug');

    res.status(200).json({
      success: true,
      message: 'Bookings retrieved',
      data: {
        bookings,
        total,
        page: parseInt(page, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createManualBooking = async (req, res, next) => {
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
      totalAmount,
      advancePaid = 0,
      source = 'admin',
      adminNotes = '',
      status = 'confirmed'
    } = req.body;

    const targetBookingType = bookingType === 'full_home' ? 'full_home' : 'room';

    const inStr = toDateStr(checkIn);
    const outStr = toDateStr(checkOut);
    const nights = generateNightsArray(inStr, outStr);

    if (nights.length === 0) {
      return res.status(400).json({ success: false, message: 'Check-out date must be after check-in date', data: null });
    }

    let rDoc = null;
    let fullUnits = 1;
    let fullHomeLines = null;
    let defaultPricePerNight = 0;

    if (targetBookingType === 'full_home') {
      const allRooms = await Room.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
      if (!allRooms || allRooms.length === 0) {
        return res.status(400).json({ success: false, message: 'No active rooms found for Full Home reservation', data: null });
      }
      fullUnits = allRooms.reduce((sum, r) => sum + (Number(r.totalUnits) || 1), 0);

      if (quantity !== undefined && Number(quantity) !== fullUnits) {
        return res.status(400).json({
          success: false,
          message: `For Full Home booking, quantity must equal all ${fullUnits} units of the homestay.`,
          data: null
        });
      }

      // Validate Full Home stay rules & guest capacity (admins can record walk-in same-day bookings)
      await validateStayRules(inStr, outStr, Number(adults) || 2, Number(children) || 0, null, 'full_home', true);

      const siteSettings = await SiteSettings.findOne() || {};
      defaultPricePerNight = Number(siteSettings.fullHomePricePerNight) || 35000;

      fullHomeLines = allRooms.map((r) => ({
        room: r._id,
        roomName: r.name,
        roomSlug: r.slug,
        quantity: Number(r.totalUnits) || 1,
        pricePerNight: Number(r.pricePerNight) || 0
      }));
    } else {
      // Strict single-room validation: each booking is for exactly one room, quantity must be 1
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

      // Resolve the single room
      const targetId = roomId || (requestRooms && (requestRooms[0]?.roomId || requestRooms[0]?.room));
      const targetSlug = roomSlug || (requestRooms && (requestRooms[0]?.roomSlug || requestRooms[0]?.slug));

      if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
        rDoc = await Room.findById(targetId);
      } else if (targetId) {
        rDoc = await Room.findOne({ slug: targetId });
      }
      if (!rDoc && targetSlug) {
        rDoc = await Room.findOne({ slug: targetSlug });
      }
      if (!rDoc) {
        return res.status(404).json({ success: false, message: `Room not found (${targetId || targetSlug || 'none'})`, data: null });
      }

      // Validate stay rules & capacity for that one room (admins can record walk-in same-day bookings)
      await validateStayRules(inStr, outStr, Number(adults) || 2, Number(children) || 0, rDoc, 'room', true);
      defaultPricePerNight = Number(rDoc.pricePerNight);
    }

    const calculatedBase = defaultPricePerNight * nights.length;
    const baseAmount = totalAmount !== undefined && totalAmount !== null && totalAmount !== ''
      ? Number(totalAmount)
      : calculatedBase;

    const paid = Number(advancePaid) || 0;
    const balance = Math.max(0, baseAmount - paid);

    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `MH-${year}-${randomNum}`;

    let createdBooking = null;

    await withTransaction(async (session) => {
      // 1. If status is an active holding status, atomically hold inventory
      const isHoldingStatus = !['cancelled', 'rejected', 'expired'].includes(status);
      if (isHoldingStatus) {
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
      }

      // 2. Create the booking document
      const bookingData = {
        bookingCode,
        bookingType: targetBookingType,
        room: targetBookingType === 'full_home' ? null : rDoc._id,
        roomName: targetBookingType === 'full_home' ? 'Full Home (All 5 Rooms)' : rDoc.name,
        roomSlug: targetBookingType === 'full_home' ? 'full-home' : rDoc.slug,
        pricePerNight: defaultPricePerNight,
        quantity: targetBookingType === 'full_home' ? fullUnits : 1,
        lines: targetBookingType === 'full_home'
          ? fullHomeLines
          : [
              {
                room: rDoc._id,
                roomName: rDoc.name,
                roomSlug: rDoc.slug,
                quantity: 1,
                pricePerNight: defaultPricePerNight
              }
            ],
        guestName,
        phone,
        email: email || 'walkin@marichinhomestay.com',
        checkIn: new Date(inStr + 'T12:00:00Z'),
        checkOut: new Date(outStr + 'T11:00:00Z'),
        nights,
        guestCount: {
          adults: Number(adults) || 2,
          children: Number(children) || 0
        },
        adults: Number(adults) || 2,
        children: Number(children) || 0,
        pricing: {
          baseAmount,
          extraGuestCharge: 0,
          discount: 0,
          taxAmount: 0,
          total: baseAmount
        },
        advancePaid: paid,
        balanceDue: balance,
        paymentStatus: balance === 0 ? 'paid' : paid > 0 ? 'partial' : 'pending',
        status,
        source,
        adminNotes,
        statusHistory: [
          {
            who: req.user?.name || 'admin',
            when: new Date(),
            reason: 'Manual booking created by admin',
            status
          }
        ]
      };

      const [newBooking] = await Booking.create([bookingData], session ? { session } : {});
      createdBooking = newBooking;
    });

    await logActivity({
      req,
      action: 'CREATE_MANUAL_BOOKING',
      entityType: 'Booking',
      entityId: createdBooking._id,
      details: {
        bookingCode,
        bookingType: targetBookingType,
        guestName,
        totalAmount: baseAmount
      }
    });

    res.status(201).json({ success: true, message: 'Manual booking created successfully', data: createdBooking });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        data: error.nearest ? { nearest: error.nearest } : null
      });
    }
    next(error);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status: newStatus, adminNotes } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found', data: null });
    }

    const oldStatus = booking.status;
    if (oldStatus === newStatus && adminNotes === undefined) {
      return res.status(200).json({ success: true, message: 'No status change', data: booking });
    }

    const holdingStatuses = ['payment_pending', 'paid_awaiting_confirmation', 'confirmed', 'checked_in', 'checked_out'];
    const nonHoldingStatuses = ['cancelled', 'rejected', 'expired'];

    const wasHolding = holdingStatuses.includes(oldStatus);
    const willHold = holdingStatuses.includes(newStatus);

    let nights = booking.nights;
    if (!Array.isArray(nights) || nights.length === 0) {
      nights = generateNightsArray(booking.checkIn, booking.checkOut);
    }

    const targetRoomId = booking.room?._id || booking.room;
    let rDoc = null;
    if (targetRoomId && mongoose.Types.ObjectId.isValid(targetRoomId)) {
      rDoc = await Room.findById(targetRoomId);
    }
    if (!rDoc && booking.roomSlug) {
      rDoc = await Room.findOne({ slug: booking.roomSlug });
    }

    let refundResult = null;

    // If rejecting a paid booking with razorpayPaymentId, process refund using hostCancelsRefundPercent from SiteSettings
    if (
      newStatus === 'rejected' &&
      booking.razorpayPaymentId &&
      booking.paymentStatus !== 'refunded' &&
      (booking.advancePaid > 0 || booking.amountPaidPaise > 0)
    ) {
      const siteSettings = (await SiteSettings.findOne()) || {};
      const totalPaidPaise = booking.amountPaidPaise || Math.round((booking.advancePaid || 0) * 100);
      const tierCalc = calculateTierRefund({
        settings: siteSettings,
        checkInDate: booking.checkIn,
        paidAmount: totalPaidPaise / 100,
        hostCancelled: true
      });
      const refundPaise = Math.min(totalPaidPaise, Math.round((totalPaidPaise * tierCalc.refundPercent) / 100));
      if (refundPaise > 0) {
        try {
          refundResult = await createRazorpayRefund({
            paymentId: booking.razorpayPaymentId,
            amountPaise: refundPaise,
            notes: {
              bookingCode: booking.bookingCode,
              reason: adminNotes || 'Booking rejected by host'
            }
          });

          booking.refunds = booking.refunds || [];
          booking.refunds.push({
            refundId: refundResult.id,
            amount: (refundResult.amount || refundPaise) / 100,
            status: refundResult.status || 'processed',
            createdAt: new Date(),
            reason: adminNotes || 'Booking rejected by host'
          });
          booking.paymentStatus = refundPaise >= totalPaidPaise ? 'refunded' : 'partial';
        } catch (refundErr) {
          console.error('Failed to trigger Razorpay refund on rejection:', refundErr);
        }
      }
    }

    await withTransaction(async (session) => {
      // If transitioning from non-holding to holding, atomically book inventory
      if (!wasHolding && willHold) {
        if (booking.bookingType === 'full_home') {
          await bookInventoryAtomic({
            bookingType: 'full_home',
            nights,
            excludeBookingId: booking._id,
            session
          });
        } else {
          if (!rDoc) {
            throw new Error('Room document not found for inventory restoration');
          }
          await bookInventoryAtomic({
            bookingType: 'room',
            roomDoc: rDoc,
            nights,
            excludeBookingId: booking._id,
            session
          });
        }
      }

      // If transitioning from holding to non-holding, atomically release inventory
      if (wasHolding && !willHold) {
        await releaseInventoryAtomic({
          booking,
          bookingType: booking.bookingType || 'room',
          roomId: targetRoomId,
          lines: booking.lines,
          nights,
          session
        });
      }

      booking.status = newStatus;
      if (adminNotes !== undefined) booking.adminNotes = adminNotes;
      if (newStatus !== 'payment_pending') {
        booking.holdExpiresAt = null;
      }

      booking.statusHistory = booking.statusHistory || [];
      booking.statusHistory.push({
        who: req.user?.name || 'admin',
        when: new Date(),
        reason: adminNotes || `Admin updated status from ${oldStatus} to ${newStatus}`,
        status: newStatus
      });

      await booking.save({ session: session || null });
    });

    // Send notifications outside transaction
    if (newStatus === 'rejected') {
      sendBookingRejectedWithRefundEmail(
        booking,
        refundResult ? { amount: (refundResult.amount || 0) / 100, refundId: refundResult.id } : {}
      ).catch((e) => console.warn(e));
    } else if (newStatus === 'confirmed') {
      sendBookingConfirmedEmail(booking).catch((e) => console.warn(e));
    }

    if (refundResult) {
      await logActivity({
        req,
        action: 'REFUND_PROCESSED',
        entityType: 'Booking',
        entityId: booking._id,
        details: {
          bookingCode: booking.bookingCode,
          refundId: refundResult.id,
          amount: (refundResult.amount || 0) / 100,
          reason: 'Host rejected booking'
        }
      });
    }

    await logActivity({
      req,
      action: 'UPDATE_BOOKING_STATUS',
      entityType: 'Booking',
      entityId: booking._id,
      details: { bookingCode: booking.bookingCode, oldStatus, newStatus }
    });

    res.status(200).json({ success: true, message: 'Booking status updated successfully', data: booking });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        data: error.nearest ? { nearest: error.nearest } : null
      });
    }
    next(error);
  }
};

export const recordBookingPayment = async (req, res, next) => {
  try {
    const { amountPaid, paymentMethod, transactionId, paymentStatus } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found', data: null });
    }

    const additionalPayment = Number(amountPaid) || 0;
    booking.advancePaid += additionalPayment;
    booking.balanceDue = Math.max(0, booking.pricing.total - booking.advancePaid);

    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;
    } else {
      booking.paymentStatus = booking.balanceDue === 0 ? 'paid' : 'partial';
    }

    if (paymentMethod) booking.paymentMethod = paymentMethod;
    if (transactionId) booking.transactionId = transactionId;

    await booking.save();

    await logActivity({
      req,
      action: 'RECORD_PAYMENT',
      entityType: 'Booking',
      entityId: booking._id,
      details: {
        bookingCode: booking.bookingCode,
        amountPaid: additionalPayment,
        newBalance: booking.balanceDue
      }
    });

    res.status(200).json({ success: true, message: 'Payment recorded', data: booking });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const { reason = 'Cancelled by admin/guest' } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found', data: null });
    }

    const oldStatus = booking.status;
    const isCurrentlyHolding = !['cancelled', 'rejected', 'expired'].includes(oldStatus);

    let nights = booking.nights;
    if (!Array.isArray(nights) || nights.length === 0) {
      nights = generateNightsArray(booking.checkIn, booking.checkOut);
    }

    const targetRoomId = booking.room?._id || booking.room;

    // Check unified cancellation refund tiers from SiteSettings
    let refundResult = null;
    try {
      const siteSettings = (await SiteSettings.findOne()) || {};

      if (
        booking.razorpayPaymentId &&
        booking.paymentStatus !== 'refunded' &&
        (booking.advancePaid > 0 || booking.amountPaidPaise > 0)
      ) {
        const totalPaidPaise = booking.amountPaidPaise || Math.round((booking.advancePaid || 0) * 100);
        const tierCalc = calculateTierRefund({
          settings: siteSettings,
          checkInDate: booking.checkIn,
          paidAmount: totalPaidPaise / 100,
          hostCancelled: Boolean(req.body?.hostCancelled),
          isNoShow: Boolean(req.body?.isNoShow)
        });

        const refundPercent = tierCalc.refundPercent;
        const refundPaise = Math.min(totalPaidPaise, Math.round((totalPaidPaise * refundPercent) / 100));

        if (refundPaise > 0) {
          refundResult = await createRazorpayRefund({
            paymentId: booking.razorpayPaymentId,
            amountPaise: refundPaise,
            notes: {
              bookingCode: booking.bookingCode,
              reason: reason || 'Booking cancelled'
            }
          });

          booking.refunds = booking.refunds || [];
          booking.refunds.push({
            refundId: refundResult.id,
            amount: refundPaise / 100,
            status: refundResult.status || 'processed',
            createdAt: new Date(),
            reason: reason || 'Booking cancelled'
          });

          booking.paymentStatus = refundPercent >= 100 || refundPaise >= totalPaidPaise ? 'refunded' : 'partial';
        }
      }
    } catch (refundErr) {
      console.error('Failed to trigger Razorpay refund on cancellation:', refundErr);
    }

    await withTransaction(async (session) => {
      if (isCurrentlyHolding) {
        await releaseInventoryAtomic({
          booking,
          bookingType: booking.bookingType || 'room',
          roomId: targetRoomId,
          lines: booking.lines,
          nights,
          session
        });
      }

      booking.status = 'cancelled';
      booking.holdExpiresAt = null;
      booking.cancellationReason = reason;

      booking.statusHistory = booking.statusHistory || [];
      booking.statusHistory.push({
        who: req.user?.name || 'admin',
        when: new Date(),
        reason,
        status: 'cancelled'
      });

      await booking.save({ session: session || null });
    });

    sendBookingCancelledRefundEmail(booking, {
      amount: refundResult ? (refundResult.amount || 0) / 100 : 0,
      refundId: refundResult?.id,
      reason
    }).catch((e) => console.warn(e));

    if (refundResult) {
      await logActivity({
        req,
        action: 'REFUND_PROCESSED',
        entityType: 'Booking',
        entityId: booking._id,
        details: {
          bookingCode: booking.bookingCode,
          refundId: refundResult.id,
          amount: (refundResult.amount || 0) / 100,
          reason: 'Cancellation refund'
        }
      });
    }

    await logActivity({
      req,
      action: 'CANCEL_BOOKING',
      entityType: 'Booking',
      entityId: booking._id,
      details: {
        bookingCode: booking.bookingCode,
        bookingType: booking.bookingType || 'room',
        reason
      }
    });

    res.status(200).json({ success: true, message: 'Booking cancelled successfully and inventory released', data: booking });
  } catch (error) {
    next(error);
  }
};

export const requestDateChange = async (req, res, next) => {
  try {
    const { reason = 'Maintenance / Property unavailable' } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found', data: null });
    }

    booking.dateChangeRequested = true;
    booking.dateChangeReason = reason;
    booking.dateChangeRequestedAt = new Date();

    booking.statusHistory = booking.statusHistory || [];
    booking.statusHistory.push({
      who: req.user?.name || 'admin',
      when: new Date(),
      reason: `Date change requested: ${reason}`,
      status: booking.status
    });

    await booking.save();

    await logActivity({
      req,
      action: 'REQUEST_DATE_CHANGE',
      entityType: 'Booking',
      entityId: booking._id,
      details: { bookingCode: booking.bookingCode, reason }
    });

    res.status(200).json({ success: true, message: 'Date change requested successfully', data: booking });
  } catch (error) {
    next(error);
  }
};

export const clearDateChangeFlag = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found', data: null });
    }

    booking.dateChangeRequested = false;
    booking.dateChangeReason = '';
    booking.dateChangeRequestedAt = null;

    booking.statusHistory = booking.statusHistory || [];
    booking.statusHistory.push({
      who: req.user?.name || 'admin',
      when: new Date(),
      reason: 'Date change request flag cleared',
      status: booking.status
    });

    await booking.save();

    await logActivity({
      req,
      action: 'CLEAR_DATE_CHANGE_FLAG',
      entityType: 'Booking',
      entityId: booking._id,
      details: { bookingCode: booking.bookingCode }
    });

    res.status(200).json({ success: true, message: 'Date change flag cleared', data: booking });
  } catch (error) {
    next(error);
  }
};

export const changeBookingDates = async (req, res, next) => {
  try {
    const { checkIn, checkOut, processRefund = false, refundAmount = 0 } = req.body;
    if (!checkIn || !checkOut) {
      return res.status(400).json({ success: false, message: 'Both checkIn and checkOut dates are required' });
    }

    const inStr = toDateStr(checkIn);
    const outStr = toDateStr(checkOut);
    if (outStr <= inStr) {
      return res.status(400).json({ success: false, message: 'Check-out date must be after check-in date' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const oldNights = (Array.isArray(booking.nights) && booking.nights.length > 0)
      ? booking.nights
      : generateNightsArray(booking.checkIn, booking.checkOut);
    const newNights = generateNightsArray(inStr, outStr);

    let rDoc = null;
    const targetRoomId = booking.room?._id || booking.room;
    if (booking.bookingType !== 'full_home') {
      if (targetRoomId && mongoose.Types.ObjectId.isValid(targetRoomId)) {
        rDoc = await Room.findById(targetRoomId);
      }
      if (!rDoc && booking.roomSlug) {
        rDoc = await Room.findOne({ slug: booking.roomSlug });
      }
      if (!rDoc) {
        return res.status(404).json({ success: false, message: 'Room not found for this booking' });
      }
    }

    // Validate stay rules on new dates (admins may shift to today for walk-in adjustments)
    await validateStayRules({
      checkIn: inStr,
      checkOut: outStr,
      bookingType: booking.bookingType,
      roomDoc: rDoc,
      nights: newNights,
      adults: booking.adults || booking.guestCount?.adults || 2,
      children: booking.children || booking.guestCount?.children || 0,
      allowSameDay: true
    });

    // Calculate server quote for new dates
    const quote = await calculateServerQuote({
      bookingType: booking.bookingType,
      roomDoc: rDoc,
      checkIn: inStr,
      checkOut: outStr,
      advanceOption: booking.advanceOption || 20,
      promoCode: booking.promoCode || ''
    });

    const isCurrentlyHolding = ['payment_pending', 'paid_awaiting_confirmation', 'confirmed', 'checked_in', 'checked_out'].includes(booking.status);
    const newTotal = quote.pricing.total;
    let excessPaid = 0;

    await withTransaction(async (session) => {
      // 1. If currently holding, release old nights and book new nights atomically
      if (isCurrentlyHolding) {
        await releaseInventoryAtomic({
          booking,
          bookingType: booking.bookingType,
          roomId: targetRoomId,
          lines: booking.lines,
          nights: oldNights,
          session
        });

        await bookInventoryAtomic({
          bookingType: booking.bookingType,
          roomDoc: rDoc,
          nights: newNights,
          excludeBookingId: booking._id,
          session
        });
      }

      // 2. Update booking details
      booking.checkIn = new Date(inStr);
      booking.checkOut = new Date(outStr);
      booking.nights = newNights;
      booking.pricing = quote.pricing;

      // Recalculate advance and balance
      if (newTotal >= booking.advancePaid) {
        booking.balanceDue = Math.round(newTotal - booking.advancePaid);
        booking.refundDue = 0;
        if (booking.balanceDue === 0) {
          booking.paymentStatus = 'paid';
        } else if (booking.advancePaid > 0) {
          booking.paymentStatus = 'partial';
        }
      } else {
        excessPaid = Math.round(booking.advancePaid - newTotal);
        booking.balanceDue = 0;
        booking.refundDue = excessPaid;
        booking.paymentStatus = 'paid';
      }

      booking.dateChangeRequested = false;
      booking.dateChangeReason = '';
      booking.dateChangeRequestedAt = null;

      booking.statusHistory = booking.statusHistory || [];
      booking.statusHistory.push({
        who: req.user?.name || 'admin',
        when: new Date(),
        reason: `Dates changed to ${inStr} to ${outStr} (${newNights.length} night(s)). New total: ₹${newTotal}. Advance paid: ₹${booking.advancePaid}.${excessPaid > 0 ? ` Refund due: ₹${excessPaid}.` : ''}`,
        status: booking.status
      });

      await booking.save({ session: session || null });
    });

    // 3. Process partial refund outside transaction if requested and payment exists
    let refundResult = null;
    if (processRefund && excessPaid > 0 && booking.razorpayPaymentId) {
      const refundToIssue = refundAmount > 0 ? Math.min(Number(refundAmount), excessPaid) : excessPaid;
      try {
        refundResult = await createRazorpayRefund({
          paymentId: booking.razorpayPaymentId,
          amountPaise: Math.round(refundToIssue * 100),
          notes: {
            bookingCode: booking.bookingCode,
            reason: 'Booking dates changed - tariff difference refund'
          }
        });

        booking.refunds = booking.refunds || [];
        booking.refunds.push({
          refundId: refundResult.id,
          amount: (refundResult.amount || Math.round(refundToIssue * 100)) / 100,
          amountPaise: refundResult.amount || Math.round(refundToIssue * 100),
          status: refundResult.status || 'processed',
          reason: 'Tariff reduction on date change',
          createdAt: new Date()
        });

        booking.advancePaid = Math.max(0, booking.advancePaid - refundToIssue);
        booking.refundDue = Math.max(0, excessPaid - refundToIssue);
        await booking.save();
      } catch (refundErr) {
        console.error('Failed to process Razorpay refund during date change:', refundErr);
      }
    }

    await logActivity({
      req,
      action: 'CHANGE_BOOKING_DATES',
      entityType: 'Booking',
      entityId: booking._id,
      details: {
        bookingCode: booking.bookingCode,
        oldNights,
        newNights,
        newTotal,
        refundDue: booking.refundDue
      }
    });

    res.status(200).json({
      success: true,
      message: 'Booking dates changed successfully',
      data: booking,
      refundResult
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        data: error.nearest ? { nearest: error.nearest } : null
      });
    }
    next(error);
  }
};

export const cancelAndRefundBooking = async (req, res, next) => {
  try {
    const { reason, refundType = 'tier', refundAmount, hostCancelled = false, isNoShow = false } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const oldStatus = booking.status;
    const isCurrentlyHolding = !['cancelled', 'rejected', 'expired'].includes(oldStatus);

    let nights = booking.nights;
    if (!Array.isArray(nights) || nights.length === 0) {
      nights = generateNightsArray(booking.checkIn, booking.checkOut);
    }
    const targetRoomId = booking.room?._id || booking.room;

    let refundResult = null;
    let actualRefundPaise = 0;

    const totalPaidPaise = booking.amountPaidPaise || Math.round((booking.advancePaid || 0) * 100);
    const siteSettings = (await SiteSettings.findOne()) || {};
    const tierCalc = calculateTierRefund({
      settings: siteSettings,
      checkInDate: booking.checkIn,
      paidAmount: totalPaidPaise / 100,
      hostCancelled: Boolean(hostCancelled),
      isNoShow: Boolean(isNoShow)
    });

    if (refundType === 'full' && totalPaidPaise > 0) {
      actualRefundPaise = totalPaidPaise;
    } else if (refundType === 'tier' && totalPaidPaise > 0) {
      actualRefundPaise = Math.min(totalPaidPaise, Math.round((totalPaidPaise * tierCalc.refundPercent) / 100));
    } else if (refundType === 'partial' && totalPaidPaise > 0) {
      const explicitRupees = refundAmount !== undefined && refundAmount !== '' && Number.isFinite(Number(refundAmount))
        ? Math.max(0, Number(refundAmount))
        : tierCalc.refundAmount;
      actualRefundPaise = Math.min(totalPaidPaise, Math.round(explicitRupees * 100));
    }

    if (actualRefundPaise > 0 && booking.razorpayPaymentId && booking.paymentStatus !== 'refunded') {
      try {
        refundResult = await createRazorpayRefund({
          paymentId: booking.razorpayPaymentId,
          amountPaise: actualRefundPaise,
          notes: {
            bookingCode: booking.bookingCode,
            reason: reason.trim()
          }
        });

        booking.refunds = booking.refunds || [];
        booking.refunds.push({
          refundId: refundResult.id,
          amount: actualRefundPaise / 100,
          amountPaise: actualRefundPaise,
          status: refundResult.status || 'processed',
          reason: reason.trim(),
          createdAt: new Date()
        });

        if (refundType === 'full' || actualRefundPaise >= totalPaidPaise) {
          booking.paymentStatus = 'refunded';
        } else {
          booking.paymentStatus = 'partial';
        }
      } catch (refundErr) {
        console.error('Failed to trigger Razorpay refund on cancellation:', refundErr);
      }
    }

    await withTransaction(async (session) => {
      if (isCurrentlyHolding) {
        await releaseInventoryAtomic({
          booking,
          bookingType: booking.bookingType || 'room',
          roomId: targetRoomId,
          lines: booking.lines,
          nights,
          session
        });
      }

      booking.status = 'cancelled';
      booking.holdExpiresAt = null;
      booking.cancellationReason = reason.trim();
      booking.dateChangeRequested = false;
      booking.refundDue = 0;

      booking.statusHistory = booking.statusHistory || [];
      booking.statusHistory.push({
        who: req.user?.name || 'admin',
        when: new Date(),
        reason: `Cancelled: ${reason.trim()}.${actualRefundPaise > 0 ? ` Refunded: ₹${actualRefundPaise / 100}.` : ''}`,
        status: 'cancelled'
      });

      await booking.save({ session: session || null });
    });

    sendBookingCancelledRefundEmail(booking, {
      amount: actualRefundPaise / 100,
      refundId: refundResult?.id,
      reason: reason.trim()
    }).catch((e) => console.warn(e));

    if (refundResult) {
      await logActivity({
        req,
        action: 'REFUND_PROCESSED',
        entityType: 'Booking',
        entityId: booking._id,
        details: {
          bookingCode: booking.bookingCode,
          refundId: refundResult.id,
          amount: actualRefundPaise / 100,
          reason: reason.trim()
        }
      });
    }

    await logActivity({
      req,
      action: 'CANCEL_BOOKING',
      entityType: 'Booking',
      entityId: booking._id,
      details: {
        bookingCode: booking.bookingCode,
        reason: reason.trim(),
        refundType,
        refundAmount: actualRefundPaise / 100
      }
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled and refund processed',
      data: booking,
      refundResult
    });
  } catch (error) {
    next(error);
  }
};

export const markBalanceReceived = async (req, res, next) => {
  try {
    const { amount, paymentMethod = 'Cash', transactionId = '', notes = '' } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const payAmount = Number(amount) || booking.balanceDue || 0;
    booking.advancePaid += payAmount;
    booking.balanceDue = Math.max(0, (booking.pricing?.total || 0) - booking.advancePaid);

    if (booking.balanceDue === 0) {
      booking.paymentStatus = 'paid';
    } else {
      booking.paymentStatus = 'partial';
    }

    if (paymentMethod) booking.paymentMethod = paymentMethod;
    if (transactionId) booking.transactionId = transactionId;

    booking.statusHistory = booking.statusHistory || [];
    booking.statusHistory.push({
      who: req.user?.name || 'admin',
      when: new Date(),
      reason: `Balance of ₹${payAmount} marked received via ${paymentMethod}${notes ? ` (${notes})` : ''}`,
      status: booking.status
    });

    await booking.save();

    await logActivity({
      req,
      action: 'RECORD_PAYMENT',
      entityType: 'Booking',
      entityId: booking._id,
      details: {
        bookingCode: booking.bookingCode,
        amount: payAmount,
        paymentMethod,
        remainingBalance: booking.balanceDue
      }
    });

    res.status(200).json({ success: true, message: 'Balance payment recorded', data: booking });
  } catch (error) {
    next(error);
  }
};

export const getBookingAvailableDates = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const todayStr = toDateStr(new Date());
    const fromDate = req.query.from || todayStr;
    const toDate = req.query.to || null;

    const targetRoomId = booking.room?._id || booking.room || booking.roomSlug;

    const calendarResult = await getCalendarAvailability({
      bookingType: booking.bookingType || 'room',
      roomIdentifier: targetRoomId,
      fromDate,
      toDate,
      excludeBooking: booking
    });

    res.status(200).json({
      success: true,
      message: 'Available dates retrieved',
      data: calendarResult
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found', data: null });
    }

    const isCurrentlyHolding = !['cancelled', 'rejected', 'expired'].includes(booking.status);
    let nights = booking.nights;
    if (!Array.isArray(nights) || nights.length === 0) {
      nights = generateNightsArray(booking.checkIn, booking.checkOut);
    }

    const targetRoomId = booking.room?._id || booking.room;

    await withTransaction(async (session) => {
      if (isCurrentlyHolding) {
        await releaseInventoryAtomic({
          booking,
          bookingType: booking.bookingType || 'room',
          roomId: targetRoomId,
          lines: booking.lines,
          nights,
          session
        });
      }

      await Booking.findByIdAndDelete(booking._id, session ? { session } : {});
    });

    await logActivity({
      req,
      action: 'DELETE_BOOKING',
      entityType: 'Booking',
      entityId: req.params.id,
      details: {
        bookingCode: booking.bookingCode,
        bookingType: booking.bookingType || 'room',
        guestName: booking.guestName
      }
    });

    res.status(200).json({ success: true, message: 'Booking deleted permanently and inventory updated', data: null });
  } catch (error) {
    next(error);
  }
};

export const exportBookingsCSV = async (req, res, next) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 }).populate('room', 'name');

    const headers = [
      'Booking Code',
      'Guest Name',
      'Email',
      'Phone',
      'Room',
      'Check In',
      'Check Out',
      'Nights Count',
      'Nights Covered',
      'Adults',
      'Children',
      'Total Amount (INR)',
      'Advance Paid',
      'Balance Due',
      'Payment Status',
      'Payment Method',
      'Razorpay Payment ID',
      'Razorpay Order ID',
      'Refund Status',
      'Refund Amount (INR)',
      'Booking Status',
      'Source',
      'Created At'
    ];

    const rows = bookings.map((b) => {
      let roomDisplay = b.roomName || b.room?.name || 'Standard Room';
      if (b.bookingType === 'full_home') {
        roomDisplay = 'Full Home (All 5 Rooms: 2 Standard, 2 Suite, 1 Single)';
      }
      const nightsCount = Array.isArray(b.nights) ? b.nights.length : (Number(b.nights) || 1);
      const nightsList = Array.isArray(b.nights) ? b.nights.join(', ') : '';

      const totalRefunded = (b.refunds || []).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const refundStatus = totalRefunded > 0 ? (b.paymentStatus === 'refunded' ? 'Full Refund' : 'Partial Refund') : 'None';

      return [
        b.bookingCode,
        `"${(b.guestName || '').replace(/"/g, '""')}"`,
        b.email,
        b.phone,
        `"${roomDisplay.replace(/"/g, '""')}"`,
        new Date(b.checkIn).toISOString().split('T')[0],
        new Date(b.checkOut).toISOString().split('T')[0],
        nightsCount,
        `"${nightsList.replace(/"/g, '""')}"`,
        b.adults,
        b.children,
        b.pricing?.total || 0,
        b.advancePaid || 0,
        b.balanceDue || 0,
        b.paymentStatus || 'unpaid',
        `"${(b.razorpayPaymentMethod || b.paymentMethod || 'online').replace(/"/g, '""')}"`,
        `"${(b.razorpayPaymentId || '').replace(/"/g, '""')}"`,
        `"${(b.razorpayOrderId || '').replace(/"/g, '""')}"`,
        `"${refundStatus}"`,
        totalRefunded,
        b.status,
        b.source,
        new Date(b.createdAt).toISOString().split('T')[0]
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=marichin_bookings.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. PACKAGES & EXPERIENCES CRUD
// ==========================================
export const getAllPackagesAdmin = async (req, res, next) => {
  try {
    const packages = await Package.find().sort({ displayOrder: 1 });
    res.status(200).json({ success: true, message: 'All packages retrieved', data: packages });
  } catch (error) {
    next(error);
  }
};

export const createPackage = async (req, res, next) => {
  try {
    const slug = req.body.slug || req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const image = req.body.image || '/images/realimage/real1.jpeg';
    const pkg = await Package.create({ ...req.body, slug, image });
    res.status(201).json({ success: true, message: 'Package created', data: pkg });
  } catch (error) {
    next(error);
  }
};

export const updatePackage = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;

    if (updateData.title && !updateData.name) {
      updateData.name = updateData.title;
    }
    if (updateData.durationLabel && !updateData.duration) {
      updateData.duration = updateData.durationLabel;
    }
    if (updateData.targetAudience && !updateData.idealFor) {
      updateData.idealFor = updateData.targetAudience;
    }
    if (Array.isArray(updateData.inclusions) && !Array.isArray(updateData.features)) {
      updateData.features = updateData.inclusions;
    }

    if (updateData.price !== undefined || updateData.offerPrice !== undefined) {
      const rawPrice = updateData.price !== undefined ? updateData.price : updateData.offerPrice;
      const parsedPrice = rawPrice === '' || rawPrice === null || rawPrice === undefined
        ? null
        : Number(rawPrice);
      updateData.price = parsedPrice !== null && !isNaN(parsedPrice) ? Math.max(0, parsedPrice) : null;
      updateData.offerPrice = updateData.price;
      updateData.regularPrice = updateData.price;
      updateData.originalPrice = updateData.price;
    }

    const pkg = await Package.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found', data: null });
    }

    // Keep SiteSettings.fullHomePricePerNight synchronized with Entire Homestay package price
    const slugLower = String(pkg.slug || '').toLowerCase();
    if ((slugLower.includes('entire-homestay') || slugLower.includes('all-5-rooms')) && Number(pkg.price) > 0) {
      await SiteSettings.findOneAndUpdate(
        {},
        { $set: { fullHomePricePerNight: Number(pkg.price) } }
      );
    }

    res.status(200).json({ success: true, message: 'Package updated', data: pkg });
  } catch (error) {
    next(error);
  }
};

export const deletePackage = async (req, res, next) => {
  try {
    await Package.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Package deleted', data: null });
  } catch (error) {
    next(error);
  }
};

export const getAllExperiencesAdmin = async (req, res, next) => {
  try {
    const experiences = await Experience.find().sort({ displayOrder: 1 });
    res.status(200).json({ success: true, message: 'All experiences retrieved', data: experiences });
  } catch (error) {
    next(error);
  }
};

export const createExperience = async (req, res, next) => {
  try {
    const slug = req.body.slug || req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const image = req.body.image || '/images/realimage/real5.jpeg';
    const exp = await Experience.create({ ...req.body, slug, image });
    res.status(201).json({ success: true, message: 'Experience created', data: exp });
  } catch (error) {
    next(error);
  }
};

export const updateExperience = async (req, res, next) => {
  try {
    const exp = await Experience.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, message: 'Experience updated', data: exp });
  } catch (error) {
    next(error);
  }
};

export const deleteExperience = async (req, res, next) => {
  try {
    await Experience.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Experience deleted', data: null });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. DINING MENU CRUD
// ==========================================
export const getAllMenuAdmin = async (req, res, next) => {
  try {
    const categories = await MenuCategory.find().sort({ displayOrder: 1 });
    const items = await MenuItem.find().sort({ displayOrder: 1 });

    const menuWithItems = categories.map((cat) => {
      const catItems = items.filter(
        (i) => i.category === cat.slug || i.category === cat.name || String(i.categoryRef) === String(cat._id)
      );
      return {
        ...cat.toObject(),
        items: catItems
      };
    });

    res.status(200).json({ success: true, message: 'Menu data retrieved', data: menuWithItems, raw: { categories, items } });
  } catch (error) {
    next(error);
  }
};

export const createMenuCategory = async (req, res, next) => {
  try {
    const slug = req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cat = await MenuCategory.create({ ...req.body, slug });
    res.status(201).json({ success: true, message: 'Menu category created', data: cat });
  } catch (error) {
    next(error);
  }
};

export const updateMenuCategory = async (req, res, next) => {
  try {
    const cat = await MenuCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, message: 'Category updated', data: cat });
  } catch (error) {
    next(error);
  }
};

export const deleteMenuCategory = async (req, res, next) => {
  try {
    await MenuCategory.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Category deleted', data: null });
  } catch (error) {
    next(error);
  }
};

export const createMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.create(req.body);
    res.status(201).json({ success: true, message: 'Menu item created', data: item });
  } catch (error) {
    next(error);
  }
};

export const updateMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, message: 'Menu item updated', data: item });
  } catch (error) {
    next(error);
  }
};

export const deleteMenuItem = async (req, res, next) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Menu item deleted', data: null });
  } catch (error) {
    next(error);
  }
};

export const getDiningContentAdmin = async (req, res, next) => {
  try {
    let content = await DiningContent.findOne();
    if (!content) {
      content = await DiningContent.create({});
    }
    res.status(200).json({ success: true, message: 'Dining content retrieved', data: content });
  } catch (error) {
    next(error);
  }
};

export const updateDiningContentAdmin = async (req, res, next) => {
  try {
    let content = await DiningContent.findOne();
    if (!content) {
      content = await DiningContent.create(req.body);
    } else {
      content = await DiningContent.findByIdAndUpdate(content._id, req.body, { new: true });
    }

    await logActivity({
      req,
      action: 'UPDATE_DINING_CONTENT',
      entityType: 'DiningContent',
      entityId: content._id,
      details: { title: content.hero?.title?.en || 'Dining Content' }
    });

    res.status(200).json({ success: true, message: 'Dining content updated successfully', data: content });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. GALLERY CRUD
// ==========================================
export const getAllGalleryAdmin = async (req, res, next) => {
  try {
    const images = await GalleryImage.find().sort({ displayOrder: 1, createdAt: -1 });
    res.status(200).json({ success: true, message: 'All gallery images retrieved', data: images });
  } catch (error) {
    next(error);
  }
};

export const createGalleryImage = async (req, res, next) => {
  try {
    const img = await GalleryImage.create(req.body);
    res.status(201).json({ success: true, message: 'Gallery image added', data: img });
  } catch (error) {
    next(error);
  }
};

export const updateGalleryImage = async (req, res, next) => {
  try {
    const img = await GalleryImage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, message: 'Gallery image updated', data: img });
  } catch (error) {
    next(error);
  }
};

export const deleteGalleryImage = async (req, res, next) => {
  try {
    const img = await GalleryImage.findById(req.params.id);
    if (img && img.url && img.url.startsWith('/uploads/')) {
      const filename = path.basename(img.url);
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkErr) {
          console.warn(`Could not delete file ${filePath}:`, unlinkErr.message);
        }
      }
    }
    await GalleryImage.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Gallery image deleted', data: null });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 7. REVIEWS & ENQUIRIES MODERATION
// ==========================================
export const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: 'All reviews retrieved', data: reviews });
  } catch (error) {
    next(error);
  }
};

export const createReviewAdmin = async (req, res, next) => {
  try {
    const { guestName, location, city, rating = 5, text, review, stayedIn, stayDate, status = 'approved' } = req.body;
    const reviewText = (text || review || '').trim();
    if (!guestName?.trim() || !reviewText) {
      return res.status(400).json({ success: false, message: 'Guest name and review text are required', data: null });
    }
    const rev = await Review.create({
      guestName: guestName.trim(),
      location: (location || city || 'Karnataka, India').trim(),
      rating: Math.min(5, Math.max(1, parseInt(rating, 10) || 5)),
      text: reviewText,
      stayDate: (typeof stayDate === 'string' && stayDate.trim()) || new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      stayedIn: (typeof stayedIn === 'string' && stayedIn.trim()) ? stayedIn.trim() : 'Standard Room',
      status: ['pending', 'approved', 'hidden'].includes(status) ? status : 'approved'
    });
    res.status(201).json({ success: true, message: 'Review added successfully', data: rev });
  } catch (error) {
    next(error);
  }
};

export const approveReview = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Review not found', data: null });
    }
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found', data: null });
    }
    res.status(200).json({ success: true, message: 'Review approved', data: review });
  } catch (error) {
    next(error);
  }
};

export const hideReview = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Review not found', data: null });
    }
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status: 'hidden' },
      { new: true }
    );
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found', data: null });
    }
    res.status(200).json({ success: true, message: 'Review hidden', data: review });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Review not found', data: null });
    }
    const deleted = await Review.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Review not found', data: null });
    }
    res.status(200).json({ success: true, message: 'Review deleted', data: null });
  } catch (error) {
    next(error);
  }
};

export const getAllEnquiries = async (req, res, next) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: 'Enquiries retrieved', data: enquiries });
  } catch (error) {
    next(error);
  }
};

export const updateEnquiryStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { status, ...(adminNotes && { adminNotes }) },
      { new: true }
    );
    res.status(200).json({ success: true, message: 'Enquiry updated', data: enquiry });
  } catch (error) {
    next(error);
  }
};

export const deleteEnquiry = async (req, res, next) => {
  try {
    await Enquiry.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Enquiry deleted', data: null });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 8. PROMOS & BLOCKED DATES
// ==========================================
export const getAllPromos = async (req, res, next) => {
  try {
    const promos = await Promo.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: 'Promos retrieved', data: promos });
  } catch (error) {
    next(error);
  }
};

export const createPromo = async (req, res, next) => {
  try {
    const promo = await Promo.create({
      ...req.body,
      code: req.body.code.trim().toUpperCase()
    });

    await logActivity({
      req,
      action: 'CREATE_PROMO',
      entityType: 'Promo',
      entityId: promo._id,
      details: { code: promo.code, value: promo.value }
    });

    res.status(201).json({ success: true, message: 'Promo created', data: promo });
  } catch (error) {
    next(error);
  }
};

export const updatePromo = async (req, res, next) => {
  try {
    const promo = await Promo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, message: 'Promo updated', data: promo });
  } catch (error) {
    next(error);
  }
};

export const deletePromo = async (req, res, next) => {
  try {
    await Promo.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Promo deleted', data: null });
  } catch (error) {
    next(error);
  }
};

export const getBlockedDates = async (req, res, next) => {
  try {
    const blocked = await BlockedDate.find().sort({ startDate: 1 });
    res.status(200).json({ success: true, message: 'Blocked dates retrieved', data: blocked });
  } catch (error) {
    next(error);
  }
};

export const createBlockedDate = async (req, res, next) => {
  try {
    const { room = 'all', startDate, endDate, date, reason = 'Maintenance' } = req.body;
    const startStr = toDateStr(startDate || date);
    const endStr = toDateStr(endDate || date || startStr);

    const blocked = await BlockedDate.create({
      room,
      startDate: new Date(startStr + 'T00:00:00Z'),
      endDate: new Date(endStr + 'T23:59:59Z'),
      reason
    });

    res.status(201).json({ success: true, message: 'Date(s) blocked successfully', data: blocked });
  } catch (error) {
    next(error);
  }
};

export const deleteBlockedDate = async (req, res, next) => {
  try {
    await BlockedDate.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Blocked date removed', data: null });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 9. USERS (Admin Only)
// ==========================================
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: 'Users retrieved', data: users });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, role = 'staff' } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists', data: null });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      phone,
      passwordHash,
      role,
      isActive: true
    });

    await logActivity({
      req,
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: user._id,
      details: { email: user.email, role: user.role }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { name, phone, role, isActive, password } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.passwordHash = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', data: null });
    }

    await logActivity({
      req,
      action: 'UPDATE_USER',
      entityType: 'User',
      entityId: user._id,
      details: { email: user.email, role: user.role, isActive: user.isActive }
    });

    res.status(200).json({ success: true, message: 'User updated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account', data: null });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', data: null });
    }

    await logActivity({
      req,
      action: 'DELETE_USER',
      entityType: 'User',
      entityId: user._id,
      details: { email: user.email }
    });

    res.status(200).json({ success: true, message: 'User deleted successfully', data: null });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 10. SITE SETTINGS (Admin Only)
// ==========================================
export const updateSettings = async (req, res, next) => {
  try {
    let settings = await SiteSettings.findOne();
    const previousHeroVideoUrl = settings?.heroVideoUrl || DEFAULT_HERO_BANNER.heroVideoUrl;
    const previousHeroPosterUrl = settings?.heroPosterUrl || '';
    const updateData = { ...req.body };

    // Validate Home Hero Banner settings if included in payload
    let heroBannerTouched = false;
    if (updateData.heroVideoUrl !== undefined) {
      const videoValidation = validateHeroVideoUrl(updateData.heroVideoUrl);
      if (!videoValidation.valid) {
        return res.status(400).json({ success: false, message: videoValidation.message, data: null });
      }
      updateData.heroVideoUrl = videoValidation.value;
      heroBannerTouched = true;
    }
    if (updateData.heroPosterUrl !== undefined) {
      const posterValidation = validateHeroPosterUrl(updateData.heroPosterUrl);
      if (!posterValidation.valid) {
        return res.status(400).json({ success: false, message: posterValidation.message, data: null });
      }
      updateData.heroPosterUrl = posterValidation.value;
      heroBannerTouched = true;
    }
    if (updateData.heroOverlay !== undefined) {
      const overlayValidation = validateHeroOverlay(updateData.heroOverlay);
      if (!overlayValidation.valid) {
        return res.status(400).json({ success: false, message: overlayValidation.message, data: null });
      }
      updateData.heroOverlay = overlayValidation.value;
      heroBannerTouched = true;
    }
    for (const fieldName of ['heroBadge', 'heroTitle', 'heroSubtitle', 'heroPrimaryLabel', 'heroSecondaryLabel']) {
      if (updateData[fieldName] !== undefined) {
        const textValidation = validateBilingualHeroField(
          updateData[fieldName],
          fieldName,
          DEFAULT_HERO_BANNER[fieldName]
        );
        if (!textValidation.valid) {
          return res.status(400).json({ success: false, message: textValidation.message, data: null });
        }
        updateData[fieldName] = textValidation.value;
        heroBannerTouched = true;
      }
    }

    // Standardize alias fields
    if (updateData.phone && (!updateData.phones || updateData.phones.length === 0)) {
      updateData.phones = [updateData.phone];
    }
    if (updateData.name && !updateData.propertyName) {
      updateData.propertyName = updateData.name;
    }
    if (updateData.whatsapp && !updateData.whatsappNumber) {
      updateData.whatsappNumber = updateData.whatsapp;
    }

    if (updateData.minNights !== undefined) updateData.minNights = Math.max(1, Number(updateData.minNights) || 1);
    if (updateData.maxAdvanceDays !== undefined) updateData.maxAdvanceDays = Math.max(1, Number(updateData.maxAdvanceDays) || 365);
    if (updateData.holdMinutes !== undefined) updateData.holdMinutes = Math.max(1, Number(updateData.holdMinutes) || 15);
    if (updateData.autoConfirmAfterPayment !== undefined) updateData.autoConfirmAfterPayment = Boolean(updateData.autoConfirmAfterPayment);
    if (updateData.fullHomePricePerNight !== undefined) updateData.fullHomePricePerNight = Math.max(0, Number(updateData.fullHomePricePerNight) || 35000);
    if (updateData.fullHomeEnabled !== undefined) updateData.fullHomeEnabled = Boolean(updateData.fullHomeEnabled);
    if (updateData.fullHomeMinNights !== undefined) updateData.fullHomeMinNights = Math.max(1, Number(updateData.fullHomeMinNights) || 1);
    if (updateData.fullHomeMealsNote !== undefined) updateData.fullHomeMealsNote = String(updateData.fullHomeMealsNote || '');

    // Single-source cancellation tiers, refund & safety policy settings
    let policyFieldsTouched = false;
    if (updateData.cancellationTiers !== undefined) {
      updateData.cancellationTiers = normalizeCancellationTiers(updateData.cancellationTiers);
      policyFieldsTouched = true;
    }
    if (updateData.noShowRefundPercent !== undefined) {
      updateData.noShowRefundPercent = Math.min(100, Math.max(0, Math.round(Number(updateData.noShowRefundPercent) || 0)));
      policyFieldsTouched = true;
    }
    if (updateData.hostCancelsRefundPercent !== undefined) {
      updateData.hostCancelsRefundPercent = Math.min(100, Math.max(0, Math.round(Number(updateData.hostCancelsRefundPercent) ?? 100)));
      policyFieldsTouched = true;
    }
    if (updateData.refundTimelineText !== undefined) {
      updateData.refundTimelineText = String(updateData.refundTimelineText || '5 to 7 working days').trim();
      policyFieldsTouched = true;
    }
    if (updateData.dateChangeRule !== undefined && typeof updateData.dateChangeRule === 'object') {
      updateData.dateChangeRule = {
        en: String(updateData.dateChangeRule.en || '').trim(),
        kn: String(updateData.dateChangeRule.kn || '').trim()
      };
      policyFieldsTouched = true;
    }
    if (updateData.earlyDepartureRule !== undefined && typeof updateData.earlyDepartureRule === 'object') {
      updateData.earlyDepartureRule = {
        en: String(updateData.earlyDepartureRule.en || '').trim(),
        kn: String(updateData.earlyDepartureRule.kn || '').trim()
      };
      policyFieldsTouched = true;
    }
    if (updateData.gatewayFeeNote !== undefined && typeof updateData.gatewayFeeNote === 'object') {
      updateData.gatewayFeeNote = {
        en: String(updateData.gatewayFeeNote.en || '').trim(),
        kn: String(updateData.gatewayFeeNote.kn || '').trim()
      };
      policyFieldsTouched = true;
    }
    if (updateData.safetyFeatures !== undefined && typeof updateData.safetyFeatures === 'object') {
      const cleanFeatures = { ...DEFAULT_SAFETY_FEATURES };
      for (const k of Object.keys(DEFAULT_SAFETY_FEATURES)) {
        if (updateData.safetyFeatures[k] !== undefined) {
          cleanFeatures[k] = Boolean(updateData.safetyFeatures[k]);
        }
      }
      updateData.safetyFeatures = cleanFeatures;
      policyFieldsTouched = true;
    }
    if (policyFieldsTouched || updateData.checkInTime !== undefined || updateData.checkOutTime !== undefined) {
      updateData.policiesLastUpdated = new Date();
    }

    // Remove legacy duplicated fields if still sent
    delete updateData.rejectionRefundPolicy;
    delete updateData.cancellationRefundPolicy;
    delete updateData.cancellationRefundDaysThreshold;
    delete updateData.cancellationRefundPercentage;
    delete updateData.cancellationNote;
    delete updateData.policies;

    const currentVerified = (settings && settings.sampleDefaultsVerified) ? { ...settings.sampleDefaultsVerified } : {};
    
    // Mark non-policy sample default fields being updated as verified
    const sampleFields = [
      'pricePerNight', 'extraGuestCharge', 'mealsIncluded', 'inclusionsNote',
      'advanceOptions', 'taxPercent', 'checkInTime', 'checkOutTime',
      'minNights', 'maxAdvanceDays', 'sameDayCutoffTime', 'holdMinutes', 'autoConfirmAfterPayment',
      'fullHomePricePerNight', 'fullHomeEnabled', 'fullHomeMinNights', 'fullHomeMealsNote',
      'roomsPageHeading', 'roomsPageDescription', 'aboutStoryText', 'googleMapsShareUrl', 'drivingDistances',
      'instagramUrl', 'facebookUrl', 'youtubeUrl', 'whatsappNumber', 'email'
    ];
    for (const f of sampleFields) {
      if (updateData[f] !== undefined) {
        currentVerified[f] = true;
      }
    }
    if (updateData.sampleDefaultsVerified && typeof updateData.sampleDefaultsVerified === 'object') {
      Object.assign(currentVerified, updateData.sampleDefaultsVerified);
    }
    updateData.sampleDefaultsVerified = currentVerified;

    if (!settings) {
      settings = await SiteSettings.create(updateData);
    } else {
      settings = await SiteSettings.findByIdAndUpdate(settings._id, updateData, { new: true });
    }

    // Delete obsolete uploaded banner media ONLY after DB save succeeds and URL actually changed
    if (updateData.heroVideoUrl !== undefined && previousHeroVideoUrl !== settings.heroVideoUrl) {
      deleteUploadedFileIfSafe(previousHeroVideoUrl, uploadsDir);
    }
    if (updateData.heroPosterUrl !== undefined && previousHeroPosterUrl !== settings.heroPosterUrl) {
      deleteUploadedFileIfSafe(previousHeroPosterUrl, uploadsDir);
    }

    // Keep Entire Homestay package price synchronized when Full Home tariff changes in Settings
    if (updateData.fullHomePricePerNight !== undefined && Number(settings.fullHomePricePerNight) > 0) {
      const syncedPrice = Number(settings.fullHomePricePerNight);
      await Package.updateMany(
        { slug: { $regex: /entire-homestay|all-5-rooms/i } },
        {
          $set: {
            price: syncedPrice,
            offerPrice: syncedPrice,
            regularPrice: syncedPrice,
            originalPrice: syncedPrice
          }
        }
      );
    }

    await logActivity({
      req,
      action: 'UPDATE_SETTINGS',
      entityType: 'SiteSettings',
      entityId: settings._id,
      details: {
        propertyName: settings.propertyName,
        policyUpdated: policyFieldsTouched,
        heroBannerUpdated: heroBannerTouched
      }
    });

    const responseData = settings.toJSON ? settings.toJSON({ virtuals: true }) : settings;
    responseData.name = settings.propertyName;
    responseData.phone = settings.phones?.[0] || '';
    responseData.whatsapp = settings.whatsappNumber || '';
    responseData.email = settings.email || '';
    responseData.cancellationTiers = normalizeCancellationTiers(settings.cancellationTiers);
    responseData.cancellationSummary = {
      en: formatCancellationSummaryText(responseData, 'en'),
      kn: formatCancellationSummaryText(responseData, 'kn')
    };
    Object.assign(responseData, normalizeHeroBannerSettings(responseData));

    res.status(200).json({ success: true, message: 'Site settings updated', data: responseData });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 11. IMAGE UPLOAD & DELETE
// ==========================================
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file', data: null });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename: req.file.filename,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteImage = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadsDir, safeFilename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Also delete any gallery image matching this filename if present
    await GalleryImage.deleteOne({ url: { $regex: safeFilename } });

    res.status(200).json({ success: true, message: 'Image deleted successfully', data: null });
  } catch (error) {
    next(error);
  }
};

export const uploadHeroBannerMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a video or poster file to upload.',
        data: null
      });
    }

    const kind =
      req.heroMediaKind ||
      (String(req.file.mimetype || '').startsWith('image/') ? 'poster' : 'video');
    const fileUrl = `/uploads/${req.file.filename}`;

    await logActivity({
      req,
      action: 'UPLOAD_HERO_MEDIA',
      entityType: 'SiteSettings',
      details: {
        kind,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });

    res.status(201).json({
      success: true,
      message: kind === 'poster' ? 'Poster image uploaded successfully' : 'Banner video uploaded successfully',
      data: {
        kind,
        filename: req.file.filename,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteHeroBannerMedia = async (req, res, next) => {
  try {
    const safeFilename = path.basename(String(req.params.filename || ''));
    if (!/^hero-(video|poster)-\d+-[a-f0-9]+\.(mp4|webm|jpe?g|png|webp)$/i.test(safeFilename)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid hero banner filename',
        data: null
      });
    }

    const targetUrl = `/uploads/${safeFilename}`;
    const settings = await SiteSettings.findOne();
    if (
      settings &&
      (settings.heroVideoUrl === targetUrl || settings.heroPosterUrl === targetUrl)
    ) {
      return res.status(409).json({
        success: false,
        message: 'Cannot remove hero media that is currently active in saved settings.',
        data: null
      });
    }

    deleteUploadedFileIfSafe(targetUrl, uploadsDir);
    res.status(200).json({
      success: true,
      message: 'Temporary hero banner media discarded',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 12. ACTIVITY / AUDIT LOGS
// ==========================================
export const getActivityLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ success: true, message: 'Activity logs retrieved', data: logs });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 13. INCLUSIONS & EXCLUSIONS MANAGEMENT
// ==========================================
export const getAllInclusionsAdmin = async (req, res, next) => {
  try {
    const items = await InclusionItem.find().sort({ type: 1, displayOrder: 1, createdAt: 1 });
    res.status(200).json({ success: true, message: 'Inclusions retrieved successfully', data: items });
  } catch (error) {
    next(error);
  }
};

export const createInclusionItem = async (req, res, next) => {
  try {
    const { type, title, note, icon, displayOrder, isActive } = req.body;
    if (!type || !title || !title.en) {
      return res.status(400).json({ success: false, message: 'Type and English title are required' });
    }

    let order = displayOrder;
    if (order === undefined || order === null) {
      const highest = await InclusionItem.findOne({ type }).sort({ displayOrder: -1 });
      order = (highest?.displayOrder ?? 0) + 1;
    }

    const newItem = await InclusionItem.create({
      type,
      title: {
        en: (title.en || '').trim(),
        kn: (title.kn || '').trim()
      },
      note: {
        en: (note?.en || '').trim(),
        kn: (note?.kn || '').trim()
      },
      icon: (icon || 'CheckCircle2').trim(),
      displayOrder: order,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      isSample: false
    });

    await logActivity({
      req,
      action: 'CREATE',
      entityType: 'InclusionItem',
      entityId: newItem._id,
      details: { title: newItem.title.en, type: newItem.type }
    });

    res.status(201).json({ success: true, message: 'Inclusion item created successfully', data: newItem });
  } catch (error) {
    next(error);
  }
};

export const updateInclusionItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, title, note, icon, displayOrder, isActive } = req.body;

    const item = await InclusionItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inclusion item not found' });
    }

    if (type) item.type = type;
    if (title) {
      if (title.en !== undefined) item.title.en = title.en.trim();
      if (title.kn !== undefined) item.title.kn = title.kn.trim();
    }
    if (note) {
      if (note.en !== undefined) item.note.en = note.en.trim();
      if (note.kn !== undefined) item.note.kn = note.kn.trim();
    }
    if (icon) item.icon = icon.trim();
    if (displayOrder !== undefined) item.displayOrder = Number(displayOrder);
    if (isActive !== undefined) item.isActive = Boolean(isActive);

    // Saving clears the sample marker
    item.isSample = false;

    await item.save();

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'InclusionItem',
      entityId: item._id,
      details: { title: item.title.en, type: item.type }
    });

    res.status(200).json({ success: true, message: 'Inclusion item updated successfully', data: item });
  } catch (error) {
    next(error);
  }
};

export const deleteInclusionItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await InclusionItem.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inclusion item not found' });
    }

    await logActivity({
      req,
      action: 'DELETE',
      entityType: 'InclusionItem',
      entityId: id,
      details: { title: item.title.en, type: item.type }
    });

    res.status(200).json({ success: true, message: 'Inclusion item deleted successfully', data: null });
  } catch (error) {
    next(error);
  }
};

export const reorderInclusions = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: 'orderedIds array is required' });
    }

    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { displayOrder: index + 1 } }
      }
    }));

    if (bulkOps.length > 0) {
      await InclusionItem.bulkWrite(bulkOps);
    }

    await logActivity({
      req,
      action: 'REORDER',
      entityType: 'InclusionItem',
      details: { count: orderedIds.length }
    });

    const updated = await InclusionItem.find().sort({ type: 1, displayOrder: 1, createdAt: 1 });
    res.status(200).json({ success: true, message: 'Inclusions reordered successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

export const toggleInclusionActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await InclusionItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inclusion item not found' });
    }

    item.isActive = !item.isActive;
    await item.save();

    await logActivity({
      req,
      action: 'TOGGLE_VISIBILITY',
      entityType: 'InclusionItem',
      entityId: item._id,
      details: { title: item.title.en, isActive: item.isActive }
    });

    res.status(200).json({ success: true, message: `Inclusion item ${item.isActive ? 'activated' : 'hidden'}`, data: item });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 14. POLICIES & SAFETY MANAGEMENT (Admin Only Write, Staff Read-Only)
// ==========================================
const touchPoliciesLastUpdated = async () => {
  await SiteSettings.findOneAndUpdate({}, { $set: { policiesLastUpdated: new Date() } });
};

const slugifyPolicyKey = (str) => {
  return String(str || 'section')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `section-${Date.now()}`;
};

export const getAllPoliciesAdmin = async (req, res, next) => {
  try {
    let sections = await PolicySection.find().sort({ page: 1, displayOrder: 1, createdAt: 1 });

    // If PolicySection collection has not been migrated yet, expose defaults in memory with virtual keys
    if (sections.length === 0) {
      sections = DEFAULT_POLICY_SECTIONS;
    }

    const safetyContacts = await SafetyContact.find().sort({ displayOrder: 1, createdAt: 1 });
    const settings = (await SiteSettings.findOne()) || {};

    res.status(200).json({
      success: true,
      message: 'Admin policy data retrieved successfully',
      data: {
        sections,
        safetyContacts,
        policiesLastUpdated: settings.policiesLastUpdated || settings.updatedAt || null
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createPolicySection = async (req, res, next) => {
  try {
    const { page = 'policies', key, title, content, icon = 'FileText', displayOrder, isVisible = true, isSample = false } = req.body;
    if (!['policies', 'refund', 'privacy'].includes(page)) {
      return res.status(400).json({ success: false, message: 'Invalid policy page key' });
    }
    if (!title?.en?.trim() || !content?.en?.trim()) {
      return res.status(400).json({ success: false, message: 'English heading and content are required' });
    }

    let uniqueKey = slugifyPolicyKey(key || title.en);
    const existingWithKey = await PolicySection.findOne({ page, key: uniqueKey });
    if (existingWithKey) {
      uniqueKey = `${uniqueKey}-${Date.now().toString(36).slice(-4)}`;
    }

    let order = displayOrder;
    if (order === undefined || order === null) {
      const highest = await PolicySection.findOne({ page }).sort({ displayOrder: -1 });
      order = (highest?.displayOrder ?? 0) + 1;
    }

    const created = await PolicySection.create({
      page,
      key: uniqueKey,
      title: {
        en: title.en.trim(),
        kn: (title.kn || '').trim()
      },
      content: {
        en: content.en.trim(),
        kn: (content.kn || '').trim()
      },
      icon: String(icon || 'FileText').trim(),
      displayOrder: Number(order) || 1,
      isVisible: Boolean(isVisible),
      isSample: Boolean(isSample)
    });

    await touchPoliciesLastUpdated();

    await logActivity({
      req,
      action: 'CREATE',
      entityType: 'PolicySection',
      entityId: created._id,
      details: { page: created.page, key: created.key, title: created.title.en }
    });

    res.status(201).json({ success: true, message: 'Policy section created successfully', data: created });
  } catch (error) {
    next(error);
  }
};

export const updatePolicySection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, icon, displayOrder, isVisible, isSample } = req.body;

    const section = await PolicySection.findById(id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Policy section not found' });
    }

    if (title) {
      if (title.en !== undefined) section.title.en = String(title.en).trim();
      if (title.kn !== undefined) section.title.kn = String(title.kn).trim();
    }
    if (content) {
      if (content.en !== undefined) section.content.en = String(content.en).trim();
      if (content.kn !== undefined) section.content.kn = String(content.kn).trim();
    }
    if (icon !== undefined) section.icon = String(icon || 'FileText').trim();
    if (displayOrder !== undefined) section.displayOrder = Number(displayOrder);
    if (isVisible !== undefined) section.isVisible = Boolean(isVisible);
    section.isSample = isSample !== undefined ? Boolean(isSample) : false;

    await section.save();
    await touchPoliciesLastUpdated();

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'PolicySection',
      entityId: section._id,
      details: { page: section.page, key: section.key, title: section.title.en, isSample: section.isSample }
    });

    res.status(200).json({ success: true, message: 'Policy section updated successfully', data: section });
  } catch (error) {
    next(error);
  }
};

export const deletePolicySection = async (req, res, next) => {
  try {
    const section = await PolicySection.findByIdAndDelete(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Policy section not found' });
    }

    await touchPoliciesLastUpdated();

    await logActivity({
      req,
      action: 'DELETE',
      entityType: 'PolicySection',
      entityId: section._id,
      details: { page: section.page, key: section.key, title: section.title.en }
    });

    res.status(200).json({ success: true, message: 'Policy section deleted successfully', data: null });
  } catch (error) {
    next(error);
  }
};

export const reorderPolicySections = async (req, res, next) => {
  try {
    const { page, orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: 'orderedIds array is required' });
    }

    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { displayOrder: index + 1 } }
      }
    }));

    if (bulkOps.length > 0) {
      await PolicySection.bulkWrite(bulkOps);
    }

    await touchPoliciesLastUpdated();

    await logActivity({
      req,
      action: 'REORDER',
      entityType: 'PolicySection',
      details: { page: page || 'all', count: orderedIds.length }
    });

    const query = page ? { page } : {};
    const updated = await PolicySection.find(query).sort({ page: 1, displayOrder: 1, createdAt: 1 });
    res.status(200).json({ success: true, message: 'Policy sections reordered', data: updated });
  } catch (error) {
    next(error);
  }
};

export const togglePolicySectionVisibility = async (req, res, next) => {
  try {
    const section = await PolicySection.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Policy section not found' });
    }

    section.isVisible = !section.isVisible;
    await section.save();
    await touchPoliciesLastUpdated();

    await logActivity({
      req,
      action: 'TOGGLE_VISIBILITY',
      entityType: 'PolicySection',
      entityId: section._id,
      details: { page: section.page, key: section.key, isVisible: section.isVisible }
    });

    res.status(200).json({
      success: true,
      message: `Policy section ${section.isVisible ? 'shown' : 'hidden'}`,
      data: section
    });
  } catch (error) {
    next(error);
  }
};

export const getAllSafetyContactsAdmin = async (req, res, next) => {
  try {
    const contacts = await SafetyContact.find().sort({ displayOrder: 1, createdAt: 1 });
    res.status(200).json({ success: true, message: 'Safety contacts retrieved', data: contacts });
  } catch (error) {
    next(error);
  }
};

export const createSafetyContact = async (req, res, next) => {
  try {
    const { category = 'hospital', name, phone = '', distance, notes, displayOrder, isVisible = true } = req.body;
    if (!name?.en?.trim()) {
      return res.status(400).json({ success: false, message: 'Contact name in English is required' });
    }

    let order = displayOrder;
    if (order === undefined || order === null) {
      const highest = await SafetyContact.findOne().sort({ displayOrder: -1 });
      order = (highest?.displayOrder ?? 0) + 1;
    }

    const created = await SafetyContact.create({
      category,
      name: {
        en: name.en.trim(),
        kn: (name.kn || '').trim()
      },
      phone: String(phone || '').trim(),
      distance: {
        en: (distance?.en || '').trim(),
        kn: (distance?.kn || '').trim()
      },
      notes: {
        en: (notes?.en || '').trim(),
        kn: (notes?.kn || '').trim()
      },
      displayOrder: Number(order) || 1,
      isVisible: Boolean(isVisible)
    });

    await touchPoliciesLastUpdated();

    await logActivity({
      req,
      action: 'CREATE',
      entityType: 'SafetyContact',
      entityId: created._id,
      details: { category: created.category, name: created.name.en }
    });

    res.status(201).json({ success: true, message: 'Safety contact created', data: created });
  } catch (error) {
    next(error);
  }
};

export const updateSafetyContact = async (req, res, next) => {
  try {
    const contact = await SafetyContact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Safety contact not found' });
    }

    const { category, name, phone, distance, notes, displayOrder, isVisible } = req.body;
    if (category) contact.category = category;
    if (name) {
      if (name.en !== undefined) contact.name.en = String(name.en).trim();
      if (name.kn !== undefined) contact.name.kn = String(name.kn).trim();
    }
    if (phone !== undefined) contact.phone = String(phone).trim();
    if (distance) {
      if (distance.en !== undefined) contact.distance.en = String(distance.en).trim();
      if (distance.kn !== undefined) contact.distance.kn = String(distance.kn).trim();
    }
    if (notes) {
      if (notes.en !== undefined) contact.notes.en = String(notes.en).trim();
      if (notes.kn !== undefined) contact.notes.kn = String(notes.kn).trim();
    }
    if (displayOrder !== undefined) contact.displayOrder = Number(displayOrder);
    if (isVisible !== undefined) contact.isVisible = Boolean(isVisible);

    await contact.save();
    await touchPoliciesLastUpdated();

    await logActivity({
      req,
      action: 'UPDATE',
      entityType: 'SafetyContact',
      entityId: contact._id,
      details: { category: contact.category, name: contact.name.en }
    });

    res.status(200).json({ success: true, message: 'Safety contact updated', data: contact });
  } catch (error) {
    next(error);
  }
};

export const deleteSafetyContact = async (req, res, next) => {
  try {
    const contact = await SafetyContact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Safety contact not found' });
    }

    await touchPoliciesLastUpdated();

    await logActivity({
      req,
      action: 'DELETE',
      entityType: 'SafetyContact',
      entityId: contact._id,
      details: { category: contact.category, name: contact.name.en }
    });

    res.status(200).json({ success: true, message: 'Safety contact deleted', data: null });
  } catch (error) {
    next(error);
  }
};

export const toggleSafetyContactVisibility = async (req, res, next) => {
  try {
    const contact = await SafetyContact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Safety contact not found' });
    }

    contact.isVisible = !contact.isVisible;
    await contact.save();
    await touchPoliciesLastUpdated();

    res.status(200).json({
      success: true,
      message: `Safety contact ${contact.isVisible ? 'shown' : 'hidden'}`,
      data: contact
    });
  } catch (error) {
    next(error);
  }
};

