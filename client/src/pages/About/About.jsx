import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { HOMESTAY_INFO } from '../../data/homestayData';
import { PageBanner } from '../../components/Common/PageBanner';
import { OurStorySection } from '../../components/About/OurStorySection';
import { EcoPhilosophySection } from '../../components/About/EcoPhilosophySection';
import { ShieldCheck } from 'lucide-react';

export const About = () => {
  const { t, language } = useLanguage();
  const { siteSettings } = useAdmin();
  const isKn = language === 'kn';

  return (
    <div className="min-h-screen bg-[#FAF6EC] text-[#1A2A21]">
      
      {/* SECTION 1: Redesigned Hero Banner with Floating Photo Cards */}
      <PageBanner pageKey="about" />

      {/* SECTION 2: Our Story & Heritage Values — Ivory */}
      <OurStorySection theme="light" />

      {/* SECTION 3: Nature & Community / Eco Philosophy — Sage */}
      <EcoPhilosophySection />

      {/* SECTION 4: Tourism Certification & Credentials — Linen (rendered if registered) */}
      {siteSettings?.registrationNumber && siteSettings.registrationNumber.trim() ? (
        <section className="w-full bg-[#F1E9D8] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20 relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#F1E9D8] shadow-[0_10px_40px_rgba(15,42,32,0.08)]">
              <div className="w-16 h-16 rounded-2xl bg-[#FAF6EC] border border-[#B8964A]/30 flex items-center justify-center text-[#B8964A] mx-auto mb-5 shadow-sm">
                <ShieldCheck className="w-9 h-9" />
              </div>
              
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A] block mb-2">
                {isKn ? 'ಸರ್ಕಾರಿ ಅಧಿಕೃತ ಮಾನ್ಯತೆ' : 'Official Government Recognition'}
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#0F2A20] mb-4">
                {isKn ? 'ಕರ್ನಾಟಕ ಪ್ರವಾಸೋದ್ಯಮ ಇಲಾಖೆಯಿಂದ ಅಧಿಕೃತ ಪ್ರಮಾಣೀಕೃತ' : 'Officially Certified by Karnataka Tourism'}
              </h2>
              <p className="text-sm sm:text-base text-[#5F6B62] max-w-xl mx-auto mb-6 font-light leading-[1.7]">
                {isKn
                  ? 'ಸುರಕ್ಷತೆ, ನೈರ್ಮಲ್ಯ, ಪರಿಸರ ಮಾನದಂಡಗಳು ಮತ್ತು ದರ ಪಾರದರ್ಶಕತೆಗಾಗಿ ನಾವು ಕರ್ನಾಟಕ ಪ್ರವಾಸೋದ್ಯಮ ಇಲಾಖೆಯ ಎಲ್ಲಾ ನಿಯಮಗಳನ್ನು ಕಟ್ಟುನಿಟ್ಟಾಗಿ ಪಾಲಿಸುತ್ತೇವೆ.'
                  : 'We adhere strictly to all guidelines of the Karnataka Department of Tourism for safety, cleanliness, eco-standards, and tariff transparency.'}
              </p>
              <div className="inline-block px-5 py-2.5 rounded-xl bg-[#FAF6EC] border border-[#B8964A]/30 text-xs font-mono text-[#0F2A20] shadow-sm font-semibold">
                {isKn ? 'ನೋಂದಣಿ ಸಂಖ್ಯೆ: ' : 'Registration No: '}{siteSettings.registrationNumber}
              </div>
            </div>
          </div>
        </section>
      ) : null}

    </div>
  );
};
