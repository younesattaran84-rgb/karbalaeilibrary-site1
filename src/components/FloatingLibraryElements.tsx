import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  BookOpen,
  Feather,
  Bookmark,
  Glasses,
  Scroll,
  Flame,
  Key,
  Star,
  X,
  Quote,
} from 'lucide-react';

interface FloatingElementData {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  quote: string;
  placement: 'hero-right' | 'hero-left' | 'shelves-right' | 'shelves-left' | 'whyus-right' | 'whyus-left' | 'rules-right' | 'rules-left';
  color: string;
  borderColor: string;
  glowColor: string;
  floatClass: string;
}

export const FloatingLibraryElements: React.FC = () => {
  const [activeElementId, setActiveElementId] = useState<string | null>(null);

  const elements: FloatingElementData[] = [
    {
      id: 'open-book',
      name: 'مصحف گشوده حکمت',
      subtitle: 'کتاب‌های معرفتی و تفسیری',
      icon: <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-300" />,
      quote: '«الکُتُبُ بَساتینُ العُلَماءِ» کتاب‌ها بوستان‌های شکوفای اهل دانشند.',
      placement: 'hero-right',
      color: 'from-[#064e3b] to-[#042f2e]',
      borderColor: 'border-emerald-400/60',
      glowColor: 'rgba(52, 211, 153, 0.4)',
      floatClass: 'animate-float-limited',
    },
    {
      id: 'quill-pen',
      name: 'قلم پر و دوات معرفت',
      subtitle: 'نگارش و ثبت اندیشه‌ها',
      icon: <Feather className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300" />,
      quote: 'سوگند به قلم و آنچه می‌نگارند؛ اندیشه‌ای که نوشته نشود، به فراموشی سپرده خواهد شد.',
      placement: 'hero-left',
      color: 'from-[#78350f] to-[#451a03]',
      borderColor: 'border-amber-400/60',
      glowColor: 'rgba(251, 191, 36, 0.4)',
      floatClass: 'animate-float-limited-alt',
    },
    {
      id: 'golden-bookmark',
      name: 'نشان‌کتاب زرین',
      subtitle: 'نشانه‌گذاری صفحات تدبر',
      icon: <Bookmark className="w-6 h-6 sm:w-7 sm:h-7 text-lime-300" />,
      quote: 'هر کتابی که ورق می‌خورد و نشان می‌نشیند، چراغی در دل اندیشه می‌افروزد.',
      placement: 'shelves-right',
      color: 'from-[#14532d] to-[#064e3b]',
      borderColor: 'border-lime-400/60',
      glowColor: 'rgba(163, 230, 53, 0.4)',
      floatClass: 'animate-float-limited-alt',
    },
    {
      id: 'reading-glasses',
      name: 'عینک ژرف‌نگری',
      subtitle: 'دقت در مبانی و معارف',
      icon: <Glasses className="w-6 h-6 sm:w-7 sm:h-7 text-teal-300" />,
      quote: 'مطالعه ژرف و باریک‌بینی، چشمان انسان را به حقایق نهان جهان روشن می‌سازد.',
      placement: 'shelves-left',
      color: 'from-[#0f766e] to-[#042f2e]',
      borderColor: 'border-teal-400/60',
      glowColor: 'rgba(45, 212, 191, 0.4)',
      floatClass: 'animate-float-limited',
    },
    {
      id: 'ancient-scroll',
      name: 'طومار کهن حکمت',
      subtitle: 'میراث فکری و ادبی',
      icon: <Scroll className="w-6 h-6 sm:w-7 sm:h-7 text-amber-200" />,
      quote: 'دانش گنجینه‌ای بی‌پایان است که با آموختن افزون‌تر و پایدارتر می‌شود.',
      placement: 'whyus-right',
      color: 'from-[#78350f] to-[#291305]',
      borderColor: 'border-amber-500/60',
      glowColor: 'rgba(245, 158, 11, 0.4)',
      floatClass: 'animate-float-limited',
    },
    {
      id: 'lantern-light',
      name: 'فانوس شبستان اندیشه',
      subtitle: 'روشنای دانایی در دل شب',
      icon: <Flame className="w-6 h-6 sm:w-7 sm:h-7 text-orange-300" />,
      quote: 'روشنایی کتاب در تیرگی‌ها راه را می‌نماید و هدایتگر گام‌های جستجوگر است.',
      placement: 'whyus-left',
      color: 'from-[#9a3412] to-[#431407]',
      borderColor: 'border-orange-400/60',
      glowColor: 'rgba(249, 115, 22, 0.4)',
      floatClass: 'animate-float-limited-alt',
    },
    {
      id: 'treasure-key',
      name: 'کلید گنجینه مخزن',
      subtitle: 'گشایش درهای معرفت',
      icon: <Key className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-300" />,
      quote: 'پرسشگری نیکو، نیمی از دانایی است و کلید دستیابی به ژرفای حقایق.',
      placement: 'rules-right',
      color: 'from-[#854d0e] to-[#422006]',
      borderColor: 'border-yellow-400/60',
      glowColor: 'rgba(234, 179, 8, 0.4)',
      floatClass: 'animate-float-limited',
    },
    {
      id: 'martyr-star',
      name: 'لوح فرزانگی و شهادت',
      subtitle: 'یادبود شهید احسان کربلایی‌پور',
      icon: <Star className="w-6 h-6 sm:w-7 sm:h-7 text-rose-300 fill-rose-300/30" />,
      quote: '«مداد العلماء افضل من دماء الشهداء»؛ آمیختگی مداد دانش با خون شهید جاودانگی می‌آفریند.',
      placement: 'rules-left',
      color: 'from-[#881337] to-[#4c0519]',
      borderColor: 'border-rose-400/60',
      glowColor: 'rgba(244, 63, 94, 0.4)',
      floatClass: 'animate-float-limited-alt',
    },
  ];

  // Helper to render an individual interactive floating badge
  const renderFloatingBadge = (item: FloatingElementData) => {
    const isExpanded = activeElementId === item.id;

    return (
      <div key={item.id} className="relative z-30 select-none">
        <motion.div
          drag
          dragConstraints={{ left: -30, right: 30, top: -30, bottom: 30 }}
          dragElastic={0.2}
          whileHover={{ scale: 1.1, rotate: 4 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setActiveElementId(isExpanded ? null : item.id)}
          className={`cursor-grab active:cursor-grabbing p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br ${item.color} border-2 ${item.borderColor} shadow-xl hover:shadow-2xl transition-shadow flex items-center gap-2.5 backdrop-blur-md ${item.floatClass}`}
          style={{
            boxShadow: `0 8px 24px -4px ${item.glowColor}`,
          }}
          title={`${item.name} (کلیک برای نمایش حکمت و جابه‌جایی با کشیدن)`}
        >
          <div className="shrink-0">{item.icon}</div>
          <div className="hidden xl:block text-right">
            <span className="block text-xs font-black text-white leading-tight">
              {item.name}
            </span>
            <span className="block text-[10px] text-[#99f6e4] opacity-80 leading-tight">
              {item.subtitle}
            </span>
          </div>
          <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-[#84cc16] animate-ping" />
        </motion.div>

        {/* Popover Quote Card when clicked */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 10 }}
              className="absolute z-50 w-72 sm:w-80 top-full mt-3 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 p-4 rounded-2xl bg-[#042f2e]/95 border-2 border-[#84cc16]/70 shadow-2xl backdrop-blur-lg text-right"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#0d9488]/40 mb-2">
                <div className="flex items-center gap-2">
                  <Quote className="w-4 h-4 text-[#84cc16]" />
                  <span className="text-xs font-black text-white">{item.name}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveElementId(null);
                  }}
                  className="p-1 rounded-lg bg-[#073834] text-[#99f6e4] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs leading-relaxed text-[#ccfbf1] font-medium my-2">
                {item.quote}
              </p>

              <div className="pt-2 border-t border-[#0d9488]/20 flex items-center justify-between text-[10px] text-[#a3e635]">
                <span>گنجینه معارف کتابخانه</span>
                <span className="text-[#99f6e4]/70">می‌توانید المان را بکشید و جابه‌جا کنید</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      {/* ========================================================= */}
      {/* Scattered Placement 1: HERO SECTION FLANKS */}
      {/* ========================================================= */}
      <div className="pointer-events-none absolute top-28 right-4 sm:right-8 z-30 hidden md:block">
        <div className="pointer-events-auto">
          {renderFloatingBadge(elements[0])} {/* مصحف گشوده */}
        </div>
      </div>
      <div className="pointer-events-none absolute top-36 left-4 sm:left-8 z-30 hidden md:block">
        <div className="pointer-events-auto">
          {renderFloatingBadge(elements[1])} {/* قلم پر و دوات */}
        </div>
      </div>

      {/* ========================================================= */}
      {/* Scattered Placement 2: SHELVES SECTION FLANKS */}
      {/* ========================================================= */}
      <div className="pointer-events-none absolute top-[38%] right-3 sm:right-6 z-30 hidden lg:block">
        <div className="pointer-events-auto">
          {renderFloatingBadge(elements[2])} {/* نشان‌کتاب زرین */}
        </div>
      </div>
      <div className="pointer-events-none absolute top-[44%] left-3 sm:left-6 z-30 hidden lg:block">
        <div className="pointer-events-auto">
          {renderFloatingBadge(elements[3])} {/* عینک ژرف‌نگری */}
        </div>
      </div>

      {/* ========================================================= */}
      {/* Scattered Placement 3: WHY US SECTION FLANKS */}
      {/* ========================================================= */}
      <div className="pointer-events-none absolute top-[62%] right-4 sm:right-8 z-30 hidden lg:block">
        <div className="pointer-events-auto">
          {renderFloatingBadge(elements[4])} {/* طومار کهن */}
        </div>
      </div>
      <div className="pointer-events-none absolute top-[68%] left-4 sm:left-8 z-30 hidden lg:block">
        <div className="pointer-events-auto">
          {renderFloatingBadge(elements[5])} {/* فانوس شبستان */}
        </div>
      </div>

      {/* ========================================================= */}
      {/* Scattered Placement 4: RULES / FAQ SECTION FLANKS */}
      {/* ========================================================= */}
      <div className="pointer-events-none absolute top-[85%] right-4 sm:right-8 z-30 hidden lg:block">
        <div className="pointer-events-auto">
          {renderFloatingBadge(elements[6])} {/* کلید مخزن */}
        </div>
      </div>
      <div className="pointer-events-none absolute top-[90%] left-4 sm:left-8 z-30 hidden lg:block">
        <div className="pointer-events-auto">
          {renderFloatingBadge(elements[7])} {/* لوح شهادت */}
        </div>
      </div>

      {/* ========================================================= */}
      {/* Mobile Horizontal Carousel Ribbon (for small screens < 1024px) */}
      {/* Allows mobile users to enjoy all 8 elements without screen overlap */}
      {/* ========================================================= */}
      <div className="lg:hidden w-full px-4 py-6 border-b border-[#0d9488]/30 bg-[#021817]/60">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#84cc16]" />
          <span className="text-xs font-black text-white">نمادهای معلق اهل قلم و کتابخانه</span>
          <span className="text-[10px] text-[#99f6e4] mr-auto">(لمس کنید یا جابه‌جا کنید)</span>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-3 scrollbar-none no-scrollbar">
          {elements.map((item) => (
            <div key={item.id} className="shrink-0">
              {renderFloatingBadge(item)}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
