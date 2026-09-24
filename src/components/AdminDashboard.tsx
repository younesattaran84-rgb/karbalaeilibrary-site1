import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Shield, Upload, BookOpen, Clock, Users, CheckCircle2, CheckCircle,
  AlertCircle, Trash2, Edit3, Plus, ArrowLeft, RefreshCw,
  Sparkles, FileText, Search, Filter, MessageSquare, Send,
  Check, XCircle, RotateCcw, Calendar, CheckSquare, ChevronRight,
  ChevronLeft, Download, FileSpreadsheet, Eye, Info, Image as ImageIcon,
  FileUp, Loader2, Trophy, Link, ExternalLink, HelpCircle, Star, Zap, LogOut,
  Layers, X, Ban, ShieldAlert, Sliders
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Book, Reservation, FAQItem, OperatingHours, DayOperatingSchedule, LendingSettings, UserMessage, ManagedFile, Competition, CompetitionRegistration, UserProfile, ShelfItem, HomepageCMS } from '../types';
import { toPersianDigits, toEnglishDigits, normalizePersian, getDaysRemaining, isLibraryOpenNow, getTehranDateInfo } from '../utils/persian';
import { SUBJECTS_LIST, INITIAL_SHELVES_CONFIG, CANONICAL_FAQ_CATEGORIES, DEFAULT_WEEKLY_SCHEDULE, INITIAL_HOMEPAGE_CMS } from '../data/initialData';
import { containsProfanity } from '../utils/profanityFilter';
import { PaginationControls } from './PaginationControls';
import { ImageCropModal, AspectRatioType } from './ImageCropModal';
import { AdminCMS } from './AdminCMS';

interface AdminDashboardProps {
  books: Book[];
  reservations: Reservation[];
  faqs: FAQItem[];
  operatingHours: OperatingHours;
  shelvesConfig?: ShelfItem[];
  competitions?: Competition[];
  onRefreshCompetitions?: () => void;
  onUpdateShelvesConfig?: (shelves: ShelfItem[]) => Promise<boolean>;
  onRefreshData: () => void;
  onImportHtml: (htmlContent: string) => Promise<any>;
  onBatchImportBooks?: (books: Partial<Book>[], mode: 'append' | 'replace', fileName: string, fileType: 'excel' | 'txt', description?: string) => Promise<any>;
  onAddBook: (book: Partial<Book>) => Promise<boolean>;
  onUpdateBook: (id: string, updates: Partial<Book>) => Promise<boolean>;
  onDeleteBook: (id: string) => Promise<boolean>;
  onUpdateReservation: (id: string, status: Reservation['status'], notes?: string, loanDays?: number) => Promise<boolean>;
  onUpdateOperatingHours: (hours: OperatingHours) => Promise<boolean>;
  onUpdateFeaturedBooks: (bookIds: string[]) => Promise<boolean>;
  homepageCMS?: HomepageCMS;
  onUpdateHomepageCMS?: (cms: Partial<HomepageCMS>) => Promise<boolean>;
  onResetHomepageCMS?: () => Promise<boolean>;
  onClose: () => void;
  onLogout?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  books,
  reservations,
  faqs,
  operatingHours,
  shelvesConfig,
  competitions: propCompetitions,
  onRefreshCompetitions,
  onUpdateShelvesConfig,
  onRefreshData,
  onImportHtml,
  onBatchImportBooks,
  onAddBook,
  onUpdateBook,
  onDeleteBook,
  onUpdateReservation,
  onUpdateOperatingHours,
  onUpdateFeaturedBooks,
  homepageCMS,
  onUpdateHomepageCMS,
  onResetHomepageCMS,
  onClose,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'reservations' | 'books' | 'users' | 'competitions' | 'featured' | 'faq' | 'messages' | 'hours' | 'site-cms'>('reservations');
  
  // Navigation tabs container ref & smooth scroll
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const handleScrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      tabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Feedback banners
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 4000);
  };
  const showError = (msg: string) => {
    setErrorBanner(msg);
    setTimeout(() => setErrorBanner(null), 5000);
  };

  // Unified in-app confirmation modal (safe against iframe sandbox dialog blocking)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  // Staged import chunking & progress state
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    chunk: number;
    totalChunks: number;
    percent: number;
  } | null>(null);

  // Competition saving state
  const [isSavingComp, setIsSavingComp] = useState(false);
  const isSavingCompRef = useRef(false);

  // Image Crop & Aspect Ratio Modal state
  const [cropModal, setCropModal] = useState<{
    isOpen: boolean;
    imageSrc: string;
    title: string;
    initialAspect: AspectRatioType;
    target: 'book' | 'competition' | 'featured';
  } | null>(null);

  const handleConfirmCrop = async (croppedDataUrl: string) => {
    if (!cropModal) return;
    const { target } = cropModal;
    setCropModal(null);

    if (target === 'book') {
      setUploadingCover(true);
      try {
        const res = await fetch('/api/upload/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: croppedDataUrl,
            filename: `book_cover_${Date.now()}.png`,
          }),
        });
        const data = await res.json();
        if (data.success && data.url) {
          setBookForm((prev) => ({ ...prev, cover_image: data.url }));
        } else {
          setBookForm((prev) => ({ ...prev, cover_image: croppedDataUrl }));
        }
        showSuccess('تصویر جلد کتاب با نسبت ابعاد دلخواه ذخیره شد.');
      } catch {
        setBookForm((prev) => ({ ...prev, cover_image: croppedDataUrl }));
        showSuccess('تصویر جلد کتاب اعمال گردید.');
      } finally {
        setUploadingCover(false);
      }
    } else if (target === 'competition') {
      setCompForm((prev) => ({ ...prev, poster_url: croppedDataUrl }));
      showSuccess('پوستر مسابقه با ابعاد دلخواه تنظیم شد.');
    } else if (target === 'featured') {
      setFeaturedForm((prev) => ({ ...prev, cover_image: croppedDataUrl }));
      showSuccess('تصویر جلد کتاب معرفی تنظیم شد.');
    }
  };

  // Loan duration per reservation map
  const [loanDaysMap, setLoanDaysMap] = useState<Record<string, number>>({});
  const [customLoanDaysMap, setCustomLoanDaysMap] = useState<Record<string, boolean>>({});

  // Delete reservation
  const handleDeleteReservation = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'حذف رزرو / امانت',
      message: 'آیا از حذف کامل این مورد از لیست امانت و رزروها اطمینان دارید؟',
      confirmLabel: 'بله، حذف شود',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/reservations/${id}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (data.success) {
            showSuccess('مورد با موفقیت حذف گردید.');
            onRefreshData();
          } else {
            showError(data.message || 'خطا در حذف مورد');
          }
        } catch {
          showError('خطا در برقراری ارتباط');
        }
      },
    });
  };

  // Users tab state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const fetchUsersList = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success && data.users) {
        setUsersList(data.users);
      }
    } catch {
      // ignore
    } finally {
      setLoadingUsers(false);
    }
  };

  // FAQ tab state
  const [adminFaqs, setAdminFaqs] = useState<FAQItem[]>(faqs);
  const [faqCategoryFilter, setFaqCategoryFilter] = useState('all');
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqForm, setFaqForm] = useState<{ category: string; question: string; answer: string; published: boolean }>({
    category: 'عضویت و اشتراک',
    question: '',
    answer: '',
    published: true,
  });

  const fetchFaqsList = async () => {
    try {
      const res = await fetch('/api/faq');
      const data = await res.json();
      if (data.success && data.faqs) {
        setAdminFaqs(data.faqs);
      }
    } catch {
      // ignore
    }
  };

  // Competition registrants modal state
  const [selectedCompForRegistrants, setSelectedCompForRegistrants] = useState<Competition | null>(null);
  const [compRegistrants, setCompRegistrants] = useState<CompetitionRegistration[]>([]);
  const [loadingRegistrants, setLoadingRegistrants] = useState(false);
  const [registrantSearch, setRegistrantSearch] = useState('');

  const handleOpenRegistrantsModal = async (comp: Competition) => {
    setSelectedCompForRegistrants(comp);
    setRegistrantSearch('');
    setLoadingRegistrants(true);
    try {
      const res = await fetch(`/api/competitions/${comp.id}/registrants`);
      const data = await res.json();
      if (data.success && data.registrations) {
        setCompRegistrants(data.registrations);
      } else {
        setCompRegistrants([]);
      }
    } catch {
      setCompRegistrants([]);
    } finally {
      setLoadingRegistrants(false);
    }
  };

  const handleExportRegistrantsExcel = (comp: Competition, regs: CompetitionRegistration[]) => {
    if (!regs || regs.length === 0) {
      showError('هیچ شرکت‌کننده‌ای برای دریافت خروجی اکسل وجود ندارد.');
      return;
    }
    const exportData = regs.map((r, idx) => ({
      'ردیف': idx + 1,
      'نام و نام خانوادگی': r.full_name,
      'شماره تلفن همراه': r.phone,
      'واحد ثبت‌نامی': r.unit || 'نامشخص',
      'کتاب منبع انتخابی': r.selected_book || comp.book_title || 'نامشخص',
      'تاریخ ثبت‌نام': r.registered_at || 'نامشخص',
      'شناسه مسابقه': comp.id,
      'عنوان مسابقه': comp.title,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'شرکت‌کنندگان');
    const safeTitle = comp.title.replace(/[\\/:*?"<>|]/g, '_').substring(0, 30);
    XLSX.writeFile(workbook, `شرکت_کنندگان_مسابقه_${safeTitle}.xlsx`);
    showSuccess('فایل اکسل اسامی شرکت‌کنندگان با موفقیت دانلود شد.');
  };

  const handleExportUsersExcel = () => {
    if (!sortedUsersList || sortedUsersList.length === 0) {
      showError('هیچ کاربری برای دریافت خروجی موجود نیست.');
      return;
    }
    const exportData = sortedUsersList.map((u, idx) => ({
      'ردیف': idx + 1,
      'نام': u.name,
      'نام خانوادگی': u.family,
      'نام کامل': `${u.name} ${u.family}`,
      'شماره تلفن همراه': u.phone,
      'وضعیت حساب': u.is_blocked ? 'مسدود شده (تخلف)' : 'فعال',
      'اشتراک امانت فعال': u.has_lending_subscription ? 'دارد' : 'ندارد',
      'وضعیت عضویت': u.membership_status || 'فعال',
      'تاریخ عضویت': u.registered_at || 'نامشخص',
      'امانت‌های جاری': u.active_loans_count || 0,
      'کل درخواست‌های رزرو': u.total_reservations || 0,
      'مسابقات شرکت‌کرده': u.competitions_count || 0,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'کاربران کتابخانه');
    XLSX.writeFile(workbook, 'لیست_کاربران_کتابخانه_شهید_احسان_کربلایی_پور.xlsx');
    showSuccess('فایل اکسل اطلاعات کاربران با موفقیت دانلود شد.');
  };

  // Persian Alphabetical Sorting of Users
  const sortedUsersList = useMemo(() => {
    return [...usersList].sort((a, b) => {
      const nameA = `${a.name || ''} ${a.family || ''}`.trim();
      const nameB = `${b.name || ''} ${b.family || ''}`.trim();
      return nameA.localeCompare(nameB, 'fa', { sensitivity: 'base' });
    });
  }, [usersList]);

  // Block / Unblock User Handler
  const handleToggleBlockUser = (u: any) => {
    const isCurrentlyBlocked = Boolean(u.is_blocked);
    const fullName = `${u.name || ''} ${u.family || ''}`.trim();
    setConfirmDialog({
      isOpen: true,
      title: isCurrentlyBlocked ? 'رفع مسدودی حساب کاربری' : 'مسدود سازی حساب کاربری به دلیل تخلف',
      message: isCurrentlyBlocked
        ? `آیا از رفع مسدودیت حساب کاربری «${fullName}» (${toPersianDigits(u.phone)}) اطمینان دارید؟ با رفع مسدودی، این کاربر مجدداً می‌تواند وارد حساب خود شود.`
        : `آیا از مسدود سازی حساب کاربری «${fullName}» (${toPersianDigits(u.phone)}) به دلیل تخلف اطمینان دارید؟ دسترسی کاربر مسدود شده و هنگام تلاش برای ورود با پیام «حساب کاربری شما به دلیل تخلف مسدود شده است» مواجه خواهد شد.`,
      confirmLabel: isCurrentlyBlocked ? 'رفع مسدودی' : 'مسدود سازی حساب',
      isDestructive: !isCurrentlyBlocked,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/users/${encodeURIComponent(u.phone)}/toggle-block`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'تخلف از مقررات کتابخانه' }),
          });
          const data = await res.json();
          if (data.success) {
            showSuccess(data.message || (isCurrentlyBlocked ? 'مسدودیت حساب کاربر رفع گردید.' : 'حساب کاربری مسدود شد.'));
            setUsersList((prev) =>
              prev.map((item) => (item.phone === u.phone ? { ...item, is_blocked: !isCurrentlyBlocked } : item))
            );
          } else {
            showError(data.message || 'خطا در تغییر وضعیت مسدودی کاربر');
          }
        } catch {
          showError('خطا در برقراری ارتباط با سرور');
        }
      },
    });
  };

  // Delete User Handler (Forces complete re-registration on next login)
  const handleDeleteUser = (u: any) => {
    const fullName = `${u.name || ''} ${u.family || ''}`.trim();
    setConfirmDialog({
      isOpen: true,
      title: 'حذف کامل کاربر از سامانه',
      message: `آیا از حذف کامل کاربر «${fullName}» (${toPersianDigits(u.phone)}) از سامانه اطمینان دارید؟ اطلاعات حساب این شخص به طور کامل حذف خواهد شد و در صورتی که بعداً بخواهد وارد سایت شود، باید مجدداً از اول در سایت ثبت‌نام کند.`,
      confirmLabel: 'حذف قطعی کاربر',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/users/${encodeURIComponent(u.phone)}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (data.success) {
            showSuccess(data.message || 'کاربر با موفقیت حذف گردید.');
            setUsersList((prev) => prev.filter((item) => item.phone !== u.phone));
          } else {
            showError(data.message || 'خطا در حذف کاربر');
          }
        } catch {
          showError('خطا در برقراری ارتباط با سرور');
        }
      },
    });
  };

  // Featured 4 books CMS state
  const [editingFeaturedSlot, setEditingFeaturedSlot] = useState<number | null>(null);
  const [featuredSearchQuery, setFeaturedSearchQuery] = useState('');
  const [featuredForm, setFeaturedForm] = useState<{
    id?: string;
    title: string;
    author: string;
    description: string;
    excerpt: string;
    story: string;
    cover_image: string;
  }>({
    title: '',
    author: '',
    description: '',
    excerpt: '',
    story: '',
    cover_image: '',
  });

  // -------------------------------------------------------------
  // 1. FILE UPLOAD & MANAGEMENT (Excel, TXT, HTML)
  // -------------------------------------------------------------
  // Pagination states for all tables (10 to 50 items)
  const [booksPage, setBooksPage] = useState(1);
  const [booksPageSize, setBooksPageSize] = useState(10);
  const [resPage, setResPage] = useState(1);
  const [resPageSize, setResPageSize] = useState(10);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(10);
  const [messagesPage, setMessagesPage] = useState(1);
  const [messagesPageSize, setMessagesPageSize] = useState(10);
  const [registrantsPage, setRegistrantsPage] = useState(1);
  const [registrantsPageSize, setRegistrantsPageSize] = useState(10);

  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [stagedBooks, setStagedBooks] = useState<Partial<Book>[]>([]);
  const [stagedFileName, setStagedFileName] = useState<string>('');
  const [stagedFileType, setStagedFileType] = useState<'excel' | 'txt' | 'html'>('excel');
  const [importLoading, setImportLoading] = useState(false);
  const [importSummary, setImportSummary] = useState<any | null>(null);

  // Raw text input for TXT / HTML
  const [rawTextInput, setRawTextInput] = useState('');
  const [managedFiles, setManagedFiles] = useState<ManagedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Fetch managed files
  const fetchManagedFiles = async () => {
    setLoadingFiles(true);
    try {
      const res = await fetch('/api/admin/files');
      const data = await res.json();
      if (data.success && data.files) {
        setManagedFiles(data.files);
      }
    } catch {
      // ignore
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'books') {
      fetchManagedFiles();
    }
  }, [activeTab]);

  // Smart Universal File Upload (Excel, TXT, HTML)
  const handleSmartFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNameLower = file.name.toLowerCase();
    setErrorBanner(null);
    setStagedFileName(file.name);

    if (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls')) {
      handleExcelUploadFile(file);
    } else if (fileNameLower.endsWith('.html') || fileNameLower.endsWith('.htm')) {
      handleHtmlUploadFile(file);
    } else {
      // Assume text (.txt, .csv, etc.)
      handleTxtUploadFile(file);
    }
    // reset input value so re-selecting same file works
    e.target.value = '';
  };

  // Helper for Persian word numbers to integer
  const PERSIAN_WORDS_MAP: Record<string, number> = {
    'اول': 1, 'یکم': 1, 'یک': 1,
    'دوم': 2, 'دو': 2,
    'سوم': 3, 'سه': 3,
    'چهارم': 4, 'چهار': 4,
    'پنجم': 5, 'پنج': 5,
    'ششم': 6, 'شش': 6,
    'هفتم': 7, 'هفت': 7,
    'هشتم': 8, 'هشت': 8,
    'نهم': 9, 'نه': 9,
    'دهم': 10, 'ده': 10,
    'یازدهم': 11, 'یازده': 11,
    'دوازدهم': 12, 'دوازده': 12,
    'سیزدهم': 13, 'سیزده': 13,
    'چهاردهم': 14, 'چهارده': 14,
    'پانزدهم': 15, 'پانزده': 15,
    'شانزدهم': 16, 'شانزده': 16,
  };

  const extractShelfFromText = (val: any): number | null => {
    if (val === undefined || val === null) return null;
    const str = toEnglishDigits(String(val)).trim().toLowerCase();
    if (!str) return null;

    // Check word numbers
    for (const [w, n] of Object.entries(PERSIAN_WORDS_MAP)) {
      if (str.includes(w)) return n;
    }

    // Match numbers like "قفسه 16", "16/2", "16", "قفسه: 3"
    const m = str.match(/(?:قفسه\s*(?:شماره)?[\s:]*)?(\d+)/);
    if (m && m[1]) {
      const num = parseInt(m[1], 10);
      if (!isNaN(num) && num >= 1 && num <= 100) {
        return num;
      }
    }
    return null;
  };

  const deduceShelfFromSubjectOrKeywords = (subject: string, title: string): number | null => {
    const normSub = normalizePersian(subject || '');
    const normTitle = normalizePersian(title || '');

    // 1. Direct match with INITIAL_SHELVES_CONFIG subjects
    for (const s of INITIAL_SHELVES_CONFIG) {
      for (const sub of s.subjects) {
        const normS = normalizePersian(sub);
        if (normSub && (normSub.includes(normS) || normS.includes(normSub))) {
          return s.id;
        }
      }
    }

    // 2. Keyword heuristics for the 16 shelves
    if (normSub.includes('کودک') || normSub.includes('نوجوان') || normTitle.includes('کودک') || normTitle.includes('نوجوان') || normTitle.includes('قصه‌های خوب')) return 16;
    if (normSub.includes('ادبیات') || normSub.includes('شعر') || normSub.includes('دیوان') || normSub.includes('رمان') || normSub.includes('داستان')) return 15;
    if (normSub.includes('اسلام شناسی') || normSub.includes('تمدن اسلامی') || normSub.includes('اسلام')) return 14;
    if (normSub.includes('حدیث') || normSub.includes('نهج البلاغه') || normTitle.includes('نهج البلاغه') || normTitle.includes('صحیفه سجادیه') || normTitle.includes('بحارالانوار') || normTitle.includes('اصول کافی')) return 13;
    if (normSub.includes('تفسیر') || normSub.includes('قرآن') || normTitle.includes('تفسیر') || normTitle.includes('قرآن') || normTitle.includes('المیزان')) return 12;
    if (normSub.includes('فقه') || normSub.includes('اصول') || normSub.includes('احکام') || normTitle.includes('رساله') || normTitle.includes('توضیح المسائل') || normTitle.includes('لمعه')) return 11;
    if (normSub.includes('دعا') || normSub.includes('نماز') || normSub.includes('عبادت') || normSub.includes('مفاتیح') || normTitle.includes('مفاتیح')) return 10;
    if (normSub.includes('اخلاق') || normTitle.includes('اخلاق') || normTitle.includes('معراج السعاده') || normTitle.includes('چهل حدیث')) return 9;
    if (normSub.includes('تربیت') || normSub.includes('خانواده') || normSub.includes('مذاهب') || normSub.includes('ازدواج') || normSub.includes('فرزند')) return 8;
    if (normSub.includes('فلسفه') || normSub.includes('کلام') || normSub.includes('ولایت فقیه') || normSub.includes('هنر') || normSub.includes('منطق')) return 7;
    if (normSub.includes('تراجم') || normSub.includes('علوم') || normSub.includes('حقوق') || normSub.includes('پزشکی') || normSub.includes('جامعه')) return 6;
    if (normSub.includes('جبهه') || normSub.includes('جنگ') || normSub.includes('شهدا') || normSub.includes('شهید') || normSub.includes('دفاع مقدس') || normTitle.includes('شهید') || normTitle.includes('روایت فتح') || normTitle.includes('عملیات')) return 5;
    if (normSub.includes('تاریخ') || normSub.includes('سیاست') || normSub.includes('انقلاب') || normSub.includes('امامت') || normTitle.includes('تاریخ')) return 4;
    if (normSub.includes('رهبری') || normSub.includes('امام و رهبری') || normSub.includes('عقاید') || normSub.includes('خامنه ای') || normSub.includes('خمینی') || normTitle.includes('امام خمینی') || normTitle.includes('مقام معظم رهبری')) return 3;
    if (normSub.includes('امام حسین') || normSub.includes('امام زمان') || normSub.includes('مهدی') || normSub.includes('امام رضا') || normSub.includes('عاشورا') || normSub.includes('کربلا')) return 2;
    if (normSub.includes('علی') || normSub.includes('امیرالمومنین') || normSub.includes('پیامبر') || normSub.includes('زهرا') || normSub.includes('فاطمه') || normSub.includes('اهل بیت')) return 1;

    return null;
  };

  const handleExcelUploadFile = (file: File) => {
    setImportLoading(true);
    setStagedFileType('excel');
    setStagedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const arrayBuffer = evt.target?.result as ArrayBuffer;
        if (!arrayBuffer) throw new Error('فایل قابل خواندن نیست.');
        const data = new Uint8Array(arrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        
        if (!wb.SheetNames || wb.SheetNames.length === 0) {
          throw new Error('فایل اکسل بدون برگه (Sheet) معتبر است.');
        }

        const allParsedBooks: Partial<Book>[] = [];
        let totalSheetsProcessed = 0;

        for (const sheetName of wb.SheetNames) {
          const ws = wb.Sheets[sheetName];
          if (!ws) continue;

          // Deduce default shelf from sheet name (e.g. Sheet "قفسه ۳" -> 3)
          const sheetDefaultShelf = extractShelfFromText(sheetName);

          // Get raw rows as 2D array
          const rawSheetData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          if (!rawSheetData || rawSheetData.length === 0) continue;

          // Find header row in first 10 rows
          let headerRowIdx = -1;
          for (let r = 0; r < Math.min(rawSheetData.length, 10); r++) {
            const rowStr = rawSheetData[r].map((c) => String(c || '').trim().toLowerCase()).join(' ');
            if (
              rowStr.includes('عنوان') || rowStr.includes('نام کتاب') || rowStr.includes('کتاب') ||
              rowStr.includes('نویسنده') || rowStr.includes('موضوع') || rowStr.includes('قفسه') ||
              rowStr.includes('ردیف') || rowStr.includes('title') || rowStr.includes('author')
            ) {
              headerRowIdx = r;
              break;
            }
          }

          let headers: string[] = [];
          let dataRows: any[][] = [];

          if (headerRowIdx !== -1) {
            headers = rawSheetData[headerRowIdx].map((h) => String(h || '').trim());
            dataRows = rawSheetData.slice(headerRowIdx + 1);
          } else {
            // Fallback: row 0 or sheet_to_json default
            const objectRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
            if (objectRows && objectRows.length > 0 && objectRows[0]) {
              headers = Object.keys(objectRows[0]);
              dataRows = objectRows.map((obj) => headers.map((k) => obj[k]));
            } else {
              headers = rawSheetData[0].map((h) => String(h || '').trim());
              dataRows = rawSheetData.slice(1);
            }
          }

          if (dataRows.length === 0) continue;
          totalSheetsProcessed++;

          // Build column index lookup
          const colIndex: Record<string, number> = {};
          headers.forEach((h, i) => {
            const clean = h.trim().toLowerCase();
            colIndex[clean] = i;
            colIndex[h.trim()] = i;
          });

          const getVal = (row: any[], keys: string[]): string => {
            for (const k of keys) {
              const cleanK = k.toLowerCase();
              if (colIndex[cleanK] !== undefined && row[colIndex[cleanK]] !== undefined) {
                const val = String(row[colIndex[cleanK]]).trim();
                if (val) return val;
              }
            }
            return '';
          };

          for (let rIdx = 0; rIdx < dataRows.length; rIdx++) {
            const row = dataRows[rIdx];
            if (!row || !Array.isArray(row)) continue;

            // Check for title - MUST exist, otherwise skip this row
            const title = getVal(row, ['عنوان', 'نام کتاب', 'عنوان کتاب', 'نام اثر', 'کتاب', 'title', 'book_title', 'name']);
            if (!title || title === 'عنوان' || title === 'نام کتاب' || title === 'نام' || title.length < 2) {
              continue;
            }

            const author = getVal(row, ['نویسنده', 'پدیدآور', 'پدیدآورنده', 'مولف', 'مؤلف', 'نویسندگان', 'author', 'writer']) || 'ناشناس';
            const subject = getVal(row, ['موضوع', 'گروه', 'رده', 'رده بندی', 'رده‌بندی', 'دسته‌بندی', 'دسته', 'subject', 'category']) || 'عمومی و متفرقه';
            const series = getVal(row, ['دوره', 'سری', 'مجموعه', 'series']);
            const volume = getVal(row, ['جلد', 'شماره جلد', 'vol', 'volume']);
            const publisher = getVal(row, ['ناشر', 'انتشارات', 'نشر', 'محل نشر', 'publisher']);
            const publication_year = toEnglishDigits(getVal(row, ['سال چاپ', 'سال نشر', 'سال انتشار', 'سال', 'تاریخ چاپ', 'publication_year', 'year']));
            const book_number = toEnglishDigits(getVal(row, ['شماره ثبت', 'کد ثبت', 'کد کتاب', 'شماره کتاب', 'کد', 'بارکد', 'ثبت', 'شناسه', 'book_number', 'code']));
            const translator = getVal(row, ['مترجم', 'ترجمه', 'translator']);
            const rawRow = getVal(row, ['شماره ردیف', 'ردیف', 'ردیف قفسه', 'row', 'row_number']);
            const description = getVal(row, ['توضیحات', 'خلاصه', 'شرح', 'معرفی', 'description']);
            const rawStatus = getVal(row, ['وضعیت', 'وضعیت موجودی', 'status']);
            const availability_status = (rawStatus.includes('امانت') ? 'امانت داده شده' : 'موجود') as any;

            // SHELF PARSING:
            const rawShelf = getVal(row, ['قفسه', 'شماره قفسه', 'شماره‌ی قفسه', 'شماره_قفسه', 'شمارهقفسه', 'کد قفسه', 'قفسه‌ها', 'قفسه ها', 'محل قفسه', 'محل', 'بخش', 'shelf', 'shelf_number', 'shelf_id']);
            let shelf = extractShelfFromText(rawShelf);

            // If rawRow contains slash (e.g. "16/3"), extract shelf 16 and row 3
            let cleanRow = rawRow ? toEnglishDigits(rawRow).trim() : String(rIdx + 1);
            if (!shelf && cleanRow.includes('/')) {
              const parts = cleanRow.split('/');
              const firstNum = parseInt(parts[0], 10);
              if (!isNaN(firstNum) && firstNum >= 1 && firstNum <= 100) {
                shelf = firstNum;
                cleanRow = parts[1] || '1';
              }
            }

            // Fallback 1: Sheet name
            if (!shelf && sheetDefaultShelf) {
              shelf = sheetDefaultShelf;
            }

            // Fallback 2: Deduce from subject and title keywords
            if (!shelf) {
              shelf = deduceShelfFromSubjectOrKeywords(subject, title);
            }

            // Fallback 3: Default to 1
            if (!shelf || shelf < 1) {
              shelf = 1;
            }

            allParsedBooks.push({
              title,
              author,
              series,
              volume,
              subject,
              shelf,
              row_number: cleanRow || String(rIdx + 1),
              book_number,
              publisher,
              publication_year,
              translator,
              description,
              availability_status,
              reservation_allowed: true,
            });
          }
        }

        if (allParsedBooks.length === 0) {
          throw new Error('هیچ سطری با عنوان کتاب معتبر در فایل اکسل یافت نشد. لطفاً از صحت ستون عنوان کتاب اطمینان حاصل فرمایید.');
        }

        setStagedBooks(allParsedBooks);
        showSuccess(`تعداد ${toPersianDigits(allParsedBooks.length)} عنوان کتاب از ${toPersianDigits(totalSheetsProcessed)} برگه اکسل با تفکیک دقیق قفسه‌های ۱ تا ۱۶ استخراج گردید.`);
      } catch (err: any) {
        showError(err.message || 'خطا در خواندن فایل اکسل');
      } finally {
        setImportLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleTxtUploadFile = (file: File) => {
    setImportLoading(true);
    setStagedFileType('txt');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) throw new Error('فایل متنی خالی است.');
        parseAndStageTextContent(text, file.name);
      } catch (err: any) {
        showError(err.message || 'خطا در پردازش فایل متنی');
      } finally {
        setImportLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleHtmlUploadFile = (file: File) => {
    setImportLoading(true);
    setStagedFileType('html');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const html = evt.target?.result as string;
        if (!html) throw new Error('فایل HTML خالی است.');
        parseAndStageHtmlContent(html, file.name);
      } catch (err: any) {
        showError(err.message || 'خطا در پردازش فایل HTML');
      } finally {
        setImportLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const parseAndStageHtmlContent = (htmlContent: string, fileName = 'فایل HTML') => {
    const rowMatches = htmlContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    if (rowMatches.length === 0) {
      throw new Error('هیچ سطری (جدولی) در فایل HTML یافت نشد.');
    }

    const cleanText = (raw: string) => {
      return raw
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&zwnj;/g, '‌')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
    };

    let headers: string[] = [];
    const parsed: Partial<Book>[] = [];

    for (let i = 0; i < rowMatches.length; i++) {
      const row = rowMatches[i];
      const thMatches = row.match(/<th[^>]*>([\s\S]*?)<\/th>/gi);
      if (thMatches && thMatches.length > 0) {
        headers = thMatches.map(cleanText);
        continue;
      }

      const tdMatches = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
      if (!tdMatches || tdMatches.length === 0) continue;

      const cells = tdMatches.map(cleanText);
      let title = '';
      let author = '';
      let series = '';
      let volume = '';
      let subject = 'عمومی و متفرقه';
      let shelf = 1;
      let row_number: string | number = 1;
      let description = '';

      if (headers.length > 0 && headers.length === cells.length) {
        headers.forEach((h, idx) => {
          const hClean = h.toLowerCase();
          const val = cells[idx];
          if (hClean.includes('نام') || hClean.includes('عنوان') || hClean.includes('کتاب')) title = val;
          else if (hClean.includes('نویسنده') || hClean.includes('مؤلف') || hClean.includes('پدیدآور')) author = val;
          else if (hClean.includes('دوره') || hClean.includes('سری')) series = val;
          else if (hClean.includes('جلد')) volume = val;
          else if (hClean.includes('موضوع') || hClean.includes('رده')) subject = val;
          else if (hClean.includes('قفسه')) {
            const num = parseInt(val.replace(/[^\d]/g, ''), 10);
            if (!isNaN(num) && num > 0) shelf = num;
          } else if (hClean.includes('ردیف')) {
            row_number = val.trim();
          } else if (hClean.includes('توضیح') || hClean.includes('شرح')) description = val;
        });
      } else {
        title = cells[1] || cells[0] || '';
        author = cells[2] || 'ناشناس';
        subject = cells[3] || 'عمومی و متفرقه';
      }

      if (title && title.trim().length > 0) {
        parsed.push({
          title: title.trim(),
          author: author.trim() || 'ناشناس',
          series: series.trim(),
          volume: volume.trim(),
          subject: subject.trim() || 'عمومی و متفرقه',
          shelf,
          row_number: row_number || 1,
          description: description.trim(),
          availability_status: 'موجود',
          reservation_allowed: true,
        });
      }
    }

    if (parsed.length === 0) {
      throw new Error('هیچ اطلاعات کتابی از جدول HTML استخراج نشد.');
    }

    setStagedBooks(parsed);
    setStagedFileName(fileName);
    setStagedFileType('html');
    showSuccess(`${toPersianDigits(parsed.length)} عنوان کتاب از فایل HTML شناسایی شد.`);
  };

  const parseAndStageTextContent = (text: string, fileName = 'متن ورودی') => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) throw new Error('متنی برای پردازش یافت نشد.');

    const parsed: Partial<Book>[] = [];
    
    // Check if first line contains header keywords
    let startIndex = 0;
    const firstLine = lines[0];
    if (firstLine.includes('عنوان') || firstLine.includes('کتاب') || firstLine.includes('title')) {
      startIndex = 1;
    }

    // Delimiter detection (tab, semicolon, pipe, comma)
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes('|')) delimiter = '|';
    else if (firstLine.includes(';')) delimiter = ';';

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Key-value pattern support: عنوان: ... | نویسنده: ...
      if (line.includes(':') && line.includes('|')) {
        const parts = line.split('|');
        const item: any = {};
        for (const p of parts) {
          const [k, ...v] = p.split(':');
          if (k && v) item[k.trim()] = v.join(':').trim();
        }
        parsed.push({
          title: item['عنوان'] || item['نام کتاب'] || item['title'] || `کتاب ${i + 1}`,
          author: item['نویسنده'] || item['مولف'] || item['author'] || 'نامشخص',
          publisher: item['ناشر'] || item['publisher'] || '',
          subject: item['موضوع'] || item['subject'] || 'عمومی و متفرقه',
          shelf: parseInt(item['قفسه'] || '1', 10) || 1,
          row_number: parseInt(item['ردیف'] || '1', 10) || 1,
          book_number: item['کد'] || item['شماره'] || `${i + 1}`,
          description: item['توضیحات'] || '',
          availability_status: 'موجود',
          reservation_allowed: true,
        });
      } else {
        // Standard delimited columns
        const cols = line.split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());
        if (cols.length >= 2) {
          parsed.push({
            title: cols[0],
            author: cols[1] || 'نامشخص',
            publisher: cols[2] || '',
            subject: cols[3] || 'عمومی و متفرقه',
            shelf: parseInt(cols[4] || '1', 10) || 1,
            row_number: parseInt(cols[5] || '1', 10) || 1,
            book_number: cols[6] || `${i + 1}`,
            description: cols[7] || '',
            availability_status: 'موجود',
            reservation_allowed: true,
          });
        }
      }
    }

    if (parsed.length === 0) {
      throw new Error('قالب فایل متنی قابل شناسایی نبود. لطفاً ستون‌ها را با کاما، تب یا خط عمودی (|) جدا نمایید.');
    }

    setStagedBooks(parsed);
    setStagedFileName(fileName);
    setStagedFileType('txt');
    showSuccess(`${toPersianDigits(parsed.length)} ردیف از فایل متنی استخراج شد.`);
  };

  // Submit Staged Books to Backend with universal chunking & progress
  const handleCommitStagedImport = async () => {
    if (stagedBooks.length === 0) return;
    setImportLoading(true);
    setImportProgress(null);
    try {
      const fileNameToUse = stagedFileName || 'فایل_اکسل_کتاب‌ها';
      const fileTypeToUse = stagedFileType === 'excel' ? 'excel' : 'txt';
      const totalBooks = stagedBooks.length;
      const CHUNK_SIZE = 10000;
      const totalChunks = Math.ceil(totalBooks / CHUNK_SIZE);
      let lastData: any = null;

      for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
        const start = chunkIdx * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, totalBooks);
        const chunk = stagedBooks.slice(start, end);
        const chunkMode = (importMode === 'replace' && chunkIdx === 0) ? 'replace' : 'append';

        setImportProgress({
          current: end,
          total: totalBooks,
          chunk: chunkIdx + 1,
          totalChunks,
          percent: Math.round((end / totalBooks) * 100),
        });

        const res = await fetch('/api/books/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            books: chunk,
            mode: chunkMode,
            fileName: fileNameToUse,
            fileType: fileTypeToUse,
            description: `بارگذاری شده از پنل مدیریت - شامل ${toPersianDigits(totalBooks)} کتاب در ۱۶ قفسه`,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || `خطا در ثبت اطلاعات کتاب‌ها`);
        }
        lastData = data;
      }

      setImportSummary(lastData || { success: true });
      showSuccess(`تعداد ${toPersianDigits(totalBooks)} کتاب با موفقیت در ۱۶ قفسه کاتالوگ کتابخانه ثبت شد.`);
      setStagedBooks([]);
      setImportProgress(null);
      onRefreshData();
      fetchManagedFiles();
    } catch (err: any) {
      showError(err.message || 'خطا در ثبت نهایی کاتالوگ کتاب‌ها');
    } finally {
      setImportLoading(false);
      setImportProgress(null);
    }
  };

  const handleDeleteManagedFile = (fileId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'حذف تاریخچه فایل',
      message: 'آیا از حذف تاریخچه این فایل مطمئن هستید؟ (اطلاعات کتاب‌ها در کاتالوگ باقی خواهند ماند)',
      confirmLabel: 'بله، حذف شود',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await fetch(`/api/admin/files?id=${fileId}`, { method: 'DELETE' });
          fetchManagedFiles();
          showSuccess('رکورد فایل حذف گردید.');
        } catch {
          showError('خطا در حذف رکورد فایل');
        }
      },
    });
  };

  // -------------------------------------------------------------
  // 2. FULL BOOK MANAGEMENT (CRUD) & SHELVES CONFIG
  // -------------------------------------------------------------
  const [localShelvesConfig, setLocalShelvesConfig] = useState<ShelfItem[]>(shelvesConfig || INITIAL_SHELVES_CONFIG);
  useEffect(() => {
    if (shelvesConfig && shelvesConfig.length > 0) {
      setLocalShelvesConfig(shelvesConfig);
    }
  }, [shelvesConfig]);

  const [isEditingShelvesModalOpen, setIsEditingShelvesModalOpen] = useState(false);
  const [newShelfNumber, setNewShelfNumber] = useState<string>('');
  const [newShelfName, setNewShelfName] = useState<string>('');
  const [newShelfInitialSubjects, setNewShelfInitialSubjects] = useState<string>('');
  const [newSubjectInputs, setNewSubjectInputs] = useState<Record<number, string>>({});
  const [savingShelves, setSavingShelves] = useState(false);

  const handleAddSubjectToShelf = (shelfId: number) => {
    const val = (newSubjectInputs[shelfId] || '').trim();
    if (!val) return;
    setLocalShelvesConfig((prev) =>
      prev.map((s) => {
        if (s.id === shelfId) {
          if (s.subjects.includes(val)) return s;
          return { ...s, subjects: [...s.subjects, val] };
        }
        return s;
      })
    );
    setNewSubjectInputs((prev) => ({ ...prev, [shelfId]: '' }));
    showSuccess(`موضوع «${val}» به قفسه ${toPersianDigits(shelfId)} اضافه شد.`);
  };

  const handleRemoveSubjectFromShelf = (shelfId: number, subjectToRemove: string) => {
    setLocalShelvesConfig((prev) =>
      prev.map((s) => {
        if (s.id === shelfId) {
          return { ...s, subjects: s.subjects.filter((sub) => sub !== subjectToRemove) };
        }
        return s;
      })
    );
  };

  const handleRemoveShelf = (shelfId: number) => {
    const shelfItem = localShelvesConfig.find((s) => s.id === shelfId);
    setConfirmDialog({
      isOpen: true,
      title: 'حذف کامل قفسه',
      message: `آیا از حذف قفسه شماره ${toPersianDigits(shelfId)} (${shelfItem?.name || ''}) و تمامی موضوعات زیرمجموعه آن اطمینان دارید؟`,
      confirmLabel: 'بله، قفسه حذف شود',
      isDestructive: true,
      onConfirm: () => {
        setLocalShelvesConfig((prev) => prev.filter((s) => s.id !== shelfId));
        showSuccess(`قفسه شماره ${toPersianDigits(shelfId)} حذف گردید. لطفاً جهت ذخیره نهایی در سرور روی دکمه «اعمال تغییرات» کلیک فرمایید.`);
      },
    });
  };

  const handleAddNewShelf = () => {
    const customNum = parseInt(newShelfNumber, 10);
    const calculatedId = !isNaN(customNum) && customNum > 0
      ? customNum
      : Math.max(...localShelvesConfig.map((s) => s.id), 0) + 1;

    if (localShelvesConfig.some((s) => s.id === calculatedId)) {
      showError(`قفسه شماره ${toPersianDigits(calculatedId)} در حال حاضر وجود دارد.`);
      return;
    }

    const name = newShelfName.trim() || `قفسه شماره ${calculatedId}`;
    const initialSubs = newShelfInitialSubjects
      .split(/[,،\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const newShelfItem: ShelfItem = {
      id: calculatedId,
      name,
      subjects: initialSubs.length > 0 ? initialSubs : ['عمومی'],
    };

    setLocalShelvesConfig((prev) => [...prev, newShelfItem].sort((a, b) => a.id - b.id));
    setNewShelfNumber('');
    setNewShelfName('');
    setNewShelfInitialSubjects('');
    showSuccess(`قفسه شماره ${toPersianDigits(calculatedId)} با موفقیت به لیست اضافه شد.`);
  };

  const handleSaveShelvesConfig = async () => {
    setSavingShelves(true);
    try {
      if (onUpdateShelvesConfig) {
        await onUpdateShelvesConfig(localShelvesConfig);
      } else {
        await fetch('/api/shelves-config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shelves: localShelvesConfig }),
        });
      }
      showSuccess('تغییرات قفسه‌ها و موضوعات با موفقیت ذخیره و در کل سامانه اعمال گردید.');
      setIsEditingShelvesModalOpen(false);
      onRefreshData();
    } catch {
      showError('خطا در ذخیره پیکربندی قفسه‌ها');
    } finally {
      setSavingShelves(false);
    }
  };

  const [bookSearch, setBookSearch] = useState('');
  const [bookShelfFilter, setBookShelfFilter] = useState<number | 'all'>('all');
  const [bookSubjectFilter, setBookSubjectFilter] = useState<string>('all');
  const [bookStatusFilter, setBookStatusFilter] = useState<string>('all');
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);

  // Smart subject options based on active shelf filter (strictly deduplicated and normalized)
  const adminAvailableSubjects = useMemo(() => {
    const normalizeSub = (s: string) => (s || '').trim().replace(/\s+/g, ' ').replace(/\s*([،,])\s*/g, '$1');
    const seen = new Map<string, string>();
    const addSub = (raw: string) => {
      if (!raw) return;
      const key = normalizeSub(raw);
      if (!seen.has(key)) {
        seen.set(key, raw.trim().replace(/امام کاظم\(ع\) /g, 'امام کاظم(ع)'));
      }
    };

    if (bookShelfFilter === 'all') {
      localShelvesConfig.forEach((s) => s.subjects.forEach(addSub));
      SUBJECTS_LIST.forEach(addSub);
      books.forEach((b) => { if (b.subject) addSub(b.subject); });
      return Array.from(seen.values());
    }
    const targetShelf = localShelvesConfig.find((s) => s.id === bookShelfFilter);
    if (targetShelf && targetShelf.subjects.length > 0) {
      targetShelf.subjects.forEach(addSub);
      return Array.from(seen.values());
    }
    books.filter((b) => b.shelf === bookShelfFilter).forEach((b) => { if (b.subject) addSub(b.subject); });
    return Array.from(seen.values());
  }, [bookShelfFilter, localShelvesConfig, books]);

  // Reset bookSubjectFilter if it's no longer in the active shelf's subjects
  useEffect(() => {
    if (bookSubjectFilter !== 'all' && !adminAvailableSubjects.includes(bookSubjectFilter)) {
      setBookSubjectFilter('all');
    }
  }, [bookShelfFilter, adminAvailableSubjects, bookSubjectFilter]);

  const initialBookForm: Partial<Book> = {
    title: '',
    author: '',
    series: '',
    volume: '',
    subject: 'علوم قرآنی و تفسیر',
    shelf: 1,
    row_number: '1',
    availability_status: 'موجود',
    description: '',
    cover_image: '',
  };
  const [bookForm, setBookForm] = useState<Partial<Book>>(initialBookForm);
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showError('حجم فایل تصویر نباید بیشتر از ۱۰ مگابایت باشد.');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (uploadEvt) => {
        const base64Data = uploadEvt.target?.result as string;
        setCropModal({
          isOpen: true,
          imageSrc: base64Data,
          title: 'برش و تنظیم ابعاد جلد کتاب (نسبت پیش‌فرض ۱:۱ همراه با حاشیه محو خودکار)',
          initialAspect: '1:1',
          target: 'book',
        });
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    } catch {
      showError('خطا در خواندن فایل تصویر');
    }
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = (bookForm.title || '').trim();
    if (!cleanTitle) {
      showError('نام کتاب الزامی است. تا نام کتاب وارد نشود، امکان ثبت وجود ندارد.');
      return;
    }

    try {
      const bookPayload: Partial<Book> = {
        title: cleanTitle,
        author: (bookForm.author || '').trim() || 'ناشناس',
        series: (bookForm.series || (bookForm as any).edition || '').trim(),
        volume: (bookForm.volume || '').trim(),
        subject: (bookForm.subject || '').trim() || 'عمومی و متفرقه',
        shelf: Number(bookForm.shelf) || 1,
        row_number: bookForm.row_number !== undefined && bookForm.row_number !== null ? String(bookForm.row_number).trim() : '1',
        availability_status: bookForm.availability_status === 'امانت داده شده' ? 'امانت داده شده' : 'موجود',
        description: (bookForm.description || '').trim(),
        cover_image: (bookForm.cover_image || '').trim(),
        reservation_allowed: true,
      };

      if (editingBookId) {
        await onUpdateBook(editingBookId, bookPayload);
        showSuccess(`مشخصات کتاب «${cleanTitle}» با موفقیت به‌روزرسانی شد.`);
        setEditingBookId(null);
      } else {
        await onAddBook(bookPayload);
        showSuccess(`کتاب «${cleanTitle}» با موفقیت به کاتالوگ افزوده شد.`);
        setIsAddingBook(false);
      }
      setBookForm(initialBookForm);
      onRefreshData();
    } catch (err: any) {
      showError(err.message || 'خطا در ثبت اطلاعات کتاب');
    }
  };

  const parseRowNumber = (rowVal: string | number | undefined): number => {
    if (rowVal === undefined || rowVal === null) return 9999;
    const str = String(rowVal).trim().replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
    const match = str.match(/\d+/);
    return match ? parseInt(match[0], 10) : 9999;
  };

  const isSubjectMatching = (bookSubject: string, filterSubject: string): boolean => {
    if (filterSubject === 'all') return true;
    if (bookSubject === filterSubject) return true;
    const clean = (s: string) => (s || '').replace(/[\u200c\u200b\r\n\t]/g, ' ').replace(/[،,]/g, ' ').replace(/[\(\)\[\]]/g, '').replace(/\s+/g, ' ').trim();
    const bNorm = clean(bookSubject);
    const fNorm = clean(filterSubject);
    if (bNorm === fNorm || bNorm.includes(fNorm) || fNorm.includes(bNorm)) return true;
    const isShelf2 = (s: string) => s.includes('امام حسن') && (s.includes('صادق') || s.includes('باقر') || s.includes('معصومه') || s.includes('سجاد'));
    if (isShelf2(bNorm) && isShelf2(fNorm)) return true;
    return false;
  };

  const filteredBooks = useMemo(() => {
    const list = books.filter((b) => {
      const q = bookSearch.trim().toLowerCase();
      const matchesSearch = !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.series && b.series.toLowerCase().includes(q)) ||
        (b.volume && b.volume.toLowerCase().includes(q)) ||
        (b.subject && b.subject.toLowerCase().includes(q));
      
      const matchesShelf = bookShelfFilter === 'all' || b.shelf === bookShelfFilter;
      const matchesSubject = isSubjectMatching(b.subject, bookSubjectFilter);
      const matchesStatus = bookStatusFilter === 'all' ||
        (bookStatusFilter === 'امانت' || bookStatusFilter === 'امانت داده شده'
          ? (b.availability_status === 'امانت' || b.availability_status === 'امانت داده شده' || (b.availability_status as string) === 'در حال امانت')
          : b.availability_status === bookStatusFilter);

      return matchesSearch && matchesShelf && matchesSubject && matchesStatus;
    });

    return list.sort((a, b) => {
      if (a.shelf !== b.shelf) return a.shelf - b.shelf;
      const subDiff = (a.subject || '').localeCompare(b.subject || '', 'fa');
      if (subDiff !== 0) return subDiff;
      const rowDiff = parseRowNumber(a.row_number) - parseRowNumber(b.row_number);
      if (rowDiff !== 0) return rowDiff;
      return (a.title || '').localeCompare(b.title || '', 'fa');
    });
  }, [books, bookSearch, bookShelfFilter, bookSubjectFilter, bookStatusFilter]);

  // -------------------------------------------------------------
  // 3. LENDING & RESERVATIONS SYSTEM
  // -------------------------------------------------------------
  const [resFilter, setResFilter] = useState<'all' | 'pending' | 'loaned' | 'returned' | 'dueSoon' | 'overdue' | 'extensions'>('all');
  const [lendingSettings, setLendingSettings] = useState<LendingSettings>({
    default_loan_days: 14,
    max_active_reservations: 4,
    extension_days: 7,
    max_extensions: 2,
    allow_extensions: true,
  });
  const [showSettingsCard, setShowSettingsCard] = useState(false);

  // Fetch lending settings
  useEffect(() => {
    fetch('/api/admin/lending-settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.settings) setLendingSettings(d.settings);
      })
      .catch(() => {});
  }, []);

  const handleSaveLendingSettings = async () => {
    try {
      const res = await fetch('/api/admin/lending-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lendingSettings),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('تنظیمات امانت با موفقیت ذخیره گردید.');
        setShowSettingsCard(false);
      }
    } catch {
      showError('خطا در ذخیره تنظیمات امانت');
    }
  };

  const handleExtensionAction = async (reservationId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/admin/reservations/${reservationId}/extension-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, days: lendingSettings.extension_days || 7 }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(action === 'approve' ? 'درخواست تمدید با موفقیت تأیید شد.' : 'درخواست تمدید رد شد.');
        onRefreshData();
      } else {
        showError(data.message || 'خطا در ثبت تصمیم');
      }
    } catch {
      showError('خطا در ارتباط با سرور');
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsersList();
    } else if (activeTab === 'faq') {
      fetchFaqsList();
    }
  }, [activeTab]);

  const calculateLoanDaysInfo = (res: Reservation) => {
    if (!res.due_date || (res.status !== 'امانت فعال' && res.status !== 'تأیید شده')) return null;
    const diffDays = getDaysRemaining(res.due_date, res.due_date_iso);
    const safeDiffDays = typeof diffDays === 'number' && !isNaN(diffDays) ? diffDays : 0;
    return {
      due_date_str: res.due_date,
      diffDays: safeDiffDays,
      isOverdue: safeDiffDays < 0,
      isDueSoon: safeDiffDays >= 0 && safeDiffDays <= 3,
    };
  };

  const filteredReservations = reservations
    .filter((r) => {
      if (resFilter === 'pending') return r.status === 'در انتظار بررسی';
      if (resFilter === 'loaned') return r.status === 'امانت فعال';
      if (resFilter === 'returned') return r.status === 'تحویل داده شده';
      if (resFilter === 'extensions') return r.extension_status === 'در انتظار بررسی';
      if (resFilter === 'overdue') {
        const info = calculateLoanDaysInfo(r);
        return info && info.isOverdue;
      }
      if (resFilter === 'dueSoon') {
        const info = calculateLoanDaysInfo(r);
        return info && info.isDueSoon;
      }
      return true;
    })
    .sort((a, b) => {
      const aPending = a.status === 'در انتظار بررسی';
      const bPending = b.status === 'در انتظار بررسی';
      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;
      return 0;
    });

  // -------------------------------------------------------------
  // 4. MESSAGES SYSTEM
  // -------------------------------------------------------------
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [sendingReplyId, setSendingReplyId] = useState<string | null>(null);

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const res = await fetch('/api/admin/messages');
      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch {
      // ignore
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchMessages();
    }
  }, [activeTab]);

  const handleSendReply = async (messageId: string) => {
    const text = replyTextMap[messageId];
    if (!text || !text.trim()) return;
    if (containsProfanity(text)) {
      showError('از کلمات رکیک و ناپسند استفاده نکنید.');
      return;
    }
    setSendingReplyId(messageId);
    try {
      const res = await fetch(`/api/admin/messages/${messageId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: text.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('پاسخ برای کاربر با موفقیت ثبت و ارسال شد.');
        fetchMessages();
        setReplyTextMap({ ...replyTextMap, [messageId]: '' });
      } else {
        showError(data.message || 'خطا در ثبت پاسخ');
      }
    } catch {
      showError('خطا در برقراری ارتباط');
    } finally {
      setSendingReplyId(null);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'حذف پیام کاربر',
      message: 'آیا از حذف این پیام اطمینان دارید؟ این عمل غیرقابل بازگشت است.',
      confirmLabel: 'بله، پیام حذف شود',
      isDestructive: true,
      onConfirm: async () => {
        // Optimistic update
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        try {
          const res = await fetch(`/api/admin/messages/${messageId}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (data.success) {
            showSuccess('پیام حذف شد.');
            fetchMessages();
          } else {
            showError(data.message || 'خطا در حذف پیام');
            fetchMessages();
          }
        } catch {
          showError('خطا در حذف پیام');
          fetchMessages();
        }
      },
    });
  };

  const handleDeleteAllMessages = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'پاکسازی کلی صندوق پیام‌ها',
      message: 'آیا از پاک کردن تمامی پیام‌های کاربران اطمینان کامل دارید؟ تمامی پیام‌ها حذف خواهند شد.',
      confirmLabel: 'بله، همه پیام‌ها پاک شوند',
      isDestructive: true,
      onConfirm: async () => {
        // Optimistic update
        setMessages([]);
        try {
          const res = await fetch('/api/admin/messages', {
            method: 'DELETE',
          });
          const data = await res.json();
          if (data.success) {
            showSuccess('تمامی پیام‌ها با موفقیت پاک شدند.');
            fetchMessages();
          } else {
            showError(data.message || 'خطا در حذف پیام‌ها');
            fetchMessages();
          }
        } catch {
          showError('خطا در حذف پیام‌ها');
          fetchMessages();
        }
      },
    });
  };

  // -------------------------------------------------------------
  // 5. COMPETITIONS MANAGEMENT (CRUD + Poster Upload + Link)
  // -------------------------------------------------------------
  const [competitions, setCompetitions] = useState<Competition[]>(propCompetitions || []);
  const [loadingCompetitions, setLoadingCompetitions] = useState(false);
  const [editingCompId, setEditingCompId] = useState<string | null>(null);
  const [showCompModal, setShowCompModal] = useState(false);
  const [compForm, setCompForm] = useState<Partial<Competition>>({
    title: '',
    book_title: '',
    poster_url: '',
    link_url: '',
    description: '',
    start_date: '',
    end_date: '',
    prizes: '',
    status: 'در حال برگزاری',
  });

  useEffect(() => {
    if (propCompetitions) {
      setCompetitions(propCompetitions);
    }
  }, [propCompetitions]);

  const fetchCompetitions = async () => {
    setLoadingCompetitions(true);
    try {
      const res = await fetch('/api/competitions');
      const data = await res.json();
      if (data.success && data.competitions) {
        setCompetitions(data.competitions);
        onRefreshCompetitions?.();
      }
    } catch {
      // ignore
    } finally {
      setLoadingCompetitions(false);
    }
  };

  const handleDeleteAllCompetitions = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'حذف تمامی مسابقات',
      message: 'آیا از حذف کلیه مسابقات کتابخوانی اطمینان دارید؟ تمامی رکوردهای مسابقات پاک خواهند شد.',
      confirmLabel: 'بله، همه مسابقات حذف شوند',
      isDestructive: true,
      onConfirm: async () => {
        // Optimistic update
        setCompetitions([]);
        onRefreshCompetitions?.();
        try {
          const res = await fetch('/api/competitions', {
            method: 'DELETE',
          });
          const data = await res.json();
          if (data.success) {
            showSuccess('تمامی مسابقات با موفقیت حذف شدند.');
            fetchCompetitions();
          } else {
            showError(data.message || 'خطا در حذف همه مسابقات');
            fetchCompetitions();
          }
        } catch {
          showError('خطا در حذف مسابقات');
          fetchCompetitions();
        }
      },
    });
  };

  useEffect(() => {
    if (activeTab === 'competitions') {
      fetchCompetitions();
    } else if (activeTab === 'users') {
      fetchUsersList();
    } else if (activeTab === 'faq') {
      fetchFaqsList();
    }
  }, [activeTab]);

  const handleOpenNewCompModal = () => {
    setEditingCompId(null);
    setCompForm({
      title: '',
      book_title: '',
      poster_url: '',
      link_url: '',
      description: '',
      start_date: new Date().toLocaleDateString('fa-IR'),
      end_date: '',
      prizes: '',
      status: 'در حال برگزاری',
    });
    setShowCompModal(true);
  };

  const handleOpenEditCompModal = (comp: Competition) => {
    setEditingCompId(comp.id);
    setCompForm({
      title: comp.title,
      book_title: comp.book_title || '',
      poster_url: comp.poster_url || '',
      link_url: comp.link_url || '',
      description: comp.description,
      start_date: comp.start_date || '',
      end_date: comp.end_date || '',
      prizes: Array.isArray(comp.prizes) ? comp.prizes.join('\n') : comp.prizes,
      status: comp.status,
    });
    setShowCompModal(true);
  };

  const handleSaveCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingComp || isSavingCompRef.current) return;
    if (!compForm.title?.trim() || !compForm.description?.trim()) {
      showError('عنوان مسابقه و توضیحات الزامی هستند.');
      return;
    }

    isSavingCompRef.current = true;
    setIsSavingComp(true);
    try {
      const prizesArray = compForm.prizes
        ? (typeof compForm.prizes === 'string' ? compForm.prizes.split('\n').map(p => p.trim()).filter(Boolean) : compForm.prizes)
        : [];

      const payload = {
        ...compForm,
        prizes: prizesArray.length > 0 ? prizesArray : ['جوایز نقدی و بسته‌های فرهنگی نفیس'],
      };

      if (editingCompId) {
        // Optimistic update
        setCompetitions((prev) => prev.map((c) => (c.id === editingCompId ? { ...c, ...payload } : c)));
        const res = await fetch(`/api/competitions/${editingCompId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          showSuccess('مسابقه با موفقیت ویرایش شد.');
          setShowCompModal(false);
          await fetchCompetitions();
        } else {
          showError(data.message || 'خطا در ویرایش مسابقه');
          fetchCompetitions();
        }
      } else {
        const res = await fetch('/api/competitions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          if (data.competition) {
            setCompetitions((prev) => [data.competition, ...prev]);
          }
          showSuccess('مسابقه جدید با موفقیت ثبت شد.');
          setShowCompModal(false);
          await fetchCompetitions();
        } else {
          showError(data.message || 'خطا در ثبت مسابقه');
        }
      }
    } catch {
      showError('خطا در برقراری ارتباط با سرور');
    } finally {
      setIsSavingComp(false);
      isSavingCompRef.current = false;
    }
  };

  const handleDeleteCompetition = (compId: string) => {
    const compToDelete = competitions.find((c) => c.id === compId);
    setConfirmDialog({
      isOpen: true,
      title: 'حذف مسابقه کتابخوانی',
      message: `آیا از حذف مسابقه «${compToDelete?.title || 'انتخاب شده'}» اطمینان دارید؟`,
      confirmLabel: 'بله، حذف شود',
      isDestructive: true,
      onConfirm: async () => {
        // Optimistic update
        setCompetitions((prev) => prev.filter((c) => c.id !== compId));
        onRefreshCompetitions?.();
        try {
          const res = await fetch(`/api/competitions/${compId}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (data.success) {
            showSuccess('مسابقه با موفقیت حذف گردید.');
            fetchCompetitions();
          } else {
            showError(data.message || 'خطا در حذف مسابقه');
            fetchCompetitions();
          }
        } catch {
          showError('خطا در حذف مسابقه');
          fetchCompetitions();
        }
      },
    });
  };

  const handleCompPosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('لطفاً فقط فایل تصویری (JPG, PNG, WebP) انتخاب نمایید.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showError('حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCropModal({
        isOpen: true,
        imageSrc: base64,
        title: 'برش و تنظیم ابعاد پوستر مسابقه (ابعاد استاندارد ۱۶:۹، ۱:۱ یا دلخواه)',
        initialAspect: '16:9',
        target: 'competition',
      });
    };
    reader.onerror = () => {
      showError('خطا در خواندن فایل پوستر.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // -------------------------------------------------------------
  // 6. FEATURED & OPERATING HOURS & ANNOUNCEMENTS
  // -------------------------------------------------------------
  const [hoursForm, setHoursForm] = useState<OperatingHours>(() => ({
    ...operatingHours,
    weekly_schedule:
      Array.isArray(operatingHours?.weekly_schedule) && operatingHours.weekly_schedule.length === 7
        ? operatingHours.weekly_schedule
        : DEFAULT_WEEKLY_SCHEDULE,
  }));

  useEffect(() => {
    if (operatingHours) {
      setHoursForm({
        ...operatingHours,
        weekly_schedule:
          Array.isArray(operatingHours.weekly_schedule) && operatingHours.weekly_schedule.length === 7
            ? operatingHours.weekly_schedule
            : DEFAULT_WEEKLY_SCHEDULE,
      });
    }
  }, [operatingHours]);
  const [selectedFeatured, setSelectedFeatured] = useState<string[]>(
    books.filter((b) => b.featured).map((b) => b.id)
  );

  useEffect(() => {
    fetch('/api/featured-books')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.featured_book_ids)) {
          setSelectedFeatured(d.featured_book_ids);
        }
      })
      .catch(() => {});
  }, []);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [loadingAnnouncement, setLoadingAnnouncement] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  useEffect(() => {
    setLoadingAnnouncement(true);
    fetch('/api/announcement')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setAnnouncementText(data.announcement_text || '');
          setAnnouncementEnabled(!!data.announcement_enabled);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAnnouncement(false));
  }, []);

  const handleSaveAnnouncement = async () => {
    setSavingAnnouncement(true);
    try {
      const res = await fetch('/api/admin/announcement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcement_text: announcementText,
          announcement_enabled: announcementEnabled,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('اطلاعیه مهم با موفقیت ذخیره شد.');
      } else {
        showError(data.message || 'خطا در ذخیره اطلاعیه');
      }
    } catch {
      showError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setSavingAnnouncement(false);
    }
  };

  return (
    <div className="py-10 bg-[#042f2e] min-h-screen text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#0d9488]/30">
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#84cc16] to-[#0d9488] text-[#042f2e] shadow-lg">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#073834] text-[#a3e635] border border-[#84cc16]/40">
                  سامانه مدیریت یکپارچه
                </span>
                <span className="text-[10px] text-[#99f6e4] bg-[#0d9488]/20 px-2 py-0.5 rounded-md">
                  نگارش ۳.۲
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                پنل مدیریت کتابخانه شهید احسان کربلایی‌پور
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                onRefreshData();
                fetchManagedFiles();
                fetchMessages();
                showSuccess('اطلاعات کتابخانه به‌روزرسانی شد.');
              }}
              className="p-2.5 rounded-xl bg-[#073834] text-[#99f6e4] hover:text-white border border-[#0d9488]/40 transition-colors"
              title="تازه‌سازی تمام داده‌ها"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#84cc16] text-[#042f2e] font-black text-xs hover:bg-[#a3e635] shadow-lg transition-all"
            >
              بازگشت به سایت
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                title="خروج از حساب کاربری مدیریت"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>خروج از مدیریت</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Alerts */}
        {successBanner && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-[#84cc16] text-[#a3e635] text-xs font-bold flex items-center gap-2.5 shadow-lg animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#84cc16]" />
            <span>{successBanner}</span>
          </div>
        )}
        {errorBanner && (
          <div className="p-3.5 rounded-2xl bg-rose-950/90 border border-rose-600 text-rose-300 text-xs font-bold flex items-center gap-2.5 shadow-lg animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorBanner}</span>
          </div>
        )}

        {/* Navigation Tabs with bilateral scroll arrows for desktop and mobile */}
        <div className="relative flex items-center gap-1.5 w-full bg-[#042f2e]/60 p-1.5 rounded-2xl border border-[#0d9488]/30">
          <button
            type="button"
            onClick={() => handleScrollTabs('right')}
            className="shrink-0 p-2 rounded-xl bg-[#073834] hover:bg-[#0d9488] text-[#99f6e4] hover:text-white border border-[#0d9488]/40 shadow-md transition-all active:scale-95"
            title="پیمایش به راست"
            aria-label="پیمایش به راست"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div
            ref={tabsContainerRef}
            className="flex-1 flex items-center gap-2 overflow-x-auto py-1 scrollbar-none no-scrollbar touch-pan-x scroll-smooth"
          >
            {[
              {
                id: 'reservations',
                label: 'امانت و رزروها',
                icon: Users,
                badge: reservations.filter((r) => r.status === 'در انتظار بررسی' || r.extension_status === 'در انتظار بررسی').length,
              },
              {
                id: 'books',
                label: 'مدیریت کتاب‌ها',
                icon: BookOpen,
                count: books.length,
              },
              {
                id: 'users',
                label: 'اطلاعات کاربران',
                icon: Users,
                count: usersList.length > 0 ? usersList.length : undefined,
              },
              {
                id: 'competitions',
                label: 'مسابقات کتابخوانی',
                icon: Trophy,
                count: competitions.length > 0 ? competitions.length : undefined,
              },
              {
                id: 'featured',
                label: 'معرفی کتاب',
                icon: Sparkles,
                count: selectedFeatured.length > 0 ? selectedFeatured.length : undefined,
              },
              {
                id: 'faq',
                label: 'سؤالات متداول',
                icon: HelpCircle,
                count: adminFaqs.length > 0 ? adminFaqs.length : undefined,
              },
              {
                id: 'messages',
                label: 'پیام‌های کاربران',
                icon: MessageSquare,
                badge: messages.filter((m) => m.status !== 'پاسخ داده شده').length,
              },
              {
                id: 'hours',
                label: 'ساعات کاری و اطلاعیه',
                icon: Clock,
              },
              {
                id: 'site-cms',
                label: 'مدیریت ظاهر و محتوا (CMS)',
                icon: Sliders,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`shrink-0 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0d9488] to-[#0f766e] text-white border border-[#84cc16]/50 shadow-lg scale-[1.02]'
                      : 'bg-[#073834] text-[#ccfbf1] hover:bg-[#0d9488]/30 hover:text-white border border-[#0d9488]/30'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#84cc16]' : 'text-[#99f6e4]'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                      {toPersianDigits(tab.badge)}
                    </span>
                  )}
                  {tab.count !== undefined && !tab.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-[#042f2e] text-[#a3e635] text-[10px] font-bold border border-[#0d9488]/40">
                      {toPersianDigits(tab.count)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => handleScrollTabs('left')}
            className="shrink-0 p-2 rounded-xl bg-[#073834] hover:bg-[#0d9488] text-[#99f6e4] hover:text-white border border-[#0d9488]/40 shadow-md transition-all active:scale-95"
            title="پیمایش به چپ"
            aria-label="پیمایش به چپ"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: RESERVATIONS & LENDING MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'reservations' && (
          <div className="space-y-6">
            {/* Header and Quick Stats */}
            <div className="p-6 rounded-3xl bg-[#073834]/80 border border-[#0d9488]/40 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-white">سامانه هوشمند امانت، رزرو و تمدید</h3>
                  <p className="text-xs text-[#99f6e4] mt-1">
                    محاسبه خودکار تاریخ تحویل ({toPersianDigits(lendingSettings.default_loan_days)} روز)، نظارت بر تاخیرها، و تایید تمدیدهای اعضا
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSettingsCard(!showSettingsCard)}
                    className="px-3.5 py-2 rounded-xl bg-[#042f2e] border border-[#0d9488]/50 text-xs font-bold text-[#84cc16] hover:bg-[#0d9488]/30 flex items-center gap-1.5"
                  >
                    <span>⚙ تنظیمات مدت امانت</span>
                  </button>
                </div>
              </div>

              {/* Lending Settings Drawer */}
              {showSettingsCard && (
                <div className="p-4 rounded-2xl bg-[#042f2e] border border-[#84cc16]/40 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-black text-white">تنظیمات سیاست امانت کتابخانه:</strong>
                    <button
                      type="button"
                      onClick={() => setShowSettingsCard(false)}
                      className="text-[11px] text-rose-400 hover:text-rose-300"
                    >
                      بستن
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[#99f6e4] mb-1 font-bold">مدت زمان امانت (روز):</label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={lendingSettings.default_loan_days}
                        onChange={(e) => setLendingSettings({ ...lendingSettings, default_loan_days: parseInt(e.target.value, 10) || 14 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[#99f6e4] mb-1 font-bold">مدت هر بار تمدید (روز):</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={lendingSettings.extension_days}
                        onChange={(e) => setLendingSettings({ ...lendingSettings, extension_days: parseInt(e.target.value, 10) || 7 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[#99f6e4] mb-1 font-bold">حداکثر امانت همزمان هر عضو:</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={lendingSettings.max_active_reservations}
                        onChange={(e) => setLendingSettings({ ...lendingSettings, max_active_reservations: parseInt(e.target.value, 10) || 4 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white font-bold"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveLendingSettings}
                    className="px-5 py-2 rounded-xl bg-[#84cc16] text-[#042f2e] font-black text-xs hover:bg-[#a3e635]"
                  >
                    ذخیره تنظیمات امانت
                  </button>
                </div>
              )}

              {/* Filter tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-[#0d9488]/20">
                {[
                  { id: 'all', label: 'همه موارد', count: reservations.length },
                  { id: 'pending', label: 'در انتظار بررسی', count: reservations.filter((r) => r.status === 'در انتظار بررسی').length },
                  { id: 'extensions', label: 'درخواست‌های تمدید', count: reservations.filter((r) => r.extension_status === 'در انتظار بررسی').length },
                  { id: 'loaned', label: 'امانت‌های فعال', count: reservations.filter((r) => r.status === 'امانت فعال').length },
                  { id: 'returned', label: 'تحویل داده شده', count: reservations.filter((r) => r.status === 'تحویل داده شده').length },
                  { id: 'dueSoon', label: 'موعد نزدیک (تا ۳ روز)' },
                  { id: 'overdue', label: 'دارای تاخیر (منقضی شده)' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setResFilter(f.id as any)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      resFilter === f.id
                        ? 'bg-[#84cc16] text-[#042f2e] shadow-sm'
                        : 'bg-[#042f2e] text-[#99f6e4] hover:bg-[#0d9488]/20'
                    }`}
                  >
                    <span>{f.label}</span>
                    {f.count !== undefined && (
                      <span className="mr-1 text-[10px] opacity-80">({toPersianDigits(f.count)})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Reservations Table */}
            <div className="p-6 rounded-3xl bg-[#073834]/80 border border-[#0d9488]/40 shadow-xl">
              {filteredReservations.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#99f6e4]">
                  هیچ موردی با فیلتر انتخابی یافت نشد.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-[#0d9488]/40 text-[#a3e635]">
                        <th className="py-3 px-3">نام عضو</th>
                        <th className="py-3 px-3">شماره تماس</th>
                        <th className="py-3 px-3">عنوان کتاب</th>
                        <th className="py-3 px-3">قفسه / ردیف</th>
                        <th className="py-3 px-3">وضعیت امانت</th>
                        <th className="py-3 px-3">موعد تحویل</th>
                        <th className="py-3 px-3">وضعیت تمدید</th>
                        <th className="py-3 px-3">عملیات مدیریت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0d9488]/20">
                      {filteredReservations
                        .slice((resPage - 1) * resPageSize, resPage * resPageSize)
                        .map((res) => {
                        const loanInfo = calculateLoanDaysInfo(res);
                        return (
                          <tr key={res.id} className="hover:bg-[#042f2e]/60 transition-colors">
                            <td className="py-3 px-3 font-bold text-white">
                              <div className="flex items-center gap-2">
                                {res.status === 'در انتظار بررسی' && (
                                  <span className="relative flex h-2.5 w-2.5 shrink-0" title="رزرو جدید نیازمند بررسی">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-sm shadow-rose-500/50"></span>
                                  </span>
                                )}
                                <span>{res.user_name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-[#99f6e4]">{toPersianDigits(res.user_phone)}</td>
                            <td className="py-3 px-3 font-semibold text-white max-w-xs truncate">{res.book_title}</td>
                            <td className="py-3 px-3 text-[#5eead4]">
                              قفسه {toPersianDigits(res.shelf)} / ردیف {toPersianDigits(res.row_number || 1)}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                res.status === 'امانت فعال'
                                  ? 'bg-emerald-950 text-[#a3e635] border-[#84cc16]/40'
                                  : res.status === 'در انتظار بررسی'
                                  ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                                  : res.status === 'تحویل داده شده'
                                  ? 'bg-[#042f2e] text-[#99f6e4] border-[#0d9488]/30'
                                  : 'bg-rose-950 text-rose-300 border-rose-700/40'
                              }`}>
                                {res.status}
                              </span>
                            </td>

                            {/* Due date with countdown */}
                            <td className="py-3 px-3">
                              {loanInfo ? (
                                <div className="space-y-0.5">
                                  <span className="block font-bold text-white text-[11px]">
                                    {toPersianDigits(loanInfo.due_date_str)}
                                  </span>
                                  {loanInfo.isOverdue ? (
                                    <span className="text-[10px] text-rose-400 font-bold bg-rose-950/60 px-1.5 py-0.5 rounded">
                                      ⚠️ {toPersianDigits(Math.abs(loanInfo.diffDays))} روز تاخیر
                                    </span>
                                  ) : loanInfo.isDueSoon ? (
                                    <span className="text-[10px] text-amber-300 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded">
                                      ⏳ {toPersianDigits(loanInfo.diffDays)} روز باقیمانده
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-[#a3e635]">
                                      {toPersianDigits(loanInfo.diffDays)} روز باقیمانده
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-[#99f6e4]/60">-</span>
                              )}
                            </td>

                            {/* Extension request decision */}
                            <td className="py-3 px-3">
                              {res.extension_status === 'در انتظار بررسی' ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleExtensionAction(res.id, 'approve')}
                                    className="px-2 py-1 rounded bg-[#84cc16] text-[#042f2e] text-[10px] font-black hover:bg-[#a3e635]"
                                    title="تأیید تمدید ۷ روزه"
                                  >
                                    تأیید تمدید
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleExtensionAction(res.id, 'reject')}
                                    className="px-2 py-1 rounded bg-rose-900 text-white text-[10px] font-bold hover:bg-rose-800"
                                    title="رد تمدید"
                                  >
                                    رد
                                  </button>
                                </div>
                              ) : res.extension_status === 'تأیید شده' ? (
                                <span className="text-[10px] text-[#a3e635]">تمدید شده</span>
                              ) : res.extension_status === 'رد شده' ? (
                                <span className="text-[10px] text-rose-400">تمدید رد شد</span>
                              ) : (
                                <span className="text-[10px] text-[#99f6e4]/60">ندارد</span>
                              )}
                            </td>

                            {/* Action buttons */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {(res.status === 'در انتظار بررسی' || res.status === 'تأیید شده') && (
                                  <div className="flex items-center gap-1.5 bg-[#042f2e] px-2 py-0.5 rounded-lg border border-[#0d9488]/40">
                                    <span className="text-[#99f6e4] text-[10px]">مدت:</span>
                                    <select
                                      value={customLoanDaysMap[res.id] || ![7, 14, 21, 28].includes(loanDaysMap[res.id] || 14) ? 'custom' : (loanDaysMap[res.id] || 14)}
                                      onChange={(e) => {
                                        if (e.target.value === 'custom') {
                                          setCustomLoanDaysMap({ ...customLoanDaysMap, [res.id]: true });
                                          if (!loanDaysMap[res.id]) {
                                            setLoanDaysMap({ ...loanDaysMap, [res.id]: 14 });
                                          }
                                        } else {
                                          setCustomLoanDaysMap({ ...customLoanDaysMap, [res.id]: false });
                                          setLoanDaysMap({ ...loanDaysMap, [res.id]: Number(e.target.value) });
                                        }
                                      }}
                                      className="bg-transparent text-[#84cc16] font-bold text-[10px] focus:outline-none cursor-pointer"
                                    >
                                      <option value={7} className="bg-[#073834] text-white">۷ روز</option>
                                      <option value={14} className="bg-[#073834] text-white">۱۴ روز</option>
                                      <option value={21} className="bg-[#073834] text-white">۲۱ روز</option>
                                      <option value={28} className="bg-[#073834] text-white">۲۸ روز</option>
                                      <option value="custom" className="bg-[#073834] text-[#a3e635]">دلخواه...</option>
                                    </select>
                                    {(customLoanDaysMap[res.id] || ![7, 14, 21, 28].includes(loanDaysMap[res.id] || 14)) && (
                                      <div className="flex items-center gap-1 border-r border-[#0d9488]/40 pr-1.5 mr-0.5">
                                        <input
                                          type="number"
                                          min="1"
                                          max="365"
                                          value={loanDaysMap[res.id] !== undefined ? loanDaysMap[res.id] : 14}
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value, 10);
                                            setLoanDaysMap({ ...loanDaysMap, [res.id]: isNaN(val) ? 1 : Math.max(1, val) });
                                          }}
                                          className="w-12 px-1 py-0.5 rounded bg-[#073834] border border-[#84cc16]/70 text-[#a3e635] text-[10px] text-center font-bold focus:outline-none"
                                          placeholder="روز"
                                        />
                                        <span className="text-[10px] text-[#99f6e4]">روز</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {res.status === 'در انتظار بررسی' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => onUpdateReservation(res.id, 'تأیید شده', 'تأیید شد. آماده تحویل به عضو.', loanDaysMap[res.id] || 14)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white hover:bg-emerald-700 text-[11px] font-bold"
                                    >
                                      تأیید
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onUpdateReservation(res.id, 'رد شده', 'رد گردید.')}
                                      className="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 hover:bg-rose-900 text-[11px]"
                                    >
                                      رد
                                    </button>
                                  </>
                                )}

                                {(res.status === 'تأیید شده' || res.status === 'در انتظار بررسی') && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateReservation(res.id, 'امانت فعال', 'کتاب به عضو تحویل داده شد و دوره امانت آغاز شد.', loanDaysMap[res.id] || 14)}
                                    className="px-2.5 py-1 rounded-lg bg-[#0d9488] text-white hover:bg-[#14b8a6] text-[11px] font-bold"
                                  >
                                    شروع امانت
                                  </button>
                                )}

                                {res.status === 'امانت فعال' && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateReservation(res.id, 'تحویل داده شده', 'کتاب با موفقیت به کتابخانه عودت داده شد.')}
                                    className="px-2.5 py-1 rounded-lg bg-[#84cc16] text-[#042f2e] hover:bg-[#a3e635] text-[11px] font-black"
                                  >
                                    ثبت بازگشت کتاب
                                  </button>
                                )}

                                {/* Trash button to permanently delete this reservation/loan record */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReservation(res.id)}
                                  className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400 hover:text-white border border-rose-800/40 transition-colors shadow-sm ml-auto"
                                  title="حذف کامل این رزرو/امانت"
                                  aria-label="حذف کامل"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Reservations Pagination */}
              {filteredReservations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#0d9488]/30">
                  <PaginationControls
                    currentPage={resPage}
                    totalItems={filteredReservations.length}
                    pageSize={resPageSize}
                    onPageChange={setResPage}
                    onPageSizeChange={(newSize) => {
                      setResPageSize(newSize);
                      setResPage(1);
                    }}
                    pageSizeOptions={[10, 20, 30, 40, 50]}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: BOOKS MANAGEMENT (Full CRUD & Smart File Upload) */}
        {/* ========================================================= */}
        {activeTab === 'books' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[#073834]/80 border border-[#0d9488]/40 shadow-xl space-y-6">
              
              {/* Header and Add Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-[#84cc16]">مرحله ۱.۲ — ویرایش و مدیریت اطلاعات کتاب‌ها</span>
                  <h3 className="text-xl font-black text-white mt-0.5">کاتالوگ و مشخصات کامل کتاب‌ها</h3>
                  <p className="text-xs text-[#99f6e4]">
                    امکان مشاهده، ویرایش عمیق، حذف و افزودن کتاب با تمام ویژگی‌های استاندارد کتابداری
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Shelves & Subjects Editor Button */}
                  <button
                    type="button"
                    onClick={() => setIsEditingShelvesModalOpen(true)}
                    className="px-4 py-2.5 rounded-2xl bg-[#042f2e] hover:bg-[#064e3b] text-[#5eead4] border border-[#0d9488]/60 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all"
                  >
                    <Layers className="w-4 h-4 text-[#84cc16]" />
                    <span>ویرایش قفسه‌ها و موضوعات</span>
                  </button>

                  {/* Smart File Upload Button (Excel, TXT, HTML) */}
                  <label className="cursor-pointer px-4 py-2.5 rounded-2xl bg-[#0d9488] hover:bg-[#14b8a6] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all">
                    <Upload className="w-4 h-4 text-[#5eead4]" />
                    <span>افزودن هوشمند از فایل (اکسل، متنی، HTML)</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.txt,.csv,.html,.htm"
                      onChange={handleSmartFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingBook(true);
                      setEditingBookId(null);
                      setBookForm(initialBookForm);
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#84cc16] to-[#65a30d] text-[#042f2e] font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>افزودن کتاب جدید</span>
                  </button>
                </div>
              </div>

              {/* Staged Books Preview & Commit Card inside Books Tab */}
              {stagedBooks.length > 0 && (
                <div className="p-5 rounded-3xl bg-[#042f2e] border-2 border-[#84cc16] space-y-4 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#84cc16] bg-[#073834] px-2.5 py-0.5 rounded-full border border-[#84cc16]/40">
                        پیش‌نمایش قبل از ذخیره در کاتالوگ
                      </span>
                      <h4 className="text-base font-black text-white mt-1">
                        تعداد {toPersianDigits(stagedBooks.length)} عنوان از «{stagedFileName}» شناسایی گردید
                      </h4>
                    </div>

                    {/* Mode Selector & Quick Commit */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={importLoading}
                        onClick={handleCommitStagedImport}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#84cc16] to-[#65a30d] hover:from-[#a3e635] hover:to-[#84cc16] text-[#042f2e] font-black text-xs shadow-md flex items-center gap-1.5 transition-all animate-pulse"
                      >
                        <Zap className="w-4 h-4 text-[#042f2e]" />
                        <span>{importLoading ? 'در حال ثبت...' : 'اعمال و ثبت سریع تغییرات'}</span>
                      </button>

                      <div className="flex items-center gap-2 bg-[#073834] p-1 rounded-2xl border border-[#0d9488]/40">
                        <button
                          type="button"
                          onClick={() => setImportMode('append')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            importMode === 'append' ? 'bg-[#84cc16] text-[#042f2e]' : 'text-[#99f6e4]'
                          }`}
                        >
                          افزودن و بروزرسانی
                        </button>
                        <button
                          type="button"
                          onClick={() => setImportMode('replace')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            importMode === 'replace' ? 'bg-rose-900 text-white' : 'text-[#99f6e4]'
                          }`}
                        >
                          جایگزینی کامل کاتالوگ
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sample rows preview table */}
                  <div className="overflow-x-auto max-h-56">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-[#0d9488]/30 text-[#a3e635]">
                          <th className="py-2 px-2">نام کتاب</th>
                          <th className="py-2 px-2">نویسنده</th>
                          <th className="py-2 px-2">ناشر</th>
                          <th className="py-2 px-2">قفسه</th>
                          <th className="py-2 px-2">ردیف</th>
                          <th className="py-2 px-2">کد ثبت</th>
                          <th className="py-2 px-2">موضوع</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#0d9488]/20">
                        {stagedBooks.slice(0, 5).map((b, idx) => (
                          <tr key={idx} className="hover:bg-[#073834]/50">
                            <td className="py-2 px-2 font-bold text-white max-w-xs truncate">{b.title}</td>
                            <td className="py-2 px-2 text-[#99f6e4]">{b.author}</td>
                            <td className="py-2 px-2 text-[#ccfbf1]">{b.publisher || '-'}</td>
                            <td className="py-2 px-2 text-[#5eead4]">قفسه {toPersianDigits(b.shelf)}</td>
                            <td className="py-2 px-2 text-[#99f6e4]">{toPersianDigits(b.row_number)}</td>
                            <td className="py-2 px-2 text-[#a3e635]">{toPersianDigits(b.book_number)}</td>
                            <td className="py-2 px-2 text-[#99f6e4]">{b.subject}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled={importLoading}
                      onClick={handleCommitStagedImport}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#84cc16] to-[#65a30d] hover:from-[#a3e635] hover:to-[#84cc16] text-[#042f2e] font-black text-xs sm:text-sm shadow-lg flex items-center gap-2 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{importLoading ? 'در حال ثبت در پایگاه داده...' : 'تأیید نهایی و ذخیره در کاتالوگ'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStagedBooks([])}
                      className="px-4 py-2.5 rounded-2xl bg-[#073834] text-rose-300 text-xs hover:bg-rose-950 transition-colors"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              )}

              {/* Shelves & Subjects Editor Modal */}
              {isEditingShelvesModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-[#073834] border border-[#0d9488]/60 w-full max-w-4xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[#0d9488]/30 pb-4">
                      <div>
                        <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
                          <Layers className="w-5 h-5 text-[#84cc16]" />
                          <span>ویرایش قفسه‌ها و موضوعات کتابخانه</span>
                        </h3>
                        <p className="text-xs text-[#99f6e4] mt-1">
                          مدیریت ساختار قفسه‌ها و موضوعات؛ تغییرات پس از ذخیره به صورت خودکار و هوشمند در فیلترها، کاتالوگ و صفحه اصلی اعمال می‌شود.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingShelvesModalOpen(false)}
                        className="p-2 rounded-xl bg-[#042f2e] text-[#99f6e4] hover:text-white hover:bg-rose-950/60 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto space-y-6 pr-1 pl-1">
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-[#a3e635] flex items-center gap-1.5">
                          <span>لیست قفسه‌های تعریف شده و موضوعات هر قفسه:</span>
                          <span className="text-[10px] text-[#99f6e4]">({toPersianDigits(localShelvesConfig.length)} قفسه)</span>
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[...localShelvesConfig].sort((a, b) => a.id - b.id).map((shelf) => (
                            <div
                              key={shelf.id}
                              className="p-4 rounded-2xl bg-[#042f2e]/80 border border-[#0d9488]/40 space-y-3"
                            >
                              <div className="flex items-center justify-between border-b border-[#0d9488]/30 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-0.5 rounded-lg bg-[#0d9488]/30 text-[#5eead4] font-black text-xs border border-[#0d9488]/50">
                                    قفسه {toPersianDigits(shelf.id)}
                                  </span>
                                  <span className="text-white font-bold text-xs">{shelf.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-[#99f6e4]">
                                    {toPersianDigits(shelf.subjects.length)} موضوع
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveShelf(shelf.id)}
                                    className="p-1 px-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white text-[11px] font-bold flex items-center gap-1 border border-rose-800/40 transition-colors shadow-sm"
                                    title="حذف کامل این قفسه"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                    <span>حذف قفسه</span>
                                  </button>
                                </div>
                              </div>

                              {/* Subjects list */}
                              <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                                {shelf.subjects.map((sub) => (
                                  <span
                                    key={sub}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#073834] border border-[#0d9488]/50 text-white text-[11px]"
                                  >
                                    <span>{sub}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSubjectFromShelf(shelf.id, sub)}
                                      className="text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 p-0.5 rounded-full transition-colors"
                                      title="حذف موضوع"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                                {shelf.subjects.length === 0 && (
                                  <span className="text-[11px] text-[#99f6e4]/60 italic">موضوعی برای این قفسه ثبت نشده است.</span>
                                )}
                              </div>

                              {/* Add Subject to shelf */}
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  value={newSubjectInputs[shelf.id] || ''}
                                  onChange={(e) => setNewSubjectInputs({ ...newSubjectInputs, [shelf.id]: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddSubjectToShelf(shelf.id);
                                    }
                                  }}
                                  placeholder="افزودن موضوع جدید به این قفسه..."
                                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs placeholder-[#99f6e4]/40"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddSubjectToShelf(shelf.id)}
                                  className="px-3 py-1.5 rounded-xl bg-[#0d9488] hover:bg-[#14b8a6] text-white text-xs font-bold flex items-center gap-1 shrink-0"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>افزودن</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Add New Shelf */}
                      <div className="p-5 rounded-2xl bg-[#042f2e] border-2 border-dashed border-[#84cc16]/50 space-y-4">
                        <h4 className="text-xs sm:text-sm font-black text-[#a3e635] flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          <span>افزودن قفسه جدید به همراه موضوعات</span>
                        </h4>
                        <p className="text-xs text-[#99f6e4]">
                          می‌توانید قفسه شماره بعدی را تعریف کرده و موضوعات اولیه آن را وارد فرمایید:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <label className="block text-[#99f6e4] mb-1 font-bold">شماره قفسه (عددی):</label>
                            <input
                              type="number"
                              min={1}
                              value={newShelfNumber}
                              onChange={(e) => setNewShelfNumber(e.target.value)}
                              placeholder={`پیش‌فرض: ${Math.max(...localShelvesConfig.map((s) => s.id), 0) + 1}`}
                              className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[#99f6e4] mb-1 font-bold">نام / عنوان قفسه:</label>
                            <input
                              type="text"
                              value={newShelfName}
                              onChange={(e) => setNewShelfName(e.target.value)}
                              placeholder="مثلاً علوم اجتماعی یا ادبیات کهن"
                              className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[#99f6e4] mb-1 font-bold">موضوعات اولیه (با ویرگول جدا کنید):</label>
                            <input
                              type="text"
                              value={newShelfInitialSubjects}
                              onChange={(e) => setNewShelfInitialSubjects(e.target.value)}
                              placeholder="موضوع ۱، موضوع ۲، موضوع ۳"
                              className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddNewShelf}
                          className="px-4 py-2 rounded-xl bg-[#0d9488] hover:bg-[#14b8a6] text-white text-xs font-black flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>ثبت و اضافه کردن این قفسه به لیست</span>
                        </button>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#0d9488]/30">
                      <span className="text-[11px] text-[#99f6e4]">
                        با کلیک روی اعمال تغییرات، قفسه‌ها و موضوعات در تمامی بخش‌ها و فیلترها به‌روز خواهند شد.
                      </span>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setIsEditingShelvesModalOpen(false)}
                          className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#042f2e] text-[#99f6e4] text-xs font-bold hover:bg-[#064e3b]"
                        >
                          انصراف و بستن
                        </button>
                        <button
                          type="button"
                          disabled={savingShelves}
                          onClick={handleSaveShelvesConfig}
                          className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#84cc16] to-[#65a30d] text-[#042f2e] text-xs font-black flex items-center justify-center gap-2 shadow-lg hover:brightness-110 disabled:opacity-50"
                        >
                          {savingShelves ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          <span>اعمال تغییرات</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Add / Edit Form Modal / Card */}
              {(isAddingBook || editingBookId) && (
                <form onSubmit={handleBookSubmit} className="p-6 rounded-3xl bg-[#042f2e] border-2 border-[#84cc16] space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-[#0d9488]/30 pb-3">
                    <h4 className="text-base font-black text-[#a3e635] flex items-center gap-2">
                      <Edit3 className="w-4 h-4" />
                      <span>{editingBookId ? 'ویرایش مشخصات کتاب' : 'افزودن کتاب جدید به پایگاه داده'}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingBook(false);
                        setEditingBookId(null);
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      انصراف و بستن
                    </button>
                  </div>

                  {/* Primary & Extended Book Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* نام کتاب: الزامی */}
                    <div className="sm:col-span-2">
                      <label className="block text-[#a3e635] mb-1 font-bold">نام کتاب: * (الزامی)</label>
                      <input
                        type="text"
                        required
                        value={bookForm.title || ''}
                        onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                        placeholder="نام کامل کتاب"
                        className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs font-bold"
                      />
                    </div>

                    {/* نویسنده */}
                    <div className="sm:col-span-2">
                      <label className="block text-[#99f6e4] mb-1 font-bold">نویسنده:</label>
                      <input
                        type="text"
                        value={bookForm.author || ''}
                        onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                        placeholder="نام نویسنده / پدیدآور"
                        className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                      />
                    </div>

                    {/* دوره */}
                    <div>
                      <label className="block text-[#99f6e4] mb-1 font-bold">دوره:</label>
                      <input
                        type="text"
                        value={bookForm.series || (bookForm as any).edition || ''}
                        onChange={(e) => setBookForm({ ...bookForm, series: e.target.value, edition: e.target.value })}
                        placeholder="مثلاً دوره ۲ جلدی یا اول"
                        className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                      />
                    </div>

                    {/* جلد */}
                    <div>
                      <label className="block text-[#99f6e4] mb-1 font-bold">جلد:</label>
                      <input
                        type="text"
                        value={bookForm.volume || ''}
                        onChange={(e) => setBookForm({ ...bookForm, volume: e.target.value })}
                        placeholder="مثلاً ۱ یا ۲"
                        className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                      />
                    </div>

                    {/* قفسه */}
                    <div>
                      <label className="block text-[#99f6e4] mb-1 font-bold">قفسه:</label>
                      <select
                        value={bookForm.shelf || 1}
                        onChange={(e) => setBookForm({ ...bookForm, shelf: parseInt(e.target.value, 10) })}
                        className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                      >
                        {localShelvesConfig.map((s) => (
                          <option key={s.id} value={s.id}>قفسه {toPersianDigits(s.id)} ({s.name})</option>
                        ))}
                      </select>
                    </div>

                    {/* شماره ردیف */}
                    <div>
                      <label className="block text-[#99f6e4] mb-1 font-bold">شماره ردیف:</label>
                      <input
                        type="text"
                        value={bookForm.row_number !== undefined && bookForm.row_number !== null ? String(bookForm.row_number) : '1'}
                        onChange={(e) => setBookForm({ ...bookForm, row_number: e.target.value })}
                        placeholder="مثلاً ۱ یا ۲۱۶/۱ یا ۱۰/۴"
                        className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs font-mono"
                      />
                    </div>

                    {/* موضوع */}
                    <div className="sm:col-span-2">
                      <label className="block text-[#99f6e4] mb-1 font-bold">موضوع:</label>
                      <select
                        value={bookForm.subject || ''}
                        onChange={(e) => setBookForm({ ...bookForm, subject: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                      >
                        {(() => {
                          const shelfObj = localShelvesConfig.find((s) => s.id === (bookForm.shelf || 1));
                          const subjects = shelfObj && shelfObj.subjects.length > 0 ? shelfObj.subjects : SUBJECTS_LIST;
                          return (
                            <>
                              {subjects.map((sub) => (
                                <option key={sub} value={sub}>{sub}</option>
                              ))}
                              {!subjects.includes(bookForm.subject || '') && bookForm.subject && (
                                <option value={bookForm.subject}>{bookForm.subject}</option>
                              )}
                            </>
                          );
                        })()}
                      </select>
                    </div>

                    {/* وضعیت موجودی: فقط ۲ گزینه «موجود» و «امانت داده شده» */}
                    <div className="sm:col-span-2">
                      <label className="block text-[#a3e635] mb-1 font-bold">وضعیت موجودی:</label>
                      <select
                        value={bookForm.availability_status === 'امانت داده شده' ? 'امانت داده شده' : 'موجود'}
                        onChange={(e) => setBookForm({ ...bookForm, availability_status: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs font-bold"
                      >
                        <option value="موجود">موجود</option>
                        <option value="امانت داده شده">امانت داده شده</option>
                      </select>
                    </div>
                  </div>

                  {/* Cover Image & Description */}
                  <div className="space-y-3 pt-2 text-xs">
                    <div>
                      <label className="block text-[#99f6e4] mb-1 font-bold">
                        تصویر جلد کتاب (اختیاری):
                      </label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          value={bookForm.cover_image || ''}
                          onChange={(e) => setBookForm({ ...bookForm, cover_image: e.target.value })}
                          placeholder="https://... یا آپلود از رایانه/گوشی"
                          className="flex-1 px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs font-mono"
                        />
                        <label className={`cursor-pointer shrink-0 px-3.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                          uploadingCover
                            ? 'bg-[#0d9488]/50 text-white cursor-wait'
                            : 'bg-[#0d9488] hover:bg-[#14b8a6] text-white'
                        }`}>
                          {uploadingCover ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>در حال آپلود...</span>
                            </>
                          ) : (
                            <>
                              <FileUp className="w-3.5 h-3.5 text-[#a3e635]" />
                              <span>آپلود فایل عکس</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingCover}
                            onChange={handleCoverFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {bookForm.cover_image && (
                        <div className="mt-2 flex items-center gap-3 p-2 rounded-xl bg-[#042f2e] border border-[#0d9488]/30">
                          <img
                            src={bookForm.cover_image}
                            alt="پیش‌نمایش جلد"
                            className="w-10 h-14 object-cover rounded-lg border border-[#84cc16]/50 shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] text-[#a3e635] font-bold block">✓ پیش‌نمایش تصویر جلد</span>
                            <span className="text-[10px] text-[#99f6e4]/70 truncate block">{bookForm.cover_image}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setBookForm({ ...bookForm, cover_image: '' })}
                            className="text-rose-400 hover:text-rose-300 text-xs px-2 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/50 border border-rose-800/40"
                          >
                            حذف تصویر
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#99f6e4] mb-1">توضیحات یا خلاصه کتاب:</label>
                      <textarea
                        rows={2}
                        value={bookForm.description || ''}
                        onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                        placeholder="چکیده‌ای از محتوای کتاب..."
                        className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={!bookForm.title?.trim()}
                      className="px-6 py-2.5 rounded-2xl bg-[#84cc16] text-[#042f2e] font-black text-xs sm:text-sm hover:bg-[#a3e635] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {editingBookId ? 'ذخیره تغییرات کتاب' : 'ثبت قطعی کتاب'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingBook(false);
                        setEditingBookId(null);
                      }}
                      className="px-4 py-2.5 rounded-2xl bg-[#073834] text-white text-xs"
                    >
                      انصراف
                    </button>
                  </div>
                </form>
              )}

              {/* Live Search and 4 Smart Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#042f2e] p-4 rounded-2xl border border-[#0d9488]/30">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#84cc16] absolute right-3 top-3" />
                  <input
                    type="text"
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    placeholder="جستجو در نام کتاب، نویسنده..."
                    className="w-full pr-9 pl-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs placeholder-[#99f6e4]/40"
                  />
                </div>

                <div>
                  <select
                    value={bookShelfFilter}
                    onChange={(e) => setBookShelfFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                  >
                    <option value="all">همه قفسه‌ها</option>
                    {localShelvesConfig.map((s) => (
                      <option key={s.id} value={s.id}>قفسه {toPersianDigits(s.id)} ({s.name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={bookSubjectFilter}
                    onChange={(e) => setBookSubjectFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                  >
                    <option value="all">همه موضوعات</option>
                    {adminAvailableSubjects.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={bookStatusFilter}
                    onChange={(e) => setBookStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs font-bold"
                  >
                    <option value="all">همه وضعیت‌ها</option>
                    <option value="موجود">موجود</option>
                    <option value="امانت داده شده">امانت داده شده</option>
                  </select>
                </div>
              </div>

              {/* Books Table - Exactly the 9 requested columns */}
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-[#0d9488]/40 text-[#a3e635]">
                      <th className="py-2.5 px-3">قفسه</th>
                      <th className="py-2.5 px-3">شماره ردیف</th>
                      <th className="py-2.5 px-3">موضوع</th>
                      <th className="py-2.5 px-3">نام کتاب</th>
                      <th className="py-2.5 px-3">نویسنده</th>
                      <th className="py-2.5 px-3">دوره</th>
                      <th className="py-2.5 px-3">جلد</th>
                      <th className="py-2.5 px-3">وضعیت</th>
                      <th className="py-2.5 px-3">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0d9488]/20">
                    {filteredBooks
                      .slice((booksPage - 1) * booksPageSize, booksPage * booksPageSize)
                      .map((b) => (
                      <tr key={b.id} className="hover:bg-[#042f2e]/60 transition-colors">
                        <td className="py-2.5 px-3 text-[#5eead4] font-bold">قفسه {toPersianDigits(b.shelf)}</td>
                        <td className="py-2.5 px-3 text-[#99f6e4] font-mono">{toPersianDigits(b.row_number)}</td>
                        <td className="py-2.5 px-3 text-[#99f6e4]">{b.subject || '-'}</td>
                        <td className="py-2.5 px-3 font-bold text-white max-w-xs truncate">{b.title}</td>
                        <td className="py-2.5 px-3 text-[#ccfbf1]">{b.author || '-'}</td>
                        <td className="py-2.5 px-3 text-[#99f6e4]">{b.series || b.edition || '-'}</td>
                        <td className="py-2.5 px-3 text-[#99f6e4]">{b.volume || '-'}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.availability_status === 'موجود'
                              ? 'bg-emerald-950 text-[#a3e635] border border-[#84cc16]/30'
                              : 'bg-amber-950 text-amber-300 border border-amber-600/30'
                          }`}>
                            {b.availability_status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBookId(b.id);
                              setIsAddingBook(false);
                              setBookForm(b);
                            }}
                            className="p-1.5 rounded-lg bg-[#073834] text-[#a3e635] hover:bg-[#0d9488]/40"
                            title="ویرایش کامل"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'حذف قطعی کتاب',
                                message: `آیا از حذف قطعی کتاب «${b.title}» مطمئن هستید؟`,
                                confirmLabel: 'بله، کتاب حذف شود',
                                isDestructive: true,
                                onConfirm: async () => {
                                  await onDeleteBook(b.id);
                                  showSuccess(`کتاب «${b.title}» حذف گردید.`);
                                },
                              });
                            }}
                            className="p-1.5 rounded-lg bg-rose-950 text-rose-300 hover:bg-rose-900"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Books Pagination */}
              {filteredBooks.length > 0 && (
                <div className="pt-2 border-t border-[#0d9488]/30">
                  <PaginationControls
                    currentPage={booksPage}
                    totalItems={filteredBooks.length}
                    pageSize={booksPageSize}
                    onPageChange={setBooksPage}
                    onPageSizeChange={(newSize) => {
                      setBooksPageSize(newSize);
                      setBooksPage(1);
                    }}
                    pageSizeOptions={[10, 20, 30, 40, 50]}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: MESSAGES SYSTEM (Stage 11) */}
        {/* ========================================================= */}
        {activeTab === 'messages' && (
          <div className="p-6 rounded-3xl bg-[#073834]/80 border border-[#0d9488]/40 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-[#84cc16]">مرحله ۱۱ — سیستم ارتباط و پیام‌رسانی</span>
                <h3 className="text-xl font-black text-white mt-0.5">صندوق پیام‌ها و درخواست‌های اعضا</h3>
                <p className="text-xs text-[#99f6e4]">
                  پاسخ‌گویی مستقیم مدیریت به سوالات، درخواست‌های تهیه کتاب و نظرات کاربران
                </p>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteAllMessages}
                    className="px-3.5 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-800/50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    title="حذف کلیه پیام‌ها"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف همه پیام‌ها</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={fetchMessages}
                  className="p-2.5 rounded-xl bg-[#042f2e] text-[#99f6e4] hover:text-white border border-[#0d9488]/40"
                  title="بروزرسانی پیام‌ها"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loadingMessages ? (
              <p className="text-xs text-[#99f6e4] py-8 text-center">در حال بارگذاری پیام‌ها...</p>
            ) : messages.length === 0 ? (
              <p className="text-xs text-[#99f6e4] py-8 text-center">هیچ پیامی در صندوق دریافت نشده است.</p>
            ) : (
              <div className="space-y-4">
                {[...messages]
                  .sort((a, b) => {
                    const aPending = a.status !== 'پاسخ داده شده';
                    const bPending = b.status !== 'پاسخ داده شده';
                    if (aPending && !bPending) return -1;
                    if (!aPending && bPending) return 1;
                    return 0;
                  })
                  .slice((messagesPage - 1) * messagesPageSize, messagesPage * messagesPageSize)
                  .map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-[#042f2e] border border-[#0d9488]/40 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {m.status !== 'پاسخ داده شده' && (
                          <span className="relative flex h-2.5 w-2.5 shrink-0" title="پیام جدید نیازمند پاسخ">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-sm shadow-rose-500/50"></span>
                          </span>
                        )}
                        <strong className="text-white font-bold text-sm">{m.user_name}</strong>
                        <span className="text-[11px] text-[#99f6e4]">({toPersianDigits(m.user_phone)})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#99f6e4]">{toPersianDigits(m.created_at)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === 'پاسخ داده شده'
                            ? 'bg-emerald-950 text-[#a3e635] border border-[#84cc16]/30'
                            : 'bg-amber-950 text-amber-300 border border-amber-600/30'
                        }`}>
                          {m.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(m.id)}
                          className="text-rose-400 hover:text-rose-300 p-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60"
                          title="حذف پیام"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#073834] text-[#ccfbf1] leading-relaxed">
                      <strong className="block text-[#a3e635] mb-1 font-bold">{m.subject}</strong>
                      <p>{m.content}</p>
                    </div>

                    {/* Existing Admin Reply */}
                    {m.admin_reply && (
                      <div className="p-3.5 rounded-2xl bg-[#073834]/80 border border-[#84cc16]/50 text-[#a3e635] text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <strong className="block text-[11px] font-bold text-white">پاسخ ثبت‌شده مدیریت:</strong>
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(m.id)}
                            className="px-2.5 py-1 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 text-[10px] font-bold border border-rose-800/40 flex items-center gap-1 transition-colors"
                            title="حذف کامل این پیام پس از پاسخ"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>حذف پیام پس از پاسخ</span>
                          </button>
                        </div>
                        <p className="text-[#f0fdfa] leading-relaxed">{m.admin_reply}</p>
                      </div>
                    )}

                    {/* Inline Reply Form */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={replyTextMap[m.id] || ''}
                        onChange={(e) => setReplyTextMap({ ...replyTextMap, [m.id]: e.target.value })}
                        placeholder="متن پاسخ خود به این پیام را بنویسید..."
                        className="flex-1 px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs placeholder-[#99f6e4]/40"
                      />
                      <button
                        type="button"
                        disabled={sendingReplyId === m.id || !replyTextMap[m.id]?.trim()}
                        onClick={() => handleSendReply(m.id)}
                        className="px-4 py-2 rounded-xl bg-[#84cc16] hover:bg-[#a3e635] text-[#042f2e] font-black text-xs flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{sendingReplyId === m.id ? 'در حال ارسال...' : 'ثبت پاسخ'}</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Messages Pagination */}
                {messages.length > 0 && (
                  <div className="pt-3 border-t border-[#0d9488]/30">
                    <PaginationControls
                      currentPage={messagesPage}
                      totalItems={messages.length}
                      pageSize={messagesPageSize}
                      onPageChange={setMessagesPage}
                      onPageSizeChange={(newSize) => {
                        setMessagesPageSize(newSize);
                        setMessagesPage(1);
                      }}
                      pageSizeOptions={[10, 20, 30, 40, 50]}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: COMPETITIONS MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'competitions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#073834]/80 border border-[#0d9488]/40 shadow-xl">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-[#84cc16]" />
                  <span>مدیریت مسابقات کتابخوانی</span>
                </h3>
                <p className="text-xs text-[#99f6e4] mt-1">
                  تعریف مسابقات جدید، ویرایش پوستر، تاریخ، جوایز و لینک ورود به مسابقه یا ارسال پاسخ‌ها
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={fetchCompetitions}
                  className="px-3.5 py-2.5 rounded-xl bg-[#042f2e] text-[#99f6e4] hover:text-white border border-[#0d9488]/40 text-xs font-bold flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingCompetitions ? 'animate-spin' : ''}`} />
                  <span>بروزرسانی</span>
                </button>
                {competitions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteAllCompetitions}
                    className="px-3.5 py-2.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-800/50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    title="حذف کلیه مسابقات"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف همه مسابقات</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleOpenNewCompModal}
                  className="px-5 py-2.5 rounded-xl bg-[#84cc16] hover:bg-[#a3e635] text-[#042f2e] font-black text-xs flex items-center gap-2 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن مسابقه جدید</span>
                </button>
              </div>
            </div>

            {/* Competitions Cards */}
            {loadingCompetitions ? (
              <div className="p-12 text-center text-[#99f6e4] flex items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#84cc16]" />
                <span>در حال بارگذاری مسابقات...</span>
              </div>
            ) : competitions.length === 0 ? (
              <div className="p-12 rounded-3xl bg-[#073834]/60 border border-[#0d9488]/30 text-center space-y-4">
                <Trophy className="w-12 h-12 text-[#84cc16]/50 mx-auto" />
                <p className="text-[#ccfbf1] font-bold">هیچ مسابقه‌ای ثبت نشده است.</p>
                <button
                  type="button"
                  onClick={handleOpenNewCompModal}
                  className="px-4 py-2 rounded-xl bg-[#84cc16] text-[#042f2e] font-bold text-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>ایجاد اولین مسابقه</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {competitions.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-6 rounded-3xl bg-[#073834]/80 border-2 border-[#0d9488]/40 hover:border-[#84cc16]/50 shadow-xl flex flex-col justify-between space-y-4 transition-all"
                  >
                    <div className="space-y-3">
                      {/* Top badge & actions */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-black ${
                            comp.status === 'در حال برگزاری'
                              ? 'bg-[#84cc16] text-[#042f2e]'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {comp.status}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCompModal(comp)}
                            className="p-2 rounded-xl bg-[#042f2e] text-[#5eead4] hover:text-white border border-[#0d9488]/40 transition-colors"
                            title="ویرایش مسابقه"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCompetition(comp.id)}
                            className="p-2 rounded-xl bg-rose-950/40 text-rose-400 hover:text-rose-200 border border-rose-800/40 transition-colors"
                            title="حذف مسابقه"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Poster if available */}
                      {comp.poster_url && (
                        <div className="w-full h-40 rounded-2xl overflow-hidden bg-[#042f2e] border border-[#0d9488]/30 relative group">
                          <img
                            src={comp.poster_url}
                            alt={comp.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      <h4 className="text-lg font-black text-white">{comp.title}</h4>

                      {comp.book_title && (
                        <p className="text-xs text-[#a3e635] font-bold">
                          کتاب منبع: {comp.book_title}
                        </p>
                      )}

                      <p className="text-xs text-[#ccfbf1]/90 leading-relaxed line-clamp-3">
                        {comp.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#99f6e4] pt-2 border-t border-[#0d9488]/20">
                        {comp.start_date && (
                          <div className="flex items-center gap-1.5 bg-[#042f2e] px-2.5 py-1 rounded-lg border border-[#0d9488]/40">
                            <Calendar className="w-3.5 h-3.5 text-[#84cc16]" />
                            <span>شروع: <strong className="text-white">{toPersianDigits(comp.start_date)}</strong></span>
                          </div>
                        )}
                        {comp.end_date && (
                          <div className="flex items-center gap-1.5 bg-[#042f2e] px-2.5 py-1 rounded-lg border border-[#0d9488]/40">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            <span>مهلت: <strong className="text-white">{toPersianDigits(comp.end_date)}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Link preview */}
                      {comp.link_url && (
                        <div className="pt-2">
                          <a
                            href={comp.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-[#84cc16] hover:text-[#a3e635] hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="truncate max-w-xs">{comp.link_url}</span>
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleOpenRegistrantsModal(comp)}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#042f2e] hover:bg-[#0d9488]/30 border border-[#0d9488]/50 text-[#84cc16] hover:text-[#a3e635] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                      >
                        <Users className="w-4 h-4" />
                        <span>مشاهده اسامی افراد ثبت‌نام شده</span>
                      </button>
                    </div>

                    <div className="pt-3 border-t border-[#0d9488]/30 flex items-center justify-between text-xs">
                      <span className="text-stone-400 text-[11px]">شناسه: {comp.id}</span>
                      <button
                        type="button"
                        onClick={() => handleOpenEditCompModal(comp)}
                        className="text-[#84cc16] hover:underline font-bold text-xs flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>ویرایش جزئیات</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal for Add / Edit Competition */}
            {showCompModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
                <div className="relative w-full max-w-2xl bg-[#042f2e] border-2 border-[#0d9488]/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-right my-8 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-4 border-b border-[#0d9488]/30 mb-6">
                    <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-[#84cc16]" />
                      <span>{editingCompId ? 'ویرایش مسابقه کتابخوانی' : 'افزودن مسابقه جدید'}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowCompModal(false)}
                      className="p-1.5 rounded-xl bg-[#073834] text-stone-400 hover:text-white border border-[#0d9488]/30"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveCompetition} className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-xs font-bold text-[#99f6e4] mb-1">
                        عنوان مسابقه: <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={compForm.title || ''}
                        onChange={(e) => setCompForm({ ...compForm, title: e.target.value })}
                        placeholder="مثال: مسابقه بزرگ کتابخوانی «سلام بر ابراهیم»"
                        className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs placeholder-stone-500"
                      />
                    </div>

                    {/* Book title & status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#99f6e4] mb-1">
                          نام کتاب منبع:
                        </label>
                        <input
                          type="text"
                          value={compForm.book_title || ''}
                          onChange={(e) => setCompForm({ ...compForm, book_title: e.target.value })}
                          placeholder="مثال: سلام بر ابراهیم"
                          className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs placeholder-stone-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#99f6e4] mb-1">
                          وضعیت برگزاری:
                        </label>
                        <select
                          value={compForm.status || 'در حال برگزاری'}
                          onChange={(e) => setCompForm({ ...compForm, status: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                        >
                          <option value="در حال برگزاری">در حال برگزاری</option>
                          <option value="به زودی">به زودی</option>
                          <option value="پایان یافته">پایان یافته</option>
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-bold text-[#99f6e4] mb-1">
                        توضیحات و راهنمای شرکت در مسابقه: <span className="text-rose-400">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={compForm.description || ''}
                        onChange={(e) => setCompForm({ ...compForm, description: e.target.value })}
                        placeholder="اهداف مسابقه، نحوه آزمون و شرایط..."
                        className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs placeholder-stone-500"
                      />
                    </div>

                    {/* Poster Image URL and Upload */}
                    <div className="p-4 rounded-2xl bg-[#073834]/60 border border-[#0d9488]/40 space-y-3">
                      <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-[#84cc16]" />
                        <span>تصویر یا پوستر مسابقه:</span>
                      </label>
                      <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <input
                          type="text"
                          value={compForm.poster_url || ''}
                          onChange={(e) => setCompForm({ ...compForm, poster_url: e.target.value })}
                          placeholder="آدرس اینترنتی پوستر (URL) یا از دکمه آپلود استفاده کنید..."
                          className="w-full px-3 py-2 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white text-xs placeholder-stone-500"
                        />
                        <label className="shrink-0 px-4 py-2 rounded-xl bg-[#0d9488]/30 hover:bg-[#0d9488]/50 text-[#99f6e4] border border-[#0d9488]/50 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                          <FileUp className="w-4 h-4 text-[#84cc16]" />
                          <span>انتخاب فایل عکس</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCompPosterUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {compForm.poster_url && (
                        <div className="mt-2 flex items-center gap-3">
                          <img
                            src={compForm.poster_url}
                            alt="پیش‌نمایش پوستر"
                            className="w-20 h-20 object-cover rounded-xl border border-[#84cc16]/50"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setCompForm({ ...compForm, poster_url: '' })}
                            className="text-xs text-rose-400 hover:underline"
                          >
                            حذف تصویر پوستر
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Link URL for participation / test */}
                    <div>
                      <label className="block text-xs font-bold text-[#99f6e4] mb-1 flex items-center gap-1.5">
                        <Link className="w-3.5 h-3.5 text-[#84cc16]" />
                        <span>لینک مستقیم ورود به آزمون / صفحه مسابقه (اختیاری):</span>
                      </label>
                      <input
                        type="url"
                        value={compForm.link_url || ''}
                        onChange={(e) => setCompForm({ ...compForm, link_url: e.target.value })}
                        placeholder="مثال: https://eitaa.com/shahidKarbalailibrary یا لینک گوگل‌فرم/دیگر"
                        className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs placeholder-stone-500 dir-ltr text-left"
                      />
                    </div>

                    {/* Dates: Start Date & Deadline */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#99f6e4] mb-1">
                          تاریخ شروع:
                        </label>
                        <input
                          type="text"
                          value={compForm.start_date || ''}
                          onChange={(e) => setCompForm({ ...compForm, start_date: e.target.value })}
                          placeholder="۱۴۰۳/۰۱/۱۵"
                          className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#99f6e4] mb-1">
                          مهلت پایان:
                        </label>
                        <input
                          type="text"
                          value={compForm.end_date || ''}
                          onChange={(e) => setCompForm({ ...compForm, end_date: e.target.value })}
                          placeholder="۱۴۰۳/۰۲/۱۵"
                          className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                        />
                      </div>
                    </div>

                    {/* Prizes (newline separated) */}
                    <div>
                      <label className="block text-xs font-bold text-[#99f6e4] mb-1">
                        جوایز برگزیدگان (هر جایزه در یک خط):
                      </label>
                      <textarea
                        rows={3}
                        value={typeof compForm.prizes === 'string' ? compForm.prizes : (Array.isArray(compForm.prizes) ? compForm.prizes.join('\n') : '')}
                        onChange={(e) => setCompForm({ ...compForm, prizes: e.target.value })}
                        placeholder="کمک‌هزینه مشهد مقدس&#10;کارت هدیه ۵۰۰ هزار تومانی&#10;بسته کتاب نفیس"
                        className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs placeholder-stone-500"
                      />
                    </div>

                    {/* Submit buttons */}
                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#0d9488]/30">
                      <button
                        type="button"
                        onClick={() => setShowCompModal(false)}
                        className="px-4 py-2.5 rounded-xl bg-[#073834] text-stone-300 hover:text-white text-xs font-bold"
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingComp}
                        className="px-6 py-2.5 rounded-xl bg-[#84cc16] hover:bg-[#a3e635] text-[#042f2e] font-black text-xs shadow-lg disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {isSavingComp ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>در حال ثبت...</span>
                          </>
                        ) : (
                          <span>{editingCompId ? 'ثبت ویرایش مسابقه' : 'ایجاد مسابقه جدید'}</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal for Viewing Registrants & Export to Excel */}
            {selectedCompForRegistrants && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
                <div className="relative w-full max-w-4xl bg-[#042f2e] border-2 border-[#0d9488]/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-right my-8 max-h-[90vh] flex flex-col">
                  <div className="flex items-center justify-between pb-4 border-b border-[#0d9488]/30 mb-4 shrink-0">
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-[#84cc16]" />
                        <span>اسامی شرکت‌کنندگان مسابقه «{selectedCompForRegistrants.title}»</span>
                      </h3>
                      <p className="text-xs text-[#99f6e4] mt-1">
                        تعداد کل افراد ثبت‌نام شده:{' '}
                        <span className="font-bold text-white text-sm">{toPersianDigits(compRegistrants.length)}</span> نفر
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCompForRegistrants(null)}
                      className="p-1.5 rounded-xl bg-[#073834] text-stone-400 hover:text-white border border-[#0d9488]/30 transition-colors"
                      title="بستن پنجره"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Actions & Search */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 shrink-0">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-[#99f6e4] absolute right-3 top-2.5" />
                      <input
                        type="text"
                        value={registrantSearch}
                        onChange={(e) => setRegistrantSearch(e.target.value)}
                        placeholder="جستجو بر اساس نام، تلفن، واحد یا کتاب..."
                        className="w-full pl-3 pr-9 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs placeholder-stone-400"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleExportRegistrantsExcel(selectedCompForRegistrants, compRegistrants)}
                      disabled={compRegistrants.length === 0}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#84cc16] hover:bg-[#a3e635] disabled:opacity-50 text-[#042f2e] font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>خروجی اکسل شرکت‌کنندگان (.csv)</span>
                    </button>
                  </div>

                  {/* Registrants Table */}
                  <div className="flex-1 overflow-y-auto rounded-2xl border border-[#0d9488]/30 bg-[#073834]/60">
                    {loadingRegistrants ? (
                      <div className="p-12 text-center text-[#99f6e4] flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-[#84cc16]" />
                        <span>در حال دریافت لیست شرکت‌کنندگان...</span>
                      </div>
                    ) : compRegistrants.length === 0 ? (
                      <div className="p-12 text-center text-sm text-[#99f6e4]">
                        هنوز فردی در این مسابقه ثبت‌نام نکرده است.
                      </div>
                    ) : (
                      <table className="w-full text-right text-xs">
                        <thead className="sticky top-0 bg-[#042f2e] border-b border-[#0d9488]/40 text-[#a3e635]">
                          <tr>
                            <th className="py-3 px-3">ردیف</th>
                            <th className="py-3 px-3">نام و نام خانوادگی</th>
                            <th className="py-3 px-3">شماره تماس</th>
                            <th className="py-3 px-3">واحد ثبت‌نامی</th>
                            <th className="py-3 px-3">کتاب انتخابی</th>
                            <th className="py-3 px-3">تاریخ ثبت‌نام</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#0d9488]/20">
                          {(() => {
                            const filtered = compRegistrants.filter((r) => {
                              if (!registrantSearch) return true;
                              const q = registrantSearch.toLowerCase();
                              return (
                                r.full_name.toLowerCase().includes(q) ||
                                r.phone.includes(q) ||
                                (r.unit && r.unit.toLowerCase().includes(q)) ||
                                (r.selected_book && r.selected_book.toLowerCase().includes(q))
                              );
                            });
                            return filtered
                              .slice((registrantsPage - 1) * registrantsPageSize, registrantsPage * registrantsPageSize)
                              .map((r, idx) => {
                                const realIdx = (registrantsPage - 1) * registrantsPageSize + idx;
                                return (
                                  <tr key={r.id || realIdx} className="hover:bg-[#042f2e]/60 transition-colors">
                                    <td className="py-2.5 px-3 text-[#99f6e4] font-bold">{toPersianDigits(realIdx + 1)}</td>
                                    <td className="py-2.5 px-3 font-bold text-white">{r.full_name}</td>
                                    <td className="py-2.5 px-3 text-[#5eead4] dir-ltr text-right">{toPersianDigits(r.phone)}</td>
                                    <td className="py-2.5 px-3">
                                      <span className="px-2 py-0.5 rounded-full bg-[#042f2e] text-[#a3e635] text-[10px] font-bold border border-[#0d9488]/30">
                                        {r.unit || 'عموم مردم'}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-[#ccfbf1]">{r.selected_book || '-'}</td>
                                    <td className="py-2.5 px-3 text-stone-300 text-[11px]">{toPersianDigits(r.registered_at)}</td>
                                  </tr>
                                );
                              });
                          })()}
                        </tbody>
                      </table>
                    )}

                    {/* Registrants Pagination */}
                    {compRegistrants.length > 0 && (
                      <div className="pt-3 border-t border-[#0d9488]/30">
                        <PaginationControls
                          currentPage={registrantsPage}
                          totalItems={
                            compRegistrants.filter((r) => {
                              if (!registrantSearch) return true;
                              const q = registrantSearch.toLowerCase();
                              return (
                                r.full_name.toLowerCase().includes(q) ||
                                r.phone.includes(q) ||
                                (r.unit && r.unit.toLowerCase().includes(q)) ||
                                (r.selected_book && r.selected_book.toLowerCase().includes(q))
                              );
                            }).length
                          }
                          pageSize={registrantsPageSize}
                          onPageChange={setRegistrantsPage}
                          onPageSizeChange={(newSize) => {
                            setRegistrantsPageSize(newSize);
                            setRegistrantsPage(1);
                          }}
                          pageSizeOptions={[10, 20, 30, 40, 50]}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: USERS & MEMBERS MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#073834]/80 border border-[#0d9488]/40 shadow-xl">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-[#84cc16]" />
                  <span>اطلاعات اعضا و کاربران کتابخانه</span>
                </h3>
                <p className="text-xs text-[#99f6e4] mt-1">
                  مشاهده مشخصات کاربران ثبت‌نامی، وضعیت اشتراک امانت، امانت‌های جاری و امکان دریافت خروجی اکسل کامل
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={fetchUsersList}
                  className="px-3.5 py-2.5 rounded-xl bg-[#042f2e] text-[#99f6e4] hover:text-white border border-[#0d9488]/40 text-xs font-bold flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                  <span>بروزرسانی</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportUsersExcel}
                  disabled={usersList.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-[#84cc16] hover:bg-[#a3e635] disabled:opacity-50 text-[#042f2e] font-black text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>خروجی اکسل کاربران (.csv)</span>
                </button>
              </div>
            </div>

            {/* Quick stats and Search */}
            <div className="p-6 rounded-3xl bg-[#073834]/80 border border-[#0d9488]/40 shadow-xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#042f2e] border border-[#0d9488]/30">
                  <span className="text-xs text-[#99f6e4] block">کل اعضای ثبت‌نام شده:</span>
                  <strong className="text-2xl font-black text-white mt-1 block">
                    {toPersianDigits(usersList.length)} <span className="text-xs font-normal text-[#99f6e4]">نفر</span>
                  </strong>
                </div>
                <div className="p-4 rounded-2xl bg-[#042f2e] border border-[#0d9488]/30">
                  <span className="text-xs text-[#99f6e4] block">دارای اشتراک امانت کتاب:</span>
                  <strong className="text-2xl font-black text-[#a3e635] mt-1 block">
                    {toPersianDigits(usersList.filter((u) => u.has_lending_subscription).length)} <span className="text-xs font-normal text-[#99f6e4]">عضو</span>
                  </strong>
                </div>
                <div className="p-4 rounded-2xl bg-[#042f2e] border border-[#0d9488]/30">
                  <span className="text-xs text-[#99f6e4] block">امانت‌های فعال جاری:</span>
                  <strong className="text-2xl font-black text-[#5eead4] mt-1 block">
                    {toPersianDigits(reservations.filter((r) => r.status === 'امانت فعال').length)} <span className="text-xs font-normal text-[#99f6e4]">جلد</span>
                  </strong>
                </div>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#99f6e4] absolute right-3.5 top-3" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="جستجوی کاربر بر اساس نام، نام خانوادگی، شماره تماس..."
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white text-xs placeholder-stone-400 focus:outline-none focus:border-[#84cc16]"
                />
              </div>

              {/* Users table */}
              <div className="overflow-x-auto rounded-2xl border border-[#0d9488]/30 bg-[#042f2e]/60">
                {loadingUsers ? (
                  <div className="p-12 text-center text-[#99f6e4] flex items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#84cc16]" />
                    <span>در حال بارگذاری لیست کاربران...</span>
                  </div>
                ) : usersList.length === 0 ? (
                  <div className="p-12 text-center text-sm text-[#99f6e4]">
                    هیچ کاربری یافت نشد.
                  </div>
                ) : (
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-[#0d9488]/40 text-[#a3e635] bg-[#042f2e]">
                        <th className="py-3 px-3">ردیف</th>
                        <th className="py-3 px-3">نام و نام خانوادگی (الفبا)</th>
                        <th className="py-3 px-3">شماره تماس</th>
                        <th className="py-3 px-3">وضعیت حساب</th>
                        <th className="py-3 px-3">اشتراک امانت</th>
                        <th className="py-3 px-3">امانت‌های جاری</th>
                        <th className="py-3 px-3">کل رزروها</th>
                        <th className="py-3 px-3">تاریخ ثبت‌نام</th>
                        <th className="py-3 px-3 text-center">مدیریت کاربر</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0d9488]/20">
                      {(() => {
                        const filtered = sortedUsersList.filter((u) => {
                          if (!userSearchQuery) return true;
                          const q = userSearchQuery.toLowerCase();
                          return (
                            (u.name && u.name.toLowerCase().includes(q)) ||
                            (u.family && u.family.toLowerCase().includes(q)) ||
                            (u.phone && u.phone.includes(q))
                          );
                        });
                        return filtered
                          .slice((usersPage - 1) * usersPageSize, usersPage * usersPageSize)
                          .map((u, idx) => {
                            const realIdx = (usersPage - 1) * usersPageSize + idx;
                            return (
                              <tr key={u.id || u.phone || realIdx} className="hover:bg-[#073834] transition-colors">
                                <td className="py-3 px-3 text-[#99f6e4] font-bold">{toPersianDigits(realIdx + 1)}</td>
                                <td className="py-3 px-3 font-bold text-white">
                                  <div className="flex items-center gap-1.5">
                                    <span>{u.name} {u.family}</span>
                                    {u.is_blocked && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-950 text-rose-300 border border-rose-600/40">
                                        مسدود
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-[#5eead4] dir-ltr text-right">{toPersianDigits(u.phone)}</td>
                                <td className="py-3 px-3">
                                  {u.is_blocked ? (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-600/50 flex items-center gap-1 w-fit">
                                      <ShieldAlert className="w-3 h-3 text-rose-400" />
                                      <span>مسدود (تخلف)</span>
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 text-[#a3e635] border border-emerald-500/40 flex items-center gap-1 w-fit">
                                      <CheckCircle className="w-3 h-3 text-[#a3e635]" />
                                      <span>فعال</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  {u.has_lending_subscription ? (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-[#a3e635] border border-[#84cc16]/40">
                                      ✓ اشتراک فعال
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] text-[#99f6e4]/60 bg-[#073834] border border-[#0d9488]/20">
                                      عادی
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  <span className="font-bold text-white">{toPersianDigits(u.active_loans_count || 0)}</span> جلد
                                </td>
                                <td className="py-3 px-3">
                                  <span className="text-[#99f6e4]">{toPersianDigits(u.total_reservations || 0)}</span> مورد
                                </td>
                                <td className="py-3 px-3 text-stone-300 text-[11px]">{toPersianDigits(u.registered_at || '-')}</td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                    {u.is_blocked ? (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleBlockUser(u)}
                                        className="px-2.5 py-1.5 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/50 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                        title="رفع مسدودی حساب کاربری"
                                      >
                                        <CheckCircle className="w-3.5 h-3.5 text-[#a3e635]" />
                                        <span>رفع مسدودی</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleBlockUser(u)}
                                        className="px-2.5 py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900 text-amber-200 border border-amber-500/50 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                        title="مسدود سازی حساب به دلیل تخلف"
                                      >
                                        <Ban className="w-3.5 h-3.5 text-amber-400" />
                                        <span>مسدود سازی</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(u)}
                                      className="px-2.5 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-500/50 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                      title="حذف کامل کاربر از سامانه (نیاز به ثبت‌نام مجدد)"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                      <span>حذف کاربر</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          });
                      })()}
                    </tbody>
                  </table>
                )}

                {/* Users Pagination */}
                {usersList.length > 0 && (
                  <div className="pt-3 border-t border-[#0d9488]/30">
                    <PaginationControls
                      currentPage={usersPage}
                      totalItems={
                        sortedUsersList.filter((u) => {
                          if (!userSearchQuery) return true;
                          const q = userSearchQuery.toLowerCase();
                          return (
                            (u.name && u.name.toLowerCase().includes(q)) ||
                            (u.family && u.family.toLowerCase().includes(q)) ||
                            (u.phone && u.phone.includes(q))
                          );
                        }).length
                      }
                      pageSize={usersPageSize}
                      onPageChange={setUsersPage}
                      onPageSizeChange={(newSize) => {
                        setUsersPageSize(newSize);
                        setUsersPage(1);
                      }}
                      pageSizeOptions={[10, 20, 50, 100, 200, 500]}
                      itemLabel="کاربر"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: FEATURED BOOKS CMS (معرفی کتاب) */}
        {/* ========================================================= */}
        {activeTab === 'featured' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#073834]/80 border border-[#0d9488]/40 shadow-xl">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-[#84cc16]" />
                  <span>مدیریت معرفی کتاب</span>
                </h3>
                <p className="text-xs text-[#99f6e4] mt-1">
                  مدیریت کتاب‌های شاخص همراه با گزیده، داستان کتاب، عکس جلد با قابلیت افزودن، ویرایش و حذف نامحدود
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingFeaturedSlot(selectedFeatured.length);
                  setFeaturedSearchQuery('');
                  setFeaturedForm({
                    id: '',
                    title: '',
                    author: '',
                    description: '',
                    excerpt: '',
                    story: '',
                    cover_image: '',
                  });
                }}
                className="px-4 py-2.5 rounded-xl bg-[#84cc16] hover:bg-[#a3e635] text-[#042f2e] font-black text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن کتاب معرفی جدید</span>
              </button>
            </div>

            {/* Empty state when no books are defined */}
            {selectedFeatured.length === 0 ? (
              <div className="p-12 rounded-3xl bg-[#073834]/80 border-2 border-dashed border-[#0d9488]/40 text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-[#042f2e] border border-[#0d9488]/50 text-[#84cc16] flex items-center justify-center mx-auto">
                  <BookOpen className="w-8 h-8 opacity-70" />
                </div>
                <h4 className="text-lg font-black text-white">کتابی برای معرفی تعریف نشده است</h4>
                <p className="text-xs text-[#ccfbf1]/80 max-w-md mx-auto leading-relaxed">
                  در حال حاضر هیچ کتابی در بخش معرفی قرار نگرفته است. با زدن دکمه زیر می‌توانید کتاب معرفی جدید اضافه کنید.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingFeaturedSlot(0);
                    setFeaturedSearchQuery('');
                    setFeaturedForm({
                      id: '',
                      title: '',
                      author: '',
                      description: '',
                      excerpt: '',
                      story: '',
                      cover_image: '',
                    });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#84cc16] hover:bg-[#a3e635] text-[#042f2e] font-black text-xs inline-flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن اولین کتاب معرفی</span>
                </button>
              </div>
            ) : (
              /* The Featured Books Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedFeatured.map((bookId, slotIndex) => {
                  const slotBook = books.find((b) => b.id === bookId);
                  return (
                    <div
                      key={bookId || slotIndex}
                      className="p-6 rounded-3xl bg-[#073834]/80 border-2 border-[#0d9488]/40 hover:border-[#84cc16]/50 shadow-xl flex flex-col justify-between space-y-4 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-[#84cc16] text-[#042f2e]">
                            کتاب معرفی شماره {toPersianDigits(slotIndex + 1)}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingFeaturedSlot(slotIndex);
                                setFeaturedSearchQuery('');
                                if (slotBook) {
                                  setFeaturedForm({
                                    id: slotBook.id,
                                    title: slotBook.title || '',
                                    author: slotBook.author || '',
                                    description: slotBook.description || '',
                                    excerpt: slotBook.excerpt || slotBook.description || '',
                                    story: slotBook.story || slotBook.description || '',
                                    cover_image: slotBook.cover_image || '',
                                  });
                                } else {
                                  setFeaturedForm({
                                    title: '',
                                    author: '',
                                    description: '',
                                    excerpt: '',
                                    story: '',
                                    cover_image: '',
                                  });
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#042f2e] hover:bg-[#84cc16] text-[#84cc16] hover:text-[#042f2e] border border-[#84cc16]/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>ویرایش</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'حذف کتاب معرفی',
                                  message: `آیا از حذف کتاب «${slotBook?.title || `شماره ${toPersianDigits(slotIndex + 1)}`}» از بخش معرفی کتابخانه اطمینان دارید؟`,
                                  confirmLabel: 'بله، حذف شود',
                                  isDestructive: true,
                                  onConfirm: async () => {
                                    const nextFeatured = selectedFeatured.filter((_, idx) => idx !== slotIndex);
                                    setSelectedFeatured(nextFeatured);
                                    await onUpdateFeaturedBooks(nextFeatured);
                                    showSuccess('کتاب با موفقیت از بخش معرفی حذف شد.');
                                  },
                                });
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-800/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف</span>
                            </button>
                          </div>
                        </div>

                        {/* Book Cover and Info */}
                        <div className="flex gap-4 items-start pt-2">
                          {slotBook?.cover_image ? (
                            <img
                              src={slotBook.cover_image}
                              alt={slotBook.title}
                              className="w-24 h-32 object-cover rounded-xl border border-[#0d9488]/40 shadow-md shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-24 h-32 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 flex items-center justify-center text-[#99f6e4] shrink-0">
                              <BookOpen className="w-8 h-8 opacity-60 text-[#84cc16]" />
                            </div>
                          )}

                          <div className="space-y-1.5 flex-1 min-w-0">
                            <h4 className="text-base font-black text-white line-clamp-2">
                              {slotBook?.title || `کتاب معرفی شماره ${toPersianDigits(slotIndex + 1)}`}
                            </h4>
                            <p className="text-xs text-[#a3e635] font-semibold">
                              نویسنده: {slotBook?.author || 'نامشخص'}
                            </p>
                            {slotBook?.shelf && (
                              <span className="inline-block text-[11px] text-[#5eead4]">
                                قفسه {toPersianDigits(slotBook.shelf)} / ردیف {toPersianDigits(slotBook.row_number || 1)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Excerpt */}
                        <div className="p-3 rounded-2xl bg-[#042f2e]/70 border border-[#0d9488]/20 space-y-1">
                          <span className="text-[11px] font-bold text-[#99f6e4] block">گزیده کتاب:</span>
                          <p className="text-xs text-[#ccfbf1]/90 leading-relaxed line-clamp-3">
                            {slotBook?.excerpt || slotBook?.description || 'هنوز گزیده‌ای ثبت نشده است.'}
                          </p>
                        </div>

                        {/* Story / Part of book */}
                        <div className="p-3 rounded-2xl bg-[#042f2e]/70 border border-[#0d9488]/20 space-y-1">
                          <span className="text-[11px] font-bold text-[#84cc16] block">بخشی از کتاب / داستان اثر:</span>
                          <p className="text-xs text-[#ccfbf1]/90 leading-relaxed line-clamp-3">
                            {slotBook?.story || 'هنوز بخشی از متن اثر ثبت نشده است.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Modal for editing/adding featured book with search & autofill from catalog */}
            {editingFeaturedSlot !== null && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
                <div className="relative w-full max-w-2xl bg-[#042f2e] border-2 border-[#0d9488]/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-right my-8 max-h-[90vh] overflow-y-auto space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-[#0d9488]/30">
                    <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-[#84cc16]" />
                      <span>
                        {editingFeaturedSlot < selectedFeatured.length
                          ? `ویرایش کتاب معرفی شماره ${toPersianDigits(editingFeaturedSlot + 1)}`
                          : `افزودن کتاب معرفی شماره ${toPersianDigits(editingFeaturedSlot + 1)}`}
                      </span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingFeaturedSlot(null)}
                      className="p-1.5 rounded-xl bg-[#073834] text-stone-400 hover:text-white border border-[#0d9488]/30"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Search in catalog to autofill */}
                  <div className="p-4 rounded-2xl bg-[#073834] border border-[#84cc16]/40 space-y-2">
                    <label className="block text-xs font-bold text-[#84cc16] flex items-center gap-1.5">
                      <Search className="w-4 h-4" />
                      <span>وارد کردن سریع اطلاعات از کاتالوگ کتابخانه (جستجوی کتاب):</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={featuredSearchQuery}
                        onChange={(e) => setFeaturedSearchQuery(e.target.value)}
                        placeholder="نام کتاب یا نویسنده را تایپ کنید تا خودکار پر شود..."
                        className="w-full px-3 py-2 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white text-xs placeholder-stone-400"
                      />
                    </div>

                    {/* Autocomplete list */}
                    {featuredSearchQuery.trim().length > 1 && (
                      <div className="mt-2 max-h-40 overflow-y-auto rounded-xl bg-[#042f2e] border border-[#0d9488]/40 divide-y divide-[#0d9488]/20">
                        {books
                          .filter((b) =>
                            b.title.toLowerCase().includes(featuredSearchQuery.toLowerCase()) ||
                            b.author.toLowerCase().includes(featuredSearchQuery.toLowerCase())
                          )
                          .slice(0, 5)
                          .map((b) => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => {
                                setFeaturedForm({
                                  id: b.id,
                                  title: b.title,
                                  author: b.author,
                                  description: b.description || '',
                                  excerpt: b.excerpt || b.description || '',
                                  story: b.story || b.description || '',
                                  cover_image: b.cover_image || '',
                                });
                                setFeaturedSearchQuery('');
                                showSuccess(`اطلاعات کتاب «${b.title}» بارگذاری شد.`);
                              }}
                              className="w-full p-2.5 text-right hover:bg-[#073834] flex items-center justify-between text-xs transition-colors cursor-pointer"
                            >
                              <div>
                                <strong className="text-white block">{b.title}</strong>
                                <span className="text-[11px] text-[#99f6e4]">{b.author} (قفسه {toPersianDigits(b.shelf)})</span>
                              </div>
                              <span className="text-[10px] text-[#84cc16] font-bold">انتخاب و درج ↵</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!featuredForm.title || !featuredForm.author) {
                        showError('نام کتاب و نویسنده الزامی هستند.');
                        return;
                      }
                      try {
                        let bId = featuredForm.id;
                        if (bId && books.some((b) => b.id === bId)) {
                          await onUpdateBook(bId, {
                            title: featuredForm.title,
                            author: featuredForm.author,
                            description: featuredForm.description || featuredForm.excerpt,
                            excerpt: featuredForm.excerpt,
                            story: featuredForm.story,
                            cover_image: featuredForm.cover_image,
                          });
                        } else {
                          bId = bId || `featured-book-${Date.now()}`;
                          await onAddBook({
                            id: bId,
                            title: featuredForm.title,
                            author: featuredForm.author,
                            description: featuredForm.description || featuredForm.excerpt,
                            excerpt: featuredForm.excerpt,
                            story: featuredForm.story,
                            cover_image: featuredForm.cover_image,
                            shelf: 1,
                            row_number: 1,
                            availability_status: 'موجود',
                          });
                        }

                        const nextFeatured = [...selectedFeatured];
                        if (editingFeaturedSlot !== null) {
                          if (editingFeaturedSlot >= nextFeatured.length) {
                            nextFeatured.push(bId);
                          } else {
                            nextFeatured[editingFeaturedSlot] = bId;
                          }
                        }
                        const dedupedFeatured = Array.from(new Set(nextFeatured));
                        setSelectedFeatured(dedupedFeatured);
                        await onUpdateFeaturedBooks(dedupedFeatured);

                        showSuccess('اطلاعات کتاب با موفقیت ذخیره و در بخش معرفی قرار گرفت.');
                        setEditingFeaturedSlot(null);
                      } catch {
                        showError('خطا در ذخیره اطلاعات کتاب');
                      }
                    }}
                    className="space-y-4"
                  >
                    {/* Cover image upload / URL */}
                    <div className="p-4 rounded-2xl bg-[#073834]/60 border border-[#0d9488]/40 space-y-3">
                      <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-[#84cc16]" />
                        <span>عکس جلد کتاب:</span>
                      </label>
                      <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <input
                          type="text"
                          value={featuredForm.cover_image || ''}
                          onChange={(e) => setFeaturedForm({ ...featuredForm, cover_image: e.target.value })}
                          placeholder="آدرس تصویر (URL) یا از دکمه آپلود استفاده نمایید..."
                          className="w-full px-3 py-2 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white text-xs placeholder-stone-500"
                        />
                        <label className="shrink-0 px-4 py-2 rounded-xl bg-[#0d9488]/30 hover:bg-[#0d9488]/50 text-[#99f6e4] border border-[#0d9488]/50 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                          <FileUp className="w-4 h-4 text-[#84cc16]" />
                          <span>انتخاب فایل عکس</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 10 * 1024 * 1024) {
                                  showError('حجم فایل تصویر نباید بیشتر از ۱۰ مگابایت باشد.');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                  const base64 = evt.target?.result as string;
                                  setCropModal({
                                    isOpen: true,
                                    imageSrc: base64,
                                    title: 'برش و تنظیم ابعاد جلد کتاب معرفی (پیش‌فرض ۱:۱ همراه با حاشیه محو خودکار)',
                                    initialAspect: '1:1',
                                    target: 'featured',
                                  });
                                };
                                reader.readAsDataURL(file);
                                e.target.value = '';
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {featuredForm.cover_image && (
                        <div className="mt-2 flex items-center gap-3">
                          <img
                            src={featuredForm.cover_image}
                            alt="پیش‌نمایش جلد"
                            className="w-16 h-20 object-cover rounded-xl border border-[#84cc16]/50 shadow"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setFeaturedForm({ ...featuredForm, cover_image: '' })}
                            className="text-xs text-rose-400 hover:underline"
                          >
                            حذف تصویر جلد
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Book title & author */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#99f6e4] mb-1">
                          نام کتاب: <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={featuredForm.title || ''}
                          onChange={(e) => setFeaturedForm({ ...featuredForm, title: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#99f6e4] mb-1">
                          نام نویسنده: <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={featuredForm.author || ''}
                          onChange={(e) => setFeaturedForm({ ...featuredForm, author: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                        />
                      </div>
                    </div>

                    {/* Excerpt */}
                    <div>
                      <label className="block text-xs font-bold text-[#99f6e4] mb-1">
                        گزیده و معرفی کوتاه کتاب:
                      </label>
                      <textarea
                        rows={3}
                        value={featuredForm.excerpt || ''}
                        onChange={(e) => setFeaturedForm({ ...featuredForm, excerpt: e.target.value })}
                        placeholder="متن کوتاه معرفی کتاب جهت ترغیب مخاطب..."
                        className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                      />
                    </div>

                    {/* Story / Part of book */}
                    <div>
                      <label className="block text-xs font-bold text-[#99f6e4] mb-1">
                        بخشی از کتاب (داستان اثر یا فرازی از متن):
                      </label>
                      <textarea
                        rows={4}
                        value={featuredForm.story || ''}
                        onChange={(e) => setFeaturedForm({ ...featuredForm, story: e.target.value })}
                        placeholder="فرازی جذاب از متن کتاب یا داستان کوتاه آن..."
                        className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                      />
                    </div>

                    {/* Submit buttons */}
                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#0d9488]/30">
                      <button
                        type="button"
                        onClick={() => setEditingFeaturedSlot(null)}
                        className="px-4 py-2.5 rounded-xl bg-[#073834] text-stone-300 hover:text-white text-xs font-bold cursor-pointer"
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-[#84cc16] hover:bg-[#a3e635] text-[#042f2e] font-black text-xs shadow-lg cursor-pointer"
                      >
                        ذخیره تغییرات کتاب معرفی
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: FAQ MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'faq' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#073834]/80 border border-[#0d9488]/40 shadow-xl">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-[#84cc16]" />
                  <span>مدیریت سؤالات متداول (FAQ)</span>
                </h3>
                <p className="text-xs text-[#99f6e4] mt-1">
                  مشاهده، ویرایش، حذف و افزودن سؤالات و پاسخ‌های متداول کاربران کتابخانه
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={fetchFaqsList}
                  className="px-3.5 py-2.5 rounded-xl bg-[#042f2e] text-[#99f6e4] hover:text-white border border-[#0d9488]/40 text-xs font-bold flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>بروزرسانی</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingFaqId(null);
                    setFaqForm({
                      category: 'عضویت و اشتراک',
                      question: '',
                      answer: '',
                      published: true,
                    });
                    setShowFaqModal(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#84cc16] hover:bg-[#a3e635] text-[#042f2e] font-black text-xs flex items-center gap-2 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن سؤال متداول جدید</span>
                </button>
              </div>
            </div>

            {/* Filter and Search */}
            <div className="p-6 rounded-3xl bg-[#073834]/80 border border-[#0d9488]/40 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[#99f6e4] absolute right-3.5 top-3" />
                  <input
                    type="text"
                    value={faqSearchQuery}
                    onChange={(e) => setFaqSearchQuery(e.target.value)}
                    placeholder="جستجو در سؤالات یا پاسخ‌ها..."
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white text-xs placeholder-stone-400 focus:outline-none focus:border-[#84cc16]"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
                  {['all', ...CANONICAL_FAQ_CATEGORIES].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFaqCategoryFilter(cat)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        faqCategoryFilter === cat
                          ? 'bg-[#84cc16] text-[#042f2e]'
                          : 'bg-[#042f2e] text-[#99f6e4] hover:bg-[#0d9488]/20'
                      }`}
                    >
                      {cat === 'all' ? 'همه دسته‌ها' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQ Cards */}
              <div className="space-y-3">
                {adminFaqs
                  .filter((f) => {
                    const normCat = (c: string) => (c || '').replace(/[\u200c\u200b]/g, ' ').replace(/\s+/g, ' ').trim();
                    const matchesCat = faqCategoryFilter === 'all' || normCat(f.category) === normCat(faqCategoryFilter);
                    const q = faqSearchQuery.toLowerCase();
                    const matchesSearch = !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
                    return matchesCat && matchesSearch;
                  })
                  .map((faq) => (
                    <div
                      key={faq.id}
                      className="p-5 rounded-2xl bg-[#042f2e] border border-[#0d9488]/30 hover:border-[#84cc16]/40 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#073834] text-[#a3e635] border border-[#84cc16]/30">
                            {faq.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-[#84cc16] shrink-0" />
                          <span>{faq.question}</span>
                        </h4>
                        <p className="text-xs text-[#ccfbf1]/90 leading-relaxed pl-6">
                          {faq.answer}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFaqId(faq.id);
                            setFaqForm({
                              category: faq.category,
                              question: faq.question,
                              answer: faq.answer,
                              published: faq.published !== false,
                            });
                            setShowFaqModal(true);
                          }}
                          className="p-2 rounded-xl bg-[#073834] text-[#5eead4] hover:text-white border border-[#0d9488]/40 transition-colors"
                          title="ویرایش این سؤال"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: 'حذف سؤال متداول',
                              message: `آیا از حذف سؤال «${faq.question}» اطمینان دارید؟`,
                              confirmLabel: 'بله، حذف شود',
                              isDestructive: true,
                              onConfirm: async () => {
                                // Optimistic update
                                setAdminFaqs((prev) => prev.filter((item) => item.id !== faq.id));
                                try {
                                  const res = await fetch(`/api/faq/${faq.id}`, { method: 'DELETE' });
                                  const data = await res.json();
                                  if (data.success) {
                                    showSuccess('سؤال متداول با موفقیت حذف شد.');
                                    fetchFaqsList();
                                    onRefreshData();
                                  } else {
                                    showError(data.message || 'خطا در حذف');
                                    fetchFaqsList();
                                  }
                                } catch {
                                  showError('خطا در برقراری ارتباط');
                                  fetchFaqsList();
                                }
                              },
                            });
                          }}
                          className="p-2 rounded-xl bg-rose-950/40 text-rose-400 hover:text-rose-200 border border-rose-800/40 transition-colors"
                          title="حذف سؤال"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Modal for Add / Edit FAQ */}
            {showFaqModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
                <div className="relative w-full max-w-lg bg-[#042f2e] border-2 border-[#0d9488]/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-right my-8 max-h-[90vh] overflow-y-auto space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-[#0d9488]/30">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <HelpCircle className="w-6 h-6 text-[#84cc16]" />
                      <span>{editingFaqId ? 'ویرایش سؤال متداول' : 'افزودن سؤال متداول جدید'}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowFaqModal(false)}
                      className="p-1.5 rounded-xl bg-[#073834] text-stone-400 hover:text-white border border-[#0d9488]/30"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!faqForm.question || !faqForm.answer) {
                        showError('عنوان سؤال و متن پاسخ الزامی هستند.');
                        return;
                      }
                      try {
                        if (editingFaqId) {
                          setAdminFaqs((prev) => prev.map((item) => (item.id === editingFaqId ? { ...item, ...faqForm } : item)));
                          const res = await fetch(`/api/faq/${editingFaqId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(faqForm),
                          });
                          const data = await res.json();
                          if (data.success) {
                            showSuccess('سؤال متداول با موفقیت ویرایش شد.');
                            setShowFaqModal(false);
                            fetchFaqsList();
                            onRefreshData();
                          } else {
                            showError(data.message || 'خطا در ویرایش');
                            fetchFaqsList();
                          }
                        } else {
                          const res = await fetch('/api/faq', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(faqForm),
                          });
                          const data = await res.json();
                          if (data.success) {
                            if (data.faq) {
                              setAdminFaqs((prev) => [...prev, data.faq]);
                            }
                            showSuccess('سؤال متداول جدید ایجاد شد.');
                            setShowFaqModal(false);
                            fetchFaqsList();
                            onRefreshData();
                          } else {
                            showError(data.message || 'خطا در ایجاد');
                          }
                        }
                      } catch {
                        showError('خطا در برقراری ارتباط با سرور');
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-bold text-[#99f6e4] mb-1">
                        دسته‌بندی سؤال:
                      </label>
                      <select
                        value={faqForm.category}
                        onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs font-bold"
                      >
                        {CANONICAL_FAQ_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#99f6e4] mb-1">
                        متن سؤال: <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={faqForm.question}
                        onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                        placeholder="مثال: هزینه اشتراک سالانه امانت کتاب چقدر است؟"
                        className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#99f6e4] mb-1">
                        متن کامل پاسخ: <span className="text-rose-400">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={faqForm.answer}
                        onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                        placeholder="پاسخ کامل و شفاف به سؤال کاربر..."
                        className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                      />
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#0d9488]/30">
                      <button
                        type="button"
                        onClick={() => setShowFaqModal(false)}
                        className="px-4 py-2.5 rounded-xl bg-[#073834] text-stone-300 hover:text-white text-xs font-bold"
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-[#84cc16] hover:bg-[#a3e635] text-[#042f2e] font-black text-xs shadow-lg"
                      >
                        {editingFaqId ? 'ثبت ویرایش سؤال' : 'ایجاد سؤال جدید'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: HOURS AND NOTICE & IMPORTANT ANNOUNCEMENTS */}
        {/* ========================================================= */}
        {activeTab === 'hours' && (
          <div className="space-y-6 max-w-3xl">
            {/* Card 1: Important Announcements */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#073834]/80 border border-[#0d9488]/40 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#0d9488]/30 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <h3 className="text-xl font-black text-white">مدیریت اطلاعیه‌های مهم کتابخانه</h3>
                  </div>
                  <p className="text-xs text-[#99f6e4] mt-1">
                    متن اطلاعیه مهم در بالای صفحه اصلی و پنل کاربری اعضا به شکل برجسته نمایش داده خواهد شد.
                  </p>
                </div>

                {/* Enable / Disable Toggle */}
                <div className="flex items-center gap-3 bg-[#042f2e] px-3.5 py-2 rounded-2xl border border-[#0d9488]/40 self-start sm:self-auto">
                  <span className="text-xs font-bold text-[#ccfbf1]">وضعیت نمایش:</span>
                  <button
                    type="button"
                    onClick={() => setAnnouncementEnabled(!announcementEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      announcementEnabled ? 'bg-[#84cc16]' : 'bg-stone-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        announcementEnabled ? '-translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-black ${announcementEnabled ? 'text-[#a3e635]' : 'text-stone-400'}`}>
                    {announcementEnabled ? 'فعال و نمایان' : 'غیرفعال (مخفی)'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#99f6e4] mb-2">
                  متن پیام اطلاعیه مهم:
                </label>
                <textarea
                  rows={4}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="مثال: اعضای محترم، به مناسبت ایام نیمه شعبان مسابقه کتابخوانی ویژه با جوایز ارزنده آغاز شد. مهلت امانت کتاب‌ها در تعطیلات نوروز به صورت خودکار تمدید می‌گردد..."
                  className="w-full px-4 py-3 rounded-2xl bg-[#042f2e] border border-[#0d9488]/40 text-white placeholder-stone-500 text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#84cc16]"
                />
              </div>

              {/* Fast Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#99f6e4]">متن‌های آماده پیشنهادی:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'به اطلاع می‌رساند کتابخانه فردا در نوبت عصر از ساعت ۱۵ الی ۲۰ دایر می‌باشد.',
                    'مهلت شرکت در مسابقه بزرگ کتابخوانی تا پایان هفته جاری تمدید شد.',
                    'کتاب‌های جدید در حوزه اخلاق و تاریخ اسلام به قفسه‌های کتابخانه اضافه شد.',
                    'به دلیل برگزاری مراسم در شبستان، شیفت کاری امروز تا ساعت ۱۸ خواهد بود.',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAnnouncementText(preset)}
                      className="px-2.5 py-1 rounded-xl bg-[#042f2e] hover:bg-[#0d9488]/30 border border-[#0d9488]/30 text-[11px] text-[#ccfbf1] transition-colors"
                    >
                      {preset.slice(0, 32)}...
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  disabled={savingAnnouncement}
                  onClick={handleSaveAnnouncement}
                  className="px-6 py-2.5 rounded-2xl bg-[#84cc16] hover:bg-[#a3e635] text-[#042f2e] font-black text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {savingAnnouncement ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{savingAnnouncement ? 'در حال ذخیره‌سازی...' : 'ذخیره و انتشار اطلاعیه'}</span>
                </button>
              </div>
            </div>

            {/* Card 2: Operating Hours & Weekly Schedule */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#073834]/80 border border-[#0d9488]/40 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#0d9488]/30 pb-4">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#84cc16]" />
                    <span>تنظیمات هوشمند ساعات کاری کتابخانه (شنبه تا جمعه)</span>
                  </h3>
                  <p className="text-xs text-[#99f6e4] mt-1">
                    تنظیم ساعات کاری برای هر روز هفته. این ساعات به تقویم رسمی کشور و روزهای تعطیل رسمی ایران متصل بوده و در هدر، فوتر، کادر کشویی و صفحه اصلی به صورت زنده و دقیق منعکس می‌شوند.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setHoursForm((prev) => ({
                      ...prev,
                      weekly_schedule: DEFAULT_WEEKLY_SCHEDULE.map((item) => ({ ...item })),
                      regular_hours: '۱۳:۰۰ تا ۲۰:۰۰',
                    }));
                    showSuccess('ساعات به حالت پیش‌فرض (شنبه تا پنجشنبه ۱۳:۰۰ الی ۲۰:۰۰، جمعه تعطیل) بازنشانی شدند. برای ثبت نهایی روی دکمه ذخیره کلیک کنید.');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#042f2e] hover:bg-[#064e3b] text-[#99f6e4] hover:text-white border border-[#0d9488]/40 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#84cc16]" />
                  <span>تنظیم پیش‌فرض (۱۳:۰۰ تا ۲۰:۰۰)</span>
                </button>
              </div>

              {/* Live Preview Box */}
              {(() => {
                const tehran = getTehranDateInfo();
                const liveStatus = isLibraryOpenNow(hoursForm);
                return (
                  <div className="p-4 rounded-2xl bg-[#042f2e]/80 border border-[#0d9488]/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full shrink-0 ${
                        liveStatus.isOpen
                          ? 'bg-[#84cc16] animate-pulse shadow-[0_0_8px_#84cc16]'
                          : liveStatus.isHoliday
                          ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                          : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                      }`} />
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>وضعیت کنونی پایگاه بر اساس زمان رسمی ایران:</span>
                          <span className={`px-2.5 py-0.5 rounded-full font-black text-[11px] ${
                            liveStatus.isOpen
                              ? 'bg-[#84cc16]/20 text-[#a3e635] border border-[#84cc16]/40'
                              : liveStatus.isHoliday
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}>
                            {liveStatus.statusText}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#99f6e4]/80 mt-0.5">
                          {liveStatus.detailText}
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#ccfbf1] bg-[#073834] px-3 py-1.5 rounded-xl border border-[#0d9488]/30 shrink-0">
                      <span>امروز: {tehran.weekdayName} {toPersianDigits(tehran.day)}/{toPersianDigits(tehran.month)}/{toPersianDigits(tehran.year)}</span>
                      <span className="mx-1.5 opacity-40">|</span>
                      <span>ساعت: {toPersianDigits(String(tehran.hour).padStart(2, '0'))}:{toPersianDigits(String(tehran.minute).padStart(2, '0'))}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Weekly Days Configuration Table / Cards */}
              <div className="space-y-2.5">
                <label className="block text-xs font-black text-[#a3e635]">
                  جدول زمان‌بندی روزهای هفته (شنبه تا جمعه):
                </label>

                <div className="grid grid-cols-1 gap-2.5">
                  {(hoursForm.weekly_schedule && hoursForm.weekly_schedule.length === 7
                    ? hoursForm.weekly_schedule
                    : DEFAULT_WEEKLY_SCHEDULE
                  ).map((scheduleItem, idx) => {
                    const updateDay = (updates: Partial<DayOperatingSchedule>) => {
                      const currentList = Array.isArray(hoursForm.weekly_schedule) && hoursForm.weekly_schedule.length === 7
                        ? [...hoursForm.weekly_schedule]
                        : DEFAULT_WEEKLY_SCHEDULE.map((s) => ({ ...s }));
                      currentList[idx] = { ...currentList[idx], ...updates };
                      setHoursForm({ ...hoursForm, weekly_schedule: currentList });
                    };

                    const isFriday = scheduleItem.day === 'جمعه' || scheduleItem.day_index === 6;

                    return (
                      <div
                        key={scheduleItem.day}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          scheduleItem.is_open
                            ? 'bg-[#042f2e] border-[#0d9488]/50 shadow-sm'
                            : 'bg-[#042f2e]/40 border-rose-900/30'
                        }`}
                      >
                        {/* Day Title and Status Toggle */}
                        <div className="flex items-center gap-3 min-w-[150px]">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            scheduleItem.is_open ? 'bg-[#84cc16] text-[#042f2e]' : 'bg-stone-800 text-stone-400'
                          }`}>
                            {toPersianDigits(idx + 1)}
                          </div>
                          <div>
                            <span className="font-black text-sm text-white block">
                              {scheduleItem.day}
                            </span>
                            <span className="text-[10px] text-[#99f6e4]/60">
                              {isFriday ? 'تعطیل آخر هفته' : 'روز کاری'}
                            </span>
                          </div>
                        </div>

                        {/* Open / Closed Switch */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateDay({ is_open: true })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              scheduleItem.is_open
                                ? 'bg-[#84cc16] text-[#042f2e] shadow-md font-black'
                                : 'bg-[#073834] text-[#99f6e4] hover:text-white border border-[#0d9488]/40'
                            }`}
                          >
                            باز است
                          </button>
                          <button
                            type="button"
                            onClick={() => updateDay({ is_open: false })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              !scheduleItem.is_open
                                ? 'bg-rose-600 text-white shadow-md font-black'
                                : 'bg-[#073834] text-[#99f6e4] hover:text-white border border-[#0d9488]/40'
                            }`}
                          >
                            تعطیل است
                          </button>
                        </div>

                        {/* Working Hours Time Inputs */}
                        <div className="flex items-center gap-2.5 sm:justify-end flex-1">
                          {scheduleItem.is_open ? (
                            <div className="flex items-center gap-2 text-xs text-[#ccfbf1]">
                              <span className="text-[#99f6e4]">از ساعت:</span>
                              <input
                                type="text"
                                dir="ltr"
                                value={scheduleItem.open_time || '13:00'}
                                onChange={(e) => updateDay({ open_time: toEnglishDigits(e.target.value) })}
                                className="w-20 px-2.5 py-1.5 rounded-xl bg-[#073834] border border-[#0d9488]/50 text-white text-center font-bold text-xs focus:border-[#84cc16] outline-none"
                                placeholder="13:00"
                              />
                              <span className="text-[#99f6e4]">تا ساعت:</span>
                              <input
                                type="text"
                                dir="ltr"
                                value={scheduleItem.close_time || '20:00'}
                                onChange={(e) => updateDay({ close_time: toEnglishDigits(e.target.value) })}
                                className="w-20 px-2.5 py-1.5 rounded-xl bg-[#073834] border border-[#0d9488]/50 text-white text-center font-bold text-xs focus:border-[#84cc16] outline-none"
                                placeholder="20:00"
                              />
                            </div>
                          ) : (
                            <div className="text-xs text-rose-300 font-medium py-1 px-3 rounded-xl bg-rose-950/40 border border-rose-900/40 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                              <span>کتابخانه در روز {scheduleItem.day} تعطیل می‌باشد</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex items-center justify-between border-t border-[#0d9488]/30">
                <span className="text-[11px] text-[#99f6e4]/80">
                  پس از ذخیره، ساعات فوراً در تمامی بخش‌ها (هدر، کادر کشویی منو، کارت صفحه اصلی، فوتر) اعمال می‌شود.
                </span>

                <button
                  type="button"
                  onClick={async () => {
                    await onUpdateOperatingHours(hoursForm);
                    showSuccess('تنظیمات ساعات کاری هفته با موفقیت در سراسر پایگاه ثبت و اعمال گردید.');
                  }}
                  className="px-6 py-2.5 rounded-2xl bg-[#84cc16] hover:bg-[#a3e635] text-[#042f2e] font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ذخیره تغییرات ساعات کاری</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: SITE VISUAL & CONTENT CMS */}
        {/* ========================================================= */}
        {activeTab === 'site-cms' && (
          <AdminCMS
            cmsData={homepageCMS || INITIAL_HOMEPAGE_CMS}
            onSaveCMS={async (updated) => {
              if (onUpdateHomepageCMS) {
                return await onUpdateHomepageCMS(updated);
              }
              return false;
            }}
            onResetCMS={async () => {
              if (onResetHomepageCMS) {
                return await onResetHomepageCMS();
              }
              return false;
            }}
            showToast={(msg, type) => {
              if (type === 'error') showError(msg);
              else showSuccess(msg);
            }}
          />
        )}

        {/* Universal Confirmation Modal */}
        {confirmDialog && confirmDialog.isOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-md bg-[#042f2e] border-2 border-[#0d9488]/60 rounded-3xl p-6 shadow-2xl space-y-5 text-right relative">
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-3 rounded-2xl shrink-0 ${
                    confirmDialog.isDestructive
                      ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                      : 'bg-[#84cc16]/20 border border-[#84cc16]/40 text-[#a3e635]'
                  }`}
                >
                  {confirmDialog.isDestructive ? (
                    <Trash2 className="w-6 h-6" />
                  ) : (
                    <AlertCircle className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-white">
                    {confirmDialog.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#99f6e4]">
                    {confirmDialog.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#0d9488]/30">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#073834] hover:bg-[#064e3b] text-[#99f6e4] hover:text-white text-xs font-bold transition-colors"
                >
                  {confirmDialog.cancelLabel || 'انصراف'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const action = confirmDialog.onConfirm;
                    setConfirmDialog(null);
                    try {
                      await action();
                    } catch (err: any) {
                      showError(err?.message || 'خطا در انجام عملیات');
                    }
                  }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all flex items-center gap-1.5 ${
                    confirmDialog.isDestructive
                      ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-900/40'
                      : 'bg-gradient-to-r from-[#84cc16] to-[#65a30d] hover:brightness-110 text-[#042f2e] shadow-[#84cc16]/30'
                  }`}
                >
                  <span>{confirmDialog.confirmLabel || 'تأیید و ادامه'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Centralized Image Cropper Modal */}
        {cropModal && cropModal.isOpen && (
          <ImageCropModal
            isOpen={cropModal.isOpen}
            imageSrc={cropModal.imageSrc}
            title={cropModal.title}
            initialAspect={cropModal.initialAspect}
            onConfirm={handleConfirmCrop}
            onCancel={() => setCropModal(null)}
          />
        )}

      </div>
    </div>
  );
};
