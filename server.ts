import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  INITIAL_BOOKS,
  INITIAL_FAQS,
  INITIAL_FAQ_CATEGORIES,
  INITIAL_QUOTES,
  INITIAL_OPERATING_HOURS,
  INITIAL_HOMEPAGE_CMS,
  INITIAL_COMPETITIONS,
  INITIAL_SHELVES_CONFIG,
  DEFAULT_WEEKLY_SCHEDULE,
  SHELVES_LIST,
  SUBJECTS_LIST
} from './src/data/initialData.js';
import { containsProfanity, EXACT_PROFANITY_ERROR } from './src/utils/profanityFilter.js';
import { Book, Reservation, UserProfile, FAQItem, FAQCategory, Competition, CompetitionRegistration, OperatingHours, HomepageCMS, AuditLog, UserMessage, ManagedFile, ShelfItem, CustomFont } from './src/types.js';

dotenv.config();

const PORT = 3000;
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'library_db.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure data folder and public uploads folder exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

interface DatabaseSchema {
  books: Book[];
  reservations: Reservation[];
  users: UserProfile[];
  faqs: FAQItem[];
  faq_categories: FAQCategory[];
  competitions: Competition[];
  competition_registrations: CompetitionRegistration[];
  operating_hours: OperatingHours;
  homepage_cms: HomepageCMS;
  audit_logs: AuditLog[];
  messages: UserMessage[];
  managed_files: ManagedFile[];
  shelves_config?: ShelfItem[];
  custom_fonts?: CustomFont[];
  lending_settings: {
    default_loan_days: number;
    max_extensions: number;
    extension_days: number;
  };
  visits: number;
}

function loadDatabase(): DatabaseSchema {
  const seedFile = path.join(DB_DIR, 'library_db_seed.json');
  const targetFile = fs.existsSync(DB_FILE) ? DB_FILE : (fs.existsSync(seedFile) ? seedFile : null);

  if (targetFile) {
    try {
      const content = fs.readFileSync(targetFile, 'utf-8');
      const data = JSON.parse(content);
      if (!data.messages) data.messages = [];
      if (!data.managed_files) data.managed_files = [];
      if (!data.competition_registrations) data.competition_registrations = [];
      if (!data.competitions || data.competitions.length === 0) {
        data.competitions = INITIAL_COMPETITIONS;
      }
      if (!data.shelves_config || data.shelves_config.length === 0) {
        data.shelves_config = INITIAL_SHELVES_CONFIG;
      }
      if (!data.faq_categories || data.faq_categories.length !== 6) {
        data.faq_categories = INITIAL_FAQ_CATEGORIES;
      }
      if (!data.faqs || data.faqs.length === 0) {
        data.faqs = INITIAL_FAQS;
      } else {
        data.faqs.forEach((f: any) => {
          if (f.category === 'خدمات و برنامه‌ها') f.category = 'خدمات و برنامه ها';
        });
      }
      if (!data.operating_hours) {
        data.operating_hours = INITIAL_OPERATING_HOURS;
      } else if (!data.operating_hours.weekly_schedule || data.operating_hours.weekly_schedule.length === 0) {
        data.operating_hours.weekly_schedule = DEFAULT_WEEKLY_SCHEDULE;
      }
      if (Array.isArray(data.shelves_config)) {
        data.shelves_config.forEach((s: any) => {
          if (Array.isArray(s.subjects)) {
            // Clean spacing and deduplicate
            const seen = new Set<string>();
            s.subjects = s.subjects
              .map((sub: string) => (sub || '').trim().replace(/امام کاظم\(ع\) /g, 'امام کاظم(ع)'))
              .filter((sub: string) => {
                const norm = sub.replace(/\s+/g, ' ').replace(/\s*([،,])\s*/g, '$1');
                if (seen.has(norm)) return false;
                seen.add(norm);
                return true;
              });
          }
        });
      }
      if (!data.lending_settings) {
        data.lending_settings = {
          default_loan_days: 14,
          max_extensions: 1,
          extension_days: 7,
        };
      }
      if (!Array.isArray(data.custom_fonts)) {
        data.custom_fonts = [];
      }
      // Auto-scan uploaded fonts folder to never lose any uploaded font
      const FONTS_DIR = path.join(UPLOADS_DIR, 'fonts');
      if (fs.existsSync(FONTS_DIR)) {
        try {
          const files = fs.readdirSync(FONTS_DIR);
          files.forEach((file) => {
            if (/\.(woff2|woff|ttf|otf)$/i.test(file)) {
              const fontUrl = `/uploads/fonts/${file}`;
              if (!data.custom_fonts.some((cf: any) => cf.url === fontUrl)) {
                const cleanName = file.replace(/^\d+_/, '').replace(/\.[^/.]+$/, '');
                data.custom_fonts.push({
                  id: `font-${file.split('_')[0] || Date.now()}`,
                  name: cleanName,
                  family: `Font_${cleanName.replace(/\s+/g, '_')}`,
                  url: fontUrl,
                  uploaded_at: new Date().toISOString(),
                });
              }
            }
          });
        } catch (e) {
          console.warn('Error reading fonts dir on boot:', e);
        }
      }
      data.homepage_cms = { ...INITIAL_HOMEPAGE_CMS, ...(data.homepage_cms || {}) };
      return data;
    } catch (err) {
      console.error('Error reading database file, fallback to seed:', err);
    }
  }

  const initialDb: DatabaseSchema = {
    books: INITIAL_BOOKS,
    reservations: [],
    shelves_config: INITIAL_SHELVES_CONFIG,
    users: [
      {
        id: 'u-1',
        name: 'علی',
        family: 'حسینی',
        phone: '09161112233',
        membership_status: 'فعال',
        lending_subscription: 'فعال',
        registered_at: '۱۴۰۲/۰۶/۱۵',
        active_reservations_count: 1,
        notes: 'عضو فعال مسجد امام خمینی (ره)',
      },
    ],
    faqs: INITIAL_FAQS,
    faq_categories: INITIAL_FAQ_CATEGORIES,
    competitions: INITIAL_COMPETITIONS,
    competition_registrations: [],
    operating_hours: INITIAL_OPERATING_HOURS,
    homepage_cms: INITIAL_HOMEPAGE_CMS,
    audit_logs: [
      {
        id: 'log-init',
        action: 'راه‌اندازی اولیه پایگاه داده کتابخانه',
        actor: 'سیستم',
        timestamp: new Date().toISOString(),
        details: 'داده‌های اولیه کاتالوگ، قفسه‌ها و پرسش‌های متداول با موفقیت بارگذاری شد.',
        type: 'database',
      },
    ],
    messages: [
      {
        id: 'msg-sample-1',
        user_name: 'محمد رضایی',
        user_phone: '09121234567',
        subject: 'درخواست تهیه کتاب جدید',
        content: 'با سلام و عرض خداقوت، آیا امکان تهیه کتاب انسان ۲۵۰ ساله وجود دارد؟ با تشکر از زحمات شما.',
        created_at: new Date().toLocaleDateString('fa-IR'),
        is_read: true,
        status: 'پاسخ داده شده',
        admin_reply: 'سلام و احترام؛ این کتاب ارزشمند در قفسه شماره ۳ (سیره اهل‌بیت) موجود است و هم‌اکنون می‌توانید آن را امانت بگیرید.',
        replied_at: new Date().toLocaleDateString('fa-IR'),
      },
    ],
    managed_files: [
      {
        id: 'file-seed-1',
        file_name: 'فهرست_کتابخانه_شهید_کربلایی_پور.xlsx',
        file_type: 'excel',
        file_size: 45200,
        uploaded_at: '۱۴۰۳/۰۵/۱۰',
        records_count: INITIAL_BOOKS.length,
        status: 'فعال',
        description: 'کاتالوگ اولیه و ساختار قفسه‌های ۱ تا ۱۶',
      },
    ],
    lending_settings: {
      default_loan_days: 14,
      max_extensions: 1,
      extension_days: 7,
    },
    visits: 7420,
  };

  saveDatabase(initialDb);
  return initialDb;
}

let saveTimeout: NodeJS.Timeout | null = null;
function saveDatabase(data: DatabaseSchema, immediate = false) {
  const doWrite = () => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data), 'utf-8');
    } catch (err) {
      console.error('Error writing database file:', err);
    }
  };

  if (immediate) {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    doWrite();
  } else {
    if (!saveTimeout) {
      saveTimeout = setTimeout(() => {
        saveTimeout = null;
        doWrite();
      }, 40);
    }
  }
}

// In-memory working copy
let db: DatabaseSchema = loadDatabase();

function addAuditLog(action: string, actor: string, details: string, type: 'info' | 'warning' | 'security' | 'database' = 'info') {
  const log: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    action,
    actor,
    timestamp: new Date().toISOString(),
    details,
    type,
  };
  db.audit_logs.unshift(log);
  if (db.audit_logs.length > 300) {
    db.audit_logs = db.audit_logs.slice(0, 300);
  }
  saveDatabase(db);
}

// Admin credentials (from secure server environment)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'ShahidKarbalailibrary405';
const ADMIN_SERIAL = process.env.ADMIN_SERIAL || 'ShKarbalailib57405';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', name: 'کتابخانه شهید احسان کربلایی‌پور' });
  });

  // Serve static public uploads with caching
  app.use('/uploads', express.static(UPLOADS_DIR));
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Request counter for stats
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/@') && !req.path.includes('.')) {
      db.visits = (db.visits || 7420) + 1;
    }
    next();
  });

  // ==================== AUTH API ====================

  // Admin Login
  app.post('/api/auth/admin-login', (req, res) => {
    const { username, admin_serial } = req.body;
    if (!username || !admin_serial) {
      return res.status(400).json({ success: false, message: 'لطفاً نام کاربری و سریال ادمین را وارد نمایید.' });
    }

    if (username.trim() === ADMIN_USERNAME && admin_serial.trim() === ADMIN_SERIAL) {
      addAuditLog('ورود موفق مدیر به پنل مدیریت', username, 'ورود با سریال امنیتی تأیید شد.', 'security');
      return res.json({
        success: true,
        message: 'خوش آمدید، احراز هویت مدیریت با موفقیت انجام شد.',
        token: `admin-token-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        admin: {
          username: ADMIN_USERNAME,
          role: 'مدیر ارشد کتابخانه',
          permissions: ['all'],
        },
      });
    }

    addAuditLog('تلاش ناموفق ورود به پنل ادمین', username || 'ناشناس', 'نام کاربری یا سریال اشتباه بود.', 'warning');
    return res.status(401).json({ success: false, message: 'نام کاربری یا سریال ادمین نامعتبر است.' });
  });

  // User Register
  app.post('/api/auth/register', (req, res) => {
    const { name, family, phone, password } = req.body;
    if (!name || !family || !phone || !password) {
      return res.status(400).json({ success: false, message: 'تکمیل تمامی فیلدها الزامی است.' });
    }

    const cleanPhone = phone.trim();
    const existing = db.users.find((u) => u.phone === cleanPhone);
    if (existing) {
      if (existing.is_blocked) {
        return res.status(403).json({
          success: false,
          is_blocked: true,
          message: 'کاربر به دلیل تخلف مسدود شده است',
        });
      }
      return res.status(400).json({ success: false, message: 'کاربری با این شماره تلفن قبلاً ثبت‌نام کرده است. لطفاً از بخش ورود وارد شوید.' });
    }

    const newUser: UserProfile = {
      id: `u-${Date.now()}`,
      name: name.trim(),
      family: family.trim(),
      phone: cleanPhone,
      password: password.trim(),
      membership_status: 'فعال',
      lending_subscription: 'فعال',
      registered_at: new Date().toLocaleDateString('fa-IR'),
      active_reservations_count: 0,
    };

    db.users.push(newUser);
    saveDatabase(db);
    addAuditLog('ثبت‌نام کاربر جدید', `${name} ${family}`, `شماره تماس: ${cleanPhone}`, 'info');

    return res.json({
      success: true,
      message: 'ثبت‌نام شما با موفقیت انجام شد. اکنون وارد حساب کاربری شدید.',
      user: newUser,
    });
  });

  // User Login
  app.post('/api/auth/login', (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'لطفاً شماره تلفن همراه و رمز عبور را وارد فرمایید.' });
    }

    const cleanPhone = phone.trim();
    const cleanPassword = password.trim();
    const user = db.users.find((u) => u.phone === cleanPhone);

    if (!user) {
      return res.status(404).json({
        success: false,
        not_registered: true,
        message: 'این شماره تلفن در سامانه ثبت نشده است. برای ورود، ابتدا باید در سایت ثبت‌نام کنید.',
      });
    }

    if (user.is_blocked) {
      return res.status(403).json({
        success: false,
        is_blocked: true,
        message: 'کاربر به دلیل تخلف مسدود شده است',
      });
    }

    if (user.password && user.password !== cleanPassword) {
      return res.status(401).json({
        success: false,
        message: 'رمز عبور وارد شده صحیح نمی‌باشد. لطفاً مجدداً بررسی فرمایید.',
      });
    }

    if (!user.password && cleanPassword) {
      user.password = cleanPassword;
      saveDatabase(db);
    }

    // Refresh active reservation count
    const activeResCount = db.reservations.filter(
      (r) => r.user_phone === cleanPhone && (r.status === 'در انتظار بررسی' || r.status === 'تأیید شده')
    ).length;
    user.active_reservations_count = activeResCount;

    return res.json({
      success: true,
      message: 'ورود به حساب کاربری با موفقیت انجام شد.',
      user,
    });
  });

  // User Profile with Active & Past Reservations
  app.get('/api/user/profile', (req, res) => {
    const phone = req.query.phone as string;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'شماره تلفن کاربر الزامی است.' });
    }

    const user = db.users.find((u) => u.phone === phone);
    if (!user) {
      return res.status(404).json({ success: false, not_registered: true, message: 'کاربر یافت نشد.' });
    }

    if (user.is_blocked) {
      return res.status(403).json({
        success: false,
        is_blocked: true,
        message: 'کاربر به دلیل تخلف مسدود شده است',
      });
    }

    const userReservations = db.reservations.filter((r) => r.user_phone === phone);
    user.active_reservations_count = userReservations.filter(
      (r) => r.status === 'در انتظار بررسی' || r.status === 'تأیید شده'
    ).length;

    return res.json({
      success: true,
      user,
      reservations: userReservations,
    });
  });

  // Update User Profile Name (Only Name and Family are editable)
  app.put('/api/user/profile', (req, res) => {
    const { phone, name, family } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'شماره تلفن کاربر الزامی است.' });
    }
    const cleanPhone = phone.trim();
    const user = db.users.find((u) => u.phone === cleanPhone);
    if (!user) {
      return res.status(404).json({ success: false, message: 'کاربر مورد نظر یافت نشد.' });
    }
    if (user.is_blocked) {
      return res.status(403).json({
        success: false,
        is_blocked: true,
        message: 'حساب کاربری شما به دلیل تخلف مسدود شده است.',
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'نام نمی‌تواند خالی باشد.' });
    }

    const oldFullName = `${user.name} ${user.family}`.trim();
    user.name = name.trim();
    if (family !== undefined) {
      user.family = family.trim();
    }
    const newFullName = `${user.name} ${user.family}`.trim();

    // Update reservations to sync the updated name in admin panel
    db.reservations.forEach((r) => {
      if (r.user_phone === cleanPhone) {
        r.user_name = newFullName;
      }
    });

    // Update in user messages
    if (Array.isArray(db.messages)) {
      db.messages.forEach((m) => {
        if (m.user_phone === cleanPhone) {
          m.user_name = newFullName;
        }
      });
    }

    // Update in competition registrations
    if (Array.isArray(db.competition_registrations)) {
      db.competition_registrations.forEach((cr) => {
        if (cr.phone === cleanPhone) {
          cr.full_name = newFullName;
        }
      });
    }

    saveDatabase(db);
    addAuditLog('ویرایش نام کاربر', newFullName, `تغییر نام از "${oldFullName}" به "${newFullName}" (شماره: ${cleanPhone})`, 'info');

    return res.json({
      success: true,
      user,
      message: 'نام شما با موفقیت تغییر یافت و در سامانه اعمال گردید.',
    });
  });

  // ==================== BOOKS API ====================

  // Get books with search and filters
  app.get('/api/books', (req, res) => {
    const { q, shelf, subject, availability, page = '1', limit = '24' } = req.query;

    let filtered = [...db.books];

    if (q) {
      const searchStr = (q as string).toLowerCase().trim();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(searchStr) ||
          b.author.toLowerCase().includes(searchStr) ||
          (b.publisher && b.publisher.toLowerCase().includes(searchStr)) ||
          (b.book_number && b.book_number.includes(searchStr)) ||
          (b.series && b.series.toLowerCase().includes(searchStr)) ||
          (b.volume && b.volume.toLowerCase().includes(searchStr)) ||
          (b.description && b.description.toLowerCase().includes(searchStr))
      );
    }

    if (shelf) {
      const shelfNum = parseInt(shelf as string, 10);
      if (!isNaN(shelfNum)) {
        filtered = filtered.filter((b) => b.shelf === shelfNum);
      }
    }

    if (subject) {
      filtered = filtered.filter((b) => b.subject === (subject as string));
    }

    if (availability) {
      filtered = filtered.filter((b) => b.availability_status === (availability as string));
    }

    const isAll = limit === 'all' || (!req.query.limit && !req.query.page);
    if (isAll) {
      return res.json({
        success: true,
        books: filtered,
        total: filtered.length,
        page: 1,
        totalPages: 1,
      });
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const requestedLimit = parseInt(limit as string, 10);
    const limitNum = isNaN(requestedLimit) ? 50 : Math.max(1, requestedLimit);
    const total = filtered.length;
    const totalPages = Math.ceil(total / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(startIndex, startIndex + limitNum);

    return res.json({
      success: true,
      books: paginated,
      total,
      page: pageNum,
      totalPages,
    });
  });

  // Get single book
  app.get('/api/books/:id', (req, res) => {
    const book = db.books.find((b) => b.id === req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'کتاب مورد نظر یافت نشد.' });
    }
    return res.json({ success: true, book });
  });

  // Add Book (Admin)
  app.post('/api/books', (req, res) => {
    const rawTitle = req.body.title || req.body.name;
    if (!rawTitle || !String(rawTitle).trim()) {
      return res.status(400).json({ success: false, message: 'نام کتاب الزامی است.' });
    }

    const rowVal = req.body.row_number !== undefined && req.body.row_number !== null && String(req.body.row_number).trim() !== ''
      ? String(req.body.row_number).trim()
      : '1';

    const newBook: Book = {
      ...req.body,
      id: req.body.id || `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: String(rawTitle).trim(),
      author: String(req.body.author || 'ناشناس').trim(),
      series: req.body.series ? String(req.body.series).trim() : '',
      volume: req.body.volume ? String(req.body.volume).trim() : '',
      subject: req.body.subject ? String(req.body.subject).trim() : 'متفرقه',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      shelf: parseInt(req.body.shelf, 10) || 1,
      row_number: rowVal,
      availability_status: req.body.availability_status === 'امانت داده شده' ? 'امانت داده شده' : 'موجود',
      reservation_allowed: req.body.reservation_allowed !== false,
    };

    db.books.unshift(newBook);
    saveDatabase(db);
    addAuditLog('افزودن کتاب جدید', 'مدیریت', `کتاب "${newBook.title}" به قفسه ${newBook.shelf} ردیف ${newBook.row_number} اضافه شد.`, 'info');

    return res.json({ success: true, book: newBook, message: 'کتاب با موفقیت ذخیره شد.' });
  });

  // Update Book (Admin)
  app.put('/api/books/:id', (req, res) => {
    const index = db.books.findIndex((b) => b.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'کتاب یافت نشد.' });
    }

    const rowVal = req.body.row_number !== undefined && req.body.row_number !== null && String(req.body.row_number).trim() !== ''
      ? String(req.body.row_number).trim()
      : db.books[index].row_number;

    db.books[index] = {
      ...db.books[index],
      ...req.body,
      title: req.body.title ? String(req.body.title).trim() : db.books[index].title,
      author: req.body.author !== undefined ? String(req.body.author).trim() : db.books[index].author,
      series: req.body.series !== undefined ? String(req.body.series).trim() : db.books[index].series,
      volume: req.body.volume !== undefined ? String(req.body.volume).trim() : db.books[index].volume,
      shelf: parseInt(req.body.shelf, 10) || db.books[index].shelf,
      row_number: rowVal,
      availability_status: req.body.availability_status || db.books[index].availability_status,
      updated_at: new Date().toISOString(),
    };

    saveDatabase(db);
    addAuditLog('ویرایش اطلاعات کتاب', 'مدیریت', `کتاب "${db.books[index].title}" به‌روزرسانی شد.`, 'info');

    return res.json({ success: true, book: db.books[index], message: 'اطلاعات کتاب با موفقیت به‌روزرسانی شد.' });
  });

  // Delete Book (Admin)
  app.delete('/api/books/:id', (req, res) => {
    const index = db.books.findIndex((b) => b.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'کتاب یافت نشد.' });
    }

    const removed = db.books.splice(index, 1)[0];
    saveDatabase(db);
    addAuditLog('حذف کتاب از کاتالوگ', 'مدیریت', `کتاب "${removed.title}" حذف گردید.`, 'warning');

    return res.json({ success: true, message: 'کتاب با موفقیت از کاتالوگ حذف گردید.' });
  });

  // ==================== HTML "لیست کتاب" IMPORTER ====================
  app.post('/api/books/import-html', (req, res) => {
    try {
      const { html_content } = req.body;
      if (!html_content || typeof html_content !== 'string') {
        return res.status(400).json({ success: false, message: 'محتوای فایل HTML لیست کتاب ارسال نشده است.' });
      }

      // Robust HTML Table & Block extraction
      const rowMatches = html_content.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
      const extractedBooks: Partial<Book>[] = [];
      let headers: string[] = [];

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
        let publisher = '';
        let subject = '';
        let shelf = 1;
        let row_number = 1;
        let book_number = '';
        let description = '';
        let cover_image = '';

        if (headers.length > 0 && headers.length === cells.length) {
          headers.forEach((h, idx) => {
            const hClean = h.toLowerCase();
            const val = cells[idx];
            if (hClean.includes('نام') || hClean.includes('عنوان') || hClean.includes('کتاب')) title = val;
            else if (hClean.includes('نویسنده') || hClean.includes('مؤلف') || hClean.includes('پدیدآور')) author = val;
            else if (hClean.includes('ناشر') || hClean.includes('انتشارات')) publisher = val;
            else if (hClean.includes('موضوع') || hClean.includes('رده')) subject = val;
            else if (hClean.includes('قفسه')) {
              const num = parseInt(val.replace(/\D/g, ''), 10);
              if (num >= 1 && num <= 16) shelf = num;
            } else if (hClean.includes('ردیف')) {
              const num = parseInt(val.replace(/\D/g, ''), 10);
              if (!isNaN(num)) row_number = num;
            } else if (hClean.includes('شماره') || hClean.includes('کد') || hClean.includes('ثبت')) book_number = val;
            else if (hClean.includes('توضیح') || hClean.includes('شرح')) description = val;
            else if (hClean.includes('عکس') || hClean.includes('تصویر') || hClean.includes('جلد') || hClean.includes('url')) cover_image = val;
          });
        } else {
          title = cells[1] || cells[0] || '';
          author = cells[2] || '';
          publisher = cells[3] || '';
          subject = cells[4] || '';
          book_number = cells[0] || `${Date.now()}-${i}`;
        }

        if (title && title.length > 1) {
          extractedBooks.push({
            title,
            author: author || 'ناشناس',
            publisher: publisher || 'نامشخص',
            subject: subject || 'متفرقه',
            shelf: shelf || ((i % 16) + 1),
            row_number: row_number || ((i % 4) + 1),
            book_number: book_number || `${1000 + i}`,
            description: description || `کتاب ارزشمند «${title}» موجود در کتابخانه شهید احسان کربلایی‌پور.`,
            cover_image: cover_image || '',
            availability_status: 'موجود',
            reservation_allowed: true,
          });
        }
      }

      // Fast Map index for duplicate check
      const bookNumberMap = new Map<string, number>();
      const bookTitleMap = new Map<string, number>();
      db.books.forEach((b, idx) => {
        if (b.book_number) bookNumberMap.set(String(b.book_number).trim(), idx);
        if (b.title) bookTitleMap.set(`${String(b.title).trim().toLowerCase()}__${String(b.author || '').trim().toLowerCase()}`, idx);
      });

      let importedCount = 0;
      let updatedCount = 0;

      extractedBooks.forEach((eb, index) => {
        const numKey = eb.book_number ? String(eb.book_number).trim() : '';
        const titleKey = `${String(eb.title || '').trim().toLowerCase()}__${String(eb.author || '').trim().toLowerCase()}`;
        
        const existingIdx = (numKey && bookNumberMap.has(numKey)) 
          ? bookNumberMap.get(numKey)! 
          : (bookTitleMap.has(titleKey) ? bookTitleMap.get(titleKey)! : -1);

        if (existingIdx !== -1 && existingIdx < db.books.length) {
          db.books[existingIdx] = {
            ...db.books[existingIdx],
            ...eb,
            updated_at: new Date().toISOString(),
          };
          updatedCount++;
        } else {
          const newB: Book = {
            id: `b-imp-${Date.now()}-${index}`,
            book_number: eb.book_number || `${Date.now()}-${index}`,
            title: eb.title!,
            author: eb.author || 'ناشناس',
            publisher: eb.publisher || 'نامشخص',
            subject: eb.subject || 'متفرقه',
            shelf: eb.shelf || 1,
            row_number: eb.row_number || 1,
            description: eb.description || '',
            cover_image: eb.cover_image || '',
            availability_status: 'موجود',
            reservation_allowed: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          db.books.unshift(newB);
          // Keep map updated
          if (newB.book_number) {
            bookNumberMap.set(newB.book_number, 0);
          }
          bookTitleMap.set(`${newB.title.trim().toLowerCase()}__${newB.author.trim().toLowerCase()}`, 0);
          importedCount++;
        }
      });

      saveDatabase(db);
      addAuditLog(
        'ورود اطلاعات از فایل لیست کتاب',
        'مدیریت',
        `تعداد ${extractedBooks.length} کتاب شناسایی شد. ${importedCount} کتاب افزوده و ${updatedCount} کتاب به‌روزرسانی گردید.`,
        'database'
      );

      return res.json({
        success: true,
        message: 'فایل لیست کتاب با موفقیت تجزیه و در پایگاه داده ثبت شد.',
        totalParsed: extractedBooks.length,
        importedCount,
        updatedCount,
        sampleBooks: extractedBooks.slice(0, 5),
      });
    } catch (err: any) {
      console.error('Error importing HTML books:', err);
      return res.status(500).json({ success: false, message: `خطا در پردازش فایل HTML: ${err.message}` });
    }
  });

  // ==================== RESERVATIONS API ====================

  // Create reservation (Strictly enforces max 4 active reservations rule)
  app.post('/api/reservations', (req, res) => {
    const { user_phone, user_name, book_id } = req.body;
    if (!user_phone || !book_id) {
      return res.status(400).json({ success: false, message: 'شماره تلفن و شناسه کتاب الزامی است.' });
    }

    const cleanPhone = user_phone.trim();
    const book = db.books.find((b) => b.id === book_id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'کتاب مورد نظر یافت نشد.' });
    }

    if (!book.reservation_allowed || book.availability_status === 'مفقود' || book.availability_status === 'غیرقابل امانت') {
      return res.status(400).json({ success: false, message: 'این کتاب در حال حاضر امکان رزرو ندارد.' });
    }

    // 1. Check max 4 active reservations rule
    const activeReservations = db.reservations.filter(
      (r) => r.user_phone === cleanPhone && (r.status === 'در انتظار بررسی' || r.status === 'تأیید شده')
    );

    if (activeReservations.length >= 4) {
      return res.status(400).json({
        success: false,
        message: 'ظرفیت رزرو همزمان شما تکمیل شده است. هر عضو حداکثر می‌تواند ۴ کتاب رزرو فعال داشته باشد.',
      });
    }

    // 2. Prevent duplicate active reservation of the same book
    const duplicate = activeReservations.find((r) => r.book_id === book_id);
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'شما قبلاً این کتاب را رزرو کرده‌اید و درخواست شما در جریان است.',
      });
    }

    const user = db.users.find((u) => u.phone === cleanPhone);
    const resolvedFullName = user ? `${user.name} ${user.family}` : (user_name || 'کاربر گرامی');

    const newReservation: Reservation = {
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_phone: cleanPhone,
      user_name: resolvedFullName,
      book_id,
      book_title: book.title,
      book_number: book.book_number,
      shelf: book.shelf,
      row_number: typeof book.row_number === 'number' ? book.row_number : (parseInt(String(book.row_number), 10) || 1),
      request_date: new Date().toLocaleDateString('fa-IR'),
      status: 'در انتظار بررسی',
    };

    db.reservations.unshift(newReservation);

    // Update user active count
    if (user) {
      user.active_reservations_count = activeReservations.length + 1;
    }

    saveDatabase(db);
    addAuditLog('ثبت درخواست رزرو کتاب', cleanPhone, `درخواست رزرو کتاب "${book.title}" (قفسه ${book.shelf}) ثبت گردید.`, 'info');

    return res.json({
      success: true,
      message: 'درخواست رزرو شما برای ادمین ارسال شد. برای نهایی کردن رزرو، به کتابخانه مراجعه فرمایید.',
      reservation: newReservation,
    });
  });

  // Get all reservations (Admin or filtered by user)
  app.get('/api/reservations', (req, res) => {
    const { phone, status, for_user, role } = req.query;
    let list = db.reservations.map((r) => {
      // Resolve user's actual registered name + family if generic or missing
      if (!r.user_name || r.user_name === 'کاربر گرامی' || !r.user_name.includes(' ')) {
        const u = db.users.find((user) => user.phone === r.user_phone);
        if (u && u.name && u.family) {
          return { ...r, user_name: `${u.name} ${u.family}` };
        }
      }
      return r;
    });

    if (phone) {
      list = list.filter((r) => r.user_phone === (phone as string));
    }

    // If query is for user panel, hide any records marked hidden_from_user
    if (for_user === 'true' || role === 'user' || (phone && role !== 'admin')) {
      list = list.filter((r) => !r.hidden_from_user);
    }

    if (status) {
      list = list.filter((r) => r.status === (status as string));
    }

    return res.json({ success: true, reservations: list });
  });

  // User cancels pending reservation (only allowed when status is 'در انتظار بررسی')
  app.post('/api/reservations/:id/cancel', (req, res) => {
    const { phone } = req.body;
    const target = db.reservations.find((r) => r.id === req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'درخواست رزرو یافت نشد.' });
    }

    if (phone && target.user_phone !== String(phone).trim()) {
      return res.status(403).json({ success: false, message: 'شما دسترسی به لغو این رزرو را ندارید.' });
    }

    if (target.status !== 'در انتظار بررسی') {
      return res.status(400).json({
        success: false,
        message: 'این درخواست توسط مدیریت تعیین وضعیت شده است و امکان لغو خودکار توسط کاربر وجود ندارد.',
      });
    }

    target.status = 'لغو شده';

    // Free the book if it was reserved
    const bk = db.books.find((b) => b.id === target.book_id);
    if (bk && bk.availability_status === 'رزرو شده') {
      bk.availability_status = 'موجود';
      bk.current_borrower = undefined;
    }

    // Decrement user active reservations count if exists
    const user = db.users.find((u) => u.phone === target.user_phone);
    if (user && user.active_reservations_count && user.active_reservations_count > 0) {
      user.active_reservations_count -= 1;
    }

    saveDatabase(db);
    addAuditLog('لغو رزرو توسط کاربر', target.user_name || 'کاربر', `درخواست رزرو کتاب "${target.book_title}" توسط کاربر لغو گردید.`, 'info');

    return res.json({ success: true, message: 'درخواست رزرو با موفقیت لغو شد.' });
  });

  // User dismisses/hides finished reservation from their history (persists in admin db)
  app.post('/api/reservations/:id/dismiss', (req, res) => {
    const { phone } = req.body;
    const target = db.reservations.find((r) => r.id === req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'درخواست رزرو یافت نشد.' });
    }

    if (phone && target.user_phone !== String(phone).trim()) {
      return res.status(403).json({ success: false, message: 'دسترسی غیرمجاز.' });
    }

    target.hidden_from_user = true;
    saveDatabase(db);

    return res.json({ success: true, message: 'این مورد از تاریخچه شما حذف شد و در بایگانی مدیریت باقی می‌ماند.' });
  });

  // Helper for Persian future date
  const getFuturePersianDate = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('fa-IR');
  };

  // Update reservation status (Admin)
  app.patch('/api/reservations/:id', (req, res) => {
    const { status, admin_notes, pickup_deadline, loan_days } = req.body;
    const resItem = db.reservations.find((r) => r.id === req.params.id);
    if (!resItem) {
      return res.status(404).json({ success: false, message: 'درخواست رزرو یافت نشد.' });
    }

    resItem.status = status || resItem.status;
    if (admin_notes !== undefined) resItem.admin_notes = admin_notes;
    if (pickup_deadline !== undefined) resItem.pickup_deadline = pickup_deadline;

    // Automatic lending calculation if moving to 'امانت فعال' or 'تأیید شده'
    if (status === 'امانت فعال' || status === 'تأیید شده') {
      const defaultDays = (loan_days && Number(loan_days) > 0) 
        ? Number(loan_days) 
        : (db.lending_settings?.default_loan_days || 14);
      const now = new Date();
      if (!resItem.loan_started_at) {
        resItem.loan_started_at = now.toLocaleDateString('fa-IR');
        resItem.loan_started_iso = now.toISOString();
      }
      resItem.loan_days = defaultDays;
      const dueTime = new Date(Date.now() + defaultDays * 24 * 60 * 60 * 1000);
      resItem.due_date_iso = dueTime.toISOString();
      resItem.due_date = dueTime.toLocaleDateString('fa-IR');

      const bk = db.books.find((b) => b.id === resItem.book_id);
      if (bk) {
        bk.availability_status = status === 'امانت فعال' ? 'امانت' : 'رزرو شده';
        bk.current_borrower = resItem.user_name;
        bk.borrowing_date = resItem.loan_started_at;
        bk.due_date = resItem.due_date;
      }
    } else if (status === 'تحویل داده شده' || status === 'پایان یافته' || status === 'لغو شده' || status === 'رد شده') {
      const bk = db.books.find((b) => b.id === resItem.book_id);
      if (bk && (bk.availability_status === 'امانت' || bk.availability_status === 'رزرو شده')) {
        bk.availability_status = 'موجود';
        bk.current_borrower = undefined;
        bk.borrowing_date = undefined;
        bk.due_date = undefined;
      }
    }

    saveDatabase(db);
    addAuditLog('تغییر وضعیت رزرو', 'مدیریت', `رزرو کتاب "${resItem.book_title}" به حالت "${resItem.status}" تغییر یافت.`, 'info');

    return res.json({ success: true, reservation: resItem, message: 'وضعیت رزرو با موفقیت به‌روزرسانی شد.' });
  });

  // Permanently deletes a reservation/lending request (Admin) or hides from user history (User)
  app.delete('/api/reservations/:id', (req, res) => {
    const { phone, user_only } = req.query;
    const target = db.reservations.find((r) => r.id === req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'درخواست رزرو یافت نشد.' });
    }

    // If request comes from a user (or user_only flag), hide from user panel while preserving for admin
    if (phone || user_only === 'true') {
      const cleanPhone = phone ? String(phone).trim() : '';
      if (cleanPhone && target.user_phone !== cleanPhone) {
        return res.status(403).json({ success: false, message: 'شما دسترسی به حذف این رزرو را ندارید.' });
      }
      target.hidden_from_user = true;
      saveDatabase(db);
      return res.json({ success: true, message: 'رکورد با موفقیت از سابقه شما حذف گردید و در آرشیو کتابخانه نگهداری می‌شود.' });
    }

    // Admin permanent deletion
    db.reservations = db.reservations.filter((r) => r.id !== req.params.id);
    saveDatabase(db);
    addAuditLog('حذف درخواست رزرو/امانت', target.user_name || 'کاربر', `درخواست امانت کتاب "${target.book_title}" حذف گردید.`, 'warning');
    return res.json({ success: true, message: 'رکورد با موفقیت حذف گردید.' });
  });

  // SMS Reminder endpoint for due date notification
  app.post('/api/reservations/:id/send-sms-reminder', (req, res) => {
    const resItem = db.reservations.find((r) => r.id === req.params.id);
    if (!resItem) {
      return res.status(404).json({ success: false, message: 'درخواست یافت نشد.' });
    }
    const messageText = `کاربر گرامی ${resItem.user_name}، موعد بازگشت کتاب «${resItem.book_title}» به کتابخانه شهید کربلایی‌پور فرارسیده است (${resItem.due_date || 'امروز'}). لطفاً جهت تمدید یا عودت کتاب اقدام فرمایید.`;
    addAuditLog('ارسال پیامک یادآوری موعد تحویل', 'سیستم', `پیامک به شماره ${resItem.user_phone} برای کتاب "${resItem.book_title}" ارسال شد: "${messageText}"`, 'info');
    return res.json({
      success: true,
      message: `پیامک یادآوری به شماره ${resItem.user_phone} با موفقیت ارسال شد.`,
      sms_text: messageText,
    });
  });

  // User requests loan extension
  app.post('/api/reservations/:id/extend', (req, res) => {
    const resItem = db.reservations.find((r) => r.id === req.params.id);
    if (!resItem) {
      return res.status(404).json({ success: false, message: 'درخواست امانت یافت نشد.' });
    }
    const maxExt = db.lending_settings?.max_extensions || 1;
    if (resItem.extension_count && resItem.extension_count >= maxExt) {
      return res.status(400).json({ success: false, message: `سقف تمدید این کتاب (${maxExt} بار) تکمیل شده است.` });
    }
    resItem.extension_status = 'در انتظار بررسی';
    resItem.extension_requested_weeks = req.body.weeks || 1;
    saveDatabase(db);
    addAuditLog('درخواست تمدید امانت', resItem.user_phone, `درخواست تمدید کتاب "${resItem.book_title}" ثبت شد.`, 'info');
    return res.json({ success: true, message: 'درخواست تمدید شما برای مدیریت ارسال شد و در انتظار بررسی است.', reservation: resItem });
  });

  // Admin approves or rejects extension
  app.post('/api/admin/reservations/:id/extension-action', (req, res) => {
    const { action, days = 7, note } = req.body;
    const resItem = db.reservations.find((r) => r.id === req.params.id);
    if (!resItem) {
      return res.status(404).json({ success: false, message: 'درخواست امانت یافت نشد.' });
    }
    if (action === 'approve') {
      resItem.extension_status = 'تأیید شده';
      resItem.extension_count = (resItem.extension_count || 0) + 1;
      const extensionDays = Number(days) || 7;
      
      // Calculate new due date by adding extensionDays to the current due date (or now if overdue)
      let baseTimeMs = Date.now();
      if (resItem.due_date_iso) {
        const parsedDue = new Date(resItem.due_date_iso).getTime();
        if (!isNaN(parsedDue) && parsedDue > baseTimeMs) {
          baseTimeMs = parsedDue;
        }
      }
      const dueTime = new Date(baseTimeMs + extensionDays * 24 * 60 * 60 * 1000);
      resItem.due_date_iso = dueTime.toISOString();
      resItem.due_date = dueTime.toLocaleDateString('fa-IR');
      resItem.loan_days = (Number(resItem.loan_days) || 14) + extensionDays;
      if (note) resItem.admin_notes = note;
      const bk = db.books.find((b) => b.id === resItem.book_id);
      if (bk) bk.due_date = resItem.due_date;
      addAuditLog('تأیید تمدید امانت', 'مدیریت', `تمدید کتاب "${resItem.book_title}" به مدت ${extensionDays} روز تأیید شد.`, 'info');
    } else {
      resItem.extension_status = 'رد شده';
      if (note) resItem.admin_notes = note;
      addAuditLog('رد تمدید امانت', 'مدیریت', `درخواست تمدید کتاب "${resItem.book_title}" رد گردید. دلیل: ${note || 'عدم امکان تمدید'}`, 'warning');
    }
    saveDatabase(db);
    return res.json({ success: true, reservation: resItem, message: action === 'approve' ? 'درخواست تمدید با موفقیت تأیید گردید.' : 'درخواست تمدید رد شد.' });
  });

  // Lending settings (Admin)
  app.get('/api/admin/lending-settings', (req, res) => {
    return res.json({ success: true, settings: db.lending_settings });
  });

  app.put('/api/admin/lending-settings', (req, res) => {
    db.lending_settings = { ...db.lending_settings, ...req.body };
    saveDatabase(db);
    addAuditLog('تنظیمات امانت کتاب', 'مدیریت', `بازه پیش‌فرض امانت به ${db.lending_settings.default_loan_days} روز تنظیم شد.`, 'info');
    return res.json({ success: true, settings: db.lending_settings, message: 'تنظیمات امانت کتاب ذخیره گردید.' });
  });

  // ==================== MESSAGING API ====================
  // Submit message (Public or Logged-in User)
  app.post('/api/messages', (req, res) => {
    const { user_name, user_phone, subject, content } = req.body;
    if (!user_name || !user_phone || !content) {
      return res.status(400).json({ success: false, message: 'تکمیل نام، شماره تماس و متن پیام الزامی است.' });
    }

    if (containsProfanity(subject || '') || containsProfanity(content || '')) {
      return res.status(422).json({ success: false, message: EXACT_PROFANITY_ERROR });
    }

    const newMsg: UserMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_name: user_name.trim(),
      user_phone: user_phone.trim(),
      subject: (subject || 'پیام عمومی').trim(),
      content: content.trim(),
      created_at: new Date().toLocaleDateString('fa-IR'),
      is_read: false,
      status: 'در انتظار پاسخ',
    };
    if (!db.messages) db.messages = [];
    db.messages.unshift(newMsg);
    saveDatabase(db);
    addAuditLog('ارسال پیام به ادمین', user_name, `موضوع: ${newMsg.subject}`, 'info');
    return res.json({ success: true, message: 'پیام شما با موفقیت برای مدیریت ارسال گردید.', messageItem: newMsg });
  });

  // User fetches their own messages (excluding messages deleted by the user)
  app.get('/api/messages', (req, res) => {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'شماره تماس کاربر الزامی است.' });
    }
    const list = (db.messages || [])
      .filter((m) => m.user_phone === (phone as string).trim())
      .filter((m) => !m.deleted_by_user);
    return res.json({ success: true, messages: list });
  });

  // Admin fetches all messages
  app.get('/api/admin/messages', (req, res) => {
    return res.json({ success: true, messages: db.messages || [] });
  });

  // User deletes their own message:
  // - If admin has NOT replied yet -> completely removed for both user and admin
  // - If admin HAS replied -> only deleted from user's view (deleted_by_user: true), stays in admin panel
  app.delete('/api/messages/:id', (req, res) => {
    const { phone } = req.query;
    const msgId = req.params.id;
    const msgIndex = (db.messages || []).findIndex((m) => m.id === msgId);
    if (msgIndex === -1) {
      return res.status(404).json({ success: false, message: 'پیام مورد نظر یافت نشد.' });
    }
    const targetMsg = db.messages[msgIndex];
    // If phone provided, verify ownership
    if (phone && targetMsg.user_phone !== (phone as string).trim()) {
      return res.status(403).json({ success: false, message: 'شما دسترسی به حذف این پیام را ندارید.' });
    }

    const hasAdminReplied = Boolean((targetMsg.admin_reply && targetMsg.admin_reply.trim()) || targetMsg.status === 'پاسخ داده شده');

    if (!hasAdminReplied) {
      // Admin hasn't replied yet -> Remove completely for both user and admin
      db.messages.splice(msgIndex, 1);
      saveDatabase(db);
      addAuditLog('حذف پیام پیش از پاسخ مدیریت', targetMsg.user_name || targetMsg.user_phone, `پیام "${targetMsg.subject}" هم برای کاربر و هم برای مدیریت حذف گردید.`, 'info');
      return res.json({ success: true, message: 'پیام شما پیش از پاسخ ادمین با موفقیت حذف گردید.' });
    } else {
      // Admin has answered -> User deleted it after reading, so hide from user but keep in admin panel
      targetMsg.deleted_by_user = true;
      saveDatabase(db);
      addAuditLog('حذف پیام پاسخ‌داده‌شده توسط کاربر', targetMsg.user_name || targetMsg.user_phone, `پیام "${targetMsg.subject}" از صندوق کاربر حذف شد ولی در پنل مدیریت باقی ماند.`, 'info');
      return res.json({ success: true, message: 'پیام از صندوق پیام‌های شما حذف شد.' });
    }
  });

  // Admin replies to message (supports both PATCH and POST, with 'admin_reply' or 'reply')
  const handleAdminReply = (req: any, res: any) => {
    const { admin_reply, reply, status } = req.body;
    const finalReply = (admin_reply !== undefined ? admin_reply : reply || '').trim();
    if (finalReply && containsProfanity(finalReply)) {
      return res.status(422).json({ success: false, message: EXACT_PROFANITY_ERROR });
    }
    const msg = (db.messages || []).find((m) => m.id === req.params.id);
    if (!msg) {
      return res.status(404).json({ success: false, message: 'پیام مورد نظر یافت نشد.' });
    }
    msg.admin_reply = finalReply;
    msg.status = status || 'پاسخ داده شده';
    msg.is_read = true;
    msg.replied_at = new Date().toLocaleDateString('fa-IR');
    saveDatabase(db);
    addAuditLog('پاسخ مدیریت به پیام', 'مدیریت', `پاسخ به پیام "${msg.subject}" از ${msg.user_name} ثبت شد.`, 'info');
    return res.json({ success: true, message: 'پاسخ با موفقیت ارسال شد.', messageItem: msg });
  };

  app.patch('/api/admin/messages/:id/reply', handleAdminReply);
  app.post('/api/admin/messages/:id/reply', handleAdminReply);

  // Admin marks message status / read
  app.patch('/api/admin/messages/:id/status', (req, res) => {
    const { status, is_read } = req.body;
    const msg = (db.messages || []).find((m) => m.id === req.params.id);
    if (!msg) {
      return res.status(404).json({ success: false, message: 'پیام مورد نظر یافت نشد.' });
    }
    if (status !== undefined) msg.status = status;
    if (is_read !== undefined) msg.is_read = is_read;
    saveDatabase(db);
    return res.json({ success: true, message: 'وضعیت پیام به‌روزرسانی شد.', messageItem: msg });
  });

  // Admin deletes a message
  app.delete('/api/admin/messages/:id', (req, res) => {
    db.messages = (db.messages || []).filter((m) => m.id !== req.params.id);
    saveDatabase(db);
    addAuditLog('حذف پیام کاربر', 'مدیریت', `پیام با شناسه ${req.params.id} حذف شد.`, 'warning');
    return res.json({ success: true, message: 'پیام با موفقیت حذف گردید.' });
  });

  // Admin deletes all messages
  app.delete('/api/admin/messages', (req, res) => {
    const count = (db.messages || []).length;
    db.messages = [];
    saveDatabase(db);
    addAuditLog('حذف کلیه پیام‌های کاربران', 'مدیریت', `تمامی ${count} پیام صندوق پیام‌های کاربران حذف شدند.`, 'warning');
    return res.json({ success: true, message: 'صندوق پیام‌ها با موفقیت خالی شد.' });
  });

  // ==================== GENERAL HIGH-SPEED FILE UPLOAD API ====================
  // Supports uploading PDF, images, Excel, docs, e-books with high speed and serving from /uploads/
  app.post('/api/upload/file', (req, res) => {
    try {
      const { file_data, file_name, file_type, description } = req.body;
      if (!file_data || !file_name) {
        return res.status(400).json({ success: false, message: 'اطلاعات فایل ارسالی ناقص است.' });
      }

      const safeName = `${Date.now()}-${file_name.replace(/[^a-zA-Z0-9.\u0600-\u06FF_-]/g, '_')}`;
      const filePath = path.join(UPLOADS_DIR, safeName);

      // Determine base64 vs plain
      let buffer: Buffer;
      if (file_data.includes(';base64,')) {
        const base64Data = file_data.split(';base64,').pop();
        buffer = Buffer.from(base64Data || '', 'base64');
      } else {
        buffer = Buffer.from(file_data, 'base64');
      }

      fs.writeFileSync(filePath, buffer);

      const fileUrl = `/uploads/${safeName}`;
      const managedFile: ManagedFile = {
        id: `file-up-${Date.now()}`,
        file_name,
        file_type: file_name.endsWith('.xlsx') || file_name.endsWith('.xls') ? 'excel' : 'txt',
        file_size: buffer.length,
        uploaded_at: new Date().toLocaleDateString('fa-IR'),
        records_count: 1,
        status: 'فعال',
        description: description || `فایل بارگذاری‌شده در سرور (${(buffer.length / 1024).toFixed(1)} کیلوبایت)`,
      };

      if (!db.managed_files) db.managed_files = [];
      db.managed_files.unshift(managedFile);
      saveDatabase(db);

      addAuditLog('آپلود فایل جدید', 'کاربر/مدیریت', `فایل "${file_name}" با حجم ${(buffer.length / 1024).toFixed(1)} KB ذخیره شد.`, 'info');

      return res.json({
        success: true,
        message: 'فایل با سرعت بالا در سرور ذخیره شد.',
        url: fileUrl,
        file: managedFile,
        size: buffer.length,
      });
    } catch (err: any) {
      console.error('File upload error:', err);
      return res.status(500).json({ success: false, message: 'خطا در ذخیره‌سازی فایل در سرور' });
    }
  });
  // Accepts base64 image or data URL for logos, icons, book covers and uploads with high performance
  app.post('/api/upload/image', (req, res) => {
    try {
      const { image, filename } = req.body;
      if (!image) {
        return res.status(400).json({ success: false, message: 'داده‌های تصویر یافت نشد.' });
      }

      let imageUrl = image;
      if (image.startsWith('data:image/')) {
        const matches = image.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const extension = matches[1].replace('svg+xml', 'svg').replace('jpeg', 'jpg');
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const cleanName = filename ? filename.replace(/[^a-zA-Z0-9.\u0600-\u06FF_-]/g, '_') : `img_${Date.now()}`;
          const finalFilename = cleanName.endsWith(`.${extension}`) ? cleanName : `${cleanName}.${extension}`;
          const filePath = path.join(UPLOADS_DIR, finalFilename);
          fs.writeFileSync(filePath, buffer);
          imageUrl = `/uploads/${finalFilename}`;
        }
      }

      addAuditLog('آپلود تصویر در سامانه', 'مدیریت', `تصویر "${filename || 'تصویر'}" با موفقیت ذخیره شد.`, 'info');
      return res.json({
        success: true,
        message: 'تصویر با سرعت بالا در سرور آپلود شد.',
        url: imageUrl,
      });
    } catch (err: any) {
      console.error('Image upload error:', err);
      return res.status(500).json({ success: false, message: 'خطا در آپلود تصویر' });
    }
  });

  // Dedicated Font APIs for Persian & custom typography
  app.get('/api/fonts', (req, res) => {
    return res.json({ success: true, fonts: db.custom_fonts || [] });
  });

  app.post('/api/upload/font', (req, res) => {
    try {
      const { font_data, font_name, file_name } = req.body;
      if (!font_data) {
        return res.status(400).json({ success: false, message: 'داده‌های فونت یافت نشد.' });
      }

      const FONTS_DIR = path.join(UPLOADS_DIR, 'fonts');
      if (!fs.existsSync(FONTS_DIR)) {
        fs.mkdirSync(FONTS_DIR, { recursive: true });
      }

      let buffer: Buffer;
      if (font_data.includes(';base64,')) {
        const base64Data = font_data.split(';base64,').pop();
        buffer = Buffer.from(base64Data || '', 'base64');
      } else {
        buffer = Buffer.from(font_data, 'base64');
      }

      const safeBaseName = (font_name || file_name || 'custom_font')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_');
      const extMatch = (file_name || '').match(/\.(woff2|woff|ttf|otf)$/i);
      const ext = extMatch ? extMatch[1].toLowerCase() : 'woff2';
      const storedFileName = `${Date.now()}_${safeBaseName}.${ext}`;
      const filePath = path.join(FONTS_DIR, storedFileName);

      fs.writeFileSync(filePath, buffer);

      const fontUrl = `/uploads/fonts/${storedFileName}`;
      const fontFamilyName = `Font_${safeBaseName.replace(/\s+/g, '_')}`;

      if (!Array.isArray(db.custom_fonts)) {
        db.custom_fonts = [];
      }

      const newFont: CustomFont = {
        id: `font-${Date.now()}`,
        name: safeBaseName,
        family: fontFamilyName,
        url: fontUrl,
        uploaded_at: new Date().toISOString(),
      };

      const existingIndex = db.custom_fonts.findIndex(
        (f) => f.family === fontFamilyName || f.name === safeBaseName
      );
      if (existingIndex >= 0) {
        db.custom_fonts[existingIndex] = newFont;
      } else {
        db.custom_fonts.push(newFont);
      }

      // Persist immediately to database
      saveDatabase(db, true);

      // Also persist to seed file so it is permanently preserved across resets
      try {
        const seedPath = path.join(DB_DIR, 'library_db_seed.json');
        if (fs.existsSync(seedPath)) {
          const seedContent = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
          seedContent.custom_fonts = db.custom_fonts;
          fs.writeFileSync(seedPath, JSON.stringify(seedContent, null, 2), 'utf-8');
        }
      } catch (seedErr) {
        console.warn('Error saving to seed:', seedErr);
      }

      addAuditLog('آپلود فونت جدید', 'مدیریت', `فونت "${fontFamilyName}" با موفقیت ذخیره و به فهرست گزینه‌ها افزوده شد.`, 'info');

      return res.json({
        success: true,
        message: 'فونت با موفقیت ذخیره و به گزینه‌های سامانه اضافه شد.',
        font: newFont,
        font_url: fontUrl,
        font_family: fontFamilyName,
        font_name: safeBaseName,
        fonts: db.custom_fonts,
      });
    } catch (err: any) {
      console.error('Font upload error:', err);
      return res.status(500).json({ success: false, message: 'خطا در آپلود فایل فونت' });
    }
  });

  app.delete('/api/fonts/:id', (req, res) => {
    try {
      const fontId = req.params.id;
      if (!Array.isArray(db.custom_fonts)) db.custom_fonts = [];
      const target = db.custom_fonts.find((f) => f.id === fontId);
      if (target) {
        try {
          const filePath = path.join(process.cwd(), 'public', target.url);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('Failed unlinking font file:', e);
        }
        db.custom_fonts = db.custom_fonts.filter((f) => f.id !== fontId);
        saveDatabase(db, true);
        try {
          const seedPath = path.join(DB_DIR, 'library_db_seed.json');
          if (fs.existsSync(seedPath)) {
            const seedContent = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
            seedContent.custom_fonts = db.custom_fonts;
            fs.writeFileSync(seedPath, JSON.stringify(seedContent, null, 2), 'utf-8');
          }
        } catch (e) {
          console.warn('Error updating seed on font delete:', e);
        }
        addAuditLog('حذف فونت اختصاصی', 'مدیریت', `فونت ${target.name} حذف شد.`, 'warning');
      }
      return res.json({ success: true, message: 'فونت حذف گردید.', fonts: db.custom_fonts });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'خطا در حذف فونت' });
    }
  });

  // Endpoint to make current CMS changes the default seed and permanently memoized
  app.post('/api/cms/make-defaults', (req, res) => {
    try {
      const seedPath = path.join(DB_DIR, 'library_db_seed.json');
      let seedData: any = {};
      if (fs.existsSync(seedPath)) {
        try {
          seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
        } catch {}
      }
      seedData.homepage_cms = JSON.parse(JSON.stringify(db.homepage_cms));
      seedData.custom_fonts = JSON.parse(JSON.stringify(db.custom_fonts || []));
      fs.writeFileSync(seedPath, JSON.stringify(seedData, null, 2), 'utf-8');
      addAuditLog('نهایی‌سازی تغییرات پنل ادمین', 'مدیریت', 'تمامی تنظیمات فعلی به عنوان پیش‌فرض دائم سامانه ذخیره شدند.', 'info');
      return res.json({ success: true, message: 'تنظیمات با موفقیت به عنوان پیش‌فرض دائمی در حافظه تثبیت شد.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'خطا در نهایی‌سازی تنظیمات' });
    }
  });

  // ==================== BATCH BOOKS & FILE MANAGEMENT ====================
  app.post('/api/books/batch', (req, res) => {
    try {
      const { books: incomingBooks, mode = 'append', fileName, file_name, fileType, file_type, description } = req.body;
      const finalFileName = fileName || file_name || 'لیست_کتاب‌ها';
      const finalFileType = fileType || file_type || 'excel';

      if (!Array.isArray(incomingBooks) || incomingBooks.length === 0) {
        return res.status(400).json({ success: false, message: 'فایل حاوی اطلاعات معتبر کتاب نیست یا کتابی یافت نشد.' });
      }

      // Filter out empty rows or rows without a book title
      const validIncoming = incomingBooks.filter((b: any) => {
        if (!b) return false;
        const titleStr = String(b.title || '').trim();
        return titleStr.length > 0 && titleStr !== 'بدون عنوان' && titleStr !== 'null' && titleStr !== 'undefined';
      });

      if (validIncoming.length === 0) {
        return res.status(400).json({ success: false, message: 'هیچ کتاب معتبری که عنوان داشته باشد یافت نشد.' });
      }

      const processed: Book[] = validIncoming.map((b: any, idx: number) => {
        const shelfNum = parseInt(String(b.shelf), 10);
        const validShelf = !isNaN(shelfNum) && shelfNum >= 1 && shelfNum <= 100 ? shelfNum : 1;
        const rowStr = b.row_number !== undefined && b.row_number !== null && String(b.row_number).trim() !== '' ? String(b.row_number).trim() : '1';
        return {
          id: b.id || `book-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          book_number: b.book_number ? String(b.book_number).trim() : (b.code ? String(b.code).trim() : ''),
          title: String(b.title || '').trim(),
          author: String(b.author || 'ناشناس').trim(),
          publisher: b.publisher ? String(b.publisher).trim() : '',
          publication_year: b.publication_year ? String(b.publication_year).trim() : '',
          translator: b.translator ? String(b.translator).trim() : '',
          edition: b.edition ? String(b.edition).trim() : '',
          ISBN: b.ISBN || b.isbn || '',
          series: b.series ? String(b.series).trim() : '',
          volume: b.volume ? String(b.volume).trim() : '',
          subject: String(b.subject || 'متفرقه').trim(),
          secondary_subject: b.secondary_subject ? String(b.secondary_subject).trim() : '',
          shelf: validShelf,
          row_number: rowStr,
          language: b.language || 'فارسی',
          description: b.description ? String(b.description).trim() : `کتاب «${b.title || ''}» در کتابخانه شهید احسان کربلایی‌پور.`,
          cover_image: b.cover_image || '',
          availability_status: b.availability_status === 'امانت داده شده' || b.availability_status === 'امانت' ? 'امانت داده شده' : 'موجود',
          reservation_allowed: b.reservation_allowed !== false,
          created_at: b.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      if (mode === 'replace') {
        db.books = processed;
      } else {
        // Precise identity composite key: book_number (if unique) or title + author + shelf + row_number + volume
        const bookKeyMap = new Map<string, number>();
        db.books.forEach((b, idx) => {
          const key = b.book_number
            ? `code___${b.book_number.trim().toLowerCase()}`
            : `${b.title.trim().toLowerCase()}___${(b.author || '').trim().toLowerCase()}___${b.shelf}___${b.row_number}___${b.volume || ''}`;
          bookKeyMap.set(key, idx);
        });

        const newItemsToPrepend: Book[] = [];

        processed.forEach((newB) => {
          const key = newB.book_number
            ? `code___${newB.book_number.trim().toLowerCase()}`
            : `${newB.title.trim().toLowerCase()}___${(newB.author || '').trim().toLowerCase()}___${newB.shelf}___${newB.row_number}___${newB.volume || ''}`;

          if (bookKeyMap.has(key)) {
            const existingIdx = bookKeyMap.get(key)!;
            if (existingIdx < db.books.length) {
              db.books[existingIdx] = {
                ...db.books[existingIdx],
                ...newB,
                updated_at: new Date().toISOString(),
              };
            }
          } else {
            newItemsToPrepend.push(newB);
            bookKeyMap.set(key, 0);
          }
        });

        if (newItemsToPrepend.length > 0) {
          db.books = [...newItemsToPrepend, ...db.books];
        }
      }

      // Register in managed files
      const managedFile: ManagedFile = {
        id: `file-${Date.now()}`,
        file_name: finalFileName,
        file_type: finalFileType === 'txt' ? 'txt' : 'excel',
        file_size: processed.length * 128,
        uploaded_at: new Date().toLocaleDateString('fa-IR'),
        records_count: processed.length,
        status: 'فعال',
        description: description || `ورود ${processed.length} رکورد کتاب به صورت ${mode === 'replace' ? 'جایگزینی کامل' : 'افزودن و به‌روزرسانی'}`,
      };
      if (!db.managed_files) db.managed_files = [];
      db.managed_files.unshift(managedFile);

      saveDatabase(db);
      addAuditLog('ورود دسته‌ای کتاب‌ها', 'مدیریت', `تعداد ${processed.length} رکورد کتاب از فایل "${finalFileName}" وارد شد (${mode === 'replace' ? 'جایگزینی کامل' : 'افزودن و به‌روزرسانی'}).`, 'database');

      return res.json({
        success: true,
        message: `تعداد ${processed.length} کتاب با موفقیت وارد پایگاه داده شد.`,
        importedCount: processed.length,
        totalBooks: db.books.length,
        file: managedFile,
      });
    } catch (err: any) {
      console.error('Batch import error:', err);
      return res.status(500).json({ success: false, message: `خطا در پردازش و ذخیره کتاب‌ها: ${err.message}` });
    }
  });

  // Get Managed Files
  app.get('/api/admin/files', (req, res) => {
    return res.json({ success: true, files: db.managed_files || [] });
  });

  // Delete Managed File (handles both /:id and query parameter ?id=)
  app.delete(['/api/admin/files/:id', '/api/admin/files'], (req, res) => {
    const targetId = req.params.id || (req.query.id as string);
    if (!targetId) {
      return res.status(400).json({ success: false, message: 'شناسه فایل مشخص نشده است.' });
    }
    db.managed_files = (db.managed_files || []).filter((f) => f.id !== targetId);
    saveDatabase(db);
    return res.json({ success: true, message: 'فایل با موفقیت حذف گردید.' });
  });

  // ==================== FEATURED BOOKS ====================
  app.get('/api/featured-books', (req, res) => {
    const ids = db.homepage_cms?.featured_book_ids || [];
    const featured = ids
      .map((id) => db.books.find((b) => b.id === id))
      .filter(Boolean);
    return res.json({ success: true, books: featured, book_ids: ids });
  });

  app.put('/api/featured-books', (req, res) => {
    const { book_ids } = req.body;
    if (Array.isArray(book_ids)) {
      if (!db.homepage_cms) {
        db.homepage_cms = {} as any;
      }
      db.homepage_cms.featured_book_ids = book_ids;
      // Mark books as featured
      db.books.forEach((b) => {
        b.featured = book_ids.includes(b.id);
      });
      saveDatabase(db);
      addAuditLog('به‌روزرسانی کتاب‌های ویژه', 'مدیریت', `تعداد ${book_ids.length} کتاب در بخش معرفی ذخیره شد.`, 'info');
    }
    return res.json({ success: true, message: 'کتاب‌های معرفی با موفقیت ذخیره شدند.', book_ids: db.homepage_cms?.featured_book_ids || [] });
  });

  // ==================== COMPETITIONS API ====================
  app.get('/api/competitions', (req, res) => {
    return res.json({ success: true, competitions: db.competitions || [] });
  });

  app.post('/api/competitions', (req, res) => {
    const newComp: Competition = {
      ...req.body,
      id: `comp-${Date.now()}`,
      created_at: new Date().toLocaleDateString('fa-IR'),
      status: req.body.status || 'پیش‌نویس',
    };
    db.competitions.unshift(newComp);
    saveDatabase(db);
    addAuditLog('ثبت مسابقه جدید', 'مدیریت', `مسابقه "${newComp.title}" ایجاد شد.`, 'info');
    return res.json({ success: true, competition: newComp, message: 'مسابقه با موفقیت ثبت شد.' });
  });

  app.put('/api/competitions/:id', (req, res) => {
    const idx = db.competitions.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'مسابقه یافت نشد.' });
    }
    db.competitions[idx] = { ...db.competitions[idx], ...req.body };
    saveDatabase(db);
    addAuditLog('ویرایش مسابقه', 'مدیریت', `مسابقه "${db.competitions[idx].title}" به‌روزرسانی شد.`, 'info');
    return res.json({ success: true, competition: db.competitions[idx], message: 'مسابقه به‌روزرسانی شد.' });
  });

  app.delete('/api/competitions', (req, res) => {
    const count = (db.competitions || []).length;
    db.competitions = [];
    saveDatabase(db);
    addAuditLog('حذف کلیه مسابقات', 'مدیریت', `تمامی ${count} مسابقه کتابخوانی حذف شدند.`, 'warning');
    return res.json({ success: true, message: 'تمامی مسابقات با موفقیت حذف شدند.' });
  });

  app.delete('/api/competitions/:id', (req, res) => {
    const targetComp = (db.competitions || []).find((c) => c.id === req.params.id);
    db.competitions = (db.competitions || []).filter((c) => c.id !== req.params.id);
    saveDatabase(db);
    addAuditLog('حذف مسابقه', 'مدیریت', `مسابقه "${targetComp?.title || req.params.id}" حذف شد.`, 'warning');
    return res.json({ success: true, message: 'مسابقه با موفقیت حذف گردید.' });
  });

  // Shelves & Subjects Configuration
  app.get('/api/shelves-config', (req, res) => {
    if (!db.shelves_config || db.shelves_config.length === 0) {
      db.shelves_config = INITIAL_SHELVES_CONFIG;
      saveDatabase(db);
    }
    return res.json({ success: true, shelves: db.shelves_config });
  });

  const handleUpdateShelves = (req: any, res: any) => {
    const { shelves } = req.body;
    if (!Array.isArray(shelves)) {
      return res.status(400).json({ success: false, message: 'آرایه قفسه‌ها نامعتبر است.' });
    }
    db.shelves_config = shelves;
    saveDatabase(db);
    addAuditLog('ویرایش قفسه‌ها و موضوعات', 'مدیریت', `پیکربندی ${shelves.length} قفسه و موضوعات به‌روزرسانی شد.`, 'info');
    return res.json({ success: true, shelves: db.shelves_config, message: 'تغییرات قفسه‌ها و موضوعات با موفقیت اعمال گردید.' });
  };

  app.put('/api/admin/shelves-config', handleUpdateShelves);
  app.put('/api/shelves-config', handleUpdateShelves);

  // Important Announcements
  app.get('/api/announcement', (req, res) => {
    return res.json({
      success: true,
      announcement_enabled: !!db.homepage_cms?.announcement_enabled,
      announcement_text: db.homepage_cms?.announcement_text || '',
    });
  });

  const handleUpdateAnnouncement = (req: any, res: any) => {
    const { announcement_enabled, announcement_text } = req.body;
    if (!db.homepage_cms) {
      db.homepage_cms = { ...INITIAL_HOMEPAGE_CMS };
    }
    db.homepage_cms.announcement_enabled = !!announcement_enabled;
    if (typeof announcement_text === 'string') {
      db.homepage_cms.announcement_text = announcement_text.trim();
    }
    saveDatabase(db);
    addAuditLog('به‌روزرسانی اطلاعیه مهم', 'مدیریت', `متن اطلاعیه مهم کتابخانه تغییر کرد: ${(db.homepage_cms.announcement_text || '').slice(0, 40)}...`, 'info');
    return res.json({
      success: true,
      announcement_enabled: db.homepage_cms.announcement_enabled,
      announcement_text: db.homepage_cms.announcement_text,
      message: 'اطلاعیه با موفقیت به‌روزرسانی گردید.',
    });
  };

  app.put('/api/admin/announcement', handleUpdateAnnouncement);
  app.put('/api/announcement', handleUpdateAnnouncement);

  // Register user for a competition
  app.post('/api/competitions/:id/register', (req, res) => {
    const { full_name, phone, unit, selected_book } = req.body;
    if (!full_name || !phone || !unit) {
      return res.status(400).json({ success: false, message: 'وارد کردن نام و نام خانوادگی، شماره تماس و انتخاب واحد الزامی است.' });
    }

    const comp = (db.competitions || []).find((c) => c.id === req.params.id);
    if (!comp) {
      return res.status(404).json({ success: false, message: 'مسابقه مورد نظر یافت نشد.' });
    }

    const cleanPhone = phone.trim();
    if (!db.competition_registrations) db.competition_registrations = [];

    // Check duplicate registration
    const existing = db.competition_registrations.find(
      (r) => r.competition_id === comp.id && r.phone === cleanPhone
    );
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'شما قبلاً در این مسابقه با این شماره تماس ثبت‌نام کرده‌اید.',
      });
    }

    const reg: CompetitionRegistration = {
      id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      competition_id: comp.id,
      competition_title: comp.title,
      full_name: full_name.trim(),
      phone: cleanPhone,
      unit,
      selected_book: selected_book ? selected_book.trim() : comp.book_title || '',
      registered_at: new Date().toLocaleDateString('fa-IR'),
    };

    db.competition_registrations.unshift(reg);
    saveDatabase(db);
    addAuditLog('ثبت‌نام مسابقه', reg.full_name, `ثبت‌نام در مسابقه "${comp.title}" (${unit})`, 'info');

    return res.json({
      success: true,
      message: 'ثبت‌نام شما در مسابقه با موفقیت انجام شد.',
      registration: reg,
    });
  });

  // Get registrants for a competition (Admin)
  app.get('/api/competitions/:id/registrants', (req, res) => {
    const list = (db.competition_registrations || []).filter((r) => r.competition_id === req.params.id);
    return res.json({ success: true, registrants: list });
  });

  // Get all users (Admin - User Info tab with full stats)
  app.get('/api/admin/users', (req, res) => {
    const usersWithStats = db.users.map((u) => {
      const userRes = db.reservations.filter((r) => r.user_phone === u.phone);
      const activeRes = userRes.filter((r) => r.status === 'در انتظار بررسی' || r.status === 'امانت فعال' || r.status === 'تأیید شده');
      const returnedRes = userRes.filter((r) => r.status === 'تحویل داده شده');
      const compRegs = (db.competition_registrations || []).filter((cr) => cr.phone === u.phone);
      return {
        ...u,
        total_reservations: userRes.length,
        active_loans_count: activeRes.length,
        returned_count: returnedRes.length,
        competitions_count: compRegs.length,
      };
    });
    return res.json({ success: true, users: usersWithStats });
  });

  // Delete user (Admin - completely deletes user so they must re-register from scratch)
  app.delete('/api/admin/users/:target', (req, res) => {
    const target = req.params.target;
    const targetIdx = db.users.findIndex((u) => u.id === target || u.phone === target);
    if (targetIdx === -1) {
      return res.status(404).json({ success: false, message: 'کاربر مورد نظر یافت نشد.' });
    }

    const removedUser = db.users[targetIdx];
    db.users.splice(targetIdx, 1);
    saveDatabase(db);
    addAuditLog(
      'حذف کاربر',
      'مدیریت',
      `کاربر «${removedUser.name} ${removedUser.family}» (${removedUser.phone}) به طور کامل از سامانه حذف شد.`,
      'warning'
    );

    return res.json({
      success: true,
      message: `کاربر «${removedUser.name} ${removedUser.family}» با موفقیت حذف گردید و در صورت تمایل به ورود، باید از ابتدا ثبت‌نام کند.`,
    });
  });

  // Toggle user block / unblock (Admin - smart blocking for violators)
  app.post('/api/admin/users/:target/toggle-block', (req, res) => {
    const target = req.params.target;
    const user = db.users.find((u) => u.id === target || u.phone === target);
    if (!user) {
      return res.status(404).json({ success: false, message: 'کاربر مورد نظر یافت نشد.' });
    }

    user.is_blocked = !user.is_blocked;
    if (user.is_blocked) {
      user.blocked_reason = req.body?.reason || 'تخلف از قوانین و مقررات کتابخانه';
      addAuditLog(
        'مسدود سازی حساب کاربر',
        'مدیریت',
        `حساب کاربری «${user.name} ${user.family}» (${user.phone}) به دلیل تخلف مسدود گردید.`,
        'security'
      );
    } else {
      delete user.blocked_reason;
      addAuditLog(
        'رفع مسدودی حساب کاربر',
        'مدیریت',
        `مسدودیت حساب کاربری «${user.name} ${user.family}» (${user.phone}) توسط مدیریت رفع گردید.`,
        'info'
      );
    }

    saveDatabase(db);
    return res.json({
      success: true,
      user,
      is_blocked: user.is_blocked,
      message: user.is_blocked
        ? `حساب کاربری «${user.name} ${user.family}» با موفقیت مسدود شد.`
        : `مسدودیت حساب کاربری «${user.name} ${user.family}» با موفقیت لغو شد و حساب فعال گردید.`,
    });
  });

  // ==================== FAQ API ====================
  const handleGetFaqs = (req: any, res: any) => {
    return res.json({
      success: true,
      categories: db.faq_categories,
      faqs: db.faqs,
    });
  };
  app.get('/api/faq', handleGetFaqs);
  app.get('/api/faqs', handleGetFaqs);

  const handleCreateFaq = (req: any, res: any) => {
    const newFaq: FAQItem = {
      id: `faq-${Date.now()}`,
      category: req.body.category || 'عضویت و اشتراک',
      question: req.body.question,
      answer: req.body.answer,
      order: db.faqs.length + 1,
      published: true,
    };
    db.faqs.push(newFaq);
    saveDatabase(db);
    addAuditLog('افزودن سؤال متداول', 'مدیریت', `سؤال "${newFaq.question}" افزوده شد.`, 'info');
    return res.json({ success: true, faq: newFaq, message: 'سؤال متداول با موفقیت اضافه شد.' });
  };
  app.post('/api/faq', handleCreateFaq);
  app.post('/api/faqs', handleCreateFaq);

  const handleUpdateFaq = (req: any, res: any) => {
    const idx = db.faqs.findIndex((f) => f.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'سؤال یافت نشد.' });
    }
    db.faqs[idx] = { ...db.faqs[idx], ...req.body };
    saveDatabase(db);
    return res.json({ success: true, faq: db.faqs[idx], message: 'سؤال به‌روزرسانی شد.' });
  };
  app.put('/api/faq/:id', handleUpdateFaq);
  app.put('/api/faqs/:id', handleUpdateFaq);

  const handleDeleteFaq = (req: any, res: any) => {
    const targetFaq = db.faqs.find((f) => f.id === req.params.id);
    db.faqs = db.faqs.filter((f) => f.id !== req.params.id);
    saveDatabase(db);
    addAuditLog('حذف سؤال متداول', 'مدیریت', `سؤال "${targetFaq?.question || req.params.id}" حذف شد.`, 'warning');
    return res.json({ success: true, message: 'سؤال با موفقیت حذف گردید.' });
  };
  app.delete('/api/faq/:id', handleDeleteFaq);
  app.delete('/api/faqs/:id', handleDeleteFaq);

  const handleDeleteAllFaqs = (req: any, res: any) => {
    const count = db.faqs.length;
    db.faqs = [];
    saveDatabase(db);
    addAuditLog('حذف کلیه سؤالات متداول', 'مدیریت', `تمامی ${count} سؤال متداول حذف شدند.`, 'warning');
    return res.json({ success: true, message: 'تمامی سؤالات متداول با موفقیت حذف گردیدند.' });
  };
  app.delete('/api/faq', handleDeleteAllFaqs);
  app.delete('/api/faqs', handleDeleteAllFaqs);

  // ==================== OPERATING HOURS & LIVE STATUS ====================
  app.get('/api/operating-hours', (req, res) => {
    return res.json({
      success: true,
      operating_hours: db.operating_hours,
    });
  });

  app.put('/api/operating-hours', (req, res) => {
    db.operating_hours = { ...db.operating_hours, ...req.body };
    saveDatabase(db);
    addAuditLog('تنظیم ساعات کاری کتابخانه', 'مدیریت', 'قوانین و استثنائات ساعت کاری به‌روز شد.', 'info');
    return res.json({ success: true, operating_hours: db.operating_hours, message: 'ساعت کاری با موفقیت به‌روز شد.' });
  });

  // ==================== HOMEPAGE CMS ====================
  app.get(['/api/homepage', '/api/site-content', '/api/homepage-cms'], (req, res) => {
    return res.json({ success: true, cms: db.homepage_cms || INITIAL_HOMEPAGE_CMS });
  });

  app.put(['/api/homepage', '/api/site-content', '/api/homepage-cms'], (req, res) => {
    const updated = { ...(db.homepage_cms || INITIAL_HOMEPAGE_CMS), ...req.body };
    // Strictly immutable fields per security and copyright specifications
    updated.footer_designer_credit = 'یونس عطاران زاده';
    updated.footer_memorial_title = 'احسان کربلایی‌پور';
    delete (updated as any).footer_email;

    db.homepage_cms = updated;
    saveDatabase(db, true);
    addAuditLog('به‌روزرسانی محتوای صفحه اصلی', 'مدیریت', 'تغییر تنظیمات، متون و ظاهر صفحه اصلی در پنل مدیریت.', 'info');
    return res.json({ success: true, cms: db.homepage_cms, message: 'محتوا و تنظیمات صفحه نخست با موفقیت ذخیره گردید.' });
  });

  app.post(['/api/homepage/reset', '/api/site-content/reset', '/api/homepage-cms/reset'], (req, res) => {
    const resetData = JSON.parse(JSON.stringify(INITIAL_HOMEPAGE_CMS));
    resetData.footer_designer_credit = 'یونس عطاران زاده';
    resetData.footer_memorial_title = 'احسان کربلایی‌پور';
    delete (resetData as any).footer_email;

    db.homepage_cms = resetData;
    saveDatabase(db, true);
    addAuditLog('بازگردانی محتوای صفحه اصلی', 'مدیریت', 'بازگردانی محتوا و ظاهر صفحه اصلی به تنظیمات پیش‌فرض اولیه.', 'warning');
    return res.json({ success: true, cms: db.homepage_cms, message: 'محتوا و ظاهر صفحه اصلی به حالت پیش‌فرض اولیه بازگردانی شد.' });
  });

  // ==================== STATS API ====================
  app.get('/api/stats', (req, res) => {
    const totalBooksCount = db.books ? db.books.length : 0;
    const availableBooksCount = (db.books || []).filter((b) => b.availability_status === 'موجود').length;
    const borrowedCount = totalBooksCount - availableBooksCount;
    const pendingReservationsCount = (db.reservations || []).filter((r) => r.status === 'در انتظار بررسی').length;

    const shelvesCount = (db.shelves_config && db.shelves_config.length > 0) ? db.shelves_config.length : 16;
    const uniqueSubjects = new Set<string>();
    (db.shelves_config || []).forEach((s) => (s.subjects || []).forEach((sub) => uniqueSubjects.add(sub)));
    (db.books || []).forEach((b) => { if (b.subject) uniqueSubjects.add(b.subject); });
    const subjectsCount = uniqueSubjects.size > 0 ? uniqueSubjects.size : 33;

    return res.json({
      success: true,
      stats: {
        totalBooks: totalBooksCount,
        availableBooks: availableBooksCount,
        borrowedBooks: borrowedCount,
        shelvesCount,
        subjectsCount,
        membersCount: Math.max((db.users || []).length, 1),
        pendingReservations: pendingReservationsCount,
        visitsCount: db.visits || 7420,
      },
      shelves: db.shelves_config || SHELVES_LIST,
      subjects: Array.from(uniqueSubjects),
    });
  });

  // ==================== AUDIT LOGS ====================
  app.get('/api/audit-logs', (req, res) => {
    return res.json({ success: true, logs: db.audit_logs });
  });

  // ==================== VITE MIDDLEWARE OR STATIC SERVING ====================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`کتابخانه شهید احسان کربلایی‌پور سرور فعال شد: http://0.0.0.0:${PORT}`);
  });
}

startServer();
