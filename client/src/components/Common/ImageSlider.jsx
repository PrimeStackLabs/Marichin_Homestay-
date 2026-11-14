import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

export const ImageSlider = ({
  slides = [],
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = true,
  heightClass = "h-[70vh] min-h-[500px]",
  overlay = true,
  renderSlideContent = null
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Auto sliding
  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [isPlaying, slides.length, autoPlayInterval]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  // Touch handlers for mobile smooth swiping
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) {
      nextSlide();
    } else if (distance < -50) {
      prevSlide();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  if (!slides || slides.length === 0) return null;

  return (
    <div
      className={`relative w-full overflow-hidden ${heightClass} select-none`}
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides Container */}
      <div
        className="w-full h-full flex transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={{ transform: `translate3d(-${currentIndex * 100}%, 0, 0)` }}
      >
        {slides.map((slide, index) => {
          const imgUrl = typeof slide === 'string' ? slide : slide.image;
          return (
            <div
              key={index}
              className="relative w-full h-full flex-shrink-0 bg-forest-950 overflow-hidden"
            >
              <img
                src={imgUrl}
                alt={slide.title || `Slide ${index + 1}`}
                className="w-full h-full object-cover object-center scale-105 animate-fade-in transition-transform duration-1000 ease-out"
                loading={index === 0 ? "eager" : "lazy"}
              />

              {overlay && (
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/40 to-forest-950/30" />
              )}

              {/* Custom Slide Content */}
              {renderSlideContent ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  {renderSlideContent(slide, index, index === currentIndex)}
                </div>
              ) : slide.title ? (
                <div className="absolute inset-0 flex items-center justify-center text-center px-4">
                  <div className="max-w-3xl transform transition-all duration-700 delay-150">
                    {slide.badge && (
                      <span className="inline-block px-3 py-1 mb-4 rounded-full text-xs font-semibold uppercase tracking-widest text-gold-400 bg-forest-900/80 border border-gold-500/30 backdrop-blur-sm">
                        {slide.badge}
                      </span>
                    )}
                    <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-ivory-100 font-semibold mb-4 leading-tight">
                      {slide.title}
                    </h2>
                    {slide.subtitle && (
                      <p className="text-base sm:text-lg text-ivory-200/90 max-w-2xl mx-auto mb-8 font-light">
                        {slide.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-gold-500/30 bg-forest-950/60 text-gold-400 hover:text-forest-950 hover:bg-gold-500 backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-luxury hover:scale-110 active:scale-95 z-20 group"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-0.5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-gold-500/30 bg-forest-950/60 text-gold-400 hover:text-forest-950 hover:bg-gold-500 backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-luxury hover:scale-110 active:scale-95 z-20 group"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 transition-transform group-hover:translate-x-0.5" />
          </button>
        </>
      )}

      {/* Slide Indicators / Dots */}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-2.5 z-20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-8 bg-gradient-to-r from-gold-400 to-gold-500 shadow-gold-glow'
                  : 'w-2 bg-ivory-100/40 hover:bg-ivory-100/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="ml-3 text-ivory-300/60 hover:text-gold-400 p-1"
            title={isPlaying ? "Pause autoplay" : "Play autoplay"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
};

