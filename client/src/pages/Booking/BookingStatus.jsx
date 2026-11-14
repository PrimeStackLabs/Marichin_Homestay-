import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { api } from '../../services/api';
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Users,
  CreditCard,
  PhoneCall,
  Printer,
  Loader2,
  ArrowRight,
  Home,
  FileText,
  Star
} from 'lucide-react';
import {
  buildWhatsAppMessage,
  buildWhatsAppShareUrl
} from '../../utils/whatsappMessages';
import {
  calculateTierRefund,
  formatCancellationSummaryText,
  getPublicHostContact
} from '../../utils/refundPolicy';
import { getRoomTotalUnits, buildFullHomeBreakdown } from '../../utils/homestayFormatting';

export const BookingStatus = () => {
  const { t, language } = useLanguage();
  const isKn = language === 'kn';
  const { siteSettings, rooms } = useAdmin();
  const [searchParams, setSearchParams] = useSearchParams();

  const [code, setCode] = useState(searchParams.get('code') || '');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const fetchStatus = async (searchCode, searchPhone) => {
    const trimmedCode = (searchCode || '').trim();
    if (!trimmedCode) {
      setError(isKn ? 'ದಯವಿಟ್ಟು ಬುಕಿಂಗ್ ಕೋಡ್ ನಮೂದಿಸಿ.' : 'Please enter your booking reference code.');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const res = await api.getBookingStatus(trimmedCode, (searchPhone || '').trim());
      if (res.success && res.data?.booking) {
        setBooking(res.data.booking);
      } else {
        setError(res.message || (isKn ? 'ಬುಕಿಂಗ್ ವಿವರಗಳು ಕಂಡುಬಂದಿಲ್ಲ.' : 'Booking details not found.'));
        setBooking(null);
      }
    } catch (err) {
      setError(
        err.message ||
          (isKn
            ? 'ಬುಕಿಂಗ್ ಹುಡುಕಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಕೋಡ್ ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಹೋಸ್ಟ್ ಅನ್ನು ಸಂಪರ್ಕಿಸಿ.'
            : 'Could not locate your reservation. Please verify your reference code or contact the host.')
      );
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialCode = searchParams.get('code');
    const initialPhone = searchParams.get('phone');
    if (initialCode) {
      setCode(initialCode);
      if (initialPhone) setPhone(initialPhone);
      fetchStatus(initialCode, initialPhone);
    }
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (code) {
      setSearchParams({ code: code.trim(), ...(phone.trim() && { phone: phone.trim() }) });
      fetchStatus(code, phone);
    }
  };

  const getStatusBadge = (status, paymentStatus) => {
    switch (status) {
      case 'confirmed':
        return {
          bg: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
          icon: CheckCircle2,
          text: isKn ? 'ಬುಕಿಂಗ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ' : 'Booking Confirmed',
          desc: isKn ? 'ನಿಮ್ಮ ವಾಸ್ತವ್ಯ ದೃಢೀಕರಿಸಲ್ಪಟ್ಟಿದೆ.' : 'Your reservation is confirmed. We look forward to hosting you.'
        };
      case 'paid_awaiting_confirmation':
        return {
          bg: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
          icon: CheckCircle2,
          text: isKn ? 'ಬುಕಿಂಗ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ' : 'Booking Confirmed',
          desc: isKn
            ? 'ನಿಮ್ಮ ಆನ್‌ಲೈನ್ ಪಾವತಿ ಸ್ವೀಕರಿಸಲ್ಪಟ್ಟಿದೆ ಮತ್ತು ವಾಸ್ತವ್ಯ ದೃಢೀಕರಿಸಲ್ಪಟ್ಟಿದೆ.'
            : 'Your online payment was received. Your stay is confirmed.'
        };
      case 'payment_pending':
        return {
          bg: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
          icon: Clock,
          text: isKn ? 'ಪಾವತಿ ಬಾಕಿ ಇದೆ' : 'Payment Pending (Hold Active)',
          desc: isKn
            ? 'ಕೊಠಡಿ 15 ನಿಮಿಷಗಳ ಕಾಲ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಪಾವತಿ ಪೂರ್ಣಗೊಳಿಸಿ.'
            : 'Your room hold is active for 15 minutes. Complete payment to secure it.'
        };
      case 'rejected':
        return {
          bg: 'bg-rose-500/15 text-rose-800 border-rose-500/30',
          icon: XCircle,
          text: isKn ? 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ & ಮರುಪಾವತಿಸಲಾಗಿದೆ' : 'Rejected & Refunded',
          desc: isKn
            ? 'ಈ ದಿನಾಂಕಗಳು ಲಭ್ಯವಿಲ್ಲದ ಕಾರಣ ಬುಕಿಂಗ್ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ. ಪೂರ್ಣ ಮೊತ್ತವನ್ನು ಮರುಪಾವತಿಸಲಾಗಿದೆ.'
            : 'The host could not accept this stay. A full refund has been initiated to your original payment method.'
        };
      case 'cancelled':
        return {
          bg: 'bg-gray-500/15 text-gray-800 border-gray-400',
          icon: XCircle,
          text: isKn ? 'ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ' : 'Cancelled',
          desc: isKn ? 'ಬುಕಿಂಗ್ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.' : 'This reservation was cancelled.'
        };
      case 'expired':
        return {
          bg: 'bg-gray-500/15 text-gray-700 border-gray-400',
          icon: AlertCircle,
          text: isKn ? 'ಅವಧಿ ಮೀರಿದೆ' : 'Expired Hold',
          desc: isKn ? 'ಪಾವತಿ ಮಾಡದ ಕಾರಣ ಕೊಠಡಿ ಬಿಡುಗಡೆಗೊಂಡಿದೆ.' : 'Payment was not completed within 15 minutes and the hold was released.'
        };
      case 'checked_in':
        return {
          bg: 'bg-teal-500/15 text-teal-800 border-teal-500/30',
          icon: CheckCircle2,
          text: isKn ? 'ಚೆಕ್-ಇನ್ ಆಗಿದೆ' : 'Checked In',
          desc: isKn ? 'ಮಾರಿಚಿನ್‌ನಲ್ಲಿ ನಿಮ್ಮ ವಾಸ್ತವ್ಯವನ್ನು ಆನಂದಿಸಿ!' : 'Welcome to Marichin Homestay!'
        };
      case 'checked_out':
        return {
          bg: 'bg-gray-500/15 text-gray-800 border-gray-300',
          icon: CheckCircle2,
          text: isKn ? 'ಚೆಕ್-ಔಟ್ ಆಗಿದೆ' : 'Checked Out',
          desc: isKn ? 'ಭೇಟಿ ನೀಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು!' : 'Thank you for visiting Marichin Homestay!'
        };
      default:
        return {
          bg: 'bg-gray-500/15 text-gray-800 border-gray-300',
          icon: Clock,
          text: status || 'Pending',
          desc: ''
        };
    }
  };

  const statusInfo = booking ? getStatusBadge(booking.status, booking.paymentStatus) : null;
  const StatusIcon = statusInfo?.icon || Clock;

  const roomDisplayName =
    booking?.bookingType === 'full_home'
      ? isKn
        ? `ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ (ಎಲ್ಲಾ ${getRoomTotalUnits(rooms)} ಕೊಠಡಿಗಳು)`
        : `Full Home (All ${getRoomTotalUnits(rooms)} Rooms: ${buildFullHomeBreakdown(rooms, false)})`
      : booking?.roomName || booking?.room?.name || 'Standard Room';

  const nightsCount = Array.isArray(booking?.nights)
    ? booking.nights.length
    : Number(booking?.nights) || 1;

  const totalAmount = Number(booking?.pricing?.total ?? booking?.totalAmount ?? 0);
  const advancePaid = Number(booking?.advancePaid ?? 0);
  const balanceDue = Number(booking?.balanceDue ?? Math.max(0, totalAmount - advancePaid));

  return (
    <div className="min-h-screen bg-[#FAF6EC] py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Page Title */}
        <div className="text-center space-y-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#B8964A] font-bold">
            {isKn ? 'ಅತಿಥಿ ಸೇವಾ ಪೋರ್ಟಲ್' : 'Guest Reservation Portal'}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#0F2A20]">
            {isKn ? 'ನಿಮ್ಮ ಬುಕಿಂಗ್ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ' : 'Check Your Booking Status'}
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6B62] max-w-lg mx-auto">
            {isKn
              ? 'ನಿಮ್ಮ ಬುಕಿಂಗ್ ಕೋಡ್ ಮತ್ತು ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ ರಿಸರ್ವೇಶನ್ ಸ್ಥಿತಿ, ಪಾವತಿ ಮತ್ತು ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ.'
              : 'Enter your booking reference code to view live reservation status, advance payment receipt, and check-in details.'}
          </p>
        </div>

        {/* Lookup Search Card */}
        <form
          onSubmit={handleSearchSubmit}
          className="bg-white rounded-3xl border border-[#B8964A]/30 p-6 sm:p-8 shadow-sm space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F2A20] mb-1.5 uppercase tracking-wider">
                {isKn ? 'ಬುಕಿಂಗ್ ಕೋಡ್' : 'Booking Reference Code'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. MH-2026-1042"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#D9BC7A]/50 bg-[#FAF6EC]/50 font-mono text-sm font-semibold uppercase text-[#0F2A20] focus:outline-none focus:border-[#B8964A] focus:ring-1 focus:ring-[#B8964A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0F2A20] mb-1.5 uppercase tracking-wider">
                {isKn ? 'ಫೋನ್ ಸಂಖ್ಯೆ (ಐಚ್ಛಿಕ)' : 'Phone Number (Optional)'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-4 py-3 rounded-xl border border-[#D9BC7A]/50 bg-[#FAF6EC]/50 text-sm text-[#0F2A20] focus:outline-none focus:border-[#B8964A] focus:ring-1 focus:ring-[#B8964A]"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
            <span className="text-[11px] text-[#5F6B62]">
              {isKn ? 'ಪಾವತಿ SMS ಅಥವಾ ಇಮೇಲ್‌ನಲ್ಲಿರುವ ಕೋಡ್ ಬಳಸಿ.' : 'Find your code in your SMS or email confirmation.'}
            </span>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="px-6 py-3 rounded-xl text-xs uppercase tracking-wider font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all shadow-md disabled:opacity-40 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0F2A20]" />
                  <span>{isKn ? 'ಹುಡುಕಲಾಗುತ್ತಿದೆ...' : 'Searching...'}</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-[#0F2A20]" />
                  <span>{isKn ? 'ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ' : 'Lookup Reservation'}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Alert */}
        {error && (() => {
          const hostContact = getPublicHostContact(siteSettings);
          return (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">{error}</p>
                {hostContact.whatsapp && (
                  <p className="text-[11px] text-red-700 mt-0.5">
                    {isKn
                      ? `ಸಹಾಯ ಬೇಕಿದ್ದಲ್ಲಿ WhatsApp (${hostContact.whatsapp}) ನಲ್ಲಿ ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ.`
                      : `Need assistance? Reach out to host via WhatsApp at ${hostContact.whatsapp}.`}
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* Booking Result View */}
        {booking && (
          <div className="bg-white rounded-3xl border border-[#B8964A]/30 overflow-hidden shadow-lg space-y-6 p-6 sm:p-8">
            
            {/* Status Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#F1E9D8]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-[0.16em] text-[#B8964A] block mb-0.5">
                  {isKn ? 'ಬುಕಿಂಗ್ ಉಲ್ಲೇಖ' : 'Booking Reference'}
                </span>
                <h2 className="font-mono text-xl sm:text-2xl font-bold text-[#0F2A20] tracking-wider">
                  {booking.bookingCode}
                </h2>
                <span className="text-[11px] text-[#5F6B62] block mt-0.5">
                  {isKn ? 'ಬುಕ್ ಮಾಡಿದ ದಿನಾಂಕ:' : 'Created on:'}{' '}
                  {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>

              <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 ${statusInfo?.bg}`}>
                <StatusIcon className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider">{statusInfo?.text}</span>
              </div>
            </div>

            {/* Status explanation notice */}
            {statusInfo?.desc && (
              <div className="p-4 rounded-2xl bg-[#FAF6EC] border border-[#D9BC7A]/30 text-xs text-[#0F2A20] flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#B8964A] flex-shrink-0" />
                <p>{statusInfo.desc}</p>
              </div>
            )}

            {/* Stay Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#FAF6EC] border border-[#F1E9D8] space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#5F6B62] block">
                  {isKn ? 'ವಾಸ್ತವ್ಯ ಕೊಠಡಿ' : 'Accommodation'}
                </span>
                <h3 className="font-serif text-base font-bold text-[#0F2A20]">{roomDisplayName}</h3>
                <div className="text-xs text-[#5F6B62] space-y-1 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#B8964A]" />
                    <span>
                      {new Date(booking.checkIn).toLocaleDateString()} &rarr;{' '}
                      {new Date(booking.checkOut).toLocaleDateString()} ({nightsCount} {nightsCount > 1 ? 'nights' : 'night'})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#B8964A]" />
                    <span>
                      {booking.adults} {isKn ? 'ವಯಸ್ಕರು' : 'Adults'}
                      {booking.children ? `, ${booking.children} ${isKn ? 'ಮಕ್ಕಳು' : 'Children'}` : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF6EC] border border-[#F1E9D8] space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#5F6B62] block">
                  {isKn ? 'ಅತಿಥಿ ಮಾಹಿತಿ' : 'Guest Details'}
                </span>
                <h3 className="text-sm font-bold text-[#0F2A20]">{booking.guestName}</h3>
                <div className="text-xs text-[#5F6B62] space-y-1 pt-1">
                  <p>📞 {booking.phone}</p>
                  <p>✉️ {booking.email}</p>
                  {booking.specialRequests && booking.specialRequests !== 'None' && (
                    <p className="text-[11px] italic text-[#7A8A7E]">
                      "{booking.specialRequests}"
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment & Financial Ledger */}
            <div className="p-5 rounded-2xl bg-[#0F2A20] text-[#FAF6EC] space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-[0.16em] text-[#D9BC7A] block">
                {isKn ? 'ಪಾವತಿ ವಿವರಗಳು' : 'Payment & Account Breakdown'}
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#B9C4B8]">
                  <span>{isKn ? 'ಒಟ್ಟು ವೆಚ್ಚ' : 'Total Stay Tariff'}</span>
                  <span className="font-semibold text-white">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#D9BC7A] font-semibold">
                  <span>{isKn ? 'ಪಾವತಿಸಿದ ಮುಂಗಡ ಮೊತ್ತ' : 'Advance Paid Online'}</span>
                  <span>₹{advancePaid.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-amber-200 font-bold border-t border-[#1B4332] pt-2">
                  <span>{isKn ? 'ಚೆಕ್-ಇನ್ ಸಮಯದಲ್ಲಿ ಬಾಕಿ' : 'Balance Due at Check-In'}</span>
                  <span>₹{balanceDue.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Razorpay Transaction Details */}
              <div className="mt-3 pt-3 border-t border-[#1B4332] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#B9C4B8]">
                {booking.razorpayPaymentId && (
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-[#D9BC7A]">
                      Razorpay Payment ID
                    </span>
                    <span className="font-mono text-white">{booking.razorpayPaymentId}</span>
                  </div>
                )}
                {booking.razorpayOrderId && (
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-[#D9BC7A]">
                      Razorpay Order ID
                    </span>
                    <span className="font-mono text-white">{booking.razorpayOrderId}</span>
                  </div>
                )}
                {booking.razorpayPaymentMethod && (
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-[#D9BC7A]">
                      Payment Method
                    </span>
                    <span className="uppercase text-white">{booking.razorpayPaymentMethod}</span>
                  </div>
                )}
                {booking.paidAt && (
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-[#D9BC7A]">
                      Payment Received At
                    </span>
                    <span className="text-white">{new Date(booking.paidAt).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              {/* Refunds if any */}
              {Array.isArray(booking.refunds) && booking.refunds.length > 0 && (
                <div className="mt-3 pt-3 border-t border-rose-900/60 bg-rose-950/40 p-3 rounded-xl space-y-1.5 text-xs text-rose-200">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-rose-300 block">
                    {isKn ? 'ಮರುಪಾವತಿ ದಾಖಲೆ' : 'Refund Transaction Details'}
                  </span>
                  {booking.refunds.map((ref, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px]">
                      <span>
                        Refund ID: <strong className="font-mono">{ref.refundId}</strong>
                      </span>
                      <span className="font-bold text-rose-300">₹{(ref.amount || 0).toLocaleString('en-IN')} ({ref.status})</span>
                    </div>
                  ))}
                  <p className="text-[10px] text-rose-300/80 mt-1">
                    {isKn
                      ? 'ಮರುಪಾವತಿಯು 5–7 ಕೆಲಸದ ದಿನಗಳಲ್ಲಿ ನಿಮ್ಮ ಮೂಲ ಖಾತೆಗೆ ಜಮೆಯಾಗಲಿದೆ.'
                      : 'Refund credits typically reflect in your original payment method in 5–7 business days.'}
                  </p>
                </div>
              )}
            </div>

            {/* Check-In Guidelines & WhatsApp Assistance */}
            {(() => {
              const hostContact = getPublicHostContact(siteSettings);
              const isActiveStatus = ['confirmed', 'paid_awaiting_confirmation', 'payment_pending'].includes(booking.status);
              const todayTier =
                isActiveStatus && booking.checkIn
                  ? calculateTierRefund({
                      settings: siteSettings,
                      checkInDate: booking.checkIn,
                      paidAmount: advancePaid
                    })
                  : null;

              return (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                  <div className="text-xs text-[#5F6B62] space-y-1">
                    <p className="font-semibold text-[#0F2A20]">
                      {isKn ? 'ಚೆಕ್-ಇನ್ & ರದ್ದತಿ ಮಾಹಿತಿ:' : 'Check-In & Cancellation Info:'}
                    </p>
                    <p>
                      Check-In: {siteSettings?.checkInTime || '12:00 PM'} • Check-Out: {siteSettings?.checkOutTime || '11:00 AM'}
                    </p>
                    <p>{formatCancellationSummaryText(siteSettings, isKn ? 'kn' : 'en')}</p>
                    {todayTier && todayTier.daysBeforeCheckIn !== null && (
                      <p className="font-semibold text-[#0F2A20]">
                        {isKn
                          ? `ಇಂದು ರದ್ದುಪಡಿಸಿದರೆ: ${todayTier.refundPercent}% ಮರುಪಾವತಿ ಅರ್ಹತೆ`
                          : `If cancelled today: ${todayTier.refundPercent}% refund eligible`}
                      </p>
                    )}
                    <p>
                      <Link to="/refund-policy" className="text-[#B8964A] underline font-semibold">
                        {isKn ? 'ಪೂರ್ಣ ಮರುಪಾವತಿ ಮತ್ತು ರದ್ದತಿ ನೀತಿ' : 'Read full Refund & Cancellation Policy'}
                      </Link>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Link
                      to={`/pass/${booking.passToken || booking.bookingCode}`}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C8A55A] to-[#B8964A] text-[#0F2A20] text-xs font-bold hover:from-[#D9BC7A] hover:to-[#C8A55A] flex items-center gap-1.5 shadow-sm"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isKn ? 'ಅಧಿಕೃತ ಪಾಸ್ & QR ವೀಕ್ಷಿಸಿ' : 'View Pass & QR'}</span>
                    </Link>

                    {(booking.status === 'confirmed' || booking.status === 'checked_in' || booking.status === 'checked_out') && (
                      <Link
                        to={`/reviews?action=write&name=${encodeURIComponent(booking.guestName || '')}&room=${encodeURIComponent(booking.roomName || '')}`}
                        className="px-4 py-2.5 rounded-xl border border-[#B8964A]/40 bg-[#FAF6EC] text-[#0F2A20] text-xs font-semibold hover:border-[#B8964A] flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 fill-[#B8964A] text-[#B8964A]" />
                        <span>{isKn ? 'ಅನುಭವ ಹಂಚಿಕೊಳ್ಳಿ' : 'Rate & Review'}</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-4 py-2.5 rounded-xl border border-[#B8964A]/30 text-xs font-semibold text-[#0F2A20] hover:bg-[#FAF6EC] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#B8964A]" />
                      <span>{isKn ? 'ಮುದ್ರಿಸಿ' : 'Print Receipt'}</span>
                    </button>

                    {hostContact.whatsappDigits && (
                      <a
                        href={buildWhatsAppShareUrl(
                          buildWhatsAppMessage('booking_enquiry', booking, siteSettings, {
                            language: isKn ? 'kn' : 'en'
                          }),
                          hostContact.whatsapp
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20ba59] flex items-center gap-1.5 shadow-sm"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>{isKn ? 'WhatsApp ಬೆಂಬಲ' : 'Contact Host'}</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })()}

          </div>
        )}

      </div>
    </div>
  );
};

