/**
 * Bilingual English & Kannada labels and formatting helpers for the Admin Console.
 */

export const formatINR = (amount) => {
  const num = Math.round(Number(amount) || 0);
  return `₹${num.toLocaleString('en-IN')}`;
};

export const MONTH_SHORT_KN = [
  'ಜನ', 'ಫೆಬ್ರ', 'ಮಾರ್ಚ್', 'ಏಪ್ರಿ', 'ಮೇ', 'ಜೂನ್',
  'ಜುಲೈ', 'ಆಗ', 'ಸೆಪ್ಟೆಂ', 'ಅಕ್ಟೋ', 'ನವೆಂ', 'ಡಿಸೆಂ'
];

export const MONTH_SHORT_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const ADMIN_TEXT = {
  en: {
    portalTag: 'Administration & Staff Portal',
    signInTitle: 'Sign In to Management',
    signInDesc: 'Authorized personnel only. Please sign in with your assigned credentials.',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password',
    signInBtn: 'Sign In',
    authenticating: 'Authenticating...',
    returnPublic: 'Return to Public Website',
    verifyingSession: 'Verifying Session...',
    adminPortal: 'Admin Portal',
    consoleSubtitle: 'Console',
    managementConsole: 'Management Console',
    managementSuffix: 'Management',
    searchPlaceholder: 'Search bookings, guests, rooms...',
    sync: 'Sync',
    syncing: 'Syncing...',
    logout: 'Logout',
    exit: 'Exit',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    viewAll: 'View',
    clear: 'Clear',
    nav: {
      dashboard: 'Dashboard',
      bookings: 'Bookings',
      calendar: 'Calendar',
      rooms: 'Rooms',
      packages: 'Packages',
      experiences: 'Experiences',
      dining: 'Dining Menu',
      gallery: 'Gallery',
      reviews: 'Reviews',
      enquiries: 'Enquiries',
      offers: 'Promo Codes',
      policies: 'Policies',
      settings: 'Site Settings',
      users: 'Staff Accounts',
      logs: 'Activity Log'
    },
    kpi: {
      roomsAvailableToday: 'Rooms Available Today',
      roomsAvailableSub: 'units free tonight',
      allRoomsFreeTonight: 'All rooms free tonight',
      bookedTonight: 'booked',
      blockedTonight: 'blocked',
      upcomingBookings: 'Upcoming Bookings',
      thisMonthCount: 'this month',
      guestsArrivingWeek: 'Guests Arriving This Week',
      checkInsTodaySub: 'Check-ins today',
      bookingsThisWeekSub: 'bookings in 7 days',
      revenueThisMonth: 'Revenue This Month',
      refundsThisMonth: 'Refunds this month',
      noRefundsThisMonth: 'No refunds this month',
      occupancyThisMonth: 'Occupancy (This Month)',
      roomNightsBooked: 'room-nights booked',
      pendingItems: 'Pending Items',
      pendingBreakdown: 'enquiries · reviews · holds',
      refundsAndProblems: 'Refunds & Problems',
      problemsSub: 'flags · refunds due · failed',
      allClear: 'All clear — no urgent issues',
      vsLastMonth: 'vs last month',
      noDataLastMonth: 'No activity last month'
    },
    checkInOut: {
      todaysCheckIns: "Today's Check-Ins",
      todaysCheckOuts: "Today's Check-Outs",
      noCheckIns: 'No check-ins scheduled for today.',
      noCheckOuts: 'No check-outs scheduled for today.',
      night: 'night',
      nights: 'nights',
      balanceDue: 'Balance Due',
      paidInFull: 'Paid in full',
      total: 'Total',
      whatsappAction: 'WhatsApp Pass'
    },
    charts: {
      bookingsTrendTitle: 'Bookings Trend',
      bookingsTrendSubtitle: 'Grouped by check-in month (confirmed, checked-in & checked-out)',
      metricBookings: 'Bookings',
      metricRevenue: 'Revenue',
      metricNights: 'Nights',
      showRevenueLine: 'Revenue Line',
      range6m: 'Last 6 Months',
      range12m: 'Last 12 Months',
      rangeYear: 'This Year',
      noBookingsYet: 'No bookings yet',
      next30Title: 'Next 30 Days Occupancy',
      next30Subtitle: 'Rooms booked per day out of',
      next30Empty: 'No upcoming bookings in the next 30 days',
      lowOcc: 'Low (1–2)',
      medOcc: 'Medium (3–4)',
      highOcc: 'Full (5)',
      roomsBookedLabel: 'rooms booked',
      blockedLabel: 'Host blocked',
      roomTypeTitle: 'Bookings by Room Type',
      roomTypeSubtitle: 'Confirmed, checked-in & checked-out stays',
      totalStays: 'Total Stays',
      bookingsCountWord: 'bookings',
      paidWord: 'Paid'
    },
    queue: {
      title: 'Action Items Queue',
      subtitle: 'Items needing host attention',
      dateChangeFlags: 'Date-Change Flags',
      refundsDue: 'Refunds Due',
      failedPayments: 'Failed Payments',
      newEnquiries: 'New Enquiries',
      pendingReviews: 'Pending Reviews',
      activePromos: 'Total Active Promos',
      activeWord: 'Active',
      clearWord: 'Clear',
      openTab: 'Open'
    },
    statuses: {
      confirmed: 'Confirmed',
      payment_pending: 'Pending Hold',
      pending: 'Pending',
      paid_awaiting_confirmation: 'Paid (Awaiting)',
      checked_in: 'Checked In',
      checked_out: 'Checked Out',
      cancelled: 'Cancelled',
      rejected: 'Rejected',
      expired: 'Expired',
      paid: 'Paid',
      partial: 'Partial',
      refunded: 'Refunded',
      failed: 'Failed'
    },
    bookingsTab: {
      title: 'Guest Bookings',
      attentionNeeded: 'Attention Needed',
      statusLabel: 'Status:',
      payLabel: 'Pay:',
      datesLabel: 'Dates:',
      manualBooking: 'Manual Booking',
      exportCsv: 'Export CSV',
      colGuest: 'Guest',
      colStay: 'Stay',
      colDatesGuests: 'Dates & Guests',
      colAmount: 'Amount',
      colStatus: 'Status',
      colActions: 'Actions',
      emptyFilter: 'No reservations match the selected search or filter criteria.'
    }
  },
  kn: {
    portalTag: 'ನಿರ್ವಹಣೆ ಮತ್ತು ಸಿಬ್ಬಂದಿ ಪೋರ್ಟಲ್',
    signInTitle: 'ನಿರ್ವಹಣಾ ಪೋರ್ಟಲ್‌ಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ',
    signInDesc: 'ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿಗೆ ಮಾತ್ರ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ನಿಗದಿತ ವಿವರಗಳೊಂದಿಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ.',
    emailLabel: 'ಇಮೇಲ್ ವಿಳಾಸ',
    passwordLabel: 'ಪಾಸ್‌ವರ್ಡ್',
    passwordPlaceholder: 'ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ',
    signInBtn: 'ಸೈನ್ ಇನ್ ಮಾಡಿ',
    authenticating: 'ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...',
    returnPublic: 'ಸಾರ್ವಜನಿಕ ವೆಬ್‌ಸೈಟ್‌ಗೆ ಹಿಂತಿರುಗಿ',
    verifyingSession: 'ಸೆಷನ್ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...',
    adminPortal: 'ನಿರ್ವಹಣಾ ಪೋರ್ಟಲ್',
    consoleSubtitle: 'ಕನ್ಸೋಲ್',
    managementConsole: 'ನಿರ್ವಹಣಾ ಕನ್ಸೋಲ್',
    managementSuffix: 'ನಿರ್ವಹಣೆ',
    searchPlaceholder: 'ಬುಕಿಂಗ್, ಅತಿಥಿ, ಕೊಠಡಿ ಹುಡುಕಿ...',
    sync: 'ಸಿಂಕ್',
    syncing: 'ಸಿಂಕ್ ಆಗುತ್ತಿದೆ...',
    logout: 'ಲಾಗ್ ಔಟ್',
    exit: 'ನಿರ್ಗಮಿಸಿ',
    cancel: 'ರದ್ದುಮಾಡಿ',
    confirm: 'ದೃಢೀಕರಿಸಿ',
    close: 'ಮುಚ್ಚಿ',
    save: 'ಉಳಿಸಿ',
    edit: 'ತಿದ್ದಿ',
    delete: 'ಅಳಿಸಿ',
    viewAll: 'ನೋಡಿ',
    clear: 'ತೆರವುಗೊಳಿಸಿ',
    nav: {
      dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
      bookings: 'ಬುಕಿಂಗ್‌ಗಳು',
      calendar: 'ಕ್ಯಾಲೆಂಡರ್',
      rooms: 'ಕೊಠಡಿಗಳು',
      packages: 'ಪ್ಯಾಕೇಜ್‌ಗಳು',
      experiences: 'ಅನುಭವಗಳು',
      dining: 'ಊಟದ ಮೆನು',
      gallery: 'ಗ್ಯಾಲರಿ',
      reviews: 'ವಿಮರ್ಶೆಗಳು',
      enquiries: 'ವಿಚಾರಣೆಗಳು',
      offers: 'ಪ್ರೋಮೋ ಕೋಡ್‌ಗಳು',
      policies: 'ನೀತಿಗಳು',
      settings: 'ಸೈಟ್ ಸೆಟ್ಟಿಂಗ್ಸ್',
      users: 'ಸಿಬ್ಬಂದಿ ಖಾತೆಗಳು',
      logs: 'ಚಟುವಟಿಕೆ ಲಾಗ್'
    },
    kpi: {
      roomsAvailableToday: 'ಇಂದು ಲಭ್ಯವಿರುವ ಕೊಠಡಿಗಳು',
      roomsAvailableSub: 'ಇಂದು ರಾತ್ರಿ ಖಾಲಿ ಕೊಠಡಿಗಳು',
      allRoomsFreeTonight: 'ಇಂದು ರಾತ್ರಿ ಎಲ್ಲಾ ಕೊಠಡಿಗಳು ಖಾಲಿ ಇವೆ',
      bookedTonight: 'ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ',
      blockedTonight: 'ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ',
      upcomingBookings: 'ಮುಂಬರುವ ಬುಕಿಂಗ್‌ಗಳು',
      thisMonthCount: 'ಈ ತಿಂಗಳು',
      guestsArrivingWeek: 'ಈ ವಾರ ಬರುವ ಅತಿಥಿಗಳು',
      checkInsTodaySub: 'ಇಂದಿನ ಚೆಕ್-ಇನ್‌ಗಳು',
      bookingsThisWeekSub: '7 ದಿನಗಳಲ್ಲಿ ಬುಕಿಂಗ್‌ಗಳು',
      revenueThisMonth: 'ಈ ತಿಂಗಳ ಆದಾಯ',
      refundsThisMonth: 'ಈ ತಿಂಗಳ ಮರುಪಾವತಿ',
      noRefundsThisMonth: 'ಈ ತಿಂಗಳು ಮರುಪಾವತಿಗಳಿಲ್ಲ',
      occupancyThisMonth: 'ಈ ತಿಂಗಳ ಕೊಠಡಿ ಭರ್ತಿ',
      roomNightsBooked: 'ಕೊಠಡಿ-ರಾತ್ರಿಗಳು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ',
      pendingItems: 'ಬಾಕಿ ಇರುವ ಅಂಶಗಳು',
      pendingBreakdown: 'ವಿಚಾರಣೆ · ವಿಮರ್ಶೆ · ಹೋಲ್ಡ್',
      refundsAndProblems: 'ಮರುಪಾವತಿ ಮತ್ತು ಸಮಸ್ಯೆಗಳು',
      problemsSub: 'ದಿನಾಂಕ ಬದಲಾವಣೆ · ಬಾಕಿ ಮರುಪಾವತಿ · ವಿಫಲ',
      allClear: 'ಯಾವುದೇ ತುರ್ತು ಸಮಸ್ಯೆಗಳಿಲ್ಲ',
      vsLastMonth: 'ಕಳೆದ ತಿಂಗಳಿಗೆ ಹೋಲಿಸಿದರೆ',
      noDataLastMonth: 'ಕಳೆದ ತಿಂಗಳು ಚಟುವಟಿಕೆ ಇಲ್ಲ'
    },
    checkInOut: {
      todaysCheckIns: 'ಇಂದಿನ ಚೆಕ್-ಇನ್‌ಗಳು',
      todaysCheckOuts: 'ಇಂದಿನ ಚೆಕ್-ಔಟ್‌ಗಳು',
      noCheckIns: 'ಇಂದಿಗೆ ಯಾವುದೇ ಚೆಕ್-ಇನ್‌ಗಳಿಲ್ಲ.',
      noCheckOuts: 'ಇಂದಿಗೆ ಯಾವುದೇ ಚೆಕ್-ಔಟ್‌ಗಳಿಲ್ಲ.',
      night: 'ರಾತ್ರಿ',
      nights: 'ರಾತ್ರಿಗಳು',
      balanceDue: 'ಬಾಕಿ ಮೊತ್ತ',
      paidInFull: 'ಪೂರ್ಣ ಪಾವತಿಯಾಗಿದೆ',
      total: 'ಒಟ್ಟು',
      whatsappAction: 'ವಾಟ್ಸಾಪ್ ಪಾಸ್'
    },
    charts: {
      bookingsTrendTitle: 'ಬುಕಿಂಗ್‌ಗಳ ಪ್ರವೃತ್ತಿ',
      bookingsTrendSubtitle: 'ಚೆಕ್-ಇನ್ ತಿಂಗಳ ಪ್ರಕಾರ (ದೃಢೀಕೃತ, ಚೆಕ್-ಇನ್ ಮತ್ತು ಚೆಕ್-ಔಟ್)',
      metricBookings: 'ಬುಕಿಂಗ್‌ಗಳು',
      metricRevenue: 'ಆದಾಯ',
      metricNights: 'ರಾತ್ರಿಗಳು',
      showRevenueLine: 'ಆದಾಯ ರೇಖೆ',
      range6m: 'ಕಳೆದ 6 ತಿಂಗಳು',
      range12m: 'ಕಳೆದ 12 ತಿಂಗಳು',
      rangeYear: 'ಈ ವರ್ಷ',
      noBookingsYet: 'ಇನ್ನೂ ಬುಕಿಂಗ್‌ಗಳಿಲ್ಲ',
      next30Title: 'ಮುಂದಿನ 30 ದಿನಗಳ ಕೊಠಡಿ ಭರ್ತಿ',
      next30Subtitle: 'ಪ್ರತಿ ದಿನ ಕಾಯ್ದಿರಿಸಿದ ಕೊಠಡಿಗಳು (ಒಟ್ಟು:',
      next30Empty: 'ಮುಂದಿನ 30 ದಿನಗಳಲ್ಲಿ ಯಾವುದೇ ಬುಕಿಂಗ್‌ಗಳಿಲ್ಲ',
      lowOcc: 'ಕಡಿಮೆ (1–2)',
      medOcc: 'ಮಧ್ಯಮ (3–4)',
      highOcc: 'ಪೂರ್ಣ (5)',
      roomsBookedLabel: 'ಕೊಠಡಿಗಳು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ',
      blockedLabel: 'ನಿರ್ವಹಣೆಗಾಗಿ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ',
      roomTypeTitle: 'ಕೊಠಡಿ ವಿಧದ ಪ್ರಕಾರ ಬುಕಿಂಗ್‌ಗಳು',
      roomTypeSubtitle: 'ದೃಢೀಕೃತ, ಚೆಕ್-ಇನ್ ಮತ್ತು ಚೆಕ್-ಔಟ್ ವಾಸ್ತವ್ಯಗಳು',
      totalStays: 'ಒಟ್ಟು ವಾಸ್ತವ್ಯ',
      bookingsCountWord: 'ಬುಕಿಂಗ್‌ಗಳು',
      paidWord: 'ಪಾವತಿಸಲಾಗಿದೆ'
    },
    queue: {
      title: 'ಗಮನಹರಿಸಬೇಕಾದ ಅಂಶಗಳು',
      subtitle: 'ಆತಿಥೇಯರ ಗಮನ ಅಗತ್ಯವಿರುವ ವಿಷಯಗಳು',
      dateChangeFlags: 'ದಿನಾಂಕ ಬದಲಾವಣೆ ಸೂಚನೆಗಳು',
      refundsDue: 'ಬಾಕಿ ಮರುಪಾವತಿಗಳು',
      failedPayments: 'ವಿಫಲ ಪಾವತಿಗಳು',
      newEnquiries: 'ಹೊಸ ವಿಚಾರಣೆಗಳು',
      pendingReviews: 'ಬಾಕಿ ವಿಮರ್ಶೆಗಳು',
      activePromos: 'ಸಕ್ರಿಯ ಪ್ರೋಮೋ ಕೋಡ್‌ಗಳು',
      activeWord: 'ಸಕ್ರಿಯ',
      clearWord: 'ಖಾಲಿ',
      openTab: 'ತೆರೆಯಿರಿ'
    },
    statuses: {
      confirmed: 'ದೃಢೀಕರಿಸಲಾಗಿದೆ',
      payment_pending: 'ಪಾವತಿ ಬಾಕಿ',
      pending: 'ಬಾಕಿ',
      paid_awaiting_confirmation: 'ಪಾವತಿಸಲಾಗಿದೆ (ನಿರೀಕ್ಷಿತ)',
      checked_in: 'ಚೆಕ್ ಇನ್',
      checked_out: 'ಚೆಕ್ ಔಟ್',
      cancelled: 'ರದ್ದುಗೊಂಡಿದೆ',
      rejected: 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ',
      expired: 'ಅವಧಿ ಮುಗಿದಿದೆ',
      paid: 'ಪಾವತಿಸಲಾಗಿದೆ',
      partial: 'ಭಾಗಶಃ',
      refunded: 'ಮರುಪಾವತಿಸಲಾಗಿದೆ',
      failed: 'ವಿಫಲವಾಗಿದೆ'
    },
    bookingsTab: {
      title: 'ಅತಿಥಿ ಬುಕಿಂಗ್‌ಗಳು',
      attentionNeeded: 'ಗಮನ ಅಗತ್ಯವಿದೆ',
      statusLabel: 'ಸ್ಥಿತಿ:',
      payLabel: 'ಪಾವತಿ:',
      datesLabel: 'ದಿನಾಂಕ:',
      manualBooking: 'ಹೊಸ ಬುಕಿಂಗ್',
      exportCsv: 'CSV ರಫ್ತು',
      colGuest: 'ಅತಿಥಿ',
      colStay: 'ಕೊಠಡಿ',
      colDatesGuests: 'ದಿನಾಂಕ ಮತ್ತು ಅತಿಥಿಗಳು',
      colAmount: 'ಮೊತ್ತ',
      colStatus: 'ಸ್ಥಿತಿ',
      colActions: 'ಕ್ರಿಯೆಗಳು',
      emptyFilter: 'ಆಯ್ಕೆಮಾಡಿದ ಹುಡುಕಾಟ ಅಥವಾ ಫಿಲ್ಟರ್‌ಗೆ ಯಾವುದೇ ಬುಕಿಂಗ್‌ಗಳು ಕಂಡುಬಂದಿಲ್ಲ.'
    }
  }
};

export const getAdminText = (language = 'en') =>
  language === 'kn' ? ADMIN_TEXT.kn : ADMIN_TEXT.en;

export const getLocalizedMonthShort = (monthIndex, fallbackShort, language = 'en') => {
  if (typeof monthIndex === 'number' && monthIndex >= 0 && monthIndex < 12) {
    return language === 'kn' ? MONTH_SHORT_KN[monthIndex] : MONTH_SHORT_EN[monthIndex];
  }
  return fallbackShort || '';
};

export const getLocalizedStatusLabel = (status, language = 'en') => {
  const dict = getAdminText(language).statuses;
  const key = String(status || 'confirmed').toLowerCase();
  return dict[key] || key.replace(/_/g, ' ');
};

