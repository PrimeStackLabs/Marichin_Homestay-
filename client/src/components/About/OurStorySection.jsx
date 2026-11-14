import React, { useEffect, useRef, useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useLanguage } from '../../context/LanguageContext';

export const OurStorySection = ({ theme = 'dark' }) => {
  const { siteSettings } = useAdmin();
  const { language } = useLanguage();
  const isKn = language === 'kn';
  // References for the 4 animated image cards
  const item1Ref = useRef(null);
  const item2Ref = useRef(null);
  const item3Ref = useRef(null);
  const item4Ref = useRef(null);

  // Visibility states
  const [visibleItems, setVisibleItems] = useState({
    item1: false,
    item2: false,
    item3: false,
    item4: false,
  });

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setVisibleItems({ item1: true, item2: true, item3: true, item4: true });
      return;
    }

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.15,
    };

    const observerCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const targetKey = entry.target.dataset.itemKey;
          if (targetKey) {
            setVisibleItems((prev) => ({ ...prev, [targetKey]: true }));
            observer.unobserve(entry.target);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    const elements = [
      { ref: item1Ref, key: 'item1' },
      { ref: item2Ref, key: 'item2' },
      { ref: item3Ref, key: 'item3' },
      { ref: item4Ref, key: 'item4' },
    ];

    elements.forEach(({ ref, key }) => {
      if (ref.current) {
        ref.current.dataset.itemKey = key;
        observer.observe(ref.current);
      }
    });

    return () => observer.disconnect();
  }, []);

  const isDark = theme === 'dark';

  return (
    <section className={`relative py-16 sm:py-24 border-b border-[#B8964A]/20 overflow-hidden ${
      isDark ? 'bg-[#0F2A20] bg-dark-radial text-[#F3EDDD]' : 'bg-[#FAF6EC] text-[#1A2A21]'
    }`}>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        
        {/* Section Header */}
        <div className="mb-10 sm:mb-14">
          <span className={`text-xs font-semibold uppercase tracking-[0.18em] block mb-2.5 ${
            isDark ? 'text-[#D9BC7A]' : 'text-[#A8654A]'
          }`}>
            {isKn ? 'ನಮ್ಮ ಕಥೆ • ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇ' : 'OUR STORY • MARICHIN HOMESTAY'}
          </span>
          <h2 className={`font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.15] max-w-3xl ${
            isDark ? 'text-[#F3EDDD]' : 'text-[#0F2A20]'
          }`}>
            {isKn ? (
              <>ಕೊಡಗಿನ ಮಣ್ಣಿನಲ್ಲಿ ಬೇರೂರಿ,<br />ಪ್ರಶಾಂತತೆಗಾಗಿ ನಿರ್ಮಿತ</>
            ) : (
              <>Rooted in Kodagu Soil,<br />Crafted for Tranquility</>
            )}
          </h2>

          {/* Golden Leaf Divider */}
          <div className="flex items-center gap-2 my-5">
            <svg className="w-5 h-5 text-[#B8964A]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8Z" />
            </svg>
            <div className="w-16 h-[1.5px] bg-gradient-to-r from-[#B8964A] to-transparent" />
          </div>

          {/* Two-Column Story Paragraphs */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 text-base font-light leading-[1.7] ${
            isDark ? 'text-[#B9C4B8]' : 'text-[#5F6B62]'
          }`}>
            <p>
              {isKn
                ? 'ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇ ಕುಶಾಲನಗರ ಸಮೀಪದ ಗುಡ್ಡೆ ಹೊಸೂರು ಅಂಚೆಯ ಚಿಕ್ಕಬೆಟ್ಟಗೇರಿ ಗ್ರಾಮದಲ್ಲಿ ಹಚ್ಚ ಹಸಿರಿನ ಕಾಫಿ ತೋಟದ ನಡುವೆ ನೆಲೆಸಿದೆ. ಜನದಟ್ಟಣೆಯ ವಾಣಿಜ್ಯ ರೆಸಾರ್ಟ್‌ಗಳಿಗಿಂತ ಭಿನ್ನವಾಗಿ, ನಮ್ಮ ಹೋಂಸ್ಟೇ ಅತಿಥಿಗಳಿಗೆ ಆಹ್ಲಾದಕರ ವಿಶ್ರಾಂತಿ ನೀಡಲು ಪ್ರಶಾಂತ ಕಾಫಿ ತೋಟಗಳ ಮಧ್ಯದಲ್ಲಿದೆ.'
                : (siteSettings?.aboutStoryText || 'Marichin Homestay is nestled within a lush green coffee estate in Chikkabettageri Village, Gudde Hosur Post, near Kushalnagar. Unlike crowded commercial resorts, our homestay is situated amidst peaceful coffee plantations to create a relaxing retreat for guests.')}
            </p>
            <p>
              {isKn
                ? 'ನೀವು ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇಗೆ ಬಂದಾಗ, ನಮ್ಮ ಕುಟುಂಬದ ಮನೆಗೆ ಆತ್ಮೀಯ ಅತಿಥಿಗಳಾಗಿ ಸ್ವಾಗತಿಸಲಾಗುತ್ತದೆ. ರುಚಿಯಾದ ಸಾಂಪ್ರದಾಯಿಕ ಮನೆ ಊಟವನ್ನು ಸವಿಯುತ್ತಾ, ಸಂಜೆಯ ಬೆಚ್ಚನೆಯ ಕ್ಯಾಂಪ್‌ಫೈರ್ ಬಳಿ ವಿಶ್ರಮಿಸುತ್ತಾ, ನಯನಮನೋಹರ ಕಾಫಿ ಹಾದಿಗಳಲ್ಲಿ ನಿರಾತಂಕ ನಡಿಗೆಯನ್ನು ಆನಂದಿಸಬಹುದು.'
                : 'When you arrive at Marichin Homestay, you are welcomed as guests into our family home, enjoying authentic home-cooked food, relaxing by the evening campfire, and taking unhurried walks along scenic coffee trails.'}
            </p>
          </div>
        </div>

        {/* 4 Story Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
          
          {/* 01. Estate Setting */}
          <div
            ref={item1Ref}
            data-item-key="item1"
            className={`flex flex-col space-y-3 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              visibleItems.item1
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 -translate-y-10 scale-105 pointer-events-none'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full border border-[#B8964A]/50 flex items-center justify-center text-[10px] text-[#B8964A] font-bold shadow-sm ${
                  isDark ? 'bg-[#1B4332]' : 'bg-white'
                }`}>
                  01
                </span>
                <h3 className={`font-serif text-xl sm:text-2xl font-semibold italic ${
                  isDark ? 'text-[#F3EDDD]' : 'text-[#0F2A20]'
                }`}>
                  {isKn ? 'ತೋಟದ ಪರಿಸರ' : 'Estate Setting'}
                </h3>
              </div>
              <div className="pl-3 border-l-2 border-[#B8964A]/50 ml-3.5">
                <p className={`text-xs font-light ${isDark ? 'text-[#B9C4B8]' : 'text-[#5F6B62]'}`}>
                  {isKn ? 'ಹಚ್ಚ ಹಸಿರಿನ ಕಾಫಿ ತೋಟಗಳು ಮತ್ತು ಪ್ರಶಾಂತ ನೈಸರ್ಗಿಕ ಪರಿಸರ.' : 'Lush coffee plantations and tranquil greenery.'}
                </p>
              </div>
            </div>

            <div className={`relative rounded-3xl overflow-hidden border transition-all duration-300 aspect-[16/10] ${
              isDark 
                ? 'bg-[#1B4332] border-[#B8964A]/25 shadow-[0_12px_36px_rgba(0,0,0,0.45)]' 
                : 'bg-white border-[#F1E9D8] shadow-[0_10px_40px_rgba(15,42,32,0.08)]'
            }`}>
              <img
                src="/images/realimage/homeimage.jpeg"
                alt="Marichin Homestay estate exterior"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
            </div>
          </div>

          {/* 02. Homely Comfort */}
          <div
            ref={item2Ref}
            data-item-key="item2"
            className={`flex flex-col space-y-3 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] delay-150 ${
              visibleItems.item2
                ? 'opacity-100 translate-x-0 scale-100'
                : 'opacity-0 translate-x-10 scale-105 pointer-events-none'
            }`}
          >
            <div className={`relative rounded-3xl overflow-hidden border transition-all duration-300 aspect-[16/10] ${
              isDark 
                ? 'bg-[#1B4332] border-[#B8964A]/25 shadow-[0_12px_36px_rgba(0,0,0,0.45)]' 
                : 'bg-white border-[#F1E9D8] shadow-[0_10px_40px_rgba(15,42,32,0.08)]'
            }`}>
              <img
                src="/images/realimage/real12.jpeg"
                alt="Guests enjoying the estate atmosphere"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full border border-[#B8964A]/50 flex items-center justify-center text-[10px] text-[#B8964A] font-bold shadow-sm ${
                  isDark ? 'bg-[#1B4332]' : 'bg-white'
                }`}>
                  02
                </span>
                <h3 className={`font-serif text-xl sm:text-2xl font-semibold italic ${
                  isDark ? 'text-[#F3EDDD]' : 'text-[#0F2A20]'
                }`}>
                  {isKn ? 'ಮನೆಯಂಗಳದ ಆರಾಮ' : 'Homely Comfort'}
                </h3>
              </div>
              <div className="pl-3 border-l-2 border-[#B8964A]/50 ml-3.5">
                <p className={`text-xs font-light ${isDark ? 'text-[#B9C4B8]' : 'text-[#5F6B62]'}`}>
                  {isKn ? 'ಆರಾಮದಾಯಕ ಹೋಂಸ್ಟೇ ಕೊಠಡಿಗಳು ಮತ್ತು ರುಚಿಕರವಾದ ತಾಜಾ ಮನೆ ಊಟ.' : 'Comfortable homestay rooms and delicious home-cooked meals.'}
                </p>
              </div>
            </div>
          </div>

          {/* 03. Guided Estate Walks */}
          <div
            ref={item3Ref}
            data-item-key="item3"
            className={`flex flex-col space-y-3 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] delay-300 ${
              visibleItems.item3
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-10 scale-105 pointer-events-none'
            }`}
          >
            <div className={`relative rounded-3xl overflow-hidden border transition-all duration-300 aspect-[16/10] ${
              isDark 
                ? 'bg-[#1B4332] border-[#B8964A]/25 shadow-[0_12px_36px_rgba(0,0,0,0.45)]' 
                : 'bg-white border-[#F1E9D8] shadow-[0_10px_40px_rgba(15,42,32,0.08)]'
            }`}>
              <img
                src="/images/realimage/real13.jpeg"
                alt="Guided plantation walks through coffee estates"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full border border-[#B8964A]/50 flex items-center justify-center text-[10px] text-[#B8964A] font-bold shadow-sm ${
                  isDark ? 'bg-[#1B4332]' : 'bg-white'
                }`}>
                  03
                </span>
                <h3 className={`font-serif text-xl sm:text-2xl font-semibold italic ${
                  isDark ? 'text-[#F3EDDD]' : 'text-[#0F2A20]'
                }`}>
                  {isKn ? 'ಮಾರ್ಗದರ್ಶಿ ತೋಟದ ನಡಿಗೆ' : 'Guided Estate Walks'}
                </h3>
              </div>
              <div className="pl-3 border-l-2 border-[#B8964A]/50 ml-3.5">
                <p className={`text-xs font-light ${isDark ? 'text-[#B9C4B8]' : 'text-[#5F6B62]'}`}>
                  {isKn ? 'ಕಾಫಿ ಹಾದಿಗಳನ್ನು ಅನ್ವೇಷಿಸಿ ಮತ್ತು ಸ್ಥಳೀಯ ತೋಟದ ಜೀವನವನ್ನು ಹತ್ತಿರದಿಂದ ತಿಳಿಯಿರಿ.' : 'Explore scenic coffee trails and learn about local plantation life.'}
                </p>
              </div>
            </div>
          </div>

          {/* 04. Evening Campfire */}
          <div
            ref={item4Ref}
            data-item-key="item4"
            className={`flex flex-col space-y-3 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] delay-[450ms] ${
              visibleItems.item4
                ? 'opacity-100 translate-x-0 scale-100'
                : 'opacity-0 translate-x-10 scale-105 pointer-events-none'
            }`}
          >
            <div className={`relative rounded-3xl overflow-hidden border transition-all duration-300 aspect-[16/10] ${
              isDark 
                ? 'bg-[#1B4332] border-[#B8964A]/25 shadow-[0_12px_36px_rgba(0,0,0,0.45)]' 
                : 'bg-white border-[#F1E9D8] shadow-[0_10px_40px_rgba(15,42,32,0.08)]'
            }`}>
              <img
                src="/images/realimage/real14.jpeg"
                alt="Evening campfire gathering with games"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full border border-[#B8964A]/50 flex items-center justify-center text-[10px] text-[#B8964A] font-bold shadow-sm ${
                  isDark ? 'bg-[#1B4332]' : 'bg-white'
                }`}>
                  04
                </span>
                <h3 className={`font-serif text-xl sm:text-2xl font-semibold italic ${
                  isDark ? 'text-[#F3EDDD]' : 'text-[#0F2A20]'
                }`}>
                  {isKn ? 'ಸಂಜೆಯ ಕ್ಯಾಂಪ್‌ಫೈರ್' : 'Evening Campfire'}
                </h3>
              </div>
              <div className="pl-3 border-l-2 border-[#B8964A]/50 ml-3.5">
                <p className={`text-xs font-light ${isDark ? 'text-[#B9C4B8]' : 'text-[#5F6B62]'}`}>
                  {isKn ? 'ಒಳಾಂಗಣ ಮತ್ತು ಹೊರಾಂಗಣ ಆಟಗಳೊಂದಿಗೆ ಬೆಚ್ಚನೆಯ ಕ್ಯಾಂಪ್‌ಫೈರ್ ಸುತ್ತ ಸಂಜೆಯನ್ನು ಕಳೆಯಿರಿ.' : 'Gather around the warm campfire with indoor & outdoor games.'}
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
