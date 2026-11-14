import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { DINING_DATA, HOMESTAY_INFO } from '../../data/homestayData';
import DishThumbnail from '../../components/Dining/DishThumbnail';
import {
  cleanInternationalPhone,
  resolveHostPhone,
  DEFAULT_HOST_WHATSAPP_DIGITS
} from '../../utils/whatsappMessages';
import {
  ArrowLeft,
  Search,
  UtensilsCrossed,
  Flame,
  Leaf,
  Coffee,
  Sparkles,
  MessageCircle,
  X
} from 'lucide-react';

// Category banner image presets
const CATEGORY_BANNERS = {
  'morning-breakfast': '/images/food/paputtu_egg_curry.webp',
  'dinner-veg': '/images/food/veg_dinner_thali.webp',
  'dinner-non-veg': '/images/food/nonveg_dinner.webp',
  'evening': '/images/food/coffee_tea.webp',
  default: '/images/realimage/real8.jpeg',
};

// Returns dish image if verified and non-empty, otherwise empty string (triggers neutral placeholder)
const resolveDishImage = (dish) => {
  if (dish?.image && typeof dish.image === 'string' && dish.image.trim() !== '') {
    return dish.image;
  }
  return '';
};

export const DiningCategory = () => {
  const { categoryId } = useParams();
  const { t, language } = useLanguage();
  const { diningMenu, siteSettings } = useAdmin();
  const isKn = language === 'kn';
  const hostWaDigits = cleanInternationalPhone(
    resolveHostPhone(siteSettings?.whatsappNumber || siteSettings?.whatsapp || HOMESTAY_INFO.whatsapp)
  ) || DEFAULT_HOST_WHATSAPP_DIGITS;

  // Search and Dietary Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('all'); // 'all' | 'veg' | 'non-veg'

  // Dynamically map all active Admin categories & items without stripping custom entries or resurrecting deleted items
  const allCategories = useMemo(() => {
    const defaultCategories = DINING_DATA.menuCategories || [];
    const sourceCats = (Array.isArray(diningMenu) && diningMenu.length > 0)
      ? diningMenu.filter((c) => c && c.isActive !== false)
      : defaultCategories;

    return sourceCats.map((cat) => {
      const catSlug = (cat.slug || cat.id || '').toLowerCase();
      const defaultCat = defaultCategories.find(
        (c) => (catSlug && (c.slug === catSlug || c.id === catSlug)) ||
               (c.name && cat.name && c.name.toLowerCase() === cat.name.toLowerCase()) ||
               (c.category && cat.category && c.category.toLowerCase() === cat.category.toLowerCase())
      ) || {};

      const rawItems = Array.isArray(cat.items) ? cat.items : (defaultCat.items || []);
      const normalizedItems = rawItems.map((item) => {
        const defItem = (defaultCat.items || []).find(
          (di) => (di.name && item.name && di.name.toLowerCase() === item.name.toLowerCase()) ||
                  (di.nameKn && item.nameKn && di.nameKn === item.nameKn)
        ) || {};
        return {
          ...defItem,
          ...item,
          name: (isKn && (item.nameKn || defItem.nameKn)) || item.name || defItem.name,
          image: item.image !== undefined && item.image !== '' ? item.image : (defItem.image || ''),
          isActive: item.isActive !== undefined ? item.isActive : (defItem.isActive !== undefined ? defItem.isActive : true),
          desc: item.desc !== undefined ? item.desc : (item.description !== undefined ? item.description : (defItem.desc || '')),
          alias: item.alias || '',
          tag: '',
          price: (item.price !== undefined && item.price !== null && item.price !== '') ? Number(item.price) : null,
          nonVeg: item.isVeg !== undefined ? !item.isVeg : (item.nonVeg !== undefined ? Boolean(item.nonVeg) : Boolean(defItem.nonVeg)),
          isIllustrative: item.isIllustrative !== undefined ? item.isIllustrative : (defItem.isIllustrative ?? true)
        };
      });

      return {
        ...defaultCat,
        ...cat,
        id: cat.slug || cat.id || defaultCat.slug || defaultCat.id,
        slug: cat.slug || cat.id || defaultCat.slug || defaultCat.id,
        category: (isKn && (cat.nameKn || defaultCat.nameKn)) || cat.name || cat.category || defaultCat.category,
        name: (isKn && (cat.nameKn || defaultCat.nameKn)) || cat.name || defaultCat.name,
        subtitle: cat.subtitle !== undefined ? cat.subtitle : (defaultCat.subtitle || ''),
        icon: cat.icon || defaultCat.icon || 'CookingPot',
        items: normalizedItems
      };
    });
  }, [diningMenu, isKn]);

  // Find the selected category dynamically by id or slugified name
  const currentCategory = useMemo(() => {
    if (!categoryId) return allCategories[0];
    const normalized = categoryId.toLowerCase().trim();

    return (
      allCategories.find((cat) => {
        const idMatch = cat.id && cat.id.toLowerCase() === normalized;
        const slugMatch =
          cat.category &&
          cat.category
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') === normalized;
        const nameMatch = cat.category && cat.category.toLowerCase() === normalized;
        return idMatch || slugMatch || nameMatch;
      }) || allCategories[0]
    );
  }, [allCategories, categoryId]);

  // Category Icon helper
  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'pot':
        return <UtensilsCrossed className="w-5 h-5 text-[#B8964A]" />;
      case 'leaf':
        return <Leaf className="w-5 h-5 text-[#B8964A]" />;
      case 'flame':
        return <Flame className="w-5 h-5 text-[#B8964A]" />;
      case 'coffee':
        return <Coffee className="w-5 h-5 text-[#B8964A]" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#B8964A]" />;
    }
  };

  // Banner image for this category
  const bannerImage =
    CATEGORY_BANNERS[currentCategory.id] ||
    CATEGORY_BANNERS[
      currentCategory.category
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    ] ||
    CATEGORY_BANNERS.default;

  // Confirmed active items in this category
  const categoryActiveItems = useMemo(() => {
    return (currentCategory.items || []).filter((dish) => dish.isActive !== false);
  }, [currentCategory]);

  // Filter items by Search Query and Dietary Filter
  const filteredItems = useMemo(() => {
    return categoryActiveItems.filter((dish) => {
      if (dietaryFilter === 'veg' && dish.nonVeg) return false;
      if (dietaryFilter === 'non-veg' && !dish.nonVeg) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = dish.name?.toLowerCase().includes(query);
        const aliasMatch = dish.alias?.toLowerCase().includes(query);
        const descMatch = dish.desc?.toLowerCase().includes(query);
        const tagMatch = dish.tag?.toLowerCase().includes(query);
        return nameMatch || aliasMatch || descMatch || tagMatch;
      }

      return true;
    });
  }, [categoryActiveItems, dietaryFilter, searchQuery]);

  const totalCount = categoryActiveItems.length;
  const vegCount = categoryActiveItems.filter((d) => !d.nonVeg).length;
  const nonVegCount = categoryActiveItems.filter((d) => d.nonVeg).length;

  return (
    <div className="min-h-screen bg-[#FAF6EC] text-[#1A2A21]">
      
      {/* SECTION 1: Category Hero Banner — Forest Deep Radial */}
      <section className="w-full bg-[#0F2A20] bg-dark-radial text-[#F3EDDD] py-16 sm:py-24 border-b border-[#B8964A]/20 relative overflow-hidden">
        {/* Background Image with Cinematic Overlay */}
        <div className="absolute inset-0 z-0 opacity-30">
          <img
            src={bannerImage}
            alt={currentCategory.category}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F2A20] via-[#0F2A20]/80 to-[#0F2A20]/60" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Breadcrumb & Back to Menu Action */}
          <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
            <Link
              to="/dining"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[12px] bg-[#1B4332] hover:bg-[#0F2A20] border border-[#B8964A]/40 hover:border-[#B8964A] text-[#D9BC7A] hover:text-[#B8964A] text-xs font-semibold tracking-[0.14em] uppercase transition-all duration-300 shadow-md group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              <span>{isKn ? 'ಊಟದ ಪಟ್ಟಿಗೆ ಹಿಂತಿರುಗಿ' : 'Back to Food Menu'}</span>
            </Link>

            <span className="text-xs text-[#B9C4B8] hidden sm:inline">/</span>

            <span className="text-xs font-mono uppercase tracking-widest text-[#D9BC7A] bg-[#1B4332] border border-[#B8964A]/30 px-3 py-1 rounded-full">
              {totalCount} {isKn ? 'ಖಾದ್ಯಗಳು' : 'Dishes Curated'}
            </span>
          </div>

          {/* Category Icon Emblem */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#1B4332] border border-[#B8964A]/40 mx-auto mb-4 flex items-center justify-center shadow-lg">
            {getCategoryIcon(currentCategory.icon)}
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-[#F3EDDD] font-normal tracking-tight leading-tight mb-4">
            {(isKn && currentCategory.nameKn) || currentCategory.category}
          </h1>

          <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#B8964A] to-transparent mx-auto mb-4" />

          {currentCategory.subtitle && (
            <p className="text-base sm:text-lg text-[#B9C4B8] font-light max-w-2xl mx-auto leading-[1.7]">
              {(isKn && currentCategory.subtitleKn) || currentCategory.subtitle}
            </p>
          )}

          {/* Quick Dietary Specs */}
          {totalCount > 0 && (
            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-6 text-xs text-[#F3EDDD]">
              {vegCount > 0 && (
                <span className="flex items-center gap-1.5 bg-[#1B4332] px-3.5 py-1 rounded-xl border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{vegCount} {isKn ? 'ಸಸ್ಯಾಹಾರಿ' : 'Vegetarian'}</span>
                </span>
              )}
              {nonVegCount > 0 && (
                <span className="flex items-center gap-1.5 bg-[#1B4332] px-3.5 py-1 rounded-xl border border-red-500/30">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span>{nonVegCount} {isKn ? 'ಮಾಂಸಾಹಾರಿ' : 'Non-Vegetarian'}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: Dishes Showcase with Search & Filters — Ivory */}
      <section className="w-full bg-[#FAF6EC] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Controls Bar */}
          {totalCount > 0 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-[#F1E9D8]">
              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-[#B8964A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={isKn ? "ಆಹಾರ ಅಥವಾ ಪದಾರ್ಥ ಹುಡುಕಿ..." : "Search dish or ingredient..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 rounded-full text-xs bg-white border border-[#F1E9D8] focus:outline-none focus:border-[#B8964A] text-[#1A2A21] placeholder-[#5F6B62] shadow-sm transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6B62] hover:text-[#0F2A20]"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Dietary Filter Buttons */}
              <div className="flex items-center gap-2 sm:gap-2.5 w-full md:w-auto justify-center sm:justify-start flex-wrap">
                <button
                  onClick={() => setDietaryFilter('all')}
                  className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
                    dietaryFilter === 'all'
                      ? 'bg-[#B8964A] text-[#0F2A20] font-bold shadow-sm'
                      : 'bg-[#FAF6EC] text-[#1A2A21] hover:text-[#B8964A] border border-[#F1E9D8]'
                  }`}
                >
                  {isKn ? `ಎಲ್ಲಾ (${totalCount})` : `All (${totalCount})`}
                </button>

                <button
                  onClick={() => setDietaryFilter('veg')}
                  className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                    dietaryFilter === 'veg'
                      ? 'bg-emerald-700 text-white font-bold shadow-sm'
                      : 'bg-[#FAF6EC] text-[#1A2A21] hover:text-emerald-700 border border-emerald-500/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{isKn ? `ಸಸ್ಯಾಹಾರಿ (${vegCount})` : `Veg (${vegCount})`}</span>
                </button>

                <button
                  onClick={() => setDietaryFilter('non-veg')}
                  className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                    dietaryFilter === 'non-veg'
                      ? 'bg-red-700 text-white font-bold shadow-sm'
                      : 'bg-[#FAF6EC] text-[#1A2A21] hover:text-red-700 border border-red-500/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>{isKn ? `ಮಾಂಸಾಹಾರಿ (${nonVegCount})` : `Non-Veg (${nonVegCount})`}</span>
                </button>
              </div>
            </div>
          )}

          {/* Dishes Grid */}
          {totalCount === 0 ? (
            <div className="text-center py-16 rounded-3xl border border-[#F1E9D8] bg-white p-8 max-w-lg mx-auto shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF6EC] border border-[#B8964A]/30 flex items-center justify-center text-[#B8964A] mx-auto mb-4">
                <UtensilsCrossed className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-2xl text-[#0F2A20] mb-2">
                {isKn ? 'ನಮ್ಮ ಊಟದ ಪಟ್ಟಿ ಶೀಘ್ರದಲ್ಲೇ ನವೀಕರಣಗೊಳ್ಳಲಿದೆ' : 'Our menu will be updated soon.'}
              </h3>
              <p className="text-sm text-[#5F6B62] font-light mb-6 leading-relaxed">
                {isKn
                  ? 'ಈ ವಿಭಾಗದ ಆಹಾರ ಪದಾರ್ಥಗಳ ವಿವರಗಳನ್ನು ಶೀಘ್ರದಲ್ಲೇ ನವೀಕರಿಸಲಾಗುವುದು.'
                  : 'Dishes for this category will be updated soon. Please check back later or contact us directly.'}
              </p>
              <Link
                to="/dining"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-[#B8964A] text-[#0F2A20] text-xs font-bold uppercase tracking-wider hover:bg-[#D9BC7A] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isKn ? 'ಊಟದ ಮುಖ್ಯ ಪುಟ' : 'Back to Dining'}</span>
              </Link>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 rounded-3xl border border-[#F1E9D8] bg-white p-8 max-w-lg mx-auto shadow-sm">
              <UtensilsCrossed className="w-12 h-12 text-[#B8964A] mx-auto mb-4" />
              <h3 className="font-serif text-2xl text-[#0F2A20] mb-2">No Dishes Found</h3>
              <p className="text-sm text-[#5F6B62] font-light mb-6">
                No creations in {currentCategory.category} match "{searchQuery || dietaryFilter}".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDietaryFilter('all');
                }}
                className="px-5 py-2.5 rounded-[12px] bg-[#B8964A] text-[#0F2A20] text-xs font-bold uppercase tracking-wider hover:bg-[#D9BC7A] transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch">
              {filteredItems.map((dish, idx) => {
                const imageSrc = resolveDishImage(dish);

                return (
                  <div
                    key={idx}
                    className="group rounded-3xl overflow-hidden border border-[#F1E9D8] bg-white hover:border-[#B8964A]/50 shadow-[0_10px_40px_rgba(15,42,32,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full"
                  >
                    {/* Top: Dish Photo with Badges & Price */}
                    <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-[#F1E9D8] flex-shrink-0">
                      <DishThumbnail
                        src={imageSrc}
                        alt={dish.name}
                        className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                        iconSize="w-8 h-8"
                        isIllustrative={dish.isIllustrative !== false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                      <div
                        className={`absolute top-3.5 left-3.5 w-6 h-6 rounded bg-white/95 border flex items-center justify-center shadow-md z-10 ${
                          dish.nonVeg ? 'border-red-500' : 'border-emerald-500'
                        }`}
                        title={dish.nonVeg ? (isKn ? 'ಮಾಂಸಾಹಾರಿ' : 'Non-Vegetarian') : (isKn ? 'ಸಸ್ಯಾಹಾರಿ' : 'Vegetarian')}
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            dish.nonVeg ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                        />
                      </div>

                      {dish.price && Number(dish.price) > 0 ? (
                        <div className="absolute bottom-3 right-3 px-3.5 py-1 rounded-full text-xs font-serif font-bold text-[#0F2A20] bg-white/95 border border-[#F1E9D8] shadow-sm z-10">
                          ₹{Number(dish.price).toLocaleString('en-IN')}
                        </div>
                      ) : null}
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-serif text-lg sm:text-xl font-bold text-[#0F2A20] group-hover:text-[#B8964A] transition-colors leading-snug break-words whitespace-normal">
                          {dish.name}
                        </h3>

                        {dish.alias && (
                          <p className="text-xs text-[#B8964A] font-mono mt-0.5 truncate">
                            ({dish.alias})
                          </p>
                        )}

                        {dish.desc && dish.desc.trim() && (
                          <p className="text-sm text-[#5F6B62] font-light leading-[1.7] mt-2.5">
                            {dish.desc}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 mt-4 border-t border-[#F1E9D8] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                          <span>{isKn ? 'ತಾಜಾ ತಯಾರಿಕೆ' : 'Freshly Prepared'}</span>
                        </div>

                        <a
                          href={`https://wa.me/${hostWaDigits}?text=Hi%20Marichin%20Homestay,%20I%20would%20like%20to%20request%20${encodeURIComponent(
                            dish.name
                          )}%20from%20the%20${encodeURIComponent(currentCategory.category)}%20menu.`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[12px] text-xs font-semibold text-[#0F2A20] bg-[#B8964A] hover:bg-[#D9BC7A] transition-all shadow-sm"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{isKn ? 'ಕೋರಿಕೆ' : 'Request'}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: Cross-Category Navigator — Linen */}
      <section className="w-full bg-[#F1E9D8] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-[#F1E9D8] bg-white p-8 sm:p-12 text-center shadow-[0_10px_40px_rgba(15,42,32,0.08)]">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A8654A] block mb-2">
              EXPLORE OTHER CATEGORIES
            </span>
            <h3 className="font-serif text-2xl sm:text-4xl text-[#0F2A20] font-normal mb-6">
              Homely Dining Categories
            </h3>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {allCategories.map((cat, idx) => {
                const catKey = cat.id || cat.slug || cat.category;
                const isCurrent =
                  (cat.id && cat.id === currentCategory.id) ||
                  cat.category === currentCategory.category;

                if (isCurrent) return null;

                return (
                  <Link
                    key={idx}
                    to={`/dining/category/${catKey}`}
                    className="px-5 py-2.5 rounded-2xl bg-[#FAF6EC] hover:bg-[#0F2A20] border border-[#B8964A]/30 text-[#0F2A20] hover:text-[#FAF6EC] text-xs font-semibold tracking-wide transition-all duration-300 shadow-sm flex items-center gap-2 group"
                  >
                    <span>{cat.category}</span>
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180 transition-transform group-hover:translate-x-1" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
