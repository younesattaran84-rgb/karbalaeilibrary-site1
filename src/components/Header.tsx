import React, { useState, useEffect } from 'react';
import { Menu, MapPin, User, LogIn, LogOut, BookOpen, Sparkles, HelpCircle, Trophy, X, Shield, Clock } from 'lucide-react';
import { LibraryLogo } from './LibraryLogo';
import { EitaaIcon } from './EitaaIcon';
import { OperatingHours, HomepageCMS } from '../types';
import { isLibraryOpenNow, toPersianDigits } from '../utils/persian';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenAccountModal: () => void;
  activeReservationsCount?: number;
  isLoggedIn?: boolean;
  isAdmin?: boolean;
  onLogout?: () => void;
  operatingHours?: OperatingHours;
  cms?: HomepageCMS;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  onOpenAccountModal,
  activeReservationsCount = 0,
  isLoggedIn = false,
  isAdmin = false,
  onLogout,
  operatingHours,
  cms,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [status, setStatus] = useState(() => isLibraryOpenNow(operatingHours));

  useEffect(() => {
    setStatus(isLibraryOpenNow(operatingHours));
    // Update live status every 60 seconds
    const interval = setInterval(() => {
      setStatus(isLibraryOpenNow(operatingHours));
    }, 60000);
    return () => clearInterval(interval);
  }, [operatingHours]);

  const navItems = [
    ...(isAdmin
      ? [{ id: 'admin', label: 'پنل ادمین', icon: Shield, isAccountAction: false }]
      : isLoggedIn
      ? [{ id: 'user-panel', label: cms?.header_cta_user_text || 'پنل کاربری من', icon: User, isAccountAction: false }]
      : [{ id: 'login', label: cms?.header_cta_login_text || 'ورود به سایت', icon: LogIn, isAccountAction: true }]),
    { id: 'books', label: 'همه کتاب‌ها', icon: BookOpen },
    { id: 'intro', label: 'معرفی کتاب', icon: Sparkles },
    { id: 'competitions', label: 'مسابقات', icon: Trophy },
    { id: 'faq', label: 'سؤالات متداول', icon: HelpCircle },
  ];

  const handleNavClick = (id: string, isAccountAction?: boolean) => {
    if (isAccountAction) {
      onOpenAccountModal();
    } else {
      onNavigate(id);
    }
    setDrawerOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#042f2e]/90 border-b border-[#0d9488]/30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Right Section: Logo & Hamburger */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="p-2.5 rounded-xl bg-[#073834] text-[#a3e635] hover:bg-[#0d9488]/30 border border-[#0d9488]/40 transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#84cc16]"
              aria-label="باز کردن منو"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => onNavigate('home')}
              className="text-right focus:outline-none"
            >
              <LibraryLogo
                size="md"
                customLogoUrl={cms?.header_logo_url}
                customTitle={cms?.header_brand_title}
                customSubtitle={cms?.header_brand_subtitle}
                customLogoScale={cms?.header_logo_scale}
                customLogoFit={cms?.header_logo_fit}
                customLogoRadius={cms?.header_logo_radius}
              />
            </button>
          </div>

          {/* Center Section: Desktop Navigation Items */}
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id, item.isAccountAction)}
                  className={`group relative px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 select-none hover-hop ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0d9488] to-[#0f766e] text-white shadow-md shadow-[#0d9488]/30 border border-[#84cc16]/50'
                      : 'text-[#ccfbf1] hover:text-[#a3e635] hover:bg-[#073834]/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-[#a3e635]' : 'text-[#5eead4]'}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {(item.id === 'user-panel' || item.id === 'account' || item.id === 'login') && activeReservationsCount > 0 && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold bg-[#84cc16] text-[#042f2e] rounded-full">
                      {toPersianDigits(activeReservationsCount)}
                    </span>
                  )}
                  {item.id === 'admin' && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-[#eab308] text-[#042f2e] rounded-full font-bold">
                      <Shield className="w-2.5 h-2.5" />
                      مدیر
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Left Section: Live Status, Map (Neshan) & Eitaa */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Library Status Badge */}
            {(cms?.header_show_live_status !== false) && (
              <div
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  status.isOpen
                    ? 'bg-[#84cc16]/15 text-[#a3e635] border-[#84cc16]/40 shadow-sm shadow-[#84cc16]/20'
                    : status.isHoliday
                    ? 'bg-amber-950/40 text-amber-300 border-amber-700/40'
                    : 'bg-rose-950/40 text-rose-300 border-rose-800/40'
                }`}
                title={status.detailText}
              >
                <span className={`w-2 h-2 rounded-full ${status.isOpen ? 'bg-[#a3e635] animate-pulse' : status.isHoliday ? 'bg-amber-400' : 'bg-rose-500'}`} />
                <span>{status.statusText}</span>
                <span className="text-[10px] opacity-80 border-r border-current/30 pr-1.5 mr-0.5">
                  {status.isOpen ? `تا ${toPersianDigits(status.closeTime)}` : `${toPersianDigits(status.openTime)} الی ${toPersianDigits(status.closeTime)}`}
                </span>
              </div>
            )}

            {/* Neshan Map Button */}
            <a
              href="https://nshn.ir/8brbkMj5IBbN0X"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 sm:px-3 sm:py-2 h-9 sm:h-10 rounded-xl bg-[#073834] hover:bg-[#0d9488]/40 text-[#99f6e4] hover:text-white border border-[#0d9488]/40 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 shadow-sm group"
              title="مسیریابی در نشان (مسجد امام خمینی - کتابخانه شهید احسان کربلایی‌پور)"
            >
              <MapPin className="w-4 h-4 text-[#84cc16] group-hover:animate-bounce" />
              <span className="hidden md:inline text-xs font-medium">نشان</span>
            </a>

            {/* Official Eitaa Channel Button (Phase 4: Proportional balance with adjacent controls) */}
            <a
              href={cms?.header_eitaa_link || "https://eitaa.com/shahidKarbalailibrary"}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 sm:px-3 sm:py-2 h-9 sm:h-10 rounded-xl bg-gradient-to-r from-[#F37021]/95 to-[#EA580C] hover:from-[#F37021] hover:to-[#C2410C] text-white border border-orange-400/40 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-orange-950/30 text-xs font-bold"
              title="کانال ایتا کتابخانه شهید احسان کربلایی‌پور"
            >
              <EitaaIcon size={18} />
              <span className="hidden sm:inline">کانال ایتا</span>
            </a>
          </div>
        </div>
      </header>

      {/* Drawer Menu (Mobile and Full Navigation) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Dimmed Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Container (Sliding in from Right to Left for RTL) */}
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-[#042f2e] border-l border-[#0d9488]/40 shadow-2xl flex flex-col p-6 z-50 text-right animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-5 border-b border-[#0d9488]/30">
              <LibraryLogo
                size="sm"
                customLogoUrl={cms?.header_logo_url}
                customTitle={cms?.header_brand_title}
                customSubtitle={cms?.header_brand_subtitle}
                customLogoScale={cms?.header_logo_scale}
                customLogoFit={cms?.header_logo_fit}
                customLogoRadius={cms?.header_logo_radius}
              />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-lg bg-[#073834] text-[#a3e635] hover:bg-[#0d9488]/30 transition-colors"
                aria-label="بستن منو"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Operating status in drawer */}
            <div className="mt-4 p-3.5 rounded-2xl bg-[#073834]/90 border border-[#0d9488]/40 flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#99f6e4] flex items-center gap-1.5 font-bold">
                  <Clock className="w-4 h-4 text-[#84cc16]" />
                  ساعت کاری و وضعیت:
                </span>
                <span className={`font-black px-2 py-0.5 rounded-full text-[11px] ${
                  status.isOpen
                    ? 'bg-[#84cc16]/20 text-[#a3e635] border border-[#84cc16]/40'
                    : status.isHoliday
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {status.statusText}
                </span>
              </div>
              <div className="text-[11px] text-[#ccfbf1] font-medium pr-5">
                {status.todayScheduleText}
              </div>
              <div className="text-[10px] text-[#99f6e4]/70 pr-5">
                {status.detailText}
              </div>
            </div>

            {/* Menu Links */}
            <div className="mt-6 flex-1 overflow-y-auto space-y-1.5">
              {[
                { id: 'home', label: 'خانه', icon: LibraryLogo },
                ...(isAdmin
                  ? [{ id: 'admin', label: 'پنل ادمین', icon: Shield, isAccountAction: false }]
                  : isLoggedIn
                  ? [{ id: 'user-panel', label: 'پنل کاربری من', icon: User, isAccountAction: false }]
                  : [{ id: 'login', label: 'ورود به سایت', icon: LogIn, isAccountAction: true }]),
                { id: 'books', label: 'همه کتاب‌ها', icon: BookOpen },
                { id: 'intro', label: 'معرفی کتاب', icon: Sparkles },
                { id: 'competitions', label: 'مسابقات کتابخوانی', icon: Trophy },
                { id: 'faq', label: 'سؤالات متداول', icon: HelpCircle },
                { id: 'rules', label: 'قوانین و آیین‌نامه کتابخانه', icon: Clock },
              ].map((item) => {
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'rules') {
                        onNavigate('home');
                        setTimeout(() => {
                          const el = document.getElementById('rules-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }, 200);
                        setDrawerOpen(false);
                      } else {
                        handleNavClick(item.id, item.isAccountAction);
                      }
                    }}
                    className={`w-full text-right px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-between hover-hop ${
                      currentTab === item.id
                        ? 'bg-[#0d9488] text-white font-bold'
                        : 'text-[#ccfbf1] hover:bg-[#073834] hover:text-[#a3e635]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {(item.id === 'user-panel' || item.id === 'account' || item.id === 'login') && activeReservationsCount > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-[#84cc16] text-[#042f2e] rounded-full font-bold">
                        {toPersianDigits(activeReservationsCount)}
                      </span>
                    )}
                    {item.id === 'admin' && (
                      <span className="px-2 py-0.5 text-[10px] bg-[#eab308] text-[#042f2e] rounded-full font-bold flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        مدیر
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-4 border-t border-[#0d9488]/30 space-y-2">
              {(isLoggedIn || isAdmin) && onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setDrawerOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>{isAdmin ? 'خروج از حساب مدیریت' : 'خروج از حساب کاربری'}</span>
                </button>
              )}

              <a
                href="https://eitaa.com/shahidKarbalailibrary"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#F37021] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:bg-[#EA580C] transition-all"
              >
                <EitaaIcon size={20} />
                <span>عضویت در کانال ایتا</span>
              </a>

              <a
                href="https://nshn.ir/8brbkMj5IBbN0X"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-4 rounded-xl bg-[#073834] border border-[#0d9488]/40 text-[#99f6e4] text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#0d9488]/20 transition-all"
              >
                <MapPin className="w-4 h-4 text-[#84cc16]" />
                <span>مسیریابی در نقشه نشان</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
