import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { Quote, ArrowRight, ArrowLeft, BookOpen, Sparkles, MoveHorizontal } from 'lucide-react';
import { INITIAL_QUOTES } from '../data/initialData';
import { HomepageCMS } from '../types';
import { ensureFontFaceLoaded } from './FontPickerField';

interface QuotesCarouselProps {
  cms?: HomepageCMS;
}

export const QuotesCarousel: React.FC<QuotesCarouselProps> = ({ cms }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<number>(0); // 1 = next (left in RTL), -1 = prev (right in RTL)
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Fallback touch tracking coordinates
  const touchCoords = useRef<{ startX: number; startY: number; moved: boolean } | null>(null);

  const quoteList = (cms?.quotes_items && cms.quotes_items.length > 0)
    ? cms.quotes_items
    : INITIAL_QUOTES;

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((c) => (c === 0 ? quoteList.length - 1 : c - 1));
  }, [quoteList.length]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrentIndex((c) => (c === quoteList.length - 1 ? 0 : c + 1));
  }, [quoteList.length]);

  // Auto-scroll every 10 seconds unless hovered or user is dragging
  useEffect(() => {
    if (isPaused || isDragging) return;
    const timer = setInterval(() => {
      next();
    }, 10000);
    return () => clearInterval(timer);
  }, [currentIndex, isPaused, isDragging, next]);

  // Motion Drag handler (supports both touch and mouse drag smoothly)
  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    const { offset, velocity } = info;
    const swipeThreshold = 40;
    const velocityThreshold = 200;

    // In RTL Persian:
    // Dragging left (negative offset) -> advance to next
    // Dragging right (positive offset) -> return to previous
    if (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) {
      next();
    } else if (offset.x > swipeThreshold || velocity.x > velocityThreshold) {
      prev();
    }
  };

  // Fallback Native Touch Handlers for mobile browsers that bypass pointer drag
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchCoords.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        moved: false,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchCoords.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - touchCoords.current.startX;
    const deltaY = e.touches[0].clientY - touchCoords.current.startY;
    // If predominantly horizontal, mark as moved
    if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
      touchCoords.current.moved = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchCoords.current) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - touchCoords.current.startX;
    const diffY = endY - touchCoords.current.startY;

    // Only trigger if horizontal swipe is greater than vertical movement
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX < 0) {
        next();
      } else {
        prev();
      }
    }
    touchCoords.current = null;
  };

  const quote = quoteList[currentIndex] || quoteList[0];
  const customFont = cms?.quotes_font;

  const slideVariants = {
    enter: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? -40 : 40,
    }),
    center: {
      opacity: 1,
      x: 0,
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? 40 : -40,
    }),
  };

  return (
    <section className="py-20 bg-[#042f2e] relative overflow-hidden border-b border-[#0d9488]/30">
      {/* Subtle ambient glow */}
      <div className="absolute top-1/2 right-1/4 w-80 h-80 rounded-full bg-[#0d9488]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-80 h-80 rounded-full bg-[#84cc16]/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header with Motion scroll effect */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-black text-white hover-hop tracking-tight">
            {cms?.quotes_title || cms?.quotes_section_title || 'کلام بزرگان درباره کتاب و کتابخوانی'}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#99f6e4] font-medium">
            {cms?.quotes_subtitle || cms?.quotes_section_subtitle || 'احادیث و سخنان بزرگان درباره کتابخوانی'}
          </p>
        </motion.div>

        {/* Carousel Container wrapped in Golden Rotating Aura with swipe and touch events */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto golden-rotating-border-container shadow-2xl p-[2px] rounded-3xl select-none"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Draggable Inner Area */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.22}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'pan-y' }}
            className="golden-rotating-border-inner rounded-3xl bg-gradient-to-br from-[#073834] via-[#042f2e] to-[#073834] p-6 sm:p-12 backdrop-blur-md cursor-grab active:cursor-grabbing transition-shadow"
          >
            
            <div className="flex items-center justify-between mb-6">
              {/* Golden Badge for Goher-e-Hekmat */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-[#0d9488]/20 text-[#84cc16] border border-[#facc15]/50 shadow-[0_0_12px_rgba(250,204,21,0.25)] flex items-center gap-2">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[#facc15]" />
                <span className="text-xs sm:text-sm font-black text-[#fbbf24]">گوهر حکمت</span>
              </div>

              {/* Navigation Controls & Touch Hint */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#99f6e4]/60 bg-[#042f2e]/60 px-3 py-1.5 rounded-xl border border-[#0d9488]/20">
                  <MoveHorizontal className="w-3.5 h-3.5 text-[#84cc16]" />
                  <span>کشیدن به چپ و راست</span>
                </div>

                <button
                  type="button"
                  onClick={prev}
                  className="p-2.5 rounded-xl bg-[#042f2e] hover:bg-[#0d9488]/40 text-[#ccfbf1] hover:text-white border border-[#0d9488]/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  aria-label="قبلی"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="p-2.5 rounded-xl bg-[#042f2e] hover:bg-[#0d9488]/40 text-[#ccfbf1] hover:text-white border border-[#0d9488]/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  aria-label="بعدی"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quote Body with Directional Animation and Smooth Fade */}
            <div className="min-h-[160px] flex flex-col justify-center overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  {quote.arabic && (
                    <p
                      className="text-base sm:text-xl font-bold text-[#facc15] mb-3 font-serif text-center sm:text-right whitespace-pre-line leading-relaxed"
                      style={customFont ? { fontFamily: customFont } : undefined}
                    >
                      «{quote.arabic}»
                    </p>
                  )}
                  <blockquote
                    className="text-lg sm:text-2xl font-bold text-white leading-relaxed text-justify sm:text-right whitespace-pre-line"
                    style={customFont ? { fontFamily: customFont } : undefined}
                  >
                    «{quote.text || quote.persian}»
                  </blockquote>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Author info & Indicators */}
            <div className="mt-8 pt-6 border-t border-[#0d9488]/25 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0d9488] to-[#84cc16] flex items-center justify-center text-white font-black text-base shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-[#a3e635]">
                    {quote.author || quote.source}
                  </h4>
                  {quote.role && <p className="text-xs text-[#99f6e4]">{quote.role}</p>}
                </div>
              </div>

              {/* Progress Indicators & Mobile Swipe Cue */}
              <div className="flex items-center gap-3">
                <span className="sm:hidden text-[10px] text-[#99f6e4]/60">لمس و کشیدن ↔</span>
                <div className="flex items-center gap-1.5">
                  {quoteList.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setDirection(i > currentIndex ? 1 : -1);
                        setCurrentIndex(i);
                      }}
                      className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                        i === currentIndex ? 'w-8 bg-[#facc15] shadow-[0_0_8px_#facc15]' : 'w-2.5 bg-[#0d9488]/40 hover:bg-[#0d9488]'
                      }`}
                      aria-label={`اسلاید ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

          </motion.div>
        </motion.div>

      </div>
    </section>
  );
};

