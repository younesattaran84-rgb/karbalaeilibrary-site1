import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { StatsSection } from './components/StatsSection';
import { ShelvesSection } from './components/ShelvesSection';
import { BookIntroductionView } from './components/BookIntroductionView';
import { WhyUsSection } from './components/WhyUsSection';
import { RulesSection } from './components/RulesSection';
import { QuotesCarousel } from './components/QuotesCarousel';
import { FAQSection } from './components/FAQSection';
import { CatalogView } from './components/CatalogView';
import { CompetitionsView } from './components/CompetitionsView';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AccountModal } from './components/AccountModal';
import { Footer } from './components/Footer';
import { LoadingScreen } from './components/LoadingScreen';
import { LibraryEmojiSprinkles } from './components/LibraryEmojiSprinkles';
import { FloatingLibraryElements } from './components/FloatingLibraryElements';
import {
  INITIAL_BOOKS,
  INITIAL_FAQS,
  INITIAL_FAQ_CATEGORIES,
  INITIAL_OPERATING_HOURS,
  INITIAL_SHELVES_CONFIG,
  INITIAL_COMPETITIONS,
  INITIAL_HOMEPAGE_CMS,
} from './data/initialData';
import { Book, Reservation, UserProfile, FAQItem, OperatingHours, ShelfItem, Competition, HomepageCMS, CustomFont } from './types';
import { ensureFontFaceLoaded } from './components/FontPickerField';
import { X, Bookmark, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import { toPersianDigits } from './utils/persian';

export function App() {
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'home' | 'books' | 'intro' | 'competitions' | 'faq' | 'user-panel' | 'admin'>('home');
  const [activeShelfFilter, setActiveShelfFilter] = useState<number | undefined>(undefined);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Authenticated state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('lib_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem('lib_admin') === 'true';
    } catch {
      return false;
    }
  });

  // App data state
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>(INITIAL_FAQS);
  const [operatingHours, setOperatingHours] = useState<OperatingHours>(INITIAL_OPERATING_HOURS);
  const [shelvesConfig, setShelvesConfig] = useState<ShelfItem[]>(INITIAL_SHELVES_CONFIG);
  const [competitions, setCompetitions] = useState<Competition[]>(INITIAL_COMPETITIONS);
  const [featuredBookIds, setFeaturedBookIds] = useState<string[]>([]);
  const [homepageCMS, setHomepageCMS] = useState<HomepageCMS>(INITIAL_HOMEPAGE_CMS);
  const [stats, setStats] = useState<any>(undefined);
  const [announcement, setAnnouncement] = useState<{ enabled: boolean; text: string } | null>(null);
  const [announcementDismissed, setAnnouncementDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('lib_announcement_home_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  // Quick book modal for book clicked from Shelves or elsewhere
  const [modalBook, setModalBook] = useState<Book | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Dynamic statistics calculated directly from live database state
  const computedStats = useMemo(() => {
    const totalBooks = books.length;
    const availableBooks = books.filter((b) => b.availability_status === 'موجود').length;
    const borrowedBooks = totalBooks - availableBooks;
    const shelvesCount = shelvesConfig.length > 0 ? shelvesConfig.length : 16;
    const uniqueSubjects = new Set<string>();
    shelvesConfig.forEach((s) => s.subjects.forEach((sub) => uniqueSubjects.add(sub)));
    books.forEach((b) => { if (b.subject) uniqueSubjects.add(b.subject); });
    const subjectsCount = uniqueSubjects.size > 0 ? uniqueSubjects.size : 33;

    return {
      totalBooks: totalBooks > 0 ? totalBooks : (stats?.totalBooks || 6984),
      availableBooks: totalBooks > 0 ? availableBooks : (stats?.availableBooks || 6500),
      borrowedBooks: totalBooks > 0 ? borrowedBooks : (stats?.borrowedBooks || 484),
      shelvesCount,
      subjectsCount,
      membersCount: stats?.membersCount || 1540,
      visitsCount: stats?.visitsCount || 15400,
    };
  }, [books, shelvesConfig, stats]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Fetch all live data
  const fetchData = useCallback(async () => {
    try {
      // Books (Fetch all books with no limit for complete catalog and admin)
      const booksRes = await fetch('/api/books?limit=all');
      if (booksRes.ok) {
        const data = await booksRes.json();
        if (data.success && Array.isArray(data.books) && data.books.length > 0) {
          setBooks(data.books);
        }
      }
    } catch (e) {
      console.warn('Could not fetch books from server, using fallback:', e);
    }

    try {
      // Reservations
      const resRes = await fetch('/api/reservations');
      if (resRes.ok) {
        const data = await resRes.json();
        if (data.success && Array.isArray(data.reservations)) {
          setReservations(data.reservations);
        }
      }
    } catch (e) {
      console.warn('Could not fetch reservations:', e);
    }

    try {
      // FAQs
      const faqsRes = await fetch('/api/faqs');
      if (faqsRes.ok) {
        const data = await faqsRes.json();
        if (data.success && Array.isArray(data.faqs)) {
          setFaqs(data.faqs);
        }
      }
    } catch (e) {
      console.warn('Could not fetch faqs:', e);
    }

    try {
      // Operating hours
      const hoursRes = await fetch('/api/operating-hours');
      if (hoursRes.ok) {
        const data = await hoursRes.json();
        if (data.success && data.operating_hours) {
          setOperatingHours(data.operating_hours);
        }
      }
    } catch (e) {
      console.warn('Could not fetch operating hours:', e);
    }

    try {
      // Stats
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const data = await statsRes.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      }
    } catch (e) {
      console.warn('Could not fetch stats:', e);
    }

    try {
      // Competitions
      const compRes = await fetch('/api/competitions');
      if (compRes.ok) {
        const data = await compRes.json();
        if (data.success && Array.isArray(data.competitions)) {
          setCompetitions(data.competitions);
        }
      }
    } catch (e) {
      console.warn('Could not fetch competitions:', e);
    }

    try {
      // Shelves & Subjects Config
      const shelvesRes = await fetch('/api/shelves-config');
      if (shelvesRes.ok) {
        const data = await shelvesRes.json();
        if (data.success && Array.isArray(data.shelves) && data.shelves.length > 0) {
          setShelvesConfig(data.shelves);
        }
      }
    } catch (e) {
      console.warn('Could not fetch shelves config:', e);
    }

    try {
      // Announcements
      const annRes = await fetch('/api/announcement');
      if (annRes.ok) {
        const data = await annRes.json();
        if (data.success && data.announcement_enabled && data.announcement_text) {
          setAnnouncement({ enabled: true, text: data.announcement_text });
        } else {
          setAnnouncement(null);
        }
      }
    } catch (e) {
      console.warn('Could not fetch announcement:', e);
    }

    try {
      // Featured Books
      const featRes = await fetch('/api/featured-books');
      if (featRes.ok) {
        const data = await featRes.json();
        if (data.success && Array.isArray(data.featured_book_ids)) {
          setFeaturedBookIds(data.featured_book_ids);
        }
      }
    } catch (e) {
      console.warn('Could not fetch featured books:', e);
    }

    try {
      // Homepage CMS
      const cmsRes = await fetch('/api/homepage-cms');
      if (cmsRes.ok) {
        const data = await cmsRes.json();
        if (data.success && data.cms) {
          setHomepageCMS(data.cms);
        }
      }
    } catch (e) {
      console.warn('Could not fetch homepage cms:', e);
    }

    try {
      // Custom Fonts
      const fontsRes = await fetch('/api/fonts');
      if (fontsRes.ok) {
        const data = await fontsRes.json();
        if (data.success && Array.isArray(data.fonts)) {
          data.fonts.forEach((f: CustomFont) => {
            if (f.family && f.url) {
              ensureFontFaceLoaded(f.family, f.url);
            }
          });
        }
      }
    } catch (e) {
      console.warn('Could not fetch custom fonts:', e);
    }
  }, []);

  const handleUpdateShelvesConfig = async (newShelves: ShelfItem[]): Promise<boolean> => {
    try {
      const res = await fetch('/api/shelves-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shelves: newShelves }),
      });
      const data = await res.json();
      if (data.success) {
        setShelvesConfig(data.shelves || newShelves);
        showToast('پیکربندی قفسه‌ها و موضوعات با موفقیت اعمال گردید.');
        return true;
      }
      showToast(data.message || 'خطا در ذخیره قفسه‌ها', 'error');
      return false;
    } catch {
      showToast('خطا در برقراری ارتباط با سرور', 'error');
      return false;
    }
  };

  const handleUpdateHomepageCMS = async (updates: Partial<HomepageCMS>): Promise<boolean> => {
    try {
      const res = await fetch('/api/homepage-cms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && data.cms) {
        setHomepageCMS(data.cms);
        showToast('محتوا و تنظیمات صفحه نخست با موفقیت ذخیره شد.');
        // Also persist as permanent default in seed file & memory
        fetch('/api/cms/make-defaults', { method: 'POST' }).catch(() => {});
        return true;
      }
      showToast(data.message || 'خطا در ذخیره تغییرات CMS', 'error');
      return false;
    } catch {
      showToast('خطا در برقراری ارتباط با سرور', 'error');
      return false;
    }
  };

  const handleResetHomepageCMS = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/homepage-cms/reset', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.cms) {
        setHomepageCMS(data.cms);
        showToast('محتوای صفحه اصلی به حالت پیش‌فرض اولیه بازگردانده شد.');
        return true;
      }
      showToast(data.message || 'خطا در بازگردانی تنظیمات', 'error');
      return false;
    } catch {
      showToast('خطا در برقراری ارتباط با سرور', 'error');
      return false;
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync user profile
  useEffect(() => {
    if (currentUser?.phone) {
      fetch(`/api/user/profile?phone=${encodeURIComponent(currentUser.phone)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.is_blocked || (data.user && data.user.is_blocked)) {
            handleLogout();
            showToast('حساب کاربری شما به دلیل تخلف مسدود شده است.', 'error');
            return;
          }
          if (data.not_registered) {
            handleLogout();
            showToast('حساب کاربری شما حذف شده است. لطفاً مجدداً از اول ثبت‌نام نمایید.', 'error');
            return;
          }
          if (data.success && data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('lib_user', JSON.stringify(data.user));
          }
        })
        .catch(() => {});
    }
  }, [currentUser?.phone]);

  // Auth handlers
  const handleUserLogin = async (phone: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: pass }),
      });

      let data: any = null;
      let rawText = '';
      try {
        rawText = await res.text();
        data = JSON.parse(rawText);
      } catch {
        // Fallback if server returned HTML (e.g. 403 or error page)
        if (res.status === 403 || rawText.includes('مسدود')) {
          data = { is_blocked: true, message: 'کاربر به دلیل تخلف مسدود شده است' };
        }
      }

      if (res.status === 403 || data?.is_blocked) {
        const blockedMsg = 'کاربر به دلیل تخلف مسدود شده است';
        showToast(blockedMsg, 'error');
        const err: any = new Error(blockedMsg);
        err.is_blocked = true;
        throw err;
      }

      if (data && data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('lib_user', JSON.stringify(data.user));
        showToast(data.message || 'ورود به حساب کاربری با موفقیت انجام شد.');
        return true;
      }

      const errMsg = data?.message || 'خطا در ورود به حساب';
      showToast(errMsg, 'error');
      const err: any = new Error(errMsg);
      if (data?.not_registered) {
        err.not_registered = true;
      }
      if (data?.is_blocked) {
        err.is_blocked = true;
      }
      throw err;
    } catch (e: any) {
      if (e.not_registered || e.is_blocked || e.message) {
        throw e;
      }
      showToast('خطا در برقراری ارتباط با سرور', 'error');
      throw new Error('خطا در برقراری ارتباط با سرور');
    }
  };

  const handleUserRegister = async (name: string, family: string, phone: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, family, phone, password: pass }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('lib_user', JSON.stringify(data.user));
        showToast(data.message || 'ثبت‌نام با موفقیت انجام شد.');
        return true;
      }
      const errMsg = data.message || 'خطا در ثبت‌نام';
      showToast(errMsg, 'error');
      throw new Error(errMsg);
    } catch (e: any) {
      if (e.message) throw e;
      showToast('خطا در برقراری ارتباط با سرور', 'error');
      throw new Error('خطا در برقراری ارتباط با سرور');
    }
  };

  const handleAdminLogin = async (username: string, serial: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, admin_serial: serial }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAdmin(true);
        localStorage.setItem('lib_admin', 'true');
        showToast(data.message || 'خوش آمدید، احراز هویت مدیریت تأیید شد.');
        setCurrentTab('admin');
        return true;
      }
      const errMsg = data.message || 'نام کاربری یا سریال نامعتبر است';
      showToast(errMsg, 'error');
      throw new Error(errMsg);
    } catch (e: any) {
      if (e.message) throw e;
      showToast('خطا در برقراری ارتباط با سرور', 'error');
      throw new Error('خطا در برقراری ارتباط با سرور');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    localStorage.removeItem('lib_user');
    localStorage.removeItem('lib_admin');
    if (currentTab === 'user-panel' || currentTab === 'admin') {
      setCurrentTab('home');
    }
    showToast('با موفقیت از حساب کاربری خارج شدید.');
  };

  // Reservation handler
  const handleReserveBook = async (book: Book): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      setIsAccountModalOpen(true);
      showToast('لطفاً ابتدا وارد حساب کاربری خود شوید یا ثبت‌نام کنید.', 'error');
      return { success: false, message: 'لطفاً ابتدا وارد حساب کاربری خود شوید یا ثبت‌نام کنید.' };
    }

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_phone: currentUser.phone,
          user_name: `${currentUser.name} ${currentUser.family}`,
          book_id: book.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'درخواست رزرو کتاب با موفقیت ثبت شد.');
        fetchData();
        return { success: true, message: data.message || 'درخواست رزرو کتاب با موفقیت ثبت شد.' };
      }
      showToast(data.message || 'امکان ثبت رزرو وجود ندارد.', 'error');
      return { success: false, message: data.message || 'ظرفیت رزرو همزمان شما تکمیل شده است. هر عضو حداکثر می‌تواند ۴ کتاب رزرو فعال داشته باشد.' };
    } catch (e: any) {
      showToast('خطا در ثبت رزرو در سرور', 'error');
      return { success: false, message: 'خطا در ثبت رزرو در سرور' };
    }
  };

  // Loan extension handler
  const handleExtendReservation = async (reservationId: string, weeks: 1 | 2 = 1): Promise<boolean> => {
    try {
      const res = await fetch(`/api/reservations/${reservationId}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeks }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'درخواست تمدید ثبت شد.');
        fetchData();
        return true;
      }
      showToast(data.message || 'امکان تمدید وجود ندارد.', 'error');
      return false;
    } catch (e) {
      showToast('خطا در ارسال درخواست تمدید', 'error');
      return false;
    }
  };

  // Admin handlers
  const handleImportHtml = async (htmlContent: string) => {
    const res = await fetch('/api/books/import-html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html_content: htmlContent }),
    });
    const data = await res.json();
    if (data.success) {
      fetchData();
    }
    return data;
  };

  const handleBatchImportBooks = async (
    incomingBooks: Partial<Book>[],
    mode: 'append' | 'replace',
    fileName: string,
    fileType: 'excel' | 'txt',
    description?: string
  ) => {
    const res = await fetch('/api/books/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        books: incomingBooks,
        mode,
        fileName,
        fileType,
        description,
      }),
    });
    const data = await res.json();
    if (data.success) {
      fetchData();
    }
    return data;
  };

  const handleAddBook = async (newBook: Partial<Book>): Promise<boolean> => {
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'کتاب با موفقیت افزوده شد.');
        fetchData();
        return true;
      }
      showToast(data.message || 'خطا در افزودن کتاب', 'error');
      return false;
    } catch {
      showToast('خطا در برقراری ارتباط با سرور', 'error');
      return false;
    }
  };

  const handleUpdateBook = async (id: string, updates: Partial<Book>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'کتاب با موفقیت به‌روزرسانی شد.');
        fetchData();
        return true;
      }
      showToast(data.message || 'خطا در ویرایش کتاب', 'error');
      return false;
    } catch {
      showToast('خطا در ارتباط با سرور', 'error');
      return false;
    }
  };

  const handleDeleteBook = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'کتاب حذف شد.');
        fetchData();
        return true;
      }
      showToast(data.message || 'خطا در حذف کتاب', 'error');
      return false;
    } catch {
      showToast('خطا در ارتباط با سرور', 'error');
      return false;
    }
  };

  const handleUpdateReservation = async (
    id: string,
    status: Reservation['status'],
    notes?: string,
    loanDays?: number
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_notes: notes, loan_days: loanDays }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'وضعیت رزرو به‌روز شد.');
        fetchData();
        return true;
      }
      showToast(data.message || 'خطا در به‌روزرسانی وضعیت', 'error');
      return false;
    } catch {
      showToast('خطا در ارتباط با سرور', 'error');
      return false;
    }
  };

  const handleUpdateOperatingHours = async (hours: OperatingHours): Promise<boolean> => {
    try {
      const res = await fetch('/api/operating-hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hours),
      });
      const data = await res.json();
      if (data.success) {
        setOperatingHours(hours);
        showToast('ساعات کاری با موفقیت به‌روزرسانی شد.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const refreshCompetitions = useCallback(async () => {
    try {
      const compRes = await fetch('/api/competitions');
      if (compRes.ok) {
        const data = await compRes.json();
        if (data.success && Array.isArray(data.competitions)) {
          setCompetitions(data.competitions);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleUpdateFeaturedBooks = async (bookIds: string[]): Promise<boolean> => {
    try {
      const res = await fetch('/api/featured-books', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_ids: bookIds }),
      });
      const data = await res.json();
      if (data.success) {
        setFeaturedBookIds(bookIds);
        setBooks((prev) => prev.map((b) => ({ ...b, featured: bookIds.includes(b.id) })));
        showToast('فهرست کتاب‌های معرفی با موفقیت ذخیره شد.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Filtered reservations for current user
  const userReservations = useMemo(() => {
    if (!currentUser?.phone) return [];
    return reservations.filter((r) => r.user_phone === currentUser.phone);
  }, [reservations, currentUser?.phone]);

  const activeReservationsCount = useMemo(() => {
    return userReservations.filter((r) => r.status === 'در انتظار بررسی' || r.status === 'تأیید شده' || r.status === 'امانت فعال').length;
  }, [userReservations]);

  // Featured books for introduction view (supports any number of books, order, or empty)
  const featuredBooks = useMemo(() => {
    if (featuredBookIds.length > 0) {
      return featuredBookIds.map((id) => books.find((b) => b.id === id)).filter(Boolean) as Book[];
    }
    return books.filter((b) => b.featured);
  }, [books, featuredBookIds]);

  return (
    <div className="min-h-screen bg-[#042f2e] text-[#f0fdfa] flex flex-col relative selection:bg-[#84cc16] selection:text-[#042f2e]">
      {/* Loading intro animation */}
      {loading && <LoadingScreen onFinish={() => setLoading(false)} />}

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-bottom duration-300">
          <div
            className={`px-5 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md text-sm font-bold ${
              toast.type === 'success'
                ? 'bg-[#064e3b]/95 border-[#84cc16]/60 text-[#a3e635] shadow-[#84cc16]/20'
                : 'bg-rose-950/95 border-rose-500/60 text-rose-200 shadow-rose-950/40'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-[#84cc16] shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        currentTab={currentTab}
        onNavigate={(tab) => {
          if (tab === 'home' || tab === 'books' || tab === 'intro' || tab === 'competitions' || tab === 'faq' || tab === 'user-panel' || tab === 'admin') {
            setCurrentTab(tab);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        activeReservationsCount={activeReservationsCount}
        isLoggedIn={!!currentUser}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        operatingHours={operatingHours}
        cms={homepageCMS}
      />

      {/* Global Important Announcement Banner */}
      {announcement?.enabled && announcement.text && !announcementDismissed && (
        <div className="bg-gradient-to-r from-emerald-950 via-[#042f2e] to-emerald-950 border-b border-[#84cc16]/50 px-4 py-2.5 shadow-md sticky top-20 z-30">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-sm shadow-rose-500/50"></span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#84cc16] text-[#042f2e] shrink-0">
                اطلاعیه مهم
              </span>
              <p className="text-white font-medium truncate sm:whitespace-normal">
                {announcement.text}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAnnouncementDismissed(true);
                sessionStorage.setItem('lib_announcement_home_dismissed', 'true');
              }}
              className="p-1 rounded-lg text-[#99f6e4] hover:text-white hover:bg-white/10 shrink-0 cursor-pointer"
              title="بستن اطلاعیه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <>
            <Hero
              operatingHours={operatingHours}
              cms={homepageCMS}
              onSearchClick={() => {
                setActiveShelfFilter(undefined);
                setCurrentTab('books');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onExploreShelvesClick={() => {
                const el = document.getElementById('shelves-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />

            <StatsSection stats={computedStats} cms={homepageCMS} />

            <div id="shelves-section">
              <ShelvesSection
                books={books}
                shelvesConfig={shelvesConfig}
                cms={homepageCMS}
                onSelectShelf={(shelfNum) => {
                  setActiveShelfFilter(shelfNum);
                  setCurrentTab('books');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectBook={(book) => {
                  setModalBook(book);
                }}
              />
            </div>

            <WhyUsSection cms={homepageCMS} />

            <div id="rules-section">
              <RulesSection cms={homepageCMS} />
            </div>

            <QuotesCarousel cms={homepageCMS} />

            <FAQSection
              faqs={faqs}
              categories={INITIAL_FAQ_CATEGORIES}
              isHomePreview={true}
              onViewAll={() => {
                setCurrentTab('faq');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Dynamic Library Emoji Sprinkles at bottom of Home page */}
            <LibraryEmojiSprinkles />
          </>
        )}

        {currentTab === 'books' && (
          <CatalogView
            books={books}
            currentUser={currentUser}
            onOpenAuth={() => setIsAccountModalOpen(true)}
            onReserveBook={handleReserveBook}
            initialShelfFilter={activeShelfFilter}
            shelvesConfig={shelvesConfig}
          />
        )}

        {currentTab === 'intro' && (
          <BookIntroductionView
            featuredBooks={featuredBooks}
            onSelectBook={(book) => setModalBook(book)}
            onExploreAll={() => {
              setActiveShelfFilter(undefined);
              setCurrentTab('books');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentTab === 'competitions' && (
          <CompetitionsView
            currentUser={currentUser}
            onOpenAuth={() => setIsAccountModalOpen(true)}
            competitions={competitions}
          />
        )}

        {currentTab === 'faq' && (
          <div className="py-12">
            <FAQSection faqs={faqs} categories={INITIAL_FAQ_CATEGORIES} />
          </div>
        )}

        {currentTab === 'user-panel' && currentUser && (
          <UserDashboard
            currentUser={currentUser}
            onLogout={handleLogout}
            onNavigateHome={() => {
              setCurrentTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateCatalog={() => {
              setActiveShelfFilter(undefined);
              setCurrentTab('books');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onExtendReservation={handleExtendReservation}
            onRefreshReservations={fetchData}
            onUpdateCurrentUser={(updated) => {
              setCurrentUser(updated);
              localStorage.setItem('lib_user', JSON.stringify(updated));
              fetchData();
            }}
          />
        )}

        {currentTab === 'admin' && isAdmin && (
          <AdminDashboard
            books={books}
            reservations={reservations}
            faqs={faqs}
            operatingHours={operatingHours}
            shelvesConfig={shelvesConfig}
            competitions={competitions}
            homepageCMS={homepageCMS}
            onUpdateHomepageCMS={handleUpdateHomepageCMS}
            onResetHomepageCMS={handleResetHomepageCMS}
            onRefreshCompetitions={refreshCompetitions}
            onUpdateShelvesConfig={handleUpdateShelvesConfig}
            onRefreshData={fetchData}
            onImportHtml={handleImportHtml}
            onBatchImportBooks={handleBatchImportBooks}
            onAddBook={handleAddBook}
            onUpdateBook={handleUpdateBook}
            onDeleteBook={handleDeleteBook}
            onUpdateReservation={handleUpdateReservation}
            onUpdateOperatingHours={handleUpdateOperatingHours}
            onUpdateFeaturedBooks={handleUpdateFeaturedBooks}
            onClose={() => {
              setCurrentTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        operatingHours={operatingHours}
        cms={homepageCMS}
        onNavigate={(tab) => {
          if (tab === 'home' || tab === 'books' || tab === 'intro' || tab === 'competitions' || tab === 'faq') {
            setCurrentTab(tab);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAdmin={() => {
          if (isAdmin) {
            setCurrentTab('admin');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            setIsAccountModalOpen(true);
          }
        }}
      />

      {/* Account Login/Register Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
        isAdmin={isAdmin}
        onUserLogin={handleUserLogin}
        onUserRegister={handleUserRegister}
        onAdminLogin={handleAdminLogin}
        onLogout={handleLogout}
        userReservations={userReservations}
        onExtendReservation={handleExtendReservation}
        onOpenUserPanel={() => {
          setIsAccountModalOpen(false);
          setCurrentTab('user-panel');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAdminPanel={() => {
          setIsAccountModalOpen(false);
          setCurrentTab('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Book Quick Modal (When clicked from shelves/intro) */}
      {modalBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#073834] border border-[#0d9488]/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative text-right">
            <button
              onClick={() => setModalBook(null)}
              className="absolute top-5 left-5 p-2 rounded-xl bg-[#042f2e] text-[#99f6e4] hover:text-white border border-[#0d9488]/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex gap-5 items-start mt-2">
              <div className="w-24 h-36 sm:w-28 sm:h-40 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 shrink-0 overflow-hidden shadow-md flex items-center justify-center">
                {modalBook.cover_image ? (
                  <img
                    src={modalBook.cover_image}
                    alt={modalBook.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen className="w-10 h-10 text-[#5eead4]" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-[#0d9488]/20 border border-[#0d9488]/40 text-[#5eead4] text-xs font-bold">
                  قفسه {toPersianDigits(modalBook.shelf)} • ردیف {toPersianDigits(modalBook.row_number)}
                </span>
                <h3 className="text-xl font-black text-white leading-tight">
                  {modalBook.title}
                </h3>
                <p className="text-sm text-[#99f6e4]">
                  نویسنده: <span className="text-white font-semibold">{modalBook.author}</span>
                </p>
              </div>
            </div>

            <div className="mt-5 p-4 rounded-2xl bg-[#042f2e]/70 border border-[#0d9488]/20 max-h-48 overflow-y-auto">
              <h4 className="text-xs font-bold text-[#99f6e4] mb-1">توضیحات:</h4>
              <p className="text-xs sm:text-sm text-[#e6fffa] leading-relaxed">
                {modalBook.description || 'توضیحاتی برای این کتاب ثبت نشده است.'}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalBook(null)}
                className="px-4 py-2.5 rounded-xl bg-[#042f2e] text-[#99f6e4] text-xs font-bold hover:bg-[#064e3b] transition-colors"
              >
                بستن
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = modalBook;
                  setModalBook(null);
                  await handleReserveBook(target);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#84cc16] to-[#65a30d] text-[#042f2e] text-xs font-black shadow-md hover:brightness-110 transition-all flex items-center gap-2"
              >
                <Bookmark className="w-4 h-4" />
                <span>رزرو این کتاب</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
