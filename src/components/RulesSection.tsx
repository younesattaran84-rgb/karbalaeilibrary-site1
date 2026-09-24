import React from 'react';
import { motion } from 'motion/react';
import {
  UserCheck, BookCopy, VolumeX, Library, CheckCircle, Shield,
  Award, Star, Bookmark, Trophy, Sparkles, BookOpen, Clock
} from 'lucide-react';
import { toPersianDigits } from '../utils/persian';
import { HomepageCMS } from '../types';

interface RulesSectionProps {
  cms?: HomepageCMS;
}

const ICON_MAP: Record<string, any> = {
  UserCheck,
  BookCopy,
  VolumeX,
  Library,
  CheckCircle,
  Shield,
  Award,
  Star,
  Bookmark,
  Trophy,
  Sparkles,
  BookOpen,
  Clock,
};

export const RulesSection: React.FC<RulesSectionProps> = ({ cms }) => {
  const defaultSteps = [
    {
      step: '۱',
      title: 'شرایط عضویت',
      icon_name: 'UserCheck',
      color: '#0d9488',
      items: [
        'عضویت در کتابخانه برای عموم علاقه‌مندان و پژوهشگران آزاد است.',
        'برای ثبت‌نام، تکمیل فرم کتابخانه و به همراه داشتن یک کارت شناسایی معتبر لازم است.',
        'مدت اعتبار عضویت یک سال کامل است و پس از آن با مراجعه به کتابدار قابل تمدید می‌باشد.',
      ],
    },
    {
      step: '۲',
      title: 'امانت کتاب',
      icon_name: 'BookCopy',
      color: '#84cc16',
      items: [
        'امانت کتاب اشتراک جداگانه‌ای نسبت به اشتراک عضویت پایه کتابخانه دارد.',
        'هر عضو می‌تواند همزمان تا سقف ۴ کتاب را برای حداقل ۱ هفته و حداکثر ۴ هفته امانت بگیرد.',
        'در صورت عدم رزرو توسط سایر مراجعان، تا ۲ هفته امکان تمدید امانت وجود دارد.',
        'در صورت تأخیر در بازگرداندن کتاب، جریمه نقدی جزئی طبق تعرفه دریافت می‌گردد.',
        'در صورت مفقودی یا آسیب جدی به کتاب، عضو موظف به جبران معادل قیمت روز کتاب است.',
      ],
    },
    {
      step: '۳',
      title: 'رفتار و نظم',
      icon_name: 'VolumeX',
      color: '#0284c7',
      items: [
        'رعایت کامل سکوت و آرامش در تمام بخش‌های سالن مطالعه ضروری است.',
        'استفاده از تلفن همراه به‌صورت بی‌صدا (Silent) بوده و مکالمه در سالن مطالعه اکیداً ممنوع است.',
        'خارج کردن هرگونه کتاب بدون ثبت رسمی در سیستم توسط کتابدار غیرمجاز است.',
        'حفظ نظافت، پاکیزگی و مرتب نگه‌داشتن میزها و صندلی‌ها بر عهده استفاده‌کنندگان محترم است.',
      ],
    },
    {
      step: '۴',
      title: 'استفاده از منابع و فضا',
      icon_name: 'Library',
      color: '#eab308',
      items: [
        'کتاب‌های مرجع، نفیس، نایاب و کتب لغت‌نامه صرفاً جهت مطالعه در محل سالن می‌باشند.',
        'مخزن کتابخانه به‌صورت باز اداره می‌شود و امانت‌گیرندگان می‌توانند مستقیماً قفسه‌ها را بررسی کنند.',
        'کتاب‌های برداشته‌شده از قفسه را پس از مطالعه روی میز مخصوص بازگشت قرار دهید.',
        'استفاده از اینترنت و سیستم جستجوی رایانه‌ای برای اعضای فعال مجاز می‌باشد.',
      ],
    },
  ];

  const rawRules = (cms?.rules_items && cms.rules_items.length > 0)
    ? cms.rules_items
    : (cms?.rules_steps && cms.rules_steps.length > 0)
    ? cms.rules_steps
    : defaultSteps;

  const steps = rawRules.map((r: any, idx: number) => {
    const iconKey = r.icon_name || ['UserCheck', 'BookCopy', 'VolumeX', 'Library'][idx % 4];
    const IconComponent = ICON_MAP[iconKey] || UserCheck;
    const cardColor = (r.color && r.color.startsWith('#')) ? r.color : ['#0d9488', '#84cc16', '#0284c7', '#eab308'][idx % 4];

    return {
      step: r.step || toPersianDigits(idx + 1),
      title: r.title,
      iconComponent: IconComponent,
      customIconUrl: r.custom_icon_url || r.icon_url,
      color: cardColor,
      items: Array.isArray(r.items) ? r.items : (typeof r.items === 'string' ? r.items.split('\n').filter(Boolean) : []),
    };
  });

  return (
    <section id="rules-section" className="py-20 bg-[#042f2e] relative overflow-hidden border-b border-[#0d9488]/30">
      {/* Glow elements */}
      <div className="absolute top-1/2 left-0 w-72 h-72 rounded-full bg-[#0d9488]/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-black text-white hover-hop tracking-tight">
            {cms?.rules_section_title || cms?.rules_title || 'آیین‌نامه و قوانین عضویت و امانت'}
          </h2>
          {(cms?.rules_section_subtitle || cms?.rules_subtitle) && (
            <p className="mt-3 text-sm text-[#99f6e4] whitespace-pre-line">
              {cms.rules_section_subtitle || cms.rules_subtitle}
            </p>
          )}
        </motion.div>

        {/* 4 Staggered Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item: any, idx: number) => {
            const Icon = item.iconComponent;
            const initialX = idx === 0 ? 55 : idx === 3 ? -55 : 0;
            const initialY = (idx === 1 || idx === 2) ? 50 : 25;

            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: initialX, y: initialY }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.7, delay: idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="relative rounded-3xl bg-[#073834]/80 border border-[#0d9488]/40 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col justify-between group"
                style={{
                  borderTopColor: item.color,
                  borderTopWidth: '3px',
                }}
              >
                <div>
                  {/* Step header with badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border shadow-sm"
                      style={{
                        backgroundColor: `${item.color}25`,
                        borderColor: item.color,
                        color: item.color,
                      }}
                    >
                      {item.step}
                    </span>

                    <div
                      className="p-2.5 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      {item.customIconUrl ? (
                        <img src={item.customIconUrl} alt={item.title} className="w-5 h-5 object-contain" />
                      ) : (
                        <Icon className="w-5 h-5" style={{ color: item.color }} />
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-white mb-4 group-hover:text-[#a3e635] transition-colors">
                    {item.title}
                  </h3>

                  <ul className="space-y-2.5">
                    {item.items.map((line: string, lIdx: number) => (
                      <li key={lIdx} className="flex items-start gap-2 text-xs sm:text-sm text-[#ccfbf1]/85 leading-relaxed">
                        <CheckCircle className="w-4 h-4 text-[#84cc16] shrink-0 mt-0.5" />
                        <span className="whitespace-pre-line">{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-[#0d9488]/20 flex items-center justify-between text-xs text-[#5eead4]">
                  <span>مقررات سالن و مخزن</span>
                  <span className="font-bold" style={{ color: item.color }}>مرحله {item.step}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
