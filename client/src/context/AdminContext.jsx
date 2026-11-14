import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  ROOMS_DATA, 
  DINING_DATA, 
  PACKAGES_DATA, 
  REVIEWS_DATA, 
  PROMO_CODES, 
  HOMESTAY_INFO,
  GALLERY_DATA,
  EXPERIENCES_DATA,
  INCLUSIONS_DATA
} from '../data/homestayData';
import { api } from '../services/api';
import { DEFAULT_POLICY_SECTIONS } from '../data/policyDefaults';
import {
  DEFAULT_CANCELLATION_TIERS,
  DEFAULT_SAFETY_FEATURES,
  DEFAULT_DATE_CHANGE_RULE,
  DEFAULT_EARLY_DEPARTURE_RULE,
  DEFAULT_GATEWAY_FEE_NOTE
} from '../utils/refundPolicy';
import {
  DEFAULT_HERO_BANNER,
  normalizeHeroBannerSettingsClient
} from '../utils/heroBannerDefaults';
import {
  isPlaceholderPhone,
  isPlaceholderEmail,
  resolveHostPhone,
  resolveHostEmail,
  resolveInstagramUrl,
  resolveFacebookUrl,
  resolveYoutubeUrl
} from '../utils/whatsappMessages';

const noopAsync = async () => ({ success: false, message: 'Initializing context' });
const noopFn = () => {};

const DEFAULT_ADMIN_CONTEXT = {
  currentUser: null,
  isAuthenticated: false,
  authChecking: false,
  login: noopAsync,
  logout: noopAsync,
  changePassword: noopAsync,
  loading: false,
  apiOnline: false,
  syncVersion: 0,
  broadcastAdminSync: noopFn,
  toast: null,
  showToast: noopFn,
  rooms: ROOMS_DATA,
  bookings: [],
  blockedDates: [],
  diningMenu: DINING_DATA,
  packages: PACKAGES_DATA,
  experiences: EXPERIENCES_DATA,
  inclusions: INCLUSIONS_DATA,
  setInclusions: noopFn,
  policySections: DEFAULT_POLICY_SECTIONS,
  setPolicySections: noopFn,
  safetyContacts: [],
  setSafetyContacts: noopFn,
  policiesLastUpdated: null,
  reviews: [],
  adminReviews: [],
  offers: PROMO_CODES,
  enquiries: [],
  gallery: GALLERY_DATA,
  users: [],
  activityLogs: [],
  siteSettings: HOMESTAY_INFO,
  resolvedFullHomePrice: HOMESTAY_INFO?.fullHomePrice || 42000,
  saveSiteSettings: noopAsync,
  refreshData: noopAsync,
  refreshAdminData: noopAsync,
  refreshAdminBookings: noopAsync,
  addBooking: noopAsync,
  createManualBooking: noopAsync,
  updateBookingStatus: noopAsync,
  recordPayment: noopAsync,
  cancelBookingWithReason: noopAsync,
  requestDateChange: noopAsync,
  clearDateChangeFlag: noopFn,
  changeBookingDates: noopAsync,
  cancelAndRefundBooking: noopAsync,
  markBalanceReceived: noopAsync,
  deleteBooking: noopAsync,
  toggleBlockDate: noopAsync,
  updateRoom: noopAsync,
  addRoom: noopAsync,
  deleteRoom: noopAsync,
  addPackage: noopAsync,
  updatePackage: noopAsync,
  deletePackage: noopAsync,
  addExperience: noopAsync,
  updateExperience: noopAsync,
  deleteExperience: noopAsync,
  addInclusionItem: noopAsync,
  updateInclusionItem: noopAsync,
  deleteInclusionItem: noopAsync,
  reorderInclusionItems: noopAsync,
  toggleInclusionItem: noopAsync,
  addPolicySection: noopAsync,
  updatePolicySection: noopAsync,
  deletePolicySection: noopAsync,
  reorderPolicySections: noopAsync,
  togglePolicySection: noopAsync,
  addSafetyContact: noopAsync,
  updateSafetyContact: noopAsync,
  deleteSafetyContact: noopAsync,
  toggleSafetyContact: noopAsync,
  diningContent: {},
  setDiningContent: noopFn,
  updateDiningContent: noopAsync,
  addMenuCategory: noopAsync,
  updateMenuCategory: noopAsync,
  deleteMenuCategory: noopAsync,
  addMenuItem: noopAsync,
  updateMenuItem: noopAsync,
  deleteMenuItem: noopAsync,
  addGalleryImage: noopAsync,
  deleteGalleryImage: noopAsync,
  approveReview: noopAsync,
  hideReview: noopAsync,
  addReview: noopAsync,
  deleteReview: noopAsync,
  addEnquiry: noopAsync,
  updateEnquiryStatus: noopAsync,
  deleteEnquiry: noopAsync,
  addOffer: noopAsync,
  updateOffer: noopAsync,
  deleteOffer: noopAsync,
  addUser: noopAsync,
  updateUser: noopAsync,
  deleteUser: noopAsync
};

// Persist context instance on globalThis so Vite HMR module reloads never create
// mismatched context identities between Provider and consumers.
const ADMIN_CONTEXT_KEY = '__marichin_admin_context__';
const AdminContext = (typeof globalThis !== 'undefined' && globalThis[ADMIN_CONTEXT_KEY])
  ? globalThis[ADMIN_CONTEXT_KEY]
  : createContext(DEFAULT_ADMIN_CONTEXT);
if (typeof globalThis !== 'undefined') {
  globalThis[ADMIN_CONTEXT_KEY] = AdminContext;
}

const CURRENT_DATA_VERSION = '2026_reviews_v10';

// Clear obsolete legacy cache automatically when the data version changes
try {
  const storedVer = localStorage.getItem('marichin_data_version');
  if (storedVer !== CURRENT_DATA_VERSION) {
    localStorage.removeItem('marichin_rooms');
    localStorage.removeItem('marichin_packages');
    localStorage.removeItem('marichin_dining');
    localStorage.removeItem('marichin_dining_content');
    localStorage.removeItem('marichin_reviews');
    localStorage.removeItem('marichin_settings');
    localStorage.removeItem('marichin_inclusions');
    localStorage.removeItem('marichin_policies');
    localStorage.removeItem('marichin_safety');
    localStorage.setItem('marichin_data_version', CURRENT_DATA_VERSION);
  }
} catch (e) {
  // localStorage disabled or private browsing
}

const SYNC_CHANNEL_NAME = 'marichin_admin_sync';
const PUBLIC_SILENT_COOLDOWN_MS = 15000;
const ADMIN_REFRESH_COOLDOWN_MS = 8000;
const RATE_LIMIT_DEFAULT_BACKOFF_MS = 60000;

// Persist coordination / backoff timers on globalThis so HMR does not clear
// cooldowns or trigger duplicate API request storms.
const SYNC_STATE_KEY = '__marichin_admin_sync_state__';
const syncState = (typeof globalThis !== 'undefined' && globalThis[SYNC_STATE_KEY])
  ? globalThis[SYNC_STATE_KEY]
  : {
      tabId: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      publicFetchPromise: null,
      publicLastFetchedAt: 0,
      publicRateLimitedUntil: 0,
      adminFetchPromise: null,
      adminLastFetchedAt: 0,
      adminRateLimitedUntil: 0,
      getMePromise: null,
      getMeLastCheckedAt: 0,
      getMeLastResult: undefined,
      pendingCrossTabSync: false,
      localSyncListeners: new Set()
    };
if (typeof globalThis !== 'undefined') {
  globalThis[SYNC_STATE_KEY] = syncState;
}
if (!syncState.localSyncListeners) {
  syncState.localSyncListeners = new Set();
}
const SYNC_TAB_ID = syncState.tabId;

const safeSetStorage = (key, value) => {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (localStorage.getItem(key) !== serialized) {
      localStorage.setItem(key, serialized);
    }
  } catch {}
};

const localSyncListeners = syncState.localSyncListeners;

const broadcastAdminSync = (domain = 'all') => {
  const payload = {
    domain,
    ts: Date.now(),
    sender: SYNC_TAB_ID,
    nonce: Math.random().toString(36).slice(2, 8)
  };
  try {
    localStorage.setItem('marichin_sync_ts', JSON.stringify(payload));
  } catch {}
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(SYNC_CHANNEL_NAME);
      ch.postMessage(payload);
      ch.close();
    }
  } catch {}
  localSyncListeners.forEach((listener) => {
    try {
      listener(domain);
    } catch {}
  });
};

const normalizeDiningItem = (item, defDish = null) => {
  if (!item) return null;
  const rawPrice = item.price;
  const price = (rawPrice !== undefined && rawPrice !== null && rawPrice !== '' && !isNaN(Number(rawPrice)))
    ? Number(rawPrice)
    : null;
  return {
    ...defDish,
    ...item,
    id: item._id || item.id || defDish?.id || item.name,
    _id: item._id || item.id,
    name: item.name || defDish?.name || '',
    nameKn: item.nameKn !== undefined ? item.nameKn : (defDish?.nameKn || ''),
    desc: item.desc !== undefined ? item.desc : (item.description !== undefined ? item.description : (defDish?.desc || '')),
    description: item.description !== undefined ? item.description : (item.desc !== undefined ? item.desc : (defDish?.desc || '')),
    price,
    nonVeg: item.isVeg !== undefined ? !item.isVeg : Boolean(item.nonVeg),
    isVeg: item.isVeg !== undefined ? Boolean(item.isVeg) : !item.nonVeg,
    image: item.image !== undefined && item.image !== null && item.image !== '' ? item.image : (defDish?.image || ''),
    isIllustrative: item.isIllustrative !== undefined ? Boolean(item.isIllustrative) : (defDish?.isIllustrative ?? true),
    isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
    alt: item.alt || item.name || defDish?.name || ''
  };
};

const normalizeDiningCategories = (rawCategories) => {
  const fallbackCategories = DINING_DATA.menuCategories || [];
  if (!rawCategories || !Array.isArray(rawCategories) || rawCategories.length === 0) {
    return fallbackCategories;
  }

  return rawCategories.map((cat) => {
    const slug = cat.slug || cat.id || (cat.name || cat.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const defCat = fallbackCategories.find(
      (c) => c.slug === slug || c.id === slug || (c.name && cat.name && c.name.toLowerCase() === cat.name.toLowerCase())
    ) || {};
    const defItems = defCat.items || [];
    const rawItems = Array.isArray(cat.items) ? cat.items : [];

    const normalizedItems = rawItems
      .map((admItem) => {
        const defDish = defItems.find(
          (d) =>
            (d.name && admItem.name && d.name.toLowerCase() === admItem.name.toLowerCase()) ||
            (d.nameKn && admItem.nameKn && d.nameKn === admItem.nameKn)
        );
        return normalizeDiningItem(admItem, defDish || null);
      })
      .filter(Boolean);

    return {
      ...defCat,
      ...cat,
      id: cat._id || cat.id || slug,
      _id: cat._id || cat.id,
      slug,
      name: cat.name || cat.category || defCat.name || 'Menu Category',
      nameKn: cat.nameKn !== undefined && cat.nameKn !== '' ? cat.nameKn : (defCat.nameKn || ''),
      category: cat.name || cat.category || defCat.name || 'Menu Category',
      subtitle: cat.subtitle !== undefined ? cat.subtitle : (defCat.subtitle || ''),
      isActive: cat.isActive !== undefined ? Boolean(cat.isActive) : true,
      items: normalizedItems
    };
  });
};

export const resolveFullHomePrice = (settings, packagesList = []) => {
  const explicitEntirePkg = (packagesList || []).find((p) => {
    const s = String(p?.slug || p?.id || '').toLowerCase();
    const n = String(p?.title || p?.name || '').toLowerCase();
    return (s.includes('entire-homestay') || s.includes('all-5-rooms') || s === 'full-home' || n.includes('entire homestay')) && p?.isActive !== false;
  });

  const settingsPrice = Number(settings?.fullHomePricePerNight);
  const hasSettingsPrice = Number.isFinite(settingsPrice) && settingsPrice > 0;
  const pkgPrice = Number(explicitEntirePkg?.price ?? explicitEntirePkg?.offerPrice);
  const hasPkgPrice = Number.isFinite(pkgPrice) && pkgPrice > 0;

  if (hasSettingsPrice && hasPkgPrice) {
    if (settingsPrice === 35000 && pkgPrice !== 35000) {
      return pkgPrice;
    }
    const pkgUpdated = explicitEntirePkg?.updatedAt ? new Date(explicitEntirePkg.updatedAt).getTime() : 0;
    const settingsUpdated = settings?.updatedAt ? new Date(settings.updatedAt).getTime() : 0;
    if (pkgUpdated > settingsUpdated) {
      return pkgPrice;
    }
    return settingsPrice;
  }
  if (hasPkgPrice) return pkgPrice;
  if (hasSettingsPrice) return settingsPrice;
  return 35000;
};

const normalizeRoom = (r) => {
  if (!r) return r;
  const isSuite = (r.slug || r.name || '').toLowerCase().includes('suite');
  const isSingle = (r.slug || r.name || '').toLowerCase().includes('single');
  const isStandard = !isSuite && !isSingle;

  const defaultPrice = isSuite ? 10000 : (isSingle ? 6000 : 8000);
  const rawPrice = r.pricePerNight !== undefined ? r.pricePerNight : r.price;
  const price = (rawPrice !== undefined && rawPrice !== null && !isNaN(Number(rawPrice)))
    ? Number(rawPrice)
    : defaultPrice;

  const rawImages = Array.isArray(r.images) && r.images.length > 0
    ? r.images.map(img => (typeof img === 'string' ? img : (img?.url || ''))).filter(Boolean)
    : (r.image ? [typeof r.image === 'string' ? r.image : (r.image?.url || '')].filter(Boolean) : []);

  const defaultImages = isStandard
    ? ['/images/realimage/real3.jpeg', '/images/realimage/real5.jpeg']
    : (isSuite
        ? ['/images/realimage/real4.jpeg', '/images/realimage/real6.jpeg']
        : []);

  const images = rawImages.length > 0
    ? rawImages
    : (isSingle ? [] : defaultImages);

  const mainImage = images[0] || (typeof r.image === 'string' ? r.image : r.image?.url) || '';

  return {
    ...r,
    id: r.id || r.slug || r._id,
    _id: r._id || r.id,
    slug: r.slug || (isSuite ? 'suite-room' : isSingle ? 'single-room' : 'standard-room'),
    name: r.name || (isSuite ? 'Suite Room' : (isSingle ? 'Single Room' : 'Standard Room')),
    category: r.category || (isSuite ? 'Suite Room' : (isSingle ? 'Single Room' : 'Standard Room')),
    tag: r.tag || (r.hasBalcony === false || isSingle ? 'No balcony' : 'Balcony facing'),
    realBadge: r.tag || (r.hasBalcony === false || isSingle ? 'No balcony' : 'Balcony facing'),
    price,
    pricePerNight: price,
    weekendPrice: r.weekendPrice !== undefined ? Number(r.weekendPrice) : price,
    totalUnits: r.totalUnits !== undefined ? Number(r.totalUnits) : (isSingle ? 1 : 2),
    hasBalcony: r.hasBalcony !== undefined ? Boolean(r.hasBalcony) : !isSingle,
    mealsIncluded: r.mealsIncluded || 'Morning breakfast',
    maxAdults: r.maxAdults !== undefined ? Number(r.maxAdults) : 2,
    maxChildren: r.maxChildren !== undefined ? Number(r.maxChildren) : (isSingle ? 0 : (isSuite ? 2 : 1)),
    capacity: r.maxGuests || r.capacity || (isSuite ? 4 : (isSingle ? 2 : 3)),
    maxGuests: r.maxGuests || r.capacity || (isSuite ? 4 : (isSingle ? 2 : 3)),
    view: r.view !== undefined ? r.view : '',
    size: r.size || (r.sizeSqft ? `${r.sizeSqft} sq.ft` : ''),
    bed: r.bed || r.bedLayout || '',
    bedLayout: r.bedLayout || r.bed || '',
    description: r.description || (isSuite
      ? 'Balcony-facing room for 2 adults and 2 children. Morning breakfast included.'
      : isSingle
      ? 'Room for 2 adults, without balcony. Morning breakfast included.'
      : 'Balcony-facing room for 2 adults and 1 child. Morning breakfast included.'),
    image: mainImage,
    images,
    amenities: Array.isArray(r.amenities) && r.amenities.length > 0
      ? r.amenities
      : [
          'Morning breakfast',
          'Wi-Fi',
          'Parking Facility',
          'Campfire',
          'Indoor & Outdoor Games',
          'Estate Walk'
        ]
  };
};

const normalizeRoomsList = (rawList) => {
  if (Array.isArray(rawList) && rawList.length > 0) {
    return rawList.map(normalizeRoom);
  }
  return (ROOMS_DATA || []).map(normalizeRoom);
};

const normalizePackage = (p) => {
  if (!p) return p;
  const features = Array.isArray(p.features) && p.features.length > 0
    ? p.features
    : (Array.isArray(p.inclusions) && p.inclusions.length > 0
        ? p.inclusions
        : (p.description ? [p.description] : []));
  const rawPrice = p.price !== undefined ? p.price : p.offerPrice;
  const price = (rawPrice !== null && rawPrice !== undefined && rawPrice !== '' && !isNaN(Number(rawPrice))) ? Number(rawPrice) : null;
  const rawOrigPrice = p.originalPrice !== undefined ? p.originalPrice : p.regularPrice;
  const originalPrice = (rawOrigPrice !== null && rawOrigPrice !== undefined && rawOrigPrice !== '' && !isNaN(Number(rawOrigPrice))) ? Number(rawOrigPrice) : null;
  return {
    ...p,
    id: p.id || p.slug || p._id,
    _id: p._id || p.id,
    slug: p.slug || p.id,
    name: p.name || p.title || 'Curated Package',
    title: p.title || p.name || 'Curated Package',
    duration: p.duration || p.durationLabel || 'Per Night',
    durationLabel: p.durationLabel || p.duration || 'Per Night',
    idealFor: p.idealFor || 'Couples & Families',
    image: p.image || '/images/realimage/homeimage.jpeg',
    features,
    inclusions: features,
    price,
    offerPrice: price,
    originalPrice,
    regularPrice: originalPrice,
    discount: p.discount || null,
    isActive: p.isActive !== undefined ? p.isActive : true
  };
};

export const AdminProvider = ({ children }) => {
  // Authentication state (stored in httpOnly cookie on server, never in localStorage)
  const [currentUser, setCurrentUser] = useState(null);
  const currentUserRef = useRef(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const [loading, setLoading] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Core Data States (Public data has offline cache; personal guest data is NEVER cached in localStorage)
  const [rooms, setRooms] = useState(() => {
    try {
      const saved = localStorage.getItem('marichin_rooms');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return normalizeRoomsList(parsed);
        }
      }
    } catch {}
    return normalizeRoomsList(ROOMS_DATA);
  });

  // Guest personal data: strictly in-memory
  const [bookings, setBookings] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);

  const [diningMenu, setDiningMenu] = useState(() => {
    const saved = localStorage.getItem('marichin_dining');
    if (!saved) return normalizeDiningCategories(DINING_DATA.menuCategories);
    try {
      const parsed = JSON.parse(saved);
      return normalizeDiningCategories(parsed);
    } catch {
      return normalizeDiningCategories(DINING_DATA.menuCategories);
    }
  });

  const [diningContent, setDiningContent] = useState(() => {
    const saved = localStorage.getItem('marichin_dining_content');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [packages, setPackages] = useState(() => {
    const saved = localStorage.getItem('marichin_packages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const str = JSON.stringify(parsed).toLowerCase();
        if (str.includes('complete-homestay-stay') || !str.includes('room-breakfast')) {
          return PACKAGES_DATA.map(normalizePackage);
        }
        return Array.isArray(parsed) ? parsed.map(normalizePackage) : PACKAGES_DATA.map(normalizePackage);
      } catch {
        return PACKAGES_DATA.map(normalizePackage);
      }
    }
    return PACKAGES_DATA.map(normalizePackage);
  });

  const [experiences, setExperiences] = useState(() => {
    const saved = localStorage.getItem('marichin_experiences');
    return saved ? JSON.parse(saved) : EXPERIENCES_DATA;
  });

  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem('marichin_reviews');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    return REVIEWS_DATA;
  });

  // Complete reviews list for authenticated Admin console (includes pending, approved & hidden)
  const [adminReviews, setAdminReviews] = useState([]);

  const [offers, setOffers] = useState(() => {
    const saved = localStorage.getItem('marichin_offers');
    return saved ? JSON.parse(saved) : PROMO_CODES;
  });

  const [gallery, setGallery] = useState(() => {
    const saved = localStorage.getItem('marichin_gallery');
    return saved ? JSON.parse(saved) : GALLERY_DATA;
  });

  const [inclusions, setInclusions] = useState(() => {
    const saved = localStorage.getItem('marichin_inclusions');
    return saved ? JSON.parse(saved) : INCLUSIONS_DATA;
  });

  const [policySections, setPolicySections] = useState(() => {
    try {
      const saved = localStorage.getItem('marichin_policies');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_POLICY_SECTIONS;
    } catch {
      return DEFAULT_POLICY_SECTIONS;
    }
  });

  const [safetyContacts, setSafetyContacts] = useState(() => {
    try {
      const saved = localStorage.getItem('marichin_safety');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [policiesLastUpdated, setPoliciesLastUpdated] = useState(null);

  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  const [siteSettings, setSiteSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('marichin_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const rawPhone = parsed.phone !== undefined ? parsed.phone : parsed.phones?.[0];
        const rawWa = parsed.whatsappNumber !== undefined ? parsed.whatsappNumber : parsed.whatsapp;
        const safePhone = rawPhone !== undefined ? (!isPlaceholderPhone(rawPhone) ? String(rawPhone).trim() : '') : resolveHostPhone(HOMESTAY_INFO.phone);
        const safeWa = rawWa !== undefined ? (!isPlaceholderPhone(rawWa) ? String(rawWa).trim() : '') : resolveHostPhone(HOMESTAY_INFO.whatsapp);
        const safeEmail = parsed.email !== undefined ? (!isPlaceholderEmail(parsed.email) ? String(parsed.email).trim() : '') : resolveHostEmail(HOMESTAY_INFO.email);
        const safeInstagram = resolveInstagramUrl(parsed.instagramUrl);
        const safeFacebook = resolveFacebookUrl(parsed.facebookUrl);
        const safeYoutube = resolveYoutubeUrl(parsed.youtubeUrl);
        return {
          ...HOMESTAY_INFO,
          ...DEFAULT_HERO_BANNER,
          cancellationTiers: DEFAULT_CANCELLATION_TIERS,
          noShowRefundPercent: 0,
          refundTimelineText: '5 to 7 working days',
          hostCancelsRefundPercent: 100,
          dateChangeRule: DEFAULT_DATE_CHANGE_RULE,
          earlyDepartureRule: DEFAULT_EARLY_DEPARTURE_RULE,
          gatewayFeeNote: DEFAULT_GATEWAY_FEE_NOTE,
          safetyFeatures: DEFAULT_SAFETY_FEATURES,
          ...parsed,
          ...normalizeHeroBannerSettingsClient(parsed),
          phone: safePhone,
          whatsapp: safeWa,
          whatsappNumber: safeWa,
          email: safeEmail,
          instagramUrl: safeInstagram,
          facebookUrl: safeFacebook,
          youtubeUrl: safeYoutube
        };
      }
    } catch {}
    return {
      ...HOMESTAY_INFO,
      ...DEFAULT_HERO_BANNER,
      cancellationTiers: DEFAULT_CANCELLATION_TIERS,
      noShowRefundPercent: 0,
      refundTimelineText: '5 to 7 working days',
      hostCancelsRefundPercent: 100,
      dateChangeRule: DEFAULT_DATE_CHANGE_RULE,
      earlyDepartureRule: DEFAULT_EARLY_DEPARTURE_RULE,
      gatewayFeeNote: DEFAULT_GATEWAY_FEE_NOTE,
      safetyFeatures: DEFAULT_SAFETY_FEATURES
    };
  });

  const fetchPublicData = useCallback(async ({ silent = false, force = false, bypassBackoff = false } = {}) => {
    const now = Date.now();
    if (bypassBackoff) {
      syncState.publicRateLimitedUntil = 0;
    } else if (now < syncState.publicRateLimitedUntil) {
      return null;
    }

    if (syncState.publicFetchPromise) {
      return syncState.publicFetchPromise;
    }

    if (!force && syncState.publicLastFetchedAt > 0 && (now - syncState.publicLastFetchedAt) < PUBLIC_SILENT_COOLDOWN_MS) {
      return null;
    }

    const runFetch = (async () => {
      try {
        if (!silent) setLoading(true);

        const results = await Promise.allSettled([
          api.getRooms(),
          api.getMenu(),
          api.getPackages(),
          api.getExperiences(),
          api.getReviews(),
          api.getGallery(),
          api.getSettings(),
          api.getDiningContent(),
          api.getInclusions(),
          api.getPolicies(),
          api.getSafety()
        ]);

        const [
          roomsRes,
          menuRes,
          packagesRes,
          expRes,
          reviewsRes,
          galleryRes,
          settingsRes,
          diningContentRes,
          inclusionsRes,
          policiesRes,
          safetyRes
        ] = results;

        const anySucceeded = results.some((r) => r.status === 'fulfilled');
        const rateLimitedRes = results.find(
          (r) => r.status === 'rejected' && r.reason?.status === 429
        );
        if (rateLimitedRes) {
          const retryMs = Number(rateLimitedRes.reason?.retryAfterMs) || RATE_LIMIT_DEFAULT_BACKOFF_MS;
          syncState.publicRateLimitedUntil = Date.now() + Math.min(Math.max(retryMs, 15000), 120000);
        } else {
          syncState.publicLastFetchedAt = Date.now();
          if (!anySucceeded) {
            syncState.publicRateLimitedUntil = Math.max(syncState.publicRateLimitedUntil, Date.now() + 5000);
          }
        }

        if (roomsRes.status === 'fulfilled' && Array.isArray(roomsRes.value?.data) && roomsRes.value.data.length > 0) {
          const normalizedRooms = normalizeRoomsList(roomsRes.value.data);
          setRooms(normalizedRooms);
          safeSetStorage('marichin_rooms', normalizedRooms);
          setApiOnline(true);
        }

        if (menuRes.status === 'fulfilled' && Array.isArray(menuRes.value?.data)) {
          const normalizedMenu = menuRes.value.data.length > 0
            ? normalizeDiningCategories(menuRes.value.data)
            : [];
          setDiningMenu(normalizedMenu);
          safeSetStorage('marichin_dining', normalizedMenu);
          setApiOnline(true);
        }

        let latestPackages = null;
        if (packagesRes.status === 'fulfilled' && Array.isArray(packagesRes.value?.data)) {
          const normalizedPkgs = packagesRes.value.data.map(normalizePackage);
          latestPackages = normalizedPkgs;
          setPackages(normalizedPkgs);
          safeSetStorage('marichin_packages', normalizedPkgs);
          setApiOnline(true);
        }

        if (expRes.status === 'fulfilled' && Array.isArray(expRes.value?.data)) {
          setExperiences(expRes.value.data);
          safeSetStorage('marichin_experiences', expRes.value.data);
          setApiOnline(true);
        }

        if (reviewsRes.status === 'fulfilled' && Array.isArray(reviewsRes.value?.data)) {
          setReviews(reviewsRes.value.data);
          safeSetStorage('marichin_reviews', reviewsRes.value.data);
          setApiOnline(true);
        }

        if (galleryRes.status === 'fulfilled' && Array.isArray(galleryRes.value?.data)) {
          setGallery(galleryRes.value.data);
          safeSetStorage('marichin_gallery', galleryRes.value.data);
          setApiOnline(true);
        }

        if (settingsRes.status === 'fulfilled' && settingsRes.value?.data) {
          const sData = settingsRes.value.data;
          const rawPhone = sData.phone !== undefined ? sData.phone : (Array.isArray(sData.phones) ? sData.phones[0] : '');
          const safePhone = !isPlaceholderPhone(rawPhone) ? String(rawPhone).trim() : '';
          const rawWa = sData.whatsappNumber !== undefined ? sData.whatsappNumber : (sData.whatsapp ?? '');
          const safeWa = !isPlaceholderPhone(rawWa) ? String(rawWa).trim() : '';
          const safeEmail = !isPlaceholderEmail(sData.email) ? String(sData.email).trim() : '';
          const safeInstagram = resolveInstagramUrl(sData.instagramUrl);
          const safeFacebook = resolveFacebookUrl(sData.facebookUrl);
          const safeYoutube = resolveYoutubeUrl(sData.youtubeUrl);

          if (sData.policiesLastUpdated) {
            setPoliciesLastUpdated(sData.policiesLastUpdated);
          }

          setSiteSettings((prev) => {
            const syncedFullHome = sData.fullHomePricePerNight !== undefined
              ? Number(sData.fullHomePricePerNight)
              : resolveFullHomePrice(prev, latestPackages || []);
            return {
              ...prev,
              ...sData,
              ...normalizeHeroBannerSettingsClient(sData),
              name: sData.propertyName !== undefined ? sData.propertyName : prev.name,
              propertyName: sData.propertyName !== undefined ? sData.propertyName : prev.propertyName,
              email: safeEmail,
              address: sData.address !== undefined ? sData.address : prev.address,
              googleMapsShareUrl: sData.googleMapsShareUrl !== undefined ? sData.googleMapsShareUrl : (prev.googleMapsShareUrl || ''),
              fullHomePricePerNight: syncedFullHome,
              phone: safePhone,
              phones: safePhone ? [safePhone, ...(sData.phones?.slice(1) || [])] : [],
              whatsapp: safeWa,
              whatsappNumber: safeWa,
              instagramUrl: safeInstagram,
              facebookUrl: safeFacebook,
              youtubeUrl: safeYoutube
            };
          });
          setApiOnline(true);
        }

        if (diningContentRes.status === 'fulfilled' && diningContentRes.value?.data) {
          setDiningContent(diningContentRes.value.data);
          safeSetStorage('marichin_dining_content', diningContentRes.value.data);
        }

        if (inclusionsRes.status === 'fulfilled' && Array.isArray(inclusionsRes.value?.data)) {
          setInclusions(inclusionsRes.value.data);
          safeSetStorage('marichin_inclusions', inclusionsRes.value.data);
          setApiOnline(true);
        }

        if (policiesRes.status === 'fulfilled' && policiesRes.value?.data) {
          const pData = policiesRes.value.data;
          if (Array.isArray(pData.sections) && pData.sections.length > 0) {
            setPolicySections(pData.sections);
            safeSetStorage('marichin_policies', pData.sections);
          }
          if (pData.lastUpdated) {
            setPoliciesLastUpdated(pData.lastUpdated);
          }
          if (pData.refundRules) {
            setSiteSettings((prev) => ({
              ...prev,
              cancellationTiers: pData.refundRules.cancellationTiers || prev.cancellationTiers,
              noShowRefundPercent: pData.refundRules.noShowRefundPercent ?? prev.noShowRefundPercent,
              refundTimelineText: pData.refundRules.refundTimelineText || prev.refundTimelineText,
              hostCancelsRefundPercent: pData.refundRules.hostCancelsRefundPercent ?? prev.hostCancelsRefundPercent,
              dateChangeRule: pData.refundRules.dateChangeRule || prev.dateChangeRule,
              earlyDepartureRule: pData.refundRules.earlyDepartureRule || prev.earlyDepartureRule,
              gatewayFeeNote: pData.refundRules.gatewayFeeNote || prev.gatewayFeeNote
            }));
          }
          setApiOnline(true);
        }

        if (safetyRes.status === 'fulfilled' && safetyRes.value?.data) {
          const sfData = safetyRes.value.data;
          if (Array.isArray(sfData.contacts)) {
            setSafetyContacts(sfData.contacts);
            safeSetStorage('marichin_safety', sfData.contacts);
          }
          if (sfData.features) {
            setSiteSettings((prev) => ({
              ...prev,
              safetyFeatures: { ...DEFAULT_SAFETY_FEATURES, ...prev.safetyFeatures, ...sfData.features }
            }));
          }
          setApiOnline(true);
        }
      } catch (err) {
        console.warn('Backend public API currently unreachable. Using cache/fallback.');
      } finally {
        syncState.publicFetchPromise = null;
        if (!silent) setLoading(false);
      }
    })();

    syncState.publicFetchPromise = runFetch;
    return runFetch;
  }, []);

  // Fetch Protected Admin Data
  const fetchAdminData = useCallback(async ({ force = false, bypassBackoff = false } = {}) => {
    const now = Date.now();
    if (bypassBackoff) {
      syncState.adminRateLimitedUntil = 0;
    } else if (now < syncState.adminRateLimitedUntil) {
      return null;
    }

    if (syncState.adminFetchPromise) {
      return syncState.adminFetchPromise;
    }

    if (!force && syncState.adminLastFetchedAt > 0 && (now - syncState.adminLastFetchedAt) < ADMIN_REFRESH_COOLDOWN_MS) {
      return null;
    }

    const runAdminFetch = (async () => {
      try {
        const results = await Promise.allSettled([
          api.admin.getBookings({ limit: 100 }),
          api.admin.getEnquiries(),
          api.admin.getPromos(),
          api.admin.getBlockedDates(),
          api.admin.getUsers(),
          api.admin.getActivityLogs(),
          api.admin.getReviews()
        ]);

        const [bookingsRes, enquiriesRes, promosRes, blockedRes, usersRes, logsRes, reviewsRes] = results;
        const rateLimited = results.find((r) => r.status === 'rejected' && r.reason?.status === 429);
        if (rateLimited) {
          const retryMs = Number(rateLimited.reason?.retryAfterMs) || RATE_LIMIT_DEFAULT_BACKOFF_MS;
          syncState.adminRateLimitedUntil = Date.now() + Math.min(Math.max(retryMs, 15000), 120000);
        } else {
          syncState.adminLastFetchedAt = Date.now();
        }

        if (bookingsRes.status === 'fulfilled' && bookingsRes.value?.data?.bookings) {
          setBookings(bookingsRes.value.data.bookings);
        }

        if (enquiriesRes.status === 'fulfilled' && enquiriesRes.value?.data) {
          setEnquiries(enquiriesRes.value.data);
        }

        if (promosRes.status === 'fulfilled' && promosRes.value?.data) {
          setOffers(promosRes.value.data);
        }

        if (blockedRes.status === 'fulfilled' && blockedRes.value?.data) {
          setBlockedDates(blockedRes.value.data);
        }

        if (usersRes.status === 'fulfilled' && usersRes.value?.data) {
          setUsers(usersRes.value.data);
        }

        if (logsRes.status === 'fulfilled' && logsRes.value?.data) {
          setActivityLogs(logsRes.value.data);
        }

        if (reviewsRes.status === 'fulfilled' && Array.isArray(reviewsRes.value?.data)) {
          setAdminReviews(reviewsRes.value.data);
        }

        if (api.admin?.getInclusions) {
          const incRes = await api.admin.getInclusions().catch(() => null);
          if (incRes?.data?.length > 0) {
            setInclusions(incRes.data);
          }
        }

        if (api.admin?.getPolicies) {
          const admPolRes = await api.admin.getPolicies().catch(() => null);
          if (admPolRes?.data) {
            if (Array.isArray(admPolRes.data.sections) && admPolRes.data.sections.length > 0) {
              setPolicySections(admPolRes.data.sections);
            }
            if (Array.isArray(admPolRes.data.safetyContacts)) {
              setSafetyContacts(admPolRes.data.safetyContacts);
            }
            if (admPolRes.data.policiesLastUpdated) {
              setPoliciesLastUpdated(admPolRes.data.policiesLastUpdated);
            }
          }
        }
      } catch (err) {
        console.warn('Admin data refresh failed:', err.message);
      } finally {
        syncState.adminFetchPromise = null;
      }
    })();

    syncState.adminFetchPromise = runAdminFetch;
    return runAdminFetch;
  }, []);

  // Lightweight background refresher for bookings only
  const refreshAdminBookings = useCallback(async () => {
    try {
      const res = await api.admin.getBookings({ limit: 100 });
      if (res?.data?.bookings) {
        setBookings(res.data.bookings);
      }
    } catch (_) {}
  }, []);

  // Initial load: fetch public data and verify cookie-based auth session
  useEffect(() => {
    let cancelled = false;
    fetchPublicData();

    const now = Date.now();
    const shouldSkipGetMe = now < syncState.publicRateLimitedUntil;

    let getMeTask = null;
    if (syncState.getMePromise) {
      getMeTask = syncState.getMePromise;
    } else if (
      syncState.getMeLastCheckedAt > 0 &&
      (now - syncState.getMeLastCheckedAt) < PUBLIC_SILENT_COOLDOWN_MS &&
      syncState.getMeLastResult !== undefined
    ) {
      getMeTask = Promise.resolve(syncState.getMeLastResult);
    } else if (!shouldSkipGetMe) {
      syncState.getMePromise = api.getMe()
        .then((res) => {
          syncState.getMeLastCheckedAt = Date.now();
          syncState.getMeLastResult = res || null;
          return res;
        })
        .catch((err) => {
          if (err?.status === 401 || err?.status === 403) {
            try {
              localStorage.removeItem('marichin_token');
              sessionStorage.removeItem('marichin_token');
            } catch {}
            syncState.getMeLastCheckedAt = Date.now();
            syncState.getMeLastResult = null;
          } else if (err?.status === 429) {
            const retryMs = Number(err?.retryAfterMs) || RATE_LIMIT_DEFAULT_BACKOFF_MS;
            syncState.publicRateLimitedUntil = Math.max(
              syncState.publicRateLimitedUntil,
              Date.now() + Math.min(Math.max(retryMs, 15000), 120000)
            );
          }
          throw err;
        })
        .finally(() => {
          syncState.getMePromise = null;
        });
      getMeTask = syncState.getMePromise;
    }

    (getMeTask || Promise.resolve(null))
      .then((res) => {
        if (cancelled) return;
        if (res?.data) {
          setCurrentUser(res.data);
          fetchAdminData();
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setCurrentUser(null);
      })
      .finally(() => {
        if (!cancelled) setAuthChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchPublicData, fetchAdminData]);

  // Cross-tab & focus/visibility synchronization (deduped & cooled down to avoid request storms)
  useEffect(() => {
    let refreshTimer = null;
    let lastHandledNonce = '';

    const scheduleRefresh = ({ force = false, nonce = '' } = {}) => {
      if (nonce && nonce === lastHandledNonce) return;
      if (nonce) lastHandledNonce = nonce;

      if (document.hidden) {
        if (force) syncState.pendingCrossTabSync = true;
        return;
      }

      const effectiveForce = force || syncState.pendingCrossTabSync;
      syncState.pendingCrossTabSync = false;

      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        if (document.hidden) return;
        setSyncVersion((v) => v + 1);
        fetchPublicData({ silent: true, force: effectiveForce });
        if (currentUserRef.current) {
          fetchAdminData({ force: effectiveForce });
        }
      }, 250);
    };

    const handleLocalSync = () => {
      setSyncVersion((v) => v + 1);
    };
    localSyncListeners.add(handleLocalSync);

    const handleFocus = () => {
      scheduleRefresh({ force: syncState.pendingCrossTabSync });
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        scheduleRefresh({ force: syncState.pendingCrossTabSync });
      }
    };

    const handleStorage = (e) => {
      if (e.key !== 'marichin_sync_ts') return;
      try {
        const parsed = e.newValue ? JSON.parse(e.newValue) : null;
        if (parsed?.sender === SYNC_TAB_ID) return;
        scheduleRefresh({
          force: true,
          nonce: parsed?.nonce || String(parsed?.ts || '')
        });
      } catch {
        scheduleRefresh({ force: true });
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('storage', handleStorage);

    let channel = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        channel.onmessage = (event) => {
          const data = event?.data;
          if (data?.sender === SYNC_TAB_ID) return;
          scheduleRefresh({
            force: true,
            nonce: data?.nonce || String(data?.ts || '')
          });
        };
      }
    } catch {}

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      localSyncListeners.delete(handleLocalSync);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('storage', handleStorage);
      try { if (channel) channel.close(); } catch {}
    };
  }, [fetchPublicData, fetchAdminData]);

  // Auth Methods (Auth token stored in httpOnly cookie; no guest data or tokens in localStorage)
  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      if (res?.data?.user) {
        if (res.data?.token) {
          try {
            localStorage.setItem('marichin_token', res.data.token);
          } catch {}
        }
        syncState.getMeLastCheckedAt = Date.now();
        syncState.getMeLastResult = { data: res.data.user };
        setCurrentUser(res.data.user);
        await fetchAdminData({ force: true, bypassBackoff: true });
        return { success: true, user: res.data.user };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (err) {
      return { success: false, message: err.message || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await api.logout().catch(() => null);
    } finally {
      try {
        localStorage.removeItem('marichin_token');
        sessionStorage.removeItem('marichin_token');
      } catch {}
      syncState.adminLastFetchedAt = 0;
      syncState.adminRateLimitedUntil = 0;
      syncState.getMePromise = null;
      syncState.getMeLastCheckedAt = 0;
      syncState.getMeLastResult = null;
      setCurrentUser(null);
      setBookings([]);
      setEnquiries([]);
      setBlockedDates([]);
      setAdminReviews([]);
      setUsers([]);
      setActivityLogs([]);

      // Clear all admin data from browser storage on logout
      const adminKeys = [
        'marichin_token',
        'marichin_user',
        'marichin_bookings',
        'marichin_enquiries',
        'marichin_blocked',
        'marichin_offers',
        'marichin_rooms',
        'marichin_dining',
        'marichin_packages',
        'marichin_experiences',
        'marichin_reviews',
        'marichin_gallery',
        'marichin_settings'
      ];
      adminKeys.forEach((key) => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch {}
      });
    }
  };

  const changePassword = async (newPassword) => {
    try {
      const res = await api.changePassword(newPassword);
      if (res?.data) {
        setCurrentUser((prev) => ({ ...prev, mustChangePassword: false }));
        showToast('Password changed successfully!', 'success');
        return { success: true };
      }
      return { success: false, message: 'Password change failed' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Sync public fallback state to LocalStorage (NEVER bookings or enquiries)
  useEffect(() => {
    safeSetStorage('marichin_rooms', rooms);
  }, [rooms]);
  useEffect(() => {
    safeSetStorage('marichin_dining', diningMenu);
  }, [diningMenu]);
  useEffect(() => {
    safeSetStorage('marichin_packages', packages);
  }, [packages]);
  useEffect(() => {
    safeSetStorage('marichin_experiences', experiences);
  }, [experiences]);
  useEffect(() => {
    safeSetStorage('marichin_gallery', gallery);
  }, [gallery]);
  useEffect(() => {
    safeSetStorage('marichin_inclusions', inclusions);
  }, [inclusions]);
  useEffect(() => {
    safeSetStorage('marichin_reviews', reviews);
  }, [reviews]);
  useEffect(() => {
    if (siteSettings) {
      safeSetStorage('marichin_settings', siteSettings);
    }
  }, [siteSettings]);

  // Bookings CRUD
  const addBooking = (newBooking) => {
    setBookings((prev) => [newBooking, ...prev]);
  };

  const createManualBooking = async (bookingData) => {
    try {
      const res = await api.admin.createManualBooking(bookingData);
      if (res?.data) {
        setBookings((prev) => [res.data, ...prev]);
        broadcastAdminSync('availability');
        showToast(`Manual booking created: ${res.data.bookingCode}`, 'success');
        return { success: true, booking: res.data };
      }
      return { success: false, message: 'Failed to create booking' };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const updateBookingStatus = async (id, newStatus, notes) => {
    try {
      const res = await api.admin.updateBookingStatus(id, newStatus, notes);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id || b._id === id
            ? res?.data || { ...b, status: newStatus, ...(notes && { adminNotes: notes }) }
            : b
        )
      );
      broadcastAdminSync('availability');
      showToast('Booking status updated', 'success');
      return { success: true, data: res?.data };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const recordPayment = async (id, paymentData) => {
    try {
      const res = await api.admin.recordPayment(id, paymentData);
      if (res?.data) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id || b._id === id ? res.data : b))
        );
        showToast('Payment recorded successfully', 'success');
        return { success: true, data: res.data };
      }
      return { success: false, message: 'Failed to record payment' };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const cancelBookingWithReason = async (id, reason) => {
    try {
      const res = await api.admin.cancelBooking(id, reason);
      if (res?.data) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id || b._id === id ? res.data : b))
        );
        broadcastAdminSync('availability');
        showToast('Booking cancelled', 'success');
        return { success: true, data: res.data };
      }
      return { success: false, message: 'Failed to cancel booking' };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const requestDateChange = async (id, data) => {
    try {
      const res = await api.admin.requestDateChange(id, data);
      if (res?.data) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id || b._id === id ? res.data : b))
        );
        showToast('Date change requested', 'success');
        return { success: true, data: res.data };
      }
      return { success: false, message: 'Failed to request date change' };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const clearDateChangeFlag = async (id) => {
    try {
      const res = await api.admin.clearDateChangeFlag(id);
      if (res?.data) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id || b._id === id ? res.data : b))
        );
        showToast('Flag cleared', 'success');
        return { success: true, data: res.data };
      }
      return { success: false, message: 'Failed to clear flag' };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const changeBookingDates = async (id, data) => {
    try {
      const res = await api.admin.changeBookingDates(id, data);
      if (res?.data) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id || b._id === id ? res.data : b))
        );
        broadcastAdminSync('availability');
        showToast('Booking dates updated successfully', 'success');
        return { success: true, data: res.data };
      }
      return { success: false, message: 'Failed to update dates' };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const cancelAndRefundBooking = async (id, data) => {
    try {
      const res = await api.admin.cancelAndRefund(id, data);
      if (res?.data) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id || b._id === id ? res.data : b))
        );
        broadcastAdminSync('availability');
        showToast('Booking cancelled and refund processed', 'success');
        return { success: true, data: res.data };
      }
      return { success: false, message: 'Failed to cancel booking' };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const markBalanceReceived = async (id, data) => {
    try {
      const res = await api.admin.markBalanceReceived(id, data);
      if (res?.data) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id || b._id === id ? res.data : b))
        );
        showToast('Balance payment recorded', 'success');
        return { success: true, data: res.data };
      }
      return { success: false, message: 'Failed to record balance' };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const deleteBooking = async (id) => {
    try {
      await api.admin.deleteBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id && b._id !== id));
      broadcastAdminSync('availability');
      showToast('Booking deleted', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Blocked Dates CRUD
  const toggleBlockDate = async (date, roomId = 'all', reason = "Maintenance") => {
    const matchedRoomObj = roomId !== 'all'
      ? rooms.find((r) => r.slug === roomId || String(r._id) === String(roomId) || String(r.id) === String(roomId))
      : null;
    const candidateKeys = new Set(
      [
        roomId,
        matchedRoomObj?._id,
        matchedRoomObj?.id,
        matchedRoomObj?.slug
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
    );

    const match = blockedDates.find((item) => {
      const startStr = item.date || (item.startDate ? (typeof item.startDate === 'string' ? item.startDate.split('T')[0] : new Date(item.startDate).toISOString().split('T')[0]) : '');
      const endStr = item.endDate ? (typeof item.endDate === 'string' ? item.endDate.split('T')[0] : new Date(item.endDate).toISOString().split('T')[0]) : startStr;
      if (!startStr || date < startStr || date > (endStr || startStr)) return false;

      const rawRoom = item.roomId || item.room;
      const itemRoomKey = String(
        typeof rawRoom === 'object' ? (rawRoom?._id || rawRoom?.id || rawRoom?.slug || 'all') : (rawRoom || 'all')
      ).toLowerCase();

      if (roomId === 'all') return itemRoomKey === 'all';
      return itemRoomKey === 'all' || candidateKeys.has(itemRoomKey);
    });

    if (match) {
      try {
        if (match._id) {
          await api.admin.deleteBlockedDate(match._id);
        }
        setBlockedDates((prev) => prev.filter((item) => item !== match && item._id !== match._id));
        broadcastAdminSync('availability');
        showToast(`Date ${date} unblocked`, 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    } else {
      try {
        const res = await api.admin.createBlockedDate({ date, room: roomId, reason });
        const created = res?.data || { date, roomId, reason, startDate: date, endDate: date };
        setBlockedDates((prev) => [...prev, created]);
        broadcastAdminSync('availability');
        showToast(`Date ${date} blocked for ${reason}`, 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  };

  // Rooms CRUD
  const updateRoom = async (updatedRoom) => {
    const targetId = updatedRoom._id || updatedRoom.id;
    try {
      if (targetId) {
        const res = await api.admin.updateRoom(targetId, updatedRoom);
        if (res?.data) {
          const normalized = normalizeRoom(res.data);
          setRooms((prev) => {
            const next = prev.map((r) => ((r.id === targetId || r._id === targetId) ? normalized : r));
            try { localStorage.setItem('marichin_rooms', JSON.stringify(next)); } catch {}
            return next;
          });
          broadcastAdminSync('rooms');
          showToast(`Room '${normalized.name}' updated`, 'success');
          return { success: true, data: normalized };
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
    const fallback = normalizeRoom(updatedRoom);
    setRooms((prev) => {
      const next = prev.map((r) => ((r.id === targetId || r._id === targetId) ? fallback : r));
      try { localStorage.setItem('marichin_rooms', JSON.stringify(next)); } catch {}
      return next;
    });
    broadcastAdminSync('rooms');
    return { success: true, data: fallback };
  };

  const addRoom = async (newRoom) => {
    try {
      const res = await api.admin.createRoom(newRoom);
      const created = normalizeRoom(res?.data || newRoom);
      setRooms((prev) => {
        const next = [...prev, created];
        try { localStorage.setItem('marichin_rooms', JSON.stringify(next)); } catch {}
        return next;
      });
      broadcastAdminSync('rooms');
      showToast(`Room '${created.name}' created`, 'success');
      return { success: true, data: created };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const deleteRoom = async (id) => {
    try {
      await api.admin.deleteRoom(id);
      setRooms((prev) => {
        const next = prev.filter((r) => r.id !== id && r._id !== id);
        try { localStorage.setItem('marichin_rooms', JSON.stringify(next)); } catch {}
        return next;
      });
      broadcastAdminSync('rooms');
      showToast('Room deleted', 'success');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  // Packages CRUD
  const addPackage = async (data) => {
    try {
      const res = await api.admin.createPackage(data);
      if (res?.data) {
        const norm = normalizePackage(res.data);
        setPackages((prev) => [...prev, norm]);
        broadcastAdminSync('packages');
        showToast(`Package '${norm.title || norm.name}' created`, 'success');
        return { success: true, data: norm };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const updatePackage = async (id, data) => {
    try {
      const res = await api.admin.updatePackage(id, data);
      if (res?.data) {
        const norm = normalizePackage(res.data);
        setPackages((prev) => prev.map((p) => (p._id === id || p.id === id ? norm : p)));

        const pkgSlug = String(norm.slug || '').toLowerCase();
        if ((pkgSlug.includes('entire-homestay') || pkgSlug.includes('all-5-rooms')) && Number(norm.price) > 0) {
          setSiteSettings((prev) => ({
            ...prev,
            fullHomePricePerNight: Number(norm.price),
            updatedAt: new Date().toISOString()
          }));
        }

        broadcastAdminSync('packages');
        showToast('Package updated', 'success');
        return { success: true, data: norm };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const deletePackage = async (id) => {
    try {
      await api.admin.deletePackage(id);
      setPackages((prev) => prev.filter((p) => p._id !== id && p.id !== id));
      broadcastAdminSync('packages');
      showToast('Package deleted', 'success');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  // Experiences CRUD
  const addExperience = async (data) => {
    try {
      const res = await api.admin.createExperience(data);
      if (res?.data) {
        setExperiences((prev) => [...prev, res.data]);
        broadcastAdminSync('experiences');
        showToast(`Experience '${res.data.title}' created`, 'success');
        return { success: true, data: res.data };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const updateExperience = async (id, data) => {
    try {
      const res = await api.admin.updateExperience(id, data);
      if (res?.data) {
        setExperiences((prev) => prev.map((e) => (e._id === id || e.id === id ? res.data : e)));
        broadcastAdminSync('experiences');
        showToast('Experience updated', 'success');
        return { success: true, data: res.data };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const deleteExperience = async (id) => {
    try {
      await api.admin.deleteExperience(id);
      setExperiences((prev) => prev.filter((e) => e._id !== id && e.id !== id));
      broadcastAdminSync('experiences');
      showToast('Experience deleted', 'success');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  // Inclusions CRUD
  const addInclusionItem = async (data) => {
    try {
      const res = await api.admin.createInclusion(data);
      if (res?.data) {
        setInclusions((prev) => [...prev, res.data]);
        broadcastAdminSync('inclusions');
        showToast(`Item '${res.data.title?.en}' created`, 'success');
        return { success: true, data: res.data };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  const updateInclusionItem = async (id, data) => {
    try {
      const res = await api.admin.updateInclusion(id, data);
      if (res?.data) {
        setInclusions((prev) => prev.map((item) => (item._id === id || item.id === id ? res.data : item)));
        broadcastAdminSync('inclusions');
        showToast('Item updated', 'success');
        return { success: true, data: res.data };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  const deleteInclusionItem = async (id) => {
    try {
      await api.admin.deleteInclusion(id);
      setInclusions((prev) => prev.filter((item) => item._id !== id && item.id !== id));
      broadcastAdminSync('inclusions');
      showToast('Item deleted', 'success');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  const reorderInclusionItems = async (orderedIds) => {
    try {
      const res = await api.admin.reorderInclusions(orderedIds);
      if (res?.data) {
        setInclusions(res.data);
        broadcastAdminSync('inclusions');
        showToast('Items reordered', 'success');
        return { success: true };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  const toggleInclusionItem = async (id) => {
    try {
      const res = await api.admin.toggleInclusion(id);
      if (res?.data) {
        setInclusions((prev) => prev.map((item) => (item._id === id || item.id === id ? res.data : item)));
        broadcastAdminSync('inclusions');
        showToast(res.message || 'Item updated', 'success');
        return { success: true, data: res.data };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  // Policies CRUD
  const addPolicySection = async (data) => {
    try {
      const res = await api.admin.createPolicySection(data);
      if (res?.data) {
        setPolicySections((prev) => [...prev, res.data]);
        setPoliciesLastUpdated(new Date().toISOString());
        broadcastAdminSync('policies');
        showToast(`Policy section '${res.data.title?.en || data.key}' created`, 'success');
        return { success: true, data: res.data };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  const updatePolicySection = async (id, data) => {
    try {
      const res = await api.admin.updatePolicySection(id, data);
      if (res?.data) {
        setPolicySections((prev) => prev.map((sec) => (sec._id === id || sec.key === id ? res.data : sec)));
        setPoliciesLastUpdated(new Date().toISOString());
        broadcastAdminSync('policies');
        showToast('Policy section updated', 'success');
        return { success: true, data: res.data };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  const deletePolicySection = async (id) => {
    try {
      await api.admin.deletePolicySection(id);
      setPolicySections((prev) => prev.filter((sec) => sec._id !== id));
      setPoliciesLastUpdated(new Date().toISOString());
      broadcastAdminSync('policies');
      showToast('Policy section deleted', 'success');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  const reorderPolicySections = async (page, orderedIds) => {
    try {
      const res = await api.admin.reorderPolicySections(page, orderedIds);
      if (res?.data) {
        setPolicySections(res.data);
        setPoliciesLastUpdated(new Date().toISOString());
        broadcastAdminSync('policies');
        showToast('Policy sections reordered', 'success');
        return { success: true };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  const togglePolicySection = async (id) => {
    try {
      const res = await api.admin.togglePolicySection(id);
      if (res?.data) {
        setPolicySections((prev) => prev.map((sec) => (sec._id === id ? res.data : sec)));
        setPoliciesLastUpdated(new Date().toISOString());
        broadcastAdminSync('policies');
        showToast(res.message || 'Section visibility updated', 'success');
        return { success: true, data: res.data };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  // Safety Contacts CRUD
  const addSafetyContact = async (data) => {
    try {
      const res = await api.admin.createSafetyContact(data);
      if (res?.data) {
        setSafetyContacts((prev) => [...prev, res.data]);
        setPoliciesLastUpdated(new Date().toISOString());
        broadcastAdminSync('policies');
        showToast('Safety contact added', 'success');
        return { success: true, data: res.data };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  const updateSafetyContact = async (id, data) => {
    try {
      const res = await api.admin.updateSafetyContact(id, data);
      if (res?.data) {
        setSafetyContacts((prev) => prev.map((c) => (c._id === id ? res.data : c)));
        setPoliciesLastUpdated(new Date().toISOString());
        broadcastAdminSync('policies');
        showToast('Safety contact updated', 'success');
        return { success: true, data: res.data };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  const deleteSafetyContact = async (id) => {
    try {
      await api.admin.deleteSafetyContact(id);
      setSafetyContacts((prev) => prev.filter((c) => c._id !== id));
      setPoliciesLastUpdated(new Date().toISOString());
      broadcastAdminSync('policies');
      showToast('Safety contact removed', 'success');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  const toggleSafetyContact = async (id) => {
    try {
      const res = await api.admin.toggleSafetyContact(id);
      if (res?.data) {
        setSafetyContacts((prev) => prev.map((c) => (c._id === id ? res.data : c)));
        setPoliciesLastUpdated(new Date().toISOString());
        broadcastAdminSync('policies');
        showToast(res.message || 'Safety contact visibility updated', 'success');
        return { success: true, data: res.data };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  // Dining Menu CRUD
  const addMenuCategory = async (data) => {
    try {
      const res = await api.admin.createMenuCategory(data);
      if (res?.data) {
        setDiningMenu((prev) => [...prev, normalizeDiningCategories([res.data])[0]]);
        broadcastAdminSync('dining');
        showToast(`Category '${res.data.name}' added`, 'success');
        return { success: true, data: res.data };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const addMenuItem = async (data) => {
    try {
      const res = await api.admin.createMenuItem(data);
      if (res?.data) {
        const item = normalizeDiningItem(res.data);
        setDiningMenu((prev) =>
          prev.map((cat) => {
            if (cat.slug === item.category || cat.name === item.category || cat._id === item.category) {
              return { ...cat, items: [...(cat.items || []), item] };
            }
            return cat;
          })
        );
        broadcastAdminSync('dining');
        showToast(`Item '${item.name}' added`, 'success');
        return { success: true, data: item };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const updateMenuItem = async (id, data) => {
    try {
      const res = await api.admin.updateMenuItem(id, data);
      if (res?.data) {
        const item = normalizeDiningItem(res.data);
        setDiningMenu((prev) =>
          prev.map((cat) => ({
            ...cat,
            items: (cat.items || []).map((i) => (i._id === id || i.id === id ? item : i))
          }))
        );
        broadcastAdminSync('dining');
        showToast('Menu item updated', 'success');
        return { success: true, data: item };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const deleteMenuItem = async (id) => {
    try {
      await api.admin.deleteMenuItem(id);
      setDiningMenu((prev) =>
        prev.map((cat) => ({
          ...cat,
          items: (cat.items || []).filter((i) => i._id !== id && i.id !== id)
        }))
      );
      broadcastAdminSync('dining');
      showToast('Menu item deleted', 'success');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const updateMenuCategory = async (id, data) => {
    try {
      const res = await api.admin.updateMenuCategory(id, data);
      if (res?.data) {
        setDiningMenu((prev) =>
          prev.map((c) => (c._id === id || c.id === id || c.slug === id ? { ...c, ...res.data, category: res.data.name || c.category } : c))
        );
        broadcastAdminSync('dining');
        showToast('Category updated', 'success');
        return { success: true, data: res.data };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const deleteMenuCategory = async (id) => {
    try {
      await api.admin.deleteMenuCategory(id);
      setDiningMenu((prev) => prev.filter((c) => c._id !== id && c.id !== id && c.slug !== id));
      broadcastAdminSync('dining');
      showToast('Category deleted', 'success');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const updateDiningContent = async (data) => {
    try {
      const res = await api.admin.updateDiningContent(data);
      if (res?.data) {
        setDiningContent(res.data);
        localStorage.setItem('marichin_dining_content', JSON.stringify(res.data));
        broadcastAdminSync('dining');
        showToast('Dining content updated successfully', 'success');
        return { success: true, data: res.data };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  // Gallery CRUD
  const addGalleryImage = async (data) => {
    try {
      const res = await api.admin.createGalleryImage(data);
      if (res?.data) {
        setGallery((prev) => [res.data, ...prev]);
        broadcastAdminSync('gallery');
        showToast('Image added to gallery', 'success');
        return { success: true, data: res.data };
      }
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const deleteGalleryImage = async (id, filename) => {
    try {
      await api.admin.deleteGalleryImage(id);
      if (filename) {
        await api.admin.deleteImage(filename).catch(() => null);
      }
      setGallery((prev) => prev.filter((img) => img._id !== id && img.id !== id));
      broadcastAdminSync('gallery');
      showToast('Gallery image deleted', 'success');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  // Reviews CRUD
  const approveReview = async (id) => {
    try {
      const res = await api.admin.approveReview(id);
      const updated = res?.data;
      setAdminReviews((prev) =>
        prev.map((r) =>
          r.id === id || r._id === id
            ? { ...r, ...(updated || {}), verified: true, status: 'approved' }
            : r
        )
      );
      setReviews((prev) => {
        const exists = prev.some((r) => r.id === id || r._id === id);
        let next;
        if (exists) {
          next = prev.map((r) =>
            r.id === id || r._id === id
              ? { ...r, ...(updated || {}), verified: true, status: 'approved' }
              : r
          );
        } else if (updated) {
          next = [{ ...updated, verified: true, status: 'approved' }, ...prev];
        } else {
          next = prev;
        }
        try { localStorage.setItem('marichin_reviews', JSON.stringify(next)); } catch {}
        return next;
      });
      broadcastAdminSync('reviews');
      showToast('Review approved & published', 'success');
      return { success: true, data: updated };
    } catch (err) {
      showToast(err.message || 'Failed to approve review', 'error');
      return { success: false, message: err.message };
    }
  };

  const hideReview = async (id) => {
    try {
      const res = await api.admin.hideReview(id);
      const updated = res?.data;
      setAdminReviews((prev) =>
        prev.map((r) =>
          r.id === id || r._id === id
            ? { ...r, ...(updated || {}), verified: false, status: 'hidden' }
            : r
        )
      );
      setReviews((prev) => {
        const next = prev.filter((r) => r.id !== id && r._id !== id);
        try { localStorage.setItem('marichin_reviews', JSON.stringify(next)); } catch {}
        return next;
      });
      broadcastAdminSync('reviews');
      showToast('Review hidden from public website', 'success');
      return { success: true, data: updated };
    } catch (err) {
      showToast(err.message || 'Failed to hide review', 'error');
      return { success: false, message: err.message };
    }
  };

  const addReview = async (newReview) => {
    try {
      const res = await api.createReview(newReview);
      const created = res?.data;
      if (!created) {
        throw new Error(res?.message || 'Unable to save review');
      }
      setAdminReviews((prev) => [created, ...prev]);
      if (created.status === 'approved') {
        setReviews((prev) => {
          const next = [created, ...prev];
          try { localStorage.setItem('marichin_reviews', JSON.stringify(next)); } catch {}
          return next;
        });
      }
      broadcastAdminSync('reviews');
      showToast('Thank you! Your review has been published.', 'success');
      return { success: true, data: created };
    } catch (err) {
      const msg = err?.data?.errors?.[0]?.msg || err?.message || 'Failed to submit review';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const deleteReview = async (id) => {
    try {
      await api.admin.deleteReview(id);
      setAdminReviews((prev) => prev.filter((r) => r.id !== id && r._id !== id));
      setReviews((prev) => {
        const next = prev.filter((r) => r.id !== id && r._id !== id);
        try { localStorage.setItem('marichin_reviews', JSON.stringify(next)); } catch {}
        return next;
      });
      broadcastAdminSync('reviews');
      showToast('Review deleted permanently', 'success');
      return { success: true };
    } catch (err) {
      showToast(err.message || 'Failed to delete review', 'error');
      return { success: false, message: err.message };
    }
  };

  // Enquiries CRUD
  const addEnquiry = async (enq) => {
    const localRecord = {
      id: `ENQ-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      status: "new",
      ...enq
    };

    try {
      const res = await api.createEnquiry(enq);
      const created = res?.data || localRecord;
      setEnquiries((prev) => [created, ...prev]);
      showToast('Enquiry submitted successfully', 'success');
    } catch (err) {
      setEnquiries((prev) => [localRecord, ...prev]);
      showToast(err.message || 'Submitted offline', 'info');
    }
  };

  const updateEnquiryStatus = async (id, status, adminNotes) => {
    try {
      const res = await api.admin.updateEnquiryStatus(id, status, adminNotes);
      if (res?.data) {
        setEnquiries((prev) => prev.map((e) => (e._id === id || e.id === id ? res.data : e)));
        showToast('Enquiry updated', 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const deleteEnquiry = async (id) => {
    try {
      await api.admin.deleteEnquiry(id);
      setEnquiries((prev) => prev.filter((e) => e._id !== id && e.id !== id));
      showToast('Enquiry deleted', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Offers CRUD
  const addOffer = async (offer) => {
    try {
      const res = await api.admin.createPromo(offer);
      const created = res?.data || offer;
      setOffers((prev) => [...prev, created]);
      showToast(`Promo '${created.code}' created`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const updateOffer = async (id, data) => {
    try {
      const targetId = id || offers.find((o) => o.code === data.code)?._id;
      if (targetId) {
        const res = await api.admin.updatePromo(targetId, data);
        if (res?.data) {
          setOffers((prev) => prev.map((o) => (o._id === targetId || o.code === data.code ? res.data : o)));
          showToast(`Promo '${res.data.code}' updated`, 'success');
          return;
        }
      }
      setOffers((prev) => prev.map((o) => (o._id === id || o.code === data.code ? { ...o, ...data } : o)));
      showToast(`Promo updated`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const deleteOffer = async (code, id) => {
    try {
      const targetId = id || offers.find((o) => o.code === code)?._id;
      if (targetId) {
        await api.admin.deletePromo(targetId);
      }
      setOffers((prev) => prev.filter((o) => o.code !== code && o._id !== targetId));
      showToast(`Promo deleted`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Users CRUD (Admin Only)
  const addUser = async (userData) => {
    try {
      const res = await api.admin.createUser(userData);
      if (res?.data) {
        setUsers((prev) => [res.data, ...prev]);
        showToast(`User '${res.data.name}' created`, 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const updateUser = async (id, data) => {
    try {
      const res = await api.admin.updateUser(id, data);
      if (res?.data) {
        setUsers((prev) => prev.map((u) => (u._id === id ? res.data : u)));
        showToast('User updated', 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const deleteUser = async (id) => {
    try {
      await api.admin.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      showToast('User deleted', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Settings update
  const saveSiteSettings = async (newSettings, options = {}) => {
    const strictServer = Boolean(options?.strict);
    try {
      const res = await api.admin.updateSettings(newSettings);
      const incoming = res?.data || newSettings;
      const resolvedFullHome = incoming.fullHomePricePerNight !== undefined
        ? Number(incoming.fullHomePricePerNight)
        : (newSettings.fullHomePricePerNight !== undefined ? Number(newSettings.fullHomePricePerNight) : resolveFullHomePrice(siteSettings, packages));
      const rawPhone = incoming.phone !== undefined ? incoming.phone : (Array.isArray(incoming.phones) ? incoming.phones[0] : (newSettings.phone !== undefined ? newSettings.phone : newSettings.phones?.[0]));
      const rawWa = incoming.whatsappNumber !== undefined ? incoming.whatsappNumber : (incoming.whatsapp !== undefined ? incoming.whatsapp : (newSettings.whatsappNumber !== undefined ? newSettings.whatsappNumber : newSettings.whatsapp));
      const rawEmail = incoming.email !== undefined ? incoming.email : newSettings.email;
      const safePhone = rawPhone !== undefined ? (!isPlaceholderPhone(rawPhone) ? String(rawPhone).trim() : '') : siteSettings.phone;
      const safeWa = rawWa !== undefined ? (!isPlaceholderPhone(rawWa) ? String(rawWa).trim() : '') : siteSettings.whatsappNumber;
      const safeEmail = rawEmail !== undefined ? (!isPlaceholderEmail(rawEmail) ? String(rawEmail).trim() : '') : siteSettings.email;

      const normalized = {
        ...siteSettings,
        ...incoming,
        ...normalizeHeroBannerSettingsClient(incoming),
        name: incoming.propertyName !== undefined ? incoming.propertyName : (newSettings.propertyName || newSettings.name || siteSettings.name),
        propertyName: incoming.propertyName !== undefined ? incoming.propertyName : (newSettings.propertyName || newSettings.name || siteSettings.propertyName),
        phone: safePhone,
        phones: safePhone ? [safePhone] : [],
        whatsapp: safeWa,
        whatsappNumber: safeWa,
        email: safeEmail,
        address: incoming.address !== undefined ? incoming.address : newSettings.address,
        googleMapsShareUrl: incoming.googleMapsShareUrl !== undefined ? incoming.googleMapsShareUrl : (newSettings.googleMapsShareUrl ?? siteSettings.googleMapsShareUrl ?? ''),
        instagramUrl: resolveInstagramUrl(incoming.instagramUrl ?? newSettings.instagramUrl ?? siteSettings.instagramUrl),
        facebookUrl: resolveFacebookUrl(incoming.facebookUrl ?? newSettings.facebookUrl ?? siteSettings.facebookUrl),
        youtubeUrl: resolveYoutubeUrl(incoming.youtubeUrl ?? newSettings.youtubeUrl ?? siteSettings.youtubeUrl),
        fullHomePricePerNight: resolvedFullHome
      };
      setSiteSettings(normalized);
      if (normalized.policiesLastUpdated) {
        setPoliciesLastUpdated(normalized.policiesLastUpdated);
      }
      if (newSettings.fullHomePricePerNight !== undefined && Number(newSettings.fullHomePricePerNight) > 0) {
        const updatedFullHome = Number(newSettings.fullHomePricePerNight);
        setPackages((prev) =>
          prev.map((p) => {
            const s = String(p.slug || p.id || '').toLowerCase();
            if (s.includes('entire-homestay') || s.includes('all-5-rooms')) {
              return normalizePackage({ ...p, price: updatedFullHome, offerPrice: updatedFullHome, updatedAt: new Date().toISOString() });
            }
            return p;
          })
        );
      }
      localStorage.setItem('marichin_settings', JSON.stringify(normalized));
      broadcastAdminSync('settings');
      showToast('Settings saved successfully', 'success');
      return { success: true, data: normalized };
    } catch (err) {
      if (err?.status || strictServer) {
        const errMessage = err?.message || 'Could not save settings to server. Please check your input and connection.';
        showToast(errMessage, 'error');
        return { success: false, message: errMessage, data: null };
      }
      const localNorm = {
        ...siteSettings,
        ...newSettings,
        name: newSettings.propertyName || newSettings.name || siteSettings.name,
        propertyName: newSettings.propertyName || newSettings.name || siteSettings.propertyName,
        phone: newSettings.phone || newSettings.phones?.[0],
        phones: newSettings.phones || [newSettings.phone],
        whatsapp: newSettings.whatsapp || newSettings.whatsappNumber,
        whatsappNumber: newSettings.whatsappNumber || newSettings.whatsapp,
        email: resolveHostEmail(newSettings.email),
        address: newSettings.address,
        googleMapsShareUrl: newSettings.googleMapsShareUrl ?? siteSettings.googleMapsShareUrl ?? ''
      };
      setSiteSettings(localNorm);
      localStorage.setItem('marichin_settings', JSON.stringify(localNorm));
      broadcastAdminSync('settings');
      showToast('Saved locally in browser', 'info');
      return { success: true, data: localNorm };
    }
  };

  const resolvedFullHomePrice = resolveFullHomePrice(siteSettings, packages);

  return (
    <AdminContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser,
      authChecking,
      login,
      logout,
      changePassword,
      loading,
      apiOnline,
      syncVersion,
      broadcastAdminSync,
      toast,
      showToast,
      rooms,
      bookings,
      blockedDates,
      diningMenu,
      packages,
      experiences,
      inclusions,
      setInclusions,
      policySections,
      setPolicySections,
      safetyContacts,
      setSafetyContacts,
      policiesLastUpdated,
      reviews,
      adminReviews,
      offers,
      enquiries,
      gallery,
      users,
      activityLogs,
      siteSettings,
      resolvedFullHomePrice,
      saveSiteSettings,
      refreshData: fetchPublicData,
      refreshAdminData: fetchAdminData,
      refreshAdminBookings,
      addBooking,
      createManualBooking,
      updateBookingStatus,
      recordPayment,
      cancelBookingWithReason,
      requestDateChange,
      clearDateChangeFlag,
      changeBookingDates,
      cancelAndRefundBooking,
      markBalanceReceived,
      deleteBooking,
      toggleBlockDate,
      updateRoom,
      addRoom,
      deleteRoom,
      addPackage,
      updatePackage,
      deletePackage,
      addExperience,
      updateExperience,
      deleteExperience,
      addInclusionItem,
      updateInclusionItem,
      deleteInclusionItem,
      reorderInclusionItems,
      toggleInclusionItem,
      addPolicySection,
      updatePolicySection,
      deletePolicySection,
      reorderPolicySections,
      togglePolicySection,
      addSafetyContact,
      updateSafetyContact,
      deleteSafetyContact,
      toggleSafetyContact,
      diningContent,
      setDiningContent,
      updateDiningContent,
      addMenuCategory,
      updateMenuCategory,
      deleteMenuCategory,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      addGalleryImage,
      deleteGalleryImage,
      approveReview,
      hideReview,
      addReview,
      deleteReview,
      addEnquiry,
      updateEnquiryStatus,
      deleteEnquiry,
      addOffer,
      updateOffer,
      deleteOffer,
      addUser,
      updateUser,
      deleteUser
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext) || DEFAULT_ADMIN_CONTEXT;
