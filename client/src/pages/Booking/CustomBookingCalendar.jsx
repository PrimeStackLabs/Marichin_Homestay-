import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Info,
  Check,
  Ban,
  Clock
} from 'lucide-react';
import { api } from '../../services/api';
import { useAdmin } from '../../context/AdminContext';

/**
 * CustomBookingCalendar
 * - 2 months side by side on desktop (md+), 1 month on mobile (< md)
 * - Touch swipe left/right for mobile navigation
 * - Day cells: Available (green tint + dot), Booked (strikethrough + reason tooltip),
 *   Blocked (grey dashed + "Not available"), Past/Out of range (faded), Today (gold outline).
 * - Check-in / Check-out selection with valid checkout dates enforcement from server.
 * - Keyboard accessible (arrows, Enter, Space, Escape) with ARIA.
 * - English & Kannada support.
 */
export const CustomBookingCalendar = ({
  bookingType = 'room', // 'room' | 'full_home'
  roomId = null,
  roomSlug = null,
  roomName = 'Standard Room',
  pricePerNight = 8000,
  mealsNote = 'Morning breakfast included',
  checkIn,
  checkOut,
  onDatesChange,
  serverQuote = null,
  isKn = false
}) => {
  const adminCtx = useAdmin();
  const syncVersion = adminCtx?.syncVersion || 0;

  const parseLocalYMD = (str) => {
    if (!str || typeof str !== 'string') return null;
    const m = str.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  };

  // Navigation: base date for first displayed month (always set to 1st of that month)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const parsed = parseLocalYMD(checkIn);
    if (parsed) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
    }
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Keep month view in sync if checkIn date is updated externally
  useEffect(() => {
    const parsed = parseLocalYMD(checkIn);
    if (parsed) {
      setCurrentMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    }
  }, [checkIn]);

  // Touch swipe support for mobile
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);

  // Hover date when selecting checkout
  const [hoverDate, setHoverDate] = useState(null);

  // Calendar availability cache from server
  const [calendarDaysMap, setCalendarDaysMap] = useState({});
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);

  // Valid checkout options when checkIn is chosen
  const [validCheckoutDates, setValidCheckoutDates] = useState([]);
  const [firstUnavailableNight, setFirstUnavailableNight] = useState(null);
  const [isLoadingCheckoutOptions, setIsLoadingCheckoutOptions] = useState(false);

  // Active focused cell for keyboard navigation
  const [focusedDate, setFocusedDate] = useState(checkIn || null);

  // Format YYYY-MM-DD
  const formatYMD = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = useMemo(() => formatYMD(new Date()), []);

  // Fetch calendar availability for the displayed 2-3 months window
  const fetchCalendarData = useCallback(async () => {
    setIsLoadingCalendar(true);
    try {
      const from = formatYMD(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
      const to = formatYMD(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 3, 0));

      const params = {
        bookingType,
        from,
        to
      };
      if (bookingType === 'room') {
        params.rooms = roomId || roomSlug || 'standard-room';
      }

      const res = await api.getAvailabilityCalendar(params);
      if (res?.data?.days && Array.isArray(res.data.days)) {
        const map = {};
        res.data.days.forEach((item) => {
          map[item.date] = item;
        });
        setCalendarDaysMap(map);
      }
    } catch (err) {
      console.warn('Calendar availability fetch failed, using fallback:', err);
    } finally {
      setIsLoadingCalendar(false);
    }
  }, [bookingType, roomId, roomSlug, currentMonth]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData, syncVersion]);

  // Fetch checkout options whenever checkIn date is set
  useEffect(() => {
    if (!checkIn) {
      setValidCheckoutDates([]);
      setFirstUnavailableNight(null);
      return;
    }

    let isMounted = true;
    const fetchOptions = async () => {
      setIsLoadingCheckoutOptions(true);
      try {
        const params = {
          bookingType,
          checkIn
        };
        if (bookingType === 'room') {
          params.rooms = roomId || roomSlug || 'standard-room';
        }
        const res = await api.getCheckoutOptions(params);
        if (isMounted && res?.data) {
          setValidCheckoutDates(res.data.validCheckOutDates || []);
          setFirstUnavailableNight(res.data.firstUnavailableNight || null);
        }
      } catch (err) {
        console.warn('Checkout options fetch failed:', err);
        if (isMounted) {
          // Fallback: next 14 consecutive days
          const dates = [];
          const cur = parseLocalYMD(checkIn) || new Date(checkIn);
          for (let i = 1; i <= 14; i++) {
            cur.setDate(cur.getDate() + 1);
            dates.push(formatYMD(cur));
          }
          setValidCheckoutDates(dates);
        }
      } finally {
        if (isMounted) setIsLoadingCheckoutOptions(false);
      }
    };

    fetchOptions();
    return () => {
      isMounted = false;
    };
  }, [checkIn, bookingType, roomId, roomSlug, syncVersion]);

  // Month navigation
  const prevMonth = () => {
    const today = new Date();
    const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (newMonth >= minMonth) {
      setCurrentMonth(newMonth);
    }
  };

  const nextMonth = () => {
    // Max advance 12 months
    const today = new Date();
    const maxMonth = new Date(today.getFullYear(), today.getMonth() + 11, 1);
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    if (newMonth <= maxMonth) {
      setCurrentMonth(newMonth);
    }
  };

  const isPrevDisabled = useMemo(() => {
    const today = new Date();
    const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return currentMonth <= minMonth;
  }, [currentMonth]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Only swipe if horizontal move was greater than vertical move
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0 && !isPrevDisabled) {
        prevMonth();
      } else if (diffX < 0) {
        nextMonth();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Kannada Month & Day Names
  const knMonths = [
    'ಜನವರಿ', 'ಫೆಬ್ರವರಿ', 'ಮಾರ್ಚ್', 'ಏಪ್ರಿಲ್', 'ಮೇ', 'ಜೂನ್',
    'ಜುಲೈ', 'ಆಗಸ್ಟ್', 'ಸೆಪ್ಟೆಂಬರ್', 'ಅಕ್ಟೋಬರ್', 'ನವೆಂಬರ್', 'ಡಿಸೆಂಬರ್'
  ];
  const enMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const knDays = ['ಭಾ', 'ಸೋ', 'ಮಂ', 'ಬು', 'ಗು', 'ಶು', 'ಶ'];
  const enDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Generate calendar grid for a specific month
  const getMonthMatrix = (baseDate) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    // Leading empty cells
    for (let i = 0; i < firstDay; i++) {
      cells.push({ empty: true, key: `empty-${year}-${month}-${i}` });
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const serverInfo = calendarDaysMap[dateStr];
      const isToday = dateStr === todayStr;
      const isPast = dateStr < todayStr;
      const isSelectedCheckIn = checkIn === dateStr;
      const isSelectedCheckOut = checkOut === dateStr;

      // In-range calculation
      let isInRange = false;
      if (checkIn && checkOut && dateStr > checkIn && dateStr < checkOut) {
        isInRange = true;
      } else if (checkIn && !checkOut && hoverDate && dateStr > checkIn && dateStr <= hoverDate) {
        isInRange = true;
      }

      // Status
      let status = serverInfo?.status || (isPast || isToday ? 'past' : 'available');
      let reason = serverInfo?.reason || '';
      const remainingUnits = serverInfo?.remainingUnits;
      const totalUnits = serverInfo?.totalUnits;

      // Check-out selection constraints
      let isValidCheckout = false;
      let isCheckoutDisabled = false;

      if (checkIn) {
        if (!checkOut) {
          // Currently picking checkout
          if (dateStr <= checkIn) {
            isCheckoutDisabled = true;
          } else {
            isValidCheckout = validCheckoutDates.includes(dateStr);
            if (!isValidCheckout) {
              isCheckoutDisabled = true;
            }
          }
        } else {
          // Both selected already
          isValidCheckout = validCheckoutDates.includes(dateStr);
        }
      }

      cells.push({
        empty: false,
        key: dateStr,
        dateStr,
        dayNumber: day,
        status,
        reason,
        remainingUnits,
        totalUnits,
        isToday,
        isPast,
        isSelectedCheckIn,
        isSelectedCheckOut,
        isInRange,
        isValidCheckout,
        isCheckoutDisabled,
        isFirstUnavailable: dateStr === firstUnavailableNight
      });
    }

    return {
      year,
      month,
      title: isKn ? `${knMonths[month]} ${year}` : `${enMonths[month]} ${year}`,
      cells
    };
  };

  const firstMonthMatrix = useMemo(() => getMonthMatrix(currentMonth), [currentMonth, calendarDaysMap, checkIn, checkOut, hoverDate, validCheckoutDates, firstUnavailableNight, isKn]);
  const secondMonthMatrix = useMemo(() => {
    const nextM = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    return getMonthMatrix(nextM);
  }, [currentMonth, calendarDaysMap, checkIn, checkOut, hoverDate, validCheckoutDates, firstUnavailableNight, isKn]);

  // Day Click Handler
  const handleDayClick = (cell) => {
    if (cell.empty || cell.isPast || cell.isToday || cell.status === 'past' || cell.status === 'outside_range') {
      return;
    }

    const { dateStr, status, isSelectedCheckIn } = cell;

    // 1. If clicking the already-selected check-in date: reset checkout to change check-in
    if (isSelectedCheckIn) {
      onDatesChange({ checkIn: null, checkOut: null });
      return;
    }

    // 2. If no check-in chosen yet (or resetting):
    if (!checkIn || (checkIn && checkOut)) {
      if (status === 'full' || status === 'blocked') {
        return; // Cannot start stay on unavailable night
      }
      onDatesChange({ checkIn: dateStr, checkOut: null });
      setHoverDate(null);
      return;
    }

    // 3. Check-in is chosen, now choosing check-out:
    if (checkIn && !checkOut) {
      if (dateStr <= checkIn) {
        // Tapped an earlier date: set that as new check-in
        if (status === 'full' || status === 'blocked') return;
        onDatesChange({ checkIn: dateStr, checkOut: null });
        setHoverDate(null);
        return;
      }

      // Check if candidate date is in valid checkout dates (includes 11 AM turnover on first unavailable night)
      if (validCheckoutDates.includes(dateStr)) {
        onDatesChange({ checkIn, checkOut: dateStr });
        setHoverDate(null);
      }
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e, cell) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDayClick(cell);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onDatesChange({ checkIn: null, checkOut: null });
      setHoverDate(null);
    }
  };

  // Calculate nights
  const nightsCount = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut) - new Date(checkIn);
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [checkIn, checkOut]);

  // Live total quote line
  const livePriceQuote = useMemo(() => {
    if (!checkIn || !checkOut) return null;
    if (serverQuote?.totalAmount !== undefined) {
      return `₹${Number(serverQuote.totalAmount).toLocaleString('en-IN')}`;
    }
    const total = nightsCount * pricePerNight;
    return `₹${total.toLocaleString('en-IN')}`;
  }, [checkIn, checkOut, serverQuote, nightsCount, pricePerNight]);

  // Render a Month Table
  const renderMonthTable = (monthData) => {
    return (
      <div className="flex-1 min-w-[280px]">
        {/* Month Header */}
        <div className="text-center font-serif text-base sm:text-lg font-bold text-[#0F2A20] pb-3 border-b border-[#F1E9D8]">
          {monthData.title}
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center py-2 text-[11px] font-semibold text-[#5F6B62] uppercase tracking-wider">
          {(isKn ? knDays : enDays).map((dayName, idx) => (
            <div key={idx} className={idx === 0 ? 'text-[#B8964A]' : ''}>
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div 
          className="grid grid-cols-7 gap-1 sm:gap-1.5"
          role="grid"
          aria-label={monthData.title}
        >
          {monthData.cells.map((cell) => {
            if (cell.empty) {
              return <div key={cell.key} className="h-8 sm:h-9" aria-hidden="true" />;
            }

            const {
              dateStr,
              dayNumber,
              status,
              reason,
              isToday,
              isPast,
              isSelectedCheckIn,
              isSelectedCheckOut,
              isInRange,
              isValidCheckout,
              isCheckoutDisabled,
              isFirstUnavailable,
              remainingUnits,
              totalUnits
            } = cell;

            // Determine interactive state
            const isPickingCheckOut = checkIn && !checkOut;
            const isClosedDay = isPast || isToday || status === 'past' || status === 'outside_range';
            const isTurnoverCheckout = isPickingCheckOut && isValidCheckout && (status === 'full' || status === 'blocked');
            const isSelectable = !isPast && !isToday && (
              isPickingCheckOut
                ? isValidCheckout || isSelectedCheckIn
                : status === 'available'
            );

            // Base cell styling
            let cellClasses = 'relative h-8 sm:h-9 w-full rounded-lg sm:rounded-xl text-xs flex flex-col items-center justify-center font-medium transition-all duration-150 select-none ';

            if (isSelectedCheckIn || isSelectedCheckOut) {
              cellClasses += 'bg-[#0F2A20] text-[#D9BC7A] font-bold shadow-md ring-2 ring-[#B8964A] z-10 ';
            } else if (isInRange) {
              cellClasses += 'bg-[#D9BC7A]/25 text-[#0F2A20] font-semibold rounded-none ';
            }

            if (!isSelectedCheckIn && !isSelectedCheckOut && !isInRange) {
              if (isTurnoverCheckout) {
                // Turnover morning: previous stay checks in today afternoon, valid for 11 AM checkout
                cellClasses += 'bg-gradient-to-br from-emerald-50 to-red-100 text-[#0F2A20] border-2 border-emerald-500 font-semibold cursor-pointer hover:from-emerald-100 hover:to-red-100 ';
              } else if (status === 'full') {
                cellClasses += 'line-through text-red-700 bg-red-100 border border-red-300 font-semibold cursor-not-allowed ';
              } else if (status === 'blocked') {
                cellClasses += 'text-red-600 bg-red-50 border border-dashed border-red-300 font-medium cursor-not-allowed ';
              } else if (isToday) {
                cellClasses += 'ring-2 ring-[#B8964A] bg-amber-50/40 text-gray-400 cursor-not-allowed ';
              } else if (isClosedDay) {
                cellClasses += 'opacity-25 pointer-events-none text-gray-400 ';
              } else if (isPickingCheckOut && isCheckoutDisabled && !isSelectedCheckIn) {
                cellClasses += 'opacity-40 text-gray-400 bg-gray-50 cursor-not-allowed ';
              } else {
                // Available
                cellClasses += 'bg-emerald-50/70 text-emerald-950 border border-emerald-200/70 hover:bg-emerald-100/90 cursor-pointer ';
              }
            }

            // Accessible tooltip text
            let tooltipText = '';
            if (isTurnoverCheckout) {
              tooltipText = isKn
                ? 'ಬೆಳಿಗ್ಗೆ 11:00 ರೊಳಗೆ ಚೆಕ್-ಔಟ್ (ಮುಂದಿನ ಬುಕಿಂಗ್ ಇಂದು ಪ್ರಾರಂಭವಾಗುತ್ತದೆ)'
                : 'Checkout by 11:00 AM (next booking starts today)';
            } else if (status === 'full') {
              tooltipText = isKn ? `ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ (${reason || 'ಈ ದಿನಾಂಕ ಭರ್ತಿಯಾಗಿದೆ'})` : `Booked (${reason || 'Occupied for selected room'})`;
            } else if (status === 'blocked') {
              tooltipText = isKn ? `ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ (${reason || 'ಲಭ್ಯವಿಲ್ಲ'})` : `Blocked (${reason || 'Host maintenance block'})`;
            } else if (isToday) {
              tooltipText = isKn
                ? 'ಇಂದು ಚೆಕ್-ಇನ್ ಮುಚ್ಚಲಾಗಿದೆ (ನಾಳೆಯಿಂದ ಲಭ್ಯ)'
                : 'Same-day check-in closed (earliest check-in: tomorrow)';
            } else if (isFirstUnavailable) {
              tooltipText = isKn ? 'ಮುಂದಿನ ಬುಕಿಂಗ್ ಇಲ್ಲಿ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ' : 'Next booking starts here';
            } else if (isSelectedCheckIn) {
              tooltipText = isKn ? 'ಆಗಮನ ದಿನಾಂಕ (ಬದಲಾಯಿಸಲು ಸ್ಪರ್ಶಿಸಿ)' : 'Check-in date (tap to change)';
            } else if (isSelectedCheckOut) {
              tooltipText = isKn ? 'ನಿರ್ಗಮನ ದಿನಾಂಕ' : 'Check-out date';
            } else if (isPickingCheckOut && isValidCheckout) {
              tooltipText = isKn ? 'ಮಾನ್ಯ ನಿರ್ಗಮನ ದಿನಾಂಕ' : 'Valid check-out date';
            } else if (status === 'available' && remainingUnits === 1 && totalUnits > 1) {
              tooltipText = isKn ? 'ಲಭ್ಯವಿದೆ — ಕೇವಲ 1 ಕೊಠಡಿ ಮಾತ್ರ ಬಾಕಿ' : 'Available — Only 1 unit left';
            }

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => handleDayClick(cell)}
                onMouseEnter={() => {
                  if (checkIn && !checkOut && isValidCheckout) {
                    setHoverDate(dateStr);
                  }
                }}
                onMouseLeave={() => {
                  if (checkIn && !checkOut) {
                    setHoverDate(null);
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, cell)}
                disabled={!isSelectable && !isSelectedCheckIn}
                aria-label={`${dateStr}: ${tooltipText || status}`}
                aria-selected={isSelectedCheckIn || isSelectedCheckOut || isInRange}
                title={tooltipText || (status === 'available' ? (isKn ? 'ಲಭ್ಯವಿದೆ' : 'Available') : reason)}
                className={cellClasses}
              >
                <span>{dayNumber}</span>

                {/* Subtle indicator dot for available dates when not selected */}
                {status === 'available' && !isSelectedCheckIn && !isSelectedCheckOut && !isInRange && !isClosedDay && (
                  <span
                    className={`w-1 h-1 rounded-full absolute bottom-1 ${
                      remainingUnits === 1 && totalUnits > 1 ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}
                  />
                )}

                {/* First unavailable night indicator */}
                {isFirstUnavailable && isPickingCheckOut && (
                  <span 
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 ring-1 ring-white"
                    title={isKn ? "ಬೆಳಿಗ್ಗೆ 11:00 ರೊಳಗೆ ಚೆಕ್-ಔಟ್" : "11:00 AM checkout turnover"}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="bg-white rounded-3xl border border-[#B8964A]/30 p-4 sm:p-6 shadow-[0_10px_35px_rgba(15,42,32,0.06)] relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Calendar Header with Navigation Controls */}
      <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-[#F1E9D8]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#1B4332]/10 border border-[#B8964A]/30 flex items-center justify-center text-[#B8964A]">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#0F2A20]">
              {isKn ? 'ತಂಗುವ ದಿನಾಂಕಗಳನ್ನು ಆರಿಸಿ' : 'Select Stay Dates'}
            </h3>
            <p className="text-[11px] text-[#5F6B62]">
              {!checkIn 
                ? (isKn ? '1. ಆಗಮನ ದಿನಾಂಕವನ್ನು ಆರಿಸಿ' : '1. Choose your check-in date')
                : !checkOut
                ? (isKn ? '2. ನಿರ್ಗಮನ ದಿನಾಂಕವನ್ನು ಆರಿಸಿ (ಹಸಿರು ಬಣ್ಣದವು ಮಾನ್ಯ)' : '2. Choose your check-out date (green are valid)')
                : (isKn ? `${nightsCount} ರಾತ್ರಿಗಳು ಆಯ್ಕೆಯಾಗಿದೆ` : `${nightsCount} Night${nightsCount > 1 ? 's' : ''} selected`)}
            </p>
          </div>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-1.5">
          {checkIn && (
            <button
              type="button"
              onClick={() => onDatesChange({ checkIn: null, checkOut: null })}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#A8654A] hover:bg-red-50 border border-[#A8654A]/30 transition-colors flex items-center gap-1 mr-1"
              title={isKn ? "ದಿನಾಂಕಗಳನ್ನು ಮರುಹೊಂದಿಸಿ" : "Reset dates"}
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">{isKn ? 'ಮರುಹೊಂದಿಸಿ' : 'Reset'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={prevMonth}
            disabled={isPrevDisabled}
            aria-label="Previous Month"
            className="w-8 h-8 rounded-full border border-[#B8964A]/30 flex items-center justify-center text-[#0F2A20] hover:bg-[#FAF6EC] disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="Next Month"
            className="w-8 h-8 rounded-full border border-[#B8964A]/30 flex items-center justify-center text-[#0F2A20] hover:bg-[#FAF6EC] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Months Display: 2 side by side on desktop, 1 on mobile */}
      {isLoadingCalendar && Object.keys(calendarDaysMap).length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 py-6">
          {[1, 2].map((mIdx) => (
            <div key={mIdx} className="space-y-3 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto" />
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Month 1 */}
          {renderMonthTable(firstMonthMatrix)}

          {/* Month 2 (hidden on mobile, visible on desktop) */}
          <div className="hidden md:block">
            {renderMonthTable(secondMonthMatrix)}
          </div>
        </div>
      )}

      {/* Legend & Availability Status Keys */}
      <div className="mt-5 pt-4 border-t border-[#F1E9D8] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#5F6B62]">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-50 border border-emerald-300 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </span>
            <span>{isKn ? 'ಲಭ್ಯವಿದೆ' : 'Available'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-red-100 border border-red-300 flex items-center justify-center text-[10px] font-semibold line-through text-red-700">
              0
            </span>
            <span>{isKn ? 'ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ / ಭರ್ತಿ' : 'Booked / Occupied'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-red-50 border border-dashed border-red-300" />
            <span>{isKn ? 'ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ' : 'Blocked'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded border-2 border-[#B8964A] bg-amber-50/40" />
            <span>{isKn ? 'ಇಂದು (ಚೆಕ್-ಇನ್ ಮುಚ್ಚಿದೆ)' : 'Today (Check-in Closed)'}</span>
          </div>
        </div>

        {/* Selected Dates Summary Banner */}
        {checkIn && checkOut && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF6EC] border border-[#B8964A]/30 text-[#0F2A20] font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#B8964A]" />
            <span>
              {nightsCount} {isKn ? 'ರಾತ್ರಿಗಳು' : (nightsCount === 1 ? 'Night' : 'Nights')}
              {livePriceQuote && ` • ${livePriceQuote}`}
            </span>
          </div>
        )}
      </div>

      {/* Tariff Note Under Calendar */}
      <div className="mt-3.5 p-3 rounded-xl bg-[#FAF6EC] border border-[#B8964A]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#B8964A] flex-shrink-0" />
          <span className="text-[#0F2A20] font-medium">
            <strong className="text-[#0F2A20]">{roomName}</strong>: ₹{pricePerNight.toLocaleString('en-IN')} / {isKn ? 'ರಾತ್ರಿಗೆ' : 'night'}
            {mealsNote && <span className="text-[#5F6B62] font-normal"> ({mealsNote})</span>}
          </span>
        </div>

        {checkIn && !checkOut && (
          <span className="text-amber-800 font-medium text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            {isKn ? 'ದಯವಿಟ್ಟು ನಿರ್ಗಮನ ದಿನಾಂಕವನ್ನು ಆರಿಸಿ' : 'Please select your check-out date'}
          </span>
        )}
      </div>

    </div>
  );
};

