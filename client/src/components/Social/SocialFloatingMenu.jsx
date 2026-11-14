import React, { useState, useRef, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useLanguage } from '../../context/LanguageContext';
import { HOMESTAY_INFO } from '../../data/homestayData';
import { MoreHorizontal, X, Share2 } from 'lucide-react';
import {
  resolveInstagramUrl,
  DEFAULT_INSTAGRAM_HANDLE,
  resolveFacebookUrl,
  resolveYoutubeUrl
} from '../../utils/whatsappMessages';

export const SocialFloatingMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { siteSettings } = useAdmin();
  const { language } = useLanguage();
  const isKn = language === 'kn';

  const settings = siteSettings || HOMESTAY_INFO;
  const instagramUrl = resolveInstagramUrl(settings.instagramUrl);
  const facebookUrl = resolveFacebookUrl(settings.facebookUrl);
  const youtubeUrl = resolveYoutubeUrl(settings.youtubeUrl);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const socialLinks = [
    {
      name: isKn ? 'ಇನ್‌ಸ್ಟಾಗ್ರಾಮ್' : 'Instagram',
      handle: DEFAULT_INSTAGRAM_HANDLE,
      url: instagramUrl,
      bg: 'bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#833AB4]',
      hoverGlow: 'hover:shadow-[0_8px_20px_rgba(225,48,108,0.5)]',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      )
    },
    {
      name: isKn ? 'ಫೇಸ್‌ಬುಕ್' : 'Facebook',
      handle: 'Marichin Homestay',
      url: facebookUrl,
      bg: 'bg-[#1877F2]',
      hoverGlow: 'hover:shadow-[0_8px_20px_rgba(24,119,242,0.5)]',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )
    },
    {
      name: isKn ? 'ಯೂಟ್ಯೂಬ್' : 'YouTube',
      handle: isKn ? 'ವೀಡಿಯೊಗಳನ್ನು ನೋಡಿ' : 'Watch Videos',
      url: youtubeUrl,
      bg: 'bg-[#FF0000]',
      hoverGlow: 'hover:shadow-[0_8px_20px_rgba(255,0,0,0.5)]',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )
    }
  ];

  return (
    <div
      ref={menuRef}
      className="fixed bottom-[88px] right-5 sm:right-6 z-40 print:hidden flex items-center"
    >
      {/* Expanded Social Icons (Slide-out horizontally to the left) */}
      <div
        className={`flex items-center gap-2.5 sm:gap-3 mr-3 transition-all duration-300 ease-out origin-right ${
          isOpen
            ? 'opacity-100 scale-100 translate-x-0 pointer-events-auto'
            : 'opacity-0 scale-75 translate-x-8 pointer-events-none'
        }`}
      >
        {socialLinks.map((social, idx) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${social.name} - ${social.handle}`}
            aria-label={social.name}
            style={{
              transitionDelay: isOpen ? `${idx * 60}ms` : '0ms'
            }}
            className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full ${social.bg} text-white flex items-center justify-center shadow-lg ${social.hoverGlow} hover:scale-115 active:scale-95 transition-all duration-300 group border-2 border-[#0F2A20]`}
          >
            {social.icon}

            {/* Hover Tooltip Above */}
            <span className="hidden sm:group-hover:block absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#0F2A20] text-[#D9BC7A] text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#B8964A]/30 shadow-xl pointer-events-none">
              {social.name}
            </span>
          </a>
        ))}
      </div>

      {/* Main 3-Dot Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 rounded-full bg-[#0F2A20] hover:bg-[#153a2d] text-[#D9BC7A] flex items-center justify-center shadow-[0_8px_24px_rgba(15,42,32,0.4)] hover:shadow-[0_12px_32px_rgba(184,150,74,0.45)] hover:scale-110 active:scale-95 transition-all duration-300 group border-2 border-[#B8964A] cursor-pointer"
        title={isOpen ? (isKn ? 'ಮುಚ್ಚಿ' : 'Close Social Menu') : (isKn ? 'ಸಾಮಾಜಿಕ ಮಾಧ್ಯಮಗಳು' : 'Social Channels (Instagram, Facebook, YouTube)')}
        aria-label="Social Channels Menu"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-[#D9BC7A] transition-transform duration-300 rotate-90" />
        ) : (
          <MoreHorizontal className="w-7 h-7 text-[#D9BC7A] transition-transform duration-300 group-hover:scale-115" />
        )}

        {/* Subtle Luxury Gold Ring Indicator */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#B8964A] border-2 border-[#0F2A20] rounded-full flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-[#FAF6EC] rounded-full" />
          </span>
        )}

        {/* Hover Tooltip on Left (when closed) */}
        {!isOpen && (
          <span className="hidden sm:group-hover:block absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-[#0F2A20] text-[#D9BC7A] text-xs px-3 py-1.5 rounded-lg border border-[#B8964A]/30 shadow-2xl pointer-events-none transition-all">
            {isKn ? 'ಸಾಮಾಜಿಕ ಮಾಧ್ಯಮ' : 'Social Channels'}
          </span>
        )}
      </button>
    </div>
  );
};

