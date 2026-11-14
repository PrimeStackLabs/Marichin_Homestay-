import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { BookingPassCard } from '../../components/Booking/BookingPassCard';
import {
  Loader2,
  AlertCircle,
  Home,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { formatDisplayDate } from '../../utils/whatsappMessages';

export const Pass = () => {
  const { token } = useParams();
  const { language } = useLanguage();
  const isKn = language === 'kn';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [passData, setPassData] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!token) {
      setError(isKn ? 'ಪಾಸ್ ಟೋಕನ್ ಕಾಣೆಯಾಗಿದೆ.' : 'Pass token missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    api.getBookingPass(token)
      .then((res) => {
        if (!isMounted) return;
        const data = res?.data || res?.pass || res;
        if (data && data.bookingCode) {
          setPassData(data);
        } else {
          setError(isKn ? 'ಪಾಸ್ ಕಂಡುಬಂದಿಲ್ಲ.' : 'Pass not found.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(isKn ? 'ಪಾಸ್ ಕಂಡುಬಂದಿಲ್ಲ ಅಥವಾ ಅಮಾನ್ಯವಾಗಿದೆ.' : 'Pass not found or invalid link.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, isKn]);

  // Live countdown timer for held bookings
  useEffect(() => {
    if (!passData?.holdExpiresAt || passData.status !== 'payment_pending') {
      setSecondsRemaining(null);
      return;
    }

    const updateTimer = () => {
      const remainingMs = new Date(passData.holdExpiresAt).getTime() - Date.now();
      const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));
      setSecondsRemaining(remainingSec);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [passData]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EC] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#B8964A] mx-auto" />
          <p className="text-xs uppercase tracking-wider text-[#0F2A20] font-semibold">
            {isKn ? 'ಪಾಸ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading Official Check-In Pass...'}
          </p>
        </div>
      </div>
    );
  }

  // Pass Not Found State
  if (error || !passData) {
    return (
      <div className="min-h-screen bg-[#FAF6EC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#B8964A]/30 p-8 text-center space-y-5 shadow-lg">
          <div className="w-14 h-14 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto text-amber-800">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#0F2A20]">
              {isKn ? 'ಪಾಸ್ ಕಂಡುಬಂದಿಲ್ಲ' : 'Pass Not Found'}
            </h1>
            <p className="text-xs text-[#5F6B62] mt-2 leading-relaxed">
              {isKn
                ? 'ನೀವು ವಿನಂತಿಸಿದ ಪಾಸ್ ಲಿಂಕ್ ಅಮಾನ್ಯವಾಗಿದೆ ಅಥವಾ ಮುಕ್ತಾಯಗೊಂಡಿದೆ. ನಿಮ್ಮ ಬುಕಿಂಗ್ ಕೋಡ್ ಬಳಸಿ ಸ್ಥಿತಿ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಹುಡುಕಬಹುದು.'
                : 'The pass link you requested is invalid, expired, or could not be located. You can look up your reservation using your booking code and phone number.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/booking/status"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0F2A20] text-[#FAF6EC] text-xs font-semibold hover:bg-[#1B4332] flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4 text-[#B8964A]" />
              <span>{isKn ? 'ಸ್ಥಿತಿ ಹುಡುಕಿ' : 'Lookup by Code'}</span>
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#B8964A]/30 text-[#0F2A20] text-xs font-semibold hover:bg-[#FAF6EC] flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4 text-[#B8964A]" />
              <span>{isKn ? 'ಮುಖಪುಟ' : 'Return Home'}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Live status banners
  const st = passData.status;
  const isPendingHold = st === 'payment_pending';
  const isCancelled = st === 'cancelled';
  const isRejected = st === 'rejected';
  const isExpired = st === 'expired';
  const isCheckedIn = st === 'checked_in';
  const isCheckedOut = st === 'checked_out';
  const isConfirmed = st === 'confirmed' || st === 'paid_awaiting_confirmation' || passData.advancePaid > 0;

  const timerMin = secondsRemaining !== null ? Math.floor(secondsRemaining / 60) : 0;
  const timerSec = secondsRemaining !== null ? secondsRemaining % 60 : 0;
  const timerDisplay = `${timerMin}:${timerSec < 10 ? '0' : ''}${timerSec}`;

  return (
    <div className="min-h-screen bg-[#FAF6EC] py-8 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-5">
        
        {/* LIVE STATUS BAR AT TOP */}
        <div className="bg-white rounded-2xl border border-[#B8964A]/30 p-4 shadow-sm flex items-center justify-between flex-wrap gap-3 print:hidden">
          <div className="flex items-center gap-3">
            {isConfirmed && (
              <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-400 text-emerald-800 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
            {isPendingHold && (
              <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-400 text-amber-800 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            )}
            {(isCancelled || isRejected || isExpired) && (
              <div className="w-9 h-9 rounded-full bg-rose-100 border border-rose-400 text-rose-800 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
            )}
            {(isCheckedIn || isCheckedOut) && (
              <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-400 text-emerald-800 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-[#0F2A20] block">
                {isConfirmed && (isKn ? 'ಲೈವ್ ಸ್ಥಿತಿ: ಬುಕಿಂಗ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ' : 'Live Status: Booking Confirmed')}
                {isPendingHold && (isKn ? 'ಲೈವ್ ಸ್ಥಿತಿ: ಪಾವತಿ ಬಾಕಿ ಇದೆ' : 'Live Status: Payment Pending (Hold Active)')}
                {isCancelled && (isKn ? 'ಲೈವ್ ಸ್ಥಿತಿ: ಬುಕಿಂಗ್ ರದ್ದುಗೊಂಡಿದೆ' : 'Live Status: Booking Cancelled')}
                {isRejected && (isKn ? 'ಲೈವ್ ಸ್ಥಿತಿ: ಬುಕಿಂಗ್ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ & ಮರುಪಾವತಿಸಲಾಗಿದೆ' : 'Live Status: Reservation Rejected & Refunded')}
                {isExpired && (isKn ? 'ಲೈವ್ ಸ್ಥಿತಿ: ಕಾಯ್ದಿರಿಸುವಿಕೆ ಅವಧಿ ಮೀರಿದೆ' : 'Live Status: Hold Expired')}
                {isCheckedIn && (isKn ? 'ಲೈವ್ ಸ್ಥಿತಿ: ಚೆಕ್-ಇನ್ ಮಾಡಲಾಗಿದೆ' : 'Live Status: Checked In')}
                {isCheckedOut && (isKn ? 'ಲೈವ್ ಸ್ಥಿತಿ: ಚೆಕ್-ಔಟ್ ಮಾಡಲಾಗಿದೆ' : 'Live Status: Checked Out')}
              </span>
              <span className="text-[11px] text-[#5F6B62]">
                {isConfirmed &&
                  (isKn
                    ? 'ನಿಮ್ಮ ಆನ್‌ಲೈನ್ ಪಾವತಿ ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟಿದೆ ಮತ್ತು ನಿಮ್ಮ ವಾಸ್ತವ್ಯ ದೃಢೀಕರಿಸಲ್ಪಟ್ಟಿದೆ.'
                    : 'Online payment has been verified. Your sanctuary reservation is confirmed.')}
                {isPendingHold &&
                  (isKn
                    ? `ಕೊಠಡಿಗಳು ಕಾಯ್ದಿರಿಸಲ್ಪಟ್ಟಿವೆ (${timerDisplay} ಉಳಿದಿದೆ). ದೃಢೀಕರಣಕ್ಕಾಗಿ ಪಾವತಿ ಪೂರ್ಣಗೊಳಿಸಿ.`
                    : `Rooms held for ${timerDisplay}. Please complete advance payment to finalize.`)}
                {isCancelled &&
                  (passData.cancellationReason
                    ? `${isKn ? 'ಕಾರಣ:' : 'Reason:'} ${passData.cancellationReason}`
                    : (isKn ? 'ವಿನಂತಿಯಂತೆ ಬುಕಿಂಗ್ ರದ್ದುಗೊಂಡಿದೆ.' : 'Reservation cancelled upon request.'))}
                {isRejected &&
                  (isKn
                    ? 'ದಿನಾಂಕಗಳು ಲಭ್ಯವಿಲ್ಲ. ಪೂರ್ಣ ಮೊತ್ತವನ್ನು ಮರುಪಾವತಿಸಲಾಗಿದೆ.'
                    : 'Dates unavailable. Full advance refund has been processed.')}
                {isExpired &&
                  (isKn
                    ? '15 ನಿಮಿಷಗಳ ಅವಧಿ ಮೀರಿದ ಕಾರಣ ದಿನಾಂಕಗಳು ಬಿಡುಗಡೆಯಾಗಿವೆ.'
                    : '15-minute reservation window expired. Dates released.')}
                {isCheckedIn && (isKn ? 'ಮರಿಚಿನ್‌ನಲ್ಲಿ ನಿಮ್ಮ ವಾಸ್ತವ್ಯವನ್ನು ಆನಂದಿಸಿ!' : 'Welcome! Enjoy your serene stay with us.')}
                {isCheckedOut && (isKn ? 'ಭೇಟಿ ನೀಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು!' : 'Thank you for visiting Marichin Homestay.')}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <Link
              to="/refund-policy"
              className="text-[11px] text-[#0F2A20] hover:text-[#B8964A] hover:underline font-semibold"
            >
              <span>{isKn ? 'ರದ್ದತಿ ಮತ್ತು ಮರುಪಾವತಿ ನೀತಿ' : 'Refund Policy'}</span>
            </Link>
            <Link
              to="/booking/status"
              className="text-[11px] text-[#B8964A] hover:underline font-semibold flex items-center gap-1"
            >
              <span>{isKn ? 'ಸ್ಥಿತಿ ಪೋರ್ಟಲ್' : 'Status Lookup'}</span>
            </Link>
          </div>
        </div>

        {/* PASS CARD COMPONENT */}
        <BookingPassCard
          booking={passData}
          siteSettings={passData.property}
          isKn={isKn}
          showActions={true}
          id="live-booking-pass-view"
        />

      </div>
    </div>
  );
};
export default Pass;

