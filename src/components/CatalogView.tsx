import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Layers, Bookmark, CheckCircle, BookOpen, AlertCircle, X, Hash } from 'lucide-react';
import { Book, UserProfile, ShelfItem } from '../types';
import { toPersianDigits } from '../utils/persian';
import { getSubjectCoverTheme } from '../utils/bookCoverTheme';
import { SUBJECTS_LIST, INITIAL_SHELVES_CONFIG } from '../data/initialData';
import { PaginationControls } from './PaginationControls';

interface CatalogViewProps {
  books: Book[];
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onReserveBook: (book: Book) => Promise<{ success: boolean; message?: string } | boolean>;
  initialShelfFilter?: number;
  shelvesConfig?: ShelfItem[];
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  books,
  currentUser,
  onOpenAuth,
  onReserveBook,
  initialShelfFilter,
  shelvesConfig = INITIAL_SHELVES_CONFIG,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [rowQuery, setRowQuery] = useState('');
  const [selectedShelf, setSelectedShelf] = useState<string>(
    initialShelfFilter ? initialShelfFilter.toString() : 'all'
  );
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<Book | null>(null);
  const [reserving, setReserving] = useState(false);
  const [reservationMessage, setReservationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pagination state (10 to 50 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Normalized fuzzy subject matcher (handles Persian spaces, half-spaces, honorifics, and Shelf 2 Imams)
  const normalizeSubjectForMatch = (text: string): string => {
    return (text || '')
      .replace(/[\u200c\u200b\r\n\t]/g, ' ')
      .replace(/[،,]/g, ' ')
      .replace(/[\(\)\[\]]/g, '')
      .replace(/علیه\s*السلام/g, 'ع')
      .replace(/سلام\s*الله\s*علیها/g, 'س')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const isSubjectMatching = (bookSubject: string, filterSubject: string): boolean => {
    if (filterSubject === 'all') return true;
    if (bookSubject === filterSubject) return true;
    const bNorm = normalizeSubjectForMatch(bookSubject);
    const fNorm = normalizeSubjectForMatch(filterSubject);
    if (bNorm === fNorm) return true;
    if (bNorm.includes(fNorm) || fNorm.includes(bNorm)) return true;

    // Resilient compound subject matching for Shelf 2
    const isShelf2Compound = (s: string) =>
      s.includes('امام حسن') && (s.includes('امام صادق') || s.includes('امام باقر') || s.includes('معصومه') || s.includes('سجاد'));
    if (isShelf2Compound(bNorm) && isShelf2Compound(fNorm)) return true;

    return false;
  };

  // Helper to parse row number (handles integers, decimals, slashes like "216/1", "10/4")
  const parseRowNumber = (rowVal: string | number | undefined): number => {
    if (rowVal === undefined || rowVal === null) return 9999;
    const str = String(rowVal).trim().replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
    const match = str.match(/\d+/);
    return match ? parseInt(match[0], 10) : 9999;
  };

  // Sorted shelves config (1, 2, 3...)
  const sortedShelvesConfig = useMemo(() => {
    return [...shelvesConfig].sort((a, b) => a.id - b.id);
  }, [shelvesConfig]);

  // Calculate dynamic subjects list based on selected shelf (strictly deduplicated)
  const availableSubjects = useMemo(() => {
    const normalizeSub = (s: string) => (s || '').trim().replace(/\s+/g, ' ').replace(/\s*([،,])\s*/g, '$1');
    const seen = new Map<string, string>();
    const addSub = (raw: string) => {
      if (!raw) return;
      const key = normalizeSub(raw);
      if (!seen.has(key)) {
        seen.set(key, raw.trim().replace(/امام کاظم\(ع\) /g, 'امام کاظم(ع)'));
      }
    };

    if (selectedShelf === 'all') {
      sortedShelvesConfig.forEach((s) => s.subjects.forEach(addSub));
      SUBJECTS_LIST.forEach(addSub);
      return Array.from(seen.values());
    }
    const targetShelf = sortedShelvesConfig.find((s) => s.id.toString() === selectedShelf);
    if (targetShelf && targetShelf.subjects.length > 0) {
      targetShelf.subjects.forEach(addSub);
      return Array.from(seen.values());
    }
    books.filter((b) => b.shelf.toString() === selectedShelf).forEach((b) => addSub(b.subject));
    return Array.from(seen.values());
  }, [selectedShelf, sortedShelvesConfig, books]);

  // If selected subject is not in available subjects, reset to all
  useEffect(() => {
    if (selectedSubject !== 'all' && !availableSubjects.some((sub) => isSubjectMatching(sub, selectedSubject))) {
      setSelectedSubject('all');
    }
  }, [selectedShelf, availableSubjects, selectedSubject]);

  // Filter and sort books systematically: Shelf asc -> Subject -> Row asc -> Title
  const filteredBooks = useMemo(() => {
    const list = books.filter((b) => {
      const matchSearch =
        !searchQuery ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.publisher && b.publisher.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchShelf = selectedShelf === 'all' || b.shelf.toString() === selectedShelf;

      // Fractional/decimal row query matching (e.g. "216/1", "10/4", "3")
      const cleanRowQuery = rowQuery.trim().replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
      const bookRowStr = String(b.row_number || '').trim().replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
      const matchRow =
        !cleanRowQuery ||
        bookRowStr === cleanRowQuery ||
        bookRowStr.includes(cleanRowQuery);

      const matchSubject = isSubjectMatching(b.subject, selectedSubject);
      const matchAvailability =
        selectedAvailability === 'all' ||
        (selectedAvailability === 'موجود' && b.availability_status === 'موجود') ||
        (selectedAvailability === 'امانت' && (b.availability_status === 'امانت' || b.availability_status === 'امانت داده شده'));

      return matchSearch && matchShelf && matchRow && matchSubject && matchAvailability;
    });

    return list.sort((a, b) => {
      // 1. By shelf ascending (1, 2, 3...)
      if (a.shelf !== b.shelf) return a.shelf - b.shelf;
      // 2. By subject priority
      const subDiff = (a.subject || '').localeCompare(b.subject || '', 'fa');
      if (subDiff !== 0) return subDiff;
      // 3. By row number ascending (1, 2, 3...)
      const rowDiff = parseRowNumber(a.row_number) - parseRowNumber(b.row_number);
      if (rowDiff !== 0) return rowDiff;
      // 4. By title
      return (a.title || '').localeCompare(b.title || '', 'fa');
    });
  }, [books, searchQuery, rowQuery, selectedShelf, selectedSubject, selectedAvailability]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, rowQuery, selectedShelf, selectedSubject, selectedAvailability]);

  // Paginated slice
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBooks.slice(start, start + pageSize);
  }, [filteredBooks, currentPage, pageSize]);

  const handleReserve = async (book: Book) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setReserving(true);
    setReservationMessage(null);
    try {
      const result = await onReserveBook(book);
      if (typeof result === 'object' && result !== null) {
        if (result.success) {
          setReservationMessage({
            type: 'success',
            text: result.message || 'درخواست رزرو شما برای ادمین ارسال شد. برای نهایی کردن رزرو، به کتابخانه مراجعه فرمایید.',
          });
        } else {
          setReservationMessage({
            type: 'error',
            text: result.message || 'ظرفیت رزرو همزمان شما تکمیل شده است. هر عضو حداکثر می‌تواند ۴ کتاب رزرو فعال داشته باشد.',
          });
        }
      } else if (result === true) {
        setReservationMessage({
          type: 'success',
          text: 'درخواست رزرو شما برای ادمین ارسال شد. برای نهایی کردن رزرو، به کتابخانه مراجعه فرمایید.',
        });
      } else {
        setReservationMessage({
          type: 'error',
          text: 'ظرفیت رزرو همزمان شما تکمیل شده است. هر عضو حداکثر می‌تواند ۴ کتاب رزرو فعال داشته باشد.',
        });
      }
    } catch (err: any) {
      setReservationMessage({
        type: 'error',
        text: err?.message || 'ظرفیت رزرو همزمان شما تکمیل شده است. هر عضو حداکثر می‌تواند ۴ کتاب رزرو فعال داشته باشد.',
      });
    } finally {
      setReserving(false);
    }
  };

  return (
    <div className="py-12 bg-[#042f2e] min-h-screen text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header - Strictly 'همه کتاب‌ها' */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-[#0d9488]/30"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white hover-hop">
              همه کتاب‌ها
            </h1>
            <p className="mt-2 text-sm text-[#99f6e4]">
              جستجو و رزرو میان بیش از هفت هزار جلد کتاب در قفسه‌های تخصصی
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-[#073834] border border-[#0d9488]/40 text-xs">
              <span className="text-[#99f6e4]">تعداد نتایج: </span>
              <strong className="text-[#84cc16] font-bold text-sm">
                {toPersianDigits(filteredBooks.length)} عنوان
              </strong>
            </div>

            {currentUser && (
              <div className="px-4 py-2.5 rounded-2xl bg-[#0d9488]/20 border border-[#84cc16]/40 text-xs text-[#a3e635] font-bold">
                رزروهای فعال شما: {toPersianDigits(currentUser.active_reservations_count || 0)} از ۴
              </div>
            )}
          </div>
        </motion.div>

        {/* Filter Controls Bar */}
        <div className="mt-8 p-6 rounded-3xl bg-[#073834]/80 border border-[#0d9488]/40 shadow-xl backdrop-blur-sm space-y-4">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-5 h-5 text-[#84cc16] absolute right-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو با نام کتاب، نویسنده یا ناشر..."
              className="w-full pr-12 pl-4 py-3.5 rounded-2xl bg-[#042f2e] border border-[#0d9488]/40 text-white placeholder-[#99f6e4]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#84cc16]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-[#99f6e4] hover:text-white"
              >
                پاک کردن
              </button>
            )}
          </div>

          {/* Filters Row: Shelf, Row (Manual Input), Subject, Availability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Shelf Filter */}
            <div>
              <label className="block text-xs font-bold text-[#99f6e4] mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#84cc16]" />
                فیلتر قفسه:
              </label>
              <select
                value={selectedShelf}
                onChange={(e) => setSelectedShelf(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#84cc16]"
              >
                <option value="all">همه قفسه‌ها</option>
                {sortedShelvesConfig.map((s) => (
                  <option key={s.id} value={s.id.toString()}>
                    قفسه شماره {toPersianDigits(s.id)} ({s.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Shelf Row Filter - Manual Input (supports decimals/slashes e.g. 216/1, 10/4) */}
            <div>
              <label className="block text-xs font-bold text-[#99f6e4] mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#84cc16]" />
                شماره ردیف:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={rowQuery}
                  onChange={(e) => setRowQuery(e.target.value)}
                  placeholder="شماره ردیف (مثلاً ۲۱۶/۱ یا ۱۰/۴ یا ۲)..."
                  className="w-full pr-3 pl-8 py-2.5 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white placeholder-[#99f6e4]/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#84cc16]"
                />
                {rowQuery && (
                  <button
                    type="button"
                    onClick={() => setRowQuery('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#99f6e4] hover:text-white"
                    title="پاک کردن ردیف"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Subject Filter - Dynamically filtered based on selected shelf */}
            <div>
              <label className="block text-xs font-bold text-[#99f6e4] mb-1.5 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-[#84cc16]" />
                موضوع:
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#84cc16]"
              >
                <option value="all">
                  {selectedShelf === 'all'
                    ? `همه موضوعات (${toPersianDigits(availableSubjects.length)} موضوع)`
                    : `همه موضوعات این قفسه (${toPersianDigits(availableSubjects.length)} موضوع)`}
                </option>
                {availableSubjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability Filter */}
            <div>
              <label className="block text-xs font-bold text-[#99f6e4] mb-1.5 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#84cc16]" />
                وضعیت موجودی:
              </label>
              <select
                value={selectedAvailability}
                onChange={(e) => setSelectedAvailability(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#84cc16]"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="موجود">موجود</option>
                <option value="امانت">امانت داده شده</option>
              </select>
            </div>

          </div>

        </div>

        {/* Books Results Grid */}
        <div className="mt-8">
          {filteredBooks.length === 0 ? (
            <div className="text-center py-20 bg-[#073834]/40 rounded-3xl border border-[#0d9488]/30 p-8">
              <BookOpen className="w-16 h-16 text-[#99f6e4]/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">کتابی با این مشخصات یافت نشد</h3>
              <p className="text-sm text-[#99f6e4] max-w-md mx-auto">
                می‌توانید فیلترها را تغییر داده یا عنوان دیگری را جستجو فرمایید.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedShelf('all');
                  setRowQuery('');
                  setSelectedSubject('all');
                  setSelectedAvailability('all');
                }}
                className="mt-5 px-5 py-2.5 rounded-xl bg-[#84cc16] text-[#042f2e] font-bold text-xs hover:bg-[#a3e635]"
              >
                پاک کردن تمام فیلترها
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {paginatedBooks.map((book) => {
                  const isAvailable = book.availability_status === 'موجود';
                  return (
                    <div
                      key={book.id}
                      onClick={() => {
                        setSelectedBookForDetails(book);
                        setReservationMessage(null);
                      }}
                      className="cursor-pointer group relative rounded-3xl bg-[#073834]/90 hover:bg-[#073834] border border-[#0d9488]/40 hover:border-[#84cc16]/60 p-4 sm:p-5 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between"
                    >
                      {/* Cover */}
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
                              {/* 3D spine highlight strip */}
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
                            <span>{book.availability_status}</span>
                          </span>
                        </div>

                        {/* Shelf and Row */}
                        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/70 text-[#a3e635] text-[10px] font-bold backdrop-blur-sm">
                          قفسه {toPersianDigits(book.shelf)} - ردیف {toPersianDigits(book.row_number)}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex-1">
                        <span className="text-[11px] font-semibold text-[#84cc16] flex items-center gap-1 mb-1">
                          <Bookmark className="w-3 h-3" />
                          <span>{book.subject}</span>
                        </span>

                        <h3 className="text-base font-extrabold text-white leading-snug group-hover:text-[#a3e635] transition-colors line-clamp-2">
                          {book.title}
                        </h3>

                        <p className="text-xs text-[#99f6e4] mt-1 font-medium line-clamp-1">
                          {book.author}
                        </p>

                        {(book.edition || book.volume) && (
                          <p className="text-[11px] text-[#ccfbf1]/70 mt-1 line-clamp-1">
                            {book.edition && <span>دوره: {book.edition}</span>}
                            {book.edition && book.volume && <span> — </span>}
                            {book.volume && <span>جلد: {book.volume}</span>}
                          </p>
                        )}
                      </div>

                      {/* Footer - Centered View/Reserve Button with no codes */}
                      <div className="mt-4 pt-3 border-t border-[#0d9488]/30 flex items-center justify-center">
                        <span className="px-4 py-1.5 rounded-xl bg-[#042f2e] text-[#a3e635] group-hover:bg-[#84cc16] group-hover:text-[#042f2e] text-xs font-black transition-all shadow-sm">
                          مشاهده و رزرو
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              <PaginationControls
                currentPage={currentPage}
                totalItems={filteredBooks.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </div>

      </div>

      {/* Book Details and Reservation Modal */}
      {selectedBookForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-[#042f2e] border-2 border-[#0d9488]/60 rounded-3xl shadow-2xl p-6 sm:p-8 text-right overflow-y-auto max-h-[90vh]">
            
            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                setSelectedBookForDetails(null);
                setReservationMessage(null);
              }}
              className="absolute top-5 left-5 p-2 rounded-xl bg-[#073834] text-[#a3e635] hover:bg-[#0d9488]/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Content */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              
              {/* Left/Cover */}
              <div className="w-full sm:w-48 shrink-0 flex flex-col items-center">
                <div className="w-40 sm:w-48 h-60 rounded-2xl overflow-hidden bg-[#073834] border-2 border-[#0d9488]/40 shadow-xl flex items-center justify-center">
                  {selectedBookForDetails.cover_image ? (
                    <img
                      src={selectedBookForDetails.cover_image}
                      alt={selectedBookForDetails.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (() => {
                    const modalTheme = getSubjectCoverTheme(selectedBookForDetails.subject, selectedBookForDetails.shelf);
                    return (
                      <div className={`w-full h-full bg-gradient-to-tr ${modalTheme.bookGradient} p-5 text-center flex flex-col justify-between border-l-4 ${modalTheme.spineBorder} relative overflow-hidden select-none shadow-2xl`}>
                        <div className={`absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r ${modalTheme.spineHighlight} pointer-events-none`} />
                        <div className="relative z-10">
                          <span className={`text-xs font-black ${modalTheme.accentColor} block`}>
                            کتابخانه شهید کربلایی‌پور
                          </span>
                          <span className="text-[11px] text-white/70 block mt-1 font-medium">
                            {selectedBookForDetails.subject} • قفسه {toPersianDigits(selectedBookForDetails.shelf)}
                          </span>
                        </div>
                        <h4 className="relative z-10 text-sm font-black text-white leading-snug my-auto px-1">
                          {selectedBookForDetails.title}
                        </h4>
                        <div className="relative z-10 pt-2 border-t border-white/20">
                          <span className={`text-xs font-bold ${modalTheme.authorColor}`}>
                            {selectedBookForDetails.author}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-3 w-full">
                  <span
                    className={`block w-full text-center py-1.5 px-3 rounded-xl text-xs font-bold shadow-md ${
                      selectedBookForDetails.availability_status === 'موجود'
                        ? 'bg-[#84cc16] text-[#042f2e]'
                        : 'bg-amber-500 text-stone-900'
                    }`}
                  >
                    وضعیت: {selectedBookForDetails.availability_status}
                  </span>
                </div>
              </div>

              {/* Right/Info */}
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

                {/* Metadata Grid (Code & Publisher removed) */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-[#073834]/80 p-4 rounded-2xl border border-[#0d9488]/30">
                  <div>
                    <span className="text-[#99f6e4] block">قفسه:</span>
                    <strong className="text-white font-bold">قفسه شماره {toPersianDigits(selectedBookForDetails.shelf)}</strong>
                  </div>
                  <div>
                    <span className="text-[#99f6e4] block">شماره ردیف:</span>
                    <strong className="text-white font-bold">{toPersianDigits(selectedBookForDetails.row_number)}</strong>
                  </div>
                  {selectedBookForDetails.edition && (
                    <div>
                      <span className="text-[#99f6e4] block">دوره:</span>
                      <strong className="text-white font-bold">{selectedBookForDetails.edition}</strong>
                    </div>
                  )}
                  {selectedBookForDetails.volume && (
                    <div>
                      <span className="text-[#99f6e4] block">جلد:</span>
                      <strong className="text-white font-bold">{selectedBookForDetails.volume}</strong>
                    </div>
                  )}
                </div>

                {/* Description renamed to توضیحات */}
                <div>
                  <h4 className="text-xs font-bold text-[#99f6e4] mb-1">توضیحات:</h4>
                  <p className="text-xs sm:text-sm text-[#ccfbf1] leading-relaxed text-justify bg-[#073834]/40 p-3 rounded-xl border border-[#0d9488]/20">
                    {selectedBookForDetails.description || 'توضیحات تکمیلی برای این کتاب در سیستم ثبت نشده است؛ جهت تورق به قفسه مربوطه در کتابخانه مراجعه فرمایید.'}
                  </p>
                </div>

                {/* Reservation Status and Feedback */}
                {reservationMessage && (
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-start gap-3 animate-in fade-in zoom-in-95 duration-200 shadow-xl ${
                      reservationMessage.type === 'success'
                        ? 'bg-emerald-950/95 border-2 border-[#84cc16] text-[#a3e635]'
                        : 'bg-rose-950/95 border-2 border-rose-500 text-rose-100 shadow-rose-950/50'
                    }`}
                  >
                    {reservationMessage.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#84cc16]" />
                    ) : (
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                    )}
                    <div className="space-y-1">
                      <strong className="block text-sm">
                        {reservationMessage.type === 'success' ? 'درخواست ثبت شد' : 'عدم امکان ثبت رزرو'}
                      </strong>
                      <p className="leading-relaxed font-semibold">{reservationMessage.text}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={reserving || selectedBookForDetails.availability_status !== 'موجود'}
                    onClick={() => handleReserve(selectedBookForDetails)}
                    className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-[#84cc16] to-[#65a30d] hover:from-[#a3e635] hover:to-[#84cc16] disabled:opacity-50 text-[#042f2e] font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#84cc16]/25 transition-all transform hover:-translate-y-0.5"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>
                      {reserving
                        ? 'در حال ثبت درخواست رزرو...'
                        : !currentUser
                        ? 'ورود به حساب جهت رزرو کتاب'
                        : 'رزرو این کتاب'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedBookForDetails(null)}
                    className="py-3 px-4 rounded-2xl bg-[#073834] text-[#ccfbf1] hover:text-white border border-[#0d9488]/40 text-xs font-bold"
                  >
                    بستن پنجره
                  </button>
                </div>

                {/* Hint */}
                <p className="text-[11px] text-[#99f6e4]/80 text-center">
                  💡 پس از ثبت درخواست رزرو، کتاب تا ۴۸ ساعت کاری در کتابخانه برای شما نگاه داشته می‌شود.
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
