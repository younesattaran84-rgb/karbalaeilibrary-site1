import React, { useState, useEffect } from 'react';
import { X, User, Shield, Lock, Phone, UserCheck, KeyRound, CheckCircle, AlertCircle, LogOut, MessageSquare, Send, RefreshCw, UserPlus } from 'lucide-react';
import { UserProfile, Reservation, UserMessage } from '../types';
import { toPersianDigits, toEnglishDigits, getDaysRemaining } from '../utils/persian';
import { containsProfanity } from '../utils/profanityFilter';
import { CaptchaField, generateRandomCaptcha } from './CaptchaField';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  isAdmin: boolean;
  onUserLogin: (phone: string, pass: string) => Promise<boolean>;
  onUserRegister: (name: string, family: string, phone: string, pass: string) => Promise<boolean>;
  onAdminLogin: (username: string, serial: string) => Promise<boolean>;
  onLogout: () => void;
  userReservations?: Reservation[];
  onExtendReservation?: (reservationId: string, weeks?: 1 | 2) => Promise<boolean>;
  onOpenUserPanel?: () => void;
  onOpenAdminPanel?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isAdmin,
  onUserLogin,
  onUserRegister,
  onAdminLogin,
  onLogout,
  userReservations = [],
  onExtendReservation,
  onOpenUserPanel,
  onOpenAdminPanel,
}) => {
  const [activeTab, setActiveTab] = useState<'user' | 'register' | 'admin'>('user');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regFamily, setRegFamily] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminSerial, setAdminSerial] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isNotRegisteredError, setIsNotRegisteredError] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [msgSubject, setMsgSubject] = useState('');
  const [msgText, setMsgText] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [userMessages, setUserMessages] = useState<UserMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Security Captcha State
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const [captchaInput, setCaptchaInput] = useState<string>('');

  const refreshCaptcha = () => {
    setCaptchaCode(generateRandomCaptcha());
    setCaptchaInput('');
  };

  useEffect(() => {
    if (isOpen) {
      refreshCaptcha();
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsNotRegisteredError(false);
    }
  }, [isOpen, activeTab]);

  const fetchUserMessages = async () => {
    if (!currentUser?.phone) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/user/messages?phone=${currentUser.phone}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setUserMessages(data.messages);
      }
    } catch {
      // ignore
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (currentUser?.phone) {
      fetchUserMessages();
    }
  }, [currentUser?.phone]);

  if (!isOpen) return null;

  const handleUserLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsNotRegisteredError(false);

    // Validate security captcha
    if (!captchaInput.trim()) {
      setErrorMsg('لطفاً کد امنیتی را وارد نمایید.');
      return;
    }
    if (toEnglishDigits(captchaInput).trim() !== captchaCode) {
      setErrorMsg('کد امنیتی وارد شده نادرست است. کد جدید تولید شد.');
      refreshCaptcha();
      return;
    }

    setLoading(true);
    try {
      const ok = await onUserLogin(phone, password);
      if (ok) {
        setSuccessMsg('با موفقیت وارد حساب خود شدید.');
        setTimeout(() => onClose(), 800);
      }
    } catch (err: any) {
      refreshCaptcha();
      let msg = err.message || 'خطا در ورود کاربر';
      if (err.is_blocked || msg.includes('مسدود') || msg.includes('تخلف') || msg.includes('Unexpected token') || msg.includes('is not valid JSON') || msg.includes('<html')) {
        msg = 'کاربر به دلیل تخلف مسدود شده است';
      }
      setErrorMsg(msg);
      if (err.not_registered || msg.includes('ثبت‌نام نشده') || msg.includes('ثبت نشده')) {
        setIsNotRegisteredError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate security captcha
    if (!captchaInput.trim()) {
      setErrorMsg('لطفاً کد امنیتی را وارد نمایید.');
      return;
    }
    if (toEnglishDigits(captchaInput).trim() !== captchaCode) {
      setErrorMsg('کد امنیتی وارد شده نادرست است. کد جدید تولید شد.');
      refreshCaptcha();
      return;
    }

    setLoading(true);
    try {
      const ok = await onUserRegister(regName, regFamily, phone, password);
      if (ok) {
        setSuccessMsg('ثبت‌نام با موفقیت انجام شد. اکنون وارد شدید.');
        setTimeout(() => onClose(), 800);
      }
    } catch (err: any) {
      refreshCaptcha();
      let msg = err.message || 'خطا در ثبت‌نام';
      if (err.is_blocked || msg.includes('مسدود') || msg.includes('تخلف') || msg.includes('Unexpected token') || msg.includes('is not valid JSON') || msg.includes('<html')) {
        msg = 'کاربر به دلیل تخلف مسدود شده است';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate security captcha
    if (!captchaInput.trim()) {
      setErrorMsg('لطفاً کد امنیتی را وارد نمایید.');
      return;
    }
    if (toEnglishDigits(captchaInput).trim() !== captchaCode) {
      setErrorMsg('کد امنیتی وارد شده نادرست است. کد جدید تولید شد.');
      refreshCaptcha();
      return;
    }

    setLoading(true);
    try {
      const ok = await onAdminLogin(adminUsername, adminSerial);
      if (ok) {
        setSuccessMsg('احراز هویت مدیر با موفقیت تأیید گردید.');
        setTimeout(() => onClose(), 800);
      }
    } catch (err: any) {
      refreshCaptcha();
      setErrorMsg(err.message || 'نام کاربری یا سریال اشتباه است.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in text-right">
      <div className="relative w-full max-w-lg bg-[#042f2e] border-2 border-[#0d9488]/60 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl bg-[#073834] text-[#a3e635] hover:bg-[#0d9488]/30 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* If Already Logged In */}
        {currentUser || isAdmin ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0d9488] to-[#84cc16] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {isAdmin ? <Shield className="w-7 h-7" /> : <User className="w-7 h-7" />}
              </div>
              <div>
                <span className="text-xs font-bold text-[#84cc16] bg-[#073834] px-2.5 py-0.5 rounded-full border border-[#0d9488]/40">
                  {isAdmin ? 'مدیر ارشد کتابخانه' : 'عضو کتابخانه'}
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  {isAdmin ? 'پنل مدیریت فعال است' : `${currentUser?.name} ${currentUser?.family}`}
                </h3>
                {currentUser && (
                  <p className="text-xs text-[#99f6e4]">شماره تماس: {currentUser.phone}</p>
                )}
              </div>
            </div>

            {/* Profile Overview Card */}
            {!isAdmin && currentUser && (
              <div className="p-4 rounded-2xl bg-[#073834] border border-[#0d9488]/40 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#99f6e4]">وضعیت عضویت:</span>
                  <span className="font-bold text-[#84cc16]">فعال</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#99f6e4]">سهمیه رزرو فعال همزمان:</span>
                  <span className="font-bold text-white">
                    {toPersianDigits(currentUser.active_reservations_count || 0)} از ۴ کتاب
                  </span>
                </div>
                <div className="w-full h-2 bg-[#042f2e] rounded-full overflow-hidden border border-[#0d9488]/30">
                  <div
                    className="h-full bg-[#84cc16]"
                    style={{ width: `${((currentUser.active_reservations_count || 0) / 4) * 100}%` }}
                  />
                </div>

                {/* User Reservations List */}
                <div className="pt-2 border-t border-[#0d9488]/20">
                  <h4 className="text-xs font-bold text-white mb-2">درخواست‌های رزرو و امانت شما:</h4>
                  {userReservations.length === 0 ? (
                    <p className="text-xs text-[#99f6e4]/70">هیچ رزرو یا امانت فعالی در سیستم ندارید.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {userReservations.map((res) => {
                        const daysLeft = res.due_date ? getDaysRemaining(res.due_date, res.due_date_iso) : null;
                        const hasAlreadyExtended = (res.extension_count || 0) >= 1;
                        const isUnder3Days = daysLeft !== null && daysLeft <= 3;
                        const canExtend = (res.status === 'امانت فعال' || res.status === 'تأیید شده') && 
                          !hasAlreadyExtended && 
                          (!res.extension_status || res.extension_status === 'رد شده') &&
                          isUnder3Days;

                        return (
                          <div
                            key={res.id}
                            className="p-2.5 rounded-xl bg-[#042f2e] border border-[#0d9488]/30 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <strong className="block text-white font-bold">{res.book_title}</strong>
                                <span className="text-[10px] text-[#99f6e4]">
                                  قفسه {toPersianDigits(res.shelf)} - کد {toPersianDigits(res.book_number)}
                                </span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                res.status === 'امانت فعال'
                                  ? 'bg-emerald-950 text-[#a3e635] border-[#84cc16]/40'
                                  : 'bg-[#073834] text-[#5eead4] border-[#0d9488]/40'
                              }`}>
                                {res.status}
                              </span>
                            </div>

                            {/* Due date if available with countdown */}
                            {res.due_date && (
                              <div className="flex items-center justify-between text-[11px] bg-[#073834]/60 px-2 py-1 rounded-lg border border-[#0d9488]/20">
                                <span className="text-[#99f6e4]">موعد تحویل:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-[#a3e635]">{toPersianDigits(res.due_date)}</span>
                                  {daysLeft !== null && (
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                      daysLeft < 0
                                        ? 'bg-rose-950/80 text-rose-300'
                                        : daysLeft <= 3
                                        ? 'bg-amber-950/80 text-amber-300'
                                        : 'bg-[#042f2e] text-[#99f6e4]'
                                    }`}>
                                      ({daysLeft < 0 ? `${toPersianDigits(Math.abs(daysLeft))} روز تاخیر` : `${toPersianDigits(daysLeft)} روز باقیمانده`})
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Extension status or request button */}
                            {res.extension_status === 'در انتظار بررسی' ? (
                              <div className="text-[10px] text-amber-300 bg-amber-950/60 p-1.5 rounded-lg border border-amber-600/30 text-center font-medium">
                                ⏳ درخواست تمدید شما ({toPersianDigits(res.extension_requested_weeks || 1)} هفته) برای بررسی ادمین ارسال شده است.
                              </div>
                            ) : res.extension_status === 'تأیید شده' ? (
                              <div className="text-[10px] text-[#a3e635] bg-emerald-950/60 p-1.5 rounded-lg border border-[#84cc16]/30 text-center font-medium">
                                ✓ تمدید امانت این کتاب یک‌بار با موفقیت تأیید شده است.
                              </div>
                            ) : hasAlreadyExtended ? (
                              <div className="text-[10px] text-stone-400 bg-[#073834]/40 p-1 rounded text-center">
                                سقف ۱ بار تمدید برای این کتاب استفاده شده است.
                              </div>
                            ) : canExtend && onExtendReservation ? (
                              <div className="pt-1 space-y-1">
                                <div className="text-[10px] text-amber-300 flex items-center justify-between">
                                  <span>کمتر از ۳ روز تا موعد تحویل مانده است:</span>
                                  <span className="text-stone-400 text-[9px]">(امکان تمدید فقط یکبار)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={extendingId === res.id}
                                    onClick={async () => {
                                      setExtendingId(res.id);
                                      try {
                                        await onExtendReservation(res.id, 1);
                                        setSuccessMsg('درخواست تمدید ۱ هفته‌ای با موفقیت ارسال شد.');
                                      } catch (err: any) {
                                        setErrorMsg(err.message || 'خطا در ثبت تمدید');
                                      } finally {
                                        setExtendingId(null);
                                      }
                                    }}
                                    className="flex-1 py-1.5 px-2 rounded-lg bg-[#073834] hover:bg-[#0d9488]/40 border border-[#84cc16]/60 text-[#a3e635] text-[10px] font-black transition-all disabled:opacity-50"
                                  >
                                    {extendingId === res.id ? '...' : 'تمدید ۱ هفته (۷ روز)'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={extendingId === res.id}
                                    onClick={async () => {
                                      setExtendingId(res.id);
                                      try {
                                        await onExtendReservation(res.id, 2);
                                        setSuccessMsg('درخواست تمدید ۲ هفته‌ای با موفقیت ارسال شد.');
                                      } catch (err: any) {
                                        setErrorMsg(err.message || 'خطا در ثبت تمدید');
                                      } finally {
                                        setExtendingId(null);
                                      }
                                    }}
                                    className="flex-1 py-1.5 px-2 rounded-lg bg-[#073834] hover:bg-[#0d9488]/40 border border-[#84cc16]/60 text-[#a3e635] text-[10px] font-black transition-all disabled:opacity-50"
                                  >
                                    {extendingId === res.id ? '...' : 'تمدید ۲ هفته (۱۴ روز)'}
                                  </button>
                                </div>
                              </div>
                            ) : !isUnder3Days && (res.status === 'امانت فعال' || res.status === 'تأیید شده') ? (
                              <div className="text-[10px] text-[#99f6e4]/60 text-center">
                                امکان درخواست تمدید در ۳ روز پایانی موعد امانت فعال می‌شود.
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Direct Message to Admin Drawer */}
                <div className="pt-2 border-t border-[#0d9488]/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#84cc16]" />
                      <span>پیام‌ها و پاسخ‌های مدیریت:</span>
                    </span>
                    <button
                      type="button"
                      onClick={fetchUserMessages}
                      className="p-1 rounded-lg bg-[#042f2e] text-[#99f6e4] hover:text-white"
                      title="تازه‌سازی پیام‌ها"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingMessages ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {/* Previous messages from user with admin replies */}
                  {userMessages.length > 0 && (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {userMessages.map((msg) => (
                        <div key={msg.id} className="p-2.5 rounded-xl bg-[#042f2e] border border-[#0d9488]/30 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <strong className="text-white truncate">{msg.subject}</strong>
                            <span className={`px-1.5 py-0.2 rounded-full font-bold ${
                              msg.status === 'پاسخ داده شده'
                                ? 'bg-emerald-950 text-[#a3e635] border border-[#84cc16]/30'
                                : 'bg-amber-950 text-amber-300 border border-amber-600/30'
                            }`}>
                              {msg.status}
                            </span>
                          </div>
                          <p className="text-[#99f6e4] text-[11px]">{msg.content}</p>
                          {msg.admin_reply && (
                            <div className="mt-1 p-1.5 rounded-lg bg-[#073834] border border-[#84cc16]/40 text-[#a3e635] text-[11px]">
                              <span className="font-bold block text-[10px] text-white">پاسخ مدیر کتابخانه:</span>
                              <span>{msg.admin_reply}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {!showMessageBox ? (
                    <button
                      type="button"
                      onClick={() => setShowMessageBox(true)}
                      className="w-full py-2 px-3 rounded-xl bg-[#042f2e] hover:bg-[#0d9488]/20 border border-[#0d9488]/40 text-[#99f6e4] text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <Send className="w-3.5 h-3.5 text-[#84cc16]" />
                      <span>ارسال پیام یا سوال جدید به مدیریت</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-[#042f2e] border border-[#0d9488]/40 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-white font-bold text-[11px]">ارسال پیام به مدیریت:</strong>
                        <button
                          type="button"
                          onClick={() => setShowMessageBox(false)}
                          className="text-[10px] text-rose-400 hover:text-rose-300"
                        >
                          انصراف
                        </button>
                      </div>
                      <input
                        type="text"
                        value={msgSubject}
                        onChange={(e) => setMsgSubject(e.target.value)}
                        placeholder="موضوع پیام (مثلاً درخواست تهیه کتاب جدید)"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#073834] border border-[#0d9488]/30 text-white text-xs placeholder-[#99f6e4]/40"
                      />
                      <textarea
                        rows={2}
                        value={msgText}
                        onChange={(e) => setMsgText(e.target.value)}
                        placeholder="متن پیام، پیشنهاد یا سوال خود را بنویسید..."
                        className="w-full p-2 rounded-lg bg-[#073834] border border-[#0d9488]/30 text-white text-xs placeholder-[#99f6e4]/40"
                      />
                      <button
                        type="button"
                        disabled={msgSending || !msgText.trim()}
                        onClick={async () => {
                          if (!currentUser || !msgText.trim()) return;
                          if (containsProfanity(msgSubject) || containsProfanity(msgText)) {
                            setErrorMsg('از کلمات رکیک و ناپسند استفاده نکنید.');
                            return;
                          }
                          setMsgSending(true);
                          try {
                            const res = await fetch('/api/messages', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                user_name: `${currentUser.name} ${currentUser.family}`,
                                user_phone: currentUser.phone,
                                subject: msgSubject.trim() || 'پیام عمومی',
                                content: msgText.trim(),
                              }),
                            });
                            const data = await res.json();
                            if (data.success) {
                              setSuccessMsg('پیام شما با موفقیت برای مدیریت کتابخانه ارسال شد.');
                              setShowMessageBox(false);
                              setMsgSubject('');
                              setMsgText('');
                              fetchUserMessages();
                            } else {
                              setErrorMsg(data.message || 'خطا در ارسال پیام');
                            }
                          } catch {
                            setErrorMsg('ارتباط با سرور برقرار نشد.');
                          } finally {
                            setMsgSending(false);
                          }
                        }}
                        className="w-full py-1.5 rounded-lg bg-[#0d9488] hover:bg-[#14b8a6] text-white font-bold text-xs disabled:opacity-50"
                      >
                        {msgSending ? 'در حال ارسال...' : 'ارسال به مدیریت'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Direct Link to Dedicated User Panel */}
            {!isAdmin && currentUser && onOpenUserPanel && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUserPanel();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#84cc16] to-[#65a30d] hover:from-[#a3e635] hover:to-[#84cc16] text-[#042f2e] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#84cc16]/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <User className="w-4 h-4" />
                <span>ورود به پنل جامع و تمام‌صفحه کاربری</span>
              </button>
            )}

            {/* Direct Link to Dedicated Admin Panel */}
            {isAdmin && onOpenAdminPanel && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdminPanel();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#eab308] to-[#ca8a04] hover:from-[#facc15] hover:to-[#eab308] text-[#042f2e] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Shield className="w-4 h-4" />
                <span>ورود به پنل مدیریت کتابخانه</span>
              </button>
            )}

            <button
              type="button"
              onClick={onLogout}
              className="w-full py-3 px-4 rounded-2xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700/50 text-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج از حساب</span>
            </button>
          </div>
        ) : (
          /* Login Tabs & Forms */
          <div>
            {/* Header Tabs */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#073834] border border-[#0d9488]/40 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('user');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'user'
                    ? 'bg-[#0d9488] text-white shadow-md'
                    : 'text-[#99f6e4] hover:text-white'
                }`}
              >
                ورود اعضا
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'register'
                    ? 'bg-[#0d9488] text-white shadow-md'
                    : 'text-[#99f6e4] hover:text-white'
                }`}
              >
                ثبت‌نام جدید
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'admin'
                    ? 'bg-[#84cc16] text-[#042f2e] shadow-md font-black'
                    : 'text-[#99f6e4] hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>ورود مدیر</span>
              </button>
            </div>

            {/* Error and Success alerts */}
            {errorMsg && (
              <div className="p-3.5 mb-4 rounded-2xl bg-rose-950/90 border border-rose-600/80 text-rose-200 text-xs flex flex-col gap-2.5 shadow-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
                {isNotRegisteredError && (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setIsNotRegisteredError(false);
                      setActiveTab('register');
                      refreshCaptcha();
                    }}
                    className="self-start px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#a3e635]" />
                    <span>برای عضویت و ثبت‌نام با همین شماره، اینجا کلیک کنید</span>
                  </button>
                )}
              </div>
            )}
            {successMsg && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-950/80 border border-[#84cc16] text-[#a3e635] text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* User Login Form */}
            {activeTab === 'user' && (
              <form onSubmit={handleUserLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#99f6e4] mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#84cc16]" />
                    شماره تلفن همراه:
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: 09161112233"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#84cc16]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#99f6e4] mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#84cc16]" />
                    رمز عبور:
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="رمز عبور خود را وارد نمایید"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#84cc16]"
                  />
                </div>

                {/* Security Captcha for User Login */}
                <CaptchaField
                  id="user-login-captcha"
                  value={captchaInput}
                  onChange={setCaptchaInput}
                  captchaCode={captchaCode}
                  onRefresh={refreshCaptcha}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#84cc16] to-[#65a30d] hover:from-[#a3e635] hover:to-[#84cc16] text-[#042f2e] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#84cc16]/20 transition-all"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{loading ? 'در حال ورود...' : 'ورود به حساب کاربری'}</span>
                </button>
              </form>
            )}

            {/* User Register Form */}
            {activeTab === 'register' && (
              <form onSubmit={handleUserRegisterSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#99f6e4] mb-1">نام:</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="نام"
                      className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs focus:ring-2 focus:ring-[#84cc16]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#99f6e4] mb-1">نام خانوادگی:</label>
                    <input
                      type="text"
                      required
                      value={regFamily}
                      onChange={(e) => setRegFamily(e.target.value)}
                      placeholder="نام خانوادگی"
                      className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs focus:ring-2 focus:ring-[#84cc16]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#99f6e4] mb-1">شماره تلفن همراه:</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0916xxxxxxx"
                    className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs focus:ring-2 focus:ring-[#84cc16]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#99f6e4] mb-1">رمز عبور دلخواه:</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="حداقل ۶ کاراکتر"
                    className="w-full px-3 py-2 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs focus:ring-2 focus:ring-[#84cc16]"
                  />
                </div>

                {/* Security Captcha for User Register */}
                <CaptchaField
                  id="user-register-captcha"
                  value={captchaInput}
                  onChange={setCaptchaInput}
                  captchaCode={captchaCode}
                  onRefresh={refreshCaptcha}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#0d9488] to-[#0f766e] hover:from-[#14b8a6] hover:to-[#0d9488] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <UserCheck className="w-4 h-4 text-[#84cc16]" />
                  <span>{loading ? 'در حال ثبت اطلاعات...' : 'تکمیل عضویت رایگان'}</span>
                </button>
              </form>
            )}

            {/* Admin Login Form */}
            {activeTab === 'admin' && (
              <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                <div className="p-3 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-[#99f6e4] text-[11px] leading-relaxed flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#84cc16] shrink-0" />
                  <span>سامانه مدیریت کتابخانه شهید احسان کربلایی‌پور - احراز هویت امن</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#99f6e4] mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#84cc16]" />
                    نام کاربری مدیریت:
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="نام کاربری مدیریت"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#84cc16]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#99f6e4] mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#84cc16]" />
                    رمز عبور / سریال مدیریت:
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={adminSerial}
                    onChange={(e) => setAdminSerial(e.target.value)}
                    placeholder="رمز عبور مدیریت"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#84cc16]"
                  />
                </div>

                {/* Security Captcha for Admin Login */}
                <CaptchaField
                  id="admin-login-captcha"
                  value={captchaInput}
                  onChange={setCaptchaInput}
                  captchaCode={captchaCode}
                  onRefresh={refreshCaptcha}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#84cc16] to-[#65a30d] hover:from-[#a3e635] hover:to-[#84cc16] text-[#042f2e] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#84cc16]/20 transition-all"
                >
                  <Shield className="w-4 h-4" />
                  <span>{loading ? 'در حال بررسی احراز هویت...' : 'ورود امن به پنل مدیریت'}</span>
                </button>
              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
