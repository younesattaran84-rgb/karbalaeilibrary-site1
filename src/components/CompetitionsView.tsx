import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Calendar, Gift, CheckCircle2, Send, ExternalLink, BookOpen, User, Phone, Layers, X, AlertCircle, Maximize2, Sparkles } from 'lucide-react';
import { Competition, UserProfile, CompetitionRegistration } from '../types';
import { toPersianDigits } from '../utils/persian';

interface CompetitionsViewProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  competitions?: Competition[];
}

export const CompetitionsView: React.FC<CompetitionsViewProps> = ({ currentUser, onOpenAuth, competitions }) => {
  const [selectedCompForReg, setSelectedCompForReg] = useState<Competition | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);
  const [fullName, setFullName] = useState(currentUser ? `${currentUser.name} ${currentUser.family}` : '');
  const [phone, setPhone] = useState(currentUser ? currentUser.phone : '');
  const [unit, setUnit] = useState<CompetitionRegistration['unit']>('واحد راهنمایی');
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [registeredCompIds, setRegisteredCompIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lib_registered_comps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const displayCompetitions: Competition[] = Array.isArray(competitions) ? competitions : [];

  const handleOpenRegisterModal = (comp: Competition) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setFullName(currentUser ? `${currentUser.name} ${currentUser.family}` : '');
    setPhone(currentUser ? currentUser.phone : '');
    setUnit('واحد راهنمایی');
    // Pre-select book source if available
    const sources = (comp.sources && comp.sources.length > 0) ? comp.sources : (comp.book_title ? [comp.book_title] : []);
    setSelectedBook(sources[0] || '');
    setSelectedCompForReg(comp);
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompForReg) return;
    if (!fullName.trim() || !phone.trim() || !unit) {
      setErrorMsg('لطفاً نام و نام خانوادگی، شماره تماس و واحد را مشخص کنید.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/competitions/${selectedCompForReg.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim(),
          unit,
          selected_book: selectedBook,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'خطا در ثبت نام در مسابقه');
      }

      const updated = [...registeredCompIds, selectedCompForReg.id];
      setRegisteredCompIds(updated);
      localStorage.setItem('lib_registered_comps', JSON.stringify(updated));
      setSuccessMsg('ثبت‌نام شما با موفقیت انجام شد!');
      setTimeout(() => {
        setSelectedCompForReg(null);
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ثبت‌نام. لطفاً دوباره تلاش فرمایید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-16 bg-[#042f2e] min-h-screen text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        {/* Section Header with motion */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#073834] border border-[#0d9488]/40 text-[#84cc16] text-xs font-bold mb-4 shadow-sm">
            <Trophy className="w-4 h-4 text-[#84cc16]" />
            <span>پویش‌های کتابخوانی و مسابقات فصلی</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
            مسابقات بزرگ کتابخوانی مسجد
          </h2>
          <p className="text-sm sm:text-base text-[#ccfbf1]/80 leading-relaxed">
            با مطالعه آثار برجسته، تفکر و پاسخ به پرسش‌ها، در کنار بهره‌مندی از اقیانوس معرفت، از جوایز ارزشمند معنوی و مادی برخوردار شوید.
          </p>
        </motion.div>

        {/* Competitions Grid with Golden Aura or Empty State */}
        {displayCompetitions.length === 0 ? (
          <div className="py-24 text-center max-w-lg mx-auto space-y-4 bg-[#073834]/80 border-2 border-dashed border-[#0d9488]/40 rounded-3xl p-8 shadow-2xl">
            <div className="w-20 h-20 rounded-3xl bg-[#042f2e] border border-[#0d9488]/50 text-[#84cc16] flex items-center justify-center mx-auto shadow-2xl">
              <Trophy className="w-10 h-10 opacity-70" />
            </div>
            <h3 className="text-2xl font-black text-white">مسابقه‌ای وجود ندارد</h3>
            <p className="text-xs sm:text-sm text-[#ccfbf1]/80 leading-relaxed">
              در حال حاضر هیچ مسابقه کتابخوانی فعالی برای شرکت تعریف نشده است. مسابقات و پویش‌های مطالعاتی جدید به زودی از همین بخش اطلاع‌رسانی خواهد شد.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {displayCompetitions.map((comp, idx) => {
              const isRegistered = registeredCompIds.includes(comp.id);
              const compSources = (comp.sources && comp.sources.length > 0)
                ? comp.sources
                : (comp.book_title ? [comp.book_title] : []);

              return (
                <motion.div
                  key={comp.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="golden-rotating-border-container p-[2px] rounded-3xl shadow-2xl"
                >
                  <div
                    className="golden-rotating-border-inner bg-[#073834]/95 rounded-3xl p-5 sm:p-7 flex flex-col justify-between hover:border-[#84cc16]/50 transition-all group overflow-hidden relative h-full"
                  >
                  {/* Poster / Header Image centered with blurred borders and lightbox preview */}
                  {comp.poster_url && (
                    <div className="w-full mb-6 flex flex-col items-center">
                      <div
                        onClick={() => setLightboxImage({ src: comp.poster_url!, title: comp.title })}
                        className="relative group/poster cursor-pointer w-full max-w-md h-52 sm:h-60 rounded-2xl overflow-hidden bg-[#042f2e] border border-[#0d9488]/40 shadow-xl flex items-center justify-center transition-all hover:border-[#84cc16]/60 hover:shadow-2xl"
                        title="کلیک برای مشاهده تصویر کامل"
                      >
                        {/* Blurred backdrop using same image */}
                        <div
                          className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-40 scale-125"
                          style={{ backgroundImage: `url(${comp.poster_url})` }}
                        />
                        {/* Sharp centered image */}
                        <img
                          src={comp.poster_url}
                          alt={comp.title}
                          className="relative z-10 max-h-48 sm:max-h-56 max-w-[85%] object-contain mx-auto rounded-lg shadow-lg group-hover/poster:scale-105 transition-transform duration-300"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 z-20 bg-black/40 opacity-0 group-hover/poster:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold backdrop-blur-[2px]">
                          <Maximize2 className="w-4 h-4 text-[#84cc16]" />
                          <span>مشاهده تصویر کامل</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#99f6e4]/60 mt-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#84cc16]" />
                        <span>جهت مشاهده در اندازه کامل، روی عکس کلیک کنید</span>
                      </span>
                    </div>
                  )}

                  <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      comp.status === 'در حال برگزاری'
                        ? 'bg-emerald-950/80 text-[#84cc16] border-[#84cc16]/40'
                        : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                    }`}>
                      {comp.status}
                    </span>
                    <span className="text-xs text-[#99f6e4] font-medium flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-[#84cc16]" />
                      <span>{compSources.length > 1 ? `${toPersianDigits(compSources.length)} منبع مطالعاتی` : 'تک‌منبعی'}</span>
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white mb-2 group-hover:text-[#a3e635] transition-colors">
                    {comp.title}
                  </h3>

                  {compSources.length > 0 && (
                    <div className="text-xs text-[#84cc16] font-bold mb-3 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[#99f6e4]">منابع مسابقه:</span>
                      {compSources.map((s, idx) => (
                        <span key={idx} className="bg-[#042f2e] px-2 py-0.5 rounded-lg border border-[#0d9488]/30">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-[#ccfbf1]/90 leading-relaxed text-justify mb-6">
                    {comp.description}
                  </p>

                  {/* Dates: Start Date and Deadline clearly displayed */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#99f6e4] bg-[#042f2e] p-3 rounded-xl border border-[#0d9488]/30 mb-5">
                    {comp.start_date && (
                      <div className="flex items-center gap-1.5 bg-[#073834] px-2.5 py-1 rounded-lg border border-[#0d9488]/40">
                        <Calendar className="w-4 h-4 text-[#84cc16]" />
                        <span>تاریخ شروع: <strong className="text-white">{toPersianDigits(comp.start_date)}</strong></span>
                      </div>
                    )}
                    {comp.end_date && (
                      <div className="flex items-center gap-1.5 bg-[#073834] px-2.5 py-1 rounded-lg border border-[#0d9488]/40">
                        <Calendar className="w-4 h-4 text-amber-400" />
                        <span>مهلت شرکت: <strong className="text-white">{toPersianDigits(comp.end_date)}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Prizes */}
                  <div className="space-y-2 mb-6">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-[#84cc16]" />
                      جوایز برگزیدگان:
                    </h4>
                    <ul className="space-y-1.5 text-xs text-[#ccfbf1]/90">
                      {(Array.isArray(comp.prizes) ? comp.prizes : [comp.prizes]).map((prz, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#84cc16] shrink-0" />
                          <span>{prz}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Actions and Link */}
                <div className="pt-4 border-t border-[#0d9488]/30 space-y-3">
                  {comp.link_url && (
                    <a
                      href={comp.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-[#042f2e] hover:bg-[#073834] text-[#84cc16] hover:text-[#a3e635] border border-[#84cc16]/40 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>ورود به لینک آزمون / اطلاعیه مسابقه</span>
                    </a>
                  )}

                  {isRegistered ? (
                    <div className="p-3 rounded-xl bg-emerald-950 border border-[#84cc16] text-[#a3e635] text-xs font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>نام‌نویسی شما با موفقیت ثبت شد. سؤالات و نتایج از طریق پیامک یا ایتا اطلاع‌رسانی خواهد شد.</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenRegisterModal(comp)}
                      className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-[#84cc16] to-[#65a30d] hover:from-[#a3e635] hover:to-[#84cc16] text-[#042f2e] font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#84cc16]/20 transition-all cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>ثبت‌نام رایگان در مسابقه</span>
                    </button>
                  )}
                </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        )}

        {/* REGISTRATION FORM MODAL */}
        {selectedCompForReg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-lg bg-[#042f2e] border-2 border-[#0d9488]/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-right my-8 animate-in fade-in zoom-in-95">
              
              <div className="flex items-center justify-between pb-4 border-b border-[#0d9488]/30 mb-6">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#84cc16]" />
                    <span>ثبت‌نام در مسابقه کتابخوانی</span>
                  </h3>
                  <p className="text-xs text-[#99f6e4] mt-1">{selectedCompForReg.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCompForReg(null)}
                  className="p-1.5 rounded-xl bg-[#073834] text-stone-400 hover:text-white border border-[#0d9488]/30"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 mb-4 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 mb-4 rounded-xl bg-emerald-950/80 border border-[#84cc16] text-[#a3e635] text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#84cc16]" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitRegistration} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-[#99f6e4] mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#84cc16]" />
                    <span>نام و نام خانوادگی: *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: علی حسینی"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs placeholder-[#99f6e4]/40 focus:border-[#84cc16] focus:outline-none"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-[#99f6e4] mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#84cc16]" />
                    <span>شماره تلفن همراه (جهت ارسال سؤالات و نتایج): *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09123456789"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs font-mono placeholder-[#99f6e4]/40 focus:border-[#84cc16] focus:outline-none"
                  />
                </div>

                {/* Unit Selection (Dropdown) */}
                <div>
                  <label className="block text-xs font-bold text-[#99f6e4] mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#84cc16]" />
                    <span>واحد ثبت‌نامی: *</span>
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs font-medium focus:border-[#84cc16] focus:outline-none"
                  >
                    <option value="واحد راهنمایی">واحد راهنمایی</option>
                    <option value="واحد دبیرستان">واحد دبیرستان</option>
                    <option value="واحد طلاب و دانشجویان">واحد طلاب و دانشجویان</option>
                    <option value="عموم مردم">عموم مردم</option>
                  </select>
                </div>

                {/* Book selection if multiple sources or single source */}
                {(() => {
                  const compSources = (selectedCompForReg.sources && selectedCompForReg.sources.length > 0)
                    ? selectedCompForReg.sources
                    : (selectedCompForReg.book_title ? [selectedCompForReg.book_title] : []);

                  if (compSources.length > 1) {
                    return (
                      <div>
                        <label className="block text-xs font-bold text-[#99f6e4] mb-1.5 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-[#84cc16]" />
                          <span>انتخاب کتاب منبع مسابقه:</span>
                        </label>
                        <select
                          value={selectedBook}
                          onChange={(e) => setSelectedBook(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs font-medium focus:border-[#84cc16] focus:outline-none"
                        >
                          {compSources.map((src, i) => (
                            <option key={i} value={src}>{src}</option>
                          ))}
                        </select>
                      </div>
                    );
                  } else if (compSources.length === 1) {
                    return (
                      <div>
                        <label className="block text-xs font-bold text-[#99f6e4] mb-1 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-[#84cc16]" />
                          <span>کتاب مسابقه:</span>
                        </label>
                        <div className="p-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/30 text-white text-xs">
                          {compSources[0]}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#84cc16] hover:bg-[#a3e635] text-[#042f2e] font-black text-xs shadow-lg transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'در حال ثبت‌نام...' : 'تأیید و ثبت‌نام نهایی'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCompForReg(null)}
                    className="px-4 py-3 rounded-xl bg-[#073834] text-stone-300 hover:text-white text-xs font-bold"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Full Image Lightbox Modal */}
        {lightboxImage && (
          <div
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[92vh] bg-[#042f2e] border-2 border-[#84cc16]/60 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center cursor-default"
            >
              <div className="w-full flex items-center justify-between pb-3 border-b border-[#0d9488]/30 mb-3 px-2">
                <span className="text-sm sm:text-base font-black text-white line-clamp-1">{lightboxImage.title}</span>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-xl bg-[#073834] text-stone-300 hover:text-white border border-[#0d9488]/40 transition-colors cursor-pointer"
                  title="بستن"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative max-h-[75vh] overflow-hidden flex items-center justify-center rounded-2xl bg-[#021d1c] p-2 border border-[#0d9488]/30">
                <img
                  src={lightboxImage.src}
                  alt={lightboxImage.title}
                  className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
