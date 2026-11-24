import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { InclusionIcon } from '../../components/Inclusions/InclusionIcon';
import { ImageUploadOrDrive } from '../../components/Admin/ImageUploadOrDrive';
import { HomeBannerSettings } from '../../components/Admin/HomeBannerSettings';
import {
  BookingsTrendChart,
  Next30DaysOccupancyChart,
  BookingsByRoomTypeChart
} from '../../components/Admin/AdminDashboardCharts';
import {
  formatINR,
  getAdminText,
  getLocalizedStatusLabel
} from './adminI18n';
import './adminTheme.css';
import { normalizeImageUrl } from '../../utils/imageUrl';
import {
  getRoomBalcony,
  getRoomUnitsCount,
  getStandardRoomPrice,
  getLowestRoomPrice,
  getPackagePriceMeta
} from '../../utils/homestayFormatting';
import {
  buildWhatsAppMessage,
  buildWhatsAppShareUrl,
  formatDisplayDate,
  getNightsCount,
  getStayDisplayName,
  cleanInternationalPhone,
  isPlaceholderPhone,
  resolveHostPhone,
  resolveHostEmail,
  DEFAULT_INSTAGRAM_URL,
  isPlaceholderInstagramUrl,
  resolveInstagramUrl,
  DEFAULT_FACEBOOK_URL,
  isPlaceholderFacebookUrl,
  resolveFacebookUrl,
  DEFAULT_YOUTUBE_URL,
  isPlaceholderYoutubeUrl,
  resolveYoutubeUrl
} from '../../utils/whatsappMessages';
import {
  DEFAULT_CANCELLATION_TIERS,
  DEFAULT_SAFETY_FEATURES,
  SAFETY_FEATURE_DEFS,
  DEFAULT_DATE_CHANGE_RULE,
  DEFAULT_EARLY_DEPARTURE_RULE,
  DEFAULT_GATEWAY_FEE_NOTE,
  normalizeCancellationTiers,
  calculateTierRefund,
  describeTierWindow,
  resolvePolicyText,
  formatPolicyLastUpdated,
  getPublicHostContact
} from '../../utils/refundPolicy';
import { DEFAULT_POLICY_SECTIONS } from '../../data/policyDefaults';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  CalendarDays, 
  Home, 
  UtensilsCrossed, 
  Package, 
  Compass, 
  Image, 
  Star, 
  Users, 
  Percent, 
  MessageSquare, 
  ShieldAlert, 
  ShieldCheck,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  ArrowLeft,
  ArrowRight,
  Menu,
  X,
  Search,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  Sparkles,
  Download,
  Upload,
  Lock,
  Phone,
  Mail,
  MessageCircle,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Clock,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Flag,
  Calendar,
  CalendarX,
  ExternalLink,
  RotateCcw,
  DollarSign,
  MoreHorizontal,
  Share2,
  Instagram,
  Facebook,
  Youtube
} from 'lucide-react';

const formatDrivingDistancesForTextarea = (list) => {
  if (!Array.isArray(list) || list.length === 0) {
    return 'Kushalnagar: 6 km | ~12 mins | Via BM Road / SH88\nMadikeri: 28 km | ~40 mins | Via NH 275\nMysuru: 95 km | ~2 hrs 15 mins | Via Mysore-Madikeri Rd / NH 275';
  }
  return list.map(d => {
    let place = d.place || d.city || '';
    const dist = d.distance || '';
    if (!place && dist) {
      if (dist.includes('6')) place = 'Kushalnagar';
      else if (dist.includes('28')) place = 'Madikeri';
      else if (dist.includes('95')) place = 'Mysuru';
      else place = 'Nearby';
    }
    const parts = [place ? `${place}: ${dist}` : dist];
    if (d.time) parts.push(d.time);
    if (d.route) parts.push(d.route);
    return parts.join(' | ');
  }).join('\n');
};

export const AdminLayout = () => {
  const { 
    currentUser,
    isAuthenticated,
    authChecking,
    login,
    logout,
    changePassword,
    toast,
    showToast,
    rooms, 
    bookings, 
    blockedDates, 
    toggleBlockDate, 
    updateBookingStatus, 
    createManualBooking,
    recordPayment,
    cancelBookingWithReason,
    requestDateChange,
    clearDateChangeFlag,
    changeBookingDates,
    cancelAndRefundBooking,
    markBalanceReceived,
    deleteBooking,
    updateRoom,
    addRoom,
    deleteRoom,
    packages,
    addPackage,
    updatePackage,
    deletePackage,
    experiences,
    addExperience,
    updateExperience,
    deleteExperience,
    inclusions,
    addInclusionItem,
    updateInclusionItem,
    deleteInclusionItem,
    reorderInclusionItems,
    toggleInclusionItem,
    diningMenu,
    diningContent,
    updateDiningContent,
    addMenuCategory,
    updateMenuCategory,
    deleteMenuCategory,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    gallery,
    addGalleryImage,
    deleteGalleryImage,
    reviews,
    adminReviews,
    approveReview,
    hideReview,
    addReview,
    deleteReview,
    enquiries,
    updateEnquiryStatus,
    deleteEnquiry,
    offers,
    addOffer,
    updateOffer,
    deleteOffer,
    users,
    addUser,
    updateUser,
    deleteUser,
    activityLogs,
    siteSettings,
    resolvedFullHomePrice,
    saveSiteSettings,
    policySections,
    safetyContacts,
    policiesLastUpdated,
    addPolicySection,
    updatePolicySection,
    deletePolicySection,
    reorderPolicySections,
    togglePolicySection,
    addSafetyContact,
    updateSafetyContact,
    deleteSafetyContact,
    toggleSafetyContact,
    refreshAdminData,
    refreshAdminBookings
  } = useAdmin();

  const { language, toggleLanguage } = useLanguage();
  const isKn = language === 'kn';
  const ad = getAdminText(language);
  const navigate = useNavigate();
  const { tab: urlTab } = useParams();
  const [searchParams] = useSearchParams();
  const requestedTab = urlTab || searchParams.get('tab') || 'dashboard';

  const [activeTab, setActiveTab] = useState(requestedTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  // Strict URL guard against unauthorized staff access (Site Settings is readable read-only for staff)
  useEffect(() => {
    if (!authChecking && currentUser) {
      if (!isAdmin && ['users', 'logs'].includes(requestedTab)) {
        setActiveTab('dashboard');
        navigate('/admin/dashboard', { replace: true });
        showToast('Access denied: Staff accounts cannot access Staff Accounts or Activity Logs.', 'error');
      } else {
        setActiveTab(requestedTab);
      }
    } else if (!authChecking && !currentUser) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab, isAdmin, currentUser, authChecking, navigate]);

  // Login form state (empty, NO demo credentials)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // First login change password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const openConfirm = (title, message, onConfirm) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  // Modals state
  const [modalType, setModalType] = useState(null); // 'manualBooking' | 'payment' | 'cancel' | 'addRoom' | 'addPackage' | 'addExperience' | 'addMenuItem' | 'addCategory' | 'addReview' | 'addOffer' | 'addUser'
  const [modalData, setModalData] = useState({});

  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 10, 1)); // Nov 2026 default
  const [selectedCalendarRoom, setSelectedCalendarRoom] = useState('all');

  // Bookings Filter
  const [bookingFilterStatus, setBookingFilterStatus] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [bookingFilterDateFrom, setBookingFilterDateFrom] = useState('');
  const [bookingFilterDateTo, setBookingFilterDateTo] = useState('');
  const [bookingAttentionOnly, setBookingAttentionOnly] = useState(false);

  // Reviews Moderation Filter
  const [reviewStatusFilter, setReviewStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'hidden'
  const [moderatingReviewId, setModeratingReviewId] = useState(null);

  // Gallery Upload state
  const [galleryFile, setGalleryFile] = useState(null);
  const [galleryUrl, setGalleryUrl] = useState('');
  const [galleryCategory, setGalleryCategory] = useState('estate');
  const [galleryAlt, setGalleryAlt] = useState('');
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  // Settings form local state
  const isSettingsDirtyRef = useRef(false);
  const [roomTariffDrafts, setRoomTariffDrafts] = useState({});
  const [settingsForm, setSettingsForm] = useState({
    propertyName: siteSettings?.propertyName || siteSettings?.name || 'Marichin Homestay',
    tagline: siteSettings?.tagline || '',
    registrationNumber: siteSettings?.registrationNumber || '',
    phone: getPublicHostContact(siteSettings).phone,
    email: getPublicHostContact(siteSettings).email,
    whatsappNumber: getPublicHostContact(siteSettings).whatsapp,
    instagramUrl: resolveInstagramUrl(siteSettings?.instagramUrl),
    facebookUrl: resolveFacebookUrl(siteSettings?.facebookUrl),
    youtubeUrl: resolveYoutubeUrl(siteSettings?.youtubeUrl),
    address: siteSettings?.address || 'Chikkabettageri Village, Gudde Hosur Post, Kushalnagar, Kodagu District, Karnataka 571234',
    googleMapsShareUrl: siteSettings?.googleMapsShareUrl || '',
    upiId: siteSettings?.upiId || 'marichin@okaxis',
    pricePerNight: siteSettings?.pricePerNight ?? 8000,
    extraGuestCharge: siteSettings?.extraGuestCharge ?? 0,
    mealsIncluded: siteSettings?.mealsIncluded || 'Breakfast',
    inclusionsNote: siteSettings?.inclusionsNote || 'Includes morning breakfast, Wi-Fi, parking, campfire, indoor and outdoor games and estate walk',
    advanceOptions: Array.isArray(siteSettings?.advanceOptions) ? siteSettings.advanceOptions.join(', ') : '20, 50, 100',
    taxPercent: siteSettings?.taxPercent ?? 0,
    checkInTime: siteSettings?.checkInTime || '12:00 PM',
    checkOutTime: siteSettings?.checkOutTime || '11:00 AM',
    minNights: siteSettings?.minNights ?? 1,
    maxAdvanceDays: siteSettings?.maxAdvanceDays ?? 365,
    sameDayCutoffTime: siteSettings?.sameDayCutoffTime || '18:00',
    holdMinutes: siteSettings?.holdMinutes ?? 15,
    autoConfirmAfterPayment: siteSettings?.autoConfirmAfterPayment ?? false,
    fullHomePricePerNight: siteSettings?.fullHomePricePerNight ?? 35000,
    fullHomeEnabled: siteSettings?.fullHomeEnabled ?? true,
    fullHomeMinNights: siteSettings?.fullHomeMinNights ?? 1,
    fullHomeMealsNote: siteSettings?.fullHomeMealsNote || 'Morning breakfast included',
    roomsPageHeading: siteSettings?.roomsPageHeading || 'Our Rooms',
    roomsPageDescription: siteSettings?.roomsPageDescription || 'Three room types, each with morning breakfast included. Choose the room that fits your group.',
    aboutStoryText: siteSettings?.aboutStoryText || 'Welcome to Marichin Homestay, situated amidst lush coffee plantations in Chikkabettageri Village near Kushalnagar, Kodagu. Enjoy peaceful nature, morning estate walks, and cozy evening campfires.',
    drivingDistances: formatDrivingDistancesForTextarea(siteSettings?.drivingDistances)
  });

  // Keep Site Settings form synchronized when siteSettings or Entire Homestay package updates from backend
  useEffect(() => {
    if (!siteSettings || isSettingsDirtyRef.current) return;
    setSettingsForm((prev) => ({
      ...prev,
      propertyName: siteSettings.propertyName || siteSettings.name || prev.propertyName,
      tagline: siteSettings.tagline ?? prev.tagline,
      registrationNumber: siteSettings.registrationNumber ?? prev.registrationNumber,
      phone: getPublicHostContact(siteSettings).phone,
      email: getPublicHostContact(siteSettings).email,
      whatsappNumber: getPublicHostContact(siteSettings).whatsapp,
      instagramUrl: resolveInstagramUrl(siteSettings.instagramUrl || prev.instagramUrl),
      facebookUrl: resolveFacebookUrl(siteSettings.facebookUrl || prev.facebookUrl),
      youtubeUrl: resolveYoutubeUrl(siteSettings.youtubeUrl || prev.youtubeUrl),
      address: siteSettings.address ?? prev.address,
      googleMapsShareUrl: siteSettings.googleMapsShareUrl ?? prev.googleMapsShareUrl,
      upiId: siteSettings.upiId ?? prev.upiId,
      taxPercent: siteSettings.taxPercent ?? prev.taxPercent,
      advanceOptions: Array.isArray(siteSettings.advanceOptions) ? siteSettings.advanceOptions.join(', ') : prev.advanceOptions,
      minNights: siteSettings.minNights ?? prev.minNights,
      maxAdvanceDays: siteSettings.maxAdvanceDays ?? prev.maxAdvanceDays,
      sameDayCutoffTime: siteSettings.sameDayCutoffTime ?? prev.sameDayCutoffTime,
      holdMinutes: siteSettings.holdMinutes ?? prev.holdMinutes,
      autoConfirmAfterPayment: siteSettings.autoConfirmAfterPayment ?? prev.autoConfirmAfterPayment,
      fullHomeEnabled: siteSettings.fullHomeEnabled ?? prev.fullHomeEnabled,
      fullHomeMinNights: siteSettings.fullHomeMinNights ?? prev.fullHomeMinNights,
      fullHomeMealsNote: siteSettings.fullHomeMealsNote ?? prev.fullHomeMealsNote,
      fullHomePricePerNight: resolvedFullHomePrice ?? siteSettings.fullHomePricePerNight ?? prev.fullHomePricePerNight,
      checkInTime: siteSettings.checkInTime ?? prev.checkInTime,
      checkOutTime: siteSettings.checkOutTime ?? prev.checkOutTime,
      inclusionsNote: siteSettings.inclusionsNote ?? prev.inclusionsNote,
      roomsPageHeading: siteSettings.roomsPageHeading ?? prev.roomsPageHeading,
      roomsPageDescription: siteSettings.roomsPageDescription ?? prev.roomsPageDescription,
      aboutStoryText: siteSettings.aboutStoryText ?? prev.aboutStoryText,
      drivingDistances: siteSettings.drivingDistances
        ? formatDrivingDistancesForTextarea(siteSettings.drivingDistances)
        : prev.drivingDistances
    }));
  }, [siteSettings, resolvedFullHomePrice]);

  // Dashboard Stats & Realtime Sync state
  const [dashboardStats, setDashboardStats] = useState(null);
  const [chartRange, setChartRange] = useState('6m');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        refreshAdminData({ force: true, bypassBackoff: true }),
        api.admin.getDashboard({ range: chartRange }).then((res) => setDashboardStats(res?.data)).catch(() => null)
      ]);
      setLastRefreshed(new Date());
      showToast('Admin data synced successfully', 'success');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Sync on tab change or chart range change
  useEffect(() => {
    if (isAuthenticated) {
      api.admin.getDashboard({ range: chartRange })
        .then((res) => setDashboardStats(res?.data))
        .catch(() => null);
      if (['bookings', 'dashboard', 'calendar', 'reviews', 'enquiries', 'offers'].includes(activeTab)) {
        refreshAdminData();
      }
    }
  }, [isAuthenticated, activeTab, chartRange, refreshAdminData]);

  // Periodic background polling every 30s so new bookings appear in real time without heavy requests
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      if (document.hidden) return;
      refreshAdminBookings();
      api.admin.getDashboard({ range: chartRange })
        .then((res) => setDashboardStats(res?.data))
        .catch(() => null);
      setLastRefreshed(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, chartRange, refreshAdminBookings]);

  // WhatsApp Pass Message Generator
  const generateWhatsAppPassText = (b) => {
    return buildWhatsAppMessage('booking_confirmed', b, siteSettings, {
      language: 'en',
      baseUrl: window.location.origin
    });
  };

  const handleOpenWhatsAppModal = (b) => {
    const rawPhone = (b.phone || b.primaryGuest?.phone || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 10 ? '91' + rawPhone : rawPhone;
    setModalData({
      booking: b,
      guestName: b.guestName || b.primaryGuest?.name || 'Guest',
      bookingCode: b.bookingCode || b.id,
      phone: cleanPhone,
      text: generateWhatsAppPassText(b),
      copied: false
    });
    setModalType('whatsappPassModal');
  };

  const handleOpenCantHostModal = (b) => {
    const rawPhone = (b.phone || b.primaryGuest?.phone || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 10 ? '91' + rawPhone : rawPhone;
    setModalData({
      booking: b,
      bookingId: b._id || b.id,
      bookingCode: b.bookingCode || b.id,
      guestName: b.guestName || b.primaryGuest?.name || 'Guest',
      phone: cleanPhone,
      reasonType: 'Maintenance',
      customReason: '',
      alternateRanges: [
        { from: '', to: '' }
      ],
      lang: language || 'en',
      copied: false,
      availableDays: [],
      loadingDates: true
    });
    setModalType('cantHostModal');

    api.admin.getBookingAvailableDates(b._id || b.id)
      .then((res) => {
        setModalData((prev) => ({
          ...prev,
          availableDays: res.data?.days || [],
          loadingDates: false
        }));
      })
      .catch(() => {
        setModalData((prev) => ({ ...prev, loadingDates: false }));
      });
  };

  const handleOpenChangeDatesModal = (b) => {
    const rawPhone = (b.phone || b.primaryGuest?.phone || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 10 ? '91' + rawPhone : rawPhone;
    const curIn = typeof b.checkIn === 'string' ? b.checkIn.split('T')[0] : '';
    const curOut = typeof b.checkOut === 'string' ? b.checkOut.split('T')[0] : '';
    const curNights = getNightsCount(b);
    setModalData({
      booking: b,
      bookingId: b._id || b.id,
      bookingCode: b.bookingCode || b.id,
      guestName: b.guestName || b.primaryGuest?.name || 'Guest',
      phone: cleanPhone,
      currentCheckIn: curIn,
      currentCheckOut: curOut,
      currentNights: curNights,
      newCheckIn: curIn,
      newCheckOut: curOut,
      newNights: curNights,
      processRefund: false,
      refundAmount: 0,
      oldTotal: b.totalAmount || b.pricing?.total || 0,
      advancePaid: b.advancePaid || 0,
      newTotal: b.totalAmount || b.pricing?.total || 0,
      refundDue: 0,
      newBalanceDue: b.balanceDue || 0,
      lang: language || 'en',
      copied: false,
      availableDays: [],
      loadingDates: true
    });
    setModalType('changeDatesModal');

    api.admin.getBookingAvailableDates(b._id || b.id)
      .then((res) => {
        setModalData((prev) => ({
          ...prev,
          availableDays: res.data?.days || [],
          loadingDates: false
        }));
      })
      .catch(() => {
        setModalData((prev) => ({ ...prev, loadingDates: false }));
      });
  };

  const handleOpenCancelRefundModal = (b) => {
    const rawPhone = (b.phone || b.primaryGuest?.phone || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 10 ? '91' + rawPhone : rawPhone;
    const paid = b.advancePaid || (b.amountPaidPaise ? Math.round(b.amountPaidPaise / 100) : 0);
    const tierCalc = calculateTierRefund({
      settings: siteSettings,
      checkInDate: b.checkIn,
      paidAmount: paid,
      hostCancelled: false,
      isNoShow: false
    });
    setModalData({
      booking: b,
      bookingId: b._id || b.id,
      bookingCode: b.bookingCode || b.id,
      guestName: b.guestName || b.primaryGuest?.name || 'Guest',
      phone: cleanPhone,
      paidAmount: paid,
      hasRazorpay: Boolean(b.razorpayPaymentId),
      hostCancelled: false,
      isNoShow: false,
      refundType: paid > 0 ? 'tier' : 'none',
      refundAmount: paid > 0 ? tierCalc.refundAmount : 0,
      reason: 'Guest requested cancellation',
      lang: language || 'en',
      copied: false
    });
    setModalType('cancelRefundModal');
  };

  const handleOpenMarkBalanceModal = (b) => {
    setModalData({
      booking: b,
      bookingId: b._id || b.id,
      bookingCode: b.bookingCode || b.id,
      guestName: b.guestName || b.primaryGuest?.name || 'Guest',
      totalAmount: b.totalAmount || b.pricing?.total || 0,
      advancePaid: b.advancePaid || 0,
      balanceDue: b.balanceDue || 0,
      amount: b.balanceDue || 0,
      paymentMethod: 'Cash',
      transactionId: '',
      notes: ''
    });
    setModalType('markBalanceModal');
  };

  useEffect(() => {
    if (siteSettings && !isSettingsDirtyRef.current) {
      setSettingsForm({
        propertyName: siteSettings.propertyName || siteSettings.name || 'Marichin Homestay',
        tagline: siteSettings.tagline || '',
        registrationNumber: siteSettings.registrationNumber || '',
        phone: getPublicHostContact(siteSettings).phone,
        email: getPublicHostContact(siteSettings).email,
        whatsappNumber: getPublicHostContact(siteSettings).whatsapp,
        instagramUrl: resolveInstagramUrl(siteSettings.instagramUrl),
        facebookUrl: resolveFacebookUrl(siteSettings.facebookUrl),
        youtubeUrl: resolveYoutubeUrl(siteSettings.youtubeUrl),
        address: siteSettings.address || 'Chikkabettageri Village, Gudde Hosur Post, Kushalnagar, Kodagu District, Karnataka 571234',
        googleMapsShareUrl: siteSettings.googleMapsShareUrl || '',
        upiId: siteSettings.upiId || 'marichin@okaxis',
        pricePerNight: siteSettings.pricePerNight ?? 8000,
        extraGuestCharge: siteSettings.extraGuestCharge ?? 0,
        mealsIncluded: siteSettings.mealsIncluded || 'Breakfast',
        inclusionsNote: siteSettings.inclusionsNote || 'Includes the entire homestay, breakfast, Wi-Fi, parking, campfire, indoor and outdoor games and estate walk',
        advanceOptions: Array.isArray(siteSettings.advanceOptions) ? siteSettings.advanceOptions.join(', ') : '20, 50, 100',
        taxPercent: siteSettings.taxPercent ?? 0,
        checkInTime: siteSettings.checkInTime || '12:00 PM',
        checkOutTime: siteSettings.checkOutTime || '11:00 AM',
        minNights: siteSettings.minNights ?? 1,
        maxAdvanceDays: siteSettings.maxAdvanceDays ?? 365,
        sameDayCutoffTime: siteSettings.sameDayCutoffTime || '18:00',
        holdMinutes: siteSettings.holdMinutes ?? 15,
        autoConfirmAfterPayment: siteSettings.autoConfirmAfterPayment ?? false,
        fullHomePricePerNight: siteSettings.fullHomePricePerNight ?? 35000,
        fullHomeEnabled: siteSettings.fullHomeEnabled ?? true,
        fullHomeMinNights: siteSettings.fullHomeMinNights ?? 1,
        fullHomeMealsNote: siteSettings.fullHomeMealsNote || 'Morning breakfast included',
        roomsPageHeading: siteSettings.roomsPageHeading || 'Our Rooms',
        roomsPageDescription: siteSettings.roomsPageDescription || 'Three room types, each with morning breakfast included. Choose the room that fits your group.',
        aboutStoryText: siteSettings.aboutStoryText || 'Welcome to Marichin Homestay, situated amidst lush coffee plantations in Chikkabettageri Village near Kushalnagar, Kodagu. Enjoy peaceful nature, morning estate walks, and cozy evening campfires.',
        drivingDistances: formatDrivingDistancesForTextarea(siteSettings.drivingDistances)
      });
    }
  }, [siteSettings]);

  // Packages & Inclusions management states
  const [packagesSubTab, setPackagesSubTab] = useState('packages'); // 'packages' | 'inclusions'
  const [inclusionFilter, setInclusionFilter] = useState('all'); // 'all' | 'include' | 'exclude'

  // Policies & Safety management states
  const [policySubTab, setPolicySubTab] = useState('sections'); // 'sections' | 'refund' | 'safetyFeatures' | 'safetyContacts'
  const [policyPageFilter, setPolicyPageFilter] = useState('policies'); // 'policies' | 'refund' | 'privacy'
  const isPolicyRefundDirtyRef = useRef(false);
  const [policySettingsForm, setPolicySettingsForm] = useState(() => ({
    cancellationTiers: normalizeCancellationTiers(siteSettings?.cancellationTiers),
    noShowRefundPercent: siteSettings?.noShowRefundPercent ?? 0,
    hostCancelsRefundPercent: siteSettings?.hostCancelsRefundPercent ?? 100,
    refundTimelineText: siteSettings?.refundTimelineText || '5 to 7 working days',
    dateChangeRule: {
      en: siteSettings?.dateChangeRule?.en ?? DEFAULT_DATE_CHANGE_RULE.en,
      kn: siteSettings?.dateChangeRule?.kn ?? DEFAULT_DATE_CHANGE_RULE.kn
    },
    earlyDepartureRule: {
      en: siteSettings?.earlyDepartureRule?.en ?? DEFAULT_EARLY_DEPARTURE_RULE.en,
      kn: siteSettings?.earlyDepartureRule?.kn ?? DEFAULT_EARLY_DEPARTURE_RULE.kn
    },
    gatewayFeeNote: {
      en: siteSettings?.gatewayFeeNote?.en ?? DEFAULT_GATEWAY_FEE_NOTE.en,
      kn: siteSettings?.gatewayFeeNote?.kn ?? DEFAULT_GATEWAY_FEE_NOTE.kn
    },
    safetyFeatures: { ...DEFAULT_SAFETY_FEATURES, ...(siteSettings?.safetyFeatures || {}) }
  }));
  const [markPolicyRefundVerifiedOnSave, setMarkPolicyRefundVerifiedOnSave] = useState(false);

  useEffect(() => {
    if (!siteSettings || isPolicyRefundDirtyRef.current) return;
    setPolicySettingsForm({
      cancellationTiers: normalizeCancellationTiers(siteSettings.cancellationTiers),
      noShowRefundPercent: siteSettings.noShowRefundPercent ?? 0,
      hostCancelsRefundPercent: siteSettings.hostCancelsRefundPercent ?? 100,
      refundTimelineText: siteSettings.refundTimelineText || '5 to 7 working days',
      dateChangeRule: {
        en: siteSettings.dateChangeRule?.en ?? DEFAULT_DATE_CHANGE_RULE.en,
        kn: siteSettings.dateChangeRule?.kn ?? DEFAULT_DATE_CHANGE_RULE.kn
      },
      earlyDepartureRule: {
        en: siteSettings.earlyDepartureRule?.en ?? DEFAULT_EARLY_DEPARTURE_RULE.en,
        kn: siteSettings.earlyDepartureRule?.kn ?? DEFAULT_EARLY_DEPARTURE_RULE.kn
      },
      gatewayFeeNote: {
        en: siteSettings.gatewayFeeNote?.en ?? DEFAULT_GATEWAY_FEE_NOTE.en,
        kn: siteSettings.gatewayFeeNote?.kn ?? DEFAULT_GATEWAY_FEE_NOTE.kn
      },
      safetyFeatures: { ...DEFAULT_SAFETY_FEATURES, ...(siteSettings.safetyFeatures || {}) }
    });
  }, [siteSettings]);

  const handleMovePolicySection = async (idx, direction, pageList) => {
    if (!isAdmin) return;
    const list = [...pageList];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;
    const orderedIds = list.map((sec) => sec._id).filter(Boolean);
    if (orderedIds.length === list.length) {
      await reorderPolicySections(policyPageFilter, orderedIds);
    }
  };

  const handleSavePolicyRefundRules = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    isPolicyRefundDirtyRef.current = false;
    const cleanedTiers = normalizeCancellationTiers(policySettingsForm.cancellationTiers);
    const payload = {
      cancellationTiers: cleanedTiers,
      noShowRefundPercent: Math.min(100, Math.max(0, Math.round(Number(policySettingsForm.noShowRefundPercent) || 0))),
      hostCancelsRefundPercent: Math.min(100, Math.max(0, Math.round(Number(policySettingsForm.hostCancelsRefundPercent) ?? 100))),
      refundTimelineText: String(policySettingsForm.refundTimelineText || '5 to 7 working days').trim(),
      dateChangeRule: policySettingsForm.dateChangeRule,
      earlyDepartureRule: policySettingsForm.earlyDepartureRule,
      gatewayFeeNote: policySettingsForm.gatewayFeeNote,
      policiesLastUpdated: new Date().toISOString()
    };
    if (markPolicyRefundVerifiedOnSave) {
      payload.sampleDefaultsVerified = {
        cancellationTiers: true,
        noShowRefundPercent: true,
        hostCancelsRefundPercent: true,
        refundTimelineText: true,
        dateChangeRule: true,
        earlyDepartureRule: true,
        gatewayFeeNote: true
      };
    }
    await saveSiteSettings(payload);
    setMarkPolicyRefundVerifiedOnSave(false);
  };

  const handleSaveSafetyFeatures = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    isPolicyRefundDirtyRef.current = false;
    await saveSiteSettings({
      safetyFeatures: policySettingsForm.safetyFeatures,
      policiesLastUpdated: new Date().toISOString()
    });
  };

  // Dining management states
  const [diningSubTab, setDiningSubTab] = useState('menu'); // 'menu' | 'timings' | 'content'
  const [diningHeroForm, setDiningHeroForm] = useState({
    badgeEn: '',
    badgeKn: '',
    titleEn: '',
    titleKn: '',
    descEn: '',
    descKn: '',
    tag1En: '',
    tag1Kn: '',
    tag2En: '',
    tag2Kn: '',
    tag3En: '',
    tag3Kn: '',
    kitchenBadgeEn: '',
    kitchenBadgeKn: '',
    kitchenHeadingEn: '',
    kitchenHeadingKn: '',
    kitchenTextEn: '',
    kitchenTextKn: '',
    kitchenBtnEn: '',
    kitchenBtnKn: '',
    menuBadgeEn: '',
    menuBadgeKn: '',
    menuHeadingEn: '',
    menuHeadingKn: '',
    menuDescEn: '',
    menuDescKn: ''
  });

  const [timingsData, setTimingsData] = useState({
    headingEn: '',
    headingKn: '',
    subtitleEn: '',
    subtitleKn: '',
    descEn: '',
    descKn: '',
    items: []
  });

  useEffect(() => {
    if (diningContent) {
      setDiningHeroForm({
        badgeEn: diningContent.hero?.badge?.en || '',
        badgeKn: diningContent.hero?.badge?.kn || '',
        titleEn: diningContent.hero?.title?.en || '',
        titleKn: diningContent.hero?.title?.kn || '',
        descEn: diningContent.hero?.description?.en || '',
        descKn: diningContent.hero?.description?.kn || '',
        tag1En: diningContent.hero?.tags?.[0]?.en || '',
        tag1Kn: diningContent.hero?.tags?.[0]?.kn || '',
        tag2En: diningContent.hero?.tags?.[1]?.en || '',
        tag2Kn: diningContent.hero?.tags?.[1]?.kn || '',
        tag3En: diningContent.hero?.tags?.[2]?.en || '',
        tag3Kn: diningContent.hero?.tags?.[2]?.kn || '',
        kitchenBadgeEn: diningContent.auxiliaryKitchen?.badge?.en || '',
        kitchenBadgeKn: diningContent.auxiliaryKitchen?.badge?.kn || '',
        kitchenHeadingEn: diningContent.auxiliaryKitchen?.heading?.en || '',
        kitchenHeadingKn: diningContent.auxiliaryKitchen?.heading?.kn || '',
        kitchenTextEn: diningContent.auxiliaryKitchen?.text?.en || '',
        kitchenTextKn: diningContent.auxiliaryKitchen?.text?.kn || '',
        kitchenBtnEn: diningContent.auxiliaryKitchen?.buttonLabel?.en || '',
        kitchenBtnKn: diningContent.auxiliaryKitchen?.buttonLabel?.kn || '',
        menuBadgeEn: diningContent.menuSection?.badge?.en || '',
        menuBadgeKn: diningContent.menuSection?.badge?.kn || '',
        menuHeadingEn: diningContent.menuSection?.heading?.en || '',
        menuHeadingKn: diningContent.menuSection?.heading?.kn || '',
        menuDescEn: diningContent.menuSection?.description?.en || '',
        menuDescKn: diningContent.menuSection?.description?.kn || ''
      });

      setTimingsData({
        headingEn: diningContent.timings?.heading?.en || '',
        headingKn: diningContent.timings?.heading?.kn || '',
        subtitleEn: diningContent.timings?.subtitle?.en || '',
        subtitleKn: diningContent.timings?.subtitle?.kn || '',
        descEn: diningContent.timings?.description?.en || '',
        descKn: diningContent.timings?.description?.kn || '',
        items: (diningContent.timings?.items || []).map((t, idx) => ({
          id: t._id || idx,
          mealEn: t.meal?.en || '',
          mealKn: t.meal?.kn || '',
          timeEn: t.time?.en || '',
          timeKn: t.time?.kn || '',
          includedEn: t.included?.en || '',
          includedKn: t.included?.kn || ''
        }))
      });
    }
  }, [diningContent]);

  const handleSaveDiningHero = async (e) => {
    e.preventDefault();
    await updateDiningContent({
      hero: {
        badge: { en: diningHeroForm.badgeEn, kn: diningHeroForm.badgeKn },
        title: { en: diningHeroForm.titleEn, kn: diningHeroForm.titleKn },
        description: { en: diningHeroForm.descEn, kn: diningHeroForm.descKn },
        tags: [
          { en: diningHeroForm.tag1En, kn: diningHeroForm.tag1Kn },
          { en: diningHeroForm.tag2En, kn: diningHeroForm.tag2Kn },
          { en: diningHeroForm.tag3En, kn: diningHeroForm.tag3Kn }
        ].filter(t => t.en || t.kn)
      },
      auxiliaryKitchen: {
        badge: { en: diningHeroForm.kitchenBadgeEn, kn: diningHeroForm.kitchenBadgeKn },
        heading: { en: diningHeroForm.kitchenHeadingEn, kn: diningHeroForm.kitchenHeadingKn },
        text: { en: diningHeroForm.kitchenTextEn, kn: diningHeroForm.kitchenTextKn },
        buttonLabel: { en: diningHeroForm.kitchenBtnEn, kn: diningHeroForm.kitchenBtnKn }
      },
      menuSection: {
        badge: { en: diningHeroForm.menuBadgeEn, kn: diningHeroForm.menuBadgeKn },
        heading: { en: diningHeroForm.menuHeadingEn, kn: diningHeroForm.menuHeadingKn },
        description: { en: diningHeroForm.menuDescEn, kn: diningHeroForm.menuDescKn }
      }
    });
  };

  const handleSaveTimings = async (customItems) => {
    const itemsToSave = customItems || timingsData.items;
    await updateDiningContent({
      timings: {
        heading: { en: timingsData.headingEn, kn: timingsData.headingKn },
        subtitle: { en: timingsData.subtitleEn, kn: timingsData.subtitleKn },
        description: { en: timingsData.descEn, kn: timingsData.descKn },
        items: itemsToSave.map((item, idx) => ({
          meal: { en: item.mealEn, kn: item.mealKn },
          time: { en: item.timeEn, kn: item.timeKn || item.timeEn },
          included: { en: item.includedEn, kn: item.includedKn },
          displayOrder: idx
        }))
      }
    });
  };

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const res = await login(loginEmail, loginPassword);
      if (!res.success) {
        setLoginError(res.message || 'Invalid email or password');
      }
    } catch (err) {
      setLoginError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Force Password Change
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setChangePasswordError('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordError('Passwords do not match');
      return;
    }
    setIsChangingPassword(true);
    setChangePasswordError('');
    try {
      const res = await changePassword(newPassword);
      if (!res.success) {
        setChangePasswordError(res.message || 'Failed to update password');
      }
    } catch (err) {
      setChangePasswordError(err.message || 'Error updating password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Gallery Upload (File or Drive/Web Link)
  const handleUploadGalleryImage = async (e) => {
    e.preventDefault();
    if (!galleryFile && !galleryUrl?.trim()) {
      showToast('Please select an image file or paste a Google Drive/Web URL', 'error');
      return;
    }

    setIsUploadingGallery(true);
    try {
      let finalUrl = '';
      if (galleryFile) {
        const formData = new FormData();
        formData.append('image', galleryFile);
        const uploadRes = await api.admin.uploadImage(formData);
        if (uploadRes?.data?.url) {
          finalUrl = uploadRes.data.url;
        } else {
          throw new Error('Upload succeeded but no file URL returned');
        }
      } else {
        finalUrl = normalizeImageUrl(galleryUrl);
      }

      await addGalleryImage({
        url: finalUrl,
        alt: galleryAlt || 'Marichin Homestay Gallery',
        category: galleryCategory,
        displayOrder: (gallery?.length || 0) + 1
      });
      setGalleryFile(null);
      setGalleryUrl('');
      setGalleryAlt('');
      showToast('Photo successfully added to gallery', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add image to gallery', 'error');
    } finally {
      setIsUploadingGallery(false);
    }
  };

  // Handle Settings Save
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    isSettingsDirtyRef.current = false;
    await saveSiteSettings({
      propertyName: settingsForm.propertyName,
      name: settingsForm.propertyName,
      tagline: settingsForm.tagline,
      registrationNumber: settingsForm.registrationNumber,
      phones: settingsForm.phone ? [settingsForm.phone] : [],
      phone: settingsForm.phone || '',
      email: settingsForm.email || '',
      whatsappNumber: settingsForm.whatsappNumber || '',
      whatsapp: settingsForm.whatsappNumber || '',
      instagramUrl: settingsForm.instagramUrl,
      facebookUrl: settingsForm.facebookUrl,
      youtubeUrl: settingsForm.youtubeUrl,
      address: settingsForm.address,
      googleMapsShareUrl: settingsForm.googleMapsShareUrl || '',
      upiId: settingsForm.upiId,
      pricePerNight: Number(settingsForm.pricePerNight),
      extraGuestCharge: Number(settingsForm.extraGuestCharge),
      mealsIncluded: settingsForm.mealsIncluded,
      inclusionsNote: settingsForm.inclusionsNote,
      advanceOptions: String(settingsForm.advanceOptions).split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0),
      taxPercent: Number(settingsForm.taxPercent),
      checkInTime: settingsForm.checkInTime,
      checkOutTime: settingsForm.checkOutTime,
      minNights: Math.max(1, Number(settingsForm.minNights) || 1),
      maxAdvanceDays: Math.max(1, Number(settingsForm.maxAdvanceDays) || 365),
      sameDayCutoffTime: settingsForm.sameDayCutoffTime || '18:00',
      holdMinutes: Math.max(1, Number(settingsForm.holdMinutes) || 15),
      autoConfirmAfterPayment: Boolean(settingsForm.autoConfirmAfterPayment),
      fullHomePricePerNight: Math.max(0, Number(settingsForm.fullHomePricePerNight) || 35000),
      fullHomeEnabled: Boolean(settingsForm.fullHomeEnabled),
      fullHomeMinNights: Math.max(1, Number(settingsForm.fullHomeMinNights) || 1),
      fullHomeMealsNote: settingsForm.fullHomeMealsNote || 'Morning breakfast included',
      roomsPageHeading: settingsForm.roomsPageHeading,
      roomsPageDescription: settingsForm.roomsPageDescription,
      aboutStoryText: settingsForm.aboutStoryText,
      drivingDistances: String(settingsForm.drivingDistances).split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        const [mainPart, ...extraParts] = trimmed.split('|').map(s => s.trim());
        const colonIdx = mainPart.indexOf(':');
        let placeName = '';
        let dist = '';
        if (colonIdx !== -1) {
          placeName = mainPart.slice(0, colonIdx).trim();
          dist = mainPart.slice(colonIdx + 1).trim();
        } else {
          dist = mainPart;
        }
        if (!placeName) {
          if (dist.includes('6')) placeName = 'Kushalnagar';
          else if (dist.includes('28')) placeName = 'Madikeri';
          else if (dist.includes('95')) placeName = 'Mysuru';
          else placeName = 'Nearby';
        }
        const time = extraParts[0] || (
          dist.includes('6') ? '~12 mins' :
          dist.includes('28') ? '~40 mins' :
          dist.includes('95') ? '~2 hrs 15 mins' : ''
        );
        const route = extraParts[1] || (
          dist.includes('6') ? 'Via BM Road / SH88' :
          dist.includes('28') ? 'Via NH 275' :
          dist.includes('95') ? 'Via Mysore-Madikeri Rd / NH 275' : ''
        );
        return { place: placeName, city: placeName, distance: dist, time, route };
      }).filter(Boolean)
    });
  };

  // Helper to render sample badge if field value is not verified
  const renderSampleBadge = (fieldName) => {
    const verifiedMap = siteSettings?.sampleDefaultsVerified;
    const isVerified = (verifiedMap instanceof Map ? verifiedMap.get(fieldName) : verifiedMap?.[fieldName]) === true;
    if (isVerified) return null;
    return (
      <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full ml-2 font-medium">
        Sample value, please verify
      </span>
    );
  };

  // Handle moving inclusion items up or down
  const handleMoveInclusion = async (idx, direction) => {
    const list = [...(inclusions || [])].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;
    const orderedIds = list.map((item) => item._id || item.id);
    await reorderInclusionItems(orderedIds);
  };

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const id = b.id || b.bookingCode || '';
      const guest = b.guestName || b.guest?.fullName || b.primaryGuest?.name || '';
      const phone = b.phone || '';
      const email = b.email || '';
      const room = b.roomName || b.room?.name || '';
      const status = (b.status || '').toLowerCase();
      const payStatus = (b.paymentStatus || 'pending').toLowerCase();

      const matchesSearch = !searchQuery || (
        id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery) ||
        email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const matchesStatus = bookingFilterStatus === 'all' || status === bookingFilterStatus;
      const matchesPayment =
        paymentStatusFilter === 'all' || payStatus === paymentStatusFilter;

      let matchesDates = true;
      if (bookingFilterDateFrom || bookingFilterDateTo) {
        const bCheckInStr = typeof b.checkIn === 'string' ? b.checkIn.split('T')[0] : '';
        if (bookingFilterDateFrom && bCheckInStr < bookingFilterDateFrom) matchesDates = false;
        if (bookingFilterDateTo && bCheckInStr > bookingFilterDateTo) matchesDates = false;
      }

      let matchesAttention = true;
      if (bookingAttentionOnly) {
        const needsAttention = b.dateChangeRequested || (b.refundDue && b.refundDue > 0) || payStatus === 'failed';
        if (!needsAttention) matchesAttention = false;
      }

      return matchesSearch && matchesStatus && matchesPayment && matchesDates && matchesAttention;
    });
  }, [bookings, searchQuery, bookingFilterStatus, paymentStatusFilter, bookingFilterDateFrom, bookingFilterDateTo, bookingAttentionOnly]);

  const attentionBookingsCount = useMemo(() => {
    if (Array.isArray(bookings) && bookings.length > 0) {
      return bookings.filter(
        (b) => b.dateChangeRequested || (b.refundDue && b.refundDue > 0) || (b.paymentStatus || '').toLowerCase() === 'failed'
      ).length;
    }
    return (
      (dashboardStats?.dateChangeFlagsCount || 0) +
      (dashboardStats?.refundsDueCount || 0) +
      (dashboardStats?.failedPaymentsCount || 0)
    );
  }, [bookings, dashboardStats]);

  const newEnquiriesCount = useMemo(() => {
    if (Array.isArray(enquiries) && enquiries.length > 0) {
      return enquiries.filter((e) => (e.status || '').toLowerCase() === 'new').length;
    }
    return dashboardStats?.pendingEnquiries || 0;
  }, [enquiries, dashboardStats]);

  const pendingReviewsCount = useMemo(() => {
    if (Array.isArray(adminReviews) && adminReviews.length > 0) {
      return adminReviews.filter((r) => (r.status || '').toLowerCase() === 'pending').length;
    }
    return dashboardStats?.pendingReviews || 0;
  }, [adminReviews, dashboardStats]);

  const getBookingStatusBadge = (status) => {
    const s = (status || 'confirmed').toLowerCase();
    switch (s) {
      case 'confirmed':
      case 'paid_awaiting_confirmation':
        return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
      case 'checked_in':
        return 'bg-blue-50 text-blue-800 border border-blue-200';
      case 'checked_out':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      case 'payment_pending':
      case 'pending':
        return 'bg-amber-50 text-amber-800 border border-amber-200';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-50 text-red-800 border border-red-200';
      case 'expired':
        return 'bg-slate-100 text-slate-600 border border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const getBookingPaymentBadge = (paymentStatus) => {
    const p = (paymentStatus || 'pending').toLowerCase();
    switch (p) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
      case 'partial':
      case 'pending':
        return 'bg-amber-50 text-amber-800 border border-amber-200';
      case 'refunded':
        return 'bg-purple-50 text-purple-800 border border-purple-200';
      case 'failed':
        return 'bg-red-50 text-red-800 border border-red-200';
      default:
        return 'bg-amber-50 text-amber-800 border border-amber-200';
    }
  };

  // Sidebar Items (badges only for items needing attention, hidden when 0)
  const sidebarItems = [
    { id: 'dashboard', label: ad.nav.dashboard, icon: LayoutDashboard },
    { id: 'bookings', label: ad.nav.bookings, icon: CalendarCheck, count: attentionBookingsCount },
    { id: 'calendar', label: ad.nav.calendar, icon: CalendarDays },
    { id: 'rooms', label: ad.nav.rooms, icon: Home },
    { id: 'packages', label: ad.nav.packages, icon: Package },
    { id: 'experiences', label: ad.nav.experiences, icon: Compass },
    { id: 'dining', label: ad.nav.dining, icon: UtensilsCrossed },
    { id: 'gallery', label: ad.nav.gallery, icon: Image },
    { id: 'reviews', label: ad.nav.reviews, icon: Star, count: pendingReviewsCount },
    { id: 'enquiries', label: ad.nav.enquiries, icon: MessageSquare, count: newEnquiriesCount },
    { id: 'offers', label: ad.nav.offers, icon: Percent },
    { id: 'policies', label: ad.nav.policies, icon: FileText },
    { id: 'settings', label: ad.nav.settings, icon: SettingsIcon },
    ...(isAdmin ? [
      { id: 'users', label: ad.nav.users, icon: Users },
      { id: 'logs', label: ad.nav.logs, icon: ShieldAlert }
    ] : [])
  ];

  // Restrict staff from admin-only tabs
  const handleTabChange = (tabId) => {
    if (!isAdmin && ['users', 'logs'].includes(tabId)) {
      showToast('Staff role is restricted from accessing this administrative section', 'error');
      return;
    }
    setActiveTab(tabId);
    navigate(`/admin/${tabId}`);
    setSidebarOpen(false);
  };

  // Calendar calculations
  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const monthName = calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // =========================================================================
  // AUTHENTICATION GUARD
  // =========================================================================
  if (authChecking) {
    return (
      <div className="admin-theme min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)] flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-[#0F2A20]/15 border-t-[#0F2A20] rounded-full animate-spin mb-4" />
        <p className="text-sm font-sans tracking-widest uppercase text-[var(--admin-muted)]">{ad.verifyingSession}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-theme min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)] flex flex-col justify-center items-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#B8964A]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="admin-login-card w-full max-w-md bg-white border border-[var(--admin-border)] rounded-3xl p-8 shadow-[var(--admin-shadow-elevated)] relative z-10 space-y-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-3 py-1 rounded-xl border border-[var(--admin-input-border)] text-xs font-semibold text-[var(--admin-heading)] bg-[var(--admin-surface-subtle)] hover:bg-[var(--admin-table-head)] transition-colors cursor-pointer"
            >
              {language === 'en' ? 'ಕನ್ನಡ' : 'EN'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <Link to="/" className="inline-block group mb-1">
              <img
                src="/images/logo.jpeg"
                alt="Marichin Homestay logo"
                className="w-16 h-16 rounded-full mx-auto object-contain border-2 border-[#B8964A]/60 shadow-md group-hover:scale-105 transition-transform"
                style={{ borderRadius: '50%' }}
              />
            </Link>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[var(--admin-gold-text)] block">
              {ad.portalTag}
            </span>
            <h1 className="font-serif text-2xl font-bold text-[var(--admin-heading)]">
              {ad.signInTitle}
            </h1>
            <p className="text-xs text-[var(--admin-muted)]">
              {ad.signInDesc}
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-700 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-[var(--admin-heading)] block mb-1 font-semibold">{ad.emailLabel}</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@marichinhomestay.com"
                required
                className="w-full rounded-xl px-4 py-2.5 text-xs"
              />
            </div>

            <div>
              <label className="text-xs text-[var(--admin-heading)] block mb-1 font-semibold">{ad.passwordLabel}</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder={ad.passwordPlaceholder}
                required
                className="w-full rounded-xl px-4 py-2.5 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl text-xs uppercase tracking-wider admin-btn-primary shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{isLoggingIn ? ad.authenticating : ad.signInBtn}</span>
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[var(--admin-border)]">
            <Link
              to="/"
              className="text-xs text-[var(--admin-muted)] hover:text-[var(--admin-heading)] inline-flex items-center gap-1.5 transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{ad.returnPublic}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // FIRST LOGIN CHANGE PASSWORD MODAL
  // =========================================================================
  const renderChangePasswordModal = () => {
    if (!currentUser?.mustChangePassword) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4">
        <div className="admin-modal-card bg-white border-2 border-[var(--admin-gold)] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2.5 text-[var(--admin-heading)]">
            <KeyRound className="w-6 h-6 text-[var(--admin-gold-text)]" />
            <h3 className="font-serif text-lg font-bold">Action Required: Change Default Password</h3>
          </div>
          <p className="text-xs text-[var(--admin-muted)]">
            For the security of the homestay reservation system, please set a personal password before continuing. Minimum 8 characters.
          </p>

          {changePasswordError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
              {changePasswordError}
            </div>
          )}

          <form onSubmit={handleChangePasswordSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-[var(--admin-heading)] font-semibold block mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className="w-full rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-[var(--admin-heading)] font-semibold block mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className="w-full rounded-lg px-3 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="w-full py-2.5 rounded-xl uppercase text-xs admin-btn-primary cursor-pointer"
            >
              {isChangingPassword ? 'Updating Password...' : 'Save & Proceed'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  // =========================================================================
  // REUSABLE CONFIRMATION MODAL
  // =========================================================================
  const renderConfirmDialog = () => {
    if (!confirmModal.isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 animate-fade-in">
        <div className="admin-modal-card bg-white border border-[var(--admin-border)] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2.5 text-amber-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <h4 className="font-serif text-base font-bold text-[var(--admin-heading)]">{confirmModal.title}</h4>
          </div>
          <p className="text-xs text-[var(--admin-muted)] leading-relaxed">{confirmModal.message}</p>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })}
              className="px-4 py-1.5 rounded-lg admin-btn-outline text-xs cursor-pointer"
            >
              {ad.cancel}
            </button>
            <button
              type="button"
              onClick={confirmModal.onConfirm}
              className="px-4 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 shadow-sm cursor-pointer"
            >
              {ad.confirm}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Dashboard Derived Values (strictly real data, never hardcoded fake numbers)
  const totalRoomUnitsCount =
    dashboardStats?.totalRoomUnits ??
    (rooms.reduce((sum, r) => sum + (Number(r.totalUnits) || 1), 0) || 5);
  const roomsAvailableTodayCount = dashboardStats?.roomsAvailableToday ?? totalRoomUnitsCount;
  const bookedTonightCount = dashboardStats?.bookedTonight ?? 0;
  const blockedTonightCount = dashboardStats?.blockedTonight ?? 0;

  const upcomingBookingsCount =
    dashboardStats?.upcomingBookingsCount ??
    bookings.filter((b) => {
      const st = (b.status || '').toLowerCase();
      return st === 'confirmed' || st === 'paid_awaiting_confirmation';
    }).length;

  const guestsArrivingWeekCount = dashboardStats?.guestsArrivingThisWeek ?? 0;
  const bookingsArrivingWeekCount = dashboardStats?.bookingsArrivingThisWeekCount ?? 0;
  const todayCheckInsCount = dashboardStats?.todayCheckInsCount ?? 0;
  const todayCheckOutsCount = dashboardStats?.todayCheckOutsCount ?? 0;

  const revenueThisMonthVal = dashboardStats?.revenueThisMonth ?? 0;
  const revenueLastMonthVal = dashboardStats?.revenueLastMonth ?? 0;
  const refundsThisMonthVal = dashboardStats?.refundsThisMonth ?? 0;
  const occupancyPctVal = dashboardStats?.occupancyPercentage ?? 0;
  const lastMonthOccupancyPctVal = dashboardStats?.lastMonthOccupancyPercentage ?? 0;
  const bookedRoomNightsMonth = dashboardStats?.bookedRoomNightsThisMonth ?? 0;
  const totalRoomNightsMonth = dashboardStats?.totalRoomNightsThisMonth ?? (totalRoomUnitsCount * 30);

  const pendingHoldsCount =
    dashboardStats?.pendingPaymentHolds ??
    bookings.filter((b) => ['payment_pending', 'paid_awaiting_confirmation'].includes((b.status || '').toLowerCase())).length;
  const pendingItemsTotal = newEnquiriesCount + pendingReviewsCount + pendingHoldsCount;

  const dateChangeFlagsCount =
    dashboardStats?.dateChangeFlagsCount ??
    bookings.filter((b) => b.dateChangeRequested).length;
  const refundsDueCount =
    dashboardStats?.refundsDueCount ??
    bookings.filter((b) => Number(b.refundDue) > 0).length;
  const refundsDueAmount =
    dashboardStats?.refundsDueAmount ??
    bookings.reduce((sum, b) => sum + (Number(b.refundDue) || 0), 0);
  const failedPaymentsCount =
    dashboardStats?.failedPaymentsCount ??
    bookings.filter((b) => (b.paymentStatus || '').toLowerCase() === 'failed').length;
  const problemsTotal = dateChangeFlagsCount + refundsDueCount + failedPaymentsCount;

  const bookingsThisMonthCount = dashboardStats?.bookingsThisMonthCount ?? 0;
  const bookingsLastMonthCount = dashboardStats?.bookingsLastMonthCount ?? 0;

  const bookingsDelta = bookingsThisMonthCount - bookingsLastMonthCount;
  const revenueDeltaPct =
    revenueLastMonthVal > 0
      ? Math.round(((revenueThisMonthVal - revenueLastMonthVal) / revenueLastMonthVal) * 100)
      : null;
  const occupancyDeltaPts = occupancyPctVal - lastMonthOccupancyPctVal;

  const activeTabLabel = ad.nav[activeTab] || activeTab;

  // =========================================================================
  // MAIN ADMIN CONSOLE LAYOUT
  // =========================================================================
  return (
    <div className="admin-theme bg-[var(--admin-bg)] text-[var(--admin-text)] min-h-screen flex flex-col lg:flex-row relative overflow-x-clip">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border shadow-lg text-xs flex items-center gap-2 animate-slide-in max-w-[calc(100vw-2rem)] ${
          toast.type === 'error'
            ? 'bg-red-50 border-red-300 text-red-900'
            : 'bg-white border-[var(--admin-gold)] text-[var(--admin-heading)]'
        }`}>
          {toast.type === 'error'
            ? <AlertTriangle className="w-4 h-4 text-red-700 flex-shrink-0" />
            : <CheckCircle className="w-4 h-4 text-emerald-700 flex-shrink-0" />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Force Change Password Modal */}
      {renderChangePasswordModal()}

      {/* Confirmation Modal */}
      {renderConfirmDialog()}

      {/* Mobile Top Header */}
      <div className="lg:hidden bg-white border-b border-[var(--admin-border)] px-4 py-3 flex items-center justify-between z-40 sticky top-0 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-[var(--admin-heading)] hover:bg-[var(--admin-table-head)] rounded-lg cursor-pointer"
            aria-label="Toggle Menu"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <img
            src="/images/logo.jpeg"
            alt="Marichin Homestay logo"
            className="w-8 h-8 rounded-full object-contain border border-[var(--admin-gold)]/50 flex-shrink-0"
            style={{ borderRadius: '50%' }}
          />
          <span className="font-serif text-base font-bold text-[var(--admin-heading)] truncate">
            {ad.adminPortal}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={toggleLanguage}
            className="text-[11px] font-semibold text-[var(--admin-heading)] border border-[var(--admin-input-border)] bg-[var(--admin-surface-subtle)] px-2 py-1 rounded-full cursor-pointer"
          >
            {language === 'en' ? 'ಕನ್ನಡ' : 'EN'}
          </button>
          <button
            type="button"
            onClick={logout}
            className="text-xs text-red-700 border border-red-200 bg-red-50 p-1.5 rounded-full cursor-pointer"
            title={ad.logout}
          >
            <LogOut className="w-4 h-4" />
          </button>
          <Link
            to="/"
            className="text-xs font-semibold text-[var(--admin-heading)] border border-[var(--admin-input-border)] px-2.5 py-1 rounded-full"
          >
            {ad.exit}
          </Link>
        </div>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/45 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation (Kept Dark Green #0F2A20, Sticky Full Viewport Height on Desktop) */}
      <aside
        className={`admin-sidebar fixed lg:sticky top-0 lg:top-0 lg:self-start left-0 h-screen w-64 bg-[#0F2A20] border-r border-[#1B4332] flex flex-col justify-between z-40 transition-transform duration-300 ease-in-out flex-shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="overflow-y-auto flex-1">
          {/* Logo Brand */}
          <div className="p-5 border-b border-[#1B4332] flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 min-w-0">
              <img
                src="/images/logo.jpeg"
                alt="Marichin Homestay logo"
                className="w-10 h-10 rounded-full object-contain border border-[#B8964A]/50 shadow-sm flex-shrink-0"
                style={{ borderRadius: '50%' }}
              />
              <div className="min-w-0">
                <span className="font-serif text-base font-bold text-[#F3EDDD] uppercase block leading-tight truncate">
                  Marichin Homestay
                </span>
                <span className="text-[9px] uppercase tracking-widest text-[#D9BC7A] font-sans">
                  {ad.consoleSubtitle}
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-[#B9C4B8] p-1 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Pill */}
          <div className="px-3.5 py-2.5 mx-4 my-3 bg-[#143528] border border-[#1B4332] rounded-xl flex items-center justify-between">
            <div className="overflow-hidden">
              <span className="text-xs font-semibold text-[#F3EDDD] block truncate">
                {currentUser?.name || 'Administrator'}
              </span>
              <span className="text-[10px] uppercase font-bold text-[#D9BC7A] tracking-wider block">
                {currentUser?.role?.toUpperCase()}
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-1.5 text-red-300 hover:text-white rounded hover:bg-[#1B4332] transition-colors cursor-pointer"
              title={ad.logout}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links List */}
          <nav className="px-3.5 pb-4 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const showBadge = typeof item.count === 'number' && item.count > 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#B8964A] text-[#0F2A20] font-bold shadow-md'
                      : 'text-[#F3EDDD]/90 hover:bg-[#1B4332] hover:text-[#F3EDDD]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#0F2A20]' : 'text-[#D9BC7A]'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {showBadge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                        isActive
                          ? 'bg-[#0F2A20] text-[#F3EDDD]'
                          : 'bg-[#B8964A] text-[#0F2A20]'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Link */}
        <div className="p-4 border-t border-[#1B4332] bg-[#0F2A20]">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs text-[#B9C4B8] hover:text-[#F3EDDD] border border-[#1B4332] hover:border-[#B8964A]/60 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{ad.returnPublic}</span>
          </Link>
        </div>
      </aside>

      {/* Main Content View */}
      <main className="admin-main flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        
        {/* Top Header Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 mb-6 border-b border-[var(--admin-border)]">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--admin-gold-text)] block">
              {ad.managementConsole} · {currentUser?.role?.toUpperCase()}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--admin-heading)]">
              {activeTabLabel} {ad.managementSuffix}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:flex-initial min-w-[180px]">
              <Search className="w-4 h-4 text-[var(--admin-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={ad.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl pl-9 pr-3.5 py-1.5 text-xs w-full sm:w-60"
              />
            </div>
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl admin-btn-outline text-xs flex items-center gap-1.5 cursor-pointer"
              title={`Last synced: ${lastRefreshed.toLocaleTimeString()}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? ad.syncing : ad.sync}</span>
            </button>
            <button
              type="button"
              onClick={toggleLanguage}
              className="hidden sm:inline-flex px-3 py-1.5 rounded-xl admin-btn-outline text-xs cursor-pointer"
              title="Toggle language"
            >
              {language === 'en' ? 'ಕನ್ನಡ' : 'EN'}
            </button>
            <button
              type="button"
              onClick={logout}
              className="hidden sm:inline-flex px-3 py-1.5 rounded-xl border border-red-200 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 items-center gap-1.5 transition-colors cursor-pointer"
              title={ad.logout}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{ad.logout}</span>
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: DASHBOARD */}
        {/* ================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Row 1: Core Hospitality KPI Cards (4 Colourful Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* 1. Rooms Available Today (Forest Green) */}
              <div className="bg-white rounded-[14px] p-5 border border-[var(--admin-border)] border-t-4 border-t-[#1B4332] shadow-[var(--admin-shadow-card)] flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--admin-muted)] block mb-1">
                      {ad.kpi.roomsAvailableToday}
                    </span>
                    <span className="font-serif text-3xl font-bold text-[#0F2A20]">
                      {roomsAvailableTodayCount} <span className="text-lg font-sans font-semibold text-[var(--admin-muted)]">/ {totalRoomUnitsCount}</span>
                    </span>
                  </div>
                  <span className="w-10 h-10 rounded-xl bg-[#EEF2EA] text-[#1B4332] flex items-center justify-center flex-shrink-0">
                    <Home className="w-5 h-5" />
                  </span>
                </div>
                <p className="text-[11px] text-[var(--admin-muted)] mt-2.5 font-medium">
                  {bookedTonightCount === 0 && blockedTonightCount === 0
                    ? ad.kpi.allRoomsFreeTonight
                    : `${bookedTonightCount} ${ad.kpi.bookedTonight}${blockedTonightCount > 0 ? ` · ${blockedTonightCount} ${ad.kpi.blockedTonight}` : ''}`}
                </p>
              </div>

              {/* 2. Upcoming Bookings (Forest Green) */}
              <div className="bg-white rounded-[14px] p-5 border border-[var(--admin-border)] border-t-4 border-t-[#1B4332] shadow-[var(--admin-shadow-card)] flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--admin-muted)] block mb-1">
                      {ad.kpi.upcomingBookings}
                    </span>
                    <span className="font-serif text-3xl font-bold text-[#0F2A20]">
                      {upcomingBookingsCount}
                    </span>
                  </div>
                  <span className="w-10 h-10 rounded-xl bg-[#EEF2EA] text-[#1B4332] flex items-center justify-center flex-shrink-0">
                    <CalendarCheck className="w-5 h-5" />
                  </span>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                  <span className="text-[var(--admin-muted)] font-medium">
                    {bookingsThisMonthCount} {ad.kpi.thisMonthCount}
                  </span>
                  {dashboardStats && (bookingsLastMonthCount > 0 || bookingsThisMonthCount > 0) && (
                    <span className={`font-semibold ${bookingsDelta >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {bookingsDelta >= 0 ? `+${bookingsDelta}` : bookingsDelta} {ad.kpi.vsLastMonth}
                    </span>
                  )}
                </div>
              </div>

              {/* 3. Guests Arriving This Week / Check-Ins (Teal #0F766E) */}
              <div className="bg-white rounded-[14px] p-5 border border-[var(--admin-border)] border-t-4 border-t-[#0F766E] shadow-[var(--admin-shadow-card)] flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--admin-muted)] block mb-1">
                      {ad.kpi.guestsArrivingWeek}
                    </span>
                    <span className="font-serif text-3xl font-bold text-[#0F766E]">
                      {guestsArrivingWeekCount}
                    </span>
                  </div>
                  <span className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5" />
                  </span>
                </div>
                <p className="text-[11px] text-[var(--admin-muted)] mt-2.5 font-medium">
                  {ad.kpi.checkInsTodaySub}: <strong className="text-[#0F766E]">{todayCheckInsCount}</strong> · {bookingsArrivingWeekCount} {ad.kpi.bookingsThisWeekSub}
                </p>
              </div>

              {/* 4. Revenue This Month (Gold #B8964A) */}
              <div className="bg-white rounded-[14px] p-5 border border-[var(--admin-border)] border-t-4 border-t-[#B8964A] shadow-[var(--admin-shadow-card)] flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--admin-muted)] block mb-1">
                      {ad.kpi.revenueThisMonth}
                    </span>
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-[#0F2A20] block truncate">
                      {formatINR(revenueThisMonthVal)}
                    </span>
                  </div>
                  <span className="w-10 h-10 rounded-xl bg-[#FBF6E8] text-[#78591C] flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </span>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                  <span className={refundsThisMonthVal > 0 ? 'text-purple-800 font-semibold' : 'text-[var(--admin-muted)]'}>
                    {refundsThisMonthVal > 0
                      ? `${ad.kpi.refundsThisMonth}: ${formatINR(refundsThisMonthVal)}`
                      : ad.kpi.noRefundsThisMonth}
                  </span>
                  {dashboardStats && revenueDeltaPct !== null && (
                    <span className={`font-semibold ${revenueDeltaPct >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {revenueDeltaPct >= 0 ? `+${revenueDeltaPct}%` : `${revenueDeltaPct}%`} {ad.kpi.vsLastMonth}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Occupancy, Pending Items & Refunds/Problems (3 Colourful Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 5. Occupancy (Terracotta #A8654A) */}
              <div className="bg-white rounded-[14px] p-5 border border-[var(--admin-border)] border-t-4 border-t-[#A8654A] shadow-[var(--admin-shadow-card)] flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--admin-muted)] block mb-1">
                      {ad.kpi.occupancyThisMonth}
                    </span>
                    <span className="font-serif text-3xl font-bold text-[#A8654A]">
                      {occupancyPctVal}%
                    </span>
                  </div>
                  <span className="w-10 h-10 rounded-xl bg-[#FDF3EE] text-[#A8654A] flex items-center justify-center flex-shrink-0">
                    <Percent className="w-5 h-5" />
                  </span>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                  <span className="text-[var(--admin-muted)] font-medium">
                    {bookedRoomNightsMonth} / {totalRoomNightsMonth} {ad.kpi.roomNightsBooked}
                  </span>
                  {dashboardStats && (lastMonthOccupancyPctVal > 0 || occupancyPctVal > 0) && (
                    <span className={`font-semibold ${occupancyDeltaPts >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {occupancyDeltaPts >= 0 ? `+${occupancyDeltaPts}%` : `${occupancyDeltaPts}%`} {ad.kpi.vsLastMonth}
                    </span>
                  )}
                </div>
              </div>

              {/* 6. Pending Items (Amber #B7791F) */}
              <div className="bg-white rounded-[14px] p-5 border border-[var(--admin-border)] border-t-4 border-t-[#B7791F] shadow-[var(--admin-shadow-card)] flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--admin-muted)] block mb-1">
                      {ad.kpi.pendingItems}
                    </span>
                    <span className="font-serif text-3xl font-bold text-[#B7791F]">
                      {pendingItemsTotal}
                    </span>
                  </div>
                  <span className="w-10 h-10 rounded-xl bg-amber-50 text-[#B7791F] flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </span>
                </div>
                <p className="text-[11px] text-[var(--admin-muted)] mt-2.5 font-medium">
                  {newEnquiriesCount} · {pendingReviewsCount} · {pendingHoldsCount} ({ad.kpi.pendingBreakdown})
                </p>
              </div>

              {/* 7. Refunds & Problems (Red #B42318) */}
              <div className="bg-white rounded-[14px] p-5 border border-[var(--admin-border)] border-t-4 border-t-[#B42318] shadow-[var(--admin-shadow-card)] flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--admin-muted)] block mb-1">
                      {ad.kpi.refundsAndProblems}
                    </span>
                    <span className={`font-serif text-3xl font-bold ${problemsTotal > 0 ? 'text-[#B42318]' : 'text-[#0F2A20]'}`}>
                      {problemsTotal}
                    </span>
                  </div>
                  <span className="w-10 h-10 rounded-xl bg-red-50 text-[#B42318] flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </span>
                </div>
                <p className="text-[11px] mt-2.5 font-medium text-[var(--admin-muted)]">
                  {problemsTotal === 0
                    ? ad.kpi.allClear
                    : `${dateChangeFlagsCount} · ${refundsDueCount} · ${failedPaymentsCount} (${ad.kpi.problemsSub})`}
                </p>
              </div>
            </div>

            {/* Today's Check-ins & Check-outs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="admin-card p-5">
                <h4 className="font-serif text-base font-semibold text-[var(--admin-heading)] mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center">
                    <CalendarCheck className="w-4 h-4" />
                  </span>
                  <span>{ad.checkInOut.todaysCheckIns} ({todayCheckInsCount})</span>
                </h4>
                {dashboardStats?.todayCheckIns?.length > 0 ? (
                  <div className="space-y-2.5 text-xs">
                    {dashboardStats.todayCheckIns.map((ci) => {
                      const nightsCnt = getNightsCount(ci);
                      const stayLabel = getStayDisplayName(ci, isKn);
                      const balDue = Number(ci.balanceDue || 0);
                      const totalAmt = Number(ci.totalAmount || ci.pricing?.total || 0);
                      const guestPhone = ci.phone || ci.primaryGuest?.phone;
                      return (
                        <div key={ci._id} className="admin-subcard p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-[var(--admin-heading)]">{ci.guestName}</span>
                              {ci.bookingCode && (
                                <span className="font-mono text-[10px] text-[var(--admin-gold-text)] font-semibold">
                                  {ci.bookingCode}
                                </span>
                              )}
                            </div>
                            <span className="text-[var(--admin-muted)] text-[11px] block mt-0.5">
                              {stayLabel} · {nightsCnt} {nightsCnt === 1 ? ad.checkInOut.night : ad.checkInOut.nights}
                            </span>
                            {guestPhone && (
                              <span className="text-[10px] text-[var(--admin-muted)] font-mono block">{guestPhone}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2.5 flex-shrink-0">
                            <div className="text-left sm:text-right font-mono">
                              <span className={`text-xs font-bold block ${balDue > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                                {balDue > 0 ? `${ad.checkInOut.balanceDue}: ${formatINR(balDue)}` : ad.checkInOut.paidInFull}
                              </span>
                              <span className="text-[10px] text-[var(--admin-muted)] block">
                                {ad.checkInOut.total}: {formatINR(totalAmt)}
                              </span>
                            </div>
                            {!isPlaceholderPhone(guestPhone) && (
                              <button
                                type="button"
                                onClick={() => handleOpenWhatsAppModal(ci)}
                                className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                                title={ad.checkInOut.whatsappAction}
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--admin-muted)]">{ad.checkInOut.noCheckIns}</p>
                )}
              </div>

              <div className="admin-card p-5">
                <h4 className="font-serif text-base font-semibold text-[var(--admin-heading)] mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#FDF3EE] text-[#A8654A] flex items-center justify-center">
                    <CalendarDays className="w-4 h-4" />
                  </span>
                  <span>{ad.checkInOut.todaysCheckOuts} ({todayCheckOutsCount})</span>
                </h4>
                {dashboardStats?.todayCheckOuts?.length > 0 ? (
                  <div className="space-y-2.5 text-xs">
                    {dashboardStats.todayCheckOuts.map((co) => {
                      const nightsCnt = getNightsCount(co);
                      const stayLabel = getStayDisplayName(co, isKn);
                      const balDue = Number(co.balanceDue || 0);
                      const totalAmt = Number(co.totalAmount || co.pricing?.total || 0);
                      const guestPhone = co.phone || co.primaryGuest?.phone;
                      return (
                        <div key={co._id} className="admin-subcard p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-[var(--admin-heading)]">{co.guestName}</span>
                              {co.bookingCode && (
                                <span className="font-mono text-[10px] text-[var(--admin-gold-text)] font-semibold">
                                  {co.bookingCode}
                                </span>
                              )}
                            </div>
                            <span className="text-[var(--admin-muted)] text-[11px] block mt-0.5">
                              {stayLabel} · {nightsCnt} {nightsCnt === 1 ? ad.checkInOut.night : ad.checkInOut.nights}
                            </span>
                            {guestPhone && (
                              <span className="text-[10px] text-[var(--admin-muted)] font-mono block">{guestPhone}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2.5 flex-shrink-0">
                            <div className="text-left sm:text-right font-mono">
                              <span className={`text-xs font-bold block ${balDue > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                                {balDue > 0 ? `${ad.checkInOut.balanceDue}: ${formatINR(balDue)}` : ad.checkInOut.paidInFull}
                              </span>
                              <span className="text-[10px] text-[var(--admin-muted)] block">
                                {ad.checkInOut.total}: {formatINR(totalAmt)}
                              </span>
                            </div>
                            {!isPlaceholderPhone(guestPhone) && (
                              <button
                                type="button"
                                onClick={() => handleOpenWhatsAppModal(co)}
                                className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                                title={ad.checkInOut.whatsappAction}
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--admin-muted)]">{ad.checkInOut.noCheckOuts}</p>
                )}
              </div>
            </div>

            {/* Main Bookings Trend Chart & Action Items Queue */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <BookingsTrendChart
                  dataset={dashboardStats?.chartDataset || []}
                  range={chartRange}
                  onRangeChange={(nextRange) => setChartRange(nextRange)}
                  language={language}
                  loading={!dashboardStats}
                />
              </div>

              {/* Action Items Queue */}
              <div className="admin-card p-5 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="pb-3 mb-3 border-b border-[var(--admin-border)]">
                    <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)]">
                      {ad.queue.title}
                    </h3>
                    <p className="text-[11px] text-[var(--admin-muted)] mt-0.5">
                      {ad.queue.subtitle}
                    </p>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {/* 1. Date-change flags */}
                    <button
                      type="button"
                      onClick={() => {
                        setBookingFilterStatus('all');
                        setPaymentStatusFilter('all');
                        setBookingAttentionOnly(true);
                        handleTabChange('bookings');
                      }}
                      className="w-full p-2.5 rounded-xl bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)] hover:border-[var(--admin-gold)] flex items-center justify-between gap-2 transition-colors cursor-pointer text-left"
                    >
                      <span className="font-medium text-[var(--admin-text)]">{ad.queue.dateChangeFlags}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono border ${
                          dateChangeFlagsCount > 0
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {dateChangeFlagsCount}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[var(--admin-muted)]" />
                      </div>
                    </button>

                    {/* 2. Refunds due */}
                    <button
                      type="button"
                      onClick={() => {
                        setBookingFilterStatus('all');
                        setPaymentStatusFilter('all');
                        setBookingAttentionOnly(true);
                        handleTabChange('bookings');
                      }}
                      className="w-full p-2.5 rounded-xl bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)] hover:border-[var(--admin-gold)] flex items-center justify-between gap-2 transition-colors cursor-pointer text-left"
                    >
                      <span className="font-medium text-[var(--admin-text)]">{ad.queue.refundsDue}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono border ${
                          refundsDueCount > 0
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {refundsDueCount > 0 && refundsDueAmount > 0
                            ? `${refundsDueCount} (${formatINR(refundsDueAmount)})`
                            : refundsDueCount}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[var(--admin-muted)]" />
                      </div>
                    </button>

                    {/* 3. Failed payments */}
                    <button
                      type="button"
                      onClick={() => {
                        setBookingFilterStatus('all');
                        setBookingAttentionOnly(false);
                        setPaymentStatusFilter('failed');
                        handleTabChange('bookings');
                      }}
                      className="w-full p-2.5 rounded-xl bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)] hover:border-[var(--admin-gold)] flex items-center justify-between gap-2 transition-colors cursor-pointer text-left"
                    >
                      <span className="font-medium text-[var(--admin-text)]">{ad.queue.failedPayments}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono border ${
                          failedPaymentsCount > 0
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {failedPaymentsCount}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[var(--admin-muted)]" />
                      </div>
                    </button>

                    {/* 4. New enquiries */}
                    <button
                      type="button"
                      onClick={() => handleTabChange('enquiries')}
                      className="w-full p-2.5 rounded-xl bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)] hover:border-[var(--admin-gold)] flex items-center justify-between gap-2 transition-colors cursor-pointer text-left"
                    >
                      <span className="font-medium text-[var(--admin-text)]">{ad.queue.newEnquiries}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono border ${
                          newEnquiriesCount > 0
                            ? 'bg-teal-50 text-[#0F766E] border-teal-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {newEnquiriesCount}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[var(--admin-muted)]" />
                      </div>
                    </button>

                    {/* 5. Pending reviews */}
                    <button
                      type="button"
                      onClick={() => {
                        setReviewStatusFilter('pending');
                        handleTabChange('reviews');
                      }}
                      className="w-full p-2.5 rounded-xl bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)] hover:border-[var(--admin-gold)] flex items-center justify-between gap-2 transition-colors cursor-pointer text-left"
                    >
                      <span className="font-medium text-[var(--admin-text)]">{ad.queue.pendingReviews}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono border ${
                          pendingReviewsCount > 0
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {pendingReviewsCount}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[var(--admin-muted)]" />
                      </div>
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--admin-border)] flex items-center justify-between text-xs">
                  <span className="text-[var(--admin-muted)] font-medium">{ad.queue.activePromos}:</span>
                  <button
                    type="button"
                    onClick={() => handleTabChange('offers')}
                    className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold font-mono hover:bg-emerald-100 cursor-pointer"
                  >
                    {offers.filter((o) => o.isActive !== false).length} {ad.queue.activeWord}
                  </button>
                </div>
              </div>
            </div>

            {/* Second & Third Charts: Next 30 Days Occupancy + Bookings by Room Type */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Next30DaysOccupancyChart
                  days={dashboardStats?.next30DaysOccupancy || []}
                  totalUnits={totalRoomUnitsCount}
                  language={language}
                />
              </div>
              <div>
                <BookingsByRoomTypeChart
                  breakdown={dashboardStats?.bookingsByRoomType || []}
                  language={language}
                />
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: BOOKINGS */}
        {/* ================================================================= */}
        {activeTab === 'bookings' && (
          <div className="space-y-6 animate-fade-in">
            <div className="admin-card p-5 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 mb-4 border-b border-[var(--admin-border)] gap-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)]">
                      {ad.bookingsTab.title} ({filteredBookings.length})
                    </h3>
                    {attentionBookingsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setBookingAttentionOnly(!bookingAttentionOnly)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                          bookingAttentionOnly
                            ? 'bg-red-700 text-white border border-red-700 shadow-sm'
                            : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
                        }`}
                        title={isKn ? 'ಆತಿಥೇಯರ ಗಮನ ಅಗತ್ಯವಿರುವ ಬುಕಿಂಗ್‌ಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡಿ' : 'Filter bookings that need host attention'}
                      >
                        <Flag className={`w-3 h-3 ${bookingAttentionOnly ? 'text-white' : 'text-red-700'}`} />
                        <span>{ad.bookingsTab.attentionNeeded} ({attentionBookingsCount})</span>
                      </button>
                    )}
                  </div>

                  {/* Compact Filters Bar */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Status Chips */}
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-[var(--admin-muted)] uppercase font-bold tracking-wider mr-1">
                        {ad.bookingsTab.statusLabel}
                      </span>
                      {['all', 'confirmed', 'checked_in', 'checked_out', 'payment_pending', 'cancelled', 'rejected'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setBookingFilterStatus(st)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-colors cursor-pointer ${
                            bookingFilterStatus === st
                              ? 'bg-[#B8964A] text-[#0F2A20] font-bold shadow-sm'
                              : 'bg-[var(--admin-surface-subtle)] text-[var(--admin-text)] border border-[var(--admin-border)] hover:border-[var(--admin-gold)]'
                          }`}
                        >
                          {st === 'all' ? (isKn ? 'ಎಲ್ಲಾ' : 'All') : getLocalizedStatusLabel(st, language)}
                        </button>
                      ))}
                    </div>

                    {/* Payment Chips */}
                    <div className="flex flex-wrap items-center gap-1 sm:pl-2 sm:border-l border-[var(--admin-border)]">
                      <span className="text-[10px] text-[var(--admin-muted)] uppercase font-bold tracking-wider mr-1">
                        {ad.bookingsTab.payLabel}
                      </span>
                      {['all', 'paid', 'partial', 'pending', 'refunded', 'failed'].map((pst) => (
                        <button
                          key={pst}
                          type="button"
                          onClick={() => setPaymentStatusFilter(pst)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-colors cursor-pointer ${
                            paymentStatusFilter === pst
                              ? 'bg-emerald-700 text-white font-bold shadow-sm'
                              : 'bg-[var(--admin-surface-subtle)] text-[var(--admin-text)] border border-[var(--admin-border)] hover:border-emerald-600'
                          }`}
                        >
                          {pst === 'all' ? (isKn ? 'ಎಲ್ಲಾ' : 'All') : getLocalizedStatusLabel(pst, language)}
                        </button>
                      ))}
                    </div>

                    {/* Check-In Date Range Filter */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:pl-2 sm:border-l border-[var(--admin-border)] text-[11px]">
                      <span className="text-[10px] text-[var(--admin-muted)] uppercase font-bold">
                        {ad.bookingsTab.datesLabel}
                      </span>
                      <input
                        type="date"
                        value={bookingFilterDateFrom}
                        onChange={(e) => setBookingFilterDateFrom(e.target.value)}
                        className="rounded-lg px-2 py-0.5 text-[11px]"
                        title={isKn ? 'ಚೆಕ್-ಇನ್ ಆರಂಭ ದಿನಾಂಕ' : 'Filter check-in from'}
                      />
                      <span className="text-[var(--admin-muted)]">-</span>
                      <input
                        type="date"
                        value={bookingFilterDateTo}
                        onChange={(e) => setBookingFilterDateTo(e.target.value)}
                        className="rounded-lg px-2 py-0.5 text-[11px]"
                        title={isKn ? 'ಚೆಕ್-ಇನ್ ಅಂತಿಮ ದಿನಾಂಕ' : 'Filter check-in to'}
                      />
                      {(bookingFilterDateFrom || bookingFilterDateTo || bookingFilterStatus !== 'all' || paymentStatusFilter !== 'all' || bookingAttentionOnly) && (
                        <button
                          type="button"
                          onClick={() => {
                            setBookingFilterStatus('all');
                            setPaymentStatusFilter('all');
                            setBookingFilterDateFrom('');
                            setBookingFilterDateTo('');
                            setBookingAttentionOnly(false);
                          }}
                          className="text-[11px] font-semibold text-[var(--admin-gold-text)] underline ml-1 hover:text-[var(--admin-heading)] cursor-pointer"
                        >
                          {ad.clear}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top Action Buttons (Single Sync button, Manual Booking, Export CSV) */}
                <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="px-3 py-1.5 rounded-xl text-xs admin-btn-outline flex items-center gap-1.5 cursor-pointer"
                    title={isKn ? 'ಡೇಟಾಬೇಸ್‌ನಿಂದ ಬುಕಿಂಗ್‌ಗಳನ್ನು ಸಿಂಕ್ ಮಾಡಿ' : 'Refresh and sync bookings from database'}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>{isRefreshing ? ad.syncing : ad.sync}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalData({
                        roomId: rooms[0]?._id || rooms[0]?.id,
                        guestName: '',
                        phone: '',
                        email: '',
                        checkIn: new Date().toISOString().split('T')[0],
                        checkOut: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
                        adults: 2,
                        totalAmount: rooms[0]?.pricePerNight * 2 || 9000,
                        advancePaid: 0,
                        source: 'admin'
                      });
                      setModalType('manualBooking');
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs admin-btn-secondary flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{ad.bookingsTab.manualBooking}</span>
                  </button>

                  <a
                    href={api.admin.getExportCsvUrl()}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="px-3.5 py-1.5 rounded-xl text-xs admin-btn-primary flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{ad.bookingsTab.exportCsv}</span>
                  </a>
                </div>
              </div>

              {/* Desktop Bookings Table */}
              <div className="hidden sm:block overflow-x-auto rounded-xl border border-[var(--admin-border)]">
                <table className="admin-table text-left text-xs table-auto">
                  <thead className="text-[11px] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-3.5 w-[22%]">{ad.bookingsTab.colGuest}</th>
                      <th className="py-3 px-3.5 w-[18%]">{ad.bookingsTab.colStay}</th>
                      <th className="py-3 px-3.5 w-[20%]">{ad.bookingsTab.colDatesGuests}</th>
                      <th className="py-3 px-3.5 w-[18%]">{ad.bookingsTab.colAmount}</th>
                      <th className="py-3 px-3.5 w-[10%]">{ad.bookingsTab.colStatus}</th>
                      <th className="py-3 px-3.5 w-[12%] text-right">{ad.bookingsTab.colActions}</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--admin-text)]">
                    {filteredBookings.length > 0 ? (
                      filteredBookings.map((b) => {
                        const nightsCount = getNightsCount(b);
                        return (
                          <tr key={b.id || b._id}>
                            {/* 1. Guest */}
                            <td className="py-3 px-3.5 align-top">
                              <span className="font-mono text-[10px] text-[var(--admin-gold-text)] block font-semibold">
                                {b.id || b.bookingCode}
                              </span>
                              <span className="font-semibold text-[var(--admin-heading)] block break-words">
                                {b.guestName || b.guest?.fullName || 'Guest'}
                              </span>
                              <span className="text-[11px] text-[var(--admin-muted)] block font-mono">
                                {b.phone}
                              </span>
                              <span className="text-[10px] text-[var(--admin-muted)] block break-all">
                                {b.email}
                              </span>

                              {/* Attention Flags */}
                              {b.dateChangeRequested && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-red-50 text-red-800 border border-red-200 mt-1 font-semibold" title={b.dateChangeReason}>
                                  <Flag className="w-2.5 h-2.5 text-red-700" />
                                  <span>{isKn ? 'ದಿನಾಂಕ ಸಮಸ್ಯೆ ವಿನಂತಿ' : 'Date problem requested'}</span>
                                </span>
                              )}
                              {b.refundDue > 0 && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-amber-50 text-amber-800 border border-amber-200 mt-1 font-semibold">
                                  <span>{isKn ? 'ಬಾಕಿ ಮರುಪಾವತಿ:' : 'Refund Due:'} {formatINR(b.refundDue)}</span>
                                </span>
                              )}
                              {(b.paymentStatus || '').toLowerCase() === 'failed' && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-red-50 text-red-800 border border-red-200 mt-1 font-semibold">
                                  <span>{isKn ? 'ಪಾವತಿ ವಿಫಲವಾಗಿದೆ' : 'Payment Failed'}</span>
                                </span>
                              )}
                            </td>

                            {/* 2. Stay */}
                            <td className="py-3 px-3.5 align-top">
                              {b.bookingType === 'full_home' ? (
                                <div>
                                  <span className="font-semibold text-[var(--admin-gold-text)] block">
                                    {isKn ? 'ಪೂರ್ಣ ಮನೆ' : 'Full Home'}
                                  </span>
                                  <span className="text-[10px] text-[var(--admin-muted)] block">
                                    {isKn ? 'ಎಲ್ಲಾ 5 ಕೊಠಡಿಗಳು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ' : 'All 5 rooms reserved'}
                                  </span>
                                </div>
                              ) : (
                                <div>
                                  <span className="font-medium text-[var(--admin-heading)] block">
                                    {b.roomName || b.room?.name || 'Standard Room'}
                                  </span>
                                  {b.room?.category && (
                                    <span className="text-[10px] text-[var(--admin-muted)] block">{b.room.category}</span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* 3. Dates & Guests */}
                            <td className="py-3 px-3.5 align-top">
                              <span className="font-medium text-[var(--admin-heading)] block">
                                {formatDisplayDate(b.checkIn)} – {formatDisplayDate(b.checkOut)}
                              </span>
                              <span className="text-[11px] text-[var(--admin-muted)] block">
                                {nightsCount} {nightsCount === 1 ? ad.checkInOut.night : ad.checkInOut.nights} • {b.adults ?? b.guestCount?.adults ?? 2} {isKn ? 'ವಯಸ್ಕರು' : 'adults'}{(b.children || b.guestCount?.children) ? `, ${b.children || b.guestCount?.children} ${isKn ? 'ಮಕ್ಕಳು' : 'child'}` : ''}
                              </span>
                            </td>

                            {/* 4. Amount */}
                            <td className="py-3 px-3.5 align-top">
                              <div className="space-y-0.5 font-mono text-[11px]">
                                <div className="text-[var(--admin-heading)]">
                                  {isKn ? 'ಒಟ್ಟು:' : 'Total:'} <strong className="font-semibold">{formatINR(b.totalAmount || b.pricing?.total)}</strong>
                                </div>
                                <div className="text-emerald-700 font-semibold">
                                  {isKn ? 'ಪಾವತಿ:' : 'Paid:'} {formatINR(b.advancePaid || 0)}
                                </div>
                                <div className="text-[var(--admin-gold-text)] font-bold">
                                  {isKn ? 'ಬಾಕಿ:' : 'Bal:'} {formatINR(b.balanceDue || 0)}
                                </div>
                                <div className="pt-1">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getBookingPaymentBadge(b.paymentStatus)}`}
                                  >
                                    {getLocalizedStatusLabel(b.paymentStatus || 'pending', language)}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* 5. Status */}
                            <td className="py-3 px-3.5 align-top">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getBookingStatusBadge(b.status)}`}
                              >
                                {getLocalizedStatusLabel(b.status || 'confirmed', language)}
                              </span>
                            </td>

                            {/* 6. Actions */}
                            <td className="py-3 px-3.5 align-top text-right">
                              <div className="flex items-center justify-end gap-1 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setModalData(b);
                                    setModalType('bookingDetails');
                                  }}
                                  className="p-1.5 text-[var(--admin-heading)] hover:bg-[#EEF2EA] rounded-lg transition-colors cursor-pointer"
                                  title={isKn ? 'ಪೂರ್ಣ ಬುಕಿಂಗ್ ವಿವರ ನೋಡಿ' : 'View Full Booking Details'}
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {!isPlaceholderPhone(b.phone || b.primaryGuest?.phone) && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenWhatsAppModal(b)}
                                    className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                    title={isKn ? 'ಅತಿಥಿಯ ವಾಟ್ಸಾಪ್‌ಗೆ ಚೆಕ್-ಇನ್ ಪಾಸ್ ಕಳುಹಿಸಿ' : 'Share Official Check-In Pass to Guest WhatsApp'}
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenCantHostModal(b)}
                                  className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                  title={isKn ? 'ಈ ದಿನಾಂಕಗಳಲ್ಲಿ ಆತಿಥ್ಯ ನೀಡಲು ಸಾಧ್ಯವಿಲ್ಲ' : "Can't Host These Dates (Date Problem)"}
                                >
                                  <CalendarX className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenChangeDatesModal(b)}
                                  className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title={isKn ? 'ವಾಸ್ತವ್ಯದ ದಿನಾಂಕಗಳನ್ನು ಬದಲಾಯಿಸಿ' : 'Change Stay Dates'}
                                >
                                  <CalendarCheck className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenCancelRefundModal(b)}
                                  className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title={isKn ? 'ರದ್ದುಮಾಡಿ ಮತ್ತು ಮರುಪಾವತಿಸಿ' : 'Cancel and Refund'}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                {b.balanceDue > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenMarkBalanceModal(b)}
                                    className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                    title={isKn ? 'ಬಾಕಿ ಮೊತ್ತ ಪಾವತಿಯಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ (ನಗದು / UPI)' : 'Mark Balance Received (Cash / UPI)'}
                                  >
                                    <CreditCard className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-[var(--admin-muted)]">
                          {ad.bookingsTab.emptyFilter}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List (< sm / 375px usable, no horizontal scroll) */}
              <div className="block sm:hidden space-y-3">
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((b) => {
                    const nightsCount = getNightsCount(b);
                    return (
                      <div
                        key={b.id || b._id}
                        className="p-3.5 rounded-xl admin-subcard space-y-2.5 text-xs"
                      >
                        {/* Header: Ref + Status */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-[var(--admin-gold-text)]">
                            {b.id || b.bookingCode}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getBookingStatusBadge(b.status)}`}
                          >
                            {getLocalizedStatusLabel(b.status || 'confirmed', language)}
                          </span>
                        </div>

                        {/* Attention Flags if any */}
                        {b.dateChangeRequested && (
                          <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-[10px] text-red-800 flex items-center gap-1.5 font-semibold">
                            <Flag className="w-3 h-3 text-red-700 shrink-0" />
                            <span>{isKn ? 'ದಿನಾಂಕ ಸಮಸ್ಯೆ:' : 'Date problem:'} {b.dateChangeReason || (isKn ? 'ನಿರ್ವಹಣೆ ಹೋಲ್ಡ್' : 'Maintenance hold')}</span>
                          </div>
                        )}
                        {b.refundDue > 0 && (
                          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800 font-semibold">
                            {isKn ? 'ಬಾಕಿ ಮರುಪಾವತಿ:' : 'Refund Due:'} {formatINR(b.refundDue)}
                          </div>
                        )}

                        {/* Guest & Stay */}
                        <div>
                          <span className="font-semibold text-[var(--admin-heading)] block text-sm">
                            {b.guestName || b.guest?.fullName || 'Guest'}
                          </span>
                          <span className="text-[11px] text-[var(--admin-muted)] block break-all">
                            {b.phone} {b.email && `• ${b.email}`}
                          </span>
                          <span className="text-xs text-[var(--admin-gold-text)] font-semibold block mt-1">
                            {b.bookingType === 'full_home'
                              ? (isKn ? 'ಪೂರ್ಣ ಮನೆ (ಎಲ್ಲಾ 5 ಕೊಠಡಿಗಳು)' : 'Full Home (All 5 Rooms)')
                              : (b.roomName || b.room?.name || 'Standard Room')}
                          </span>
                        </div>

                        {/* Dates & Guests */}
                        <div className="p-2.5 rounded-lg bg-white border border-[var(--admin-border)] text-[11px] space-y-0.5">
                          <div className="text-[var(--admin-heading)] font-medium">
                            {formatDisplayDate(b.checkIn)} – {formatDisplayDate(b.checkOut)}
                          </div>
                          <div className="text-[var(--admin-muted)]">
                            {nightsCount} {nightsCount === 1 ? ad.checkInOut.night : ad.checkInOut.nights} • {b.adults ?? b.guestCount?.adults ?? 2} {isKn ? 'ವಯಸ್ಕರು' : 'adults'}{(b.children || b.guestCount?.children) ? `, ${b.children || b.guestCount?.children} ${isKn ? 'ಮಕ್ಕಳು' : 'child'}` : ''}
                          </div>
                        </div>

                        {/* Financials */}
                        <div className="flex items-center justify-between font-mono text-[11px] pt-2 border-t border-[var(--admin-border)] gap-2 flex-wrap">
                          <div>
                            <span className="text-[9px] text-[var(--admin-muted)] block font-sans uppercase">{ad.checkInOut.total}</span>
                            <span className="text-[var(--admin-heading)] font-bold">{formatINR(b.totalAmount || b.pricing?.total)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-[var(--admin-muted)] block font-sans uppercase">{ad.charts.paidWord}</span>
                            <span className="text-emerald-700 font-bold">{formatINR(b.advancePaid || 0)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-[var(--admin-muted)] block font-sans uppercase">{isKn ? 'ಬಾಕಿ' : 'Balance'}</span>
                            <span className="text-[var(--admin-gold-text)] font-bold">{formatINR(b.balanceDue || 0)}</span>
                          </div>
                          <div>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getBookingPaymentBadge(b.paymentStatus)}`}
                            >
                              {getLocalizedStatusLabel(b.paymentStatus || 'pending', language)}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons Row on Mobile */}
                        <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-[var(--admin-border)] flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setModalData(b);
                              setModalType('bookingDetails');
                            }}
                            className="px-2.5 py-1 rounded-lg admin-btn-secondary text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isKn ? 'ವಿವರ' : 'Details'}</span>
                          </button>
                          {!isPlaceholderPhone(b.phone || b.primaryGuest?.phone) && (
                            <button
                              type="button"
                              onClick={() => handleOpenWhatsAppModal(b)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>{isKn ? 'ಪಾಸ್' : 'Pass'}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenCantHostModal(b)}
                            className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-semibold cursor-pointer"
                            title={isKn ? 'ಆತಿಥ್ಯ ನೀಡಲು ಸಾಧ್ಯವಿಲ್ಲ' : "Can't host"}
                          >
                            {isKn ? 'ದಿನಾಂಕ ಸಮಸ್ಯೆ' : "Can't Host"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenChangeDatesModal(b)}
                            className="px-2 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 text-xs font-semibold cursor-pointer"
                            title={isKn ? 'ದಿನಾಂಕ ಬದಲಿಸಿ' : 'Change Dates'}
                          >
                            {isKn ? 'ದಿನಾಂಕ' : 'Dates'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenCancelRefundModal(b)}
                            className="px-2 py-1 rounded-lg bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 text-xs font-semibold cursor-pointer"
                            title={isKn ? 'ರದ್ದು & ಮರುಪಾವತಿ' : 'Cancel & Refund'}
                          >
                            {ad.cancel}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-[var(--admin-muted)] admin-subcard">
                    {ad.bookingsTab.emptyFilter}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: CALENDAR */}
        {/* ================================================================= */}
        {activeTab === 'calendar' && (
          <div className="space-y-6 animate-fade-in">
            <div className="admin-card p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--admin-border)] gap-3 mb-6">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)]">
                    {isKn ? 'ಸಂವಾದಾತ್ಮಕ ಬುಕಿಂಗ್ ಕ್ಯಾಲೆಂಡರ್ ಮತ್ತು ದಿನಾಂಕ ನಿರ್ಬಂಧಕ' : 'Interactive Booking Calendar & Date Blocker'}
                  </h3>
                  <p className="text-xs text-[var(--admin-muted)] mt-0.5">
                    {isKn
                      ? 'ನಿರ್ವಹಣೆಗಾಗಿ ದಿನಾಂಕವನ್ನು ನಿರ್ಬಂಧಿಸಲು ಅಥವಾ ತೆರವುಗೊಳಿಸಲು ಯಾವುದೇ ದಿನದ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ. ಭರ್ತಿಯಾದ ದಿನಾಂಕಗಳನ್ನು ಕೆಂಪು ಬಣ್ಣದಲ್ಲಿ ತೋರಿಸಲಾಗಿದೆ.'
                      : 'Click any day to block or unblock maintenance holds. Occupied dates from guest bookings are highlighted in red.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Room filter for calendar */}
                  <select
                    value={selectedCalendarRoom}
                    onChange={(e) => setSelectedCalendarRoom(e.target.value)}
                    className="rounded-lg px-2.5 py-1.5 text-xs"
                  >
                    <option value="all">{isKn ? 'ಎಲ್ಲಾ ಕೊಠಡಿಗಳು / ಪೂರ್ಣ ಎಸ್ಟೇಟ್' : 'All Rooms / Entire Estate'}</option>
                    {rooms.map(r => (
                      <option key={r.id || r._id} value={r.slug || r.id || r._id}>{r.name}</option>
                    ))}
                  </select>

                  {/* Month Switcher */}
                  <div className="flex items-center gap-1 bg-[var(--admin-surface-subtle)] border border-[var(--admin-input-border)] rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1))}
                      className="p-1 text-[var(--admin-heading)] hover:bg-[#EEF2EA] rounded cursor-pointer"
                      title={isKn ? 'ಹಿಂದಿನ ತಿಂಗಳು' : 'Previous month'}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-semibold px-2 text-[var(--admin-heading)] min-w-28 text-center">
                      {monthName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1))}
                      className="p-1 text-[var(--admin-heading)] hover:bg-[#EEF2EA] rounded cursor-pointer"
                      title={isKn ? 'ಮುಂದಿನ ತಿಂಗಳು' : 'Next month'}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Calendar Legend */}
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-[var(--admin-muted)] mb-4 pb-3 border-b border-[var(--admin-border)]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-white border border-[var(--admin-input-border)]" />
                  <span>{isKn ? 'ಖಾಲಿ (ಎಲ್ಲಾ ಕೊಠಡಿಗಳು ಲಭ್ಯ)' : 'Free (All units available)'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-100 border border-amber-400" />
                  <span>{isKn ? 'ಭಾಗಶಃ (ಕೆಲವು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ)' : 'Partial (Some units booked, rest bookable)'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-red-100 border border-red-400" />
                  <span>{isKn ? 'ಭರ್ತಿ / ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ (0 ಖಾಲಿ)' : 'Full / Booked (0 left)'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rose-100 border border-dashed border-red-500" />
                  <span>{isKn ? 'ಆತಿಥೇಯ ನಿರ್ಬಂಧಿತ' : 'Host Blocked'}</span>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {(() => {
                  const nowTs = Date.now();
                  const inactiveStatuses = new Set(['cancelled', 'rejected', 'expired', 'checked_out']);
                  const selectedRoomObj = selectedCalendarRoom === 'all'
                    ? null
                    : rooms.find(
                        (r) =>
                          r.slug === selectedCalendarRoom ||
                          String(r._id) === String(selectedCalendarRoom) ||
                          String(r.id) === String(selectedCalendarRoom)
                      );
                  const totalUnits = selectedCalendarRoom === 'all'
                    ? Math.max(1, rooms.reduce((sum, r) => sum + (Number(r.totalUnits) || 1), 0))
                    : Math.max(1, Number(selectedRoomObj?.totalUnits) || 1);

                  const normalizeKey = (val) => {
                    if (!val) return '';
                    if (typeof val === 'object') return String(val._id || val.id || val.slug || '').toLowerCase();
                    return String(val).toLowerCase();
                  };

                  const matchesSelectedRoomKey = (rawVal) => {
                    const key = normalizeKey(rawVal);
                    if (!key || !selectedRoomObj) return key === String(selectedCalendarRoom).toLowerCase();
                    const candidates = [
                      selectedRoomObj._id,
                      selectedRoomObj.id,
                      selectedRoomObj.slug
                    ]
                      .filter(Boolean)
                      .map((v) => String(v).toLowerCase());
                    return candidates.includes(key);
                  };

                  return [...Array(daysInMonth)].map((_, i) => {
                    const day = i + 1;
                    const monthNum = (calendarMonth + 1) < 10 ? `0${calendarMonth + 1}` : `${calendarMonth + 1}`;
                    const dayNum = day < 10 ? `0${day}` : `${day}`;
                    const dateStr = `${calendarYear}-${monthNum}-${dayNum}`;

                    // 1. Check Maintenance / Host Blocks
                    const activeDateBlocks = blockedDates.filter((b) => {
                      const startStr = b.date || (b.startDate ? (typeof b.startDate === 'string' ? b.startDate.split('T')[0] : new Date(b.startDate).toISOString().split('T')[0]) : '');
                      const endStr = b.endDate ? (typeof b.endDate === 'string' ? b.endDate.split('T')[0] : new Date(b.endDate).toISOString().split('T')[0]) : startStr;
                      return Boolean(startStr && dateStr >= startStr && dateStr <= (endStr || startStr));
                    });

                    const isEstateBlocked = activeDateBlocks.some((b) => {
                      const k = normalizeKey(b.roomId || b.room || 'all');
                      return k === 'all' || k === '';
                    });

                    const isBlocked = selectedCalendarRoom === 'all'
                      ? isEstateBlocked
                      : isEstateBlocked || activeDateBlocks.some((b) => matchesSelectedRoomKey(b.roomId || b.room));

                    // 2. Count booked/occupied units across active holding bookings only
                    const matchesRoomObj = (rObj, rawVal) => {
                      const key = normalizeKey(rawVal);
                      if (!key || !rObj) return false;
                      return [rObj._id, rObj.id, rObj.slug]
                        .filter(Boolean)
                        .map((v) => String(v).toLowerCase())
                        .includes(key);
                    };

                    const overlappingBookings = bookings.filter((b) => {
                      const st = String(b.status || '').toLowerCase();
                      if (inactiveStatuses.has(st)) return false;
                      if (st === 'payment_pending' && b.holdExpiresAt && new Date(b.holdExpiresAt).getTime() <= nowTs) {
                        return false;
                      }
                      if (Array.isArray(b.nights) && b.nights.length > 0) {
                        return b.nights.some((n) => String(n).split('T')[0] === dateStr);
                      }
                      const inStr = typeof b.checkIn === 'string' ? b.checkIn.split('T')[0] : '';
                      const outStr = typeof b.checkOut === 'string' ? b.checkOut.split('T')[0] : '';
                      return Boolean(inStr && outStr && dateStr >= inStr && dateStr < outStr);
                    });

                    let bookedUnits = 0;
                    if (selectedCalendarRoom === 'all' && Array.isArray(rooms) && rooms.length > 0 && !isBlocked) {
                      const hasFullHome = overlappingBookings.some(
                        (b) => b.bookingType === 'full_home' || String(b.roomSlug || '').toLowerCase() === 'full-home'
                      );
                      if (hasFullHome) {
                        bookedUnits = totalUnits;
                      } else {
                        for (const rm of rooms) {
                          const rmUnits = Number(rm.totalUnits) || 1;
                          const rmBlocked = activeDateBlocks.some((b) => matchesRoomObj(rm, b.roomId || b.room));
                          if (rmBlocked) {
                            bookedUnits += rmUnits;
                            continue;
                          }
                          let rmBooked = 0;
                          for (const b of overlappingBookings) {
                            if (Array.isArray(b.lines) && b.lines.length > 0) {
                              b.lines.forEach((ln) => {
                                if (matchesRoomObj(rm, ln.room || ln.roomId || ln.roomSlug)) {
                                  rmBooked += Number(ln.quantity) || 1;
                                }
                              });
                            } else if (
                              matchesRoomObj(rm, b.roomId || b.roomSlug || b.room) ||
                              (b.room?.slug && matchesRoomObj(rm, b.room.slug))
                            ) {
                              rmBooked += Number(b.quantity) || 1;
                            }
                          }
                          bookedUnits += Math.min(rmUnits, rmBooked);
                        }
                      }
                    } else if (!isBlocked) {
                      for (const b of overlappingBookings) {
                        const isFullHomeBooking = b.bookingType === 'full_home' || String(b.roomSlug || '').toLowerCase() === 'full-home';
                        if (isFullHomeBooking) {
                          bookedUnits += totalUnits;
                        } else if (Array.isArray(b.lines) && b.lines.length > 0) {
                          b.lines.forEach((ln) => {
                            if (selectedCalendarRoom === 'all' || matchesSelectedRoomKey(ln.room || ln.roomId || ln.roomSlug)) {
                              bookedUnits += Number(ln.quantity) || 1;
                            }
                          });
                        } else if (
                          selectedCalendarRoom === 'all' ||
                          matchesSelectedRoomKey(b.roomId || b.roomSlug || b.room) ||
                          (b.room?.slug && matchesSelectedRoomKey(b.room.slug))
                        ) {
                          bookedUnits += Number(b.quantity) || 1;
                        }
                      }
                    }

                    const clampedBooked = Math.min(totalUnits, bookedUnits);
                    const isFullyBooked = !isBlocked && clampedBooked >= totalUnits;
                    const isPartial = !isBlocked && clampedBooked > 0 && clampedBooked < totalUnits;

                    let cardStyle = 'bg-white border-[var(--admin-border)] text-[var(--admin-heading)] hover:border-[var(--admin-gold)] hover:bg-[#FAF8F2]';
                    let badgeLabel = isKn ? 'ಮುಕ್ತ' : 'Free';
                    let subLabel = isKn ? `${totalUnits}/${totalUnits} ಲಭ್ಯ` : `${totalUnits}/${totalUnits} Free`;

                    if (isBlocked) {
                      cardStyle = 'bg-rose-50 border-dashed border-red-400 text-red-900 hover:bg-rose-100';
                      badgeLabel = isKn ? 'ನಿರ್ಬಂಧಿತ' : 'Blocked';
                      subLabel = isKn ? 'ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ (ತೆರೆಯಲು ಕ್ಲಿಕ್ ಮಾಡಿ)' : 'Hold (Click unblock)';
                    } else if (isFullyBooked) {
                      cardStyle = 'bg-red-50 border-red-300 text-red-900 hover:bg-red-100';
                      badgeLabel = isKn ? 'ಭರ್ತಿ' : 'Booked';
                      subLabel = isKn ? `${clampedBooked}/${totalUnits} ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ · ಭರ್ತಿ` : `${clampedBooked}/${totalUnits} Booked · Full`;
                    } else if (isPartial) {
                      const leftCount = totalUnits - clampedBooked;
                      cardStyle = 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100';
                      badgeLabel = isKn ? 'ಭಾಗಶಃ' : 'Partial';
                      subLabel = isKn ? `${clampedBooked}/${totalUnits} ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ · ${leftCount} ಬಾಕಿ` : `${clampedBooked}/${totalUnits} Booked · ${leftCount} Left`;
                    }

                    return (
                      <div
                        key={dateStr}
                        onClick={() => {
                          openConfirm(
                            isBlocked
                              ? (isKn ? 'ನಿರ್ವಹಣೆ ದಿನಾಂಕ ತೆರವುಗೊಳಿಸಿ' : 'Unblock Maintenance Date')
                              : (isKn ? 'ನಿರ್ವಹಣೆ ದಿನಾಂಕ ನಿರ್ಬಂಧಿಸಿ' : 'Block Maintenance Date'),
                            isBlocked
                              ? (isKn ? `${selectedCalendarRoom} ಗಾಗಿ ${dateStr} ದಿನಾಂಕವನ್ನು ತೆರವುಗೊಳಿಸಲು ಖಚಿತವೇ?` : `Are you sure you want to unblock ${dateStr} for ${selectedCalendarRoom}?`)
                              : (isKn ? `${dateStr} (${selectedCalendarRoom}) ದಿನಾಂಕವನ್ನು ನಿರ್ವಹಣೆಗಾಗಿ ನಿರ್ಬಂಧಿಸುವುದೇ?` : `Block ${dateStr} (${selectedCalendarRoom}) for maintenance or personal hold?`),
                            () => toggleBlockDate(dateStr, selectedCalendarRoom, 'Maintenance Hold')
                          );
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${cardStyle}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-sm font-bold">{day}</span>
                          <span className="text-[10px] uppercase font-bold">
                            {badgeLabel}
                          </span>
                        </div>
                        <span className="text-[10px] opacity-90 font-medium block truncate">
                          {subLabel}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: ROOMS */}
        {/* ================================================================= */}
        {activeTab === 'rooms' && (
          <div className="space-y-6 animate-fade-in">
            <div className="admin-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--admin-border)]">
                <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)]">
                  {isKn ? `ವಸತಿ ಮತ್ತು ಕೊಠಡಿ ದರಗಳು (${rooms.length})` : `Accommodations & Room Pricing (${rooms.length})`}
                </h3>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalData({
                        name: '',
                        slug: '',
                        category: 'Cottage',
                        pricePerNight: 4500,
                        weekendPrice: 5500,
                        maxAdults: 2,
                        maxChildren: 1,
                        maxGuests: 3,
                        description: '',
                        view: 'Coffee Plantation View',
                        bedLayout: ''
                      });
                      setModalType('addRoom');
                    }}
                    className="px-3.5 py-1.5 rounded-xl admin-btn-primary text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isKn ? 'ಕೊಠಡಿ ಸೇರಿಸಿ' : 'Add Room'}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {rooms.map((room) => {
                  const rKey = room._id || room.id;
                  const draft = roomTariffDrafts[rKey];
                  const draftWeekday = draft?.pricePerNight ?? (room.pricePerNight ?? room.price ?? 0);
                  const draftWeekend = draft?.weekendPrice ?? (room.weekendPrice ?? room.pricePerNight ?? room.price ?? 0);
                  const currentWeekday = Number(room.pricePerNight ?? room.price ?? 0);
                  const currentWeekend = Number(room.weekendPrice ?? room.pricePerNight ?? room.price ?? 0);
                  const isDirty = Number(draftWeekday) !== currentWeekday || Number(draftWeekend) !== currentWeekend;
                  const saveDraftTariff = async () => {
                    const nextWeekday = Math.max(0, Number(draftWeekday) || 0);
                    const nextWeekend = Math.max(0, Number(draftWeekend) || 0);
                    if (nextWeekday === currentWeekday && nextWeekend === currentWeekend) return;
                    setRoomTariffDrafts((prev) => ({
                      ...prev,
                      [rKey]: { pricePerNight: nextWeekday, weekendPrice: nextWeekend, saving: true }
                    }));
                    await updateRoom({
                      ...room,
                      pricePerNight: nextWeekday,
                      price: nextWeekday,
                      weekendPrice: nextWeekend
                    });
                    setRoomTariffDrafts((prev) => {
                      const copy = { ...prev };
                      const currentDraft = copy[rKey];
                      if (
                        currentDraft &&
                        Number(currentDraft.pricePerNight) === nextWeekday &&
                        Number(currentDraft.weekendPrice) === nextWeekend
                      ) {
                        delete copy[rKey];
                      } else if (currentDraft) {
                        copy[rKey] = { ...currentDraft, saving: false };
                      }
                      return copy;
                    });
                  };

                  return (
                  <div key={rKey} data-room-card={rKey} className="p-5 rounded-[14px] admin-subcard space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-serif text-xl font-semibold text-[var(--admin-heading)]">{room.name}</h4>
                        <span className="text-[11px] text-[var(--admin-muted)]">{room.bedLayout || room.bed}</span>
                      </div>
                      <span className="text-xs uppercase font-bold text-[var(--admin-heading)] bg-[#EEF2EA] border border-[var(--admin-border)] px-2.5 py-1 rounded-lg">
                        {room.category}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--admin-muted)] leading-relaxed">{room.description}</p>

                    <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
                      <span className="px-2.5 py-0.5 rounded-full bg-[var(--admin-gold-soft)] text-[var(--admin-gold-text)] border border-[#E6D5A7]">
                        {getRoomUnitsCount(room) === 1
                          ? (isKn ? '1 ಕೊಠಡಿ' : '1 Room')
                          : (isKn ? `${getRoomUnitsCount(room)} ಕೊಠಡಿಗಳು` : `${getRoomUnitsCount(room)} Rooms`)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white text-[var(--admin-heading)] border border-[var(--admin-border)]">
                        {Number(room.maxAdults || 2)} {isKn ? 'ವಯಸ್ಕರು' : 'Adults'}{Number(room.maxChildren ?? 0) > 0 ? ` + ${Number(room.maxChildren)} ${isKn ? 'ಮಕ್ಕಳು' : (Number(room.maxChildren) === 1 ? 'Child' : 'Children')}` : ''}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white text-[var(--admin-muted)] border border-[var(--admin-border)]">
                        {getRoomBalcony(room) ? (isKn ? 'ಬಾಲ್ಕನಿ ಸೌಲಭ್ಯ' : 'Balcony facing') : (isKn ? 'ಬಾಲ್ಕನಿ ಇಲ್ಲ' : 'No balcony')}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {room.mealsIncluded || (isKn ? 'ಬೆಳಗಿನ ಉಪಾಹಾರ' : 'Morning breakfast')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                      <div>
                        <label className="text-[var(--admin-heading)] font-semibold block mb-1">
                          {isKn ? 'ವಾರದ ದಿನಗಳ ದರ (₹)' : 'Weekday Tariff (₹)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={draftWeekday}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRoomTariffDrafts((prev) => ({
                              ...prev,
                              [rKey]: {
                                pricePerNight: val === '' ? '' : Number(val),
                                weekendPrice: prev[rKey]?.weekendPrice ?? currentWeekend
                              }
                            }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              saveDraftTariff();
                            }
                          }}
                          onBlur={(e) => {
                            if (e.relatedTarget && e.currentTarget.closest('[data-room-card]')?.contains(e.relatedTarget)) {
                              return;
                            }
                            if (draft && draftWeekday !== '' && isDirty) {
                              saveDraftTariff();
                            }
                          }}
                          className="w-full rounded-lg px-2.5 py-1.5 font-mono font-bold text-[var(--admin-heading)]"
                        />
                      </div>
                      <div>
                        <label className="text-[var(--admin-heading)] font-semibold block mb-1">
                          {isKn ? 'ವಾರಾಂತ್ಯ ದರ (₹)' : 'Weekend Tariff (₹)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={draftWeekend}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRoomTariffDrafts((prev) => ({
                              ...prev,
                              [rKey]: {
                                pricePerNight: prev[rKey]?.pricePerNight ?? currentWeekday,
                                weekendPrice: val === '' ? '' : Number(val)
                              }
                            }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              saveDraftTariff();
                            }
                          }}
                          onBlur={(e) => {
                            if (e.relatedTarget && e.currentTarget.closest('[data-room-card]')?.contains(e.relatedTarget)) {
                              return;
                            }
                            if (draft && draftWeekend !== '' && isDirty) {
                              saveDraftTariff();
                            }
                          }}
                          className="w-full rounded-lg px-2.5 py-1.5 font-mono font-bold text-[var(--admin-heading)]"
                        />
                      </div>
                    </div>

                    {isDirty && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] font-semibold text-amber-800">
                          {isKn ? 'ಉಳಿಸದ ದರ ಬದಲಾವಣೆ' : 'Unsaved tariff change'}
                        </span>
                        <button
                          type="button"
                          disabled={draft?.saving}
                          onClick={saveDraftTariff}
                          className="px-3 py-1 rounded-lg admin-btn-primary text-[11px] cursor-pointer disabled:opacity-60"
                        >
                          {draft?.saving ? (isKn ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'Saving...') : (isKn ? 'ದರ ಉಳಿಸಿ' : 'Save Tariff')}
                        </button>
                      </div>
                    )}

                    {isAdmin && (
                      <div className="flex justify-end pt-2.5 gap-4 border-t border-[var(--admin-border)]">
                        <button
                          type="button"
                          onClick={() => {
                            setModalData({
                              _id: room._id || room.id,
                              id: room.id || room._id,
                              name: room.name || '',
                              category: room.category || 'Cottage',
                              pricePerNight: room.pricePerNight || room.price || 4500,
                              weekendPrice: room.weekendPrice || 5500,
                              maxAdults: room.maxAdults || 2,
                              maxChildren: room.maxChildren ?? 1,
                              maxGuests: room.maxGuests || 3,
                              totalUnits: room.totalUnits || 1,
                              hasBalcony: room.hasBalcony !== false,
                              mealsIncluded: room.mealsIncluded || 'Morning breakfast',
                              description: room.description || '',
                              view: room.view || '',
                              bedLayout: room.bedLayout || room.bed || '',
                              image: room.image || (Array.isArray(room.images) && room.images.length > 0 ? (typeof room.images[0] === 'string' ? room.images[0] : room.images[0]?.url) : ''),
                              images: room.images || [],
                              isEdit: true
                            });
                            setModalType('roomModal');
                          }}
                          className="text-xs font-semibold text-[var(--admin-heading)] hover:text-[var(--admin-gold-text)] flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>{isKn ? 'ವಿವರ ತಿದ್ದಿ' : 'Edit Details'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            openConfirm(
                              isKn ? 'ಕೊಠಡಿ ಅಳಿಸಿ' : 'Delete Room',
                              isKn ? `'${room.name}' ಕೊಠಡಿಯನ್ನು ಅಳಿಸುವುದೇ?` : `Delete room '${room.name}'?`,
                              () => deleteRoom(room._id || room.id)
                            );
                          }}
                          className="text-xs font-semibold text-red-700 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isKn ? 'ಕೊಠಡಿ ಅಳಿಸಿ' : 'Remove Room'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: PACKAGES & INCLUSIONS */}
        {/* ================================================================= */}
        {activeTab === 'packages' && (
          <div className="space-y-6 animate-fade-in">
            {/* Packages Subtabs Navigation */}
            <div className="flex flex-wrap gap-2 pb-3 border-b border-[var(--admin-border)]">
              <button
                type="button"
                onClick={() => setPackagesSubTab('packages')}
                className={`px-4 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                  packagesSubTab === 'packages'
                    ? 'admin-btn-primary shadow-sm'
                    : 'admin-btn-outline'
                }`}
              >
                {isKn ? `ವಿಶೇಷ ವಾಸ್ತವ್ಯ ಪ್ಯಾಕೇಜ್‌ಗಳು (${packages.length})` : `Curated Stay Packages (${packages.length})`}
              </button>
              <button
                type="button"
                onClick={() => setPackagesSubTab('inclusions')}
                className={`px-4 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                  packagesSubTab === 'inclusions'
                    ? 'admin-btn-primary shadow-sm'
                    : 'admin-btn-outline'
                }`}
              >
                {isKn ? `ಒಳಗೊಂಡಿರುವ ಮತ್ತು ಒಳಗೊಳ್ಳದ ಸೇವೆಗಳು (${inclusions?.length || 0})` : `What's Included & Not Included (${inclusions?.length || 0})`}
              </button>
            </div>

            {/* SUBTAB 1: CURATED PACKAGES */}
            {packagesSubTab === 'packages' && (
              <div className="admin-card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--admin-border)]">
                  <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)]">
                    {isKn ? `ವಿಶೇಷ ವಾಸ್ತವ್ಯ ಪ್ಯಾಕೇಜ್‌ಗಳು (${packages.length})` : `Curated Stay Packages (${packages.length})`}
                  </h3>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setModalData({
                          title: '',
                          slug: '',
                          price: '',
                          discount: '',
                          durationLabel: 'Per Night',
                          idealFor: '',
                          description: '',
                          image: '/images/realimage/homeimage.jpeg',
                          inclusions: 'Choose any room (Standard, Suite, or Single)\nMorning breakfast included\nHigh-Speed Wi-Fi & Parking Facility\nEvening Campfire Gathering\nEstate Walk',
                          isEdit: false
                        });
                        setModalType('packageModal');
                      }}
                      className="px-3.5 py-1.5 rounded-xl admin-btn-primary text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isKn ? 'ಪ್ಯಾಕೇಜ್ ಸೇರಿಸಿ' : 'Add Package'}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packages.map((pkg, pkgIdx) => {
                    const lowestRoomPriceVal = getLowestRoomPrice(rooms);
                    const standardRoomPriceVal = getStandardRoomPrice(rooms);
                    const priceMeta = getPackagePriceMeta(pkg, {
                      lowestRoomPrice: lowestRoomPriceVal,
                      standardRoomPrice: standardRoomPriceVal,
                      entireHomestayPrice: Number(resolvedFullHomePrice || 42000),
                      isKn
                    });
                    const priceLabel = priceMeta.amountText;

                    return (
                      <div
                        key={pkg.id || pkg._id || pkgIdx}
                        className={`p-4 rounded-xl border space-y-2.5 transition-colors ${
                          pkg.isActive === false
                            ? 'bg-red-50/50 border-red-200 opacity-85'
                            : 'bg-[var(--admin-surface-subtle)] border-[var(--admin-border)]'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-serif text-base font-semibold text-[var(--admin-heading)]">{pkg.title}</h4>
                              {pkg.discount && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                                  {pkg.discount}
                                </span>
                              )}
                              {pkg.isActive === false && (
                                <span className="text-[10px] uppercase tracking-wider bg-red-50 text-red-800 border border-red-200 font-semibold px-2 py-0.5 rounded-full">
                                  {isKn ? 'ಮರೆಮಾಡಲಾಗಿದೆ' : 'Hidden'}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-medium text-[var(--admin-gold-text)] block mt-0.5">
                              {pkg.durationLabel || pkg.duration || 'Per Night'} {pkg.idealFor ? `· ${pkg.idealFor}` : ''}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-bold text-[var(--admin-heading)] bg-[#EEF2EA] border border-[var(--admin-border)] px-2.5 py-1 rounded-lg flex-shrink-0">
                            {priceLabel}
                          </span>
                        </div>

                        <p className="text-xs text-[var(--admin-muted)] leading-relaxed">{pkg.description}</p>

                        {/* Inclusions summary */}
                        {Array.isArray(pkg.inclusions) && pkg.inclusions.length > 0 && (
                          <div className="text-[11px] text-[var(--admin-muted)] line-clamp-2">
                            <span className="text-[var(--admin-heading)] font-semibold">
                              {isKn ? 'ಒಳಗೊಂಡಿರುವುದು: ' : 'Inclusions: '}
                            </span>
                            {pkg.inclusions.join(' • ')}
                          </div>
                        )}

                        {pkg.isSample && (
                          <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono inline-block">
                            {isKn ? '[ಮಾದರಿ ಮೌಲ್ಯ, ಪರಿಶೀಲಿಸಿ]' : '[Sample value, please verify]'}
                          </div>
                        )}

                        {isAdmin && (
                          <div className="flex items-center justify-between pt-2 border-t border-[var(--admin-border)] gap-2">
                            <div className="flex items-center gap-1">
                              {/* Reorder Up */}
                              <button
                                type="button"
                                disabled={pkgIdx === 0}
                                onClick={() => {
                                  if (pkgIdx > 0) {
                                    const updated = [...packages];
                                    const temp = updated[pkgIdx - 1];
                                    updated[pkgIdx - 1] = updated[pkgIdx];
                                    updated[pkgIdx] = temp;
                                    updatePackage(pkg._id || pkg.id, { displayOrder: pkgIdx - 1 });
                                  }
                                }}
                                className="p-1 text-[var(--admin-muted)] hover:text-[var(--admin-heading)] disabled:opacity-25 rounded hover:bg-[#EEF2EA] cursor-pointer"
                                title={isKn ? 'ಮೇಲೆ ಸರಿಸಿ' : 'Move Package Up'}
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              {/* Reorder Down */}
                              <button
                                type="button"
                                disabled={pkgIdx === packages.length - 1}
                                onClick={() => {
                                  if (pkgIdx < packages.length - 1) {
                                    const updated = [...packages];
                                    const temp = updated[pkgIdx + 1];
                                    updated[pkgIdx + 1] = updated[pkgIdx];
                                    updated[pkgIdx] = temp;
                                    updatePackage(pkg._id || pkg.id, { displayOrder: pkgIdx + 1 });
                                  }
                                }}
                                className="p-1 text-[var(--admin-muted)] hover:text-[var(--admin-heading)] disabled:opacity-25 rounded hover:bg-[#EEF2EA] cursor-pointer"
                                title={isKn ? 'ಕೆಳಗೆ ಸರಿಸಿ' : 'Move Package Down'}
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              {/* Toggle Show / Hide */}
                              <button
                                type="button"
                                onClick={() => updatePackage(pkg._id || pkg.id, { isActive: pkg.isActive === false ? true : false })}
                                className="p-1 text-[var(--admin-muted)] hover:text-[var(--admin-heading)] rounded hover:bg-[#EEF2EA] cursor-pointer"
                                title={pkg.isActive === false ? (isKn ? 'ಪ್ಯಾಕೇಜ್ ತೋರಿಸಿ' : 'Show Package') : (isKn ? 'ಪ್ಯಾಕೇಜ್ ಮರೆಮಾಡಿ' : 'Hide Package')}
                              >
                                {pkg.isActive === false ? <EyeOff className="w-3.5 h-3.5 text-amber-700" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setModalData({
                                    _id: pkg._id || pkg.id,
                                    id: pkg.id || pkg._id,
                                    title: pkg.title || '',
                                    slug: pkg.slug || '',
                                    price: pkg.price !== null && pkg.price !== undefined ? pkg.price : '',
                                    discount: pkg.discount || '',
                                    durationLabel: pkg.durationLabel || pkg.duration || 'Per Night',
                                    idealFor: pkg.idealFor || '',
                                    description: pkg.description || '',
                                    inclusions: Array.isArray(pkg.inclusions) ? pkg.inclusions.join('\n') : (pkg.inclusions || ''),
                                    image: pkg.image || '/images/realimage/homeimage.jpeg',
                                    isEdit: true
                                  });
                                  setModalType('packageModal');
                                }}
                                className="text-xs font-semibold text-[var(--admin-heading)] hover:text-[var(--admin-gold-text)] flex items-center gap-1 cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>{ad.edit}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openConfirm(
                                  isKn ? 'ಪ್ಯಾಕೇಜ್ ಅಳಿಸಿ' : 'Delete Package',
                                  isKn ? `'${pkg.title}' ಪ್ಯಾಕೇಜ್ ಅನ್ನು ಅಳಿಸುವುದೇ?` : `Delete package '${pkg.title}'?`,
                                  () => deletePackage(pkg._id || pkg.id)
                                )}
                                className="text-xs font-semibold text-red-700 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{ad.delete}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUBTAB 2: WHAT'S INCLUDED & NOT INCLUDED */}
            {packagesSubTab === 'inclusions' && (
              <div className="space-y-6">
                {!isAdmin && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2 font-medium">
                    <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>
                      {isKn
                        ? 'ಸಿಬ್ಬಂದಿ ಖಾತೆಯು ವೀಕ್ಷಣೆಗೆ ಮಾತ್ರ ಸೀಮಿತವಾಗಿದೆ. ಬದಲಾವಣೆಗಳಿಗೆ ನಿರ್ವಾಹಕರ ಅನುಮತಿ ಅಗತ್ಯ.'
                        : 'Staff role is view-only. Modifications to stay inclusions are restricted to Administrators.'}
                    </span>
                  </div>
                )}

                <div className="admin-card p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[var(--admin-border)] gap-3">
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)]">
                        {isKn ? 'ಒಳಗೊಂಡಿರುವ ಮತ್ತು ಒಳಗೊಳ್ಳದ ಸೇವೆಗಳು' : "What's Included & Not Included"}
                      </h3>
                      <p className="text-xs text-[var(--admin-muted)] mt-0.5">
                        {isKn
                          ? 'ವಾಸ್ತವ್ಯ ಸೌಲಭ್ಯಗಳು, ಹೆಚ್ಚುವರಿ ಆಹಾರ ಮಾಹಿತಿ ಮತ್ತು ಅತಿಥಿ ನಿಯಮಗಳನ್ನು ನಿರ್ವಹಿಸಿ.'
                          : 'Manage transparent stay inclusions, extra meal disclaimers, and guest expectations.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setModalData({
                              type: 'include',
                              titleEn: '',
                              titleKn: '',
                              noteEn: '',
                              noteKn: '',
                              icon: 'Check',
                              displayOrder: (inclusions?.length || 0) + 1,
                              isActive: true
                            });
                            setModalType('inclusionModal');
                          }}
                          className="px-3.5 py-1.5 rounded-xl admin-btn-primary text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{isKn ? 'ಅಂಶ ಸೇರಿಸಿ' : 'Add Item'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setInclusionFilter('all')}
                      className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                        inclusionFilter === 'all'
                          ? 'bg-[#B8964A] text-[#0F2A20] shadow-sm'
                          : 'bg-[var(--admin-surface-subtle)] text-[var(--admin-text)] border border-[var(--admin-border)] hover:border-[var(--admin-gold)]'
                      }`}
                    >
                      {isKn ? `ಎಲ್ಲಾ (${inclusions?.length || 0})` : `All (${inclusions?.length || 0})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInclusionFilter('include')}
                      className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                        inclusionFilter === 'include'
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'bg-[var(--admin-surface-subtle)] text-[var(--admin-text)] border border-[var(--admin-border)] hover:border-emerald-600'
                      }`}
                    >
                      {isKn
                        ? `ಒಳಗೊಂಡಿದೆ (${inclusions?.filter((i) => i.type === 'include').length || 0})`
                        : `Included (${inclusions?.filter((i) => i.type === 'include').length || 0})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInclusionFilter('exclude')}
                      className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                        inclusionFilter === 'exclude'
                          ? 'bg-[#A8654A] text-white shadow-sm'
                          : 'bg-[var(--admin-surface-subtle)] text-[var(--admin-text)] border border-[var(--admin-border)] hover:border-[#A8654A]'
                      }`}
                    >
                      {isKn
                        ? `ಒಳಗೊಂಡಿಲ್ಲ (${inclusions?.filter((i) => i.type === 'exclude').length || 0})`
                        : `Not Included (${inclusions?.filter((i) => i.type === 'exclude').length || 0})`}
                    </button>
                  </div>

                  {/* Table / List */}
                  <div className="space-y-2.5">
                    {(inclusions || [])
                      .filter((item) => {
                        if (inclusionFilter === 'include') return item.type === 'include';
                        if (inclusionFilter === 'exclude') return item.type === 'exclude';
                        return true;
                      })
                      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                      .map((item, idx, arr) => {
                        const isInclude = item.type === 'include';
                        const titleEn = typeof item.title === 'object' ? item.title.en : item.title;
                        const titleKn = typeof item.title === 'object' ? item.title.kn : '';
                        const noteEn = typeof item.note === 'object' ? item.note?.en : item.note;
                        const noteKn = typeof item.note === 'object' ? item.note?.kn : '';

                        return (
                          <div
                            key={item._id || item.id}
                            className="p-3.5 rounded-xl admin-subcard flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-start md:items-center gap-3 min-w-0 flex-1">
                              {/* Reorder Arrows (Admin only) */}
                              {isAdmin && (
                                <div className="flex flex-col gap-0.5 flex-shrink-0">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveInclusion(idx, 'up')}
                                    className="p-1 rounded text-[var(--admin-muted)] hover:text-[var(--admin-heading)] disabled:opacity-25 hover:bg-[#EEF2EA] cursor-pointer"
                                    title={isKn ? 'ಮೇಲೆ ಸರಿಸಿ' : 'Move up'}
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === arr.length - 1}
                                    onClick={() => handleMoveInclusion(idx, 'down')}
                                    className="p-1 rounded text-[var(--admin-muted)] hover:text-[var(--admin-heading)] disabled:opacity-25 hover:bg-[#EEF2EA] cursor-pointer"
                                    title={isKn ? 'ಕೆಳಗೆ ಸರಿಸಿ' : 'Move down'}
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}

                              {/* Icon Badge */}
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                                  isInclude
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-amber-50 border-amber-200 text-[#A8654A]'
                                }`}
                              >
                                <InclusionIcon icon={item.icon} className="w-4 h-4" />
                              </div>

                              {/* Title, Kannada, Notes & Badges */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-[var(--admin-heading)] text-sm">
                                    {titleEn}
                                  </span>
                                  {titleKn && (
                                    <span className="text-[var(--admin-muted)] text-xs font-kannada">
                                      ({titleKn})
                                    </span>
                                  )}
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                      isInclude
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                                    }`}
                                  >
                                    {isInclude ? (isKn ? 'ಒಳಗೊಂಡಿದೆ' : 'Included') : (isKn ? 'ಒಳಗೊಂಡಿಲ್ಲ' : 'Not Included')}
                                  </span>
                                  {item.isSample && (
                                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                                      {isKn ? 'ಮಾದರಿ ಮೌಲ್ಯ, ಪರಿಶೀಲಿಸಿ' : 'Sample value, please verify'}
                                    </span>
                                  )}
                                </div>

                                {(noteEn || noteKn) && (
                                  <div className="text-[var(--admin-muted)] text-[11px] mt-1 italic">
                                    <span>{noteEn}</span>
                                    {noteKn && <span className="ml-1 text-[10px] not-italic">({noteKn})</span>}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions Right Column */}
                            <div className="flex items-center gap-2.5 self-end md:self-center flex-shrink-0 pt-2 md:pt-0 border-t md:border-0 border-[var(--admin-border)]">
                              {/* Order number */}
                              <span className="font-mono text-[11px] text-[var(--admin-heading)] px-2 py-0.5 bg-white rounded border border-[var(--admin-border)] font-semibold">
                                #{item.displayOrder || idx + 1}
                              </span>

                              {/* Active Status Badge / Toggle */}
                              {isAdmin ? (
                                <button
                                  type="button"
                                  onClick={() => toggleInclusionItem(item._id || item.id)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold cursor-pointer border transition-colors ${
                                    item.isActive !== false
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                      : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                                  }`}
                                  title={isKn ? 'ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಗೋಚರತೆ ಬದಲಿಸಿ' : 'Toggle visibility on website'}
                                >
                                  {item.isActive !== false ? (isKn ? 'ಸಕ್ರಿಯ' : 'Active') : (isKn ? 'ಮರೆಮಾಡಲಾಗಿದೆ' : 'Hidden')}
                                </button>
                              ) : (
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                                    item.isActive !== false
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : 'bg-red-50 text-red-800 border-red-200'
                                  }`}
                                >
                                  {item.isActive !== false ? (isKn ? 'ಸಕ್ರಿಯ' : 'Active') : (isKn ? 'ಮರೆಮಾಡಲಾಗಿದೆ' : 'Hidden')}
                                </span>
                              )}

                              {/* Edit Button */}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setModalData({
                                      _id: item._id,
                                      id: item.id || item._id,
                                      type: item.type || 'include',
                                      titleEn: titleEn || '',
                                      titleKn: titleKn || '',
                                      noteEn: noteEn || '',
                                      noteKn: noteKn || '',
                                      icon: item.icon || 'Check',
                                      displayOrder: item.displayOrder || idx + 1,
                                      isActive: item.isActive !== false,
                                      isSample: false
                                    });
                                    setModalType('inclusionModal');
                                  }}
                                  className="p-1.5 text-[var(--admin-heading)] hover:bg-[#EEF2EA] rounded-lg cursor-pointer"
                                  title={ad.edit}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Delete Button */}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openConfirm(
                                      isKn ? 'ಸೇವಾ ಅಂಶ ಅಳಿಸಿ' : 'Delete Inclusion Item',
                                      isKn ? `"${titleEn}" ಅನ್ನು ಅಳಿಸುವುದೇ?` : `Delete "${titleEn}"?`,
                                      () => deleteInclusionItem(item._id || item.id)
                                    )
                                  }
                                  className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                                  title={ad.delete}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 6: EXPERIENCES */}
        {activeTab === 'experiences' && (
          <div className="space-y-6 animate-fade-in">
            <div className="admin-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--admin-border)]">
                <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)]">
                  {isKn ? `ಎಸ್ಟೇಟ್ ಅನುಭವಗಳು (${experiences.length})` : `Estate Experiences (${experiences.length})`}
                </h3>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalData({
                        title: '',
                        category: '',
                        duration: '',
                        distance: '',
                        description: '',
                        image: '/images/realimage/real13.jpeg',
                        isEdit: false
                      });
                      setModalType('experienceModal');
                    }}
                    className="px-3.5 py-1.5 rounded-xl admin-btn-primary text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isKn ? 'ಅನುಭವ ಸೇರಿಸಿ' : 'Add Experience'}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {experiences.map((exp) => (
                  <div key={exp.id || exp._id} className="p-4 rounded-xl admin-subcard space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-serif text-base font-semibold text-[var(--admin-heading)]">{exp.title}</h4>
                      <span className="text-[10px] uppercase font-bold text-[var(--admin-heading)] px-2.5 py-0.5 rounded-full bg-[#EEF2EA] border border-[var(--admin-border)]">
                        {exp.category}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-[var(--admin-gold-text)] block">
                      {exp.durationLabel || exp.duration} · {exp.distanceLabel || exp.distance}
                    </span>
                    <p className="text-xs text-[var(--admin-muted)] leading-relaxed">{exp.description}</p>
                    {isAdmin && (
                      <div className="flex justify-end pt-2 border-t border-[var(--admin-border)] gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setModalData({
                              _id: exp._id || exp.id,
                              id: exp.id || exp._id,
                              title: exp.title || '',
                              category: exp.category || '',
                              duration: exp.duration || exp.durationLabel || '',
                              durationLabel: exp.durationLabel || exp.duration || '',
                              distance: exp.distance || exp.distanceLabel || '',
                              distanceLabel: exp.distanceLabel || exp.distance || '',
                              description: exp.description || '',
                              image: exp.image || '',
                              isEdit: true
                            });
                            setModalType('experienceModal');
                          }}
                          className="text-xs font-semibold text-[var(--admin-heading)] hover:text-[var(--admin-gold-text)] flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>{isKn ? 'ತಿದ್ದಿ' : 'Edit Experience'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openConfirm(
                            isKn ? 'ಅನುಭವ ಅಳಿಸಿ' : 'Delete Experience',
                            isKn ? `'${exp.title}' ಅನುಭವವನ್ನು ಅಳಿಸುವುದೇ?` : `Delete experience '${exp.title}'?`,
                            () => deleteExperience(exp._id || exp.id)
                          )}
                          className="text-xs font-semibold text-red-700 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{ad.delete}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 7: DINING MENU & CONTENT */}
        {activeTab === 'dining' && (
          <div className="space-y-6 animate-fade-in">
            {/* View-Only Banner for Staff */}
            {!isAdmin && (
              <div className="bg-amber-50 border border-amber-200 rounded-[14px] p-4 text-xs text-amber-900 flex items-center gap-3 shadow-sm">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-700" />
                <div>
                  <span className="font-bold block">{isKn ? 'ಸಿಬ್ಬಂದಿ ಮೋಡ್ (ವೀಕ್ಷಣೆಗೆ ಮಾತ್ರ)' : 'Staff Mode (View Only)'}</span>
                  <span className="text-amber-800">
                    {isKn
                      ? 'ನೀವು ಎಲ್ಲಾ ಊಟದ ವಿಭಾಗಗಳು, ಭಕ್ಷ್ಯಗಳು ಮತ್ತು ಸಮಯಗಳನ್ನು ವೀಕ್ಷಿಸಬಹುದು. ಬದಲಾವಣೆಗಳಿಗೆ ನಿರ್ವಾಹಕರ ಅನುಮತಿ ಅಗತ್ಯ.'
                      : 'You can view all dining categories, dishes, and meal timings. Modifying menu items or content requires administrator privileges.'}
                  </span>
                </div>
              </div>
            )}

            {/* Sub-Tab Navigation */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[var(--admin-border)] pb-3">
              <button
                type="button"
                onClick={() => setDiningSubTab('menu')}
                className={`px-4 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                  diningSubTab === 'menu'
                    ? 'admin-btn-primary shadow-sm'
                    : 'admin-btn-outline'
                }`}
              >
                {isKn ? 'ಮೆನು ವಿಭಾಗಗಳು ಮತ್ತು ಭಕ್ಷ್ಯಗಳು' : 'Menu Categories & Dishes'}
              </button>
              <button
                type="button"
                onClick={() => setDiningSubTab('timings')}
                className={`px-4 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                  diningSubTab === 'timings'
                    ? 'admin-btn-primary shadow-sm'
                    : 'admin-btn-outline'
                }`}
              >
                {isKn ? 'ಊಟದ ವೇಳಾಪಟ್ಟಿ ಮತ್ತು ಸಮಯ' : 'Meal Schedules & Timings'}
              </button>
              <button
                type="button"
                onClick={() => setDiningSubTab('content')}
                className={`px-4 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                  diningSubTab === 'content'
                    ? 'admin-btn-primary shadow-sm'
                    : 'admin-btn-outline'
                }`}
              >
                {isKn ? 'ಹೀರೋ ಮತ್ತು ವಿಭಾಗದ ಪಠ್ಯ' : 'Hero & Section Content'}
              </button>
            </div>

            {/* SUBTAB 1: MENU CATEGORIES & DISHES */}
            {diningSubTab === 'menu' && (
              <div className="admin-card p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[var(--admin-border)] gap-3">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)]">
                      {isKn ? 'ಊಟದ ಮೆನು ಮತ್ತು ವಿಭಾಗಗಳು' : 'Dining Menu & Categories'}
                    </h3>
                    <p className="text-xs text-[var(--admin-muted)] mt-0.5">
                      {isKn
                        ? 'ದ್ವಿಭಾಷಾ ಶೀರ್ಷಿಕೆ, ದರ ಮತ್ತು ಆಹಾರ ಬ್ಯಾಡ್ಜ್‌ಗಳೊಂದಿಗೆ ಭಕ್ಷ್ಯಗಳನ್ನು ನಿರ್ವಹಿಸಿ.'
                        : 'Organize homestay culinary offerings into categories with bilingual titles, pricing, and dietary badges.'}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setModalData({ name: '', nameKn: '', slug: '', subtitle: '', subtitleKn: '', description: '', descriptionKn: '', icon: 'CookingPot' });
                          setModalType('categoryModal');
                        }}
                        className="px-3.5 py-1.5 rounded-xl admin-btn-outline text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isKn ? 'ವಿಭಾಗ ಸೇರಿಸಿ' : 'Add Category'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModalData({
                            category: diningMenu[0]?.slug || diningMenu[0]?.category || 'morning-breakfast',
                            name: '',
                            nameKn: '',
                            price: '',
                            isVeg: true,
                            badge: '',
                            badgeKn: '',
                            description: '',
                            descriptionKn: '',
                            image: '/images/food/paputtu_egg_curry.webp',
                            isIllustrative: true
                          });
                          setModalType('dishModal');
                        }}
                        className="px-3.5 py-1.5 rounded-xl admin-btn-primary text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isKn ? 'ಭಕ್ಷ್ಯ ಸೇರಿಸಿ' : 'Add Dish'}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {diningMenu.map((cat, catIdx) => (
                    <div key={cat.id || cat._id || cat.slug || catIdx} className="p-4 sm:p-5 rounded-2xl admin-subcard">
                      {/* Category Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-[var(--admin-border)]">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="font-serif text-base font-semibold text-[var(--admin-heading)]">
                            {cat.name || cat.category}
                          </h4>
                          {cat.nameKn && (
                            <span className="text-xs text-[var(--admin-muted)] font-serif border-l border-[var(--admin-border)] pl-2">
                              {cat.nameKn}
                            </span>
                          )}
                          {cat.subtitle && (
                            <span className="text-[11px] text-[var(--admin-muted)] hidden md:inline-block">
                              · {cat.subtitle}
                            </span>
                          )}
                          <span className="text-[10px] bg-white text-[var(--admin-heading)] border border-[var(--admin-border)] px-2 py-0.5 rounded-full font-mono font-semibold">
                            {cat.items?.length || 0} {isKn ? 'ಅಂಶಗಳು' : 'items'}
                          </span>
                          {cat.isActive === false && (
                            <span className="text-[9px] uppercase tracking-wider bg-red-50 text-red-800 border border-red-200 font-semibold px-2 py-0.5 rounded-full">
                              {isKn ? 'ಮರೆಮಾಡಲಾಗಿದೆ' : 'Hidden'}
                            </span>
                          )}
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-1 self-end sm:self-auto flex-wrap">
                            {/* Reorder Category */}
                            <button
                              type="button"
                              disabled={catIdx === 0}
                              onClick={() => {
                                if (catIdx > 0) {
                                  const updated = [...diningMenu];
                                  const temp = updated[catIdx - 1];
                                  updated[catIdx - 1] = updated[catIdx];
                                  updated[catIdx] = temp;
                                  updateMenuCategory(cat._id || cat.id || cat.slug, { displayOrder: catIdx - 1 });
                                }
                              }}
                              className="p-1 text-[var(--admin-muted)] hover:text-[var(--admin-heading)] hover:bg-[#EEF2EA] rounded disabled:opacity-30 cursor-pointer"
                              title={isKn ? 'ಮೇಲೆ ಸರಿಸಿ' : 'Move Category Up'}
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={catIdx === diningMenu.length - 1}
                              onClick={() => {
                                if (catIdx < diningMenu.length - 1) {
                                  const updated = [...diningMenu];
                                  const temp = updated[catIdx + 1];
                                  updated[catIdx + 1] = updated[catIdx];
                                  updated[catIdx] = temp;
                                  updateMenuCategory(cat._id || cat.id || cat.slug, { displayOrder: catIdx + 1 });
                                }
                              }}
                              className="p-1 text-[var(--admin-muted)] hover:text-[var(--admin-heading)] hover:bg-[#EEF2EA] rounded disabled:opacity-30 cursor-pointer"
                              title={isKn ? 'ಕೆಳಗೆ ಸರಿಸಿ' : 'Move Category Down'}
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            {/* Toggle Show / Hide Category */}
                            <button
                              type="button"
                              onClick={() => updateMenuCategory(cat._id || cat.id || cat.slug, { isActive: cat.isActive === false ? true : false })}
                              className="p-1 text-[var(--admin-muted)] hover:text-[var(--admin-heading)] hover:bg-[#EEF2EA] rounded cursor-pointer"
                              title={cat.isActive === false ? (isKn ? 'ತೋರಿಸಿ' : 'Show Category') : (isKn ? 'ಮರೆಮಾಡಿ' : 'Hide Category')}
                            >
                              {cat.isActive === false ? <EyeOff className="w-3.5 h-3.5 text-amber-700" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            {/* Edit Category */}
                            <button
                              type="button"
                              onClick={() => {
                                setModalData({
                                  id: cat._id || cat.id,
                                  name: cat.name || cat.category || '',
                                  nameKn: cat.nameKn || '',
                                  subtitle: cat.subtitle || '',
                                  subtitleKn: cat.subtitleKn || '',
                                  description: cat.description || '',
                                  descriptionKn: cat.descriptionKn || '',
                                  icon: cat.icon || 'CookingPot',
                                  slug: cat.slug || ''
                                });
                                setModalType('categoryModal');
                              }}
                              className="p-1 text-[var(--admin-muted)] hover:text-[var(--admin-heading)] hover:bg-[#EEF2EA] rounded cursor-pointer"
                              title={isKn ? 'ವಿಭಾಗ ತಿದ್ದಿ' : 'Edit Category'}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {/* Delete Category */}
                            <button
                              type="button"
                              onClick={() => openConfirm(
                                isKn ? 'ವಿಭಾಗ ಅಳಿಸಿ' : 'Delete Category',
                                isKn ? `'${cat.name || cat.category}' ವಿಭಾಗವನ್ನು ಅಳಿಸುವುದೇ?` : `Delete '${cat.name || cat.category}'?`,
                                () => deleteMenuCategory(cat._id || cat.id || cat.slug)
                              )}
                              className="p-1 text-red-700 hover:bg-red-50 rounded cursor-pointer"
                              title={isKn ? 'ವಿಭಾಗ ಅಳಿಸಿ' : 'Delete Category'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {/* Add Dish directly to this Category */}
                            <button
                              type="button"
                              onClick={() => {
                                setModalData({
                                  category: cat.slug || cat.name || cat.category,
                                  name: '',
                                  nameKn: '',
                                  price: '',
                                  isVeg: true,
                                  badge: '',
                                  badgeKn: '',
                                  description: '',
                                  descriptionKn: '',
                                  image: '/images/food/paputtu_egg_curry.webp',
                                  isIllustrative: true
                                });
                                setModalType('dishModal');
                              }}
                              className="ml-1 text-[11px] px-2.5 py-1 rounded-lg admin-btn-secondary cursor-pointer"
                            >
                              {isKn ? '+ ಭಕ್ಷ್ಯ' : '+ Dish'}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Dishes List */}
                      <div className="space-y-2">
                        {(!cat.items || cat.items.length === 0) ? (
                          <div className="text-xs text-[var(--admin-muted)] italic py-2">
                            {isKn ? 'ಈ ವಿಭಾಗಕ್ಕೆ ಇನ್ನೂ ಯಾವುದೇ ಭಕ್ಷ್ಯಗಳನ್ನು ಸೇರಿಸಿಲ್ಲ.' : 'No dishes added to this category yet.'}
                          </div>
                        ) : (
                          cat.items.map((item, itemIdx) => (
                            <div
                              key={item.id || item._id || itemIdx}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border text-xs gap-2 transition-colors ${
                                (item.isActive === false || item.isAvailable === false)
                                  ? 'bg-red-50/50 border-red-200 opacity-75'
                                  : 'bg-white border-[var(--admin-border)]'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <span
                                  className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                                    item.isVeg !== false ? 'bg-emerald-600 ring-2 ring-emerald-100' : 'bg-red-600 ring-2 ring-red-100'
                                  }`}
                                  title={item.isVeg !== false ? (isKn ? 'ಸಸ್ಯಾಹಾರ' : 'Vegetarian') : (isKn ? 'ಮಾಂಸಾಹಾರ' : 'Non-Vegetarian')}
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-[var(--admin-heading)] truncate">{item.name}</span>
                                    {item.nameKn && (
                                      <span className="text-[11px] text-[var(--admin-muted)] font-serif">({item.nameKn})</span>
                                    )}
                                    {item.badge && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--admin-gold-soft)] text-[var(--admin-gold-text)] border border-[#E6D5A7] font-bold">
                                        {item.badge}
                                      </span>
                                    )}
                                    {(item.isActive === false || item.isAvailable === false) && (
                                      <span className="text-[9px] uppercase font-semibold tracking-wider text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                                        {isKn ? 'ಮರೆಮಾಡಲಾಗಿದೆ' : 'Hidden'}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-[var(--admin-muted)] block line-clamp-1">
                                    {item.description || item.desc}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[var(--admin-border)]">
                                <span className="font-mono font-bold text-[var(--admin-heading)]">
                                  {item.price ? formatINR(item.price) : <span className="text-[10px] text-[var(--admin-muted)] font-normal">{isKn ? 'ದರ ಮರೆಮಾಡಲಾಗಿದೆ' : 'Price hidden'}</span>}
                                </span>
                                {item.isIllustrative !== false && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#EEF2EA] text-[var(--admin-muted)] border border-[var(--admin-border)] font-medium">
                                    {isKn ? 'ಮಾದರಿ ಚಿತ್ರ' : 'Illustrative'}
                                  </span>
                                )}
                                {isAdmin && (
                                  <div className="flex items-center gap-1">
                                    {/* Move Up Dish */}
                                    <button
                                      type="button"
                                      disabled={itemIdx === 0}
                                      onClick={() => {
                                        if (itemIdx > 0 && item._id) {
                                          updateMenuItem(item._id || item.id, { displayOrder: itemIdx - 1 });
                                        }
                                      }}
                                      className="p-1 text-[var(--admin-muted)] hover:text-[var(--admin-heading)] hover:bg-[#EEF2EA] rounded disabled:opacity-25 cursor-pointer"
                                      title={isKn ? 'ಮೇಲೆ ಸರಿಸಿ' : 'Move Dish Up'}
                                    >
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                    {/* Move Down Dish */}
                                    <button
                                      type="button"
                                      disabled={itemIdx === cat.items.length - 1}
                                      onClick={() => {
                                        if (itemIdx < cat.items.length - 1 && item._id) {
                                          updateMenuItem(item._id || item.id, { displayOrder: itemIdx + 1 });
                                        }
                                      }}
                                      className="p-1 text-[var(--admin-muted)] hover:text-[var(--admin-heading)] hover:bg-[#EEF2EA] rounded disabled:opacity-25 cursor-pointer"
                                      title={isKn ? 'ಕೆಳಗೆ ಸರಿಸಿ' : 'Move Dish Down'}
                                    >
                                      <ChevronDown className="w-3 h-3" />
                                    </button>
                                    {/* Toggle Visibility Dish */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const isCurrentlyHidden = item.isActive === false || item.isAvailable === false;
                                        const newStatus = isCurrentlyHidden ? true : false;
                                        updateMenuItem(item._id || item.id, { isActive: newStatus, isAvailable: newStatus });
                                      }}
                                      className="p-1 text-[var(--admin-muted)] hover:text-[var(--admin-heading)] hover:bg-[#EEF2EA] rounded cursor-pointer"
                                      title={(item.isActive === false || item.isAvailable === false) ? (isKn ? 'ತೋರಿಸಿ' : 'Show Dish') : (isKn ? 'ಮರೆಮಾಡಿ' : 'Hide Dish')}
                                    >
                                      {(item.isActive === false || item.isAvailable === false) ? <EyeOff className="w-3 h-3 text-amber-700" /> : <Eye className="w-3 h-3" />}
                                    </button>
                                    {/* Edit Dish */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setModalData({
                                          id: item._id || item.id,
                                          category: item.category || cat.slug || cat.name,
                                          name: item.name || '',
                                          nameKn: item.nameKn || '',
                                          price: item.price !== null && item.price !== undefined ? item.price : '',
                                          isVeg: item.isVeg !== false && !item.nonVeg,
                                          badge: item.badge || item.tag || '',
                                          badgeKn: item.badgeKn || '',
                                          description: item.description || item.desc || '',
                                          descriptionKn: item.descriptionKn || '',
                                          image: item.image || '/images/food/paputtu_egg_curry.webp',
                                          isIllustrative: item.isIllustrative !== false
                                        });
                                        setModalType('dishModal');
                                      }}
                                      className="p-1 text-[var(--admin-muted)] hover:text-[var(--admin-heading)] hover:bg-[#EEF2EA] rounded cursor-pointer"
                                      title={ad.edit}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    {/* Delete Dish */}
                                    <button
                                      type="button"
                                      onClick={() => openConfirm(
                                        isKn ? 'ಭಕ್ಷ್ಯ ಅಳಿಸಿ' : 'Delete Item',
                                        isKn ? `'${item.name}' ಅನ್ನು ಅಳಿಸುವುದೇ?` : `Delete '${item.name}'?`,
                                        () => deleteMenuItem(item._id || item.id)
                                      )}
                                      className="p-1 text-red-700 hover:bg-red-50 rounded cursor-pointer"
                                      title={ad.delete}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUBTAB 2: MEAL SCHEDULES & TIMINGS */}
            {diningSubTab === 'timings' && (
              <div className="space-y-6">
                {/* Timings Header Form */}
                <div className="admin-card p-5 sm:p-6">
                  <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)] mb-1">
                    {isKn ? 'ಊಟದ ವೇಳಾಪಟ್ಟಿ ಮತ್ತು ದಿನಚರಿ' : 'Meal Schedules & Daily Routine'}
                  </h3>
                  <p className="text-xs text-[var(--admin-muted)] mb-4">
                    {isKn
                      ? 'ಇಂಗ್ಲಿಷ್ ಮತ್ತು ಕನ್ನಡದಲ್ಲಿ ದೈನಂದಿನ 4 ಊಟದ ಸಮಯ ಮತ್ತು ಶೀರ್ಷಿಕೆಗಳನ್ನು ಹೊಂದಿಸಿ.'
                      : 'Configure the four daily meal timings and section header text in English and Kannada.'}
                  </p>

                  <div className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[var(--admin-heading)] font-semibold block mb-1">Timings Section Heading (EN)</label>
                        <input
                          type="text"
                          disabled={!isAdmin}
                          value={timingsData.headingEn}
                          onChange={(e) => setTimingsData({ ...timingsData, headingEn: e.target.value })}
                          placeholder="Daily Routine & Meal Timings"
                          className="w-full rounded-lg px-3 py-1.5 disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="text-[var(--admin-heading)] font-semibold block mb-1">Timings Section Heading (KN)</label>
                        <input
                          type="text"
                          disabled={!isAdmin}
                          value={timingsData.headingKn}
                          onChange={(e) => setTimingsData({ ...timingsData, headingKn: e.target.value })}
                          placeholder="ದೈನಂದಿನ ಊಟದ ಸಮಯ"
                          className="w-full rounded-lg px-3 py-1.5 font-serif disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[var(--admin-heading)] font-semibold block mb-1">Subtitle (EN)</label>
                        <input
                          type="text"
                          disabled={!isAdmin}
                          value={timingsData.subtitleEn}
                          onChange={(e) => setTimingsData({ ...timingsData, subtitleEn: e.target.value })}
                          placeholder="Daily Routine"
                          className="w-full rounded-lg px-3 py-1.5 disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="text-[var(--admin-heading)] font-semibold block mb-1">Subtitle (KN)</label>
                        <input
                          type="text"
                          disabled={!isAdmin}
                          value={timingsData.subtitleKn}
                          onChange={(e) => setTimingsData({ ...timingsData, subtitleKn: e.target.value })}
                          placeholder="ದಿನಚರಿ"
                          className="w-full rounded-lg px-3 py-1.5 font-serif disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[var(--admin-heading)] font-semibold block mb-1">Description (EN)</label>
                      <textarea
                        rows={2}
                        disabled={!isAdmin}
                        value={timingsData.descEn}
                        onChange={(e) => setTimingsData({ ...timingsData, descEn: e.target.value })}
                        className="w-full rounded-lg px-3 py-1.5 disabled:opacity-60"
                      />
                    </div>

                    {isAdmin && (
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => handleSaveTimings()}
                          className="px-4 py-1.5 rounded-xl admin-btn-primary text-xs cursor-pointer"
                        >
                          {isKn ? 'ಶೀರ್ಷಿಕೆ ಪಠ್ಯ ಉಳಿಸಿ' : 'Save Header Text'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timing Cards List */}
                <div className="admin-card p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[var(--admin-border)]">
                    <h4 className="font-serif text-base font-semibold text-[var(--admin-heading)] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[var(--admin-gold-text)]" />
                      <span>{isKn ? `ಊಟದ ಸಮಯದ ಕಾರ್ಡ್‌ಗಳು (${timingsData.items.length})` : `Meal Timing Cards (${timingsData.items.length})`}</span>
                    </h4>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setModalData({
                            mealEn: '',
                            mealKn: '',
                            timeEn: '',
                            timeKn: '',
                            includedEn: '',
                            includedKn: ''
                          });
                          setModalType('timingItemModal');
                        }}
                        className="px-3 py-1.5 rounded-xl admin-btn-outline text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isKn ? 'ಸಮಯ ಕಾರ್ಡ್ ಸೇರಿಸಿ' : 'Add Timing Card'}</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {timingsData.items.map((item, idx) => (
                      <div key={item.id || idx} className="p-4 rounded-xl admin-subcard flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="font-serif text-sm font-semibold text-[var(--admin-heading)]">
                              {item.mealEn || 'Meal'}
                            </h5>
                            <span className="font-mono text-[11px] font-semibold text-[var(--admin-heading)] bg-[#EEF2EA] border border-[var(--admin-border)] px-2 py-0.5 rounded">
                              {item.timeEn || 'Time'}
                            </span>
                          </div>
                          {item.mealKn && (
                            <span className="text-xs text-[var(--admin-muted)] font-serif block mt-0.5">
                              {item.mealKn}
                            </span>
                          )}
                          <p className="text-xs text-[var(--admin-muted)] mt-1.5">
                            {item.includedEn}
                          </p>
                        </div>

                        {isAdmin && (
                          <div className="flex items-center justify-between pt-2 border-t border-[var(--admin-border)] text-xs">
                            <div className="flex items-center gap-1 text-[var(--admin-muted)]">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => {
                                  if (idx > 0) {
                                    const updated = [...timingsData.items];
                                    const temp = updated[idx - 1];
                                    updated[idx - 1] = updated[idx];
                                    updated[idx] = temp;
                                    setTimingsData({ ...timingsData, items: updated });
                                    handleSaveTimings(updated);
                                  }
                                }}
                                className="p-1 hover:text-[var(--admin-heading)] disabled:opacity-25 cursor-pointer"
                                title={isKn ? 'ಮೇಲೆ ಸರಿಸಿ' : 'Move Up'}
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === timingsData.items.length - 1}
                                onClick={() => {
                                  if (idx < timingsData.items.length - 1) {
                                    const updated = [...timingsData.items];
                                    const temp = updated[idx + 1];
                                    updated[idx + 1] = updated[idx];
                                    updated[idx] = temp;
                                    setTimingsData({ ...timingsData, items: updated });
                                    handleSaveTimings(updated);
                                  }
                                }}
                                className="p-1 hover:text-[var(--admin-heading)] disabled:opacity-25 cursor-pointer"
                                title={isKn ? 'ಕೆಳಗೆ ಸರಿಸಿ' : 'Move Down'}
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setModalData({
                                    idx,
                                    id: item.id,
                                    mealEn: item.mealEn || '',
                                    mealKn: item.mealKn || '',
                                    timeEn: item.timeEn || '',
                                    timeKn: item.timeKn || '',
                                    includedEn: item.includedEn || '',
                                    includedKn: item.includedKn || ''
                                  });
                                  setModalType('timingItemModal');
                                }}
                                className="text-[var(--admin-heading)] font-semibold hover:text-[var(--admin-gold-text)] cursor-pointer"
                              >
                                {ad.edit}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = timingsData.items.filter((_, i) => i !== idx);
                                  setTimingsData({ ...timingsData, items: updated });
                                  handleSaveTimings(updated);
                                }}
                                className="text-red-700 font-semibold hover:underline cursor-pointer"
                              >
                                {ad.delete}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 3: HERO & SECTION CONTENT */}
            {diningSubTab === 'content' && (
              <form onSubmit={handleSaveDiningHero} className="space-y-6">
                {/* Hero Section */}
                <div className="admin-card p-5 sm:p-6 space-y-3.5 text-xs">
                  <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)] mb-1">
                    {isKn ? 'ಡೈನಿಂಗ್ ಪುಟದ ಹೀರೋ ಶೀರ್ಷಿಕೆ' : 'Dining Page Hero Header'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[var(--admin-heading)] font-semibold block mb-1">Hero Badge (EN)</label>
                      <input
                        type="text"
                        disabled={!isAdmin}
                        value={diningHeroForm.badgeEn}
                        onChange={(e) => setDiningHeroForm({ ...diningHeroForm, badgeEn: e.target.value })}
                        placeholder="FARM-TO-TABLE DINING"
                        className="w-full rounded-lg px-3 py-1.5 disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--admin-heading)] font-semibold block mb-1">Hero Badge (KN)</label>
                      <input
                        type="text"
                        disabled={!isAdmin}
                        value={diningHeroForm.badgeKn}
                        onChange={(e) => setDiningHeroForm({ ...diningHeroForm, badgeKn: e.target.value })}
                        placeholder="ಸಾಂಪ್ರದಾಯಿಕ ಆಹಾರ"
                        className="w-full rounded-lg px-3 py-1.5 font-serif disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[var(--admin-heading)] font-semibold block mb-1">Hero Title (EN)</label>
                      <input
                        type="text"
                        disabled={!isAdmin}
                        value={diningHeroForm.titleEn}
                        onChange={(e) => setDiningHeroForm({ ...diningHeroForm, titleEn: e.target.value })}
                        placeholder="Wholesome Homely Dining"
                        className="w-full rounded-lg px-3 py-1.5 disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--admin-heading)] font-semibold block mb-1">Hero Title (KN)</label>
                      <input
                        type="text"
                        disabled={!isAdmin}
                        value={diningHeroForm.titleKn}
                        onChange={(e) => setDiningHeroForm({ ...diningHeroForm, titleKn: e.target.value })}
                        placeholder="ಆರೋಗ್ಯಕರ ಮನೆ ಊಟ"
                        className="w-full rounded-lg px-3 py-1.5 font-serif disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[var(--admin-heading)] font-semibold block mb-1">Hero Description (EN)</label>
                      <textarea
                        rows={2}
                        disabled={!isAdmin}
                        value={diningHeroForm.descEn}
                        onChange={(e) => setDiningHeroForm({ ...diningHeroForm, descEn: e.target.value })}
                        className="w-full rounded-lg px-3 py-1.5 disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--admin-heading)] font-semibold block mb-1">Hero Description (KN)</label>
                      <textarea
                        rows={2}
                        disabled={!isAdmin}
                        value={diningHeroForm.descKn}
                        onChange={(e) => setDiningHeroForm({ ...diningHeroForm, descKn: e.target.value })}
                        className="w-full rounded-lg px-3 py-1.5 font-serif disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--admin-border)]">
                    <span className="text-[var(--admin-gold-text)] font-bold block mb-2">
                      {isKn ? '3 ಹೀರೋ ಟ್ಯಾಗ್ ಪಿಲ್‌ಗಳು' : '3 Hero Tag Pills'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[var(--admin-heading)] font-medium block mb-1">Tag 1 (EN / KN)</label>
                        <input
                          type="text"
                          disabled={!isAdmin}
                          value={diningHeroForm.tag1En}
                          onChange={(e) => setDiningHeroForm({ ...diningHeroForm, tag1En: e.target.value })}
                          placeholder="Fresh Local Spices"
                          className="w-full rounded-lg px-2.5 py-1.5 mb-1.5 disabled:opacity-60"
                        />
                        <input
                          type="text"
                          disabled={!isAdmin}
                          value={diningHeroForm.tag1Kn}
                          onChange={(e) => setDiningHeroForm({ ...diningHeroForm, tag1Kn: e.target.value })}
                          placeholder="ತಾಜಾ ಮಸಾಲೆ"
                          className="w-full rounded-lg px-2.5 py-1.5 font-serif disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="text-[var(--admin-heading)] font-medium block mb-1">Tag 2 (EN / KN)</label>
                        <input
                          type="text"
                          disabled={!isAdmin}
                          value={diningHeroForm.tag2En}
                          onChange={(e) => setDiningHeroForm({ ...diningHeroForm, tag2En: e.target.value })}
                          placeholder="Home-Style Cooking"
                          className="w-full rounded-lg px-2.5 py-1.5 mb-1.5 disabled:opacity-60"
                        />
                        <input
                          type="text"
                          disabled={!isAdmin}
                          value={diningHeroForm.tag2Kn}
                          onChange={(e) => setDiningHeroForm({ ...diningHeroForm, tag2Kn: e.target.value })}
                          placeholder="ಮನೆ ಮಾದರಿಯ ಅಡುಗೆ"
                          className="w-full rounded-lg px-2.5 py-1.5 font-serif disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="text-[var(--admin-heading)] font-medium block mb-1">Tag 3 (EN / KN)</label>
                        <input
                          type="text"
                          disabled={!isAdmin}
                          value={diningHeroForm.tag3En}
                          onChange={(e) => setDiningHeroForm({ ...diningHeroForm, tag3En: e.target.value })}
                          placeholder="Hot Estate Breakfast"
                          className="w-full rounded-lg px-2.5 py-1.5 mb-1.5 disabled:opacity-60"
                        />
                        <input
                          type="text"
                          disabled={!isAdmin}
                          value={diningHeroForm.tag3Kn}
                          onChange={(e) => setDiningHeroForm({ ...diningHeroForm, tag3Kn: e.target.value })}
                          placeholder="ಬಿಸಿ ತಿಂಡಿ"
                          className="w-full rounded-lg px-2.5 py-1.5 font-serif disabled:opacity-60"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auxiliary Kitchen */}
                <div className="admin-card p-5 sm:p-6 space-y-3.5 text-xs">
                  <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)] mb-1">
                    {isKn ? 'ಹೆಚ್ಚುವರಿ ಅತಿಥಿ ಅಡುಗೆಮನೆ ಬ್ಲಾಕ್' : 'Auxiliary Kitchen Block'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[var(--admin-heading)] font-semibold block mb-1">Badge (EN / KN)</label>
                      <input
                        type="text"
                        disabled={!isAdmin}
                        value={diningHeroForm.kitchenBadgeEn}
                        onChange={(e) => setDiningHeroForm({ ...diningHeroForm, kitchenBadgeEn: e.target.value })}
                        placeholder="Family & Special Diets"
                        className="w-full rounded-lg px-3 py-1.5 mb-1.5 disabled:opacity-60"
                      />
                      <input
                        type="text"
                        disabled={!isAdmin}
                        value={diningHeroForm.kitchenBadgeKn}
                        onChange={(e) => setDiningHeroForm({ ...diningHeroForm, kitchenBadgeKn: e.target.value })}
                        placeholder="ಕುಟುಂಬ ಮತ್ತು ವಿಶೇಷ ಅಗತ್ಯಗಳು"
                        className="w-full rounded-lg px-3 py-1.5 font-serif disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--admin-heading)] font-semibold block mb-1">Heading (EN / KN)</label>
                      <input
                        type="text"
                        disabled={!isAdmin}
                        value={diningHeroForm.kitchenHeadingEn}
                        onChange={(e) => setDiningHeroForm({ ...diningHeroForm, kitchenHeadingEn: e.target.value })}
                        placeholder="Auxiliary Guest Kitchen Access"
                        className="w-full rounded-lg px-3 py-1.5 mb-1.5 disabled:opacity-60"
                      />
                      <input
                        type="text"
                        disabled={!isAdmin}
                        value={diningHeroForm.kitchenHeadingKn}
                        onChange={(e) => setDiningHeroForm({ ...diningHeroForm, kitchenHeadingKn: e.target.value })}
                        placeholder="ಅತಿಥಿ ಅಡುಗೆಮನೆ ಸೌಲಭ್ಯ"
                        className="w-full rounded-lg px-3 py-1.5 font-serif disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[var(--admin-heading)] font-semibold block mb-1">Description (EN)</label>
                      <textarea
                        rows={2}
                        disabled={!isAdmin}
                        value={diningHeroForm.kitchenTextEn}
                        onChange={(e) => setDiningHeroForm({ ...diningHeroForm, kitchenTextEn: e.target.value })}
                        className="w-full rounded-lg px-3 py-1.5 disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--admin-heading)] font-semibold block mb-1">Description (KN)</label>
                      <textarea
                        rows={2}
                        disabled={!isAdmin}
                        value={diningHeroForm.kitchenTextKn}
                        onChange={(e) => setDiningHeroForm({ ...diningHeroForm, kitchenTextKn: e.target.value })}
                        className="w-full rounded-lg px-3 py-1.5 font-serif disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[var(--admin-heading)] font-semibold block mb-1">Button Label (EN)</label>
                      <input
                        type="text"
                        disabled={!isAdmin}
                        value={diningHeroForm.kitchenBtnEn}
                        onChange={(e) => setDiningHeroForm({ ...diningHeroForm, kitchenBtnEn: e.target.value })}
                        placeholder="Complimentary Guest Access"
                        className="w-full rounded-lg px-3 py-1.5 disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--admin-heading)] font-semibold block mb-1">Button Label (KN)</label>
                      <input
                        type="text"
                        disabled={!isAdmin}
                        value={diningHeroForm.kitchenBtnKn}
                        onChange={(e) => setDiningHeroForm({ ...diningHeroForm, kitchenBtnKn: e.target.value })}
                        placeholder="ಉಚಿತ ಪ್ರವೇಶ"
                        className="w-full rounded-lg px-3 py-1.5 font-serif disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>

                {/* Menu Section Header */}
                <div className="admin-card p-5 sm:p-6 space-y-3.5 text-xs">
                  <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)] mb-1">
                    {isKn ? 'ಮೆನು ವಿಭಾಗದ ಶೀರ್ಷಿಕೆ' : 'Menu Section Header'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[var(--admin-heading)] font-semibold block mb-1">Section Heading (EN)</label>
                      <input
                        type="text"
                        disabled={!isAdmin}
                        value={diningHeroForm.menuHeadingEn}
                        onChange={(e) => setDiningHeroForm({ ...diningHeroForm, menuHeadingEn: e.target.value })}
                        placeholder="Wood-Fired Specialties & À la Carte"
                        className="w-full rounded-lg px-3 py-1.5 disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--admin-heading)] font-semibold block mb-1">Section Heading (KN)</label>
                      <input
                        type="text"
                        disabled={!isAdmin}
                        value={diningHeroForm.menuHeadingKn}
                        onChange={(e) => setDiningHeroForm({ ...diningHeroForm, menuHeadingKn: e.target.value })}
                        placeholder="ವಿಶೇಷ ಭಕ್ಷ್ಯಗಳು"
                        className="w-full rounded-lg px-3 py-1.5 font-serif disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[var(--admin-heading)] font-semibold block mb-1">Description (EN)</label>
                      <textarea
                        rows={2}
                        disabled={!isAdmin}
                        value={diningHeroForm.menuDescEn}
                        onChange={(e) => setDiningHeroForm({ ...diningHeroForm, menuDescEn: e.target.value })}
                        className="w-full rounded-lg px-3 py-1.5 disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--admin-heading)] font-semibold block mb-1">Description (KN)</label>
                      <textarea
                        rows={2}
                        disabled={!isAdmin}
                        value={diningHeroForm.menuDescKn}
                        onChange={(e) => setDiningHeroForm({ ...diningHeroForm, menuDescKn: e.target.value })}
                        className="w-full rounded-lg px-3 py-1.5 font-serif disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl admin-btn-primary uppercase text-xs shadow-md cursor-pointer"
                    >
                      {isKn ? 'ಡೈನಿಂಗ್ ಪುಟದ ಪಠ್ಯ ಉಳಿಸಿ' : 'Save Dining Page Text'}
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 8: GALLERY */}
        {activeTab === 'gallery' && (
          <div className="space-y-6 animate-fade-in">
            {/* Image Uploader */}
            {isAdmin && (
              <div className="admin-card p-5 sm:p-6">
                <h3 className="font-serif text-base font-semibold text-[var(--admin-heading)] mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[var(--admin-gold-text)]" />
                  <span>{isKn ? 'ನೈಜ ಛಾಯಾಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮತ್ತು ಪ್ರಕಟಿಸಿ' : 'Upload & Publish Real Photography'}</span>
                </h3>
                <form onSubmit={handleUploadGalleryImage} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[var(--admin-heading)] block font-semibold">
                        {isKn ? 'ಆಯ್ಕೆ A: ಚಿತ್ರ ಫೈಲ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ (JPG, PNG, WEBP)' : 'Option A: Upload Image File (JPG, PNG, WEBP)'}
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          setGalleryFile(e.target.files?.[0] || null);
                          if (e.target.files?.[0]) setGalleryUrl('');
                        }}
                        className="w-full text-xs text-[var(--admin-text)] file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#B8964A] file:text-[#0F2A20] file:font-semibold bg-white border border-[var(--admin-input-border)] rounded-lg p-1 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[var(--admin-heading)] block font-semibold">
                        {isKn ? 'ಆಯ್ಕೆ B: ಅಥವಾ Google Drive / ವೆಬ್ URL ಅಂಟಿಸಿ' : 'Option B: Or Paste Google Drive / Web URL'}
                      </label>
                      <input
                        type="text"
                        placeholder={isKn ? 'Google Drive ಲಿಂಕ್ ಅಥವಾ ನೇರ URL ಅಂಟಿಸಿ...' : 'Paste Google Drive share link or direct URL...'}
                        value={galleryUrl}
                        onChange={(e) => {
                          const normalized = normalizeImageUrl(e.target.value);
                          setGalleryUrl(normalized);
                          if (e.target.value) setGalleryFile(null);
                        }}
                        className="w-full rounded-lg px-2.5 py-2 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[var(--admin-heading)] font-semibold block mb-1">
                        {isKn ? 'ಗ್ಯಾಲರಿ ವಿಭಾಗ' : 'Gallery Category'}
                      </label>
                      <select
                        value={galleryCategory}
                        onChange={(e) => setGalleryCategory(e.target.value)}
                        className="w-full rounded-lg px-2.5 py-1.5"
                      >
                        <option value="estate">{isKn ? 'ಎಸ್ಟೇಟ್' : 'Estate'}</option>
                        <option value="cottages">{isKn ? 'ಕಾಟೇಜ್‌ಗಳು' : 'Cottages'}</option>
                        <option value="dining">{isKn ? 'ಭೋಜನ' : 'Dining'}</option>
                        <option value="nights">{isKn ? 'ರಾತ್ರಿಗಳು' : 'Nights'}</option>
                        <option value="nature">{isKn ? 'ಪ್ರಕೃತಿ' : 'Nature'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[var(--admin-heading)] font-semibold block mb-1">
                        {isKn ? 'ಚಿತ್ರ ವಿವರಣೆ (Alt Text)' : 'Alt Description'}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Standard Room wooden bed"
                        value={galleryAlt}
                        onChange={(e) => setGalleryAlt(e.target.value)}
                        className="w-full rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={isUploadingGallery || (!galleryFile && !galleryUrl?.trim())}
                        className="w-full py-2 rounded-xl admin-btn-primary text-xs cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingGallery ? (isKn ? 'ಪ್ರಕಟಿಸಲಾಗುತ್ತಿದೆ...' : 'Publishing...') : (isKn ? 'ಗ್ಯಾಲರಿಗೆ ಪ್ರಕಟಿಸಿ' : 'Publish to Gallery')}
                      </button>
                    </div>
                  </div>

                  {galleryUrl && (
                    <div className="flex items-center gap-3 p-2.5 admin-subcard">
                      <img src={galleryUrl} alt="Preview" className="w-16 h-12 object-cover rounded" />
                      <span className="text-[11px] text-[var(--admin-muted)] truncate">{galleryUrl}</span>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Gallery Media Grid */}
            <div className="admin-card p-5 sm:p-6">
              <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)] mb-4">
                {isKn ? `ಸಕ್ರಿಯ ಗ್ಯಾಲರಿ ಛಾಯಾಚಿತ್ರಗಳು (${gallery.length} ಚಿತ್ರಗಳು)` : `Active Gallery Photography (${gallery.length} Images)`}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {gallery.map((img) => (
                  <div key={img.id || img._id || img.url} className="rounded-xl overflow-hidden admin-subcard group relative">
                    <img
                      src={img.url || img.src}
                      alt={img.alt || 'Gallery photo'}
                      className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="p-2.5 flex items-center justify-between text-xs bg-white border-t border-[var(--admin-border)]">
                      <span className="capitalize text-[var(--admin-heading)] text-[10px] font-bold px-2 py-0.5 rounded bg-[#EEF2EA] border border-[var(--admin-border)]">
                        {img.category || 'estate'}
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            const filename = img.url?.split('/')?.pop();
                            openConfirm(
                              isKn ? 'ಗ್ಯಾಲರಿ ಚಿತ್ರ ಅಳಿಸಿ' : 'Delete Gallery Image',
                              isKn ? 'ಈ ಚಿತ್ರವನ್ನು ಗ್ಯಾಲರಿ ಮತ್ತು ಸರ್ವರ್‌ನಿಂದ ಶಾಶ್ವತವಾಗಿ ಅಳಿಸುವುದೇ?' : 'Delete this image permanently from the gallery and server storage?',
                              () => deleteGalleryImage(img._id || img.id, filename)
                            );
                          }}
                          className="text-red-700 hover:bg-red-50 rounded p-1 cursor-pointer"
                          title={ad.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 9: REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-fade-in">
            <div className="admin-card p-5 sm:p-6">
              {(() => {
                const allReviewsList = Array.isArray(adminReviews) ? adminReviews : [];
                const pendingCount = allReviewsList.filter((r) => r.status === 'pending').length;
                const approvedCount = allReviewsList.filter((r) => r.status === 'approved').length;
                const hiddenCount = allReviewsList.filter((r) => r.status === 'hidden').length;
                const q = searchQuery.trim().toLowerCase();

                const filteredReviews = allReviewsList.filter((r) => {
                  const matchesStatus =
                    reviewStatusFilter === 'pending'
                      ? r.status === 'pending'
                      : reviewStatusFilter === 'approved'
                      ? r.status === 'approved'
                      : reviewStatusFilter === 'hidden'
                      ? r.status === 'hidden'
                      : true;
                  if (!matchesStatus) return false;
                  if (!q) return true;
                  return (
                    (r.guestName || '').toLowerCase().includes(q) ||
                    (r.location || r.city || '').toLowerCase().includes(q) ||
                    (r.stayedIn || '').toLowerCase().includes(q) ||
                    (r.text || r.review || '').toLowerCase().includes(q)
                  );
                });

                const handleModerate = async (revId, actionFn) => {
                  if (!revId || moderatingReviewId === revId) return;
                  setModeratingReviewId(revId);
                  try {
                    await actionFn(revId);
                  } finally {
                    setModeratingReviewId(null);
                  }
                };

                return (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-[var(--admin-border)]">
                      <div>
                        <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)] flex flex-wrap items-center gap-2">
                          <Star className="w-5 h-5 text-[var(--admin-gold)]" />
                          <span>{isKn ? 'ಅತಿಥಿ ವಿಮರ್ಶೆಗಳ ನಿರ್ವಹಣೆ' : 'Guest Reviews Moderation'}</span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EEF2EA] text-[var(--admin-heading)] border border-[var(--admin-border)] font-mono">
                            {allReviewsList.length} {isKn ? 'ಒಟ್ಟು' : 'Total'}
                          </span>
                        </h3>
                        <p className="text-xs text-[var(--admin-muted)] mt-0.5">
                          {isKn
                            ? 'ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿರುವ ಅತಿಥಿ ವಿಮರ್ಶೆಗಳನ್ನು ಅನುಮೋದಿಸಿ, ಮರೆಮಾಡಿ ಅಥವಾ ಅಳಿಸಿ.'
                            : 'Manage guest reviews stored in MongoDB. New guest submissions publish live and can be hidden, approved, or deleted anytime.'}
                        </p>
                      </div>

                      {/* Filter Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 bg-[var(--admin-surface-subtle)] p-1.5 rounded-xl border border-[var(--admin-border)]">
                        <button
                          type="button"
                          onClick={() => setReviewStatusFilter('all')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            reviewStatusFilter === 'all'
                              ? 'bg-[#B8964A] text-[#0F2A20] font-bold shadow-sm'
                              : 'text-[var(--admin-muted)] hover:text-[var(--admin-heading)]'
                          }`}
                        >
                          {isKn ? `ಎಲ್ಲಾ (${allReviewsList.length})` : `All (${allReviewsList.length})`}
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewStatusFilter('pending')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                            reviewStatusFilter === 'pending'
                              ? 'bg-amber-600 text-white font-bold shadow-sm'
                              : 'text-[var(--admin-muted)] hover:text-[var(--admin-heading)]'
                          }`}
                        >
                          <span>{isKn ? 'ಬಾಕಿ' : 'Pending'}</span>
                          {pendingCount > 0 && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                              reviewStatusFilter === 'pending'
                                ? 'bg-white text-amber-800'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}>
                              {pendingCount}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewStatusFilter('approved')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            reviewStatusFilter === 'approved'
                              ? 'bg-emerald-700 text-white font-bold shadow-sm'
                              : 'text-[var(--admin-muted)] hover:text-[var(--admin-heading)]'
                          }`}
                        >
                          {isKn ? `ಅನುಮೋದಿತ (${approvedCount})` : `Approved (${approvedCount})`}
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewStatusFilter('hidden')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            reviewStatusFilter === 'hidden'
                              ? 'bg-slate-700 text-white font-bold shadow-sm'
                              : 'text-[var(--admin-muted)] hover:text-[var(--admin-heading)]'
                          }`}
                        >
                          {isKn ? `ಮರೆಮಾಡಿದ (${hiddenCount})` : `Hidden (${hiddenCount})`}
                        </button>
                      </div>
                    </div>

                    {filteredReviews.length === 0 ? (
                      <div className="py-12 text-center text-xs text-[var(--admin-muted)] border border-dashed border-[var(--admin-input-border)] rounded-xl bg-[var(--admin-surface-subtle)]">
                        <MessageSquare className="w-8 h-8 text-[var(--admin-gold)] mx-auto mb-2" />
                        <p className="text-sm font-semibold text-[var(--admin-heading)]">
                          {q
                            ? (isKn ? 'ನಿಮ್ಮ ಹುಡುಕಾಟಕ್ಕೆ ಯಾವುದೇ ವಿಮರ್ಶೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.' : 'No reviews match your search query.')
                            : reviewStatusFilter === 'pending'
                            ? (isKn ? 'ಅನುಮೋದನೆಗೆ ಬಾಕಿ ಇರುವ ವಿಮರ್ಶೆಗಳಿಲ್ಲ.' : 'No pending reviews awaiting moderation.')
                            : reviewStatusFilter === 'approved'
                            ? (isKn ? 'ಯಾವುದೇ ಅನುಮೋದಿತ ವಿಮರ್ಶೆಗಳಿಲ್ಲ.' : 'No approved reviews currently live.')
                            : reviewStatusFilter === 'hidden'
                            ? (isKn ? 'ಮರೆಮಾಡಿದ ವಿಮರ್ಶೆಗಳಿಲ್ಲ.' : 'No hidden reviews.')
                            : (isKn ? 'ಇನ್ನೂ ಯಾವುದೇ ಅತಿಥಿ ವಿಮರ್ಶೆಗಳಿಲ್ಲ.' : 'No guest reviews recorded yet.')}
                        </p>
                        <p className="text-[11px] text-[var(--admin-muted)] mt-1">
                          {isKn
                            ? 'ಸಾರ್ವಜನಿಕ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಅತಿಥಿಗಳು ಸಲ್ಲಿಸಿದ ವಿಮರ್ಶೆಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.'
                            : 'Reviews submitted by guests on the public website or seeded in MongoDB appear here for management.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredReviews.map((rev) => {
                          const revId = rev._id || rev.id;
                          const isBusy = moderatingReviewId === revId;
                          const isPending = rev.status === 'pending';
                          const isApproved = rev.status === 'approved';
                          const isHidden = rev.status === 'hidden';

                          return (
                            <div
                              key={revId}
                              className={`p-4 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                                isPending
                                  ? 'bg-amber-50/40 border-amber-300 shadow-sm'
                                  : 'bg-[var(--admin-surface-subtle)] border-[var(--admin-border)]'
                              }`}
                            >
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex items-center flex-wrap gap-2">
                                  <span className="font-semibold text-[var(--admin-heading)] text-sm">{rev.guestName}</span>
                                  <div className="flex items-center text-[var(--admin-gold)] font-bold">
                                    {[...Array(Math.min(5, Math.max(1, Number(rev.rating) || 5)))].map((_, i) => (
                                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                                    ))}
                                    <span className="ml-1 text-[11px] text-[var(--admin-gold-text)]">({rev.rating || 5}★)</span>
                                  </div>
                                  <span
                                    className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                                      isApproved
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : isPending
                                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    {isApproved
                                      ? (isKn ? 'ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಲೈವ್' : 'Live on Website')
                                      : isPending
                                      ? (isKn ? 'ಅನುಮೋದನೆ ಬಾಕಿ' : 'Pending Approval')
                                      : (isKn ? 'ಮರೆಮಾಡಲಾಗಿದೆ' : 'Hidden')}
                                  </span>
                                </div>

                                <div className="text-[11px] text-[var(--admin-muted)] flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span>{rev.location || rev.city || 'Karnataka, India'}</span>
                                  <span>•</span>
                                  <span className="text-[var(--admin-gold-text)] font-medium">
                                    {isKn ? 'ವಾಸ್ತವ್ಯ:' : 'Stayed in:'} {rev.stayedIn || 'Standard Room'}
                                  </span>
                                  {(rev.stayDate || rev.createdAt) && (
                                    <>
                                      <span>•</span>
                                      <span className="font-mono text-[10px] text-[var(--admin-muted)]">
                                        {rev.createdAt
                                          ? `${isKn ? 'ಸಲ್ಲಿಸಿದ ದಿನಾಂಕ:' : 'Submitted:'} ${new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                          : rev.stayDate}
                                      </span>
                                    </>
                                  )}
                                </div>

                                <p className="text-[var(--admin-text)] italic leading-relaxed pt-1">
                                  "{rev.text || rev.review}"
                                </p>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--admin-border)] w-full sm:w-auto justify-end">
                                {!isApproved && (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleModerate(revId, approveReview)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
                                  >
                                    {isKn ? 'ಅನುಮೋದಿಸಿ' : 'Approve & Publish'}
                                  </button>
                                )}
                                {!isHidden && (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleModerate(revId, hideReview)}
                                    className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 disabled:opacity-50 font-semibold text-xs transition-colors cursor-pointer"
                                  >
                                    {isKn ? 'ಮರೆಮಾಡಿ' : 'Hide'}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() =>
                                    openConfirm(
                                      isKn ? 'ವಿಮರ್ಶೆ ಅಳಿಸಿ' : 'Delete Review',
                                      isKn ? `${rev.guestName} ಅವರ ವಿಮರ್ಶೆಯನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸುವುದೇ?` : `Permanently delete this review from ${rev.guestName}?`,
                                      () => handleModerate(revId, deleteReview)
                                    )
                                  }
                                  className="p-1.5 text-red-700 hover:bg-red-50 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                                  title={ad.delete}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 10: ENQUIRIES */}
        {activeTab === 'enquiries' && (
          <div className="space-y-6 animate-fade-in">
            <div className="admin-card p-5 sm:p-6">
              <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)] mb-4">
                {isKn ? `ಅತಿಥಿ ವಿಚಾರಣೆಗಳು (${enquiries.length})` : `Guest Enquiries & Direct Leads (${enquiries.length})`}
              </h3>
              <div className="space-y-3">
                {enquiries.length > 0 ? (
                  enquiries.map((enq) => (
                    <div key={enq.id || enq._id} className="p-4 rounded-xl admin-subcard space-y-3 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-[var(--admin-heading)] text-sm block">{enq.name}</span>
                          <span className="text-[var(--admin-muted)] break-all">{enq.phone} · {enq.email}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={enq.status || 'new'}
                            onChange={(e) => updateEnquiryStatus(enq._id || enq.id, e.target.value)}
                            className="rounded-lg px-2.5 py-1 text-xs font-semibold capitalize"
                          >
                            <option value="new">{isKn ? 'ಹೊಸದು' : 'New'}</option>
                            <option value="contacted">{isKn ? 'ಸಂಪರ್ಕಿಸಲಾಗಿದೆ' : 'Contacted'}</option>
                            <option value="closed">{isKn ? 'ಮುಕ್ತಾಯ' : 'Closed'}</option>
                          </select>
                          {!isPlaceholderPhone(enq.phone) && (
                            <a
                              href={buildWhatsAppShareUrl(`Hi ${enq.name || 'there'}, regarding your Marichin Homestay enquiry:`, enq.phone)}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white"
                              title={isKn ? 'ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಚಾಟ್ ಮಾಡಿ' : 'Chat on WhatsApp'}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <a
                            href={`mailto:${enq.email}?subject=Regarding your enquiry at Marichin Homestay`}
                            className="p-1.5 rounded-lg admin-btn-outline"
                            title={isKn ? 'ಇಮೇಲ್ ಕಳುಹಿಸಿ' : 'Send Email'}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => openConfirm(
                              isKn ? 'ವಿಚಾರಣೆ ಅಳಿಸಿ' : 'Delete Enquiry',
                              isKn ? `${enq.name} ಅವರ ವಿಚಾರಣೆಯನ್ನು ಅಳಿಸುವುದೇ?` : `Delete enquiry from ${enq.name}?`,
                              () => deleteEnquiry(enq._id || enq.id)
                            )}
                            className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                            title={ad.delete}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[var(--admin-text)] bg-white p-3 rounded-lg border border-[var(--admin-border)] leading-relaxed">
                        {enq.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--admin-muted)]">
                    {isKn ? 'ಇನ್ನೂ ಯಾವುದೇ ವಿಚಾರಣೆಗಳು ಬಂದಿಲ್ಲ.' : 'No enquiries submitted yet.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 11: PROMO CODES */}
        {activeTab === 'offers' && (
          <div className="space-y-6 animate-fade-in">
            <div className="admin-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--admin-border)]">
                <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)]">
                  {isKn ? `ಪ್ರೋಮೋ ಕೋಡ್‌ಗಳು ಮತ್ತು ರಿಯಾಯಿತಿಗಳು (${offers.length})` : `Stay Updated & Direct Promo Codes (${offers.length})`}
                </h3>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalData({
                        code: '',
                        type: 'percent',
                        value: 15,
                        discountPercent: 15,
                        minNights: 1,
                        description: '',
                        isEdit: false
                      });
                      setModalType('offerModal');
                    }}
                    className="px-3.5 py-1.5 rounded-xl admin-btn-primary text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isKn ? 'ಪ್ರೋಮೋ ಕೋಡ್ ರಚಿಸಿ' : 'Create Promo Code'}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {offers.map((off) => (
                  <div key={off.code} className="p-4 rounded-xl admin-subcard border border-[var(--admin-border)] flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-mono text-base font-bold text-[var(--admin-heading)] block">{off.code}</span>
                      <span className="text-xs text-[var(--admin-muted)] block">
                        {off.discountPercent || off.value}% {isKn ? 'ರಿಯಾಯಿತಿ' : 'Discount'} · {off.description || off.desc}
                      </span>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setModalData({
                              _id: off._id,
                              code: off.code,
                              value: off.discountPercent || off.value || 10,
                              discountPercent: off.discountPercent || off.value || 10,
                              minNights: off.minNights || 1,
                              description: off.description || off.desc || '',
                              isActive: off.isActive !== false,
                              isEdit: true
                            });
                            setModalType('offerModal');
                          }}
                          className="p-1.5 text-[var(--admin-heading)] hover:bg-[#EEF2EA] rounded-lg cursor-pointer"
                          title={ad.edit}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openConfirm(
                            isKn ? 'ಪ್ರೋಮೋ ಕೋಡ್ ಅಳಿಸಿ' : 'Delete Promo',
                            isKn ? `${off.code} ಪ್ರೋಮೋ ಕೋಡ್ ಅನ್ನು ಅಳಿಸುವುದೇ?` : `Delete promo code ${off.code}?`,
                            () => deleteOffer(off.code, off._id)
                          )}
                          className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                          title={ad.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 12: USERS (Admin Only) */}
        {activeTab === 'users' && isAdmin && (
          <div className="space-y-6 animate-fade-in">
            <div className="admin-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--admin-border)]">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)]">
                    {isKn ? `ಸಿಬ್ಬಂದಿ ಮತ್ತು ನಿರ್ವಾಹಕರ ಖಾತೆಗಳು (${users.length})` : `Staff & Administrator Accounts (${users.length})`}
                  </h3>
                  <p className="text-xs text-[var(--admin-muted)] mt-0.5">
                    {isKn
                      ? 'ಹೋಮ್‌ಸ್ಟೇ ಸಿಬ್ಬಂದಿಗಾಗಿ ಆಂತರಿಕ ಖಾತೆಗಳು. ಅತಿಥಿ ಬುಕಿಂಗ್‌ಗಳನ್ನು ಬುಕಿಂಗ್‌ಗಳು ಟ್ಯಾಬ್‌ನಲ್ಲಿ ನಿರ್ವಹಿಸಲಾಗುತ್ತದೆ.'
                      : 'Internal management accounts for homestay staff. Guest reservations are managed in the Bookings tab.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModalData({
                      name: '',
                      email: '',
                      phone: '',
                      password: '',
                      role: 'staff',
                      isEdit: false
                    });
                    setModalType('userModal');
                  }}
                  className="px-3.5 py-1.5 rounded-xl admin-btn-primary text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isKn ? 'ಸಿಬ್ಬಂದಿ ಬಳಕೆದಾರರನ್ನು ಸೇರಿಸಿ' : 'Add Staff User'}</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[var(--admin-border)]">
                <table className="admin-table text-left text-xs">
                  <thead className="text-[11px] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4">{isKn ? 'ಹೆಸರು' : 'Name'}</th>
                      <th className="py-3 px-4">{isKn ? 'ಇಮೇಲ್' : 'Email'}</th>
                      <th className="py-3 px-4">{isKn ? 'ದೂರವಾಣಿ' : 'Phone'}</th>
                      <th className="py-3 px-4">{isKn ? 'ಪಾತ್ರ' : 'Role'}</th>
                      <th className="py-3 px-4 text-right">{ad.bookingsTab.colActions}</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--admin-text)]">
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td className="py-3 px-4 font-semibold text-[var(--admin-heading)]">{u.name}</td>
                        <td className="py-3 px-4 text-[var(--admin-muted)]">{u.email}</td>
                        <td className="py-3 px-4 text-[var(--admin-muted)] font-mono">{u.phone || 'N/A'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                            u.role === 'admin'
                              ? 'bg-[var(--admin-gold-soft)] text-[var(--admin-gold-text)] border-[#E6D5A7]'
                              : 'bg-[#EEF2EA] text-[var(--admin-heading)] border-[var(--admin-border)]'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setModalData({
                                  _id: u._id,
                                  name: u.name || '',
                                  email: u.email || '',
                                  phone: u.phone || '',
                                  role: u.role || 'staff',
                                  password: '',
                                  isEdit: true
                                });
                                setModalType('userModal');
                              }}
                              className="p-1.5 text-[var(--admin-heading)] hover:bg-[#EEF2EA] rounded-lg cursor-pointer"
                              title={ad.edit}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {u._id !== currentUser?._id && (
                              <button
                                type="button"
                                onClick={() => openConfirm(
                                  isKn ? 'ಬಳಕೆದಾರರನ್ನು ಅಳಿಸಿ' : 'Delete User',
                                  isKn ? `${u.name} ಬಳಕೆದಾರರನ್ನು ಅಳಿಸುವುದೇ?` : `Delete user ${u.name}?`,
                                  () => deleteUser(u._id)
                                )}
                                className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                                title={ad.delete}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 12B: POLICIES & SAFETY (Admin Edit / Staff Read-Only) */}
        {activeTab === 'policies' && (() => {
          const filteredSections = (Array.isArray(policySections) ? policySections : [])
            .filter((sec) => sec && sec.page === policyPageFilter)
            .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

          const sortedContacts = (Array.isArray(safetyContacts) ? [...safetyContacts] : [])
            .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

          const livePreviewTiers = normalizeCancellationTiers(policySettingsForm.cancellationTiers);
          const lowestPreviewTier = livePreviewTiers[livePreviewTiers.length - 1];
          const formattedPoliciesUpdated = formatPolicyLastUpdated(
            policiesLastUpdated || siteSettings?.policiesLastUpdated,
            isKn ? 'kn' : 'en'
          );

          const pageMeta = {
            policies: { label: isKn ? 'ನೀತಿಗಳು ಮತ್ತು ನಿಯಮಗಳು' : 'Policies & Terms', route: '/policies' },
            refund: { label: isKn ? 'ಮರುಪಾವತಿ ಮತ್ತು ರದ್ದತಿ' : 'Refund & Cancellation', route: '/refund-policy' },
            privacy: { label: isKn ? 'ಗೌಪ್ಯತಾ ನೀತಿ' : 'Privacy Policy', route: '/privacy' }
          };

          return (
            <div className="space-y-6 animate-fade-in">
              {/* Header Bar: Last Updated & Staff Read-Only Notice */}
              <div className="admin-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)]">
                      {isKn ? 'ನೀತಿಗಳು, ರದ್ದತಿ ಹಂತಗಳು ಮತ್ತು ಸುರಕ್ಷತಾ ನಿರ್ವಹಣೆ' : 'Policies, Cancellation Tiers & Safety Management'}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2EA] border border-[var(--admin-border)] text-[11px] font-medium text-[var(--admin-heading)]">
                      {isKn ? 'ಕೊನೆಯ ನವೀಕರಣ:' : 'Last updated:'} {formattedPoliciesUpdated || (isKn ? 'ಉಳಿಸಿದಾಗ ಸ್ವಯಂ ನವೀಕರಣ' : 'Auto-updated on save')}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--admin-muted)]">
                    {isKn
                      ? 'ದ್ವಿಭಾಷಾ ನೀತಿ ವಿಭಾಗಗಳು, ರದ್ದತಿ ದರಗಳು, ಸುರಕ್ಷತಾ ಸೌಲಭ್ಯಗಳು ಮತ್ತು ಸ್ಥಳೀಯ ತುರ್ತು ಸಂಪರ್ಕಗಳನ್ನು ನಿರ್ವಹಿಸಿ.'
                      : 'Manage bilingual (English & Kannada) policy sections, single-source cancellation tiers, safety feature checkboxes, and local emergency contacts.'}
                  </p>
                </div>

                {!isAdmin && (
                  <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2 self-start lg:self-center">
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isKn ? 'ಸಿಬ್ಬಂದಿ ವೀಕ್ಷಣೆ (ಓದಲು ಮಾತ್ರ)' : 'Staff View (Read-Only)'}</span>
                  </span>
                )}
              </div>

              {/* Sub-Tab Selector */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'sections', label: isKn ? 'ನೀತಿ ಪುಟದ ವಿಭಾಗಗಳು' : 'Policy Page Sections' },
                  { id: 'refund', label: isKn ? 'ಮರುಪಾವತಿ ಹಂತಗಳು ಮತ್ತು ನಿಯಮಗಳು' : 'Refund Tiers & Rules' },
                  { id: 'safetyFeatures', label: isKn ? 'ಸುರಕ್ಷತಾ ಸೌಲಭ್ಯಗಳು' : 'Safety Feature Checkboxes' },
                  { id: 'safetyContacts', label: isKn ? `ಸ್ಥಳೀಯ ಸುರಕ್ಷತಾ ಸಂಪರ್ಕಗಳು (${sortedContacts.length})` : `Local Safety Contacts (${sortedContacts.length})` }
                ].map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setPolicySubTab(sub.id)}
                    className={`px-4 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                      policySubTab === sub.id
                        ? 'admin-btn-primary shadow-sm'
                        : 'admin-btn-outline'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {/* SUB-TAB 1: POLICY PAGE SECTIONS */}
              {policySubTab === 'sections' && (
                <div className="admin-card p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--admin-border)] pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {Object.entries(pageMeta).map(([pKey, info]) => (
                        <button
                          key={pKey}
                          type="button"
                          onClick={() => setPolicyPageFilter(pKey)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                            policyPageFilter === pKey
                              ? 'admin-btn-secondary shadow-sm'
                              : 'admin-btn-outline'
                          }`}
                        >
                          {info.label} ({(Array.isArray(policySections) ? policySections : []).filter((s) => s.page === pKey).length})
                        </button>
                      ))}
                      <Link
                        to={pageMeta[policyPageFilter]?.route || '/policies'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg admin-btn-outline text-[11px] inline-flex items-center gap-1"
                      >
                        <span>{isKn ? 'ಲೈವ್ ನೋಡಿ' : 'View Live'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setModalData({
                            isNew: true,
                            page: policyPageFilter,
                            key: '',
                            icon: 'FileText',
                            titleEn: '',
                            titleKn: '',
                            contentEn: '',
                            contentKn: '',
                            displayOrder: filteredSections.length + 1,
                            isVisible: true,
                            keepSample: false
                          });
                          setModalType('policySectionModal');
                        }}
                        className="px-4 py-2 rounded-xl admin-btn-primary text-xs inline-flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isKn ? 'ವಿಭಾಗ ಸೇರಿಸಿ' : 'Add Section'}</span>
                      </button>
                    )}
                  </div>

                  {filteredSections.length === 0 ? (
                    <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                      <p className="font-semibold text-amber-900">
                        {isKn
                          ? `"${pageMeta[policyPageFilter]?.label}" ಪುಟಕ್ಕೆ ಇನ್ನೂ ಡೇಟಾಬೇಸ್ ವಿಭಾಗಗಳು ಕಂಡುಬಂದಿಲ್ಲ.`
                          : `No database policy sections found for "${pageMeta[policyPageFilter]?.label}" yet.`}
                      </p>
                      <p className="text-amber-800">
                        The public page is currently displaying the built-in static draft fallback ({DEFAULT_POLICY_SECTIONS.filter((s) => s.page === policyPageFilter).length} sample sections). Run the migration script (<code className="bg-white border border-amber-200 px-1.5 py-0.5 rounded font-mono text-amber-900">node seed/migrate-policies-v1.js</code>) to populate editable draft sections in MongoDB, or add a new section above.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredSections.map((sec, idx) => (
                        <div
                          key={sec._id || sec.key || idx}
                          className={`p-4 rounded-xl border transition-all ${
                            sec.isVisible === false
                              ? 'bg-slate-50 border-slate-200 opacity-75'
                              : 'bg-[var(--admin-surface-subtle)] border-[var(--admin-border)] hover:border-[var(--admin-gold)]'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[var(--admin-gold-text)]">
                                  {String(idx + 1).padStart(2, '0')}
                                </span>
                                <h4 className="font-serif text-base font-semibold text-[var(--admin-heading)]">
                                  {sec.title?.en || sec.key}
                                </h4>
                                {sec.isSample && (
                                  <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                                    {isKn ? 'ಮಾದರಿ ಮೌಲ್ಯ, ಪರಿಶೀಲಿಸಿ' : 'Sample value, please verify'}
                                  </span>
                                )}
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                                    sec.isVisible === false
                                      ? 'bg-slate-100 text-slate-700 border-slate-200'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  }`}
                                >
                                  {sec.isVisible === false ? (isKn ? 'ಮರೆಮಾಡಲಾಗಿದೆ' : 'Hidden') : (isKn ? 'ಗೋಚರ' : 'Visible')}
                                </span>
                              </div>
                              {sec.title?.kn && (
                                <p className="text-xs text-[var(--admin-gold-text)] font-medium">{sec.title.kn}</p>
                              )}
                              <p className="text-xs text-[var(--admin-text)] line-clamp-2 whitespace-pre-line">
                                {sec.content?.en}
                              </p>
                              <p className="text-[11px] text-[var(--admin-muted)]">
                                Slug: <span className="font-mono text-[var(--admin-heading)] font-medium">{sec.key}</span> • Kannada text: {sec.content?.kn ? 'Provided' : 'Missing (falls back to English)'}
                              </p>
                            </div>

                            {isAdmin && (
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMovePolicySection(idx, 'up', filteredSections)}
                                  className="p-2 rounded-lg admin-btn-outline disabled:opacity-35 cursor-pointer"
                                  title={isKn ? 'ಮೇಲೆ ಸರಿಸಿ' : 'Move Up'}
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === filteredSections.length - 1}
                                  onClick={() => handleMovePolicySection(idx, 'down', filteredSections)}
                                  className="p-2 rounded-lg admin-btn-outline disabled:opacity-35 cursor-pointer"
                                  title={isKn ? 'ಕೆಳಗೆ ಸರಿಸಿ' : 'Move Down'}
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => togglePolicySection(sec._id)}
                                  className="p-2 rounded-lg admin-btn-outline cursor-pointer"
                                  title={sec.isVisible === false ? (isKn ? 'ತೋರಿಸಿ' : 'Show Section') : (isKn ? 'ಮರೆಮಾಡಿ' : 'Hide Section')}
                                >
                                  {sec.isVisible === false ? <EyeOff className="w-3.5 h-3.5 text-amber-700" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setModalData({
                                      isNew: false,
                                      id: sec._id,
                                      page: sec.page,
                                      key: sec.key,
                                      icon: sec.icon || 'FileText',
                                      titleEn: sec.title?.en || '',
                                      titleKn: sec.title?.kn || '',
                                      contentEn: sec.content?.en || '',
                                      contentKn: sec.content?.kn || '',
                                      displayOrder: sec.displayOrder || idx + 1,
                                      isVisible: sec.isVisible !== false,
                                      keepSample: Boolean(sec.isSample)
                                    });
                                    setModalType('policySectionModal');
                                  }}
                                  className="px-2.5 py-2 rounded-lg admin-btn-secondary text-xs inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>{ad.edit}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openConfirm(
                                      isKn ? 'ನೀತಿ ವಿಭಾಗ ಅಳಿಸುವುದೇ?' : 'Delete Policy Section?',
                                      isKn ? `"${sec.title?.en || sec.key}" ಅನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸುವುದೇ?` : `Are you sure you want to permanently remove "${sec.title?.en || sec.key}"?`,
                                      () => deletePolicySection(sec._id)
                                    )
                                  }
                                  className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 cursor-pointer"
                                  title={isKn ? 'ವಿಭಾಗ ಅಳಿಸಿ' : 'Delete Section'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 2: SINGLE-SOURCE REFUND TIERS & RULES WITH LIVE TIMELINE PREVIEW */}
              {policySubTab === 'refund' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                  <form
                    onSubmit={handleSavePolicyRefundRules}
                    onChange={() => { isPolicyRefundDirtyRef.current = true; }}
                    className="xl:col-span-7 admin-card p-5 sm:p-6 space-y-5 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--admin-border)]">
                      <div>
                        <h4 className="font-serif text-base font-semibold text-[var(--admin-heading)] flex items-center flex-wrap gap-2">
                          <span>{isKn ? 'ರದ್ದತಿ ಹಂತಗಳು' : 'Cancellation Tiers'}</span>
                          {renderSampleBadge('cancellationTiers')}
                        </h4>
                        <p className="text-[11px] text-[var(--admin-muted)] mt-0.5">
                          {isKn
                            ? 'ಮರುಪಾವತಿ ನೀತಿ ಪುಟ, ಬುಕಿಂಗ್ ಚೆಕ್‌ಔಟ್, ಪಾಸ್, ಇಮೇಲ್ ಮತ್ತು ರೇಜರ್‌ಪೇ ಮರುಪಾವತಿ ಲೆಕ್ಕಾಚಾರಗಳಲ್ಲಿ ಬಳಸಲಾಗುತ್ತದೆ.'
                            : 'Used across Refund Policy page, Booking checkout review, Pass, Emails, Status Lookup, and Razorpay refund calculations.'}
                        </p>
                      </div>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            isPolicyRefundDirtyRef.current = true;
                            setPolicySettingsForm((prev) => ({
                              ...prev,
                              cancellationTiers: [...prev.cancellationTiers, { daysBeforeCheckIn: 3, refundPercent: 25 }]
                            }));
                          }}
                          className="px-3 py-1.5 rounded-lg admin-btn-outline inline-flex items-center gap-1 cursor-pointer flex-shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isKn ? 'ಹಂತ ಸೇರಿಸಿ' : 'Add Tier'}</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      {policySettingsForm.cancellationTiers.map((tier, tIdx) => (
                        <div
                          key={tIdx}
                          className="grid grid-cols-12 gap-2.5 items-end p-3 rounded-xl admin-subcard"
                        >
                          <div className="col-span-5">
                            <label className="text-[11px] font-semibold text-[var(--admin-heading)] block mb-1">
                              {isKn ? 'ಚೆಕ್-ಇನ್ ಮುನ್ನ ಕನಿಷ್ಠ ದಿನಗಳು' : 'Min Days Before Check-In'}
                            </label>
                            <input
                              type="number"
                              min="0"
                              disabled={!isAdmin}
                              value={tier.daysBeforeCheckIn}
                              onChange={(e) => {
                                isPolicyRefundDirtyRef.current = true;
                                const val = Math.max(0, Number(e.target.value) || 0);
                                setPolicySettingsForm((prev) => ({
                                  ...prev,
                                  cancellationTiers: prev.cancellationTiers.map((row, idx) =>
                                    idx === tIdx ? { ...row, daysBeforeCheckIn: val } : row
                                  )
                                }));
                              }}
                              className="w-full rounded-lg px-2.5 py-1.5 font-mono disabled:opacity-60"
                            />
                          </div>
                          <div className="col-span-5">
                            <label className="text-[11px] font-semibold text-[var(--admin-heading)] block mb-1">
                              {isKn ? 'ಮುಂಗಡದ ಮರುಪಾವತಿ (%)' : 'Refund % of Advance'}
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              disabled={!isAdmin}
                              value={tier.refundPercent}
                              onChange={(e) => {
                                isPolicyRefundDirtyRef.current = true;
                                const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                setPolicySettingsForm((prev) => ({
                                  ...prev,
                                  cancellationTiers: prev.cancellationTiers.map((row, idx) =>
                                    idx === tIdx ? { ...row, refundPercent: val } : row
                                  )
                                }));
                              }}
                              className="w-full rounded-lg px-2.5 py-1.5 font-mono disabled:opacity-60"
                            />
                          </div>
                          <div className="col-span-2 flex justify-end">
                            {isAdmin && policySettingsForm.cancellationTiers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  isPolicyRefundDirtyRef.current = true;
                                  setPolicySettingsForm((prev) => ({
                                    ...prev,
                                    cancellationTiers: prev.cancellationTiers.filter((_, idx) => idx !== tIdx)
                                  }));
                                }}
                                className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 cursor-pointer"
                                title={isKn ? 'ಹಂತ ತೆಗೆದುಹಾಕಿ' : 'Remove Tier'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                          <span>No-Show Refund (%)</span>
                          {renderSampleBadge('noShowRefundPercent')}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          disabled={!isAdmin}
                          value={policySettingsForm.noShowRefundPercent}
                          onChange={(e) => {
                            isPolicyRefundDirtyRef.current = true;
                            setPolicySettingsForm((prev) => ({ ...prev, noShowRefundPercent: e.target.value }));
                          }}
                          className="w-full rounded-lg px-3 py-1.5 font-mono disabled:opacity-60"
                        />
                      </div>

                      <div>
                        <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                          <span>Host Cancels (%)</span>
                          {renderSampleBadge('hostCancelsRefundPercent')}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          disabled={!isAdmin}
                          value={policySettingsForm.hostCancelsRefundPercent}
                          onChange={(e) => {
                            isPolicyRefundDirtyRef.current = true;
                            setPolicySettingsForm((prev) => ({ ...prev, hostCancelsRefundPercent: e.target.value }));
                          }}
                          className="w-full rounded-lg px-3 py-1.5 font-mono disabled:opacity-60"
                        />
                      </div>

                      <div>
                        <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                          <span>Refund Timeline</span>
                          {renderSampleBadge('refundTimelineText')}
                        </label>
                        <input
                          type="text"
                          disabled={!isAdmin}
                          value={policySettingsForm.refundTimelineText}
                          onChange={(e) => {
                            isPolicyRefundDirtyRef.current = true;
                            setPolicySettingsForm((prev) => ({ ...prev, refundTimelineText: e.target.value }));
                          }}
                          placeholder="5 to 7 working days"
                          className="w-full rounded-lg px-3 py-1.5 disabled:opacity-60"
                        />
                      </div>
                    </div>

                    {/* Date Change, Early Departure, Gateway Fee Note (EN/KN) */}
                    <div className="space-y-3 pt-3 border-t border-[var(--admin-border)]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                            <span>Date Change Rule (English)</span>
                            {renderSampleBadge('dateChangeRule')}
                          </label>
                          <textarea
                            rows={2}
                            disabled={!isAdmin}
                            value={policySettingsForm.dateChangeRule?.en || ''}
                            onChange={(e) => {
                              isPolicyRefundDirtyRef.current = true;
                              setPolicySettingsForm((prev) => ({
                                ...prev,
                                dateChangeRule: { ...prev.dateChangeRule, en: e.target.value }
                              }));
                            }}
                            className="w-full rounded-lg px-3 py-1.5 disabled:opacity-60"
                          />
                        </div>
                        <div>
                          <label className="text-[var(--admin-heading)] font-semibold block mb-1">Date Change Rule (Kannada)</label>
                          <textarea
                            rows={2}
                            disabled={!isAdmin}
                            value={policySettingsForm.dateChangeRule?.kn || ''}
                            onChange={(e) => {
                              isPolicyRefundDirtyRef.current = true;
                              setPolicySettingsForm((prev) => ({
                                ...prev,
                                dateChangeRule: { ...prev.dateChangeRule, kn: e.target.value }
                              }));
                            }}
                            className="w-full rounded-lg px-3 py-1.5 disabled:opacity-60"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                            <span>Early Departure Rule (English)</span>
                            {renderSampleBadge('earlyDepartureRule')}
                          </label>
                          <textarea
                            rows={2}
                            disabled={!isAdmin}
                            value={policySettingsForm.earlyDepartureRule?.en || ''}
                            onChange={(e) => {
                              isPolicyRefundDirtyRef.current = true;
                              setPolicySettingsForm((prev) => ({
                                ...prev,
                                earlyDepartureRule: { ...prev.earlyDepartureRule, en: e.target.value }
                              }));
                            }}
                            className="w-full rounded-lg px-3 py-1.5 disabled:opacity-60"
                          />
                        </div>
                        <div>
                          <label className="text-[var(--admin-heading)] font-semibold block mb-1">Early Departure Rule (Kannada)</label>
                          <textarea
                            rows={2}
                            disabled={!isAdmin}
                            value={policySettingsForm.earlyDepartureRule?.kn || ''}
                            onChange={(e) => {
                              isPolicyRefundDirtyRef.current = true;
                              setPolicySettingsForm((prev) => ({
                                ...prev,
                                earlyDepartureRule: { ...prev.earlyDepartureRule, kn: e.target.value }
                              }));
                            }}
                            className="w-full rounded-lg px-3 py-1.5 disabled:opacity-60"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                            <span>Gateway Fee Note (Optional EN — blank hides)</span>
                            {renderSampleBadge('gatewayFeeNote')}
                          </label>
                          <textarea
                            rows={2}
                            disabled={!isAdmin}
                            value={policySettingsForm.gatewayFeeNote?.en || ''}
                            onChange={(e) => {
                              isPolicyRefundDirtyRef.current = true;
                              setPolicySettingsForm((prev) => ({
                                ...prev,
                                gatewayFeeNote: { ...prev.gatewayFeeNote, en: e.target.value }
                              }));
                            }}
                            placeholder="Optional note on payment gateway charges..."
                            className="w-full rounded-lg px-3 py-1.5 disabled:opacity-60"
                          />
                        </div>
                        <div>
                          <label className="text-[var(--admin-heading)] font-semibold block mb-1">Gateway Fee Note (Optional KN)</label>
                          <textarea
                            rows={2}
                            disabled={!isAdmin}
                            value={policySettingsForm.gatewayFeeNote?.kn || ''}
                            onChange={(e) => {
                              isPolicyRefundDirtyRef.current = true;
                              setPolicySettingsForm((prev) => ({
                                ...prev,
                                gatewayFeeNote: { ...prev.gatewayFeeNote, kn: e.target.value }
                              }));
                            }}
                            className="w-full rounded-lg px-3 py-1.5 disabled:opacity-60"
                          />
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="pt-3 border-t border-[var(--admin-border)] space-y-3">
                        <label className="flex items-center gap-2 text-[var(--admin-heading)] font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={markPolicyRefundVerifiedOnSave}
                            onChange={(e) => setMarkPolicyRefundVerifiedOnSave(e.target.checked)}
                            className="rounded accent-[#1B4332] w-4 h-4"
                          />
                          <span>
                            {isKn
                              ? 'ಮಾಲೀಕರು ಪರಿಶೀಲಿಸಿದ್ದಾರೆ: ಉಳಿಸುವಾಗ ಮಾದರಿ ಬ್ಯಾಡ್ಜ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ'
                              : 'Owner verified: clear "Sample value, please verify" badges on save'}
                          </span>
                        </label>
                        <button
                          type="submit"
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl admin-btn-primary text-xs shadow-md cursor-pointer"
                        >
                          {isKn ? 'ಮರುಪಾವತಿ ಹಂತಗಳು ಮತ್ತು ನಿಯಮಗಳನ್ನು ಉಳಿಸಿ' : 'Save Refund Tiers & Rules'}
                        </button>
                      </div>
                    )}
                  </form>

                  {/* Live Cancellation Timeline Preview */}
                  <div className="xl:col-span-5 admin-card p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[var(--admin-gold-text)] font-bold">
                          {isKn ? 'ಲೈವ್ ಸಾರ್ವಜನಿಕ ವೇಳಾಪಟ್ಟಿ ಪೂರ್ವವೀಕ್ಷಣೆ' : 'Live Public Timeline Preview'}
                        </span>
                        <h4 className="font-serif text-base font-semibold text-[var(--admin-heading)]">
                          {isKn ? 'ಅತಿಥಿ ರದ್ದತಿ ವೇಳಾಪಟ್ಟಿ' : 'Guest Cancellation Schedule'}
                        </h4>
                      </div>
                      <Link
                        to="/refund-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-[var(--admin-gold-text)] hover:text-[var(--admin-heading)] hover:underline inline-flex items-center gap-1"
                      >
                        <span>{isKn ? 'ಪುಟ ತೆರೆಯಿರಿ' : 'Open Page'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    <div className="space-y-2.5">
                      {livePreviewTiers.map((tier, idx) => (
                        <div
                          key={tier.daysBeforeCheckIn}
                          className="p-3.5 rounded-xl admin-subcard space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-[var(--admin-heading)]">
                              {describeTierWindow(tier, idx, livePreviewTiers, isKn ? 'kn' : 'en')}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2EA] border border-[var(--admin-border)] text-[var(--admin-heading)] font-bold font-mono text-[11px]">
                              {tier.refundPercent}% {isKn ? 'ಮರುಪಾವತಿ' : 'Refund'}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[var(--admin-border)] overflow-hidden">
                            <div
                              className="h-full bg-[#B8964A] rounded-full"
                              style={{ width: `${Math.max(4, tier.refundPercent)}%` }}
                            />
                          </div>
                        </div>
                      ))}

                      {lowestPreviewTier && lowestPreviewTier.daysBeforeCheckIn > 0 && (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs">
                          <span className="text-red-900 font-medium">
                            Under {lowestPreviewTier.daysBeforeCheckIn} day{lowestPreviewTier.daysBeforeCheckIn === 1 ? '' : 's'} before check-in
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 font-bold font-mono text-[11px]">
                            0% Refund
                          </span>
                        </div>
                      )}

                      <div className="p-3.5 rounded-xl admin-subcard flex items-center justify-between text-xs">
                        <span className="text-[var(--admin-muted)]">{isKn ? 'ಹಾಜರಾಗದಿದ್ದಲ್ಲಿ (No-show)' : 'No-show'}</span>
                        <span className="font-mono font-bold text-[var(--admin-heading)]">
                          {Math.min(100, Math.max(0, Number(policySettingsForm.noShowRefundPercent) || 0))}% {isKn ? 'ಮರುಪಾವತಿ' : 'Refund'}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                        <span className="text-emerald-800 font-medium">{isKn ? 'ಆತಿಥೇಯರು ರದ್ದುಮಾಡಿದರೆ' : 'If host cancels'}</span>
                        <span className="font-mono font-bold text-emerald-800">
                          {Math.min(100, Math.max(0, Number(policySettingsForm.hostCancelsRefundPercent) ?? 100))}% {isKn ? 'ಮರುಪಾವತಿ' : 'Refund'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: SAFETY FEATURE CHECKBOXES */}
              {policySubTab === 'safetyFeatures' && (
                <form
                  onSubmit={handleSaveSafetyFeatures}
                  className="admin-card p-5 sm:p-6 max-w-4xl space-y-5 text-xs"
                >
                  <div className="border-b border-[var(--admin-border)] pb-3">
                    <h4 className="font-serif text-base font-semibold text-[var(--admin-heading)]">
                      {isKn ? 'ಆನ್-ಸೈಟ್ ಸುರಕ್ಷತಾ ಸೌಲಭ್ಯ ಕಾರ್ಡ್‌ಗಳು (/safety)' : 'On-Site Safety Feature Cards (/safety)'}
                    </h4>
                    <p className="text-[var(--admin-muted)] mt-1">
                      {isKn
                        ? 'ಪರಿಶೀಲಿಸಿದ ಸುರಕ್ಷತಾ ಅಂಶಗಳನ್ನು ಮಾತ್ರ ಸಕ್ರಿಯಗೊಳಿಸಿ. ಆಯ್ಕೆ ಮಾಡದ ಅಂಶಗಳನ್ನು ಸಾರ್ವಜನಿಕ ಪುಟದಲ್ಲಿ ಮರೆಮಾಡಲಾಗುತ್ತದೆ.'
                        : 'All features start unchecked by default. Unchecked items are completely hidden on the public Safety page — only enable items verified on the property.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {SAFETY_FEATURE_DEFS.map((feat) => {
                      const isChecked = Boolean(policySettingsForm.safetyFeatures?.[feat.key]);
                      return (
                        <label
                          key={feat.key}
                          className={`p-4 rounded-xl border transition-all flex items-start gap-3 ${
                            isAdmin ? 'cursor-pointer' : 'cursor-default'
                          } ${
                            isChecked
                              ? 'bg-emerald-50/70 border-emerald-600'
                              : 'bg-[var(--admin-surface-subtle)] border-[var(--admin-border)]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={!isAdmin}
                            checked={isChecked}
                            onChange={(e) => {
                              isPolicyRefundDirtyRef.current = true;
                              setPolicySettingsForm((prev) => ({
                                ...prev,
                                safetyFeatures: {
                                  ...prev.safetyFeatures,
                                  [feat.key]: e.target.checked
                                }
                              }));
                            }}
                            className="mt-1 rounded accent-[#1B4332] w-4 h-4 flex-shrink-0"
                          />
                          <div className="space-y-1">
                            <span className="font-semibold text-[var(--admin-heading)] block text-sm">
                              {feat.title.en}
                            </span>
                            <span className="text-[11px] text-[var(--admin-gold-text)] font-medium block">{feat.title.kn}</span>
                            <p className="text-[11px] text-[var(--admin-muted)] leading-relaxed">
                              {feat.description.en}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {isAdmin && (
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl admin-btn-primary text-xs shadow-md cursor-pointer"
                    >
                      {isKn ? 'ಸುರಕ್ಷತಾ ಆಯ್ಕೆಗಳನ್ನು ಉಳಿಸಿ' : 'Save Safety Feature Toggles'}
                    </button>
                  )}
                </form>
              )}

              {/* SUB-TAB 4: OWNER-ADDED LOCAL SAFETY CONTACTS */}
              {policySubTab === 'safetyContacts' && (
                <div className="admin-card p-5 sm:p-6 space-y-5 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--admin-border)] pb-4">
                    <div>
                      <h4 className="font-serif text-base font-semibold text-[var(--admin-heading)]">
                        {isKn ? 'ಸ್ಥಳೀಯ ತುರ್ತು ಸಂಪರ್ಕಗಳು (/safety)' : 'Local Emergency Contacts (/safety)'}
                      </h4>
                      <p className="text-[var(--admin-muted)] mt-1">
                        {isKn
                          ? 'ರಾಷ್ಟ್ರೀಯ ತುರ್ತು ಸಂಖ್ಯೆಗಳು (112, 108) ಮತ್ತು ಆತಿಥೇಯ ಸಂಪರ್ಕವು ಡೀಫಾಲ್ಟ್ ಆಗಿ ಕಾಣಿಸುತ್ತವೆ. ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆ/ಪೊಲೀಸ್ ಮಾಹಿತಿಯನ್ನು ಇಲ್ಲಿ ಸೇರಿಸಿ.'
                          : 'Only national numbers (112, 108) and your confirmed Host Contact appear by default. Nearest hospital, police station, and pharmacy cards stay hidden until added here.'}
                      </p>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setModalData({
                            isNew: true,
                            category: 'hospital',
                            nameEn: '',
                            nameKn: '',
                            phone: '',
                            distanceEn: '',
                            distanceKn: '',
                            notesEn: '',
                            notesKn: '',
                            displayOrder: sortedContacts.length + 1,
                            isVisible: true
                          });
                          setModalType('safetyContactModal');
                        }}
                        className="px-4 py-2 rounded-xl admin-btn-primary text-xs inline-flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isKn ? 'ಸುರಕ್ಷತಾ ಸಂಪರ್ಕ ಸೇರಿಸಿ' : 'Add Safety Contact'}</span>
                      </button>
                    )}
                  </div>

                  {sortedContacts.length === 0 ? (
                    <div className="p-6 rounded-xl admin-subcard text-center text-[var(--admin-muted)]">
                      {isKn
                        ? 'ಇನ್ನೂ ಯಾವುದೇ ಸ್ಥಳೀಯ ತುರ್ತು ಸಂಪರ್ಕಗಳನ್ನು ಸೇರಿಸಿಲ್ಲ.'
                        : <>No local emergency contacts added yet. The Nearby Services section is currently hidden on the public <code className="text-[var(--admin-heading)] font-mono font-semibold">/safety</code> page.</>}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sortedContacts.map((entry) => (
                        <div
                          key={entry._id}
                          className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                            entry.isVisible === false
                              ? 'bg-slate-50 border-slate-200 opacity-75'
                              : 'admin-subcard'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2EA] border border-[var(--admin-border)] text-[var(--admin-heading)] uppercase font-bold text-[10px]">
                                {entry.category}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                  entry.isVisible === false
                                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                {entry.isVisible === false ? (isKn ? 'ಮರೆಮಾಡಲಾಗಿದೆ' : 'Hidden') : (isKn ? 'ಗೋಚರ' : 'Visible')}
                              </span>
                            </div>
                            <h5 className="font-serif text-base font-semibold text-[var(--admin-heading)]">
                              {entry.name?.en}
                            </h5>
                            {entry.name?.kn && (
                              <p className="text-[11px] text-[var(--admin-gold-text)] font-medium">{entry.name.kn}</p>
                            )}
                            {entry.phone && (
                              <p className="font-mono text-[var(--admin-heading)] font-semibold">
                                {isKn ? 'ದೂರವಾಣಿ:' : 'Phone:'} {entry.phone}
                              </p>
                            )}
                            {entry.distance?.en && (
                              <p className="text-[var(--admin-muted)]">{isKn ? 'ದೂರ:' : 'Distance:'} {entry.distance.en}</p>
                            )}
                            {entry.notes?.en && (
                              <p className="text-[var(--admin-muted)]">{entry.notes.en}</p>
                            )}
                          </div>

                          {isAdmin && (
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--admin-border)]">
                              <button
                                type="button"
                                onClick={() => toggleSafetyContact(entry._id)}
                                className="p-2 rounded-lg admin-btn-outline cursor-pointer"
                                title={entry.isVisible === false ? (isKn ? 'ಸೈಟ್‌ನಲ್ಲಿ ತೋರಿಸಿ' : 'Show on Site') : (isKn ? 'ಸೈಟ್‌ನಿಂದ ಮರೆಮಾಡಿ' : 'Hide from Site')}
                              >
                                {entry.isVisible === false ? <EyeOff className="w-3.5 h-3.5 text-amber-700" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setModalData({
                                    isNew: false,
                                    id: entry._id,
                                    category: entry.category || 'hospital',
                                    nameEn: entry.name?.en || '',
                                    nameKn: entry.name?.kn || '',
                                    phone: entry.phone || '',
                                    distanceEn: entry.distance?.en || '',
                                    distanceKn: entry.distance?.kn || '',
                                    notesEn: entry.notes?.en || '',
                                    notesKn: entry.notes?.kn || '',
                                    displayOrder: entry.displayOrder || 1,
                                    isVisible: entry.isVisible !== false
                                  });
                                  setModalType('safetyContactModal');
                                }}
                                className="px-3 py-1.5 rounded-lg admin-btn-secondary inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>{ad.edit}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  openConfirm(
                                    isKn ? 'ಸುರಕ್ಷತಾ ಸಂಪರ್ಕ ಅಳಿಸುವುದೇ?' : 'Delete Safety Contact?',
                                    isKn ? `"${entry.name?.en}" ಅನ್ನು ತೆಗೆದುಹಾಕುವುದೇ?` : `Remove "${entry.name?.en}" from the Safety directory?`,
                                    () => deleteSafetyContact(entry._id)
                                  )
                                }
                                className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 cursor-pointer"
                                title={isKn ? 'ಸಂಪರ್ಕ ಅಳಿಸಿ' : 'Delete Contact'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* ================================================================= */}
        {/* TAB 13: SITE SETTINGS (Admin edit, Staff read-only) */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fade-in">
            <HomeBannerSettings
              isAdmin={isAdmin}
              siteSettings={siteSettings}
              saveSiteSettings={saveSiteSettings}
              showToast={showToast}
            />

            <div className="admin-card p-5 sm:p-6 max-w-4xl">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-[var(--admin-border)]">
                <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)]">
                  {isKn ? 'ಹೋಮ್‌ಸ್ಟೇ ಆಸ್ತಿ ಮತ್ತು ಆತಿಥೇಯರ ವಿವರಗಳು' : 'Homestay Property & Host Details'}
                </h3>
                {!isAdmin && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-semibold uppercase tracking-wider">
                    {isKn ? 'ಓದಲು ಮಾತ್ರ' : 'Read-only'}
                  </span>
                )}
              </div>

              <form
                onSubmit={isAdmin ? handleSaveSettings : (e) => e.preventDefault()}
                onChange={() => { isSettingsDirtyRef.current = true; }}
              >
                <fieldset disabled={!isAdmin} className="space-y-3.5 text-xs disabled:opacity-75">
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Property Name</label>
                  <input
                    type="text"
                    value={settingsForm.propertyName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, propertyName: e.target.value })}
                    className="w-full rounded-lg px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Tourism Registration Number</label>
                  <input
                    type="text"
                    value={settingsForm.registrationNumber}
                    onChange={(e) => setSettingsForm({ ...settingsForm, registrationNumber: e.target.value })}
                    className="w-full rounded-lg px-3 py-1.5 font-mono"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                      <span>Primary Host Phone</span>
                      {settingsForm.phone?.includes('XXXXX') && renderSampleBadge('phone')}
                    </label>
                    <input
                      type="text"
                      value={settingsForm.phone || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      className="w-full rounded-lg px-3 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                      <span>WhatsApp Number</span>
                      {settingsForm.whatsappNumber?.includes('XXXXX') && renderSampleBadge('whatsappNumber')}
                    </label>
                    <input
                      type="text"
                      value={settingsForm.whatsappNumber || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                      className="w-full rounded-lg px-3 py-1.5 font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[var(--admin-heading)] font-semibold block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={settingsForm.email}
                      onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                      className="w-full rounded-lg px-3 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[var(--admin-heading)] font-semibold block mb-1">UPI ID for Advance Payments</label>
                    <input
                      type="text"
                      value={settingsForm.upiId}
                      onChange={(e) => setSettingsForm({ ...settingsForm, upiId: e.target.value })}
                      className="w-full rounded-lg px-3 py-1.5 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Address</label>
                  <textarea
                    rows={2}
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    className="w-full rounded-lg px-3 py-1.5"
                  />
                </div>

                <div>
                  <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                    <span>Google Maps Share Link (Optional)</span>
                    {renderSampleBadge('googleMapsShareUrl')}
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.google.com/maps/dir/?api=1&destination=12.425583,75.911889 or leave empty for default GPS"
                    value={settingsForm.googleMapsShareUrl || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, googleMapsShareUrl: e.target.value })}
                    className="w-full rounded-lg px-3 py-1.5 text-xs font-mono"
                  />
                  <span className="text-[10px] text-[var(--admin-muted)] mt-0.5 block">
                    Direct share link sent to guests on WhatsApp and Booking Pass. Default: 12°25'32.1&quot;N 75°54'42.8&quot;E (driving directions).
                  </span>
                </div>

                {/* Social Media & Floating Action Links */}
                <div className="pt-3 border-t border-[var(--admin-border)]">
                  <h4 className="font-serif text-sm font-semibold text-[var(--admin-heading)] mb-3 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-[var(--admin-gold-text)]" />
                    <span>{isKn ? 'ಸಾಮಾಜಿಕ ಮಾಧ್ಯಮ ಚಾನಲ್‌ಗಳು (Instagram, Facebook ಮತ್ತು YouTube)' : 'Social Media Channels (Instagram, Facebook & YouTube)'}</span>
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[var(--admin-heading)] text-xs flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Instagram className="w-3.5 h-3.5 text-[#E1306C]" />
                          <span>Instagram Profile URL</span>
                        </span>
                        {isPlaceholderInstagramUrl(settingsForm.instagramUrl) && renderSampleBadge('instagramUrl')}
                      </label>
                      <input
                        type="url"
                        placeholder={DEFAULT_INSTAGRAM_URL}
                        value={settingsForm.instagramUrl || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })}
                        className="w-full rounded-lg px-3 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--admin-heading)] text-xs flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
                          <span>Facebook Page URL</span>
                        </span>
                        {isPlaceholderFacebookUrl(settingsForm.facebookUrl) && renderSampleBadge('facebookUrl')}
                      </label>
                      <input
                        type="url"
                        placeholder={DEFAULT_FACEBOOK_URL}
                        value={settingsForm.facebookUrl || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })}
                        className="w-full rounded-lg px-3 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--admin-heading)] text-xs flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Youtube className="w-3.5 h-3.5 text-[#FF0000]" />
                          <span>YouTube Channel URL</span>
                        </span>
                        {isPlaceholderYoutubeUrl(settingsForm.youtubeUrl) && renderSampleBadge('youtubeUrl')}
                      </label>
                      <input
                        type="url"
                        placeholder={DEFAULT_YOUTUBE_URL}
                        value={settingsForm.youtubeUrl || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, youtubeUrl: e.target.value })}
                        className="w-full rounded-lg px-3 py-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--admin-border)]">
                  <h4 className="font-serif text-sm font-semibold text-[var(--admin-heading)] mb-3">
                    {isKn ? 'ಆಸ್ತಿ ದರಗಳು ಮತ್ತು ಸೌಲಭ್ಯಗಳು' : 'Single Property Tariffs & Inclusions'}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                      <span>Price Per Night (Entire Homestay, ₹)</span>
                      {renderSampleBadge('pricePerNight')}
                    </label>
                    <input
                      type="number"
                      value={settingsForm.pricePerNight}
                      onChange={(e) => setSettingsForm({ ...settingsForm, pricePerNight: e.target.value })}
                      className="w-full rounded-lg px-3 py-1.5 text-[var(--admin-heading)] font-bold font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                      <span>Extra Guest Charge (₹)</span>
                      {renderSampleBadge('extraGuestCharge')}
                    </label>
                    <input
                      type="number"
                      value={settingsForm.extraGuestCharge}
                      onChange={(e) => setSettingsForm({ ...settingsForm, extraGuestCharge: e.target.value })}
                      className="w-full rounded-lg px-3 py-1.5 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                      <span>Meals Included</span>
                      {renderSampleBadge('mealsIncluded')}
                    </label>
                    <input
                      type="text"
                      value={settingsForm.mealsIncluded}
                      onChange={(e) => setSettingsForm({ ...settingsForm, mealsIncluded: e.target.value })}
                      placeholder="e.g. Breakfast"
                      className="w-full rounded-lg px-3 py-1.5"
                    />
                  </div>

                  <div>
                    <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                      <span>Tax Percent (%)</span>
                      {renderSampleBadge('taxPercent')}
                    </label>
                    <input
                      type="number"
                      value={settingsForm.taxPercent}
                      onChange={(e) => setSettingsForm({ ...settingsForm, taxPercent: e.target.value })}
                      className="w-full rounded-lg px-3 py-1.5 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                    <span>Inclusions Note</span>
                    {renderSampleBadge('inclusionsNote')}
                  </label>
                  <textarea
                    rows={2}
                    value={settingsForm.inclusionsNote}
                    onChange={(e) => setSettingsForm({ ...settingsForm, inclusionsNote: e.target.value })}
                    className="w-full rounded-lg px-3 py-1.5"
                  />
                </div>

                <div>
                  <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                    <span>Advance Payment Options (% comma separated)</span>
                    {renderSampleBadge('advanceOptions')}
                  </label>
                  <input
                    type="text"
                    value={settingsForm.advanceOptions}
                    onChange={(e) => setSettingsForm({ ...settingsForm, advanceOptions: e.target.value })}
                    placeholder="20, 50, 100"
                    className="w-full rounded-lg px-3 py-1.5 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                      <span>Check-In Time</span>
                      {renderSampleBadge('checkInTime')}
                    </label>
                    <input
                      type="text"
                      value={settingsForm.checkInTime}
                      onChange={(e) => setSettingsForm({ ...settingsForm, checkInTime: e.target.value })}
                      className="w-full rounded-lg px-3 py-1.5"
                    />
                  </div>

                  <div>
                    <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                      <span>Check-Out Time</span>
                      {renderSampleBadge('checkOutTime')}
                    </label>
                    <input
                      type="text"
                      value={settingsForm.checkOutTime}
                      onChange={(e) => setSettingsForm({ ...settingsForm, checkOutTime: e.target.value })}
                      className="w-full rounded-lg px-3 py-1.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                      <span>Min Nights</span>
                      {renderSampleBadge('minNights')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={settingsForm.minNights}
                      onChange={(e) => setSettingsForm({ ...settingsForm, minNights: e.target.value })}
                      className="w-full rounded-lg px-3 py-1.5 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                      <span>Max Advance (Days)</span>
                      {renderSampleBadge('maxAdvanceDays')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={settingsForm.maxAdvanceDays}
                      onChange={(e) => setSettingsForm({ ...settingsForm, maxAdvanceDays: e.target.value })}
                      className="w-full rounded-lg px-3 py-1.5 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                      <span>Same-Day Cutoff</span>
                      {renderSampleBadge('sameDayCutoffTime')}
                    </label>
                    <input
                      type="text"
                      placeholder="18:00"
                      value={settingsForm.sameDayCutoffTime}
                      onChange={(e) => setSettingsForm({ ...settingsForm, sameDayCutoffTime: e.target.value })}
                      className="w-full rounded-lg px-3 py-1.5 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                      <span>Hold Expiry (Minutes)</span>
                      {renderSampleBadge('holdMinutes')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={settingsForm.holdMinutes}
                      onChange={(e) => setSettingsForm({ ...settingsForm, holdMinutes: e.target.value })}
                      className="w-full rounded-lg px-3 py-1.5 font-mono"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-[var(--admin-heading)] font-medium text-xs">
                      <input
                        type="checkbox"
                        checked={settingsForm.autoConfirmAfterPayment}
                        onChange={(e) => setSettingsForm({ ...settingsForm, autoConfirmAfterPayment: e.target.checked })}
                        className="rounded accent-[#1B4332] w-4 h-4"
                      />
                      <span>Auto-Confirm After Payment</span>
                      {renderSampleBadge('autoConfirmAfterPayment')}
                    </label>
                  </div>
                </div>

                {/* Full Home Reservation Settings */}
                <div className="p-4 admin-subcard space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--admin-border)] pb-2">
                    <h5 className="font-semibold text-xs text-[var(--admin-heading)] uppercase tracking-wider">
                      {isKn ? 'ಪೂರ್ಣ ಮನೆ ಬುಕಿಂಗ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು (ಎಲ್ಲಾ 5 ಕೊಠಡಿಗಳು)' : 'Full Home Reservation Settings (All 5 Rooms)'}
                    </h5>
                    <label className="flex items-center gap-2 cursor-pointer text-[var(--admin-heading)] font-medium text-xs">
                      <input
                        type="checkbox"
                        checked={settingsForm.fullHomeEnabled !== false}
                        onChange={(e) => setSettingsForm({ ...settingsForm, fullHomeEnabled: e.target.checked })}
                        className="rounded accent-[#1B4332] w-4 h-4"
                      />
                      <span>Enable Full Home</span>
                      {renderSampleBadge('fullHomeEnabled')}
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 text-xs gap-1">
                        <span>Full Home Price / Night (₹)</span>
                        {renderSampleBadge('fullHomePricePerNight')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={settingsForm.fullHomePricePerNight}
                        onChange={(e) => setSettingsForm({ ...settingsForm, fullHomePricePerNight: e.target.value })}
                        className="w-full rounded-lg px-3 py-1.5 font-mono text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 text-xs gap-1">
                        <span>Full Home Min Nights</span>
                        {renderSampleBadge('fullHomeMinNights')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={settingsForm.fullHomeMinNights}
                        onChange={(e) => setSettingsForm({ ...settingsForm, fullHomeMinNights: e.target.value })}
                        className="w-full rounded-lg px-3 py-1.5 text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 text-xs gap-1">
                      <span>Full Home Meals Note</span>
                      {renderSampleBadge('fullHomeMealsNote')}
                    </label>
                    <input
                      type="text"
                      value={settingsForm.fullHomeMealsNote}
                      onChange={(e) => setSettingsForm({ ...settingsForm, fullHomeMealsNote: e.target.value })}
                      placeholder="Morning breakfast included"
                      className="w-full rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>

                {/* Cancellation & Refund Rules Link (Single Source in Policies Tab) */}
                <div className="p-4 rounded-xl bg-[var(--admin-gold-soft)] border border-[#E6D5A7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-[var(--admin-heading)]">
                      {isKn ? 'ರದ್ದತಿ ಮತ್ತು ಮರುಪಾವತಿ ನಿಯಮಗಳು (ಕೇಂದ್ರೀಕೃತ ನಿರ್ವಹಣೆ)' : 'Cancellation & Refund Tiers (Single Source of Truth)'}
                    </h4>
                    <p className="text-[11px] text-[var(--admin-muted)] mt-0.5">
                      {isKn
                        ? 'ಮರುಪಾವತಿ ಶೇಕಡಾವಾರು, ದಿನಾಂಕ ಮಿತಿಗಳು ಮತ್ತು ರೇಜರ್‌ಪೇ ನಿಯಮಗಳನ್ನು ನೀತಿಗಳು ಟ್ಯಾಬ್‌ನಲ್ಲಿ ನಿರ್ವಹಿಸಲಾಗುತ್ತದೆ.'
                        : 'Refund percentages, days-before-check-in tiers, Razorpay timeline, no-show, and host-cancellation rules are managed centrally in the Policies tab.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPolicySubTab('refund');
                      handleTabChange('policies');
                    }}
                    className="px-3.5 py-2 rounded-lg admin-btn-secondary text-xs flex-shrink-0 cursor-pointer"
                  >
                    {isKn ? 'ಮರುಪಾವತಿ ನಿಯಮಗಳನ್ನು ನಿರ್ವಹಿಸಿ →' : 'Manage Refund Tiers →'}
                  </button>
                </div>

                <div className="pt-3 border-t border-[var(--admin-border)]">
                  <h4 className="font-serif text-sm font-semibold text-[var(--admin-heading)] mb-3">
                    {isKn ? 'ವಿಷಯ ಮತ್ತು ಪುಟ ವಿವರಣೆಗಳು' : 'Content & Page Descriptions'}
                  </h4>
                </div>

                <div>
                  <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                    <span>Rooms Page Heading</span>
                    {renderSampleBadge('roomsPageHeading')}
                  </label>
                  <input
                    type="text"
                    value={settingsForm.roomsPageHeading}
                    onChange={(e) => setSettingsForm({ ...settingsForm, roomsPageHeading: e.target.value })}
                    className="w-full rounded-lg px-3 py-1.5"
                  />
                </div>

                <div>
                  <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                    <span>Rooms Page Description</span>
                    {renderSampleBadge('roomsPageDescription')}
                  </label>
                  <textarea
                    rows={2}
                    value={settingsForm.roomsPageDescription}
                    onChange={(e) => setSettingsForm({ ...settingsForm, roomsPageDescription: e.target.value })}
                    className="w-full rounded-lg px-3 py-1.5"
                  />
                </div>

                <div>
                  <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                    <span>About Page Story Text</span>
                    {renderSampleBadge('aboutStoryText')}
                  </label>
                  <textarea
                    rows={3}
                    value={settingsForm.aboutStoryText}
                    onChange={(e) => setSettingsForm({ ...settingsForm, aboutStoryText: e.target.value })}
                    className="w-full rounded-lg px-3 py-1.5"
                  />
                </div>

                <div>
                  <label className="text-[var(--admin-heading)] font-semibold flex items-center flex-wrap mb-1 gap-1">
                    <span>Driving Distances (Place: Distance | Time | Route per line)</span>
                    {renderSampleBadge('drivingDistances')}
                  </label>
                  <textarea
                    rows={4}
                    value={settingsForm.drivingDistances}
                    onChange={(e) => setSettingsForm({ ...settingsForm, drivingDistances: e.target.value })}
                    placeholder="Kushalnagar: 6 km | ~12 mins | Via BM Road / SH88&#10;Madikeri: 28 km | ~40 mins | Via NH 275&#10;Mysuru: 95 km | ~2 hrs 15 mins | Via Mysore-Madikeri Rd"
                    className="w-full rounded-lg px-3 py-1.5 font-mono text-xs sm:text-sm"
                  />
                </div>

                </fieldset>
                {isAdmin && (
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl admin-btn-primary uppercase text-xs mt-4 shadow-md cursor-pointer"
                  >
                    {isKn ? 'ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಉಳಿಸಿ' : 'Save Settings'}
                  </button>
                )}
              </form>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 14: ACTIVITY LOGS (Admin Only) */}
        {activeTab === 'logs' && isAdmin && (
          <div className="space-y-6 animate-fade-in">
            <div className="admin-card p-5 sm:p-6">
              <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)] mb-4">
                {isKn ? 'ಲೆಕ್ಕಪರಿಶೋಧನೆ ಮತ್ತು ಚಟುವಟಿಕೆ ಲಾಗ್' : 'Audit Trail & Activity Logs'}
              </h3>

              <div className="overflow-x-auto rounded-xl border border-[var(--admin-border)]">
                <table className="admin-table text-left text-xs">
                  <thead className="text-[11px] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4">{isKn ? 'ಸಮಯ' : 'Time'}</th>
                      <th className="py-3 px-4">{isKn ? 'ನಿರ್ವಹಿಸಿದವರು' : 'Actor'}</th>
                      <th className="py-3 px-4">{isKn ? 'ಕ್ರಿಯೆ' : 'Action'}</th>
                      <th className="py-3 px-4">{isKn ? 'ವಿಭಾಗ' : 'Entity'}</th>
                      <th className="py-3 px-4">{isKn ? 'ವಿವರಗಳು' : 'Details'}</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--admin-text)]">
                    {activityLogs.length > 0 ? (
                      activityLogs.map((log, i) => (
                        <tr key={log._id || i}>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-[var(--admin-muted)]">
                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Recent'}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-[var(--admin-heading)]">
                            {log.userName} ({log.userRole})
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-mono font-bold text-[var(--admin-gold-text)] text-[11px]">{log.action}</span>
                          </td>
                          <td className="py-2.5 px-4 text-[var(--admin-muted)]">{log.entityType}</td>
                          <td className="py-2.5 px-4 text-[var(--admin-muted)] font-mono text-[10px] truncate max-w-xs">
                            {JSON.stringify(log.details || {})}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-6 text-[var(--admin-muted)]">
                          {isKn ? 'ಇನ್ನೂ ಯಾವುದೇ ಚಟುವಟಿಕೆ ದಾಖಲೆಗಳಿಲ್ಲ.' : 'No activity records logged yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ================================================================= */}
      {/* MODALS (Manual Booking, Payment, Cancel, Add Room, Add Pkg, etc.) */}
      {/* ================================================================= */}
      {modalType === 'manualBooking' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="admin-modal-card bg-white border border-[var(--admin-border)] rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 my-auto max-h-[90vh] overflow-y-auto shadow-2xl">
            <h4 className="font-serif text-lg font-bold text-[var(--admin-heading)]">
              {isKn ? 'ಹೊಸ ಬುಕಿಂಗ್ ರಚಿಸಿ (ವಾಕ್-ಇನ್ / ಫೋನ್)' : 'Create Manual Booking (Walk-in / Phone)'}
            </h4>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await createManualBooking(modalData);
              setModalType(null);
            }} className="space-y-3 text-xs">
              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">
                  {isKn ? 'ಬುಕಿಂಗ್ ವಿಧ / ವಸತಿ' : 'Reservation Type / Accommodation'}
                </label>
                <select
                  value={modalData.bookingType === 'full_home' ? 'full_home' : modalData.roomId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'full_home') {
                      setModalData({
                        ...modalData,
                        bookingType: 'full_home',
                        roomId: undefined,
                        totalAmount: (resolvedFullHomePrice || siteSettings?.fullHomePricePerNight || 35000) * (modalData.nights || 1)
                      });
                    } else {
                      const selectedRoom = rooms.find(r => (r._id || r.id) === val);
                      setModalData({
                        ...modalData,
                        bookingType: 'room',
                        roomId: val,
                        quantity: 1,
                        totalAmount: (selectedRoom?.pricePerNight || 8000) * (modalData.nights || 1)
                      });
                    }
                  }}
                  className="w-full rounded-lg p-2"
                >
                  <optgroup label="Entire Property">
                    <option value="full_home">Full Home (All 5 Rooms) — {formatINR(resolvedFullHomePrice || siteSettings?.fullHomePricePerNight || 35000)}/night</option>
                  </optgroup>
                  <optgroup label="Individual Rooms (1 Room per Booking)">
                    {rooms.map(r => (
                      <option key={r.id || r._id} value={r._id || r.id}>{r.name} ({formatINR(r.pricePerNight)}/night)</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">
                  {isKn ? 'ಅತಿಥಿಯ ಹೆಸರು' : 'Guest Name'}
                </label>
                <input
                  type="text"
                  required
                  value={modalData.guestName}
                  onChange={(e) => setModalData({ ...modalData, guestName: e.target.value })}
                  className="w-full rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">
                    {isKn ? 'ದೂರವಾಣಿ' : 'Phone'}
                  </label>
                  <input
                    type="text"
                    required
                    value={modalData.phone}
                    onChange={(e) => setModalData({ ...modalData, phone: e.target.value })}
                    className="w-full rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">
                    {isKn ? 'ಇಮೇಲ್' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={modalData.email}
                    onChange={(e) => setModalData({ ...modalData, email: e.target.value })}
                    className="w-full rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">
                    {isKn ? 'ಚೆಕ್-ಇನ್ ದಿನಾಂಕ' : 'Check In'}
                  </label>
                  <input
                    type="date"
                    required
                    value={modalData.checkIn}
                    onChange={(e) => setModalData({ ...modalData, checkIn: e.target.value })}
                    className="w-full rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">
                    {isKn ? 'ಚೆಕ್-ಔಟ್ ದಿನಾಂಕ' : 'Check Out'}
                  </label>
                  <input
                    type="date"
                    required
                    value={modalData.checkOut}
                    onChange={(e) => setModalData({ ...modalData, checkOut: e.target.value })}
                    className="w-full rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">
                    {isKn ? 'ಒಟ್ಟು ಮೊತ್ತ (₹)' : 'Total Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    value={modalData.totalAmount}
                    onChange={(e) => setModalData({ ...modalData, totalAmount: Number(e.target.value) })}
                    className="w-full rounded-lg p-2 font-mono font-bold text-[var(--admin-heading)]"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">
                    {isKn ? 'ಮುಂಗಡ ಪಾವತಿ (₹)' : 'Advance Paid (₹)'}
                  </label>
                  <input
                    type="number"
                    value={modalData.advancePaid}
                    onChange={(e) => setModalData({ ...modalData, advancePaid: Number(e.target.value) })}
                    className="w-full rounded-lg p-2 font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--admin-border)]">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl admin-btn-outline text-xs cursor-pointer"
                >
                  {ad.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl admin-btn-primary text-xs cursor-pointer"
                >
                  {isKn ? 'ಬುಕಿಂಗ್ ರಚಿಸಿ' : 'Create Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Booking & Razorpay Details Modal */}
      {/* 1. UPGRADED BOOKING DETAILS MODAL */}
      {modalType === 'bookingDetails' && modalData && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="admin-modal-card bg-white border border-[var(--admin-border)] rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-5 my-auto max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-2 border-b border-[var(--admin-border)] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--admin-gold-text)] block">
                  {isKn ? 'ಬುಕಿಂಗ್ ವಿವರಗಳು ಮತ್ತು ಪಾವತಿ ಲೆಡ್ಜರ್' : 'Reservation Details & Payment Ledger'}
                </span>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <h4 className="font-serif text-lg font-bold text-[var(--admin-heading)]">
                    {modalData.bookingCode || modalData.id}
                  </h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getBookingStatusBadge(modalData.status)}`}
                  >
                    {getLocalizedStatusLabel(modalData.status || 'confirmed', language)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1.5 rounded-lg admin-btn-outline cursor-pointer"
                title={ad.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Attention Banner if dateChangeRequested */}
            {modalData.dateChangeRequested && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-red-900">
                <div className="flex items-center gap-2.5">
                  <Flag className="w-4 h-4 text-red-700 shrink-0" />
                  <div>
                    <span className="font-bold text-red-900 block text-xs">
                      {isKn ? 'ದಿನಾಂಕ ಸಮಸ್ಯೆ ಸೂಚನೆ ಸಕ್ರಿಯವಾಗಿದೆ' : 'Date Problem Flag Active'}
                    </span>
                    <span className="text-[11px] text-red-800 block">
                      {isKn ? 'ಕಾರಣ:' : 'Reason:'} {modalData.dateChangeReason || 'Maintenance or property hold'}
                    </span>
                    {modalData.dateChangeRequestedAt && (
                      <span className="text-[10px] text-red-700 font-mono block">
                        Requested: {new Date(modalData.dateChangeRequestedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const updated = await clearDateChangeFlag(modalData._id || modalData.id);
                    if (updated) setModalData(updated);
                    else setModalData({ ...modalData, dateChangeRequested: false });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-xs self-start sm:self-auto cursor-pointer"
                >
                  {isKn ? 'ಸೂಚನೆ ತೆರವುಗೊಳಿಸಿ' : 'Clear Flag'}
                </button>
              </div>
            )}

            {/* Refund Due Banner */}
            {modalData.refundDue > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-2 text-amber-900 text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-900 block">
                      {isKn ? `ಅತಿಥಿಗೆ ${formatINR(modalData.refundDue)} ಮರುಪಾವತಿ ಬಾಕಿ` : `Refund of ${formatINR(modalData.refundDue)} Due to Guest`}
                    </span>
                    <span className="text-[11px] text-amber-800 block">Tariff difference from date change adjustment.</span>
                  </div>
                </div>
                {modalData.razorpayPaymentId && (
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenChangeDatesModal(modalData);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs cursor-pointer shrink-0"
                  >
                    {isKn ? 'ಈಗ ಮರುಪಾವತಿಸಿ' : 'Refund Now'}
                  </button>
                )}
              </div>
            )}

            {/* Stay & Guest Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl admin-subcard space-y-1.5">
                <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--admin-gold-text)] block">
                  {isKn ? 'ವಸತಿ ಮತ್ತು ವೇಳಾಪಟ್ಟಿ' : 'Accommodation & Schedule'}
                </span>
                <p className="font-semibold text-[var(--admin-heading)]">
                  {modalData.bookingType === 'full_home'
                    ? (isKn ? 'ಪೂರ್ಣ ಮನೆ (ಎಲ್ಲಾ 5 ಕೊಠಡಿಗಳು)' : 'Full Home (All 5 Rooms: 2 Standard, 2 Suite, 1 Single)')
                    : (modalData.roomName || modalData.room?.name || 'Standard Room')}
                </p>
                <p className="text-[11px] text-[var(--admin-muted)]">
                  {isKn ? 'ದಿನಾಂಕ:' : 'Dates:'} {formatDisplayDate(modalData.checkIn)} – {formatDisplayDate(modalData.checkOut)} ({getNightsCount(modalData)} {getNightsCount(modalData) === 1 ? ad.checkInOut.night : ad.checkInOut.nights})
                </p>
                <p className="text-[11px] text-[var(--admin-muted)]">
                  {isKn ? 'ಅತಿಥಿಗಳು:' : 'Guests:'} {modalData.adults ?? modalData.guestCount?.adults ?? 2} {isKn ? 'ವಯಸ್ಕರು' : 'Adults'}{modalData.children ? `, ${modalData.children} ${isKn ? 'ಮಕ್ಕಳು' : 'Children'}` : ''}
                </p>
              </div>

              <div className="p-3.5 rounded-xl admin-subcard space-y-1.5">
                <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--admin-gold-text)] block">
                  {isKn ? 'ಅತಿಥಿ ಸಂಪರ್ಕ' : 'Guest Contact'}
                </span>
                <p className="font-semibold text-[var(--admin-heading)]">{modalData.guestName || modalData.guest?.fullName || 'Guest'}</p>
                <p className="text-[11px] text-[var(--admin-muted)] font-mono">{modalData.phone}</p>
                <p className="text-[11px] text-[var(--admin-muted)] break-all">{modalData.email}</p>
                {modalData.specialRequests && modalData.specialRequests !== 'None' && (
                  <p className="text-[10px] italic text-[var(--admin-heading)] bg-white p-1.5 rounded border border-[var(--admin-border)]">"{modalData.specialRequests}"</p>
                )}
              </div>
            </div>

            {/* Official Digital Check-In Pass Link */}
            <div className="p-3.5 rounded-xl admin-subcard space-y-1.5 text-xs">
              <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--admin-gold-text)] block">
                {isKn ? 'ಅಧಿಕೃತ ಚೆಕ್-ಇನ್ ಡಿಜಿಟಲ್ ಪಾಸ್ ಲಿಂಕ್' : 'Official Check-In Digital Pass Link'}
              </span>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/pass/${modalData.passToken || modalData.bookingCode || modalData.id}`}
                  className="w-full rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-emerald-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/pass/${modalData.passToken || modalData.bookingCode || modalData.id}`);
                    showToast('Pass link copied to clipboard', 'success');
                  }}
                  className="px-2.5 py-1.5 admin-btn-outline rounded-lg text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isKn ? 'ಕಾಪಿ' : 'Copy'}</span>
                </button>
                <a
                  href={`/pass/${modalData.passToken || modalData.bookingCode || modalData.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 admin-btn-primary rounded-lg text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isKn ? 'ತೆರೆಯಿರಿ' : 'Open'}</span>
                </a>
              </div>
            </div>

            {/* Financial & Razorpay Section */}
            <div className="p-4 rounded-xl admin-subcard space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[var(--admin-border)] pb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--admin-gold-text)]">
                  {isKn ? 'ಪಾವತಿ ವಿವರಗಳು ಮತ್ತು ಲೆಡ್ಜರ್' : 'Payment Breakdown & Ledger'}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getBookingPaymentBadge(modalData.paymentStatus)}`}
                >
                  {getLocalizedStatusLabel(modalData.paymentStatus || 'pending', language)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] text-[var(--admin-muted)] block">{isKn ? 'ಒಟ್ಟು ದರ' : 'Total Tariff'}</span>
                  <span className="font-mono font-bold text-[var(--admin-heading)] text-sm">
                    {formatINR(modalData.totalAmount || modalData.pricing?.total)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--admin-muted)] block">{isKn ? 'ಪಾವತಿಸಿದ ಮುಂಗಡ' : 'Advance Paid'}</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {formatINR(modalData.advancePaid || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--admin-muted)] block">{ad.checkInOut.balanceDue}</span>
                  <span className="font-mono font-bold text-[var(--admin-gold-text)] text-sm">
                    {formatINR(modalData.balanceDue || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--admin-muted)] block">{isKn ? 'ಮುಂಗಡ %' : 'Advance % Option'}</span>
                  <span className="font-bold text-[var(--admin-heading)] text-xs">
                    {modalData.advanceOption ? `${modalData.advanceOption}%` : '20%'}
                  </span>
                </div>
              </div>

              {/* Razorpay Ledger */}
              <div className="pt-2.5 border-t border-[var(--admin-border)] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-[9px] uppercase text-[var(--admin-muted)] block font-sans font-semibold">Razorpay Payment ID</span>
                  <span className="text-[var(--admin-heading)] select-all">{modalData.razorpayPaymentId || 'None (Manual / Cash)'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-[var(--admin-muted)] block font-sans font-semibold">Razorpay Order ID</span>
                  <span className="text-[var(--admin-heading)] select-all">{modalData.razorpayOrderId || 'None'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-[var(--admin-muted)] block font-sans font-semibold">Payment Method</span>
                  <span className="text-[var(--admin-heading)] uppercase">{modalData.razorpayPaymentMethod || modalData.paymentMethod || 'Online'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-[var(--admin-muted)] block font-sans font-semibold">Paid Timestamp</span>
                  <span className="text-[var(--admin-heading)]">{modalData.paidAt ? new Date(modalData.paidAt).toLocaleString() : 'N/A'}</span>
                </div>
              </div>

              {/* Refunds if any */}
              {Array.isArray(modalData.refunds) && modalData.refunds.length > 0 && (
                <div className="pt-2.5 border-t border-red-200 bg-red-50 p-3 rounded-lg space-y-1 text-xs text-red-900">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-red-800 block font-sans">
                    Refund Transactions
                  </span>
                  {modalData.refunds.map((r, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] font-mono">
                      <span>Refund ID: <strong>{r.refundId}</strong></span>
                      <span className="text-red-800 font-bold">{formatINR(r.amount || 0)} ({r.status})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status History Audit Timeline */}
            {Array.isArray(modalData.statusHistory) && modalData.statusHistory.length > 0 && (
              <div className="p-3.5 rounded-xl admin-subcard space-y-1.5 text-xs">
                <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--admin-gold-text)] block">
                  {isKn ? 'ಸ್ಥಿತಿ ಬದಲಾವಣೆಯ ಇತಿಹಾಸ' : 'Status Audit History Timeline'}
                </span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto text-[11px] text-[var(--admin-muted)]">
                  {modalData.statusHistory.map((h, i) => (
                    <div key={i} className="flex justify-between items-start border-b border-[var(--admin-border)] pb-1 gap-2">
                      <div>
                        <span className="font-semibold text-[var(--admin-heading)] capitalize">{h.status?.replace(/_/g, ' ') || 'Update'}: </span>
                        <span className="text-[var(--admin-text)]">{h.reason || 'No note'}</span>
                        <span className="text-[10px] text-[var(--admin-muted)] block">By {h.who || 'system'}</span>
                      </div>
                      <span className="text-[10px] text-[var(--admin-muted)] font-mono shrink-0">
                        {h.when ? new Date(h.when).toLocaleString() : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Host Notes with Save Button */}
            <div className="p-3.5 rounded-xl admin-subcard space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--admin-gold-text)]">
                  {isKn ? 'ಆತಿಥೇಯ / ನಿರ್ವಾಹಕರ ಟಿಪ್ಪಣಿಗಳು' : 'Host / Admin Notes'}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await updateBookingStatus(modalData._id || modalData.id, modalData.status, modalData.adminNotes);
                    showToast('Admin note saved', 'success');
                  }}
                  className="px-2.5 py-1 rounded-lg admin-btn-secondary text-[10px] cursor-pointer"
                >
                  {isKn ? 'ಟಿಪ್ಪಣಿ ಉಳಿಸಿ' : 'Save Note'}
                </button>
              </div>
              <textarea
                rows={2}
                value={modalData.adminNotes || ''}
                onChange={(e) => setModalData({ ...modalData, adminNotes: e.target.value })}
                placeholder="Add private operational notes about this booking..."
                className="w-full rounded-lg p-2 text-xs"
              />
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-[var(--admin-border)]">
              <div className="flex items-center gap-2 flex-wrap">
                {modalData.status === 'confirmed' && (
                  <button
                    type="button"
                    onClick={async () => {
                      const updated = await updateBookingStatus(modalData._id || modalData.id, 'checked_in');
                      if (updated) setModalData(updated);
                      else setModalData({ ...modalData, status: 'checked_in' });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs cursor-pointer"
                  >
                    {isKn ? 'ಚೆಕ್ ಇನ್ ಮಾಡಿ' : 'Check In'}
                  </button>
                )}

                {modalData.status === 'checked_in' && (
                  <button
                    type="button"
                    onClick={async () => {
                      const updated = await updateBookingStatus(modalData._id || modalData.id, 'checked_out');
                      if (updated) setModalData(updated);
                      else setModalData({ ...modalData, status: 'checked_out' });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                  >
                    {isKn ? 'ಚೆಕ್ ಔಟ್ ಮಾಡಿ' : 'Check Out'}
                  </button>
                )}

                {modalData.status !== 'cancelled' && modalData.status !== 'rejected' && modalData.status !== 'checked_out' && (
                  <>
                    {!isPlaceholderPhone(modalData.phone || modalData.primaryGuest?.phone) && (
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppModal(modalData)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-semibold text-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{ad.checkInOut.whatsappAction}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenCantHostModal(modalData)}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-semibold text-xs cursor-pointer"
                    >
                      {isKn ? 'ದಿನಾಂಕ ಸಮಸ್ಯೆ' : "Can't Host"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenChangeDatesModal(modalData)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 font-semibold text-xs cursor-pointer"
                    >
                      {isKn ? 'ದಿನಾಂಕ ಬದಲಿಸಿ' : 'Change Dates'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenCancelRefundModal(modalData)}
                      className="px-3 py-1.5 rounded-lg bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 font-semibold text-xs cursor-pointer"
                    >
                      {isKn ? 'ರದ್ದು ಮತ್ತು ಮರುಪಾವತಿ' : 'Cancel & Refund'}
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {modalData.balanceDue > 0 && (
                  <button
                    type="button"
                    onClick={() => handleOpenMarkBalanceModal(modalData)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer"
                  >
                    {isKn ? 'ಬಾಕಿ ಪಾವತಿಯಾಗಿದೆ' : 'Mark Balance Received'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-1.5 rounded-lg admin-btn-outline text-xs cursor-pointer"
                >
                  {ad.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CAN'T HOST THESE DATES MODAL */}
      {modalType === 'cantHostModal' && modalData && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="admin-modal-card bg-white border border-[var(--admin-border)] border-t-4 border-t-amber-600 rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 my-auto max-h-[90vh] overflow-y-auto text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--admin-border)]">
              <div className="flex items-center gap-2">
                <CalendarX className="w-5 h-5 text-amber-700" />
                <h4 className="font-serif text-base font-bold text-[var(--admin-heading)]">
                  {isKn ? `ಈ ದಿನಾಂಕಗಳಲ್ಲಿ ಆತಿಥ್ಯ ಸಾಧ್ಯವಿಲ್ಲ - ${modalData.bookingCode}` : `Can't Host These Dates - ${modalData.bookingCode}`}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg admin-btn-outline cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[var(--admin-muted)]">
              Flag this reservation with a date problem and notify the guest on WhatsApp with alternate dates or full refund offer.
            </p>

            {/* Preset Reasons */}
            <div className="space-y-2">
              <label className="text-[var(--admin-heading)] font-semibold block">Reason for being unable to host:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Maintenance', 'Property unavailable', 'Owner event', 'Other'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setModalData({ ...modalData, reasonType: r })}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold text-center cursor-pointer ${
                      modalData.reasonType === r
                        ? 'bg-[#B8964A] text-[#0F2A20] border-[#B8964A] font-bold'
                        : 'bg-[var(--admin-surface-subtle)] text-[var(--admin-text)] border-[var(--admin-border)] hover:border-[var(--admin-gold)]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {modalData.reasonType === 'Other' && (
                <input
                  type="text"
                  placeholder="Specify custom reason..."
                  value={modalData.customReason || ''}
                  onChange={(e) => setModalData({ ...modalData, customReason: e.target.value })}
                  className="w-full rounded-lg p-2 text-xs mt-1"
                />
              )}
            </div>

            {/* Optional 3 Alternate Date Ranges */}
            <div className="space-y-2 pt-2 border-t border-[var(--admin-border)]">
              <div className="flex items-center justify-between">
                <label className="text-[var(--admin-heading)] font-semibold">Offer Alternate Date Options (up to 3):</label>
                {modalData.alternateRanges.length < 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalData({
                        ...modalData,
                        alternateRanges: [...modalData.alternateRanges, { from: '', to: '' }]
                      });
                    }}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    + Add Range
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {modalData.alternateRanges.map((rng, idx) => (
                  <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2.5 rounded-lg admin-subcard">
                    <span className="font-mono text-[var(--admin-gold-text)] font-bold">#{idx + 1}</span>
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="date"
                        value={rng.from || ''}
                        onChange={(e) => {
                          const updated = [...modalData.alternateRanges];
                          updated[idx] = { ...updated[idx], from: e.target.value };
                          setModalData({ ...modalData, alternateRanges: updated });
                        }}
                        className="rounded-lg px-2 py-1 text-xs w-full"
                      />
                      <span className="text-[var(--admin-muted)]">to</span>
                      <input
                        type="date"
                        value={rng.to || ''}
                        onChange={(e) => {
                          const updated = [...modalData.alternateRanges];
                          updated[idx] = { ...updated[idx], to: e.target.value };
                          setModalData({ ...modalData, alternateRanges: updated });
                        }}
                        className="rounded-lg px-2 py-1 text-xs w-full"
                      />
                    </div>
                    {modalData.alternateRanges.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = modalData.alternateRanges.filter((_, i) => i !== idx);
                          setModalData({ ...modalData, alternateRanges: updated });
                        }}
                        className="p-1 text-red-700 hover:bg-red-50 rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp Live Preview */}
            <div className="space-y-2 pt-2 border-t border-[var(--admin-border)]">
              <div className="flex items-center justify-between">
                <span className="text-[var(--admin-heading)] font-semibold">WhatsApp Message Preview:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setModalData({ ...modalData, lang: 'en' })}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      modalData.lang === 'en'
                        ? 'bg-[#B8964A] text-[#0F2A20]'
                        : 'bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)] text-[var(--admin-muted)]'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalData({ ...modalData, lang: 'kn' })}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      modalData.lang === 'kn'
                        ? 'bg-[#B8964A] text-[#0F2A20]'
                        : 'bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)] text-[var(--admin-muted)]'
                    }`}
                  >
                    ಕನ್ನಡ
                  </button>
                </div>
              </div>

              {(() => {
                const effReason = modalData.reasonType === 'Other' ? (modalData.customReason || 'Maintenance') : modalData.reasonType;
                const validRanges = modalData.alternateRanges.filter((r) => r.from && r.to);
                const msgText = buildWhatsAppMessage('cannot_host', modalData.booking, siteSettings, {
                  reason: effReason,
                  alternateRanges: validRanges,
                  language: modalData.lang
                });

                return (
                  <>
                    <textarea
                      readOnly
                      rows={7}
                      value={msgText}
                      className="w-full rounded-lg p-2.5 font-mono text-[11px] leading-relaxed"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(msgText);
                            showToast('Message copied to clipboard', 'success');
                          }}
                          className="px-3 py-1.5 rounded-lg admin-btn-outline text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>

                        <a
                          href={buildWhatsAppShareUrl(msgText, modalData.phone)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Open in WhatsApp</span>
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          const res = await requestDateChange(modalData.bookingId, { reason: effReason });
                          if (res?.success !== false) {
                            setModalType(null);
                          }
                        }}
                        className="px-4 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs cursor-pointer shadow-sm"
                      >
                        Flag Booking &amp; Save
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 3. CHANGE DATES WORKFLOW MODAL */}
      {modalType === 'changeDatesModal' && modalData && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="admin-modal-card bg-white border border-[var(--admin-border)] border-t-4 border-t-blue-700 rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 my-auto max-h-[90vh] overflow-y-auto text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--admin-border)]">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-blue-700" />
                <h4 className="font-serif text-base font-bold text-[var(--admin-heading)]">
                  {isKn ? `ಬುಕಿಂಗ್ ದಿನಾಂಕ ಬದಲಿಸಿ - ${modalData.bookingCode}` : `Change Booking Dates - ${modalData.bookingCode}`}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg admin-btn-outline cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl admin-subcard space-y-1">
              <span className="text-[10px] uppercase font-bold text-[var(--admin-gold-text)] block">Current Reservation</span>
              <p className="text-[var(--admin-heading)] font-semibold">
                {formatDisplayDate(modalData.currentCheckIn)} – {formatDisplayDate(modalData.currentCheckOut)} ({modalData.currentNights} Nights)
              </p>
              <p className="text-[11px] text-[var(--admin-muted)]">
                Advance Paid: <strong className="text-emerald-700">{formatINR(modalData.advancePaid)}</strong> • Total: {formatINR(modalData.oldTotal)}
              </p>
            </div>

            {/* New Dates Picker */}
            <div className="space-y-2">
              <label className="text-[var(--admin-heading)] font-semibold block">Select New Stay Dates:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--admin-muted)] block text-[11px] mb-1 font-medium">New Check-In Date</label>
                  <input
                    type="date"
                    required
                    value={modalData.newCheckIn || ''}
                    onChange={(e) => setModalData({ ...modalData, newCheckIn: e.target.value })}
                    className="w-full rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-muted)] block text-[11px] mb-1 font-medium">New Check-Out Date</label>
                  <input
                    type="date"
                    required
                    value={modalData.newCheckOut || ''}
                    onChange={(e) => setModalData({ ...modalData, newCheckOut: e.target.value })}
                    className="w-full rounded-lg p-2 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Refund Options if applicable */}
            {modalData.advancePaid > 0 && modalData.booking.razorpayPaymentId && (
              <div className="p-3 rounded-xl admin-subcard space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-[var(--admin-heading)] font-medium">
                  <input
                    type="checkbox"
                    checked={modalData.processRefund}
                    onChange={(e) => setModalData({ ...modalData, processRefund: e.target.checked })}
                    className="rounded accent-[#1B4332]"
                  />
                  <span>Automatically process Razorpay partial refund if new stay cost is lower</span>
                </label>
              </div>
            )}

            {/* WhatsApp Live Preview */}
            <div className="space-y-2 pt-2 border-t border-[var(--admin-border)]">
              <div className="flex items-center justify-between">
                <span className="text-[var(--admin-heading)] font-semibold">Updated Pass Message:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setModalData({ ...modalData, lang: 'en' })}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      modalData.lang === 'en'
                        ? 'bg-[#B8964A] text-[#0F2A20]'
                        : 'bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)] text-[var(--admin-muted)]'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalData({ ...modalData, lang: 'kn' })}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      modalData.lang === 'kn'
                        ? 'bg-[#B8964A] text-[#0F2A20]'
                        : 'bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)] text-[var(--admin-muted)]'
                    }`}
                  >
                    ಕನ್ನಡ
                  </button>
                </div>
              </div>

              {(() => {
                const simulatedBooking = {
                  ...modalData.booking,
                  checkIn: modalData.newCheckIn,
                  checkOut: modalData.newCheckOut,
                  nights: (new Date(modalData.newCheckOut) - new Date(modalData.newCheckIn)) / (1000 * 3600 * 24)
                };
                const msgText = buildWhatsAppMessage('dates_changed', simulatedBooking, siteSettings, {
                  language: modalData.lang
                });

                return (
                  <>
                    <textarea
                      readOnly
                      rows={6}
                      value={msgText}
                      className="w-full rounded-lg p-2.5 font-mono text-[11px] leading-relaxed"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(msgText);
                            showToast('Message copied to clipboard', 'success');
                          }}
                          className="px-3 py-1.5 rounded-lg admin-btn-outline text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                        <a
                          href={buildWhatsAppShareUrl(msgText, modalData.phone)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Open in WhatsApp</span>
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if (modalData.newCheckOut <= modalData.newCheckIn) {
                            showToast('Check-out must be after check-in date', 'error');
                            return;
                          }
                          const res = await changeBookingDates(modalData.bookingId, {
                            checkIn: modalData.newCheckIn,
                            checkOut: modalData.newCheckOut,
                            processRefund: modalData.processRefund
                          });
                          if (res?.success !== false) {
                            setModalType(null);
                          }
                        }}
                        className="px-4 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs cursor-pointer shadow-sm"
                      >
                        Save New Dates
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 4. CANCEL & REFUND MODAL */}
      {modalType === 'cancelRefundModal' && modalData && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="admin-modal-card bg-white border border-[var(--admin-border)] border-t-4 border-t-red-700 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 my-auto max-h-[90vh] overflow-y-auto text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--admin-border)]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-700" />
                <h4 className="font-serif text-base font-bold text-[var(--admin-heading)]">
                  {isKn ? `ರದ್ದು & ಮರುಪಾವತಿ - ${modalData.bookingCode}` : `Cancel & Refund - ${modalData.bookingCode}`}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg admin-btn-outline cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cancellation Reason */}
            <div>
              <label className="text-[var(--admin-heading)] font-semibold block mb-1">
                Reason for Cancellation <span className="text-red-700">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={modalData.reason || ''}
                onChange={(e) => setModalData({ ...modalData, reason: e.target.value })}
                className="w-full rounded-lg p-2 text-xs"
                placeholder="Enter detailed reason for record and guest message..."
              />
            </div>

            {/* Refund Options if advance paid */}
            {modalData.paidAmount > 0 && (() => {
              const tierCalc = calculateTierRefund({
                settings: siteSettings,
                checkInDate: modalData.booking?.checkIn,
                paidAmount: modalData.paidAmount,
                hostCancelled: Boolean(modalData.hostCancelled),
                isNoShow: Boolean(modalData.isNoShow)
              });

              const recomputeIfTier = (nextFlags) => {
                const nextCalc = calculateTierRefund({
                  settings: siteSettings,
                  checkInDate: modalData.booking?.checkIn,
                  paidAmount: modalData.paidAmount,
                  hostCancelled: Boolean(nextFlags.hostCancelled),
                  isNoShow: Boolean(nextFlags.isNoShow)
                });
                setModalData((prev) => ({
                  ...prev,
                  ...nextFlags,
                  ...(prev.refundType === 'tier' ? { refundAmount: nextCalc.refundAmount } : {})
                }));
              };

              return (
                <div className="space-y-2.5 p-3.5 rounded-xl admin-subcard">
                  <label className="text-[var(--admin-heading)] font-semibold block">
                    Refund Processing (Advance Paid: {formatINR(modalData.paidAmount)})
                  </label>

                  <div className="flex flex-wrap gap-3 text-[11px] text-[var(--admin-text)] pb-2 border-b border-[var(--admin-border)]">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(modalData.hostCancelled)}
                        onChange={(e) =>
                          recomputeIfTier({
                            hostCancelled: e.target.checked,
                            isNoShow: e.target.checked ? false : modalData.isNoShow
                          })
                        }
                        className="rounded accent-[#1B4332]"
                      />
                      <span>Host cancels ({tierCalc.hostCancelsRefundPercent}%)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(modalData.isNoShow)}
                        onChange={(e) =>
                          recomputeIfTier({
                            isNoShow: e.target.checked,
                            hostCancelled: e.target.checked ? false : modalData.hostCancelled
                          })
                        }
                        className="rounded accent-[#1B4332]"
                      />
                      <span>Guest no-show ({tierCalc.noShowRefundPercent}%)</span>
                    </label>
                  </div>

                  <div className="space-y-2 text-[var(--admin-text)]">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="refundType"
                        checked={modalData.refundType === 'tier'}
                        onChange={() =>
                          setModalData({
                            ...modalData,
                            refundType: 'tier',
                            refundAmount: tierCalc.refundAmount
                          })
                        }
                        className="mt-0.5 accent-[#1B4332]"
                      />
                      <span>
                        <strong className="text-[var(--admin-heading)]">
                          Policy Tier Suggested ({tierCalc.refundPercent}% → {formatINR(tierCalc.refundAmount)})
                        </strong>
                        <span className="block text-[10px] text-[var(--admin-muted)]">
                          {modalData.hostCancelled
                            ? 'Host-cancelled full refund rule applied'
                            : modalData.isNoShow
                            ? 'No-show policy rule applied'
                            : tierCalc.daysBeforeCheckIn !== null
                            ? `${tierCalc.daysBeforeCheckIn} day(s) before check-in`
                            : 'Check-in date tier applied'}
                        </span>
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="refundType"
                        checked={modalData.refundType === 'full'}
                        onChange={() => setModalData({ ...modalData, refundType: 'full', refundAmount: modalData.paidAmount })}
                        className="accent-[#1B4332]"
                      />
                      <span>Full 100% Override ({formatINR(modalData.paidAmount)})</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="refundType"
                        checked={modalData.refundType === 'partial'}
                        onChange={() => setModalData({ ...modalData, refundType: 'partial' })}
                        className="accent-[#1B4332]"
                      />
                      <span>Custom Partial Refund</span>
                    </label>
                    {modalData.refundType === 'partial' && (
                      <div className="pl-6 pt-1">
                        <input
                          type="number"
                          min="1"
                          max={modalData.paidAmount}
                          value={modalData.refundAmount || ''}
                          onChange={(e) => setModalData({ ...modalData, refundAmount: Number(e.target.value) })}
                          placeholder="Enter refund amount in ₹"
                          className="rounded-lg p-1.5 font-mono text-xs w-40"
                        />
                      </div>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="refundType"
                        checked={modalData.refundType === 'none'}
                        onChange={() => setModalData({ ...modalData, refundType: 'none', refundAmount: 0 })}
                        className="accent-[#1B4332]"
                      />
                      <span>No Refund (₹0)</span>
                    </label>
                  </div>
                  <p className="text-[10px] text-[var(--admin-muted)] pt-1">
                    Timeline: {siteSettings?.refundTimelineText || '5 to 7 working days'}
                  </p>
                </div>
              );
            })()}

            {/* WhatsApp Live Preview */}
            <div className="space-y-2 pt-2 border-t border-[var(--admin-border)]">
              <div className="flex items-center justify-between">
                <span className="text-[var(--admin-heading)] font-semibold">WhatsApp Notice Preview:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setModalData({ ...modalData, lang: 'en' })}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      modalData.lang === 'en'
                        ? 'bg-[#B8964A] text-[#0F2A20]'
                        : 'bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)] text-[var(--admin-muted)]'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalData({ ...modalData, lang: 'kn' })}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                      modalData.lang === 'kn'
                        ? 'bg-[#B8964A] text-[#0F2A20]'
                        : 'bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)] text-[var(--admin-muted)]'
                    }`}
                  >
                    ಕನ್ನಡ
                  </button>
                </div>
              </div>

              {(() => {
                const msgText = buildWhatsAppMessage('cancelled_refunded', modalData.booking, siteSettings, {
                  reason: modalData.reason,
                  refundAmount: modalData.refundAmount,
                  language: modalData.lang
                });

                return (
                  <>
                    <textarea
                      readOnly
                      rows={5}
                      value={msgText}
                      className="w-full rounded-lg p-2.5 font-mono text-[11px] leading-relaxed"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(msgText);
                            showToast('Message copied to clipboard', 'success');
                          }}
                          className="px-3 py-1.5 rounded-lg admin-btn-outline text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                        <a
                          href={buildWhatsAppShareUrl(msgText, modalData.phone)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>WhatsApp</span>
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if (!modalData.reason || !modalData.reason.trim()) {
                            showToast('Cancellation reason is required', 'error');
                            return;
                          }
                          const res = await cancelAndRefundBooking(modalData.bookingId, {
                            reason: modalData.reason,
                            refundType: modalData.refundType,
                            refundAmount: modalData.refundAmount,
                            hostCancelled: Boolean(modalData.hostCancelled),
                            isNoShow: Boolean(modalData.isNoShow)
                          });
                          if (res?.success !== false) {
                            setModalType(null);
                          }
                        }}
                        className="px-4 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-xs cursor-pointer shadow-sm"
                      >
                        Confirm Cancellation
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 5. MARK BALANCE RECEIVED MODAL */}
      {modalType === 'markBalanceModal' && modalData && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="admin-modal-card bg-white border border-[var(--admin-border)] rounded-2xl max-w-sm w-full p-5 sm:p-6 space-y-4 my-auto text-xs shadow-2xl">
            <h4 className="font-serif text-base font-bold text-[var(--admin-heading)]">
              {isKn ? `ಬಾಕಿ ಪಾವತಿ ದಾಖಲಿಸಿ - ${modalData.bookingCode}` : `Mark Balance Received - ${modalData.bookingCode}`}
            </h4>
            <div className="p-3.5 rounded-xl admin-subcard space-y-1">
              <span className="text-[var(--admin-muted)] block text-[11px]">{isKn ? 'ಬಾಕಿ ಇರುವ ಮೊತ್ತ:' : 'Outstanding Balance Due:'}</span>
              <span className="font-mono text-lg font-bold text-[var(--admin-heading)]">
                {formatINR(modalData.balanceDue || 0)}
              </span>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const res = await markBalanceReceived(modalData.bookingId, {
                  amount: Number(modalData.amount),
                  paymentMethod: modalData.paymentMethod,
                  transactionId: modalData.transactionId,
                  notes: modalData.notes
                });
                if (res?.success !== false) {
                  setModalType(null);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Amount Received (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={modalData.amount}
                  onChange={(e) => setModalData({ ...modalData, amount: e.target.value })}
                  className="w-full rounded-lg p-2 text-emerald-700 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Payment Method</label>
                <select
                  value={modalData.paymentMethod}
                  onChange={(e) => setModalData({ ...modalData, paymentMethod: e.target.value })}
                  className="w-full rounded-lg p-2"
                >
                  <option value="Cash">Cash at Check-In</option>
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Bank Transfer">NEFT / Net Banking</option>
                </select>
              </div>

              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Transaction Ref / Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI ref or cash receipt"
                  value={modalData.notes || ''}
                  onChange={(e) => setModalData({ ...modalData, notes: e.target.value })}
                  className="w-full rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--admin-border)]">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-3 py-1.5 rounded-lg admin-btn-outline text-xs cursor-pointer"
                >
                  {ad.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  {isKn ? 'ಪಾವತಿ ಉಳಿಸಿ' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Modal (Add / Edit) */}
      {(modalType === 'addRoom' || modalType === 'roomModal') && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="admin-modal-card bg-white border border-[var(--admin-border)] rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-3 text-xs max-h-[90vh] overflow-y-auto shadow-2xl">
            <h4 className="font-serif text-base font-bold text-[var(--admin-heading)]">
              {modalData.isEdit
                ? (isKn ? `ಕೊಠಡಿ ತಿದ್ದಿ: ${modalData.name}` : `Edit Room: ${modalData.name}`)
                : (isKn ? 'ಹೊಸ ಕೊಠಡಿ ರಚಿಸಿ' : 'Create New Cottage / Room')}
            </h4>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const imgUrl = (modalData.image || '').trim();
              const existingImages = Array.isArray(modalData.images) ? modalData.images : [];
              const firstExisting = existingImages[0]
                ? (typeof existingImages[0] === 'string' ? existingImages[0] : existingImages[0]?.url)
                : '';
              const nextImages = imgUrl
                ? (firstExisting === imgUrl && existingImages.length > 0
                    ? existingImages.map((img) => (typeof img === 'string' ? { url: img, alt: modalData.name || 'Room Photo' } : img))
                    : [{ url: imgUrl, alt: modalData.name || 'Room Photo' }])
                : [];
              const nextAdults = Math.max(1, Number(modalData.maxAdults) || 2);
              const nextChildren = Math.max(0, Number(modalData.maxChildren ?? 0));
              const payload = {
                ...modalData,
                maxAdults: nextAdults,
                maxChildren: nextChildren,
                maxGuests: nextAdults + nextChildren,
                price: Number(modalData.pricePerNight) || 0,
                image: imgUrl,
                images: nextImages
              };
              if (modalData.isEdit) {
                await updateRoom(payload);
              } else {
                await addRoom(payload);
              }
              setModalType(null);
            }} className="space-y-3">
              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Room Name</label>
                <input
                  type="text"
                  required
                  value={modalData.name || ''}
                  onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                  placeholder="e.g. Arabica Wooden Suite"
                  className="w-full rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Total Available Units</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={modalData.totalUnits ?? 2}
                    onChange={(e) => setModalData({ ...modalData, totalUnits: Number(e.target.value) })}
                    className="w-full rounded-lg p-2 font-mono font-bold text-[var(--admin-heading)]"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Balcony Status</label>
                  <select
                    value={modalData.hasBalcony === false ? 'false' : 'true'}
                    onChange={(e) => setModalData({ ...modalData, hasBalcony: e.target.value === 'true' })}
                    className="w-full rounded-lg p-2"
                  >
                    <option value="true">Balcony Facing (Yes)</option>
                    <option value="false">No Balcony (Ground Room)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Meals Included</label>
                <input
                  type="text"
                  value={modalData.mealsIncluded ?? 'Morning breakfast'}
                  onChange={(e) => setModalData({ ...modalData, mealsIncluded: e.target.value })}
                  placeholder="e.g. Morning breakfast"
                  className="w-full rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Category</label>
                  <select
                    value={modalData.category || 'Cottage'}
                    onChange={(e) => setModalData({ ...modalData, category: e.target.value })}
                    className="w-full rounded-lg p-2"
                  >
                    <option value="Cottage">Cottage</option>
                    <option value="Suite">Suite</option>
                    <option value="Standard">Standard</option>
                    <option value="Single">Single</option>
                    <option value="Deluxe Room">Deluxe Room</option>
                  </select>
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold mb-1 flex items-center justify-between gap-1">
                    <span>Bed Layout</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">Sample value, please verify</span>
                  </label>
                  <input
                    type="text"
                    value={modalData.bedLayout || ''}
                    onChange={(e) => setModalData({ ...modalData, bedLayout: e.target.value })}
                    placeholder="e.g. 1 King Bed or 2 Double Beds"
                    className="w-full rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Weekday Tariff (₹)</label>
                  <input
                    type="number"
                    required
                    value={modalData.pricePerNight || 0}
                    onChange={(e) => setModalData({ ...modalData, pricePerNight: Number(e.target.value), price: Number(e.target.value) })}
                    className="w-full rounded-lg p-2 font-mono font-bold text-[var(--admin-heading)]"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Weekend Tariff (₹)</label>
                  <input
                    type="number"
                    value={modalData.weekendPrice || 0}
                    onChange={(e) => setModalData({ ...modalData, weekendPrice: Number(e.target.value) })}
                    className="w-full rounded-lg p-2 font-mono font-bold text-[var(--admin-heading)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Max Adults</label>
                  <input
                    type="number"
                    min="1"
                    value={modalData.maxAdults || 2}
                    onChange={(e) => setModalData({ ...modalData, maxAdults: Number(e.target.value) })}
                    className="w-full rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Max Children</label>
                  <input
                    type="number"
                    min="0"
                    value={modalData.maxChildren ?? 1}
                    onChange={(e) => setModalData({ ...modalData, maxChildren: Number(e.target.value) })}
                    className="w-full rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">View Description</label>
                <input
                  type="text"
                  value={modalData.view || ''}
                  onChange={(e) => setModalData({ ...modalData, view: e.target.value })}
                  placeholder="e.g. Coffee Estate & Garden View"
                  className="w-full rounded-lg p-2"
                />
              </div>

              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={modalData.description || ''}
                  onChange={(e) => setModalData({ ...modalData, description: e.target.value })}
                  className="w-full rounded-lg p-2"
                />
              </div>

              <ImageUploadOrDrive
                label="Room Photo (Upload File or Paste Google Drive Link)"
                value={modalData.image || ''}
                onChange={(url) => setModalData(prev => ({ ...prev, image: url }))}
                placeholder="Paste Google Drive share link or image URL..."
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--admin-border)]">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl admin-btn-outline cursor-pointer">{ad.cancel}</button>
                <button type="submit" className="px-5 py-2 rounded-xl admin-btn-primary cursor-pointer">
                  {modalData.isEdit ? (isKn ? 'ಕೊಠಡಿ ನವೀಕರಿಸಿ' : 'Update Room') : (isKn ? 'ಕೊಠಡಿ ಉಳಿಸಿ' : 'Save Room')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Package Modal (Add / Edit) */}
      {(modalType === 'addPackage' || modalType === 'packageModal') && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="admin-modal-card bg-white border border-[var(--admin-border)] rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-3 text-xs max-h-[90vh] overflow-y-auto shadow-2xl">
            <h4 className="font-serif text-base font-bold text-[var(--admin-heading)]">
              {modalData.isEdit ? `Edit Package: ${modalData.title}` : 'Create New Stay Package'}
            </h4>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const parsedPrice = modalData.price === '' || modalData.price === null || modalData.price === undefined
                ? null
                : Number(modalData.price);
              const payload = {
                title: modalData.title,
                name: modalData.title,
                price: parsedPrice,
                regularPrice: parsedPrice,
                offerPrice: parsedPrice,
                discount: modalData.discount ? String(modalData.discount).trim() : null,
                durationLabel: modalData.durationLabel || modalData.duration || 'Per Night',
                duration: modalData.durationLabel || modalData.duration || 'Per Night',
                idealFor: modalData.idealFor || '',
                description: modalData.description || '',
                image: modalData.image || '/images/realimage/homeimage.jpeg',
                inclusions: typeof modalData.inclusions === 'string'
                  ? modalData.inclusions.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
                  : (modalData.inclusions || []),
                isActive: modalData.isActive !== undefined ? modalData.isActive : true
              };
              if (modalData.isEdit) {
                await updatePackage(modalData._id || modalData.id, payload);
              } else {
                await addPackage(payload);
              }
              setModalType(null);
            }} className="space-y-3">
              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Package Title</label>
                <input
                  type="text"
                  required
                  value={modalData.title || ''}
                  onChange={(e) => setModalData({ ...modalData, title: e.target.value })}
                  placeholder="e.g. Room + Breakfast"
                  className="w-full rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Price (₹) (Leave empty if contact / dynamic)</label>
                  <input
                    type="number"
                    value={modalData.price ?? ''}
                    onChange={(e) => setModalData({ ...modalData, price: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="Empty for 'Contact us for rates'"
                    className="w-full rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Discount Tag (Optional)</label>
                  <input
                    type="text"
                    value={modalData.discount || ''}
                    onChange={(e) => setModalData({ ...modalData, discount: e.target.value })}
                    placeholder="e.g. 10% Off Group Booking"
                    className="w-full rounded-lg p-2 font-bold text-[var(--admin-gold-text)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Duration Label</label>
                  <input
                    type="text"
                    value={modalData.durationLabel || modalData.duration || ''}
                    onChange={(e) => setModalData({ ...modalData, durationLabel: e.target.value, duration: e.target.value })}
                    placeholder="e.g. Per Night"
                    className="w-full rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Ideal For</label>
                  <input
                    type="text"
                    value={modalData.idealFor || ''}
                    onChange={(e) => setModalData({ ...modalData, idealFor: e.target.value })}
                    placeholder="e.g. Couples, Families, Groups"
                    className="w-full rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={modalData.description || ''}
                  onChange={(e) => setModalData({ ...modalData, description: e.target.value })}
                  placeholder="e.g. Choose any room. Morning breakfast included."
                  className="w-full rounded-lg p-2"
                />
              </div>

              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Inclusions Summary (one per line)</label>
                <textarea
                  rows={4}
                  value={modalData.inclusions || ''}
                  onChange={(e) => setModalData({ ...modalData, inclusions: e.target.value })}
                  placeholder={"Choose any room (Standard, Suite, or Single)\nMorning breakfast included\nHigh-Speed Wi-Fi & Parking\nEvening Campfire"}
                  className="w-full rounded-lg p-2"
                />
              </div>

              <ImageUploadOrDrive
                label="Package Photo / Banner (Upload File or Paste Google Drive Link)"
                value={modalData.image || ''}
                onChange={(url) => setModalData(prev => ({ ...prev, image: url }))}
                placeholder="Paste Google Drive share link or image URL..."
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--admin-border)]">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl admin-btn-outline cursor-pointer">{ad.cancel}</button>
                <button type="submit" className="px-5 py-2 rounded-xl admin-btn-primary cursor-pointer">
                  {modalData.isEdit ? 'Update Package' : 'Save Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Experience Modal (Add / Edit) */}
      {(modalType === 'addExperience' || modalType === 'experienceModal') && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="admin-modal-card bg-white border border-[var(--admin-border)] rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-3 text-xs max-h-[90vh] overflow-y-auto shadow-2xl">
            <h4 className="font-serif text-base font-bold text-[var(--admin-heading)]">
              {modalData.isEdit ? `Edit Experience: ${modalData.title}` : 'Create New Experience'}
            </h4>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const payload = {
                title: modalData.title,
                category: modalData.category || '',
                duration: modalData.duration || modalData.durationLabel || '',
                durationLabel: modalData.durationLabel || modalData.duration || '',
                distance: modalData.distance || modalData.distanceLabel || '',
                distanceLabel: modalData.distanceLabel || modalData.distance || '',
                description: modalData.description || '',
                image: modalData.image || ''
              };
              if (modalData.isEdit) {
                await updateExperience(modalData._id || modalData.id, payload);
              } else {
                await addExperience(payload);
              }
              setModalType(null);
            }} className="space-y-3">
              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={modalData.title || ''}
                  onChange={(e) => setModalData({ ...modalData, title: e.target.value })}
                  placeholder="e.g. Estate Walk"
                  className="w-full rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Category (Optional)</label>
                  <input
                    type="text"
                    value={modalData.category || ''}
                    onChange={(e) => setModalData({ ...modalData, category: e.target.value })}
                    placeholder="e.g. Nature & Estate"
                    className="w-full rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Duration (Optional)</label>
                  <input
                    type="text"
                    value={modalData.duration || modalData.durationLabel || ''}
                    onChange={(e) => setModalData({ ...modalData, duration: e.target.value, durationLabel: e.target.value })}
                    placeholder="e.g. 1 Hour"
                    className="w-full rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={modalData.description || ''}
                  onChange={(e) => setModalData({ ...modalData, description: e.target.value })}
                  placeholder="Walk through the coffee estate surrounding the homestay."
                  className="w-full rounded-lg p-2"
                />
              </div>

              <ImageUploadOrDrive
                label="Experience Photo (Upload File or Paste Google Drive Link)"
                value={modalData.image || ''}
                onChange={(url) => setModalData(prev => ({ ...prev, image: url }))}
                placeholder="Paste Google Drive share link or image URL..."
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--admin-border)]">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl admin-btn-outline cursor-pointer">{ad.cancel}</button>
                <button type="submit" className="px-5 py-2 rounded-xl admin-btn-primary cursor-pointer">
                  {modalData.isEdit ? 'Update Experience' : 'Save Experience'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal (Add / Edit) */}
      {modalType === 'categoryModal' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="admin-modal-card bg-white border border-[var(--admin-border)] rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-3.5 text-xs max-h-[90vh] overflow-y-auto shadow-2xl">
            <h4 className="font-serif text-base font-bold text-[var(--admin-heading)]">
              {modalData.id ? (isKn ? 'ಮೆನು ವಿಭಾಗ ತಿದ್ದಿ' : 'Edit Menu Category') : (isKn ? 'ಹೊಸ ವಿಭಾಗ ಸೇರಿಸಿ' : 'Add New Category')}
            </h4>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const payload = {
                name: modalData.name,
                nameKn: modalData.nameKn,
                subtitle: modalData.subtitle,
                subtitleKn: modalData.subtitleKn,
                description: modalData.description,
                descriptionKn: modalData.descriptionKn,
                icon: modalData.icon || 'CookingPot',
                slug: modalData.slug || modalData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
              };
              if (modalData.id) {
                await updateMenuCategory(modalData.id, payload);
              } else {
                await addMenuCategory(payload);
              }
              setModalType(null);
            }} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Category Name (EN)</label>
                  <input
                    type="text"
                    required
                    value={modalData.name}
                    onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                    placeholder="e.g. Kodava Specialties"
                    className="w-full rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Category Name (KN)</label>
                  <input
                    type="text"
                    value={modalData.nameKn}
                    onChange={(e) => setModalData({ ...modalData, nameKn: e.target.value })}
                    placeholder="ಕೊಡವ ವಿಶೇಷ ಭಕ್ಷ್ಯಗಳು"
                    className="w-full rounded-lg p-2 font-serif"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Subtitle (EN)</label>
                  <input
                    type="text"
                    value={modalData.subtitle}
                    onChange={(e) => setModalData({ ...modalData, subtitle: e.target.value })}
                    placeholder="Ancestral Family Recipes"
                    className="w-full rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Subtitle (KN)</label>
                  <input
                    type="text"
                    value={modalData.subtitleKn}
                    onChange={(e) => setModalData({ ...modalData, subtitleKn: e.target.value })}
                    placeholder="ಸಾಂಪ್ರದಾಯಿಕ ಪಾಕವಿಧಾನ"
                    className="w-full rounded-lg p-2 font-serif"
                  />
                </div>
              </div>

              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Icon Style</label>
                <select
                  value={modalData.icon || 'CookingPot'}
                  onChange={(e) => setModalData({ ...modalData, icon: e.target.value })}
                  className="w-full rounded-lg p-2"
                >
                  <option value="CookingPot">Cooking Pot / Traditional</option>
                  <option value="Leaf">Leaf / Pure Vegetarian</option>
                  <option value="Flame">Flame / Barbeque & Grills</option>
                  <option value="Coffee">Coffee / Hot Beverages</option>
                </select>
              </div>

              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Description (EN)</label>
                <textarea
                  rows={2}
                  value={modalData.description}
                  onChange={(e) => setModalData({ ...modalData, description: e.target.value })}
                  className="w-full rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--admin-border)]">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl admin-btn-outline cursor-pointer">{ad.cancel}</button>
                <button type="submit" className="px-5 py-2 rounded-xl admin-btn-primary cursor-pointer">{isKn ? 'ವಿಭಾಗ ಉಳಿಸಿ' : 'Save Category'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dish Modal (Add / Edit) */}
      {(modalType === 'dishModal' || modalType === 'addMenuItem') && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="admin-modal-card bg-white border border-[var(--admin-border)] rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-3.5 text-xs max-h-[90vh] overflow-y-auto shadow-2xl">
            <h4 className="font-serif text-base font-bold text-[var(--admin-heading)]">
              {modalData.id ? (isKn ? 'ಮೆನು ಭಕ್ಷ್ಯ ತಿದ್ದಿ' : 'Edit Menu Dish') : (isKn ? 'ಮೆನು ಭಕ್ಷ್ಯ ಸೇರಿಸಿ' : 'Add Menu Dish')}
            </h4>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const parsedPrice = modalData.price === '' || modalData.price === null || modalData.price === undefined
                ? null
                : Number(modalData.price);
              const payload = {
                category: modalData.category,
                name: modalData.name,
                nameKn: modalData.nameKn,
                price: parsedPrice,
                isVeg: modalData.isVeg,
                badge: modalData.badge,
                badgeKn: modalData.badgeKn,
                description: modalData.description,
                descriptionKn: modalData.descriptionKn,
                image: modalData.image || '',
                isIllustrative: modalData.isIllustrative !== false,
                isActive: modalData.isActive !== undefined ? modalData.isActive : true
              };
              if (modalData.id) {
                await updateMenuItem(modalData.id, payload);
              } else {
                await addMenuItem(payload);
              }
              setModalType(null);
            }} className="space-y-3">
              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Target Category</label>
                <select
                  value={modalData.category}
                  onChange={(e) => setModalData({ ...modalData, category: e.target.value })}
                  className="w-full rounded-lg p-2"
                >
                  {diningMenu.map((c) => (
                    <option key={c.slug || c.id || c.category} value={c.slug || c.category || c.name}>
                      {c.name || c.category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Item Name (EN)</label>
                  <input
                    type="text"
                    required
                    value={modalData.name}
                    onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                    placeholder="e.g. Paputtu with egg curry"
                    className="w-full rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Item Name (KN)</label>
                  <input
                    type="text"
                    value={modalData.nameKn}
                    onChange={(e) => setModalData({ ...modalData, nameKn: e.target.value })}
                    placeholder="ಪಪುತ್ತು ಮತ್ತು ಮೊಟ್ಟೆ ಸಾರು"
                    className="w-full rounded-lg p-2 font-serif"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Price (₹) (Optional - hidden if empty)</label>
                  <input
                    type="number"
                    value={modalData.price ?? ''}
                    onChange={(e) => setModalData({ ...modalData, price: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="Leave empty to hide price"
                    className="w-full rounded-lg p-2 font-mono font-bold text-[var(--admin-heading)]"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Dietary Type</label>
                  <select
                    value={modalData.isVeg ? 'veg' : 'non-veg'}
                    onChange={(e) => setModalData({ ...modalData, isVeg: e.target.value === 'veg' })}
                    className="w-full rounded-lg p-2"
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Vegetarian</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Special Badge (EN)</label>
                  <input
                    type="text"
                    value={modalData.badge}
                    onChange={(e) => setModalData({ ...modalData, badge: e.target.value })}
                    placeholder="e.g. Signature"
                    className="w-full rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Special Badge (KN)</label>
                  <input
                    type="text"
                    value={modalData.badgeKn}
                    onChange={(e) => setModalData({ ...modalData, badgeKn: e.target.value })}
                    placeholder="ವಿಶೇಷ"
                    className="w-full rounded-lg p-2 font-serif"
                  />
                </div>
              </div>

              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Description (EN)</label>
                <textarea
                  rows={2}
                  value={modalData.description}
                  onChange={(e) => setModalData({ ...modalData, description: e.target.value })}
                  className="w-full rounded-lg p-2"
                />
              </div>

              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Description (KN)</label>
                <textarea
                  rows={2}
                  value={modalData.descriptionKn}
                  onChange={(e) => setModalData({ ...modalData, descriptionKn: e.target.value })}
                  className="w-full rounded-lg p-2 font-serif"
                />
              </div>

              <ImageUploadOrDrive
                label="Dish Image (Upload File or Paste Google Drive Link)"
                value={modalData.image || ''}
                onChange={(url) => setModalData(prev => ({ ...prev, image: url }))}
                placeholder="Paste Google Drive share link or image URL..."
              />

              <div className="flex items-center gap-2 pt-1 pb-1">
                <input
                  type="checkbox"
                  id="dishIsIllustrative"
                  checked={modalData.isIllustrative !== false}
                  onChange={(e) => setModalData({ ...modalData, isIllustrative: e.target.checked })}
                  className="rounded accent-[#1B4332] w-4 h-4"
                />
                <label htmlFor="dishIsIllustrative" className="text-[var(--admin-text)] cursor-pointer">
                  Show "Illustrative image" caption badge (uncheck if real photo)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--admin-border)]">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl admin-btn-outline cursor-pointer">{ad.cancel}</button>
                <button type="submit" className="px-5 py-2 rounded-xl admin-btn-primary cursor-pointer">{isKn ? 'ಭಕ್ಷ್ಯ ಉಳಿಸಿ' : 'Save Dish'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timing Item Modal (Add / Edit) */}
      {modalType === 'timingItemModal' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="admin-modal-card bg-white border border-[var(--admin-border)] rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-3.5 text-xs max-h-[90vh] overflow-y-auto shadow-2xl">
            <h4 className="font-serif text-base font-bold text-[var(--admin-heading)]">
              {modalData.idx !== undefined ? 'Edit Meal Timing Card' : 'Add Meal Timing Card'}
            </h4>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const newCard = {
                id: modalData.id || Date.now(),
                mealEn: modalData.mealEn,
                mealKn: modalData.mealKn,
                timeEn: modalData.timeEn,
                timeKn: modalData.timeKn || modalData.timeEn,
                includedEn: modalData.includedEn,
                includedKn: modalData.includedKn
              };
              let updated;
              if (modalData.idx !== undefined) {
                updated = [...timingsData.items];
                updated[modalData.idx] = newCard;
              } else {
                updated = [...timingsData.items, newCard];
              }
              setTimingsData({ ...timingsData, items: updated });
              await handleSaveTimings(updated);
              setModalType(null);
            }} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Meal Title (EN)</label>
                  <input
                    type="text"
                    required
                    value={modalData.mealEn}
                    onChange={(e) => setModalData({ ...modalData, mealEn: e.target.value })}
                    placeholder="e.g. Morning Breakfast"
                    className="w-full rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Meal Title (KN)</label>
                  <input
                    type="text"
                    value={modalData.mealKn}
                    onChange={(e) => setModalData({ ...modalData, mealKn: e.target.value })}
                    placeholder="ಬೆಳಗಿನ ಉಪಹಾರ"
                    className="w-full rounded-lg p-2 font-serif"
                  />
                </div>
              </div>

              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Time Schedule</label>
                <input
                  type="text"
                  required
                  value={modalData.timeEn}
                  onChange={(e) => setModalData({ ...modalData, timeEn: e.target.value })}
                  placeholder="07:30 AM – 10:00 AM"
                  className="w-full rounded-lg p-2 font-bold font-mono text-[var(--admin-heading)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Inclusions / Note (EN)</label>
                  <input
                    type="text"
                    value={modalData.includedEn}
                    onChange={(e) => setModalData({ ...modalData, includedEn: e.target.value })}
                    placeholder="Complimentary for all staying guests"
                    className="w-full rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Inclusions / Note (KN)</label>
                  <input
                    type="text"
                    value={modalData.includedKn}
                    onChange={(e) => setModalData({ ...modalData, includedKn: e.target.value })}
                    placeholder="ಎಲ್ಲಾ ಅತಿಥಿಗಳಿಗೆ ಉಚಿತ"
                    className="w-full rounded-lg p-2 font-serif"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--admin-border)]">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl admin-btn-outline cursor-pointer">{ad.cancel}</button>
                <button type="submit" className="px-5 py-2 rounded-xl admin-btn-primary cursor-pointer">Save Timing Card</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Modal (Add / Edit) */}
      {(modalType === 'addUser' || modalType === 'userModal') && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="admin-modal-card bg-white border border-[var(--admin-border)] rounded-2xl max-w-sm w-full p-5 sm:p-6 space-y-3 text-xs shadow-2xl">
            <h4 className="font-serif text-base font-bold text-[var(--admin-heading)]">
              {modalData.isEdit ? `Edit Staff Account: ${modalData.name}` : 'Create Staff Account'}
            </h4>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const payload = {
                name: modalData.name,
                email: modalData.email,
                phone: modalData.phone || '',
                role: modalData.role || 'staff'
              };
              if (modalData.password && modalData.password.trim()) {
                payload.password = modalData.password;
              }
              if (modalData.isEdit) {
                await updateUser(modalData._id, payload);
              } else {
                await addUser({ ...payload, password: modalData.password || 'Staff@2026' });
              }
              setModalType(null);
            }} className="space-y-3">
              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={modalData.name || ''}
                  onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                  className="w-full rounded-lg p-2"
                />
              </div>
              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={modalData.email || ''}
                  onChange={(e) => setModalData({ ...modalData, email: e.target.value })}
                  className="w-full rounded-lg p-2"
                />
              </div>
              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={modalData.phone || ''}
                  onChange={(e) => setModalData({ ...modalData, phone: e.target.value })}
                  placeholder="+91 95912 09522"
                  className="w-full rounded-lg p-2 font-mono"
                />
              </div>
              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Role</label>
                <select
                  value={modalData.role || 'staff'}
                  onChange={(e) => setModalData({ ...modalData, role: e.target.value })}
                  className="w-full rounded-lg p-2"
                >
                  <option value="staff">Staff (Operations)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>
              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">
                  {modalData.isEdit ? 'Change Password (leave empty to keep current)' : 'Initial Password (min 8 chars)'}
                </label>
                <input
                  type="password"
                  required={!modalData.isEdit}
                  minLength={modalData.isEdit ? 0 : 8}
                  placeholder={modalData.isEdit ? '•••••••• (unchanged)' : 'Enter strong password'}
                  value={modalData.password || ''}
                  onChange={(e) => setModalData({ ...modalData, password: e.target.value })}
                  className="w-full rounded-lg p-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--admin-border)]">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl admin-btn-outline cursor-pointer">{ad.cancel}</button>
                <button type="submit" className="px-5 py-2 rounded-xl admin-btn-primary cursor-pointer">
                  {modalData.isEdit ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promo Code Modal (Add / Edit) */}
      {(modalType === 'addOffer' || modalType === 'offerModal') && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="admin-modal-card bg-white border border-[var(--admin-border)] rounded-2xl max-w-sm w-full p-5 sm:p-6 space-y-3 text-xs shadow-2xl">
            <h4 className="font-serif text-base font-bold text-[var(--admin-heading)]">
              {modalData.isEdit ? `Edit Promo Code: ${modalData.code}` : 'Create Promo Discount Code'}
            </h4>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const payload = {
                code: (modalData.code || '').toUpperCase(),
                type: 'percent',
                value: Number(modalData.value || modalData.discountPercent || 10),
                discountPercent: Number(modalData.value || modalData.discountPercent || 10),
                minNights: Number(modalData.minNights || 1),
                description: modalData.description || '',
                isActive: modalData.isActive !== false
              };
              if (modalData.isEdit) {
                await updateOffer(modalData._id, payload);
              } else {
                await addOffer(payload);
              }
              setModalType(null);
            }} className="space-y-3">
              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Promo Code (e.g. COORGWEEKEND)</label>
                <input
                  type="text"
                  required
                  value={modalData.code || ''}
                  onChange={(e) => setModalData({ ...modalData, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-lg p-2 font-mono font-bold text-[var(--admin-heading)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Discount (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={modalData.value ?? modalData.discountPercent ?? 10}
                    onChange={(e) => setModalData({ ...modalData, value: Number(e.target.value), discountPercent: Number(e.target.value) })}
                    className="w-full rounded-lg p-2 font-mono font-bold text-[var(--admin-heading)]"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] font-semibold block mb-1">Min Nights</label>
                  <input
                    type="number"
                    min="1"
                    value={modalData.minNights || 1}
                    onChange={(e) => setModalData({ ...modalData, minNights: Number(e.target.value) })}
                    className="w-full rounded-lg p-2 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Description</label>
                <input
                  type="text"
                  value={modalData.description || ''}
                  onChange={(e) => setModalData({ ...modalData, description: e.target.value })}
                  placeholder="e.g. 15% off weekday stays"
                  className="w-full rounded-lg p-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--admin-border)]">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 rounded-xl admin-btn-outline cursor-pointer">{ad.cancel}</button>
                <button type="submit" className="px-5 py-2 rounded-xl admin-btn-primary cursor-pointer">
                  {modalData.isEdit ? 'Update Promo' : 'Create Promo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Share Pass Modal */}
      {modalType === 'whatsappPassModal' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="admin-modal-card bg-white border border-[var(--admin-border)] border-t-4 border-t-emerald-700 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 text-xs shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--admin-border)]">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-700" />
                <h4 className="font-serif text-base font-bold text-[var(--admin-heading)]">
                  {isKn ? 'ವಾಟ್ಸಾಪ್‌ಗೆ ಚೆಕ್-ಇನ್ ಪಾಸ್ ಕಳುಹಿಸಿ' : 'Share Check-In Pass to WhatsApp'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1.5 rounded-lg admin-btn-outline cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[var(--admin-heading)] block mb-1 font-semibold">Recipient Phone Number (with Country Code)</label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 bg-[var(--admin-surface-subtle)] text-[var(--admin-heading)] border border-[var(--admin-input-border)] rounded-lg font-mono font-bold">+</span>
                  <input
                    type="text"
                    value={modalData.phone || ''}
                    onChange={(e) => setModalData({ ...modalData, phone: e.target.value.replace(/\D/g, '') })}
                    placeholder="919591209522"
                    className="flex-1 rounded-lg p-2 font-mono text-sm"
                  />
                </div>
                <span className="text-[10px] text-[var(--admin-muted)] mt-0.5 block">Pre-filled from guest reservation. You can modify if needed.</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[var(--admin-heading)] font-semibold">Message Preview (Includes Pass Link &amp; Directions)</label>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(modalData.text);
                      setModalData(prev => ({ ...prev, copied: true }));
                      showToast('Pass message copied to clipboard!', 'success');
                      setTimeout(() => setModalData(prev => ({ ...prev, copied: false })), 2000);
                    }}
                    className="text-[var(--admin-gold-text)] hover:text-[var(--admin-heading)] flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                  >
                    {modalData.copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{modalData.copied ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                </div>
                <textarea
                  rows={9}
                  value={modalData.text || ''}
                  onChange={(e) => setModalData({ ...modalData, text: e.target.value })}
                  className="w-full rounded-xl p-3 font-mono text-[11px] leading-relaxed resize-none"
                />
              </div>

              <div className="p-2.5 rounded-xl admin-subcard flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-[var(--admin-muted)] font-medium">Direct Pass URL:</span>
                <a
                  href={`${window.location.origin}/pass/${modalData.booking?.passToken || modalData.bookingCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--admin-gold-text)] hover:underline font-mono truncate max-w-full sm:max-w-xs"
                >
                  {`${window.location.origin}/pass/${modalData.booking?.passToken || modalData.bookingCode}`}
                </a>
              </div>

              <div className="p-2.5 rounded-xl admin-subcard flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-[var(--admin-muted)] font-medium">Estate GPS &amp; Directions:</span>
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=12.425583,75.911889"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--admin-gold-text)] hover:underline font-mono truncate max-w-full sm:max-w-xs flex items-center gap-1"
                >
                  <span>📍 12°25&apos;32.1&quot;N 75°54&apos;42.8&quot;E (Google Maps)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--admin-border)]">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl admin-btn-outline cursor-pointer"
              >
                {ad.cancel}
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(modalData.text);
                    showToast('Pass message copied to clipboard!', 'success');
                  }}
                  className="px-3 py-2 rounded-xl admin-btn-outline flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Message</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const phone = (modalData.phone || '').replace(/\D/g, '');
                    const waUrl = buildWhatsAppShareUrl(modalData.text, phone);
                    window.open(waUrl, '_blank', 'noopener,noreferrer');
                    setModalType(null);
                    showToast('Opening WhatsApp with Booking Pass...', 'success');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inclusion Item Modal (Add / Edit) */}
      {modalType === 'inclusionModal' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="admin-modal-card bg-white border border-[var(--admin-border)] rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--admin-border)]">
              <h4 className="font-serif text-base font-bold text-[var(--admin-heading)]">
                {modalData.id || modalData._id ? "Edit Included / Excluded Item" : "Add New Item"}
              </h4>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg admin-btn-outline cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const payload = {
                  type: modalData.type || 'include',
                  title: {
                    en: modalData.titleEn || '',
                    kn: modalData.titleKn || ''
                  },
                  note: {
                    en: modalData.noteEn || '',
                    kn: modalData.noteKn || ''
                  },
                  icon: modalData.icon || 'Check',
                  displayOrder: Number(modalData.displayOrder) || 1,
                  isActive: modalData.isActive !== false,
                  isSample: false // explicitly clear sample flag once admin edits or creates
                };

                if (modalData._id || modalData.id) {
                  await updateInclusionItem(modalData._id || modalData.id, payload);
                } else {
                  await addInclusionItem(payload);
                }
                setModalType(null);
              }}
              className="space-y-3.5"
            >
              {/* Type Selection */}
              <div>
                <label className="text-[var(--admin-heading)] font-semibold block mb-1">Item Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalData({ ...modalData, type: 'include' })}
                    className={`py-2 px-3 rounded-xl font-semibold border text-center transition-all cursor-pointer ${
                      (modalData.type || 'include') === 'include'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold'
                        : 'bg-[var(--admin-surface-subtle)] border-[var(--admin-border)] text-[var(--admin-muted)]'
                    }`}
                  >
                    ✓ Included in Stay
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalData({ ...modalData, type: 'exclude' })}
                    className={`py-2 px-3 rounded-xl font-semibold border text-center transition-all cursor-pointer ${
                      modalData.type === 'exclude'
                        ? 'bg-amber-50 border-amber-600 text-amber-900 font-bold'
                        : 'bg-[var(--admin-surface-subtle)] border-[var(--admin-border)] text-[var(--admin-muted)]'
                    }`}
                  >
                    ✕ Not Included / Extra
                  </button>
                </div>
              </div>

              {/* Title (English & Kannada) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--admin-heading)] block mb-1 font-semibold">Title (English) *</label>
                  <input
                    type="text"
                    required
                    value={modalData.titleEn || ''}
                    onChange={(e) => setModalData({ ...modalData, titleEn: e.target.value })}
                    placeholder="e.g. High-Speed Wi-Fi"
                    className="w-full rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] block mb-1 font-semibold">Title (Kannada)</label>
                  <input
                    type="text"
                    value={modalData.titleKn || ''}
                    onChange={(e) => setModalData({ ...modalData, titleKn: e.target.value })}
                    placeholder="e.g. ವೇಗದ ವೈ-ಫೈ"
                    className="w-full rounded-lg p-2 font-serif"
                  />
                </div>
              </div>

              {/* Note (English & Kannada) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--admin-heading)] block mb-1 font-semibold">Help Note (English, optional)</label>
                  <textarea
                    rows={2}
                    value={modalData.noteEn || ''}
                    onChange={(e) => setModalData({ ...modalData, noteEn: e.target.value })}
                    placeholder="e.g. Ask host for extra portions"
                    className="w-full rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] block mb-1 font-semibold">Help Note (Kannada, optional)</label>
                  <textarea
                    rows={2}
                    value={modalData.noteKn || ''}
                    onChange={(e) => setModalData({ ...modalData, noteKn: e.target.value })}
                    placeholder="e.g. ಹೆಚ್ಚಿನ ವಿವರಗಳಿಗೆ ಆತಿಥೇಯರನ್ನು ಸಂಪರ್ಕಿಸಿ"
                    className="w-full rounded-lg p-2 font-serif"
                  />
                </div>
              </div>

              {/* Icon Picker & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--admin-heading)] block mb-1 font-semibold">Icon</label>
                  <select
                    value={modalData.icon || 'Check'}
                    onChange={(e) => setModalData({ ...modalData, icon: e.target.value })}
                    className="w-full rounded-lg p-2"
                  >
                    <option value="Check">Checkmark (Default Include)</option>
                    <option value="Home">Home / Entire Estate</option>
                    <option value="Wifi">Wi-Fi Internet</option>
                    <option value="Utensils">Food / Meals</option>
                    <option value="Coffee">Coffee / Refreshment</option>
                    <option value="Car">Car / Parking</option>
                    <option value="Flame">Campfire</option>
                    <option value="Gamepad2">Games / Recreation</option>
                    <option value="Compass">Compass / Walk</option>
                    <option value="Ban">Ban / Slash (Default Exclude)</option>
                    <option value="DollarSign">Personal Expense</option>
                    <option value="Users">Guests / Capacity</option>
                    <option value="Sparkles">Sparkles / Special</option>
                    <option value="ShieldCheck">Shield / Security</option>
                  </select>
                </div>

                <div>
                  <label className="text-[var(--admin-heading)] block mb-1 font-semibold">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={modalData.displayOrder || 1}
                    onChange={(e) => setModalData({ ...modalData, displayOrder: e.target.value })}
                    className="w-full rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="incIsActive"
                  checked={modalData.isActive !== false}
                  onChange={(e) => setModalData({ ...modalData, isActive: e.target.checked })}
                  className="rounded accent-[#1B4332] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="incIsActive" className="text-[var(--admin-heading)] font-semibold cursor-pointer">
                  Visible on Public Website (Active)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--admin-border)]">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl admin-btn-outline cursor-pointer"
                >
                  {ad.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl admin-btn-primary cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POLICY SECTION CREATE / EDIT MODAL */}
      {modalType === 'policySectionModal' && modalData && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="admin-modal-card bg-white border border-[var(--admin-border)] rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 my-auto max-h-[90vh] overflow-y-auto text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--admin-border)]">
              <h4 className="font-serif text-lg font-bold text-[var(--admin-heading)]">
                {modalData.isNew ? 'Add Policy Section' : 'Edit Policy Section'}
              </h4>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg admin-btn-outline cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const payload = {
                  page: modalData.page,
                  key: modalData.key,
                  icon: modalData.icon || 'FileText',
                  title: { en: modalData.titleEn, kn: modalData.titleKn },
                  content: { en: modalData.contentEn, kn: modalData.contentKn },
                  displayOrder: Number(modalData.displayOrder) || 1,
                  isVisible: modalData.isVisible !== false,
                  isSample: Boolean(modalData.keepSample)
                };
                const res = modalData.isNew
                  ? await addPolicySection(payload)
                  : await updatePolicySection(modalData.id, payload);
                if (res?.success) {
                  setModalType(null);
                }
              }}
              className="space-y-3.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[var(--admin-heading)] block mb-1 font-semibold">Page</label>
                  <select
                    disabled={!modalData.isNew}
                    value={modalData.page}
                    onChange={(e) => setModalData({ ...modalData, page: e.target.value })}
                    className="w-full rounded-lg p-2 disabled:opacity-60"
                  >
                    <option value="policies">Policies &amp; Terms (/policies)</option>
                    <option value="refund">Refund Policy (/refund-policy)</option>
                    <option value="privacy">Privacy Policy (/privacy)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[var(--admin-heading)] block mb-1 font-semibold">Icon</label>
                  <select
                    value={modalData.icon || 'FileText'}
                    onChange={(e) => setModalData({ ...modalData, icon: e.target.value })}
                    className="w-full rounded-lg p-2"
                  >
                    <option value="FileText">Document (FileText)</option>
                    <option value="CreditCard">Payment (CreditCard)</option>
                    <option value="Clock">Timing (Clock)</option>
                    <option value="UserCheck">Guest ID / Rights (UserCheck)</option>
                    <option value="Home">House Rules (Home)</option>
                    <option value="Users">Children / Guests (Users)</option>
                    <option value="UtensilsCrossed">Food / Meals (UtensilsCrossed)</option>
                    <option value="AlertTriangle">Liability / Alert (AlertTriangle)</option>
                    <option value="CloudRain">Force Majeure (CloudRain)</option>
                    <option value="RefreshCw">Changes / Refunds (RefreshCw)</option>
                    <option value="PhoneCall">Contact (PhoneCall)</option>
                    <option value="Database">Data Collection (Database)</option>
                    <option value="ShieldCheck">Security / Trust (ShieldCheck)</option>
                    <option value="Lock">Privacy (Lock)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[var(--admin-heading)] block mb-1 font-semibold">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={modalData.displayOrder || 1}
                    onChange={(e) => setModalData({ ...modalData, displayOrder: e.target.value })}
                    className="w-full rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--admin-heading)] block mb-1 font-semibold">
                    Heading (English) <span className="text-red-700">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={modalData.titleEn}
                    onChange={(e) => setModalData({ ...modalData, titleEn: e.target.value })}
                    className="w-full rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] block mb-1 font-semibold">Heading (Kannada)</label>
                  <input
                    type="text"
                    value={modalData.titleKn}
                    onChange={(e) => setModalData({ ...modalData, titleKn: e.target.value })}
                    className="w-full rounded-lg p-2 font-serif"
                  />
                </div>
              </div>

              <div>
                <label className="text-[var(--admin-heading)] block mb-1 font-semibold">
                  Body Text (English — prefix lines with <code className="bg-[#EEF2EA] px-1 rounded font-mono text-[var(--admin-heading)]">- </code> for bullets) <span className="text-red-700">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  value={modalData.contentEn}
                  onChange={(e) => setModalData({ ...modalData, contentEn: e.target.value })}
                  className="w-full rounded-lg p-2.5 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-[var(--admin-heading)] block mb-1 font-semibold">
                  Body Text (Kannada — optional, lines starting with <code className="bg-[#EEF2EA] px-1 rounded font-mono text-[var(--admin-heading)]">- </code> render as bullets)
                </label>
                <textarea
                  rows={5}
                  value={modalData.contentKn}
                  onChange={(e) => setModalData({ ...modalData, contentKn: e.target.value })}
                  className="w-full rounded-lg p-2.5 font-serif leading-relaxed"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2 text-[var(--admin-heading)] font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalData.isVisible !== false}
                    onChange={(e) => setModalData({ ...modalData, isVisible: e.target.checked })}
                    className="rounded accent-[#1B4332]"
                  />
                  <span>Visible on Public Page</span>
                </label>

                <label className="flex items-center gap-2 text-amber-800 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(modalData.keepSample)}
                    onChange={(e) => setModalData({ ...modalData, keepSample: e.target.checked })}
                    className="rounded accent-amber-700"
                  />
                  <span>Keep &ldquo;Sample value, please verify&rdquo; flag</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--admin-border)]">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl admin-btn-outline cursor-pointer"
                >
                  {ad.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl admin-btn-primary cursor-pointer"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SAFETY CONTACT CREATE / EDIT MODAL */}
      {modalType === 'safetyContactModal' && modalData && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="admin-modal-card bg-white border border-[var(--admin-border)] rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 my-auto max-h-[90vh] overflow-y-auto text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--admin-border)]">
              <h4 className="font-serif text-lg font-bold text-[var(--admin-heading)]">
                {modalData.isNew ? 'Add Local Safety Contact' : 'Edit Local Safety Contact'}
              </h4>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg admin-btn-outline cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const payload = {
                  category: modalData.category,
                  name: { en: modalData.nameEn, kn: modalData.nameKn },
                  phone: modalData.phone,
                  distance: { en: modalData.distanceEn, kn: modalData.distanceKn },
                  notes: { en: modalData.notesEn, kn: modalData.notesKn },
                  displayOrder: Number(modalData.displayOrder) || 1,
                  isVisible: modalData.isVisible !== false
                };
                const res = modalData.isNew
                  ? await addSafetyContact(payload)
                  : await updateSafetyContact(modalData.id, payload);
                if (res?.success) {
                  setModalType(null);
                }
              }}
              className="space-y-3.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--admin-heading)] block mb-1 font-semibold">Category</label>
                  <select
                    value={modalData.category}
                    onChange={(e) => setModalData({ ...modalData, category: e.target.value })}
                    className="w-full rounded-lg p-2"
                  >
                    <option value="hospital">Nearest Hospital / Clinic</option>
                    <option value="police">Police Station</option>
                    <option value="pharmacy">Pharmacy / Medical Store</option>
                    <option value="other">Other Verified Helpline</option>
                  </select>
                </div>

                <div>
                  <label className="text-[var(--admin-heading)] block mb-1 font-semibold">Phone Number</label>
                  <input
                    type="text"
                    value={modalData.phone}
                    onChange={(e) => setModalData({ ...modalData, phone: e.target.value })}
                    placeholder="Verified phone number"
                    className="w-full rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--admin-heading)] block mb-1 font-semibold">
                    Facility / Contact Name (English) <span className="text-red-700">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={modalData.nameEn}
                    onChange={(e) => setModalData({ ...modalData, nameEn: e.target.value })}
                    className="w-full rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] block mb-1 font-semibold">Name (Kannada)</label>
                  <input
                    type="text"
                    value={modalData.nameKn}
                    onChange={(e) => setModalData({ ...modalData, nameKn: e.target.value })}
                    className="w-full rounded-lg p-2 font-serif"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--admin-heading)] block mb-1 font-semibold">Approximate Distance (English)</label>
                  <input
                    type="text"
                    value={modalData.distanceEn}
                    onChange={(e) => setModalData({ ...modalData, distanceEn: e.target.value })}
                    placeholder="e.g. ~6 km from homestay"
                    className="w-full rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] block mb-1 font-semibold">Distance (Kannada)</label>
                  <input
                    type="text"
                    value={modalData.distanceKn}
                    onChange={(e) => setModalData({ ...modalData, distanceKn: e.target.value })}
                    className="w-full rounded-lg p-2 font-serif"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--admin-heading)] block mb-1 font-semibold">Notes (English)</label>
                  <textarea
                    rows={2}
                    value={modalData.notesEn}
                    onChange={(e) => setModalData({ ...modalData, notesEn: e.target.value })}
                    className="w-full rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[var(--admin-heading)] block mb-1 font-semibold">Notes (Kannada)</label>
                  <textarea
                    rows={2}
                    value={modalData.notesKn}
                    onChange={(e) => setModalData({ ...modalData, notesKn: e.target.value })}
                    className="w-full rounded-lg p-2 font-serif"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-[var(--admin-heading)] font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalData.isVisible !== false}
                    onChange={(e) => setModalData({ ...modalData, isVisible: e.target.checked })}
                    className="rounded accent-[#1B4332]"
                  />
                  <span>Visible on Public /safety Page</span>
                </label>

                <div className="flex items-center gap-2">
                  <label className="text-[var(--admin-heading)] font-semibold">Order:</label>
                  <input
                    type="number"
                    min="1"
                    value={modalData.displayOrder || 1}
                    onChange={(e) => setModalData({ ...modalData, displayOrder: e.target.value })}
                    className="w-16 rounded-lg p-1.5 text-center font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--admin-border)]">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl admin-btn-outline cursor-pointer"
                >
                  {ad.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl admin-btn-primary cursor-pointer"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
