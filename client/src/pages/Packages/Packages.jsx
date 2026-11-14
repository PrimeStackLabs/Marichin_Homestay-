import React, { useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { PACKAGES_DATA } from '../../data/homestayData';
import { PageBanner } from '../../components/Common/PageBanner';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Users, 
  Tag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { InclusionsSection } from '../../components/Inclusions/InclusionsSection';
import {
  getStandardRoomPrice,
  getPackagePriceMeta
} from '../../utils/homestayFormatting';

export const Packages = () => {
  const { t, language } = useLanguage();
  const isKn = language === 'kn';
  const { rooms, packages, resolvedFullHomePrice } = useAdmin();

  // Active packages list
  const packageList = useMemo(() => {
    if (packages && packages.length > 0) {
      return packages.filter(p => p.isActive !== false);
    }
    return PACKAGES_DATA;
  }, [packages]);

  // Calculate lowest room price dynamically
  const lowestRoomPrice = useMemo(() => {
    const validPrices = (rooms || []).map(r => Number(r.pricePerNight || r.price || 0)).filter(p => p > 0);
    return validPrices.length > 0 ? Math.min(...validPrices) : 6000;
  }, [rooms]);
  const standardRoomPrice = useMemo(() => getStandardRoomPrice(rooms), [rooms]);

  // Calculate entire homestay price dynamically from synced settings or room sum
  const entireHomestayPrice = useMemo(() => {
    if (resolvedFullHomePrice && resolvedFullHomePrice > 0) {
      return resolvedFullHomePrice;
    }
    return (rooms || []).reduce((sum, r) => {
      const p = Number(r.pricePerNight || r.price || 0);
      const units = Number(r.totalUnits) || (r.slug === 'single-room' ? 1 : 2);
      return sum + (p * units);
    }, 0) || 42000;
  }, [rooms, resolvedFullHomePrice]);

  // Helper to determine booking URL with package preselection
  const getPackageBookingUrl = (pkg) => {
    const rawSlug = pkg.slug || pkg.id || '';
    const slug = (rawSlug || pkg.title || '').toLowerCase();
    if (slug.includes('entire-homestay') || slug.includes('all-5-rooms') || slug.includes('all 5 rooms')) {
      return `/booking?type=full_home&package=${encodeURIComponent(rawSlug || 'entire-homestay')}`;
    }
    if (rawSlug) {
      return `/booking?package=${encodeURIComponent(rawSlug)}`;
    }
    if (slug.includes('family-stay')) {
      return '/booking?package=family-stay';
    }
    if (slug.includes('dinner')) {
      return '/booking?package=room-breakfast-dinner';
    }
    if (slug.includes('breakfast')) {
      return '/booking?package=room-breakfast';
    }
    return '/booking';
  };

  // Helper to determine price text and labels cleanly, prioritizing Admin-edited prices
  const getPackagePriceInfo = (pkg) =>
    getPackagePriceMeta(pkg, {
      lowestRoomPrice,
      standardRoomPrice,
      entireHomestayPrice,
      isKn
    });

  // Helper returning Admin-edited text first, using Kannada fallbacks only when !custom or kn mode
  const getPackageLocalized = (pkg) => {
    const slug = (pkg.slug || pkg.id || pkg.title || '').toLowerCase();
    const adminTitle = pkg.title || pkg.name || '';
    const adminDesc = pkg.description || '';
    const adminInclusions = Array.isArray(pkg.inclusions) && pkg.inclusions.length > 0
      ? pkg.inclusions
      : (Array.isArray(pkg.features) && pkg.features.length > 0 ? pkg.features : []);

    if (!isKn) {
      return {
        title: adminTitle || 'Curated Package',
        description: adminDesc,
        inclusions: adminInclusions,
        idealFor: pkg.idealFor || '',
        durationLabel: pkg.durationLabel || pkg.duration || ''
      };
    }

    if (slug.includes('room-breakfast') && !slug.includes('dinner')) {
      return {
        title: pkg.titleKn || 'ಕೊಠಡಿ + ಉಪಹಾರ',
        description: pkg.descriptionKn || 'ಯಾವುದೇ ಕೊಠಡಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ. ಬೆಳಗಿನ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ.',
        inclusions: pkg.inclusionsKn || [
          'ಯಾವುದೇ ಕೊಠಡಿ (ಸ್ಟ್ಯಾಂಡರ್ಡ್, ಸೂಟ್ ಅಥವಾ ಸಿಂಗಲ್)',
          'ರುಚಿಕರ ಬೆಳಗಿನ ಮನೆ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ',
          'ಹೈ-ಸ್ಪೀಡ್ ವೈ-ಫೈ ಮತ್ತು ಸುರಕ್ಷಿತ ಪಾರ್ಕಿಂಗ್ ಸೌಲಭ್ಯ',
          'ಸಂಜೆಯ ಬೆಚ್ಚನೆಯ ಕ್ಯಾಂಪ್‌ಫೈರ್ ಕೂಟ',
          'ಒಳಾಂಗಣ ಮತ್ತು ಹೊರಾಂಗಣ ಆಟಗಳು',
          'ಮಾರ್ಗದರ್ಶನದೊಂದಿಗೆ ಕಾಫಿ ತೋಟದ ನಡಿಗೆ'
        ],
        idealFor: pkg.idealFor || '',
        durationLabel: pkg.durationLabel || ''
      };
    }
    if (slug.includes('dinner')) {
      return {
        title: pkg.titleKn || 'ಕೊಠಡಿ + ಉಪಹಾರ + ರಾತ್ರಿಯ ಊಟ',
        description: pkg.descriptionKn || 'ರಾತ್ರಿಯ ಊಟದ ಆಯ್ಕೆ: ಮೆನುವಿನಿಂದ ಸಸ್ಯಾಹಾರಿ ಅಥವಾ ಮಾಂಸಾಹಾರಿ.',
        inclusions: pkg.inclusionsKn || [
          'ಯಾವುದೇ ಕೊಠಡಿ (ಸ್ಟ್ಯಾಂಡರ್ಡ್, ಸೂಟ್ ಅಥವಾ ಸಿಂಗಲ್)',
          'ರುಚಿಕರ ಬೆಳಗಿನ ಮನೆ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ',
          'ರಾತ್ರಿಯ ಊಟದ ಆಯ್ಕೆ: ಮೆನುವಿನಿಂದ ಸಸ್ಯಾಹಾರಿ ಅಥವಾ ಮಾಂಸಾಹಾರಿ',
          'ಹೈ-ಸ್ಪೀಡ್ ವೈ-ಫೈ ಮತ್ತು ಸುರಕ್ಷಿತ ಪಾರ್ಕಿಂಗ್ ಸೌಲಭ್ಯ',
          'ಸಂಜೆಯ ಬೆಚ್ಚನೆಯ ಕ್ಯಾಂಪ್‌ಫೈರ್ ಕೂಟ',
          'ಒಳಾಂಗಣ ಮತ್ತು ಹೊರಾಂಗಣ ಆಟಗಳು',
          'ಮಾರ್ಗದರ್ಶನದೊಂದಿಗೆ ಕಾಫಿ ತೋಟದ ನಡಿಗೆ'
        ],
        idealFor: pkg.idealFor || '',
        durationLabel: pkg.durationLabel || ''
      };
    }
    if (slug.includes('entire-homestay') || slug.includes('all-5-rooms') || slug.includes('all 5 rooms')) {
      return {
        title: pkg.titleKn || 'ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ (ಎಲ್ಲಾ 5 ಕೊಠಡಿಗಳು)',
        description: pkg.descriptionKn || 'ಎಲ್ಲಾ 5 ಕೊಠಡಿಗಳ ಸಂಪೂರ್ಣ ಕಾಯ್ದಿರಿಸುವಿಕೆ (2 ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಕೊಠಡಿಗಳು, 2 ಸೂಟ್ ಕೊಠಡಿಗಳು, 1 ಸಿಂಗಲ್ ಕೊಠಡಿ).',
        inclusions: pkg.inclusionsKn || [
          'ಎಲ್ಲಾ 5 ಹೋಂಸ್ಟೇ ಕೊಠಡಿಗಳ ಸಂಪೂರ್ಣ ಕಾಯ್ದಿರಿಸುವಿಕೆ',
          'ಒಟ್ಟು ಸಾಮರ್ಥ್ಯ: ಗರಿಷ್ಠ 10 ವಯಸ್ಕರು + 6 ಮಕ್ಕಳು',
          'ಎಲ್ಲಾ ಅತಿಥಿಗಳಿಗೂ ಬೆಳಗಿನ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ',
          'ಹೈ-ಸ್ಪೀಡ್ ವೈ-ಫೈ ಮತ್ತು ಸುರಕ್ಷಿತ ಪಾರ್ಕಿಂಗ್ ಸೌಲಭ್ಯ',
          'ಸಂಜೆಯ ಬೆಚ್ಚನೆಯ ಕ್ಯಾಂಪ್‌ಫೈರ್ ಕೂಟ',
          'ಒಳಾಂಗಣ ಮತ್ತು ಹೊರಾಂಗಣ ಆಟಗಳು',
          'ಮಾರ್ಗದರ್ಶನದೊಂದಿಗೆ ಕಾಫಿ ತೋಟದ ನಡಿಗೆ'
        ],
        idealFor: pkg.idealFor || '',
        durationLabel: pkg.durationLabel || ''
      };
    }
    if (slug.includes('family-stay')) {
      return {
        title: pkg.titleKn || 'ಫ್ಯಾಮಿಲಿ ವಾಸ್ತವ್ಯ',
        description: pkg.descriptionKn || 'ಉಪಹಾರದೊಂದಿಗೆ 1 ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಅಥವಾ ಸೂಟ್ ಕೊಠಡಿ.',
        inclusions: pkg.inclusionsKn || [
          '1 ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಅಥವಾ ಸೂಟ್ ಕೊಠಡಿ',
          'ರುಚಿಕರ ಬೆಳಗಿನ ಮನೆ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ',
          'ಹೈ-ಸ್ಪೀಡ್ ವೈ-ಫೈ ಮತ್ತು ಸುರಕ್ಷಿತ ಪಾರ್ಕಿಂಗ್ ಸೌಲಭ್ಯ',
          'ಸಂಜೆಯ ಬೆಚ್ಚನೆಯ ಕ್ಯಾಂಪ್‌ಫೈರ್ ಕೂಟ',
          'ಒಳಾಂಗಣ ಮತ್ತು ಹೊರಾಂಗಣ ಆಟಗಳು',
          'ಮಾರ್ಗದರ್ಶನದೊಂದಿಗೆ ಕಾಫಿ ತೋಟದ ನಡಿಗೆ'
        ],
        idealFor: pkg.idealFor || '',
        durationLabel: pkg.durationLabel || ''
      };
    }
    return {
      title: pkg.titleKn || adminTitle,
      description: pkg.descriptionKn || adminDesc,
      inclusions: pkg.inclusionsKn || adminInclusions,
      idealFor: pkg.idealFor || '',
      durationLabel: pkg.durationLabel || ''
    };
  };

  return (
    <div className="min-h-screen bg-[#FAF6EC] text-[#1A2A21]">
      
      {/* SECTION 1: Redesigned Hero Banner with Floating Cards */}
      <PageBanner pageKey="packages" />

      {/* SECTION 2: Curated Homestay Packages Grid — Warm Ivory */}
      <section className="w-full bg-[#FAF6EC] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A]">
              {isKn ? 'ಹೋಂಸ್ಟೇ ಪ್ಯಾಕೇಜ್‌ಗಳು' : 'Homestay Packages'}
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl text-[#0F2A20] font-normal mt-2">
              {isKn ? 'ನಮ್ಮ ವಿಶೇಷ ಪ್ಯಾಕೇಜ್‌ಗಳು' : 'Our Curated Packages'}
            </h2>
            <div className="w-16 h-0.5 bg-[#B8964A] mx-auto mt-3" />
            <p className="text-sm sm:text-base text-[#5F6B62] font-light mt-3 leading-relaxed">
              {isKn
                ? 'ಪ್ರತಿ ಪ್ಯಾಕೇಜ್‌ನಲ್ಲಿಯೂ ಬೆಳಗಿನ ಉಪಹಾರ, ಹೈ-ಸ್ಪೀಡ್ ವೈ-ಫೈ, ಪಾರ್ಕಿಂಗ್, ಸಂಜೆಯ ಕ್ಯಾಂಪ್‌ಫೈರ್, ಆಟಗಳು ಮತ್ತು ಕಾಫಿ ತೋಟದ ನಡಿಗೆ ಒಳಗೊಂಡಿದೆ.'
                : 'Each package includes wholesome morning breakfast, high-speed Wi-Fi, secure on-site parking, evening campfire, games, and a guided coffee estate walk.'}
            </p>
          </div>

          {/* Four Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8 items-stretch">
            {packageList.map((pkg, idx) => {
              const localized = getPackageLocalized(pkg);
              const priceInfo = getPackagePriceInfo(pkg);
              const cardImage = pkg.image || '/images/realimage/homeimage.jpeg';

              return (
                <div
                  key={pkg.id || pkg.slug || idx}
                  className="rounded-3xl overflow-hidden border border-[#F1E9D8] bg-white hover:border-[#B8964A]/50 transition-all duration-300 shadow-[0_10px_40px_rgba(15,42,32,0.08)] hover:shadow-[0_16px_45px_rgba(15,42,32,0.12)] flex flex-col justify-between group"
                >
                  <div>
                    {/* Photo with subtle overlay */}
                    <div className="relative h-56 sm:h-60 overflow-hidden bg-[#0A1A13]">
                      <img
                        src={cardImage}
                        alt={localized.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* Package Pill */}
                      <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-[0.14em] text-[#0F2A20] bg-[#D9BC7A] shadow-md z-10">
                        {isKn ? 'ಪ್ಯಾಕೇಜ್' : 'Package'}
                      </span>

                      {/* Optional Discount Badge if set */}
                      {priceInfo.discount && (
                        <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold text-white bg-emerald-600 shadow-md z-10 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          <span>{priceInfo.discount}</span>
                        </span>
                      )}

                      <div className="absolute bottom-3 left-4 right-4 text-xs font-serif text-[#D9BC7A] bg-[#0F2A20]/90 px-3 py-1 rounded-full border border-[#B8964A]/30 backdrop-blur-sm truncate">
                        {localized.title}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6">
                      {(localized.durationLabel || localized.idealFor) && (
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-[#A8654A] mb-2">
                          {localized.durationLabel && <span>{localized.durationLabel}</span>}
                          {localized.durationLabel && localized.idealFor && <span>·</span>}
                          {localized.idealFor && (
                            <span className="inline-flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {localized.idealFor}
                            </span>
                          )}
                        </div>
                      )}
                      <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#0F2A20] mb-2 group-hover:text-[#B8964A] transition-colors leading-snug">
                        {localized.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-[#5F6B62] font-light leading-relaxed mb-5 min-h-[40px]">
                        {localized.description}
                      </p>

                      <div className="space-y-2 mb-6">
                        {localized.inclusions.map((feature, fIdx) => (
                          <div key={fIdx} className="flex items-start gap-2 text-xs text-[#5F6B62] leading-[1.6]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#B8964A] flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="p-6 pt-0">
                    <div className="pt-4 border-t border-[#F1E9D8] flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase tracking-wider text-[#5F6B62] block truncate">
                          {priceInfo.note}
                        </span>
                        <div className={`font-serif font-bold text-[#0F2A20] truncate ${
                          priceInfo.isContact ? 'text-base sm:text-lg text-[#0F2A20]' : 'text-xl sm:text-2xl text-[#0F2A20]'
                        }`}>
                          {priceInfo.amountText}
                        </div>
                      </div>

                      <Link
                        to={getPackageBookingUrl(pkg)}
                        className="px-4 py-2.5 rounded-[12px] text-xs uppercase tracking-[0.14em] font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all duration-300 shadow-sm hover:-translate-y-0.5 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer flex-shrink-0"
                      >
                        <span>{isKn ? 'ಕಾಯ್ದಿರಿಸಿ' : 'Book'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: What's Included & Not Included — Ivory Background */}
      <InclusionsSection variant="full" bgColor="bg-[#FAF6EC]" />

    </div>
  );
};