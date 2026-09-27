import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';

const slides = [
  {
    image: '/hero-slides/hero-1.png',
    alt: 'Gargee Medicose Banner 1'
  },
  {
    image: '/hero-slides/hero-2.png',
    alt: 'Gargee Medicose Banner 2'
  },
  {
    image: '/hero-slides/hero-3.png',
    alt: 'Gargee Medicose Banner 3'
  }
];

export default function HeroSlider() {
  const { navigateTo } = useShop();
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const goToPrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = 0;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) {
      goToNext();
    } else if (distance < -50) {
      goToPrev();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <section className="relative max-w-7xl mx-auto px-2 sm:px-4 pt-2 sm:pt-6">
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-md border border-slate-200/80 bg-slate-900 group aspect-[16/9] sm:aspect-[16/7] md:aspect-[21/9] w-full min-h-[190px] sm:min-h-[320px] max-h-[480px] touch-pan-y select-none"
      >
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.alt}
              className="w-full h-full object-cover object-center sm:object-cover pointer-events-none select-none"
            />

            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent flex flex-col justify-end p-3 sm:p-6 md:p-8">
              <div className="flex items-end justify-between gap-2">
                <div className="text-white space-y-1 max-w-[70%] sm:max-w-md">
                  <span className="inline-block bg-sky-500/90 text-white text-[9px] sm:text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-xs">
                    🐾 India's Trusted Pet Store
                  </span>
                  <h2 className="text-sm sm:text-2xl md:text-3xl font-heading font-black drop-shadow-md line-clamp-1 leading-snug">
                    Everything Your Pet Needs
                  </h2>
                </div>

                <button
                  onClick={() => navigateTo('shop')}
                  className="px-3 py-1.5 sm:px-5 sm:py-2.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white rounded-full font-heading font-bold text-[11px] sm:text-xs md:text-sm shadow-md shadow-sky-500/30 flex items-center gap-1 shrink-0 transition active:scale-95 cursor-pointer"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Previous Button - visible on hover on desktop, smaller on mobile */}
        <button
          onClick={goToPrev}
          aria-label="Previous Slide"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-10 sm:h-10 bg-white/80 hover:bg-white text-slate-800 rounded-full flex items-center justify-center shadow-md backdrop-blur-xs transition opacity-70 hover:opacity-100 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
        </button>

        {/* Next Button */}
        <button
          onClick={goToNext}
          aria-label="Next Slide"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-10 sm:h-10 bg-white/80 hover:bg-white text-slate-800 rounded-full flex items-center justify-center shadow-md backdrop-blur-xs transition opacity-70 hover:opacity-100 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
        </button>

        {/* Dots Navigation */}
        <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentIndex
                  ? 'w-5 sm:w-7 bg-sky-400'
                  : 'w-1.5 sm:w-2 bg-white/60 hover:bg-white'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
