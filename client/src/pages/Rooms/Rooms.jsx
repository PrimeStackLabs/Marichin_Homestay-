import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { Link } from 'react-router-dom';
import { PageBanner } from '../../components/Common/PageBanner';
import { 
  Users, 
  Maximize2, 
  Eye, 
  CheckCircle2, 
  Sparkles, 
  X,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  BedDouble,
  Coffee,
  Trees,
  DoorOpen,
  ImageOff
} from 'lucide-react';
import { InclusionsSection } from '../../components/Inclusions/InclusionsSection';
import { getRoomBalcony } from '../../utils/homestayFormatting';

export const Rooms = () => {
  const { t, language } = useLanguage();
  const { rooms, siteSettings } = useAdmin();
  const isKn = language === 'kn';
  const [activeModalRoom, setActiveModalRoom] = useState(null);
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  // Active rooms from admin/API with fallbacks
  const displayRooms = useMemo(() => {
    if (Array.isArray(rooms) && rooms.length > 0) {
      return rooms;
    }
    const std = {
      id: 'standard-room',
      slug: 'standard-room',
      name: 'Standard Room',
      category: 'Standard Room',
      pricePerNight: 8000,
      totalUnits: 2,
      maxAdults: 2,
      maxChildren: 1,
      capacity: 3,
      hasBalcony: true,
      mealsIncluded: 'Morning breakfast',
      view: '',
      description: 'Balcony-facing room for 2 adults and 1 child. Morning breakfast included.',
      images: ['/images/realimage/real3.jpeg', '/images/realimage/real5.jpeg']
    };

    const ste = {
      id: 'suite-room',
      slug: 'suite-room',
      name: 'Suite Room',
      category: 'Suite Room',
      pricePerNight: 10000,
      totalUnits: 2,
      maxAdults: 2,
      maxChildren: 2,
      capacity: 4,
      hasBalcony: true,
      mealsIncluded: 'Morning breakfast',
      view: '',
      description: 'Balcony-facing room for 2 adults and 2 children. Morning breakfast included.',
      images: ['/images/realimage/real4.jpeg', '/images/realimage/real6.jpeg']
    };

    const sgl = {
      id: 'single-room',
      slug: 'single-room',
      name: 'Single Room',
      category: 'Single Room',
      pricePerNight: 6000,
      totalUnits: 1,
      maxAdults: 2,
      maxChildren: 0,
      capacity: 2,
      hasBalcony: false,
      mealsIncluded: 'Morning breakfast',
      view: '',
      description: 'Room for 2 adults, without balcony. Morning breakfast included.',
      images: [] // No real photo exists; neutral placeholder rendered
    };

    return [std, ste, sgl];
  }, [rooms]);

  const openDetailsModal = (room) => {
    setActiveModalRoom(room);
    setActiveImgIdx(0);
  };

  const closeDetailsModal = () => {
    setActiveModalRoom(null);
  };

  // Section theme cycle guaranteeing no two adjacent sections share a color:
  // Banner wave: Linen (#F1E9D8)
  // Standard Room (index 0): Linen (#F1E9D8)
  // Suite Room (index 1): Forest (#0F2A20)
  // Single Room (index 2): Linen (#F1E9D8)
  // What's Included below: Clean Ivory (#FAF6EC)
  const getSectionTheme = (index) => {
    const cycle = ['linen', 'forest'];
    return cycle[index % cycle.length];
  };

  const getCapacityText = (room) => {
    const adults = room.maxAdults || 2;
    const children = room.maxChildren ?? (room.slug === 'single-room' ? 0 : 1);
    if (children > 0) {
      return isKn 
        ? `${adults} ವಯಸ್ಕರು + ${children} ${children === 1 ? 'ಮಗು' : 'ಮಕ್ಕಳು'}`
        : `${adults} Adults + ${children} ${children === 1 ? 'Child' : 'Children'}`;
    }
    return isKn ? `${adults} ವಯಸ್ಕರು` : `${adults} Adults`;
  };

  const getRoomName = (room) => {
    if (!isKn) return room.name;
    if (room.nameKn) return room.nameKn;
    if (room.slug?.includes('suite') || room.name?.includes('Suite')) return 'ಸೂಟ್ ಕೊಠಡಿ';
    if (room.slug?.includes('single') || room.name?.includes('Single')) return 'ಸಿಂಗಲ್ ಕೊಠಡಿ';
    if (room.slug?.includes('standard') || room.name?.includes('Standard')) return 'ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಕೊಠಡಿ';
    return room.name;
  };

  const getRoomDescription = (room) => {
    if (isKn && room.descriptionKn) return room.descriptionKn;
    if (!isKn && room.description && room.description.trim()) {
      return room.description;
    }
    const isSuite = (room?.slug || room?.name || '').toLowerCase().includes('suite');
    const isSingle = (room?.slug || room?.name || '').toLowerCase().includes('single');
    if (isKn) {
      if (isSuite) return '2 ವಯಸ್ಕರು ಮತ್ತು 2 ಮಕ್ಕಳಿಗೆ ಬಾಲ್ಕನಿ ಮುಖದ ಕೊಠಡಿ. ಬೆಳಗಿನ ಉಪಹಾರ ಸೇರಿದೆ.';
      if (isSingle) return 'ಬಾಲ್ಕನಿ ಇಲ್ಲದ 2 ವಯಸ್ಕರ ಕೊಠಡಿ. ಬೆಳಗಿನ ಉಪಹಾರ ಸೇರಿದೆ.';
      return '2 ವಯಸ್ಕರು ಮತ್ತು 1 ಮಗುವಿಗೆ ಬಾಲ್ಕನಿ ಮುಖದ ಕೊಠಡಿ. ಬೆಳಗಿನ ಉಪಹಾರ ಸೇರಿದೆ.';
    }
    if (isSuite) return 'Balcony-facing room for 2 adults and 2 children. Morning breakfast included.';
    if (isSingle) return 'Room for 2 adults, without balcony. Morning breakfast included.';
    return 'Balcony-facing room for 2 adults and 1 child. Morning breakfast included.';
  };

  const getRoomMealsText = (room) => {
    if (isKn) {
      if (room?.mealsIncludedKn) return room.mealsIncludedKn;
      if (room?.mealsIncluded && room.mealsIncluded.trim() && room.mealsIncluded.trim().toLowerCase() !== 'morning breakfast') {
        return room.mealsIncluded;
      }
      return 'ಬೆಳಗಿನ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ';
    }
    return room?.mealsIncluded && room.mealsIncluded.trim()
      ? room.mealsIncluded
      : 'Morning breakfast included';
  };

  const getRoomAmenities = (room) => {
    if (!isKn && Array.isArray(room?.amenities) && room.amenities.length > 0) {
      return room.amenities;
    }
    if (isKn && Array.isArray(room?.amenitiesKn) && room.amenitiesKn.length > 0) {
      return room.amenitiesKn;
    }
    return isKn
      ? ['ಬೆಳಗಿನ ಉಪಹಾರ', 'ವೈ-ಫೈ', 'ಪಾರ್ಕಿಂಗ್ ಸೌಲಭ್ಯ', 'ಕ್ಯಾಂಪ್‌ಫೈರ್', 'ಒಳಾಂಗಣ ಮತ್ತು ಹೊರಾಂಗಣ ಆಟಗಳು', 'ತೋಟದ ನಡಿಗೆ']
      : ['Morning breakfast', 'Wi-Fi', 'Parking Facility', 'Campfire', 'Indoor & Outdoor Games', 'Estate Walk'];
  };

  return (
    <div className="min-h-screen bg-[#FAF6EC] text-[#1A2A21]">
      
      {/* SECTION 1: Redesigned Hero Banner with Photo Carousel */}
      <PageBanner pageKey="rooms" />

      {/* THREE ROOM CARDS (Standard, Suite, Single) with Own Prices and Book Button */}
      {displayRooms.map((room, index) => {
        const theme = getSectionTheme(index);
        const isForest = theme === 'forest';
        const hasImages = Array.isArray(room.images) && room.images.length > 0;
        const mainImage = hasImages
          ? (typeof room.images[0] === 'string' ? room.images[0] : room.images[0].url)
          : null;
        const roomPrice = Number(room.pricePerNight ?? room.price ?? 8000);
        const weekendRoomPrice = Number(room.weekendPrice ?? roomPrice);
        const hasWeekendDiff = weekendRoomPrice > 0 && weekendRoomPrice !== roomPrice;
        const hasBalcony = getRoomBalcony(room);
        const totalUnits = room.totalUnits || (room.slug === 'single-room' ? 1 : 2);

        if (isForest) {
          return (
            <section key={room.id || room.slug || index} className="w-full bg-[#0F2A20] bg-dark-radial text-[#F3EDDD] py-16 sm:py-24 border-b border-[#B8964A]/20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="rounded-3xl overflow-hidden border border-[#B8964A]/25 bg-[#1B4332] hover:border-[#D9BC7A]/50 transition-all duration-500 shadow-[0_12px_36px_rgba(0,0,0,0.45)] grid grid-cols-1 lg:grid-cols-12 gap-0 group">
                  
                  {/* Photo Column / Neutral Placeholder */}
                  <div className="lg:col-span-5 relative h-72 sm:h-96 lg:h-full min-h-[360px] overflow-hidden bg-[#0A1A13]">
                    {hasImages ? (
                      <>
                        <img
                          src={mainImage}
                          alt={room.name}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
                        <button
                          onClick={() => openDetailsModal(room)}
                          className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0F2A20]/90 text-[#D9BC7A] text-xs backdrop-blur-md border border-[#B8964A]/40 hover:bg-[#B8964A] hover:text-[#0F2A20] transition-colors shadow-sm cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isKn ? `ಫೋಟೋಗಳನ್ನು ವೀಕ್ಷಿಸಿ (${room.images.length})` : `View Photos (${room.images.length})`}</span>
                        </button>
                      </>
                    ) : (
                      /* Neutral Placeholder Tile in existing card style for Single Room (no false photos) */
                      <div className="w-full h-full min-h-[360px] p-8 flex flex-col justify-center items-center text-center bg-gradient-to-br from-[#122A1E] via-[#0F2A20] to-[#0A1A13] border-b lg:border-b-0 lg:border-r border-[#B8964A]/20 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D9BC7A_1px,transparent_1px)] [background-size:16px_16px]" />
                        <div className="my-auto z-10 space-y-3">
                          <div className="w-16 h-16 rounded-2xl bg-[#1B4332] border border-[#B8964A]/30 mx-auto flex items-center justify-center text-[#D9BC7A] shadow-inner">
                            <BedDouble className="w-8 h-8" />
                          </div>
                          <p className="text-sm text-[#F3EDDD] font-medium z-10">
                            {isKn ? 'ಚಿತ್ರ ಶೀಘ್ರದಲ್ಲೇ ಬರಲಿದೆ' : 'Photo coming soon'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Balcony / No Balcony Badge */}
                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                      <span className={`px-3.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-[0.14em] shadow-lg flex items-center gap-1.5 border ${
                        hasBalcony
                          ? 'text-[#0F2A20] bg-[#D9BC7A] border-[#0F2A20]/20'
                          : 'text-[#F3EDDD] bg-[#0A1A13]/90 border-[#B8964A]/40'
                      }`}>
                        <Sparkles className="w-3 h-3 text-[#B8964A]" />
                        {hasBalcony ? (isKn ? 'ಬಾಲ್ಕನಿ ಮುಖ' : 'Balcony facing') : (isKn ? 'ಬಾಲ್ಕನಿ ಇಲ್ಲ' : 'No balcony')}
                      </span>
                    </div>

                    {/* Units Available Badge (Fixed '1 1 Room' bug) */}
                    <div className="absolute top-4 right-4 z-20">
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono text-[#F3EDDD] bg-[#0F2A20]/90 backdrop-blur-md border border-[#B8964A]/30">
                        {isKn ? (totalUnits === 1 ? '1 ಕೊಠಡಿ' : `${totalUnits} ಕೊಠಡಿಗಳು`) : (totalUnits === 1 ? '1 Room' : `${totalUnits} Rooms`)}
                      </span>
                    </div>
                  </div>

                  {/* Info Column */}
                  <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="text-xs uppercase font-semibold tracking-[0.18em] text-[#D9BC7A]">
                          {hasBalcony ? (isKn ? 'ಬಾಲ್ಕನಿ ಮುಖ' : 'Balcony facing') : (isKn ? 'ಬಾಲ್ಕನಿ ಇಲ್ಲ' : 'No balcony')}
                        </span>
                        {room.view && room.view.trim() ? (
                          <span className="text-xs text-[#B9C4B8] font-light">
                            {isKn ? 'ವೀಕ್ಷಣೆ: ' : 'View: '}<span className="text-[#F3EDDD] font-normal">{room.view}</span>
                          </span>
                        ) : null}
                      </div>

                      <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-[#F3EDDD] mb-3 group-hover:text-[#D9BC7A] transition-colors">
                        {getRoomName(room)}
                      </h2>

                      <p className="text-sm text-[#B9C4B8] font-light leading-[1.7] mb-6">
                        {getRoomDescription(room)}
                      </p>

                      {/* Key Highlights Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#0F2A20] border border-[#B8964A]/20 mb-6 text-xs text-[#F3EDDD]">
                        <div>
                          <span className="text-[10px] uppercase text-[#D9BC7A] font-semibold block mb-0.5">{isKn ? 'ಸಾಮರ್ಥ್ಯ' : 'Capacity'}</span>
                          <span>{getCapacityText(room)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-[#D9BC7A] font-semibold block mb-0.5">{isKn ? 'ಬಾಲ್ಕನಿ' : 'Balcony'}</span>
                          <span>{hasBalcony ? (isKn ? 'ಹೌದು (ಬಾಲ್ಕನಿ ಮುಖ)' : 'Balcony facing') : (isKn ? 'ಇಲ್ಲ' : 'No balcony')}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-[#D9BC7A] font-semibold block mb-0.5">{isKn ? 'ಆಹಾರ' : 'Meals'}</span>
                          <span className="text-[#D9BC7A] font-medium">{getRoomMealsText(room)}</span>
                        </div>
                        {room.bedLayout && room.bedLayout.trim() ? (
                          <div>
                            <span className="text-[10px] uppercase text-[#D9BC7A] font-semibold block mb-0.5">{isKn ? 'ಹಾಸಿಗೆ' : 'Bed Layout'}</span>
                            <span>{room.bedLayout}</span>
                          </div>
                        ) : null}
                        {room.sizeSqft && Number(room.sizeSqft) > 0 ? (
                          <div>
                            <span className="text-[10px] uppercase text-[#D9BC7A] font-semibold block mb-0.5">{isKn ? 'ವಿಸ್ತೀರ್ಣ' : 'Size'}</span>
                            <span>{room.sizeSqft} sq.ft</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="mb-6">
                        <span className="text-xs uppercase font-semibold tracking-wider text-[#D9BC7A] block mb-2.5">
                          {isKn ? 'ಕೊಠಡಿ ಸೌಲಭ್ಯಗಳು' : 'Room Facilities'}
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#F3EDDD]/90">
                          {getRoomAmenities(room).map((amenity, aIdx) => (
                            <div key={aIdx} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#B8964A] flex-shrink-0" />
                              <span>{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Price & Book CTA */}
                    <div className="pt-6 border-t border-[#0F2A20] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#B9C4B8] block">
                          {isKn ? 'ಪ್ರತಿ ರಾತ್ರಿಯ ದರ' : (hasWeekendDiff ? 'Weekday tariff' : 'Tariff per night')}
                        </span>
                        <div className="text-3xl font-serif font-bold text-[#D9BC7A]">
                          ₹{roomPrice.toLocaleString('en-IN')}
                          <span className="text-xs font-sans text-[#B9C4B8] font-normal ml-1">
                            {isKn ? ' / ರಾತ್ರಿ' : ' / night'}
                          </span>
                        </div>
                        {hasWeekendDiff && (
                          <span className="text-xs font-mono text-[#D9BC7A] block mt-0.5">
                            {isKn ? `ವಾರಾಂತ್ಯ (ಶುಕ್ರ–ಶನಿ): ₹${weekendRoomPrice.toLocaleString('en-IN')}` : `Weekend (Fri–Sat): ₹${weekendRoomPrice.toLocaleString('en-IN')} / night`}
                          </span>
                        )}
                        <span className="text-[11px] text-[#B9C4B8] font-light block mt-0.5">
                          {getRoomMealsText(room)}
                        </span>
                      </div>

                      <Link
                        to={`/booking?room=${room.slug || room.id}`}
                        className="px-7 py-3.5 rounded-[12px] text-xs uppercase tracking-[0.14em] font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all duration-300 shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                      >
                        <span>{isKn ? 'ಈ ಕೊಠಡಿ ಕಾಯ್ದಿರಿಸಿ' : 'Book This Room'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                  </div>
                </div>
              </div>
            </section>
          );
        }

        // Linen Section (Warm Ivory / Beige) for Suite Room
        return (
          <section key={room.id || room.slug || index} className="w-full bg-[#F1E9D8] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="rounded-3xl overflow-hidden border border-[#F1E9D8] bg-white hover:border-[#B8964A]/50 transition-all duration-500 shadow-[0_10px_40px_rgba(15,42,32,0.08)] grid grid-cols-1 lg:grid-cols-12 gap-0 group">
                
                {/* Photo Column / Neutral Placeholder */}
                <div className="lg:col-span-5 relative h-72 sm:h-96 lg:h-full min-h-[360px] overflow-hidden bg-[#FAF6EC]">
                  {hasImages ? (
                    <>
                      <img
                        src={mainImage}
                        alt={room.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
                      <button
                        onClick={() => openDetailsModal(room)}
                        className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0F2A20]/90 text-[#D9BC7A] text-xs backdrop-blur-md border border-[#B8964A]/40 hover:bg-[#B8964A] hover:text-[#0F2A20] transition-colors shadow-sm cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isKn ? `ಫೋಟೋಗಳನ್ನು ವೀಕ್ಷಿಸಿ (${room.images.length})` : `View Photos (${room.images.length})`}</span>
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full min-h-[360px] p-8 flex flex-col justify-center items-center text-center bg-gradient-to-br from-[#FAF6EC] to-[#F1E9D8] border-b lg:border-b-0 lg:border-r border-[#B8964A]/20 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D9BC7A_1px,transparent_1px)] [background-size:16px_16px]" />
                      <div className="my-auto z-10 space-y-3">
                        <div className="w-16 h-16 rounded-2xl bg-white border border-[#B8964A]/30 mx-auto flex items-center justify-center text-[#B8964A] shadow-sm">
                          <BedDouble className="w-8 h-8" />
                        </div>
                        <p className="text-sm text-[#0F2A20] font-medium z-10">
                          {isKn ? 'ಚಿತ್ರ ಶೀಘ್ರದಲ್ಲೇ ಬರಲಿದೆ' : 'Photo coming soon'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Balcony / No Balcony Badge */}
                  <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                    <span className={`px-3.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-[0.14em] shadow-lg flex items-center gap-1.5 border ${
                      hasBalcony
                        ? 'text-[#0F2A20] bg-[#D9BC7A] border-[#0F2A20]/20'
                        : 'text-[#5F6B62] bg-white/95 border-[#B8964A]/40'
                    }`}>
                      <Sparkles className="w-3 h-3 text-[#0F2A20]" />
                      {hasBalcony ? (isKn ? 'ಬಾಲ್ಕನಿ ಮುಖ' : 'Balcony facing') : (isKn ? 'ಬಾಲ್ಕನಿ ಇಲ್ಲ' : 'No balcony')}
                    </span>
                  </div>

                  {/* Units Available Badge (Fixed '1 1 Room' bug) */}
                  <div className="absolute top-4 right-4 z-20">
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono text-[#0F2A20] bg-white/90 backdrop-blur-md border border-[#B8964A]/30 font-semibold">
                      {isKn ? (totalUnits === 1 ? '1 ಕೊಠಡಿ' : `${totalUnits} ಕೊಠಡಿಗಳು`) : (totalUnits === 1 ? '1 Room' : `${totalUnits} Rooms`)}
                    </span>
                  </div>
                </div>

                {/* Info Column */}
                <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="text-xs uppercase font-semibold tracking-[0.18em] text-[#A8654A]">
                        {hasBalcony ? (isKn ? 'ಬಾಲ್ಕನಿ ಮುಖ' : 'Balcony facing') : (isKn ? 'ಬಾಲ್ಕನಿ ಇಲ್ಲ' : 'No balcony')}
                      </span>
                      {room.view && room.view.trim() ? (
                        <span className="text-xs text-[#5F6B62] font-light">
                          {isKn ? 'ವೀಕ್ಷಣೆ: ' : 'View: '}<span className="text-[#0F2A20] font-medium">{room.view}</span>
                        </span>
                      ) : null}
                    </div>

                    <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-[#0F2A20] mb-3 group-hover:text-[#B8964A] transition-colors">
                      {getRoomName(room)}
                    </h2>

                    <p className="text-sm text-[#5F6B62] font-light leading-[1.7] mb-6">
                      {getRoomDescription(room)}
                    </p>

                    {/* Key Highlights Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#FAF6EC] border border-[#F1E9D8] mb-6 text-xs text-[#1A2A21]">
                      <div>
                        <span className="text-[10px] uppercase text-[#A8654A] font-semibold block mb-0.5">{isKn ? 'ಸಾಮರ್ಥ್ಯ' : 'Capacity'}</span>
                        <span>{getCapacityText(room)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#A8654A] font-semibold block mb-0.5">{isKn ? 'ಬಾಲ್ಕನಿ' : 'Balcony'}</span>
                        <span>{hasBalcony ? (isKn ? 'ಹೌದು (ಬಾಲ್ಕನಿ ಮುಖ)' : 'Balcony facing') : (isKn ? 'ಇಲ್ಲ' : 'No balcony')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#A8654A] font-semibold block mb-0.5">{isKn ? 'ಆಹಾರ' : 'Meals'}</span>
                        <span className="text-[#B8964A] font-bold">{getRoomMealsText(room)}</span>
                      </div>
                      {room.bedLayout && room.bedLayout.trim() ? (
                        <div>
                          <span className="text-[10px] uppercase text-[#A8654A] font-semibold block mb-0.5">{isKn ? 'ಹಾಸಿಗೆ' : 'Bed Layout'}</span>
                          <span>{room.bedLayout}</span>
                        </div>
                      ) : null}
                      {room.sizeSqft && Number(room.sizeSqft) > 0 ? (
                        <div>
                          <span className="text-[10px] uppercase text-[#A8654A] font-semibold block mb-0.5">{isKn ? 'ವಿಸ್ತೀರ್ಣ' : 'Size'}</span>
                          <span>{room.sizeSqft} sq.ft</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="mb-6">
                      <span className="text-xs uppercase font-semibold tracking-wider text-[#0F2A20] block mb-2.5">
                        {isKn ? 'ಕೊಠಡಿ ಸೌಲಭ್ಯಗಳು' : 'Room Facilities'}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#5F6B62]">
                        {getRoomAmenities(room).map((amenity, aIdx) => (
                          <div key={aIdx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#B8964A] flex-shrink-0" />
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Price & Book CTA */}
                  <div className="pt-6 border-t border-[#F1E9D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#5F6B62] block">
                        {isKn ? 'ಪ್ರತಿ ರಾತ್ರಿಯ ದರ' : (hasWeekendDiff ? 'Weekday tariff' : 'Tariff per night')}
                      </span>
                      <div className="text-3xl font-serif font-bold text-[#0F2A20]">
                        ₹{roomPrice.toLocaleString('en-IN')}
                        <span className="text-xs font-sans text-[#5F6B62] font-normal ml-1">
                          {isKn ? ' / ರಾತ್ರಿ' : ' / night'}
                        </span>
                      </div>
                      {hasWeekendDiff && (
                        <span className="text-xs font-mono text-[#A8654A] font-semibold block mt-0.5">
                          {isKn ? `ವಾರಾಂತ್ಯ (ಶುಕ್ರ–ಶನಿ): ₹${weekendRoomPrice.toLocaleString('en-IN')}` : `Weekend (Fri–Sat): ₹${weekendRoomPrice.toLocaleString('en-IN')} / night`}
                        </span>
                      )}
                      <span className="text-[11px] text-[#5F6B62] font-light block mt-0.5">
                        {getRoomMealsText(room)}
                      </span>
                    </div>

                    <Link
                      to={`/booking?room=${room.slug || room.id}`}
                      className="px-7 py-3.5 rounded-[12px] text-xs uppercase tracking-[0.14em] font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all duration-300 shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                    >
                      <span>{isKn ? 'ಈ ಕೊಠಡಿ ಕಾಯ್ದಿರಿಸಿ' : 'Book This Room'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* SECTION: What's Included & Not Included — Clean Ivory (#FAF6EC) */}
      <InclusionsSection variant="full" bgColor="bg-[#FAF6EC]" />

      {/* Room Details & Photo Gallery Modal */}
      {activeModalRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0F2A20]/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0F2A20] border border-[#B8964A]/35 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-[#F3EDDD]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1B4332] flex items-center justify-between bg-[#1B4332]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-[0.18em] text-[#D9BC7A]">
                  {isKn ? 'ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇ ಕೊಠಡಿ' : 'Marichin Homestay Room'}
                </span>
                <h3 className="font-serif text-2xl font-semibold text-[#F3EDDD]">
                  {getRoomName(activeModalRoom)}
                </h3>
              </div>
              <button
                onClick={closeDetailsModal}
                className="w-9 h-9 rounded-full bg-[#0F2A20] text-[#B9C4B8] hover:text-[#D9BC7A] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {(() => {
                const modalImages = Array.isArray(activeModalRoom.images) && activeModalRoom.images.length > 0
                  ? activeModalRoom.images.map(img => (typeof img === 'string' ? img : img.url)).filter(Boolean)
                  : [];

                if (modalImages.length === 0) {
                  return (
                    <div className="h-64 rounded-2xl bg-[#1B4332] border border-[#B8964A]/25 flex flex-col items-center justify-center text-center p-6 text-[#B9C4B8]">
                      <BedDouble className="w-12 h-12 text-[#D9BC7A] mb-2" />
                      <p className="text-sm text-[#F3EDDD] font-medium mt-1">
                        {isKn ? 'ಚಿತ್ರ ಶೀಘ್ರದಲ್ಲೇ ಬರಲಿದೆ' : 'Photo coming soon'}
                      </p>
                    </div>
                  );
                }

                const currentImg = modalImages[activeImgIdx] || modalImages[0];
                return (
                  <>
                    <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden border border-[#B8964A]/25">
                      {currentImg.endsWith('.mp4') ? (
                        <video
                          src={currentImg}
                          controls
                          autoPlay
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={currentImg}
                          alt="Room View"
                          className="w-full h-full object-cover transition-all duration-500"
                        />
                      )}

                      {modalImages.length > 1 && (
                        <>
                          <button
                            onClick={() => setActiveImgIdx(prev => prev === 0 ? modalImages.length - 1 : prev - 1)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#0F2A20]/85 text-[#D9BC7A] flex items-center justify-center hover:bg-[#B8964A] hover:text-[#0F2A20] transition-colors cursor-pointer"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setActiveImgIdx(prev => (prev + 1) % modalImages.length)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#0F2A20]/85 text-[#D9BC7A] flex items-center justify-center hover:bg-[#B8964A] hover:text-[#0F2A20] transition-colors cursor-pointer"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}

                      <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-[#0F2A20]/85 text-xs font-mono text-[#D9BC7A]">
                        {activeImgIdx + 1} / {modalImages.length}
                      </div>
                    </div>

                    {/* Thumbnails row */}
                    {modalImages.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {modalImages.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImgIdx(idx)}
                            className={`w-20 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                              idx === activeImgIdx ? 'border-[#B8964A] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={img} alt="thumb" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Full Description & Amenities */}
              <div>
                <h4 className="font-serif text-lg font-semibold text-[#D9BC7A] mb-2">
                  {isKn ? 'ಕೊಠಡಿ ವಿವರಣೆಗಳು' : 'Room Specifications'}
                </h4>
                <p className="text-sm text-[#B9C4B8] font-light leading-[1.7] mb-4">
                  {getRoomDescription(activeModalRoom)}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#F3EDDD]">
                  {(isKn ? ['ಬೆಳಗಿನ ಉಪಹಾರ', 'ವೈ-ಫೈ', 'ಪಾರ್ಕಿಂಗ್ ಸೌಲಭ್ಯ', 'ಕ್ಯಾಂಪ್‌ಫೈರ್', 'ಒಳಾಂಗಣ ಮತ್ತು ಹೊರಾಂಗಣ ಆಟಗಳು', 'ತೋಟದ ನಡಿಗೆ'] : ['Morning breakfast', 'Wi-Fi', 'Parking Facility', 'Campfire', 'Indoor & Outdoor Games', 'Estate Walk']).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-[#1B4332] border border-[#B8964A]/20">
                      <CheckCircle2 className="w-4 h-4 text-[#B8964A] flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer with Room's Own Price */}
            <div className="p-5 border-t border-[#1B4332] bg-[#1B4332] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#B9C4B8]">{isKn ? 'ದರ:' : 'Room Tariff:'}</span>
                <span className="text-xl font-serif font-bold text-[#D9BC7A] ml-2">
                  ₹{Number(activeModalRoom.pricePerNight || activeModalRoom.price || 8000).toLocaleString('en-IN')}{isKn ? ' / ರಾತ್ರಿ' : ' / night'}
                </span>
              </div>
              <Link
                to={`/booking?room=${activeModalRoom.slug || activeModalRoom.id}`}
                onClick={closeDetailsModal}
                className="px-6 py-2.5 rounded-[12px] text-xs uppercase tracking-[0.14em] font-bold text-[#0F2A20] bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] transition-all shadow-md cursor-pointer"
              >
                {isKn ? 'ಈ ಕೊಠಡಿ ಕಾಯ್ದಿರಿಸಿ' : 'Book This Room'}
              </Link>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
