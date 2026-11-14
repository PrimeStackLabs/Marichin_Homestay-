import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { GALLERY_DATA } from '../../data/homestayData';
import { PageBanner } from '../../components/Common/PageBanner';
import { 
  Sparkles, 
  Maximize2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  ArrowRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Gallery = () => {
  const { t, language } = useLanguage();
  const isKn = language === 'kn';
  const { gallery } = useAdmin();
  const [filter, setFilter] = useState('All');
  const [lightboxIdx, setLightboxIdx] = useState(null);

  const categories = ['All', 'Rooms', 'Dining', 'Estate', 'Guests'];

  const getCategoryLabel = (cat, kannada) => {
    if (!kannada) return cat;
    const map = {
      all: 'ಎಲ್ಲವೂ',
      rooms: 'ಕೊಠಡಿಗಳು',
      dining: 'ಊಟೋಪಚಾರ',
      estate: 'ತೋಟ',
      guests: 'ಅತಿಥಿಗಳು'
    };
    return map[cat.toLowerCase()] || cat;
  };

  const getPhotoTitle = (photo, kannada) => {
    if (!kannada) return photo.title;
    const id = Number(photo.id);
    const titlesKn = {
      1: 'ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇ ಪರಿಸರ ವಿನ್ಯಾಸ',
      2: 'ಮೊದಲ ಮಹಡಿಯ ಬಾಲ್ಕನಿ ವರಾಂಡಾ',
      3: 'ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಕೊಠಡಿಯ ಮರದ ಹಾಸಿಗೆಗಳು',
      4: 'ಬಾಲ್ಕನಿ ಪ್ರವೇಶವಿರುವ ಸೂಟ್ ಕೊಠಡಿ',
      5: 'ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಕೊಠಡಿಯ ಡಬಲ್ ಮತ್ತು ಸಿಂಗಲ್ ಬೆಡ್ಸ್',
      6: 'ಸೂಟ್ ಕೊಠಡಿ ಮತ್ತು ಸ್ನಾನಗೃಹ ವೀಕ್ಷಣೆ',
      7: 'ಖಾಸಗಿ ಬಾಲ್ಕನಿ ಮತ್ತು ನೈಸರ್ಗಿಕ ಆಸನಗಳು',
      8: 'ಮನೆ ಊಟದ ಸಭಾಂಗಣ ಮತ್ತು ಆಸನ ವ್ಯವಸ್ಥೆ',
      9: 'ಸ್ಟೇನ್‌ಲೆಸ್ ಸ್ಟೀಲ್ ಬಫೆ ಕೌಂಟರ್',
      10: 'ಮುಂಭಾಗದ ಸ್ವಾಗತ ಕೌಂಟರ್',
      11: 'ಕಾಫಿ ತೋಟದ ವಿಹಂಗಮ ವೀಡಿಯೊ',
      12: 'ಕಾಫಿ ತೋಟದ ನಿಸರ್ಗ ಪಥದಲ್ಲಿ ಅತಿಥಿಗಳು',
      13: 'ಮಾರ್ಗದರ್ಶನದೊಂದಿಗೆ ಕಾಫಿ ತೋಟದ ನಡಿಗೆ',
      14: 'ಗೇಜಿಬೋದಲ್ಲಿ ಸಂಜೆಯ ಕ್ಯಾಂಪ್‌ಫೈರ್ ಮತ್ತು ಆಟಗಳು'
    };
    return titlesKn[id] || photo.title;
  };

  const photosList = (gallery && gallery.length > 0 ? gallery : GALLERY_DATA).map(p => ({
    ...p,
    src: p.src || p.url || p.image,
    url: p.url || p.src || p.image,
    image: p.image || p.url || p.src
  }));

  const filteredPhotos = filter === 'All'
    ? photosList
    : photosList.filter(p => (p.category || '').toLowerCase() === filter.toLowerCase());

  const openLightbox = (index) => {
    setLightboxIdx(index);
  };

  const closeLightbox = () => {
    setLightboxIdx(null);
  };

  const nextPhoto = () => {
    setLightboxIdx((prev) => (prev + 1) % filteredPhotos.length);
  };

  const prevPhoto = () => {
    setLightboxIdx((prev) => (prev === 0 ? filteredPhotos.length - 1 : prev - 1));
  };

  return (
    <div className="min-h-screen bg-[#FAF6EC] text-[#1A2A21]">
      
      {/* SECTION 1: Redesigned Hero Banner with Stacked Collage */}
      <PageBanner pageKey="gallery" onFilterSelect={setFilter} />

      {/* SECTION 2: Category Filters & Gallery Grid — Linen */}
      <section id="gallery-filters" className="w-full bg-[#F1E9D8] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2 rounded-full text-xs uppercase tracking-[0.14em] font-semibold transition-all duration-200 cursor-pointer ${
                  filter === cat
                    ? 'bg-[#0F2A20] text-[#F3EDDD] shadow-sm'
                    : 'bg-[#FAF6EC] text-[#0F2A20] hover:text-[#B8964A] border border-[#F1E9D8]'
                }`}
              >
                {getCategoryLabel(cat, isKn)}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 3: Gallery Image Grid — Ivory */}
      <section className="w-full bg-[#FAF6EC] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPhotos.map((photo, idx) => (
              <div
                key={photo.id}
                onClick={() => openLightbox(idx)}
                className="group relative h-72 rounded-3xl overflow-hidden border border-[#F1E9D8] bg-white shadow-[0_10px_40px_rgba(15,42,32,0.08)] hover:shadow-[0_16px_45px_rgba(15,42,32,0.12)] hover:border-[#B8964A]/50 cursor-pointer transition-all duration-300"
              >
                {photo.image.endsWith('.mp4') ? (
                  <div className="relative w-full h-full">
                    <video
                      src={photo.image}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      muted
                      loop
                      playsInline
                      autoPlay
                    />
                    <div className="absolute top-3 right-3 bg-black/60 text-[#D9BC7A] p-1.5 rounded-full backdrop-blur-sm pointer-events-none">
                      <Play className="w-3.5 h-3.5 fill-[#D9BC7A]" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={photo.image}
                    alt={photo.alt || photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F2A20] via-[#0F2A20]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                  <span className="text-[10px] uppercase font-bold tracking-[0.18em] text-[#D9BC7A] mb-1">
                    {getCategoryLabel(photo.category, isKn)}
                  </span>
                  <h4 className="font-serif text-lg font-semibold text-[#F3EDDD]">
                    {getPhotoTitle(photo, isKn)}
                  </h4>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-[#D9BC7A] font-medium">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>{isKn ? 'ದೊಡ್ಡದಾಗಿ ವೀಕ್ಷಿಸಿ' : 'Enlarge High Resolution'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: Featured Estate Experience — Sage (1 section per page) */}
      <section className="w-full bg-[#DDE6D3] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-[#FAF6EC] rounded-3xl p-8 sm:p-12 border border-[#F1E9D8] shadow-[0_10px_40px_rgba(15,42,32,0.08)]">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A] block mb-2">
              {isKn ? 'ನೈಜ ಪಶ್ಚಿಮ ಘಟ್ಟಗಳ ಪರಿಸರ' : 'Unfiltered Western Ghats'}
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#0F2A20] mb-4">
              {isKn ? 'ನಿಸರ್ಗದ ಸೌಂದರ್ಯವನ್ನು ಪ್ರತ್ಯಕ್ಷವಾಗಿ ಅನುಭವಿಸಿ' : 'Experience the Magic Firsthand'}
            </h2>
            <p className="text-sm sm:text-base text-[#5F6B62] font-light max-w-xl mx-auto mb-8 leading-[1.7]">
              {isKn
                ? 'ಇಲ್ಲಿರುವ ಪ್ರತಿಯೊಂದು ಛಾಯಾಚಿತ್ರವೂ ನೈಜವಾಗಿದ್ದು, ನಮ್ಮ ಹೋಂಸ್ಟೇಯ ತಂಪಾದ ಮಂಜು, ಹಚ್ಚಹಸಿರಿನ ತೋಟ ಮತ್ತು ನಕ್ಷತ್ರ ತುಂಬಿದ ರಾತ್ರಿಗಳನ್ನು ಪ್ರತಿಬಿಂಬಿಸುತ್ತದೆ.'
                : 'Every photograph captured here is completely unedited, reflecting the real mist, lush greenery, and starlit nights waiting for your arrival.'}
            </p>
            <Link
              to="/booking"
              className="px-8 py-3.5 rounded-[12px] text-xs uppercase tracking-[0.14em] font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all shadow-md hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              <span>{isKn ? 'ನಿಮ್ಮ ವಾಸ್ತವ್ಯ ಕಾಯ್ದಿರಿಸಿ' : 'Book Your Sanctuary'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2A20]/95 backdrop-blur-xl animate-fade-in">
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-[#1B4332] border border-[#B8964A]/40 text-[#D9BC7A] flex items-center justify-center hover:bg-[#B8964A] hover:text-[#0F2A20] transition-colors z-50 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Arrows */}
          <button
            onClick={prevPhoto}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#1B4332] border border-[#B8964A]/40 text-[#D9BC7A] flex items-center justify-center hover:bg-[#B8964A] hover:text-[#0F2A20] transition-colors z-50 cursor-pointer"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <button
            onClick={nextPhoto}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#1B4332] border border-[#B8964A]/40 text-[#D9BC7A] flex items-center justify-center hover:bg-[#B8964A] hover:text-[#0F2A20] transition-colors z-50 cursor-pointer"
          >
            <ChevronRight className="w-7 h-7" />
          </button>

          {/* Centered Image or Video */}
          <div className="max-w-5xl max-h-[85vh] flex flex-col items-center">
            {filteredPhotos[lightboxIdx].image.endsWith('.mp4') ? (
              <video
                src={filteredPhotos[lightboxIdx].image}
                controls
                autoPlay
                className="max-h-[75vh] max-w-full rounded-2xl shadow-2xl border border-[#B8964A]/30"
              />
            ) : (
              <img
                src={filteredPhotos[lightboxIdx].image}
                alt={filteredPhotos[lightboxIdx].alt || filteredPhotos[lightboxIdx].title}
                className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-2xl border border-[#B8964A]/30"
              />
            )}
            <div className="mt-4 text-center">
              <span className="text-[10px] uppercase font-bold tracking-[0.18em] text-[#D9BC7A]">
                {getCategoryLabel(filteredPhotos[lightboxIdx].category, isKn)}
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#F3EDDD]">
                {getPhotoTitle(filteredPhotos[lightboxIdx], isKn)}
              </h3>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
