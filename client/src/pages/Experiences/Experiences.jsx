import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { EXPERIENCES_DATA, HOMESTAY_INFO } from '../../data/homestayData';
import { PageBanner } from '../../components/Common/PageBanner';
import {
  Compass,
  ArrowRight,
  Flame,
  Coffee,
  Sparkles,
  Gamepad2,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const getExpCategory = (exp, isKn = false) => {
  if (!isKn) {
    if (exp.category && exp.category.trim()) return exp.category;
    if (exp.badge && exp.badge.trim()) return exp.badge;
  }
  const slug = (exp.slug || exp.id || '').toLowerCase();
  if (isKn) {
    if (exp.categoryKn && exp.categoryKn.trim()) return exp.categoryKn;
    if (slug.includes('walk')) return 'ತೋಟದ ನಡಿಗೆ';
    if (slug.includes('camp') || slug.includes('fire')) return 'ಸಂಜೆಯ ಕೂಟ';
    if (slug.includes('game')) return 'ಕುಟುಂಬದ ಆಟಗಳು';
    if (slug.includes('food') || slug.includes('dining')) return 'ಮನೆ ಊಟ';
  } else {
    if (slug.includes('walk')) return 'Plantation Stroll';
    if (slug.includes('camp') || slug.includes('fire')) return 'Evening Gathering';
    if (slug.includes('game')) return 'Family Recreation';
    if (slug.includes('food') || slug.includes('dining')) return 'Home Dining';
  }
  if (exp.category && exp.category.trim()) return exp.category;
  if (exp.badge && exp.badge.trim()) return exp.badge;
  return isKn ? 'ನೈಜ ಅನುಭವ' : 'Authentic Experience';
};

const getExpTiming = (exp, isKn = false) => {
  if (!isKn) {
    if (exp.timing && exp.timing.trim()) return exp.timing;
    if (exp.durationLabel && exp.durationLabel.trim()) return exp.durationLabel;
    if (exp.duration && exp.duration.trim()) return exp.duration;
  }
  const slug = (exp.slug || exp.id || '').toLowerCase();
  if (isKn) {
    if (exp.timingKn && exp.timingKn.trim()) return exp.timingKn;
    if (slug.includes('walk')) return 'ಬೆಳಿಗ್ಗೆ 7:00 – 9:30 ಮತ್ತು ಸಂಜೆ 4:30';
    if (slug.includes('camp') || slug.includes('fire')) return 'ರಾತ್ರಿ 7:30 – 9:30 (ಸಂಜೆ)';
    if (slug.includes('game')) return 'ದಿನವಿಡೀ ಲಭ್ಯ';
    if (slug.includes('food') || slug.includes('dining')) return 'ಉಪಹಾರ, ಮಧ್ಯಾಹ್ನ ಮತ್ತು ರಾತ್ರಿಯ ಊಟ';
  } else {
    if (slug.includes('walk')) return '7:00 AM – 9:30 AM & 4:30 PM';
    if (slug.includes('camp') || slug.includes('fire')) return '7:30 PM – 9:30 PM (Evenings)';
    if (slug.includes('game')) return 'Available All Day';
    if (slug.includes('food') || slug.includes('dining')) return 'Breakfast, Lunch & Dinner';
  }
  if (exp.timing && exp.timing.trim()) return exp.timing;
  if (exp.durationLabel && exp.durationLabel.trim()) return exp.durationLabel;
  if (exp.duration && exp.duration.trim()) return exp.duration;
  return '';
};

const getExpDescription = (exp, isKn = false) => {
  if (!isKn && exp.description && exp.description.trim()) {
    return exp.description;
  }
  if (isKn && exp.descriptionKn && exp.descriptionKn.trim()) {
    return exp.descriptionKn;
  }
  const slug = (exp.slug || exp.id || '').toLowerCase();
  if (slug.includes('walk')) {
    return isKn
      ? 'ಸುತ್ತಲಿನ ಹಚ್ಚಹಸಿರಿನ ಕಾಫಿ ಮತ್ತು ಕರಿಮೆಣಸು ತೋಟದಲ್ಲಿ ಪ್ರಶಾಂತವಾಗಿ ವಿಹರಿಸಿ. ತಂಪಾದ ಬೆಳಗಿನ ಗಾಳಿ, ಶುದ್ಧ ನೈಸರ್ಗಿಕ ಪರಿಸರ ಮತ್ತು ಸಿಲ್ವರ್ ಓಕ್ ಮರಗಳ ನೆರಳನ್ನು ನಿಮ್ಮ ಕೊಠಡಿಯ ಮುಂದೆಯೇ ಆನಂದಿಸಿ.'
      : 'Take a peaceful stroll through the surrounding lush green coffee and pepper plantation. Enjoy the crisp morning breeze, fresh country air, and natural shade under native silver oak trees right outside your room.';
  }
  if (slug.includes('camp') || slug.includes('fire')) {
    return isKn
      ? 'ಸಂಜೆಯಾಗುತ್ತಿದ್ದಂತೆ ಹೋಂಸ್ಟೇಯ ಮುಕ್ತ ಅಂಗಳದಲ್ಲಿ ಉರಿಯುವ ಮರದ ಕ್ಯಾಂಪ್‌ಫೈರ್ ಸುತ್ತ ಕುಳಿತುಕೊಳ್ಳಿ. ಕಥೆಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಲು, ಹಾಡುಗಳನ್ನು ಆಲಿಸಲು ಮತ್ತು ನಕ್ಷತ್ರ ತುಂಬಿದ ಆಕಾಶವನ್ನು ವೀಕ್ಷಿಸಲು ಇದು ಅತ್ಯಂತ ಸುಂದರ ತಾಣ.'
      : "Gather around a warm, crackling wood-fired campfire in the homestay's open courtyard as the evening cools down. An ideal setting to unwind, share stories, listen to acoustic music, and gaze at clear starlit skies with family and friends.";
  }
  if (slug.includes('game')) {
    return isKn
      ? 'ಒಳಾಂಗಣ ಬೋರ್ಡ್ ಆಟಗಳು ಮತ್ತು ಹೊರಾಂಗಣ ಚಟುವಟಿಕೆಗಳೊಂದಿಗೆ ಕುಟುಂಬ ಹಾಗೂ ಸ್ನೇಹಿತರೊಂದಿಗೆ ಉಲ್ಲಾಸದ ಸಮಯ ಕಳೆಯಿರಿ. ಕ್ಯಾರಮ್, ಚೆಸ್ ಮತ್ತು ತೋಟದ ಮುಕ್ತ ಆಟಗಳ ಆನಂದ ಪಡೆಯಿರಿ.'
      : 'Enjoy quality leisure time with family and friends across a variety of indoor board games and open-air activities. Whether you prefer a competitive game of carrom on the covered portico or casual outdoor fun in the estate grounds.';
  }
  if (slug.includes('food') || slug.includes('dining')) {
    return isKn
      ? 'ನಮ್ಮ ವಿಶಾಲ ಊಟದ ಸಭಾಂಗಣದಲ್ಲಿ ಬಿಸಿಯಾಗಿ ಬಡಿಸಲಾಗುವ ತಾಜಾ ಮತ್ತು ಪೌಷ್ಟಿಕ ಮನೆ ಊಟವನ್ನು ಸವಿಯಿರಿ. ಸ್ಥಳೀಯ ಸಾಂಬಾರ ಪದಾರ್ಥಗಳೊಂದಿಗೆ ಸಾಂಪ್ರದಾಯಿಕ ಶೈಲಿಯಲ್ಲಿ ಪ್ರೀತಿಯಿಂದ ತಯಾರಿಸಿದ ಅಡುಗೆ.'
      : 'Relish wholesome, freshly prepared home-cooked meals served hot in our spacious dining hall. Prepared using traditional homestay recipes, local flavors, and seasonal spices for an authentic, comforting taste of home.';
  }
  return exp.description || '';
};

const getExpTitle = (exp, isKn = false) => {
  if (!isKn) return exp.title;
  if (exp.titleKn && exp.titleKn.trim()) return exp.titleKn;
  const slug = (exp.slug || exp.id || '').toLowerCase();
  if (slug.includes('walk')) return 'ಕಾಫಿ ತೋಟದ ನಡಿಗೆ';
  if (slug.includes('camp') || slug.includes('fire')) return 'ಬೆಚ್ಚನೆಯ ಕ್ಯಾಂಪ್‌ಫೈರ್';
  if (slug.includes('game')) return 'ಒಳಾಂಗಣ ಮತ್ತು ಹೊರಾಂಗಣ ಆಟಗಳು';
  if (slug.includes('food') || slug.includes('dining')) return 'ಸಾಂಪ್ರದಾಯಿಕ ಮನೆ ಊಟ';
  return exp.title;
};

const getExpHighlights = (exp, isKn = false) => {
  if (!isKn && Array.isArray(exp.highlights) && exp.highlights.length > 0) {
    return exp.highlights;
  }
  if (isKn && Array.isArray(exp.highlightsKn) && exp.highlightsKn.length > 0) {
    return exp.highlightsKn;
  }
  const slug = (exp.slug || exp.id || '').toLowerCase();
  if (slug.includes('walk')) {
    return isKn
      ? [
          'ಕಾಫಿ ಮತ್ತು ಮೆಣಸಿನ ಗಿಡಗಳ ನಡುವೆ ನೆರಳಿನ ಕಾಲುದಾರಿಗಳು',
          'ಮುಂಜಾನೆಯ ಶುದ್ಧ ಗಾಳಿ ಮತ್ತು ಪಕ್ಷಿಗಳ ಇಂಚರ',
          'ನಿಮ್ಮದೇ ಬಿಡುವಿನ ವೇಗದಲ್ಲಿ ನೆಮ್ಮದಿಯ ತೋಟದ ನಡಿಗೆ',
          'ಕಾಫಿ ಹಣ್ಣುಗಳು ಮತ್ತು ತೋಟದ ಸಸ್ಯಗಳ ಬಗ್ಗೆ ಮಾರ್ಗದರ್ಶನ'
        ]
      : [
          'Shaded walking trails through coffee & pepper plants',
          'Fresh estate morning air and gentle birdsong',
          'Peaceful plantation stroll at your own relaxed pace',
          'Host guidance on estate seasonal flora & coffee berries'
        ];
  }
  if (slug.includes('camp') || slug.includes('fire')) {
    return isKn
      ? [
          'ಹೋಂಸ್ಟೇ ಅಂಗಳದಲ್ಲಿ ಬೆಚ್ಚನೆಯ ನೈಜ ಮರದ ಕ್ಯಾಂಪ್‌ಫೈರ್',
          'ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ಆರಾಮದಾಯಕ ಹೊರಾಂಗಣ ಆಸನ ವ್ಯವಸ್ಥೆ',
          'ತಾರಾಗಣದ ಕೆಳಗೆ ತಂಪಾದ ಪರ್ವತದ ಸಂಜೆ ತಂಗಾಳಿ',
          'ಕುಟುಂಬದ ಮಾತುಕತೆ ಮತ್ತು ನೆನಪುಗಳಿಗೆ ಹಿತವಾದ ವಾತಾವರಣ'
        ]
      : [
          'Warm wood-fired bonfire in the central open courtyard',
          'Cozy outdoor seating arrangements for your group',
          'Cool evening mountain breeze under starry skies',
          'Relaxed ambiance for family bonding and conversations'
        ];
  }
  if (slug.includes('game')) {
    return isKn
      ? [
          'ಕ್ಯಾರಮ್ ಬೋರ್ಡ್, ಚೆಸ್ ಮತ್ತು ಜನಪ್ರಿಯ ಬೋರ್ಡ್ ಆಟಗಳು',
          'ಮಕ್ಕಳು ಮತ್ತು ಹಿರಿಯರಿಗೆ ಹೊರಾಂಗಣ ಅಂಗಳದ ಆಟದ ಜಾಗ',
          'ವಿಶಾಲವಾದ ಮುಚ್ಚಿದ ವರಾಂಡಾ ಮತ್ತು ವಿಶ್ರಾಂತಿ ಆಸನಗಳು',
          'ಯಾವ ಸಮಯದಲ್ಲಾದರೂ ಆಡಬಹುದಾದ ಆಪ್ತ ಆಟಗಳು'
        ]
      : [
          'Carrom board, chess, and popular family board games',
          'Outdoor courtyard play area for kids and adults',
          'Spacious covered portico and seating for recreational time',
          'Casual fun and friendly matches at any hour'
        ];
  }
  if (slug.includes('food') || slug.includes('dining')) {
    return isKn
      ? [
          'ತಾಜಾವಾಗಿ ತಯಾರಿಸಿದ ಆರೋಗ್ಯಕರ ಮನೆ ಊಟದ ತಿನಿಸುಗಳು',
          'ಸ್ಥಳೀಯ ಸಾಂಬಾರ ಪದಾರ್ಥಗಳ ಸಾಂಪ್ರದಾಯಿಕ ಕೊಡಗಿನ ರುಚಿ',
          'ಶುಚಿಯಾದ ಒಳಾಂಗಣ ಊಟದ ಸಭಾಂಗಣ ಮತ್ತು ದೊಡ್ಡ ಮೇಜುಗಳು',
          'ಪ್ರೀತಿ ಮತ್ತು ಕಾಳಜಿಯಿಂದ ಬಡಿಸುವ ಬಿಸಿ ಬಫೆ ವ್ಯವಸ್ಥೆ'
        ]
      : [
          'Freshly prepared wholesome homestyle dishes',
          'Authentic regional taste with local spices and ingredients',
          'Comfortable, clean indoor dining hall with communal tables',
          'Buffet-style hot serving prepared with warmth and care'
        ];
  }
  if (Array.isArray(exp.highlights) && exp.highlights.length > 0) {
    return exp.highlights;
  }
  return [];
};

export const Experiences = () => {
  const { t, language } = useLanguage();
  const isKn = language === 'kn';
  const { experiences, siteSettings } = useAdmin();
  const settings = siteSettings || HOMESTAY_INFO;

  // Use dynamic experiences from admin context with homestayData fallback (do not slice off added experiences)
  const displayExperiences = (experiences && experiences.length > 0)
    ? experiences.filter((e) => e.isActive !== false)
    : EXPERIENCES_DATA;

  return (
    <div className="min-h-screen bg-[#FAF6EC] text-[#1A2A21]">

      {/* SECTION 1: Redesigned Hero Banner with 3 Floating Photo Cards */}
      <PageBanner pageKey="experiences" />

      {/* SECTION 2: 4 Real Experiences — Warm Ivory Background */}
      <section className="w-full bg-[#FAF6EC] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#B8964A]" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A]">
                {isKn ? 'ನೈಜ ಚಟುವಟಿಕೆಗಳು' : 'AUTHENTIC ACTIVITIES'}
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl text-[#0F2A20] font-normal tracking-tight">
              {isKn ? 'ತೋಟದ ಚಟುವಟಿಕೆಗಳು ಮತ್ತು ವಿಶ್ರಾಂತಿ' : 'Estate Activities & Relaxations'}
            </h2>
            <div className="w-16 h-0.5 bg-[#B8964A] mx-auto mt-3 mb-4" />
          </div>

          <div className="space-y-8 sm:space-y-10">
            {displayExperiences.map((exp, eIdx) => {
              const isReversed = eIdx % 2 !== 0;
              const expCategory = getExpCategory(exp, isKn);
              const expTiming = getExpTiming(exp, isKn);
              const expDescription = getExpDescription(exp, isKn);
              const expHighlights = getExpHighlights(exp, isKn);
              const expTitle = getExpTitle(exp, isKn);

              return (
                <div
                  key={exp.id || exp.slug || eIdx}
                  className="rounded-3xl border border-[#F1E9D8] bg-white hover:border-[#B8964A]/50 transition-all duration-300 shadow-[0_4px_24px_rgba(15,42,32,0.06)] hover:shadow-[0_8px_32px_rgba(15,42,32,0.1)] group overflow-hidden"
                >
                  <div className={`flex flex-col lg:flex-row items-stretch ${isReversed ? 'lg:flex-row-reverse' : ''}`}>
                    {/* Small, Compact Framed Image Container */}
                    <div className="p-3.5 sm:p-5 lg:p-6 flex-shrink-0 lg:w-[350px] xl:w-[380px] flex items-center justify-center">
                      <div className="w-full h-56 sm:h-64 lg:h-full lg:min-h-[250px] lg:max-h-[280px] rounded-2xl overflow-hidden relative shadow-sm border border-[#F1E9D8] bg-[#FAF6EC]">
                        <img
                          src={exp.image}
                          alt={expTitle}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 pointer-events-none" />

                        {/* Category Tag on Image */}
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider text-[#0F2A20] bg-[#D9BC7A] shadow-sm">
                          {expCategory}
                        </span>

                        {/* Location Badge on Image */}
                        <span className="absolute bottom-3 left-3 text-[11px] font-mono text-[#D9BC7A] bg-[#0F2A20]/90 px-2.5 py-0.5 rounded-full border border-[#B8964A]/30 backdrop-blur-sm">
                          {isKn ? 'ಹೋಂಸ್ಟೇ ಆವರಣದಲ್ಲಿದೆ' : (exp.distanceLabel || exp.distance || 'On Premises')}
                        </span>
                      </div>
                    </div>

                    {/* Rich Narrative Column */}
                    <div className="flex-1 p-5 sm:p-6 lg:p-7 flex flex-col justify-between">
                      <div>
                        {/* Top Meta Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                          <span className="text-[11px] uppercase tracking-wider font-bold text-[#A8654A] bg-[#FAF6EC] px-3 py-1 rounded-full border border-[#F1E9D8]">
                            {expCategory}
                          </span>
                          {expTiming ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-[#5F6B62] bg-[#FAF6EC] px-3 py-1 rounded-full border border-[#F1E9D8] font-mono">
                              <Clock className="w-3.5 h-3.5 text-[#B8964A]" />
                              <span>{expTiming}</span>
                            </span>
                          ) : null}
                        </div>

                        {/* Title */}
                        <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#0F2A20] mb-2 group-hover:text-[#B8964A] transition-colors">
                          {expTitle}
                        </h3>

                        {/* Full Descriptive Overview */}
                        <p className="text-sm sm:text-[14.5px] text-[#4A5568] font-light leading-relaxed mb-4">
                          {expDescription}
                        </p>

                        {/* "What You'll Experience" Highlights Box */}
                        {expHighlights.length > 0 && (
                          <div className="bg-[#FAF6EC] rounded-2xl p-4 border border-[#F1E9D8] mb-5">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-[#A8654A] mb-2.5 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#B8964A]" />
                              <span>{isKn ? 'ನೀವು ಅನುಭವಿಸುವುದು' : "What You'll Experience"}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2D3748]">
                              {expHighlights.map((h, hIdx) => (
                                <div key={hIdx} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                                  <span className="leading-snug">{h}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer Row */}
                      <div className="pt-4 border-t border-[#F1E9D8] flex flex-wrap items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2D6A4F] bg-[#EBF3ED] px-3 py-1.5 rounded-full border border-[#2D6A4F]/20">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
                          <span>{isKn ? 'ಹೋಂಸ್ಟೇ ವಾಸ್ತವ್ಯದಲ್ಲಿ ಒಳಗೊಂಡಿದೆ' : 'Included with Homestay Stay'}</span>
                        </span>
                        <Link
                          to="/booking"
                          className="px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold text-[#0F2A20] bg-[#B8964A] hover:bg-[#D9BC7A] transition-all shadow-sm hover:-translate-y-0.5 flex items-center gap-2"
                        >
                          <span>{isKn ? 'ವಾಸ್ತವ್ಯ ಕಾಯ್ದಿರಿಸಿ' : 'Reserve Stay'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
};
