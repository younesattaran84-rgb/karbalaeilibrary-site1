import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, BookOpen, Sparkles, MapPin } from 'lucide-react';
import { EitaaIcon } from './EitaaIcon';
import { HeroSingle3DBook } from './Hero3DBooks';
import { OperatingHours, HomepageCMS } from '../types';
import { isLibraryOpenNow } from '../utils/persian';

interface HeroProps {
  onSearchClick: () => void;
  onExploreShelvesClick: () => void;
  operatingHours?: OperatingHours;
  cms?: HomepageCMS;
}

export const Hero: React.FC<HeroProps> = ({ onSearchClick, onExploreShelvesClick, operatingHours, cms }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [status, setStatus] = useState(() => isLibraryOpenNow(operatingHours));

  useEffect(() => {
    setStatus(isLibraryOpenNow(operatingHours));
    const interval = setInterval(() => {
      setStatus(isLibraryOpenNow(operatingHours));
    }, 60000);
    return () => clearInterval(interval);
  }, [operatingHours]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      setMousePos({
        x: (e.clientX / innerWidth - 0.5) * 20,
        y: (e.clientY / innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 3D Books Configuration
  const show3DBooks = cms?.hero_show_3d_books !== false;
  const bookPositionMode = cms?.hero_3d_books_position || 'balanced';
  const scaleMultiplier = cms?.hero_3d_books_scale ? cms.hero_3d_books_scale / 100 : 1;
  const forceGreen = cms?.hero_3d_books_green_theme !== false;

  // Headline line-by-line and word-by-word interactive hopping with full Enter / newline support
  const headlineText = cms?.hero_quote_text || cms?.hero_title || '«کتاب‌ها کشتی‌هایی هستند که ما را به سرزمین‌های دور می‌برند»';
  const headlineLines = headlineText.split('\n').filter(Boolean);

  // Position classes depending on the position mode
  const getLeftBookClass = () => {
    switch (bookPositionMode) {
      case 'sides':
        return 'hidden lg:block absolute left-2 xl:left-4 top-24 z-20 pointer-events-auto';
      case 'top-corners':
        return 'hidden lg:block absolute left-8 top-16 z-20 pointer-events-auto';
      case 'compact':
        return 'hidden lg:block absolute left-14 top-40 z-20 pointer-events-auto';
      case 'balanced':
      default:
        return 'hidden lg:block absolute left-6 xl:left-10 top-36 z-20 pointer-events-auto';
    }
  };

  const getRightBookClass = () => {
    switch (bookPositionMode) {
      case 'sides':
        return 'hidden lg:block absolute right-2 xl:right-4 top-24 z-20 pointer-events-auto';
      case 'top-corners':
        return 'hidden lg:block absolute right-8 top-16 z-20 pointer-events-auto';
      case 'compact':
        return 'hidden lg:block absolute right-14 top-40 z-20 pointer-events-auto';
      case 'balanced':
      default:
        return 'hidden lg:block absolute right-6 xl:right-10 top-36 z-20 pointer-events-auto';
    }
  };

  return (
    <section className="relative overflow-hidden pt-10 pb-20 lg:pt-14 lg:pb-28 bg-gradient-to-b from-[#042f2e] via-[#073834] to-[#042f2e] border-b border-[#0d9488]/30">
      
      {/* Background Decorative Ambient Shapes & Subtle Islamic Geometry Watermark */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="islamic-grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M40 0 L80 40 L40 80 L0 40 Z" fill="none" stroke="#14b8a6" strokeWidth="1" />
              <circle cx="40" cy="40" r="16" fill="none" stroke="#84cc16" strokeWidth="0.8" />
              <path d="M40 10 L70 40 L40 70 L10 40 Z" fill="none" stroke="#5eead4" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamic-grid)" />
        </svg>
      </div>

      {/* Floating Light Orbs */}
      <div className="absolute top-1/4 right-5 w-80 h-80 rounded-full bg-[#0d9488]/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-5 w-72 h-72 rounded-full bg-[#84cc16]/15 blur-3xl pointer-events-none" />

      {/* Background Decorative 3D Book - Left Side */}
      {show3DBooks && (
        <motion.div
          initial={{ opacity: 0, x: -140, rotate: -20 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={getLeftBookClass()}
        >
          <HeroSingle3DBook
            bookIndex={1}
            width={Math.round(130 * scaleMultiplier)}
            height={Math.round(180 * scaleMultiplier)}
            depth={Math.round(24 * scaleMultiplier)}
            initialRotateY={-24}
            initialRotateX={8}
            initialRotateZ={-10}
            floatingDuration={6}
            forceGreenTheme={forceGreen}
          />
        </motion.div>
      )}

      {/* Background Decorative 3D Book - Right Side */}
      {show3DBooks && (
        <motion.div
          initial={{ opacity: 0, x: 140, rotate: 20 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={getRightBookClass()}
        >
          <HeroSingle3DBook
            bookIndex={3}
            width={Math.round(125 * scaleMultiplier)}
            height={Math.round(175 * scaleMultiplier)}
            depth={Math.round(22 * scaleMultiplier)}
            initialRotateY={22}
            initialRotateX={10}
            initialRotateZ={8}
            floatingDuration={5.2}
            forceGreenTheme={forceGreen}
          />
        </motion.div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-right">
        {/* Top Section: Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          {/* Live Library Status Pill with Dynamic Green/Red Rotating Aura */}
          {(cms?.header_show_live_status !== false) ? (
            <motion.div
              initial={{ opacity: 0, y: -25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
              className={`self-start ${status.isOpen ? 'green-rotating-border-container' : 'red-rotating-border-container'}`}
            >
              <div className={`px-4 py-2 rounded-full flex items-center gap-2.5 text-xs font-bold ${status.isOpen ? 'green-rotating-border-inner text-[#a3e635]' : status.isHoliday ? 'red-rotating-border-inner text-amber-300' : 'red-rotating-border-inner text-rose-300'}`}>
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${status.isOpen ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' : status.isHoliday ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`} />
                <span className="font-black text-xs sm:text-sm">{status.statusText}</span>
                <span className={`font-normal border-r pr-2 mr-1 text-[11px] sm:text-xs ${status.isOpen ? 'text-[#99f6e4] border-[#0d9488]/40' : status.isHoliday ? 'text-amber-200 border-amber-500/40' : 'text-rose-200 border-rose-500/40'}`}>
                  {status.todayScheduleText}
                </span>
              </div>
            </motion.div>
          ) : <div />}

          {/* Book 1 on Desktop only (enters from top-right) */}
          {show3DBooks && (
            <motion.div
              initial={{ opacity: 0, y: -40, x: 40, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="hidden sm:block self-center sm:self-end -mt-2 sm:-mt-6"
            >
              <HeroSingle3DBook
                bookIndex={0}
                width={Math.round(110 * scaleMultiplier)}
                height={Math.round(155 * scaleMultiplier)}
                depth={Math.round(20 * scaleMultiplier)}
                initialRotateY={-16}
                initialRotateX={12}
                initialRotateZ={7}
                floatingDuration={5.5}
                forceGreenTheme={forceGreen}
              />
            </motion.div>
          )}
        </div>

        {/* Official Logo Display with Luminous Floating Frame */}
        <motion.div
          initial={{ opacity: 0, scale: 0.4, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
          className="mb-6 flex items-center"
        >
          <motion.div
            animate={{
              y: [0, -6, 0],
              rotate: [0, 1, -1, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 5,
              ease: 'easeInOut',
            }}
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#0d9488]/80 via-[#0f766e]/80 to-[#042f2e] p-2 border border-[#0d9488]/40 shadow-lg shadow-[#0d9488]/20 relative group overflow-hidden"
          >
            <img
              src={cms?.header_logo_url || "/assets/sahne_vajeha_logo.png"}
              alt="لوگو صحن واژه‌ها"
              style={{
                objectFit: cms?.header_logo_fit || 'contain',
                borderRadius: cms?.header_logo_radius || '1rem',
                transform: cms?.header_logo_scale ? `scale(${cms.header_logo_scale / 100})` : undefined,
              }}
              className="w-full h-full filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
            />
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </motion.div>
        </motion.div>

        {/* Main Headline with Word-by-Word Interactive Hover Bounce */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <h1
            className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.8rem] font-black leading-[1.6] tracking-tight flex flex-col items-start gap-y-2"
            style={cms?.hero_title_font ? { fontFamily: cms.hero_title_font } : undefined}
          >
            {headlineLines.map((line, lIdx) => {
              const lineWords = line.split(/\s+/).filter(Boolean);
              return (
                <div key={lIdx} className="flex flex-wrap items-center">
                  {lineWords.map((word, wIdx) => {
                    const isBookWord = /کتاب/.test(word);
                    return (
                      <span
                        key={wIdx}
                        className={`inline-block transition-all duration-200 transform hover:scale-125 hover:-translate-y-2 cursor-pointer select-none mx-1 sm:mx-1.5 ${
                          isBookWord
                            ? 'text-[#84cc16] hover:text-[#a3e635] drop-shadow-[0_0_14px_rgba(132,204,22,0.85)] font-black'
                            : 'text-white hover:text-[#84cc16] hover:drop-shadow-[0_0_10px_rgba(132,204,22,0.5)]'
                        }`}
                      >
                        {word}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </h1>

          {cms?.hero_quote_author && (
            <p className="mt-2 text-sm text-[#99f6e4] font-semibold">
              — {cms.hero_quote_author}
            </p>
          )}
        </motion.div>

        {/* Subtitle & Book 3 Area */}
        <div className="mt-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <motion.h2
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.55, ease: 'easeOut' }}
              className="text-xl sm:text-2xl font-extrabold text-[#99f6e4] flex items-center gap-2"
              style={cms?.hero_desc_font ? { fontFamily: cms.hero_desc_font } : undefined}
            >
              <Sparkles className="w-5 h-5 text-[#84cc16] animate-spin" style={{ animationDuration: '6s' }} />
              <span className="shimmer-text">
                {cms?.hero_welcome_title || 'به کتابخانه شهید احسان کربلایی‌پور خوش آمدید'}
              </span>
            </motion.h2>

            {/* Welcoming Paragraph with Pre-Line support for enter/newlines */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 p-5 sm:p-6 rounded-2xl bg-[#073834]/80 border border-[#0d9488]/30 shadow-inner backdrop-blur-sm text-justify"
            >
              <p
                className="text-sm sm:text-base text-[#e6fffa] leading-relaxed font-normal hover:text-white transition-colors whitespace-pre-line"
                style={cms?.hero_desc_font ? { fontFamily: cms.hero_desc_font } : undefined}
              >
                {cms?.hero_welcome_text || cms?.hero_description || 'اینجا خانه‌ای برای اندیشه‌هاست. کتابخانه‌ای که به یاد شهید مدافع حرم، احسان کربلایی‌پور، بنا شده است تا چراغ دانش و آگاهی را در میان نسل امروز روشن نگه دارد. ما باور داریم که هر کتاب، پنجره‌ای به سوی جهانی تازه است و هر خواننده، ادامه‌دهنده راهی است که شهیدان برای سربلندی این سرزمین پیموده‌اند. در این کتابخانه، شما فقط کتاب امانت نمی‌گیرید؛ شما بخشی از یک خانواده فرهنگی می‌شوید که هدفش رشد، آگاهی و نزدیکی به آرمان‌های والای انسانی است.'}
              </p>
            </motion.div>
          </div>

          {/* Book 3: Placed at the bottom-right of the area, inclined at an angle */}
          {show3DBooks && (
            <motion.div
              initial={{ opacity: 0, x: 80, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="self-end md:self-center shrink-0 pt-2 md:pt-0 pr-0 md:pr-4"
            >
              <HeroSingle3DBook
                bookIndex={2}
                width={Math.round(130 * scaleMultiplier)}
                height={Math.round(180 * scaleMultiplier)}
                depth={Math.round(24 * scaleMultiplier)}
                initialRotateY={-26}
                initialRotateX={14}
                initialRotateZ={9}
                floatingDuration={4.8}
                forceGreenTheme={forceGreen}
              />
            </motion.div>
          )}
        </div>

        {/* Call To Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.8, ease: 'easeOut' }}
          className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4"
        >
          <button
            type="button"
            onClick={onSearchClick}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#84cc16] to-[#65a30d] hover:from-[#a3e635] hover:to-[#84cc16] text-[#042f2e] font-black text-sm sm:text-base flex items-center gap-2.5 shadow-lg shadow-[#84cc16]/25 hover:shadow-xl hover:shadow-[#84cc16]/40 transition-all transform hover:-translate-y-1 active:translate-y-0 cursor-pointer"
          >
            <Search className="w-5 h-5" />
            <span>{cms?.hero_cta_search_text || 'جستجو میان +۷۰۰۰ کتاب'}</span>
          </button>

          <button
            type="button"
            onClick={onExploreShelvesClick}
            className="px-5 py-3.5 rounded-2xl bg-[#073834] hover:bg-[#0d9488]/30 text-white font-bold text-sm sm:text-base border border-[#0d9488]/40 hover:border-[#84cc16]/60 flex items-center gap-2.5 transition-all transform hover:-translate-y-1 active:translate-y-0 cursor-pointer"
          >
            <BookOpen className="w-5 h-5 text-[#5eead4]" />
            <span>{cms?.hero_cta_shelves_text || 'مشاهده قفسه‌های کتابخانه'}</span>
          </button>

          <a
            href={cms?.header_eitaa_link || "https://eitaa.com/shahidKarbalailibrary"}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-3.5 rounded-2xl bg-gradient-to-r from-[#EA580C] to-[#f97316] hover:from-[#c2410c] hover:to-[#ea580c] text-white font-bold text-sm flex items-center gap-2.5 shadow-md transition-all transform hover:-translate-y-1 cursor-pointer"
            title="کانال ایتا"
          >
            <EitaaIcon size={22} />
            <span className="hidden sm:inline">{cms?.hero_cta_eitaa_text || 'کانال ایتا'}</span>
          </a>
        </motion.div>

        {/* Address quick note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="mt-6 flex items-center gap-2 text-xs text-[#99f6e4]/80"
        >
          <MapPin className="w-4 h-4 text-[#84cc16] shrink-0" />
          <span className="whitespace-pre-line">{cms?.hero_address_note || 'اهواز، فاز دو پادادشهر، بلوار سعادت، مسجد امام خمینی(ره)، کتابخانه شهید احسان کربلایی‌پور'}</span>
        </motion.div>
      </div>
    </section>
  );
};
