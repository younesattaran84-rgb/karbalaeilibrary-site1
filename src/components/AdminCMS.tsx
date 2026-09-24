import React, { useState, useRef, useEffect } from 'react';
import {
  Layout, Image as ImageIcon, Sparkles, Sliders, Type, Link, ExternalLink,
  Plus, Trash2, RotateCcw, Save, CheckCircle2, AlertCircle, Upload, Eye,
  BookOpen, HelpCircle, Layers, Bookmark, Users, CheckCircle, Shield,
  Clock, MapPin, Phone, Mail, Award, Calendar, HeartHandshake, VolumeX,
  UserCheck, BookCopy, Library, ChevronDown, ChevronUp, RefreshCw,
  ChevronRight, ChevronLeft, Palette, Box, Check
} from 'lucide-react';
import { HomepageCMS, CustomFont } from '../types';
import { INITIAL_HOMEPAGE_CMS } from '../data/initialData';
import { toPersianDigits } from '../utils/persian';
import { ColorPickerField } from './ColorPickerField';
import { FontPickerField } from './FontPickerField';
import { IconPickerField } from './IconPickerField';

interface AdminCMSProps {
  cmsData: HomepageCMS;
  onSaveCMS: (updated: HomepageCMS) => Promise<boolean>;
  onResetCMS: () => Promise<boolean>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminCMS: React.FC<AdminCMSProps> = ({
  cmsData,
  onSaveCMS,
  onResetCMS,
  showToast,
}) => {
  const [formData, setFormData] = useState<HomepageCMS>(() => ({
    ...INITIAL_HOMEPAGE_CMS,
    ...cmsData,
    // Ensure array fallbacks
    why_us_items: (cmsData.why_us_items && cmsData.why_us_items.length > 0)
      ? cmsData.why_us_items
      : (cmsData.why_us_cards && cmsData.why_us_cards.length > 0)
      ? cmsData.why_us_cards
      : INITIAL_HOMEPAGE_CMS.why_us_items,
    rules_items: (cmsData.rules_items && cmsData.rules_items.length > 0)
      ? cmsData.rules_items
      : (cmsData.rules_steps && cmsData.rules_steps.length > 0)
      ? cmsData.rules_steps
      : INITIAL_HOMEPAGE_CMS.rules_items,
  }));

  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [isFreezingDefaults, setIsFreezingDefaults] = useState(false);

  const fetchFonts = () => {
    fetch('/api/fonts')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.fonts)) {
          setCustomFonts(d.fonts);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchFonts();
  }, []);

  // Sync when prop updates
  useEffect(() => {
    if (cmsData) {
      setFormData((prev) => ({
        ...prev,
        ...cmsData,
        why_us_items: (cmsData.why_us_items && cmsData.why_us_items.length > 0)
          ? cmsData.why_us_items
          : (cmsData.why_us_cards && cmsData.why_us_cards.length > 0)
          ? cmsData.why_us_cards
          : prev.why_us_items || INITIAL_HOMEPAGE_CMS.why_us_items,
        rules_items: (cmsData.rules_items && cmsData.rules_items.length > 0)
          ? cmsData.rules_items
          : (cmsData.rules_steps && cmsData.rules_steps.length > 0)
          ? cmsData.rules_steps
          : prev.rules_items || INITIAL_HOMEPAGE_CMS.rules_items,
      }));
    }
  }, [cmsData]);

  const [activeSection, setActiveSection] = useState<
    'hero' | 'header' | 'stats' | 'shelves' | 'whyus' | 'quotes' | 'rules' | 'footer'
  >('hero');
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [sectionToReset, setSectionToReset] = useState<{ id: string; name: string } | null>(null);

  // Carousel scroll container for the navigation tabs
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      tabsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Direct fast image uploader input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadTarget, setCurrentUploadTarget] = useState<string>('');

  const handleFieldChange = (field: keyof HomepageCMS, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const triggerImageUpload = (targetField: string) => {
    setCurrentUploadTarget(targetField);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('حجم فایل نباید بیشتر از ۸ مگابایت باشد.', 'error');
      return;
    }

    setUploadingField(currentUploadTarget);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch('/api/upload/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: base64Data,
              filename: `cms_${currentUploadTarget}_${Date.now()}.${file.name.split('.').pop() || 'png'}`,
            }),
          });
          const data = await res.json();
          if (data.success && data.url) {
            handleFieldChange(currentUploadTarget as keyof HomepageCMS, data.url);
            showToast('لوگو/تصویر با موفقیت در سرور آپلود شد.');
          } else {
            showToast(data.message || 'خطا در بارگذاری تصویر', 'error');
          }
        } catch {
          showToast('خطا در برقراری ارتباط با سرور آپلود', 'error');
        } finally {
          setUploadingField(null);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingField(null);
      showToast('خطا در خواندن فایل تصویر', 'error');
    }
    e.target.value = '';
  };

  // Helper to build synchronized CMS payload
  const buildSynchronizedPayload = (customData?: Partial<HomepageCMS>): HomepageCMS => {
    const data = { ...formData, ...customData };
    const payload: HomepageCMS = {
      ...data,
      why_us_items: data.why_us_items || [],
      why_us_cards: data.why_us_items || [],
      rules_items: data.rules_items || [],
      rules_steps: data.rules_items || [],
      rules_section_title: data.rules_section_title || data.rules_title,
      rules_title: data.rules_section_title || data.rules_title,
      rules_section_subtitle: data.rules_section_subtitle || data.rules_subtitle,
      rules_subtitle: data.rules_section_subtitle || data.rules_subtitle,
      shelves_section_title: data.shelves_section_title || data.shelves_title,
      shelves_title: data.shelves_section_title || data.shelves_title,
      shelves_section_subtitle: data.shelves_section_subtitle || data.shelves_desc,
      shelves_desc: data.shelves_section_subtitle || data.shelves_desc,
      quotes_section_title: data.quotes_section_title || data.quotes_title,
      quotes_title: data.quotes_section_title || data.quotes_title,
      quotes_section_subtitle: data.quotes_section_subtitle || data.quotes_subtitle,
      quotes_subtitle: data.quotes_section_subtitle || data.quotes_subtitle,
      footer_description: data.footer_description || data.footer_about_text,
      footer_about_text: data.footer_description || data.footer_about_text,
      footer_address: data.footer_address || data.footer_address_text,
      footer_address_text: data.footer_address || data.footer_address_text,
      hero_title: data.hero_title || data.hero_quote_text || '',
      hero_quote_text: data.hero_title || data.hero_quote_text || '',
      hero_subtitle: data.hero_subtitle || data.hero_welcome_title || '',
      hero_welcome_title: data.hero_subtitle || data.hero_welcome_title || '',
      hero_description: data.hero_description || data.hero_welcome_text || '',
      hero_welcome_text: data.hero_description || data.hero_welcome_text || '',
      footer_designer_credit: 'یونس عطاران زاده',
      footer_memorial_title: 'احسان کربلایی‌پور',
    };
    delete (payload as any).footer_email;
    return payload;
  };

  // Reliable Save for a specific section
  const handleSaveSection = async (sectionTitleFa: string) => {
    setSaving(true);
    try {
      const payload = buildSynchronizedPayload();
      const ok = await onSaveCMS(payload);
      if (ok) {
        setFormData(payload);
        showToast(`تغییرات بخش «${sectionTitleFa}» با موفقیت و قطعیت ذخیره شد.`);
      } else {
        showToast(`خطا در ذخیره تغییرات بخش ${sectionTitleFa}`, 'error');
      }
    } catch {
      showToast('خطا در اتصال به سرور', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Finalize all current CMS changes permanently as default system state
  const handleMakeDefaultsPermanently = async () => {
    setIsFreezingDefaults(true);
    try {
      const payload = buildSynchronizedPayload();
      const ok = await onSaveCMS(payload);
      if (ok) {
        setFormData(payload);
        const res = await fetch('/api/cms/make-defaults', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          showToast('تمامی تغییرات اعمال‌شده نهایی شدند و به عنوان پیش‌فرض دائمی در حافظه تثبیت گردیدند.');
        } else {
          showToast(data.message || 'خطا در ثبت پیش‌فرض', 'error');
        }
      } else {
        showToast('خطا در ذخیره‌سازی داده‌های CMS', 'error');
      }
    } catch {
      showToast('خطا در برقراری ارتباط با سرور', 'error');
    } finally {
      setIsFreezingDefaults(false);
    }
  };

  // Reset a specific section back to defaults
  const handleConfirmSectionReset = async () => {
    if (!sectionToReset) return;
    const { id: sectionId, name: sectionTitleFa } = sectionToReset;
    setSectionToReset(null);
    setSaving(true);

    try {
      const defaults = INITIAL_HOMEPAGE_CMS;
      let partialReset: Partial<HomepageCMS> = {};

      if (sectionId === 'hero') {
        partialReset = {
          hero_title: defaults.hero_title,
          hero_quote_text: defaults.hero_quote_text || defaults.hero_title,
          hero_quote_author: defaults.hero_quote_author,
          hero_title_font: defaults.hero_title_font,
          hero_subtitle: defaults.hero_subtitle,
          hero_welcome_title: defaults.hero_welcome_title || defaults.hero_subtitle,
          hero_description: defaults.hero_description,
          hero_welcome_text: defaults.hero_welcome_text || defaults.hero_description,
          hero_desc_font: defaults.hero_desc_font,
          hero_cta_search_text: defaults.hero_cta_search_text,
          hero_cta_shelves_text: defaults.hero_cta_shelves_text,
          hero_cta_eitaa_text: defaults.hero_cta_eitaa_text,
          hero_cta_eitaa_url: defaults.hero_cta_eitaa_url,
          hero_address_note: defaults.hero_address_note,
          hero_show_3d_books: defaults.hero_show_3d_books,
          hero_3d_books_position: defaults.hero_3d_books_position,
          hero_3d_books_green_theme: defaults.hero_3d_books_green_theme,
          hero_3d_books_scale: defaults.hero_3d_books_scale,
          hero_banner_image_url: defaults.hero_banner_image_url,
        };
      } else if (sectionId === 'header') {
        partialReset = {
          header_logo_url: defaults.header_logo_url,
          header_logo_scale: defaults.header_logo_scale,
          header_logo_fit: defaults.header_logo_fit,
          header_logo_radius: defaults.header_logo_radius,
          header_brand_title: defaults.header_brand_title,
          header_brand_subtitle: defaults.header_brand_subtitle,
          header_cta_login_text: defaults.header_cta_login_text,
          header_cta_user_text: defaults.header_cta_user_text,
          header_eitaa_link: defaults.header_eitaa_link,
          header_show_live_status: defaults.header_show_live_status,
          header_nav_items: defaults.header_nav_items,
        };
      } else if (sectionId === 'stats') {
        partialReset = {
          stats_section_title: defaults.stats_section_title,
          stats_section_subtitle: defaults.stats_section_subtitle,
          stats_cards: defaults.stats_cards,
        };
      } else if (sectionId === 'shelves') {
        partialReset = {
          shelves_section_title: defaults.shelves_section_title,
          shelves_title: defaults.shelves_title || defaults.shelves_section_title,
          shelves_section_subtitle: defaults.shelves_section_subtitle,
          shelves_desc: defaults.shelves_desc || defaults.shelves_section_subtitle,
          shelves_guide_text: defaults.shelves_guide_text,
        };
      } else if (sectionId === 'whyus') {
        partialReset = {
          why_us_title: defaults.why_us_title,
          why_us_subtitle: defaults.why_us_subtitle,
          why_us_items: defaults.why_us_items,
          why_us_cards: defaults.why_us_cards || defaults.why_us_items,
        };
      } else if (sectionId === 'quotes') {
        partialReset = {
          quotes_section_title: defaults.quotes_section_title,
          quotes_title: defaults.quotes_title || defaults.quotes_section_title,
          quotes_section_subtitle: defaults.quotes_section_subtitle,
          quotes_subtitle: defaults.quotes_subtitle || defaults.quotes_section_subtitle,
          quotes_font: defaults.quotes_font,
          quotes_items: defaults.quotes_items,
        };
      } else if (sectionId === 'rules') {
        partialReset = {
          rules_section_title: defaults.rules_section_title,
          rules_title: defaults.rules_title || defaults.rules_section_title,
          rules_section_subtitle: defaults.rules_section_subtitle,
          rules_subtitle: defaults.rules_subtitle || defaults.rules_section_subtitle,
          rules_items: defaults.rules_items,
          rules_steps: defaults.rules_steps || defaults.rules_items,
        };
      } else if (sectionId === 'footer') {
        partialReset = {
          footer_logo_url: defaults.footer_logo_url,
          footer_description: defaults.footer_description,
          footer_about_text: defaults.footer_about_text || defaults.footer_description,
          footer_phone: defaults.footer_phone,
          footer_address: defaults.footer_address,
          footer_address_text: defaults.footer_address_text || defaults.footer_address,
          footer_hours_text: defaults.footer_hours_text,
          footer_eitaa_link: defaults.footer_eitaa_link,
          footer_neshan_link: defaults.footer_neshan_link,
          footer_bell_note: defaults.footer_bell_note,
          footer_eitaa_text: defaults.footer_eitaa_text,
          footer_copyright: defaults.footer_copyright,
          footer_designer_credit: 'یونس عطاران زاده',
          footer_memorial_title: 'احسان کربلایی‌پور',
          footer_quick_links: defaults.footer_quick_links,
        };
      }

      const payload = buildSynchronizedPayload(partialReset);
      const ok = await onSaveCMS(payload);
      if (ok) {
        setFormData(payload);
        showToast(`تنظیمات بخش «${sectionTitleFa}» با موفقیت به پیش‌فرض اولیه بازگردانده شد.`);
      }
    } catch {
      showToast('خطا در بازگردانی تنظیمات بخش', 'error');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'hero', label: 'بنر اصلی و معرفی', icon: Sparkles },
    { id: 'header', label: 'هدر و ناوبری', icon: Layout },
    { id: 'stats', label: 'آمار زنده کتابخانه', icon: Layers },
    { id: 'shelves', label: 'کاوش در قفسه‌ها', icon: BookOpen },
    { id: 'whyus', label: 'چرا کتابخانه ما؟', icon: Award },
    { id: 'quotes', label: 'کلام بزرگان', icon: Bookmark },
    { id: 'rules', label: 'قوانین و راهنما', icon: Shield },
    { id: 'footer', label: 'فوتر سایت', icon: Clock },
  ] as const;

  const currentSectionMeta = sections.find((s) => s.id === activeSection) || sections[0];

  // Component for section header with specific save/reset buttons
  const SectionHeader: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#0d9488]/30 pb-3">
      <h3 className="text-base font-bold text-[#84cc16] flex items-center gap-2">
        {icon}
        <span>{title}</span>
      </h3>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          disabled={saving}
          onClick={() => setSectionToReset({ id: activeSection, name: currentSectionMeta.label })}
          className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          title={`بازگردانی پیش‌فرض بخش ${currentSectionMeta.label}`}
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          <span>بازگردانی این بخش</span>
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => handleSaveSection(currentSectionMeta.label)}
          className="px-4 py-1.5 rounded-xl bg-[#84cc16] hover:bg-[#a3e635] text-[#042f2e] text-xs font-black flex items-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'در حال ذخیره‌سازی...' : `ذخیره تغییرات این بخش`}</span>
        </button>
      </div>
    </div>
  );

  // Component for section footer action bar
  const SectionFooter: React.FC<{ title: string }> = ({ title }) => (
    <div className="pt-5 border-t border-[#0d9488]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
      <span className="text-xs text-[#99f6e4]/80">
        تغییرات اختصاصی بخش <strong>{title}</strong> پس از زدن دکمه ذخیره، مستقیماً و بلافاصله در صفحه سایت اعمال خواهد شد.
      </span>
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={() => setSectionToReset({ id: activeSection, name: currentSectionMeta.label })}
          className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          <span>بازگردانی پیش‌فرض این بخش</span>
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => handleSaveSection(title)}
          className="px-5 py-2 rounded-xl bg-[#84cc16] hover:bg-[#a3e635] text-[#042f2e] text-xs font-black flex items-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'در حال ذخیره‌سازی...' : `ذخیره تغییرات ${title}`}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hidden File Input for Fast Image Uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header & Section Action Bar */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#042f2e] via-[#073834] to-[#042f2e] border border-[#0d9488]/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#84cc16]/20 border border-[#84cc16]/40 text-[#a3e635]">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span>مدیریت ظاهر و محتوای صفحه اصلی</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#84cc16]/20 text-[#a3e635] border border-[#84cc16]/40 font-bold">
                بخش فعال: {currentSectionMeta.label}
              </span>
            </h2>
            <p className="text-xs text-[#99f6e4]/80 mt-1">
              تغییرات هر بخش به‌صورت تفکیک‌شده و با دکمه اختصاصی همان بخش ذخیره یا بازگردانی می‌شود.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            disabled={saving || isFreezingDefaults}
            onClick={handleMakeDefaultsPermanently}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#0d9488]/30 hover:bg-[#0d9488]/50 text-[#5eead4] border border-[#0d9488]/60 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="تثبیت نهایی تمام تنظیمات اعمال‌شده در حافظه دائم و پیش‌فرض سامانه"
          >
            <Sparkles className="w-4 h-4 text-[#84cc16]" />
            <span>{isFreezingDefaults ? 'در حال تثبیت...' : 'نهایی‌سازی و پیش‌فرض دائم'}</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => setSectionToReset({ id: activeSection, name: currentSectionMeta.label })}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title={`بازگردانی مقادیر پیش‌فرض بخش ${currentSectionMeta.label}`}
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>بازگردانی پیش‌فرض این بخش</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveSection(currentSectionMeta.label)}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#84cc16] hover:bg-[#a3e635] text-[#042f2e] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#84cc16]/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'در حال ذخیره‌سازی فوری...' : `ذخیره تغییرات ${currentSectionMeta.label}`}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar with Right & Left Arrow Carousel Buttons */}
      <div className="relative flex items-center group">
        {/* Right Arrow (Scrolls right / forward in RTL) */}
        <button
          type="button"
          onClick={() => scrollTabs('right')}
          className="shrink-0 w-8 h-8 rounded-full bg-[#073834] hover:bg-[#0d9488] text-[#84cc16] hover:text-white border border-[#0d9488]/50 shadow-md flex items-center justify-center transition-all ml-1.5 cursor-pointer z-10"
          title="بخش‌های قبلی"
          aria-label="اسکرول به راست"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Scrollable Tabs */}
        <div
          ref={tabsScrollRef}
          className="flex-1 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar scroll-smooth"
        >
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`shrink-0 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-[#84cc16] to-[#65a30d] text-[#042f2e] font-black shadow-md shadow-[#84cc16]/30 scale-102'
                    : 'bg-[#042f2e] text-[#ccfbf1] hover:bg-[#073834] hover:text-white border border-[#0d9488]/30'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#042f2e]' : 'text-[#84cc16]'}`} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Left Arrow (Scrolls left / forward in RTL) */}
        <button
          type="button"
          onClick={() => scrollTabs('left')}
          className="shrink-0 w-8 h-8 rounded-full bg-[#073834] hover:bg-[#0d9488] text-[#84cc16] hover:text-white border border-[#0d9488]/50 shadow-md flex items-center justify-center transition-all mr-1.5 cursor-pointer z-10"
          title="بخش‌های بعدی"
          aria-label="اسکرول به چپ"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* SECTION 1: HERO (بنر اصلی و معرفی) */}
      {activeSection === 'hero' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#042f2e] border border-[#0d9488]/40 shadow-lg space-y-6">
            <SectionHeader
              title="تنظیمات تیتر و متن بنر اصلی (Hero Banner)"
              icon={<Sparkles className="w-5 h-5 text-[#84cc16]" />}
            />

            {/* Headline Quote */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#ccfbf1]">
                تیتر شعار بالای صفحه (هر کلمه با هاور انیمیشن جهش دارد و واژه کتاب به رنگ سبز اختصاصی می‌درخشد)
              </label>
              <textarea
                rows={2}
                value={formData.hero_title || formData.hero_quote_text || ''}
                onChange={(e) => {
                  handleFieldChange('hero_title', e.target.value);
                  handleFieldChange('hero_quote_text', e.target.value);
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-sm focus:outline-none focus:border-[#84cc16]"
                placeholder="«کتاب‌ها کشتی‌هایی هستند که ما را به سرزمین‌های دور می‌برند»"
              />
              <p className="text-[11px] text-[#99f6e4]/70">
                با زدن دکمه اینتر (Enter)، متن به سطر بعدی می‌رود و دقیقاً در صفحه سایت منعکس می‌شود.
              </p>
            </div>

            {/* Font Picker for Headline */}
            <FontPickerField
              label="فونت تیتر اصلی صفحه"
              value={formData.hero_title_font}
              customFonts={customFonts}
              onChange={(f: string) => handleFieldChange('hero_title_font', f)}
              onFontUploaded={(f) => {
                fetchFonts();
                handleFieldChange('hero_title_font', `'${f.family}', sans-serif`);
              }}
            />

            {/* Quote Author */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#ccfbf1]">
                گوینده یا منبع شعار اصلی
              </label>
              <input
                type="text"
                value={formData.hero_quote_author || ''}
                onChange={(e) => handleFieldChange('hero_quote_author', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-sm focus:outline-none focus:border-[#84cc16]"
                placeholder="فرانسیس بیکن"
              />
            </div>

            {/* Welcome Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#ccfbf1]">
                  عنوان خوش‌آمدگویی
                </label>
                <input
                  type="text"
                  value={formData.hero_welcome_title || formData.hero_subtitle || ''}
                  onChange={(e) => {
                    handleFieldChange('hero_welcome_title', e.target.value);
                    handleFieldChange('hero_subtitle', e.target.value);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-sm focus:outline-none focus:border-[#84cc16]"
                  placeholder="به کتابخانه شهید احسان کربلایی‌پور خوش آمدید"
                />
              </div>

              {/* Font Picker for Welcome Text */}
              <FontPickerField
                label="فونت متن توضیحات خوش‌آمدگویی"
                value={formData.hero_desc_font}
                customFonts={customFonts}
                onChange={(f: string) => handleFieldChange('hero_desc_font', f)}
                onFontUploaded={(f) => {
                  fetchFonts();
                  handleFieldChange('hero_desc_font', `'${f.family}', sans-serif`);
                }}
              />
            </div>

            {/* Welcome Description Textarea with Enter support */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#ccfbf1]">
                متن کامل پاراگراف معرفی و خوش‌آمدگویی (پشتیبانی کامل از اینتر و چندسطری)
              </label>
              <textarea
                rows={5}
                value={formData.hero_welcome_text || formData.hero_description || ''}
                onChange={(e) => {
                  handleFieldChange('hero_welcome_text', e.target.value);
                  handleFieldChange('hero_description', e.target.value);
                }}
                className="w-full px-4 py-3 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-sm leading-relaxed focus:outline-none focus:border-[#84cc16]"
                placeholder="اینجا خانه‌ای برای اندیشه‌هاست..."
              />
              <p className="text-[11px] text-[#99f6e4]/70">
                هر اینتر (Enter) به عنوان پاراگراف یا سطر جدید در صفحه سایت ذخیره و به همان صورت نمایش داده می‌شود.
              </p>
            </div>

            {/* CTA Buttons Text */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#ccfbf1]">دکمه اول (جستجو)</label>
                <input
                  type="text"
                  value={formData.hero_cta_search_text || ''}
                  onChange={(e) => handleFieldChange('hero_cta_search_text', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#ccfbf1]">دکمه دوم (قفسه‌ها)</label>
                <input
                  type="text"
                  value={formData.hero_cta_shelves_text || ''}
                  onChange={(e) => handleFieldChange('hero_cta_shelves_text', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#ccfbf1]">دکمه سوم (ایتا)</label>
                <input
                  type="text"
                  value={formData.hero_cta_eitaa_text || ''}
                  onChange={(e) => handleFieldChange('hero_cta_eitaa_text', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
                />
              </div>
            </div>

            {/* Quick Address Bar */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#ccfbf1]">یادداشت نشانی کوتاه زیر دکمه‌ها</label>
              <textarea
                rows={2}
                value={formData.hero_address_note || ''}
                onChange={(e) => handleFieldChange('hero_address_note', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
              />
            </div>
          </div>

          {/* 3D Books Responsive Placement & Settings */}
          <div className="p-6 rounded-2xl bg-[#042f2e] border border-[#0d9488]/40 shadow-lg space-y-6">
            <h3 className="text-base font-bold text-[#84cc16] flex items-center gap-2 border-b border-[#0d9488]/30 pb-3">
              <Box className="w-5 h-5 text-[#84cc16]" />
              <span>تنظیمات محل قرارگیری کتاب‌های سه‌بعدی شناور در صفحه اصلی (3D Floating Books)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Show/Hide Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#073834] border border-[#0d9488]/40">
                <div>
                  <span className="text-xs font-bold text-white block">نمایش کتاب‌های سه‌بعدی</span>
                  <span className="text-[11px] text-[#99f6e4]/70">فعال بودن افکت سه‌بعدی در صفحه اصلی</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.hero_show_3d_books !== false}
                  onChange={(e) => handleFieldChange('hero_show_3d_books', e.target.checked)}
                  className="w-5 h-5 accent-[#84cc16] rounded cursor-pointer"
                />
              </div>

              {/* Force Green Theme Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#073834] border border-[#0d9488]/40">
                <div>
                  <span className="text-xs font-bold text-white block">رنگ جلد کتاب‌ها به رنگ سبز</span>
                  <span className="text-[11px] text-[#99f6e4]/70">تک‌رنگ سبز زیتونی و فیروزه‌ای اصیل</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.hero_3d_books_green_theme !== false}
                  onChange={(e) => handleFieldChange('hero_3d_books_green_theme', e.target.checked)}
                  className="w-5 h-5 accent-[#84cc16] rounded cursor-pointer"
                />
              </div>

              {/* Scale Slider */}
              <div className="p-4 rounded-xl bg-[#073834] border border-[#0d9488]/40 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">اندازه و مقیاس کتاب‌ها</span>
                  <span className="text-[#84cc16] font-mono">{formData.hero_3d_books_scale || 100}٪</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="140"
                  step="5"
                  value={formData.hero_3d_books_scale || 100}
                  onChange={(e) => handleFieldChange('hero_3d_books_scale', Number(e.target.value))}
                  className="w-full accent-[#84cc16] cursor-pointer"
                />
              </div>
            </div>

            {/* Position Layout Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#ccfbf1]">
                نحوه چیدمان و موقعیت مکانی کتاب‌های سه‌بعدی در صفحه هوم (ریسپانسیو):
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    id: 'balanced',
                    title: 'چیدمان متعادل (پیش‌فرض)',
                    desc: 'یک کتاب بالا-راست، دو کتاب در کناره‌های چپ و راست، و یک کتاب در پایین',
                  },
                  {
                    id: 'sides',
                    title: 'کناره‌های عریض (Sides)',
                    desc: 'کتاب‌ها به گوشه‌های بیرونی‌تر کشیده می‌شوند تا متن در مرکز کاملاً باز باشد',
                  },
                  {
                    id: 'top-corners',
                    title: 'گوشه‌های بالایی (Top Corners)',
                    desc: 'کتاب‌های سه‌بعدی به سمت بالای کادر و دو طرف لوگو هدایت می‌شوند',
                  },
                  {
                    id: 'compact',
                    title: 'جمع‌وجور (Compact)',
                    desc: 'کتاب‌ها با فاصله کمتر و چسبیده‌تر به بخش محتوای متنی قرار می‌گیرند',
                  },
                ].map((pos) => {
                  const isCurrent = (formData.hero_3d_books_position || 'balanced') === pos.id;
                  return (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => handleFieldChange('hero_3d_books_position', pos.id)}
                      className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#073834] border-[#84cc16] shadow-md shadow-[#84cc16]/20'
                          : 'bg-[#073834]/40 border-[#0d9488]/30 hover:border-[#84cc16]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${isCurrent ? 'text-[#84cc16]' : 'text-white'}`}>
                          {pos.title}
                        </span>
                        {isCurrent && <Check className="w-4 h-4 text-[#84cc16]" />}
                      </div>
                      <p className="text-[11px] text-[#99f6e4]/70 leading-relaxed">
                        {pos.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <SectionFooter title="بنر اصلی و معرفی" />
          </div>
        </div>
      )}

      {/* SECTION 2: HEADER (هدر و ناوبری) */}
      {activeSection === 'header' && (
        <div className="p-6 rounded-2xl bg-[#042f2e] border border-[#0d9488]/40 shadow-lg space-y-6">
          <SectionHeader
            title="تنظیمات هدر، لوگو و وضعیت باز/بسته بودن (Header)"
            icon={<Layout className="w-5 h-5 text-[#84cc16]" />}
          />

          {/* Logo Upload & Professional Fit Controls */}
          <div className="p-5 rounded-2xl bg-[#073834] border border-[#0d9488]/40 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Logo Preview */}
              <div className="shrink-0 w-24 h-24 rounded-2xl bg-[#042f2e] border-2 border-[#0d9488]/60 p-2 flex items-center justify-center overflow-hidden shadow-inner">
                <img
                  src={formData.header_logo_url || '/assets/sahne_vajeha_logo.png'}
                  alt="لوگو کتابخانه"
                  style={{
                    objectFit: formData.header_logo_fit || 'contain',
                    transform: formData.header_logo_scale ? `scale(${formData.header_logo_scale / 100})` : undefined,
                    borderRadius: formData.header_logo_radius || '1rem',
                  }}
                  className="w-full h-full filter drop-shadow-md"
                />
              </div>

              <div className="flex-1 space-y-2 text-right">
                <span className="text-xs font-bold text-white block">لوگوی اختصاصی کتابخانه (صحن واژه‌ها)</span>
                <p className="text-[11px] text-[#99f6e4]/70">
                  لوگو با سرعت بالا مستقیماً در سرور ذخیره می‌شود و در هدر، فوتر و صفحه خوش‌آمدگویی هماهنگ می‌گردد.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => triggerImageUpload('header_logo_url')}
                    disabled={uploadingField === 'header_logo_url'}
                    className="px-4 py-2 rounded-xl bg-[#84cc16] hover:bg-[#a3e635] text-[#042f2e] font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingField === 'header_logo_url' ? 'در حال آپلود سریع...' : 'آپلود لوگوی جدید'}</span>
                  </button>

                  {formData.header_logo_url && (
                    <button
                      type="button"
                      onClick={() => handleFieldChange('header_logo_url', '/assets/sahne_vajeha_logo.png')}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs border border-white/20 transition-all cursor-pointer"
                    >
                      بازنشانی به لوگوی اصلی
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Logo Fit & Dimension Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-[#0d9488]/30">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#ccfbf1]">حالت فیت شدن با کادر (Object Fit)</label>
                <select
                  value={formData.header_logo_fit || 'contain'}
                  onChange={(e) => handleFieldChange('header_logo_fit', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white text-xs"
                >
                  <option value="contain">حفظ تناسب و تناسب کامل (Contain)</option>
                  <option value="cover">پر کردن کامل کادر (Cover)</option>
                  <option value="fill">کشیدگی کامل کادر (Fill)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#ccfbf1]">مقیاس ابعاد لوگو</span>
                  <span className="text-[#84cc16] font-mono">{formData.header_logo_scale || 100}٪</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  step="5"
                  value={formData.header_logo_scale || 100}
                  onChange={(e) => handleFieldChange('header_logo_scale', Number(e.target.value))}
                  className="w-full accent-[#84cc16] cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#ccfbf1]">گوشه‌های کادر لوگو (Radius)</label>
                <select
                  value={formData.header_logo_radius || '1rem'}
                  onChange={(e) => handleFieldChange('header_logo_radius', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white text-xs"
                >
                  <option value="0.5rem">گوشه‌های نرم کوچک (8px)</option>
                  <option value="1rem">گوشه‌های نرم استاندارد (16px)</option>
                  <option value="1.5rem">گوشه‌های گرد بزرگ (24px)</option>
                  <option value="9999px">دایره کامل (Full Circle)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Titles & Channels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#ccfbf1]">عنوان برند در هدر</label>
              <input
                type="text"
                value={formData.header_brand_title || ''}
                onChange={(e) => handleFieldChange('header_brand_title', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#ccfbf1]">زیرعنوان برند در هدر</label>
              <input
                type="text"
                value={formData.header_brand_subtitle || ''}
                onChange={(e) => handleFieldChange('header_brand_subtitle', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#ccfbf1]">لینک کانال ایتا</label>
              <input
                type="text"
                value={formData.header_eitaa_link || ''}
                onChange={(e) => handleFieldChange('header_eitaa_link', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-sm text-left"
                dir="ltr"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-[#073834] border border-[#0d9488]/40 self-end">
              <div>
                <span className="text-xs font-bold text-white block">نمایش بج وضعیت باز/بسته بودن</span>
                <span className="text-[11px] text-[#99f6e4]/70">هاله چرخشی زنده سبز و قرمز</span>
              </div>
              <input
                type="checkbox"
                checked={formData.header_show_live_status !== false}
                onChange={(e) => handleFieldChange('header_show_live_status', e.target.checked)}
                className="w-5 h-5 accent-[#84cc16] rounded cursor-pointer"
              />
            </div>
          </div>

          <SectionFooter title="هدر و ناوبری" />
        </div>
      )}

      {/* SECTION 3: STATS (آمار زنده کتابخانه) */}
      {activeSection === 'stats' && (
        <div className="p-6 rounded-2xl bg-[#042f2e] border border-[#0d9488]/40 shadow-lg space-y-6">
          <SectionHeader
            title="تنظیمات بخش آمار زنده کتابخانه (Stats)"
            icon={<Layers className="w-5 h-5 text-[#84cc16]" />}
          />

          {/* Smart Notice */}
          <div className="p-4 rounded-xl bg-[#073834] border-r-4 border-r-[#84cc16] border border-[#0d9488]/40 text-xs text-[#ccfbf1] leading-relaxed">
            <strong className="text-[#a3e635] block mb-1">سیستم محاسبات خودکار و هوشمند آمار:</strong>
            تعداد دقیق کتاب‌ها، تعداد قفسه‌ها و تعداد موضوعات فعال به‌صورت خودکار و مستقیم از موجودی پایگاه‌داده کتابخانه استخراج و با انیمیشن شمارش معکوس به نمایش درمی‌آید. به همین منظور فیلدهای متنی ثابت برای این بخش قابل ویرایش است.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#ccfbf1]">بج عنوان بخش</label>
              <input
                type="text"
                value={formData.stats_badge || ''}
                onChange={(e) => handleFieldChange('stats_badge', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#ccfbf1]">عنوان اصلی بخش آمار</label>
              <input
                type="text"
                value={formData.stats_section_title || (formData as any).stats_title || ''}
                onChange={(e) => {
                  handleFieldChange('stats_section_title', e.target.value);
                  handleFieldChange('stats_title' as any, e.target.value);
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#ccfbf1]">توضیحات زیرعنوان بخش آمار (با پشتیبانی از اینتر)</label>
            <textarea
              rows={3}
              value={formData.stats_section_subtitle || (formData as any).stats_desc || ''}
              onChange={(e) => {
                handleFieldChange('stats_section_subtitle', e.target.value);
                handleFieldChange('stats_desc' as any, e.target.value);
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-sm"
            />
          </div>

          <SectionFooter title="آمار زنده کتابخانه" />
        </div>
      )}

      {/* SECTION 4: SHELVES (کاوش در قفسه‌ها) */}
      {activeSection === 'shelves' && (
        <div className="p-6 rounded-2xl bg-[#042f2e] border border-[#0d9488]/40 shadow-lg space-y-6">
          <SectionHeader
            title="تنظیمات بخش کاوش در قفسه‌ها (Shelves)"
            icon={<BookOpen className="w-5 h-5 text-[#84cc16]" />}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#ccfbf1]">بج عنوان قفسه‌ها</label>
              <input
                type="text"
                value={formData.shelves_badge || ''}
                onChange={(e) => handleFieldChange('shelves_badge', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#ccfbf1]">عنوان اصلی بخش قفسه‌ها</label>
              <input
                type="text"
                value={formData.shelves_section_title || formData.shelves_title || ''}
                onChange={(e) => {
                  handleFieldChange('shelves_section_title', e.target.value);
                  handleFieldChange('shelves_title', e.target.value);
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#ccfbf1]">توضیحات بخش قفسه‌ها (با پشتیبانی از اینتر)</label>
            <textarea
              rows={3}
              value={formData.shelves_section_subtitle || formData.shelves_desc || ''}
              onChange={(e) => {
                handleFieldChange('shelves_section_subtitle', e.target.value);
                handleFieldChange('shelves_desc', e.target.value);
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-sm"
            />
          </div>

          <SectionFooter title="کاوش در قفسه‌ها" />
        </div>
      )}

      {/* SECTION 5: WHY US (چرا کتابخانه ما؟) */}
      {activeSection === 'whyus' && (
        <div className="p-6 rounded-2xl bg-[#042f2e] border border-[#0d9488]/40 shadow-lg space-y-6">
          <SectionHeader
            title="تنظیمات بخش چرا کتابخانه ما؟ (ویژگی‌ها و کارت‌ها)"
            icon={<Award className="w-5 h-5 text-[#84cc16]" />}
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[#99f6e4]/80">مدیریت کارت‌های ۵ گانه ویژگی‌ها و امتیازات کتابخانه:</span>
            <button
              type="button"
              onClick={() => {
                const current = formData.why_us_items || [];
                const newItem = {
                  id: Date.now(),
                  title: 'ویژگی جدید کتابخانه',
                  description: 'توضیحات جامع این ویژگی را وارد فرمایید.',
                  badge: 'ویژگی ممتاز',
                  icon_name: 'Sparkles',
                  color: '#84cc16',
                };
                handleFieldChange('why_us_items', [...current, newItem]);
                handleFieldChange('why_us_cards', [...current, newItem]);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#84cc16] hover:bg-[#a3e635] text-[#042f2e] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن کارت ویژگی</span>
            </button>
          </div>

          {/* Section Titles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#ccfbf1]">بج عنوان</label>
              <input
                type="text"
                value={formData.why_us_badge || ''}
                onChange={(e) => handleFieldChange('why_us_badge', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#ccfbf1]">تیتر اصلی بخش</label>
              <input
                type="text"
                value={formData.why_us_title || ''}
                onChange={(e) => handleFieldChange('why_us_title', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#ccfbf1]">زیرعنوان بخش</label>
              <input
                type="text"
                value={formData.why_us_subtitle || ''}
                onChange={(e) => handleFieldChange('why_us_subtitle', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
              />
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-4 pt-2">
            {(formData.why_us_items || []).map((card, idx) => (
              <div
                key={card.id || idx}
                className="p-5 rounded-2xl bg-[#073834] border border-[#0d9488]/40 space-y-4 relative"
                style={{
                  borderTopColor: card.color?.startsWith('#') ? card.color : '#84cc16',
                  borderTopWidth: '3px',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#84cc16]">
                    کارت شماره {toPersianDigits(idx + 1)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (formData.why_us_items || []).filter((_, i) => i !== idx);
                      handleFieldChange('why_us_items', updated);
                      handleFieldChange('why_us_cards', updated);
                    }}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs transition-colors cursor-pointer"
                    title="حذف کارت"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#ccfbf1]">عنوان کارت</label>
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => {
                        const updated = [...(formData.why_us_items || [])];
                        updated[idx].title = e.target.value;
                        handleFieldChange('why_us_items', updated);
                        handleFieldChange('why_us_cards', updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#ccfbf1]">بج گوشه کارت</label>
                    <input
                      type="text"
                      value={card.badge}
                      onChange={(e) => {
                        const updated = [...(formData.why_us_items || [])];
                        updated[idx].badge = e.target.value;
                        handleFieldChange('why_us_items', updated);
                        handleFieldChange('why_us_cards', updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#ccfbf1]">متن توضیحات کارت (پشتیبانی کامل از اینتر)</label>
                  <textarea
                    rows={3}
                    value={card.description}
                    onChange={(e) => {
                      const updated = [...(formData.why_us_items || [])];
                      updated[idx].description = e.target.value;
                      handleFieldChange('why_us_items', updated);
                      handleFieldChange('why_us_cards', updated);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white text-xs"
                  />
                </div>

                {/* Icon Selection & Custom Upload */}
                <IconPickerField
                  label="آیکون کارت (انتخاب آیکون یا آپلود اختصاصی)"
                  iconName={card.icon_name || 'BookOpen'}
                  customIconUrl={card.custom_icon_url || (card as any).icon_url}
                  onIconChange={(iconName: string) => {
                    const updated = [...(formData.why_us_items || [])];
                    updated[idx].icon_name = iconName;
                    updated[idx].custom_icon_url = undefined;
                    handleFieldChange('why_us_items', updated);
                    handleFieldChange('why_us_cards', updated);
                  }}
                  onCustomIconChange={(url?: string) => {
                    const updated = [...(formData.why_us_items || [])];
                    updated[idx].custom_icon_url = url;
                    handleFieldChange('why_us_items', updated);
                    handleFieldChange('why_us_cards', updated);
                  }}
                />

                {/* Photoshop Color Picker */}
                <ColorPickerField
                  label="رنگ برجسته کارت (انتخابگر حرفه‌ای فوتوشاپ)"
                  value={card.color?.startsWith('#') ? card.color : '#84cc16'}
                  onChange={(newColor: string) => {
                    const updated = [...(formData.why_us_items || [])];
                    updated[idx].color = newColor;
                    handleFieldChange('why_us_items', updated);
                    handleFieldChange('why_us_cards', updated);
                  }}
                />
              </div>
            ))}
          </div>

          <SectionFooter title="چرا کتابخانه ما؟" />
        </div>
      )}

      {/* SECTION 6: QUOTES (کلام بزرگان) */}
      {activeSection === 'quotes' && (
        <div className="p-6 rounded-2xl bg-[#042f2e] border border-[#0d9488]/40 shadow-lg space-y-6">
          <SectionHeader
            title="تنظیمات بخش کلام بزرگان (کاروسل ۱۰ ثانیه‌ای با لمس و کشیدن)"
            icon={<Bookmark className="w-5 h-5 text-[#84cc16]" />}
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[#99f6e4]/80">مدیریت لیست احادیث و سخنان حکمت‌آموز بزرگان:</span>
            <button
              type="button"
              onClick={() => {
                const current = formData.quotes_items || [];
                const newQuote = {
                  id: `quote_${Date.now()}`,
                  author: 'نام شخصیت یا معصوم',
                  source: 'منبع حدیث یا کتاب',
                  persian: 'متن زیبای کلام درباره کتاب و مطالعه...',
                  role: 'عنوان یا جایگاه',
                };
                handleFieldChange('quotes_items', [...current, newQuote]);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#84cc16] hover:bg-[#a3e635] text-[#042f2e] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن حدیث یا کلام</span>
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-xs text-[#99f6e4] leading-relaxed">
            💡 اسلایدر کلام بزرگان در صفحه اول اکنون هر ۱۰ ثانیه به‌صورت خودکار ورق می‌خورد و با لمس و کشیدن انگشت (Swipe) به چپ و راست جابه‌جا می‌شود.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#ccfbf1]">عنوان اصلی بخش کلام بزرگان</label>
              <input
                type="text"
                value={formData.quotes_section_title || formData.quotes_title || ''}
                onChange={(e) => {
                  handleFieldChange('quotes_section_title', e.target.value);
                  handleFieldChange('quotes_title', e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#ccfbf1]">زیرعنوان بخش</label>
              <input
                type="text"
                value={formData.quotes_section_subtitle || formData.quotes_subtitle || ''}
                onChange={(e) => {
                  handleFieldChange('quotes_section_subtitle', e.target.value);
                  handleFieldChange('quotes_subtitle', e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
              />
            </div>
          </div>

          {/* Font Picker for Quotes */}
          <FontPickerField
            label="فونت متن احادیث و سخنان بزرگان"
            value={formData.quotes_font}
            customFonts={customFonts}
            onChange={(f: string) => handleFieldChange('quotes_font', f)}
            onFontUploaded={(f) => {
              fetchFonts();
              handleFieldChange('quotes_font', `'${f.family}', sans-serif`);
            }}
          />

          {/* Quotes Items List */}
          <div className="space-y-4 pt-2">
            {(formData.quotes_items || []).map((q, idx) => (
              <div key={q.id || idx} className="p-5 rounded-2xl bg-[#073834] border border-[#0d9488]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#84cc16]">کلام شماره {toPersianDigits(idx + 1)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (formData.quotes_items || []).filter((_, i) => i !== idx);
                      handleFieldChange('quotes_items', updated);
                    }}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs text-[#ccfbf1]">گوینده</label>
                    <input
                      type="text"
                      value={q.author}
                      onChange={(e) => {
                        const updated = [...(formData.quotes_items || [])];
                        updated[idx].author = e.target.value;
                        handleFieldChange('quotes_items', updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs text-[#ccfbf1]">منبع یا کتاب</label>
                    <input
                      type="text"
                      value={q.source}
                      onChange={(e) => {
                        const updated = [...(formData.quotes_items || [])];
                        updated[idx].source = e.target.value;
                        handleFieldChange('quotes_items', updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs text-[#ccfbf1]">جایگاه / نقش</label>
                    <input
                      type="text"
                      value={q.role || ''}
                      onChange={(e) => {
                        const updated = [...(formData.quotes_items || [])];
                        updated[idx].role = e.target.value;
                        handleFieldChange('quotes_items', updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white text-xs"
                    />
                  </div>
                </div>

                {q.arabic !== undefined && (
                  <div className="space-y-1">
                    <label className="block text-xs text-[#ccfbf1]">متن عربی حدیث (اختیاری)</label>
                    <input
                      type="text"
                      value={q.arabic || ''}
                      onChange={(e) => {
                        const updated = [...(formData.quotes_items || [])];
                        updated[idx].arabic = e.target.value;
                        handleFieldChange('quotes_items', updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white text-xs text-center"
                      dir="rtl"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs text-[#ccfbf1]">متن فارسی (با پشتیبانی از اینتر)</label>
                  <textarea
                    rows={2}
                    value={q.persian}
                    onChange={(e) => {
                      const updated = [...(formData.quotes_items || [])];
                      updated[idx].persian = e.target.value;
                      handleFieldChange('quotes_items', updated);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          <SectionFooter title="کلام بزرگان" />
        </div>
      )}

      {/* SECTION 7: RULES (قوانین و راهنما) */}
      {activeSection === 'rules' && (
        <div className="p-6 rounded-2xl bg-[#042f2e] border border-[#0d9488]/40 shadow-lg space-y-6">
          <SectionHeader
            title="تنظیمات بخش قوانین و مقررات کتابخانه (Rules)"
            icon={<Shield className="w-5 h-5 text-[#84cc16]" />}
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[#99f6e4]/80">مراحل و قوانین ۳ گانه عضویت و امانت کتاب:</span>
            <button
              type="button"
              onClick={() => {
                const current = formData.rules_items || [];
                const newRule = {
                  id: Date.now(),
                  step: toPersianDigits(current.length + 1),
                  title: 'مرحله جدید قوانین',
                  icon_name: 'CheckCircle',
                  color: '#84cc16',
                  items: ['مورد اول قانون', 'مورد دوم قانون'],
                };
                handleFieldChange('rules_items', [...current, newRule]);
                handleFieldChange('rules_steps', [...current, newRule]);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#84cc16] hover:bg-[#a3e635] text-[#042f2e] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن مرحله جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#ccfbf1]">عنوان اصلی بخش قوانین</label>
              <input
                type="text"
                value={formData.rules_section_title || formData.rules_title || ''}
                onChange={(e) => {
                  handleFieldChange('rules_section_title', e.target.value);
                  handleFieldChange('rules_title', e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#ccfbf1]">زیرعنوان بخش</label>
              <input
                type="text"
                value={formData.rules_section_subtitle || formData.rules_subtitle || ''}
                onChange={(e) => {
                  handleFieldChange('rules_section_subtitle', e.target.value);
                  handleFieldChange('rules_subtitle', e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
              />
            </div>
          </div>

          {/* Rules Steps List */}
          <div className="space-y-4 pt-2">
            {(formData.rules_items || []).map((step, idx) => (
              <div
                key={step.id || idx}
                className="p-5 rounded-2xl bg-[#073834] border border-[#0d9488]/40 space-y-4"
                style={{
                  borderTopColor: step.color?.startsWith('#') ? step.color : '#0d9488',
                  borderTopWidth: '3px',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#84cc16]">
                    مرحله {step.step || toPersianDigits(idx + 1)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (formData.rules_items || []).filter((_, i) => i !== idx);
                      handleFieldChange('rules_items', updated);
                      handleFieldChange('rules_steps', updated);
                    }}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#ccfbf1]">عنوان مرحله</label>
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => {
                        const updated = [...(formData.rules_items || [])];
                        updated[idx].title = e.target.value;
                        handleFieldChange('rules_items', updated);
                        handleFieldChange('rules_steps', updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#ccfbf1]">شماره مرحله (فارسی)</label>
                    <input
                      type="text"
                      value={step.step}
                      onChange={(e) => {
                        const updated = [...(formData.rules_items || [])];
                        updated[idx].step = e.target.value;
                        handleFieldChange('rules_items', updated);
                        handleFieldChange('rules_steps', updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white text-xs"
                    />
                  </div>
                </div>

                {/* Items textarea (one item per line) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#ccfbf1]">
                    بندهای این مرحله (هر خط یک بند قانون با زدن Enter):
                  </label>
                  <textarea
                    rows={4}
                    value={Array.isArray(step.items) ? step.items.join('\n') : step.items}
                    onChange={(e) => {
                      const updated = [...(formData.rules_items || [])];
                      updated[idx].items = e.target.value.split('\n');
                      handleFieldChange('rules_items', updated);
                      handleFieldChange('rules_steps', updated);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 text-white text-xs leading-relaxed"
                  />
                </div>

                {/* Icon Selection & Custom Upload */}
                <IconPickerField
                  label="آیکون مرحله (انتخاب آیکون یا آپلود اختصاصی)"
                  iconName={step.icon_name || 'CheckCircle'}
                  customIconUrl={step.custom_icon_url || (step as any).icon_url}
                  onIconChange={(iconName: string) => {
                    const updated = [...(formData.rules_items || [])];
                    updated[idx].icon_name = iconName;
                    updated[idx].custom_icon_url = undefined;
                    handleFieldChange('rules_items', updated);
                    handleFieldChange('rules_steps', updated);
                  }}
                  onCustomIconChange={(url?: string) => {
                    const updated = [...(formData.rules_items || [])];
                    updated[idx].custom_icon_url = url;
                    handleFieldChange('rules_items', updated);
                    handleFieldChange('rules_steps', updated);
                  }}
                />

                {/* Photoshop Color Picker */}
                <ColorPickerField
                  label="رنگ تم و حاشیه مرحله (انتخابگر فوتوشاپ)"
                  value={step.color?.startsWith('#') ? step.color : '#0d9488'}
                  onChange={(newColor: string) => {
                    const updated = [...(formData.rules_items || [])];
                    updated[idx].color = newColor;
                    handleFieldChange('rules_items', updated);
                    handleFieldChange('rules_steps', updated);
                  }}
                />
              </div>
            ))}
          </div>

          <SectionFooter title="قوانین و راهنما" />
        </div>
      )}

      {/* SECTION 8: FOOTER (فوتر سایت) */}
      {activeSection === 'footer' && (
        <div className="p-6 rounded-2xl bg-[#042f2e] border border-[#0d9488]/40 shadow-lg space-y-6">
          <SectionHeader
            title="تنظیمات کامل فوتر، نشانی و اطلاعات تماس"
            icon={<Clock className="w-5 h-5 text-[#84cc16]" />}
          />

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#ccfbf1]">
              متن درباره کتابخانه در ستون اول فوتر (با پشتیبانی از اینتر)
            </label>
            <textarea
              rows={3}
              value={formData.footer_description || formData.footer_about_text || ''}
              onChange={(e) => {
                handleFieldChange('footer_description', e.target.value);
                handleFieldChange('footer_about_text', e.target.value);
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#ccfbf1]">
              متن کامل آدرس و موقعیت مکانی (با پشتیبانی از اینتر)
            </label>
            <textarea
              rows={2}
              value={formData.footer_address || formData.footer_address_text || ''}
              onChange={(e) => {
                handleFieldChange('footer_address', e.target.value);
                handleFieldChange('footer_address_text', e.target.value);
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#ccfbf1]">لینک نشان برای مسیریابی</label>
              <input
                type="text"
                value={formData.footer_neshan_link || ''}
                onChange={(e) => handleFieldChange('footer_neshan_link', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs text-left"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#ccfbf1]">شماره تماس کتابخانه (اختیاری)</label>
              <input
                type="text"
                value={formData.footer_phone || ''}
                onChange={(e) => handleFieldChange('footer_phone', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs text-left"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#ccfbf1]">یادداشت زنگ آیفون کتابخانه</label>
              <input
                type="text"
                value={formData.footer_bell_note || ''}
                onChange={(e) => handleFieldChange('footer_bell_note', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#ccfbf1]">متن دعوت به عضویت در کانال ایتا</label>
              <input
                type="text"
                value={formData.footer_eitaa_text || ''}
                onChange={(e) => handleFieldChange('footer_eitaa_text', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#ccfbf1]">متن کپی‌رایت حقوق معنوی</label>
            <input
              type="text"
              value={formData.footer_copyright || ''}
              onChange={(e) => handleFieldChange('footer_copyright', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs"
            />
          </div>

          {/* Immutable Protected Credits Banner */}
          <div className="p-4 rounded-xl bg-[#031d1c] border border-amber-500/30 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>بخش هویت معنوی، طراح و یادمان شهید (محافظت‌شده و غیرقابل تغییر):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-lg bg-[#073834]/80 border border-[#0d9488]/40 flex items-center justify-between">
                <span className="text-[#ccfbf1]/80">طراح سامانه:</span>
                <span className="font-bold text-[#84cc16]">یونس عطاران زاده (قفل دائمی)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#073834]/80 border border-[#0d9488]/40 flex items-center justify-between">
                <span className="text-[#ccfbf1]/80">یادمان شهید مدافع حرم:</span>
                <span className="font-bold text-amber-300">احسان کربلایی‌پور (قفل دائمی)</span>
              </div>
            </div>
          </div>

          <SectionFooter title="فوتر سایت" />
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {!!sectionToReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#042f2e] border border-rose-500/50 rounded-2xl max-w-md w-full p-6 text-right space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white text-center">
              آیا از بازگردانی بخش «{sectionToReset.name}» به پیش‌فرض اولیه اطمینان دارید؟
            </h3>
            <p className="text-xs text-[#ccfbf1]/80 leading-relaxed text-center">
              این عمل تنظیمات و تغییرات اعمال‌شده در این بخش را به حالت اولیه کارخانه بازمی‌گرداند.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSectionToReset(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#073834] hover:bg-[#0d9488]/30 text-white text-xs font-bold border border-[#0d9488]/40 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmSectionReset}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-500/30 cursor-pointer"
              >
                تأیید و بازنشانی
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
