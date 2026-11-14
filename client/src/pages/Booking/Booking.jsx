import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useBooking, isWeekendNight } from '../../context/BookingContext';
import { useAdmin } from '../../context/AdminContext';
import { 
  Calendar as CalendarIcon, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  ShieldCheck, 
  Sparkles, 
  CreditCard, 
  QrCode, 
  ArrowRight, 
  ArrowLeft,
  Printer, 
  Download,
  Info,
  Clock,
  MapPin,
  Lock,
  PhoneCall,
  Share2,
  FileText,
  X,
  Loader2,
  BedDouble,
  Minus,
  Plus,
  Home as HomeIcon,
  Check,
  CheckSquare,
  Square,
  ImageOff
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { InclusionsSection } from '../../components/Inclusions/InclusionsSection';
import { CustomBookingCalendar } from './CustomBookingCalendar';
import { BookingPassCard } from '../../components/Booking/BookingPassCard';
import { api } from '../../services/api';
import { INCLUSIONS_DATA, HOMESTAY_INFO } from '../../data/homestayData';
import {
  getRoomBalcony,
  getRoomUnitsCount,
  getRoomTotalUnits,
  buildFullHomeBreakdown
} from '../../utils/homestayFormatting';
import {
  calculateTierRefund,
  formatCancellationSummaryText
} from '../../utils/refundPolicy';

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

export const Booking = () => {
  const { t, language } = useLanguage();
  const isKn = language === 'kn';
  const [urlParams, setUrlParams] = useSearchParams();
  const navigate = useNavigate();

  const { rooms, siteSettings, packages, inclusions, resolvedFullHomePrice, syncVersion, broadcastAdminSync } = useAdmin();
  const { 
    searchParams, 
    setSearchParams: setContextSearchParams, 
    advancePercent, 
    setAdvancePercent,
    appliedPromo,
    promoError,
    applyPromoCode,
    processBooking,
    confirmedBooking,
    setConfirmedBooking,
    clearConfirmedBooking,
    bookingError
  } = useBooking();

  // Progress Bar Steps: 1: Stay Type & Guests, 2: Dates, 3: Details, 4: Review and Pay
  const [currentStep, setCurrentStep] = useState(() => {
    const rawStep = parseInt(urlParams.get('step'), 10);
    if (rawStep >= 1 && rawStep <= 4) return rawStep;
    return 1;
  });

  // Stay Type: 'room' | 'full_home'
  const [stayType, setStayType] = useState(() => {
    const type = urlParams.get('type');
    const pkg = (urlParams.get('package') || '').toLowerCase();
    if (type === 'full_home' || pkg.includes('entire-homestay') || pkg.includes('all-5-rooms') || pkg.includes('entire')) {
      return 'full_home';
    }
    return 'room';
  });

  // Package tracking if guest came through package link
  const [activePackage, setActivePackage] = useState(() => {
    return (urlParams.get('package') || '').toLowerCase();
  });

  // Single room selection state (each booking is for exactly ONE room)
  const [selectedRoomSlug, setSelectedRoomSlug] = useState(() => {
    const targetRoom = (urlParams.get('room') || '').toLowerCase();
    if (targetRoom) {
      return targetRoom;
    }
    return 'standard-room';
  });

  // Full Home Settings (automatically synced with Entire Homestay package)
  const isFullHomeEnabled = siteSettings?.fullHomeEnabled !== false;
  const fullHomePricePerNight = resolvedFullHomePrice || Number(siteSettings?.fullHomePricePerNight) || 35000;
  const fullHomeMinNights = Number(siteSettings?.fullHomeMinNights) || 1;
  const fullHomeMealsNote = siteSettings?.fullHomeMealsNote || (isKn ? 'ಬೆಳಗಿನ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ' : 'Morning breakfast included');

  // Matched Admin Package if came via /booking?package=<slug>
  const selectedPackageDoc = useMemo(() => {
    if (!activePackage || !Array.isArray(packages)) return null;
    const activeClean = packages.filter((p) => p?.isActive !== false);
    const exactMatch = activeClean.find((p) => {
      const pSlug = String(p.slug || p.id || '').toLowerCase();
      return pSlug === activePackage;
    });
    if (exactMatch) return exactMatch;

    return activeClean
      .filter((p) => {
        const pSlug = String(p.slug || p.id || '').toLowerCase();
        return pSlug && (pSlug.includes(activePackage) || activePackage.includes(pSlug));
      })
      .sort((a, b) => String(b.slug || b.id || '').length - String(a.slug || a.id || '').length)[0] || null;
  }, [activePackage, packages]);

  const isEntirePkg = useMemo(() => {
    const s = String(selectedPackageDoc?.slug || activePackage || '').toLowerCase();
    return s.includes('entire-homestay') || s.includes('all-5-rooms') || s === 'full-home';
  }, [selectedPackageDoc, activePackage]);

  const isPackagePriceOverride = Boolean(
    stayType === 'room' &&
    !isEntirePkg &&
    selectedPackageDoc &&
    Number(selectedPackageDoc.price) > 0
  );

  // Full Home Guest Limits (calculated from rooms)
  const fullHomeLimits = useMemo(() => {
    const adultSum = (rooms || []).reduce((sum, r) => sum + (Number(r.maxAdults || 2) * (Number(r.totalUnits) || 1)), 0);
    const childSum = (rooms || []).reduce((sum, r) => sum + (Number(r.maxChildren || 0) * (Number(r.totalUnits) || 1)), 0);
    return {
      maxAdults: adultSum || 10,
      maxChildren: childSum || 6
    };
  }, [rooms]);

  // Selected Room Doc
  const currentRoom = useMemo(() => {
    return (rooms || []).find(r => r.slug === selectedRoomSlug || r.id === selectedRoomSlug) || rooms?.[0] || {
      name: 'Standard Room',
      slug: 'standard-room',
      pricePerNight: 8000,
      maxAdults: 2,
      maxChildren: 1,
      hasBalcony: true
    };
  }, [rooms, selectedRoomSlug]);

  const maxAdultsAllowed = stayType === 'full_home' 
    ? fullHomeLimits.maxAdults 
    : (Number(currentRoom?.maxAdults) || 2);

  const maxChildrenAllowed = stayType === 'full_home' 
    ? fullHomeLimits.maxChildren 
    : (currentRoom?.maxChildren !== undefined ? Number(currentRoom.maxChildren) : ((currentRoom?.slug || '').includes('single') ? 0 : 1));

  // Guests State
  const [adults, setAdults] = useState(() => {
    const rawA = urlParams.get('adults');
    const rawG = urlParams.get('guests');
    const fromSearch = searchParams?.adults ?? searchParams?.guests;
    const g = parseInt(rawA || rawG || fromSearch || 2, 10);
    return Math.min(Math.max(1, isNaN(g) ? 2 : g), maxAdultsAllowed);
  });
  const [children, setChildren] = useState(() => {
    const rawC = urlParams.get('children');
    const fromSearch = searchParams?.children;
    const c = parseInt(rawC ?? fromSearch ?? 0, 10);
    return Math.min(Math.max(0, isNaN(c) ? 0 : c), maxChildrenAllowed);
  });

  // Auto-clamp guests when room or stayType changes
  useEffect(() => {
    if (adults > maxAdultsAllowed) {
      setAdults(maxAdultsAllowed);
    }
    if (children > maxChildrenAllowed) {
      setChildren(maxChildrenAllowed);
    }
  }, [stayType, selectedRoomSlug, maxAdultsAllowed, maxChildrenAllowed, adults, children]);

  // Dates State (enforce earliest public check-in = tomorrow)
  const [checkIn, setCheckIn] = useState(() => {
    const todayStr = getLocalYMD();
    const rawIn = urlParams.get('checkIn') || searchParams.checkIn || '';
    return rawIn && rawIn > todayStr ? rawIn : '';
  });
  const [checkOut, setCheckOut] = useState(() => {
    const todayStr = getLocalYMD();
    const rawIn = urlParams.get('checkIn') || searchParams.checkIn || '';
    const rawOut = urlParams.get('checkOut') || searchParams.checkOut || '';
    return rawIn && rawIn > todayStr && rawOut && rawOut > rawIn ? rawOut : '';
  });

  // Live availability & conflict state for selected dates / room
  const [dateConflict, setDateConflict] = useState(null);
  const [isCheckingDateConflict, setIsCheckingDateConflict] = useState(false);
  const [roomsAvailabilityMap, setRoomsAvailabilityMap] = useState({});

  // Keep URL query in sync so refresh or sharing preserves stay type, room, and dates
  const updateUrlQuery = useCallback((paramsUpdate) => {
    setUrlParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(paramsUpdate).forEach(([k, v]) => {
        if (v === null || v === undefined || v === '') {
          next.delete(k);
        } else {
          next.set(k, String(v));
        }
      });
      return next;
    }, { replace: true });
  }, [setUrlParams]);

  // Sync state changes with URL query (consistent for both guests and adults + children)
  useEffect(() => {
    updateUrlQuery({
      type: stayType,
      room: stayType === 'room' ? selectedRoomSlug : null,
      package: activePackage || null,
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      adults: adults,
      guests: adults,
      children: children
    });
  }, [stayType, selectedRoomSlug, activePackage, checkIn, checkOut, adults, children, updateUrlQuery]);

  // Server Quote State
  const [serverQuote, setServerQuote] = useState(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState('');

  // Fetch verified server quote
  const fetchQuote = useCallback(async () => {
    if (!checkIn || !checkOut || checkIn >= checkOut) {
      setServerQuote(null);
      return;
    }

    setIsLoadingQuote(true);
    setQuoteError('');
    try {
      const quotePayload = {
        bookingType: stayType,
        checkIn,
        checkOut,
        packageSlug: activePackage || '',
        promoCode: appliedPromo?.code || '',
        advanceOption: advancePercent
      };
      if (stayType === 'room') {
        quotePayload.roomId = currentRoom?._id || currentRoom?.id;
        quotePayload.roomSlug = currentRoom?.slug || selectedRoomSlug;
        quotePayload.quantity = 1;
      }

      const res = await api.getBookingQuote(quotePayload);
      if (res?.data) {
        const q = res.data.quote || res.data;
        const normalized = {
          ...q,
          totalAmount: q.pricing?.total ?? q.totalAmount ?? q.pricing?.totalAmount ?? 0,
          baseAmount: q.pricing?.baseAmount ?? q.baseAmount,
          discount: q.pricing?.discount ?? q.discount ?? 0,
          taxAmount: q.pricing?.taxAmount ?? q.taxAmount ?? 0,
          advanceAmount: q.advanceAmount ?? q.pricing?.advancePaid ?? 0,
          balanceDue: q.balanceDue ?? 0
        };
        setServerQuote(normalized);
      }
    } catch (err) {
      console.warn('Failed to fetch server quote:', err);
      setQuoteError(err.message || 'Unable to calculate official tariff quote');
    } finally {
      setIsLoadingQuote(false);
    }
  }, [stayType, currentRoom, selectedRoomSlug, activePackage, rooms, resolvedFullHomePrice, checkIn, checkOut, appliedPromo, advancePercent]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote, syncVersion]);

  // Verify live room/date availability whenever dates, stay type, room, or syncVersion changes
  const verifyDatesAvailability = useCallback(async () => {
    if (!checkIn || !checkOut || checkIn >= checkOut) {
      setDateConflict(null);
      setRoomsAvailabilityMap({});
      return;
    }

    const todayStr = getLocalYMD();
    if (checkIn <= todayStr) {
      setDateConflict({
        occupied: true,
        sameDayClosed: true,
        allRoomsOccupied: false,
        otherAvailableRooms: []
      });
      return;
    }

    setIsCheckingDateConflict(true);
    try {
      const targetSlug = stayType === 'full_home' ? 'full-home' : (currentRoom?.slug || selectedRoomSlug);
      const targetId = stayType === 'full_home' ? null : (currentRoom?._id || currentRoom?.id);

      const [availRes, calRes] = await Promise.allSettled([
        api.checkAvailability({ checkIn, checkOut, guests: adults + children }),
        api.getAvailabilityCalendar({
          bookingType: stayType,
          rooms: targetSlug,
          from: checkIn,
          to: checkOut
        })
      ]);

      const availData = availRes.status === 'fulfilled' ? availRes.value?.data : null;
      const availRooms = Array.isArray(availData?.rooms) ? availData.rooms : [];

      const mapBySlug = {};
      availRooms.forEach((r) => {
        if (r.slug) mapBySlug[r.slug] = r;
        if (r._id) mapBySlug[String(r._id)] = r;
        if (r.id) mapBySlug[String(r.id)] = r;
      });
      setRoomsAvailabilityMap(mapBySlug);

      let calendarBlocked = false;
      if (calRes.status === 'fulfilled' && Array.isArray(calRes.value?.data?.days)) {
        const stayNights = calRes.value.data.days.filter((d) => d.date >= checkIn && d.date < checkOut);
        if (stayNights.some((d) => d.status === 'full' || d.status === 'blocked' || d.status === 'past')) {
          calendarBlocked = true;
        }
      }

      let apiBlocked = false;
      if (availData) {
        if (availData.sameDayClosed) {
          apiBlocked = true;
        } else if (stayType === 'full_home') {
          apiBlocked = !(availRooms.length > 0 && availRooms.every((r) => r.availableUnits === (r.totalUnits || 1)));
        } else {
          const matchedRoom = mapBySlug[targetSlug] || (targetId ? mapBySlug[String(targetId)] : null);
          if (matchedRoom && (!matchedRoom.isAvailable || (matchedRoom.availableUnits || 0) <= 0)) {
            apiBlocked = true;
          }
        }
      }

      if (availData?.sameDayClosed) {
        setDateConflict({
          occupied: true,
          sameDayClosed: true,
          allRoomsOccupied: false,
          otherAvailableRooms: []
        });
        return;
      }

      if (calendarBlocked || apiBlocked) {
        const nightsLen = Math.max(
          1,
          Math.round((new Date(`${checkOut}T00:00:00`) - new Date(`${checkIn}T00:00:00`)) / 86400000)
        );
        const nightsArr = [];
        for (let i = 0; i < nightsLen; i++) nightsArr.push(addLocalDays(checkIn, i));

        const otherAvailableRooms = availRooms
          .filter((r) => r.isAvailable && (r.availableUnits || 0) > 0 && (stayType === 'full_home' || r.slug !== targetSlug))
          .map((r) => {
            const wDay = Number(r.pricePerNight) || 0;
            const wEnd = Number(r.weekendPrice) > 0 ? Number(r.weekendPrice) : wDay;
            const estTotal = nightsArr.reduce((acc, nStr) => {
              const [ny, nm, nd] = nStr.split('-').map(Number);
              const dow = new Date(ny, nm - 1, nd).getDay();
              return acc + (dow === 5 || dow === 6 ? wEnd : wDay);
            }, 0);
            const maxA = Number(r.maxAdults) || 2;
            const maxC = r.maxChildren !== undefined ? Number(r.maxChildren) : ((r.slug || '').includes('single') ? 0 : 1);
            return {
              ...r,
              estimatedTotal: estTotal,
              maxAdults: maxA,
              maxChildren: maxC,
              fitsCurrentGuests: adults <= maxA && children <= maxC
            };
          });

        const allRoomsOccupied = Boolean(
          availData?.allRoomsOccupied ||
          (availRooms.length > 0 && availRooms.every((r) => !r.isAvailable || (r.availableUnits || 0) <= 0))
        );

        setDateConflict({
          occupied: true,
          sameDayClosed: false,
          allRoomsOccupied,
          otherAvailableRooms,
          checkedRoomName: stayType === 'full_home'
            ? (isKn ? 'ಪೂರ್ಣ ಮನೆ (ಎಲ್ಲಾ 5 ಕೊಠಡಿಗಳು)' : 'Full Home (All 5 Rooms)')
            : (currentRoom?.name || selectedRoomSlug)
        });
      } else {
        setDateConflict(null);
      }
    } catch (e) {
      console.warn('Availability conflict verification skipped:', e);
    } finally {
      setIsCheckingDateConflict(false);
    }
  }, [checkIn, checkOut, stayType, currentRoom, selectedRoomSlug, adults, children, isKn]);

  useEffect(() => {
    verifyDatesAvailability();
  }, [verifyDatesAvailability, syncVersion]);

  const handleSwitchAvailableRoom = (altRoom) => {
    if (!altRoom) return;
    const nextSlug = altRoom.slug || altRoom.id;
    const nextMaxA = Number(altRoom.maxAdults) || 2;
    const nextMaxC = altRoom.maxChildren !== undefined ? Number(altRoom.maxChildren) : ((nextSlug || '').includes('single') ? 0 : 1);
    setStayType('room');
    setSelectedRoomSlug(nextSlug);
    setAdults((prev) => Math.min(Math.max(1, prev), nextMaxA));
    setChildren((prev) => Math.min(Math.max(0, prev), nextMaxC));
    setCollisionError('');
  };

  // Guest Details Form State
  const [guestData, setGuestData] = useState({
    fullName: '',
    email: '',
    phone: '',
    specialRequests: ''
  });
  const [guestErrors, setGuestErrors] = useState({});

  // Payment & Hold State
  const [paymentMethod, setPaymentMethod] = useState('Razorpay');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [collisionError, setCollisionError] = useState('');
  const [nearestAvailableDates, setNearestAvailableDates] = useState(null);

  // Razorpay configuration state
  const [razorpayConfig, setRazorpayConfig] = useState({ configured: false, keyId: null });
  const [paymentError, setPaymentError] = useState('');
  const [activeHeldBooking, setActiveHeldBooking] = useState(null);
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState(null);

  useEffect(() => {
    api.getRazorpayConfig()
      .then((res) => {
        const cfg = res?.data || res;
        if (cfg && (cfg.configured !== undefined || cfg.enabled !== undefined)) {
          const isConfigured = Boolean(cfg.configured ?? cfg.enabled);
          setRazorpayConfig({
            configured: isConfigured,
            enabled: isConfigured,
            keyId: cfg.keyId || null
          });
        }
      })
      .catch((err) => {
        console.warn('Could not fetch Razorpay configuration:', err);
      });
  }, []);

  // Resolve checkout logo safely so Razorpay's HTTPS iframe never fetches http://localhost (Mixed Content + PNA loopback block)
  const resolveRazorpayLogoDataUrl = async (logoPath = '/images/logo.jpeg') => {
    try {
      const origin = window.location.origin || '';
      const resolvedUrl = new URL(logoPath, origin || 'https://localhost').href;
      const isHttpsPublic = resolvedUrl.startsWith('https://') &&
        !/^https:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(resolvedUrl);
      if (isHttpsPublic) {
        return resolvedUrl;
      }

      return await new Promise((resolve) => {
        const img = new Image();
        let settled = false;
        const finish = (val) => {
          if (!settled) {
            settled = true;
            resolve(val);
          }
        };
        const timer = setTimeout(() => finish(undefined), 1500);
        img.onload = () => {
          clearTimeout(timer);
          try {
            const size = 128;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx) return finish(undefined);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, size, size);
            const scale = Math.min(size / (img.width || size), size / (img.height || size));
            const w = (img.width || size) * scale;
            const h = (img.height || size) * scale;
            ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
            finish(canvas.toDataURL('image/jpeg', 0.85));
          } catch {
            finish(undefined);
          }
        };
        img.onerror = () => {
          clearTimeout(timer);
          finish(undefined);
        };
        img.src = logoPath;
      });
    } catch {
      return undefined;
    }
  };

  // Razorpay checkout.js script loader
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Hold expiration countdown
  useEffect(() => {
    if (!activeHeldBooking?.holdExpiresAt) {
      setHoldSecondsRemaining(null);
      return;
    }
    const updateTimer = () => {
      const remainingMs = new Date(activeHeldBooking.holdExpiresAt).getTime() - Date.now();
      const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));
      setHoldSecondsRemaining(remainingSec);
      if (remainingSec <= 0) {
        setActiveHeldBooking(null);
      }
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [activeHeldBooking]);

  // Inclusions Modal State
  const [showInclusionsModal, setShowInclusionsModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Promo code input
  const [promoInput, setPromoInput] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setIsApplyingPromo(true);
    await applyPromoCode(promoInput);
    setIsApplyingPromo(false);
  };

  // Calculated stay nights & weekend breakdown
  const { nightsCount, weekdayNightsCount, weekendNightsCount } = useMemo(() => {
    if (!checkIn || !checkOut || checkIn >= checkOut) {
      return { nightsCount: 0, weekdayNightsCount: 0, weekendNightsCount: 0 };
    }
    const start = new Date(`${checkIn.split('T')[0]}T00:00:00Z`);
    const end = new Date(`${checkOut.split('T')[0]}T00:00:00Z`);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return { nightsCount: 0, weekdayNightsCount: 0, weekendNightsCount: 0 };
    }
    let total = 0;
    let weekend = 0;
    const cur = new Date(start);
    while (cur < end && total < 120) {
      const ymd = cur.toISOString().split('T')[0];
      if (isWeekendNight(ymd)) weekend++;
      total++;
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return {
      nightsCount: total,
      weekdayNightsCount: total - weekend,
      weekendNightsCount: weekend
    };
  }, [checkIn, checkOut]);

  const roomWeekdayRate = Number(currentRoom?.pricePerNight ?? currentRoom?.price ?? 8000);
  const roomWeekendRate = Number(currentRoom?.weekendPrice ?? roomWeekdayRate);

  // Price per night & local fallback total for active stay type
  const activePricePerNight = stayType === 'full_home'
    ? fullHomePricePerNight
    : (isPackagePriceOverride ? Number(selectedPackageDoc.price) : roomWeekdayRate);

  const localBaseAmount = useMemo(() => {
    if (!nightsCount) return 0;
    if (stayType === 'full_home') return fullHomePricePerNight * nightsCount;
    if (isPackagePriceOverride) return Number(selectedPackageDoc.price) * nightsCount;
    return weekdayNightsCount * roomWeekdayRate + weekendNightsCount * roomWeekendRate;
  }, [nightsCount, stayType, fullHomePricePerNight, isPackagePriceOverride, selectedPackageDoc, weekdayNightsCount, roomWeekdayRate, weekendNightsCount, roomWeekendRate]);

  const activeStayMealsNote = stayType === 'full_home'
    ? fullHomeMealsNote
    : (currentRoom?.mealsIncluded || fullHomeMealsNote);

  const activeStayName = stayType === 'full_home'
    ? (isKn ? `ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ (ಎಲ್ಲಾ ${getRoomTotalUnits(rooms)} ಕೊಠಡಿಗಳು)` : `Full Home (All ${getRoomTotalUnits(rooms)} Rooms)`)
    : (isKn ? (currentRoom?.slug?.includes('suite') ? 'ಸೂಟ್ ಕೊಠಡಿ' : currentRoom?.slug?.includes('single') ? 'ಸಿಂಗಲ್ ಕೊಠಡಿ' : 'ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಕೊಠಡಿ') : currentRoom?.name);

  // Validate Step 3 Details
  const validateGuestDetails = () => {
    const errors = {};
    if (!guestData.fullName || guestData.fullName.trim().length < 2) {
      errors.fullName = isKn ? 'ದಯವಿಟ್ಟು ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ' : 'Please enter your full name';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!guestData.email || !emailRegex.test(guestData.email.trim())) {
      errors.email = isKn ? 'ದಯವಿಟ್ಟು ಮಾನ್ಯ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ' : 'Please enter a valid email address';
    }
    const phoneClean = guestData.phone.replace(/[^0-9]/g, '');
    if (phoneClean.length < 10) {
      errors.phone = isKn ? 'ದಯವಿಟ್ಟು 10 ಅಂಕಿಗಳ ಮಾನ್ಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ' : 'Please enter a valid 10-digit WhatsApp number';
    }
    setGuestErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 1 -> Step 2
  const handleProceedFromStep1 = () => {
    setCurrentStep(2);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Step 2 -> Step 3
  const handleProceedFromStep2 = () => {
    if (!checkIn || !checkOut || dateConflict?.occupied) return;
    setCurrentStep(3);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Step 3 -> Step 4
  const handleProceedFromStep3 = () => {
    if (!validateGuestDetails()) return;
    setCurrentStep(4);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Step 4: Pay & Hold Booking Submission (Razorpay)
  const handlePayAndHold = async () => {
    if (!termsAccepted) {
      setTermsError(true);
      return;
    }
    if (!razorpayConfig.configured) {
      return; // Online payment not configured, do not create booking
    }
    setTermsError(false);
    setIsSubmittingBooking(true);
    setPaymentError('');
    setCollisionError('');
    setNearestAvailableDates(null);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error(
          isKn
            ? 'ರೇಜರ್‌ಪೇ ಪಾವತಿ ಗೇಟ್‌ವೇ ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ.'
            : 'Could not load Razorpay payment gateway. Please check your internet connection and try again.'
        );
      }

      const orderPayload = {
        bookingType: stayType,
        checkIn,
        checkOut,
        adults,
        children,
        guestName: guestData.fullName,
        email: guestData.email,
        phone: guestData.phone,
        specialRequests: guestData.specialRequests,
        packageName: activePackage,
        packageSlug: activePackage,
        advancePercent: Number(advancePercent) || 20,
        promoCode: appliedPromo?.code || ''
      };

      if (stayType === 'room') {
        orderPayload.roomId = currentRoom?._id || currentRoom?.id;
        orderPayload.roomSlug = currentRoom?.slug || selectedRoomSlug;
      }

      // If reusing an existing hold with the same advance percent
      if (activeHeldBooking?.bookingCode && activeHeldBooking?.advancePercent === advancePercent) {
        orderPayload.existingBookingCode = activeHeldBooking.bookingCode;
      }

      const res = await api.createRazorpayOrder(orderPayload);
      const orderData = res?.data || res;
      if (!res.success || !orderData?.orderId) {
        throw new Error(res.message || 'Failed to create Razorpay payment order');
      }

      const { orderId, amount, currency, keyId, bookingCode, booking } = orderData;
      const holdExpires = booking?.holdExpiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString();

      setActiveHeldBooking({
        bookingCode,
        orderId,
        advancePercent,
        holdExpiresAt: holdExpires
      });

      const razorpayLogo = await resolveRazorpayLogoDataUrl('/images/logo.jpeg');
      const options = {
        key: keyId,
        amount,
        currency: currency || 'INR',
        name: 'Marichin Homestay',
        description: `${stayType === 'full_home' ? 'Full Home (5 Rooms)' : activeStayName} (${advancePercent}% Advance)`,
        ...(razorpayLogo ? { image: razorpayLogo } : {}),
        order_id: orderId,
        prefill: {
          name: guestData.fullName,
          email: guestData.email,
          contact: guestData.phone
        },
        theme: {
          color: '#0F2A20'
        },
        modal: {
          ondismiss: () => {
            console.log('Razorpay modal dismissed by guest. Room hold remains active for 15 minutes.');
            setIsSubmittingBooking(false);
          }
        },
        handler: async (response) => {
          setIsSubmittingBooking(true);
          try {
            const verifyRes = await api.verifyRazorpayPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              bookingCode
            });

            const confirmed = verifyRes.data?.booking || verifyRes.data || verifyRes.booking;
            if (verifyRes.success && confirmed) {
              setConfirmedBooking(confirmed);
              try {
                sessionStorage.setItem('marichin_last_confirmed_booking', JSON.stringify(confirmed));
              } catch {}
              setActiveHeldBooking(null);
              if (broadcastAdminSync) {
                broadcastAdminSync('bookings');
              }

              try {
                confetti({
                  particleCount: 120,
                  spread: 80,
                  origin: { y: 0.6 },
                  colors: ['#B8964A', '#0F2A20', '#FAF6EC']
                });
              } catch (e) {}
            } else {
              throw new Error(verifyRes.message || 'Payment verification could not be confirmed.');
            }
          } catch (verifyErr) {
            console.error('Payment verification failed:', verifyErr);
            setPaymentError(
              verifyErr.message ||
                (isKn
                  ? 'ಪಾವತಿ ಪರಿಶೀಲನೆ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಬುಕಿಂಗ್ ಕೋಡ್‌ನೊಂದಿಗೆ ಹೋಸ್ಟ್ ಅನ್ನು ಸಂಪರ್ಕಿಸಿ.'
                  : 'Payment verification failed. Please check reservation status or contact host with reference ' + bookingCode)
            );
          } finally {
            setIsSubmittingBooking(false);
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', (failResp) => {
        console.warn('Razorpay payment failed:', failResp.error);
        setPaymentError(
          failResp.error?.description ||
            (isKn ? 'ಪಾವತಿ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.' : 'Payment transaction failed. Please retry.')
        );
        setIsSubmittingBooking(false);
      });

      rzpInstance.open();
    } catch (err) {
      console.error('Payment setup failed:', err);
      if (err.status === 409 || err.message?.includes('booked') || err.message?.includes('collision')) {
        setCollisionError(
          isKn
            ? 'ಈ ದಿನಾಂಕಗಳನ್ನು ಇದೀಗ ಮತ್ತೊಬ್ಬ ಅತಿಥಿ ಕಾಯ್ದಿರಿಸಿದ್ದಾರೆ. ದಯವಿಟ್ಟು ಹೊಸ ದಿನಾಂಕಗಳನ್ನು ಆರಿಸಿ:'
            : 'These dates were just booked by another guest. Please pick new dates:'
        );
        if (broadcastAdminSync) {
          broadcastAdminSync('availability');
        }
        const nearest = err.data?.data?.nearest || err.data?.nearest || err.nearest;
        if (nearest) {
          setNearestAvailableDates(nearest);
        }
      } else {
        setPaymentError(
          err.message ||
            (isKn
              ? 'ಆನ್‌ಲೈನ್ ಪಾವತಿ ಪ್ರಾರಂಭಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ನಂತರ ಪ್ರಯತ್ನಿಸಿ.'
              : 'Unable to initialize online payment. Please try again or contact host.')
        );
      }
      setIsSubmittingBooking(false);
    }
  };

  // One-click apply nearest dates on collision
  const applyNearestDates = (dates) => {
    if (!dates?.checkIn || !dates?.checkOut) return;
    setCheckIn(dates.checkIn);
    setCheckOut(dates.checkOut);
    setCollisionError('');
    setNearestAvailableDates(null);
    setCurrentStep(2); // Go back to calendar to see applied dates
  };

  // Filter active inclusions dynamically from Admin (fallback to static only if empty)
  const filteredInclusions = useMemo(() => {
    const source = Array.isArray(inclusions) && inclusions.length > 0 ? inclusions : INCLUSIONS_DATA;
    return source.filter(item => {
      if (item.isActive === false || item.type !== 'include') return false;
      const titleEn = (item.title?.en || (typeof item.title === 'string' ? item.title : '')).toLowerCase();
      if (titleEn.includes('entire homestay') || titleEn.includes('entire-homestay') || titleEn.includes('group')) {
        return false;
      }
      return true;
    });
  }, [inclusions]);

  // =========================================================================
  // CONFIRMATION PASS / INVOICE VIEW (ONE-PAGE A4 PASS & DIGITAL QR)
  // =========================================================================
  if (confirmedBooking) {
    return (
      <div className="min-h-screen bg-[#FAF6EC] py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <BookingPassCard
            booking={confirmedBooking}
            siteSettings={siteSettings}
            isKn={isKn}
            showActions={true}
            id="booking-invoice-pass"
          />

          <div className="flex justify-end pt-2 print:hidden no-print">
            <button
              type="button"
              onClick={() => {
                clearConfirmedBooking();
                setCurrentStep(1);
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all shadow-md cursor-pointer"
            >
              {isKn ? 'ಹೊಸ ಬುಕಿಂಗ್ ಮಾಡಿ' : 'Make Another Booking'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN BOOKING INTERFACE: 4-STEP ORDER & CALENDAR
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#FAF6EC] text-[#0F2A20] pb-24 sm:pb-28">
      
      {/* SECTION 1: HEADER & STEP PROGRESS BAR */}
      <section className="bg-[#1B4332] text-[#F3EDDD] pt-10 pb-8 sm:pt-14 sm:pb-10 px-4 border-b border-[#B8964A]/30">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-[0.18em] text-[#D9BC7A] bg-[#0F2A20] border border-[#B8964A]/30 mb-3">
              <Sparkles className="w-3 h-3 text-[#D9BC7A]" />
              <span>{isKn ? 'ಅಧಿಕೃತ ಬುಕಿಂಗ್ ಎಂಜಿನ್' : 'Direct Reservation Engine'}</span>
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#FAF6EC] tracking-tight">
              {isKn ? 'ನಿಮ್ಮ ತಂಗುವಿಕೆಯನ್ನು ಕಾಯ್ದಿರಿಸಿ' : 'Book Your Sanctuary'}
            </h1>
            <p className="text-xs sm:text-sm text-[#B9C4B8] font-light mt-2 max-w-lg mx-auto">
              {isKn 
                ? 'ಕೊಡಗಿನ ಹಚ್ಚಹಸಿರಿನ ಕಾಫಿ ತೋಟದ ನಡುವೆ ಶಾಂತಿಯುತ ಅನುಭವ. ಯಾವುದೇ ಮಧ್ಯವರ್ತಿ ಶುಲ್ಕವಿಲ್ಲ.' 
                : 'Experience the serene coffee slopes of Coorg. Guaranteed real-time availability with zero broker fees.'}
            </p>
          </div>

          {/* 4-Step Progress Indicator */}
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-4 gap-2 sm:gap-4 relative">
              {[
                { step: 1, title: isKn ? 'ವಾಸ್ತವ್ಯ ವಿಧ' : 'Stay Type', desc: isKn ? 'ಕೊಠಡಿ ಅಥವಾ ಹೋಂಸ್ಟೇ' : 'Room or Full Home' },
                { step: 2, title: isKn ? 'ದಿನಾಂಕಗಳು' : 'Dates', desc: isKn ? 'ಆಗಮನ & ನಿರ್ಗಮನ' : 'Check-In & Out' },
                { step: 3, title: isKn ? 'ವಿವರಗಳು' : 'Details', desc: isKn ? 'ಅತಿಥಿ ಮಾಹಿತಿ' : 'Guest Info' },
                { step: 4, title: isKn ? 'ಪರಿಶೀಲನೆ & ಪಾವತಿ' : 'Review & Pay', desc: isKn ? 'ದೃಢೀಕರಿಸಿ' : 'Hold & Pay' }
              ].map((item) => {
                const isActive = currentStep === item.step;
                const isCompleted = currentStep > item.step;

                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => {
                      // Guest can tap back to previously completed steps
                      if (item.step < currentStep) {
                        setCurrentStep(item.step);
                      }
                    }}
                    disabled={item.step > currentStep}
                    className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                      item.step < currentStep ? 'cursor-pointer hover:bg-[#0F2A20]/50' : 'cursor-default'
                    }`}
                  >
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-1.5 ${
                      isCompleted 
                        ? 'bg-emerald-600 text-white'
                        : isActive
                        ? 'bg-[#D9BC7A] text-[#0F2A20] ring-4 ring-[#B8964A]/30'
                        : 'bg-[#0F2A20] text-[#B9C4B8] border border-[#B8964A]/25'
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : item.step}
                    </div>

                    <span className={`text-[11px] sm:text-xs font-bold tracking-wide block ${
                      isActive ? 'text-[#D9BC7A]' : isCompleted ? 'text-emerald-400' : 'text-[#B9C4B8]'
                    }`}>
                      {item.title}
                    </span>
                    <span className="hidden sm:block text-[9px] text-[#B9C4B8]/80">
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: MAIN WORKSPACE & SIDEBAR GRID */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-10">
        
        {/* COLLISION ALERT BANNER (HTTP 409) */}
        {collisionError && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-500 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 text-sm sm:text-base">
                  {collisionError}
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  {isKn 
                    ? 'ಇನ್ನೊಬ್ಬ ಅತಿಥಿ ಅದೇ ಕ್ಷಣದಲ್ಲಿ ಆ ದಿನಾಂಕಗಳನ್ನು ಕಾಯ್ದಿರಿಸಿದ್ದಾರೆ. ಕೆಳಗಿನ ಲಭ್ಯವಿರುವ ದಿನಾಂಕಗಳನ್ನು ನೇರವಾಗಿ ಅನ್ವಯಿಸಿ:' 
                    : 'Another traveler just booked the final unit for these nights. Choose the nearest open window:'}
                </p>
              </div>
            </div>

            {nearestAvailableDates && (
              <button
                type="button"
                onClick={() => applyNearestDates(nearestAvailableDates)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-800 text-amber-50 text-xs font-bold uppercase tracking-wider hover:bg-amber-900 transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer shadow-sm"
              >
                <span>{nearestAvailableDates.checkIn} → {nearestAvailableDates.checkOut} ({nearestAvailableDates.nights || nightsCount}N)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: ACTIVE STEP WORKSPACE (8 COLS) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* ------------------------------------------------------------------ */}
            {/* STEP 1: STAY TYPE AND GUESTS                                       */}
            {/* ------------------------------------------------------------------ */}
            {currentStep === 1 && (
              <section className="space-y-6">

                {/* Active Package Banner when booked via Package */}
                {selectedPackageDoc && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#1B4332] text-[#F3EDDD] border border-[#B8964A]/40 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] uppercase font-bold tracking-[0.16em] px-2.5 py-0.5 rounded-full bg-[#B8964A] text-[#0F2A20]">
                          {isKn ? 'ಆಯ್ಕೆಮಾಡಿದ ಪ್ಯಾಕೇಜ್' : 'Active Package'}
                        </span>
                        {selectedPackageDoc.durationLabel && (
                          <span className="text-[11px] text-[#D9BC7A] font-medium">
                            {selectedPackageDoc.durationLabel}
                            {selectedPackageDoc.idealFor ? ` · ${selectedPackageDoc.idealFor}` : ''}
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-lg font-bold text-[#FAF6EC]">
                        {selectedPackageDoc.title || selectedPackageDoc.name}
                      </h3>
                      <p className="text-xs text-[#B9C4B8] font-light">
                        {isPackagePriceOverride
                          ? (isKn
                              ? `ಪ್ಯಾಕೇಜ್ ದರ ₹${Number(selectedPackageDoc.price).toLocaleString('en-IN')} / ರಾತ್ರಿ ಅನ್ವಯವಾಗಿದೆ`
                              : `Flat package tariff of ₹${Number(selectedPackageDoc.price).toLocaleString('en-IN')} / night is active for room bookings.`)
                          : Number(selectedPackageDoc.price) > 0 && stayType === 'full_home'
                          ? (isKn
                              ? `ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ ಪ್ಯಾಕೇಜ್ ದರ ₹${fullHomePricePerNight.toLocaleString('en-IN')} / ರಾತ್ರಿ`
                              : `Full Home package tariff of ₹${fullHomePricePerNight.toLocaleString('en-IN')} / night active.`)
                          : selectedPackageDoc.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePackage('')}
                      className="self-start sm:self-center px-3.5 py-2 rounded-xl border border-[#B8964A]/40 text-xs font-semibold text-[#D9BC7A] hover:bg-[#0F2A20] hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {isKn ? 'ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಕೊಠಡಿ ದರ ಬಳಸಿ' : 'Use Individual Room Tariffs'}
                    </button>
                  </div>
                )}

                {/* Stay Type Choice: Two Big Cards */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0F2A20]">
                      {isKn ? '1. ವಾಸ್ತವ್ಯದ ಪ್ರಕಾರವನ್ನು ಆರಿಸಿ' : '1. Choose Your Stay Type'}
                    </h2>
                    <span className="text-xs text-[#5F6B62]">
                      {isKn ? 'ಒಂದು ಕೊಠಡಿ ಅಥವಾ ಇಡೀ ಹೋಂಸ್ಟೇ' : 'One room or full property'}
                    </span>
                  </div>

                  <div className={`grid grid-cols-1 ${isFullHomeEnabled ? 'sm:grid-cols-2' : ''} gap-4`}>
                    
                    {/* Card A: Book a Room */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setStayType('room')}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setStayType('room'); }}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        stayType === 'room'
                          ? 'border-[#B8964A] bg-[#FAF6EC] shadow-md ring-2 ring-[#B8964A]/30'
                          : 'border-[#F1E9D8] bg-white hover:border-[#B8964A]/50 hover:bg-[#FAF6EC]/50'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            stayType === 'room' ? 'bg-[#1B4332] text-[#D9BC7A]' : 'bg-[#FAF6EC] text-[#0F2A20]'
                          }`}>
                            <BedDouble className="w-5 h-5" />
                          </div>
                          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            stayType === 'room' ? 'border-[#B8964A] bg-[#B8964A] text-[#0F2A20]' : 'border-gray-300'
                          }`}>
                            {stayType === 'room' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-serif text-lg font-bold text-[#0F2A20]">
                            {isKn ? 'ಕೊಠಡಿ ಕಾಯ್ದಿರಿಸಿ' : 'Book a Room'}
                          </h3>
                          <p className="text-xs text-[#5F6B62] font-light mt-1">
                            {isKn 
                              ? 'ಖಾಸಗಿ ಬಾಲ್ಕನಿ ಹೊಂದಿರುವ ವೈಯಕ್ತಿಕ ಕೊಠಡಿ (ಸ್ಟ್ಯಾಂಡರ್ಡ್, ಸೂಟ್ ಅಥವಾ ಸಿಂಗಲ್).' 
                              : 'Reserve an individual room with private balcony & estate view.'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#F1E9D8] flex items-center justify-between text-xs">
                        <span className="text-[#5F6B62]">{isKn ? 'ದರ ಪ್ರಾರಂಭ' : (isPackagePriceOverride ? 'Package Rate' : 'Tariff from')}</span>
                        <span className="font-serif font-bold text-[#0F2A20]">
                          ₹{(isPackagePriceOverride
                            ? Number(selectedPackageDoc.price)
                            : Math.min(...(rooms || []).map(r => Number(r.pricePerNight || 8000)))).toLocaleString('en-IN')} / {isKn ? 'ರಾತ್ರಿಗೆ' : 'night'}
                        </span>
                      </div>
                    </div>

                    {/* Card B: Book the Full Home (Hidden when fullHomeEnabled is false) */}
                    {isFullHomeEnabled && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setStayType('full_home')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setStayType('full_home'); }}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          stayType === 'full_home'
                            ? 'border-[#B8964A] bg-[#FAF6EC] shadow-md ring-2 ring-[#B8964A]/30'
                            : 'border-[#F1E9D8] bg-white hover:border-[#B8964A]/50 hover:bg-[#FAF6EC]/50'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              stayType === 'full_home' ? 'bg-[#1B4332] text-[#D9BC7A]' : 'bg-[#FAF6EC] text-[#0F2A20]'
                            }`}>
                              <HomeIcon className="w-5 h-5" />
                            </div>
                            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              stayType === 'full_home' ? 'border-[#B8964A] bg-[#B8964A] text-[#0F2A20]' : 'border-gray-300'
                            }`}>
                              {stayType === 'full_home' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-serif text-lg font-bold text-[#0F2A20]">
                                {isKn ? 'ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ ಕಾಯ್ದಿರಿಸಿ' : 'Book the Full Home'}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full bg-[#1B4332] text-[#D9BC7A] text-[9px] font-bold uppercase tracking-wider">
                                {isKn ? 'ಎಲ್ಲಾ 5 ಕೊಠಡಿಗಳು' : 'All 5 Rooms'}
                              </span>
                            </div>
                            <p className="text-xs text-[#5F6B62] font-light mt-1">
                              {isKn 
                                ? 'ಇಡೀ ಆಸ್ತಿಯ ವಿಶೇಷ ಕಾಯ್ದಿರಿಸುವಿಕೆ (2 ಸ್ಟ್ಯಾಂಡರ್ಡ್, 2 ಸೂಟ್, 1 ಸಿಂಗಲ್).' 
                                : 'Reserve the entire property exclusively for your family or friends.'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#F1E9D8] flex items-center justify-between text-xs">
                          <span className="text-[#5F6B62]">{isKn ? 'ಸ್ಥಿರ ದರ' : 'Full Home Tariff'}</span>
                          <span className="font-serif font-bold text-[#0F2A20]">
                            ₹{fullHomePricePerNight.toLocaleString('en-IN')} / {isKn ? 'ರಾತ್ರಿಗೆ' : 'night'}
                          </span>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Sub-selection for STAY TYPE: */}
                {stayType === 'room' ? (
                  // Room Selection: Three Room Cards (Standard, Suite, Single) with single selection
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-lg font-bold text-[#0F2A20]">
                        {isKn ? 'ಕೊಠಡಿ ಆಯ್ಕೆಮಾಡಿ (ಪ್ರತಿ ಬುಕಿಂಗ್‌ಗೆ 1 ಕೊಠಡಿ)' : 'Select Your Room (Exactly 1 Room per Booking)'}
                      </h3>
                      <span className="text-[11px] text-[#5F6B62]">
                        {isKn ? 'ಉಪಹಾರ ಎಲ್ಲದರಲ್ಲೂ ಸೇರಿದೆ' : 'Breakfast included in all rooms'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(rooms || []).map((room) => {
                        const isSelected = selectedRoomSlug === room.slug;
                        const isSingle = (room.slug || '').includes('single');
                        const isSuite = (room.slug || '').includes('suite');
                        const hasBalcony = getRoomBalcony(room);

                        const roomPhoto = room.images?.[0] || (
                          isSuite ? '/images/realimage/livingroom.jpeg' :
                          isSingle ? null : '/images/realimage/balconyroom.jpeg'
                        );

                        const roomAdultLimit = Number(room.maxAdults) || 2;
                        const roomChildLimit = room.maxChildren !== undefined ? Number(room.maxChildren) : (isSingle ? 0 : (isSuite ? 2 : 1));
                        const roomPrice = isPackagePriceOverride
                          ? Number(selectedPackageDoc.price)
                          : Number(room.pricePerNight || room.price || 8000);
                        const roomWeekendPrice = isPackagePriceOverride
                          ? roomPrice
                          : Number(room.weekendPrice ?? roomPrice);

                        return (
                          <div
                            key={room.id || room.slug}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedRoomSlug(room.slug)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedRoomSlug(room.slug); }}
                            className={`rounded-2xl overflow-hidden border-2 transition-all cursor-pointer flex flex-col justify-between bg-white ${
                              isSelected 
                                ? 'border-[#B8964A] shadow-lg ring-2 ring-[#B8964A]/30' 
                                : 'border-[#F1E9D8] hover:border-[#B8964A]/50 hover:shadow-md'
                            }`}
                          >
                            <div>
                              {/* Photo or "Photo coming soon" tile for Single Room */}
                              <div className="relative h-44 bg-[#0A1A13] overflow-hidden">
                                {isSingle && !roomPhoto ? (
                                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-[#1B4332]/60 text-[#D9BC7A]">
                                    <ImageOff className="w-8 h-8 opacity-60 mb-2" />
                                    <span className="font-serif text-xs font-semibold uppercase tracking-wider">
                                      {isKn ? 'ಫೋಟೋ ಶೀಘ್ರದಲ್ಲೇ ಬರಲಿದೆ' : 'Photo coming soon'}
                                    </span>
                                    <span className="text-[10px] text-[#B9C4B8] font-light mt-0.5">
                                      {hasBalcony
                                        ? (isKn ? 'ಖಾಸಗಿ ಬಾಲ್ಕನಿ ಸೌಲಭ್ಯವಿದೆ' : 'Private Balcony Included')
                                        : (isKn ? 'ಬಾಲ್ಕನಿ ರಹಿತ ಕೊಠಡಿ' : 'No Balcony')}
                                    </span>
                                  </div>
                                ) : (
                                  <img
                                    src={roomPhoto || '/images/realimage/balconyroom.jpeg'}
                                    alt={room.name}
                                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                  />
                                )}

                                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                  <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider bg-[#0F2A20]/90 text-[#D9BC7A] backdrop-blur-sm border border-[#B8964A]/30">
                                    {hasBalcony ? (isKn ? 'ಖಾಸಗಿ ಬಾಲ್ಕನಿ' : 'Balcony') : (isKn ? 'ಬಾಲ್ಕನಿ ಇಲ್ಲ' : 'No Balcony')}
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-800/90 text-emerald-100 backdrop-blur-sm">
                                    {isKn ? 'ಉಪಹಾರ ಸೇರಿದೆ' : 'Breakfast'}
                                  </span>
                                </div>

                                <div className="absolute bottom-2 right-3 text-right flex flex-col items-end gap-1">
                                  <span className="text-xs font-serif font-bold text-[#F3EDDD] bg-[#0F2A20]/90 px-2.5 py-0.5 rounded-full border border-[#B8964A]/30">
                                    ₹{roomPrice.toLocaleString('en-IN')} / {isKn ? 'ರಾತ್ರಿ' : 'nt'}
                                  </span>
                                  {roomWeekendPrice !== roomPrice && (
                                    <span className="text-[10px] font-mono font-bold text-[#0F2A20] bg-[#D9BC7A]/95 px-2 py-0.5 rounded-full shadow-sm">
                                      {isKn ? `ವಾರಾಂತ್ಯ ₹${roomWeekendPrice.toLocaleString('en-IN')}` : `Wknd ₹${roomWeekendPrice.toLocaleString('en-IN')}`}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Details */}
                              <div className="p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-serif text-base font-bold text-[#0F2A20]">
                                    {isKn ? (isSuite ? 'ಸೂಟ್ ಕೊಠಡಿ' : isSingle ? 'ಸಿಂಗಲ್ ಕೊಠಡಿ' : 'ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಕೊಠಡಿ') : room.name}
                                  </h4>
                                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    isSelected ? 'border-[#B8964A] bg-[#B8964A] text-[#0F2A20]' : 'border-gray-300'
                                  }`}>
                                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </span>
                                </div>

                                <p className="text-xs text-[#5F6B62] font-light leading-relaxed">
                                  {isKn
                                    ? `${getRoomUnitsCount(room) === 1 ? '1 ಕೊಠಡಿ' : `${getRoomUnitsCount(room)} ಕೊಠಡಿಗಳು`} · ${roomAdultLimit} ವಯಸ್ಕರು${roomChildLimit > 0 ? ` + ${roomChildLimit} ${roomChildLimit === 1 ? 'ಮಗು' : 'ಮಕ್ಕಳು'}` : ''}`
                                    : `${getRoomUnitsCount(room) === 1 ? '1 Room' : `${getRoomUnitsCount(room)} Rooms`} · Fits ${roomAdultLimit} Adults${roomChildLimit > 0 ? ` + ${roomChildLimit} ${roomChildLimit === 1 ? 'Child' : 'Children'}` : ''}`}
                                </p>

                                {checkIn && checkOut && roomsAvailabilityMap[room.slug] && (
                                  <div className="pt-1">
                                    {!roomsAvailabilityMap[room.slug].isAvailable ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold">
                                        {isKn ? 'ಆಯ್ದ ದಿನಾಂಕಗಳಲ್ಲಿ ಭರ್ತಿಯಾಗಿದೆ' : 'Occupied for chosen dates'}
                                      </span>
                                    ) : roomsAvailabilityMap[room.slug].availableUnits === 1 && (roomsAvailabilityMap[room.slug].totalUnits || 1) > 1 ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold">
                                        {isKn ? 'ಕೇವಲ 1 ಕೊಠಡಿ ಲಭ್ಯ' : 'Only 1 unit left'}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                        {roomsAvailabilityMap[room.slug].availableUnits} {isKn ? 'ಲಭ್ಯವಿದೆ' : 'available'}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Card Footer Selection state */}
                            <div className="p-4 pt-0">
                              <div className={`py-1.5 px-3 rounded-xl text-center text-xs font-semibold transition-all ${
                                isSelected ? 'bg-[#1B4332] text-[#D9BC7A]' : 'bg-[#FAF6EC] text-[#0F2A20]'
                              }`}>
                                {isSelected ? (isKn ? 'ಆಯ್ಕೆಯಾಗಿದೆ ✓' : 'Selected ✓') : (isKn ? 'ಆಯ್ಕೆಮಾಡಿ' : 'Select Room')}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // Full Home Selected: One Comprehensive Card
                  <div className="p-6 rounded-3xl bg-white border-2 border-[#B8964A] shadow-md space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#F1E9D8] pb-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1B4332] text-[#D9BC7A] text-[10px] font-bold uppercase tracking-wider mb-1">
                          <HomeIcon className="w-3.5 h-3.5 text-[#D9BC7A]" />
                          <span>{isKn ? `ಸಂಪೂರ್ಣ ಆಸ್ತಿ (${getRoomTotalUnits(rooms)} ಕೊಠಡಿಗಳು)` : `Entire Estate (${getRoomTotalUnits(rooms)} Rooms)`}</span>
                        </div>
                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0F2A20]">
                          {isKn ? 'ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇ ಸಂಪೂರ್ಣ ಕಾಯ್ದಿರಿಸುವಿಕೆ' : 'Marichin Homestay — Exclusive Full Home'}
                        </h3>
                        <p className="text-xs text-[#5F6B62] mt-0.5">
                          {isKn
                            ? `${buildFullHomeBreakdown(rooms, true)} (ಒಟ್ಟು ${getRoomTotalUnits(rooms)} ಕೊಠಡಿಗಳು).`
                            : `${buildFullHomeBreakdown(rooms, false)} (All ${getRoomTotalUnits(rooms)} private units).`}
                        </p>
                      </div>

                      <div className="text-right bg-[#FAF6EC] px-4 py-2 rounded-2xl border border-[#B8964A]/30">
                        <span className="text-[10px] text-[#5F6B62] uppercase block tracking-wider font-semibold">
                          {isKn ? 'ಸ್ಥಿರ ದರ' : 'Nightly Tariff'}
                        </span>
                        <span className="font-serif text-2xl font-bold text-[#0F2A20]">
                          ₹{fullHomePricePerNight.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-emerald-700 block font-medium">
                          {fullHomeMealsNote}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                      <div className="p-3 rounded-xl bg-[#FAF6EC] border border-[#B8964A]/20">
                        <span className="text-[#5F6B62] block text-[10px] uppercase font-bold">{isKn ? 'ಗರಿಷ್ಠ ಸಾಮರ್ಥ್ಯ' : 'Maximum Capacity'}</span>
                        <span className="font-serif text-sm font-bold text-[#0F2A20]">
                          {fullHomeLimits.maxAdults} {isKn ? 'ವಯಸ್ಕರು' : 'Adults'} + {fullHomeLimits.maxChildren} {isKn ? 'ಮಕ್ಕಳು' : 'Children'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#FAF6EC] border border-[#B8964A]/20">
                        <span className="text-[#5F6B62] block text-[10px] uppercase font-bold">{isKn ? 'ಕನಿಷ್ಠ ರಾತ್ರಿಗಳು' : 'Minimum Stay'}</span>
                        <span className="font-serif text-sm font-bold text-[#0F2A20]">
                          {fullHomeMinNights} {isKn ? 'ರಾತ್ರಿ' : (fullHomeMinNights > 1 ? 'Nights' : 'Night')}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#FAF6EC] border border-[#B8964A]/20">
                        <span className="text-[#5F6B62] block text-[10px] uppercase font-bold">{isKn ? 'ಸೌಲಭ್ಯಗಳು' : 'Exclusivity'}</span>
                        <span className="font-serif text-sm font-bold text-[#0F2A20]">
                          {isKn ? 'ಯಾವುದೇ ಹೊರಗಿನ ಅತಿಥಿಗಳಿಲ್ಲ' : '100% Private for your group'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* GUEST CAPACITY SELECTORS: Dynamic maximums and live message */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#B8964A]/25 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#0F2A20]">
                      {isKn ? 'ಅತಿಥಿಗಳ ಸಂಖ್ಯೆ' : 'Number of Guests'}
                    </h3>
                    <p className="text-xs text-emerald-800 font-medium mt-0.5">
                      {stayType === 'full_home'
                        ? (isKn ? `ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ ಗರಿಷ್ಠ ${fullHomeLimits.maxAdults} ವಯಸ್ಕರು + ${fullHomeLimits.maxChildren} ಮಕ್ಕಳಿಗೆ ಅವಕಾಶ ನೀಡುತ್ತದೆ.` : `Full Home accommodates up to ${fullHomeLimits.maxAdults} adults + ${fullHomeLimits.maxChildren} children.`)
                        : (isKn
                            ? `ಈ ಕೊಠಡಿ ${maxAdultsAllowed} ವಯಸ್ಕರು${maxChildrenAllowed > 0 ? ` + ${maxChildrenAllowed} ${maxChildrenAllowed === 1 ? 'ಮಗು' : 'ಮಕ್ಕಳು'}` : ''} ಹೊಂದುತ್ತದೆ.`
                            : `This room fits ${maxAdultsAllowed} adults${maxChildrenAllowed > 0 ? ` + ${maxChildrenAllowed} ${maxChildrenAllowed === 1 ? 'child' : 'children'}` : ''}.`)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Adults Selector */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF6EC] border border-[#B8964A]/25">
                      <div>
                        <span className="text-xs font-bold text-[#0F2A20] block">
                          {isKn ? 'ವಯಸ್ಕರು' : 'Adults'}
                        </span>
                        <span className="text-[10px] text-[#5F6B62]">
                          {isKn ? `ಗರಿಷ್ಠ ${maxAdultsAllowed}` : `Max ${maxAdultsAllowed}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setAdults(prev => Math.max(1, prev - 1))}
                          disabled={adults <= 1}
                          className="w-8 h-8 rounded-lg bg-white border border-[#B8964A]/30 flex items-center justify-center text-[#0F2A20] disabled:opacity-40 disabled:pointer-events-none hover:bg-gray-50 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-serif text-base font-bold text-[#0F2A20] w-6 text-center">
                          {adults}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAdults(prev => Math.min(maxAdultsAllowed, prev + 1))}
                          disabled={adults >= maxAdultsAllowed}
                          className="w-8 h-8 rounded-lg bg-white border border-[#B8964A]/30 flex items-center justify-center text-[#0F2A20] disabled:opacity-40 disabled:pointer-events-none hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Children Selector */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF6EC] border border-[#B8964A]/25">
                      <div>
                        <span className="text-xs font-bold text-[#0F2A20] block">
                          {isKn ? 'ಮಕ್ಕಳು (12 ವರ್ಷದೊಳಗೆ)' : 'Children (Under 12)'}
                        </span>
                        <span className="text-[10px] text-[#5F6B62]">
                          {maxChildrenAllowed === 0 
                            ? (isKn ? 'ಈ ಕೊಠಡಿಗೆ ಅನುಮತಿಯಿಲ್ಲ' : ((currentRoom?.slug || '').includes('single') ? 'Not allowed in Single room' : 'Adults only for this room')) 
                            : (isKn ? `ಗರಿಷ್ಠ ${maxChildrenAllowed}` : `Max ${maxChildrenAllowed}`)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setChildren(prev => Math.max(0, prev - 1))}
                          disabled={children <= 0}
                          className="w-8 h-8 rounded-lg bg-white border border-[#B8964A]/30 flex items-center justify-center text-[#0F2A20] disabled:opacity-40 disabled:pointer-events-none hover:bg-gray-50 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-serif text-base font-bold text-[#0F2A20] w-6 text-center">
                          {children}
                        </span>
                        <button
                          type="button"
                          onClick={() => setChildren(prev => Math.min(maxChildrenAllowed, prev + 1))}
                          disabled={children >= maxChildrenAllowed}
                          className="w-8 h-8 rounded-lg bg-white border border-[#B8964A]/30 flex items-center justify-center text-[#0F2A20] disabled:opacity-40 disabled:pointer-events-none hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Continue to Step 2 Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleProceedFromStep1}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-xs uppercase tracking-[0.14em] font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isKn ? 'ಮುಂದೆ: ದಿನಾಂಕಗಳನ್ನು ಆರಿಸಿ' : 'Continue to Select Dates'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </section>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* STEP 2: DATES (Custom 2-Month Calendar)                            */}
            {/* ------------------------------------------------------------------ */}
            {currentStep === 2 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0F2A20]">
                      {isKn ? '2. ತಂಗುವ ದಿನಾಂಕಗಳನ್ನು ಆರಿಸಿ' : '2. Select Your Stay Dates'}
                    </h2>
                    <p className="text-xs text-[#5F6B62] mt-0.5">
                      {isKn 
                        ? 'ಮೊದಲು ಆಗಮನ ದಿನಾಂಕ, ನಂತರ ಲಭ್ಯವಿರುವ ನಿರ್ಗಮನ ದಿನಾಂಕವನ್ನು ಆರಿಸಿ.' 
                        : 'Choose check-in first, then pick an eligible check-out date from the calendar.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-semibold text-[#B8964A] hover:text-[#0F2A20] flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{isKn ? 'ಹಿಂದಕ್ಕೆ' : 'Change Room'}</span>
                  </button>
                </div>

                {/* Custom Large Booking Calendar */}
                <CustomBookingCalendar
                  bookingType={stayType}
                  roomId={currentRoom?._id || currentRoom?.id}
                  roomSlug={selectedRoomSlug}
                  roomName={activeStayName}
                  pricePerNight={activePricePerNight}
                  mealsNote={activeStayMealsNote}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onDatesChange={({ checkIn: newIn, checkOut: newOut }) => {
                    setCheckIn(newIn || '');
                    setCheckOut(newOut || '');
                  }}
                  serverQuote={serverQuote}
                  isKn={isKn}
                />

                {/* Conflict / Occupied Alert inside Step 2 (with 1-click room switch or All-3-Occupied alert) */}
                {dateConflict?.occupied && (
                  <div className="rounded-2xl border-2 border-red-400 bg-red-50 p-4 sm:p-5 space-y-3 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-red-900 text-sm sm:text-base">
                          {dateConflict.sameDayClosed
                            ? (isKn ? 'ಇಂದಿನ ಚೆಕ್-ಇನ್ ಮುಚ್ಚಲಾಗಿದೆ' : 'Same-day check-in is closed')
                            : dateConflict.allRoomsOccupied
                            ? (isKn ? 'ಈ ದಿನಾಂಕಗಳಲ್ಲಿ ಎಲ್ಲಾ 3 ಕೊಠಡಿಗಳೂ ಭರ್ತಿಯಾಗಿವೆ' : 'All rooms are occupied for these dates')
                            : (isKn
                                ? `${dateConflict.checkedRoomName || activeStayName} ಈ ದಿನಾಂಕಗಳಲ್ಲಿ ಲಭ್ಯವಿಲ್ಲ`
                                : `${dateConflict.checkedRoomName || activeStayName} is occupied for ${checkIn} to ${checkOut}`)}
                        </h4>
                        <p className="text-xs text-red-800 leading-relaxed">
                          {dateConflict.sameDayClosed
                            ? (isKn ? 'ದಯವಿಟ್ಟು ನಾಳೆ ಅಥವಾ ನಂತರದ ದಿನಾಂಕವನ್ನು ಆರಿಸಿ.' : 'Earliest available check-in is tomorrow. Please select dates starting from tomorrow.')
                            : dateConflict.allRoomsOccupied
                            ? (isKn ? 'ಸ್ಟ್ಯಾಂಡರ್ಡ್, ಸೂಟ್ ಮತ್ತು ಸಿಂಗಲ್ — ಎಲ್ಲಾ ಕೊಠಡಿಗಳು ಕಾಯ್ದಿರಿಸಲಾಗಿವೆ. ದಯವಿಟ್ಟು ಕ್ಯಾಲೆಂಡರ್‌ನಲ್ಲಿ ಹಸಿರು ದಿನಾಂಕಗಳನ್ನು ಆರಿಸಿ.' : 'Standard, Suite, and Single rooms are all booked for these nights. Please select green available dates in the calendar above.')
                            : dateConflict.otherAvailableRooms && dateConflict.otherAvailableRooms.length > 0
                            ? (isKn ? 'ಇದೇ ದಿನಾಂಕಗಳಲ್ಲಿ ಕೆಳಗಿನ ಇತರ ಕೊಠಡಿಗಳು ಲಭ್ಯವಿವೆ. ತಕ್ಷಣ ಬದಲಾಯಿಸಲು ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಮೇಲಿನ ಕ್ಯಾಲೆಂಡರ್‌ನಲ್ಲಿ ಬೇರೆ ದಿನಾಂಕ ಆರಿಸಿ:' : 'Good news — other rooms are available for these exact dates. Switch with one click below, or choose green dates above:')
                            : (isKn ? 'ದಯವಿಟ್ಟು ಕ್ಯಾಲೆಂಡರ್‌ನಲ್ಲಿ ಲಭ್ಯವಿರುವ ಹಸಿರು ದಿನಾಂಕಗಳನ್ನು ಆರಿಸಿ.' : 'Please select available green dates in the calendar above.')}
                        </p>
                      </div>
                    </div>

                    {!dateConflict.sameDayClosed && dateConflict.otherAvailableRooms && dateConflict.otherAvailableRooms.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {dateConflict.otherAvailableRooms.map((alt) => {
                          const altSlug = alt.slug || alt.id || '';
                          const altNameKn = altSlug.includes('suite') ? 'ಸೂಟ್ ಕೊಠಡಿ' : altSlug.includes('single') ? 'ಸಿಂಗಲ್ ಕೊಠಡಿ' : 'ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಕೊಠಡಿ';
                          return (
                            <div
                              key={altSlug}
                              className="flex items-center justify-between gap-3 bg-white border border-emerald-300 rounded-xl px-3.5 py-2.5 shadow-sm"
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[#0F2A20] truncate">
                                  {isKn ? altNameKn : alt.name}
                                </div>
                                <div className="text-[11px] text-[#5F6B62] flex items-center gap-1.5">
                                  <span className="text-emerald-700 font-semibold">
                                    {alt.availableUnits} {isKn ? 'ಲಭ್ಯ' : (alt.availableUnits === 1 ? 'unit free' : 'units free')}
                                  </span>
                                  <span>•</span>
                                  <span className="font-semibold text-[#0F2A20]">
                                    ₹{Number(alt.estimatedTotal || alt.pricePerNight).toLocaleString('en-IN')}
                                  </span>
                                </div>
                                {!alt.fitsCurrentGuests && (
                                  <div className="text-[10px] text-amber-700 font-medium">
                                    {isKn ? `ಗರಿಷ್ಠ: ${alt.maxAdults} ವಯಸ್ಕರು${alt.maxChildren > 0 ? ` + ${alt.maxChildren} ಮಕ್ಕಳು` : ' (ಮಕ್ಕಳಿಲ್ಲ)'}` : `Max ${alt.maxAdults} Adults${alt.maxChildren > 0 ? ` + ${alt.maxChildren} Child` : ' (No children)'} — adjusts guests`}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSwitchAvailableRoom(alt)}
                                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#0F2A20] hover:bg-[#1B4332] text-[#D9BC7A] text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                              >
                                {isKn ? 'ಬದಲಾಯಿಸಿ' : 'Switch Room'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2 Actions */}
                <div className="flex items-center justify-between gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-5 py-3 rounded-xl border border-[#B8964A]/30 text-xs font-semibold text-[#0F2A20] hover:bg-[#FAF6EC] transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{isKn ? 'ಹಿಂದಕ್ಕೆ' : 'Back'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleProceedFromStep2}
                    disabled={!checkIn || !checkOut || isCheckingDateConflict || Boolean(dateConflict?.occupied)}
                    className="px-8 py-3.5 rounded-xl text-xs uppercase tracking-[0.14em] font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all shadow-md hover:-translate-y-0.5 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2 cursor-pointer"
                  >
                    <span>{isKn ? 'ಮುಂದೆ: ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ' : 'Continue to Guest Details'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </section>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* STEP 3: DETAILS (Guest Form & Included Summary Card)               */}
            {/* ------------------------------------------------------------------ */}
            {currentStep === 3 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0F2A20]">
                      {isKn ? '3. ಪ್ರಾಥಮಿಕ ಅತಿಥಿಯ ವಿವರಗಳು' : '3. Primary Guest Details'}
                    </h2>
                    <p className="text-xs text-[#5F6B62] mt-0.5">
                      {isKn 
                        ? 'ಬುಕಿಂಗ್ ದೃಢೀಕರಣ ಮತ್ತು WhatsApp ಸಂವಹನಕ್ಕಾಗಿ ಈ ವಿವರಗಳು ಅಗತ್ಯ.' 
                        : 'Required for your digital check-in pass and WhatsApp reservation updates.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs font-semibold text-[#B8964A] hover:text-[#0F2A20] flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{isKn ? 'ದಿನಾಂಕ ಬದಲಾಯಿಸಿ' : 'Change Dates'}</span>
                  </button>
                </div>

                {/* Form Fields Container */}
                <div className="p-6 rounded-3xl bg-white border border-[#B8964A]/25 shadow-sm space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Full Name */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-[#0F2A20] uppercase tracking-wider block">
                        {isKn ? 'ಪೂರ್ಣ ಹೆಸರು *' : 'Full Name *'}
                      </label>
                      <input
                        type="text"
                        value={guestData.fullName}
                        onChange={(e) => {
                          setGuestData({ ...guestData, fullName: e.target.value });
                          if (guestErrors.fullName) setGuestErrors({ ...guestErrors, fullName: '' });
                        }}
                        placeholder="e.g. Ramesh Gowda"
                        className={`w-full px-4 py-3 rounded-xl border text-sm text-[#0F2A20] focus:outline-none transition-colors ${
                          guestErrors.fullName ? 'border-red-500 bg-red-50/30' : 'border-[#B8964A]/30 focus:border-[#B8964A] bg-[#FAF6EC]/30'
                        }`}
                      />
                      {guestErrors.fullName && (
                        <p className="text-xs text-red-600 font-medium">{guestErrors.fullName}</p>
                      )}
                    </div>

                    {/* WhatsApp Phone */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0F2A20] uppercase tracking-wider block">
                        {isKn ? 'WhatsApp ಮೊಬೈಲ್ ಸಂಖ್ಯೆ *' : 'WhatsApp Mobile Number *'}
                      </label>
                      <input
                        type="tel"
                        value={guestData.phone}
                        onChange={(e) => {
                          setGuestData({ ...guestData, phone: e.target.value });
                          if (guestErrors.phone) setGuestErrors({ ...guestErrors, phone: '' });
                        }}
                        placeholder="e.g. +91 98XXX XXXXX"
                        className={`w-full px-4 py-3 rounded-xl border text-sm text-[#0F2A20] focus:outline-none transition-colors ${
                          guestErrors.phone ? 'border-red-500 bg-red-50/30' : 'border-[#B8964A]/30 focus:border-[#B8964A] bg-[#FAF6EC]/30'
                        }`}
                      />
                      {guestErrors.phone && (
                        <p className="text-xs text-red-600 font-medium">{guestErrors.phone}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0F2A20] uppercase tracking-wider block">
                        {isKn ? 'ಇಮೇಲ್ ವಿಳಾಸ *' : 'Email Address *'}
                      </label>
                      <input
                        type="email"
                        value={guestData.email}
                        onChange={(e) => {
                          setGuestData({ ...guestData, email: e.target.value });
                          if (guestErrors.email) setGuestErrors({ ...guestErrors, email: '' });
                        }}
                        placeholder="e.g. guest@example.com"
                        className={`w-full px-4 py-3 rounded-xl border text-sm text-[#0F2A20] focus:outline-none transition-colors ${
                          guestErrors.email ? 'border-red-500 bg-red-50/30' : 'border-[#B8964A]/30 focus:border-[#B8964A] bg-[#FAF6EC]/30'
                        }`}
                      />
                      {guestErrors.email && (
                        <p className="text-xs text-red-600 font-medium">{guestErrors.email}</p>
                      )}
                    </div>

                    {/* Special Requests */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-[#0F2A20] uppercase tracking-wider block">
                        {isKn ? 'ವಿಶೇಷ ವಿನಂತಿಗಳು ಅಥವಾ ಆಹಾರದ ಆದ್ಯತೆಗಳು (ಐಚ್ಛಿಕ)' : 'Special Requests or Dietary Needs (Optional)'}
                      </label>
                      <textarea
                        rows={3}
                        value={guestData.specialRequests}
                        onChange={(e) => setGuestData({ ...guestData, specialRequests: e.target.value })}
                        placeholder={isKn ? 'ಉದಾ: ಸಸ್ಯಾಹಾರಿ ಉಪಹಾರ, ಮಗುವಿನ ತೊಟ್ಟಿಲು, ನಿರೀಕ್ಷಿತ ಆಗಮನ ಸಮಯ...' : 'e.g. Vegetarian breakfast preference, infant food heating, approximate arrival time...'}
                        className="w-full px-4 py-3 rounded-xl border border-[#B8964A]/30 text-sm text-[#0F2A20] focus:outline-none focus:border-[#B8964A] bg-[#FAF6EC]/30 transition-colors resize-none"
                      />
                    </div>

                  </div>
                </div>

                {/* INCLUDED SUMMARY CARD (Removing 'Entire homestay for your group') */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#B8964A]/25 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F1E9D8] pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#B8964A]" />
                      <h3 className="font-serif text-base font-bold text-[#0F2A20]">
                        {isKn ? 'ನಿಮ್ಮ ತಂಗುವಿಕೆಯಲ್ಲಿ ಏನೆಲ್ಲಾ ಒಳಗೊಂಡಿದೆ' : "What's Included in Your Stay"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInclusionsModal(true)}
                      className="text-xs text-[#B8964A] hover:underline font-semibold"
                    >
                      {isKn ? 'ಸಂಪೂರ್ಣ ಪಟ್ಟಿ ನೋಡಿ' : 'View Full Details'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#0F2A20]">
                    {filteredInclusions.map((item) => (
                      <div key={item._id || item.id} className="flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <div>
                          <span className="font-semibold block">
                            {isKn && item.title?.kn ? item.title.kn : (item.title?.en || item.title)}
                          </span>
                          <span className="text-[11px] text-[#5F6B62] font-light">
                            {isKn && item.note?.kn ? item.note.kn : (item.note?.en || item.note)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 3 Actions */}
                <div className="flex items-center justify-between gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-3 rounded-xl border border-[#B8964A]/30 text-xs font-semibold text-[#0F2A20] hover:bg-[#FAF6EC] transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{isKn ? 'ಹಿಂದಕ್ಕೆ' : 'Back'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleProceedFromStep3}
                    className="px-8 py-3.5 rounded-xl text-xs uppercase tracking-[0.14em] font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all shadow-md hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
                  >
                    <span>{isKn ? 'ಮುಂದೆ: ಪರಿಶೀಲನೆ & ಪಾವತಿ' : 'Continue to Review & Pay'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </section>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* STEP 4: REVIEW AND PAY                                             */}
            {/* ------------------------------------------------------------------ */}
            {currentStep === 4 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0F2A20]">
                      {isKn ? '4. ಬುಕಿಂಗ್ ಪರಿಶೀಲನೆ & ಮುಂಗಡ ಪಾವತಿ' : '4. Review Reservation & Payment'}
                    </h2>
                    <p className="text-xs text-[#5F6B62] mt-0.5">
                      {isKn 
                        ? '15 ನಿಮಿಷಗಳ ಕಾಲ ಕೊಠಡಿಯನ್ನು ಕಾಯ್ದಿರಿಸಲು ಮುಂಗಡ ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ.' 
                        : 'Review itemised tariff, choose advance deposit, and hold your dates.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-xs font-semibold text-[#B8964A] hover:text-[#0F2A20] flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{isKn ? 'ವಿವರಗಳನ್ನು ತಿದ್ದಿ' : 'Edit Details'}</span>
                  </button>
                </div>

                {/* Reservation Summary Card */}
                <div className="p-6 rounded-3xl bg-white border border-[#B8964A]/30 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#F1E9D8] pb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#B8964A] block">
                        {stayType === 'full_home' ? (isKn ? 'ಸಂಪೂರ್ಣ ಆಸ್ತಿ' : 'Full Property') : (isKn ? 'ಆಯ್ಕೆಮಾಡಿದ ಕೊಠಡಿ' : 'Selected Room')}
                      </span>
                      <h3 className="font-serif text-xl font-bold text-[#0F2A20]">
                        {activeStayName}
                      </h3>
                      <p className="text-xs text-[#5F6B62] mt-0.5">
                        {checkIn} → {checkOut} ({nightsCount} {isKn ? 'ರಾತ್ರಿಗಳು' : (nightsCount > 1 ? 'nights' : 'night')}) • {adults} {isKn ? 'ವಯಸ್ಕರು' : 'Adults'}, {children} {isKn ? 'ಮಕ್ಕಳು' : 'Children'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-[#5F6B62] block">{isKn ? 'ದರ' : 'Rate'}</span>
                      <span className="font-serif text-lg font-bold text-[#0F2A20]">
                        {stayType === 'room' && !isPackagePriceOverride && weekendNightsCount > 0 && weekdayNightsCount > 0 && roomWeekendRate !== roomWeekdayRate
                          ? `₹${roomWeekdayRate.toLocaleString('en-IN')} / Wknd ₹${roomWeekendRate.toLocaleString('en-IN')}`
                          : `₹${(stayType === 'room' && !isPackagePriceOverride && weekendNightsCount === nightsCount && nightsCount > 0 ? roomWeekendRate : activePricePerNight).toLocaleString('en-IN')} / ${isKn ? 'ರಾತ್ರಿಗೆ' : 'nt'}`}
                      </span>
                    </div>
                  </div>

                  {/* Primary Guest Details Recap */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-[10px] uppercase text-[#5F6B62] block font-bold">{isKn ? 'ಅತಿಥಿ' : 'Guest'}</span>
                      <span className="font-semibold text-[#0F2A20]">{guestData.fullName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-[#5F6B62] block font-bold">{isKn ? 'WhatsApp' : 'Phone'}</span>
                      <span className="font-semibold text-[#0F2A20]">{guestData.phone}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-[#5F6B62] block font-bold">{isKn ? 'ಇಮೇಲ್' : 'Email'}</span>
                      <span className="font-semibold text-[#0F2A20] truncate block">{guestData.email}</span>
                    </div>
                  </div>
                </div>

                {/* Promo Code Input */}
                <div className="p-5 rounded-2xl bg-white border border-[#B8964A]/25 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#B8964A]" />
                    <span className="text-xs font-bold text-[#0F2A20] uppercase tracking-wider">
                      {isKn ? 'ಪ್ರೊಮೊ ಕೋಡ್ ಇದೆಯೇ?' : 'Have a Promo Voucher?'}
                    </span>
                  </div>

                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder={isKn ? 'ಕೋಡ್ ನಮೂದಿಸಿ (ಉದಾ: MONSOON10)' : 'Enter coupon code'}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#B8964A]/30 text-xs text-[#0F2A20] uppercase font-mono tracking-wider focus:outline-none focus:border-[#B8964A] bg-[#FAF6EC]/30"
                    />
                    <button
                      type="submit"
                      disabled={isApplyingPromo || !promoInput.trim()}
                      className="px-5 py-2.5 rounded-xl bg-[#0F2A20] text-[#D9BC7A] text-xs font-bold uppercase tracking-wider hover:bg-[#1B4332] transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      {isApplyingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (isKn ? 'ಅನ್ವಯಿಸಿ' : 'Apply')}
                    </button>
                  </form>

                  {appliedPromo && (
                    <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isKn ? `ಕೋಡ್ ${appliedPromo.code} ಯಶಸ್ವಿಯಾಗಿ ಅನ್ವಯಿಸಿದೆ!` : `Voucher ${appliedPromo.code} applied successfully!`}</span>
                    </p>
                  )}
                  {promoError && (
                    <p className="text-xs text-red-600 font-medium">{promoError}</p>
                  )}
                </div>

                {/* Advance Payment Options (20%, 50%, 100%) */}
                <div className="p-6 rounded-3xl bg-white border border-[#B8964A]/25 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-[#0F2A20]">
                      {isKn ? 'ಮುಂಗಡ ಪಾವತಿ ಆಯ್ಕೆಮಾಡಿ' : 'Select Advance Deposit Option'}
                    </h3>
                    <p className="text-xs text-[#5F6B62] mt-0.5">
                      {isKn 
                        ? 'ಕನಿಷ್ಠ 20% ಮುಂಗಡ ನೀಡಿ ಕೊಠಡಿ ಕಾಯ್ದಿರಿಸಿ. ಬಾಕಿಯನ್ನು ಚೆಕ್-ಇನ್ ಸಮಯದಲ್ಲಿ ನೀಡಿ.' 
                        : 'Hold with 20% deposit now. Pay the remaining balance upon arrival.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { pct: 20, label: isKn ? '20% ಮುಂಗಡ' : '20% Deposit', sub: isKn ? 'ಕನಿಷ್ಠ ಮುಂಗಡ' : 'Reserve room' },
                      { pct: 50, label: isKn ? '50% ಮುಂಗಡ' : '50% Deposit', sub: isKn ? 'ಅರ್ಧ ಪಾವತಿ' : 'Half payment' },
                      { pct: 100, label: isKn ? '100% ಪೂರ್ಣ ಪಾವತಿ' : '100% Full Payment', sub: isKn ? 'ಚಿಂತೆ ಇಲ್ಲದ ತಂಗುವಿಕೆ' : 'Zero balance at check-in' }
                    ].map((opt) => {
                      const isSelected = advancePercent === opt.pct;
                      const calculatedAdv = serverQuote?.totalAmount 
                        ? Math.round((serverQuote.totalAmount * opt.pct) / 100)
                        : Math.round((nightsCount * activePricePerNight * opt.pct) / 100);

                      return (
                        <div
                          key={opt.pct}
                          role="button"
                          tabIndex={0}
                          onClick={() => setAdvancePercent(opt.pct)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setAdvancePercent(opt.pct); }}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected 
                              ? 'border-[#B8964A] bg-[#FAF6EC] shadow-sm ring-2 ring-[#B8964A]/30' 
                              : 'border-[#F1E9D8] bg-white hover:border-[#B8964A]/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-serif font-bold text-sm text-[#0F2A20]">{opt.label}</span>
                            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-[#B8964A] bg-[#B8964A] text-[#0F2A20]' : 'border-gray-300'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                          </div>
                          <div>
                            <span className="font-mono text-base font-bold text-[#0F2A20] block">
                              ₹{calculatedAdv.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-[#5F6B62] block mt-0.5">{opt.sub}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cancellation Policy Note (Single Source of Truth from Site Settings) */}
                {(() => {
                  const totalStayEst = serverQuote?.totalAmount || (nightsCount * activePricePerNight);
                  const advEst = Math.round((totalStayEst * (Number(advancePercent) || 20)) / 100);
                  const todayCalc = checkIn
                    ? calculateTierRefund({
                        settings: siteSettings,
                        checkInDate: checkIn,
                        paidAmount: advEst
                      })
                    : null;
                  const summaryText = formatCancellationSummaryText(siteSettings, isKn ? 'kn' : 'en');

                  return (
                    <div className="p-4 rounded-2xl bg-[#FAF6EC] border border-[#B8964A]/25 text-xs text-[#0F2A20] space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 font-bold text-[#B8964A]">
                          <ShieldCheck className="w-4 h-4" />
                          <span>{isKn ? 'ರದ್ದತಿ ಮತ್ತು ಮರುಪಾವತಿ ನೀತಿ' : 'Cancellation & Refund Policy'}</span>
                        </div>
                        <Link
                          to="/refund-policy"
                          className="text-[11px] font-semibold text-[#0F2A20] underline hover:text-[#B8964A]"
                        >
                          {isKn ? 'ಪೂರ್ಣ ನೀತಿ ನೋಡಿ' : 'View Refund Policy'}
                        </Link>
                      </div>
                      <p className="text-[#3E4C43] leading-relaxed">{summaryText}</p>
                      {todayCalc && todayCalc.daysBeforeCheckIn !== null && (
                        <div className="px-3 py-2 rounded-xl bg-white border border-[#B8964A]/30 text-[#0F2A20] font-medium">
                          {isKn
                            ? `ಇಂದು ರದ್ದುಪಡಿಸಿದರೆ ನಿಮಗೆ ${todayCalc.refundPercent}% ಮರುಪಾವತಿ ಲಭ್ಯವಾಗುತ್ತದೆ.`
                            : `If you cancel today you would receive a ${todayCalc.refundPercent}% refund.`}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Active Hold Countdown Banner if guest dismissed checkout or retrying */}
                {activeHeldBooking && holdSecondsRemaining !== null && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-amber-700 flex-shrink-0 animate-pulse" />
                      <div>
                        <span className="font-bold">
                          {isKn ? 'ಕೊಠಡಿ ಕಾಯ್ದಿರಿಸುವಿಕೆ ಸಕ್ರಿಯವಾಗಿದೆ:' : 'Room Hold Active:'}{' '}
                          <span className="font-mono">{activeHeldBooking.bookingCode}</span>
                        </span>
                        <p className="text-[11px] text-amber-800">
                          {isKn
                            ? 'ಕಾಯ್ದಿರಿಸುವಿಕೆಯನ್ನು ಸುರಕ್ಷಿತಗೊಳಿಸಲು ಪಾವತಿಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ.'
                            : 'Complete payment before time expires to secure your reservation.'}
                        </p>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-sm bg-amber-200/80 px-3 py-1 rounded-lg border border-amber-400">
                      ⏱ {Math.floor(holdSecondsRemaining / 60)}:{(holdSecondsRemaining % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                )}

                {/* Payment Failure / Dismiss Notice */}
                {paymentError && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold">{paymentError}</p>
                      <p className="text-[11px] text-red-700 mt-0.5">
                        {isKn
                          ? 'ನಿಮ್ಮ ಕೊಠಡಿ 15 ನಿಮಿಷಗಳ ಕಾಲ ಕಾಯ್ದಿರಿಸಲ್ಪಟ್ಟಿದೆ. ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ ಮರುಪ್ರಯತ್ನಿಸಿ.'
                          : 'Your room hold is preserved for 15 minutes. Click below to retry payment.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Terms and Conditions Acceptance Checkbox */}
                <div className="p-4 rounded-2xl bg-white border border-[#B8964A]/25 space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => {
                        setTermsAccepted(e.target.checked);
                        if (termsError) setTermsError(false);
                      }}
                      className="mt-1 w-4 h-4 rounded text-[#B8964A] border-[#B8964A] focus:ring-[#B8964A]"
                    />
                    <span className="text-xs text-[#5F6B62] leading-relaxed">
                      {isKn ? (
                        <>
                          ನಾನು <Link to="/policies" className="text-[#B8964A] underline font-medium">ಹೋಂಸ್ಟೇ ನಿಯಮಗಳು</Link>, <Link to="/refund-policy" className="text-[#B8964A] underline font-medium">ಮರುಪಾವತಿ ಮತ್ತು ರದ್ದತಿ ನೀತಿ</Link> ಮತ್ತು ಚೆಕ್-ಇನ್ ವೇಳೆಯಲ್ಲಿ ಮಾನ್ಯ ಸರ್ಕಾರಿ ಐಡಿ ಅವಶ್ಯಕತೆಗಳನ್ನು ಒಪ್ಪಿಕೊಳ್ಳುತ್ತೇನೆ.
                        </>
                      ) : (
                        <>
                          I agree to the <Link to="/policies" className="text-[#B8964A] underline font-medium">Terms of Stay & House Rules</Link> and <Link to="/refund-policy" className="text-[#B8964A] underline font-medium">Refund & Cancellation Policy</Link>, and acknowledge that valid Government Photo ID is required at check-in.
                        </>
                      )}
                    </span>
                  </label>
                  {termsError && (
                    <p className="text-xs text-red-600 font-medium pl-7">
                      {isKn ? 'ಮುಂದುವರಿಯಲು ದಯವಿಟ್ಟು ನಿಯಮಗಳನ್ನು ಒಪ್ಪಿಕೊಳ್ಳಿ.' : 'Please agree to the house rules to proceed.'}
                    </p>
                  )}
                </div>

                {/* Pay & Hold Button */}
                <div className="flex items-center justify-between gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-5 py-3 rounded-xl border border-[#B8964A]/30 text-xs font-semibold text-[#0F2A20] hover:bg-[#FAF6EC] transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{isKn ? 'ಹಿಂದಕ್ಕೆ' : 'Back'}</span>
                  </button>

                  {!razorpayConfig.configured ? (
                    <div className="flex-1 sm:flex-none px-6 py-4 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 text-center">
                      {isKn
                        ? 'ಆನ್‌ಲೈನ್ ಪಾವತಿ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ, ದಯವಿಟ್ಟು ಹೋಸ್ಟ್ ಅನ್ನು ಸಂಪರ್ಕಿಸಿ'
                        : 'Online payment is not available yet, please contact the host'}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePayAndHold}
                      disabled={isSubmittingBooking || !termsAccepted}
                      className="flex-1 sm:flex-none px-8 py-4 rounded-xl text-xs uppercase tracking-[0.14em] font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all shadow-[0_4px_20px_rgba(184,150,74,0.4)] hover:-translate-y-0.5 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmittingBooking ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#0F2A20]" />
                          <span>{isKn ? 'ಪಾವತಿ ಪ್ರಕ್ರಿಯೆ...' : 'Opening Payment...'}</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-[#0F2A20]" />
                          <span>
                            {activeHeldBooking
                              ? (isKn ? 'ಪಾವತಿಯನ್ನು ಮರುಪ್ರಯತ್ನಿಸಿ' : 'Retry Payment')
                              : (isKn ? 'ಮುಂಗಡ ಪಾವತಿ & 15 ನಿಮಿಷಗಳ ರಿಸರ್ವೇಶನ್' : 'Pay & Hold Reservation (15 Mins)')}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>

              </section>
            )}

          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY PANEL (4 COLS)                           */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Sticky Order Summary Box */}
            <div className="p-6 rounded-3xl bg-white border border-[#B8964A]/30 shadow-md space-y-5 sticky top-24">
              
              <div className="flex items-center justify-between border-b border-[#F1E9D8] pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#B8964A]" />
                  <h3 className="font-serif text-base font-bold text-[#0F2A20]">
                    {isKn ? 'ಬುಕಿಂಗ್ ಸಾರಾಂಶ' : 'Order Summary'}
                  </h3>
                </div>
                <span className="text-[10px] font-mono uppercase bg-[#FAF6EC] px-2 py-0.5 rounded border border-[#B8964A]/25 text-[#B8964A]">
                  Step {currentStep} of 4
                </span>
              </div>

              {/* Reserved Item */}
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#5F6B62] block">
                  {stayType === 'full_home' ? (isKn ? 'ವಾಸ್ತವ್ಯ ವಿಧ' : 'Stay Type') : (isKn ? 'ಕೊಠಡಿ' : 'Room')}
                </span>
                <span className="font-serif text-base font-bold text-[#0F2A20] block">
                  {activeStayName}
                </span>
                {selectedPackageDoc && (stayType === 'full_home' || isPackagePriceOverride) && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-[#FAF6EC] border border-[#B8964A]/30 text-[10px] font-semibold text-[#B8964A]">
                    {selectedPackageDoc.title || selectedPackageDoc.name}
                  </span>
                )}
                <span className="text-[11px] text-emerald-800 font-medium block mt-0.5">
                  {activeStayMealsNote}
                </span>
              </div>

              {/* Dates & Nights Line */}
              <div className="p-3 rounded-xl bg-[#FAF6EC] border border-[#B8964A]/20 text-xs space-y-1">
                <div className="flex justify-between text-[#5F6B62]">
                  <span>{isKn ? 'ಆಗಮನ' : 'Check-In'}</span>
                  <span className="font-semibold text-[#0F2A20]">{checkIn || (isKn ? 'ಆಯ್ಕೆಯಾಗಿಲ್ಲ' : 'Not chosen')}</span>
                </div>
                <div className="flex justify-between text-[#5F6B62]">
                  <span>{isKn ? 'ನಿರ್ಗಮನ' : 'Check-Out'}</span>
                  <span className="font-semibold text-[#0F2A20]">{checkOut || (isKn ? 'ಆಯ್ಕೆಯಾಗಿಲ್ಲ' : 'Not chosen')}</span>
                </div>
                {checkIn && checkOut && (
                  <div className="flex justify-between text-[#B8964A] font-bold pt-1 border-t border-[#B8964A]/20">
                    <span>{isKn ? 'ಒಟ್ಟು ಅವಧಿ' : 'Total Duration'}</span>
                    <span>{nightsCount} {isKn ? 'ರಾತ್ರಿಗಳು' : (nightsCount > 1 ? 'Nights' : 'Night')}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#5F6B62] pt-1">
                  <span>{isKn ? 'ಅತಿಥಿಗಳು' : 'Guests'}</span>
                  <span className="font-semibold text-[#0F2A20]">{adults} {isKn ? 'ವಯಸ್ಕರು' : 'Adults'}, {children} {isKn ? 'ಮಕ್ಕಳು' : 'Child'}</span>
                </div>
              </div>

              {/* Price Itemization from Server Quote */}
              <div className="space-y-2 text-xs pt-1 border-t border-[#F1E9D8]">
                {isLoadingQuote ? (
                  <div className="space-y-2 py-2 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded w-full" />
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-[#5F6B62]">
                      <span>
                        {stayType === 'room' && !isPackagePriceOverride && nightsCount > 0 && weekendNightsCount > 0 && roomWeekendRate !== roomWeekdayRate
                          ? `${weekdayNightsCount > 0 ? `${weekdayNightsCount}×₹${roomWeekdayRate.toLocaleString('en-IN')}` : ''}${weekdayNightsCount > 0 ? ' + ' : ''}${weekendNightsCount} wknd×₹${roomWeekendRate.toLocaleString('en-IN')}`
                          : `₹${activePricePerNight.toLocaleString('en-IN')} × ${nightsCount || 1} ${isKn ? 'ರಾತ್ರಿ' : 'night'}`}
                      </span>
                      <span className="font-medium text-[#0F2A20]">
                        ₹{(serverQuote?.baseAmount ?? localBaseAmount).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {serverQuote?.discount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>{isKn ? 'ವೋಚರ್ ರಿಯಾಯಿತಿ' : 'Voucher Discount'}</span>
                        <span>- ₹{Number(serverQuote.discount).toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    {serverQuote?.taxAmount > 0 && (
                      <div className="flex justify-between text-[#5F6B62]">
                        <span>{isKn ? 'ತೆರಿಗೆ (GST)' : 'GST Tax'}</span>
                        <span className="text-[#0F2A20]">₹{Number(serverQuote.taxAmount).toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-[#F1E9D8] flex justify-between font-serif text-base font-bold text-[#0F2A20]">
                      <span>{isKn ? 'ಒಟ್ಟು ದರ' : 'Total Tariff'}</span>
                      <span className="text-[#B8964A]">
                        ₹{(serverQuote?.totalAmount ?? localBaseAmount).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="pt-1.5 flex justify-between text-xs text-amber-800 font-bold border-t border-[#F1E9D8]">
                      <span>{isKn ? `ಮುಂಗಡ ಪಾವತಿ (${advancePercent}%)` : `Advance Due (${advancePercent}%)`}</span>
                      <span>
                        ₹{(serverQuote?.advanceAmount ?? Math.round(((serverQuote?.totalAmount ?? localBaseAmount) * advancePercent) / 100)).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-[#5F6B62]">
                      <span>{isKn ? 'ಚೆಕ್-ಇನ್‌ನಲ್ಲಿ ಬಾಕಿ' : 'Balance at Check-In'}</span>
                      <span className="font-semibold text-[#0F2A20]">
                        ₹{(serverQuote?.balanceDue ?? ((serverQuote?.totalAmount ?? localBaseAmount) - Math.round(((serverQuote?.totalAmount ?? localBaseAmount) * advancePercent) / 100))).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Trust Badges */}
              <div className="pt-3 border-t border-[#F1E9D8] space-y-1.5 text-[11px] text-[#5F6B62]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#B8964A]" />
                  <span>{isKn ? '15 ನಿಮಿಷಗಳ ಖಚಿತ ಹೋಲ್ಡ್' : '15-minute guaranteed room hold'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#B8964A]" />
                  <span>{isKn ? 'ತ್ವರಿತ WhatsApp ದೃಢೀಕರಣ' : 'Direct WhatsApp confirmation'}</span>
                </div>
              </div>

            </div>

            {/* Inclusions Quick Box */}
            <InclusionsSection
              variant="summary"
              onOpenModal={() => setShowInclusionsModal(true)}
            />

          </div>

        </div>

      </main>

      {/* MOBILE STICKY BOTTOM BAR (Total & Continue Button so guest never gets lost) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1B4332] text-[#FAF6EC] px-4 py-3 border-t border-[#B8964A]/30 shadow-2xl flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#D9BC7A] block truncate">
            {activeStayName}
          </span>
          <div className="font-serif text-base font-bold text-[#FAF6EC] truncate">
            {checkIn && checkOut 
              ? `₹${(serverQuote?.totalAmount ?? localBaseAmount).toLocaleString('en-IN')}` 
              : `₹${activePricePerNight.toLocaleString('en-IN')} / nt`}
            {checkIn && checkOut && (
              <span className="text-[10px] text-[#B9C4B8] font-normal ml-1">
                ({nightsCount}N)
              </span>
            )}
          </div>
        </div>

        <div>
          {currentStep === 1 && (
            <button
              type="button"
              onClick={handleProceedFromStep1}
              className="px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] shadow-md flex items-center gap-1.5"
            >
              <span>{isKn ? 'ದಿನಾಂಕಗಳು' : 'Select Dates'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {currentStep === 2 && (
            <button
              type="button"
              onClick={handleProceedFromStep2}
              disabled={!checkIn || !checkOut || isCheckingDateConflict || Boolean(dateConflict?.occupied)}
              className="px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] shadow-md disabled:opacity-40 flex items-center gap-1.5"
            >
              <span>{isKn ? 'ವಿವರಗಳು' : 'Enter Details'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {currentStep === 3 && (
            <button
              type="button"
              onClick={handleProceedFromStep3}
              className="px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] shadow-md flex items-center gap-1.5"
            >
              <span>{isKn ? 'ಪಾವತಿ' : 'Review & Pay'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {currentStep === 4 && (
            !razorpayConfig.configured ? (
              <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300">
                {isKn ? 'ಪಾವತಿ ಲಭ್ಯವಿಲ್ಲ' : 'Payment Unavailable'}
              </span>
            ) : (
              <button
                type="button"
                onClick={handlePayAndHold}
                disabled={isSubmittingBooking || !termsAccepted}
                className="px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] shadow-md disabled:opacity-40 flex items-center gap-1.5"
              >
                {isSubmittingBooking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                <span>
                  {activeHeldBooking
                    ? (isKn ? 'ಮರುಪ್ರಯತ್ನಿಸಿ' : 'Retry Payment')
                    : (isKn ? 'ಪಾವತಿಸಿ' : 'Hold Booking')}
                </span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Inclusions Interactive Full Modal */}
      {showInclusionsModal && (
        <div
          className="fixed inset-0 z-50 bg-[#0F2A20]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setShowInclusionsModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="What's Included and Not Included"
        >
          <div
            className="relative w-full max-w-4xl bg-[#FAF6EC] rounded-3xl overflow-hidden shadow-2xl my-auto p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowInclusionsModal(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 rounded-full bg-[#F1E9D8] text-[#0F2A20] hover:bg-[#A8654A] hover:text-[#FAF6EC] flex items-center justify-center transition-colors cursor-pointer z-20 border border-[#B8964A]/25"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <InclusionsSection variant="full" bgColor="bg-[#FAF6EC]" />
          </div>
        </div>
      )}

    </div>
  );
};
