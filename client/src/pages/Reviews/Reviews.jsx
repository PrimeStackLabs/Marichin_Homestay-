import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { HOMESTAY_INFO, REVIEWS_DATA } from '../../data/homestayData';
import { 
  Star, 
  ShieldCheck, 
  CheckCircle2, 
  MessageSquare, 
  Plus, 
  Heart,
  Award,
  Sparkles,
  ArrowRight,
  PenLine,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const getGuestInitials = (name) => {
  const parts = String(name || 'Guest').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'G';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const GuestMonogramAvatar = ({ src, name }) => {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className="w-11 h-11 rounded-full object-cover border border-[#B8964A]/40 flex-shrink-0"
      />
    );
  }
  return (
    <div
      className="w-11 h-11 rounded-full bg-[#0F2A20] text-[#D9BC7A] border border-[#B8964A]/40 flex items-center justify-center font-serif text-sm font-semibold flex-shrink-0 select-none"
      aria-label={name}
    >
      {getGuestInitials(name)}
    </div>
  );
};

export const Reviews = () => {
  const { t, language } = useLanguage();
  const isKn = language === 'kn';
  const { reviews, addReview, siteSettings, rooms } = useAdmin();
  const settings = siteSettings || HOMESTAY_INFO;
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const openModal = () => {
    setSubmitted(false);
    setSubmitError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSubmitted(false);
    setSubmitError('');
  };

  // Show only approved reviews on public site (falls back cleanly if admin has not added/edited any)
  const approvedList = (reviews || []).filter((r) => r && r.status === 'approved');
  const avgRating = approvedList.length > 0
    ? (approvedList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / approvedList.length).toFixed(1)
    : null;

  const [formData, setFormData] = useState({
    guestName: '',
    city: '',
    rating: 5,
    stayedIn: 'Standard Room',
    review: ''
  });

  // Listen to ?action=write query param or hash #write-review to auto-open review modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'write' || window.location.hash === '#write-review') {
      setSubmitted(false);
      setSubmitError('');
      setModalOpen(true);
      const prefillName = params.get('name');
      const prefillRoom = params.get('room');
      if (prefillName || prefillRoom) {
        setFormData(prev => ({
          ...prev,
          guestName: prefillName || prev.guestName,
          stayedIn: prefillRoom || prev.stayedIn
        }));
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!formData.guestName.trim() || !formData.review.trim()) {
      setSubmitError(isKn ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರು ಮತ್ತು ವಿಮರ್ಶೆಯನ್ನು ನಮೂದಿಸಿ.' : 'Please enter both your name and review before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addReview({
        guestName: formData.guestName.trim(),
        city: formData.city.trim() || 'Karnataka, India',
        location: formData.city.trim() || 'Karnataka, India',
        rating: parseInt(formData.rating, 10) || 5,
        stayedIn: formData.stayedIn,
        text: formData.review.trim(),
        review: formData.review.trim()
      });

      if (!result?.success) {
        setSubmitError(result?.message || (isKn ? 'ವಿಮರ್ಶೆಯನ್ನು ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.' : 'Could not save your review right now. Please try again.'));
        return;
      }

      setSubmitted(true);
      setFormData({
        guestName: '',
        city: '',
        rating: 5,
        stayedIn: 'Standard Room',
        review: ''
      });
      setTimeout(() => {
        setSubmitted(false);
        setModalOpen(false);
      }, 2600);
    } catch (err) {
      setSubmitError(err?.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingDescriptions = {
    5: isKn ? 'ಅತ್ಯುತ್ತಮ ಅನುಭವ (೫/೫)' : 'Exceptional Stay (5.0 / 5.0)',
    4: isKn ? 'ಉತ್ತಮ ವಾಸ್ತವ್ಯ (೪/೫)' : 'Very Good Experience (4.0 / 5.0)',
    3: isKn ? 'ಸಾಧಾರಣ ವಾಸ್ತವ್ಯ (೩/೫)' : 'Average Experience (3.0 / 5.0)',
    2: isKn ? 'ನಿರೀಕ್ಷೆಗಿಂತ ಕಡಿಮೆ (೨/೫)' : 'Below Expectations (2.0 / 5.0)',
    1: isKn ? 'ತೃಪ್ತಿಕರವಲ್ಲ (೧/೫)' : 'Poor Experience (1.0 / 5.0)'
  };

  return (
    <div className="min-h-screen bg-[#FAF6EC] text-[#1A2A21]">
      
      {/* SECTION 1: Header — Dark Forest Deep */}
      <section className="w-full bg-[#0F2A20] bg-dark-radial text-[#F3EDDD] py-16 sm:py-24 border-b border-[#B8964A]/20 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1B4332] border border-[#B8964A]/30 mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#D9BC7A]" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D9BC7A]">
              {isKn ? 'ಅತಿಥಿಗಳ ನೈಜ ಅನುಭವಗಳು' : 'Genuine Guest Reflections'}
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl text-[#F3EDDD] font-normal mt-2 mb-4">
            {isKn ? 'ದೃಢೀಕೃತ ಅತಿಥಿ ವಿಮರ್ಶೆಗಳು' : 'Guestbook & Verified Reviews'}
          </h1>

          <div className="w-16 h-0.5 bg-[#B8964A] mx-auto mb-5" />

          <p className="text-base sm:text-lg text-[#B9C4B8] font-light max-w-2xl mx-auto leading-relaxed">
            {isKn
              ? 'ನಮ್ಮ ಕಾಫಿ ತೋಟದಲ್ಲಿ ತಂಗಿ ಹಿತಕರ ನೆಮ್ಮದಿ ಕಂಡ ಅತಿಥಿಗಳು ಸ್ವತಃ ಬರೆದ ನೈಜ ಅನುಭವಗಳು ಮತ್ತು ನೆನಪುಗಳು.'
              : 'Real memories written directly by travelers from across the globe who found peaceful sanctuary in our mist-wrapped hills.'}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={openModal}
              className="px-8 py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all shadow-[0_8px_24px_rgba(184,150,74,0.35)] hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
            >
              <PenLine className="w-4 h-4" />
              <span>{isKn ? 'ನಿಮ್ಮ ವಿಮರ್ಶೆ ಬರೆಯಿರಿ' : 'Write a Review'}</span>
            </button>
            <Link
              to="/booking"
              className="px-7 py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider font-semibold text-[#F3EDDD] border border-[#B8964A]/40 hover:bg-[#1B4332] transition-all cursor-pointer"
            >
              {isKn ? 'ಕೊಠಡಿ ಕಾಯ್ದಿರಿಸಿ' : 'Book a Stay'}
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: Tourism Department Trust Certificate & Rating — Warm Ivory */}
      <section className="w-full bg-[#FAF6EC] text-[#1A2A21] py-12 sm:py-16 border-b border-[#B8964A]/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-7 sm:p-10 rounded-3xl border border-[#F1E9D8] shadow-[0_10px_40px_rgba(15,42,32,0.08)] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF6EC] border border-[#F1E9D8] flex items-center justify-center text-[#B8964A] flex-shrink-0 shadow-sm">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F2A20] uppercase tracking-[0.18em]">
                  {isKn ? '೧೦೦% ನೈಜ, ದೃಢೀಕೃತ ಅನಿಸಿಕೆಗಳ ವ್ಯವಸ್ಥೆ' : '100% Genuine, Verified Feedback System'}
                </p>
                <p className="text-xs sm:text-sm text-[#5F6B62] mt-0.5">
                  {settings?.registrationNumber && settings.registrationNumber.trim()
                    ? (isKn ? `ಕರ್ನಾಟಕ ಪ್ರವಾಸೋದ್ಯಮ ಇಲಾಖೆ ಅನುಮೋದಿತ · ನೋಂದಣಿ #${settings.registrationNumber}` : `Karnataka Department of Tourism Approved · Reg #${settings.registrationNumber}`)
                    : (isKn ? 'ನೈಜ ಅತಿಥಿ ಅನಿಸಿಕೆಗಳು ಮತ್ತು ದೃಢೀಕೃತ ವಾಸ್ತವ್ಯಗಳು' : 'Authentic Guest Reflections & Verified Stays')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-[#FAF6EC] px-5 py-2.5 rounded-2xl border border-[#F1E9D8]">
              <div className="flex items-center gap-1 text-[#B8964A]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#0F2A20] ml-1">
                {avgRating
                  ? `${avgRating} / 5.0 (${approvedList.length} ${isKn ? (approvedList.length === 1 ? 'ವಿಮರ್ಶೆ' : 'ವಿಮರ್ಶೆಗಳು') : (approvedList.length === 1 ? 'Review' : 'Reviews')})`
                  : (isKn ? 'ದೃಢೀಕೃತ ಅತಿಥಿ ಪುಸ್ತಕ' : 'Verified Guestbook')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Reviews Grid — Linen */}
      <section className="w-full bg-[#F1E9D8] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {approvedList.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl p-10 sm:p-14 text-center border border-[#FAF6EC] shadow-sm">
                <MessageSquare className="w-10 h-10 text-[#B8964A]/50 mx-auto mb-3" />
                <h3 className="font-serif text-xl sm:text-2xl text-[#0F2A20] font-semibold mb-2">
                  {isKn ? 'ನಮ್ಮ ಡಿಜಿಟಲ್ ಅತಿಥಿ ಪುಸ್ತಕ ನಿಮ್ಮ ಅನಿಸಿಕೆಗಾಗಿ ಕಾಯುತ್ತಿದೆ' : 'Our Digital Guestbook Awaits Your Entry'}
                </h3>
                <p className="text-sm text-[#5F6B62] font-light max-w-md mx-auto mb-6">
                  {isKn
                    ? 'ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇನಲ್ಲಿ ಪ್ರತಿ ವಾಸ್ತವ್ಯವೂ ಅನನ್ಯ. ನಿಮ್ಮ ಅನುಭವವನ್ನು ಇತರ ಪ್ರವಾಸಿಗರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ.'
                    : 'Every stay at Marichin Homestay is unique. Be the first to share your experience with fellow travelers.'}
                </p>
                <button
                  onClick={openModal}
                  className="px-6 py-3 rounded-xl text-xs uppercase tracking-wider font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] shadow-md transition-all cursor-pointer"
                >
                  {isKn ? 'ಅಭಿಪ್ರಾಯ ಹಂಚಿಕೊಳ್ಳಿ' : 'Write in Guestbook'}
                </button>
              </div>
            ) : (
              approvedList.map((rev, idx) => {
                const ratingCount = Math.min(5, Math.max(1, Number(rev.rating) || 5));
                const reviewText = rev.text || rev.review || '';
                const reviewLocation = rev.location || rev.city || 'Karnataka, India';
                const reviewDate =
                  rev.date ||
                  rev.stayDate ||
                  (rev.createdAt
                    ? new Date(rev.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                    : 'Recent');

                return (
                  <div
                    key={rev._id || rev.id || idx}
                    className="bg-white rounded-3xl p-8 sm:p-10 border border-[#FAF6EC] shadow-[0_10px_40px_rgba(15,42,32,0.08)] hover:border-[#B8964A] transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1 text-[#B8964A]">
                          {[...Array(ratingCount)].map((_, starIdx) => (
                            <Star key={starIdx} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          {rev.stayCategory && (
                            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] px-3 py-1 rounded-full bg-[#FAF6EC] text-[#0F2A20] border border-[#F1E9D8]">
                              {rev.stayCategory}
                            </span>
                          )}
                          <span className="text-xs text-[#5F6B62] font-mono">{reviewDate}</span>
                        </div>
                      </div>

                      {rev.headline && (
                        <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#0F2A20] group-hover:text-[#B8964A] transition-colors mb-3 leading-snug">
                          "{rev.headline}"
                        </h3>
                      )}

                      <p className="font-serif text-sm sm:text-base text-[#1A2A21] italic leading-relaxed mb-6 font-light">
                        "{reviewText}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-5 border-t border-[#F1E9D8]">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <GuestMonogramAvatar src={rev.avatar} name={rev.guestName} />
                        <div className="min-w-0">
                          <h4 className="font-serif text-base font-semibold text-[#0F2A20] truncate">
                            {rev.guestName}
                          </h4>
                          <p className="text-xs text-[#5F6B62] truncate">
                            {reviewLocation} • <span className="text-[#A8654A] font-medium">{rev.stayedIn || 'Standard Room'}</span>
                          </p>
                        </div>
                      </div>

                      {(rev.verified || rev.status === 'approved') && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isKn ? 'ದೃಢೀಕೃತ ವಾಸ್ತವ್ಯ' : 'Verified Stay'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              }))}
          </div>
        </div>
      </section>

      {/* SECTION 4: Host Hospitality Philosophy — Sage */}
      <section className="w-full bg-[#DDE6D3] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-3xl p-8 sm:p-14 border border-[#FAF6EC] shadow-[0_10px_40px_rgba(15,42,32,0.08)] space-y-5">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A] block">
              {isKn ? 'ಕೊಡಗಿನ ಆತ್ಮೀಯತೆ' : 'Kodagu Warmth'}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#0F2A20]">
              {isKn ? '"ಅತಿಥಿ ದೇವೋಭವ" — ಅತಿಥಿ ಸತ್ಕಾರ ನಮ್ಮ ಸಂಸ್ಕೃತಿ' : '"Atithye Devobhava" — Guests are Sacred'}
            </h2>
            <div className="w-12 h-0.5 bg-[#B8964A] mx-auto" />
            <p className="text-sm sm:text-base text-[#5F6B62] font-light leading-relaxed max-w-xl mx-auto mb-6">
              {isKn
                ? 'ನಿಮ್ಮ ಕೋಣೆಯಲ್ಲಿನ ತಾಜಾ ಹೂವುಗಳಿಂದ ಹಿಡಿದು ತೋಟದ ಬಿಸಿ ಕಾಫಿಯವರೆಗಿನ ಪ್ರತಿಯೊಂದು ವಿವರವೂ ಸಾಂಪ್ರದಾಯಿಕ ಕೊಡವ ಆತಿಥ್ಯದ ಬೆಚ್ಚನೆಯ ಪ್ರೀತಿಯಿಂದ ಕೂಡಿದೆ.'
                : 'Every detail—from fresh garden flowers in your suite to unhurried estate kaapi conversations—is curated with the deep warmth of traditional Kodava hospitality.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={openModal}
                className="px-8 py-4 rounded-xl text-xs sm:text-sm uppercase tracking-wider font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all shadow-[0_8px_24px_rgba(184,150,74,0.3)] hover:-translate-y-0.5 inline-flex items-center gap-2 cursor-pointer"
              >
                <PenLine className="w-4 h-4" />
                <span>{isKn ? 'ನಿಮ್ಮ ಅನುಭವ ಹಂಚಿಕೊಳ್ಳಿ' : 'Share Your Review'}</span>
              </button>
              <Link
                to="/booking"
                className="px-8 py-4 rounded-xl text-xs sm:text-sm uppercase tracking-wider font-semibold text-[#0F2A20] border border-[#0F2A20]/30 hover:bg-[#FAF6EC] transition-all inline-flex items-center gap-2"
              >
                <span>{isKn ? 'ಕೊಠಡಿ ಕಾಯ್ದಿರಿಸಿ' : 'Book a Stay'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Write in Guestbook Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2A20]/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg bg-[#0F2A20] border border-[#B8964A]/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-[#F3EDDD] my-8">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-5 right-5 p-2 rounded-full text-[#B9C4B8] hover:text-[#F3EDDD] hover:bg-[#1B4332] transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B4332] border border-[#B8964A]/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#D9BC7A]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D9BC7A]">
                {isKn ? 'ಅತಿಥಿ ಅನಿಸಿಕೆ' : 'Guestbook Entry'}
              </span>
            </div>

            <h3 className="font-serif text-2xl font-semibold text-[#F3EDDD] mb-1">
              {isKn ? 'ನಿಮ್ಮ ವಾಸ್ತವ್ಯದ ಅನುಭವ ಬರೆಯಿರಿ' : 'Share Your Homestay Experience'}
            </h3>
            <p className="text-xs sm:text-sm text-[#B9C4B8] font-light mb-6">
              {isKn
                ? 'ನಿಮ್ಮ ನೈಜ ಅನುಭವ, ತೋಟದ ನೆನಪು ಅಥವಾ ಉಪಹಾರದ ಬಗ್ಗೆ ತಿಳಿಸಿ. ಪ್ರತಿಯೊಂದು ವಿಮರ್ಶೆಯೂ ಮೌಲ್ಯಯುತ.'
                : 'Help future travelers discover Marichin Homestay with your candid reflections and favorite moments.'}
            </p>

            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h4 className="font-serif text-2xl font-semibold text-[#F3EDDD]">
                  {isKn ? 'ನಿಮ್ಮ ವಿಮರ್ಶೆಗಾಗಿ ಧನ್ಯವಾದಗಳು!' : 'Thank You for Sharing!'}
                </h4>
                <div className="max-w-md mx-auto space-y-2 text-xs sm:text-sm text-[#B9C4B8] bg-[#1B4332]/60 p-4 rounded-2xl border border-[#B8964A]/25">
                  <p className="font-medium text-[#D9BC7A]">
                    {isKn
                      ? 'ನಿಮ್ಮ ವಿಮರ್ಶೆಯನ್ನು ಉಳಿಸಲಾಗಿದೆ ಮತ್ತು ಅತಿಥಿ ಪುಸ್ತಕದಲ್ಲಿ ಪ್ರಕಟಿಸಲಾಗಿದೆ.'
                      : 'Your review has been saved and published to our guestbook.'}
                  </p>
                  <p className="text-[11px] sm:text-xs text-[#B9C4B8]/90">
                    {isKn
                      ? 'ನಿಮ್ಮ ಅನುಭವವನ್ನು ಹಂಚಿಕೊಂಡಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು. ಇದು ತಕ್ಷಣವೇ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಗೋಚರಿಸುತ್ತದೆ.'
                      : 'Thank you for writing in our guestbook—your story is now live on the website.'}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
                {submitError && (
                  <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}
                {/* Star Rating Interactive Picker */}
                <div className="bg-[#1B4332]/50 p-4 rounded-2xl border border-[#B8964A]/20">
                  <label className="text-[#B9C4B8] block text-xs uppercase tracking-wider mb-2 font-medium">
                    {isKn ? 'ನಿಮ್ಮ ರೇಟಿಂಗ್ *' : 'Your Rating *'}
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isActive = (hoverRating || formData.rating) >= starVal;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onMouseEnter={() => setHoverRating(starVal)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setFormData({ ...formData, rating: starVal })}
                          className="p-1 rounded-lg hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                          aria-label={`Rate ${starVal} stars`}
                        >
                          <Star
                            className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                              isActive
                                ? 'text-[#D9BC7A] fill-[#D9BC7A]'
                                : 'text-[#5F6B62] fill-transparent'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-[#D9BC7A] font-medium mt-2">
                    {ratingDescriptions[hoverRating || formData.rating] || ''}
                  </p>
                </div>

                {/* Guest Name & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#B9C4B8] block mb-1.5 text-xs font-medium">
                      {isKn ? 'ನಿಮ್ಮ ಹೆಸರು *' : 'Your Name *'}
                    </label>
                    <input
                      type="text"
                      value={formData.guestName}
                      onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                      placeholder="e.g. Rohini & Siddharth"
                      className="w-full bg-[#1B4332] border border-[#B8964A]/30 rounded-xl px-4 py-2.5 text-[#F3EDDD] placeholder-[#B9C4B8]/40 focus:outline-none focus:border-[#D9BC7A]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[#B9C4B8] block mb-1.5 text-xs font-medium">
                      {isKn ? 'ಊರು / ರಾಜ್ಯ *' : 'City / State *'}
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Bengaluru, Karnataka"
                      className="w-full bg-[#1B4332] border border-[#B8964A]/30 rounded-xl px-4 py-2.5 text-[#F3EDDD] placeholder-[#B9C4B8]/40 focus:outline-none focus:border-[#D9BC7A]"
                      required
                    />
                  </div>
                </div>

                {/* Stayed In Room Dropdown */}
                <div>
                  <label className="text-[#B9C4B8] block mb-1.5 text-xs font-medium">
                    {isKn ? 'ನೀವು ತಂಗಿದ ಕೊಠಡಿ / ವಾಸ್ತವ್ಯ' : 'Accommodation Stayed In'}
                  </label>
                  <select
                    value={formData.stayedIn}
                    onChange={(e) => setFormData({ ...formData, stayedIn: e.target.value })}
                    className="w-full bg-[#1B4332] border border-[#B8964A]/30 rounded-xl px-4 py-2.5 text-[#F3EDDD] focus:outline-none focus:border-[#D9BC7A]"
                  >
                    <option value="Standard Room" className="bg-[#0F2A20]">Standard Room</option>
                    <option value="Suite Room" className="bg-[#0F2A20]">Suite Room</option>
                    <option value="Single Room" className="bg-[#0F2A20]">Single Room</option>
                    <option value="Full Home (all 5 rooms)" className="bg-[#0F2A20]">
                      {isKn ? 'ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ (ಎಲ್ಲಾ 5 ಕೊಠಡಿಗಳು)' : 'Full Home (all 5 rooms)'}
                    </option>
                  </select>
                </div>

                {/* Review Text */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[#B9C4B8] text-xs font-medium">
                      {isKn ? 'ನಿಮ್ಮ ವಾಸ್ತವ್ಯದ ಕಥೆ & ಅನುಭವ *' : 'Your Story & Experience *'}
                    </label>
                    <span className="text-[10px] text-[#B9C4B8]/60">
                      {formData.review.length} characters
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={formData.review}
                    onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                    placeholder={
                      isKn
                        ? 'ವಾಸ್ತವ್ಯ, ಕೊಡವ ಉಪಹಾರ, ತೋಟದ ಪ್ರಶಾಂತತೆ ಅಥವಾ ಹೋಸ್ಟ್ ಆತಿಥ್ಯದ ಬಗ್ಗೆ ತಿಳಿಸಿ...'
                        : 'Share highlights of your stay: morning coffee aroma, home-cooked Kodava meals, nature walks, peaceful nights...'
                    }
                    className="w-full bg-[#1B4332] border border-[#B8964A]/30 rounded-xl px-4 py-2.5 text-[#F3EDDD] placeholder-[#B9C4B8]/40 focus:outline-none focus:border-[#D9BC7A]"
                    required
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-3 rounded-xl border border-[#1B4332] text-[#B9C4B8] hover:text-white cursor-pointer transition-colors"
                  >
                    {isKn ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] text-[#0F2A20] font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#0F2A20]" />
                        <span>{isKn ? 'ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Submitting...'}</span>
                      </>
                    ) : (
                      <span>{isKn ? 'ವಿಮರ್ಶೆ ಸಲ್ಲಿಸಿ' : 'Submit Review'}</span>
                    )}
                  </button>
                </div>

                <p className="text-[10px] text-center text-[#B9C4B8]/60 pt-1">
                  {isKn
                    ? 'ನಿಮ್ಮ ವಿಮರ್ಶೆಯು ತಕ್ಷಣವೇ ಪ್ರಕಟವಾಗುತ್ತದೆ ಮತ್ತು ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಸಂಗ್ರಹಗೊಳ್ಳುತ್ತದೆ.'
                    : 'Your review publishes directly to the guestbook and is stored safely in our database.'}
                </p>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
