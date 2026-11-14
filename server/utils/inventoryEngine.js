import mongoose from 'mongoose';
import { Room } from '../models/Room.js';
import { RoomNight } from '../models/RoomNight.js';
import { BlockedDate } from '../models/BlockedDate.js';
import { Booking } from '../models/Booking.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { Promo } from '../models/Promo.js';
import { Package } from '../models/Package.js';

/**
 * Standardize any date input into a plain calendar day string "YYYY-MM-DD".
 * Avoids any timezone shifting by parsing or extracting plain date components.
 */
export function toDateStr(input) {
  if (!input) return '';
  if (typeof input === 'string') {
    const trimmed = input.trim();
    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  }
  if (input instanceof Date && !isNaN(input.getTime())) {
    return input.toISOString().split('T')[0];
  }
  return '';
}

/**
 * Returns today's calendar date string ("YYYY-MM-DD") in IST (UTC+5:30).
 */
export function getTodayISTStr() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istDate = new Date(utcMs + 5.5 * 3600000);
  const y = istDate.getFullYear();
  const m = String(istDate.getMonth() + 1).padStart(2, '0');
  const d = String(istDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Computes a map of occupied unit counts directly from active holding Booking documents:
 * Map<roomIdStr, Map<nightStr, bookedUnits>>.
 * Ensures public availability never misses an active guest/manual booking even if RoomNight fell out of sync.
 */
export async function getActiveBookingOccupancyMap({
  fromDate = null,
  toDate = null,
  targetNights = null,
  allRooms = null,
  excludeBookingId = null,
  session = null
} = {}) {
  const roomsList = Array.isArray(allRooms) && allRooms.length > 0
    ? allRooms
    : await Room.find({ isActive: true }).session(session || null);

  const now = new Date();
  const holdValidityCondition = {
    $or: [
      { status: { $ne: 'payment_pending' } },
      { holdExpiresAt: null },
      { holdExpiresAt: { $gt: now } }
    ]
  };

  const andConditions = [holdValidityCondition];

  if (Array.isArray(targetNights) && targetNights.length > 0) {
    const sorted = [...targetNights].sort();
    const minDate = new Date(`${addDays(sorted[0], -2)}T00:00:00Z`);
    const maxDate = new Date(`${addDays(sorted[sorted.length - 1], 2)}T23:59:59Z`);
    andConditions.push({
      $or: [
        { nights: { $in: sorted } },
        { checkIn: { $lt: maxDate }, checkOut: { $gt: minDate } }
      ]
    });
  } else if (fromDate && toDate) {
    const minDate = new Date(`${addDays(fromDate, -2)}T00:00:00Z`);
    const maxDate = new Date(`${addDays(toDate, 2)}T23:59:59Z`);
    andConditions.push({
      checkIn: { $lt: maxDate },
      checkOut: { $gt: minDate }
    });
  }

  const activeQuery = {
    status: { $in: ['payment_pending', 'paid_awaiting_confirmation', 'confirmed', 'checked_in'] },
    $and: andConditions
  };
  if (excludeBookingId) {
    activeQuery._id = { $ne: excludeBookingId };
  }

  const activeBookings = await Booking.find(activeQuery).session(session || null);
  const nightFilterSet = Array.isArray(targetNights) && targetNights.length > 0 ? new Set(targetNights) : null;
  const occupancyMap = new Map();

  const addOccupancy = (rId, nightStr, units) => {
    const key = String(rId);
    let inner = occupancyMap.get(key);
    if (!inner) {
      inner = new Map();
      occupancyMap.set(key, inner);
    }
    inner.set(nightStr, (inner.get(nightStr) || 0) + units);
  };

  const resolveRoomDoc = (lineOrBooking) => {
    const rId = String(lineOrBooking?.room?._id || lineOrBooking?.room || lineOrBooking?.roomId || '');
    const rSlug = String(lineOrBooking?.roomSlug || lineOrBooking?.slug || '').toLowerCase();
    const rName = String(lineOrBooking?.roomName || '').toLowerCase();
    return (
      roomsList.find((r) => String(r._id) === rId) ||
      (rSlug ? roomsList.find((r) => String(r.slug).toLowerCase() === rSlug) : null) ||
      (rName ? roomsList.find((r) => String(r.name).toLowerCase() === rName) : null)
    );
  };

  for (const b of activeBookings) {
    let bNights = Array.isArray(b.nights) && b.nights.length > 0
      ? b.nights.map(toDateStr).filter(Boolean)
      : generateNightsArray(b.checkIn, b.checkOut);

    if (nightFilterSet) {
      bNights = bNights.filter((n) => nightFilterSet.has(n));
    } else if (fromDate && toDate) {
      bNights = bNights.filter((n) => n >= fromDate && n <= toDate);
    }
    if (bNights.length === 0) continue;

    if (b.bookingType === 'full_home' || b.roomSlug === 'full-home') {
      for (const r of roomsList) {
        const units = Number(r.totalUnits) || 1;
        for (const night of bNights) {
          addOccupancy(r._id, night, units);
        }
      }
      continue;
    }

    const lines = Array.isArray(b.lines) && b.lines.length > 0 ? b.lines : [b];
    for (const line of lines) {
      const matchedRoom = resolveRoomDoc(line) || resolveRoomDoc(b);
      if (!matchedRoom) continue;
      const qty = Number(line.quantity) || 1;
      for (const night of bNights) {
        addOccupancy(matchedRoom._id, night, qty);
      }
    }
  }

  return occupancyMap;
}

/**
 * Combines RoomNight booked counter with live active Booking occupancy count.
 */
export function getEffectiveBookedCount({ roomId, nightStr, rnBooked = 0, bookingOccupancyMap = null }) {
  const fromBookings = bookingOccupancyMap?.get(String(roomId))?.get(nightStr) || 0;
  return Math.max(Number(rnBooked) || 0, Number(fromBookings) || 0);
}

/**
 * Generates an array of occupied night strings ("YYYY-MM-DD") between check-in and check-out.
 * Stay from 2026-12-10 to 2026-12-12 occupies nights ['2026-12-10', '2026-12-11'].
 * Check-out day stays free for the next arriving guest.
 */
export function generateNightsArray(checkIn, checkOut) {
  const inStr = toDateStr(checkIn);
  const outStr = toDateStr(checkOut);
  if (!inStr || !outStr || inStr >= outStr) return [];

  const nights = [];
  const [y, m, d] = inStr.split('-').map(Number);
  let cur = new Date(Date.UTC(y, m - 1, d));

  const [ey, em, ed] = outStr.split('-').map(Number);
  const end = new Date(Date.UTC(ey, em - 1, ed));

  while (cur < end) {
    const yStr = cur.getUTCFullYear();
    const mStr = String(cur.getUTCMonth() + 1).padStart(2, '0');
    const dStr = String(cur.getUTCDate()).padStart(2, '0');
    nights.push(`${yStr}-${mStr}-${dStr}`);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  return nights;
}

/**
 * Adds days to a calendar date string "YYYY-MM-DD" in a timezone-neutral way.
 */
export function addDays(dateStr, days) {
  const [y, m, d] = toDateStr(dateStr).split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yStr = dt.getUTCFullYear();
  const mStr = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dStr = String(dt.getUTCDate()).padStart(2, '0');
  return `${yStr}-${mStr}-${dStr}`;
}

/**
 * Checks whether a given calendar night is covered by a BlockedDate record.
 */
export function isNightBlocked(nightStr, targetRoomIdOrSlug, blockedList) {
  const night = toDateStr(nightStr);
  const target = targetRoomIdOrSlug ? String(targetRoomIdOrSlug) : 'all';

  return blockedList.some((b) => {
    const bRoom = String(b.room || b.roomId || 'all');
    const matchesRoom = bRoom === 'all' || target === 'all' || bRoom === target;
    if (!matchesRoom) return false;

    const bStart = toDateStr(b.startDate || b.date);
    const bEnd = toDateStr(b.endDate || b.date || bStart);

    if (bStart === bEnd) {
      return night === bStart;
    }
    // Stay semantics: bStart <= night < bEnd
    return night >= bStart && night < bEnd;
  });
}

/**
 * Execute an operation inside a MongoDB transaction, with graceful fallback
 * when connected to a standalone MongoDB instance that lacks replica set transaction support.
 */
export async function withTransaction(callback) {
  let session = null;
  try {
    session = await mongoose.startSession();
    const topologyType = mongoose.connection?.client?.topology?.description?.type;
    const isReplicaSet = topologyType && topologyType !== 'Single';

    if (isReplicaSet) {
      let result;
      await session.withTransaction(async () => {
        result = await callback(session);
      });
      return result;
    } else {
      // Standalone dev/test mode without replica set
      return await callback(session);
    }
  } catch (err) {
    if (err.message && err.message.includes('replica set')) {
      console.warn('⚠️ Replica set transactions not supported by local test instance, executing non-transactionally:', err.message);
      return await callback(null);
    }
    throw err;
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch (_) {}
    }
  }
}

/**
 * Ensures a RoomNight document exists for (room, date) with booked = 0.
 * Safely handles concurrent insertion races (E11000 duplicate key error).
 */
async function ensureRoomNightDoc(roomId, nightStr, session) {
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const existing = await RoomNight.findOne({ room: roomId, date: nightStr }).session(session || null);
      if (existing) return existing;

      const docs = await RoomNight.create(
        [{ room: roomId, date: nightStr, booked: 0 }],
        session ? { session } : {}
      );
      return docs[0];
    } catch (err) {
      if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
        const existing = await RoomNight.findOne({ room: roomId, date: nightStr }).session(session || null);
        if (existing) return existing;
      } else {
        throw err;
      }
    }
  }
  return await RoomNight.findOne({ room: roomId, date: nightStr }).session(session || null);
}

/**
 * Finds the nearest available check-in dates for a single room type when a stay is full or blocked.
 */
export async function findNearestAvailableDates(roomDoc, requestedCheckIn, stayNightsCount = 1) {
  const allBlocked = await BlockedDate.find();
  const todayStr = getTodayISTStr();
  let candidate = requestedCheckIn > todayStr ? requestedCheckIn : todayStr;
  const totalUnits = Number(roomDoc.totalUnits) || 1;

  const scanStart = addDays(candidate, 1);
  const scanEnd = addDays(candidate, 60 + stayNightsCount);
  const [roomNights, occupancyMap] = await Promise.all([
    RoomNight.find({ room: roomDoc._id, date: { $gte: scanStart, $lte: scanEnd } }),
    getActiveBookingOccupancyMap({ fromDate: scanStart, toDate: scanEnd, allRooms: [roomDoc] })
  ]);
  const rnMap = new Map(roomNights.map((rn) => [rn.date, rn.booked || 0]));

  for (let offset = 1; offset <= 60; offset++) {
    const nextCheckIn = addDays(candidate, offset);
    const nextNights = [];
    for (let i = 0; i < stayNightsCount; i++) {
      nextNights.push(addDays(nextCheckIn, i));
    }

    let allFit = true;
    for (const night of nextNights) {
      if (
        isNightBlocked(night, roomDoc._id, allBlocked) ||
        isNightBlocked(night, roomDoc.slug, allBlocked) ||
        isNightBlocked(night, 'all', allBlocked)
      ) {
        allFit = false;
        break;
      }
      const booked = getEffectiveBookedCount({
        roomId: roomDoc._id,
        nightStr: night,
        rnBooked: rnMap.get(night) || 0,
        bookingOccupancyMap: occupancyMap
      });
      if (booked >= totalUnits) {
        allFit = false;
        break;
      }
    }

    if (allFit) {
      const nextCheckOut = addDays(nextCheckIn, stayNightsCount);
      return { checkIn: nextCheckIn, checkOut: nextCheckOut };
    }
  }

  return null;
}

/**
 * Calculates guest limits for Full Home booking from active Room records.
 * Sums maxAdults * totalUnits and maxChildren * totalUnits across all room types.
 */
export function calculateFullHomeLimits(allRooms) {
  let maxAdults = 0;
  let maxChildren = 0;
  let totalRooms = 0;

  for (const r of allRooms) {
    const units = Number(r.totalUnits) || 1;
    const isSingle = (r.slug || '').includes('single');
    const isSuite = (r.slug || '').includes('suite');
    const rAdults = Number(r.maxAdults) || 2;
    const rChildren = r.maxChildren !== undefined
      ? Number(r.maxChildren)
      : (isSingle ? 0 : (isSuite ? 2 : 1));

    maxAdults += rAdults * units;
    maxChildren += rChildren * units;
    totalRooms += units;
  }

  return {
    maxAdults: maxAdults || 10,
    maxChildren: maxChildren || 6,
    totalRooms: totalRooms || 5
  };
}

/**
 * Finds the nearest available check-in dates for Full Home when requested stay is full or blocked.
 * Requires ALL room types to be completely unblocked and have booked === 0 for all nights.
 */
export async function findNearestAvailableDatesFullHome(requestedCheckIn, stayNightsCount = 1) {
  const allBlocked = await BlockedDate.find();
  const allRooms = await Room.find({ isActive: true });
  const todayStr = getTodayISTStr();
  let candidate = requestedCheckIn > todayStr ? requestedCheckIn : todayStr;

  const scanStart = addDays(candidate, 1);
  const scanEnd = addDays(candidate, 60 + stayNightsCount);
  const [roomNights, occupancyMap] = await Promise.all([
    RoomNight.find({ room: { $in: allRooms.map((r) => r._id) }, date: { $gte: scanStart, $lte: scanEnd } }),
    getActiveBookingOccupancyMap({ fromDate: scanStart, toDate: scanEnd, allRooms })
  ]);
  const rnLookup = new Map();
  for (const rn of roomNights) {
    rnLookup.set(`${String(rn.room)}|${rn.date}`, rn.booked || 0);
  }

  for (let offset = 1; offset <= 60; offset++) {
    const nextCheckIn = addDays(candidate, offset);
    const nextNights = [];
    for (let i = 0; i < stayNightsCount; i++) {
      nextNights.push(addDays(nextCheckIn, i));
    }

    let allFit = true;
    for (const night of nextNights) {
      for (const r of allRooms) {
        if (
          isNightBlocked(night, r._id, allBlocked) ||
          isNightBlocked(night, r.slug, allBlocked) ||
          isNightBlocked(night, 'all', allBlocked)
        ) {
          allFit = false;
          break;
        }
        const booked = getEffectiveBookedCount({
          roomId: r._id,
          nightStr: night,
          rnBooked: rnLookup.get(`${String(r._id)}|${night}`) || 0,
          bookingOccupancyMap: occupancyMap
        });
        if (booked > 0) {
          allFit = false;
          break;
        }
      }
      if (!allFit) break;
    }

    if (allFit) {
      const nextCheckOut = addDays(nextCheckIn, stayNightsCount);
      return { checkIn: nextCheckIn, checkOut: nextCheckOut };
    }
  }

  return null;
}

/**
 * ATOMIC BOOKING: Increments booked inventory inside a MongoDB transaction session.
 * Supports both bookingType: "room" and "full_home".
 * 
 * - For "full_home":
 *   Atomically increments booked by each room's totalUnits for every night, for all room types.
 *   Allowed ONLY if every room type has ZERO bookings (booked: 0) and NO block on that night.
 *   If any night fails for any room, aborts the whole transaction and returns nearest available Full Home dates.
 * 
 * - For "room":
 *   Atomically increments booked by 1 for the room for each night (booked <= totalUnits - 1).
 *   Aborts if night is full or blocked.
 */
export async function bookInventoryAtomic({ bookingType = 'room', roomDoc, lines, nights, session, excludeBookingId = null }) {
  if (!nights || nights.length === 0) {
    throw new Error('At least one night is required for booking');
  }

  const allBlocked = await BlockedDate.find().session(session || null);
  const allRooms = await Room.find({ isActive: true }).session(session || null);
  const occupancyMap = await getActiveBookingOccupancyMap({
    targetNights: nights,
    allRooms,
    excludeBookingId,
    session
  });

  // 1. FULL HOME ATOMIC BOOKING (reserves all active rooms in ONE transaction)
  if (bookingType === 'full_home') {
    if (!allRooms || allRooms.length === 0) {
      throw new Error('No active rooms found for Full Home reservation');
    }

    for (const night of nights) {
      // Check if any room or the whole property is blocked
      for (const r of allRooms) {
        if (
          isNightBlocked(night, r._id, allBlocked) ||
          isNightBlocked(night, r.slug, allBlocked) ||
          isNightBlocked(night, 'all', allBlocked)
        ) {
          const nearest = await findNearestAvailableDatesFullHome(nights[0], nights.length);
          const suggestion = nearest
            ? ` Nearest available dates for Full Home: ${nearest.checkIn} to ${nearest.checkOut}.`
            : '';
          const blockedName = isNightBlocked(night, 'all', allBlocked) ? 'All rooms' : r.name;
          const err = new Error(
            `Date ${night} is blocked for maintenance (${blockedName}).${suggestion}`
          );
          err.status = 409;
          err.night = night;
          err.room = blockedName;
          err.nearest = nearest;
          throw err;
        }
      }

      // Atomically check booked === 0 and increment by room.totalUnits for each room
      for (const r of allRooms) {
        const totalUnits = Number(r.totalUnits) || 1;
        const rnDoc = await ensureRoomNightDoc(r._id, night, session);
        const activeBooked = occupancyMap.get(String(r._id))?.get(night) || 0;
        if (rnDoc && (rnDoc.booked || 0) < activeBooked) {
          await RoomNight.updateOne(
            { _id: rnDoc._id, booked: { $lt: activeBooked } },
            { $set: { booked: activeBooked } },
            session ? { session } : {}
          );
        }

        const updateResult = await RoomNight.findOneAndUpdate(
          {
            room: r._id,
            date: night,
            booked: 0 // Allowed only if every room type has ZERO bookings!
          },
          {
            $inc: { booked: totalUnits }
          },
          {
            new: true,
            session: session || null
          }
        );

        if (!updateResult) {
          const nearest = await findNearestAvailableDatesFullHome(nights[0], nights.length);
          const suggestion = nearest
            ? ` Nearest available dates for Full Home: ${nearest.checkIn} to ${nearest.checkOut}.`
            : '';
          const err = new Error(
            `Full Home is not available on night ${night} because one or more rooms are already booked.${suggestion}`
          );
          err.status = 409;
          err.night = night;
          err.nearest = nearest;
          throw err;
        }
      }
    }

    return true;
  }

  // 2. SINGLE ROOM ATOMIC BOOKING (bookingType === 'room')
  let targetDoc = roomDoc;
  if (!targetDoc && Array.isArray(lines) && lines.length > 0) {
    targetDoc = lines[0].roomDoc;
    if (!targetDoc) {
      const rId = lines[0].roomId || lines[0].room;
      if (rId && mongoose.Types.ObjectId.isValid(rId)) {
        targetDoc = await Room.findById(rId).session(session || null);
      } else if (rId) {
        targetDoc = await Room.findOne({ slug: rId }).session(session || null);
      }
    }
  }

  if (!targetDoc) {
    throw new Error('A valid room must be selected');
  }

  const roomId = targetDoc._id;
  const roomName = targetDoc.name || 'Room';
  const totalUnits = Number(targetDoc.totalUnits) || 1;

  for (const night of nights) {
    // Check if date is blocked by admin maintenance hold
    if (
      isNightBlocked(night, roomId, allBlocked) ||
      isNightBlocked(night, targetDoc.slug, allBlocked) ||
      isNightBlocked(night, 'all', allBlocked)
    ) {
      const nearest = await findNearestAvailableDates(targetDoc, nights[0], nights.length);
      const suggestion = nearest
        ? ` Nearest available dates for ${roomName}: ${nearest.checkIn} to ${nearest.checkOut}.`
        : '';
      const err = new Error(
        `Date ${night} is blocked for maintenance for ${roomName}.${suggestion}`
      );
      err.status = 409;
      err.night = night;
      err.room = roomName;
      err.nearest = nearest;
      throw err;
    }

    // Ensure RoomNight document exists and reflects any active Booking occupancy
    const rnDoc = await ensureRoomNightDoc(roomId, night, session);
    const activeBooked = occupancyMap.get(String(roomId))?.get(night) || 0;
    if (rnDoc && (rnDoc.booked || 0) < activeBooked) {
      await RoomNight.updateOne(
        { _id: rnDoc._id, booked: { $lt: activeBooked } },
        { $set: { booked: activeBooked } },
        session ? { session } : {}
      );
    }

    // Atomic conditional update: booked + 1 <= totalUnits (quantity is strictly 1)
    const updateResult = await RoomNight.findOneAndUpdate(
      {
        room: roomId,
        date: night,
        booked: { $lte: totalUnits - 1 }
      },
      {
        $inc: { booked: 1 }
      },
      {
        new: true,
        session: session || null
      }
    );

    // If updateResult is null, the room type is fully booked on this night
    if (!updateResult) {
      const nearest = await findNearestAvailableDates(targetDoc, nights[0], nights.length);
      const suggestion = nearest
        ? ` Nearest available dates for ${roomName}: ${nearest.checkIn} to ${nearest.checkOut}.`
        : '';

      const err = new Error(
        `Sorry, ${roomName} is fully booked on night ${night} (all ${totalUnits} unit(s) occupied).${suggestion}`
      );
      err.status = 409;
      err.night = night;
      err.room = roomName;
      err.available = 0;
      err.nearest = nearest;
      throw err;
    }
  }

  return true;
}

/**
 * RELEASING INVENTORY: Atomically decrements booked counts inside a transaction.
 * Supports both single room and Full Home (releases all room counts), never going below zero.
 */
export async function releaseInventoryAtomic({ booking, bookingType = 'room', roomId, roomDoc, lines, nights, session }) {
  if (!nights || nights.length === 0) {
    return true;
  }

  const bType = booking?.bookingType || bookingType;
  const bLines = (booking && booking.lines && booking.lines.length > 0)
    ? booking.lines
    : (Array.isArray(lines) && lines.length > 0 ? lines : null);

  if (bType === 'full_home') {
    let targetRooms = bLines;
    if (!targetRooms || targetRooms.length === 0) {
      const allRooms = await Room.find({ isActive: true }).session(session || null);
      targetRooms = allRooms.map((r) => ({
        room: r._id,
        quantity: Number(r.totalUnits) || 1
      }));
    }

    for (const line of targetRooms) {
      const targetId = line.room?._id || line.room;
      const qty = Number(line.quantity) || 1;

      for (const night of nights) {
        const doc = await RoomNight.findOne({ room: targetId, date: night }).session(session || null);
        if (doc) {
          const newBooked = Math.max(0, (doc.booked || 0) - qty);
          await RoomNight.updateOne(
            { _id: doc._id },
            { $set: { booked: newBooked } },
            session ? { session } : {}
          );
        }
      }
    }

    return true;
  }

  // Single room release
  let targetId = roomId?._id || roomId || roomDoc?._id;
  if (!targetId && bLines && bLines.length > 0) {
    targetId = bLines[0].room?._id || bLines[0].room || bLines[0].roomId;
  }

  if (!targetId) {
    return true;
  }

  for (const night of nights) {
    const doc = await RoomNight.findOne({ room: targetId, date: night }).session(session || null);
    if (doc) {
      const newBooked = Math.max(0, (doc.booked || 0) - 1);
      await RoomNight.updateOne(
        { _id: doc._id },
        { $set: { booked: newBooked } },
        session ? { session } : {}
      );
    }
  }

  return true;
}

/**
 * EXPIRY CLEANUP: Background worker & read-time check that marks expired holds as 'expired'
 * and releases their held room inventory inside a transaction.
 */
export async function expireStaleHolds() {
  const now = new Date();
  const staleHolds = await Booking.find({
    status: 'payment_pending',
    holdExpiresAt: { $ne: null, $lte: now }
  });

  if (!staleHolds.length) return 0;

  let expiredCount = 0;
  for (const booking of staleHolds) {
    try {
      await withTransaction(async (session) => {
        const roomId = booking.room;
        const nights = booking.nights || [];

        await releaseInventoryAtomic({
          booking,
          bookingType: booking.bookingType || 'room',
          roomId,
          lines: booking.lines,
          nights,
          session
        });

        booking.status = 'expired';
        booking.statusHistory = booking.statusHistory || [];
        booking.statusHistory.push({
          who: 'system',
          when: new Date(),
          reason: '15-minute payment hold expired without confirmation',
          status: 'expired'
        });

        await booking.save({ session: session || null });
      });
      expiredCount++;
    } catch (err) {
      console.error(`Error releasing expired hold for ${booking.bookingCode}:`, err.message);
    }
  }

  return expiredCount;
}

/**
 * Evaluates booking stay rules and guest capacity.
 * Supports both bookingType: "room" (against that ONE room only) and "full_home" (against all rooms).
 * Capacity rules for room:
 * - Standard Room: 2 adults + 1 child
 * - Suite Room: 2 adults + 2 children
 * - Single Room: 2 adults and 0 children
 * Full Home rules:
 * - Checks fullHomeMinNights and fullHomeEnabled
 * - Capacity: sum of all rooms' maxAdults and maxChildren
 */
export async function validateStayRules(checkInStr, checkOutStr, guestAdults = 2, guestChildren = 0, roomDoc = null, bookingType = 'room', allowSameDay = false) {
  // Handle options object as first parameter if provided
  if (typeof checkInStr === 'object' && checkInStr !== null) {
    const opts = checkInStr;
    checkInStr = opts.checkIn || (Array.isArray(opts.nights) && opts.nights.length > 0 ? opts.nights[0] : undefined);
    checkOutStr = opts.checkOut || (Array.isArray(opts.nights) && opts.nights.length > 0 ? addDays(opts.nights[opts.nights.length - 1], 1) : undefined);
    guestAdults = opts.adults ?? opts.guestAdults ?? 2;
    guestChildren = opts.children ?? opts.guestChildren ?? 0;
    roomDoc = opts.roomDoc ?? opts.room;
    bookingType = opts.bookingType || 'room';
    allowSameDay = Boolean(opts.allowSameDay);
  }

  const settings = await SiteSettings.findOne() || {};
  const maxAdvanceDays = Number(settings.maxAdvanceDays) || 365;

  const nights = generateNightsArray(checkInStr, checkOutStr);
  if (nights.length === 0) {
    const err = new Error('Check-out date must be at least one day after check-in date');
    err.status = 400;
    throw err;
  }

  // 1. Min Nights check
  const minNights = bookingType === 'full_home'
    ? (Number(settings.fullHomeMinNights) || 1)
    : (Number(settings.minNights) || 1);

  if (nights.length < minNights) {
    const prefix = bookingType === 'full_home' ? 'Full Home' : 'Homestay';
    const err = new Error(`Minimum stay length for ${prefix} is ${minNights} night(s). You selected ${nights.length} night(s).`);
    err.status = 400;
    throw err;
  }

  // 2. Max Advance Days check
  const todayStr = getTodayISTStr();
  const maxAllowedDate = addDays(todayStr, maxAdvanceDays);
  if (checkInStr > maxAllowedDate) {
    const err = new Error(`Bookings can only be made up to ${maxAdvanceDays} days in advance (until ${maxAllowedDate}).`);
    err.status = 400;
    throw err;
  }

  // 3. Past Date and Same-Day Check-In Rule (earliest public check-in is tomorrow)
  if (checkInStr < todayStr) {
    const err = new Error('Check-in date cannot be in the past');
    err.status = 400;
    throw err;
  }

  if (checkInStr === todayStr && !allowSameDay) {
    const err = new Error('Same-day bookings are not available. Earliest available check-in date is tomorrow.');
    err.status = 400;
    throw err;
  }

  // 4. Capacity and booking type specific checks
  if (bookingType === 'full_home') {
    if (settings.fullHomeEnabled === false) {
      const err = new Error('Full Home bookings are currently disabled');
      err.status = 400;
      throw err;
    }

    const allRooms = await Room.find({ isActive: true });
    const fullHomeLimits = calculateFullHomeLimits(allRooms);

    if (guestAdults > fullHomeLimits.maxAdults) {
      const err = new Error(
        `Guest capacity exceeded: Full Home accommodates a maximum of ${fullHomeLimits.maxAdults} adults (you requested ${guestAdults}).`
      );
      err.status = 400;
      throw err;
    }

    if (guestChildren > fullHomeLimits.maxChildren) {
      const err = new Error(
        `Guest capacity exceeded: Full Home accommodates a maximum of ${fullHomeLimits.maxChildren} child(ren) (you requested ${guestChildren}).`
      );
      err.status = 400;
      throw err;
    }

    return { nights, settings, limits: fullHomeLimits, allRooms };
  }

  // Per-room capacity check against that ONE room only
  let targetDoc = roomDoc;
  if (Array.isArray(roomDoc) && roomDoc.length > 0) {
    targetDoc = roomDoc[0].roomDoc || roomDoc[0];
  }
  if (!targetDoc) {
    const err = new Error('A room must be selected');
    err.status = 400;
    throw err;
  }

  const maxAdults = Number(targetDoc.maxAdults) || 2;
  const maxChildren = targetDoc.maxChildren !== undefined ? Number(targetDoc.maxChildren) : 1;
  const roomName = targetDoc.name || 'Room';

  if (guestAdults > maxAdults) {
    const err = new Error(
      `Guest capacity exceeded: ${roomName} accommodates a maximum of ${maxAdults} adults (you requested ${guestAdults}). Each booking is for exactly one room.`
    );
    err.status = 400;
    throw err;
  }

  if (guestChildren > maxChildren) {
    const err = new Error(
      maxChildren === 0
        ? `Guest capacity exceeded: ${roomName} does not accommodate children (you requested ${guestChildren}). Please select a Standard Room or Suite Room.`
        : `Guest capacity exceeded: ${roomName} accommodates a maximum of ${maxChildren} child(ren) (you requested ${guestChildren}).`
    );
    err.status = 400;
    throw err;
  }

  return { nights, settings };
}

/**
 * Calculates a verified booking quote from server database records.
 * Supports both bookingType: "room" (single room) and "full_home".
 * Never trusts prices or calculations sent by the client.
 */
/**
 * Checks whether a calendar night string (YYYY-MM-DD) falls on Friday (5) or Saturday (6) nights.
 */
export function isWeekendNight(nightStr) {
  const clean = toDateStr(nightStr);
  if (!clean) return false;
  const [y, m, d] = clean.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay();
  return dow === 5 || dow === 6;
}

/**
 * Look up an active package by exact slug or known alias (e.g. entire-homestay -> entire-homestay-5-rooms).
 */
export async function findActivePackage(packageSlug) {
  if (!packageSlug || typeof packageSlug !== 'string') return null;
  const clean = packageSlug.trim().toLowerCase();
  if (!clean) return null;

  let pkg = await Package.findOne({ slug: clean, isActive: { $ne: false } });
  if (!pkg && (clean.includes('entire-homestay') || clean.includes('all-5-rooms'))) {
    pkg = await Package.findOne({
      slug: { $regex: /entire-homestay|all-5-rooms/i },
      isActive: { $ne: false }
    });
  }
  return pkg;
}

/**
 * Resolve canonical Full Home nightly rate across SiteSettings and Entire Homestay Package.
 * Whichever record was updated most recently (or SiteSettings when untouched) takes precedence.
 */
export async function resolveFullHomeRate(siteSettings, explicitEntirePkg = null) {
  const entirePkg = explicitEntirePkg || (await Package.findOne({
    slug: { $regex: /entire-homestay|all-5-rooms/i },
    isActive: { $ne: false }
  }));

  const settingsPrice = Number(siteSettings?.fullHomePricePerNight) || 35000;
  const pkgPrice = Number(entirePkg?.price ?? entirePkg?.offerPrice ?? 0);

  if (pkgPrice > 0) {
    const pkgTime = entirePkg?.updatedAt ? new Date(entirePkg.updatedAt).getTime() : 0;
    const settingsTime = siteSettings?.updatedAt ? new Date(siteSettings.updatedAt).getTime() : 0;
    if (pkgTime > settingsTime || settingsPrice === 35000) {
      return { pricePerNight: pkgPrice, packageDoc: entirePkg };
    }
  }

  return { pricePerNight: settingsPrice, packageDoc: entirePkg };
}

export async function calculateServerQuote({
  bookingType = 'room',
  roomDoc,
  targetLines,
  checkIn,
  checkOut,
  promoCode,
  advanceOption,
  packageSlug = ''
}) {
  await expireStaleHolds();

  const inStr = toDateStr(checkIn);
  const outStr = toDateStr(checkOut);
  const nights = generateNightsArray(inStr, outStr);

  if (nights.length === 0) {
    const err = new Error('Invalid dates: check-out must be after check-in');
    err.status = 400;
    throw err;
  }

  const siteSettings = await SiteSettings.findOne() || {};
  const taxPercent = Number(siteSettings.taxPercent) || 0;
  const validAdvanceOptions = siteSettings.advanceOptions?.length ? siteSettings.advanceOptions : [20, 50, 100];
  const matchedPackage = await findActivePackage(packageSlug);

  // 1. FULL HOME QUOTE
  if (bookingType === 'full_home') {
    if (siteSettings.fullHomeEnabled === false) {
      const err = new Error('Full Home bookings are currently disabled');
      err.status = 400;
      throw err;
    }

    const { pricePerNight, packageDoc: entirePkg } = await resolveFullHomeRate(
      siteSettings,
      matchedPackage && (matchedPackage.slug.includes('entire') || matchedPackage.slug.includes('all-5-rooms'))
        ? matchedPackage
        : null
    );
    const baseAmount = pricePerNight * nights.length;
    const subTotal = baseAmount;

    // Validate Promo Code
    let discount = 0;
    let appliedPromo = null;

    if (promoCode && promoCode.trim()) {
      const cleanCode = promoCode.trim().toUpperCase();
      const promo = await Promo.findOne({ code: cleanCode, isActive: true });
      if (promo) {
        const now = new Date();
        const isValidDate = (!promo.validFrom || now >= promo.validFrom) && (!promo.validTo || now <= promo.validTo);
        const isValidNights = !promo.minNights || nights.length >= promo.minNights;
        const isValidLimit = promo.usageLimit == null || promo.usedCount < promo.usageLimit;

        if (isValidDate && isValidNights && isValidLimit) {
          appliedPromo = promo;
          if (promo.type === 'percent') {
            discount = Math.round((subTotal * promo.value) / 100);
          } else {
            discount = Math.min(subTotal, promo.value);
          }
        }
      }
    }

    const discountedSubtotal = Math.max(0, subTotal - discount);
    const taxAmount = taxPercent > 0 ? Math.round((discountedSubtotal * taxPercent) / 100) : 0;
    const total = discountedSubtotal + taxAmount;

    const chosenAdvance = Number(advanceOption) || 20;
    const validAdvance = validAdvanceOptions.includes(chosenAdvance) ? chosenAdvance : 20;
    const advancePaid = Math.round((total * validAdvance) / 100);
    const balanceDue = total - advancePaid;

    const allRooms = await Room.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    const fullHomeLines = allRooms.map((r) => ({
      room: r._id,
      roomName: r.name,
      roomSlug: r.slug,
      quantity: Number(r.totalUnits) || 1,
      pricePerNight: Number(r.pricePerNight) || 0
    }));
    const totalUnitsCount = fullHomeLines.reduce((sum, l) => sum + l.quantity, 0);

    return {
      bookingType: 'full_home',
      room: {
        id: null,
        name: 'Full Home (All 5 Rooms)',
        slug: 'full-home',
        pricePerNight,
        quantity: totalUnitsCount
      },
      lines: fullHomeLines,
      mealsNote: siteSettings.fullHomeMealsNote || 'Morning breakfast included',
      appliedPackage: entirePkg ? {
        slug: entirePkg.slug,
        title: entirePkg.title,
        price: pricePerNight
      } : null,
      nights,
      nightsCount: nights.length,
      weekdayNights: nights.filter((n) => !isWeekendNight(n)).length,
      weekendNights: nights.filter((n) => isWeekendNight(n)).length,
      pricing: {
        baseAmount,
        discount,
        subTotal: discountedSubtotal,
        taxPercent,
        taxAmount,
        total
      },
      advanceOptions: validAdvanceOptions,
      selectedAdvanceOption: validAdvance,
      advanceAmount: advancePaid,
      balanceDue,
      promo: appliedPromo ? { code: appliedPromo.code, discount } : null
    };
  }

  // 2. SINGLE ROOM QUOTE
  let targetRoomDoc = roomDoc;
  if (!targetRoomDoc && Array.isArray(targetLines) && targetLines.length > 0) {
    targetRoomDoc = targetLines[0].roomDoc || targetLines[0];
  }

  if (!targetRoomDoc) {
    const err = new Error('A room must be selected for the quote');
    err.status = 400;
    throw err;
  }

  const weekdayPrice = Number(targetRoomDoc.pricePerNight) || 0;
  const weekendPrice = Number(targetRoomDoc.weekendPrice) > 0 ? Number(targetRoomDoc.weekendPrice) : weekdayPrice;
  const weekdayNightsCount = nights.filter((n) => !isWeekendNight(n)).length;
  const weekendNightsCount = nights.length - weekdayNightsCount;

  const isRoomPackageOverride = Boolean(
    matchedPackage &&
    !matchedPackage.slug.includes('entire') &&
    !matchedPackage.slug.includes('all-5-rooms') &&
    Number(matchedPackage.price ?? matchedPackage.offerPrice ?? 0) > 0
  );

  const packageRate = isRoomPackageOverride
    ? Number(matchedPackage.price ?? matchedPackage.offerPrice)
    : null;

  const baseAmount = isRoomPackageOverride
    ? packageRate * nights.length
    : (weekdayNightsCount * weekdayPrice) + (weekendNightsCount * weekendPrice);

  const effectiveNightlyRate = nights.length > 0
    ? Math.round(baseAmount / nights.length)
    : weekdayPrice;
  const subTotal = baseAmount;

  // Validate Promo Code
  let discount = 0;
  let appliedPromo = null;

  if (promoCode && promoCode.trim()) {
    const cleanCode = promoCode.trim().toUpperCase();
    const promo = await Promo.findOne({ code: cleanCode, isActive: true });
    if (promo) {
      const now = new Date();
      const isValidDate = (!promo.validFrom || now >= promo.validFrom) && (!promo.validTo || now <= promo.validTo);
      const isValidNights = !promo.minNights || nights.length >= promo.minNights;
      const isValidLimit = promo.usageLimit == null || promo.usedCount < promo.usageLimit;

      if (isValidDate && isValidNights && isValidLimit) {
        appliedPromo = promo;
        if (promo.type === 'percent') {
          discount = Math.round((subTotal * promo.value) / 100);
        } else {
          discount = Math.min(subTotal, promo.value);
        }
      }
    }
  }

  const discountedSubtotal = Math.max(0, subTotal - discount);
  const taxAmount = taxPercent > 0 ? Math.round((discountedSubtotal * taxPercent) / 100) : 0;
  const total = discountedSubtotal + taxAmount;

  const chosenAdvance = Number(advanceOption) || 20;
  const validAdvance = validAdvanceOptions.includes(chosenAdvance) ? chosenAdvance : 20;
  const advancePaid = Math.round((total * validAdvance) / 100);
  const balanceDue = total - advancePaid;

  return {
    bookingType: 'room',
    room: {
      id: targetRoomDoc._id,
      name: targetRoomDoc.name,
      slug: targetRoomDoc.slug,
      pricePerNight: effectiveNightlyRate,
      weekdayPrice,
      weekendPrice,
      quantity: 1
    },
    pricingMode: isRoomPackageOverride ? 'package' : 'room',
    appliedPackage: matchedPackage ? {
      slug: matchedPackage.slug,
      title: matchedPackage.title,
      price: packageRate
    } : null,
    nights,
    nightsCount: nights.length,
    weekdayNights: weekdayNightsCount,
    weekendNights: weekendNightsCount,
    pricing: {
      baseAmount,
      discount,
      subTotal: discountedSubtotal,
      taxPercent,
      taxAmount,
      total
    },
    advanceOptions: validAdvanceOptions,
    selectedAdvanceOption: validAdvance,
    advanceAmount: advancePaid,
    balanceDue,
    promo: appliedPromo ? { code: appliedPromo.code, discount } : null
  };
}

/**
 * GET /api/availability/calendar?rooms=<roomId>&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Accepts bookingType="full_home" (and no room) or bookingType="room" (single room).
 * For full_home: returns available, full (with reason "Some rooms are booked" or "Full Home booked"),
 * blocked (saying which room is blocked), past, outside_range.
 */
export async function getCalendarAvailability({ bookingType = 'room', roomIdentifier, fromDate, toDate, excludeBooking = null, allowSameDay = false }) {
  await expireStaleHolds();

  const isHolding = excludeBooking && ['payment_pending', 'paid_awaiting_confirmation', 'confirmed', 'checked_in', 'checked_out'].includes(excludeBooking.status);
  const excludeNights = (isHolding && Array.isArray(excludeBooking.nights)) ? excludeBooking.nights : [];

  const settings = await SiteSettings.findOne() || {};
  const maxAdvanceDays = Number(settings.maxAdvanceDays) || 365;

  const todayStr = getTodayISTStr();
  const maxAllowedDate = addDays(todayStr, maxAdvanceDays);

  const startStr = toDateStr(fromDate) || todayStr;
  const endStr = toDateStr(toDate) || addDays(startStr, 30);

  const allRooms = await Room.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
  if (!allRooms || allRooms.length === 0) {
    throw new Error('No active rooms found');
  }

  const blockedDates = await BlockedDate.find();
  const occupancyMap = await getActiveBookingOccupancyMap({
    fromDate: startStr,
    toDate: endStr,
    allRooms,
    excludeBookingId: excludeBooking?._id || null
  });

  // 1. FULL HOME CALENDAR AVAILABILITY
  if (bookingType === 'full_home') {
    const totalUnitsAllRooms = allRooms.reduce((sum, r) => sum + (Number(r.totalUnits) || 1), 0);
    const roomNights = await RoomNight.find({
      room: { $in: allRooms.map((r) => r._id) },
      date: { $gte: startStr, $lte: endStr }
    });

    const calendarDays = [];
    let curDay = startStr;

    while (curDay <= endStr) {
      let dayStatus = 'available';
      let reason = 'Full Home is available (all 5 rooms free)';
      let remainingUnits = totalUnitsAllRooms;

      if (curDay < todayStr) {
        dayStatus = 'past';
        reason = 'Past calendar date';
        remainingUnits = 0;
      } else if (curDay === todayStr && !allowSameDay) {
        dayStatus = 'past';
        reason = 'Same-day check-in is closed. Earliest check-in is tomorrow.';
        remainingUnits = 0;
      } else if (curDay > maxAllowedDate) {
        dayStatus = 'outside_range';
        reason = `Outside allowed booking window (${maxAdvanceDays} days max)`;
        remainingUnits = 0;
      } else {
        // Blocked check: check if 'all' is blocked or any individual room is blocked
        let blockedRoomName = null;
        if (isNightBlocked(curDay, 'all', blockedDates)) {
          blockedRoomName = 'All rooms';
        } else {
          for (const r of allRooms) {
            if (isNightBlocked(curDay, r._id, blockedDates) || isNightBlocked(curDay, r.slug, blockedDates)) {
              blockedRoomName = r.name;
              break;
            }
          }
        }

        if (blockedRoomName) {
          dayStatus = 'blocked';
          reason = `Blocked for maintenance (${blockedRoomName})`;
          remainingUnits = 0;
        } else {
          // Check booking counts across all rooms for this night
          let totalBookedAcrossAllRooms = 0;
          let anyRoomBooked = false;
          let allRoomsFullyBooked = true;

          for (const r of allRooms) {
            const rUnits = Number(r.totalUnits) || 1;
            const rn = roomNights.find((item) => String(item.room) === String(r._id) && item.date === curDay);
            let rnBooked = rn ? rn.booked : 0;
            if (excludeNights.includes(curDay)) {
              if (excludeBooking.bookingType === 'full_home') {
                rnBooked = Math.max(0, rnBooked - rUnits);
              } else if (
                String(excludeBooking.room?._id || excludeBooking.room) === String(r._id) ||
                excludeBooking.roomSlug === r.slug
              ) {
                rnBooked = Math.max(0, rnBooked - 1);
              }
            }
            const b = getEffectiveBookedCount({
              roomId: r._id,
              nightStr: curDay,
              rnBooked,
              bookingOccupancyMap: occupancyMap
            });
            totalBookedAcrossAllRooms += b;
            if (b > 0) anyRoomBooked = true;
            if (b < rUnits) allRoomsFullyBooked = false;
          }

          if (anyRoomBooked) {
            dayStatus = 'full';
            reason = allRoomsFullyBooked ? 'Full Home booked' : 'Some rooms are booked';
            remainingUnits = 0;
          } else {
            dayStatus = 'available';
            reason = 'Full Home is available (all 5 rooms free)';
            remainingUnits = totalUnitsAllRooms;
          }
        }
      }

      calendarDays.push({
        date: curDay,
        status: dayStatus,
        remainingUnits,
        totalUnits: totalUnitsAllRooms,
        reason
      });

      curDay = addDays(curDay, 1);
    }

    return {
      bookingType: 'full_home',
      room: {
        id: null,
        name: 'Full Home (All 5 Rooms)',
        slug: 'full-home',
        totalUnits: totalUnitsAllRooms
      },
      from: startStr,
      to: endStr,
      days: calendarDays
    };
  }

  // 2. SINGLE ROOM CALENDAR AVAILABILITY
  let room = null;
  if (roomIdentifier) {
    const ident = String(roomIdentifier).split(':')[0].trim();
    room = allRooms.find((r) => r.slug === ident || String(r._id) === ident);
  }
  if (!room) {
    room = allRooms[0];
  }

  const totalUnits = Number(room.totalUnits) || 1;
  const roomNights = await RoomNight.find({
    room: room._id,
    date: { $gte: startStr, $lte: endStr }
  });

  const calendarDays = [];
  let curDay = startStr;

  while (curDay <= endStr) {
    let dayStatus = 'available';
    let reason = `${room.name} is available`;
    let remainingUnits = totalUnits;

    if (curDay < todayStr) {
      dayStatus = 'past';
      reason = 'Past calendar date';
      remainingUnits = 0;
    } else if (curDay === todayStr && !allowSameDay) {
      dayStatus = 'past';
      reason = 'Same-day check-in is closed. Earliest check-in is tomorrow.';
      remainingUnits = 0;
    } else if (curDay > maxAllowedDate) {
      dayStatus = 'outside_range';
      reason = `Outside allowed booking window (${maxAdvanceDays} days max)`;
      remainingUnits = 0;
    } else if (
      isNightBlocked(curDay, room._id, blockedDates) ||
      isNightBlocked(curDay, room.slug, blockedDates) ||
      isNightBlocked(curDay, 'all', blockedDates)
    ) {
      dayStatus = 'blocked';
      reason = 'Blocked for maintenance or personal hold';
      remainingUnits = 0;
    } else {
      const rn = roomNights.find((item) => item.date === curDay);
      let rnBooked = rn ? rn.booked : 0;
      if (excludeNights.includes(curDay)) {
        if (excludeBooking.bookingType === 'full_home') {
          rnBooked = Math.max(0, rnBooked - totalUnits);
        } else if (
          String(excludeBooking.room?._id || excludeBooking.room) === String(room._id) ||
          excludeBooking.roomSlug === room.slug
        ) {
          rnBooked = Math.max(0, rnBooked - 1);
        }
      }
      const booked = getEffectiveBookedCount({
        roomId: room._id,
        nightStr: curDay,
        rnBooked,
        bookingOccupancyMap: occupancyMap
      });
      remainingUnits = Math.max(0, totalUnits - booked);

      if (remainingUnits === 0) {
        dayStatus = 'full';
        reason = `All ${totalUnits} ${room.name} unit(s) are booked for this night`;
      } else {
        dayStatus = 'available';
        reason = `${remainingUnits} of ${totalUnits} ${room.name} unit(s) available`;
      }
    }

    calendarDays.push({
      date: curDay,
      status: dayStatus,
      remainingUnits,
      totalUnits,
      reason
    });

    curDay = addDays(curDay, 1);
  }

  return {
    bookingType: 'room',
    room: {
      id: room._id,
      name: room.name,
      slug: room.slug,
      totalUnits
    },
    from: startStr,
    to: endStr,
    days: calendarDays
  };
}

/**
 * GET /api/availability/checkout-options?rooms=<roomId>&checkIn=...
 * Supports bookingType="full_home" and bookingType="room".
 * For full_home: stops at the first night that is not fully free; respects fullHomeMinNights.
 */
export async function getValidCheckoutOptions({ bookingType = 'room', roomIdentifier, checkInDate, allowSameDay = false }) {
  await expireStaleHolds();

  const inStr = toDateStr(checkInDate);
  if (!inStr) {
    const err = new Error('Valid check-in date is required');
    err.status = 400;
    throw err;
  }

  const settings = await SiteSettings.findOne() || {};
  const maxAdvanceDays = Number(settings.maxAdvanceDays) || 365;

  const todayStr = getTodayISTStr();
  const maxAllowedDate = addDays(todayStr, maxAdvanceDays);

  if (inStr < todayStr) {
    const err = new Error('Check-in date cannot be in the past');
    err.status = 400;
    throw err;
  }
  if (inStr === todayStr && !allowSameDay) {
    const err = new Error('Same-day bookings are not available. Earliest available check-in date is tomorrow.');
    err.status = 400;
    throw err;
  }
  if (inStr > maxAllowedDate) {
    const err = new Error(`Check-in date is beyond the maximum booking window (${maxAdvanceDays} days)`);
    err.status = 400;
    throw err;
  }

  const allRooms = await Room.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
  if (!allRooms || allRooms.length === 0) {
    throw new Error('No active rooms found');
  }

  const blockedDates = await BlockedDate.find();
  const validCheckOutDates = [];
  const maxLookaheadDays = 30;
  const lookaheadEndStr = addDays(inStr, maxLookaheadDays);

  const [roomNights, occupancyMap] = await Promise.all([
    RoomNight.find({ room: { $in: allRooms.map((r) => r._id) }, date: { $gte: inStr, $lte: lookaheadEndStr } }),
    getActiveBookingOccupancyMap({ fromDate: inStr, toDate: lookaheadEndStr, allRooms })
  ]);
  const rnLookup = new Map();
  for (const rn of roomNights) {
    rnLookup.set(`${String(rn.room)}|${rn.date}`, rn.booked || 0);
  }

  let firstUnavailableNight = null;

  // 1. FULL HOME CHECKOUT OPTIONS
  if (bookingType === 'full_home') {
    const minNights = Number(settings.fullHomeMinNights) || 1;
    let curNight = inStr;

    for (let nightIndex = 1; nightIndex <= maxLookaheadDays; nightIndex++) {
      // Check if any room or property is blocked
      let isBlocked = false;
      if (isNightBlocked(curNight, 'all', blockedDates)) {
        isBlocked = true;
      } else {
        for (const r of allRooms) {
          if (isNightBlocked(curNight, r._id, blockedDates) || isNightBlocked(curNight, r.slug, blockedDates)) {
            isBlocked = true;
            break;
          }
        }
      }
      if (isBlocked) {
        firstUnavailableNight = curNight;
        break; // Stop at first blocked night
      }

      // Check if any room has booked > 0
      let hasAnyBooking = false;
      for (const r of allRooms) {
        const booked = getEffectiveBookedCount({
          roomId: r._id,
          nightStr: curNight,
          rnBooked: rnLookup.get(`${String(r._id)}|${curNight}`) || 0,
          bookingOccupancyMap: occupancyMap
        });
        if (booked > 0) {
          hasAnyBooking = true;
          break;
        }
      }
      if (hasAnyBooking) {
        firstUnavailableNight = curNight;
        break; // Stop at first night that is not fully free
      }

      const candidateCheckOut = addDays(curNight, 1);
      if (nightIndex >= minNights) {
        validCheckOutDates.push(candidateCheckOut);
      }

      curNight = addDays(curNight, 1);
      if (curNight > maxAllowedDate) {
        break;
      }
    }

    return {
      bookingType: 'full_home',
      room: {
        id: null,
        name: 'Full Home (All 5 Rooms)',
        slug: 'full-home'
      },
      checkIn: inStr,
      minNights,
      validCheckOutDates,
      firstUnavailableNight
    };
  }

  // 2. SINGLE ROOM CHECKOUT OPTIONS
  const minNights = Number(settings.minNights) || 1;
  let room = null;
  if (roomIdentifier) {
    const ident = String(roomIdentifier).split(':')[0].trim();
    room = allRooms.find((r) => r.slug === ident || String(r._id) === ident);
  }
  if (!room) {
    room = allRooms[0];
  }

  const totalUnits = Number(room.totalUnits) || 1;
  let curNight = inStr;

  for (let nightIndex = 1; nightIndex <= maxLookaheadDays; nightIndex++) {
    // 1. Blocked check
    if (
      isNightBlocked(curNight, room._id, blockedDates) ||
      isNightBlocked(curNight, room.slug, blockedDates) ||
      isNightBlocked(curNight, 'all', blockedDates)
    ) {
      firstUnavailableNight = curNight;
      break;
    }

    // 2. Capacity check for this one room (quantity is 1)
    const booked = getEffectiveBookedCount({
      roomId: room._id,
      nightStr: curNight,
      rnBooked: rnLookup.get(`${String(room._id)}|${curNight}`) || 0,
      bookingOccupancyMap: occupancyMap
    });
    if (booked >= totalUnits) {
      // Room is fully booked on this night, stay cannot cross this night
      firstUnavailableNight = curNight;
      break;
    }

    const candidateCheckOut = addDays(curNight, 1);
    if (nightIndex >= minNights) {
      validCheckOutDates.push(candidateCheckOut);
    }

    curNight = addDays(curNight, 1);
    if (curNight > maxAllowedDate) {
      break;
    }
  }

  return {
    bookingType: 'room',
    room: {
      id: room._id,
      name: room.name,
      slug: room.slug
    },
    checkIn: inStr,
    minNights,
    validCheckOutDates,
    firstUnavailableNight
  };
}
