import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { INCLUSIONS_DATA, HOMESTAY_INFO } from '../../data/homestayData';
import { InclusionIcon } from './InclusionIcon';
import {
  cleanInternationalPhone,
  resolveHostPhone,
  DEFAULT_HOST_WHATSAPP_DIGITS
} from '../../utils/whatsappMessages';
import {
  CheckCircle2,
  XCircle,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

export const InclusionsSection = ({
  variant = 'full', // 'full' | 'compact' | 'summary' | 'oneline'
  bgColor = 'bg-[#FAF6EC]', // 'bg-[#FAF6EC]' | 'bg-[#F1E9D8]'
  className = '',
  onOpenModal = null
}) => {
  const { language, t } = useLanguage();
  const { inclusions, siteSettings } = useAdmin();
  const isKn = language === 'kn';

  // State for segmented filter (full variant)
  const [filter, setFilter] = useState('all'); // 'all' | 'include' | 'exclude'
  const [fadeState, setFadeState] = useState(true);

  // State for expandable note (only one open at a time)
  const [expandedId, setExpandedId] = useState(null);

  // State for mobile accordion toggle (desktop shows both side by side)
  const [mobileIncludedOpen, setMobileIncludedOpen] = useState(true);
  const [mobileExcludedOpen, setMobileExcludedOpen] = useState(false);

  // Normalize list from context or static fallback
  const allItems = useMemo(() => {
    const list = inclusions && inclusions.length > 0 ? inclusions : INCLUSIONS_DATA;
    return list.filter((item) => item.isActive !== false);
  }, [inclusions]);

  const includedItems = useMemo(
    () => allItems.filter((i) => i.type === 'include').sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
    [allItems]
  );

  const excludedItems = useMemo(
    () => allItems.filter((i) => i.type === 'exclude').sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
    [allItems]
  );

  // Helpers for localized text
  const getTitle = (item) => {
    if (!item) return '';
    if (isKn && item.title?.kn) return item.title.kn;
    return item.title?.en || (typeof item.title === 'string' ? item.title : '');
  };

  const getNote = (item) => {
    if (!item) return '';
    if (isKn && item.note?.kn) return item.note.kn;
    return item.note?.en || (typeof item.note === 'string' ? item.note : '');
  };

  // WhatsApp Button visibility & link logic
  const rawNumber = resolveHostPhone(siteSettings?.whatsappNumber || siteSettings?.whatsapp || HOMESTAY_INFO.whatsapp);
  const isPlaceholderNumber = false;
  const cleanNumber = cleanInternationalPhone(rawNumber) || DEFAULT_HOST_WHATSAPP_DIGITS;
  const defaultWhatsAppMsg = encodeURIComponent(
    isKn
      ? 'ನಮಸ್ಕಾರ ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇ, ನಿಮ್ಮ ತಂಗುವಿಕೆಯಲ್ಲಿ ಏನೆಲ್ಲಾ ಸೇರಿದೆ ಎಂದು ತಿಳಿಯಲು ಬಯಸುತ್ತೇನೆ.'
      : 'Hello Marichin Homestay, I have a question about what is included and excluded in the stay plan.'
  );
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${defaultWhatsAppMsg}`;

  // Handle filter change with 250ms smooth fade transition
  const handleFilterChange = (newFilter) => {
    if (newFilter === filter) return;
    setFadeState(false);
    setTimeout(() => {
      setFilter(newFilter);
      setFadeState(true);
    }, 250);
  };

  // Toggle item note (Enter/Space & click accessible)
  const toggleNote = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // =========================================================================
  // VARIANT 1: ONE-LINE (for Rooms Page under Price Block)
  // =========================================================================
  if (variant === 'oneline') {
    const isDark = className?.includes('dark') || className?.includes('text-');
    const summaryLabels = includedItems.slice(0, 5).map((item) =>
      isKn && item.title?.kn ? item.title.kn : (item.title?.en || item.title)
    ).filter(Boolean);
    const dynamicOneline = summaryLabels.length > 0
      ? `${isKn ? 'ಒಳಗೊಂಡಿದೆ: ' : 'Includes: '}${summaryLabels.join(' · ')}`
      : (isKn ? 'ಒಳಗೊಂಡಿದೆ: ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ · ಬ್ರೇಕ್‌ಫಾಸ್ಟ್ · ವೈ-ಫೈ · ಪಾರ್ಕಿಂಗ್ · ಬೆಂಕಿ ಕಾಯಿಸುವಿಕೆ' : 'Includes: Entire Homestay · Breakfast · Wi-Fi · Parking · Campfire');
    return (
      <div className={`pt-2.5 pb-1 border-t border-[#B8964A]/20 text-xs flex flex-wrap items-center justify-between gap-2 ${isDark ? 'text-[#F3EDDD]' : 'text-[#5F6B62]'} ${className}`}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Check className="w-3.5 h-3.5 text-[#B8964A] flex-shrink-0" />
          <span className={`font-medium ${isDark ? 'text-[#F3EDDD]' : 'text-[#0F2A20]'}`}>
            {dynamicOneline}
          </span>
        </div>
        <Link
          to="/packages#inclusions"
          className="text-[#B8964A] hover:text-[#D9BC7A] font-semibold underline underline-offset-2 flex items-center gap-0.5 transition-colors whitespace-nowrap"
        >
          <span>{t('inclusions.seeWhatsIncluded')}</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  // =========================================================================
  // VARIANT 2: SUMMARY CARD (for Booking Page beside Price Summary)
  // =========================================================================
  if (variant === 'summary') {
    const previewIncludes = includedItems.slice(0, 4);
    const previewExcludes = excludedItems.slice(0, 3);

    return (
      <div className={`p-5 rounded-2xl bg-white border border-[#B8964A]/25 shadow-sm space-y-4 ${className}`}>
        <div className="flex items-center justify-between border-b border-[#F1E9D8] pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#B8964A]" />
            <h4 className="font-serif text-sm font-bold text-[#0F2A20] tracking-wide">
              {t('inclusions.includedSummaryTitle')}
            </h4>
          </div>
          <span className="text-[11px] font-mono text-[#B8964A] bg-[#FAF6EC] px-2 py-0.5 rounded-full border border-[#B8964A]/20">
            {includedItems.length} {t('inclusions.includedBadge')}
          </span>
        </div>

        {/* Quick Inclusions List */}
        <div className="space-y-2 text-xs">
          {previewIncludes.map((item) => (
            <div key={item._id || item.id} className="flex items-start gap-2 text-[#0F2A20]">
              <Check className="w-3.5 h-3.5 text-[#B8964A] mt-0.5 flex-shrink-0" />
              <span>{getTitle(item)}</span>
            </div>
          ))}
        </div>

        {/* Quick Exclusions Preview */}
        {previewExcludes.length > 0 && (
          <div className="pt-2 border-t border-[#F1E9D8] space-y-1.5 text-xs text-[#5F6B62]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#A8654A] block">
              {t('inclusions.filterExcluded')}
            </span>
            {previewExcludes.map((item) => (
              <div key={item._id || item.id} className="flex items-start gap-2">
                <X className="w-3.5 h-3.5 text-[#A8654A] mt-0.5 flex-shrink-0" />
                <span>{getTitle(item)}</span>
              </div>
            ))}
          </div>
        )}

        {/* View Full List Modal Trigger */}
        <button
          type="button"
          onClick={onOpenModal}
          className="w-full py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider text-[#0F2A20] bg-[#FAF6EC] hover:bg-[#F1E9D8] border border-[#B8964A]/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>{t('inclusions.viewFullList')}</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#B8964A]" />
        </button>
      </div>
    );
  }

  // =========================================================================
  // VARIANT 3: COMPACT (for Home Page between Stay Plan & Guest Stories)
  // =========================================================================
  if (variant === 'compact') {
    return (
      <section className={`w-full ${bgColor} text-[#1A2A21] py-16 sm:py-20 border-b border-[#B8964A]/20 ${className}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1B4332] text-[#D9BC7A] text-[10px] uppercase tracking-[0.18em] font-semibold mb-3 border border-[#B8964A]/30">
              <Sparkles className="w-3 h-3 text-[#D9BC7A]" />
              <span>{t('inclusions.badge')}</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#0F2A20] font-normal tracking-tight">
              {t('inclusions.title')}
            </h2>
            <div className="w-16 h-0.5 bg-[#B8964A] mx-auto mt-3 mb-4" />
            <p className="text-sm text-[#5F6B62] font-light leading-relaxed">
              {t('inclusions.subtitle')}
            </p>
          </div>

          {/* Two Side-by-Side Cards (Notes hidden, clean check/cross list) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            {/* Included Card */}
            <div className="rounded-3xl p-6 sm:p-8 bg-white border border-[#8F9E8B]/40 shadow-[0_10px_35px_rgba(15,42,32,0.06)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#F1E9D8] mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#1B4332]/10 border border-[#B8964A]/30 flex items-center justify-center text-[#B8964A]">
                      <Check className="w-4 h-4" />
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-[#0F2A20]">
                      {t('inclusions.includedTitle')}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#B8964A] bg-[#FAF6EC] px-3 py-1 rounded-full border border-[#B8964A]/25">
                    {includedItems.length} {t('inclusions.includedBadge')}
                  </span>
                </div>

                <div className="space-y-3">
                  {includedItems.slice(0, 6).map((item, idx) => (
                    <div
                      key={item._id || item.id || idx}
                      className="flex items-start gap-3 text-sm text-[#0F2A20] font-medium"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#FAF6EC] border border-[#B8964A]/30 flex items-center justify-center flex-shrink-0 text-[#B8964A] mt-0.5">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <span className="leading-tight">{getTitle(item)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#F1E9D8]">
                <Link
                  to="/packages#inclusions"
                  className="text-xs font-bold uppercase tracking-wider text-[#B8964A] hover:text-[#A8654A] flex items-center gap-1.5 transition-colors"
                >
                  <span>{t('inclusions.seeFullDetails')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Not Included Card */}
            <div className="rounded-3xl p-6 sm:p-8 bg-[#F1E9D8] border border-[#A8654A]/25 shadow-[0_10px_35px_rgba(15,42,32,0.06)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#FAF6EC] mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#A8654A]/10 border border-[#A8654A]/30 flex items-center justify-center text-[#A8654A]">
                      <X className="w-4 h-4" />
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-[#0F2A20]">
                      {t('inclusions.excludedTitle')}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#A8654A] bg-[#FAF6EC] px-3 py-1 rounded-full border border-[#A8654A]/25">
                    {excludedItems.length} {t('inclusions.excludedBadge')}
                  </span>
                </div>

                <div className="space-y-3">
                  {excludedItems.map((item, idx) => (
                    <div
                      key={item._id || item.id || idx}
                      className="flex items-start gap-3 text-sm text-[#0F2A20] font-medium"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#FAF6EC] border border-[#A8654A]/30 flex items-center justify-center flex-shrink-0 text-[#A8654A] mt-0.5">
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <span className="leading-tight">{getTitle(item)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#FAF6EC]">
                <Link
                  to="/packages#inclusions"
                  className="text-xs font-bold uppercase tracking-wider text-[#A8654A] hover:text-[#B8964A] flex items-center gap-1.5 transition-colors"
                >
                  <span>{t('inclusions.seeFullDetails')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>
    );
  }

  // =========================================================================
  // VARIANT 4: FULL INTERACTIVE COMPONENT (Stay Plan Page & Booking Modal)
  // =========================================================================
  return (
    <section
      id="inclusions"
      className={`w-full ${bgColor} text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20 ${className}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1B4332] text-[#D9BC7A] text-[10px] uppercase tracking-[0.18em] font-semibold mb-3 border border-[#B8964A]/30">
            <Sparkles className="w-3 h-3 text-[#D9BC7A]" />
            <span>{t('inclusions.badge')}</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl text-[#0F2A20] font-normal tracking-tight">
            {t('inclusions.title')}
          </h2>
          <div className="w-16 h-0.5 bg-[#B8964A] mx-auto mt-3 mb-4" />
          <p className="text-sm sm:text-base text-[#5F6B62] font-light leading-relaxed">
            {t('inclusions.subtitle')}
          </p>
        </div>

        {/* Segmented Filter Toggle (All / Included / Not Included) with 250ms smooth transition */}
        <div className="flex items-center justify-center mb-10">
          <div className="inline-flex items-center p-1.5 rounded-full bg-white/80 border border-[#B8964A]/25 shadow-sm">
            <button
              type="button"
              onClick={() => handleFilterChange('all')}
              className={`px-4 sm:px-6 py-2 rounded-full text-xs uppercase tracking-[0.12em] font-semibold transition-all duration-200 cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#0F2A20] text-[#F3EDDD] shadow-sm'
                  : 'text-[#0F2A20] hover:text-[#B8964A]'
              }`}
            >
              {t('inclusions.filterAll')} ({includedItems.length + excludedItems.length})
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('include')}
              className={`px-4 sm:px-6 py-2 rounded-full text-xs uppercase tracking-[0.12em] font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                filter === 'include'
                  ? 'bg-[#0F2A20] text-[#F3EDDD] shadow-sm'
                  : 'text-[#0F2A20] hover:text-[#B8964A]'
              }`}
            >
              <Check className="w-3.5 h-3.5 text-[#B8964A]" />
              <span>{t('inclusions.filterIncluded')} ({includedItems.length})</span>
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('exclude')}
              className={`px-4 sm:px-6 py-2 rounded-full text-xs uppercase tracking-[0.12em] font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                filter === 'exclude'
                  ? 'bg-[#0F2A20] text-[#F3EDDD] shadow-sm'
                  : 'text-[#0F2A20] hover:text-[#A8654A]'
              }`}
            >
              <X className="w-3.5 h-3.5 text-[#A8654A]" />
              <span>{t('inclusions.filterExcluded')} ({excludedItems.length})</span>
            </button>
          </div>
        </div>

        {/* Content Container with 250ms smooth opacity/fade transition */}
        <div
          className={`transition-opacity duration-200 ease-in-out ${
            fadeState ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            
            {/* CARD 1: INCLUDED (White card, gold check icons, thin sage border) */}
            {(filter === 'all' || filter === 'include') && (
              <div
                className={`rounded-3xl p-6 sm:p-8 bg-white border border-[#8F9E8B]/40 shadow-[0_12px_40px_rgba(15,42,32,0.06)] transition-all ${
                  filter === 'include' ? 'lg:col-span-2 max-w-3xl mx-auto w-full' : ''
                }`}
              >
                {/* Header (Accordion header on mobile screens) */}
                <div
                  className="flex items-center justify-between pb-4 border-b border-[#F1E9D8] mb-6 cursor-pointer sm:cursor-default"
                  onClick={() => setMobileIncludedOpen(!mobileIncludedOpen)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1B4332]/10 border border-[#B8964A]/30 flex items-center justify-center text-[#B8964A] flex-shrink-0">
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#0F2A20]">
                        {t('inclusions.includedTitle')}
                      </h3>
                      <p className="text-xs text-[#5F6B62] font-light mt-0.5">
                        {isKn ? 'ನಿಮ್ಮ ವಾಸ್ತವ್ಯದಲ್ಲಿ ಸೇರಿದೆ' : 'Included in your stay'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#B8964A] bg-[#FAF6EC] px-3.5 py-1 rounded-full border border-[#B8964A]/25 whitespace-nowrap">
                      {includedItems.length} {t('inclusions.includedBadge')}
                    </span>
                    {/* Mobile Chevron Toggle */}
                    <span className="sm:hidden text-[#5F6B62] p-1">
                      {mobileIncludedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </div>
                </div>

                {/* Items List (Accordioned on Mobile) */}
                <div className={`space-y-3 ${mobileIncludedOpen ? 'block' : 'hidden sm:block'}`}>
                  {includedItems.map((item, idx) => {
                    const hasNote = Boolean(getNote(item));
                    const isExpanded = expandedId === (item._id || item.id);

                    return (
                      <div
                        key={item._id || item.id || idx}
                        style={{ animationDelay: `${idx * 60}ms` }}
                        onClick={() => hasNote && toggleNote(item._id || item.id)}
                        onKeyDown={(e) => {
                          if (hasNote && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            toggleNote(item._id || item.id);
                          }
                        }}
                        role={hasNote ? 'button' : undefined}
                        tabIndex={hasNote ? 0 : undefined}
                        aria-expanded={hasNote ? isExpanded : undefined}
                        className={`p-3.5 rounded-2xl border transition-all duration-200 outline-none ${
                          hasNote ? 'cursor-pointer hover:bg-[#FAF6EC] focus-visible:ring-2 focus-visible:ring-[#B8964A]' : ''
                        } ${
                          isExpanded
                            ? 'bg-[#FAF6EC] border-[#B8964A]/50 shadow-sm'
                            : 'bg-white border-[#F1E9D8] hover:border-[#B8964A]/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Icon Container with once animation */}
                            <div className="w-8 h-8 rounded-xl bg-[#FAF6EC] border border-[#B8964A]/25 flex items-center justify-center text-[#B8964A] flex-shrink-0 mt-0.5">
                              <InclusionIcon name={item.icon} isExclude={false} className="w-4 h-4" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm sm:text-base text-[#0F2A20] flex items-center gap-2">
                                <span>{getTitle(item)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Interactive note expand indicator */}
                          {hasNote && (
                            <div className="flex items-center gap-1 text-[#5F6B62] text-xs flex-shrink-0 mt-1">
                              <span className="hidden sm:inline text-[11px] font-mono opacity-60">
                                {isExpanded ? 'Hide' : 'Note'}
                              </span>
                              <ChevronDown
                                className={`w-4 h-4 text-[#B8964A] transition-transform duration-300 ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          )}
                        </div>

                        {/* Expandable Note with smooth CSS transition (only 1 open at a time) */}
                        {hasNote && (
                          <div
                            className={`transition-all duration-300 ease-out overflow-hidden ${
                              isExpanded ? 'max-h-40 opacity-100 mt-2.5 pt-2.5 border-t border-[#B8964A]/20' : 'max-h-0 opacity-0'
                            }`}
                          >
                            <p className="text-xs sm:text-sm text-[#5F6B62] font-light leading-relaxed pl-11">
                              {getNote(item)}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* CARD 2: NOT INCLUDED (Linen card, muted terracotta cross icons) */}
            {(filter === 'all' || filter === 'exclude') && (
              <div
                className={`rounded-3xl p-6 sm:p-8 bg-[#F1E9D8] border border-[#A8654A]/25 shadow-[0_12px_40px_rgba(15,42,32,0.06)] transition-all ${
                  filter === 'exclude' ? 'lg:col-span-2 max-w-3xl mx-auto w-full' : ''
                }`}
              >
                {/* Header (Accordion header on mobile screens) */}
                <div
                  className="flex items-center justify-between pb-4 border-b border-[#FAF6EC] mb-6 cursor-pointer sm:cursor-default"
                  onClick={() => setMobileExcludedOpen(!mobileExcludedOpen)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#A8654A]/10 border border-[#A8654A]/30 flex items-center justify-center text-[#A8654A] flex-shrink-0">
                      <X className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#0F2A20]">
                        {t('inclusions.excludedTitle')}
                      </h3>
                      <p className="text-xs text-[#5F6B62] font-light mt-0.5">
                        {isKn ? 'ಹೆಚ್ಚುವರಿ ಶುಲ್ಕ ಅಥವಾ ಪ್ರತ್ಯೇಕ ವ್ಯವಸ್ಥೆ ಅಗತ್ಯ' : 'Available upon separate arrangement / not covered'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#A8654A] bg-[#FAF6EC] px-3.5 py-1 rounded-full border border-[#A8654A]/25 whitespace-nowrap">
                      {excludedItems.length} {t('inclusions.excludedBadge')}
                    </span>
                    {/* Mobile Chevron Toggle */}
                    <span className="sm:hidden text-[#5F6B62] p-1">
                      {mobileExcludedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </div>
                </div>

                {/* Items List (Accordioned on Mobile) */}
                <div className={`space-y-3 ${mobileExcludedOpen ? 'block' : 'hidden sm:block'}`}>
                  {excludedItems.map((item, idx) => {
                    const hasNote = Boolean(getNote(item));
                    const isExpanded = expandedId === (item._id || item.id);

                    return (
                      <div
                        key={item._id || item.id || idx}
                        style={{ animationDelay: `${idx * 60}ms` }}
                        onClick={() => hasNote && toggleNote(item._id || item.id)}
                        onKeyDown={(e) => {
                          if (hasNote && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            toggleNote(item._id || item.id);
                          }
                        }}
                        role={hasNote ? 'button' : undefined}
                        tabIndex={hasNote ? 0 : undefined}
                        aria-expanded={hasNote ? isExpanded : undefined}
                        className={`p-3.5 rounded-2xl border transition-all duration-200 outline-none ${
                          hasNote ? 'cursor-pointer hover:bg-[#FAF6EC] focus-visible:ring-2 focus-visible:ring-[#A8654A]' : ''
                        } ${
                          isExpanded
                            ? 'bg-[#FAF6EC] border-[#A8654A]/50 shadow-sm'
                            : 'bg-white/80 border-[#FAF6EC] hover:border-[#A8654A]/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Icon Container with once animation */}
                            <div className="w-8 h-8 rounded-xl bg-[#FAF6EC] border border-[#A8654A]/25 flex items-center justify-center text-[#A8654A] flex-shrink-0 mt-0.5">
                              <InclusionIcon name={item.icon} isExclude={true} className="w-4 h-4" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm sm:text-base text-[#0F2A20] flex items-center gap-2">
                                <span>{getTitle(item)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Interactive note expand indicator */}
                          {hasNote && (
                            <div className="flex items-center gap-1 text-[#5F6B62] text-xs flex-shrink-0 mt-1">
                              <span className="hidden sm:inline text-[11px] font-mono opacity-60">
                                {isExpanded ? 'Hide' : 'Note'}
                              </span>
                              <ChevronDown
                                className={`w-4 h-4 text-[#A8654A] transition-transform duration-300 ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          )}
                        </div>

                        {/* Expandable Note with smooth CSS transition (only 1 open at a time) */}
                        {hasNote && (
                          <div
                            className={`transition-all duration-300 ease-out overflow-hidden ${
                              isExpanded ? 'max-h-40 opacity-100 mt-2.5 pt-2.5 border-t border-[#A8654A]/20' : 'max-h-0 opacity-0'
                            }`}
                          >
                            <p className="text-xs sm:text-sm text-[#5F6B62] font-light leading-relaxed pl-11">
                              {getNote(item)}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

          </div>
        </div>

        {/* Footer WhatsApp Link Line: "Not sure about something? Ask on WhatsApp" */}
        {/* Hidden while the number is still a placeholder */}
        {!isPlaceholderNumber && (
          <div className="mt-12 text-center">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold text-[#0F2A20] bg-white border border-[#B8964A]/30 hover:border-[#25D366] hover:bg-[#FAF6EC] hover:shadow-md transition-all group"
            >
              <div className="w-5 h-5 rounded-full bg-[#25D366] text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-3 h-3 fill-current" />
              </div>
              <span>{t('inclusions.whatsAppPrompt')}</span>
            </a>
          </div>
        )}

      </div>
    </section>
  );
};
