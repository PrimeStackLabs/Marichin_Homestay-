import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CreditCard, RefreshCw, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { PageBanner } from '../../components/Common/PageBanner';
import { DEFAULT_POLICY_SECTIONS } from '../../data/policyDefaults';
import {
  describeTierWindow,
  normalizeCancellationTiers,
  resolvePolicyText
} from '../../utils/refundPolicy';
import {
  PolicyActionsBar,
  PolicyContactStrip,
  PolicyIcon,
  PolicyRichContent,
  StickyPolicyToc
} from '../../components/Policies/PolicyShared';

export const Policies = () => {
  const { language } = useLanguage();
  const isKn = language === 'kn';
  const { policySections, policiesLastUpdated, siteSettings } = useAdmin();

  const visibleSections = useMemo(() => {
    const apiList = Array.isArray(policySections)
      ? policySections.filter((s) => s && s.page === 'policies')
      : [];
    const source =
      apiList.length > 0
        ? apiList
        : DEFAULT_POLICY_SECTIONS.filter((s) => s.page === 'policies');

    return [...source]
      .filter((s) => s.isVisible !== false)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [policySections]);

  const tocItems = useMemo(
    () =>
      visibleSections.map((sec, idx) => {
        const anchorId = sec.key ? `policy-${sec.key}` : `policy-section-${idx + 1}`;
        return {
          id: anchorId,
          numberLabel: String(idx + 1).padStart(2, '0'),
          title: resolvePolicyText(sec.title, language) || (isKn ? `ವಿಭಾಗ ${idx + 1}` : `Section ${idx + 1}`),
          section: sec
        };
      }),
    [visibleSections, language, isKn]
  );

  const [activeId, setActiveId] = useState(tocItems[0]?.id || '');

  useEffect(() => {
    if (tocItems.length === 0) return;

    const hashId = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    if (hashId && tocItems.some((item) => item.id === hashId)) {
      setActiveId(hashId);
      const target = document.getElementById(hashId);
      if (target) {
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
      }
    } else if (!activeId || !tocItems.some((item) => item.id === activeId)) {
      setActiveId(tocItems[0].id);
    }
  }, [tocItems]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || tocItems.length === 0) return;

    const elements = tocItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-18% 0px -65% 0px',
        threshold: [0, 0.25]
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [tocItems]);

  const checkInTime = siteSettings?.checkInTime || '12:00 PM';
  const checkOutTime = siteSettings?.checkOutTime || '11:00 AM';
  const advanceOptions =
    Array.isArray(siteSettings?.advanceOptions) && siteSettings.advanceOptions.length > 0
      ? siteSettings.advanceOptions
      : [20, 50, 100];
  const advanceSummary = `${advanceOptions.join('% / ')}%`;
  const sortedTiers = useMemo(
    () => normalizeCancellationTiers(siteSettings?.cancellationTiers),
    [siteSettings?.cancellationTiers]
  );
  const lastUpdatedValue = policiesLastUpdated || siteSettings?.policiesLastUpdated;

  const stayFacts = [
    {
      icon: Clock,
      label: isKn ? 'ಚೆಕ್-ಇನ್' : 'Check-In',
      value: checkInTime,
      note: isKn ? 'ಸರ್ಕಾರಿ ಫೋಟೋ ಐಡಿ ಕಡ್ಡಾಯ' : 'Govt. photo ID on arrival'
    },
    {
      icon: Clock,
      label: isKn ? 'ಚೆಕ್-ಔಟ್' : 'Check-Out',
      value: checkOutTime,
      note: isKn ? 'ಬಾಕಿ ಮೊತ್ತ ಚೆಕ್-ಇನ್‌ನಲ್ಲಿ ಪಾವತಿಸಿ' : 'Balance settled by check-in'
    },
    {
      icon: CreditCard,
      label: isKn ? 'ಮುಂಗಡ ಆಯ್ಕೆಗಳು' : 'Advance Options',
      value: advanceSummary,
      note: isKn ? 'ರೇಜರ್‌ಪೇ • 15 ನಿಮಿಷದ ಹೋಲ್ಡ್' : 'Razorpay • 15-min checkout hold'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF6EC] overflow-x-clip">
      <div className="print:hidden no-print">
        <PageBanner pageKey="policies" />
      </div>

      <div id="policies-printable-doc" className="policy-printable">
        {/* Print-only Heading Header */}
        <div className="hidden print:block px-6 pt-6 pb-4 border-b border-[#B8964A]/40 bg-white text-[#1A2A21]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#A8654A] font-semibold">
            Marichin Homestay • Chikkabettageri Village, Kushalnagar, Kodagu
          </p>
          <h1 className="font-serif text-3xl text-[#0F2A20] mt-1">
            {isKn ? 'ಹೋಂಸ್ಟೇ ನಿಯಮಗಳು ಮತ್ತು ನಿಬಂಧನೆಗಳು' : 'Homestay Policies & Terms'}
          </h1>
        </div>

        {/* Section 1: Utility Ribbon & Balanced Key Facts Overview (#FAF6EC matches Banner) */}
        <section className="w-full bg-[#FAF6EC] text-[#1A2A21] pt-3 pb-8 sm:pt-4 sm:pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
            <PolicyActionsBar
              lastUpdated={lastUpdatedValue}
              pdfElementId="policies-printable-doc"
              pdfFilename="Marichin_Homestay_Policies_Terms.pdf"
              isKn={isKn}
              currentPath="/policies"
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* Compact 3-Metric Stay Bar (no mismatched empty heights) */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stayFacts.map((fact, idx) => {
                  const IconComp = fact.icon;
                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl p-5 border border-[#B8964A]/25 shadow-[0_6px_22px_rgba(15,42,32,0.05)] flex flex-col justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#FAF6EC] border border-[#B8964A]/30 flex items-center justify-center text-[#B8964A] flex-shrink-0">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B62]">
                          {fact.label}
                        </p>
                      </div>
                      <div>
                        <p className="font-serif text-xl sm:text-2xl text-[#0F2A20] font-normal leading-tight break-words">
                          {fact.value}
                        </p>
                        <p className="text-xs sm:text-sm text-[#3E4C43] mt-1 leading-snug">
                          {fact.note}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dedicated Cancellation Tier Snapshot Card */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-[#B8964A]/25 shadow-[0_6px_22px_rgba(15,42,32,0.05)] flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#FAF6EC] border border-[#B8964A]/30 flex items-center justify-center text-[#B8964A] flex-shrink-0">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B62]">
                      {isKn ? 'ರದ್ದತಿ ಮರುಪಾವತಿ ಶ್ರೇಣಿಗಳು' : 'Cancellation Summary'}
                    </p>
                  </div>
                  <Link
                    to="/refund-policy"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F2A20] hover:text-[#A8654A] transition-colors print:hidden no-print flex-shrink-0"
                  >
                    <span>{isKn ? 'ಪೂರ್ಣ ವಿವರ' : 'Full Schedule'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#B8964A]" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {sortedTiers.slice(0, 3).map((tier, idx) => (
                    <div
                      key={tier.daysBeforeCheckIn}
                      className="rounded-xl bg-[#FAF6EC] border border-[#EFE7D4] px-3 py-2 flex sm:flex-col items-center sm:items-start justify-between gap-1"
                    >
                      <span className="text-[11px] text-[#3E4C43] leading-tight font-medium">
                        {describeTierWindow(tier, idx, sortedTiers, language)}
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          tier.refundPercent >= 100
                            ? 'text-emerald-700'
                            : tier.refundPercent > 0
                            ? 'text-[#A8654A]'
                            : 'text-rose-700'
                        }`}
                      >
                        {tier.refundPercent}% {isKn ? 'ಮರುಪಾವತಿ' : 'Refund'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Sticky Compact Index + Unified Editorial Document Sheet (#DDE6D3 alternating band) */}
        <section className="w-full bg-[#DDE6D3] text-[#1A2A21] py-8 sm:py-12 border-t border-[#B8964A]/15">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              <div className="lg:col-span-3 min-w-0">
                <StickyPolicyToc
                  items={tocItems}
                  activeId={activeId}
                  onSelect={setActiveId}
                  isKn={isKn}
                  currentPath="/policies"
                  pdfElementId="policies-printable-doc"
                  pdfFilename="Marichin_Homestay_Policies_Terms.pdf"
                />
              </div>

              <div className="lg:col-span-9 min-w-0">
                {tocItems.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 border border-[#B8964A]/25 text-center text-base text-[#3E4C43]">
                    {isKn
                      ? 'ಪ್ರಸ್ತುತ ಯಾವುದೇ ಸಾರ್ವಜನಿಕ ನೀತಿ ವಿಭಾಗಗಳು ಲಭ್ಯವಿಲ್ಲ.'
                      : 'No public policy sections are currently published.'}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-[#B8964A]/25 shadow-[0_10px_30px_rgba(15,42,32,0.06)] divide-y divide-[#EFE7D4] overflow-hidden">
                    {tocItems.map((item) => {
                      const sec = item.section;
                      const bodyText = resolvePolicyText(sec.content, language);

                      return (
                        <article
                          key={item.id}
                          id={item.id}
                          data-policy-section-id={item.id}
                          className="scroll-mt-24 p-6 sm:px-9 sm:py-7 space-y-4 policy-card"
                        >
                          <div className="flex items-start gap-3.5">
                            <span className="font-serif text-2xl sm:text-[26px] font-semibold text-[#B8964A] leading-none pt-1 flex-shrink-0 w-9">
                              {item.numberLabel}
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-[#FAF6EC] border border-[#B8964A]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <PolicyIcon name={sec.icon} className="w-4 h-4 text-[#B8964A]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h2 className="font-serif text-xl sm:text-2xl text-[#0F2A20] font-normal leading-snug break-words">
                                {item.title}
                              </h2>
                            </div>
                          </div>

                          <div className="sm:pl-[5.5rem]">
                            <PolicyRichContent text={bodyText} />

                            {sec.key === 'booking-payment' && (
                              <div className="pt-3 print:hidden no-print">
                                <Link
                                  to="/refund-policy"
                                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F2A20] hover:text-[#A8654A] transition-colors"
                                >
                                  <span>
                                    {isKn ? 'ಪೂರ್ಣ ಮರುಪಾವತಿ ಮತ್ತು ರದ್ದತಿ ನೀತಿ ಓದಿ' : 'Read full Refund & Cancellation Policy'}
                                  </span>
                                  <ArrowRight className="w-4 h-4 text-[#B8964A]" />
                                </Link>
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Section 3: Contact Strip (#F1E9D8 alternating before #0F2A20 Footer) */}
      <PolicyContactStrip siteSettings={siteSettings} isKn={isKn} bgClass="bg-[#F1E9D8]" />
    </div>
  );
};

export default Policies;
