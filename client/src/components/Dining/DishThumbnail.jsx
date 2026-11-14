import React, { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * DishThumbnail:
 * Displays dish image if provided and valid.
 * If image is missing, empty, or fails to load (onError),
 * renders a neutral placeholder tile in the card style (soft linen bg with fork-and-knife icon).
 * Never displays a broken image icon or alt text.
 * When isIllustrative is true, displays a small "Illustrative image" caption badge on the photo.
 */
export const DishThumbnail = ({
  src,
  alt = '',
  className = 'w-full h-full object-cover transition-transform duration-500 group-hover:scale-105',
  iconSize = 'w-6 h-6',
  isIllustrative = false
}) => {
  const { language } = useLanguage();
  const isKn = language === 'kn';
  const [hasError, setHasError] = useState(false);
  const isValidSrc = Boolean(src && typeof src === 'string' && src.trim() !== '' && !hasError);

  if (!isValidSrc) {
    return (
      <div 
        className="w-full h-full flex items-center justify-center bg-[#F1E9D8] border border-[#B8964A]/20 text-[#B8964A]/70 select-none"
        role="img"
        aria-label={alt ? `${alt} placeholder` : 'Dish placeholder'}
      >
        <UtensilsCrossed className={`${iconSize} stroke-[1.5]`} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <img
        src={src}
        alt={alt}
        className={className}
        loading="lazy"
        onError={() => setHasError(true)}
      />
      {isIllustrative && (
        <span className="absolute bottom-1 right-1 text-[8px] font-sans font-medium tracking-tight bg-black/65 text-white/90 px-1.5 py-0.5 rounded backdrop-blur-sm pointer-events-none select-none z-10">
          {isKn ? 'ಸಾಂದರ್ಭಿಕ ಚಿತ್ರ' : 'Illustrative image'}
        </span>
      )}
    </div>
  );
};

export default DishThumbnail;

