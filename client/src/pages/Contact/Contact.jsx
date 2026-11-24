import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { HOMESTAY_INFO } from '../../data/homestayData';
import { PageBanner } from '../../components/Common/PageBanner';
import {
  resolveHostPhone,
  resolveHostEmail,
  cleanInternationalPhone,
  DEFAULT_HOST_WHATSAPP_DIGITS,
  resolveInstagramUrl,
  DEFAULT_INSTAGRAM_HANDLE
} from '../../utils/whatsappMessages';
import {
  MapPin,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  Navigation,
  Clock,
  Car,
  Instagram,
  Facebook,
  Sparkles,
  Layers,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';

const DEFAULT_DRIVING_ROUTES = [
  {
    city: 'Kushalnagar Town',
    cityKn: 'ಕುಶಾಲನಗರ ಪಟ್ಟಣ',
    place: 'Kushalnagar Town',
    distance: '6 km',
    time: '~12 mins',
    timeKn: '~12 ನಿಮಿಷ',
    route: 'Via BM Road / SH88 & Gudde Hosur',
    routeKn: 'ಬಿ.ಎಂ ರಸ್ತೆ ಮತ್ತು ಗುಡ್ಡೆ ಹೊಸೂರು ಮಾರ್ಗ'
  },
  {
    city: 'Madikeri (Coorg HQ)',
    cityKn: 'ಮಡಿಕೇರಿ (ಕೊಡಗು ಜಿಲ್ಲಾ ಕೇಂದ್ರ)',
    place: 'Madikeri (Coorg HQ)',
    distance: '28 km',
    time: '~40 mins',
    timeKn: '~40 ನಿಮಿಷ',
    route: 'Via Mangalore - Mysore Hwy / NH 275',
    routeKn: 'ರಾಷ್ಟ್ರೀಯ ಹೆದ್ದಾರಿ 275 ಮುಖಾಂತರ'
  },
  {
    city: 'Mysuru (Railway Station)',
    cityKn: 'ಮೈಸೂರು (ರೈಲ್ವೆ ನಿಲ್ದಾಣ)',
    place: 'Mysuru (Railway Station)',
    distance: '95 km',
    time: '~2 hrs 15 mins',
    timeKn: '~2 ಗಂಟೆ 15 ನಿಮಿಷ',
    route: 'Via Mysore - Madikeri Rd / NH 275',
    routeKn: 'ಮೈಸೂರು - ಮಡಿಕೇರಿ ರಸ್ತೆ / ಎನ್.ಎಚ್ 275'
  },
  {
    city: 'Bengaluru (Bangalore)',
    cityKn: 'ಬೆಂಗಳೂರು ನಗರ',
    place: 'Bengaluru (Bangalore)',
    distance: '235 km',
    time: '~4.5 hrs',
    timeKn: '~4.5 ಗಂಟೆ',
    route: 'Via BLR - MYS Expressway & NH 275',
    routeKn: 'ಬೆಂಗಳೂರು - ಮೈಸೂರು ಎಕ್ಸ್‌ಪ್ರೆಸ್‌ವೇ & ಎನ್.ಎಚ್ 275'
  }
];

export const Contact = () => {
  const { t, language } = useLanguage();
  const isKn = language === 'kn';
  const { addEnquiry, siteSettings } = useAdmin();
  const settings = siteSettings || HOMESTAY_INFO;
  const displayEmail = resolveHostEmail(settings.email);
  const instagramUrl = resolveInstagramUrl(settings.instagramUrl);
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [mapView, setMapView] = useState('m'); // 'm': Roadmap, 'k': Satellite, 'h': Hybrid, 'p': Terrain
  const [copiedGps, setCopiedGps] = useState(false);

  const stayCoordinates = {
    lat: 12.425583,
    lng: 75.911889,
    dms: "12°25'32.1\"N 75°54'42.8\"E"
  };
  const stayDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${stayCoordinates.lat},${stayCoordinates.lng}`;
  const staySearchUrl = `https://www.google.com/maps?q=${stayCoordinates.lat},${stayCoordinates.lng}`;

  const handleCopyGps = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(stayCoordinates.dms);
      setCopiedGps(true);
      setTimeout(() => setCopiedGps(false), 2200);
    }
  };

  const rawDistances = (siteSettings?.drivingDistances && siteSettings.drivingDistances.length > 0)
    ? siteSettings.drivingDistances
    : (HOMESTAY_INFO.distances && HOMESTAY_INFO.distances.length > 0 ? HOMESTAY_INFO.distances : DEFAULT_DRIVING_ROUTES);

  const distances = (rawDistances && rawDistances.length > 0 ? rawDistances : DEFAULT_DRIVING_ROUTES).map((dist, idx) => {
    const rawPlace = String(dist.place || dist.city || '').trim();
    const rawDist = String(dist.distance || '').trim();
    const rawRoute = String(dist.route || '').trim();
    const rawTime = String(dist.time || '').trim();

    // Match with known preset if place is missing or matches known hubs
    let matched = null;
    if (rawPlace) {
      const lower = rawPlace.toLowerCase();
      matched = DEFAULT_DRIVING_ROUTES.find(r =>
        lower.includes(r.place.toLowerCase().split(' ')[0]) ||
        r.place.toLowerCase().includes(lower)
      );
    }
    if (!matched && rawDist) {
      const numDist = rawDist.replace(/\D/g, '');
      matched = DEFAULT_DRIVING_ROUTES.find(r => r.distance.replace(/\D/g, '') === numDist);
    }
    if (!matched && DEFAULT_DRIVING_ROUTES[idx]) {
      matched = DEFAULT_DRIVING_ROUTES[idx];
    }

    const finalCityEn = rawPlace || (matched ? matched.city : `Route ${idx + 1}`);
    const finalCityKn = (matched ? matched.cityKn : null) || dist.cityKn || dist.placeKn || finalCityEn;
    const finalDist = rawDist || (matched ? matched.distance : '');
    const finalTimeEn = rawTime || (matched ? matched.time : 'Scenic Drive');
    const finalTimeKn = (matched ? matched.timeKn : null) || dist.timeKn || finalTimeEn;
    const finalRouteEn = rawRoute || (matched ? matched.route : 'Direct Highway Access');
    const finalRouteKn = (matched ? matched.routeKn : null) || dist.routeKn || finalRouteEn;

    return {
      city: isKn ? finalCityKn : finalCityEn,
      distance: finalDist,
      time: isKn ? finalTimeKn : finalTimeEn,
      route: isKn ? finalRouteKn : finalRouteEn
    };
  });

  const hasDistances = distances && distances.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setErrorMsg('');
    try {
      await addEnquiry(formData);
      setSubmitted(true);
      setFormData({ name: '', phone: '', email: '', message: '' });
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const instagramPosts = [
    { id: 1, img: "/images/realimage/homeimage.jpeg", likes: "1.4k" },
    { id: 2, img: "/images/realimage/real2.jpeg", likes: "980" },
    { id: 3, img: "/images/realimage/real12.jpeg", likes: "2.1k" },
    { id: 4, img: "/images/realimage/real14.jpeg", likes: "1.8k" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6EC] text-[#1A2A21]">

      {/* SECTION 1: Redesigned Hero Banner with 4 Glass Action Tiles & Floating Cards */}
      <PageBanner pageKey="contact" />

      {/* SECTION 2: Direct Contact Details & Driving Routes — Warm Ivory */}
      <section className="w-full bg-[#FAF6EC] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A]">
              {isKn ? 'ನೇರ ಸಂಪರ್ಕ' : 'Direct Connectivity'}
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl text-[#0F2A20] font-normal mt-2">
              {isKn
                ? (hasDistances ? 'ಹೋಂಸ್ಟೇ ವಿವರಗಳು ಮತ್ತು ಪ್ರಯಾಣದ ಸಮಯ' : 'ಹೋಂಸ್ಟೇ ಮಾಲೀಕರ ವಿವರಗಳು')
                : (hasDistances ? 'Estate Host Details & Travel Times' : 'Estate Host Details')}
            </h2>
            <div className="w-16 h-0.5 bg-[#B8964A] mx-auto mt-4" />
          </div>

          <div className={`grid grid-cols-1 ${hasDistances ? 'lg:grid-cols-12' : 'max-w-2xl mx-auto'} gap-8 items-start`}>
            {/* Direct Contact Card */}
            <div className={`${hasDistances ? 'lg:col-span-6' : 'w-full'} bg-white rounded-3xl p-7 sm:p-10 border border-[#F1E9D8] shadow-[0_10px_40px_rgba(15,42,32,0.08)] space-y-6`}>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0F2A20] pb-4 border-b border-[#F1E9D8]">
                {isKn ? 'ನೇರ ಸಂಪರ್ಕ ವಿವರಗಳು' : 'Direct Contact Details'}
              </h3>

              <div className="space-y-6 text-sm sm:text-base">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#FAF6EC] border border-[#F1E9D8] flex items-center justify-center text-[#B8964A] flex-shrink-0 shadow-sm">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[#A8654A] font-semibold text-xs uppercase tracking-[0.18em] block mb-1">
                      {isKn ? 'ವಿಳಾಸ' : 'Physical Address'}
                    </span>
                    <p className="text-[#5F6B62] font-light leading-relaxed">{settings.address}</p>
                  </div>
                </div>

                {(() => {
                  const displayPhone = resolveHostPhone(settings.phone || settings.phones?.[0]);
                  const cleanTel = `+${cleanInternationalPhone(displayPhone) || DEFAULT_HOST_WHATSAPP_DIGITS}`;
                  return (
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-[#FAF6EC] border border-[#F1E9D8] flex items-center justify-center text-[#B8964A] flex-shrink-0 shadow-sm">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[#A8654A] font-semibold text-xs uppercase tracking-[0.18em] block mb-1">
                          {isKn ? 'ದೂರವಾಣಿ ಬುಕಿಂಗ್' : 'Telephone Reservations'}
                        </span>
                        <a href={`tel:${cleanTel}`} className="text-[#0F2A20] hover:text-[#B8964A] block font-mono font-medium text-base">
                          {displayPhone}
                        </a>
                        {settings.altPhone && settings.altPhone.trim() && !settings.altPhone.includes('XXXXX') && (
                          <a href={`tel:${settings.altPhone}`} className="text-[#5F6B62] hover:text-[#B8964A] block font-mono text-xs sm:text-sm mt-1">
                            Alt: {settings.altPhone}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#FAF6EC] border border-[#F1E9D8] flex items-center justify-center text-[#B8964A] flex-shrink-0 shadow-sm">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[#A8654A] font-semibold text-xs uppercase tracking-[0.18em] block mb-1">
                      {isKn ? 'ಇಮೇಲ್ ವಿಚಾರಣೆಗಳು' : 'Email Enquiries'}
                    </span>
                    <a href={`mailto:${displayEmail}`} className="text-[#0F2A20] hover:text-[#B8964A] block font-medium break-all">
                      {displayEmail}
                    </a>
                  </div>
                </div>
              </div>

              {(() => {
                const displayWa = resolveHostPhone(settings.whatsapp || settings.whatsappNumber);
                const cleanWa = cleanInternationalPhone(displayWa) || DEFAULT_HOST_WHATSAPP_DIGITS;
                return (
                  <div className="pt-4 border-t border-[#F1E9D8]">
                    <a
                      href={`https://wa.me/${cleanWa}?text=Hello%20Marichin%20Homestay,%20I%20would%20like%20to%20plan%20a%20stay.`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-4 rounded-xl text-xs sm:text-sm uppercase tracking-wider font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(184,150,74,0.3)] hover:-translate-y-0.5"
                    >
                      <span>{isKn ? `ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಚಾಟ್ ಮಾಡಿ (${displayWa})` : `Chat on WhatsApp Host (${displayWa})`}</span>
                    </a>
                  </div>
                );
              })()}
            </div>

            {/* Travel Distances & Routes Card */}
            {hasDistances && (
              <div className="lg:col-span-6 bg-white rounded-3xl p-7 sm:p-10 border border-[#F1E9D8] shadow-[0_10px_40px_rgba(15,42,32,0.08)] flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-[#F1E9D8] gap-2">
                    <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0F2A20] flex items-center gap-2.5">
                      <Car className="w-6 h-6 text-[#B8964A] flex-shrink-0" />
                      <span>{isKn ? 'ಅಂದಾಜು ಚಾಲನಾ ಮಾರ್ಗಗಳು' : 'Approximate Driving Routes'}</span>
                    </h3>
                    <span className="hidden sm:inline-block text-[11px] uppercase tracking-wider font-semibold text-[#A8654A] bg-[#FAF6EC] px-3 py-1 rounded-full border border-[#F1E9D8]">
                      {isKn ? 'ಕೊಡಗು ಸಂಪರ್ಕ' : 'Coorg Transit'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#5F6B62] font-light mt-3 mb-5 leading-relaxed">
                    {isKn
                      ? 'ನಮ್ಮ ಹೋಂಸ್ಟೇ ಚಿಕ್ಕಬೆಟ್ಟಗೇರಿ ಗ್ರಾಮದಲ್ಲಿದ್ದು, ಕುಶಾಲನಗರ ಮುಖ್ಯ ಪಟ್ಟಣ ಮತ್ತು ಪ್ರಮುಖ ಹೆದ್ದಾರಿಗಳಿಂದ ಸುಲಭ ರಸ್ತೆ ಸಂಪರ್ಕವನ್ನು ಹೊಂದಿದೆ.'
                      : 'Nestled amidst serene coffee estates in Chikkabettageri Village, easily accessible via well-paved highways and scenic estate roads.'}
                  </p>

                  <div className="space-y-3.5">
                    {distances.map((dist, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-[#FAF6EC] border border-[#F1E9D8] flex items-center justify-between gap-4 hover:border-[#B8964A]/50 hover:bg-[#F5EEDD]/40 transition-all duration-200 shadow-xs group"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-white border border-[#F1E9D8] flex items-center justify-center text-[#B8964A] flex-shrink-0 mt-0.5 group-hover:border-[#B8964A] transition-colors shadow-xs">
                            <Navigation className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-serif font-semibold text-base sm:text-lg text-[#0F2A20] block leading-snug truncate">
                              {dist.city}
                            </span>
                            <span className="text-xs text-[#5F6B62] font-light block mt-0.5 leading-relaxed">
                              {dist.route}
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="inline-block font-mono font-bold text-xs sm:text-sm px-2.5 py-1 rounded-lg bg-[#0F2A20] text-[#D9BC7A] tracking-wider shadow-xs">
                            {dist.distance}
                          </span>
                          <span className="text-[11px] text-[#5F6B62] font-medium flex items-center justify-end gap-1 mt-1">
                            <Clock className="w-3 h-3 text-[#B8964A]" />
                            {dist.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Helpful directions bar */}
                <div className="pt-4 border-t border-[#F1E9D8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[#5F6B62]">
                    <MapPin className="w-4 h-4 text-[#B8964A] flex-shrink-0" />
                    <span>{isKn ? 'ಚಿಕ್ಕಬೆಟ್ಟಗೇರಿ (12°25\'32.1"N 75°54\'42.8"E)' : 'GPS: 12°25\'32.1"N 75°54\'42.8"E • Chikkabettageri'}</span>
                  </div>
                  <a
                    href={stayDirectionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#0F2A20] hover:text-[#B8964A] transition-colors cursor-pointer group"
                  >
                    <span>{isKn ? 'ಗೂಗಲ್ ಮ್ಯಾಪ್‌ನಲ್ಲಿ ದಾರಿ ನೋಡಿ' : 'Get Live Directions'}</span>
                    <span className="text-[#B8964A] group-hover:translate-x-0.5 transition-transform">→</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 3: Enquiry Form & Interactive Map — Linen */}
      <section id="enquiry-form" className="w-full bg-[#F1E9D8] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A]">
              {isKn ? 'ವಿಚಾರಣೆ ಕಳುಹಿಸಿ' : 'Send an Enquiry'}
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl text-[#0F2A20] font-normal mt-2">
              {isKn ? 'ಬುಕಿಂಗ್ ಡೆಸ್ಕ್‌ಗೆ ಸಂದೇಶ ಕಳುಹಿಸಿ' : 'Message the Reservations Desk'}
            </h2>
            <div className="w-16 h-0.5 bg-[#B8964A] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Column (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-7 sm:p-10 border border-[#FAF6EC] shadow-[0_10px_40px_rgba(15,42,32,0.08)]">
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0F2A20] mb-2">
                {isKn ? 'ವಿಚಾರಣಾ ಸಂದೇಶ ಕಳುಹಿಸಿ' : 'Send an Enquiry Message'}
              </h3>
              <p className="text-sm text-[#5F6B62] font-light mb-6 leading-relaxed">
                {isKn
                  ? 'ನಮ್ಮ ಹೋಂಸ್ಟೇ ಮಾಲೀಕರು 2 ರಿಂದ 4 ಗಂಟೆಗಳ ಒಳಗೆ ಅಗತ್ಯ ಮಾಹಿತಿ ಮತ್ತು ದರ ವಿವರಗಳೊಂದಿಗೆ ಉತ್ತರಿಸುತ್ತಾರೆ.'
                  : 'Our resident hosts reply within 2 to 4 hours with customized options and tariff quotations.'}
              </p>

              {submitted ? (
                <div className="p-8 rounded-2xl bg-[#FAF6EC] border border-emerald-500/40 text-center space-y-2 shadow-sm">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="font-serif text-xl font-semibold text-[#0F2A20]">
                    {isKn ? 'ಸಂದೇಶ ತಲುಪಿದೆ!' : 'Message Received!'}
                  </h4>
                  <p className="text-sm text-[#5F6B62]">
                    {isKn
                      ? 'ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ವಿಚಾರಣೆಯನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದ್ದು, ಶೀಘ್ರದಲ್ಲೇ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಲಾಗುವುದು.'
                      : 'Thank you. We have logged your enquiry in our reservations desk and will get back to you shortly.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="text-[#1A2A21] font-medium block mb-1.5">
                      {isKn ? 'ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು *' : 'Your Full Name *'}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={isKn ? 'ಉದಾ. ಅದಿತಿ ಶರ್ಮಾ' : 'e.g. Aditi Sharma'}
                      className="w-full bg-[#FAF6EC] focus:bg-white border border-[#F1E9D8] rounded-xl px-4 py-3 text-sm text-[#1A2A21] focus:outline-none focus:border-[#B8964A] transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[#1A2A21] font-medium block mb-1.5">
                        {isKn ? 'ದೂರವಾಣಿ ಸಂಖ್ಯೆ (ವಾಟ್ಸಾಪ್) *' : 'Phone Number (WhatsApp) *'}
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. +91 98XXX XXXXX"
                        className="w-full bg-[#FAF6EC] focus:bg-white border border-[#F1E9D8] rounded-xl px-4 py-3 text-sm text-[#1A2A21] focus:outline-none focus:border-[#B8964A] transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[#1A2A21] font-medium block mb-1.5">
                        {isKn ? 'ಇಮೇಲ್ ವಿಳಾಸ *' : 'Email Address *'}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="aditi@example.com"
                        className="w-full bg-[#FAF6EC] focus:bg-white border border-[#F1E9D8] rounded-xl px-4 py-3 text-sm text-[#1A2A21] focus:outline-none focus:border-[#B8964A] transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[#1A2A21] font-medium block mb-1.5">
                      {isKn ? 'ಸಂದೇಶ / ಪ್ರಯಾಣದ ದಿನಾಂಕಗಳು / ಅಗತ್ಯತೆಗಳು *' : 'Message / Travel Dates / Requirements *'}
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder={isKn ? 'ದಿನಾಂಕಗಳು, ಅತಿಥಿಗಳ ಸಂಖ್ಯೆ, ಊಟದ ಆಯ್ಕೆಗಳು ಅಥವಾ ಇತರೆ ಅಗತ್ಯಗಳನ್ನು ತಿಳಿಸಿ...' : 'Please mention dates, number of guests, meal choices, or taxi requirements...'}
                      className="w-full bg-[#FAF6EC] focus:bg-white border border-[#F1E9D8] rounded-xl px-4 py-3 text-sm text-[#1A2A21] focus:outline-none focus:border-[#B8964A] transition-all"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl text-xs sm:text-sm uppercase tracking-wider font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all shadow-[0_8px_24px_rgba(184,150,74,0.3)] hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isKn ? 'ಮಾಲೀಕರಿಗೆ ಸಂದೇಶ ಕಳುಹಿಸಿ' : 'Send Message to Host'}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Map Column (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-[#FAF6EC] shadow-[0_10px_40px_rgba(15,42,32,0.08)] h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A] block">
                    {isKn ? 'ಲೈವ್ ಗೂಗಲ್ ಮ್ಯಾಪ್' : 'Live Google Map'}
                  </span>
                  {/* GPS Coordinate Pill with Copy Button */}
                  <button
                    type="button"
                    onClick={handleCopyGps}
                    title="Click to copy GPS coordinates"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-[#FAF6EC] hover:bg-[#F1E9D8] text-[#0F2A20] border border-[#B8964A]/30 transition-all cursor-pointer shadow-xs"
                  >
                    <MapPin className="w-3 h-3 text-[#B8964A]" />
                    <span>{stayCoordinates.dms}</span>
                    {copiedGps ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-[#5F6B62]" />
                    )}
                  </button>
                </div>

                <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
                  <h3 className="font-serif text-2xl font-semibold text-[#0F2A20]">
                    {isKn ? 'ಹೋಂಸ್ಟೇ ಇರುವ ಸ್ಥಳ' : 'Estate Location Pin'}
                  </h3>
                  <span className="text-xs text-[#5F6B62]">
                    {isKn ? 'ಚಿಕ್ಕಬೆಟ್ಟಗೇರಿ, ಕುಶಾಲನಗರ' : 'Chikkabettageri, Kushalnagar'}
                  </span>
                </div>

                {/* Google Map View Modes Switcher */}
                <div className="mb-3">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[#5F6B62] uppercase tracking-wider mb-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#B8964A]" />
                    <span>{isKn ? 'ನಕಾಶೆ ವೀಕ್ಷಣೆ ಬದಲಾಯಿಸಿ:' : 'Select Google Map View:'}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#FAF6EC] rounded-xl border border-[#F1E9D8]">
                    {[
                      { key: 'm', label: 'Roadmap', labelKn: 'ರಸ್ತೆ ನಕಾಶೆ', icon: '🗺️' },
                      { key: 'k', label: 'Satellite', labelKn: 'ಉಪಗ್ರಹ', icon: '🛰️' },
                      { key: 'h', label: 'Hybrid', labelKn: 'ಹೈಬ್ರಿಡ್', icon: '🧭' },
                      { key: 'p', label: 'Terrain', labelKn: 'ಭೂಪ್ರದೇಶ', icon: '🏔️' }
                    ].map((mode) => {
                      const isActive = mapView === mode.key;
                      return (
                        <button
                          key={mode.key}
                          type="button"
                          onClick={() => setMapView(mode.key)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            isActive
                              ? 'bg-[#0F2A20] text-[#D9BC7A] shadow-sm'
                              : 'text-[#1A2A21] hover:bg-white/80'
                          }`}
                        >
                          <span>{mode.icon}</span>
                          <span>{isKn ? mode.labelKn : mode.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Map Frame with active view */}
                <div className="rounded-2xl overflow-hidden border border-[#F1E9D8] h-72 sm:h-80 w-full shadow-inner relative bg-[#FAF6EC]">
                  <iframe
                    key={mapView}
                    title="Marichin Homestay Google Map Location"
                    src={`https://maps.google.com/maps?q=${stayCoordinates.lat},${stayCoordinates.lng}&t=${mapView}&z=16&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>

              {/* Action Buttons Below Map */}
              <div className="pt-4 border-t border-[#F1E9D8] mt-4 flex flex-col sm:flex-row items-center gap-2.5">
                <a
                  href={stayDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs uppercase tracking-wider font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all shadow-[0_4px_16px_rgba(184,150,74,0.25)] hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  <Navigation className="w-4 h-4" />
                  <span>{isKn ? 'ಗೂಗಲ್ ಮ್ಯಾಪ್ ದಾರಿ (Directions)' : 'Get Live Driving Directions'}</span>
                </a>
                <a
                  href={staySearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto py-3 px-4 rounded-xl text-xs font-semibold text-[#0F2A20] bg-[#FAF6EC] hover:bg-[#F1E9D8] border border-[#B8964A]/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#B8964A]" />
                  <span>{isKn ? 'ಮ್ಯಾಪ್ ತೆರೆಯಿರಿ' : 'Open in Google Maps'}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Instagram Feed Gallery — Sage */}
      <section className="w-full bg-[#DDE6D3] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0F2A20] hover:text-[#B8964A] transition-colors inline-flex items-center justify-center gap-2"
            >
              <Instagram className="w-4 h-4 text-[#B8964A]" />
              <span>{DEFAULT_INSTAGRAM_HANDLE}</span>
            </a>
            <h3 className="font-serif text-3xl sm:text-5xl font-normal text-[#0F2A20] mt-2">
              {isKn ? 'ಇನ್‌ಸ್ಟಾಗ್ರಾಮ್‌ನಲ್ಲಿ ನಮ್ಮನ್ನು ಹಿಂಬಾಲಿಸಿ' : 'Follow Our Valley Journal on Instagram'}
            </h3>
            <div className="w-16 h-0.5 bg-[#B8964A] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {instagramPosts.map((post) => (
              <a
                key={post.id}
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${isKn ? 'ಇನ್‌ಸ್ಟಾಗ್ರಾಮ್‌ನಲ್ಲಿ ನೋಡಿ' : 'View on Instagram'} (${DEFAULT_INSTAGRAM_HANDLE})`}
                className="relative h-64 rounded-3xl overflow-hidden group border border-[#FAF6EC] shadow-md hover:shadow-2xl hover:border-[#B8964A] transition-all duration-300 block"
              >
                <img
                  src={post.img}
                  alt="Instagram post"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-[#0F2A20]/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm text-[#F3EDDD] gap-2 font-medium">
                  <Instagram className="w-4 h-4 text-[#D9BC7A]" />
                  <span>{post.likes} {isKn ? 'ಲೈಕ್‌ಗಳು' : 'likes'}</span>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#0F2A20] text-[#F3EDDD] hover:bg-[#1B4332] border border-[#B8964A]/40 hover:border-[#B8964A] text-xs sm:text-sm font-semibold uppercase tracking-wider shadow-md hover:-translate-y-0.5 transition-all"
            >
              <Instagram className="w-4 h-4 text-[#D9BC7A]" />
              <span>
                {isKn
                  ? `ಇನ್‌ಸ್ಟಾಗ್ರಾಮ್‌ನಲ್ಲಿ ಹಿಂಬಾಲಿಸಿ (${DEFAULT_INSTAGRAM_HANDLE})`
                  : `Follow ${DEFAULT_INSTAGRAM_HANDLE} on Instagram`}
              </span>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
};
