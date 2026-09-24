import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Layers, Bookmark, CheckCircle2 } from 'lucide-react';
import { toPersianDigits } from '../utils/persian';
import { HomepageCMS } from '../types';

interface StatsSectionProps {
  stats?: {
    totalBooks: number;
    availableBooks: number;
    borrowedBooks: number;
    shelvesCount: number;
    subjectsCount: number;
    membersCount: number;
    visitsCount: number;
  };
  cms?: HomepageCMS;
}

export const StatsSection: React.FC<StatsSectionProps> = ({ stats, cms }) => {
  const targetBooks = stats?.totalBooks || 7000;
  const targetShelves = stats?.shelvesCount || 16;
  const targetSubjects = stats?.subjectsCount || 33;

  const [counts, setCounts] = useState({
    books: 0,
    shelves: 0,
    subjects: 0,
  });

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1800; // ms

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setCounts({
        books: Math.floor(ease * targetBooks),
        shelves: Math.floor(ease * targetShelves),
        subjects: Math.floor(ease * targetSubjects),
      });

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [targetBooks, targetShelves, targetSubjects]);

  const cards = [
    {
      id: 'books-stat',
      title: 'کتاب موجود در کتابخانه',
      value: `+${toPersianDigits(counts.books)}`,
      sub: 'گنجینه‌ای ارزشمند از کتب معارفی، تاریخی، علمی و ادبی',
      icon: BookOpen,
      accent: 'from-[#84cc16] to-[#65a30d]',
      border: 'border-[#84cc16]/50',
      badge: 'مجموعه فعال',
      isPrimary: true,
    },
    {
      id: 'shelves-stat',
      title: 'قفسه تخصصی و استاندارد',
      value: toPersianDigits(counts.shelves),
      sub: `سازمان‌دهی شده در ${toPersianDigits(counts.shelves)} قفسه منظم جهت دسترسی آسان مراجعان`,
      icon: Layers,
      accent: 'from-[#0d9488] to-[#0f766e]',
      border: 'border-[#0d9488]/40',
      badge: 'قفسه‌بندی مدون',
    },
    {
      id: 'subjects-stat',
      title: 'موضوع متنوع و پژوهشی',
      value: toPersianDigits(counts.subjects),
      sub: 'از علوم قرآنی و عقاید تا تاریخ، حقوق، علوم تجربی و کودک',
      icon: Bookmark,
      accent: 'from-[#0284c7] to-[#0369a1]',
      border: 'border-sky-500/40',
      badge: 'موضوع',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-[#073834] relative border-b border-[#0d9488]/30 overflow-hidden">
      {/* Subtle top indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="px-3.5 py-1 rounded-full bg-[#0d9488]/20 border border-[#84cc16]/40 text-[#a3e635] text-xs font-bold inline-block mb-3">
            {cms?.stats_badge || 'آمار زنده کتابخانه'}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white hover-hop">
            {cms?.stats_section_title || (cms as any)?.stats_title || 'آمار و گنجینه کتابخانه شهید کربلایی‌پور'}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#99f6e4] leading-relaxed whitespace-pre-line">
            {cms?.stats_section_subtitle || (cms as any)?.stats_desc || 'کتابخانه ای با هزاران کتاب و موضوعات مختلف،کانونی پویا برای پژوهش،مطالعه و ارتقای بینش نسل جوان'}
          </p>
        </motion.div>

        {/* 3 Cards Grid with Dynamic Staggered Scroll Entrance (Right, Bottom, Left) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            // Direction: card 0 comes from right, card 1 from bottom, card 2 from left
            const initialX = idx === 0 ? 60 : idx === 2 ? -60 : 0;
            const initialY = idx === 1 ? 50 : 25;

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, x: initialX, y: initialY }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.7, delay: idx * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className={`relative rounded-3xl p-6 bg-[#042f2e]/90 border ${card.border} shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group flex flex-col justify-between`}
              >
                {/* Glow background */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#073834] text-[#a3e635] border border-[#0d9488]/40">
                      {card.badge}
                    </span>
                    <div className="p-3 rounded-2xl bg-[#073834] text-white group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 text-[#84cc16]" />
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-baseline gap-1">
                      <span className="hover-hop text-white group-hover:text-[#a3e635] transition-colors" dir="ltr">
                        {card.value}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-extrabold text-[#99f6e4]">
                      {card.title}
                    </h3>
                  </div>
                </div>

                <p className="mt-4 pt-4 border-t border-[#0d9488]/20 text-xs text-[#ccfbf1]/80 leading-relaxed font-normal">
                  {card.sub}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Real-time sync guarantee footnote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex items-center justify-center gap-2 text-xs text-[#5eead4]"
        >
          <CheckCircle2 className="w-4 h-4 text-[#84cc16]" />
          <span>تمام آمار و اطلاعات به صورت برخط از پایگاه داده کتابخانه خوانده می‌شود.</span>
        </motion.div>

      </div>
    </section>
  );
};
