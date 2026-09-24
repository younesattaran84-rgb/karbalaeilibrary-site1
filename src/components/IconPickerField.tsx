import React, { useRef, useState } from 'react';
import {
  BookOpen, Sparkles, Users, HeartHandshake, Calendar, Shield,
  Award, Star, Bookmark, CheckCircle, Trophy, MapPin, Clock,
  Upload, X, Loader2, UserCheck, BookCopy, VolumeX, Library, Image as ImageIcon
} from 'lucide-react';

interface IconPickerFieldProps {
  label: string;
  iconName: string;
  customIconUrl?: string;
  onIconChange: (name: string) => void;
  onCustomIconChange: (url?: string) => void;
}

const PRESET_LOGOS = [
  {
    id: 'sahne_vajeha',
    name: 'لوگوی رسمی صحن واژه‌ها',
    url: '/assets/sahne_vajeha_logo.png',
  },
  {
    id: 'eitaa',
    name: 'لوگوی پیام‌رسان ایتا',
    url: '/assets/eitaa_logo.png',
  },
];

const AVAILABLE_ICONS = [
  { name: 'UserCheck', label: 'شرایط عضویت', icon: UserCheck },
  { name: 'BookCopy', label: 'امانت کتاب', icon: BookCopy },
  { name: 'VolumeX', label: 'سکوت و نظم', icon: VolumeX },
  { name: 'Library', label: 'مخزن و فضا', icon: Library },
  { name: 'BookOpen', label: 'کتاب باز', icon: BookOpen },
  { name: 'Sparkles', label: 'درخشش و سکوت', icon: Sparkles },
  { name: 'Users', label: 'عموم اعضا', icon: Users },
  { name: 'HeartHandshake', label: 'معنویت و همدلی', icon: HeartHandshake },
  { name: 'Calendar', label: 'رویداد و تقویم', icon: Calendar },
  { name: 'Shield', label: 'قوانین و امنیت', icon: Shield },
  { name: 'Award', label: 'افتخارات', icon: Award },
  { name: 'Star', label: 'برگزیده', icon: Star },
  { name: 'Bookmark', label: 'نشانک کتاب', icon: Bookmark },
  { name: 'CheckCircle', label: 'تأیید و اطمینان', icon: CheckCircle },
  { name: 'Trophy', label: 'جام مسابقه', icon: Trophy },
  { name: 'MapPin', label: 'موقعیت مکانی', icon: MapPin },
  { name: 'Clock', label: 'زمان و ساعت', icon: Clock },
];

export const IconPickerField: React.FC<IconPickerFieldProps> = ({
  label,
  iconName,
  customIconUrl,
  onIconChange,
  onCustomIconChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await fetch('/api/upload/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: base64Data,
              filename: `icon_${Date.now()}.${file.name.split('.').pop() || 'png'}`,
            }),
          });
          const data = await res.json();
          if (data.success && data.url) {
            onCustomIconChange(data.url);
          }
        } catch (err) {
          console.error('Error uploading custom icon:', err);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploading(false);
    }

    e.target.value = '';
  };

  const SelectedIcon = AVAILABLE_ICONS.find((i) => i.name === iconName)?.icon || BookOpen;

  return (
    <div className="space-y-3 p-3 rounded-2xl bg-[#031d1c]/80 border border-[#0d9488]/30">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#ccfbf1] flex items-center gap-1.5">
          {customIconUrl ? (
            <img src={customIconUrl} alt="آیکون فعال" className="w-4 h-4 object-contain" />
          ) : (
            <SelectedIcon className="w-4 h-4 text-[#84cc16]" />
          )}
          <span>{label}</span>
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.svg"
          className="hidden"
          onChange={handleFileUpload}
        />

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 rounded-lg bg-[#073834] hover:bg-[#0d9488]/30 border border-[#84cc16]/40 text-[#a3e635] text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Upload className="w-3 h-3" />
            )}
            <span>{customIconUrl ? 'آپلود فایل جدید' : 'آپلود فایل آیکون'}</span>
          </button>

          {customIconUrl && (
            <button
              type="button"
              onClick={() => onCustomIconChange(undefined)}
              className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-[10px] font-bold transition-colors cursor-pointer"
              title="بازگشت به آیکون‌های استاندارد"
            >
              حذف
            </button>
          )}
        </div>
      </div>

      {/* Preset Official Logos */}
      <div>
        <div className="text-[11px] font-bold text-[#99f6e4] mb-1.5 flex items-center gap-1">
          <ImageIcon className="w-3 h-3 text-[#84cc16]" />
          <span>لوگوهای رسمی صفحه اصلی:</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_LOGOS.map((logo) => {
            const isSelected = customIconUrl === logo.url;
            return (
              <button
                key={logo.id}
                type="button"
                onClick={() => onCustomIconChange(logo.url)}
                className={`p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer text-right ${
                  isSelected
                    ? 'bg-[#84cc16]/20 border-[#84cc16] text-[#a3e635] ring-1 ring-[#84cc16]'
                    : 'bg-[#042f2e] border-[#0d9488]/30 text-[#ccfbf1] hover:bg-[#073834]'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-[#073834] p-1 flex items-center justify-center border border-[#0d9488]/40 shrink-0">
                  <img src={logo.url} alt={logo.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold truncate">{logo.name}</span>
                  <span className="text-[9px] text-[#99f6e4]/70">لوگوی اختصاصی</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Standard Icons Grid */}
      <div>
        <div className="text-[11px] font-bold text-[#99f6e4] mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#84cc16]" />
          <span>آیکون‌های وکتور استاندارد:</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
          {AVAILABLE_ICONS.map((item) => {
            const Icon = item.icon;
            const isSelected = !customIconUrl && iconName === item.name;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  onCustomIconChange(undefined);
                  onIconChange(item.name);
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#84cc16]/20 border-[#84cc16] text-[#a3e635] shadow-sm'
                    : 'bg-[#042f2e]/60 border-[#0d9488]/30 text-[#99f6e4] hover:bg-[#073834]'
                }`}
                title={item.label}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[9px] truncate max-w-full font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
