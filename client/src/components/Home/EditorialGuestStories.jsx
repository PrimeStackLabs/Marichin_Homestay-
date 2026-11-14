import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { 
  Star, 
  ShieldCheck, 
  CheckCircle2, 
  Quote, 
  MapPin, 
  Sparkles, 
  ArrowRight,
  Heart,
  Calendar,
  Award,
  PenLine
} from 'lucide-react';

export const EditorialGuestStories = () => {
  const { language } = useLanguage();
  const isKn = language === 'kn';
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const { reviews } = useAdmin();

  // Show only authentic, admin-approved reviews from database (up to 6 on home)
  const approvedReviews = (reviews || []).filter(
    (r) => r && (r.status === 'approved' || r.approved === true || r.isApproved === true)
  );
  const displayedReviews = approvedReviews.slice(0, 6);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      className="relative w-full bg-[#FAF6EC] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className={`text-center max-w-3xl mx-auto mb-12 sm:mb-16 transition-all duration-700 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#F1E9D8] mb-3.5 shadow-sm">
            <Star className="w-3.5 h-3.5 text-[#B8964A] fill-[#B8964A]" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0F2A20]">
              {isKn ? 'ಅತಿಥಿ ಧ್ವನಿಗಳು · ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇ ನೆನಪುಗಳು' : 'GUEST VOICES · MARICHIN HOMESTAY ARCHIVES'}
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#0F2A20] font-normal tracking-tight leading-tight">
            {isKn ? 'ಅತಿಥಿಗಳ ಅನುಭವ ಕಥೆಗಳು' : 'Editorial Guest Stories'}
          </h2>
          <div className="w-20 h-0.5 bg-[#B8964A] mx-auto mt-4 mb-4" />
          <p className="text-base sm:text-lg text-[#5F6B62] font-light leading-relaxed max-w-2xl mx-auto">
            {isKn
              ? 'ನಮ್ಮ ಪ್ರಶಾಂತ ಕಾಫಿ ತೋಟದಲ್ಲಿ ನೆಮ್ಮದಿಯ ರಜೆ ಕಳೆದ ಪ್ರಯಾಣಿಕರ ನೈಜ ನೆನಪುಗಳು ಮತ್ತು ಅನಿಸಿಕೆಗಳು.'
              : 'Reflections, candid photographs, and lingering memories from travelers who discovered unhurried tranquility across our private mountain valley retreat.'}
          </p>
        </div>

        {/* Real Approved Reviews or Guestbook Invitation */}
        {approvedReviews.length === 0 ? (
          <div className="max-w-xl mx-auto text-center p-8 sm:p-12 bg-white rounded-3xl border border-[#F1E9D8] shadow-sm mb-12">
            <Quote className="w-10 h-10 text-[#B8964A]/40 mx-auto mb-4" />
            <h3 className="font-serif text-xl sm:text-2xl text-[#0F2A20] font-semibold mb-2">
              {isKn ? 'ನಮ್ಮ ಅತಿಥಿ ಪುಸ್ತಕ ನಿಮ್ಮ ಕಥೆಗಾಗಿ ಕಾಯುತ್ತಿದೆ' : 'Our Guestbook Awaits Your Story'}
            </h3>
            <p className="text-sm text-[#5F6B62] font-light leading-relaxed mb-6">
              {isKn
                ? 'ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇನಲ್ಲಿ ನಿಮ್ಮ ವಾಸ್ತವ್ಯವನ್ನು ಅನುಭವಿಸಿ ಮತ್ತು ನಮ್ಮ ಅತಿಥಿ ಪುಸ್ತಕದಲ್ಲಿ ನಿಮ್ಮ ಅನುಭವವನ್ನು ಹಂಚಿಕೊಳ್ಳಿ.'
                : 'Every stay at Marichin Homestay is personal and memorable. Experience our peaceful nature sanctuary and be among the first to write in our guestbook.'}
            </p>
            <Link
              to="/reviews?action=write"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs uppercase tracking-wider font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] shadow-md transition-all cursor-pointer"
            >
              <PenLine className="w-4 h-4" />
              <span>{isKn ? 'ವಿಮರ್ಶೆ ಬರೆಯಿರಿ' : 'Write in Guestbook'}</span>
            </Link>
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 gap-6 sm:gap-7 items-start ${
              displayedReviews.length === 1
                ? 'max-w-xl mx-auto'
                : displayedReviews.length === 2 || displayedReviews.length === 4
                ? 'md:grid-cols-2 max-w-5xl mx-auto'
                : 'md:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {displayedReviews.map((rev, idx) => (
              <StoryCard 
                key={rev._id || rev.id || idx} 
                review={rev} 
                isVisible={isVisible} 
                delayClass="delay-200" 
                isFeatured={idx === 0}
              />
            ))}
          </div>
        )}

        {/* Bottom Guestbook CTA */}
        <div className={`mt-14 sm:mt-20 text-center transition-all duration-700 delay-500 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <p className="text-xs sm:text-sm text-[#5F6B62] font-light mb-4">
            {isKn
              ? 'ಇಲ್ಲಿ ದಾಖಲಿಸಲಾದ ಪ್ರತಿಯೊಂದು ಅನಿಸಿಕೆಯೂ ನಮ್ಮಲ್ಲಿ ತಂಗಿದ ನೈಜ ಪ್ರವಾಸಿಗರು ಬರೆದದ್ದಾಗಿದೆ.'
              : 'Every memory recorded here was written by genuine travelers in our guestbook verandah.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/reviews"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all duration-300 shadow-[0_8px_24px_rgba(184,150,74,0.3)] hover:-translate-y-0.5"
            >
              <span>{isKn ? 'ಸಂಪೂರ್ಣ ಅತಿಥಿ ಪುಸ್ತಕ ವೀಕ್ಷಿಸಿ' : 'View All Guest Reviews'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/reviews?action=write"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#0F2A20] border border-[#0F2A20]/30 hover:bg-white transition-all duration-300 shadow-sm"
            >
              <PenLine className="w-4 h-4 text-[#B8964A]" />
              <span>{isKn ? 'ವಿಮರ್ಶೆ ಬರೆಯಿರಿ' : 'Write a Review'}</span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};

// Sub-component for Individual Varied-Size Review Card (Crisp White Card on Ivory)
const StoryCard = ({ review, isVisible, delayClass, isFeatured }) => {
  const [avatarFailed, setAvatarFailed] = useState(false);

  const ratingCount = Math.min(5, Math.max(1, Number(review.rating) || 5));
  const reviewText = review.text || review.review || '';
  const reviewLocation = review.location || review.city || 'Karnataka, India';
  const reviewDate =
    review.date ||
    review.stayDate ||
    (review.createdAt
      ? new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
      : 'Recent');
  const guestInitials =
    String(review.guestName || 'Guest')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'G';

  return (
    <article
      className={`group rounded-2xl sm:rounded-3xl bg-white border border-[#F1E9D8] hover:border-[#B8964A] transition-all duration-500 shadow-[0_10px_40px_rgba(15,42,32,0.08)] hover:shadow-xl flex flex-col justify-between overflow-hidden ${delayClass} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {/* Optional Stay Photo */}
      {review.stayPhoto && (
        <div className={`relative overflow-hidden w-full ${isFeatured ? 'h-52 sm:h-64' : 'h-40 sm:h-48'}`}>
          <img
            src={review.stayPhoto}
            alt={review.headline || review.stayedIn}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          
          {review.stayCategory && (
            <div className="absolute top-3.5 left-3.5 z-10">
              <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.18em] px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#0F2A20] border border-[#F1E9D8] shadow-sm">
                {review.stayCategory}
              </span>
            </div>
          )}

          {review.nights && (
            <div className="absolute top-3.5 right-3.5 z-10">
              <span className="inline-block text-[10px] font-mono text-white px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm">
                {review.nights}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Card Content Area */}
      <div className="p-6 sm:p-7 lg:p-8 flex-1 flex flex-col justify-between">
        <div>
          {!review.stayPhoto && review.stayCategory && (
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.18em] px-3 py-1 rounded-full bg-[#FAF6EC] text-[#0F2A20] border border-[#F1E9D8]">
                {review.stayCategory}
              </span>
              {review.nights && (
                <span className="text-[10px] font-mono text-[#5F6B62]">
                  {review.nights}
                </span>
              )}
            </div>
          )}

          {/* Star Rating & Quote Accent */}
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-1 text-[#B8964A]">
              {[...Array(ratingCount)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <Quote className="w-5 h-5 text-[#B8964A]/40 group-hover:text-[#B8964A] transition-colors" />
          </div>

          {/* Headline */}
          {review.headline && (
            <h3 className="font-serif text-base sm:text-lg font-semibold text-[#0F2A20] group-hover:text-[#B8964A] transition-colors leading-snug mb-3">
              "{review.headline}"
            </h3>
          )}

          {/* Review Text */}
          <p className="text-sm text-[#5F6B62] font-light leading-relaxed italic mb-6">
            "{reviewText}"
          </p>
        </div>

        {/* Guest Profile Footer */}
        <div className="pt-4 border-t border-[#F1E9D8] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative flex-shrink-0">
              {review.avatar && !avatarFailed ? (
                <img
                  src={review.avatar}
                  alt={review.guestName}
                  onError={() => setAvatarFailed(true)}
                  className="w-10 h-10 rounded-full object-cover border border-[#B8964A]/40 ring-2 ring-white"
                  loading="lazy"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full bg-[#0F2A20] text-[#D9BC7A] border border-[#B8964A]/50 ring-2 ring-white flex items-center justify-center font-serif text-xs font-semibold select-none"
                  aria-label={review.guestName}
                >
                  {guestInitials}
                </div>
              )}
              {(review.verified || review.status === 'approved') && (
                <div 
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center text-white"
                  title="Verified Guest Stay"
                >
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            
            <div className="min-w-0">
              <h4 className="font-serif text-sm font-semibold text-[#0F2A20] truncate group-hover:text-[#B8964A] transition-colors">
                {review.guestName}
              </h4>
              <div className="flex items-center gap-1 text-xs text-[#5F6B62] truncate">
                <MapPin className="w-3 h-3 text-[#B8964A] flex-shrink-0" />
                <span>{reviewLocation}</span>
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-xs text-[#A8654A] font-medium block">
              {review.stayedIn || 'Standard Room'}
            </span>
            <span className="text-[10px] text-[#5F6B62] font-mono block">
              {reviewDate}
            </span>
          </div>
        </div>

      </div>
    </article>
  );
};
