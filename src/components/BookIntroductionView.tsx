import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Bookmark, BookOpen, ArrowLeft, CheckCircle, X, BookHeart, Compass, Quote } from 'lucide-react';
import { Book } from '../types';
import { toPersianDigits } from '../utils/persian';

interface BookIntroductionViewProps {
  featuredBooks: Book[];
  onSelectBook: (book: Book) => void;
  onExploreAll: () => void;
}

export const BookIntroductionView: React.FC<BookIntroductionViewProps> = ({
  featuredBooks,
  onSelectBook,
  onExploreAll,
}) => {
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<Book | null>(null);

  return (
    <div className="py-16 bg-[#042f2e] min-h-screen text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="px-4 py-1.5 rounded-full bg-[#073834] border border-[#84cc16]/40 text-[#a3e635] text-xs font-black inline-block mb-3">
            گزیده ویژه کتابدار
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white hover-hop">
            معرفی کتاب‌های برگزیده کتابخانه
          </h1>
          <p className="mt-4 text-sm sm:text-base text-[#99f6e4] leading-relaxed">
            منتخبی از پربارترین آثار در حوزه‌های سیر و سلوک، تاریخ مقاومت و اندیشه اسلامی که مطالعه آن‌ها افق‌های نوینی پیش روی ذهن می‌گشاید. روی هر کتاب کلیک کنید تا مشخصات کامل و بخش داستانی آن را بخوانید.
          </p>
        </motion.div>

        {/* Featured Books Showcase or Empty State */}
        {featuredBooks.length === 0 ? (
          <div className="py-24 text-center max-w-lg mx-auto space-y-4 bg-[#073834]/80 border-2 border-dashed border-[#0d9488]/40 rounded-3xl p-8 shadow-2xl">
            <div className="w-20 h-20 rounded-3xl bg-[#042f2e] border border-[#0d9488]/50 text-[#84cc16] flex items-center justify-center mx-auto shadow-2xl">
              <BookOpen className="w-10 h-10 opacity-70" />
            </div>
            <h3 className="text-2xl font-black text-white">کتابی برای معرفی تعریف نشده است</h3>
            <p className="text-xs sm:text-sm text-[#ccfbf1]/80 leading-relaxed">
              در حال حاضر هیچ کتابی در بخش معرفی ویژه قرار نگرفته است. می‌توانید کاتالوگ جامع کتاب‌های کتابخانه را مشاهده و جستجو فرمایید.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onExploreAll}
                className="px-6 py-2.5 rounded-xl bg-[#84cc16] hover:bg-[#a3e635] text-[#042f2e] font-black text-xs inline-flex items-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>مشاهده کاتالوگ تمام کتاب‌ها</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredBooks.map((book, idx) => {
              return (
                <motion.div
                  key={book.id || idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="golden-rotating-border-container p-[2px] rounded-3xl shadow-2xl"
                >
                  <div
                    onClick={() => setSelectedBookForDetails(book)}
                    className="golden-rotating-border-inner relative rounded-3xl bg-gradient-to-br from-[#073834] to-[#042f2e] p-6 sm:p-8 transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group cursor-pointer h-full"
                  >
                  {/* Ribbon Tag */}
                  <div className="absolute top-5 left-5">
                    <span className="px-3 py-1 rounded-full bg-[#84cc16] text-[#042f2e] text-xs font-black shadow-md flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>کتاب معرفی شماره {toPersianDigits(idx + 1)}</span>
                    </span>
                  </div>

                <div>
                  <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                    {/* Cover Art */}
                    <div className="w-40 h-56 sm:w-44 sm:h-64 rounded-2xl overflow-hidden bg-[#031d1c] border-2 border-[#0d9488]/50 shadow-xl shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform mx-auto sm:mx-0">
                      {book.cover_image ? (
                        <img
                          src={book.cover_image}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-[#064e3b] via-[#0f766e] to-[#047857] p-4 text-center flex flex-col justify-between">
                          <span className="text-[10px] text-[#a3e635]">کتابخانه شهید کربلایی‌پور</span>
                          <h4 className="text-sm font-black text-white leading-snug line-clamp-3">
                            {book.title}
                          </h4>
                          <span className="text-[11px] text-[#99f6e4]">{book.author}</span>
                        </div>
                      )}
                    </div>

                    {/* Book Text */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#84cc16] bg-[#042f2e] px-2.5 py-0.5 rounded-full border border-[#0d9488]/40">
                          {book.subject}
                        </span>
                        <span className="text-xs text-[#5eead4]">
                          قفسه {toPersianDigits(book.shelf)} - ردیف {toPersianDigits(book.row_number)}
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black text-white leading-snug group-hover:text-[#a3e635] transition-colors">
                        {book.title}
                      </h2>

                      <p className="text-xs sm:text-sm text-[#99f6e4] font-medium">
                        نویسنده: <strong className="text-white">{book.author}</strong>
                      </p>

                      {/* Excerpt / Description */}
                      <div className="p-3.5 rounded-2xl bg-[#042f2e]/70 border border-[#0d9488]/30">
                        <h4 className="text-[11px] font-bold text-[#a3e635] mb-1 flex items-center gap-1.5">
                          <Quote className="w-3 h-3" />
                          <span>گزیده‌ای از اثر:</span>
                        </h4>
                        <p className="text-xs text-[#ccfbf1]/90 leading-relaxed text-justify line-clamp-3">
                          {book.description}
                        </p>
                      </div>

                      {/* Fiction / Story Section */}
                      <div className="p-3.5 rounded-2xl bg-[#073834] border border-[#84cc16]/40 shadow-inner">
                        <h4 className="text-[11px] font-bold text-[#a3e635] mb-1 flex items-center gap-1.5">
                          <BookHeart className="w-3.5 h-3.5 text-[#84cc16]" />
                          <span>بخش داستانی و روایت اثر:</span>
                        </h4>
                        <p className="text-xs text-[#99f6e4] leading-relaxed text-justify line-clamp-3">
                          {book.story || book.excerpt || 'برشی داستانی و دلنشین از این اثر ماندگار در دسترس است. برای مطالعه بخش کامل داستانی کلیک نمایید.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer and CTA */}
                <div className="mt-6 pt-5 border-t border-[#0d9488]/30 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-[#5eead4]">
                    <span>کد ثبت در کتابخانه: </span>
                    <strong className="text-[#a3e635] font-bold">{toPersianDigits(book.book_number)}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBookForDetails(book);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#042f2e] hover:bg-[#073834] border border-[#84cc16]/60 text-[#a3e635] font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <BookHeart className="w-3.5 h-3.5" />
                      <span>مشاهده اطلاعات و داستان</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBook(book);
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#84cc16] to-[#65a30d] hover:from-[#a3e635] hover:to-[#84cc16] text-[#042f2e] font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all transform hover:-translate-y-0.5"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>مشاهده کتاب / امانت</span>
                    </button>
                  </div>
                </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        )}

        {/* Explore all books CTA with Golden Aura */}
        <div className="mt-16 text-center flex justify-center">
          <div className="golden-rotating-border-container p-[2px] rounded-2xl shadow-xl">
            <button
              type="button"
              onClick={onExploreAll}
              className="golden-rotating-border-inner px-8 py-4 rounded-2xl bg-gradient-to-r from-[#073834] to-[#042f2e] hover:from-[#0d9488]/40 hover:to-[#073834] text-white font-extrabold text-sm sm:text-base flex items-center gap-3 transition-all shadow-lg active:scale-95"
            >
              <span>مشاهده و جستجو در تمام فهرست ۷۰۰۰ جلدی</span>
              <ArrowLeft className="w-5 h-5 text-[#84cc16]" />
            </button>
          </div>
        </div>

      </div>

      {/* Book Details and Story Modal */}
      {selectedBookForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-3xl bg-[#042f2e] border-2 border-[#84cc16]/60 rounded-3xl shadow-2xl p-6 sm:p-8 text-right overflow-y-auto max-h-[90vh]">
            
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedBookForDetails(null)}
              className="absolute top-5 left-5 p-2 rounded-xl bg-[#073834] text-[#a3e635] hover:bg-rose-950 hover:text-rose-400 transition-colors"
              title="بستن پنجره"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Content */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              
              {/* Cover */}
              <div className="w-full sm:w-52 shrink-0 flex flex-col items-center">
                <div className="w-44 sm:w-52 h-64 rounded-2xl overflow-hidden bg-[#073834] border-2 border-[#0d9488]/50 shadow-xl flex items-center justify-center">
                  {selectedBookForDetails.cover_image ? (
                    <img
                      src={selectedBookForDetails.cover_image}
                      alt={selectedBookForDetails.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-[#064e3b] to-[#0f766e] p-4 text-center flex flex-col justify-between">
                      <span className="text-xs text-[#a3e635]">کتابخانه شهید کربلایی‌پور</span>
                      <h4 className="text-sm font-bold text-white leading-snug">
                        {selectedBookForDetails.title}
                      </h4>
                      <span className="text-xs text-[#99f6e4]">{selectedBookForDetails.author}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 w-full">
                  <span
                    className={`block w-full text-center py-2 px-3 rounded-xl text-xs font-bold shadow-md ${
                      selectedBookForDetails.availability_status === 'موجود'
                        ? 'bg-[#84cc16] text-[#042f2e]'
                        : 'bg-amber-500 text-stone-900'
                    }`}
                  >
                    وضعیت: {selectedBookForDetails.availability_status}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <span className="text-xs font-bold text-[#84cc16] bg-[#073834] px-3 py-1 rounded-full border border-[#0d9488]/40 inline-block mb-2">
                    {selectedBookForDetails.subject}
                  </span>
                  <h2 className="text-2xl font-black text-white leading-snug">
                    {selectedBookForDetails.title}
                  </h2>
                  <p className="text-sm text-[#99f6e4] font-medium mt-1">
                    نویسنده: <strong className="text-white">{selectedBookForDetails.author}</strong>
                  </p>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-[#073834]/90 p-4 rounded-2xl border border-[#0d9488]/40">
                  <div>
                    <span className="text-[#99f6e4] block">ناشر:</span>
                    <strong className="text-white font-bold">{selectedBookForDetails.publisher || 'نامشخص'}</strong>
                  </div>
                  <div>
                    <span className="text-[#99f6e4] block">شماره ثبت کتاب:</span>
                    <strong className="text-[#84cc16] font-bold">{toPersianDigits(selectedBookForDetails.book_number)}</strong>
                  </div>
                  <div>
                    <span className="text-[#99f6e4] block">قفسه اختصاصی:</span>
                    <strong className="text-white font-bold">قفسه شماره {toPersianDigits(selectedBookForDetails.shelf)}</strong>
                  </div>
                  <div>
                    <span className="text-[#99f6e4] block">شماره ردیف:</span>
                    <strong className="text-white font-bold">ردیف {toPersianDigits(selectedBookForDetails.row_number)}</strong>
                  </div>
                </div>

                {/* Summary / Description */}
                <div className="p-4 rounded-2xl bg-[#073834]/60 border border-[#0d9488]/30">
                  <h3 className="text-xs font-bold text-[#a3e635] mb-1.5 flex items-center gap-1.5">
                    <Quote className="w-3.5 h-3.5" />
                    <span>توضیحات و خلاصه کتاب:</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-[#ccfbf1] leading-relaxed text-justify">
                    {selectedBookForDetails.description}
                  </p>
                </div>

                {/* Story Section */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#073834] to-[#084c46] border-2 border-[#84cc16]/50 shadow-lg">
                  <h3 className="text-sm font-black text-[#a3e635] mb-2 flex items-center gap-2">
                    <BookHeart className="w-4 h-4 text-[#84cc16]" />
                    <span>بخش داستانی و برش روایی از کتاب:</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-white leading-relaxed text-justify">
                    {selectedBookForDetails.story || selectedBookForDetails.excerpt || 'این کتاب شامل بخش‌های روایی و الهام‌بخش عمیقی است که در نسخه چاپی کتابخانه در دسترس است.'}
                  </p>
                </div>

                {/* Modal Footer CTA */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const book = selectedBookForDetails;
                      setSelectedBookForDetails(null);
                      onSelectBook(book);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#84cc16] to-[#65a30d] text-[#042f2e] font-black text-xs hover:from-[#a3e635] hover:to-[#84cc16] flex items-center gap-2 shadow-lg"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>مشاهده کتاب / رزرو امانت</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
