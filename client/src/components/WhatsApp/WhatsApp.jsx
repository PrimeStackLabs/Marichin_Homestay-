import React from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useLanguage } from '../../context/LanguageContext';
import { getPublicHostContact } from '../../utils/refundPolicy';

export const WhatsApp = () => {
  const { siteSettings } = useAdmin();
  const { language } = useLanguage();
  const isKn = language === 'kn';

  const contact = getPublicHostContact(siteSettings);
  if (!contact.whatsappDigits) {
    return null;
  }

  const resolvedDisplay = contact.whatsapp;
  const cleanNumber = contact.whatsappDigits;

  const defaultMessage = encodeURIComponent(
    isKn
      ? "ನಮಸ್ಕಾರ ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇ! ನಾನು ವೆಬ್‌ಸೈಟ್ ನೋಡುತ್ತಿದ್ದೇನೆ ಮತ್ತು ಕೊಠಡಿ ಲಭ್ಯತೆ ಹಾಗೂ ವಿವರಗಳನ್ನು ತಿಳಿಯಲು ಬಯಸುತ್ತೇನೆ."
      : "Hello Marichin Homestay! I am visiting your website and would like to enquire about room availability and packages."
  );

  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${defaultMessage}`;

  return (
    <div className="fixed bottom-6 right-5 sm:right-6 z-40 print:hidden">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[#25D366] to-[#1EBE5D] hover:from-[#2BF074] hover:to-[#22CC64] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(37,211,102,0.4)] hover:shadow-[0_12px_32px_rgba(37,211,102,0.55)] hover:scale-110 active:scale-95 transition-all duration-300 group border-2 border-[#0F2A20]"
        title={isKn ? `WhatsApp ನಲ್ಲಿ ಚಾಟ್ ಮಾಡಿ (${resolvedDisplay})` : `Chat on WhatsApp (${resolvedDisplay})`}
        aria-label={`Direct WhatsApp Enquiry ${resolvedDisplay}`}
      >
        {/* Official WhatsApp SVG Icon */}
        <svg
          className="w-7 h-7 fill-current drop-shadow-sm group-hover:rotate-6 transition-transform duration-300"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>

        {/* Pulsing Online Status Indicator */}
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0F2A20] rounded-full animate-ping" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0F2A20] rounded-full" />

        {/* Hover Tooltip (cleanly on left) */}
        <span className="hidden sm:group-hover:block absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-[#0F2A20] text-[#D9BC7A] text-xs px-3 py-1.5 rounded-lg border border-[#B8964A]/30 shadow-2xl pointer-events-none transition-all">
          {isKn ? `WhatsApp ಚಾಟ್ · ${resolvedDisplay}` : `WhatsApp Host · ${resolvedDisplay}`}
        </span>
      </a>
    </div>
  );
};

