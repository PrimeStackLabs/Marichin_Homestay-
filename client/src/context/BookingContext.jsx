import React, { createContext, useContext, useState } from 'react';
import { useAdmin } from './AdminContext';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

const DEFAULT_BOOKING_CONTEXT = {
  searchParams: { checkIn: '', checkOut: '', guests: 2, adults: 2, children: 0, stayType: '', roomId: '' },
  setSearchParams: () => {},
  selectedRoom: null,
  setSelectedRoom: () => {},
  advancePercent: 20,
  setAdvancePercent: () => {},
  appliedPromo: null,
  promoError: '',
  bookingError: '',
  isSubmitting: false,
  applyPromoCode: async () => ({ valid: false }),
  setAppliedPromo: () => {},
  calculatePricing: () => ({
    baseAmount: 0,
    extraGuestCharges: 0,
    subtotal: 0,
    discountAmount: 0,
    totalAmount: 0,
    advanceAmount: 0,
    balanceAmount: 0,
    gstAmount: 0,
    nights: 0
  }),
  isDateBlocked: () => false,
  isDateBooked: () => false,
  isRoomAvailableForDates: () => true,
  getRoomAvailableUnits: () => 1,
  getNights: () => 1,
  processBooking: async () => null,
  confirmedBooking: null,
  setConfirmedBooking: () => {},
  clearConfirmedBooking: () => {}
};

const BOOKING_CONTEXT_KEY = '__marichin_booking_context__';
const BookingContext = (typeof globalThis !== 'undefined' && globalThis[BOOKING_CONTEXT_KEY])
  ? globalThis[BOOKING_CONTEXT_KEY]
  : createContext(DEFAULT_BOOKING_CONTEXT);
if (typeof globalThis !== 'undefined') {
  globalThis[BOOKING_CONTEXT_KEY] = BookingContext;
}

export const isWeekendNight = (nightStr) => {
  if (!nightStr) return false;
  const d = new Date(`${String(nightStr).split('T')[0]}T00:00:00Z`);
  if (isNaN(d.getTime())) return false;
  const day = d.getUTCDay();
  return day === 5 || day === 6; // Friday or Saturday night
};

const getNightDates = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return [];
  const start = new Date(`${String(checkIn).split('T')[0]}T00:00:00Z`);
  const end = new Date(`${String(checkOut).split('T')[0]}T00:00:00Z`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) return [];
  const dates = [];
  const cur = new Date(start);
  let guard = 0;
  while (cur < end && guard < 120) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setUTCDate(cur.getUTCDate() + 1);
    guard++;
  }
  return dates;
};

export const BookingProvider = ({ children }) => {
  const {
    rooms = [],
    bookings = [],
    blockedDates = [],
    addBooking,
    offers = [],
    siteSettings = {},
    packages = [],
    resolvedFullHomePrice = 42000
  } = useAdmin() || {};

  // Today + tomorrow as default dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 2);

  const [searchParams, setSearchParamsState] = useState(() => {
    try {
      const saved = sessionStorage.getItem('marichin_booking_bar_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          checkIn: parsed.checkIn || '',
          checkOut: parsed.checkOut || '',
          guests: parsed.adults || parsed.guests || 2,
          adults: parsed.adults || parsed.guests || 2,
          children: parsed.children || 0,
          stayType: parsed.stayType || '',
          roomId: parsed.roomId || parsed.roomSlug || ''
        };
      }
    } catch {}
    return {
      checkIn: '',
      checkOut: '',
      guests: 2,
      adults: 2,
      children: 0,
      stayType: '',
      roomId: ''
    };
  });

  const setSearchParams = (paramsOrUpdater) => {
    setSearchParamsState((prev) => {
      const next = typeof paramsOrUpdater === 'function' ? paramsOrUpdater(prev) : paramsOrUpdater;
      try {
        const toSave = {
          ...next,
          adults: next.adults ?? next.guests ?? 2,
          guests: next.adults ?? next.guests ?? 2,
          children: next.children ?? 0
        };
        sessionStorage.setItem('marichin_booking_bar_state', JSON.stringify(toSave));
      } catch {}
      return next;
    });
  };

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [advancePercent, setAdvancePercent] = useState(20);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(() => {
    try {
      const saved = sessionStorage.getItem('marichin_last_confirmed_booking');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const clearConfirmedBooking = () => {
    try {
      sessionStorage.removeItem('marichin_last_confirmed_booking');
    } catch {}
    setConfirmedBooking(null);
  };

  // Check if a date is blocked by admin for a specific room or all
  const isDateBlocked = (dateStr, targetRoomId = 'all') => {
    return blockedDates.some((b) => {
      const startStr = b.startDate ? new Date(b.startDate).toISOString().split('T')[0] : (b.date || '');
      const endStr = b.endDate ? new Date(b.endDate).toISOString().split('T')[0] : (b.date || startStr);
      const inRange = dateStr >= startStr && dateStr <= endStr;
      if (!inRange) return false;
      const bRoom = String(b.roomId || b.room || 'all');
      return bRoom === 'all' || targetRoomId === 'all' || bRoom === String(targetRoomId);
    });
  };

  // Check how many units of a room type are booked on a given date
  const getBookedUnitsOnDate = (dateStr, targetRoomId) => {
    let count = 0;
    const targetStr = String(targetRoomId);

    for (const b of bookings) {
      const st = (b.status || '').toLowerCase();
      if (st === 'cancelled' || st === 'rejected' || st === 'expired') continue;

      if (Array.isArray(b.nights) && b.nights.length > 0) {
        if (!b.nights.includes(dateStr)) continue;
      } else {
        const inStr = typeof b.checkIn === 'string' ? b.checkIn.split('T')[0] : new Date(b.checkIn).toISOString().split('T')[0];
        const outStr = typeof b.checkOut === 'string' ? b.checkOut.split('T')[0] : new Date(b.checkOut).toISOString().split('T')[0];
        if (dateStr < inStr || dateStr >= outStr) continue;
      }

      const lines = (b.lines && Array.isArray(b.lines) && b.lines.length > 0) ? b.lines : (b.rooms || []);
      if (lines.length > 0) {
        for (const line of lines) {
          const lineId = String(line.room?._id || line.room || line.roomId || line.roomSlug || '');
          const lineSlug = line.roomSlug || '';
          if (lineId === targetStr || lineSlug === targetStr) {
            count += (Number(line.quantity) || 1);
          }
        }
      } else {
        // Legacy booking fallback
        const bId = String(b.room?._id || b.room || b.roomId || b.roomSlug || '');
        const bSlug = b.roomSlug || '';
        if (bId === targetStr || bSlug === targetStr || b.roomName?.toLowerCase().includes(targetStr.toLowerCase())) {
          count += 1;
        }
      }
    }
    return count;
  };

  // Calculate available units for a room across a date range
  const getRoomAvailableUnits = (roomOrId, checkIn, checkOut) => {
    if (!checkIn || !checkOut || checkIn >= checkOut) return 0;
    let room = typeof roomOrId === 'object' && roomOrId !== null
      ? roomOrId
      : rooms.find((r) => r.id === roomOrId || r._id === roomOrId || r.slug === roomOrId);

    if (!room) return 0;

    const totalUnits = Number(room.totalUnits) || 1;
    const targetId = room.slug || room.id || room._id;

    let minAvailable = totalUnits;
    let curr = new Date(checkIn);
    const end = new Date(checkOut);

    while (curr < end) {
      const dStr = curr.toISOString().split('T')[0];
      if (isDateBlocked(dStr, targetId) || isDateBlocked(dStr, 'all')) {
        return 0;
      }
      const bookedUnits = getBookedUnitsOnDate(dStr, targetId);
      const avail = Math.max(0, totalUnits - bookedUnits);
      if (avail < minAvailable) {
        minAvailable = avail;
      }
      curr.setDate(curr.getDate() + 1);
    }

    return minAvailable;
  };

  // Check if a room is available for dates
  const isRoomAvailableForDates = (roomOrId, checkIn, checkOut, requiredQty = 1) => {
    if (!roomOrId || roomOrId === 'all') {
      // Check if at least one room is available
      return rooms.some((r) => getRoomAvailableUnits(r, checkIn, checkOut) >= 1);
    }
    return getRoomAvailableUnits(roomOrId, checkIn, checkOut) >= requiredQty;
  };

  // Legacy isDateBooked compatibility
  const isDateBooked = (dateStr) => {
    return bookings.some((b) => {
      if (b.status === 'Cancelled' || b.status === 'cancelled') return false;
      const inStr = typeof b.checkIn === 'string' ? b.checkIn.split('T')[0] : new Date(b.checkIn).toISOString().split('T')[0];
      const outStr = typeof b.checkOut === 'string' ? b.checkOut.split('T')[0] : new Date(b.checkOut).toISOString().split('T')[0];
      return dateStr >= inStr && dateStr < outStr;
    });
  };

  // Calculate nights
  const getNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 1;
    const diffTime = Math.abs(new Date(checkOut) - new Date(checkIn));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  // Calculate pricing breakdown supporting Full Home, weekday/weekend room rates, or active package
  const calculatePricing = (roomSelection, checkIn, checkOut, guests, promo, advancePct = advancePercent, adults = 2, options = {}) => {
    const nightDates = getNightDates(checkIn, checkOut);
    const nights = nightDates.length > 0 ? nightDates.length : getNights(checkIn, checkOut);
    const weekendNights = nightDates.length > 0 ? nightDates.filter(isWeekendNight).length : 0;
    const weekdayNights = Math.max(0, nights - weekendNights);
    let roomLines = [];
    let baseTotal = 0;

    const isFullHome = roomSelection === 'full_home' ||
      roomSelection?.bookingType === 'full_home' ||
      (Array.isArray(roomSelection) && roomSelection[0]?.bookingType === 'full_home');

    const requestedPackageSlug = options?.packageSlug || '';
    const activePackage = options?.packageObj || (requestedPackageSlug
      ? (packages || []).find((p) => (p.slug === requestedPackageSlug || p.id === requestedPackageSlug || p._id === requestedPackageSlug) && p.isActive !== false)
      : null);
    const packageSlugLower = String(activePackage?.slug || requestedPackageSlug || '').toLowerCase();
    const isEntirePackage = packageSlugLower.includes('entire-homestay') || packageSlugLower.includes('all-5-rooms');
    const pkgPriceNum = activePackage && Number(activePackage.price) > 0 && !isEntirePackage
      ? Number(activePackage.price)
      : null;

    const computeRoomLineRates = (rObj, qty) => {
      const weekdayRate = Number(rObj?.pricePerNight ?? rObj?.price ?? 8000);
      const weekendRate = (rObj?.weekendPrice !== undefined && rObj?.weekendPrice !== null)
        ? Number(rObj.weekendPrice)
        : weekdayRate;
      if (pkgPriceNum !== null) {
        return {
          weekdayRate: pkgPriceNum,
          weekendRate: pkgPriceNum,
          avgRate: pkgPriceNum,
          lineTotal: pkgPriceNum * qty * nights
        };
      }
      const perRoomTotal = nightDates.length > 0
        ? (weekdayNights * weekdayRate + weekendNights * weekendRate)
        : weekdayRate * nights;
      return {
        weekdayRate,
        weekendRate,
        avgRate: Math.round(perRoomTotal / Math.max(1, nights)),
        lineTotal: perRoomTotal * qty
      };
    };

    if (isFullHome) {
      const fullHomePrice = resolvedFullHomePrice || Number(siteSettings?.fullHomePricePerNight) || 35000;
      baseTotal = fullHomePrice * nights;
      roomLines = [{
        roomId: 'full-home',
        roomName: 'Full Home (All 5 Rooms)',
        roomSlug: 'full-home',
        quantity: 5,
        pricePerNight: fullHomePrice,
        weekdayRate: fullHomePrice,
        weekendRate: fullHomePrice,
        lineTotal: baseTotal
      }];
    } else if (Array.isArray(roomSelection)) {
      roomLines = roomSelection.filter(l => (Number(l.quantity) || 0) > 0).map(l => {
        const qty = Number(l.quantity) || 1;
        const rObj = l.room || l;
        const rates = computeRoomLineRates(rObj, qty);
        baseTotal += rates.lineTotal;
        return {
          room: l.room,
          roomId: l.room?._id || l.room?.id || l.roomId,
          roomName: l.room?.name || l.roomName || 'Room',
          roomSlug: l.room?.slug || l.roomSlug,
          quantity: qty,
          pricePerNight: rates.avgRate,
          weekdayRate: rates.weekdayRate,
          weekendRate: rates.weekendRate,
          lineTotal: rates.lineTotal
        };
      });
    } else if (roomSelection && typeof roomSelection === 'object' && !roomSelection.name) {
      // Map format: { [roomSlugOrId]: quantity }
      Object.entries(roomSelection).forEach(([rKey, qty]) => {
        const q = Number(qty) || 0;
        if (q > 0) {
          const rObj = rooms.find(r => r.id === rKey || r._id === rKey || r.slug === rKey) || { name: rKey, pricePerNight: 8000 };
          const rates = computeRoomLineRates(rObj, q);
          baseTotal += rates.lineTotal;
          roomLines.push({
            room: rObj,
            roomId: rObj._id || rObj.id,
            roomName: rObj.name,
            roomSlug: rObj.slug,
            quantity: q,
            pricePerNight: rates.avgRate,
            weekdayRate: rates.weekdayRate,
            weekendRate: rates.weekendRate,
            lineTotal: rates.lineTotal
          });
        }
      });
    } else {
      // Single room object
      const r = roomSelection || (rooms && rooms[0]) || { name: 'Standard Room', pricePerNight: 8000 };
      const rates = computeRoomLineRates(r, 1);
      baseTotal = rates.lineTotal;
      roomLines.push({
        room: r,
        roomId: r._id || r.id,
        roomName: r.name,
        roomSlug: r.slug,
        quantity: 1,
        pricePerNight: rates.avgRate,
        weekdayRate: rates.weekdayRate,
        weekendRate: rates.weekendRate,
        lineTotal: rates.lineTotal
      });
    }

    const subTotal = baseTotal;

    // Promo discount
    let discount = 0;
    if (promo) {
      if (promo.discountPercent) {
        discount = Math.round((subTotal * promo.discountPercent) / 100);
      } else if (promo.value && promo.type === 'percent') {
        discount = Math.round((subTotal * promo.value) / 100);
      } else if (promo.discountAmount) {
        discount = Math.min(subTotal, promo.discountAmount);
      }
    }

    const discountedSubtotal = Math.max(0, subTotal - discount);
    const taxPercent = Number(siteSettings?.taxPercent) || 0;
    const gstTax = taxPercent > 0 ? Math.round((discountedSubtotal * taxPercent) / 100) : 0;
    const totalAmount = discountedSubtotal + gstTax;

    const advanceAmount = Math.round((totalAmount * advancePct) / 100);
    const balanceDue = totalAmount - advanceAmount;

    return {
      nights,
      weekdayNights,
      weekendNights,
      appliedPackage: (!isFullHome && pkgPriceNum !== null && activePackage) ? activePackage : null,
      roomLines,
      baseTotal,
      subTotal,
      discount,
      discountedSubtotal,
      taxPercent,
      gstTax,
      totalAmount,
      advancePercent: advancePct,
      advanceAmount,
      balanceDue
    };
  };

  // Apply promo code with server validation & local fallback
  const applyPromoCode = async (codeStr) => {
    setPromoError('');
    if (!codeStr || !codeStr.trim()) {
      setAppliedPromo(null);
      return;
    }
    const clean = codeStr.trim().toUpperCase();

    try {
      const pricing = calculatePricing(
        selectedRoom,
        searchParams.checkIn,
        searchParams.checkOut,
        searchParams.guests,
        null
      );

      const res = await api.validatePromo({
        code: clean,
        nights: pricing?.nights || 1,
        amount: pricing?.subTotal || 0
      });

      if (res?.data) {
        setAppliedPromo(res.data);
        setPromoError('');
        return true;
      }
    } catch (err) {
      // Check local fallback
      const found = offers.find((o) => o.code?.toUpperCase() === clean);
      if (found) {
        setAppliedPromo(found);
        setPromoError('');
        return true;
      } else {
        setAppliedPromo(null);
        setPromoError(err.message || 'Invalid promo code. Please verify and try again.');
        return false;
      }
    }
  };

  // Submit complete booking with backend API
  const processBooking = async (guestData, paymentDetails) => {
    setIsSubmitting(true);
    setBookingError('');

    const isFullHome = guestData.bookingType === 'full_home';
    const targetCheckIn = guestData.checkIn || searchParams.checkIn;
    const targetCheckOut = guestData.checkOut || searchParams.checkOut;
    const targetAdults = Number(guestData.adults !== undefined ? guestData.adults : (searchParams.guests || 2));
    const targetChildren = Number(guestData.children || 0);
    const targetAdvancePercent = Number(guestData.advancePercent || advancePercent || 20);

    let roomId = null;
    let roomSlug = null;
    let roomName = 'Standard Room';
    let pricePerNight = 8000;
    let singleLine = null;
    let requestRoomLines = [];

    if (isFullHome) {
      roomName = 'Full Home (All 5 Rooms)';
      roomSlug = 'full-home';
      pricePerNight = resolvedFullHomePrice || Number(siteSettings?.fullHomePricePerNight) || 35000;
      singleLine = {
        bookingType: 'full_home',
        roomId: 'full-home',
        roomSlug: 'full-home',
        roomName,
        quantity: 5,
        pricePerNight
      };
      requestRoomLines = [singleLine];
    } else {
      // Resolve single chosen room (Each booking is for exactly ONE room, quantity is always 1)
      let chosenRoom = null;
      if (guestData.room) {
        chosenRoom = guestData.room;
      } else if (Array.isArray(guestData.rooms) && guestData.rooms.length > 0) {
        chosenRoom = guestData.rooms[0].roomDoc || guestData.rooms[0];
      } else if (guestData.selectedRoomSlug || guestData.roomSlug || guestData.roomId) {
        const target = guestData.selectedRoomSlug || guestData.roomSlug || guestData.roomId;
        chosenRoom = rooms.find(r => r.slug === target || r.id === target || r._id === target);
      }
      if (!chosenRoom) {
        chosenRoom = selectedRoom || (rooms && rooms[0]) || { name: 'Standard Room', slug: 'standard-room', pricePerNight: 8000 };
      }

      roomId = chosenRoom._id || chosenRoom.id || chosenRoom.roomId;
      roomSlug = chosenRoom.slug || chosenRoom.roomSlug || 'standard-room';
      roomName = chosenRoom.name || chosenRoom.roomName || 'Standard Room';
      pricePerNight = Number(chosenRoom.pricePerNight || 8000);

      singleLine = {
        bookingType: 'room',
        room: roomId,
        roomId,
        roomSlug,
        roomName,
        quantity: 1,
        pricePerNight
      };
      requestRoomLines = [singleLine];
    }

    const pricing = calculatePricing(
      isFullHome ? 'full_home' : [singleLine], 
      targetCheckIn, 
      targetCheckOut, 
      targetAdults + targetChildren, 
      appliedPromo, 
      targetAdvancePercent,
      targetAdults
    );

    const bookingPayload = isFullHome ? {
      bookingType: 'full_home',
      guestName: (guestData.fullName || guestData.guestName || '').trim(),
      email: (guestData.email || '').trim().toLowerCase(),
      phone: (guestData.phone || '').trim(),
      checkIn: targetCheckIn,
      checkOut: targetCheckOut,
      adults: targetAdults,
      children: targetChildren,
      specialRequests: guestData.packageName 
        ? `[Package: ${guestData.packageName}] ${guestData.specialRequests || 'None'}`
        : (guestData.specialRequests || 'None'),
      promoCode: appliedPromo?.code || '',
      advanceOption: targetAdvancePercent,
      paymentMethod: paymentDetails?.method || 'UPI',
      transactionId: paymentDetails?.transactionId || ''
    } : {
      bookingType: 'room',
      roomId,
      roomSlug,
      quantity: 1,
      guestName: (guestData.fullName || guestData.guestName || '').trim(),
      email: (guestData.email || '').trim().toLowerCase(),
      phone: (guestData.phone || '').trim(),
      checkIn: targetCheckIn,
      checkOut: targetCheckOut,
      adults: targetAdults,
      children: targetChildren,
      specialRequests: guestData.packageName 
        ? `[Package: ${guestData.packageName}] ${guestData.specialRequests || 'None'}`
        : (guestData.specialRequests || 'None'),
      promoCode: appliedPromo?.code || '',
      advanceOption: targetAdvancePercent,
      paymentMethod: paymentDetails?.method || 'UPI',
      transactionId: paymentDetails?.transactionId || ''
    };

    let rawBooking = null;

    try {
      // 1. Try real backend API
      const res = await api.createBooking(bookingPayload);
      if (res?.data?.booking) {
        rawBooking = res.data.booking;
      }
    } catch (err) {
      // If server returned specific rejection (e.g. double booking or capacity)
      if (err.status === 400 || err.status === 409) {
        setIsSubmitting(false);
        setBookingError(err.message || 'The selected dates or guest numbers are unavailable.');
        throw err;
      }

      // Offline fallback
      console.warn('API booking offline, using local fallback record.');
      const bookingRef = `MH-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      rawBooking = {
        id: bookingRef,
        bookingCode: bookingRef,
        bookingType: isFullHome ? 'full_home' : 'room',
        guestName: guestData.fullName || guestData.guestName,
        email: guestData.email,
        phone: guestData.phone,
        specialRequests: guestData.specialRequests || 'None',
        room: roomId,
        roomName,
        roomSlug,
        quantity: isFullHome ? 5 : 1,
        pricePerNight,
        checkIn: targetCheckIn,
        checkOut: targetCheckOut,
        nights: pricing.nights,
        adults: targetAdults,
        children: targetChildren,
        guests: targetAdults + targetChildren,
        guestCount: { adults: targetAdults, children: targetChildren },
        pricing: {
          baseAmount: pricing.baseTotal,
          extraGuestCharge: 0,
          discount: pricing.discount || 0,
          taxAmount: pricing.gstTax,
          total: pricing.totalAmount
        },
        totalAmount: pricing.totalAmount,
        advancePaid: pricing.advanceAmount,
        advanceOption: targetAdvancePercent,
        balanceDue: pricing.balanceDue,
        paymentMethod: paymentDetails?.method || 'UPI',
        transactionId: `TXN-${Date.now().toString().slice(-8)}`,
        status: "confirmed",
        paymentStatus: "pending",
        createdAt: new Date().toISOString()
      };
    } finally {
      setIsSubmitting(false);
    }

    if (rawBooking) {
      const bookingCode = rawBooking.bookingCode || rawBooking.id || `MH-${Date.now().toString().slice(-6)}`;
      const totalAmount = Number(rawBooking.pricing?.total ?? rawBooking.totalAmount ?? pricing.totalAmount);
      const advancePaid = Number(rawBooking.advancePaid ?? pricing.advanceAmount);
      const balanceDue = Number(rawBooking.balanceDue ?? (totalAmount - advancePaid));
      const advancePercentVal = Number(rawBooking.advanceOption ?? rawBooking.advancePercent ?? targetAdvancePercent);
      const roomSummary = rawBooking.roomName || roomName;

      const confirmedRecord = {
        ...rawBooking,
        id: bookingCode,
        bookingId: bookingCode,
        bookingCode: bookingCode,
        bookingType: isFullHome ? 'full_home' : (rawBooking.bookingType || 'room'),
        packageName: guestData.packageName || '',
        guest: {
          fullName: rawBooking.guestName || guestData.fullName,
          email: rawBooking.email || guestData.email,
          phone: rawBooking.phone || guestData.phone
        },
        guestName: rawBooking.guestName || guestData.fullName,
        email: rawBooking.email || guestData.email,
        phone: rawBooking.phone || guestData.phone,
        rooms: rawBooking.rooms || requestRoomLines,
        room: {
          name: roomSummary,
          id: roomId || 'full-home'
        },
        roomName: roomSummary,
        checkIn: targetCheckIn,
        checkOut: targetCheckOut,
        nights: pricing.nights,
        adults: targetAdults,
        children: targetChildren,
        guests: targetAdults + targetChildren,
        pricing: {
          baseAmount: rawBooking.pricing?.baseAmount ?? pricing.baseTotal,
          extraGuestCharge: 0,
          discount: rawBooking.pricing?.discount ?? (pricing.discount || 0),
          taxAmount: rawBooking.pricing?.taxAmount ?? pricing.gstTax,
          totalAmount: totalAmount,
          advancePaid: advancePaid,
          advancePercent: advancePercentVal,
          balanceDue: balanceDue
        },
        totalAmount,
        advancePaid,
        balanceDue,
        advancePercent: advancePercentVal,
        paymentMethod: rawBooking.paymentMethod || paymentDetails?.method || 'UPI',
        transactionId: rawBooking.transactionId || `TXN-${Date.now().toString().slice(-8)}`,
        paymentStatus: 'pending', // Pending admin verification
        status: rawBooking.status || 'Confirmed',
        createdAt: rawBooking.createdAt || new Date().toISOString()
      };

      try {
        sessionStorage.setItem('marichin_last_confirmed_booking', JSON.stringify(confirmedRecord));
      } catch (e) {
        // Ignore session storage errors
      }

      addBooking(confirmedRecord);
      setConfirmedBooking(confirmedRecord);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#C9A45C', '#18251E', '#F4F0E6']
        });
      } catch (e) {
        // safe fallback
      }

      return confirmedRecord;
    }
  };

  return (
    <BookingContext.Provider value={{
      searchParams,
      setSearchParams,
      selectedRoom,
      setSelectedRoom,
      advancePercent,
      setAdvancePercent,
      appliedPromo,
      promoError,
      bookingError,
      isSubmitting,
      applyPromoCode,
      setAppliedPromo,
      calculatePricing,
      isDateBlocked,
      isDateBooked,
      isRoomAvailableForDates,
      getRoomAvailableUnits,
      getNights,
      processBooking,
      confirmedBooking,
      setConfirmedBooking,
      clearConfirmedBooking
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext) || DEFAULT_BOOKING_CONTEXT;
