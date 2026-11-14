import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { Globe } from 'lucide-react';

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();
  const { siteSettings } = useAdmin();
  const location = useLocation();

  const menuRef = useRef(null);
  const headerRef = useRef(null);

  const propertyName = siteSettings?.propertyName || siteSettings?.name || 'Marichin Homestay';
  const logoUrl = siteSettings?.logoUrl || '/images/logo.jpeg';

  // Format brand wordmark dynamically: first word semi-bold, remaining words lighter italic
  const nameParts = (propertyName || 'Marichin Homestay').trim().split(/\s+/);
  const brandFirst = nameParts[0] || 'Marichin';
  const brandRest = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Homestay';

  // Track scroll position to trigger smooth compact state (> 40px)
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile dropdown on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        headerRef.current &&
        !headerRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [menuOpen]);

  // Strict 8 navigation items in exact required order
  const navItems = [
    { key: 'home', to: '/' },
    { key: 'about', to: '/about' },
    { key: 'rooms', to: '/rooms' },
    { key: 'dining', to: '/dining' },
    { key: 'experiences', to: '/experiences' },
    { key: 'packages', to: '/packages' },
    { key: 'gallery', to: '/gallery' },
    { key: 'contact', to: '/contact' },
  ];

  return (
    <>
      {/* Scoped CSS Styles for Navbar, Animations, Shimmer & Anchor Offsets */}
      <style>{`
        html {
          scroll-padding-top: 104px !important;
          overflow-x: clip !important;
        }
        body {
          overflow-x: clip !important;
        }
        :target {
          scroll-margin-top: 104px !important;
        }

        @keyframes headerSlideDown {
          0% {
            opacity: 0;
            transform: translateY(-16px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes navItemStaggerIn {
          0% {
            opacity: 0;
            transform: translateY(-6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes mobileDropdownIn {
          0% {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes mobileItemFadeIn {
          0% {
            opacity: 0;
            transform: translateX(-6px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-header-enter {
          animation: headerSlideDown 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .nav-stagger-item {
          animation: navItemStaggerIn 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .animate-dropdown-enter {
          animation: mobileDropdownIn 260ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .mobile-item-fade {
          animation: mobileItemFadeIn 280ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* Shimmer sweep on Book Now button */
        .book-now-shimmer {
          position: relative;
          overflow: hidden;
        }
        .book-now-shimmer::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -80%;
          width: 50%;
          height: 200%;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.45) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: rotate(25deg);
          pointer-events: none;
          transition: none;
        }
        .book-now-shimmer:hover::after {
          left: 150%;
          transition: left 0.75s ease-in-out;
        }

        /* Respect prefers-reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          .animate-header-enter,
          .nav-stagger-item,
          .animate-dropdown-enter,
          .mobile-item-fade,
          .book-now-shimmer::after {
            animation: none !important;
            transition: color 150ms ease, background-color 150ms ease !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* 
        In-Flow Spacer:
        Guarantees that page content, heroes, and headings start below the floating header
        with clean breathing room and zero layout jump.
      */}
      <div
        className="w-full pointer-events-none h-[88px] sm:h-[96px] print:hidden"
        aria-hidden="true"
      />

      {/* 
        Fixed Floating Island Header:
        Positioned 12px below top with generous side margins, centered with max-width 1380px,
        z-50 high stack, fully opaque ivory #FAF6EC, soft gold border and 0 10px 30px shadow.
      */}
      <div className="fixed top-0 left-0 right-0 z-50 w-full pointer-events-none pt-[12px] px-3 sm:px-6 animate-header-enter print:hidden">
        <header
          ref={headerRef}
          className={`pointer-events-auto w-full max-w-[1380px] mx-auto rounded-[20px] bg-[#FAF6EC] border border-[#B8964A]/30 transition-all duration-300 ease-out ${
            scrolled
              ? 'py-[6px] px-3 sm:px-5 xl:px-6 shadow-[0_12px_36px_rgba(15,42,32,0.14)]'
              : 'py-[10px] px-3 sm:px-5 xl:px-6 shadow-[0_10px_30px_rgba(15,42,32,0.10)]'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            
            {/* BRAND LOGO & TWO-LINE WORDMARK (Left, flex-shrink-0, dedicated right margin) */}
            <Link
              to="/"
              className="flex items-center gap-2 sm:gap-3 group flex-shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8964A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF6EC] rounded-xl mr-2 sm:mr-4 xl:mr-6"
              onClick={() => setMenuOpen(false)}
            >
              {/* Round Logo (prominent 52px-58px default, shrinks smoothly on scroll, 2px gold ring) */}
              <div className="relative flex-shrink-0">
                <img
                  src={logoUrl}
                  alt={`${propertyName}, Coorg logo`}
                  className={`rounded-full object-cover ring-2 ring-[#B8964A]/50 group-hover:ring-[#D9BC7A] transition-all duration-300 shadow-sm ${
                    scrolled ? 'w-[42px] h-[42px] sm:w-[46px] sm:h-[46px]' : 'w-[50px] h-[50px] sm:w-[56px] sm:h-[56px]'
                  }`}
                  style={{ borderRadius: '50%' }}
                />
              </div>

              {/* Two-Line Wordmark */}
              <div className="flex flex-col justify-center whitespace-nowrap transition-transform duration-200 group-hover:-translate-y-[1px]">
                <div className="font-serif text-[17px] sm:text-[19px] lg:text-[21px] font-semibold text-[#0F2A20] tracking-[0.3px] leading-tight">
                  <span>{brandFirst}</span>
                  <span className="font-serif font-normal italic text-[#A8654A] ml-1 text-[16px] sm:text-[18px] lg:text-[20px]">
                    {brandRest}
                  </span>
                </div>
                <span className="hidden sm:block text-[8.5px] lg:text-[9.5px] uppercase font-sans font-medium tracking-[0.22em] text-[#B8964A] leading-tight mt-0.5">
                  KUSHALNAGAR · COORG
                </span>
              </div>
            </Link>

            {/* DESKTOP NAVIGATION (Center flex-1 min-w-0, never wraps, never overlaps siblings, clear gaps) */}
            <nav className="hidden min-[1180px]:flex items-center justify-center flex-1 min-w-0 px-2">
              <div className="flex items-center justify-center gap-1 xl:gap-2 2xl:gap-3 flex-nowrap">
                {navItems.map((item, idx) => (
                  <NavLink
                    key={item.key}
                    to={item.to}
                    style={{ animationDelay: `${idx * 40}ms` }}
                    className={({ isActive }) =>
                      `nav-stagger-item group relative px-2 xl:px-2.5 2xl:px-3 py-1.5 rounded-[10px] text-[11px] xl:text-[11.5px] 2xl:text-[12.5px] uppercase tracking-[0.05em] xl:tracking-[0.07em] font-medium transition-all duration-200 ease-in-out whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8964A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF6EC] ${
                        isActive
                          ? 'text-[#B8964A] bg-[#B8964A]/10 font-semibold'
                          : 'text-[#0F2A20] hover:text-[#A8654A] hover:bg-[#F1E9D8]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span>{t(`nav.${item.key}`)}</span>
                        {/* 2px gold underline growing from center outward on hover, permanent on active */}
                        <span
                          className={`absolute bottom-[2px] left-2 right-2 h-[2px] bg-[#B8964A] rounded-full transition-transform duration-200 ease-out origin-center ${
                            isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                          }`}
                        />
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </nav>

            {/* RIGHT CONTROLS: Divider + Language Toggle + Book Now + Hamburger (flex-shrink-0 guarantees buttons stay inside & clickable) */}
            <div className="flex items-center gap-2 sm:gap-2.5 xl:gap-3.5 flex-shrink-0 ml-auto z-20 relative">
              
              {/* Thin Vertical Divider (Desktop Only) */}
              <div className="h-5 w-px bg-[#B8964A]/30 mx-0.5 xl:mx-1 hidden min-[1180px]:block flex-shrink-0" />

              {/* Language Toggle Pill: Fully Clickable & Isolated */}
              <button
                onClick={toggleLanguage}
                type="button"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 xl:px-3.5 xl:py-2 rounded-full text-[11px] xl:text-xs font-semibold border border-[#B8964A]/35 bg-[#FAF6EC] text-[#0F2A20] hover:bg-[#F1E9D8] hover:border-[#B8964A]/70 hover:text-[#A8654A] transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0 relative z-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8964A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF6EC]"
                title="Switch language between English and Kannada"
                aria-label="Toggle language"
              >
                <Globe className="w-3.5 h-3.5 text-[#B8964A] flex-shrink-0" />
                <span className="tracking-wide font-medium">{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
              </button>

              {/* Book Now Button: Gold Gradient, 12px Radius, Hover Lift, Shimmer Sweep */}
              <Link
                to="/booking"
                className="book-now-shimmer hidden sm:inline-flex px-4 sm:px-4.5 xl:px-5 py-2 xl:py-2.5 rounded-[12px] text-[11px] xl:text-xs uppercase tracking-[0.08em] font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] shadow-sm hover:shadow-[0_8px_20px_rgba(184,150,74,0.35)] hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-300 whitespace-nowrap flex-shrink-0 relative z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8964A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF6EC]"
              >
                {t('nav.bookNow')}
              </Link>

              {/* Responsive Hamburger Button (Active < 1180px) */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="min-[1180px]:hidden w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-1.5 text-[#0F2A20] hover:text-[#B8964A] hover:bg-[#F1E9D8] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8964A] cursor-pointer"
                aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={menuOpen}
              >
                <span
                  className={`block h-[2px] w-5 bg-current rounded-full transition-transform duration-300 origin-center ${
                    menuOpen ? 'translate-y-[8px] rotate-45' : ''
                  }`}
                />
                <span
                  className={`block h-[2px] w-5 bg-current rounded-full transition-opacity duration-200 ${
                    menuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`block h-[2px] w-5 bg-current rounded-full transition-transform duration-300 origin-center ${
                    menuOpen ? '-translate-y-[8px] -rotate-45' : ''
                  }`}
                />
              </button>

            </div>

          </div>
        </header>

        {/* 
          MOBILE DROPDOWN PANEL (opens directly under floating header):
          Rounded rectangle (20px), ivory (#FAF6EC, fully opaque), wide soft shadow,
          48px links with hover/active fill & staggered fade, Language toggle + Book Now at bottom.
        */}
        {menuOpen && (
          <div
            ref={menuRef}
            className="pointer-events-auto mt-2.5 w-full max-w-[1380px] mx-auto rounded-[20px] bg-[#FAF6EC] border border-[#B8964A]/30 shadow-[0_15px_35px_rgba(15,42,32,0.15)] p-4 sm:p-5 flex flex-col gap-1 z-50 animate-dropdown-enter"
          >
            {/* Links List with 48px Height & Staggered Fade */}
            <nav className="flex flex-col space-y-1 pb-3 border-b border-[#B8964A]/20">
              {navItems.map((item, idx) => (
                <NavLink
                  key={item.key}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  style={{ animationDelay: `${idx * 30}ms` }}
                  className={({ isActive }) =>
                    `mobile-item-fade h-[48px] px-4 rounded-[12px] flex items-center justify-between text-sm uppercase tracking-[0.12em] font-medium transition-all ${
                      isActive
                        ? 'bg-[#B8964A]/15 text-[#B8964A] font-semibold'
                        : 'text-[#0F2A20] hover:bg-[#F1E9D8] hover:text-[#A8654A]'
                    }`
                  }
                >
                  <span>{t(`nav.${item.key}`)}</span>
                  <span className="text-xs text-[#B8964A] font-mono">0{idx + 1}</span>
                </NavLink>
              ))}
            </nav>

            {/* Bottom Controls in Dropdown (Language Toggle & Book Now) */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={toggleLanguage}
                type="button"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold border border-[#B8964A]/30 bg-[#FAF6EC] text-[#0F2A20] hover:bg-[#F1E9D8] hover:border-[#B8964A]/60 hover:text-[#A8654A] transition-all cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-[#B8964A]" />
                <span>Language: {language === 'en' ? 'ಕನ್ನಡ (Kannada)' : 'English'}</span>
              </button>

              <Link
                to="/booking"
                onClick={() => setMenuOpen(false)}
                className="book-now-shimmer w-full sm:w-auto text-center px-6 py-2.5 rounded-[12px] text-xs font-bold uppercase tracking-[0.1em] text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] shadow-md hover:shadow-[0_8px_20px_rgba(184,150,74,0.35)] active:scale-[0.98] transition-all"
              >
                {t('nav.bookNow')}
              </Link>
            </div>

            {/* Mobile Menu Policies Footer Strip */}
            <div className="pt-3 border-t border-[#F1E9D8] flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-medium text-[#3E4C43]">
              <Link to="/policies" onClick={() => setMenuOpen(false)} className="hover:text-[#A8654A] transition-colors">
                {language === 'kn' ? 'ನಿಯಮಗಳು' : 'Terms & House Rules'}
              </Link>
              <Link to="/refund-policy" onClick={() => setMenuOpen(false)} className="hover:text-[#A8654A] transition-colors">
                {language === 'kn' ? 'ಮರುಪಾವತಿ ನೀತಿ' : 'Refund & Cancellation'}
              </Link>
              <Link to="/privacy" onClick={() => setMenuOpen(false)} className="hover:text-[#A8654A] transition-colors">
                {language === 'kn' ? 'ಗೌಪ್ಯತಾ ನೀತಿ' : 'Privacy Policy'}
              </Link>
              <Link to="/safety" onClick={() => setMenuOpen(false)} className="hover:text-[#A8654A] transition-colors">
                {language === 'kn' ? 'ಸುರಕ್ಷತೆ' : 'Safety'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
