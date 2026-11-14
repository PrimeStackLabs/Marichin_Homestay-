import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const EcoPhilosophySection = () => {
  const { language } = useLanguage();
  const isKn = language === 'kn';

  return (
    <section className="relative w-full bg-[#DDE6D3] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 lg:mb-16">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 sm:w-16 h-[1px] bg-gradient-to-r from-transparent to-[#0F2A20]" />
            <svg
              className="w-5 h-5 text-[#B8964A]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 21C12 21 8.5 16.5 8.5 12C8.5 7.5 12 3 12 3C12 3 15.5 7.5 15.5 12C15.5 16.5 12 21 12 21Z" />
              <path d="M4 14C4 14 7.5 12.5 10.5 12C13.5 11.5 16 9 16 9" />
              <path d="M20 14C20 14 16.5 12.5 13.5 12C10.5 11.5 8 9 8 9" />
            </svg>
            <div className="w-12 sm:w-16 h-[1px] bg-gradient-to-l from-transparent to-[#0F2A20]" />
          </div>

          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0F2A20] block mb-2">
            {isKn ? 'ನಮ್ಮ ಸೌಲಭ್ಯಗಳು ಮತ್ತು ಅನುಭವಗಳು' : 'OUR AMENITIES & EXPERIENCES'}
          </span>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[46px] text-[#0F2A20] font-normal tracking-wide leading-tight">
            {isKn ? 'ನೈಜ ಆತಿಥ್ಯ ಮತ್ತು ನಿಸರ್ಗ ಸೌಂದರ್ಯ' : 'Authentic Hospitality & Nature'}
          </h2>

          <div className="w-16 h-[2px] bg-[#B8964A] mx-auto mt-4" />
        </div>

        {/* 3 Warm Ivory Cards on Sage */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-7 items-stretch">
          
          {/* Card 1 */}
          <div className="group rounded-3xl bg-[#FAF6EC] border border-[#F1E9D8] shadow-[0_10px_40px_rgba(15,42,32,0.08)] hover:shadow-[0_16px_45px_rgba(15,42,32,0.12)] transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="p-6 sm:p-8 flex-1 flex flex-col">
              <div className="w-12 h-12 rounded-2xl border border-[#B8964A]/40 bg-[#F1E9D8] flex items-center justify-center text-[#B8964A] mb-5 shadow-sm group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 10v.01" />
                  <path d="M14 10v.01" />
                  <path d="M10 14v.01" />
                  <path d="M14 14v.01" />
                  <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
                  <path d="M2 20h20" />
                </svg>
              </div>

              <h3 className="font-serif text-xl sm:text-2xl text-[#0F2A20] font-medium mb-3 leading-snug">
                {isKn ? 'ತೋಟದ ನಡಿಗೆ ಮತ್ತು ನಿಸರ್ಗ ಪಥ' : 'Estate Walk & Nature Trails'}
              </h3>

              <p className="text-sm text-[#5F6B62] font-light leading-[1.7]">
                {isKn
                  ? 'ನಮ್ಮ ಖಾಸಗಿ ತೋಟದ ಆವರಣದಲ್ಲಿ ಹಸಿರು ಕಾಫಿ ಗಿಡಗಳು ಮತ್ತು ಎತ್ತರದ ನೆರಳಿನ ಮರಗಳ ನಡುವೆ ಪ್ರಶಾಂತ ನಡಿಗೆಯನ್ನು ಆನಂದಿಸಿ.'
                  : 'Explore peaceful pathways through lush green coffee plants and natural shade trees on our private family estate grounds.'}
              </p>
            </div>

            <div className="relative h-44 sm:h-48 w-full overflow-hidden">
              <img
                src="/images/realimage/real13.jpeg"
                alt="Guided plantation walks through coffee estates"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              <svg
                className="absolute -top-1 left-0 w-full h-7 text-[#FAF6EC] fill-current pointer-events-none"
                viewBox="0 0 1000 120"
                preserveAspectRatio="none"
              >
                <path d="M0,0 C280,95 450,20 700,75 C850,110 930,35 1000,50 L1000,0 L0,0 Z" />
              </svg>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group rounded-3xl bg-[#FAF6EC] border border-[#F1E9D8] shadow-[0_10px_40px_rgba(15,42,32,0.08)] hover:shadow-[0_16px_45px_rgba(15,42,32,0.12)] transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="p-6 sm:p-8 flex-1 flex flex-col">
              <div className="w-12 h-12 rounded-2xl border border-[#B8964A]/40 bg-[#F1E9D8] flex items-center justify-center text-[#B8964A] mb-5 shadow-sm group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                  <line x1="6" y1="1" x2="6" y2="4" />
                  <line x1="10" y1="1" x2="10" y2="4" />
                  <line x1="14" y1="1" x2="14" y2="4" />
                </svg>
              </div>

              <h3 className="font-serif text-xl sm:text-2xl text-[#0F2A20] font-medium mb-3 leading-snug">
                {isKn ? 'ರುಚಿಯಾದ ಮನೆ ಊಟ ಮತ್ತು ಉಪಚಾರ' : 'Homely Food & Warm Dining'}
              </h3>

              <p className="text-sm text-[#5F6B62] font-light leading-[1.7]">
                {isKn
                  ? 'ನಮ್ಮ ಊಟದ ಸಭಾಂಗಣದಲ್ಲಿ ಪ್ರತಿದಿನ ಪ್ರೀತಿಯಿಂದ ತಾಜಾವಾಗಿ ತಯಾರಿಸಲಾಗುವ ಸಾಂಪ್ರದಾಯಿಕ ಮನೆ ಊಟವನ್ನು ಸವಿಯಿರಿ.'
                  : 'Enjoy freshly prepared authentic home-cooked meals served in our dining hall, prepared fresh daily with care for our guests.'}
              </p>
            </div>

            <div className="relative h-44 sm:h-48 w-full overflow-hidden">
              <img
                src="/images/realimage/real8.jpeg"
                alt="Homely dining hall at Marichin Homestay"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              <svg
                className="absolute -top-1 left-0 w-full h-7 text-[#FAF6EC] fill-current pointer-events-none"
                viewBox="0 0 1000 120"
                preserveAspectRatio="none"
              >
                <path d="M0,0 C220,70 420,10 650,80 C840,115 920,40 1000,60 L1000,0 L0,0 Z" />
              </svg>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group rounded-3xl bg-[#FAF6EC] border border-[#F1E9D8] shadow-[0_10px_40px_rgba(15,42,32,0.08)] hover:shadow-[0_16px_45px_rgba(15,42,32,0.12)] transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="p-6 sm:p-8 flex-1 flex flex-col">
              <div className="w-12 h-12 rounded-2xl border border-[#B8964A]/40 bg-[#F1E9D8] flex items-center justify-center text-[#B8964A] mb-5 shadow-sm group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
              </div>

              <h3 className="font-serif text-xl sm:text-2xl text-[#0F2A20] font-medium mb-3 leading-snug">
                {isKn ? 'ಕ್ಯಾಂಪ್‌ಫೈರ್ ಮತ್ತು ಸಂಜೆಯ ಆಟಗಳು' : 'Campfire & Evening Games'}
              </h3>

              <p className="text-sm text-[#5F6B62] font-light leading-[1.7]">
                {isKn
                  ? 'ತಾಜಾ ತೋಟದ ತಂಗಾಳಿಯಲ್ಲಿ ಕುಟುಂಬ ಮತ್ತು ಸ್ನೇಹಿತರೊಂದಿಗೆ ಬೆಚ್ಚನೆಯ ಕ್ಯಾಂಪ್‌ಫೈರ್ ಹಾಗೂ ಒಳಾಂಗಣ ಮತ್ತು ಹೊರಾಂಗಣ ಆಟಗಳನ್ನು ಆನಂದಿಸಿ.'
                  : 'Spend evenings around the cozy campfire with family and friends, accompanied by indoor & outdoor games in the fresh plantation air.'}
              </p>
            </div>

            <div className="relative h-44 sm:h-48 w-full overflow-hidden">
              <img
                src="/images/realimage/real14.jpeg"
                alt="Evening campfire gathering with games"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              <svg
                className="absolute -top-1 left-0 w-full h-7 text-[#FAF6EC] fill-current pointer-events-none"
                viewBox="0 0 1000 120"
                preserveAspectRatio="none"
              >
                <path d="M0,0 C250,85 460,15 680,65 C870,105 940,30 1000,55 L1000,0 L0,0 Z" />
              </svg>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
