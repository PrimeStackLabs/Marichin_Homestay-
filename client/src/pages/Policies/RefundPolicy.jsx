import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CreditCard,
  RefreshCw,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Phone,
  Mail,
  ArrowRight,
  Info,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { PageBanner } from '../../components/Common/PageBanner';
import { DEFAULT_POLICY_SECTIONS } from '../../data/policyDefaults';
import {
  DEFAULT_DATE_CHANGE_RULE,
  DEFAULT_EARLY_DEPARTURE_RULE,
  DEFAULT_GATEWAY_FEE_NOTE,
  describeTierWindow,
  getPublicHostContact,
  normalizeCancellationTiers,
  resolvePolicyText
} from '../../utils/refundPolicy';
import {
  PolicyActionsBar,
  PolicyContactStrip,
  PolicyIcon,
  PolicyRichContent
} from '../../components/Policies/PolicyShared';

export const RefundPolicy = () => {
  const { language } = useLanguage();
  const isKn = language === 'kn';
  const { siteSettings, rooms, policySections, policiesLastUpdated } = useAdmin();

  const sortedTiers = useMemo(
    () => normalizeCancellationTiers(siteSettings?.cancellationTiers),
    [siteSettings?.cancellationTiers]
  );

  const noShowRefundPercent = Math.min(100, Math.max(0, Number(siteSettings?.noShowRefundPercent ?? 0)));
  const hostCancelsRefundPercent = Math.min(100, Math.max(0, Number(siteSettings?.hostCancelsRefundPercent ?? 100)));
  const refundTimelineText = siteSettings?.refundTimelineText || '5 to 7 working days';
  const dateChangeRuleText =
    resolvePolicyText(siteSettings?.dateChangeRule, language) ||
    resolvePolicyText(DEFAULT_DATE_CHANGE_RULE, language);
  const earlyDepartureRuleText =
    resolvePolicyText(siteSettings?.earlyDepartureRule, language) ||
    resolvePolicyText(DEFAULT_EARLY_DEPARTURE_RULE, language);
  const gatewayFeeNoteText =
    resolvePolicyText(siteSettings?.gatewayFeeNote, language) ||
    resolvePolicyText(DEFAULT_GATEWAY_FEE_NOTE, language);

  const hostContact = useMemo(() => getPublicHostContact(siteSettings), [siteSettings]);

  // Real worked calculation derived from live Standard Room tariff & first advance option
  const sampleRoom = useMemo(() => {
    if (!Array.isArray(rooms) || rooms.length === 0) return null;
    return rooms.find((r) => /standard/i.test(r.name || '')) || rooms[0];
  }, [rooms]);

  const sampleRoomName = sampleRoom?.name || 'Standard Room';
  const sampleNightTariff = Number(sampleRoom?.pricePerNight || sampleRoom?.weekdayPrice || sampleRoom?.price || 8000) || 8000;
  const sampleNights = 2;
  const sampleTotalTariff = sampleNightTariff * sampleNights;
  const advanceOptions =
    Array.isArray(siteSettings?.advanceOptions) && siteSettings.advanceOptions.length > 0
      ? siteSettings.advanceOptions
      : [20, 50, 100];
  const sampleAdvancePercent = Number(advanceOptions[0] || 20);
  const sampleAdvancePaid = Math.round((sampleTotalTariff * sampleAdvancePercent) / 100);

  const editableSections = useMemo(() => {
    const apiList = Array.isArray(policySections)
      ? policySections.filter((s) => s && s.page === 'refund')
      : [];
    const source =
      apiList.length > 0
        ? apiList
        : DEFAULT_POLICY_SECTIONS.filter((s) => s.page === 'refund');
    return [...source]
      .filter((s) => s.isVisible !== false)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [policySections]);

  const lastUpdatedValue = policiesLastUpdated || siteSettings?.policiesLastUpdated;

  // Build ordered timeline steps strictly for guest cancellation windows (no orphan trailing grid slot)
  const timelineSteps = useMemo(() => {
    const items = sortedTiers.map((tier, idx) => ({
      id: `tier-${tier.daysBeforeCheckIn}`,
      windowLabel: describeTierWindow(tier, idx, sortedTiers, language),
      refundPercent: tier.refundPercent,
      kind: tier.refundPercent >= 100 ? 'full' : tier.refundPercent > 0 ? 'partial' : 'none'
    }));

    const lowest = sortedTiers[sortedTiers.length - 1];
    if (lowest && lowest.daysBeforeCheckIn > 0) {
      items.push({
        id: 'tier-under-lowest',
        windowLabel: isKn
          ? `ಚೆಕ್-ಇನ್‌ಗಿಂತ ${lowest.daysBeforeCheckIn} ದಿನಗಳಿಗಿಂತ ಕಡಿಮೆ`
          : `Under ${lowest.daysBeforeCheckIn} day${lowest.daysBeforeCheckIn === 1 ? '' : 's'} before check-in`,
        refundPercent: 0,
        kind: 'none'
      });
    }

    return items;
  }, [sortedTiers, language, isKn]);

  const timelineColsClass =
    timelineSteps.length === 1
      ? 'grid-cols-1'
      : timelineSteps.length === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : timelineSteps.length === 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : 'grid-cols-1 md:grid-cols-3';

  return (
    <div className="min-h-screen bg-[#FAF6EC] overflow-x-clip">
      <div className="print:hidden no-print">
        <PageBanner pageKey="refund" />
      </div>

      <div id="refund-printable-doc" className="policy-printable">
        {/* Print-only Heading Header */}
        <div className="hidden print:block px-6 pt-6 pb-4 border-b border-[#B8964A]/40 bg-white text-[#1A2A21]">
          <p className="text-xs uppercase tracking-[0.2em] text-[#A8654A] font-semibold">
            Marichin Homestay • Chikkabettageri Village, Kushalnagar, Kodagu
          </p>
          <h1 className="font-serif text-3xl text-[#0F2A20] mt-1">
            {isKn ? 'ಮರುಪಾವತಿ ಮತ್ತು ರದ್ದತಿ ನೀತಿ' : 'Refund & Cancellation Policy'}
          </h1>
        </div>

        {/* Section 1: Compact Utility Bar, Visual Timeline & Worked Example (#FAF6EC matches Banner) */}
        <section className="w-full bg-[#FAF6EC] text-[#1A2A21] pt-3 pb-8 sm:pt-4 sm:pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <PolicyActionsBar
              lastUpdated={lastUpdatedValue}
              pdfElementId="refund-printable-doc"
              pdfFilename="Marichin_Homestay_Refund_Cancellation_Policy.pdf"
              isKn={isKn}
              currentPath="/refund-policy"
            />

            {/* Visual Cancellation Timeline + Symmetrical Special Cases */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#B8964A]/25 shadow-[0_10px_30px_rgba(15,42,32,0.06)] space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 border-b border-[#EFE7D4] pb-5">
                <div className="space-y-1 max-w-3xl">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A] block">
                    {isKn ? 'ದೃಶ್ಯ ವೇಳಾಪಟ್ಟಿ' : 'Cancellation Timeline'}
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#0F2A20] font-normal">
                    {isKn ? 'ರದ್ದತಿ ಸಮಯದ ಆಧಾರದ ಮೇಲೆ ಮರುಪಾವತಿ ಶೇಕಡಾವಾರು' : 'Refund Percentage by Cancellation Timing'}
                  </h2>
                </div>
                <p className="text-sm text-[#3E4C43] max-w-md leading-relaxed">
                  {isKn
                    ? 'ರದ್ದುಪಡಿಸುವ ದಿನಾಂಕ ಮತ್ತು ಚೆಕ್-ಇನ್ ದಿನಾಂಕದ (IST) ನಡುವಿನ ದಿನಗಳ ಆಧಾರದ ಮೇಲೆ ಆನ್‌ಲೈನ್ ಮುಂಗಡ ಮರುಪಾವತಿಯನ್ನು ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತದೆ.'
                    : 'Refunds are calculated on your online advance payment based on IST calendar days remaining before check-in.'}
                </p>
              </div>

              {/* Balanced Adaptive Tier Track */}
              <div className={`grid ${timelineColsClass} gap-4`}>
                {timelineSteps.map((item, idx) => {
                  const badgeStyle =
                    item.kind === 'full'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : item.kind === 'partial'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200';
                  const barColor =
                    item.refundPercent >= 100
                      ? 'bg-emerald-600'
                      : item.refundPercent > 0
                      ? 'bg-[#B8964A]'
                      : 'bg-rose-400';

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-[#FAF6EC] border border-[#EFE7D4] p-5 flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-serif text-lg font-semibold text-[#B8964A]">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${badgeStyle}`}>
                            {item.refundPercent}% {isKn ? 'ಮರುಪಾವತಿ' : 'Refund'}
                          </span>
                        </div>
                        <p className="font-serif text-lg sm:text-xl text-[#0F2A20] leading-snug">
                          {item.windowLabel}
                        </p>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-[#E5DEC9] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${Math.max(4, item.refundPercent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Symmetrical 2-Column Special Outcomes Bar (No orphan grid cells) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#EFE7D4]">
                <div className="rounded-2xl bg-[#FAF6EC]/80 border border-[#EFE7D4] px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B62]">
                      {isKn ? 'ವಿಶೇಷ ನಿಯಮ' : 'Unnotified Arrival Miss'}
                    </p>
                    <p className="font-serif text-lg text-[#0F2A20] font-normal">
                      {isKn ? 'ಹಾಜರಾಗದಿದ್ದರೆ (No-Show)' : 'No-Show on Check-In Date'}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border flex-shrink-0 ${
                      noShowRefundPercent > 0
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {noShowRefundPercent}% {isKn ? 'ಮರುಪಾವತಿ' : 'Refund'}
                  </span>
                </div>

                <div className="rounded-2xl bg-[#0F2A20] text-[#F3EDDD] px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#D9BC7A]">
                      {isKn ? 'ಆತಿಥೇಯರ ಭರವಸೆ' : 'Host Cancellation Protection'}
                    </p>
                    <p className="font-serif text-lg text-white font-normal">
                      {isKn ? 'ಆತಿಥೇಯರು ರದ್ದುಪಡಿಸಿದರೆ' : 'If the Host Cancels'}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#B8964A] text-[#0F2A20] flex-shrink-0">
                    {hostCancelsRefundPercent}% {isKn ? 'ಪೂರ್ಣ ಮರುಪಾವತಿ' : 'Full Refund'}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Worked Calculation Example */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#B8964A]/25 shadow-[0_10px_30px_rgba(15,42,32,0.06)] space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#EFE7D4] pb-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A] block">
                    {isKn ? 'ಉದಾಹರಣೆ ಲೆಕ್ಕಾಚಾರ' : 'Worked Calculation Example'}
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl text-[#0F2A20] font-normal">
                    {isKn
                      ? `${sampleRoomName} ಪ್ರಸ್ತುತ ದರದಲ್ಲಿ ಮರುಪಾವತಿ ಉದಾಹರಣೆ`
                      : `Sample Breakdown (${sampleRoomName} at ₹${sampleNightTariff.toLocaleString('en-IN')}/night)`}
                  </h2>
                </div>
                <div className="px-4 py-2 rounded-xl bg-[#FAF6EC] border border-[#B8964A]/30 text-xs sm:text-sm text-[#0F2A20] self-start lg:self-auto">
                  <span>{sampleNights} {isKn ? 'ರಾತ್ರಿ' : 'nights'}</span> ={' '}
                  <strong>₹{sampleTotalTariff.toLocaleString('en-IN')}</strong> •{' '}
                  {sampleAdvancePercent}% {isKn ? 'ಮುಂಗಡ' : 'advance'}:{' '}
                  <strong className="text-[#A8654A]">₹{sampleAdvancePaid.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sortedTiers.map((tier, idx) => {
                  const windowLabel = describeTierWindow(tier, idx, sortedTiers, language);
                  const refundedRupees = Math.round((sampleAdvancePaid * tier.refundPercent) / 100);
                  const balanceNote = sampleTotalTariff - sampleAdvancePaid;

                  return (
                    <div
                      key={tier.daysBeforeCheckIn}
                      className="rounded-2xl bg-[#FAF6EC] border border-[#EFE7D4] p-4 sm:p-5 space-y-1.5"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold text-[#0F2A20]">{windowLabel}</p>
                        <span className="text-xs font-bold text-[#B8964A]">{tier.refundPercent}%</span>
                      </div>
                      <p className="font-serif text-2xl text-[#0F2A20]">
                        ₹{refundedRupees.toLocaleString('en-IN')}
                      </p>
                      <p className="text-sm text-[#3E4C43] leading-relaxed">
                        {isKn
                          ? `₹${sampleAdvancePaid.toLocaleString('en-IN')} ಮುಂಗಡದಿಂದ ಮರುಪಾವತಿ (ಚೆಕ್-ಇನ್ ಬಾಕಿ ₹${balanceNote.toLocaleString('en-IN')} ವಿಧಿಸಲಾಗುವುದಿಲ್ಲ).`
                          : `Refunded via Razorpay from ₹${sampleAdvancePaid.toLocaleString('en-IN')} advance (₹${balanceNote.toLocaleString('en-IN')} check-in balance waived).`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Payout Method, Request Action Panel & Cohesive 2x2 Rules Matrix (#DDE6D3 band) */}
        <section className="w-full bg-[#DDE6D3] text-[#1A2A21] py-8 sm:py-12 border-t border-[#B8964A]/15">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Payout Method & Timeline */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#B8964A]/25 shadow-[0_8px_24px_rgba(15,42,32,0.06)] flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF6EC] border border-[#B8964A]/30 flex items-center justify-center text-[#B8964A] flex-shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <h2 className="font-serif text-xl sm:text-2xl text-[#0F2A20] font-normal">
                      {isKn ? 'ಮರುಪಾವತಿ ವಿಧಾನ ಮತ್ತು ಸಮಯ' : 'How Refunds Are Paid & Timeline'}
                    </h2>
                  </div>
                  <p className="text-base text-[#2B3931] leading-relaxed">
                    {isKn
                      ? 'ಅರ್ಹ ರದ್ದತಿ ಮರುಪಾವತಿಗಳನ್ನು ರೇಜರ್‌ಪೇ (Razorpay) ಮೂಲಕ ನೀವು ಪಾವತಿಸಿದ ಮೂಲ ಪಾವತಿ ವಿಧಾನಕ್ಕೆ (UPI, ಕಾರ್ಡ್ ಅಥವಾ ನೆಟ್ ಬ್ಯಾಂಕಿಂಗ್) ನೇರವಾಗಿ ಹಿಂತಿರುಗಿಸಲಾಗುತ್ತದೆ.'
                      : 'All eligible cancellation refunds are processed back to your original payment method (UPI, debit/credit card, or net banking) via Razorpay.'}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="rounded-2xl bg-[#FAF6EC] border border-[#B8964A]/25 px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-[#B8964A] flex-shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#5F6B62]">
                        {isKn ? 'ನಿರೀಕ್ಷಿತ ಸಮಯ' : 'Expected Refund Time'}
                      </span>
                    </div>
                    <span className="text-sm sm:text-base font-bold text-[#0F2A20]">
                      {refundTimelineText}
                    </span>
                  </div>
                  {gatewayFeeNoteText && (
                    <div className="rounded-xl bg-[#FAF6EC]/70 border border-[#EFE7D4] px-4 py-2.5 flex items-start gap-2 text-xs sm:text-sm text-[#3E4C43]">
                      <Info className="w-4 h-4 text-[#B8964A] flex-shrink-0 mt-0.5" />
                      <span>{gatewayFeeNoteText}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* How to Request a Cancellation */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#B8964A]/25 shadow-[0_8px_24px_rgba(15,42,32,0.06)] flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF6EC] border border-[#B8964A]/30 flex items-center justify-center text-[#B8964A] flex-shrink-0">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <h2 className="font-serif text-xl sm:text-2xl text-[#0F2A20] font-normal">
                      {isKn ? 'ರದ್ದತಿಗಾಗಿ ವಿನಂತಿಸುವುದು ಹೇಗೆ' : 'How to Request a Cancellation'}
                    </h2>
                  </div>
                  <p className="text-base text-[#2B3931] leading-relaxed">
                    {isKn
                      ? 'ರದ್ದತಿ ಅಥವಾ ದಿನಾಂಕ ಬದಲಾವಣೆಗಾಗಿ ನಿಮ್ಮ ಬುಕಿಂಗ್ ಕೋಡ್‌ನೊಂದಿಗೆ (ಉದಾ. MARICHIN-...) ನೇರವಾಗಿ ಆತಿಥೇಯರನ್ನು ಸಂಪರ್ಕಿಸಿ. ವಿನಂತಿ ಬಂದ ದಿನಾಂಕದ ಆಧಾರದ ಮೇಲೆ ಶ್ರೇಣಿಯನ್ನು ಅನ್ವಯಿಸಲಾಗುತ್ತದೆ.'
                      : 'Contact us directly with your Booking Code (for example MARICHIN-...) using any verified channel below. Your refund tier is anchored to the IST date your request arrives.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5 print:hidden no-print">
                  {hostContact.whatsapp && (
                    <a
                      href={hostContact.whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-[#1B6E3D] hover:bg-[#155930] text-white text-sm font-semibold inline-flex items-center gap-2 shadow-sm transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 flex-shrink-0" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  {hostContact.phone && (
                    <a
                      href={hostContact.telHref}
                      className="px-4 py-2.5 rounded-xl bg-[#0F2A20] hover:bg-[#1B4332] text-[#F3EDDD] text-sm font-semibold inline-flex items-center gap-2 shadow-sm transition-colors"
                    >
                      <Phone className="w-4 h-4 text-[#D9BC7A] flex-shrink-0" />
                      <span>{hostContact.phone}</span>
                    </a>
                  )}
                  {hostContact.email && (
                    <a
                      href={hostContact.emailHref}
                      className="px-4 py-2.5 rounded-xl border border-[#B8964A]/40 bg-[#FAF6EC] hover:bg-[#F1E9D8] text-[#0F2A20] text-sm font-semibold inline-flex items-center gap-2 transition-colors max-w-full"
                    >
                      <Mail className="w-4 h-4 text-[#B8964A] flex-shrink-0" />
                      <span className="break-all">{hostContact.email}</span>
                    </a>
                  )}
                  <Link
                    to="/booking/status"
                    className="px-4 py-2.5 rounded-xl border border-[#0F2A20]/20 hover:border-[#B8964A] text-[#0F2A20] text-sm font-semibold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>{isKn ? 'ನನ್ನ ಬುಕಿಂಗ್ ನೋಡಿ' : 'Check My Booking'}</span>
                    <ArrowRight className="w-4 h-4 text-[#B8964A]" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Cohesive 2x2 Hairline-Divided Rules Matrix (Eliminates uneven floating boxes) */}
            <div className="bg-white rounded-3xl border border-[#B8964A]/25 shadow-[0_10px_30px_rgba(15,42,32,0.06)] overflow-hidden grid grid-cols-1 md:grid-cols-2">
              <div className="p-6 sm:p-7 space-y-2.5 border-b border-[#EFE7D4] md:border-r">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-5 h-5 text-[#B8964A] flex-shrink-0" />
                  <h3 className="font-serif text-xl text-[#0F2A20] font-normal">
                    {isKn ? 'ದಿನಾಂಕ ಬದಲಾವಣೆ ನಿಯಮ' : 'Date Change & Rescheduling'}
                  </h3>
                </div>
                <p className="text-base text-[#2B3931] leading-relaxed">{dateChangeRuleText}</p>
              </div>

              <div className="p-6 sm:p-7 space-y-2.5 border-b border-[#EFE7D4]">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-[#B8964A] flex-shrink-0" />
                  <h3 className="font-serif text-xl text-[#0F2A20] font-normal">
                    {isKn ? 'ಹಾಜರಾಗದಿರುವುದು ಮತ್ತು ಮುಂಚಿತ ನಿರ್ಗಮನ' : 'No-Show & Early Departure'}
                  </h3>
                </div>
                <p className="text-base text-[#2B3931] leading-relaxed">
                  <strong className="text-[#0F2A20]">{isKn ? 'ಹಾಜರಾಗದಿದ್ದರೆ:' : 'No-Show:'}</strong>{' '}
                  {noShowRefundPercent}%{' '}
                  {isKn
                    ? 'ಮರುಪಾವತಿ ಅನ್ವಯಿಸುತ್ತದೆ (ನಿಗದಿತ ಚೆಕ್-ಇನ್ ದಿನದಂದು ಪೂರ್ವ ಸೂಚನೆಯಿಲ್ಲದೆ ಆಗಮಿಸದಿದ್ದರೆ).'
                    : 'refund applies if a guest fails to arrive without prior notice on check-in day.'}
                </p>
                <p className="text-base text-[#2B3931] leading-relaxed">
                  <strong className="text-[#0F2A20]">{isKn ? 'ಬೇಗನೆ ನಿರ್ಗಮನ:' : 'Early Departure:'}</strong>{' '}
                  {earlyDepartureRuleText}
                </p>
              </div>

              <div className="p-6 sm:p-7 space-y-2.5 border-b md:border-b-0 border-[#EFE7D4] md:border-r">
                <div className="flex items-center gap-2.5">
                  <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <h3 className="font-serif text-xl text-[#0F2A20] font-normal">
                    {isKn ? 'ಮರುಪಾವತಿಯಾಗದ ಸಂದರ್ಭಗಳು' : 'What Is Non-Refundable'}
                  </h3>
                </div>
                <p className="text-base text-[#2B3931] leading-relaxed">
                  {isKn
                    ? '0% ಶ್ರೇಣಿಯ ಒಳಗೆ ಬರುವ ಕೊನೆಯ ಕ್ಷಣದ ರದ್ದತಿಗಳು, ಪೂರ್ವ ಸೂಚನೆಯಿಲ್ಲದ ಹಾಜರಾಗದಿರುವಿಕೆ ಮತ್ತು ಚೆಕ್-ಇನ್ ನಂತರ ಬಳಸದ ರಾತ್ರಿಗಳು ಮರುಪಾವತಿಗೆ ಅರ್ಹವಾಗಿರುವುದಿಲ್ಲ.'
                    : 'Cancellations falling within a 0% tier window, unnotified no-shows, and unused nights following an early check-out are non-refundable.'}
                </p>
              </div>

              <div className="p-6 sm:p-7 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                  <h3 className="font-serif text-xl text-[#0F2A20] font-normal">
                    {isKn ? 'ಆತಿಥೇಯರು ರದ್ದುಪಡಿಸಿದರೆ (ಪೂರ್ಣ ಮರುಪಾವತಿ)' : 'When the Host Cancels'}
                  </h3>
                </div>
                <p className="text-base text-[#2B3931] leading-relaxed">
                  {isKn
                    ? `ಅನಿವಾರ್ಯ ಸಂದರ್ಭಗಳಿಂದಾಗಿ ಆತಿಥೇಯರು ನಿಮ್ಮ ದೃಢೀಕೃತ ಬುಕಿಂಗ್ ಅನ್ನು ರದ್ದುಪಡಿಸಬೇಕಾದರೆ, ನೀವು ಪಾವತಿಸಿದ ಆನ್‌ಲೈನ್ ಮೊತ್ತದ ${hostCancelsRefundPercent}% ಅನ್ನು ಮೂಲ ಪಾವತಿ ವಿಧಾನಕ್ಕೆ ಮರುಪಾವತಿಸಲಾಗುತ್ತದೆ.`
                    : `If the homestay host must cancel your confirmed reservation for operational reasons or booking unavailability, you receive a ${hostCancelsRefundPercent}% refund of the full amount paid online to your original payment method.`}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Admin-Editable Detailed Clauses (#FAF6EC alternating band) */}
        {editableSections.length > 0 && (
          <section className="w-full bg-[#FAF6EC] text-[#1A2A21] py-8 sm:py-10 border-t border-[#B8964A]/15">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A] block">
                    {isKn ? 'ವಿವರವಾದ ಮರುಪಾವತಿ ಷರತ್ತುಗಳು' : 'Detailed Clauses'}
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#0F2A20] font-normal">
                    {isKn ? 'ಮರುಪಾವತಿ ಮತ್ತು ರದ್ದತಿ ವಿವರಗಳು' : 'Full Refund & Cancellation Clauses'}
                  </h2>
                </div>
                <Link
                  to="/policies"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F2A20] hover:text-[#A8654A] transition-colors print:hidden no-print"
                >
                  <ShieldCheck className="w-4 h-4 text-[#B8964A]" />
                  <span>{isKn ? 'ಹೋಂಸ್ಟೇ ನಿಯಮಗಳು' : 'Homestay Policies & Terms'}</span>
                </Link>
              </div>

              <div className="bg-white rounded-3xl border border-[#B8964A]/25 shadow-[0_8px_24px_rgba(15,42,32,0.05)] divide-y divide-[#EFE7D4] overflow-hidden">
                {editableSections.map((sec, idx) => (
                  <article key={sec._id || sec.key || idx} className="p-6 sm:px-9 sm:py-7 space-y-4 policy-card">
                    <div className="flex items-start gap-3.5">
                      <span className="font-serif text-2xl font-semibold text-[#B8964A] leading-none pt-1 flex-shrink-0 w-9">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-[#FAF6EC] border border-[#B8964A]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <PolicyIcon name={sec.icon} className="w-4 h-4 text-[#B8964A]" />
                      </div>
                      <h3 className="font-serif text-xl sm:text-2xl text-[#0F2A20] font-normal leading-snug">
                        {resolvePolicyText(sec.title, language)}
                      </h3>
                    </div>
                    <div className="sm:pl-[5.5rem]">
                      <PolicyRichContent text={resolvePolicyText(sec.content, language)} />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Contact Strip (#F1E9D8 alternating before #0F2A20 Footer) */}
      <PolicyContactStrip siteSettings={siteSettings} isKn={isKn} bgClass="bg-[#F1E9D8]" />
    </div>
  );
};

export default RefundPolicy;
