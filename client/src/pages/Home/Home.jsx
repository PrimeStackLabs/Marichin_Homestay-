import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { BookingBar } from '../../components/BookingBar/BookingBar';
import { OurStorySection } from '../../components/About/OurStorySection';
import { EditorialGuestStories } from '../../components/Home/EditorialGuestStories';
import { InclusionsSection } from '../../components/Inclusions/InclusionsSection';
import { HOMESTAY_INFO, PACKAGES_DATA, ROOMS_DATA } from '../../data/homestayData';
import {
  cleanInternationalPhone,
  resolveHostPhone,
  DEFAULT_HOST_WHATSAPP_DIGITS,
  isPlaceholderPhone
} from '../../utils/whatsappMessages';
import {
  getRoomBalcony,
  getStandardRoomPrice,
  getLowestRoomPrice,
  getPackagePriceMeta
} from '../../utils/homestayFormatting';
import {
  DEFAULT_HERO_BANNER,
  isDefaultHeroVideo,
  normalizeHeroBannerSettingsClient,
  resolveHeroOverlayClasses,
  resolveHeroPosterUrl,
  resolveLocalizedHeroField
} from '../../utils/heroBannerDefaults';
import { resolveMediaUrl, normalizeImageUrl } from '../../utils/imageUrl';
import {
  Sparkles,
  Coffee,
  Flame,
  Trees,
  Compass,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Maximize2,
  Users,
  UtensilsCrossed,
  Wifi,
  Car,
  Gamepad2,
  BedDouble
} from 'lucide-react';

const HERO_VIDEOS = [
  { id: 0, name: 'resortvdo.mp4', src: '/images/resortvdo.mp4', label: 'Misty Canopy & Forest' },
  { id: 1, name: 'home2.mp4', src: '/images/home2.mp4', label: 'Resort Grounds & Cottages' },
];

const FACILITIES = [
  { icon: Wifi, label: 'Wi-Fi' },
  { icon: UtensilsCrossed, label: 'Homely Food' },
  { icon: Car, label: 'Parking Facility' },
  { icon: Flame, label: 'Campfire' },
  { icon: Gamepad2, label: 'Indoor & Outdoor Games' },
  { icon: Trees, label: 'Estate Walk' },
];

export const Home = () => {
  const { t, language } = useLanguage();
  const isKn = language === 'kn';
  const { rooms, siteSettings, reviews, packages, resolvedFullHomePrice } = useAdmin();
  const hasApprovedReviews = (reviews || []).some((r) => r.status === 'approved' || r.approved === true || r.isApproved === true);
  const inclusionsBgColor = hasApprovedReviews ? 'bg-[#F1E9D8]' : 'bg-[#FAF6EC]';

  // Package calculation
  const homePackages = (packages && packages.length > 0) ? packages.filter(p => p.isActive !== false) : PACKAGES_DATA;
  const lowestRoomPrice = getLowestRoomPrice(rooms);
  const standardRoomPrice = getStandardRoomPrice(rooms);
  const entireHomestayPrice = resolvedFullHomePrice || (rooms || []).reduce((sum, r) => {
    const p = Number(r.pricePerNight || r.price || 0);
    const units = Number(r.totalUnits) || (r.slug === 'single-room' ? 1 : 2);
    return sum + (p * units);
  }, 0) || 42000;
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  const [saveDataEnabled, setSaveDataEnabled] = useState(() => {
    if (typeof navigator === 'undefined') return false;
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return Boolean(conn?.saveData || conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g');
  });
  const [videoPlaybackError, setVideoPlaybackError] = useState(false);
  const [posterImageError, setPosterImageError] = useState(false);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const videoRef0 = useRef(null);
  const videoRef1 = useRef(null);
  const customVideoRef = useRef(null);

  const normalizedHero = useMemo(
    () => normalizeHeroBannerSettingsClient(siteSettings),
    [siteSettings]
  );
  const usingDefaultHeroVideo = isDefaultHeroVideo(normalizedHero.heroVideoUrl);
  const resolvedHeroPoster = useMemo(
    () => resolveHeroPosterUrl(siteSettings),
    [siteSettings]
  );
  const overlayClasses = useMemo(
    () => resolveHeroOverlayClasses(normalizedHero.heroOverlay),
    [normalizedHero.heroOverlay]
  );

  const heroBadgeText = resolveLocalizedHeroField(
    normalizedHero.heroBadge,
    isKn,
    DEFAULT_HERO_BANNER.heroBadge
  );
  const heroTitleText = resolveLocalizedHeroField(
    normalizedHero.heroTitle,
    isKn,
    DEFAULT_HERO_BANNER.heroTitle
  );
  const heroSubtitleText = resolveLocalizedHeroField(
    normalizedHero.heroSubtitle,
    isKn,
    DEFAULT_HERO_BANNER.heroSubtitle
  );
  const heroPrimaryText = resolveLocalizedHeroField(
    normalizedHero.heroPrimaryLabel,
    isKn,
    DEFAULT_HERO_BANNER.heroPrimaryLabel
  );
  const heroSecondaryText = resolveLocalizedHeroField(
    normalizedHero.heroSecondaryLabel,
    isKn,
    DEFAULT_HERO_BANNER.heroSecondaryLabel
  );
  const shouldDisableHeroVideo = prefersReducedMotion || saveDataEnabled;

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setPrefersReducedMotion(mediaQuery.matches);
    onChange();
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', onChange);
      return () => mediaQuery.removeEventListener('change', onChange);
    }
    mediaQuery.addListener(onChange);
    return () => mediaQuery.removeListener(onChange);
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return;
    const updateConn = () => {
      setSaveDataEnabled(
        Boolean(conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g')
      );
    };
    updateConn();
    if (typeof conn.addEventListener === 'function') {
      conn.addEventListener('change', updateConn);
      return () => conn.removeEventListener('change', updateConn);
    }
  }, []);

  useEffect(() => {
    setVideoPlaybackError(false);
    setHeroVideoReady(false);
    setActiveVideoIdx(0);
  }, [normalizedHero.heroVideoUrl]);

  useEffect(() => {
    setPosterImageError(false);
  }, [resolvedHeroPoster]);

  const rawWhatsapp = resolveHostPhone(siteSettings?.whatsappNumber || siteSettings?.whatsapp || HOMESTAY_INFO.whatsapp);
  const cleanWhatsapp = cleanInternationalPhone(rawWhatsapp) || DEFAULT_HOST_WHATSAPP_DIGITS;

  const facilityKnMap = {
    'wi-fi': 'ವೈ-ಫೈ',
    'wifi': 'ವೈ-ಫೈ',
    'homely food': 'ಮನೆ ಊಟ',
    'food': 'ಮನೆ ಊಟ',
    'parking facility': 'ಪಾರ್ಕಿಂಗ್ ಸೌಲಭ್ಯ',
    'parking': 'ಪಾರ್ಕಿಂಗ್ ಸೌಲಭ್ಯ',
    'campfire': 'ಕ್ಯಾಂಪ್‌ಫೈರ್',
    'indoor & outdoor games': 'ಒಳಾಂಗಣ ಮತ್ತು ಹೊರಾಂಗಣ ಆಟಗಳು',
    'games': 'ಆಟಗಳು',
    'estate walk': 'ತೋಟದ ನಡಿಗೆ'
  };

  const facilitiesData = (siteSettings?.facilities && siteSettings.facilities.length > 0)
    ? siteSettings.facilities.map((f) => {
        const rawLabel = typeof f === 'string' ? f : (f.label || f.name || '');
        const found = FACILITIES.find((fac) => fac.label.toLowerCase() === rawLabel.toLowerCase());
        const iconMap = {
          'wi-fi': Wifi,
          'wifi': Wifi,
          'homely food': UtensilsCrossed,
          'food': UtensilsCrossed,
          'parking facility': Car,
          'parking': Car,
          'campfire': Flame,
          'indoor & outdoor games': Gamepad2,
          'games': Gamepad2,
          'estate walk': Trees,
        };
        const label = isKn ? (facilityKnMap[rawLabel.toLowerCase()] || rawLabel) : rawLabel;
        return {
          icon: found ? found.icon : (iconMap[rawLabel.toLowerCase()] || Trees),
          label: label,
        };
      })
    : FACILITIES.map(f => ({
        ...f,
        label: isKn ? (facilityKnMap[f.label.toLowerCase()] || f.label) : f.label
      }));

  // Intersection Observer for Architectural Cottages & Suites
  const cottagesRef = useRef(null);
  const [cottagesVisible, setCottagesVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCottagesVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    if (cottagesRef.current) {
      observer.observe(cottagesRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Intersection Observer for Signature Stay Packages
  const packagesRef = useRef(null);
  const [packagesVisible, setPackagesVisible] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setPackagesVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPackagesVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    if (packagesRef.current) {
      observer.observe(packagesRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Play active video and pause inactive video cleanly without aborting initial 206 media loads
  useEffect(() => {
    if (!usingDefaultHeroVideo || shouldDisableHeroVideo || videoPlaybackError) {
      return;
    }
    let cancelled = false;
    const activeRef = activeVideoIdx === 0 ? videoRef0.current : videoRef1.current;
    const inactiveRef = activeVideoIdx === 0 ? videoRef1.current : videoRef0.current;

    if (activeRef) {
      if (activeRef.ended || activeRef.currentTime > 0.1) {
        try {
          activeRef.currentTime = 0;
        } catch {}
      }
      if (!cancelled) {
        const playPromise = activeRef.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      }
    }
    if (inactiveRef && !inactiveRef.paused) {
      inactiveRef.pause();
    }

    return () => {
      cancelled = true;
    };
  }, [activeVideoIdx, usingDefaultHeroVideo, shouldDisableHeroVideo, videoPlaybackError]);

  useEffect(() => {
    if (usingDefaultHeroVideo || shouldDisableHeroVideo || videoPlaybackError) return;
    const vid = customVideoRef.current;
    if (!vid) return;
    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  }, [normalizedHero.heroVideoUrl, usingDefaultHeroVideo, shouldDisableHeroVideo, videoPlaybackError]);

  const displayRooms = useMemo(() => {
    const list = Array.isArray(rooms) && rooms.length > 0 ? rooms : [];
    const findRoom = (slugPart) => list.find(r =>
      (r.slug || r.id || '').toLowerCase().includes(slugPart) ||
      (r.name || '').toLowerCase().includes(slugPart)
    );
    const std = findRoom('standard') || ROOMS_DATA[0];
    const ste = findRoom('suite') || ROOMS_DATA[1];
    const sgl = findRoom('single') || ROOMS_DATA[2];
    return [std, ste, sgl];
  }, [rooms]);

  return (
    <div className="w-full">

      {/* ======================================================== */}
      {/* 1. HERO SECTION – Forest Deep with Subtle Radial Depth   */}
      {/* ======================================================== */}
      <section className="relative w-full min-h-[780px] sm:min-h-[740px] md:min-h-[720px] lg:min-h-[700px] overflow-hidden bg-[#0F2A20] bg-dark-radial flex flex-col justify-between items-center border-b border-[#B8964A]/20 pt-28 sm:pt-32 lg:pt-36 pb-[28px]">
        {/* Poster fallback shown while video loads or when video is disabled/errored */}
        {(shouldDisableHeroVideo || videoPlaybackError || !heroVideoReady) && resolvedHeroPoster && !posterImageError && (
          <img
            src={resolvedHeroPoster}
            alt="Marichin Homestay, Kushalnagar, Coorg"
            onError={() => setPosterImageError(true)}
            className="absolute inset-0 w-full h-full object-cover z-[5]"
          />
        )}

        {!shouldDisableHeroVideo && !videoPlaybackError && (
          usingDefaultHeroVideo ? (
            <>
              {/* Video 1: resortvdo.mp4 */}
              <video
                ref={videoRef0}
                src={HERO_VIDEOS[0].src}
                poster={resolvedHeroPoster}
                autoPlay
                muted
                playsInline
                preload="metadata"
                onCanPlay={() => setHeroVideoReady(true)}
                onError={() => setVideoPlaybackError(true)}
                onEnded={() => setActiveVideoIdx(1)}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                  activeVideoIdx === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              />

              {/* Video 2: home2.mp4 (lazy preloaded until switched active to prevent parallel 206 cache contention) */}
              <video
                ref={videoRef1}
                src={HERO_VIDEOS[1].src}
                poster={resolvedHeroPoster}
                muted
                playsInline
                preload={activeVideoIdx === 1 ? 'auto' : 'none'}
                onError={() => setActiveVideoIdx(0)}
                onEnded={() => setActiveVideoIdx(0)}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                  activeVideoIdx === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              />
            </>
          ) : (
            <video
              key={normalizedHero.heroVideoUrl}
              ref={customVideoRef}
              src={resolveMediaUrl(normalizedHero.heroVideoUrl)}
              poster={normalizeImageUrl(resolvedHeroPoster)}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              onCanPlay={() => setHeroVideoReady(true)}
              onError={() => setVideoPlaybackError(true)}
              className="absolute inset-0 w-full h-full object-cover z-10"
            />
          )
        )}

        {/* Atmospheric Vignette Overlays for Depth and Contrast */}
        <div className={`absolute inset-0 bg-gradient-to-t ${overlayClasses.gradient} z-[15] pointer-events-none transition-colors duration-300`} />
        <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${overlayClasses.radial} z-[15] pointer-events-none transition-colors duration-300`} />

        {/* Catchy Hero Tagline & Narrative Overlay */}
        <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full my-auto pb-10 sm:pb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0F2A20]/80 border border-[#B8964A]/35 mb-4 backdrop-blur-md shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-[#D9BC7A]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D9BC7A]">
              {heroBadgeText}
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#F3EDDD] font-normal leading-tight tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] max-w-4xl mx-auto mb-4 whitespace-pre-line">
            {heroTitleText}
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[#F3EDDD]/95 font-light max-w-2xl mx-auto mb-8 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] leading-[1.7]">
            {heroSubtitleText}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/rooms"
              className="px-8 py-3.5 rounded-[12px] text-xs uppercase tracking-[0.14em] font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all duration-300 shadow-[0_4px_20px_rgba(184,150,74,0.4)] hover:-translate-y-0.5 active:translate-y-0"
            >
              {heroPrimaryText.includes('→') ? heroPrimaryText : `${heroPrimaryText} →`}
            </Link>
            <Link
              to="/booking"
              className="px-7 py-3.5 rounded-[12px] text-xs uppercase tracking-[0.14em] font-semibold text-[#D9BC7A] bg-[#0F2A20]/80 border-[1.5px] border-[#B8964A] hover:bg-[#B8964A] hover:text-[#0F2A20] transition-all duration-300 backdrop-blur-md hover:-translate-y-0.5"
            >
              {heroSecondaryText}
            </Link>
          </div>
        </div>

        {/* Facilities Strip inside Hero (28px above hero bottom edge) */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-strip-in">
          <div className="rounded-3xl p-4 sm:p-5 lg:p-6 bg-white border border-[#FAF6EC] shadow-[0_16px_50px_rgba(0,0,0,0.35)]">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 items-center">
              {facilitiesData.map((facility, idx) => {
                const Icon = facility.icon;
                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2.5 py-1 px-1 group cursor-default text-center sm:text-left"
                  >
                    <Icon
                      className="w-5 h-5 sm:w-6 sm:h-6 text-[#B8964A] group-hover:scale-110 transition-transform flex-shrink-0"
                      strokeWidth={1.8}
                    />
                    <span className="text-[11px] sm:text-xs font-semibold tracking-wide text-[#0F2A20] whitespace-normal sm:whitespace-nowrap leading-tight">
                      {facility.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. BOOKING SECTION – Linen (#F1E9D8)                     */}
      {/* ======================================================== */}
      <section className="w-full bg-[#F1E9D8] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A] block mb-2">
              {isKn ? 'ನೇರ ಲಭ್ಯತೆ' : 'DIRECT AVAILABILITY'}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#0F2A20] font-normal">
              {isKn ? 'ಲಭ್ಯತೆ ಮತ್ತು ದರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ' : 'Check Availability & Rates'}
            </h2>
          </div>
          <BookingBar />
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. THREE HIGHLIGHTS – Ivory (#FAF6EC)                    */}
      {/* ======================================================== */}
      <section className="w-full bg-[#FAF6EC] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Three Highlights Header */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center justify-center gap-3 mb-2">
              <span className="w-8 h-px bg-[#B8964A]" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A]">
                {isKn ? 'ನೈಜ ಕೊಡಗಿನ ಜೀವನ ಶೈಲಿ' : 'AUTHENTIC COORG LIVING'}
              </span>
              <span className="w-8 h-px bg-[#B8964A]" />
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl text-[#0F2A20] font-normal tracking-tight mt-1">
              {isKn ? 'ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇಯ ಮೂರು ಪ್ರಮುಖ ಮುಖ್ಯಾಂಶಗಳು' : 'Three Highlights of Marichin Homestay'}
            </h2>
            <p className="text-base text-[#5F6B62] font-light leading-[1.7] max-w-2xl mx-auto mt-3">
              {isKn
                ? 'ಚಿಕ್ಕಬೆಟ್ಟಗೇರಿಯ ನಮ್ಮ ಕುಟುಂಬದ ಕಾಫಿ ತೋಟಕ್ಕೆ ಪ್ರಶಾಂತ ಮತ್ತು ವಿಶ್ರಾಂತಿಯ ರಜೆಗಾಗಿ ನಿಮ್ಮನ್ನು ಪ್ರೀತಿಯಿಂದ ಸ್ವಾಗತಿಸುತ್ತೇವೆ.'
                : 'We welcome you to our family coffee estate in Chikkabettageri Village for a peaceful and relaxing getaway.'}
            </p>
          </div>

          {/* Asymmetrical 3-Pillar Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
            {/* Pillar 1: Estate Setting */}
            <div className="lg:col-span-7 group relative rounded-3xl overflow-hidden border border-[#B8964A]/25 bg-[#1B4332] p-8 sm:p-10 flex flex-col justify-between transition-all duration-500 hover:border-[#D9BC7A]/50 shadow-[0_12px_36px_rgba(15,42,32,0.35)] min-h-[380px]">
              <div className="absolute inset-0 z-0 overflow-hidden">
                <img
                  src="/images/realimage/homeimage.jpeg"
                  alt="Marichin Homestay Coffee Estate Setting"
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F2A20] via-[#0F2A20]/80 to-[#0F2A20]/40" />
              </div>

              <div className="relative z-10 flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-[#1B4332] border border-[#B8964A]/40 flex items-center justify-center text-[#D9BC7A] shadow-md">
                  <Trees className="w-7 h-7 text-[#D9BC7A]" />
                </div>
                <span className="font-serif text-3xl sm:text-4xl font-bold text-[#D9BC7A]/40 select-none">
                  01
                </span>
              </div>

              <div className="relative z-10 mt-12 sm:mt-16">
                <span className="text-[10px] uppercase font-bold tracking-[0.18em] text-[#D9BC7A] bg-[#0F2A20]/80 px-3 py-1 rounded-full border border-[#B8964A]/30 inline-block mb-2">
                  {isKn ? 'ಹಚ್ಚಹಸಿರಿನ ಕಾಫಿ ತೋಟ · ಕುಶಾಲನಗರ' : 'Lush Coffee Estate · Kushalnagar'}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#F3EDDD] font-medium mb-3">
                  {isKn ? 'ಪ್ರಶಾಂತ ತೋಟದ ಪರಿಸರ' : 'Peaceful Estate Setting'}
                </h3>
                <p className="text-sm text-[#B9C4B8] font-light leading-[1.7] max-w-xl">
                  {isKn
                    ? 'ಚಿಕ್ಕಬೆಟ್ಟಗೇರಿ ಗ್ರಾಮದಲ್ಲಿ ಹಸಿರು ಕಾಫಿ ಗಿಡಗಳು ಮತ್ತು ನೆರಳಿನ ಮರಗಳ ನಡುವೆ ನೆಲೆಸಿದ್ದು, ಗಿಜಿಗುಡುವ ಪ್ರವಾಸಿ ಪ್ರದೇಶಗಳಿಂದ ದೂರವಾಗಿ ನೆಮ್ಮದಿಯ ವಾತಾವರಣ ನೀಡುತ್ತದೆ.'
                    : 'Nestled within green coffee plantations and tall shade trees in Chikkabettageri Village, offering a quiet and refreshing atmosphere away from crowded tourist areas.'}
                </p>
              </div>
            </div>

            {/* Pillars 2 & 3: White Cards on Ivory */}
            <div className="lg:col-span-5 flex flex-col gap-6 sm:gap-8 justify-between">
              {/* Pillar 2 */}
              <div className="group rounded-3xl border border-[#F1E9D8] bg-white hover:border-[#B8964A]/50 p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-[0_10px_40px_rgba(15,42,32,0.08)] hover:shadow-[0_16px_45px_rgba(15,42,32,0.12)] flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#F1E9D8] border border-[#B8964A]/30 flex items-center justify-center text-[#0F2A20]">
                    <UtensilsCrossed className="w-6 h-6 text-[#B8964A]" />
                  </div>
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-[#B8964A]/30 select-none">
                    02
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-[0.18em] text-[#A8654A] block mb-1">
                    {isKn ? 'ಆತ್ಮೀಯ ಆತಿಥ್ಯ' : 'Warm Hospitality'}
                  </span>
                  <h4 className="font-serif text-xl sm:text-2xl text-[#0F2A20] font-medium mb-2 group-hover:text-[#B8964A] transition-colors">
                    {isKn ? 'ನೈಜ ರುಚಿಯ ಮನೆ ಊಟ' : 'Authentic Homely Food'}
                  </h4>
                  <p className="text-sm text-[#5F6B62] font-light leading-[1.7]">
                    {isKn
                      ? 'ಸ್ಥಳೀಯ ಸಾಂಬಾರ ಪದಾರ್ಥಗಳೊಂದಿಗೆ ಪ್ರತಿದಿನ ತಾಜಾವಾಗಿ ತಯಾರಿಸಿದ ಆರೋಗ್ಯಕರ ಮನೆ ಊಟವನ್ನು ನಮ್ಮ ಸುಂದರ ಊಟದ ಸಭಾಂಗಣದಲ್ಲಿ ಸವಿಯಿರಿ.'
                      : 'Savor wholesome home-cooked meals prepared fresh daily with authentic local spices, served warmly in our comfortable dining hall.'}
                  </p>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="group rounded-3xl border border-[#F1E9D8] bg-white hover:border-[#B8964A]/50 p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-[0_10px_40px_rgba(15,42,32,0.08)] hover:shadow-[0_16px_45px_rgba(15,42,32,0.12)] flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#F1E9D8] border border-[#B8964A]/30 flex items-center justify-center text-[#0F2A20]">
                    <Flame className="w-6 h-6 text-[#B8964A]" />
                  </div>
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-[#B8964A]/30 select-none">
                    03
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-[0.18em] text-[#A8654A] block mb-1">
                    {isKn ? 'ನಿಸರ್ಗ ಮತ್ತು ಮನರಂಜನೆ' : 'Nature & Recreation'}
                  </span>
                  <h4 className="font-serif text-xl sm:text-2xl text-[#0F2A20] font-medium mb-2 group-hover:text-[#B8964A] transition-colors">
                    {isKn ? 'ತೋಟದ ನಡಿಗೆ ಮತ್ತು ಕ್ಯಾಂಪ್‌ಫೈರ್' : 'Estate Walk & Campfire'}
                  </h4>
                  <p className="text-sm text-[#5F6B62] font-light leading-[1.7]">
                    {isKn
                      ? 'ಖಾಸಗಿ ಕಾಫಿ ಹಾದಿಗಳಲ್ಲಿ ಆಹ್ಲಾದಕರ ಮುಂಜಾನೆಯ ನಡಿಗೆ ಮಾಡಿ ಮತ್ತು ಸಂಜೆ ಬೆಚ್ಚನೆಯ ಕ್ಯಾಂಪ್‌ಫೈರ್ ಹಾಗೂ ಆಟಗಳೊಂದಿಗೆ ಸಂತೋಷದ ಸಮಯ ಕಳೆಯಿರಿ.'
                      : 'Take pleasant morning walks along private coffee trails and gather around a cozy evening campfire with indoor and outdoor games.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. ROOTED IN KODAGU SOIL – Forest Deep Radial (#0F2A20)   */}
      {/* ======================================================== */}
      <OurStorySection theme="dark" />

      {/* ======================================================== */}
      {/* 6. OUR ROOMS – Ivory (#FAF6EC)                           */}
      {/* ======================================================== */}
      <section ref={cottagesRef} className="w-full bg-[#FAF6EC] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="w-6 h-px bg-[#B8964A]" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A]">
                  {isKn ? 'ಹೋಂಸ್ಟೇ ವಾಸ್ತವ್ಯ' : 'HOMESTAY ACCOMMODATION'}
                </span>
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl text-[#0F2A20] font-normal tracking-tight">
                {isKn ? 'ನಮ್ಮ ಕೊಠಡಿಗಳು' : 'Our Rooms'}
              </h2>
            </div>
            <Link
              to="/rooms"
              className="mt-4 md:mt-0 text-xs uppercase tracking-[0.14em] font-bold text-[#0F2A20] hover:text-[#B8964A] flex items-center gap-2 transition-colors group"
            >
              <span>{isKn ? 'ಎಲ್ಲಾ ಕೊಠಡಿಗಳ ವಿವರ ನೋಡಿ' : 'View All Room Details'}</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Three Rooms Grid (Standard, Suite, Single) - 3 columns centered, 1 col mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-center max-w-7xl mx-auto">
            {displayRooms.map((room) => {
              const isSuite = (room.slug || room.name || '').toLowerCase().includes('suite');
              const isSingle = (room.slug || room.name || '').toLowerCase().includes('single');
              const hasBalcony = getRoomBalcony(room);
              const fallbackImage = isSuite ? '/images/realimage/real4.jpeg' : '/images/realimage/real3.jpeg';
              const hasImages = Array.isArray(room.images) && room.images.length > 0;
              const rawMainImage = hasImages
                ? (typeof room.images[0] === 'string' ? room.images[0] : room.images[0].url)
                : (isSuite ? '/images/realimage/real4.jpeg' : (!isSingle ? '/images/realimage/real3.jpeg' : null));
              const mainImage = rawMainImage ? normalizeImageUrl(rawMainImage) : null;
              const roomPrice = Number(room.pricePerNight ?? room.price ?? (isSuite ? 10000 : isSingle ? 6000 : 8000));
              const weekendRoomPrice = Number(room.weekendPrice ?? roomPrice);
              const totalUnits = room.totalUnits || (isSingle ? 1 : 2);
              const maxAdults = room.maxAdults || 2;
              const maxChildren = room.maxChildren ?? (isSingle ? 0 : (isSuite ? 2 : 1));

              const capacityText = isKn
                ? (maxChildren > 0
                    ? `${maxAdults} ವಯಸ್ಕರು + ${maxChildren} ${maxChildren === 1 ? 'ಮಗು' : 'ಮಕ್ಕಳು'}`
                    : `${maxAdults} ವಯಸ್ಕರು`)
                : (maxChildren > 0
                    ? `${maxAdults} Adults + ${maxChildren} ${maxChildren === 1 ? 'Child' : 'Children'}`
                    : `${maxAdults} Adults`);

              const roomNameText = isKn
                ? (room.nameKn || (isSuite ? 'ಸೂಟ್ ಕೊಠಡಿ' : isSingle ? 'ಸಿಂಗಲ್ ಕೊಠಡಿ' : 'ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಕೊಠಡಿ'))
                : room.name;

              const roomDescText = isKn
                ? (room.descriptionKn || (isSuite
                    ? '2 ವಯಸ್ಕರು ಮತ್ತು 2 ಮಕ್ಕಳಿಗೆ ಬಾಲ್ಕನಿ ಮುಖದ ಕೊಠಡಿ. ಬೆಳಗಿನ ಉಪಹಾರ ಸೇರಿದೆ.'
                    : isSingle
                    ? 'ಬಾಲ್ಕನಿ ಇಲ್ಲದ 2 ವಯಸ್ಕರ ಕೊಠಡಿ. ಬೆಳಗಿನ ಉಪಹಾರ ಸೇರಿದೆ.'
                    : '2 ವಯಸ್ಕರು ಮತ್ತು 1 ಮಗುವಿಗೆ ಬಾಲ್ಕನಿ ಮುಖದ ಕೊಠಡಿ. ಬೆಳಗಿನ ಉಪಹಾರ ಸೇರಿದೆ.'))
                : (room.description && room.description.trim()
                    ? room.description
                    : (isSuite
                        ? 'Balcony-facing room for 2 adults and 2 children. Morning breakfast included.'
                        : isSingle
                        ? 'Room for 2 adults, without balcony. Morning breakfast included.'
                        : 'Balcony-facing room for 2 adults and 1 child. Morning breakfast included.'));

              return (
                <div
                  key={room.id || room.slug}
                  className="group rounded-3xl overflow-hidden border border-[#F1E9D8] bg-white hover:border-[#B8964A]/50 shadow-[0_10px_40px_rgba(15,42,32,0.08)] hover:shadow-[0_16px_45px_rgba(15,42,32,0.12)] flex flex-col justify-between transition-all duration-300"
                >
                  <div className="relative h-64 sm:h-72 overflow-hidden bg-[#0A1A13]">
                    {mainImage ? (
                      <>
                        <img
                          src={mainImage}
                          alt={room.name}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = fallbackImage;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </>
                    ) : (
                      /* Neutral placeholder tile for Single Room (no real photo available) */
                      <div className="w-full h-full flex flex-col justify-center items-center text-center p-6 bg-gradient-to-br from-[#122A1E] via-[#0F2A20] to-[#0A1A13] text-[#F3EDDD] relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D9BC7A_1px,transparent_1px)] [background-size:14px_14px]" />
                        <div className="w-14 h-14 rounded-2xl bg-[#1B4332] border border-[#B8964A]/30 flex items-center justify-center text-[#D9BC7A] mb-3 shadow-inner z-10">
                          <BedDouble className="w-7 h-7" />
                        </div>
                        <p className="text-sm text-[#F3EDDD] font-medium z-10">
                          {isKn ? 'ಚಿತ್ರ ಶೀಘ್ರದಲ್ಲೇ ಬರಲಿದೆ' : 'Photo coming soon'}
                        </p>
                      </div>
                    )}

                    {/* Balcony / No Balcony Badge */}
                    <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-[0.14em] shadow-sm z-10 ${
                      hasBalcony ? 'text-[#0F2A20] bg-[#D9BC7A]' : 'text-[#F3EDDD] bg-[#0F2A20]/90 border border-[#B8964A]/30'
                    }`}>
                      {hasBalcony
                        ? (isKn ? 'ಬಾಲ್ಕನಿ ಮುಖ' : 'Balcony facing')
                        : (isKn ? 'ಬಾಲ್ಕನಿ ಇಲ್ಲ' : 'No balcony')}
                    </span>

                    {/* Units Available Badge (Fixed '1 1 Room' bug) */}
                    <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-mono text-[#F3EDDD] bg-black/60 backdrop-blur-md z-10">
                      {isKn ? (totalUnits === 1 ? '1 ಕೊಠಡಿ' : `${totalUnits} ಕೊಠಡಿಗಳು`) : (totalUnits === 1 ? '1 Room' : `${totalUnits} Rooms`)}
                    </span>

                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white z-10">
                      <span className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">
                        <Users className="w-3.5 h-3.5 text-[#D9BC7A]" />
                        <span>{capacityText}</span>
                      </span>
                      <span className="flex items-center gap-1.5 bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full backdrop-blur-sm text-[10px] font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{isKn ? (room.mealsIncludedKn || 'ಉಪಹಾರ ಸೇರಿದೆ') : (room.mealsIncluded || 'Breakfast Included')}</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-2xl font-medium text-[#0F2A20] mb-2 group-hover:text-[#B8964A] transition-colors">
                        {roomNameText}
                      </h3>
                      <p className="text-sm text-[#5F6B62] font-light leading-[1.7] mb-4">
                        {roomDescText}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {(isKn ? ['ವೈ-ಫೈ', 'ಮನೆ ಊಟ', 'ಪಾರ್ಕಿಂಗ್', 'ಕ್ಯಾಂಪ್‌ಫೈರ್'] : (room.amenities || ['Wi-Fi', 'Homely Food', 'Parking Facility', 'Campfire']).slice(0, 4)).map((amenity, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2.5 py-1 rounded-lg bg-[#FAF6EC] border border-[#F1E9D8] text-[#1A2A21]"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#F1E9D8] flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#5F6B62] block">
                          {isKn ? 'ಪ್ರತಿ ರಾತ್ರಿಗೆ' : (weekendRoomPrice !== roomPrice ? 'Weekday rate' : 'per night')}
                        </span>
                        <span className="font-serif text-2xl font-bold text-[#0F2A20]">
                          ₹{roomPrice.toLocaleString('en-IN')}
                        </span>
                        {weekendRoomPrice !== roomPrice && (
                          <span className="text-[11px] font-mono text-[#A8654A] font-semibold block">
                            {isKn ? `ವಾರಾಂತ್ಯ ₹${weekendRoomPrice.toLocaleString('en-IN')}` : `Wknd ₹${weekendRoomPrice.toLocaleString('en-IN')}/nt`}
                          </span>
                        )}
                      </div>
                      <Link
                        to={`/booking?room=${room.slug || room.id}`}
                        className="px-5 py-2.5 rounded-xl text-xs uppercase tracking-[0.14em] font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all shadow-sm hover:-translate-y-0.5 whitespace-nowrap"
                      >
                        {isKn ? 'ಕಾಯ್ದಿರಿಸಿ →' : 'Book Room →'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. EXPERIENCES / DINING – Sage (#DDE6D3)                 */}
      {/* ======================================================== */}
      <section className="w-full bg-[#DDE6D3] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* Left: Overlapping Food Imagery */}
            <div className="lg:col-span-6 relative">
              <div className="rounded-3xl overflow-hidden border border-[#B8964A]/30 shadow-[0_12px_40px_rgba(15,42,32,0.15)] h-[380px] sm:h-[460px] relative group bg-[#FAF6EC]">
                <img
                  src="/images/realimage/real8.jpeg"
                  alt="Homely Dining Hall at Marichin Homestay"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>

              <div className="absolute -bottom-6 -right-3 sm:-right-6 w-44 sm:w-56 h-36 sm:h-44 rounded-2xl overflow-hidden border-2 border-[#B8964A] shadow-xl z-20 hidden xs:block">
                <img
                  src="/images/realimage/real9.jpeg"
                  alt="Dining Buffet Setup at Marichin Homestay"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-[#0F2A20]/90 px-2 py-1 rounded-lg text-[10px] text-[#D9BC7A] font-semibold text-center backdrop-blur-sm">
                  {isKn ? 'ಊಟದ ಸಭಾಂಗಣ ಸೇವೆ' : 'Dining Hall Service'}
                </div>
              </div>
            </div>

            {/* Right: Food Storytelling on Sage */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2">
                <span className="w-6 h-px bg-[#0F2A20]" />
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#0F2A20]">
                  {isKn ? 'ಸಾಂಪ್ರದಾಯಿಕ ಮತ್ತು ರುಚಿಕರ' : 'TRADITIONAL & COMFORTING'}
                </span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#0F2A20] font-normal leading-tight tracking-tight">
                {isKn ? 'ನೈಜ ರುಚಿಯ ಮನೆ ಊಟ' : 'Authentic Home-Cooked Food'}
              </h2>

              <p className="text-sm sm:text-base text-[#1A2A21]/90 font-light leading-[1.7]">
                {isKn
                  ? 'ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇನಲ್ಲಿ ಬಡಿಸಲಾಗುವ ಪ್ರತಿಯೊಂದು ಊಟವನ್ನೂ ಸಾಂಪ್ರದಾಯಿಕ ಪಾಕವಿಧಾನಗಳಿಂದ ಪ್ರತಿದಿನ ತಾಜಾವಾಗಿ ತಯಾರಿಸಲಾಗುತ್ತದೆ. ನಮ್ಮ ಊಟದ ಸಭಾಂಗಣದಲ್ಲಿ ರುಚಿಕರ ಬೆಳಗಿನ ಉಪಹಾರ, ಸ್ಥಳೀಯ ವಿಶೇಷತೆಗಳು ಮತ್ತು ಶುದ್ಧ ತಿನಿಸುಗಳನ್ನು ಸವಿಯಿರಿ.'
                  : 'Every meal served at Marichin Homestay is prepared fresh daily with traditional recipes. Enjoy comforting home-cooked breakfasts, local specialties, and pure vegetarian dishes served in our welcoming dining hall.'}
              </p>

              {/* 4 Cards (Ivory Cards on Sage) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="p-4 rounded-2xl bg-[#FAF6EC] border border-[#B8964A]/25 shadow-sm flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#B8964A] flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-serif text-sm font-bold text-[#0F2A20]">{isKn ? 'ಮನೆ ಊಟ' : 'Home-Cooked Meals'}</h5>
                    <p className="text-[11px] text-[#5F6B62]">{isKn ? 'ಪೌಷ್ಟಿಕ ಉಪಹಾರ ಮತ್ತು ರಾತ್ರಿ ಊಟ' : 'Wholesome breakfast and dinner'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF6EC] border border-[#B8964A]/25 shadow-sm flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#B8964A] flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-serif text-sm font-bold text-[#0F2A20]">{isKn ? 'ಊಟದ ಸಭಾಂಗಣ' : 'Homely Dining Hall'}</h5>
                    <p className="text-[11px] text-[#5F6B62]">{isKn ? 'ಕುಟುಂಬದೊಂದಿಗೆ ಆರಾಮದಾಯಕ ಊಟ' : 'Comfortable dining with family'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF6EC] border border-[#B8964A]/25 shadow-sm flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#B8964A] flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-serif text-sm font-bold text-[#0F2A20]">{isKn ? 'ಸಹಾಯಕ ಅಡುಗೆಮನೆ' : 'Auxiliary Kitchen'}</h5>
                    <p className="text-[11px] text-[#5F6B62]">{isKn ? 'ಶಿಶುಗಳ ಅಗತ್ಯಗಳಿಗೆ ಉಚಿತ ಪ್ರವೇಶ' : 'Complimentary for infant needs'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF6EC] border border-[#B8964A]/25 shadow-sm flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#B8964A] flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-serif text-sm font-bold text-[#0F2A20]">{isKn ? 'ಕಾಫಿ ಮತ್ತು ಚಹಾ' : 'Estate Coffee & Tea'}</h5>
                    <p className="text-[11px] text-[#5F6B62]">{isKn ? 'ಮುಂಜಾನೆ ಮತ್ತು ಸಂಜೆಯ ತಾಜಾ ಕಷಾಯ' : 'Fresh morning and evening brew'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  to="/dining"
                  className="inline-flex items-center gap-3 px-7 py-3.5 rounded-[12px] text-xs uppercase tracking-[0.14em] font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all duration-300 shadow-[0_4px_20px_rgba(184,150,74,0.35)] hover:-translate-y-0.5"
                >
                  <span>{isKn ? 'ಊಟೋಪಚಾರದ ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ' : 'EXPLORE DINING & FOOD DETAILS'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 8. PACKAGES – Forest Deep Radial (#0F2A20)                */}
      {/* ======================================================== */}
      <section ref={packagesRef} className="w-full bg-[#0F2A20] bg-dark-radial text-[#F3EDDD] py-16 sm:py-24 border-b border-[#B8964A]/20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center justify-center gap-3 mb-2">
              <span className="w-8 h-px bg-[#B8964A]" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D9BC7A]">
                {isKn ? 'ಹೋಂಸ್ಟೇ ಪ್ಯಾಕೇಜ್‌ಗಳು' : 'HOMESTAY PACKAGES'}
              </span>
              <span className="w-8 h-px bg-[#B8964A]" />
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl text-[#F3EDDD] font-normal tracking-tight mt-1">
              {isKn ? 'ನಮ್ಮ ವಿಶೇಷ ಪ್ಯಾಕೇಜ್‌ಗಳು' : 'Our Curated Packages'}
            </h2>
            <p className="text-base text-[#B9C4B8] font-light leading-[1.7] max-w-2xl mx-auto mt-3">
              {isKn
                ? 'ಬೆಳಗಿನ ಉಪಹಾರ, ಕ್ಯಾಂಪ್‌ಫೈರ್, ತೋಟದ ನಡಿಗೆ, ವೈ-ಫೈ ಮತ್ತು ಪಾರ್ಕಿಂಗ್ ಒಳಗೊಂಡಿರುವ ನಿಮ್ಮ ಇಷ್ಟದ ಪ್ಯಾಕೇಜ್ ಅನ್ನು ಆಯ್ಕೆಮಾಡಿ.'
                : 'Choose your curated homestay package with morning breakfast, campfire, estate walk, Wi-Fi and parking included.'}
            </p>
          </div>

          {/* Four Curated Packages Grid */}
          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 transition-all duration-500 ${
              packagesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {homePackages.map((pkg, idx) => {
              const rawSlug = pkg.slug || pkg.id || '';
              const slug = (rawSlug || pkg.title || '').toLowerCase();
              const explicitPrice = Number(pkg.price ?? pkg.offerPrice ?? 0);
              const adminInclusions = Array.isArray(pkg.inclusions) && pkg.inclusions.length > 0
                ? pkg.inclusions
                : (Array.isArray(pkg.features) && pkg.features.length > 0 ? pkg.features : []);

              let title = (isKn && pkg.titleKn) || pkg.title || pkg.name || 'Curated Package';
              let description = (isKn && pkg.descriptionKn) || pkg.description || '';
              let inclusions = (isKn && pkg.inclusionsKn) || adminInclusions;
              let amountText = '';
              let note = pkg.durationLabel || pkg.duration || (isKn ? 'ಪ್ರತಿ ರಾತ್ರಿಗೆ' : 'per night');
              let isContact = false;
              const discount = pkg.discount && typeof pkg.discount === 'string' && pkg.discount.trim() ? pkg.discount.trim() : null;

              let packageUrl = rawSlug ? `/booking?package=${encodeURIComponent(rawSlug)}` : '/booking';
              if (slug.includes('entire-homestay') || slug.includes('all-5-rooms') || slug.includes('all 5 rooms')) {
                packageUrl = `/booking?type=full_home&package=${encodeURIComponent(rawSlug || 'entire-homestay')}`;
              }

              // Localized fallbacks only in Kannada mode when no custom Kn fields exist
              if (isKn) {
                if (slug.includes('room-breakfast') && !slug.includes('dinner')) {
                  title = pkg.titleKn || 'ಕೊಠಡಿ + ಉಪಹಾರ';
                  description = pkg.descriptionKn || 'ಯಾವುದೇ ಕೊಠಡಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ. ಬೆಳಗಿನ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ.';
                  inclusions = pkg.inclusionsKn || [
                    'ಯಾವುದೇ ಕೊಠಡಿ (ಸ್ಟ್ಯಾಂಡರ್ಡ್, ಸೂಟ್ ಅಥವಾ ಸಿಂಗಲ್)',
                    'ರುಚಿಕರ ಬೆಳಗಿನ ಮನೆ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ',
                    'ವೈ-ಫೈ ಮತ್ತು ಪಾರ್ಕಿಂಗ್ ಸೌಲಭ್ಯ',
                    'ಕ್ಯಾಂಪ್‌ಫೈರ್ ಮತ್ತು ಕಾಫಿ ತೋಟದ ನಡಿಗೆ'
                  ];
                } else if (slug.includes('dinner')) {
                  title = pkg.titleKn || 'ಕೊಠಡಿ + ಉಪಹಾರ + ರಾತ್ರಿಯ ಊಟ';
                  description = pkg.descriptionKn || 'ರಾತ್ರಿಯ ಊಟದ ಆಯ್ಕೆ: ಮೆನುವಿನಿಂದ ಸಸ್ಯಾಹಾರಿ ಅಥವಾ ಮಾಂಸಾಹಾರಿ.';
                  inclusions = pkg.inclusionsKn || [
                    'ಯಾವುದೇ ಕೊಠಡಿ (ಸ್ಟ್ಯಾಂಡರ್ಡ್, ಸೂಟ್ ಅಥವಾ ಸಿಂಗಲ್)',
                    'ರುಚಿಕರ ಬೆಳಗಿನ ಮನೆ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ',
                    'ರಾತ್ರಿಯ ಊಟ: ಸಸ್ಯಾಹಾರಿ ಅಥವಾ ಮಾಂಸಾಹಾರಿ',
                    'ಕ್ಯಾಂಪ್‌ಫೈರ್ ಮತ್ತು ಕಾಫಿ ತೋಟದ ನಡಿಗೆ'
                  ];
                } else if (slug.includes('entire-homestay') || slug.includes('all-5-rooms') || slug.includes('all 5 rooms')) {
                  title = pkg.titleKn || 'ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ (ಎಲ್ಲಾ 5 ಕೊಠಡಿಗಳು)';
                  description = pkg.descriptionKn || 'ಎಲ್ಲಾ 5 ಕೊಠಡಿಗಳ ಸಂಪೂರ್ಣ ಕಾಯ್ದಿರಿಸುವಿಕೆ (2 ಸ್ಟ್ಯಾಂಡರ್ಡ್, 2 ಸೂಟ್, 1 ಸಿಂಗಲ್).';
                  inclusions = pkg.inclusionsKn || [
                    'ಎಲ್ಲಾ 5 ಕೊಠಡಿಗಳ ಸಂಪೂರ್ಣ ಕಾಯ್ದಿರಿಸುವಿಕೆ',
                    'ಗರಿಷ್ಠ 10 ವಯಸ್ಕರು + 6 ಮಕ್ಕಳು',
                    'ಎಲ್ಲಾ ಅತಿಥಿಗಳಿಗೂ ಬೆಳಗಿನ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ',
                    'ಕ್ಯಾಂಪ್‌ಫೈರ್ ಮತ್ತು ಕಾಫಿ ತೋಟದ ನಡಿಗೆ'
                  ];
                } else if (slug.includes('family-stay')) {
                  title = pkg.titleKn || 'ಫ್ಯಾಮಿಲಿ ವಾಸ್ತವ್ಯ';
                  description = pkg.descriptionKn || 'ಉಪಹಾರದೊಂದಿಗೆ 1 ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಅಥವಾ ಸೂಟ್ ಕೊಠಡಿ.';
                  inclusions = pkg.inclusionsKn || [
                    '1 ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಅಥವಾ ಸೂಟ್ ಕೊಠಡಿ',
                    'ರುಚಿಕರ ಬೆಳಗಿನ ಮನೆ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ',
                    'ವೈ-ಫೈ ಮತ್ತು ಪಾರ್ಕಿಂಗ್ ಸೌಲಭ್ಯ',
                    'ಕ್ಯಾಂಪ್‌ಫೈರ್ ಮತ್ತು ಕಾಫಿ ತೋಟದ ನಡಿಗೆ'
                  ];
                }
              }

              // Honor Admin explicit price first; fallback to dynamic / contact
              const priceMeta = getPackagePriceMeta(pkg, {
                lowestRoomPrice,
                standardRoomPrice,
                entireHomestayPrice,
                isKn
              });
              amountText = priceMeta.amountText;
              note = priceMeta.note;
              isContact = priceMeta.isContact;

              const mainImage = pkg.image || '/images/realimage/homeimage.jpeg';

              return (
                <div
                  key={pkg.id || pkg.slug || idx}
                  className="rounded-3xl overflow-hidden border border-[#B8964A]/25 bg-[#1B4332] hover:border-[#D9BC7A]/50 shadow-[0_12px_36px_rgba(0,0,0,0.45)] transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative h-52 sm:h-56 overflow-hidden bg-[#0A1A13]">
                      <img
                        src={mainImage}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-[0.14em] text-[#0F2A20] bg-[#D9BC7A] shadow-md">
                          {isKn ? 'ಪ್ಯಾಕೇಜ್' : 'Package'}
                        </span>
                      </div>

                      {discount && (
                        <div className="absolute top-4 right-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-emerald-600 shadow-md">
                            {discount}
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-3 left-4 right-4 text-xs font-serif text-[#D9BC7A] bg-[#0F2A20]/90 px-3 py-1 rounded-full border border-[#B8964A]/30 backdrop-blur-sm truncate">
                        {title}
                      </div>
                    </div>

                    <div className="p-6">
                      <span className="text-[10px] uppercase font-bold tracking-[0.18em] text-[#D9BC7A] block mb-1">
                        {note}
                      </span>
                      <h3 className="font-serif text-xl font-normal text-[#F3EDDD] mb-2 group-hover:text-[#D9BC7A] transition-colors leading-snug">
                        {title}
                      </h3>
                      <p className="text-xs text-[#B9C4B8] font-light leading-relaxed mb-4 min-h-[36px]">
                        {description}
                      </p>

                      <div className="space-y-1.5 mb-6">
                        {inclusions.slice(0, 4).map((inc, iIdx) => (
                          <div key={iIdx} className="flex items-start gap-2 text-xs text-[#F3EDDD]/90">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#B8964A] flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{inc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <div className="pt-4 border-t border-[#0F2A20] flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[10px] text-[#B9C4B8] block uppercase tracking-wider truncate">
                          {note}
                        </span>
                        <div className={`font-serif font-bold text-[#D9BC7A] truncate ${
                          isContact ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'
                        }`}>
                          {amountText}
                        </div>
                      </div>

                      <Link
                        to={packageUrl}
                        className="px-4 py-2.5 rounded-xl text-xs uppercase tracking-[0.14em] font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all shadow-md hover:-translate-y-0.5 whitespace-nowrap flex-shrink-0"
                      >
                        {isKn ? 'ಕಾಯ್ದಿರಿಸಿ →' : 'Book →'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 8.5 WHAT'S INCLUDED & NOT INCLUDED – Compact Variant     */}
      {/* ======================================================== */}
      <InclusionsSection variant="compact" bgColor={inclusionsBgColor} />

      {/* ======================================================== */}
      {/* 9. GUEST STORIES – Ivory (#FAF6EC)                       */}
      {/* ======================================================== */}
      <EditorialGuestStories />

      {/* ======================================================== */}
      {/* 10. FINAL CTA – Linen (#F1E9D8)                          */}
      {/* ======================================================== */}
      <section className="w-full bg-[#F1E9D8] text-[#1A2A21] py-16 sm:py-24 relative overflow-hidden border-t border-[#B8964A]/20 border-b border-[#B8964A]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl sm:rounded-[2.5rem] overflow-hidden border border-[#B8964A]/25 shadow-2xl py-16 sm:py-24 px-6 text-center bg-[#1B4332]">
            <div className="absolute inset-0">
              <img
                src="/images/realimage/homeimage.jpeg"
                alt="Marichin Homestay Evening"
                className="w-full h-full object-cover object-center brightness-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A13] via-[#0F2A20]/80 to-[#0A1A13]/60 pointer-events-none" />
            </div>

            <div className="relative max-w-4xl mx-auto px-4 text-center z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0F2A20]/90 border border-[#B8964A]/40 mb-4 backdrop-blur-md shadow-lg">
                <Compass className="w-3.5 h-3.5 text-[#D9BC7A]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D9BC7A]">
                  {isKn ? 'ವಿಶ್ರಾಂತಿ ಮತ್ತು ಪುನರುಜ್ಜೀವನ' : 'RELAX & RECONNECT'}
                </span>
              </div>

              <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#F3EDDD] font-normal mt-2 mb-4 leading-tight tracking-tight max-w-3xl mx-auto drop-shadow-[0_4px_18px_rgba(0,0,0,0.9)]">
                {isKn ? 'ಕಾಫಿ ಎಲೆಗಳ ಮರ್ಮರ ಮತ್ತು ತಂಪಾದ ಮುಂಜಾನೆಯ ಗಾಳಿಯೊಂದಿಗೆ ಎಚ್ಚರಗೊಳ್ಳಿ' : 'Awaken to the Whispers of Coffee Leaves and Fresh Morning Air'}
              </h2>

              <p className="text-base sm:text-lg text-[#F3EDDD]/90 max-w-2xl mx-auto mb-10 font-light leading-[1.7] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                {isKn
                  ? 'ನೇರ ಬುಕಿಂಗ್ ಮೂಲಕ ಅತ್ಯುತ್ತಮ ದರಗಳು, ಆರೋಗ್ಯಕರ ಬೆಳಗಿನ ಉಪಹಾರ ಮತ್ತು ಮಾರ್ಗದರ್ಶನದೊಂದಿಗೆ ತೋಟದ ನಡಿಗೆ ಲಭ್ಯ.'
                  : 'Direct reservations guarantee best rates, wholesome home-cooked breakfast, and guided estate walks.'}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 mb-8">
                <Link
                  to="/booking"
                  className="w-full sm:w-auto px-9 py-4 rounded-[12px] text-xs sm:text-sm uppercase tracking-[0.14em] font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all duration-300 shadow-[0_6px_25px_rgba(184,150,74,0.4)] hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isKn ? 'ಕೊಠಡಿ ಕಾಯ್ದಿರಿಸಿ →' : 'RESERVE A ROOM →'}
                </Link>
                {!isPlaceholderPhone(cleanWhatsapp) && (
                  <a
                    href={`https://wa.me/${cleanWhatsapp}?text=Hi%20Marichin%20Homestay,%20I%20would%20like%20to%20plan%20a%20stay.`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-8 py-4 rounded-[12px] text-xs sm:text-sm uppercase tracking-[0.14em] font-semibold text-[#D9BC7A] bg-[#0F2A20]/90 border-[1.5px] border-[#B8964A] hover:bg-[#B8964A] hover:text-[#0F2A20] transition-all duration-200 backdrop-blur-md flex items-center justify-center gap-2.5 shadow-md hover:-translate-y-0.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{isKn ? 'ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ವಿಚಾರಿಸಿ' : 'Enquire on WhatsApp'}</span>
                  </a>
                )}
              </div>

              {/* Trust Guarantees */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#B9C4B8]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#B8964A]" />
                  <span>{isKn ? 'ದೃಢೀಕೃತ ಕೊಠಡಿ ಕಾಯ್ದಿರಿಸುವಿಕೆ' : 'Direct Room Reservation'}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#B8964A]" />
                  <span>{isKn ? 'ಹೊಂದಿಕೊಳ್ಳುವ ಮುಂಗಡ (20% / 50% / 100%)' : 'Flexible Advance (20% / 50% / 100%)'}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Coffee className="w-4 h-4 text-[#B8964A]" />
                  <span>{isKn ? 'ತೋಟದ ನಡಿಗೆ ಮತ್ತು ಕ್ಯಾಂಪ್‌ಫೈರ್ ಒಳಗೊಂಡಿದೆ' : 'Estate Walk & Campfire Included'}</span>
                </span>
              </div>

            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
