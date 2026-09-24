import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { Layers, ArrowLeft, BookOpen, Bookmark, ChevronRight, ChevronLeft } from 'lucide-react';
import { Book, ShelfItem, HomepageCMS } from '../types';
import { toPersianDigits } from '../utils/persian';
import { getSubjectCoverTheme } from '../utils/bookCoverTheme';

interface ShelvesSectionProps {
  books: Book[];
  onSelectShelf: (shelfNumber: number) => void;
  onSelectBook: (book: Book) => void;
  shelvesConfig?: ShelfItem[];
  cms?: HomepageCMS;
}

export const ShelvesSection: React.FC<ShelvesSectionProps> = ({
  books,
  onSelectShelf,
  onSelectBook,
  shelvesConfig,
  cms,
}) => {
  const [activeShelf, setActiveShelf] = useState<number>(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollShelves = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Dynamic Shelves definition sorted ascending (1, 2, 3...)
  const sortedShelvesConfig = useMemo(() => {
    if (shelvesConfig && shelvesConfig.length > 0) {
      return [...shelvesConfig].sort((a, b) => a.id - b.id);
    }
    return [];
  }, [shelvesConfig]);

  const shelves = useMemo(() => {
    if (sortedShelvesConfig.length > 0) {
      return sortedShelvesConfig.map((s) => s.id);
    }
    return Array.from({ length: 16 }, (_, i) => i + 1);
  }, [sortedShelvesConfig]);

  // If active shelf was deleted or invalid, fallback to first
  const currentShelf = shelves.includes(activeShelf) ? activeShelf : (shelves[0] || 1);

  // Helper to parse row numbers (handles fractional rows like "216/1", "10/4", and simple integers)
  const parseRowNumber = (rowVal: string | number | undefined): number => {
    if (rowVal === undefined || rowVal === null) return 9999;
    const str = String(rowVal).trim().replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
    const match = str.match(/\d+/);
    return match ? parseInt(match[0], 10) : 9999;
  };

  // Filter strictly up to 4 books for the active shelf sorted by row_number ascending
  const shelfBooks = useMemo(() => {
    const fromShelf = books
      .filter((b) => b.shelf === currentShelf)
      .sort((a, b) => {
        const rowDiff = parseRowNumber(a.row_number) - parseRowNumber(b.row_number);
        if (rowDiff !== 0) return rowDiff;
        return (a.title || '').localeCompare(b.title || '', 'fa');
      });

    if (fromShelf.length === 0) {
      return [
        {
          id: `sample-${currentShelf}-1`,
          title: `مجموعه پژوهشی قفسه ${currentShelf}`,
          author: 'پدیدآورندگان منتخب',
          subject: 'علوم اسلامی و معارف',
          shelf: currentShelf,
          row_number: 1,
          description: `کتاب‌های تخصصی و مرجع ثبت‌شده در قفسه شماره ${currentShelf} کتابخانه شهید کربلایی‌پور.`,
          availability_status: 'موجود' as const,
          reservation_allowed: true,
          created_at: '',
          updated_at: '',
        },
      ];
    }
    // Strictly capped at a maximum of 4 books
    return fromShelf.slice(0, 4);
  }, [books, currentShelf]);

  return (
    <section className="py-20 bg-[#042f2e] relative overflow-hidden border-b border-[#0d9488]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with motion */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="px-4 py-1.5 rounded-full bg-[#073834] border border-[#84cc16]/40 text-[#a3e635] text-xs font-black inline-block mb-3">
            {cms?.shelves_badge || 'سازماندهی قفسه‌ها'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white hover-hop">
            <span className="shimmer-text">{cms?.shelves_section_title || cms?.shelves_title || 'کاوش در قفسه‌های کتابخانه'}</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#99f6e4] leading-relaxed whitespace-pre-line">
            {cms?.shelves_section_subtitle || cms?.shelves_desc || 'روی هر قفسه کلیک کنید تا ۴ کتاب نمونه از آن قفسه نمایش داده شود؛ با دکمه «مشاهده همه» می‌توانید تمام عناوین آن قفسه را بررسی فرمایید.'}
          </p>
        </motion.div>

        {/* Shelves Interactive Tabs with Desktop Navigation Arrows */}
        <div className="relative mb-8 group">
          {/* Right Arrow (Desktop) */}
          <button
            type="button"
            onClick={() => scrollShelves('right')}
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#073834] hover:bg-[#0d9488] text-[#84cc16] hover:text-white border border-[#0d9488]/50 shadow-xl items-center justify-center transition-all hover:scale-110 active:scale-95"
            aria-label="قفسه‌های قبلی"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div
            ref={scrollContainerRef}
            className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none no-scrollbar px-1 scroll-smooth"
          >
            {shelves.map((s) => {
              const isSelected = currentShelf === s;
              const countInShelf = books.filter((b) => b.shelf === s).length;
              const shelfObj = shelvesConfig?.find((item) => item.id === s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setActiveShelf(s)}
                  className={`shrink-0 px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 flex flex-col items-center gap-1 select-none hover-hop ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#84cc16] to-[#65a30d] text-[#042f2e] shadow-lg shadow-[#84cc16]/30 border-2 border-white/40 scale-105'
                      : 'bg-[#073834] text-[#ccfbf1] hover:bg-[#0d9488]/30 hover:text-white border border-[#0d9488]/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>قفسه {toPersianDigits(s)}</span>
                  </div>
                  <span className={`text-[10px] ${isSelected ? 'text-[#042f2e]/80 font-extrabold' : 'text-[#5eead4]/70'}`}>
                    {shelfObj ? shelfObj.name : (countInShelf > 0 ? `${toPersianDigits(countInShelf)} عنوان` : 'موجود')}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Left Arrow (Desktop) */}
          <button
            type="button"
            onClick={() => scrollShelves('left')}
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#073834] hover:bg-[#0d9488] text-[#84cc16] hover:text-white border border-[#0d9488]/50 shadow-xl items-center justify-center transition-all hover:scale-110 active:scale-95"
            aria-label="قفسه‌های بعدی"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Shelf Showcase Header & "مشاهده همه" with Golden Aura */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#073834]/80 border border-[#0d9488]/30 mb-8 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0d9488] to-[#042f2e] border border-[#84cc16]/40 flex items-center justify-center text-white font-black text-lg">
              {toPersianDigits(currentShelf)}
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                نمایش نمونه کتاب‌های قفسه {toPersianDigits(currentShelf)} {shelvesConfig?.find(s => s.id === currentShelf)?.name ? `(${shelvesConfig.find(s => s.id === currentShelf)?.name})` : ''}
              </h3>
              <p className="text-xs text-[#99f6e4] mt-0.5">
                چینش منظم بر اساس قفسه و شماره ردیف
              </p>
            </div>
          </div>

          <div className="golden-rotating-border-container p-[2px] rounded-xl shadow-lg">
            <button
              type="button"
              onClick={() => onSelectShelf(currentShelf)}
              className="golden-rotating-border-inner px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0d9488] to-[#0f766e] hover:from-[#14b8a6] hover:to-[#0d9488] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <span>مشاهده همه کتاب‌های قفسه {toPersianDigits(currentShelf)}</span>
              <ArrowLeft className="w-4 h-4 text-[#84cc16]" />
            </button>
          </div>
        </div>

        {/* 4 Books Grid with Staggered Entrance */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          key={currentShelf}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {shelfBooks.map((book, idx) => {
            const isAvailable = book.availability_status === 'موجود';
            const initialX = idx === 0 ? 40 : idx === 3 ? -40 : 0;
            const initialY = (idx === 1 || idx === 2) ? 40 : 20;

            return (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, x: initialX, y: initialY }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.55, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => onSelectBook(book)}
                className="cursor-pointer group relative rounded-3xl bg-[#073834]/90 hover:bg-[#073834] border border-[#0d9488]/40 hover:border-[#84cc16]/60 p-5 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col justify-between"
              >
                {/* Book Cover Visual with 3D Spine and Badge */}
                <div className="relative w-full h-52 rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-[#042f2e] to-[#0f766e] border border-[#0d9488]/30 flex items-center justify-center shadow-inner group-hover:scale-[1.02] transition-transform">
                  {book.cover_image ? (
                    <img
                      src={book.cover_image}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (() => {
                    const theme = getSubjectCoverTheme(book.subject, book.shelf);
                    return (
                      <div className={`w-32 h-44 rounded-r-xl rounded-l-sm bg-gradient-to-tr ${theme.bookGradient} p-3 text-center border-l-4 ${theme.spineBorder} flex flex-col justify-between shadow-2xl relative overflow-hidden select-none`}>
                        <div className={`absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r ${theme.spineHighlight} pointer-events-none`} />
                        <div className="relative z-10">
                          <span className={`text-[10px] font-black tracking-wide ${theme.accentColor} block`}>
                            قفسه {toPersianDigits(book.shelf)}
                          </span>
                          <span className="text-[9px] text-white/70 line-clamp-1 mt-0.5 font-medium">
                            {book.subject}
                          </span>
                        </div>
                        <h4 className="relative z-10 text-xs font-black text-white leading-snug line-clamp-3 drop-shadow-sm my-auto">
                          {book.title}
                        </h4>
                        <div className="relative z-10 pt-1 border-t border-white/20">
                          <span className={`text-[9px] font-bold ${theme.authorColor} line-clamp-1 block`}>
                            {book.author}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Availability Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-md flex items-center gap-1 ${
                        isAvailable
                          ? 'bg-[#84cc16] text-[#042f2e]'
                          : 'bg-amber-500 text-stone-900'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                      <span>{book.availability_status}</span>
                    </span>
                  </div>

                  {/* Shelf and Row Badge (No Book Codes) */}
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/70 text-[#a3e635] text-[10px] font-bold backdrop-blur-sm">
                    قفسه {toPersianDigits(book.shelf)} - ردیف {toPersianDigits(book.row_number)}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-[#84cc16] flex items-center gap-1 mb-1">
                      <Bookmark className="w-3 h-3" />
                      <span>{book.subject}</span>
                    </span>

                    <h4 className="text-base font-extrabold text-white leading-snug group-hover:text-[#a3e635] transition-colors line-clamp-2">
                      {book.title}
                    </h4>

                    <p className="text-xs text-[#99f6e4] mt-1 font-medium line-clamp-1">
                      نویسنده: {book.author}
                    </p>

                    {book.description && (
                      <p className="mt-2 text-xs text-[#ccfbf1]/80 line-clamp-2 leading-relaxed font-normal">
                        {book.description}
                      </p>
                    )}
                  </div>

                  {/* Footer Row */}
                  <div className="mt-4 pt-3 border-t border-[#0d9488]/30 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#5eead4]">
                      ردیف {toPersianDigits(book.row_number)}
                    </span>
                    <span className="text-[#a3e635] font-bold group-hover:underline flex items-center gap-1">
                      <span>مشاهده جزئیات</span>
                      <ArrowLeft className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Global View All Catalog Button at bottom of Shelves with Golden Aura */}
        <div className="mt-12 text-center flex justify-center">
          <div className="golden-rotating-border-container p-[2px] rounded-2xl shadow-xl">
            <button
              type="button"
              onClick={() => onSelectShelf(currentShelf)}
              className="golden-rotating-border-inner inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#84cc16] to-[#65a30d] hover:from-[#a3e635] hover:to-[#84cc16] text-[#042f2e] font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              <BookOpen className="w-4 h-4 text-[#042f2e]" />
              <span>مشاهده همه کتاب‌های قفسه</span>
              <ArrowLeft className="w-4 h-4 text-[#042f2e]" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

