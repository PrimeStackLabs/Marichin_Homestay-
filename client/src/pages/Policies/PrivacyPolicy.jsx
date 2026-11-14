import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Database, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { PageBanner } from '../../components/Common/PageBanner';
import { DEFAULT_POLICY_SECTIONS } from '../../data/policyDefaults';
import { getPublicHostContact, resolvePolicyText } from '../../utils/refundPolicy';
import {
  PolicyActionsBar,
  PolicyContactStrip,
  PolicyIcon,
  PolicyRichContent,
  StickyPolicyToc
} from '../../components/Policies/PolicyShared';

export const PrivacyPolicy = () => {
  const { language } = useLanguage();
  const isKn = language === 'kn';
  const { policySections, policiesLastUpdated, siteSettings } = useAdmin();

  const visibleSections = useMemo(() => {
    const apiList = Array.isArray(policySections)
      ? policySections.filter((s) => s && s.page === 'privacy')
      : [];
    const source =
      apiList.length > 0
        ? apiList
        : DEFAULT_POLICY_SECTIONS.filter((s) => s.page === 'privacy');

    return [...source]
      .filter((s) => s.isVisible !== false)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [policySections]);

  const tocItems = useMemo(
    () =>
      visibleSections.map((sec, idx) => {
        const anchorId = sec.key ? `privacy-${sec.key}` : `privacy-section-${idx + 1}`;
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
    const elements = tocItems.map((item) => document.getElementById(item.id)).filter(Boolean);
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
      { rootMargin: '-18% 0px -65% 0px', threshold: [0, 0.25] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [tocItems]);

  const hostContact = useMemo(() => getPublicHostContact(siteSettings), [siteSettings]);
  const lastUpdatedValue = policiesLastUpdated || siteSettings?.policiesLastUpdated;

  const summaryHighlights = [
    {
      icon: Database,
      title: isKn ? 'ಅಗತ್ಯ ಮಾಹಿತಿ ಮಾತ್ರ' : 'Only Essential Guest Details',
      text: isKn
        ? 'ಬುಕಿಂಗ್ ದೃಢೀಕರಣಕ್ಕಾಗಿ ಹೆಸರು, ಫೋನ್, ಇಮೇಲ್ ಮತ್ತು ಚೆಕ್-ಇನ್ ಐಡಿ.'
        : 'Name, phone, email, stay dates, and govt. ID verified at check-in.'
    },
    {
      icon: Lock,
      title: isKn ? 'ರೇಜರ್‌ಪೇ ಸುರಕ್ಷಿತ ಪಾವತಿ' : 'Razorpay Payment Processing',
      text: isKn
        ? 'ಕಾರ್ಡ್ ಅಥವಾ UPI ವಿವರಗಳನ್ನು ನಮ್ಮ ಸರ್ವರ್‌ನಲ್ಲಿ ಸಂಗ್ರಹಿಸಲಾಗುವುದಿಲ್ಲ.'
        : 'Handled by Razorpay; card numbers or UPI PINs are never stored by us.'
    },
    {
      icon: ShieldCheck,
      title: isKn ? 'ತಿದ್ದುಪಡಿ ಮತ್ತು ಅಳಿಸುವಿಕೆ' : 'Correction & Deletion',
      text: isKn
        ? 'ಪರಿಶೀಲಿತ ಸಂಪರ್ಕ ವಿವರಗಳ ಮೂಲಕ ಮಾಹಿತಿ ಸರಿಪಡಿಸಲು ವಿನಂತಿಸಬಹುದು.'
        : 'Request updates or deletion of your booking contact details anytime.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF6EC] overflow-x-clip">
      <div className="print:hidden no-print">
        <PageBanner pageKey="privacy" />
      </div>

      <div id="privacy-printable-doc" className="policy-printable">
        {/* Print-only Heading Header */}
        <div className="hidden print:block px-6 pt-6 pb-4 border-b border-[#B8964A]/40 bg-white text-[#1A2A21]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#A8654A] font-semibold">
            Marichin Homestay • Chikkabettageri Village, Kushalnagar, Kodagu
          </p>
          <h1 className="font-serif text-3xl text-[#0F2A20] mt-1">
            {isKn ? 'ಗೌಪ್ಯತಾ ನೀತಿ' : 'Privacy Policy'}
          </h1>
        </div>

        {/* Section 1: Compact Utility Ribbon & Summary Highlights (#FAF6EC matches Banner) */}
        <section className="w-full bg-[#FAF6EC] text-[#1A2A21] pt-3 pb-8 sm:pt-4 sm:pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
            <PolicyActionsBar
              lastUpdated={lastUpdatedValue}
              pdfElementId="privacy-printable-doc"
              pdfFilename="Marichin_Homestay_Privacy_Policy.pdf"
              isKn={isKn}
              currentPath="/privacy"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {summaryHighlights.map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-5 border border-[#B8964A]/25 shadow-[0_6px_22px_rgba(15,42,32,0.05)] flex items-start gap-3.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#FAF6EC] border border-[#B8964A]/30 flex items-center justify-center text-[#B8964A] flex-shrink-0">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <h2 className="font-serif text-lg sm:text-xl text-[#0F2A20] font-normal leading-snug">
                        {item.title}
                      </h2>
                      <p className="text-sm text-[#3E4C43] leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 2: Sticky Compact Index + Unified Editorial Privacy Document (#DDE6D3 alternating band) */}
        <section className="w-full bg-[#DDE6D3] text-[#1A2A21] py-8 sm:py-12 border-t border-[#B8964A]/15">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              <div className="lg:col-span-3 min-w-0">
                <StickyPolicyToc
                  items={tocItems}
                  activeId={activeId}
                  onSelect={setActiveId}
                  isKn={isKn}
                  currentPath="/privacy"
                  pdfElementId="privacy-printable-doc"
                  pdfFilename="Marichin_Homestay_Privacy_Policy.pdf"
                />
              </div>

              <div className="lg:col-span-9 min-w-0">
                <div className="bg-white rounded-3xl border border-[#B8964A]/25 shadow-[0_10px_30px_rgba(15,42,32,0.06)] divide-y divide-[#EFE7D4] overflow-hidden">
                  {tocItems.map((item) => {
                    const sec = item.section;
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
                          <h2 className="font-serif text-xl sm:text-2xl text-[#0F2A20] font-normal leading-snug break-words min-w-0 flex-1">
                            {item.title}
                          </h2>
                        </div>

                        <div className="sm:pl-[5.5rem] space-y-4">
                          <PolicyRichContent text={resolvePolicyText(sec.content, language)} />

                          {sec.key === 'rights-deletion' && (hostContact.email || hostContact.phone) && (
                            <div className="rounded-2xl bg-[#FAF6EC] border border-[#B8964A]/30 p-4 text-sm text-[#0F2A20] flex flex-wrap items-center justify-between gap-3">
                              <div className="space-y-1 min-w-0">
                                <p className="font-semibold">
                                  {isKn ? 'ಗೌಪ್ಯತಾ ವಿನಂತಿಗಳಿಗಾಗಿ ಸಂಪರ್ಕಿಸಿ:' : 'Direct Privacy Contact:'}
                                </p>
                                <div className="flex flex-wrap gap-x-5 gap-y-1">
                                  {hostContact.email && (
                                    <span className="break-all">
                                      {isKn ? 'ಇಮೇಲ್:' : 'Email:'}{' '}
                                      <a href={hostContact.emailHref} className="underline hover:text-[#A8654A]">
                                        {hostContact.email}
                                      </a>
                                    </span>
                                  )}
                                  {hostContact.phone && (
                                    <span>
                                      {isKn ? 'ಫೋನ್:' : 'Phone:'}{' '}
                                      <a href={hostContact.telHref} className="underline hover:text-[#A8654A]">
                                        {hostContact.phone}
                                      </a>
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Link
                                to="/policies"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F2A20] hover:text-[#A8654A] print:hidden no-print"
                              >
                                <span>{isKn ? 'ಹೋಂಸ್ಟೇ ನಿಯಮಗಳು' : 'Policies & Terms'}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-[#B8964A]" />
                              </Link>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Contact Strip (#F1E9D8 before #0F2A20 Footer) */}
      <PolicyContactStrip siteSettings={siteSettings} isKn={isKn} bgClass="bg-[#F1E9D8]" />
    </div>
  );
};

export default PrivacyPolicy;
