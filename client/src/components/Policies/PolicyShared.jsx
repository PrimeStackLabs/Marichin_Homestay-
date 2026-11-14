import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Clock,
  UserCheck,
  Home,
  Users,
  UtensilsCrossed,
  AlertTriangle,
  CloudRain,
  RefreshCw,
  PhoneCall,
  ShieldAlert,
  Database,
  ShieldCheck,
  Lock,
  FileText,
  HeartPulse,
  Flame,
  Video,
  Sun,
  Car,
  Calendar,
  Printer,
  Download,
  Loader2,
  Phone,
  MessageCircle,
  Mail,
  ChevronRight
} from 'lucide-react';
import {
  formatPolicyLastUpdated,
  getPublicHostContact
} from '../../utils/refundPolicy';
import { downloadPolicyPdf } from '../../utils/policyPdf';

export const PolicyIcon = ({ name, className = 'w-5 h-5' }) => {
  switch (name) {
    case 'CreditCard': return <CreditCard className={className} />;
    case 'Clock': return <Clock className={className} />;
    case 'UserCheck': return <UserCheck className={className} />;
    case 'Home': return <Home className={className} />;
    case 'Users': return <Users className={className} />;
    case 'UtensilsCrossed': return <UtensilsCrossed className={className} />;
    case 'AlertTriangle': return <AlertTriangle className={className} />;
    case 'CloudRain': return <CloudRain className={className} />;
    case 'RefreshCw': return <RefreshCw className={className} />;
    case 'PhoneCall': return <PhoneCall className={className} />;
    case 'ShieldAlert': return <ShieldAlert className={className} />;
    case 'Database': return <Database className={className} />;
    case 'ShieldCheck': return <ShieldCheck className={className} />;
    case 'Lock': return <Lock className={className} />;
    case 'HeartPulse': return <HeartPulse className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'Video': return <Video className={className} />;
    case 'Sun': return <Sun className={className} />;
    case 'Car': return <Car className={className} />;
    case 'FileText':
    default:
      return <FileText className={className} />;
  }
};

/**
 * Renders newline-delimited prose & "- " bullet items safely at >=16px body size.
 */
export const PolicyRichContent = ({ text = '' }) => {
  if (!text) return null;
  const lines = String(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const blocks = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push({ type: 'list', items: [...currentList] });
      currentList = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith('- ') || line.startsWith('• ')) {
      currentList.push(line.slice(2).trim());
    } else {
      flushList();
      blocks.push({ type: 'p', text: line });
    }
  }
  flushList();

  return (
    <div className="space-y-3">
      {blocks.map((block, bIdx) => {
        if (block.type === 'p') {
          return (
            <p key={bIdx} className="text-base sm:text-[17px] text-[#2B3931] leading-[1.7] font-normal">
              {block.text}
            </p>
          );
        }

        return (
          <ul key={bIdx} className="space-y-2.5 pl-0.5">
            {block.items.map((item, iIdx) => {
              const colonIdx = item.indexOf(':');
              const hasLeadLabel = colonIdx > 1 && colonIdx <= 42;
              return (
                <li
                  key={iIdx}
                  className="flex items-start gap-3 text-base sm:text-[17px] text-[#2B3931] leading-[1.7]"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#B8964A] flex-shrink-0 mt-[11px]"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 break-words">
                    {hasLeadLabel ? (
                      <>
                        <strong className="font-semibold text-[#0F2A20]">
                          {item.slice(0, colonIdx + 1)}
                        </strong>
                        {item.slice(colonIdx + 1)}
                      </>
                    ) : (
                      item
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        );
      })}
    </div>
  );
};

/**
 * Compact architectural policy utility bar: Last updated date, page switcher tabs, Print & PDF Download.
 */
export const PolicyActionsBar = ({
  lastUpdated,
  pdfElementId,
  pdfFilename,
  isKn = false,
  currentPath = '/policies'
}) => {
  const [downloading, setDownloading] = useState(false);
  const formattedDate = formatPolicyLastUpdated(lastUpdated, isKn ? 'kn' : 'en');

  const navLinks = [
    { to: '/policies', label: isKn ? 'ನಿಯಮಗಳು' : 'Policies & Terms' },
    { to: '/refund-policy', label: isKn ? 'ಮರುಪಾವತಿ ನೀತಿ' : 'Refund Policy' },
    { to: '/privacy', label: isKn ? 'ಗೌಪ್ಯತಾ ನೀತಿ' : 'Privacy Policy' },
    { to: '/safety', label: isKn ? 'ಸುರಕ್ಷತೆ' : 'Safety' }
  ];

  const handlePdf = async () => {
    if (!pdfElementId || downloading) return;
    setDownloading(true);
    try {
      await downloadPolicyPdf(pdfElementId, pdfFilename);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-[#B8964A]/25 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-[0_4px_20px_rgba(15,42,32,0.04)] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2.5 min-w-0">
        {formattedDate && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FAF6EC] border border-[#B8964A]/25 text-xs font-semibold text-[#0F2A20]">
            <Calendar className="w-3.5 h-3.5 text-[#B8964A] flex-shrink-0" />
            <span>
              {isKn ? 'ನವೀಕರಿಸಲಾಗಿದೆ:' : 'Updated:'} {formattedDate}
            </span>
          </span>
        )}

        <nav
          aria-label={isKn ? 'ನೀತಿ ಪುಟಗಳು' : 'Policy documents'}
          className="flex flex-wrap items-center gap-1.5 print:hidden no-print"
        >
          {navLinks.map((lnk) => {
            const active = lnk.to === currentPath;
            return (
              <Link
                key={lnk.to}
                to={lnk.to}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#0F2A20] text-[#D9BC7A] shadow-sm'
                    : 'bg-[#FAF6EC] text-[#2B3931] border border-[#EFE7D4] hover:border-[#B8964A]/50 hover:text-[#0F2A20]'
                }`}
              >
                {lnk.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-wrap items-center gap-2 print:hidden no-print flex-shrink-0">
        <button
          type="button"
          onClick={() => window.print()}
          className="px-3.5 py-1.5 rounded-lg border border-[#B8964A]/35 bg-[#FAF6EC] hover:bg-[#F1E9D8] text-[#0F2A20] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-[#B8964A]" />
          <span>{isKn ? 'ಮುದ್ರಿಸಿ' : 'Print'}</span>
        </button>

        {pdfElementId && (
          <button
            type="button"
            onClick={handlePdf}
            disabled={downloading}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] text-[#0F2A20] text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>
              {downloading
                ? (isKn ? 'ರಚಿಸಲಾಗುತ್ತಿದೆ...' : 'Preparing...')
                : (isKn ? 'ಪಿಡಿಎಫ್ ಡೌನ್‌ಲೋಡ್' : 'Download PDF')}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Sticky left Table of Contents on desktop with compact sibling links & quick actions;
 * dropdown selector on mobile (< lg).
 */
export const StickyPolicyToc = ({
  items = [],
  activeId = '',
  onSelect,
  isKn = false,
  currentPath = '/policies',
  pdfElementId = '',
  pdfFilename = ''
}) => {
  const [downloading, setDownloading] = useState(false);

  if (!Array.isArray(items) || items.length === 0) return null;

  const handleJump = (id) => {
    if (!id) return;
    if (onSelect) onSelect(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  const handlePdf = async () => {
    if (!pdfElementId || downloading) return;
    setDownloading(true);
    try {
      await downloadPolicyPdf(pdfElementId, pdfFilename);
    } finally {
      setDownloading(false);
    }
  };

  const relatedDocs = [
    { to: '/policies', label: isKn ? 'ಹೋಂಸ್ಟೇ ನಿಯಮಗಳು' : 'Policies & Terms' },
    { to: '/refund-policy', label: isKn ? 'ಮರುಪಾವತಿ ನೀತಿ' : 'Refund & Cancellation' },
    { to: '/privacy', label: isKn ? 'ಗೌಪ್ಯತಾ ನೀತಿ' : 'Privacy Policy' },
    { to: '/safety', label: isKn ? 'ಸುರಕ್ಷತಾ ಮಾಹಿತಿ' : 'Safety & Emergency' }
  ].filter((d) => d.to !== currentPath);

  return (
    <>
      {/* Mobile Dropdown (< lg) */}
      <div className="lg:hidden mb-5 print:hidden no-print">
        <div className="bg-white rounded-2xl p-3.5 border border-[#B8964A]/25 shadow-sm">
          <label
            htmlFor="policy-toc-select"
            className="block text-[11px] font-bold uppercase tracking-wider text-[#A8654A] mb-1.5"
          >
            {isKn ? 'ವಿಭಾಗಕ್ಕೆ ತೆರಳಿ' : 'Jump to Section'}
          </label>
          <select
            id="policy-toc-select"
            value={activeId || items[0]?.id || ''}
            onChange={(e) => handleJump(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EC] border border-[#B8964A]/35 text-sm sm:text-base text-[#0F2A20] font-semibold focus:outline-none focus:border-[#B8964A]"
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.numberLabel}. {item.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop Sticky TOC (lg+) */}
      <aside className="hidden lg:block lg:sticky lg:top-24 print:hidden no-print space-y-4">
        <nav
          aria-label={isKn ? 'ವಿಷಯ ಸೂಚಿ' : 'Table of Contents'}
          className="bg-white rounded-2xl border border-[#B8964A]/25 p-4 shadow-[0_8px_24px_rgba(15,42,32,0.06)] space-y-2.5"
        >
          <div className="pb-2.5 border-b border-[#EFE7D4] flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A8654A] block">
                {isKn ? 'ವಿಷಯ ಸೂಚಿ' : 'Index'}
              </span>
              <p className="font-serif text-base font-semibold text-[#0F2A20]">
                {isKn ? 'ಈ ಪುಟದ ವಿಭಾಗಗಳು' : 'On This Page'}
              </p>
            </div>
            <span className="text-[11px] font-mono font-semibold text-[#5F6B62] bg-[#FAF6EC] px-2 py-0.5 rounded-md border border-[#EFE7D4]">
              {items.length}
            </span>
          </div>

          <ul className="space-y-0.5">
            {items.map((item) => {
              const isActive = activeId === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleJump(item.id);
                    }}
                    className={`flex items-start gap-2 px-2.5 py-2 rounded-xl text-[13px] transition-all border-l-2 ${
                      isActive
                        ? 'bg-[#FAF6EC] border-[#B8964A] text-[#0F2A20] font-semibold'
                        : 'border-transparent text-[#3E4C43] hover:bg-[#FAF6EC]/70 hover:text-[#0F2A20]'
                    }`}
                  >
                    <span
                      className={`font-mono text-[11px] font-bold mt-0.5 flex-shrink-0 ${
                        isActive ? 'text-[#A8654A]' : 'text-[#B8964A]'
                      }`}
                    >
                      {item.numberLabel}
                    </span>
                    <span className="leading-snug min-w-0 break-words">{item.title}</span>
                  </a>
                </li>
              );
            })}
          </ul>

          {pdfElementId && (
            <div className="pt-2.5 border-t border-[#EFE7D4] flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#EFE7D4] bg-[#FAF6EC] hover:bg-[#F1E9D8] text-[#0F2A20] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#B8964A]" />
                <span>{isKn ? 'ಮುದ್ರಿಸಿ' : 'Print'}</span>
              </button>
              <button
                type="button"
                onClick={handlePdf}
                disabled={downloading}
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#0F2A20] hover:bg-[#1B4332] text-[#F3EDDD] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
              >
                {downloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-[#D9BC7A]" />
                )}
                <span>{isKn ? 'PDF' : 'PDF'}</span>
              </button>
            </div>
          )}
        </nav>

        {/* Compact Related Policies Directory inside sticky rail */}
        <div className="bg-[#FAF6EC]/90 rounded-2xl border border-[#B8964A]/25 p-4 space-y-2 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#A8654A]">
            {isKn ? 'ಇತರ ದಾಖಲೆಗಳು' : 'Other Policy Docs'}
          </p>
          <ul className="space-y-1">
            {relatedDocs.map((doc) => (
              <li key={doc.to}>
                <Link
                  to={doc.to}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#0F2A20] hover:bg-white transition-colors"
                >
                  <span>{doc.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#B8964A] flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
};

/**
 * Balanced end-of-page "Questions? Contact us" strip backed strictly by non-placeholder Site Settings.
 */
export const PolicyContactStrip = ({
  siteSettings = {},
  isKn = false,
  bgClass = 'bg-[#F1E9D8]'
}) => {
  const contact = getPublicHostContact(siteSettings);

  return (
    <section className={`w-full ${bgClass} text-[#1A2A21] py-8 sm:py-10 border-t border-[#B8964A]/20 print:hidden no-print`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#B8964A]/25 shadow-[0_8px_28px_rgba(15,42,32,0.06)] grid grid-cols-1 lg:grid-cols-12 items-center gap-6">
          <div className="lg:col-span-6 space-y-1.5 min-w-0">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A] block">
              {isKn ? 'ನೇರ ಸಹಾಯ' : 'Host Assistance'}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#0F2A20] font-normal">
              {isKn ? 'ಪ್ರಶ್ನೆಗಳಿವೆಯೇ? ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ' : 'Questions? Contact us'}
            </h2>
            <p className="text-base text-[#3E4C43] leading-relaxed">
              {isKn
                ? 'ನೀತಿಗಳು, ಚೆಕ್-ಇನ್ ಸಮಯ ಅಥವಾ ಮರುಪಾವತಿಗಳ ಬಗ್ಗೆ ಯಾವುದೇ ಸ್ಪಷ್ಟನೆ ಬೇಕಿದ್ದರೆ ದಯವಿಟ್ಟು ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸಿ.'
                : 'Need clarification on house rules, arrival timings, or cancellation eligibility? Reach our host team directly.'}
            </p>
          </div>

          <div className="lg:col-span-6 flex flex-wrap items-center gap-2.5 lg:justify-end min-w-0">
            {contact.whatsapp && (
              <a
                href={contact.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-[#1B6E3D] hover:bg-[#155930] text-white text-sm font-semibold inline-flex items-center gap-2 shadow-sm transition-colors"
              >
                <MessageCircle className="w-4 h-4 flex-shrink-0" />
                <span>WhatsApp</span>
              </a>
            )}

            {contact.phone && (
              <a
                href={contact.telHref}
                className="px-4 py-2.5 rounded-xl bg-[#0F2A20] hover:bg-[#1B4332] text-[#F3EDDD] text-sm font-semibold inline-flex items-center gap-2 shadow-sm transition-colors"
              >
                <Phone className="w-4 h-4 text-[#D9BC7A] flex-shrink-0" />
                <span>{contact.phone}</span>
              </a>
            )}

            {contact.email && (
              <a
                href={contact.emailHref}
                className="px-4 py-2.5 rounded-xl border border-[#B8964A]/40 bg-[#FAF6EC] hover:bg-[#F1E9D8] text-[#0F2A20] text-sm font-semibold inline-flex items-center gap-2 transition-colors max-w-full"
              >
                <Mail className="w-4 h-4 text-[#B8964A] flex-shrink-0" />
                <span className="break-all">{contact.email}</span>
              </a>
            )}

            <Link
              to="/contact"
              className="px-4 py-2.5 rounded-xl border border-[#0F2A20]/20 bg-white hover:border-[#B8964A] text-[#0F2A20] text-sm font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <span>{isKn ? 'ಸಂಪರ್ಕ ಪುಟ' : 'Contact Page'}</span>
              <ChevronRight className="w-4 h-4 text-[#B8964A]" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

