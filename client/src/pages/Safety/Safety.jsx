import React, { useMemo } from 'react';
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  PhoneCall,
  HeartPulse,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Info
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { PageBanner } from '../../components/Common/PageBanner';
import {
  SAFETY_FEATURE_DEFS,
  getPublicHostContact,
  resolvePolicyText
} from '../../utils/refundPolicy';
import {
  PolicyActionsBar,
  PolicyContactStrip,
  PolicyIcon
} from '../../components/Policies/PolicyShared';

export const Safety = () => {
  const { language } = useLanguage();
  const isKn = language === 'kn';
  const { siteSettings, safetyContacts, policiesLastUpdated } = useAdmin();

  const hostContact = useMemo(() => getPublicHostContact(siteSettings), [siteSettings]);

  const visibleLocalContacts = useMemo(() => {
    if (!Array.isArray(safetyContacts)) return [];
    return [...safetyContacts]
      .filter((c) => c && c.isVisible !== false && resolvePolicyText(c.name, language))
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [safetyContacts, language]);

  const enabledFeatures = useMemo(() => {
    const flags = siteSettings?.safetyFeatures || {};
    return SAFETY_FEATURE_DEFS.filter((def) => Boolean(flags[def.key]));
  }, [siteSettings?.safetyFeatures]);

  const categoryLabels = {
    hospital: { en: 'Nearest Hospital / Clinic', kn: 'ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆ / ಕ್ಲಿನಿಕ್' },
    police: { en: 'Police Station', kn: 'ಪೊಲೀಸ್ ಠಾಣೆ' },
    pharmacy: { en: 'Pharmacy / Medical Store', kn: 'ಔಷಧಾಲಯ' },
    other: { en: 'Local Helpline', kn: 'ಸ್ಥಳೀಯ ಸಹಾಯವಾಣಿ' }
  };

  const nationalNumbers = [
    {
      number: '112',
      label: isKn ? 'ರಾಷ್ಟ್ರೀಯ ತುರ್ತು ಸಹಾಯವಾಣಿ' : 'National Emergency Helpline',
      detail: isKn ? 'ಪೊಲೀಸ್, ಅಗ್ನಿಶಾಮಕ ಮತ್ತು ತುರ್ತು ನೆರವಿಗಾಗಿ' : 'All-in-one emergency response across India',
      icon: ShieldAlert
    },
    {
      number: '108',
      label: isKn ? 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಸೇವೆ' : 'Ambulance Service',
      detail: isKn ? 'ವೈದ್ಯಕೀಯ ತುರ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಹಾಯವಾಣಿ' : 'Emergency medical transport service',
      icon: HeartPulse
    }
  ];

  const hasHostBlock = Boolean(hostContact.hasAny || hostContact.address);
  const lastUpdatedValue = policiesLastUpdated || siteSettings?.policiesLastUpdated;

  // Alternate backgrounds cleanly even when optional blocks are hidden
  const featuresBgClass = visibleLocalContacts.length > 0 ? 'bg-[#FAF6EC]' : 'bg-[#DDE6D3]';

  return (
    <div className="min-h-screen bg-[#FAF6EC] overflow-x-clip">
      <div className="print:hidden no-print">
        <PageBanner pageKey="safety" />
      </div>

      <div id="safety-printable-doc" className="policy-printable">
        {/* Print-only Heading Header */}
        <div className="hidden print:block px-6 pt-6 pb-4 border-b border-[#B8964A]/40 bg-white text-[#1A2A21]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#A8654A] font-semibold">
            Marichin Homestay • Chikkabettageri Village, Kushalnagar, Kodagu
          </p>
          <h1 className="font-serif text-3xl text-[#0F2A20] mt-1">
            {isKn ? 'ಅತಿಥಿ ಸುರಕ್ಷತೆ ಮತ್ತು ತುರ್ತು ಸಂಪರ್ಕಗಳು' : 'Safety & Emergency Contacts'}
          </h1>
        </div>

        {/* Section 1: Toolbar, Verified Host Contact & National Numbers 112 / 108 (#FAF6EC matches Banner) */}
        <section className="w-full bg-[#FAF6EC] text-[#1A2A21] pt-3 pb-8 sm:pt-4 sm:pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <PolicyActionsBar
              lastUpdated={lastUpdatedValue}
              pdfElementId="safety-printable-doc"
              pdfFilename="Marichin_Homestay_Safety_Contacts.pdf"
              isKn={isKn}
              currentPath="/safety"
            />

            <div className={`grid grid-cols-1 ${hasHostBlock ? 'lg:grid-cols-12' : ''} gap-6 items-stretch`}>
              {/* National Emergency Numbers (112 and 108 strictly) */}
              <div
                className={`${
                  hasHostBlock ? 'lg:col-span-5' : ''
                } bg-white rounded-3xl p-6 sm:p-7 border border-[#B8964A]/25 shadow-[0_8px_24px_rgba(15,42,32,0.06)] flex flex-col justify-between gap-4`}
              >
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A] block">
                      {isKn ? 'ಭಾರತ ಸರ್ಕಾರದ ಸಹಾಯವಾಣಿಗಳು' : 'Official Helplines'}
                    </span>
                    <h2 className="font-serif text-xl sm:text-2xl text-[#0F2A20] font-normal">
                      {isKn ? 'ರಾಷ್ಟ್ರೀಯ ತುರ್ತು ಸಂಖ್ಯೆಗಳು' : 'National Emergency Numbers'}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {nationalNumbers.map((item) => {
                      const IconComp = item.icon;
                      return (
                        <a
                          key={item.number}
                          href={`tel:${item.number}`}
                          className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-[#0F2A20] text-[#F3EDDD] hover:bg-[#1B4332] transition-colors shadow-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-[#1B4332] border border-[#B8964A]/40 flex items-center justify-center flex-shrink-0">
                              <IconComp className="w-5 h-5 text-[#D9BC7A]" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-serif text-lg text-white leading-snug">{item.label}</p>
                              <p className="text-xs sm:text-sm text-[#B9C4B8] mt-0.5">{item.detail}</p>
                            </div>
                          </div>
                          <span className="font-mono text-2xl font-bold text-[#D9BC7A] flex-shrink-0 inline-flex items-center gap-1.5">
                            <PhoneCall className="w-4 h-4" />
                            {item.number}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>

                {hostContact.address && (
                  <div className="rounded-2xl bg-[#FAF6EC] border border-[#EFE7D4] px-4 py-3 flex items-start gap-2.5 text-xs sm:text-sm text-[#3E4C43]">
                    <Info className="w-4 h-4 text-[#B8964A] flex-shrink-0 mt-0.5" />
                    <span>
                      {isKn
                        ? `112 ಅಥವಾ 108 ಗೆ ಕರೆ ಮಾಡುವಾಗ ವಿಳಾಸ ತಿಳಿಸಿ: ${hostContact.address}`
                        : `When calling 112 or 108, quote the property address: ${hostContact.address}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Host Contact Card (compact 2-col tiles, only populated non-placeholder lines rendered) */}
              {hasHostBlock && (
                <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-[#B8964A]/25 shadow-[0_8px_24px_rgba(15,42,32,0.06)] flex flex-col justify-between gap-4">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A] block">
                        {isKn ? 'ನೇರ ಸಂಪರ್ಕ' : 'Property Contact'}
                      </span>
                      <h2 className="font-serif text-xl sm:text-2xl text-[#0F2A20] font-normal">
                        {isKn ? 'ಹೋಂಸ್ಟೇ ಆತಿಥೇಯರ ಸಂಪರ್ಕ' : 'Direct Host Contact Details'}
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm sm:text-base text-[#2B3931]">
                      {hostContact.phone && (
                        <a
                          href={hostContact.telHref}
                          className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF6EC] border border-[#EFE7D4] hover:border-[#B8964A]/50 transition-colors"
                        >
                          <Phone className="w-5 h-5 text-[#B8964A] flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B62] block">
                              {isKn ? 'ದೂರವಾಣಿ' : 'Phone'}
                            </span>
                            <span className="font-semibold text-[#0F2A20] break-words">{hostContact.phone}</span>
                          </div>
                        </a>
                      )}

                      {hostContact.whatsapp && (
                        <a
                          href={hostContact.whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF6EC] border border-[#EFE7D4] hover:border-[#B8964A]/50 transition-colors"
                        >
                          <MessageCircle className="w-5 h-5 text-[#1B6E3D] flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B62] block">
                              WhatsApp
                            </span>
                            <span className="font-semibold text-[#0F2A20] break-words">{hostContact.whatsapp}</span>
                          </div>
                        </a>
                      )}

                      {hostContact.email && (
                        <a
                          href={hostContact.emailHref}
                          className="sm:col-span-2 flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF6EC] border border-[#EFE7D4] hover:border-[#B8964A]/50 transition-colors"
                        >
                          <Mail className="w-5 h-5 text-[#B8964A] flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B62] block">
                              {isKn ? 'ಇಮೇಲ್' : 'Email'}
                            </span>
                            <span className="font-semibold text-[#0F2A20] break-all">{hostContact.email}</span>
                          </div>
                        </a>
                      )}
                    </div>
                  </div>

                  {hostContact.address && (
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAF6EC] border border-[#EFE7D4] text-sm sm:text-base">
                      <MapPin className="w-5 h-5 text-[#B8964A] flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B62] block">
                          {isKn ? 'ವಿಳಾಸ' : 'Property Address'}
                        </span>
                        <span className="text-[#2B3931] break-words">{hostContact.address}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Owner-Verified Local Emergency Directory (COMPLETELY HIDDEN until owner adds entries) */}
        {visibleLocalContacts.length > 0 && (
          <section className="w-full bg-[#DDE6D3] text-[#1A2A21] py-8 sm:py-10 border-t border-[#B8964A]/15">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
              <div className="space-y-1 max-w-2xl">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A] block">
                  {isKn ? 'ಪರಿಶೀಲಿತ ಸ್ಥಳೀಯ ಸಂಪರ್ಕಗಳು' : 'Local Contacts'}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#0F2A20] font-normal">
                  {isKn ? 'ಹತ್ತಿರದ ವೈದ್ಯಕೀಯ ಮತ್ತು ಪೊಲೀಸ್ ಸೇವೆಗಳು' : 'Verified Nearby Emergency Services'}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleLocalContacts.map((entry, idx) => {
                  const catInfo = categoryLabels[entry.category] || categoryLabels.other;
                  const entryName = resolvePolicyText(entry.name, language);
                  const entryDist = resolvePolicyText(entry.distance, language);
                  const entryNotes = resolvePolicyText(entry.notes, language);
                  const cleanTel = entry.phone ? String(entry.phone).replace(/[^0-9+]/g, '') : '';

                  return (
                    <div
                      key={entry._id || idx}
                      className="bg-white rounded-2xl p-5 sm:p-6 border border-[#B8964A]/25 shadow-[0_8px_22px_rgba(15,42,32,0.05)] flex flex-col justify-between gap-3.5"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-3 py-0.5 rounded-full bg-[#FAF6EC] border border-[#B8964A]/30 text-xs font-semibold text-[#A8654A]">
                            {isKn ? catInfo.kn : catInfo.en}
                          </span>
                          {entryDist && (
                            <span className="text-xs font-medium text-[#5F6B62]">{entryDist}</span>
                          )}
                        </div>
                        <div className="flex items-start gap-2.5">
                          <Building2 className="w-5 h-5 text-[#B8964A] flex-shrink-0 mt-1" />
                          <h3 className="font-serif text-xl text-[#0F2A20] leading-snug break-words">
                            {entryName}
                          </h3>
                        </div>
                        {entryNotes && (
                          <p className="text-base text-[#3E4C43] leading-relaxed break-words">
                            {entryNotes}
                          </p>
                        )}
                      </div>

                      {cleanTel && (
                        <a
                          href={`tel:${cleanTel}`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F2A20] hover:bg-[#1B4332] text-[#F3EDDD] text-sm font-semibold self-start transition-colors"
                        >
                          <Phone className="w-4 h-4 text-[#D9BC7A]" />
                          <span>{entry.phone}</span>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Section 3: Safety Features (COMPLETELY HIDDEN when all checkboxes are unchecked) */}
        {enabledFeatures.length > 0 && (
          <section className={`w-full ${featuresBgClass} text-[#1A2A21] py-8 sm:py-10 border-t border-[#B8964A]/15`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
              <div className="space-y-1 max-w-2xl">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A] block">
                  {isKn ? 'ಹೋಂಸ್ಟೇ ಸೌಲಭ್ಯಗಳು' : 'On-Site Safety Measures'}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#0F2A20] font-normal flex items-center gap-2.5">
                  <ShieldCheck className="w-6 h-6 text-[#B8964A]" />
                  <span>{isKn ? 'ಲಭ್ಯವಿರುವ ಸುರಕ್ಷತಾ ವ್ಯವಸ್ಥೆಗಳು' : 'Confirmed Property Safety Features'}</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enabledFeatures.map((feat) => (
                  <div
                    key={feat.key}
                    className="bg-white rounded-2xl p-5 sm:p-6 border border-[#B8964A]/25 shadow-[0_8px_22px_rgba(15,42,32,0.05)] flex items-start gap-3.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#FAF6EC] border border-[#B8964A]/30 flex items-center justify-center text-[#B8964A] flex-shrink-0">
                      <PolicyIcon name={feat.icon} className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-serif text-lg sm:text-xl text-[#0F2A20] font-normal">
                        {isKn ? feat.title.kn : feat.title.en}
                      </h3>
                      <p className="text-sm sm:text-base text-[#3E4C43] leading-relaxed">
                        {isKn ? feat.description.kn : feat.description.en}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Contact Strip (#F1E9D8 never matches Section 1 #FAF6EC, Section 2 #DDE6D3, Section 3, or Footer #0F2A20) */}
      <PolicyContactStrip siteSettings={siteSettings} isKn={isKn} bgClass="bg-[#F1E9D8]" />
    </div>
  );
};

export default Safety;
