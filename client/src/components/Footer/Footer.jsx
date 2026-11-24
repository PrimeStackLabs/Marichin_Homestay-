import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { HOMESTAY_INFO } from '../../data/homestayData';
import { api } from '../../services/api';
import {
  resolveInstagramUrl,
  resolveFacebookUrl,
  resolveYoutubeUrl
} from '../../utils/whatsappMessages';
import { getPublicHostContact } from '../../utils/refundPolicy';
import { 
  Trees, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Instagram, 
  Facebook, 
  Youtube,
  MessageCircle,
  Send
} from 'lucide-react';

export const Footer = () => {
  const { t, language } = useLanguage();
  const isKn = language === 'kn';
  const { siteSettings } = useAdmin();
  const settings = siteSettings || {};
  const publicContact = getPublicHostContact(settings);
  const displayEmail = publicContact.email;
  const displayPhone = publicContact.phone;
  const displayWhatsapp = publicContact.whatsapp;
  const cleanTelPhone = publicContact.telHref;
  const cleanWaHref = publicContact.whatsappHref;
  const displayAddress = publicContact.address || HOMESTAY_INFO.address;
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (email) {
      try {
        await api.subscribeNewsletter(email);
      } catch (err) {
        // Continue gracefully even if network error
      }
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer className="w-full bg-[#0A1A13] text-[#F3EDDD] border-t border-[#B8964A]/20 pt-16 pb-28 sm:pb-20 relative z-20 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 mb-14">
          
          {/* Col 1: Company Information & Tourism Certification (3 cols) */}
          <div className="lg:col-span-3 space-y-5">
            <Link to="/" className="inline-flex items-center gap-3.5 group">
              <img
                src={settings.logo || '/images/logo.jpeg'}
                alt={`${settings.propertyName || settings.name || 'Marichin Homestay'} logo`}
                className="h-[72px] w-auto object-contain rounded-full shadow-md group-hover:scale-105 transition-transform duration-300 border border-[#B8964A]/30"
                style={{ borderRadius: '50%' }}
              />
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold tracking-wide text-[#F3EDDD] group-hover:text-[#D9BC7A] transition-colors">
                  {settings.propertyName || settings.name || 'Marichin Homestay'}
                </span>
                <span className="text-[11px] tracking-[0.2em] text-[#D9BC7A] font-sans font-medium uppercase mt-0.5">
                  {settings.tagline || 'Kushalnagar · Coorg'}
                </span>
              </div>
            </Link>

            <p className="text-sm text-[#B9C4B8] font-light leading-relaxed max-w-sm">
              {t('footer.aboutText')}
            </p>

            {/* Official Tourism Certification Badge (Shown only if registration number is set in Site Settings) */}
            {settings?.registrationNumber && settings.registrationNumber.trim() ? (
              <div className="inline-flex items-center gap-3 p-3.5 rounded-2xl bg-[#1B4332] border border-[#B8964A]/25 shadow-sm">
                <ShieldCheck className="w-7 h-7 text-[#B8964A] flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-[#D9BC7A] uppercase tracking-wider">
                    Karnataka Tourism Approved
                  </p>
                  <p className="text-[10px] text-[#B9C4B8] font-mono">
                    Reg: {settings.registrationNumber}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={resolveInstagramUrl(settings.instagramUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-[#B8964A]/30 bg-[#1B4332] flex items-center justify-center text-[#B8964A] hover:bg-[#B8964A] hover:text-[#0A1A13] transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={resolveFacebookUrl(settings.facebookUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-[#B8964A]/30 bg-[#1B4332] flex items-center justify-center text-[#B8964A] hover:bg-[#B8964A] hover:text-[#0A1A13] transition-all"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={resolveYoutubeUrl(settings.youtubeUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-[#B8964A]/30 bg-[#1B4332] flex items-center justify-center text-[#B8964A] hover:bg-[#B8964A] hover:text-[#0A1A13] transition-all"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              {cleanWaHref && (
                <a
                  href={cleanWaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-[#25D366]/40 bg-[#1B4332] flex items-center justify-center text-[#25D366] hover:bg-[#25D366] hover:text-[#0A1A13] transition-all"
                  aria-label={`WhatsApp ${displayWhatsapp}`}
                  title={`WhatsApp: ${displayWhatsapp}`}
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Col 2: Quick Navigation (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-serif text-sm font-bold text-[#D9BC7A] uppercase tracking-widest border-b border-[#B8964A]/20 pb-2">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-2.5 text-xs text-[#B9C4B8]">
              <li>
                <Link to="/" className="hover:text-[#D9BC7A] transition-colors block">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#D9BC7A] transition-colors block">
                  {t('nav.about')}
                </Link>
              </li>
              <li>
                <Link to="/rooms" className="hover:text-[#D9BC7A] transition-colors block">
                  {t('nav.rooms')}
                </Link>
              </li>
              <li>
                <Link to="/dining" className="hover:text-[#D9BC7A] transition-colors block">
                  {t('nav.dining')}
                </Link>
              </li>
              <li>
                <Link to="/experiences" className="hover:text-[#D9BC7A] transition-colors block">
                  {t('nav.experiences')}
                </Link>
              </li>
              <li>
                <Link to="/packages" className="hover:text-[#D9BC7A] transition-colors block">
                  {t('nav.packages')}
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-[#D9BC7A] transition-colors block">
                  {t('nav.gallery')}
                </Link>
              </li>
              <li>
                <Link to="/booking" className="text-[#D9BC7A] font-bold hover:underline block">
                  ★ {t('nav.bookNow')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Policies (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-serif text-sm font-bold text-[#D9BC7A] uppercase tracking-widest border-b border-[#B8964A]/20 pb-2">
              {t('footer.policies') || (isKn ? 'ನೀತಿಗಳು' : 'Policies')}
            </h4>
            <ul className="space-y-2.5 text-xs text-[#B9C4B8]">
              <li>
                <Link to="/policies" className="hover:text-[#D9BC7A] transition-colors block">
                  {isKn ? 'ನಿಯಮಗಳು ಮತ್ತು ಮನೆ ನಿಯಮಗಳು' : 'Terms & House Rules'}
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-[#D9BC7A] transition-colors block">
                  {isKn ? 'ಮರುಪಾವತಿ ಮತ್ತು ರದ್ದತಿ' : 'Refund & Cancellation'}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#D9BC7A] transition-colors block">
                  {isKn ? 'ಗೌಪ್ಯತಾ ನೀತಿ' : 'Privacy Policy'}
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-[#D9BC7A] transition-colors block">
                  {isKn ? 'ಸುರಕ್ಷತೆ' : 'Safety'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Homestay Facilities (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-serif text-sm font-bold text-[#D9BC7A] uppercase tracking-widest border-b border-[#B8964A]/20 pb-2">
              Homestay Facilities
            </h4>
            <ul className="space-y-2.5 text-xs text-[#B9C4B8]">
              {(Array.isArray(settings.facilities) && settings.facilities.length > 0
                ? settings.facilities.map((f) => (typeof f === 'string' ? f : (f.label || f.name || ''))).filter(Boolean)
                : ['Wi-Fi', 'Homely Food', 'Parking Facility', 'Campfire', 'Indoor & Outdoor Games', 'Estate Walk']
              ).map((facLabel, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8964A]" />
                  <span>{facLabel}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact & Location + Newsletter (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-serif text-sm font-bold text-[#D9BC7A] uppercase tracking-widest border-b border-[#B8964A]/20 pb-2">
              {t('footer.contactUs')}
            </h4>
            <div className="space-y-2.5 text-xs text-[#B9C4B8]">
              {displayAddress && (
                <div className="space-y-1">
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=12.425583,75.911889"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 hover:text-[#D9BC7A] transition-colors group"
                  >
                    <MapPin className="w-4 h-4 text-[#B8964A] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span>{displayAddress}</span>
                  </a>
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=12.425583,75.911889"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] text-[#D9BC7A] hover:underline pl-6 font-mono"
                  >
                    <span>📍 12°25'32.1"N 75°54'42.8"E (Directions)</span>
                  </a>
                </div>
              )}
              {displayPhone && cleanTelPhone && (
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#B8964A] flex-shrink-0" />
                  <a href={cleanTelPhone} className="hover:text-[#D9BC7A] font-mono">
                    {displayPhone}
                  </a>
                </p>
              )}
              {displayWhatsapp && cleanWaHref && (
                <p className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#25D366] flex-shrink-0" />
                  <a
                    href={cleanWaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#D9BC7A] font-mono"
                  >
                    WhatsApp: {displayWhatsapp}
                  </a>
                </p>
              )}
              {displayEmail && (
                <p className="flex items-start gap-2 min-w-0">
                  <Mail className="w-4 h-4 text-[#B8964A] flex-shrink-0 mt-0.5" />
                  <a href={`mailto:${displayEmail}`} className="hover:text-[#D9BC7A] text-[11px] sm:text-[11.5px] leading-snug [overflow-wrap:anywhere] min-w-0">
                    {displayEmail}
                  </a>
                </p>
              )}
            </div>

            {/* Newsletter */}
            <div className="mt-4 pt-3 border-t border-[#1B4332]">
              <p className="text-[11px] text-[#D9BC7A] mb-2 font-medium">
                Stay Updated
              </p>
              <form onSubmit={handleSubscribe} className="flex">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full bg-[#0F2A20] border border-[#B8964A]/30 rounded-l-xl px-3 py-2 text-xs text-[#F3EDDD] placeholder-[#5F6B62] focus:outline-none focus:border-[#B8964A]"
                  required
                />
                <button
                  type="submit"
                  className="bg-[#B8964A] hover:bg-[#D9BC7A] text-[#0F2A20] px-3.5 rounded-r-xl flex items-center justify-center transition-colors font-bold"
                  aria-label="Subscribe"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
              {subscribed && (
                <p className="text-[10px] text-emerald-400 mt-1.5 font-medium">
                  ✓ Direct booking voucher sent to your inbox!
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#1B4332] flex flex-col sm:flex-row items-center justify-between text-xs text-[#B9C4B8]/80 gap-4">
          <p>© {new Date().getFullYear()} {settings.name || settings.propertyName}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-5 sm:gap-6">
            <Link to="/policies" className="hover:text-[#D9BC7A] transition-colors">{isKn ? 'ಗೌಪ್ಯತೆ & ನಿಯಮಗಳು' : 'Privacy & Terms'}</Link>
            <Link to="/refund-policy" className="hover:text-[#D9BC7A] transition-colors">{isKn ? 'ಮರುಪಾವತಿ ನೀತಿ' : 'Refund & Cancellation'}</Link>
            <Link to="/privacy" className="hover:text-[#D9BC7A] transition-colors">{isKn ? 'ಗೌಪ್ಯತಾ ನೀತಿ' : 'Privacy Policy'}</Link>
            <Link to="/safety" className="hover:text-[#D9BC7A] transition-colors">{isKn ? 'ಸುರಕ್ಷತೆ ಮಾನದಂಡಗಳು' : 'Safety Standards'}</Link>
            <span className="text-[#B9C4B8]/70">
              Developed by{' '}
              <a
                href="https://primepro.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D9BC7A] hover:text-[#FAF6EC] font-semibold underline underline-offset-2 transition-colors"
              >
                primepro.ai
              </a>
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
