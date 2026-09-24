/**
 * Persian typography, numeral formatting, and search normalization helpers
 */

import { OperatingHours, DayOperatingSchedule } from '../types';

// Convert English digits to Persian digits
export function toPersianDigits(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return '';
  const str = input.toString();
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/\d/g, (x) => persianDigits[parseInt(x, 10)]);
}

// Convert Persian digits to English digits
export function toEnglishDigits(str: string): string {
  if (!str) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(persianDigits[i], 'g'), i.toString());
    result = result.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
  }
  return result;
}

// Format numbers with comma separators and Persian digits
export function formatPersianNumber(num: number | string): string {
  if (num === undefined || num === null) return '';
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  return toPersianDigits(parts.join('.'));
}

// Format price in Tomans
export function formatToman(num: number): string {
  return `${formatPersianNumber(num)} تومان`;
}

// Normalize Persian string for resilient searching
export function normalizePersian(text: string): string {
  if (!text) return '';
  return text
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[\u200c\u200b\u200e\u200f]/g, ' ') // ZWNJ and invisible marks replaced with spaces for searching
    .replace(/[\u064B-\u065F]/g, '') // remove Arabic diacritics / vowels
    .replace(/[ـ\-_]/g, '') // remove tatweel / dashes
    .trim()
    .toLowerCase();
}

// Convert Jalali (Shamsi) date YYYY/MM/DD to Gregorian Date object (Birashk/Kazemi algorithm)
export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  let gy: number;
  if (jy > 979) {
    gy = 1600;
    jy -= 979;
  } else {
    gy = 621;
  }
  let days = (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 12 && days >= sal_a[gm]) {
    days -= sal_a[gm];
    gm++;
  }
  const gd = days + 1;
  return new Date(Date.UTC(gy, gm - 1, gd, 12, 0, 0));
}

// Parse Persian or standard date string into Gregorian Date
export function parseDateSafe(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  // Clean all hidden unicode bidi marks and non-printable characters
  const clean = toEnglishDigits(String(dateStr).replace(/[\u200e\u200f\u202a-\u202e\u061c\u200b\u200c]/g, '').trim());
  
  // Try ISO / standard timestamp first
  if (clean.includes('T') || (clean.includes('-') && clean.length >= 10 && !clean.includes('/'))) {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) return d;
  }

  // Check for Shamsi YYYY/MM/DD or YYYY-MM-DD
  const parts = clean.split(/[/\\-]/).map((p) => parseInt(p, 10));
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    const [year, month, day] = parts;
    if (year > 1300 && year < 1500) {
      // Jalali year
      return jalaliToGregorian(year, month, day);
    } else if (year >= 1900) {
      return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    }
  }

  const fallback = new Date(clean);
  return isNaN(fallback.getTime()) ? null : fallback;
}

// Calculate remaining days from current time to due date accurately
export function getDaysRemaining(dueDateStr?: string | null, dueDateIso?: string | null): number {
  if (!dueDateStr && !dueDateIso) return 0;
  
  let dueDate: Date | null = null;
  if (dueDateIso) {
    const parsedIso = new Date(dueDateIso);
    if (!isNaN(parsedIso.getTime())) {
      dueDate = parsedIso;
    }
  }
  
  if (!dueDate && dueDateStr) {
    dueDate = parseDateSafe(dueDateStr);
  }
  
  if (!dueDate) return 0;

  // Calendar date comparison (stripping time of day for exact integer day difference)
  const now = new Date();
  const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const utcDue = Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const diffTime = utcDue - utcNow;
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return isNaN(days) ? 0 : days;
}

/**
 * Extract Iranian Date and Time info (Asia/Tehran timezone & Persian Calendar)
 */
export function getTehranDateInfo(date = new Date()): {
  year: number;
  month: number;
  day: number;
  weekdayName: string; // 'شنبه' | 'یکشنبه' | ...
  dayIndex: number; // 0 for شنبه, 1 for یکشنبه, ... 6 for جمعه
  hour: number;
  minute: number;
  totalMinutes: number;
} {
  try {
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      timeZone: 'Asia/Tehran',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    let year = 1404;
    let month = 1;
    let day = 1;
    let hour = 12;
    let minute = 0;
    let weekdayEn = 'Saturday';

    for (const part of parts) {
      if (part.type === 'year') year = parseInt(part.value, 10);
      if (part.type === 'month') month = parseInt(part.value, 10);
      if (part.type === 'day') day = parseInt(part.value, 10);
      if (part.type === 'hour') hour = parseInt(part.value, 10);
      if (part.type === 'minute') minute = parseInt(part.value, 10);
      if (part.type === 'weekday') weekdayEn = part.value;
    }

    const weekdayMap: Record<string, { name: string; index: number }> = {
      Saturday: { name: 'شنبه', index: 0 },
      Sunday: { name: 'یکشنبه', index: 1 },
      Monday: { name: 'دوشنبه', index: 2 },
      Tuesday: { name: 'سه‌شنبه', index: 3 },
      Wednesday: { name: 'چهارشنبه', index: 4 },
      Thursday: { name: 'پنجشنبه', index: 5 },
      Friday: { name: 'جمعه', index: 6 },
    };

    const wd = weekdayMap[weekdayEn] || { name: 'شنبه', index: 0 };
    return {
      year,
      month,
      day,
      weekdayName: wd.name,
      dayIndex: wd.index,
      hour,
      minute,
      totalMinutes: hour * 60 + minute,
    };
  } catch (err) {
    // Fallback if Intl fails
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const tehranTime = new Date(utc + 3600000 * 3.5);
    const dayOfWeek = tehranTime.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday
    const weekdayMap: Record<number, { name: string; index: number }> = {
      6: { name: 'شنبه', index: 0 },
      0: { name: 'یکشنبه', index: 1 },
      1: { name: 'دوشنبه', index: 2 },
      2: { name: 'سه‌شنبه', index: 3 },
      3: { name: 'چهارشنبه', index: 4 },
      4: { name: 'پنجشنبه', index: 5 },
      5: { name: 'جمعه', index: 6 },
    };
    const wd = weekdayMap[dayOfWeek] || { name: 'شنبه', index: 0 };
    const hour = tehranTime.getHours();
    const minute = tehranTime.getMinutes();
    return {
      year: 1404,
      month: 7,
      day: 2,
      weekdayName: wd.name,
      dayIndex: wd.index,
      hour,
      minute,
      totalMinutes: hour * 60 + minute,
    };
  }
}

/**
 * Official Iranian Calendar Holidays (Solar & Lunar official state holidays)
 */
export const IRAN_HOLIDAYS_BY_YEAR: Record<number, Record<string, string>> = {
  // 1403
  1403: {
    '1-1': 'عید نوروز', '1-2': 'عید نوروز', '1-3': 'عید نوروز', '1-4': 'عید نوروز',
    '1-12': 'روز جمهوری اسلامی', '1-13': 'روز طبیعت / شهادت حضرت علی(ع)',
    '1-22': 'عید سعید فطر', '1-23': 'تعطیلات عید سعید فطر',
    '2-15': 'شهادت امام جعفر صادق(ع)',
    '3-14': 'رحلت امام خمینی(ره)', '3-15': 'قیام ۱۵ خرداد',
    '3-28': 'عید سعید قربان', '4-5': 'عید سعید غدیر خم',
    '4-25': 'تاسوعای حسینی', '4-26': 'عاشورای حسینی',
    '6-4': 'اربعین حسینی', '6-12': 'رحلت رسول اکرم(ص) و شهادت امام حسن(ع)',
    '6-14': 'شهادت امام رضا(ع)', '6-22': 'شهادت امام حسن عسکری(ع)',
    '6-31': 'میلاد پیامبر اکرم(ص) و امام صادق(ع)',
    '9-15': 'شهادت حضرت فاطمه زهرا(س)',
    '10-25': 'ولادت امام علی(ع) و روز پدر',
    '11-9': 'مبعث پیامبر اکرم(ص)', '11-22': 'پیروزی انقلاب اسلامی',
    '11-26': 'ولادت حضرت قائم(عج) و نیمه شعبان',
    '12-29': 'روز ملی شدن صنعت نفت', '12-30': 'آخرین روز سال'
  },
  // 1404
  1404: {
    '1-1': 'عید نوروز', '1-2': 'عید نوروز', '1-3': 'عید نوروز', '1-4': 'عید نوروز',
    '1-11': 'عید سعید فطر', '1-12': 'روز جمهوری اسلامی / تعطیلی عید فطر', '1-13': 'روز طبیعت',
    '2-4': 'شهادت امام جعفر صادق(ع)',
    '3-14': 'رحلت امام خمینی(ره)', '3-15': 'قیام ۱۵ خرداد',
    '3-17': 'عید سعید قربان', '3-25': 'عید سعید غدیر خم',
    '4-14': 'تاسوعای حسینی', '4-15': 'عاشورای حسینی',
    '5-24': 'اربعین حسینی', '6-1': 'رحلت رسول اکرم(ص) و شهادت امام حسن(ع)',
    '6-3': 'شهادت امام رضا(ع)', '6-11': 'شهادت امام حسن عسکری(ع)',
    '6-20': 'میلاد پیامبر اکرم(ص) و امام جعفر صادق(ع)',
    '9-4': 'شهادت حضرت زهرا(س)', '10-14': 'ولادت امام علی(ع) و روز پدر',
    '10-28': 'مبعث حضرت رسول اکرم(ص)', '11-16': 'ولادت حضرت قائم(عج) و نیمه شعبان',
    '11-22': 'پیروزی انقلاب اسلامی', '12-20': 'شهادت حضرت علی(ع)',
    '12-29': 'روز ملی شدن صنعت نفت'
  },
  // 1405
  1405: {
    '1-1': 'عید نوروز / عید سعید فطر', '1-2': 'عید نوروز', '1-3': 'عید نوروز', '1-4': 'عید نوروز',
    '1-12': 'روز جمهوری اسلامی', '1-13': 'روز طبیعت',
    '1-24': 'شهادت امام جعفر صادق(ع)',
    '3-6': 'عید سعید قربان', '3-14': 'رحلت امام خمینی(ره) / عید سعید غدیر خم', '3-15': 'قیام ۱۵ خرداد',
    '4-3': 'تاسوعای حسینی', '4-4': 'عاشورای حسینی',
    '5-13': 'اربعین حسینی', '5-21': 'رحلت رسول اکرم(ص) و شهادت امام حسن(ع)',
    '5-23': 'شهادت امام رضا(ع)', '5-31': 'شهادت امام حسن عسکری(ع)',
    '6-9': 'میلاد پیامبر اکرم(ص) و امام جعفر صادق(ع)',
    '8-23': 'شهادت حضرت زهرا(س)', '10-3': 'ولادت امام علی(ع) و روز پدر',
    '10-17': 'مبعث رسول اکرم(ص)', '11-5': 'ولادت حضرت قائم(عج) و نیمه شعبان',
    '11-22': 'پیروزی انقلاب اسلامی', '12-10': 'شهادت حضرت علی(ع)',
    '12-20': 'عید سعید فطر', '12-21': 'تعطیلی عید فطر',
    '12-29': 'روز ملی شدن صنعت نفت'
  },
  // 1406
  1406: {
    '1-1': 'عید نوروز', '1-2': 'عید نوروز', '1-3': 'عید نوروز', '1-4': 'عید نوروز',
    '1-12': 'روز جمهوری اسلامی', '1-13': 'روز طبیعت',
    '1-14': 'شهادت امام جعفر صادق(ع)',
    '2-26': 'عید سعید قربان', '3-4': 'عید سعید غدیر خم',
    '3-14': 'رحلت امام خمینی(ره)', '3-15': 'قیام ۱۵ خرداد',
    '3-23': 'تاسوعای حسینی', '3-24': 'عاشورای حسینی',
    '5-2': 'اربعین حسینی', '5-10': 'رحلت رسول اکرم(ص) و شهادت امام حسن(ع)',
    '5-12': 'شهادت امام رضا(ع)', '5-20': 'شهادت امام حسن عسکری(ع)',
    '5-29': 'میلاد رسول اکرم(ص) و امام صادق(ع)',
    '8-12': 'شهادت حضرت فاطمه زهرا(س)', '9-22': 'ولادت امام علی(ع)',
    '10-7': 'مبعث رسول اکرم(ص)', '10-25': 'نیمه شعبان',
    '11-22': 'پیروزی انقلاب اسلامی', '11-28': 'شهادت امام علی(ع)',
    '12-9': 'عید سعید فطر', '12-10': 'تعطیلی عید سعید فطر',
    '12-29': 'روز ملی شدن صنعت نفت'
  },
  // 1407
  1407: {
    '1-1': 'عید نوروز', '1-2': 'عید نوروز', '1-3': 'عید نوروز', '1-4': 'عید نوروز',
    '1-12': 'روز جمهوری اسلامی', '1-13': 'روز طبیعت',
    '2-15': 'عید سعید قربان', '2-23': 'عید سعید غدیر خم',
    '3-12': 'تاسوعای حسینی', '3-13': 'عاشورای حسینی',
    '3-14': 'رحلت امام خمینی(ره)', '3-15': 'قیام ۱۵ خرداد',
    '4-22': 'اربعین حسینی', '4-30': 'رحلت رسول اکرم(ص) و شهادت امام حسن(ع)',
    '5-1': 'شهادت امام رضا(ع)', '5-10': 'شهادت امام حسن عسکری(ع)',
    '5-19': 'میلاد پیامبر اکرم(ص) و امام صادق(ع)',
    '7-30': 'شهادت حضرت زهرا(س)', '9-11': 'ولادت امام علی(ع)',
    '9-25': 'مبعث رسول اکرم(ص)', '10-14': 'نیمه شعبان',
    '11-17': 'شهادت امام علی(ع)', '11-22': 'پیروزی انقلاب اسلامی',
    '11-27': 'عید سعید فطر', '11-28': 'تعطیلی عید سعید فطر',
    '12-29': 'روز ملی شدن صنعت نفت'
  }
};

// Check if a given Shamsi date is an official national holiday in Iran
export function checkOfficialHoliday(year: number, month: number, day: number): string | null {
  const key = `${month}-${day}`;
  
  // Year-specific holidays
  if (IRAN_HOLIDAYS_BY_YEAR[year] && IRAN_HOLIDAYS_BY_YEAR[year][key]) {
    return IRAN_HOLIDAYS_BY_YEAR[year][key];
  }

  // Universal Solar fixed holidays for any year
  const solarHolidays: Record<string, string> = {
    '1-1': 'عید نوروز (آغاز سال نو)',
    '1-2': 'عید نوروز',
    '1-3': 'عید نوروز',
    '1-4': 'عید نوروز',
    '1-12': 'روز جمهوری اسلامی ایران',
    '1-13': 'روز طبیعت (سیزده‌بدر)',
    '3-14': 'رحلت امام خمینی (ره)',
    '3-15': 'قیام خونین ۱۵ خرداد',
    '11-22': 'پیروزی انقلاب اسلامی ایران',
    '12-29': 'روز ملی شدن صنعت نفت',
  };

  return solarHolidays[key] || null;
}

export interface LibraryStatusResult {
  isOpen: boolean;
  statusText: string;
  detailText: string;
  todayScheduleText: string;
  isHoliday: boolean;
  holidayName?: string;
  currentDayName: string;
  openTime: string;
  closeTime: string;
}

/**
 * Intelligent Library Operating Status
 * - Synchronized with Iranian Official Time (Asia/Tehran)
 * - Synchronized with Shamsi (Jalali) calendar
 * - Automatically checks Iranian official holidays
 * - Evaluates weekly schedule configured by admin (Saturday to Friday)
 */
export function isLibraryOpenNow(
  operatingHours?: OperatingHours,
  customDate = new Date()
): LibraryStatusResult {
  const tehran = getTehranDateInfo(customDate);
  const holidayName = checkOfficialHoliday(tehran.year, tehran.month, tehran.day);

  // 1. Check official national holiday
  if (holidayName) {
    return {
      isOpen: false,
      statusText: 'تعطیل رسمی',
      detailText: `امروز کتابخانه به مناسبت «${holidayName}» تعطیل رسمی می‌باشد`,
      todayScheduleText: `تعطیل رسمی (${holidayName})`,
      isHoliday: true,
      holidayName,
      currentDayName: tehran.weekdayName,
      openTime: '13:00',
      closeTime: '20:00',
    };
  }

  // 2. Find schedule for today's weekday
  // Day names: شنبه, یکشنبه, دوشنبه, سه‌شنبه, چهارشنبه, پنجشنبه, جمعه
  const weekly = operatingHours?.weekly_schedule;
  let todaySchedule: DayOperatingSchedule | undefined;

  if (Array.isArray(weekly) && weekly.length > 0) {
    todaySchedule = weekly.find(
      (s) => s.day === tehran.weekdayName || (s as any).day_index === tehran.dayIndex
    );
  }

  // Default fallback if schedule not configured
  // Saturday to Thursday: 13:00 to 20:00, Friday: closed
  const isDefaultFriday = tehran.dayIndex === 6 || tehran.weekdayName === 'جمعه';
  const isOpenToday = todaySchedule ? todaySchedule.is_open : !isDefaultFriday;
  const openTime = todaySchedule?.open_time || '13:00';
  const closeTime = todaySchedule?.close_time || '20:00';

  const formatScheduleText = isOpenToday
    ? `${toPersianDigits(openTime)} الی ${toPersianDigits(closeTime)}`
    : 'تعطیل';

  // 3. If today is marked closed in schedule (e.g. جمعه or custom closed day)
  if (!isOpenToday) {
    return {
      isOpen: false,
      statusText: 'تعطیل',
      detailText: `امروز (${tehran.weekdayName}) کتابخانه تعطیل است`,
      todayScheduleText: `امروز: تعطیل (${tehran.weekdayName})`,
      isHoliday: false,
      currentDayName: tehran.weekdayName,
      openTime,
      closeTime,
    };
  }

  // 4. Compare current minutes against open_time and close_time
  const parseMinutes = (timeStr: string, fallback: number) => {
    if (!timeStr) return fallback;
    const parts = timeStr.split(':').map((p) => parseInt(toEnglishDigits(p), 10));
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    return fallback;
  };

  const openMinutes = parseMinutes(openTime, 13 * 60);
  const closeMinutes = parseMinutes(closeTime, 20 * 60);
  const currentMinutes = tehran.totalMinutes;

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    const remainingMinutes = closeMinutes - currentMinutes;
    const remHour = Math.floor(remainingMinutes / 60);
    const remMin = remainingMinutes % 60;
    const remText = remHour > 0 ? `${remHour} ساعت و ${remMin} دقیقه` : `${remMin} دقیقه`;

    return {
      isOpen: true,
      statusText: 'باز است',
      detailText: `تا ساعت ${toPersianDigits(closeTime)} باز است (${toPersianDigits(remText)} تا پایان وقت)`,
      todayScheduleText: `امروز (${tehran.weekdayName}): ${toPersianDigits(openTime)} الی ${toPersianDigits(closeTime)}`,
      isHoliday: false,
      currentDayName: tehran.weekdayName,
      openTime,
      closeTime,
    };
  }

  if (currentMinutes < openMinutes) {
    const untilOpen = openMinutes - currentMinutes;
    const h = Math.floor(untilOpen / 60);
    const m = untilOpen % 60;
    const untilText = h > 0 ? `${h} ساعت و ${m} دقیقه` : `${m} دقیقه`;

    return {
      isOpen: false,
      statusText: 'بسته است',
      detailText: `ساعت کار امروز: ${toPersianDigits(openTime)} تا ${toPersianDigits(closeTime)} (${toPersianDigits(untilText)} تا بازگشایی)`,
      todayScheduleText: `امروز (${tehran.weekdayName}): ${toPersianDigits(openTime)} الی ${toPersianDigits(closeTime)}`,
      isHoliday: false,
      currentDayName: tehran.weekdayName,
      openTime,
      closeTime,
    };
  }

  // After closing time
  return {
    isOpen: false,
    statusText: 'بسته است',
    detailText: `ساعت کاری امروز (${toPersianDigits(openTime)} الی ${toPersianDigits(closeTime)}) به پایان رسیده است`,
    todayScheduleText: `امروز (${tehran.weekdayName}): ${toPersianDigits(openTime)} الی ${toPersianDigits(closeTime)}`,
    isHoliday: false,
    currentDayName: tehran.weekdayName,
    openTime,
    closeTime,
  };
}
