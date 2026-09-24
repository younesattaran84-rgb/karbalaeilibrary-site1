import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, HelpCircle, Search, Sparkles, ArrowLeft } from 'lucide-react';
import { FAQItem, FAQCategory } from '../types';
import { INITIAL_FAQS, INITIAL_FAQ_CATEGORIES } from '../data/initialData';

interface FAQSectionProps {
  faqs?: FAQItem[];
  categories?: FAQCategory[];
  isHomePreview?: boolean;
  onViewAll?: () => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({
  faqs = INITIAL_FAQS,
  categories = INITIAL_FAQ_CATEGORIES,
  isHomePreview = false,
  onViewAll,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('همه');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeOpenId, setActiveOpenId] = useState<string | null>('faq-1'); // Single active open item

  const toggleAccordion = (id: string) => {
    setActiveOpenId((prev) => (prev === id ? null : id));
  };

  const filteredFaqs = useMemo(() => {
    if (isHomePreview) {
      return faqs.slice(0, 3);
    }
    const cleanStr = (s: string) => (s || '').replace(/[\u200c\u200b]/g, ' ').replace(/\s+/g, ' ').trim();
    const cleanSelected = cleanStr(selectedCategory);

    return faqs.filter((item) => {
      const matchCategory = selectedCategory === 'همه' || cleanStr(item.category) === cleanSelected;
      const matchSearch =
        !searchQuery ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [faqs, isHomePreview, selectedCategory, searchQuery]);

  return (
    <section className="py-20 bg-[#073834] relative overflow-hidden border-b border-[#0d9488]/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="px-4 py-1.5 rounded-full bg-[#042f2e] border border-[#84cc16]/40 text-[#a3e635] text-xs font-black inline-block mb-3">
            راهنمای کامل مراجعان
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white hover-hop">
            پرسش‌های متداول
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#99f6e4]">
            پاسخ به سوالات پرتکرار درباره عضویت، امانت کتاب، ساعت کاری و برنامه‌های کتابخانه
          </p>

          {/* Quick FAQ Search Box (only on full page) */}
          {!isHomePreview && (
            <div className="mt-6 relative max-w-md mx-auto">
              <Search className="w-5 h-5 text-[#84cc16] absolute right-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در متن یا عنوان سوالات..."
                className="w-full pr-12 pl-4 py-3 rounded-2xl bg-[#042f2e] border border-[#0d9488]/40 text-white placeholder-[#99f6e4]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#84cc16]"
              />
            </div>
          )}
        </div>

        {/* Category Pills (only on full page) - flex-wrap to prevent horizontal scrolling jump */}
        {!isHomePreview && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            <button
              type="button"
              onClick={() => setSelectedCategory('همه')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 hover-hop ${
                selectedCategory === 'همه'
                  ? 'bg-[#84cc16] text-[#042f2e] shadow-md scale-105'
                  : 'bg-[#042f2e] text-[#ccfbf1] hover:bg-[#0d9488]/40 hover:text-white border border-[#0d9488]/30'
              }`}
            >
              همه موارد
            </button>
            {categories.map((cat) => {
              const catName = cat.title || cat.name || '';
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(catName)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 hover-hop ${
                    selectedCategory === catName
                      ? 'bg-[#84cc16] text-[#042f2e] shadow-md scale-105'
                      : 'bg-[#042f2e] text-[#ccfbf1] hover:bg-[#0d9488]/40 hover:text-white border border-[#0d9488]/30'
                  }`}
                >
                  {catName}
                </button>
              );
            })}
          </div>
        )}

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 bg-[#042f2e]/60 rounded-3xl border border-[#0d9488]/30 p-6">
              <HelpCircle className="w-12 h-12 text-[#99f6e4]/50 mx-auto mb-3" />
              <p className="text-base font-bold text-white">سوالی با این مشخصات یافت نشد.</p>
              <p className="text-xs text-[#99f6e4] mt-1">
                برای کسب راهنمایی می‌توانید در ساعات کاری کتابخانه مراجعه فرمایید یا در پیام‌رسان ایتا پیام دهید.
              </p>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = activeOpenId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl transition-all duration-300 border overflow-hidden ${
                    isOpen
                      ? 'bg-[#042f2e] border-[#84cc16]/60 shadow-lg shadow-[#042f2e]/60'
                      : 'bg-[#042f2e]/80 hover:bg-[#042f2e] border-[#0d9488]/30'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full text-right p-5 sm:p-6 flex items-center justify-between gap-4 select-none focus:outline-none cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${isOpen ? 'bg-[#84cc16]' : 'bg-[#0d9488]'}`} />
                      <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug hover:text-[#a3e635] transition-colors">
                        {faq.question}
                      </h3>
                    </div>
                    <div className={`p-1.5 rounded-lg transition-transform duration-300 ${isOpen ? 'rotate-180 bg-[#84cc16] text-[#042f2e]' : 'bg-[#073834] text-[#a3e635]'}`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-[#ccfbf1]/90 leading-relaxed border-t border-[#0d9488]/20 animate-in fade-in slide-in-from-top-2 duration-300 text-justify">
                      <p className="whitespace-pre-line">{faq.answer}</p>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-[#5eead4]">
                        <span className="px-2 py-0.5 rounded bg-[#073834] border border-[#0d9488]/30">
                          دسته‌بندی: {faq.category}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Phase 5: View All Questions Button on Home page with Golden Aura */}
        {isHomePreview && (
          <div className="mt-12 text-center flex justify-center">
            <div className="golden-rotating-border-container p-[2px] rounded-2xl shadow-xl">
              <button
                type="button"
                onClick={onViewAll}
                className="golden-rotating-border-inner inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#84cc16] to-[#65a30d] hover:from-[#a3e635] hover:to-[#84cc16] text-[#042f2e] font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                <span>مشاهده همه سؤالات</span>
                <ArrowLeft className="w-4 h-4 text-[#042f2e]" />
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
