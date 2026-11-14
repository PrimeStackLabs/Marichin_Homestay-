import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { SERVICES_DATA, HOMESTAY_INFO } from '../../data/homestayData';
import { resolveHostPhone } from '../../utils/whatsappMessages';
import { 
  Car, 
  Compass, 
  UserCheck, 
  BookOpen, 
  Utensils, 
  Flame, 
  CheckCircle2, 
  Download,
  PhoneCall,
  Sparkles,
  BedDouble
} from 'lucide-react';

export const Services = () => {
  const { t } = useLanguage();
  const { siteSettings } = useAdmin();
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadGuidebook = () => {
    const helplinePhone = resolveHostPhone(siteSettings?.phone || siteSettings?.phones?.[0] || HOMESTAY_INFO.phone);
    // Generate text/markdown blob simulated downloadable guest guide
    const guideContent = `
# MARICHIN HOMESTAY - OFFICIAL GUEST GUIDEBOOK
Registration No: ${siteSettings?.registrationNumber || HOMESTAY_INFO.registration?.number || 'Karnataka Tourism Approved'}
Address: ${siteSettings?.address || HOMESTAY_INFO.address}
Helpline: ${helplinePhone}

WELCOME TO ${siteSettings?.propertyName || 'MARICHIN HOMESTAY'}!
1. Check-in: ${siteSettings?.checkInTime || '12:00 PM'} | Check-out: ${siteSettings?.checkOutTime || '11:00 AM'}
2. Dining: Breakfast (07:30 - 10:00 AM) | High-Tea (04:30 PM) | Campfire Dinner (08:00 PM)
3. Wi-Fi Network: Available across rooms and verandah
4. Estate Experiences: Guided Morning Coffee Estate Walk, Evening Campfire, Indoor & Outdoor Games
5. Nearby Medical Facilities: Kushalnagar Town Clinics & Hospitals
6. Emergency Ambulance: 108 | Police: 112
    `;

    const blob = new Blob([guideContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Marichin_Homestay_Guest_Guidebook.txt';
    a.click();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  return (
    <div className="min-h-screen bg-[#FAF6EC] text-[#1A2A21]">
      
      {/* SECTION 1: Header — Dark Forest Deep */}
      <section className="w-full bg-[#0F2A20] bg-dark-radial text-[#F3EDDD] py-16 sm:py-24 border-b border-[#B8964A]/20 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1B4332] border border-[#B8964A]/30 mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#D9BC7A]" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D9BC7A]">
              Thoughtful Hospitality
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl text-[#F3EDDD] font-normal mt-2 mb-4">
            Guest Services & Facilities
          </h1>

          <div className="w-16 h-0.5 bg-[#B8964A] mx-auto mb-5" />

          <p className="text-base sm:text-lg text-[#B9C4B8] font-light max-w-2xl mx-auto leading-relaxed">
            Every convenience designed for seamless, worry-free journeys—from private 4x4 hill transfers to dignified driver accommodations.
          </p>
        </div>
      </section>

      {/* SECTION 2: Services Grid — Warm Ivory */}
      <section className="w-full bg-[#FAF6EC] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A]">
              Curated Comfort
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#0F2A20] font-normal mt-2">
              Signature Estate Amenities
            </h2>
            <div className="w-16 h-0.5 bg-[#B8964A] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES_DATA.map((srv, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-8 border border-[#F1E9D8] shadow-[0_10px_40px_rgba(15,42,32,0.08)] hover:border-[#B8964A] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-[#FAF6EC] border border-[#F1E9D8] flex items-center justify-center text-[#B8964A] mb-6 shadow-sm">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#0F2A20] mb-3">
                    {srv.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#5F6B62] font-light leading-relaxed">
                    {srv.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: Downloadable Guest Guidebook Feature Box — Sage */}
      <section className="w-full bg-[#DDE6D3] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-[#FAF6EC] rounded-3xl p-8 sm:p-12 shadow-[0_10px_40px_rgba(15,42,32,0.08)] flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 max-w-lg text-center md:text-left">
              <span className="text-xs uppercase font-semibold tracking-[0.18em] text-[#A8654A] block">
                Offline Digital Companion
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0F2A20]">
                Download Guest Guidebook
              </h3>
              <p className="text-sm sm:text-base text-[#5F6B62] font-light leading-relaxed">
                Includes offline property directions, secret waterfall trail coordinates, authentic Kodava spice market recommendations, emergency medical phone numbers, and estate Wi-Fi details.
              </p>
            </div>

            <div className="flex-shrink-0">
              <button
                onClick={handleDownloadGuidebook}
                className="px-8 py-4 rounded-xl text-xs sm:text-sm uppercase tracking-wider font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all shadow-[0_8px_24px_rgba(184,150,74,0.3)] hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{downloadSuccess ? "Guidebook Downloaded!" : "Download PDF Guide"}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Driver Accommodation & Transport Arrangements — Linen */}
      <section className="w-full bg-[#F1E9D8] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-3xl p-8 sm:p-14 border border-[#FAF6EC] shadow-[0_10px_40px_rgba(15,42,32,0.08)] space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF6EC] border border-[#F1E9D8] flex items-center justify-center text-[#B8964A] mx-auto shadow-sm">
              <BedDouble className="w-8 h-8" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A] block">
              Dignified Driver Facilities
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#0F2A20]">
              Driver Rest Quarters & Home-Cooked Meals
            </h2>
            <div className="w-12 h-0.5 bg-[#B8964A] mx-auto" />
            <p className="text-sm sm:text-base text-[#5F6B62] font-light leading-relaxed max-w-xl mx-auto">
              We provide clean, private dormitory rooms with hot water showers and nutritious Kodava meals for your accompanying drivers, ensuring they are well-rested for your mountain journeys.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
