import React, { useState, useEffect, useRef } from 'react';
import { Type, Upload, Check, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { CustomFont } from '../types';

interface FontOption {
  id: string;
  name: string;
  family: string;
  url?: string;
  previewSample?: string;
  isCustom?: boolean;
}

const DEFAULT_FONTS: FontOption[] = [
  { id: 'vazirmatn', name: 'وزیرمتن (استاندارد و پیش‌فرض)', family: "'Vazirmatn', sans-serif" },
  { id: 'amiri', name: 'امیری (خط اصیل نسخ و معارفی)', family: "'Amiri', serif" },
  { id: 'lalezar', name: 'لاله‌زار (ضخیم و چشم‌گیر ویژه تیتر)', family: "'Lalezar', cursive" },
  { id: 'lateef', name: 'لطیف (روان، ادبی و خوانا)', family: "'Lateef', serif" },
  { id: 'sahel', name: 'ساهل (مدرن و نرم)', family: "Sahel, 'Vazirmatn', sans-serif" },
  { id: 'shabnam', name: 'شبنم (خوانا و هندسی)', family: "Shabnam, 'Vazirmatn', sans-serif" },
  { id: 'samim', name: 'صمیم (صمیمی و گرم)', family: "Samim, 'Vazirmatn', sans-serif" },
];

export function ensureFontFaceLoaded(fontFamilyName: string, fontUrl: string) {
  if (typeof document === 'undefined') return;
  const cleanFamily = fontFamilyName.replace(/['"]/g, '').replace(/,\s*sans-serif/g, '').trim();
  const styleId = `font-face-${cleanFamily}`;
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    const format = fontUrl.endsWith('.woff2')
      ? 'woff2'
      : fontUrl.endsWith('.woff')
      ? 'woff'
      : fontUrl.endsWith('.ttf')
      ? 'truetype'
      : 'opentype';
    styleEl.textContent = `
      @font-face {
        font-family: '${cleanFamily}';
        src: url('${fontUrl}') format('${format}');
        font-display: swap;
      }
    `;
    document.head.appendChild(styleEl);
  }
}

interface FontPickerFieldProps {
  label: string;
  value?: string;
  onChange: (fontFamily: string) => void;
  customFonts?: CustomFont[];
  onFontUploaded?: (newFont: CustomFont) => void;
  onFontDeleted?: (fontId: string) => void;
  helperText?: string;
}

export const FontPickerField: React.FC<FontPickerFieldProps> = ({
  label,
  value,
  onChange,
  customFonts,
  onFontUploaded,
  onFontDeleted,
  helperText,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localCustomFonts, setLocalCustomFonts] = useState<CustomFont[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync or fetch custom fonts
  useEffect(() => {
    if (customFonts && customFonts.length > 0) {
      setLocalCustomFonts(customFonts);
      customFonts.forEach((cf) => {
        if (cf.family && cf.url) {
          ensureFontFaceLoaded(cf.family, cf.url);
        }
      });
    } else {
      // Fetch from server if not provided or empty
      fetch('/api/fonts')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.fonts)) {
            setLocalCustomFonts(data.fonts);
            data.fonts.forEach((cf: CustomFont) => {
              if (cf.family && cf.url) {
                ensureFontFaceLoaded(cf.family, cf.url);
              }
            });
          }
        })
        .catch(() => {});
    }
  }, [customFonts]);

  // Combine custom fonts from prop or internal state
  const activeCustomFonts = (customFonts && customFonts.length > 0) ? customFonts : localCustomFonts;

  const customFontOptions: FontOption[] = activeCustomFonts.map((cf) => ({
    id: cf.id,
    name: `★ ${cf.name} (آپلودشده)`,
    family: `'${cf.family}', sans-serif`,
    url: cf.url,
    isCustom: true,
  }));

  const allFonts: FontOption[] = [...DEFAULT_FONTS, ...customFontOptions];

  // Helper to find matching option value
  const normalize = (f?: string) => (f || '').replace(/['"\s]/g, '').toLowerCase();
  const matchedFont = allFonts.find(
    (f) => normalize(f.family) === normalize(value) || normalize(f.id) === normalize(value)
  );

  const selectedValue = matchedFont ? matchedFont.family : value || "'Vazirmatn', sans-serif";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!/\.(woff2|woff|ttf|otf)$/i.test(file.name)) {
      setUploadError('لطفاً یکی از فرمت‌های معتبر فونت (.woff2, .woff, .ttf, .otf) را انتخاب فرمایید.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const fontData = reader.result as string;
          const cleanFontName = file.name.replace(/\.[^/.]+$/, '');
          const res = await fetch('/api/upload/font', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              font_data: fontData,
              font_name: cleanFontName,
              file_name: file.name,
            }),
          });
          const data = await res.json();
          if (data.success && data.font_family && data.font_url) {
            ensureFontFaceLoaded(data.font_family, data.font_url);

            const newFontObj: CustomFont = data.font || {
              id: `font-${Date.now()}`,
              name: data.font_name || cleanFontName,
              family: data.font_family,
              url: data.font_url,
            };

            setLocalCustomFonts((prev) => {
              const filtered = prev.filter((f) => f.family !== newFontObj.family);
              return [...filtered, newFontObj];
            });

            if (onFontUploaded) {
              onFontUploaded(newFontObj);
            }
            onChange(`'${data.font_family}', sans-serif`);
          } else {
            setUploadError(data.message || 'خطا در بارگذاری فونت.');
          }
        } catch {
          setUploadError('خطا در ارتباط با سرور آپلود فونت.');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploading(false);
      setUploadError('خطا در خواندن فایل فونت.');
    }

    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#ccfbf1] flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-[#84cc16]" />
          <span>{label}</span>
        </label>
        
        {/* Hidden Font File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".woff2,.woff,.ttf,.otf"
          className="hidden"
          onChange={handleFileUpload}
        />

        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="px-2.5 py-1 rounded-lg bg-[#073834] hover:bg-[#0d9488]/30 border border-[#84cc16]/40 text-[#a3e635] text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
          title="آپلود فایل فونت فارسی اختصاصی (.woff2, .woff, .ttf, .otf)"
        >
          {isUploading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Upload className="w-3 h-3" />
          )}
          <span>{isUploading ? 'در حال آپلود فونت...' : 'آپلود فونت جدید'}</span>
        </button>
      </div>

      {/* Select Dropdown */}
      <div className="relative">
        <select
          value={selectedValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-[#042f2e] border border-[#0d9488]/50 text-white text-xs font-medium focus:outline-none focus:border-[#84cc16] cursor-pointer"
        >
          {customFontOptions.length > 0 && (
            <optgroup label="★ فونت‌های آپلودشده شما">
              {customFontOptions.map((f) => (
                <option key={f.id} value={f.family}>
                  {f.name}
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="فونت‌های استاندارد سامانه">
            {DEFAULT_FONTS.map((f) => (
              <option key={f.id} value={f.family}>
                {f.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Live Font Sample Preview */}
      <div
        className="px-3.5 py-2 rounded-xl bg-[#073834]/80 border border-[#0d9488]/30 text-center text-xs text-[#a3e635] truncate"
        style={{ fontFamily: selectedValue }}
      >
        نمونه پیش‌نمایش زنده این قلم: کتابخانه شهید احسان کربلایی‌پور (۱۲۳۴۵۶۷۸۹۰)
      </div>

      {uploadError && (
        <p className="text-[11px] text-rose-400 font-medium">{uploadError}</p>
      )}

      {helperText && (
        <p className="text-[11px] text-[#99f6e4]/70 leading-relaxed">{helperText}</p>
      )}
    </div>
  );
};

