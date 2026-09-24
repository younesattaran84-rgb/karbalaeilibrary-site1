/**
 * Types and interfaces for Shahid Ehsan Karbalaeipour Library
 */

export interface ShelfItem {
  id: number;
  name: string;
  title?: string;
  description?: string;
  subjects: string[];
}

export type AvailabilityStatus = 'موجود' | 'امانت' | 'امانت داده شده' | 'رزرو شده' | 'مفقود' | 'غیرقابل امانت' | 'در حال بررسی';

export interface Book {
  id: string;
  book_number?: string;
  title: string;
  author: string;
  series?: string; // دوره
  volume?: string; // جلد
  translator?: string;
  publisher?: string;
  publication_year?: string;
  edition?: string;
  ISBN?: string;
  isbn?: string;
  subject: string;
  secondary_subject?: string;
  shelf: number; // 1 to 16+
  row_number: number | string;
  language?: string;
  description: string;
  excerpt?: string;
  story?: string;
  cover_image?: string;
  gallery_images?: string[];
  preview_video?: string;
  availability_status: AvailabilityStatus;
  current_borrower?: string;
  borrowing_date?: string;
  due_date?: string;
  reservation_allowed: boolean;
  reservation_status?: 'آزاد' | 'رزرو شده';
  tags?: string[];
  featured?: boolean;
  featured_order?: number;
  created_at: string;
  updated_at: string;
}

export type ReservationStatus = 'در انتظار بررسی' | 'تأیید شده' | 'امانت فعال' | 'رد شده' | 'تحویل داده شده' | 'پایان یافته' | 'لغو شده';

export interface Reservation {
  id: string;
  user_phone: string;
  user_name: string;
  book_id: string;
  book_title: string;
  book_number?: string;
  shelf: number;
  row_number: number | string;
  request_date: string;
  status: ReservationStatus;
  admin_notes?: string;
  pickup_deadline?: string;
  loan_duration_weeks?: 1 | 2 | 3 | 4;
  loan_days?: number;
  loan_started_at?: string;
  loan_started_iso?: string;
  due_date?: string;
  due_date_iso?: string;
  remaining_days?: number;
  extension_status?: 'ندارد' | 'در انتظار بررسی' | 'تأیید شده' | 'رد شده';
  extension_count?: number; // max 1
  extension_requested_weeks?: 1 | 2;
  hidden_from_user?: boolean;
  seen_by_user?: boolean;
}

export interface LendingRecord {
  id: string;
  reservation_id: string;
  book_id: string;
  book_title: string;
  user_phone: string;
  user_name: string;
  duration_weeks: 1 | 2 | 3 | 4;
  started_at: string;
  due_date: string;
  returned_at?: string;
  is_returned: boolean;
  extension_count: number;
  extension_status: 'ندارد' | 'در انتظار بررسی' | 'تأیید شده' | 'رد شده';
  remaining_days: number;
  notes?: string;
}

export interface UserMessage {
  id: string;
  user_name: string;
  user_phone: string;
  subject: string;
  content: string;
  created_at: string;
  is_read: boolean;
  admin_reply?: string;
  replied_at?: string;
  status: 'در انتظار پاسخ' | 'پاسخ داده شده';
  deleted_by_user?: boolean;
}

export interface ManagedFile {
  id: string;
  file_name: string;
  name?: string;
  file_type: 'excel' | 'txt';
  file_size: number;
  uploaded_at: string;
  upload_date?: string;
  records_count: number;
  rows_count?: number;
  status: 'فعال' | 'بایگانی شده';
  description?: string;
}

export interface LendingSettings {
  default_loan_days: number;
  max_active_reservations?: number;
  max_extensions: number;
  extension_days: number;
  allow_extensions?: boolean;
}

export interface RulesCMS {
  title: string;
  steps: Array<{
    step: string;
    title: string;
    items: string[];
  }>;
}

export interface UserProfile {
  id: string;
  name: string;
  family: string;
  phone: string;
  password?: string;
  membership_status: 'فعال' | 'منقضی شده' | 'در انتظار تمدید';
  lending_subscription: 'فعال' | 'ندارد';
  registered_at: string;
  active_reservations_count: number;
  notes?: string;
  is_blocked?: boolean;
  blocked_reason?: string;
}

export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  order: number;
  published: boolean;
}

export interface FAQCategory {
  id: string;
  title: string;
  name?: string;
  order: number;
}

export interface CompetitionRegistration {
  id: string;
  competition_id: string;
  competition_title: string;
  full_name: string;
  phone: string;
  unit: 'واحد راهنمایی' | 'واحد دبیرستان' | 'واحد طلاب و دانشجویان' | 'عموم مردم';
  selected_book?: string;
  registered_at: string;
}

export interface Competition {
  id: string;
  title: string;
  book_title?: string;
  sources?: string[]; // Multiple book sources if available
  poster_url?: string;
  link_url?: string;
  description: string;
  rules?: string;
  start_date: string;
  end_date: string;
  registration_info?: string;
  prizes: string | string[];
  organizer?: string;
  status: 'پیش‌نویس' | 'زمان‌بندی شده' | 'در حال برگزاری' | 'پایان یافته' | 'بایگانی' | 'به زودی';
  winners?: CompetitionWinner[];
  questions_count?: number;
  created_at?: string;
}

export interface CompetitionWinner {
  id: string;
  rank: number;
  name: string;
  prize_title: string;
  avatar_url?: string;
}

export interface DayOperatingSchedule {
  day: string; // 'شنبه' | 'یکشنبه' | 'دوشنبه' | 'سه‌شنبه' | 'چهارشنبه' | 'پنجشنبه' | 'جمعه'
  day_index?: number; // 0 to 6
  is_open: boolean;
  open_time: string; // e.g. "13:00"
  close_time: string; // e.g. "20:00"
}

export interface OperatingHours {
  regular_hours: string; // e.g., "۱۳:۰۰ تا ۲۰:۰۰"
  open_time?: string;
  close_time?: string;
  work_days: string[]; // ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه']
  friday_closed: boolean;
  weekly_schedule?: DayOperatingSchedule[];
  is_temporarily_closed?: boolean;
  temporary_closure_reason?: string;
  exceptional_open?: boolean;
  notes?: string;
}

export interface Quote {
  id: string;
  source?: string;
  author?: string;
  role?: string;
  arabic?: string;
  persian?: string;
  text?: string;
}

export interface HomepageCMS {
  [key: string]: any;
  // Hero & General
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  hero_banner_image_url?: string;
  hero_cta_search_text?: string;
  hero_cta_shelves_text?: string;
  hero_cta_eitaa_text?: string;
  hero_cta_eitaa_url?: string;
  hero_address_note?: string;
  hero_show_3d_books?: boolean;
  hero_3d_books_position?: 'balanced' | 'sides' | 'top-corners' | 'compact';
  hero_3d_books_scale?: number;
  hero_3d_books_green_theme?: boolean;
  hero_quote_text?: string;
  hero_quote_author?: string;
  hero_welcome_title?: string;
  hero_welcome_text?: string;
  announcement_enabled: boolean;
  announcement_text: string;
  featured_book_ids: string[];
  banner_image_url?: string;
  custom_video_url?: string;

  // Typography & Custom Fonts
  site_font_family?: string;
  hero_title_font?: string;
  hero_desc_font?: string;
  quotes_font?: string;
  custom_fonts?: Array<{ id: string; name: string; family: string; url: string }>;

  // Header & Navigation
  header_logo_url?: string;
  header_logo_fit?: 'contain' | 'cover' | 'fill';
  header_logo_scale?: number;
  header_logo_radius?: string;
  header_brand_title?: string;
  header_brand_subtitle?: string;
  header_cta_login_text?: string;
  header_cta_user_text?: string;
  header_eitaa_link?: string;
  header_show_live_status?: boolean;
  header_nav_items?: {
    id: string;
    label: string;
    target_tab: string;
    is_visible?: boolean;
    icon_name?: string;
  }[];

  // Live Statistics
  stats_section_title?: string;
  stats_section_subtitle?: string;
  stats_badge?: string;
  stats_cards?: {
    id: string;
    title: string;
    numeric_value: string;
    sub: string;
    icon_name: string;
    accent_color: string;
  }[];

  // Explore Shelves
  shelves_section_title?: string;
  shelves_section_subtitle?: string;
  shelves_title?: string;
  shelves_desc?: string;
  shelves_badge?: string;
  shelves_guide_text?: string;

  // Why Choose Us
  why_us_title?: string;
  why_us_subtitle?: string;
  why_us_badge?: string;
  why_us_items?: {
    id: string | number;
    title: string;
    description: string;
    badge: string;
    icon_name: string;
    color: string;
    custom_icon_url?: string;
  }[];
  why_us_cards?: any[];

  // Quotes
  quotes_section_title?: string;
  quotes_section_subtitle?: string;
  quotes_title?: string;
  quotes_subtitle?: string;
  quotes_items?: {
    id: string;
    text?: string;
    persian?: string;
    arabic?: string;
    author?: string;
    source?: string;
    role?: string;
    avatar_url?: string;
  }[];

  // Rules & Guidelines
  rules_section_title?: string;
  rules_section_subtitle?: string;
  rules_title?: string;
  rules_subtitle?: string;
  rules_steps?: any[];
  rules_items?: {
    id: string | number;
    step: string;
    title: string;
    icon_name: string;
    color: string;
    items: string[];
    custom_icon_url?: string;
  }[];

  // Footer
  footer_logo_url?: string;
  footer_description?: string;
  footer_about_text?: string;
  footer_phone?: string;
  footer_address?: string;
  footer_address_text?: string;
  footer_email?: string;
  footer_hours_text?: string;
  footer_eitaa_link?: string;
  footer_eitaa_text?: string;
  footer_neshan_link?: string;
  footer_copyright?: string;
  footer_bell_note?: string;
  footer_designer_credit?: string;
  footer_memorial_title?: string;
  footer_quick_links?: {
    id: string;
    label: string;
    target_tab: string;
  }[];
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  details: string;
  type: 'info' | 'warning' | 'security' | 'database';
}

export interface CustomFont {
  id: string;
  name: string;
  family: string;
  url: string;
  uploaded_at?: string;
}
