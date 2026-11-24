import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { getPageBannerConfig, isPlaceholderPhone } from './pageBannerConfig';
import { cleanInternationalPhone } from '../../utils/whatsappMessages';
import {
  Home,
  ChevronRight,
  ChevronLeft,
  Trees,
  Coffee,
  Sparkles,
  ShieldCheck,
  BedDouble,
  Wifi,
  Car,
  CookingPot,
  UtensilsCrossed,
  Clock,
  Flame,
  Gamepad2,
  Compass,
  Users,
  Phone,
  MessageCircle,
  MapPin,
  Send,
  Camera,
  ArrowRight,
  CheckCircle2,
  Play
} from 'lucide-react';

// Icon Renderer helper
const renderIcon = (iconName, className = 'w-4 h-4') => {
  switch (iconName) {
    case 'Trees': return <Trees className={className} />;
    case 'Coffee': return <Coffee className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'ShieldCheck': return <ShieldCheck className={className} />;
    case 'BedDouble': return <BedDouble className={className} />;
    case 'Wifi': return <Wifi className={className} />;
    case 'Car': return <Car className={className} />;
    case 'CookingPot': return <CookingPot className={className} />;
    case 'UtensilsCrossed': return <UtensilsCrossed className={className} />;
    case 'Clock': return <Clock className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'Gamepad2': return <Gamepad2 className={className} />;
    case 'Compass': return <Compass className={className} />;
    case 'Users': return <Users className={className} />;
    case 'Phone': return <Phone className={className} />;
    case 'MessageCircle': return <MessageCircle className={className} />;
    case 'MapPin': return <MapPin className={className} />;
    case 'Send': return <Send className={className} />;
    case 'Camera': return <Camera className={className} />;
    case 'CheckCircle2': return <CheckCircle2 className={className} />;
    default: return <Sparkles className={className} />;
  }
};

// Subtle Decorative Botanical Coffee Branch Inline SVG
const CoffeeBranchAccent = () => (
  <svg
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute bottom-4 left-0 sm:left-2 w-36 h-36 sm:w-48 sm:h-48 z-10 pointer-events-none select-none opacity-25 sm:opacity-35"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#0F2A20" stopOpacity="0.9" />
      </linearGradient>
      <linearGradient id="goldStemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D9BC7A" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#8A6E32" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    {/* Main Curving Stem */}
    <path
      d="M10 190 Q 70 150 95 90 T 170 20"
      stroke="url(#goldStemGrad)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Leaf 1 (Left lower) */}
    <path
      d="M50 160 C 20 145 15 110 50 115 C 75 120 70 150 50 160 Z"
      fill="url(#leafGrad)"
      stroke="#B8964A"
      strokeWidth="1"
      strokeOpacity="0.5"
    />
    <path d="M50 160 Q 40 135 30 120" stroke="#B8964A" strokeWidth="0.75" strokeOpacity="0.4" />
    {/* Leaf 2 (Right lower) */}
    <path
      d="M75 135 C 105 130 125 105 100 85 C 80 75 60 115 75 135 Z"
      fill="url(#leafGrad)"
      stroke="#B8964A"
      strokeWidth="1"
      strokeOpacity="0.5"
    />
    <path d="M75 135 Q 92 105 100 85" stroke="#B8964A" strokeWidth="0.75" strokeOpacity="0.4" />
    {/* Leaf 3 (Left upper) */}
    <path
      d="M95 90 C 65 75 70 45 105 45 C 125 50 115 80 95 90 Z"
      fill="url(#leafGrad)"
      stroke="#B8964A"
      strokeWidth="1"
      strokeOpacity="0.5"
    />
    {/* Leaf 4 (Tip) */}
    <path
      d="M140 45 C 160 30 180 15 170 20 C 145 35 135 45 140 45 Z"
      fill="url(#leafGrad)"
      stroke="#B8964A"
      strokeWidth="0.8"
      strokeOpacity="0.5"
    />
    {/* Clustered Coffee Berries in Warm Gold */}
    <circle cx="70" cy="140" r="4.5" fill="#D9BC7A" stroke="#8A6E32" strokeWidth="1" />
    <circle cx="77" cy="144" r="4" fill="#B8964A" stroke="#0F2A20" strokeWidth="0.8" />
    <circle cx="92" cy="95" r="4.5" fill="#D9BC7A" stroke="#8A6E32" strokeWidth="1" />
    <circle cx="98" cy="99" r="3.8" fill="#B8964A" stroke="#0F2A20" strokeWidth="0.8" />
    <circle cx="88" cy="90" r="3.5" fill="#C8A55A" stroke="#0F2A20" strokeWidth="0.8" />
  </svg>
);

// Curved Bottom Wave Divider with Horizontal Drift
const BottomWaveDivider = ({ nextBgColor = '#FAF6EC' }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-20 pointer-events-none select-none">
      <div className="banner-wave-track w-[110%] -ml-[5%]">
        <svg
          viewBox="0 0 1440 90"
          preserveAspectRatio="none"
          className="w-full h-10 sm:h-14 lg:h-16 block"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="waveGoldGreen" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#B8964A" stopOpacity="0.75" />
              <stop offset="40%" stopColor="#2D6A4F" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#D9BC7A" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#B8964A" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* Layer 1: Ambient soft dark green shadow wave */}
          <path
            d="M0,45 C280,75 520,20 800,50 C1080,80 1280,30 1440,48 L1440,90 L0,90 Z"
            fill="#1B4332"
            fillOpacity="0.45"
          />

          {/* Layer 2: Main Bottom Wave seamlessly filled with the next section's exact background color */}
          <path
            d="M0,52 C320,82 560,32 840,62 C1120,90 1320,40 1440,55 L1440,90 L0,90 Z"
            fill={nextBgColor}
          />

          {/* Layer 3: Polished Gold-Green Accent Stroke along the curved ridge */}
          <path
            d="M0,52 C320,82 560,32 840,62 C1120,90 1320,40 1440,55"
            fill="none"
            stroke="url(#waveGoldGreen)"
            strokeWidth="1.75"
          />
        </svg>
      </div>
    </div>
  );
};

export const PageBanner = ({
  pageKey,
  onFilterSelect,
  activeFilter = 'All',
  className = ''
}) => {
  const { t, language } = useLanguage();
  const { siteSettings, diningContent } = useAdmin();
  const isKn = language === 'kn';

  // Resolve config for this page
  const config = useMemo(() => {
    return getPageBannerConfig(pageKey, {
      t,
      isKn,
      siteSettings,
      diningContent,
      onFilterSelect
    });
  }, [pageKey, t, isKn, siteSettings, diningContent, onFilterSelect]);

  // Motion & Animation state
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Carousel state for Rooms (or multi-slide banners)
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const touchStartXRef = useRef(null);

  // Check prefers-reduced-motion & tab visibility
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMediaChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMediaChange);

    const handleVisibilityChange = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleScroll = () => {
      if (window.scrollY < 800) {
        setScrollY(window.scrollY);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Auto-advance Carousel every 5s (5000ms) with pause on hover
  const slides = config.carouselSlides || [];
  useEffect(() => {
    if (slides.length <= 1) return;
    if (isCarouselHovered || tabHidden || prefersReducedMotion) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length, isCarouselHovered, tabHidden, prefersReducedMotion]);

  const handlePrevSlide = (e) => {
    if (e) e.stopPropagation();
    if (slides.length <= 1) return;
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNextSlide = (e) => {
    if (e) e.stopPropagation();
    if (slides.length <= 1) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (diff > 40) {
      handleNextSlide();
    } else if (diff < -40) {
      handlePrevSlide();
    }
    touchStartXRef.current = null;
  };

  // Parallax transforms (capped to prevent overlapping fixed header)
  const bgParallax = prefersReducedMotion ? 0 : Math.min(scrollY * 0.15, 40);
  const cardParallax = prefersReducedMotion ? 0 : Math.min(scrollY * -0.12, 25);

  // Smooth scroll helper for anchors
  const handleScrollToAnchor = (e, anchorId) => {
    e.preventDefault();
    const id = anchorId.replace('#', '');
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Helper for Gallery chips: select filter and scroll to filter section
  const handleFilterChipClick = (filterKey) => {
    if (typeof onFilterSelect === 'function') {
      onFilterSelect(filterKey);
    }
    const filterSection = document.getElementById('gallery-filters');
    if (filterSection) {
      filterSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Scoped CSS Keyframes for Hero Motion */}
      <style>{`
        @keyframes kenBurnsSlow {
          0% {
            transform: scale(1.06) translateY(0);
          }
          100% {
            transform: scale(1.0) translateY(0);
          }
        }

        @keyframes bannerWaveLoop {
          0% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-3.5%);
          }
          100% {
            transform: translateX(0);
          }
        }

        @keyframes bannerFloat1 {
          0%, 100% {
            transform: translateY(0px) rotate(-3deg);
          }
          50% {
            transform: translateY(-4px) rotate(-3deg);
          }
        }

        @keyframes bannerFloat2 {
          0%, 100% {
            transform: translateY(0px) rotate(3deg);
          }
          50% {
            transform: translateY(-3.5px) rotate(3deg);
          }
        }

        @keyframes bannerFloat3 {
          0%, 100% {
            transform: translateY(0px) rotate(-2deg);
          }
          50% {
            transform: translateY(-4px) rotate(-2deg);
          }
        }

        @keyframes bannerFloat4 {
          0%, 100% {
            transform: translateY(0px) rotate(2deg);
          }
          50% {
            transform: translateY(-3px) rotate(2deg);
          }
        }

        @keyframes bannerFadeUp {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cardSlideInRight {
          0% {
            opacity: 0;
            transform: translateX(36px) rotate(0deg);
          }
          100% {
            opacity: 1;
            transform: translateX(0) rotate(var(--target-rot, 0deg));
          }
        }

        .animate-ken-burns {
          animation: kenBurnsSlow 8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: transform;
        }

        .banner-wave-track {
          animation: bannerWaveLoop 20s ease-in-out infinite;
        }

        .float-card-1 {
          animation: bannerFloat1 4.8s ease-in-out infinite;
        }
        .float-card-2 {
          animation: bannerFloat2 5.6s ease-in-out infinite;
        }
        .float-card-3 {
          animation: bannerFloat3 6.2s ease-in-out infinite;
        }
        .float-card-4 {
          animation: bannerFloat4 5.2s ease-in-out infinite;
        }

        .fade-stagger-1 {
          animation: bannerFadeUp 500ms cubic-bezier(0.16, 1, 0.3, 1) 0ms both;
        }
        .fade-stagger-2 {
          animation: bannerFadeUp 500ms cubic-bezier(0.16, 1, 0.3, 1) 80ms both;
        }
        .fade-stagger-3 {
          animation: bannerFadeUp 500ms cubic-bezier(0.16, 1, 0.3, 1) 160ms both;
        }
        .fade-stagger-4 {
          animation: bannerFadeUp 500ms cubic-bezier(0.16, 1, 0.3, 1) 240ms both;
        }
        .fade-stagger-5 {
          animation: bannerFadeUp 500ms cubic-bezier(0.16, 1, 0.3, 1) 320ms both;
        }
        .fade-stagger-6 {
          animation: bannerFadeUp 500ms cubic-bezier(0.16, 1, 0.3, 1) 400ms both;
        }

        .card-enter-slide {
          animation: cardSlideInRight 650ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* Gold Button Shimmer Sweep */
        .banner-gold-btn {
          position: relative;
          overflow: hidden;
        }
        .banner-gold-btn::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -80%;
          width: 50%;
          height: 200%;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.28) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: rotate(25deg);
          transition: all 0.75s ease;
          pointer-events: none;
        }
        .banner-gold-btn:hover::after {
          left: 140%;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-ken-burns,
          .banner-wave-track,
          .float-card-1,
          .float-card-2,
          .float-card-3,
          .float-card-4,
          .card-enter-slide {
            animation: none !important;
            transform: none !important;
          }
          .fade-stagger-1,
          .fade-stagger-2,
          .fade-stagger-3,
          .fade-stagger-4,
          .fade-stagger-5,
          .fade-stagger-6 {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Hero Banner Section Container */}
      <section
        className={`relative w-full min-h-[520px] lg:min-h-[560px] bg-[#0F2A20] text-[#F3EDDD] overflow-hidden pt-28 sm:pt-32 lg:pt-36 pb-20 sm:pb-24 lg:pb-28 ${className}`}
        style={{ willChange: 'transform' }}
      >
        {/* Background Real Photo with Parallax & Slow Ken Burns */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <img
            src={config.bgImage}
            alt={config.bgAlt || 'Marichin Homestay background'}
            className={`w-full h-full object-cover ${prefersReducedMotion ? '' : 'animate-ken-burns'}`}
            style={{
              objectPosition: config.bgPosition || 'center 45%',
              transform: prefersReducedMotion ? 'none' : `translateY(${bgParallax}px)`
            }}
            loading="eager"
          />

          {/* Dark Forest-Green Gradient Overlays (Stronger on left so text is crystal clear) */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#071710]/95 via-[#0F2A20]/88 to-[#0F2A20]/55" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F2A20]/80 via-transparent to-[#0F2A20]/90" />

          {/* Subtle Vignette */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 60% 50%, transparent 25%, rgba(6, 18, 13, 0.7) 100%)'
            }}
          />
        </div>

        {/* Decorative Inline SVG Coffee Branch at Left-Bottom */}
        <CoffeeBranchAccent />

        {/* Banner Content Container */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center">

            {/* Left Column: Breadcrumb, Title, Description, Chips, CTAs (lg: 7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-center">

              {/* Breadcrumb Pill: House icon > Home > chevron > current page in glass gold pill */}
              <div className="fade-stagger-1 mb-4">
                <nav
                  aria-label="Breadcrumb"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1B4332]/65 backdrop-blur-md border border-[#B8964A]/35 text-xs text-[#F3EDDD] shadow-sm hover:border-[#D9BC7A] transition-colors"
                >
                  <Home className="w-3.5 h-3.5 text-[#D9BC7A] flex-shrink-0" />
                  <Link
                    to="/"
                    className="text-[#D9BC7A] hover:text-[#F3EDDD] transition-colors font-medium"
                  >
                    {t('pageBanner.home') || 'Home'}
                  </Link>
                  <ChevronRight className="w-3 h-3 text-[#B8964A]/80 flex-shrink-0" />
                  <span className="text-[#F3EDDD] font-medium truncate max-w-[180px] sm:max-w-none">
                    {config.breadcrumb?.label}
                  </span>
                </nav>
              </div>

              {/* Title in Serif Font (approx 56px desktop, Cream #F3EDDD) */}
              <h1 className="fade-stagger-2 font-serif text-3xl sm:text-5xl lg:text-[52px] xl:text-[56px] text-[#F3EDDD] font-normal leading-[1.12] tracking-tight mb-3">
                {config.title}
              </h1>

              {/* Short Gold Underline Divider */}
              <div className="fade-stagger-3 w-16 sm:w-20 h-0.5 bg-gradient-to-r from-[#B8964A] via-[#D9BC7A] to-transparent mb-4 sm:mb-5" />

              {/* Short Description in Cream (18px, max 520px) */}
              <p className="fade-stagger-4 text-base sm:text-lg text-[#F3EDDD]/85 font-light leading-relaxed max-w-[520px] mb-6">
                {config.description}
              </p>

              {/* Icon Chips Row: Glass-style rounded tiles with thin gold border (2-col grid at 375px) */}
              {config.chips && config.chips.length > 0 && (
                <div className="fade-stagger-5 mb-7">
                  <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-3">
                    {config.chips.map((chip, idx) => {
                      const isClickable = chip.isFilter || Boolean(chip.onClick);
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (chip.isFilter) {
                              handleFilterChipClick(chip.filterKey);
                            } else if (chip.onClick) {
                              chip.onClick();
                            }
                          }}
                          className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#1B4332]/55 hover:bg-[#1B4332]/85 backdrop-blur-md border border-[#B8964A]/30 hover:border-[#D9BC7A] text-xs text-[#F3EDDD] shadow-sm transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_4px_16px_rgba(184,150,74,0.22)] select-none ${
                            isClickable ? 'cursor-pointer active:scale-95' : 'cursor-default'
                          }`}
                        >
                          <span className="text-[#B8964A] group-hover:text-[#F3EDDD] transition-colors flex-shrink-0">
                            {renderIcon(chip.icon, 'w-4 h-4')}
                          </span>
                          <span className="font-medium tracking-wide truncate">
                            {chip.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contact Page Action Tiles (4 glass tiles, hiding placeholder numbers) */}
              {config.pageKey === 'contact' && config.contactActions && (
                <div className="fade-stagger-5 mb-6">
                  {(() => {
                    const { phone, whatsapp, address, googleMapsUrl, enquiryAnchor } = config.contactActions;
                    const showPhone = !isPlaceholderPhone(phone);
                    const showWhatsapp = !isPlaceholderPhone(whatsapp);
                    const cleanPhone = `+${cleanInternationalPhone(phone)}`;
                    const cleanWa = cleanInternationalPhone(whatsapp);
                    const mapsUrl = googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=12.425583,75.911889`;

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {/* 1. Call Us */}
                        {showPhone && (
                          <a
                            href={`tel:${cleanPhone}`}
                            className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-[#1B4332]/60 hover:bg-[#1B4332] border border-[#B8964A]/35 hover:border-[#D9BC7A] text-center backdrop-blur-md transition-all duration-300 hover:-translate-y-1 shadow-sm"
                          >
                            <Phone className="w-4 h-4 text-[#B8964A] group-hover:text-[#D9BC7A] mb-1.5 transition-colors" />
                            <span className="text-xs font-semibold text-[#F3EDDD]">
                              {t('pageBanner.callUs') || 'Call Us'}
                            </span>
                          </a>
                        )}

                        {/* 2. WhatsApp */}
                        {showWhatsapp && (
                          <a
                            href={`https://wa.me/${cleanWa}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-[#1B4332]/60 hover:bg-[#1B4332] border border-[#B8964A]/35 hover:border-[#D9BC7A] text-center backdrop-blur-md transition-all duration-300 hover:-translate-y-1 shadow-sm"
                          >
                            <MessageCircle className="w-4 h-4 text-[#B8964A] group-hover:text-[#D9BC7A] mb-1.5 transition-colors" />
                            <span className="text-xs font-semibold text-[#F3EDDD]">
                              {t('pageBanner.whatsapp') || 'WhatsApp'}
                            </span>
                          </a>
                        )}

                        {/* 3. Get Directions */}
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-[#1B4332]/60 hover:bg-[#1B4332] border border-[#B8964A]/35 hover:border-[#D9BC7A] text-center backdrop-blur-md transition-all duration-300 hover:-translate-y-1 shadow-sm"
                        >
                          <MapPin className="w-4 h-4 text-[#B8964A] group-hover:text-[#D9BC7A] mb-1.5 transition-colors" />
                          <span className="text-xs font-semibold text-[#F3EDDD]">
                            {t('pageBanner.getDirections') || 'Get Directions'}
                          </span>
                        </a>

                        {/* 4. Send Enquiry (smoothly scrolls to form) */}
                        <a
                          href={enquiryAnchor || '#enquiry-form'}
                          onClick={(e) => handleScrollToAnchor(e, enquiryAnchor || '#enquiry-form')}
                          className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-[#1B4332]/60 hover:bg-[#1B4332] border border-[#B8964A]/35 hover:border-[#D9BC7A] text-center backdrop-blur-md transition-all duration-300 hover:-translate-y-1 shadow-sm cursor-pointer"
                        >
                          <Send className="w-4 h-4 text-[#B8964A] group-hover:text-[#D9BC7A] mb-1.5 transition-colors" />
                          <span className="text-xs font-semibold text-[#F3EDDD]">
                            {t('pageBanner.sendEnquiry') || 'Send Enquiry'}
                          </span>
                        </a>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* CTA Buttons Row: Clear Gold Book Now / Watch Story button */}
              <div className="fade-stagger-6 flex flex-wrap items-center gap-4">
                {config.showBookingBtn && (
                  <Link
                    to="/booking"
                    className="banner-gold-btn px-6 sm:px-7 py-3 rounded-xl text-xs uppercase tracking-[0.14em] font-bold text-[#0F2A20] bg-gradient-to-r from-[#D9BC7A] via-[#C8A55A] to-[#B8964A] hover:from-[#E5C989] hover:to-[#D9BC7A] transition-all duration-300 shadow-[0_6px_22px_rgba(184,150,74,0.35)] hover:-translate-y-0.5 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>{config.bookingBtnText || t('pageBanner.bookNow') || 'Book Now'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}

                {/* About Page: Watch Our Story Button only if story video is configured */}
                {config.pageKey === 'about' && config.storyVideoUrl && config.storyVideoUrl.trim() && (
                  <a
                    href={config.storyVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 rounded-xl text-xs uppercase tracking-[0.14em] font-medium text-[#D9BC7A] bg-[#1B4332]/60 hover:bg-[#1B4332] border border-[#B8964A]/40 transition-all duration-300 shadow-sm inline-flex items-center gap-2 hover:-translate-y-0.5"
                  >
                    <Play className="w-3.5 h-3.5 text-[#D9BC7A]" />
                    <span>{config.storyBtnText || t('pageBanner.watchStory') || 'Watch Our Story'}</span>
                  </a>
                )}
              </div>

              {/* Carousel Dots on Rooms & About bottom-left if there is more than 1 slide */}
              {config.showCarouselDots && slides.length > 1 && (
                <div className="flex items-center gap-2.5 mt-6 sm:mt-8">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        currentSlide === i
                          ? 'w-7 bg-[#D9BC7A] shadow-[0_0_8px_rgba(217,188,122,0.6)]'
                          : 'w-2 bg-[#F3EDDD]/35 hover:bg-[#F3EDDD]/70'
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}

            </div>

            {/* Right Column: Floating Photo Cards / Rounded Photo Carousel / Stay Plan Cards / Stacked Collage (lg: 5 cols) */}
            <div
              className="lg:col-span-5 relative mt-4 lg:mt-0"
              style={{
                transform: prefersReducedMotion ? 'none' : `translateY(${cardParallax}px)`
              }}
            >

              {/* CASE 1: ROOMS PHOTO CAROUSEL */}
              {config.rightSideType === 'carousel' && slides.length > 0 && (
                <div
                  className="relative w-full max-w-md sm:max-w-lg mx-auto lg:max-w-none group"
                  onMouseEnter={() => setIsCarouselHovered(true)}
                  onMouseLeave={() => setIsCarouselHovered(false)}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Rounded Photo Carousel Card */}
                  <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-[#B8964A]/40 bg-[#1B4332] shadow-[0_16px_45px_rgba(0,0,0,0.55)]">
                    {slides.map((slide, sIdx) => {
                      const isActive = sIdx === currentSlide;
                      return (
                        <div
                          key={slide.id || sIdx}
                          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                            isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                          }`}
                        >
                          <img
                            src={slide.image}
                            alt={slide.alt || 'Marichin Homestay bedroom'}
                            className="w-full h-full object-cover"
                            style={{ objectPosition: slide.objectPosition || 'center 45%' }}
                            loading={sIdx === 0 ? 'eager' : 'lazy'}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />

                          {/* Room Name Badge */}
                          <div className="absolute top-4 left-4 z-20">
                            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider text-[#0F2A20] bg-gradient-to-r from-[#D9BC7A] to-[#B8964A] shadow-md flex items-center gap-1.5 border border-[#0F2A20]/20">
                              <Sparkles className="w-3 h-3 text-[#0F2A20]" />
                              <span>{slide.badge}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Navigation Arrows (Pause on hover) */}
                    <button
                      onClick={handlePrevSlide}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-[#0F2A20]/75 hover:bg-[#B8964A] text-[#F3EDDD] hover:text-[#0F2A20] border border-[#B8964A]/30 flex items-center justify-center backdrop-blur-md transition-all shadow-md cursor-pointer opacity-80 hover:opacity-100"
                      aria-label="Previous slide"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextSlide}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-[#0F2A20]/75 hover:bg-[#B8964A] text-[#F3EDDD] hover:text-[#0F2A20] border border-[#B8964A]/30 flex items-center justify-center backdrop-blur-md transition-all shadow-md cursor-pointer opacity-80 hover:opacity-100"
                      aria-label="Next slide"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Inside-Card Dots Indicator */}
                    <div className="absolute bottom-3.5 left-0 right-0 z-20 flex justify-center items-center gap-2">
                      {slides.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentSlide(i)}
                          className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                            currentSlide === i
                              ? 'w-6 bg-[#D9BC7A]'
                              : 'w-2 bg-white/40 hover:bg-white/75'
                          }`}
                          aria-label={`Slide ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CASE 3: GALLERY STACKED COLLAGE OF REAL PHOTOS WITH CAMERA BADGES */}
              {config.rightSideType === 'stackedCollage' && config.collagePhotos && (
                <div className="relative h-72 sm:h-84 lg:h-96 w-full max-w-sm sm:max-w-md mx-auto">
                  {config.collagePhotos.map((photo, pIdx) => {
                    const rotations = [-4, 3, -1, 2];
                    const rot = photo.rot !== undefined ? photo.rot : rotations[pIdx % 4];
                    const offsets = [
                      'top-2 left-2 sm:left-4 z-10 w-44 sm:w-52 h-44 sm:h-52',
                      'top-8 right-2 sm:right-4 z-20 w-44 sm:w-52 h-44 sm:h-52',
                      'bottom-4 left-6 sm:left-12 z-30 w-48 sm:w-56 h-44 sm:h-52',
                      'bottom-2 right-4 sm:right-8 z-40 w-46 sm:w-54 h-44 sm:h-52'
                    ];
                    const floatClasses = ['float-card-1', 'float-card-2', 'float-card-3', 'float-card-4'];

                    return (
                      <div
                        key={photo.id || pIdx}
                        className={`absolute ${offsets[pIdx]} ${
                          pIdx > 1 ? 'hidden sm:block' : ''
                        } rounded-2xl overflow-hidden border border-[#B8964A]/45 shadow-[0_12px_36px_rgba(0,0,0,0.55)] group bg-[#1B4332] transition-transform duration-300 hover:rotate-0 hover:scale-105 hover:z-50 cursor-pointer ${
                          prefersReducedMotion ? '' : floatClasses[pIdx % 4]
                        }`}
                        style={{ '--target-rot': `${rot}deg` }}
                      >
                        <img
                          src={photo.image}
                          alt={photo.alt || 'Marichin Homestay real photo'}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          style={{ objectPosition: photo.objectPosition || 'center 45%' }}
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                        {/* Camera Icon Badge */}
                        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0F2A20]/85 backdrop-blur-md text-[10px] font-medium text-[#D9BC7A] border border-[#B8964A]/30 shadow-sm">
                          <Camera className="w-3 h-3 text-[#B8964A]" />
                          <span>{photo.badge}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* CASE 4: FLOATING OVERLAPPING PHOTO CARDS (About, Dining, Experiences, Packages, Contact) */}
              {(config.rightSideType === 'floatingCards' || config.rightSideType === 'contactCards') &&
                config.floatingCards && (
                  <div className="relative h-72 sm:h-84 lg:h-96 w-full max-w-sm sm:max-w-md mx-auto">
                    {config.floatingCards.map((card, cIdx) => {
                      const totalCards = config.floatingCards.length;
                      const rot = card.rot || (cIdx === 0 ? -3 : cIdx === 1 ? 3 : -1);

                      // Responsive positions tailored for 1, 2 or 3 overlapping cards
                      let posClass = '';
                      if (totalCards === 1) {
                        posClass = 'top-4 left-1/2 -translate-x-1/2 z-10 w-60 sm:w-72 h-56 sm:h-64';
                      } else if (totalCards === 2) {
                        posClass = cIdx === 0
                          ? 'top-4 left-2 sm:left-4 z-10 w-52 sm:w-64 h-52 sm:h-64'
                          : 'bottom-4 right-2 sm:right-4 z-20 w-52 sm:w-64 h-52 sm:h-64';
                      } else {
                        // 3 cards (hide 3rd card on smallest 375px screens to ensure no horizontal overflow)
                        posClass = cIdx === 0
                          ? 'top-2 left-2 sm:left-4 z-10 w-48 sm:w-56 h-48 sm:h-56'
                          : cIdx === 1
                          ? 'bottom-2 right-2 sm:right-4 z-20 w-48 sm:w-56 h-48 sm:h-56'
                          : 'top-16 right-8 sm:right-16 z-30 w-44 sm:w-52 h-44 sm:h-52 hidden sm:block';
                      }

                      const floatClasses = ['float-card-1', 'float-card-2', 'float-card-3'];

                      return (
                        <div
                          key={card.id || cIdx}
                          className={`absolute ${posClass} rounded-2xl overflow-hidden border border-[#B8964A]/40 bg-[#1B4332] shadow-[0_14px_40px_rgba(0,0,0,0.55)] group transition-all duration-300 hover:rotate-0 hover:scale-105 hover:z-50 cursor-pointer ${
                            prefersReducedMotion ? '' : floatClasses[cIdx % 3]
                          }`}
                          style={{
                            '--target-rot': `${rot}deg`,
                            animationDelay: `${cIdx * 150}ms`
                          }}
                        >
                          <img
                            src={card.image}
                            alt={card.alt || 'Marichin Homestay authentic photography'}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            style={{ objectPosition: card.objectPosition || 'center 45%' }}
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10 opacity-75 group-hover:opacity-40 transition-opacity" />

                          {/* Subtle Badge */}
                          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0F2A20]/85 backdrop-blur-md text-[10px] font-medium text-[#D9BC7A] border border-[#B8964A]/30 shadow-sm">
                            <Camera className="w-3 h-3 text-[#B8964A]" />
                            <span className="truncate max-w-[120px]">{card.badge}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

            </div>

          </div>
        </div>

        {/* Bottom Wave Divider Seamlessly Matching the Next Section's Background Color */}
        <BottomWaveDivider nextBgColor={config.nextBgColor || '#FAF6EC'} />
      </section>
    </>
  );
};

export default PageBanner;

