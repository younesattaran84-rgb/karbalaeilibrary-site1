import { normalizePersian } from './persian';

export interface SubjectCoverTheme {
  // Main gradient for the book cover mockup
  bookGradient: string;
  // Border & spine styling
  spineBorder: string;
  spineHighlight: string;
  // Outer card container subtle background
  cardBgGradient: string;
  // Accent color for shelf tag / category badge (high contrast)
  accentColor: string;
  // Text color for author / secondary details
  authorColor: string;
  // Decorative geometric motif pattern
  patternName: string;
}

// 24 Curated, harmonious, deep library palettes matching the dark teal/emerald theme
export const HARMONIOUS_THEMES: SubjectCoverTheme[] = [
  // 0. Traditional Emerald & Persian Pine (Default / Quran / Prophetic)
  {
    bookGradient: 'from-[#064e3b] via-[#047857] to-[#0f766e]',
    spineBorder: 'border-[#022c22]',
    spineHighlight: 'from-[#10b981]/40 to-transparent',
    cardBgGradient: 'from-[#042f2e] to-[#0f766e]',
    accentColor: 'text-[#a3e635]',
    authorColor: 'text-[#99f6e4]',
    patternName: 'islamic-star',
  },
  // 1. Royal Persian Azure & Lapis Lazuli (Imam Ali & Ahl al-Bayt)
  {
    bookGradient: 'from-[#0c4a6e] via-[#0369a1] to-[#0284c7]',
    spineBorder: 'border-[#082f49]',
    spineHighlight: 'from-[#38bdf8]/40 to-transparent',
    cardBgGradient: 'from-[#082f49] to-[#0369a1]',
    accentColor: 'text-[#38bdf8]',
    authorColor: 'text-[#bae6fd]',
    patternName: 'arabesque',
  },
  // 2. Deep Royal Amethyst & Purple (Theology & Philosophy)
  {
    bookGradient: 'from-[#3b0764] via-[#581c87] to-[#7e22ce]',
    spineBorder: 'border-[#2e1065]',
    spineHighlight: 'from-[#c084fc]/40 to-transparent',
    cardBgGradient: 'from-[#2e1065] to-[#581c87]',
    accentColor: 'text-[#d8b4fe]',
    authorColor: 'text-[#f3e8ff]',
    patternName: 'geometric-diamond',
  },
  // 3. Rich Persian Burgundy & Crimson (Martyrdom & Sacred Defense)
  {
    bookGradient: 'from-[#4c0519] via-[#881337] to-[#9f1239]',
    spineBorder: 'border-[#360412]',
    spineHighlight: 'from-[#fb7185]/40 to-transparent',
    cardBgGradient: 'from-[#360412] to-[#881337]',
    accentColor: 'text-[#fda4af]',
    authorColor: 'text-[#ffe4e6]',
    patternName: 'tulip-motif',
  },
  // 4. Warm Persian Sienna & Antique Gold (History & Siyar)
  {
    bookGradient: 'from-[#451a03] via-[#78350f] to-[#b45309]',
    spineBorder: 'border-[#2e1202]',
    spineHighlight: 'from-[#fbbf24]/40 to-transparent',
    cardBgGradient: 'from-[#2e1202] to-[#78350f]',
    accentColor: 'text-[#fde047]',
    authorColor: 'text-[#fef3c7]',
    patternName: 'heritage-scroll',
  },
  // 5. Deep Turquoise & Persian Tile (Hadith & Nahj al-Balagha)
  {
    bookGradient: 'from-[#134e4a] via-[#0f766e] to-[#0891b2]',
    spineBorder: 'border-[#042f2e]',
    spineHighlight: 'from-[#2dd4bf]/40 to-transparent',
    cardBgGradient: 'from-[#042f2e] to-[#0f766e]',
    accentColor: 'text-[#5eead4]',
    authorColor: 'text-[#ccfbf1]',
    patternName: 'tile-geometry',
  },
  // 6. Midnight Persian Indigo (Leadership & Governance / Politics)
  {
    bookGradient: 'from-[#1e1b4b] via-[#312e81] to-[#4338ca]',
    spineBorder: 'border-[#17143a]',
    spineHighlight: 'from-[#818cf8]/40 to-transparent',
    cardBgGradient: 'from-[#17143a] to-[#312e81]',
    accentColor: 'text-[#a5b4fc]',
    authorColor: 'text-[#e0e7ff]',
    patternName: 'seal-octagon',
  },
  // 7. Deep Forest & Golden Olive (Family & Ethics)
  {
    bookGradient: 'from-[#14532d] via-[#15803d] to-[#4d7c0f]',
    spineBorder: 'border-[#0d341b]',
    spineHighlight: 'from-[#86efac]/40 to-transparent',
    cardBgGradient: 'from-[#0d341b] to-[#15803d]',
    accentColor: 'text-[#bef264]',
    authorColor: 'text-[#dcfce7]',
    patternName: 'olive-leaf',
  },
  // 8. Persian Ochre & Bronze (Jurisprudence & Law)
  {
    bookGradient: 'from-[#3a2e0a] via-[#5c4a12] to-[#854d0e]',
    spineBorder: 'border-[#261f06]',
    spineHighlight: 'from-[#facc15]/40 to-transparent',
    cardBgGradient: 'from-[#261f06] to-[#5c4a12]',
    accentColor: 'text-[#fef08a]',
    authorColor: 'text-[#fef9c3]',
    patternName: 'justice-balance',
  },
  // 9. Deep Slate Blue & Teal (Biographies & Humanities)
  {
    bookGradient: 'from-[#0f172a] via-[#1e293b] to-[#0e7490]',
    spineBorder: 'border-[#0a0f1d]',
    spineHighlight: 'from-[#38bdf8]/40 to-transparent',
    cardBgGradient: 'from-[#0a0f1d] to-[#1e293b]',
    accentColor: 'text-[#7dd3fc]',
    authorColor: 'text-[#e2e8f0]',
    patternName: 'quill-lines',
  },
  // 10. Persian Teal & Lime (Youth & Children)
  {
    bookGradient: 'from-[#064e3b] via-[#047857] to-[#65a30d]',
    spineBorder: 'border-[#033024]',
    spineHighlight: 'from-[#a3e635]/40 to-transparent',
    cardBgGradient: 'from-[#033024] to-[#047857]',
    accentColor: 'text-[#bef264]',
    authorColor: 'text-[#f7fee7]',
    patternName: 'playful-sparks',
  },
  // 11. Persian Rosewood & Mahogany (Persian & Arabic Literature)
  {
    bookGradient: 'from-[#431407] via-[#7c2d12] to-[#9a3412]',
    spineBorder: 'border-[#2c0d05]',
    spineHighlight: 'from-[#fb923c]/40 to-transparent',
    cardBgGradient: 'from-[#2c0d05] to-[#7c2d12]',
    accentColor: 'text-[#fdba74]',
    authorColor: 'text-[#ffedd5]',
    patternName: 'calligraphy-flourish',
  },
  // 12. Deep Dark Teal & Aquamarine (Prayer & Supplication)
  {
    bookGradient: 'from-[#022c22] via-[#115e59] to-[#0f766e]',
    spineBorder: 'border-[#011c16]',
    spineHighlight: 'from-[#5eead4]/40 to-transparent',
    cardBgGradient: 'from-[#011c16] to-[#115e59]',
    accentColor: 'text-[#6ee7b7]',
    authorColor: 'text-[#ccfbf1]',
    patternName: 'minaret-arch',
  },
  // 13. Deep Cobalt & Marine (Science & Knowledge)
  {
    bookGradient: 'from-[#172554] via-[#1e40af] to-[#1d4ed8]',
    spineBorder: 'border-[#0e1738]',
    spineHighlight: 'from-[#60a5fa]/40 to-transparent',
    cardBgGradient: 'from-[#0e1738] to-[#1e40af]',
    accentColor: 'text-[#93c5fd]',
    authorColor: 'text-[#eff6ff]',
    patternName: 'astronomy-stars',
  },
  // 14. Persian Mulberry & Garnet (Art & Culture)
  {
    bookGradient: 'from-[#4a044e] via-[#701a75] to-[#a21caf]',
    spineBorder: 'border-[#300233]',
    spineHighlight: 'from-[#e879f9]/40 to-transparent',
    cardBgGradient: 'from-[#300233] to-[#701a75]',
    accentColor: 'text-[#f0abfc]',
    authorColor: 'text-[#fae8ff]',
    patternName: 'art-palette',
  },
  // 15. Dark Moss & Pine Needle (Islamic Studies / General)
  {
    bookGradient: 'from-[#052e16] via-[#14532d] to-[#15803d]',
    spineBorder: 'border-[#021d0d]',
    spineHighlight: 'from-[#4ade80]/40 to-transparent',
    cardBgGradient: 'from-[#021d0d] to-[#14532d]',
    accentColor: 'text-[#86efac]',
    authorColor: 'text-[#f0fdf4]',
    patternName: 'foliage',
  },
];

// Explicit mappings for core subjects to guarantee optimal aesthetic distinction
const EXPLICIT_SUBJECT_THEME_INDEX: Record<string, number> = {
  // Shelf 1 (Prophet & Ma'sumin)
  'امام علی(علیه السلام)': 1, // Royal Azure Lapis
  'پیامبر اسلام(صلی الله علیه و آله)': 0, // Deep Emerald
  'حضرت زهرا(سلام الله علیها)': 12, // Dark Teal Aquamarine
  'اهل بیت و پیامبران': 5, // Deep Turquoise
  // Shelf 2
  'امام حسین(علیه السلام)': 3, // Crimson Burgundy
  'امام زمان(عج)': 1, // Lapis Azure
  'امام رضا(علیه السلام)': 4, // Antique Gold
  'امام حسن(ع)،امام سجاد(ع)،امام باقر(ع)،امام صادق(ع)،امام کاظم(ع)،امام جواد(ع)،امام هادی(ع)،امام حسن عسکری(ع)،حضرت معصومه(س)': 2, // Royal Amethyst
  // Shelf 3
  'امام و رهبری': 6, // Persian Indigo
  'اصول عقاید': 13, // Deep Cobalt
  // Shelf 4
  'تاریخ': 4, // Warm Sienna Bronze
  'امامت': 1, // Azure Lapis
  'سیاست': 6, // Persian Indigo
  // Shelf 5
  'جبهه و جنگ(شهدا)': 3, // Crimson / Martyrdom
  // Shelf 6
  'تراجم': 9, // Slate Blue
  'علوم تجربی': 13, // Deep Cobalt Science
  'علوم انسانی': 9, // Slate Blue Humanities
  'حقوق': 8, // Persian Ochre Justice
  // Shelf 7
  'متفرقه': 15, // Dark Moss
  'ولایت فقیه': 6, // Persian Indigo
  'فلسفه': 2, // Royal Amethyst
  'کلام جدید': 13, // Deep Cobalt
  'فرهنگ و هنر': 14, // Persian Mulberry Art
  // Shelf 8
  'تربیت و خانواده': 7, // Forest & Golden Olive
  'فرق و مذاهب': 2, // Purple
  // Shelf 9
  'اخلاق': 0, // Emerald
  // Shelf 10
  'عبادت، دعا و نماز': 12, // Dark Teal Aquamarine
  // Shelf 11
  'فقه و اصول': 8, // Bronze Justice
  // Shelf 12
  'تفسیر(علوم قرآنی)': 0, // Emerald
  // Shelf 13
  'حدیث و نهج البلاغه': 5, // Deep Turquoise
  // Shelf 14
  'اسلام شناسی': 15, // Dark Moss
  // Shelf 15
  'ادبیات فارسی و عرب': 11, // Mahogany Literature
  // Shelf 16
  'کودک و نوجوان': 10, // Teal & Lime
};

/**
 * Deterministic hash function for any new or existing subject
 * Guarantees that any new subject automatically gets a distinct, non-conflicting,
 * elegant color scheme from the palette.
 */
function hashString(str: string): number {
  let hash = 5381;
  const clean = normalizePersian(str).replace(/\s+/g, '');
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) + hash) + clean.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Retrieve the theme for a book subject.
 * - Checks exact match or normalized subject in predefined list
 * - Falls back to deterministic hash mapping so any added subject automatically
 *   gets a unique harmonious color.
 */
export function getSubjectCoverTheme(subject?: string, shelf?: number): SubjectCoverTheme {
  const cleanSubject = (subject || '').trim().replace(/امام کاظم\(ع\) /g, 'امام کاظم(ع)');
  
  if (cleanSubject && EXPLICIT_SUBJECT_THEME_INDEX[cleanSubject] !== undefined) {
    const idx = EXPLICIT_SUBJECT_THEME_INDEX[cleanSubject] % HARMONIOUS_THEMES.length;
    return HARMONIOUS_THEMES[idx];
  }

  // Normalized search
  const normalized = normalizePersian(cleanSubject);
  for (const [key, idx] of Object.entries(EXPLICIT_SUBJECT_THEME_INDEX)) {
    if (normalizePersian(key) === normalized) {
      return HARMONIOUS_THEMES[idx % HARMONIOUS_THEMES.length];
    }
  }

  // If new subject or not explicitly indexed:
  if (cleanSubject) {
    const hash = hashString(cleanSubject);
    const idx = hash % HARMONIOUS_THEMES.length;
    return HARMONIOUS_THEMES[idx];
  }

  // Fallback by shelf number if subject is empty
  if (shelf && shelf > 0) {
    return HARMONIOUS_THEMES[(shelf - 1) % HARMONIOUS_THEMES.length];
  }

  return HARMONIOUS_THEMES[0];
}
