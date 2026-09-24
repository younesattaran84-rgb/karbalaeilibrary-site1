import React from 'react';
import { motion } from 'motion/react';
import {
  BookOpen, Sparkles, Users, HeartHandshake, Calendar,
  Shield, Award, Star, Bookmark, CheckCircle, Trophy, MapPin, Clock
} from 'lucide-react';
import { toPersianDigits } from '../utils/persian';
import { HomepageCMS } from '../types';

interface WhyUsSectionProps {
  cms?: HomepageCMS;
}

const ICON_MAP: Record<string, any> = {
  BookOpen,
  Sparkles,
  Users,
  HeartHandshake,
  Calendar,
  Shield,
  Award,
  Star,
  Bookmark,
  CheckCircle,
  Trophy,
  MapPin,
  Clock,
};

export const WhyUsSection: React.FC<WhyUsSectionProps> = ({ cms }) => {
  const defaultPoints = [
    {
      id: 1,
      title: 'مجموعه‌ای متنوع از کتاب‌ها در حوزه‌های مختلف',
      description: 'دارای +۷۰۰۰ جلد کتاب در موضوعات متنوع معارفی،تاریخی،علمی،ادبی،کودک و نوجوان برای تمام سلیقه‌ها.',
      icon_name: 'BookOpen',
      color: '#0d9488',
      badge: 'تنوع بالا',
    },
    {
      id: 2,
      title: 'فضای مطالعه آرام برای علاقه‌مندان به کتاب و پژوهش',
      description: 'سالن مطالعه آرام، منظم و استاندارد برای مطالعه روزانه، نگارش مقالات، آماده‌سازی آزمون‌ها و تمرکز فکری.',
      icon_name: 'Sparkles',
      color: '#84cc16',
      badge: 'سکوت و تمرکز',
    },
    {
      id: 3,
      title: 'عضویت برای عموم علاقه‌مندان',
      description: 'فراهم‌سازی فضایی پویا برای امانت حضوری و بهره‌مندی تمامی اقشار جامعه از گنجینه ارزشمند کتاب‌ها.',
      icon_name: 'Users',
      color: '#0284c7',
      badge: 'دسترسی همگانی',
    },
    {
      id: 4,
      title: 'آرامش معنوی در کنار عطر مسجد',
      description: 'استقرار در حیاط باصفای مسجد امام خمینی (ره) و آمیختگی دانش و مطالعه با معنویت و اخلاق ناب.',
      icon_name: 'HeartHandshake',
      color: '#eab308',
      badge: 'فضای معنوی',
    },
    {
      id: 5,
      title: 'برنامه‌های فرهنگی در طول سال',
      description: 'برگزاری مسابقات کتابخوانی با جوایز نفیس، نشست‌های نقد کتاب، مشاوره‌های تخصصی مطالعه و برنامه‌های مناسبتی.',
      icon_name: 'Calendar',
      color: '#ec4899',
      badge: 'رویدادهای پویا',
    },
  ];

  const rawList = (cms?.why_us_items && cms.why_us_items.length > 0)
    ? cms.why_us_items
    : (cms?.why_us_cards && cms.why_us_cards.length > 0)
    ? cms.why_us_cards
    : defaultPoints;

  const points = rawList.map((item: any, idx: number) => {
    const iconKey = item.icon_name || Object.keys(ICON_MAP)[idx % 5];
    const IconComponent = ICON_MAP[iconKey] || BookOpen;
    return {
      id: item.id || idx + 1,
      title: item.title,
      description: item.description,
      badge: item.badge || 'ویژگی برتر',
      iconComponent: IconComponent,
      customIconUrl: item.custom_icon_url || item.icon_url,
      color: item.color || '#0d9488',
    };
  });

  return (
    <section className="py-20 bg-[#073834] relative overflow-hidden border-b border-[#0d9488]/30">
      {/* Glow backgrounds */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#0d9488]/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-[#84cc16]/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto mb-10 sm:mb-12"
        >
          <span className="px-4 py-1 rounded-full bg-[#042f2e] border border-[#84cc16]/40 text-[#a3e635] text-xs font-black inline-block mb-3">
            {cms?.why_us_badge || 'امتیازات و ویژگی‌ها'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white hover-hop">
            <span className="shimmer-text">{cms?.why_us_title || 'چرا کتابخانه ما؟'}</span>
          </h2>
          {cms?.why_us_subtitle && (
            <p className="mt-3 text-sm text-[#99f6e4] font-medium whitespace-pre-line">
              {cms.why_us_subtitle}
            </p>
          )}
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {points.map((p: any, idx: number) => {
            const Icon = p.iconComponent;
            const initialX = idx % 3 === 0 ? 55 : idx % 3 === 2 ? -55 : 0;
            const initialY = idx % 3 === 1 ? 50 : 25;
            const cardColor = p.color.startsWith('#') ? p.color : '#84cc16';

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: initialX, y: initialY }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.7, delay: (idx % 3) * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className={`relative rounded-3xl bg-[#042f2e]/90 hover:bg-[#042f2e] border border-[#0d9488]/40 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group flex flex-col justify-between ${
                  idx === 4 ? 'md:col-span-2 lg:col-span-1' : ''
                }`}
                style={{
                  borderTopColor: cardColor,
                  borderTopWidth: '3px',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#073834] border border-[#0d9488]/40"
                      style={{ color: cardColor }}
                    >
                      {p.badge}
                    </span>
                    <div
                      className="p-3 rounded-2xl group-hover:scale-110 transition-transform shadow-md flex items-center justify-center"
                      style={{ backgroundColor: `${cardColor}25` }}
                    >
                      {p.customIconUrl ? (
                        <img src={p.customIconUrl} alt={p.title} className="w-5 h-5 object-contain" />
                      ) : (
                        <Icon className="w-5 h-5" style={{ color: cardColor }} />
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-white leading-snug group-hover:text-[#a3e635] transition-colors mb-3">
                    {p.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#ccfbf1]/85 leading-relaxed font-normal whitespace-pre-line">
                    {p.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#0d9488]/20 flex items-center justify-between text-xs text-[#5eead4]">
                  <span>کتابخانه شهید کربلایی‌پور</span>
                  <span className="font-bold" style={{ color: cardColor }}>
                    ۰{toPersianDigits(idx + 1)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
