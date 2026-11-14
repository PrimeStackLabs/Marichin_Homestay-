import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useBooking } from '../../context/BookingContext';
import { useAdmin } from '../../context/AdminContext';
import { 
  Calendar as CalendarIcon, 
  Users, 
  Home, 
  Search, 
  ArrowRight, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2, 
  Utensils, 
  Sparkles,
  AlertTriangle 
} from 'lucide-react';
import { CustomBookingCalendar } from '../../pages/Booking/CustomBookingCalendar';
import { ROOMS_DATA } from '../../data/homestayData';
import { api } from '../../services/api';
import { getRoomTotalUnits } from '../../utils/homestayFormatting';

/**
 * Format date for display in English or Kannada
 */
const formatDisplayDate = (dateStr, isKn) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);

  const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const knMonths = ['ಜನ', 'ಫೆಬ್ರ', 'ಮಾರ್ಚ್', 'ಏಪ್ರಿ', 'ಮೇ', 'ಜೂನ್', 'ಜುಲೈ', 'ಆಗ', 'ಸೆಪ್ಟೆಂ', 'ಅಕ್ಟೋ', 'ನವೆಂ', 'ಡಿಸೆಂ'];

  const monthName = isKn ? knMonths[m - 1] : enMonths[m - 1];
  return `${d} ${monthName} ${y}`;
};

/**
 * Format date range for nearest available buttons
 */
const formatDateRange = (checkInStr, checkOutStr, isKn) => {
  if (!checkInStr || !checkOutStr) return '';
  const [y1, m1, d1] = checkInStr.split('-').map(Number);
  const [y2, m2, d2] = checkOutStr.split('-').map(Number);

  const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const knMonths = ['ಜನ', 'ಫೆಬ್ರ', 'ಮಾರ್ಚ್', 'ಏಪ್ರಿ', 'ಮೇ', 'ಜೂನ್', 'ಜುಲೈ', 'ಆಗ', 'ಸೆಪ್ಟೆಂ', 'ಅಕ್ಟೋ', 'ನವೆಂ', 'ಡಿಸೆಂ'];

  const m1Name = isKn ? knMonths[m1 - 1] : enMonths[m1 - 1];
  const m2Name = isKn ? knMonths[m2 - 1] : enMonths[m2 - 1];

  if (m1 === m2 && y1 === y2) {
    return `${d1} – ${d2} ${m1Name} ${y1}`;
  }
  return `${d1} ${m1Name} – ${d2} ${m2Name} ${y2}`;
};

const getLocalYMD = (d = new Date()) => {
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addLocalDays = (ymd, daysToAdd) => {
  if (!ymd || typeof ymd !== 'string') return '';
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return '';
  const dt = new Date(parts[0], parts[1] - 1, parts[2] + daysToAdd);
  return getLocalYMD(dt);
};

export const BookingBar = ({ className = "", onContinueToBook = null }) => {
  const { t, language } = useLanguage();
  const isKn = language === 'kn';
  const navigate = useNavigate();
  const { searchParams, setSearchParams } = useBooking();
  const { rooms: adminRooms, siteSettings, resolvedFullHomePrice, syncVersion } = useAdmin();

  const isFullHomeEnabled = siteSettings?.fullHomeEnabled !== false;

  // Active rooms list with fallback to ROOMS_DATA
  const activeRooms = useMemo(() => {
    if (adminRooms && adminRooms.length > 0) return adminRooms;
    return ROOMS_DATA;
  }, [adminRooms]);

  // Full Home Guest Limits (calculated from rooms)
  const totalUnitsCount = useMemo(() => getRoomTotalUnits(activeRooms), [activeRooms]);
  const fullHomeLimits = useMemo(() => {
    const adultSum = activeRooms.reduce((sum, r) => sum + (Number(r.maxAdults || 2) * (Number(r.totalUnits) || 1)), 0);
    const childSum = activeRooms.reduce((sum, r) => sum + (Number(r.maxChildren || 0) * (Number(r.totalUnits) || 1)), 0);
    return {
      maxAdults: adultSum || 10,
      maxChildren: childSum || 6
    };
  }, [activeRooms]);

  // Initialize state with sessionStorage persistence
  const [sessionInitial] = useState(() => {
    try {
      const saved = sessionStorage.getItem('marichin_booking_bar_state');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return null;
  });

  // 1. Stay Type: '' (none chosen yet) or 'standard-room' | 'suite-room' | 'single-room' | 'full_home'
  const [stayType, setStayType] = useState(() => {
    if (sessionInitial?.stayType) return sessionInitial.stayType;
    if (searchParams.stayType && searchParams.stayType !== 'all') {
      return searchParams.stayType;
    }
    if (searchParams.roomId && searchParams.roomId !== 'all') {
      return searchParams.roomId;
    }
    return '';
  });

  // Current selected room document
  const currentRoom = useMemo(() => {
    if (!stayType || stayType === 'full_home') return null;
    return activeRooms.find(r => r.slug === stayType || r.id === stayType) || activeRooms[0];
  }, [stayType, activeRooms]);

  // Max Adults Allowed for current stay type
  const maxAdultsAllowed = useMemo(() => {
    if (stayType === 'full_home') return fullHomeLimits.maxAdults;
    if (!stayType) return 2;
    return Number(currentRoom?.maxAdults) || 2;
  }, [stayType, fullHomeLimits, currentRoom]);

  // Max Children Allowed for current stay type
  const maxChildrenAllowed = useMemo(() => {
    if (stayType === 'full_home') return fullHomeLimits.maxChildren;
    if (!stayType) return 1;
    if (currentRoom?.maxChildren !== undefined) return Number(currentRoom.maxChildren);
    return (currentRoom?.slug || '').includes('single') ? 0 : 1;
  }, [stayType, fullHomeLimits, currentRoom]);

  // 2. Guests: Adults and Children
  const [adults, setAdults] = useState(() => {
    const val = sessionInitial?.adults ?? sessionInitial?.guests ?? searchParams.adults ?? searchParams.guests ?? 2;
    return Math.max(1, parseInt(val, 10) || 2);
  });

  const [children, setChildren] = useState(() => {
    const val = sessionInitial?.children ?? searchParams.children ?? 0;
    return Math.max(0, parseInt(val, 10) || 0);
  });

  // Clamp guests whenever max limits change
  useEffect(() => {
    if (adults > maxAdultsAllowed) {
      setAdults(maxAdultsAllowed);
    }
    if (children > maxChildrenAllowed) {
      setChildren(maxChildrenAllowed);
    }
  }, [maxAdultsAllowed, maxChildrenAllowed, adults, children]);

  // 3. Dates State (must be strictly after today; never trust stale cached dates from today or past)
  const [checkIn, setCheckIn] = useState(() => {
    const todayStr = getLocalYMD();
    const candidate = stayType && (sessionInitial?.checkIn || searchParams.checkIn || '');
    return candidate && candidate > todayStr ? candidate : '';
  });

  const [checkOut, setCheckOut] = useState(() => {
    const todayStr = getLocalYMD();
    const cIn = stayType && (sessionInitial?.checkIn || searchParams.checkIn || '');
    const cOut = stayType && (sessionInitial?.checkOut || searchParams.checkOut || '');
    return cIn && cIn > todayStr && cOut && cOut > cIn ? cOut : '';
  });

  // Calendar Popup state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Availability / Quote check states (always live from server, never restored stale from sessionStorage)
  const [isChecking, setIsChecking] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [availabilityError, setAvailabilityError] = useState('');

  // DOM Refs for outside click handling
  const containerRef = useRef(null);
  const calendarPopupRef = useRef(null);
  const calendarMobileRef = useRef(null);
  const checkInTriggerRef = useRef(null);
  const checkOutTriggerRef = useRef(null);

  // Sync state changes to sessionStorage and context for session persistence
  useEffect(() => {
    try {
      const stateToPersist = {
        stayType,
        roomId: stayType === 'full_home' ? 'full_home' : (currentRoom?.slug || currentRoom?.id || stayType),
        roomSlug: stayType === 'full_home' ? 'full-home' : (currentRoom?.slug || stayType),
        adults,
        children,
        guests: adults,
        checkIn,
        checkOut,
        availabilityResult: null
      };
      sessionStorage.setItem('marichin_booking_bar_state', JSON.stringify(stateToPersist));
    } catch (e) {
      console.warn('Session storage write failed:', e);
    }
  }, [stayType, adults, children, checkIn, checkOut, availabilityResult, currentRoom]);

  // Handle outside click & Escape to close calendar
  useEffect(() => {
    if (!isCalendarOpen) return;

    const handleClickOutside = (e) => {
      // Check desktop popup
      const isInsideDesktop = calendarPopupRef.current && calendarPopupRef.current.contains(e.target);
      // Check mobile bottom sheet
      const isInsideMobile = calendarMobileRef.current && calendarMobileRef.current.contains(e.target);
      // Check date trigger buttons
      const isCheckInTrigger = checkInTriggerRef.current && checkInTriggerRef.current.contains(e.target);
      const isCheckOutTrigger = checkOutTriggerRef.current && checkOutTriggerRef.current.contains(e.target);

      if (!isInsideDesktop && !isInsideMobile && !isCheckInTrigger && !isCheckOutTrigger) {
        setIsCalendarOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCalendarOpen]);

  // Prevent mobile background scroll when sheet is open
  useEffect(() => {
    if (isCalendarOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isCalendarOpen]);

  // Stay Type Change Handler: Changing stay type clears the dates
  const handleStayTypeChange = (e) => {
    const val = e.target.value;
    setStayType(val);

    // Rule: Changing the stay type clears the dates
    setCheckIn('');
    setCheckOut('');
    setAvailabilityResult(null);
    setAvailabilityError('');

    // Auto-clamp guests based on new stay type
    let newMaxAdults = 2;
    let newMaxChildren = 1;
    if (val === 'full_home') {
      newMaxAdults = fullHomeLimits.maxAdults;
      newMaxChildren = fullHomeLimits.maxChildren;
    } else if (val) {
      const room = activeRooms.find(r => r.slug === val || r.id === val);
      newMaxAdults = Number(room?.maxAdults) || 2;
      newMaxChildren = room?.maxChildren !== undefined ? Number(room.maxChildren) : ((room?.slug || '').includes('single') ? 0 : 1);
    }

    setAdults(prev => Math.min(Math.max(1, prev), newMaxAdults));
    setChildren(prev => Math.min(Math.max(0, prev), newMaxChildren));
  };

  // Date selection change from CustomBookingCalendar
  const handleDatesChange = ({ checkIn: nextIn, checkOut: nextOut }) => {
    setCheckIn(nextIn || '');
    setCheckOut(nextOut || '');
    setAvailabilityResult(null);
    setAvailabilityError('');
  };

  // Helper to discover nearest available date ranges
  const findNearestAvailableRanges = async ({ targetType, roomSlug, candidateCheckIn, stayNights, serverNearest }) => {
    const todayStr = getLocalYMD();
    const tomorrowStr = addLocalDays(todayStr, 1);
    const results = [];
    if (serverNearest?.checkIn && serverNearest?.checkOut && serverNearest.checkIn > todayStr) {
      results.push({
        checkIn: serverNearest.checkIn,
        checkOut: serverNearest.checkOut
      });
    }

    try {
      const startFrom = candidateCheckIn && candidateCheckIn > todayStr ? candidateCheckIn : tomorrowStr;
      const endTo = addLocalDays(startFrom, 60);

      const calRes = await api.getAvailabilityCalendar({
        bookingType: targetType,
        rooms: roomSlug,
        from: startFrom,
        to: endTo
      });

      const days = calRes?.data?.days;
      if (Array.isArray(days) && days.length >= stayNights) {
        for (let i = 0; i <= days.length - stayNights && results.length < 3; i++) {
          const windowSlice = days.slice(i, i + stayNights);
          const allFree = windowSlice.every((d) => d.date > todayStr && d.status === 'available');
          if (allFree) {
            const rangeIn = windowSlice[0].date;
            const rangeOut = addLocalDays(windowSlice[windowSlice.length - 1].date, 1);

            if (rangeOut && !results.some((r) => r.checkIn === rangeIn && r.checkOut === rangeOut)) {
              results.push({ checkIn: rangeIn, checkOut: rangeOut });
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to calculate nearest available ranges:', e);
    }

    return results;
  };

  // Core Availability & Server Quote Checking Function
  const checkAvailabilityWithDates = async (targetCheckIn, targetCheckOut, overrideStayType = null) => {
    const activeStay = overrideStayType || stayType;
    const cIn = targetCheckIn || checkIn;
    const cOut = targetCheckOut || checkOut;

    if (!activeStay || !cIn || !cOut || cIn >= cOut || adults < 1) {
      return;
    }

    const todayStr = getLocalYMD();
    if (cIn <= todayStr) {
      setAvailabilityError('');
      setAvailabilityResult({
        available: false,
        sameDayClosed: true,
        allRoomsOccupied: false,
        otherAvailableRooms: [],
        nearestRanges: []
      });
      return;
    }

    setIsChecking(true);
    setAvailabilityError('');
    setAvailabilityResult(null);

    const isFullHome = activeStay === 'full_home';
    const resolvedRoom = isFullHome
      ? null
      : (activeRooms.find((r) => r.slug === activeStay || r.id === activeStay || r._id === activeStay) || currentRoom || activeRooms[0]);
    const targetRoomSlug = isFullHome ? 'full-home' : (resolvedRoom?.slug || activeStay);
    const targetRoomId = isFullHome ? null : (resolvedRoom?.id || resolvedRoom?._id);

    try {
      // 1. Prepare server quote request payload
      const quotePayload = {
        bookingType: isFullHome ? 'full_home' : 'room',
        checkIn: cIn,
        checkOut: cOut
      };

      if (!isFullHome) {
        quotePayload.roomId = targetRoomId;
        quotePayload.roomSlug = targetRoomSlug;
        quotePayload.quantity = 1;
      }

      // 2. Concurrently check quote, general availability, and calendar day range
      const [quoteRes, availRes, calRes] = await Promise.allSettled([
        api.getBookingQuote(quotePayload),
        api.checkAvailability({ checkIn: cIn, checkOut: cOut, guests: adults + children }),
        api.getAvailabilityCalendar({
          bookingType: isFullHome ? 'full_home' : 'room',
          rooms: targetRoomSlug,
          from: cIn,
          to: cOut
        })
      ]);

      // Check quote validity
      const quoteSuccess = quoteRes.status === 'fulfilled' && quoteRes.value?.data;
      const quoteData = quoteSuccess ? (quoteRes.value.data.quote || quoteRes.value.data) : null;

      // Check calendar days validity for the selected stay range
      let isCalendarAvailable = true;
      if (calRes.status === 'fulfilled' && calRes.value?.data?.days) {
        const days = calRes.value.data.days;
        const stayNights = days.filter((d) => d.date >= cIn && d.date < cOut);
        if (stayNights.some((d) => d.status === 'full' || d.status === 'blocked' || d.status === 'past')) {
          isCalendarAvailable = false;
        }
      }

      const availData = availRes.status === 'fulfilled' ? availRes.value?.data : null;
      const availRooms = Array.isArray(availData?.rooms) ? availData.rooms : [];

      // Check general availability response
      let isGeneralAvailable = true;
      let selectedRoomAvail = null;
      if (availData) {
        if (isFullHome) {
          isGeneralAvailable = availRooms.length > 0 && availRooms.every((r) => r.availableUnits === (r.totalUnits || 1));
        } else {
          selectedRoomAvail = availRooms.find((r) => r.slug === targetRoomSlug || r.id === targetRoomId || r._id === targetRoomId);
          if (selectedRoomAvail && !selectedRoomAvail.isAvailable) {
            isGeneralAvailable = false;
          }
        }
      }

      const nightsCount = Math.max(
        1,
        Math.round((new Date(`${cOut}T00:00:00`) - new Date(`${cIn}T00:00:00`)) / 86400000)
      );

      if (quoteSuccess && isCalendarAvailable && isGeneralAvailable) {
        // Room/Full Home is confirmed AVAILABLE by server quote!
        const total = quoteData.pricing?.total ?? quoteData.totalAmount ?? quoteData.pricing?.totalAmount ?? 0;
        const finalNightsCount = quoteData.nightsCount || quoteData.nights?.length || nightsCount;

        // Determine if breakfast is included strictly from room / server data
        const hasBreakfast = isFullHome
          ? Boolean(
              (siteSettings?.fullHomeMealsNote && /breakfast|ಉಪಹಾರ/i.test(siteSettings.fullHomeMealsNote)) ||
              (quoteData.mealsNote && /breakfast|ಉಪಹಾರ/i.test(quoteData.mealsNote))
            )
          : Boolean(
              (resolvedRoom?.mealsIncluded && /breakfast|ಉಪಹಾರ/i.test(resolvedRoom.mealsIncluded)) ||
              resolvedRoom?.amenities?.some((a) => /breakfast|ಉಪಹಾರ/i.test(a))
            );

        setAvailabilityResult({
          available: true,
          nightsCount: finalNightsCount,
          totalPrice: total,
          quote: quoteData,
          hasBreakfast,
          remainingUnits: !isFullHome ? (selectedRoomAvail?.availableUnits ?? null) : null,
          totalUnits: !isFullHome ? (selectedRoomAvail?.totalUnits ?? resolvedRoom?.totalUnits ?? 1) : null
        });
        return;
      }

      // Not available or conflict: analyze whether other rooms are available or ALL 3 rooms are occupied
      const nightsList = [];
      for (let i = 0; i < nightsCount; i++) {
        nightsList.push(addLocalDays(cIn, i));
      }

      const otherAvailableRooms = availRooms
        .filter((r) => {
          const slug = r.slug || r.id || '';
          return r.isAvailable && (r.availableUnits || 0) > 0 && slug !== targetRoomSlug;
        })
        .map((r) => {
          const weekdayP = Number(r.pricePerNight) || 0;
          const weekendP = Number(r.weekendPrice) > 0 ? Number(r.weekendPrice) : weekdayP;
          const estimatedTotal = nightsList.reduce((acc, nStr) => {
            const [ny, nm, nd] = nStr.split('-').map(Number);
            const dow = new Date(ny, nm - 1, nd).getDay();
            return acc + (dow === 5 || dow === 6 ? weekendP : weekdayP);
          }, 0);
          const maxA = Number(r.maxAdults) || 2;
          const maxC = r.maxChildren !== undefined ? Number(r.maxChildren) : ((r.slug || '').includes('single') ? 0 : 1);
          return {
            ...r,
            estimatedTotal,
            nightsCount,
            fitsCurrentGuests: adults <= maxA && children <= maxC,
            maxAdults: maxA,
            maxChildren: maxC
          };
        });

      const allRoomsOccupied = Boolean(
        availData?.allRoomsOccupied ||
        (availRooms.length > 0 && availRooms.every((r) => !r.isAvailable || (r.availableUnits || 0) <= 0))
      );

      const quoteErr = quoteRes.status === 'rejected' ? quoteRes.reason : null;
      const serverNearest = quoteErr?.data?.nearest || quoteErr?.nearest;

      const nearestRanges = await findNearestAvailableRanges({
        targetType: isFullHome ? 'full_home' : 'room',
        roomSlug: targetRoomSlug,
        candidateCheckIn: cIn,
        stayNights: nightsCount,
        serverNearest
      });

      setAvailabilityResult({
        available: false,
        allRoomsOccupied,
        sameDayClosed: Boolean(availData?.sameDayClosed),
        otherAvailableRooms,
        checkedRoomName: isFullHome ? (isKn ? 'ಪೂರ್ಣ ಮನೆ' : 'Full Home') : getRoomDisplayName(resolvedRoom || {}),
        nearestRanges
      });

    } catch (err) {
      console.error('Availability check failed:', err);
      setAvailabilityError(
        err.message || (isKn ? 'ಲಭ್ಯತೆ ಪರಿಶೀಲನೆ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.' : 'Unable to check availability right now. Please try again.')
      );
    } finally {
      setIsChecking(false);
    }
  };

  const handleCheckClick = (e) => {
    e.preventDefault();
    checkAvailabilityWithDates(checkIn, checkOut);
  };

  // Switch to another available room keeping the current dates
  const handleSwitchRoom = (altRoom) => {
    if (!altRoom) return;
    const nextSlug = altRoom.slug || altRoom.id;
    const nextMaxAdults = Number(altRoom.maxAdults) || 2;
    const nextMaxChildren = altRoom.maxChildren !== undefined
      ? Number(altRoom.maxChildren)
      : ((nextSlug || '').includes('single') ? 0 : 1);

    setStayType(nextSlug);
    setAdults((prev) => Math.min(Math.max(1, prev), nextMaxAdults));
    setChildren((prev) => Math.min(Math.max(0, prev), nextMaxChildren));
    checkAvailabilityWithDates(checkIn, checkOut, nextSlug);
  };

  // Live re-check when cross-tab or in-tab booking/calendar updates occur
  const prevSyncRef = useRef(syncVersion);
  useEffect(() => {
    if (prevSyncRef.current === syncVersion) return;
    prevSyncRef.current = syncVersion;
    if (availabilityResult !== null && stayType && checkIn && checkOut && checkIn > getLocalYMD() && checkIn < checkOut) {
      checkAvailabilityWithDates(checkIn, checkOut);
    }
  }, [syncVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clicking one of the nearest date ranges fills the dates and re-checks
  const handleSelectNearestRange = (range) => {
    setCheckIn(range.checkIn);
    setCheckOut(range.checkOut);
    checkAvailabilityWithDates(range.checkIn, range.checkOut);
  };

  // 4. Continue to Book Handler
  const handleContinueToBook = () => {
    const isFullHome = stayType === 'full_home';
    const typeParam = isFullHome ? 'full_home' : 'room';
    const roomParam = isFullHome ? 'full-home' : (currentRoom?.slug || stayType);

    // Save state in context searchParams
    setSearchParams({
      stayType: typeParam,
      roomId: isFullHome ? 'full_home' : roomParam,
      roomSlug: roomParam,
      checkIn,
      checkOut,
      adults,
      children,
      guests: adults
    });

    if (onContinueToBook) {
      onContinueToBook({
        type: typeParam,
        room: roomParam,
        checkIn,
        checkOut,
        adults,
        children
      });
      return;
    }

    // Build URL query string: type, room, checkIn, checkOut, adults, children, guests
    const query = new URLSearchParams();
    query.set('type', typeParam);
    if (!isFullHome) {
      query.set('room', roomParam);
    }
    query.set('checkIn', checkIn);
    query.set('checkOut', checkOut);
    query.set('adults', String(adults));
    query.set('children', String(children));
    query.set('guests', String(adults)); // Consistent both ways

    navigate(`/booking?${query.toString()}`);
  };

  // Is Check Availability button enabled?
  const isCheckReady = Boolean(stayType && checkIn && checkOut && checkIn < checkOut && adults >= 1);

  // Room name display helper
  const getRoomDisplayName = (room) => {
    if (isKn) {
      if ((room.slug || '').includes('suite') || (room.name || '').includes('Suite')) return 'ಸೂಟ್ ಕೊಠಡಿ';
      if ((room.slug || '').includes('single') || (room.name || '').includes('Single')) return 'ಸಿಂಗಲ್ ಕೊಠಡಿ';
      return 'ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಕೊಠಡಿ';
    }
    return room.name || 'Standard Room';
  };

  return (
    <div ref={containerRef} className={`w-full max-w-5xl mx-auto px-3 sm:px-4 ${className}`}>
      <div className="bg-[#1B4332] rounded-2xl p-4 sm:p-6 lg:p-7 shadow-[0_12px_36px_rgba(15,42,32,0.35)] border border-[#B8964A]/25 relative">
        
        {/* Form Fields: Stay Type -> Guests -> Check-In -> Check-Out */}
        <form onSubmit={handleCheckClick} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
          
          {/* FIELD 1: Stay Type */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <label 
              htmlFor="booking-bar-stay-type"
              className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#D9BC7A] flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5 text-[#B8964A] flex-shrink-0" />
              <span>{isKn ? 'ತಂಗುವಿಕೆ ಪ್ರಕಾರ' : 'Stay Type'}</span>
            </label>
            <div className="relative w-full min-w-0">
              <select
                id="booking-bar-stay-type"
                value={stayType}
                onChange={handleStayTypeChange}
                aria-label={isKn ? "ತಂಗುವಿಕೆ ಪ್ರಕಾರ" : "Stay Type"}
                className="w-full bg-[#0F2A20] border border-[#B8964A]/25 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-[#F3EDDD] focus:outline-none focus:border-[#B8964A] transition-colors cursor-pointer whitespace-normal"
              >
                <option value="" disabled className="bg-[#0F2A20] text-[#8C988E]">
                  -- {isKn ? 'ತಂಗುವಿಕೆ ಪ್ರಕಾರವನ್ನು ಆರಿಸಿ' : 'Select Stay Type'} --
                </option>
                {activeRooms.map(room => (
                  <option key={room.id || room.slug} value={room.slug || room.id} className="bg-[#0F2A20] text-[#F3EDDD]">
                    {getRoomDisplayName(room)}
                  </option>
                ))}
                {isFullHomeEnabled && (
                  <option value="full_home" className="bg-[#0F2A20] text-[#D9BC7A] font-semibold">
                    {isKn ? `ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ (ಎಲ್ಲಾ ${totalUnitsCount} ಕೊಠಡಿಗಳು)` : `Full Home (All ${totalUnitsCount} Rooms)`}
                  </option>
                )}
              </select>
            </div>
          </div>

          {/* FIELD 2: Guests (Adults & Children with maximums from chosen stay type) */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <label 
              className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#D9BC7A] flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#B8964A] flex-shrink-0" />
                <span>{isKn ? 'ಅತಿಥಿಗಳು' : 'Guests'}</span>
              </span>
              <span className="text-[10px] lowercase text-[#D9BC7A]/75 font-normal">
                {isKn ? 'ವಯಸ್ಕರು / ಮಕ್ಕಳು' : 'adults / children'}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Adults Select */}
              <div className="relative">
                <select
                  value={adults}
                  onChange={(e) => {
                    setAdults(parseInt(e.target.value, 10));
                    setAvailabilityResult(null);
                  }}
                  aria-label={isKn ? "ವಯಸ್ಕರು" : "Adults"}
                  className="w-full bg-[#0F2A20] border border-[#B8964A]/25 rounded-xl px-2 py-2.5 text-xs sm:text-sm text-[#F3EDDD] focus:outline-none focus:border-[#B8964A] transition-colors cursor-pointer"
                >
                  {Array.from({ length: maxAdultsAllowed }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num} className="bg-[#0F2A20] text-[#F3EDDD]">
                      {num} {isKn ? (num === 1 ? 'ವಯಸ್ಕ' : 'ವಯಸ್ಕರು') : (num === 1 ? 'Adult' : 'Adults')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Children Select */}
              <div className="relative">
                <select
                  value={children}
                  onChange={(e) => {
                    setChildren(parseInt(e.target.value, 10));
                    setAvailabilityResult(null);
                  }}
                  disabled={maxChildrenAllowed === 0}
                  aria-label={isKn ? "ಮಕ್ಕಳು" : "Children"}
                  className="w-full bg-[#0F2A20] border border-[#B8964A]/25 rounded-xl px-2 py-2.5 text-xs sm:text-sm text-[#F3EDDD] focus:outline-none focus:border-[#B8964A] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {Array.from({ length: maxChildrenAllowed + 1 }, (_, i) => i).map((num) => (
                    <option key={num} value={num} className="bg-[#0F2A20] text-[#F3EDDD]">
                      {num} {isKn ? (num === 1 ? 'ಮಗು' : 'ಮಕ್ಕಳು') : (num === 1 ? 'Child' : 'Children')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* FIELD 3: Check-In */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <label className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#D9BC7A] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-[#B8964A] flex-shrink-0" />
                <span>{isKn ? 'ಆಗಮನ ದಿನಾಂಕ' : 'Check-In'}</span>
              </span>
            </label>
            <div className="relative">
              <button
                ref={checkInTriggerRef}
                type="button"
                disabled={!stayType}
                onClick={() => setIsCalendarOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={isCalendarOpen}
                aria-label={isKn ? `ಆಗಮನ ದಿನಾಂಕ: ${checkIn || 'ದಿನಾಂಕ ಆರಿಸಿ'}` : `Check-In Date: ${checkIn || 'Select Date'}`}
                className={`w-full h-[42px] bg-[#0F2A20] border border-[#B8964A]/25 rounded-xl px-3 text-left text-xs sm:text-sm transition-colors flex items-center justify-between ${
                  !stayType
                    ? 'opacity-50 cursor-not-allowed text-[#8C988E]'
                    : checkIn
                    ? 'text-[#F3EDDD] hover:border-[#B8964A] cursor-pointer'
                    : 'text-[#9AA59D] hover:border-[#B8964A] cursor-pointer'
                }`}
              >
                <span className="truncate">
                  {!stayType
                    ? (isKn ? 'ಮೊದಲು ತಂಗುವಿಕೆ ಆರಿಸಿ' : 'Choose stay type first')
                    : checkIn
                    ? formatDisplayDate(checkIn, isKn)
                    : (isKn ? 'ದಿನಾಂಕ ಆರಿಸಿ' : 'Select Date')}
                </span>
                <CalendarIcon className="w-4 h-4 text-[#B8964A] flex-shrink-0 ml-1.5 opacity-80" />
              </button>
            </div>
            {!stayType && (
              <span className="text-[10px] text-[#D9BC7A]/80 italic -mt-0.5">
                {isKn ? 'ಮೊದಲು ತಂಗುವಿಕೆ ಪ್ರಕಾರವನ್ನು ಆರಿಸಿ' : 'Choose a stay type first'}
              </span>
            )}
          </div>

          {/* FIELD 4: Check-Out */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <label className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#D9BC7A] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-[#B8964A] flex-shrink-0" />
                <span>{isKn ? 'ನಿರ್ಗಮನ ದಿನಾಂಕ' : 'Check-Out'}</span>
              </span>
            </label>
            <div className="relative">
              <button
                ref={checkOutTriggerRef}
                type="button"
                disabled={!stayType}
                onClick={() => setIsCalendarOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={isCalendarOpen}
                aria-label={isKn ? `ನಿರ್ಗಮನ ದಿನಾಂಕ: ${checkOut || 'ದಿನಾಂಕ ಆರಿಸಿ'}` : `Check-Out Date: ${checkOut || 'Select Date'}`}
                className={`w-full h-[42px] bg-[#0F2A20] border border-[#B8964A]/25 rounded-xl px-3 text-left text-xs sm:text-sm transition-colors flex items-center justify-between ${
                  !stayType
                    ? 'opacity-50 cursor-not-allowed text-[#8C988E]'
                    : checkOut
                    ? 'text-[#F3EDDD] hover:border-[#B8964A] cursor-pointer'
                    : 'text-[#9AA59D] hover:border-[#B8964A] cursor-pointer'
                }`}
              >
                <span className="truncate">
                  {!stayType
                    ? (isKn ? 'ಮೊದಲು ತಂಗುವಿಕೆ ಆರಿಸಿ' : 'Choose stay type first')
                    : checkOut
                    ? formatDisplayDate(checkOut, isKn)
                    : (isKn ? 'ದಿನಾಂಕ ಆರಿಸಿ' : 'Select Date')}
                </span>
                <CalendarIcon className="w-4 h-4 text-[#B8964A] flex-shrink-0 ml-1.5 opacity-80" />
              </button>
            </div>
            {!stayType && (
              <span className="text-[10px] text-[#D9BC7A]/80 italic -mt-0.5">
                {isKn ? 'ಮೊದಲು ತಂಗುವಿಕೆ ಪ್ರಕಾರವನ್ನು ಆರಿಸಿ' : 'Choose a stay type first'}
              </span>
            )}
          </div>

        </form>

        {/* CALENDAR POPUP: Desktop Popup under field (2 months side by side) */}
        {isCalendarOpen && stayType && (
          <div
            ref={calendarPopupRef}
            role="dialog"
            aria-modal="true"
            aria-label={isKn ? "ಬುಕಿಂಗ್ ಕ್ಯಾಲೆಂಡರ್" : "Booking Calendar"}
            className="hidden md:block absolute left-1/2 -translate-x-1/2 top-[90%] mt-3 z-50 w-[720px] max-w-[95vw] bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] border border-[#B8964A]/40 p-4 overflow-hidden"
          >
            {/* Header with Close */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F1E9D8] mb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#B8964A]" />
                <span className="font-serif font-bold text-sm text-[#0F2A20]">
                  {isKn ? 'ತಂಗುವ ದಿನಾಂಕಗಳನ್ನು ಆರಿಸಿ' : 'Select Stay Dates'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                aria-label={isKn ? "ಕ್ಯಾಲೆಂಡರ್ ಮುಚ್ಚಿ" : "Close calendar"}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-[#0F2A20] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reusable CustomBookingCalendar component */}
            <div className="overflow-hidden">
              <CustomBookingCalendar
                bookingType={stayType === 'full_home' ? 'full_home' : 'room'}
                roomId={stayType === 'full_home' ? null : (currentRoom?.id || currentRoom?._id)}
                roomSlug={stayType === 'full_home' ? 'full-home' : (currentRoom?.slug || stayType)}
                roomName={
                  stayType === 'full_home'
                    ? (isKn ? `ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ (ಎಲ್ಲಾ ${totalUnitsCount} ಕೊಠಡಿಗಳು)` : `Full Home (All ${totalUnitsCount} Rooms)`)
                    : (isKn ? getRoomDisplayName(currentRoom || {}) : (currentRoom?.name || 'Standard Room'))
                }
                pricePerNight={
                  stayType === 'full_home'
                    ? (resolvedFullHomePrice || Number(siteSettings?.fullHomePricePerNight) || 35000)
                    : Number(currentRoom?.pricePerNight) || 8000
                }
                mealsNote={
                  stayType === 'full_home'
                    ? (siteSettings?.fullHomeMealsNote || (isKn ? 'ಬೆಳಗಿನ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ' : 'Morning breakfast included'))
                    : (currentRoom?.mealsIncluded || (isKn ? 'ಬೆಳಗಿನ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ' : 'Morning breakfast included'))
                }
                checkIn={checkIn}
                checkOut={checkOut}
                onDatesChange={handleDatesChange}
                serverQuote={availabilityResult?.quote || null}
                isKn={isKn}
              />
            </div>

            {/* Confirm button inside desktop popup */}
            {checkIn && checkOut && (
              <div className="mt-3 pt-3 border-t border-[#F1E9D8] flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(false)}
                  className="px-5 py-2 rounded-xl text-xs uppercase tracking-wider font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isKn ? 'ದಿನಾಂಕಗಳನ್ನು ದೃಢೀಕರಿಸಿ' : 'Confirm Dates'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* CALENDAR MOBILE: Bottom Sheet / Full-width Panel (1 month with touch navigation) */}
        {isCalendarOpen && stayType && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsCalendarOpen(false)}
              aria-hidden="true"
            />
            {/* Sheet Panel */}
            <div
              ref={calendarMobileRef}
              role="dialog"
              aria-modal="true"
              aria-label={isKn ? "ಬುಕಿಂಗ್ ಕ್ಯಾಲೆಂಡರ್" : "Booking Calendar"}
              className="relative z-10 w-full max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl shadow-2xl border-t-2 border-[#B8964A] p-3 pb-6"
            >
              {/* Drag indicator & Header */}
              <div className="flex flex-col items-center mb-2">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-3" />
                <div className="w-full flex items-center justify-between pb-2 border-b border-[#F1E9D8]">
                  <span className="font-serif font-bold text-base text-[#0F2A20]">
                    {isKn ? 'ತಂಗುವ ದಿನಾಂಕಗಳನ್ನು ಆರಿಸಿ' : 'Select Stay Dates'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(false)}
                    aria-label={isKn ? "ಕ್ಯಾಲೆಂಡರ್ ಮುಚ್ಚಿ" : "Close calendar"}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-[#0F2A20] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Reused CustomBookingCalendar */}
              <CustomBookingCalendar
                bookingType={stayType === 'full_home' ? 'full_home' : 'room'}
                roomId={stayType === 'full_home' ? null : (currentRoom?.id || currentRoom?._id)}
                roomSlug={stayType === 'full_home' ? 'full-home' : (currentRoom?.slug || stayType)}
                roomName={
                  stayType === 'full_home'
                    ? (isKn ? `ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ (ಎಲ್ಲಾ ${totalUnitsCount} ಕೊಠಡಿಗಳು)` : `Full Home (All ${totalUnitsCount} Rooms)`)
                    : (isKn ? getRoomDisplayName(currentRoom || {}) : (currentRoom?.name || 'Standard Room'))
                }
                pricePerNight={
                  stayType === 'full_home'
                    ? (resolvedFullHomePrice || Number(siteSettings?.fullHomePricePerNight) || 35000)
                    : Number(currentRoom?.pricePerNight) || 8000
                }
                mealsNote={
                  stayType === 'full_home'
                    ? (siteSettings?.fullHomeMealsNote || (isKn ? 'ಬೆಳಗಿನ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ' : 'Morning breakfast included'))
                    : (currentRoom?.mealsIncluded || (isKn ? 'ಬೆಳಗಿನ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ' : 'Morning breakfast included'))
                }
                checkIn={checkIn}
                checkOut={checkOut}
                onDatesChange={handleDatesChange}
                serverQuote={availabilityResult?.quote || null}
                isKn={isKn}
              />

              {/* Confirm button on mobile sheet */}
              {checkIn && checkOut && (
                <div className="mt-4 pt-3 border-t border-[#F1E9D8]">
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(false)}
                    className="w-full h-11 rounded-xl text-xs uppercase tracking-wider font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isKn ? 'ದಿನಾಂಕಗಳನ್ನು ದೃಢೀಕರಿಸಿ' : 'Confirm Dates'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ACTION / RESULTS SECTION */}
        <div className="mt-4 pt-4 border-t border-[#B8964A]/20">
          
          {/* STATE 1: API Error */}
          {availabilityError && (
            <div className="bg-red-950/60 border border-red-500/50 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm text-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span>{availabilityError}</span>
              </div>
              <button
                type="button"
                onClick={handleCheckClick}
                disabled={isChecking}
                className="px-4 py-1.5 rounded-lg bg-red-800/80 hover:bg-red-700 text-white font-semibold text-xs tracking-wider uppercase transition-colors self-end sm:self-auto cursor-pointer"
              >
                {isKn ? 'ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ' : 'Try Again'}
              </button>
            </div>
          )}

          {/* STATE 2: AVAILABLE RESULT */}
          {availabilityResult?.available === true && !isChecking && (
            <div className="bg-[#0F2A20] rounded-xl border border-emerald-500/50 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg animate-fadeIn">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      {isKn 
                        ? `${availabilityResult.nightsCount} ರಾತ್ರಿಗಳಿಗೆ ಲಭ್ಯವಿದೆ` 
                        : `Available for ${availabilityResult.nightsCount} ${availabilityResult.nightsCount === 1 ? 'night' : 'nights'}`}
                    </span>
                  </span>

                  {availabilityResult.hasBreakfast && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-200 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <Utensils className="w-3 h-3 text-[#D9BC7A]" />
                      <span>{isKn ? 'ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ' : 'Breakfast included'}</span>
                    </span>
                  )}

                  {availabilityResult.remainingUnits === 1 && availabilityResult.totalUnits > 1 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-200 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full">
                      <span>{isKn ? 'ಕೇವಲ 1 ಕೊಠಡಿ ಬಾಕಿ' : 'Only 1 unit left'}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-serif font-bold text-[#D9BC7A]">
                    ₹{Number(availabilityResult.totalPrice).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-[#F3EDDD]/70">
                    {isKn ? 'ಒಟ್ಟು ಮೊತ್ತ (ತೆರಿಗೆ ಸೇರಿ)' : 'total tariff'}
                  </span>
                </div>
              </div>

              {/* Continue to Book Gold Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleContinueToBook}
                  className="w-full md:w-auto h-[46px] px-6 rounded-[12px] text-xs uppercase tracking-wider font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all duration-300 shadow-[0_4px_16px_rgba(184,150,74,0.35)] flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <span>{isKn ? 'ಬುಕಿಂಗ್ ಮುಂದುವರಿಸಿ' : 'Continue to Book'}</span>
                  <ArrowRight className="w-4 h-4 text-[#0F2A20]" />
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: NOT AVAILABLE RESULT (Selected room occupied / All rooms occupied / Same-day closed) */}
          {availabilityResult?.available === false && !isChecking && (
            <div className="bg-[#0F2A20] rounded-xl border border-red-500/60 p-4 sm:p-5 flex flex-col gap-3.5 shadow-lg animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-red-300">
                    {availabilityResult.sameDayClosed
                      ? (isKn ? 'ಇಂದಿನ ಚೆಕ್-ಇನ್ ಮುಚ್ಚಲಾಗಿದೆ' : 'Same-day check-in is closed')
                      : availabilityResult.allRoomsOccupied
                      ? (isKn ? 'ಈ ದಿನಾಂಕಗಳಲ್ಲಿ ಎಲ್ಲಾ 3 ಕೊಠಡಿಗಳೂ ಭರ್ತಿಯಾಗಿವೆ' : 'All rooms are occupied for these dates')
                      : (isKn
                          ? `${availabilityResult.checkedRoomName || 'ಆಯ್ಕೆ ಮಾಡಿದ ಕೊಠಡಿ'} ಈ ದಿನಾಂಕಗಳಲ್ಲಿ ಲಭ್ಯವಿಲ್ಲ`
                          : `${availabilityResult.checkedRoomName || 'Selected room'} is occupied for these dates`)}
                  </h4>
                  <p className="text-xs text-[#F3EDDD]/80">
                    {availabilityResult.sameDayClosed
                      ? (isKn ? 'ಅತಿಥಿ ಬುಕಿಂಗ್‌ಗಳು ಕನಿಷ್ಠ ನಾಳೆಯಿಂದ ಪ್ರಾರಂಭವಾಗುತ್ತವೆ. ದಯವಿಟ್ಟು ನಾಳೆ ಅಥವಾ ನಂತರದ ದಿನಾಂಕವನ್ನು ಆರಿಸಿ.' : 'Earliest public check-in is tomorrow. Please select tomorrow or a later check-in date.')
                      : availabilityResult.allRoomsOccupied
                      ? (availabilityResult.nearestRanges && availabilityResult.nearestRanges.length > 0
                          ? (isKn ? 'ಎಲ್ಲಾ ಕೊಠಡಿಗಳು ಕಾಯ್ದಿರಿಸಲಾಗಿವೆ. ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಹತ್ತಿರದ ಲಭ್ಯ ದಿನಾಂಕಗಳನ್ನು ಆರಿಸಿ:' : 'No rooms (Standard, Suite, or Single) are free for your selected dates. Choose nearby available dates below:')
                          : (isKn ? 'ಎಲ್ಲಾ ಕೊಠಡಿಗಳು ಭರ್ತಿಯಾಗಿವೆ. ದಯವಿಟ್ಟು ಕ್ಯಾಲೆಂಡರ್ ತೆರೆದು ಬೇರೆ ದಿನಾಂಕಗಳನ್ನು ಆರಿಸಿ.' : 'No rooms are free for your selected dates. Please open the calendar and try another date range.'))
                      : availabilityResult.otherAvailableRooms && availabilityResult.otherAvailableRooms.length > 0
                      ? (isKn ? 'ಇದೇ ದಿನಾಂಕಗಳಲ್ಲಿ ಕೆಳಗಿನ ಇತರ ಕೊಠಡಿಗಳು ಲಭ್ಯವಿವೆ — ಬದಲಾಯಿಸಲು ಕ್ಲಿಕ್ ಮಾಡಿ:' : 'Other rooms are available for these exact dates — click below to switch, or pick nearby dates:')
                      : (availabilityResult.nearestRanges && availabilityResult.nearestRanges.length > 0
                          ? (isKn ? 'ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಹತ್ತಿರದ ಲಭ್ಯವಿರುವ ದಿನಾಂಕಗಳನ್ನು ಆರಿಸಿ:' : 'Please choose one of the nearest available date ranges below:')
                          : (isKn ? 'ದಯವಿಟ್ಟು ಕ್ಯಾಲೆಂಡರ್ ತೆರೆದು ಬೇರೆ ದಿನಾಂಕಗಳನ್ನು ಆರಿಸಿ.' : 'Please open the calendar and choose alternative dates.'))}
                  </p>
                </div>
              </div>

              {/* Suggested Other Available Rooms (when selected room is occupied) */}
              {!availabilityResult.sameDayClosed && availabilityResult.otherAvailableRooms && availabilityResult.otherAvailableRooms.length > 0 && (
                <div className="bg-[#0A1A13]/80 border border-emerald-500/35 rounded-xl p-3 space-y-2.5">
                  <div className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold">
                    {isKn
                      ? `ಇದೇ ದಿನಾಂಕಗಳಿಗೆ ಲಭ್ಯವಿರುವ ಇತರ ಕೊಠಡಿಗಳು (${formatDateRange(checkIn, checkOut, isKn)}):`
                      : `Other rooms available for ${formatDateRange(checkIn, checkOut, isKn)}:`}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {availabilityResult.otherAvailableRooms.map((alt) => (
                      <div
                        key={alt.slug || alt._id || alt.id}
                        className="flex items-center justify-between gap-3 bg-[#123326] border border-[#B8964A]/30 rounded-lg px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#F3EDDD] truncate">
                            {getRoomDisplayName(alt)}
                          </div>
                          <div className="text-[11px] text-[#F3EDDD]/75 flex flex-wrap items-center gap-x-2">
                            <span className="text-emerald-300 font-medium">
                              {alt.availableUnits} {isKn ? 'ಲಭ್ಯ' : (alt.availableUnits === 1 ? 'unit free' : 'units free')}
                            </span>
                            <span>•</span>
                            <span>₹{Number(alt.estimatedTotal || alt.pricePerNight).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="text-[10px] text-[#D9BC7A]/80">
                            {isKn
                              ? `ಗರಿಷ್ಠ: ${alt.maxAdults} ವಯಸ್ಕರು${alt.maxChildren > 0 ? ` + ${alt.maxChildren} ಮಕ್ಕಳು` : ' (ಮಕ್ಕಳಿಲ್ಲ)'}`
                              : `Fits ${alt.maxAdults} Adults${alt.maxChildren > 0 ? ` + ${alt.maxChildren} Child` : ' (No children)'}`}
                            {!alt.fitsCurrentGuests && (isKn ? ' · ಅತಿಥಿ ಸಂಖ್ಯೆ ಹೊಂದಿಸಲಾಗುವುದು' : ' · adjusts guests')}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSwitchRoom(alt)}
                          className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#B8964A] hover:bg-[#D9BC7A] text-[#0F2A20] text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {isKn ? 'ಆರಿಸಿ' : `Switch`}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nearest Available Date Ranges Buttons */}
              {availabilityResult.nearestRanges && availabilityResult.nearestRanges.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] uppercase tracking-wider text-[#D9BC7A] font-semibold w-full sm:w-auto">
                    {isKn ? 'ಹತ್ತಿರದ ಲಭ್ಯ ದಿನಾಂಕಗಳು:' : 'Nearest available:'}
                  </span>
                  {availabilityResult.nearestRanges.map((range, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectNearestRange(range)}
                      className="px-3 py-1.5 rounded-lg border border-[#B8964A]/60 bg-[#1B4332] hover:bg-[#B8964A] hover:text-[#0F2A20] text-[#D9BC7A] text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-sm cursor-pointer hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transform-none"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#B8964A] group-hover:text-[#0F2A20]" />
                      <span>{formatDateRange(range.checkIn, range.checkOut, isKn)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STATE 4: Default Initial Check Button or Loading State */}
          {(!availabilityResult || isChecking) && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-[#F3EDDD]/70">
                {!stayType
                  ? (isKn ? 'ದಿನಾಂಕಗಳನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಲು ಮೊದಲು ತಂಗುವಿಕೆ ಪ್ರಕಾರವನ್ನು ಆರಿಸಿ' : 'Choose a stay type first to enable dates')
                  : !checkIn || !checkOut
                  ? (isKn ? 'ಲಭ್ಯತೆ ಪರಿಶೀಲಿಸಲು ತಂಗುವ ದಿನಾಂಕಗಳನ್ನು ಆರಿಸಿ' : 'Select your check-in & check-out dates to check rates')
                  : (isKn ? 'ದರ ಮತ್ತು ಲಭ್ಯತೆಯನ್ನು ಪರಿಶೀಲಿಸಲು ಸಿದ್ಧ' : 'Ready to verify real-time tariff & availability')}
              </div>

              <button
                type="submit"
                onClick={handleCheckClick}
                disabled={!isCheckReady || isChecking}
                aria-label={isKn ? "ಲಭ್ಯತೆ ಪರಿಶೀಲಿಸಿ" : "Check Availability"}
                className="w-full sm:w-auto min-w-[220px] h-[46px] rounded-[12px] text-xs uppercase tracking-wider font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all duration-300 shadow-[0_4px_16px_rgba(184,150,74,0.35)] flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0F2A20] motion-reduce:animate-none" />
                    <span>{isKn ? 'ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Checking Availability...'}</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-[#0F2A20]" />
                    <span>{isKn ? 'ಲಭ್ಯತೆ ಪರಿಶೀಲಿಸಿ' : 'Check Availability'}</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
