import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Users,
  ShieldCheck,
  Download,
  Share2,
  Printer,
  Loader2,
  PhoneCall,
  Star,
  MapPin,
  Navigation
} from 'lucide-react';
import {
  formatDisplayDate,
  getNightsCount,
  getStayDisplayName,
  buildWhatsAppMessage,
  buildWhatsAppShareUrl
} from '../../utils/whatsappMessages';
import {
  getPublicHostContact,
  formatCancellationSummaryText
} from '../../utils/refundPolicy';

export const BookingPassCard = ({
  booking,
  siteSettings,
  isKn = false,
  showActions = true,
  id = 'booking-invoice-pass'
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const pdfContainerRef = useRef(null);

  if (!booking) return null;

  const code = booking.bookingCode || booking.bookingId || booking.id || 'MH-PASS';
  const passToken = booking.passToken || code;
  const guestName = booking.guestName || booking.guest?.fullName || booking.primaryGuest?.name || 'Valued Guest';
  const guestEmail = booking.email || booking.guest?.email || 'N/A';
  const guestPhone = booking.phone || booking.guest?.phone || 'N/A';

  const isFullHome = booking.bookingType === 'full_home';
  const stayName = getStayDisplayName(booking, isKn);
  const mealsNote = isFullHome
    ? siteSettings?.fullHomeMealsNote || (isKn ? 'ಬೆಳಗಿನ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ' : 'Morning breakfast included')
    : (isKn ? 'ಬೆಳಗಿನ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ' : 'Breakfast Included');

  const nights = getNightsCount(booking);
  const checkInFormatted = formatDisplayDate(booking.checkIn);
  const checkOutFormatted = formatDisplayDate(booking.checkOut);
  const checkInTime = siteSettings?.checkInTime || '12:00 PM';
  const checkOutTime = siteSettings?.checkOutTime || '11:00 AM';

  const adults = booking.adults ?? booking.guestCount?.adults ?? 2;
  const children = booking.children ?? booking.guestCount?.children ?? 0;

  const totalAmount = Number(
    booking.totalAmount ?? booking.pricing?.total ?? booking.pricing?.totalAmount ?? 0
  );
  const advancePaid = Number(
    booking.advancePaid ??
      (booking.amountPaidPaise ? Math.round(booking.amountPaidPaise / 100) : 0)
  );
  const balanceDue = Number(
    booking.balanceDue !== undefined
      ? booking.balanceDue
      : Math.max(0, totalAmount - advancePaid)
  );

  const baseAmount = Number(booking.pricing?.baseAmount ?? totalAmount);
  const discount = Number(booking.pricing?.discount ?? 0);
  const taxAmount = Number(booking.pricing?.taxAmount ?? 0);
  const advancePercent = booking.advanceOption ?? (totalAmount > 0 ? Math.round((advancePaid / totalAmount) * 100) : 20);

  const bookingTimestamp = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : formatDisplayDate(new Date());

  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
  const passUrl = origin ? `${origin}/pass/${passToken}` : `/pass/${passToken}`;

  // Property info
  const propName = siteSettings?.propertyName || 'Marichin Homestay';
  const propAddress = siteSettings?.address || 'Chikkabettageri Village, Gudde Hosur Post, Kushalnagar, Kodagu, Karnataka 571234';
  const stayCoordinates = {
    lat: 12.425583,
    lng: 75.911889,
    dms: "12°25'32.1\"N 75°54'42.8\"E"
  };
  const directionsUrl = (siteSettings?.googleMapsShareUrl && siteSettings.googleMapsShareUrl.trim())
    || `https://www.google.com/maps/dir/?api=1&destination=${stayCoordinates.lat},${stayCoordinates.lng}`;
  const regNumber = (siteSettings?.registrationNumber || '').trim();
  const publicContact = getPublicHostContact(siteSettings);
  const displayHostPhone = publicContact.whatsapp || publicContact.phone || '';
  const displayHostEmail = publicContact.email || '';
  const cancellationSummary = formatCancellationSummaryText(siteSettings, isKn ? 'kn' : 'en');

  // Calculate hold time if in payment_pending
  const holdTimeFormatted = booking.holdExpiresAt
    ? new Date(booking.holdExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  // Status computation (clean, accurate, no 'awaiting confirmation' for paid)
  const isPaid = booking.status === 'confirmed' || booking.status === 'paid_awaiting_confirmation' || advancePaid > 0;
  const isHoldPending = booking.status === 'payment_pending';
  const isCancelled = booking.status === 'cancelled';
  const isRejected = booking.status === 'rejected';
  const isExpired = booking.status === 'expired';
  const isCheckedIn = booking.status === 'checked_in';
  const isCheckedOut = booking.status === 'checked_out';

  // Tariff line calculation
  const tariffLineStay = isFullHome
    ? (isKn ? 'ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ (ಎಲ್ಲಾ 5 ಕೊಠಡಿಗಳು)' : 'Full Home (all 5 rooms)')
    : stayName;
  const tariffLine = `${tariffLineStay} x ${nights} ${nights > 1 ? (isKn ? 'ರಾತ್ರಿಗಳು' : 'nights') : (isKn ? 'ರಾತ್ರಿ' : 'night')}, ${checkInFormatted} ${isKn ? 'ರಿಂದ' : 'to'} ${checkOutFormatted}`;

  // PDF Generator (strict 1-page A4, 0 margin, full-bleed edge-to-edge dark green)
  const handleDownloadPdf = async () => {
    const pdfEl = pdfContainerRef.current || document.getElementById(`${id}-pdf`);
    if (!pdfEl) return;
    setIsGeneratingPdf(true);
    try {
      // 1. Wait for document fonts to be fully rendered
      if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      // 2. Ensure logo and any images inside the PDF element are completely loaded
      const images = pdfEl.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      // 3. Frame wait to ensure painting/styling is synchronized
      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 50)));

      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const opt = {
        margin: 0,
        filename: `Marichin_Homestay_Pass_${code}.pdf`,
        enableLinks: true,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          backgroundColor: '#0F2A20',
          scrollX: 0,
          scrollY: 0,
          windowWidth: 794,
          windowHeight: 1123,
          width: 794,
          height: 1122.5,
          onclone: (clonedDoc) => {
            clonedDoc.body.style.backgroundColor = '#0F2A20';
            clonedDoc.documentElement.style.backgroundColor = '#0F2A20';
            const container = clonedDoc.querySelector('.html2pdf__container');
            if (container) {
              container.style.backgroundColor = '#0F2A20';
              container.style.borderRadius = '0px';
              container.style.overflow = 'hidden';
            }
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all'] }
      };

      await html2pdf()
        .from(pdfEl)
        .set(opt)
        .toPdf()
        .get('pdf')
        .then((pdf) => {
          // Guarantee exactly 1 page
          while (pdf.getNumberOfPages() > 1) {
            pdf.deletePage(pdf.getNumberOfPages());
          }
        })
        .save();
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = buildWhatsAppMessage('booking_confirmed', booking, siteSettings, {
      language: isKn ? 'kn' : 'en',
      baseUrl: origin
    });
    const url = buildWhatsAppShareUrl(text);
    window.open(url, '_blank');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* 
        ====================================================================
        1. ON-SCREEN DISPLAY PASS CONTAINER:
        - Keeps responsive design, rounded-2xl, soft outer shadow
        - Badges and text wrapping updated to prevent any clipping on screen
        ====================================================================
      */}
      <div
        id={id}
        data-booking-pass-card="true"
        className="bg-[#0F2A20] text-[#F3EDDD] rounded-2xl border border-[#B8964A]/30 p-5 sm:p-7 shadow-2xl relative"
        style={{
          backgroundColor: '#0F2A20',
          color: '#F3EDDD',
          boxSizing: 'border-box'
        }}
      >
        {/* Header: Property & Booking Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#B8964A]/25 pb-4">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.jpeg"
              alt="Marichin Homestay Logo"
              crossOrigin="anonymous"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-[#B8964A]/40 object-cover shadow-sm flex-shrink-0"
            />
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#F3EDDD] tracking-wide leading-snug">
                {propName}
              </h2>
              <p className="text-[11px] text-[#D9BC7A] tracking-wider uppercase font-medium">
                Kushalnagar · Coorg · Karnataka
              </p>
              {regNumber && (
                <p className="text-[10px] text-[#B9C4B8] font-mono mt-0.5">
                  Govt. Tourism Reg No: {regNumber}
                </p>
              )}
            </div>
          </div>

          <div className="sm:text-right bg-[#1B4332]/80 px-3.5 py-2 rounded-xl border border-[#B8964A]/20">
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#B9C4B8] block mb-0.5">
              {isKn ? 'ಬುಕಿಂಗ್ ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ' : 'Booking Reference'}
            </span>
            <span className="text-base font-mono font-bold text-[#D9BC7A] tracking-wider block">
              {code}
            </span>
            <span className="text-[10px] text-[#B9C4B8] block mt-0.5">
              {bookingTimestamp}
            </span>
          </div>
        </div>

        {/* Status Banner */}
        <div className="my-3 p-3 rounded-xl bg-[#1B4332]/70 border border-[#B8964A]/30 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            {isPaid && (
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
            {isHoldPending && (
              <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Clock className="w-4 h-4" />
              </div>
            )}
            {(isCancelled || isRejected || isExpired) && (
              <div className="w-7 h-7 rounded-full bg-rose-500/20 border border-rose-400 flex items-center justify-center text-rose-400 flex-shrink-0">
                <XCircle className="w-4 h-4" />
              </div>
            )}
            {(isCheckedIn || isCheckedOut) && (
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block leading-snug">
                {isPaid && (isKn ? 'ಬುಕಿಂಗ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ' : 'Booking Confirmed')}
                {isHoldPending &&
                  (isKn
                    ? `ಪಾವತಿ ಬಾಕಿ ಇದೆ, ಕೊಠಡಿಗಳು ${holdTimeFormatted ? holdTimeFormatted + ' ವರೆಗೆ' : '15 ನಿಮಿಷ'} ಕಾಯ್ದಿರಿಸಲ್ಪಟ್ಟಿವೆ`
                    : `Payment pending, rooms held until ${holdTimeFormatted || 'hold expiry'}`)}
                {isCancelled && (isKn ? 'ಬುಕಿಂಗ್ ರದ್ದುಗೊಂಡಿದೆ' : 'Booking Cancelled')}
                {isRejected && (isKn ? 'ಬುಕಿಂಗ್ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ & ಮರುಪಾವತಿಸಲಾಗಿದೆ' : 'Reservation Rejected & Refunded')}
                {isExpired && (isKn ? 'ಕಾಯ್ದಿರಿಸುವಿಕೆ ಅವಧಿ ಮೀರಿದೆ' : 'Hold Expired')}
                {isCheckedIn && (isKn ? 'ಚೆಕ್-ಇನ್ ಮಾಡಲಾಗಿದೆ' : 'Checked In')}
                {isCheckedOut && (isKn ? 'ಚೆಕ್-ಔಟ್ ಮಾಡಲಾಗಿದೆ' : 'Checked Out')}
              </span>
              <span className="text-[11px] text-[#B9C4B8] font-light leading-snug block mt-0.5">
                {isPaid &&
                  (isKn
                    ? 'ನಿಮ್ಮ ಮುಂಗಡ ಪಾವತಿ ಸ್ವೀಕರಿಸಲ್ಪಟ್ಟಿದೆ. ನಿಮ್ಮ ವಾಸ್ತವ್ಯ ದೃಢೀಕರಿಸಲಾಗಿದೆ.'
                    : 'Your online payment was received. Your stay is confirmed.')}
                {isHoldPending &&
                  (isKn
                    ? 'ಕೊಠಡಿ ಕಾಯ್ದಿರಿಸುವಿಕೆಯನ್ನು ದೃಢೀಕರಿಸಲು ದಯವಿಟ್ಟು ಪಾವತಿ ಪೂರ್ಣಗೊಳಿಸಿ.'
                    : 'Please complete online payment to finalize reservation.')}
                {isCancelled &&
                  (booking.cancellationReason
                    ? `${isKn ? 'ಕಾರಣ:' : 'Reason:'} ${booking.cancellationReason}`
                    : (isKn ? 'ವಿನಂತಿಯ ಮೇರೆಗೆ ಬುಕಿಂಗ್ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.' : 'Reservation cancelled upon request.'))}
                {isRejected &&
                  (isKn
                    ? 'ದಿನಾಂಕಗಳು ಲಭ್ಯವಿಲ್ಲದ ಕಾರಣ ಪೂರ್ಣ ಮರುಪಾವತಿಯನ್ನು ಪ್ರಾರಂಭಿಸಲಾಗಿದೆ.'
                    : 'Dates unavailable. Full refund has been initiated.')}
                {isExpired &&
                  (isKn
                    ? '15 ನಿಮಿಷಗಳಲ್ಲಿ ಪಾವತಿ ಪೂರ್ಣಗೊಳ್ಳದ ಕಾರಣ ಕೊಠಡಿಗಳು ಬಿಡುಗಡೆಯಾಗಿವೆ.'
                    : '15-minute hold window expired. Dates released.')}
                {isCheckedIn && (isKn ? 'ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇಗೆ ಸುಸ್ವಾಗತ!' : 'Welcome to Marichin Homestay!')}
                {isCheckedOut && (isKn ? 'ಭೇಟಿ ನೀಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು!' : 'Thank you for staying with us!')}
              </span>
            </div>
          </div>

          {advancePaid > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/40">
              {isKn ? `ಮುಂಗಡ ಪಾವತಿ: ${advancePercent}%` : `Advance Paid: ${advancePercent}%`} (₹{advancePaid.toLocaleString('en-IN')})
            </span>
          )}
        </div>

        {/* Stay Details & QR Code Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 my-3">
          {/* Stay & Guest Details (8 cols) */}
          <div className="md:col-span-8 p-3.5 sm:p-4 rounded-xl bg-[#1B4332]/50 border border-[#B8964A]/20 space-y-3">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-[0.14em] text-[#D9BC7A] block mb-1">
                {isKn ? 'ಕಾಯ್ದಿರಿಸಲಾದ ವಾಸ್ತವ್ಯ' : 'Reserved Accommodation'}
              </span>
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#F3EDDD] leading-snug break-words">
                {stayName}
              </h3>
              {mealsNote && (
                <div className="mt-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0F2A20] text-[#D9BC7A] border border-[#B8964A]/30">
                    <Sparkles className="w-3 h-3 text-[#D9BC7A]" />
                    <span>{mealsNote}</span>
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2.5 border-t border-[#0F2A20]">
              <div>
                <span className="text-[#B9C4B8] text-[10px] block mb-0.5">{isKn ? 'ಆಗಮನ' : 'Check-In'}</span>
                <span className="font-semibold text-[#F3EDDD] text-xs sm:text-sm block leading-snug">{checkInFormatted}</span>
                <span className="text-[10px] text-[#D9BC7A] block font-mono mt-0.5">{checkInTime}</span>
              </div>
              <div>
                <span className="text-[#B9C4B8] text-[10px] block mb-0.5">{isKn ? 'ನಿರ್ಗಮನ' : 'Check-Out'}</span>
                <span className="font-semibold text-[#F3EDDD] text-xs sm:text-sm block leading-snug">{checkOutFormatted}</span>
                <span className="text-[10px] text-[#D9BC7A] block font-mono mt-0.5">{checkOutTime}</span>
              </div>
              <div>
                <span className="text-[#B9C4B8] text-[10px] block mb-0.5">{isKn ? 'ಅವಧಿ' : 'Duration'}</span>
                <span className="font-semibold text-[#F3EDDD] text-xs sm:text-sm block leading-snug">
                  {nights} {isKn ? 'ರಾತ್ರಿಗಳು' : (nights > 1 ? 'Nights' : 'Night')}
                </span>
              </div>
              <div>
                <span className="text-[#B9C4B8] text-[10px] block mb-0.5">{isKn ? 'ಅತಿಥಿಗಳು' : 'Guests'}</span>
                <span className="font-semibold text-[#F3EDDD] text-xs sm:text-sm block leading-snug">
                  {adults} {isKn ? 'ವಯಸ್ಕರು' : 'Adults'}{children > 0 ? `, ${children} ${isKn ? 'ಮಕ್ಕಳು' : 'Child'}` : ''}
                </span>
              </div>
            </div>

            {/* Guest Details with word wrapping */}
            <div className="pt-2.5 border-t border-[#0F2A20] text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="min-w-0">
                <span className="text-[#B9C4B8] text-[10px] block mb-0.5">{isKn ? 'ಮುಖ್ಯ ಅತಿಥಿ' : 'Primary Guest'}</span>
                <span className="font-semibold text-[#F3EDDD] text-xs sm:text-sm break-words block leading-snug">{guestName}</span>
              </div>
              <div className="min-w-0">
                <span className="text-[#B9C4B8] text-[10px] block mb-0.5">{isKn ? 'ಸಂಪರ್ಕ' : 'Contact'}</span>
                <span className="text-[#F3EDDD] font-medium text-xs sm:text-sm block leading-snug break-words">{guestPhone}</span>
                <span className="text-[#B9C4B8] block text-[11px] break-all mt-0.5 leading-snug">{guestEmail}</span>
              </div>
            </div>
          </div>

          {/* Verification QR Pass (4 cols) */}
          <div className="md:col-span-4 p-3.5 sm:p-4 rounded-xl bg-[#1B4332]/50 border border-[#B8964A]/30 flex flex-col items-center justify-center text-center space-y-2">
            <span className="text-[11px] uppercase font-bold tracking-[0.14em] text-[#D9BC7A]">
              {isKn ? 'ಚೆಕ್-ಇನ್ ಕ್ಯೂಆರ್ ಪಾಸ್' : 'Check-In QR Pass'}
            </span>
            
            <div className="p-2 bg-white rounded-lg shadow-md border border-[#B8964A]/30 flex items-center justify-center">
              <QRCodeSVG
                value={passUrl}
                size={105}
                level="M"
                includeMargin={false}
              />
            </div>

            <span className="text-[10px] text-[#B9C4B8] font-light leading-snug">
              {isKn ? 'ಆಗಮನದ ಸಮಯದಲ್ಲಿ ಈ ಕ್ಯೂಆರ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ' : 'Scan upon arrival at Marichin Homestay'}
            </span>
          </div>
        </div>

        {/* Financial Breakdown Table */}
        <div className="my-3 p-3.5 rounded-xl bg-[#1B4332]/50 border border-[#B8964A]/20 space-y-1.5 text-xs">
          <span className="text-[11px] uppercase font-bold tracking-[0.16em] text-[#D9BC7A] block mb-1">
            {isKn ? 'ದರ ವಿವರ ಮತ್ತು ಪಾವತಿ ಸಾರಾಂಶ' : 'Tariff Itemization & Payment Summary'}
          </span>

          <div className="flex justify-between items-baseline text-[#B9C4B8] text-xs leading-relaxed">
            <span className="pr-3 break-words flex-1">{tariffLine}</span>
            <span className="text-[#F3EDDD] font-medium flex-shrink-0 text-xs sm:text-sm">₹{baseAmount.toLocaleString('en-IN')}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-emerald-400 font-medium text-xs leading-relaxed">
              <span>{isKn ? 'ರಿಯಾಯಿತಿ ವೋಚರ್' : 'Promotional Voucher Discount'}</span>
              <span>- ₹{discount.toLocaleString('en-IN')}</span>
            </div>
          )}

          {taxAmount > 0 && (
            <div className="flex justify-between text-[#B9C4B8] text-xs leading-relaxed">
              <span>{isKn ? 'ತೆರಿಗೆಗಳು ಮತ್ತು ಶುಲ್ಕಗಳು' : 'Taxes & Fees (GST)'}</span>
              <span className="text-[#F3EDDD]">₹{taxAmount.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="pt-1.5 border-t border-[#0F2A20] flex justify-between font-serif text-xs sm:text-sm font-bold text-[#F3EDDD]">
            <span>{isKn ? 'ಒಟ್ಟು ಮೊತ್ತ' : 'Total Tariff'}</span>
            <span className="text-[#D9BC7A] text-sm sm:text-base">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>

          <div className="pt-1 flex justify-between text-xs sm:text-sm text-emerald-300 font-semibold border-t border-[#0F2A20]">
            <span>{isKn ? `ಮುಂಗಡ ಪಾವತಿಸಲಾಗಿದೆ (${advancePercent}%)` : `Advance Paid (${advancePercent}%)`}</span>
            <span>₹{advancePaid.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between text-xs sm:text-sm text-[#F3EDDD] font-bold">
            <span>{isKn ? 'ಆಗಮನದ ಸಮಯದಲ್ಲಿ ಪಾವತಿಸಬೇಕಾದ ಬಾಕಿ' : 'Balance Payable at Check-In'}</span>
            <span className="text-amber-300">₹{balanceDue.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Payment Details Box (Razorpay / Verified Transaction) */}
        {(booking.razorpayPaymentId || booking.transactionId || advancePaid > 0) && (
          <div className="my-3 p-3 sm:p-3.5 rounded-xl bg-[#0A1A13] border border-[#B8964A]/30 text-xs text-[#F3EDDD] space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-[#1B4332]">
              <span className="text-[11px] uppercase font-bold tracking-[0.14em] text-[#D9BC7A] block">
                {isKn ? 'ಪಾವತಿ ವಿವರ' : 'Payment Verification'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono font-semibold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-500/40">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{isKn ? 'ಪಾವತಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ' : 'Payment Verified'}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#B9C4B8] block mb-0.5">Payment ID</span>
                <span className="text-[#D9BC7A] font-bold break-all block leading-snug">
                  {booking.razorpayPaymentId || booking.transactionId || 'Recorded'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#B9C4B8] block mb-0.5">Amount Paid</span>
                <span className="text-white font-bold block text-xs sm:text-sm leading-snug">₹{advancePaid.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#B9C4B8] block mb-0.5">Balance Due</span>
                <span className="text-amber-300 font-bold block text-xs sm:text-sm leading-snug">₹{balanceDue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Guidelines & Location (Side by Side with equal width) */}
        <div className="pt-3 border-t border-[#B8964A]/25 text-xs text-[#B9C4B8] grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="font-semibold text-[#D9BC7A] text-xs mb-1">{isKn ? 'ಚೆಕ್-ಇನ್ ನಿಯಮಗಳು:' : 'Check-In Guidelines:'}</p>
            <p className="leading-relaxed">• {isKn ? 'ಆಗಮನದ ಸಮಯದಲ್ಲಿ ಮಾನ್ಯ ಸರ್ಕಾರಿ ಫೋಟೋ ಗುರುತಿನ ಚೀಟಿ ಕಡ್ಡಾಯ.' : 'Valid Government Photo ID required for adult guests.'}</p>
            <p className="leading-relaxed mt-0.5">• {isKn ? 'ಚೆಕ್-ಇನ್' : 'Check-In'}: {checkInTime} • {isKn ? 'ಚೆಕ್-ಔಟ್' : 'Check-Out'}: {checkOutTime}</p>
            <p className="leading-relaxed mt-0.5">
              • <Link to="/refund-policy" className="text-[#D9BC7A] underline hover:text-white print:no-underline">{isKn ? 'ರದ್ದತಿ ಮತ್ತು ಮರುಪಾವತಿ ನೀತಿ:' : 'Refund Policy:'}</Link> {cancellationSummary}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="font-semibold text-[#D9BC7A] text-xs mb-1">{isKn ? 'ವಿಳಾಸ & ಸಂಪರ್ಕ:' : 'Homestay Location & Contact:'}</p>
            {displayHostPhone && <p className="leading-relaxed">📞 {displayHostPhone}</p>}
            {displayHostEmail && <p className="leading-relaxed break-all">✉️ {displayHostEmail}</p>}
            <p className="leading-relaxed break-words mt-0.5">{propAddress}</p>
            <div className="mt-2.5 flex flex-col sm:items-end gap-1">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B8964A] hover:bg-[#D9BC7A] text-[#0F2A20] font-bold text-xs transition-colors shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{isKn ? 'ಗೂಗಲ್ ಮ್ಯಾಪ್ ದಾರಿ (Get Directions)' : 'Get Google Maps Directions'}</span>
              </a>
              <span className="text-[10px] text-[#D9BC7A] font-mono">
                📍 {stayCoordinates.dms}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 
        ====================================================================
        2. DEDICATED FULL-BLEED A4 PDF EXPORT CONTAINER:
        - Exact A4 portrait pixel size: 794px x 1122.5px
        - Full-bleed #0F2A20 to every edge, 0 border-radius, 0 margin, 0 shadow
        - Flex column with justify-between so header is top, guidelines are
          pinned to bottom, and middle blocks fill height with no gaps
        - Off-screen fixed position with opacity 1 for reliable html2canvas capture
        ====================================================================
      */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '794px',
          height: '1122.5px',
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: -9999
        }}
        aria-hidden="true"
        className="print:hidden"
      >
        <div
          id={`${id}-pdf`}
          ref={pdfContainerRef}
          style={{
            width: '794px',
            height: '1122.5px',
            backgroundColor: '#0F2A20',
            color: '#F3EDDD',
            borderRadius: '0px',
            margin: '0px',
            padding: '34px 38px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: 'none',
            boxShadow: 'none',
            fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(184, 165, 90, 0.3)', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img
                src="/images/logo.jpeg"
                alt="Marichin Homestay Logo"
                crossOrigin="anonymous"
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '9999px',
                  border: '1.5px solid rgba(184, 165, 90, 0.45)',
                  objectFit: 'cover',
                  flexShrink: 0
                }}
              />
              <div>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 'bold', color: '#F3EDDD', letterSpacing: '0.03em', lineHeight: '1.25', margin: 0 }}>
                  {propName}
                </h2>
                <p style={{ fontSize: '11px', color: '#D9BC7A', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: '500', marginTop: '3px', marginBottom: 0 }}>
                  Kushalnagar · Coorg · Karnataka
                </p>
                {regNumber && (
                  <p style={{ fontSize: '10px', color: '#B9C4B8', fontFamily: 'monospace', marginTop: '2px', marginBottom: 0 }}>
                    Govt. Tourism Reg No: {regNumber}
                  </p>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'right', backgroundColor: 'rgba(27, 67, 50, 0.85)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(184, 165, 90, 0.25)' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.16em', color: '#B9C4B8', display: 'block', marginBottom: '2px' }}>
                {isKn ? 'ಬುಕಿಂಗ್ ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ' : 'Booking Reference'}
              </span>
              <span style={{ fontSize: '18px', fontFamily: 'monospace', fontWeight: 'bold', color: '#D9BC7A', letterSpacing: '0.06em', display: 'block' }}>
                {code}
              </span>
              <span style={{ fontSize: '10px', color: '#B9C4B8', display: 'block', marginTop: '2px' }}>
                {bookingTimestamp}
              </span>
            </div>
          </div>

          {/* Status Banner */}
          <div
            style={{
              margin: '10px 0',
              padding: '10px 16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(27, 67, 50, 0.75)',
              border: '1px solid rgba(184, 165, 90, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isPaid && (
                <div style={{ width: '28px', height: '28px', borderRadius: '9999px', backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #34D399', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399', flexShrink: 0 }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                </div>
              )}
              {isHoldPending && (
                <div style={{ width: '28px', height: '28px', borderRadius: '9999px', backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '1px solid #FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FBBF24', flexShrink: 0 }}>
                  <Clock style={{ width: '16px', height: '16px' }} />
                </div>
              )}
              {(isCancelled || isRejected || isExpired) && (
                <div style={{ width: '28px', height: '28px', borderRadius: '9999px', backgroundColor: 'rgba(244, 63, 94, 0.2)', border: '1px solid #FB7185', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FB7185', flexShrink: 0 }}>
                  <XCircle style={{ width: '16px', height: '16px' }} />
                </div>
              )}
              {(isCheckedIn || isCheckedOut) && (
                <div style={{ width: '28px', height: '28px', borderRadius: '9999px', backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #34D399', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399', flexShrink: 0 }}>
                  <ShieldCheck style={{ width: '16px', height: '16px' }} />
                </div>
              )}
              <div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', lineHeight: '1.3' }}>
                  {isPaid && (isKn ? 'ಬುಕಿಂಗ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ' : 'Booking Confirmed')}
                  {isHoldPending &&
                    (isKn
                      ? `ಪಾವತಿ ಬಾಕಿ ಇದೆ, ಕೊಠಡಿಗಳು ${holdTimeFormatted ? holdTimeFormatted + ' ವರೆಗೆ' : '15 ನಿಮಿಷ'} ಕಾಯ್ದಿರಿಸಲ್ಪಟ್ಟಿವೆ`
                      : `Payment pending, rooms held until ${holdTimeFormatted || 'hold expiry'}`)}
                  {isCancelled && (isKn ? 'ಬುಕಿಂಗ್ ರದ್ದುಗೊಂಡಿದೆ' : 'Booking Cancelled')}
                  {isRejected && (isKn ? 'ಬುಕಿಂಗ್ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ & ಮರುಪಾವತಿಸಲಾಗಿದೆ' : 'Reservation Rejected & Refunded')}
                  {isExpired && (isKn ? 'ಕಾಯ್ದಿರಿಸುವಿಕೆ ಅವಧಿ ಮೀರಿದೆ' : 'Hold Expired')}
                  {isCheckedIn && (isKn ? 'ಚೆಕ್-ಇನ್ ಮಾಡಲಾಗಿದೆ' : 'Checked In')}
                  {isCheckedOut && (isKn ? 'ಚೆಕ್-ಔಟ್ ಮಾಡಲಾಗಿದೆ' : 'Checked Out')}
                </span>
                <span style={{ fontSize: '11px', color: '#B9C4B8', fontWeight: '300', display: 'block', marginTop: '2px', lineHeight: '1.3' }}>
                  {isPaid &&
                    (isKn
                      ? 'ನಿಮ್ಮ ಮುಂಗಡ ಪಾವತಿ ಸ್ವೀಕರಿಸಲ್ಪಟ್ಟಿದೆ. ನಿಮ್ಮ ವಾಸ್ತವ್ಯ ದೃಢೀಕರಿಸಲಾಗಿದೆ.'
                      : 'Your online payment was received. Your stay is confirmed.')}
                  {isHoldPending &&
                    (isKn
                      ? 'ಕೊಠಡಿ ಕಾಯ್ದಿರಿಸುವಿಕೆಯನ್ನು ದೃಢೀಕರಿಸಲು ದಯವಿಟ್ಟು ಪಾವತಿ ಪೂರ್ಣಗೊಳಿಸಿ.'
                      : 'Please complete online payment to finalize reservation.')}
                  {isCancelled &&
                    (booking.cancellationReason
                      ? `${isKn ? 'ಕಾರಣ:' : 'Reason:'} ${booking.cancellationReason}`
                      : (isKn ? 'ವಿನಂತಿಯ ಮೇರೆಗೆ ಬುಕಿಂಗ್ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.' : 'Reservation cancelled upon request.'))}
                  {isRejected &&
                    (isKn
                      ? 'ದಿನಾಂಕಗಳು ಲಭ್ಯವಿಲ್ಲದ ಕಾರಣ ಪೂರ್ಣ ಮರುಪಾವತಿಯನ್ನು ಪ್ರಾರಂಭಿಸಲಾಗಿದೆ.'
                      : 'Dates unavailable. Full refund has been initiated.')}
                  {isExpired &&
                    (isKn
                      ? '15 ನಿಮಿಷಗಳಲ್ಲಿ ಪಾವತಿ ಪೂರ್ಣಗೊಳ್ಳದ ಕಾರಣ ಕೊಠಡಿಗಳು ಬಿಡುಗಡೆಯಾಗಿವೆ.'
                      : '15-minute hold window expired. Dates released.')}
                  {isCheckedIn && (isKn ? 'ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇಗೆ ಸುಸ್ವಾಗತ!' : 'Welcome to Marichin Homestay!')}
                  {isCheckedOut && (isKn ? 'ಭೇಟಿ ನೀಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು!' : 'Thank you for staying with us!')}
                </span>
              </div>
            </div>

            {advancePaid > 0 && (
              <span style={{ padding: '4px 12px', borderRadius: '9999px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6EE7B7', fontSize: '11px', fontWeight: 'bold', border: '1px solid rgba(16, 185, 129, 0.45)', whiteSpace: 'nowrap' }}>
                {isKn ? `ಮುಂಗಡ ಪಾವತಿ: ${advancePercent}%` : `Advance Paid: ${advancePercent}%`} (₹{advancePaid.toLocaleString('en-IN')})
              </span>
            )}
          </div>

          {/* Stay & Guest Details + QR Code */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 190px', gap: '14px', margin: '10px 0' }}>
            {/* Stay & Guest Details Box */}
            <div style={{ padding: '14px 18px', borderRadius: '12px', backgroundColor: 'rgba(27, 67, 50, 0.5)', border: '1px solid rgba(184, 165, 90, 0.22)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.14em', color: '#D9BC7A', display: 'block', marginBottom: '3px' }}>
                  {isKn ? 'ಕಾಯ್ದಿರಿಸಲಾದ ವಾಸ್ತವ್ಯ' : 'Reserved Accommodation'}
                </span>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 'bold', color: '#F3EDDD', margin: 0, lineHeight: '1.3', wordBreak: 'break-word' }}>
                  {stayName}
                </h3>
                {mealsNote && (
                  <div style={{ marginTop: '5px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '500', backgroundColor: '#0F2A20', color: '#D9BC7A', border: '1px solid rgba(184, 165, 90, 0.35)' }}>
                      <Sparkles style={{ width: '12px', height: '12px', color: '#D9BC7A' }} />
                      <span>{mealsNote}</span>
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(15, 42, 32, 0.8)' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#B9C4B8', display: 'block', marginBottom: '2px' }}>{isKn ? 'ಆಗಮನ' : 'Check-In'}</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#F3EDDD', display: 'block', lineHeight: '1.3' }}>{checkInFormatted}</span>
                  <span style={{ fontSize: '10px', color: '#D9BC7A', fontFamily: 'monospace', display: 'block', marginTop: '2px' }}>{checkInTime}</span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#B9C4B8', display: 'block', marginBottom: '2px' }}>{isKn ? 'ನಿರ್ಗಮನ' : 'Check-Out'}</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#F3EDDD', display: 'block', lineHeight: '1.3' }}>{checkOutFormatted}</span>
                  <span style={{ fontSize: '10px', color: '#D9BC7A', fontFamily: 'monospace', display: 'block', marginTop: '2px' }}>{checkOutTime}</span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#B9C4B8', display: 'block', marginBottom: '2px' }}>{isKn ? 'ಅವಧಿ' : 'Duration'}</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#F3EDDD', display: 'block', lineHeight: '1.3' }}>
                    {nights} {isKn ? 'ರಾತ್ರಿಗಳು' : (nights > 1 ? 'Nights' : 'Night')}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#B9C4B8', display: 'block', marginBottom: '2px' }}>{isKn ? 'ಅತಿಥಿಗಳು' : 'Guests'}</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#F3EDDD', display: 'block', lineHeight: '1.3' }}>
                    {adults} {isKn ? 'ವಯಸ್ಕರು' : 'Adults'}{children > 0 ? `, ${children} ${isKn ? 'ಮಕ್ಕಳು' : 'Child'}` : ''}
                  </span>
                </div>
              </div>

              {/* Guest Details */}
              <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(15, 42, 32, 0.8)', display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#B9C4B8', display: 'block', marginBottom: '2px' }}>{isKn ? 'ಮುಖ್ಯ ಅತಿಥಿ' : 'Primary Guest'}</span>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#F3EDDD', display: 'block', wordBreak: 'break-word', lineHeight: '1.3' }}>{guestName}</span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#B9C4B8', display: 'block', marginBottom: '2px' }}>{isKn ? 'ಸಂಪರ್ಕ' : 'Contact'}</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#F3EDDD', display: 'block', lineHeight: '1.3', wordBreak: 'break-word' }}>{guestPhone}</span>
                  <span style={{ fontSize: '11px', color: '#B9C4B8', display: 'block', wordBreak: 'break-all', marginTop: '2px', lineHeight: '1.3' }}>{guestEmail}</span>
                </div>
              </div>
            </div>

            {/* Verification QR Pass */}
            <div style={{ padding: '14px 12px', borderRadius: '12px', backgroundColor: 'rgba(27, 67, 50, 0.5)', border: '1px solid rgba(184, 165, 90, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.14em', color: '#D9BC7A' }}>
                {isKn ? 'ಚೆಕ್-ಇನ್ ಕ್ಯೂಆರ್ ಪಾಸ್' : 'Check-In QR Pass'}
              </span>

              <div style={{ padding: '7px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid rgba(184, 165, 90, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QRCodeSVG
                  value={passUrl}
                  size={110}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <span style={{ fontSize: '10px', color: '#B9C4B8', fontWeight: '300', lineHeight: '1.3' }}>
                {isKn ? 'ಆಗಮನದ ಸಮಯದಲ್ಲಿ ಈ ಕ್ಯೂಆರ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ' : 'Scan upon arrival at Marichin Homestay'}
              </span>
            </div>
          </div>

          {/* Tariff Itemization & Payment Summary */}
          <div
            style={{
              margin: '10px 0',
              padding: '12px 18px',
              borderRadius: '12px',
              backgroundColor: 'rgba(27, 67, 50, 0.5)',
              border: '1px solid rgba(184, 165, 90, 0.22)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.16em', color: '#D9BC7A', display: 'block', marginBottom: '2px' }}>
              {isKn ? 'ದರ ವಿವರ ಮತ್ತು ಪಾವತಿ ಸಾರಾಂಶ' : 'Tariff Itemization & Payment Summary'}
            </span>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '12px', color: '#B9C4B8', lineHeight: '1.4' }}>
              <span style={{ paddingRight: '12px', wordBreak: 'break-word', flex: 1 }}>{tariffLine}</span>
              <span style={{ color: '#F3EDDD', fontWeight: '500', flexShrink: 0, fontSize: '13px' }}>₹{baseAmount.toLocaleString('en-IN')}</span>
            </div>

            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#34D399', fontWeight: '500', lineHeight: '1.4' }}>
                <span>{isKn ? 'ರಿಯಾಯಿತಿ ವೋಚರ್' : 'Promotional Voucher Discount'}</span>
                <span>- ₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}

            {taxAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#B9C4B8', lineHeight: '1.4' }}>
                <span>{isKn ? 'ತೆರಿಗೆಗಳು ಮತ್ತು ಶುಲ್ಕಗಳು' : 'Taxes & Fees (GST)'}</span>
                <span style={{ color: '#F3EDDD' }}>₹{taxAmount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div style={{ paddingTop: '6px', borderTop: '1px solid rgba(15, 42, 32, 0.8)', display: 'flex', justifyContent: 'space-between', fontFamily: 'Georgia, serif', fontSize: '15px', fontWeight: 'bold', color: '#F3EDDD' }}>
              <span>{isKn ? 'ಒಟ್ಟು ಮೊತ್ತ' : 'Total Tariff'}</span>
              <span style={{ color: '#D9BC7A', fontSize: '16px' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ paddingTop: '4px', borderTop: '1px solid rgba(15, 42, 32, 0.8)', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6EE7B7', fontWeight: '600' }}>
              <span>{isKn ? `ಮುಂಗಡ ಪಾವತಿಸಲಾಗಿದೆ (${advancePercent}%)` : `Advance Paid (${advancePercent}%)`}</span>
              <span style={{ fontSize: '14px' }}>₹{advancePaid.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#F3EDDD', fontWeight: 'bold' }}>
              <span>{isKn ? 'ಆಗಮನದ ಸಮಯದಲ್ಲಿ ಪಾವತಿಸಬೇಕಾದ ಬಾಕಿ' : 'Balance Payable at Check-In'}</span>
              <span style={{ color: '#FCD34D', fontSize: '15px' }}>₹{balanceDue.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payment Details Box (Payment Verification) */}
          {(booking.razorpayPaymentId || booking.transactionId || advancePaid > 0) && (
            <div
              style={{
                margin: '10px 0',
                padding: '12px 18px',
                borderRadius: '12px',
                backgroundColor: '#0A1A13',
                border: '1px solid rgba(184, 165, 90, 0.35)',
                color: '#F3EDDD'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '8px',
                  marginBottom: '8px',
                  borderBottom: '1px solid rgba(27, 67, 50, 0.8)'
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    letterSpacing: '0.14em',
                    color: '#D9BC7A'
                  }}
                >
                  {isKn ? 'ಪಾವತಿ ವಿವರ' : 'Payment Verification'}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: '600',
                    color: '#6EE7B7',
                    backgroundColor: 'rgba(6, 78, 59, 0.8)',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(16, 185, 129, 0.45)'
                  }}
                >
                  <CheckCircle2 style={{ width: '13px', height: '13px', color: '#34D399' }} />
                  <span>{isKn ? 'ಪಾವತಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ' : 'Payment Verified'}</span>
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.6fr 1fr 1fr',
                  gap: '12px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  lineHeight: '1.4'
                }}
              >
                <div>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#B9C4B8', display: 'block', marginBottom: '2px' }}>
                    Payment ID
                  </span>
                  <span style={{ color: '#D9BC7A', fontWeight: 'bold', wordBreak: 'break-all', display: 'block', fontSize: '12px' }}>
                    {booking.razorpayPaymentId || booking.transactionId || 'Recorded'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#B9C4B8', display: 'block', marginBottom: '2px' }}>
                    Amount Paid
                  </span>
                  <span style={{ color: '#FFFFFF', fontWeight: 'bold', display: 'block', fontSize: '14px' }}>
                    ₹{advancePaid.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#B9C4B8', display: 'block', marginBottom: '2px' }}>
                    Balance Due
                  </span>
                  <span style={{ color: '#FCD34D', fontWeight: 'bold', display: 'block', fontSize: '14px' }}>
                    ₹{balanceDue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Guidelines & Location Pinned at Bottom */}
          <div
            style={{
              paddingTop: '12px',
              borderTop: '1px solid rgba(184, 165, 90, 0.3)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              fontSize: '12px',
              lineHeight: '1.45',
              color: '#B9C4B8'
            }}
          >
            <div>
              <p style={{ fontWeight: '600', color: '#D9BC7A', marginBottom: '4px', fontSize: '12px' }}>
                {isKn ? 'ಚೆಕ್-ಇನ್ ನಿಯಮಗಳು:' : 'Check-In Guidelines:'}
              </p>
              <p style={{ margin: 0 }}>
                • {isKn ? 'ಆಗಮನದ ಸಮಯದಲ್ಲಿ ಮಾನ್ಯ ಸರ್ಕಾರಿ ಫೋಟೋ ಗುರುತಿನ ಚೀಟಿ ಕಡ್ಡಾಯ.' : 'Valid Government Photo ID required for adult guests.'}
              </p>
              <p style={{ margin: '2px 0 0 0' }}>
                • {isKn ? 'ಚೆಕ್-ಇನ್' : 'Check-In'}: {checkInTime} • {isKn ? 'ಚೆಕ್-ಔಟ್' : 'Check-Out'}: {checkOutTime}
              </p>
              <p style={{ margin: '2px 0 0 0' }}>
                • {isKn ? 'ರದ್ದತಿ ನೀತಿ' : 'Cancellation'}: {cancellationSummary}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: '600', color: '#D9BC7A', marginBottom: '4px', fontSize: '12px' }}>
                {isKn ? 'ವಿಳಾಸ & ಸಂಪರ್ಕ:' : 'Homestay Location & Contact:'}
              </p>
              {displayHostPhone && (
                <p style={{ margin: 0 }}>
                  📞 {displayHostPhone}
                </p>
              )}
              {displayHostEmail && (
                <p style={{ margin: '2px 0 0 0', wordBreak: 'break-word' }}>
                  ✉️ {displayHostEmail}
                </p>
              )}
              <p style={{ margin: '2px 0 0 0', wordBreak: 'break-word' }}>
                {propAddress}
              </p>
              <div style={{ marginTop: '8px' }}>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#B8964A',
                    color: '#0F2A20',
                    fontSize: '11px',
                    fontWeight: '700',
                    textDecoration: 'none',
                    letterSpacing: '0.02em'
                  }}
                >
                  📍 {isKn ? 'ಗೂಗಲ್ ಮ್ಯಾಪ್ ದಾರಿ (Get Directions)' : 'Get Google Maps Directions'}
                </a>
                <p style={{ margin: '3px 0 0 0', fontSize: '9.5px', color: '#D9BC7A', fontFamily: 'monospace' }}>
                  GPS: {stayCoordinates.dms}
                </p>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: '8.5px',
                    color: '#B9C4B8',
                    textDecoration: 'underline',
                    wordBreak: 'break-all',
                    display: 'block'
                  }}
                >
                  {directionsUrl}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons (Excluded from Print & PDF) */}
      {showActions && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 print:hidden no-print">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white border border-[#B8964A]/30 text-xs font-semibold text-[#0F2A20] hover:bg-[#FAF6EC] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin text-[#B8964A]" /> : <Download className="w-4 h-4 text-[#B8964A]" />}
              <span>{isKn ? 'ಪಿಡಿಎಫ್ ಡೌನ್‌ಲೋಡ್' : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                document.body.classList.add('print-booking-pass');
                const cleanup = () => {
                  document.body.classList.remove('print-booking-pass');
                  window.removeEventListener('afterprint', cleanup);
                };
                window.addEventListener('afterprint', cleanup);
                window.print();
                setTimeout(cleanup, 1500);
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white border border-[#B8964A]/30 text-xs font-semibold text-[#0F2A20] hover:bg-[#FAF6EC] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#B8964A]" />
              <span>{isKn ? 'ಮುದ್ರಿಸಿ' : 'Print Pass'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/40 text-xs font-semibold text-[#0F2A20] hover:bg-[#25D366]/20 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#25D366]" />
              <span>{isKn ? 'WhatsApp ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ' : 'Share on WhatsApp'}</span>
            </button>

            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white border border-[#B8964A]/30 text-xs font-semibold text-[#0F2A20] hover:bg-[#FAF6EC] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-[#B8964A]" />
              <span>{isKn ? 'ಗೂಗಲ್ ಮ್ಯಾಪ್ ದಾರಿ' : 'Google Maps Directions'}</span>
            </a>

            {isPaid && (
              <Link
                to={`/reviews?action=write&name=${encodeURIComponent(guestName !== 'Valued Guest' ? guestName : '')}&room=${encodeURIComponent(stayName)}`}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] text-xs font-bold text-[#0F2A20] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Star className="w-4 h-4 fill-[#0F2A20] text-[#0F2A20]" />
                <span>{isKn ? 'ಅನುಭವ ಹಂಚಿಕೊಳ್ಳಿ' : 'Rate & Review Stay'}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
