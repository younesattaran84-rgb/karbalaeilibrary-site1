import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import {
  MapPin,
  Clock,
  ExternalLink,
  Sparkles,
  BookOpen,
  RotateCcw,
  Compass,
  ArrowDown,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { EitaaIcon } from './EitaaIcon';
import { isLibraryOpenNow } from '../utils/persian';

export const InteractiveShelfBook: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const status = isLibraryOpenNow();

  // Mode: null means controlled by scroll; 0 = shelf, 1 = page 1, 2 = page 2
  const [manualMode, setManualMode] = useState<number | null>(null);

  // Measure scroll progress through the tall sticky section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Smoother, highly responsive spring for fluid 3D interaction without jitter
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
    restDelta: 0.0005,
  });

  // Calculate scroll phase:
  // Phase 0 (0.00 -> 0.28): In Shelf (resting)
  // Phase 1 (0.28 -> 0.65): Pulled out + Open Page 1 (Address & Neshan)
  // Phase 2 (0.65 -> 1.00): Page 2 (Hours & Eitaa)
  const [scrollPhase, setScrollPhase] = useState<number>(0);

  useEffect(() => {
    const unsub = smoothProgress.on('change', (latest) => {
      if (manualMode === null) {
        if (latest < 0.28) {
          setScrollPhase(0);
        } else if (latest < 0.65) {
          setScrollPhase(1);
        } else {
          setScrollPhase(2);
        }
      }
    });
    return () => unsub();
  }, [smoothProgress, manualMode]);

  const effectivePhase = manualMode !== null ? manualMode : scrollPhase;

  // Gentle, controlled 3D motion transforms driven smoothly by scroll
  const bookY = useTransform(smoothProgress, [0.0, 0.3, 0.7], [35, 0, 0]);
  const bookScale = useTransform(smoothProgress, [0.0, 0.35, 0.8], [0.94, 1, 1]);
  const bookRotateX = useTransform(smoothProgress, [0.0, 0.3, 0.8], [7, 2, 0]);
  const bookRotateY = useTransform(smoothProgress, [0.0, 0.45, 0.85], [3, -2, 0]);

  return (
    <section
      ref={containerRef}
      id="shelf-book-section"
      className="relative min-h-[220vh] sm:min-h-[250vh] bg-gradient-to-b from-[#031d1c] via-[#042f2e] to-[#031d1c] border-y-2 border-[#0d9488]/40"
    >
      {/* Sticky Viewport Stage: Pinned while user scrolls through the 250vh track */}
      <div className="sticky top-16 sm:top-20 h-[88vh] sm:h-[84vh] max-h-[920px] w-full flex flex-col justify-between items-center py-4 px-3 sm:px-6 overflow-hidden">
        
        {/* Stage Header */}
        <div className="w-full max-w-4xl mx-auto text-center z-30 pt-1 shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#84cc16]/15 border border-[#84cc16]/40 text-[#a3e635] text-xs font-bold mb-2 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#84cc16] animate-spin" style={{ animationDuration: '6s' }} />
            <span>کتاب سه‌بعدی تعاملی</span>
            <span className="hidden sm:inline text-[#99f6e4]">• با اسکرول صفحه یا کلیک دکمه‌ها ورق بزنید</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-black text-white hover-hop tracking-tight">
            <span className="shimmer-text">شناسنامه و راهنمای مراجعان</span> در گنجینه کتابخانه
          </h2>

          {/* Interactive Manual / Scroll Switcher Navigation */}
          <div className="mt-3 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setManualMode(0)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                effectivePhase === 0
                  ? 'bg-[#84cc16] text-[#042f2e] shadow-md shadow-[#84cc16]/30 font-black scale-105'
                  : 'bg-[#073834] text-[#ccfbf1] hover:bg-[#0d9488]/30 border border-[#0d9488]/40'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>۱. در قفسه</span>
            </button>

            <button
              type="button"
              onClick={() => setManualMode(1)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                effectivePhase === 1
                  ? 'bg-[#84cc16] text-[#042f2e] shadow-md shadow-[#84cc16]/30 font-black scale-105'
                  : 'bg-[#073834] text-[#ccfbf1] hover:bg-[#0d9488]/30 border border-[#0d9488]/40'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>۲. برگ اول: نشانی و نشان</span>
            </button>

            <button
              type="button"
              onClick={() => setManualMode(2)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                effectivePhase === 2
                  ? 'bg-[#84cc16] text-[#042f2e] shadow-md shadow-[#84cc16]/30 font-black scale-105'
                  : 'bg-[#073834] text-[#ccfbf1] hover:bg-[#0d9488]/30 border border-[#0d9488]/40'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>۳. برگ دوم: ساعت کاری و ایتا</span>
            </button>

            {manualMode !== null && (
              <button
                type="button"
                onClick={() => setManualMode(null)}
                className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-[#042f2e] text-[#a3e635] hover:underline border border-[#84cc16]/40 flex items-center gap-1"
                title="بازگشت به کنترل خودکار با اسکرول"
              >
                <RotateCcw className="w-3 h-3" />
                <span>حالت اسکرول</span>
              </button>
            )}
          </div>
        </div>

        {/* 3D Bookshelf Stage Container */}
        <div className="relative w-full max-w-4xl flex-1 flex items-center justify-center my-2 perspective-1200 z-10 px-2 sm:px-4">
          
          {/* Wooden Shelf Background Arc & Base */}
          <div className="absolute inset-x-2 sm:inset-x-6 bottom-4 h-7 bg-gradient-to-r from-[#2c1305] via-[#5c2b09] to-[#2c1305] rounded-t-lg shadow-2xl border-t-2 border-amber-600/40 pointer-events-none z-0" />
          <div className="absolute inset-x-8 bottom-11 h-2.5 bg-black/60 blur-md pointer-events-none z-0" />

          {/* Decorative standing books on the shelf (behind the featured book) */}
          <div className="absolute inset-x-6 bottom-11 flex items-end justify-between px-2 sm:px-6 pointer-events-none select-none z-0 opacity-35">
            <div className="w-6 sm:w-8 h-32 sm:h-44 bg-[#064e3b] rounded-t border-r border-emerald-950" />
            <div className="w-7 sm:w-10 h-36 sm:h-52 bg-[#1e1b4b] rounded-t border-r border-indigo-950" />
            <div className="w-6 sm:w-9 h-28 sm:h-40 bg-[#831843] rounded-t" />
            <div className="hidden sm:block w-9 h-48 bg-[#7c2d12] rounded-t border-r border-amber-950" />
            <div className="hidden md:block w-8 h-42 bg-[#0f766e] rounded-t" />
            <div className="hidden md:block w-10 h-46 bg-[#1e293b] rounded-t" />
            <div className="hidden lg:block w-8 h-38 bg-[#3b0764] rounded-t" />
            <div className="w-7 sm:w-9 h-32 sm:h-44 bg-[#065f46] rounded-t" />
            <div className="w-6 sm:w-8 h-36 sm:h-48 bg-[#701a75] rounded-t" />
          </div>

          {/* ======================================================== */}
          {/* THE 3D BOOK ITSELF */}
          {/* ======================================================== */}
          <motion.div
            style={{
              y: manualMode !== null ? 0 : bookY,
              scale: manualMode !== null ? (manualMode === 0 ? 0.9 : 1) : bookScale,
              rotateX: manualMode !== null ? (manualMode === 0 ? 6 : 0) : bookRotateX,
              rotateY: manualMode !== null ? 0 : bookRotateY,
            }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="relative z-20 w-full max-w-3xl transform-style-preserve-3d"
          >
            {/* ---------------------------------------------------- */}
            {/* VIEW A: CLOSED BOOK IN SHELF (Phase 0) */}
            {/* ---------------------------------------------------- */}
            {effectivePhase === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mx-auto w-64 sm:w-80 h-80 sm:h-96 rounded-2xl bg-gradient-to-br from-[#064e3b] via-[#042f2e] to-[#021d1c] border-4 border-[#84cc16]/70 shadow-[0_25px_50px_rgba(0,0,0,0.9)] p-6 flex flex-col justify-between text-center relative cursor-pointer group hover:scale-105 transition-transform"
                onClick={() => setManualMode(1)}
              >
                {/* Book Spine Ornament */}
                <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-emerald-950/80 to-transparent rounded-r-xl border-l border-emerald-700/30" />
                
                {/* Gold Embossed Frame */}
                <div className="absolute inset-3 border-2 border-amber-400/40 rounded-xl pointer-events-none flex items-center justify-center">
                  <div className="absolute inset-1 border border-amber-400/20 rounded-lg" />
                </div>

                <div className="relative z-10 pt-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-[#073834] border-2 border-[#84cc16]/60 p-2 shadow-lg mb-3 flex items-center justify-center">
                    <img
                      src="/assets/sahne_vajeha_logo.png"
                      alt="لوگو"
                      className="w-full h-full object-contain filter drop-shadow"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-[#a3e635] tracking-widest block mb-1">
                    کتاب یادبود و شناسنامه
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white shimmer-text">
                    صحن واژه‌ها
                  </h3>
                  <p className="text-xs text-[#99f6e4] mt-1">
                    کتابخانه شهید احسان کربلایی‌پور
                  </p>
                </div>

                <div className="relative z-10 pb-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#84cc16] text-[#042f2e] font-black text-xs shadow-md animate-bounce">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>برای گشودن کلیک یا اسکرول کنید</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ---------------------------------------------------- */}
            {/* VIEW B & C: OPEN SPREAD (Phase 1 & Phase 2) */}
            {/* ---------------------------------------------------- */}
            {effectivePhase > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#fefce8] via-[#fffbeb] to-[#fefce8] text-[#1c1917] shadow-[0_30px_70px_rgba(0,0,0,0.85)] border-4 border-amber-950/70 p-4 sm:p-7 md:p-8 transform-style-preserve-3d"
              >
                {/* Center Spine Crease & Gold Ribbon Bookmark */}
                <div className="hidden md:block absolute inset-y-0 left-1/2 w-8 -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-950/20 to-transparent pointer-events-none z-30" />
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 sm:w-6 h-10 bg-gradient-to-b from-[#b48228] to-[#eab308] shadow-md rounded-t-sm z-30 flex items-end justify-center pb-1 border-x border-[#855912]">
                  <div className="w-0 h-0 border-x-[6px] border-x-transparent border-b-[6px] border-b-[#fefce8]" />
                </div>

                {/* Two Pages Layout: Stacked on mobile, side-by-side on md+ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-7 relative z-10">
                  
                  {/* ============================================== */}
                  {/* PAGE 1: ADDRESS, MOSQUE, NESHAN MAP */}
                  {/* ============================================== */}
                  <div
                    className={`text-right flex flex-col justify-between border-b md:border-b-0 md:border-l border-amber-800/25 pb-4 md:pb-0 md:pl-5 transition-all duration-300 ${
                      effectivePhase === 1
                        ? 'ring-2 ring-emerald-500/50 rounded-xl p-2 sm:p-3 bg-emerald-50/40'
                        : 'opacity-85'
                    }`}
                  >
                    <div>
                      {/* Page 1 Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-amber-800/20 mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                          <Compass className="w-3.5 h-3.5 text-emerald-700" />
                          <span>مکان‌یابی و مسیر</span>
                        </div>
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                          برگ اول
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-[#042f2e] mb-2 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>نشانی دقیق و دسترسی</span>
                      </h3>

                      {/* Address Card with Direct Neshan Map Link */}
                      <a
                        href="https://nshn.ir/8brbkMj5IBbN0X"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 sm:p-3.5 rounded-xl bg-amber-50/90 hover:bg-emerald-50/80 border border-amber-700/30 hover:border-emerald-600/50 transition-all shadow-sm group cursor-pointer"
                        title="کلیک برای مسیریابی در نشان"
                      >
                        <p className="text-stone-800 leading-relaxed text-xs font-bold">
                          اهواز، فاز دو پادادشهر، بلوار سعادت، مسجد امام خمینی(ره)، طبقه بالا، کتابخانه شهید احسان کربلایی‌پور
                        </p>
                        
                        <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-700 text-white text-xs font-black shadow group-hover:bg-emerald-800 transition-colors">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>باز کردن در نقشه نشان</span>
                          <ExternalLink className="w-3 h-3 text-emerald-200" />
                        </div>
                      </a>

                      {/* Entrance Notice */}
                      <div className="mt-3 p-2.5 rounded-lg bg-amber-100/70 border border-amber-300/80 text-[11px] text-stone-800 leading-relaxed">
                        <strong className="text-amber-950 font-black block mb-0.5">
                          🚪 نحوه ورود:
                        </strong>
                        از درب اصلی مسجد امام خمینی(ره) وارد شوید؛ ۵ متر جلوتر راه‌پله سمت راست به کتابخانه می‌رسد. زنگ آیفون کتابخانه نیز در سمت راست درب نصب است.
                      </div>
                    </div>

                    {/* Page 1 Bottom Action */}
                    <div className="pt-3 mt-3 border-t border-amber-800/15 flex items-center justify-between text-xs">
                      <span className="text-amber-900 font-bold text-[11px]">پایگاه شهید کربلایی‌پور</span>
                      <button
                        type="button"
                        onClick={() => setManualMode(2)}
                        className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-black hover:underline"
                      >
                        <span>ورق به برگ دوم</span>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* ============================================== */}
                  {/* PAGE 2: OPERATING HOURS & EITAA CHANNEL */}
                  {/* ============================================== */}
                  <div
                    className={`text-right flex flex-col justify-between md:pr-4 transition-all duration-300 ${
                      effectivePhase === 2
                        ? 'ring-2 ring-orange-500/50 rounded-xl p-2 sm:p-3 bg-orange-50/40'
                        : 'opacity-85'
                    }`}
                  >
                    <div>
                      {/* Page 2 Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-amber-800/20 mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>ساعات کاری و ارتباطات</span>
                        </div>
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-amber-400">
                          برگ دوم
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-[#042f2e] mb-2 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>ساعت فعالیت و کانال اطلاع‌رسانی</span>
                      </h3>

                      {/* Live Operating Hours with glowing border around box */}
                      <div className={`p-3.5 rounded-2xl border-2 transition-all shadow-lg ${
                        status.isOpen
                          ? 'bg-[#042f2e]/95 border-[#84cc16] shadow-[0_0_20px_rgba(132,204,22,0.4)]'
                          : 'bg-[#1a0507]/95 border-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.4)]'
                      } mb-3`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white">وضعیت فعلی کتابخانه:</span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black shadow-sm bg-black/40">
                            {/* Colored circle */}
                            <span className={`w-2.5 h-2.5 rounded-full ${status.isOpen ? 'bg-[#84cc16] shadow-[0_0_8px_#84cc16]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`} />
                            <span className={status.isOpen ? 'text-[#a3e635]' : 'text-rose-300'}>{status.statusText}</span>
                          </span>
                        </div>
                        <p className="text-xs font-black text-white">
                          شنبه تا پنجشنبه: ۱۳:۰۰ الی ۲۰:۰۰
                        </p>
                        <p className="text-[11px] text-[#ccfbf1]/80 mt-0.5">
                          جمعه‌ها و تعطیلات رسمی: تعطیل
                        </p>
                      </div>

                      {/* Official Eitaa Channel */}
                      <div className="p-3 rounded-xl bg-orange-50/90 border border-orange-300 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <EitaaIcon size={24} />
                          <div>
                            <strong className="block text-stone-900 font-black text-xs">
                              کانال رسمی ایتا:
                            </strong>
                            <span className="text-[10px] text-stone-600">
                              مسابقات، کتب تازه رسیده و اعلامیه‌ها
                            </span>
                          </div>
                        </div>

                        <a
                          href="https://eitaa.com/shahidKarbalailibrary"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[#EA580C] to-[#f97316] hover:from-[#c2410c] hover:to-[#ea580c] text-white text-xs font-black transition-all shadow-md hover:scale-[1.02]"
                        >
                          <EitaaIcon size={16} />
                          <span>عضویت در کانال ایتا: @shahidKarbalailibrary</span>
                          <ExternalLink className="w-3 h-3 mr-auto" />
                        </a>
                      </div>
                    </div>

                    {/* Page 2 Bottom Action */}
                    <div className="pt-3 mt-3 border-t border-amber-800/15 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => setManualMode(1)}
                        className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-black hover:underline"
                      >
                        <ChevronRight className="w-4 h-4" />
                        <span>برگشت به برگ اول</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualMode(0)}
                        className="text-stone-500 hover:text-stone-800 font-semibold text-[11px]"
                      >
                        بستن کتاب در قفسه
                      </button>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </motion.div>

        </div>

        {/* Stage Bottom Scroll / Step Progress Bar */}
        <div className="w-full max-w-xl mx-auto text-center shrink-0 pb-1 z-30">
          <div className="flex items-center justify-between text-[11px] text-[#99f6e4] font-semibold mb-1 px-2">
            <span className={effectivePhase === 0 ? 'text-[#84cc16] font-bold' : ''}>۱. قفسه</span>
            <span className={effectivePhase === 1 ? 'text-[#84cc16] font-bold' : ''}>۲. برگ اول (نشانی)</span>
            <span className={effectivePhase === 2 ? 'text-[#84cc16] font-bold' : ''}>۳. برگ دوم (ساعات و ایتا)</span>
          </div>

          <div className="w-full h-1.5 bg-[#073834] rounded-full overflow-hidden border border-[#0d9488]/40">
            <div
              className="h-full bg-gradient-to-r from-[#0d9488] via-[#84cc16] to-[#a3e635] transition-all duration-300"
              style={{
                width:
                  manualMode !== null
                    ? `${(manualMode / 2) * 100}%`
                    : `${Math.min(100, Math.max(5, scrollPhase === 0 ? 15 : scrollPhase === 1 ? 55 : 100))}%`,
              }}
            />
          </div>

          <div className="mt-2 text-[10px] text-[#5eead4]/80 flex items-center justify-center gap-1">
            <ArrowDown className="w-3 h-3 text-[#84cc16] animate-bounce" />
            <span>با اسکرول ماوس یا لمس صفحه به سمت پایین، کتاب به ترتیب ورق می‌خورد</span>
          </div>
        </div>

      </div>
    </section>
  );
};
