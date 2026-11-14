import React, { useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../context/AdminContext';
import { DINING_DATA } from '../../data/homestayData';
import DishThumbnail from '../../components/Dining/DishThumbnail';
import { PageBanner } from '../../components/Common/PageBanner';
import { 
  Clock, 
  Flame, 
  Leaf, 
  CookingPot, 
  Sparkles, 
  UtensilsCrossed,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dining = () => {
  const { t, language } = useLanguage();
  const { diningMenu, diningContent } = useAdmin();
  const isKn = language === 'kn';

  // Build menu categories directly from live diningMenu so admin edits, additions, deletions, prices, and images propagate cleanly
  const categories = useMemo(() => {
    const defaultCategories = DINING_DATA.menuCategories || [];
    const sourceCategories = Array.isArray(diningMenu) ? diningMenu : defaultCategories;

    return sourceCategories
      .filter((cat) => cat && cat.isActive !== false)
      .map((adminCat, idx) => {
        const defaultCat =
          defaultCategories.find(
            (c) =>
              (adminCat.slug && (c.slug === adminCat.slug || c.id === adminCat.slug)) ||
              (adminCat.id && (c.id === adminCat.id || c.slug === adminCat.id)) ||
              (adminCat.category && (c.category === adminCat.category || c.name === adminCat.category)) ||
              (adminCat.name && (c.name === adminCat.name || c.category === adminCat.name))
          ) || {};

        const rawItems = Array.isArray(adminCat.items) ? adminCat.items : [];
        const mappedItems = rawItems
          .filter((item) => item && item.isActive !== false)
          .map((adminItem) => {
            const defItem =
              (defaultCat.items || []).find(
                (d) =>
                  (adminItem.id && d.id === adminItem.id) ||
                  (adminItem.name && d.name === adminItem.name) ||
                  (adminItem.nameKn && d.nameKn === adminItem.nameKn)
              ) || null;

            return {
              ...(defItem || {}),
              ...adminItem,
              image: adminItem.image !== undefined ? adminItem.image : (defItem?.image || ''),
              isActive: adminItem.isActive !== undefined ? adminItem.isActive : true,
              name: (isKn && (adminItem.nameKn || defItem?.nameKn)) || adminItem.name || defItem?.name || '',
              desc:
                adminItem.description !== undefined
                  ? adminItem.description
                  : adminItem.desc !== undefined
                    ? adminItem.desc
                    : '',
              price:
                adminItem.price !== undefined && adminItem.price !== null && adminItem.price !== ''
                  ? adminItem.price
                  : null,
              nonVeg:
                adminItem.nonVeg !== undefined
                  ? adminItem.nonVeg
                  : adminItem.isVeg !== undefined
                    ? adminItem.isVeg === false
                    : Boolean(defItem?.nonVeg),
              isIllustrative:
                adminItem.isIllustrative !== undefined
                  ? adminItem.isIllustrative
                  : Boolean(defItem?.isIllustrative),
              tag: adminItem.tag || '',
              alias: (isKn && (adminItem.aliasKn || defItem?.aliasKn)) || adminItem.alias || defItem?.alias || '',
              alt: adminItem.alt || adminItem.name || defItem?.alt || '',
            };
          });

        const slug = adminCat.slug || adminCat.id || adminCat._id || defaultCat.slug || defaultCat.id || `cat-${idx}`;
        const rawCategoryName =
          (isKn && (adminCat.nameKn || defaultCat.nameKn)) ||
          adminCat.category ||
          adminCat.name ||
          defaultCat.category ||
          defaultCat.name ||
          'Menu';

        return {
          ...defaultCat,
          ...adminCat,
          id: adminCat.id || adminCat._id || slug,
          slug,
          category: rawCategoryName,
          name: (isKn && (adminCat.nameKn || defaultCat.nameKn)) || adminCat.name || adminCat.category || defaultCat.name || rawCategoryName,
          subtitle: adminCat.subtitle !== undefined ? adminCat.subtitle : (defaultCat.subtitle || ''),
          icon: adminCat.icon || defaultCat.icon || 'CookingPot',
          items: mappedItems,
        };
      });
  }, [diningMenu, isKn]);

  const getCategoryIcon = (iconType) => {
    const iconLower = String(iconType || '').toLowerCase();
    if (iconLower.includes('leaf')) return <Leaf className="w-5 h-5 text-[#B8964A] flex-shrink-0" />;
    if (iconLower.includes('flame')) return <Flame className="w-5 h-5 text-[#B8964A] flex-shrink-0" />;
    if (iconLower.includes('clock')) return <Clock className="w-5 h-5 text-[#B8964A] flex-shrink-0" />;
    return <CookingPot className="w-5 h-5 text-[#B8964A] flex-shrink-0" />;
  };

  // Safe helper to resolve multilingual strings from DB or objects/strings
  const resolveLocaleStr = (val, fallback = '') => {
    if (!val) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      const localized = isKn ? (val.kn || val.en) : (val.en || val.kn);
      if (typeof localized === 'string' && localized.trim()) return localized;
      if (typeof val.en === 'string' && val.en.trim()) return val.en;
      if (typeof val.kn === 'string' && val.kn.trim()) return val.kn;
      return fallback;
    }
    return String(val);
  };

  // Resolved dynamic content from diningContent model with verified neutral fallbacks
  const getCategoryLocalized = (name, kannada) => {
    if (!kannada || !name) return name || '';
    const lower = name.toLowerCase();
    if (lower.includes('breakfast')) return 'ಬೆಳಗಿನ ಉಪಹಾರ';
    if (lower.includes('dinner') && lower.includes('non-veg')) return 'ರಾತ್ರಿಯ ಊಟ, ಮಾಂಸಾಹಾರಿ';
    if (lower.includes('dinner') && (lower.includes('veg') || !lower.includes('non'))) return 'ರಾತ್ರಿಯ ಊಟ, ಸಸ್ಯಾಹಾರಿ';
    if (lower.includes('evening')) return 'ಸಂಜೆ';
    return name;
  };

  const getMealNameLocalized = (meal, kannada) => {
    if (!kannada || !meal) return meal || '';
    const lower = meal.toLowerCase();
    if (lower.includes('breakfast')) return 'ಬೆಳಗಿನ ಉಪಹಾರ';
    if (lower.includes('lunch')) return 'ಮಧ್ಯಾಹ್ನದ ಊಟ';
    if (lower.includes('tea') || lower.includes('snack') || lower.includes('evening')) return 'ಸಂಜೆಯ ಚಹಾ ಮತ್ತು ತಿಂಡಿ';
    if (lower.includes('dinner')) return 'ರಾತ್ರಿಯ ಊಟ';
    return meal;
  };

  const heroBadge = resolveLocaleStr(diningContent?.hero?.badge, t('dining.badge'));
  const heroTitle = resolveLocaleStr(diningContent?.hero?.title, t('dining.title'));
  const heroDescription = resolveLocaleStr(diningContent?.hero?.description, DINING_DATA.description);
  const heroTags = diningContent?.hero?.tags && diningContent.hero.tags.length > 0
    ? diningContent.hero.tags.map(tg => resolveLocaleStr(tg, typeof tg === 'string' ? tg : '')).filter(Boolean)
    : [];

  const timingsHeading = resolveLocaleStr(diningContent?.timings?.heading, t('dining.timingsTitle'));
  const timingsSubtitle = resolveLocaleStr(diningContent?.timings?.subtitle, isKn ? "ದೈನಂದಿನ ವಿವರ" : "Daily Routine");
  const timingsDescription = resolveLocaleStr(diningContent?.timings?.description, isKn ? "ಹೋಂಸ್ಟೇನಲ್ಲಿ ತಯಾರಿಸಲಾಗುವ ತಾಜಾ ಮನೆ ಊಟ." : "Home-cooked meals prepared fresh at the homestay.");
  const mealTimings = (diningContent?.timings?.items && diningContent.timings.items.length > 0)
    ? diningContent.timings.items.map(item => ({
        meal: resolveLocaleStr(item.meal, ''),
        time: resolveLocaleStr(item.time, ''),
        included: resolveLocaleStr(item.included, '')
      }))
    : (DINING_DATA.mealTimings || []);

  const hasMealTimings = mealTimings && mealTimings.length > 0 && mealTimings.some(t => Boolean(t.time && t.time.trim()));

  const showKitchen = diningContent?.auxiliaryKitchen?.enabled === true && Boolean(kitchenText && kitchenText.trim());
  const kitchenBadge = resolveLocaleStr(diningContent?.auxiliaryKitchen?.badge, isKn ? "ಸಹಾಯಕ ಅಡುಗೆಮನೆ" : "Auxiliary Kitchen");
  const kitchenHeading = resolveLocaleStr(diningContent?.auxiliaryKitchen?.heading, t('dining.selfCookingTitle'));
  const kitchenText = resolveLocaleStr(diningContent?.auxiliaryKitchen?.text, DINING_DATA.kitchenPolicy.details);
  const kitchenButton = resolveLocaleStr(diningContent?.auxiliaryKitchen?.buttonLabel, isKn ? "ಅತಿಥಿ ಪ್ರವೇಶ" : "Guest Access");

  const menuSectionBadge = resolveLocaleStr(diningContent?.menuSection?.badge, isKn ? "ಊಟದ ಪಟ್ಟಿ" : "DINING MENU");
  const menuSectionHeading = resolveLocaleStr(diningContent?.menuSection?.heading, isKn ? "ಮನೆ ಊಟದ ಪಟ್ಟಿ" : "Homely Dining Menu");
  const menuSectionDesc = (diningContent?.menuSection?.description && !String(diningContent.menuSection.description).includes('Freshly prepared') && !String(diningContent.menuSection.description).includes('prepared with care'))
    ? resolveLocaleStr(diningContent.menuSection.description, isKn ? "ಹೋಂಸ್ಟೇನಲ್ಲಿ ಮನೆಯೂಟ." : "Home-cooked meals at the homestay.")
    : (isKn ? "ಹೋಂಸ್ಟೇನಲ್ಲಿ ಮನೆಯೂಟ." : "Home-cooked meals at the homestay.");

  // Count total active dishes across all categories
  const totalActiveDishes = categories.reduce((sum, cat) => {
    return sum + (cat.items?.filter(item => item.isActive !== false)?.length || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#FAF6EC] text-[#1A2A21]">
      
      {/* SECTION 1: Redesigned Hero Banner with Floating Photo Cards */}
      <PageBanner pageKey="dining" />

      {/* SECTION 2: Meal Timings & Daily Routine — Shown only if filled in Admin */}
      {hasMealTimings && (
        <section className="w-full bg-[#FAF6EC] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-12">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A]">
                {timingsSubtitle}
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#0F2A20] mt-2 mb-3">
                {timingsHeading}
              </h2>
              <div className="w-16 h-0.5 bg-[#B8964A] mx-auto mb-4" />
              <p className="text-sm text-[#5F6B62] font-light leading-[1.7]">
                {timingsDescription}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {mealTimings.map((timing, i) => {
                const timeStr = typeof timing.time === 'string' ? timing.time.trim() : '';
                const includedStr = typeof timing.included === 'string' ? timing.included.trim() : '';
                const hasTime = Boolean(timeStr);
                const hasIncluded = Boolean(includedStr);

                return (
                  <div 
                    key={i} 
                    className="bg-white rounded-3xl p-6 sm:p-7 border border-[#F1E9D8] text-center flex flex-col justify-between shadow-[0_10px_40px_rgba(15,42,32,0.08)] hover:border-[#B8964A]/50 transition-all duration-300 group"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-[#FAF6EC] border border-[#F1E9D8] flex items-center justify-center text-[#B8964A] mx-auto mb-4 group-hover:bg-[#0F2A20] group-hover:text-[#D9BC7A] transition-colors">
                        <Clock className="w-6 h-6" />
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-[#0F2A20] mb-1">
                        {typeof timing.meal === 'string' ? getMealNameLocalized(timing.meal, isKn) : ''}
                      </h3>
                      {hasTime && (
                        <span className="inline-block text-xs font-mono text-[#0F2A20] bg-[#F1E9D8] px-3.5 py-1 rounded-full mb-3 font-semibold">
                          {timeStr}
                        </span>
                      )}
                    </div>
                    {hasIncluded && (
                      <p className="text-xs sm:text-sm text-[#5F6B62] font-light leading-[1.7] pt-2 border-t border-[#F1E9D8] mt-3">
                        {includedStr}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: Auxiliary Self-Cooking Kitchen Highlight — Shown only if enabled in Admin */}
      {showKitchen && (
        <section className="w-full bg-[#DDE6D3] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#FAF6EC] border border-[#F1E9D8] rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center gap-8 shadow-[0_10px_40px_rgba(15,42,32,0.08)]">
              <div className="w-20 h-20 rounded-2xl bg-[#0F2A20] border border-[#B8964A]/40 flex items-center justify-center text-[#D9BC7A] flex-shrink-0 shadow-sm">
                <UtensilsCrossed className="w-10 h-10" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A] block mb-1">
                  {kitchenBadge}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#0F2A20] mb-2">
                  {kitchenHeading}
                </h3>
                <p className="text-sm text-[#5F6B62] font-light leading-[1.7] max-w-2xl">
                  {kitchenText}
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="inline-block px-5 py-2.5 rounded-[12px] text-xs font-bold uppercase tracking-[0.14em] text-[#0F2A20] bg-[#B8964A] shadow-sm">
                  {kitchenButton}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 4: Homely Dining Menu — Linen */}
      <section className="w-full bg-[#F1E9D8] text-[#1A2A21] py-16 sm:py-24 border-b border-[#B8964A]/20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Top Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center justify-center gap-3 mb-2">
              <span className="w-8 h-px bg-[#B8964A]/60" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8654A]">
                {menuSectionBadge}
              </span>
              <span className="w-8 h-px bg-[#B8964A]/60" />
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#0F2A20] mt-1 tracking-tight">
              {menuSectionHeading}
            </h2>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#B8964A] to-transparent mx-auto mt-4 mb-4" />
            <p className="text-sm text-[#5F6B62] font-light max-w-xl mx-auto leading-[1.7]">
              {menuSectionDesc}
            </p>
          </div>

          {/* If no dishes are confirmed active yet, display neutral notice */}
          {totalActiveDishes === 0 ? (
            <div className="max-w-xl mx-auto text-center py-12 px-6 bg-white rounded-3xl border border-[#F1E9D8] shadow-[0_10px_40px_rgba(15,42,32,0.06)]">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF6EC] border border-[#B8964A]/30 flex items-center justify-center text-[#B8964A] mx-auto mb-4">
                <UtensilsCrossed className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-2xl font-normal text-[#0F2A20] mb-2">
                {isKn ? 'ನಮ್ಮ ಊಟದ ಪಟ್ಟಿ ಶೀಘ್ರದಲ್ಲೇ ನವೀಕರಣಗೊಳ್ಳಲಿದೆ' : 'Our menu will be updated soon.'}
              </h3>
              <p className="text-sm text-[#5F6B62] font-light leading-relaxed">
                {isKn
                  ? 'ಹೋಂಸ್ಟೇನಲ್ಲಿ ತಯಾರಿಸಲಾಗುವ ತಾಜಾ ಮನೆ ಊಟದ ಸಂಪೂರ್ಣ ವಿವರಗಳನ್ನು ಶೀಘ್ರದಲ್ಲೇ ಇಲ್ಲಿ ನೀಡಲಾಗುವುದು.'
                  : 'Home-cooked meal options and daily specials are being updated. Please check back soon or contact us for details.'}
              </p>
            </div>
          ) : (
            /* Category Containers */
            <div className="space-y-8 sm:space-y-10">
              {categories.map((cat, cIdx) => {
                const catKey = cat.id || cat.slug || cat.category;
                const activeItems = (cat.items || []).filter(i => i.isActive !== false);
                if (activeItems.length === 0) return null;

                const visibleItems = activeItems;

                return (
                  <div 
                    key={cIdx} 
                    className="rounded-3xl border border-[#F1E9D8] bg-white p-6 sm:p-8 shadow-[0_10px_40px_rgba(15,42,32,0.08)]"
                  >
                    {/* Category Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#F1E9D8]">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="w-9 h-9 rounded-xl bg-[#FAF6EC] border border-[#B8964A]/30 flex items-center justify-center flex-shrink-0">
                          {getCategoryIcon(cat.icon)}
                        </div>
                        <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#0F2A20] tracking-wide">
                          {getCategoryLocalized(cat.category, isKn)}
                        </h3>
                        {cat.subtitle && cat.subtitle.trim() && (
                          <span className="hidden md:inline-block text-xs text-[#5F6B62] font-light border-l border-[#B8964A]/30 pl-3">
                            {cat.subtitle}
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/dining/category/${catKey}`}
                        className="self-end sm:self-auto px-5 py-2 rounded-[12px] border-[1.5px] border-[#0F2A20] hover:bg-[#0F2A20] hover:text-[#FAF6EC] text-[#0F2A20] text-xs font-semibold tracking-wide transition-all duration-300 flex items-center gap-2 group/btn shadow-sm"
                      >
                        <span>{isKn ? `ವರ್ಗವನ್ನು ವೀಕ್ಷಿಸಿ (${activeItems.length})` : `Explore Category (${activeItems.length})`}</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                      </Link>
                    </div>

                    {/* Dish Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                      {visibleItems.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="group rounded-2xl p-4 bg-[#FAF6EC] hover:bg-white border border-[#F1E9D8] hover:border-[#B8964A]/50 transition-all duration-300 flex gap-4 shadow-sm relative overflow-hidden"
                        >
                          {/* Photo Thumbnail */}
                          <div className="w-24 sm:w-28 h-24 rounded-xl overflow-hidden flex-shrink-0 relative bg-[#F1E9D8] border border-[#F1E9D8]">
                            <DishThumbnail
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              iconSize="w-6 h-6"
                              isIllustrative={item.isIllustrative !== false}
                            />
                          </div>

                          {/* Dish Details */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                            <div>
                              <div className="flex items-center gap-1.5 mb-1">
                                <span
                                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    item.nonVeg
                                      ? 'bg-red-500 ring-1 ring-red-400'
                                      : 'bg-emerald-500 ring-1 ring-emerald-400'
                                  }`}
                                  title={item.nonVeg ? (isKn ? "ಮಾಂಸಾಹಾರಿ" : "Non-Vegetarian") : (isKn ? "ಸಸ್ಯಾಹಾರಿ" : "Vegetarian")}
                                />
                                <h4 className="font-serif text-sm sm:text-base font-medium text-[#0F2A20] group-hover:text-[#B8964A] transition-colors break-words whitespace-normal leading-snug">
                                  {item.name}
                                </h4>
                              </div>
                              {item.desc && item.desc.trim() && (
                                <p className="text-xs text-[#5F6B62] font-light leading-relaxed mt-1">
                                  {item.desc}
                                </p>
                              )}
                            </div>

                            {item.price && Number(item.price) > 0 ? (
                              <div className="flex items-center justify-between pt-2 border-t border-[#F1E9D8] mt-2">
                                <span className="text-xs font-mono font-bold text-[#0F2A20]">
                                  ₹{Number(item.price).toLocaleString('en-IN')}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>

    </div>
  );
};
