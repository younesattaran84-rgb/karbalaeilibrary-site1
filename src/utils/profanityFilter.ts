/**
 * Comprehensive Profanity & Vulgarity Filter for Persian and English
 * Includes aggressive normalization to prevent bypasses:
 * - Removing Tatweel / Kashida (ـ)
 * - Removing diacritics / vowels / Erab (َ ِ ُ ً ٍ ٌ ّ ْ)
 * - Removing Zero-Width spaces / joiners (\u200c, \u200d, etc.)
 * - Unifying Persian/Arabic letters (ي -> ی, ك -> ک, etc.)
 * - Collapsing spaced-out single letters ("ف ح ش" -> "فحش", "f u c k" -> "fuck")
 * - Collapsing repeating letters ("فووووحش" -> "فحش", "fuuuuck" -> "fuck")
 * - Normalizing leetspeak and symbols between letters ("ف.ح.ش", "b!tch")
 */

export const EXACT_PROFANITY_ERROR = 'از کلمات رکیک و ناپسند استفاده نکنید.';

// Blacklist of root profane / vulgar words
const PERSIAN_PROFANITY_ROOTS = [
  // Namoosi & severe vulgar slurs
  'فحش', 'فحاشی',
  'کسکش', 'کوسکش', 'کصکش', 'کوس کش', 'کس کش', 'کص کش',
  'دیوث', 'بی ناموس', 'بیناموس', 'بیغیرت', 'بی غیرت',
  'مادرقحبه', 'مادر قحبه', 'مادرجنده', 'مادر جنده', 'مادرخراب', 'مادر خراب',
  'قحبه', 'جنده', 'سلیطه', 'فاحشه', 'پتیاره', 'لاشی', 'لاشخور', 'حرومزاده', 'حرامزاده',
  'حرومی', 'پفیوز', 'پدرسگ', 'پدر سگ', 'ننه سگ', 'تخم سگ', 'سگ پدر',
  // Sexual & body parts
  'کیر', 'کیرم', 'کیرت', 'کیرش', 'کیرخر', 'کیر خر', 'کیریا', 'کون', 'کونی', 'کوندونی', 'کونکش',
  'کونده', 'کونسوز', 'کص', 'کوس', 'خایه', 'خایمال', 'خایه مال', 'جلق', 'جلاقی',
  'سکس', 'سکسی', 'پورن', 'پورنو', 'لواط', 'همجنسباز', 'سوپر', 'پستون', 'پستان',
  'گایند', 'گایید', 'گاییده', 'بگایی', 'گاییدی', 'میگام', 'بگام', 'گایی',
  'گوه', 'عن', 'شاش', 'گوز', 'شاشید', 'رید', 'ریدم', 'بکن بکن', 'چاقوک'
];

const ENGLISH_PROFANITY_ROOTS = [
  'fuck', 'fucker', 'fucking', 'fucked', 'motherfucker',
  'bitch', 'bitches', 'bitching',
  'shit', 'shitty', 'bullshit',
  'cunt', 'cunts',
  'dick', 'dicks', 'dickhead',
  'pussy', 'pussies',
  'asshole', 'assholes', 'bastard', 'bastards',
  'slut', 'sluts', 'whore', 'whores',
  'porn', 'porno', 'pornography',
  'nude', 'nudes', 'blowjob', 'handjob', 'dildo', 'orgasm',
  'penis', 'vagina', 'boobs', 'anal', 'cock'
];

/**
 * Normalizes input string to defeat all common bypass techniques
 */
export function normalizeTextForFilter(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let text = input.toLowerCase();

  // 1. Remove Zero-Width and control characters
  text = text.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u00AD]/g, '');

  // 2. Remove Tatweel / Kashida (ـ)
  text = text.replace(/[\u0640]/g, '');

  // 3. Remove Arabic/Persian diacritics (Erab: َ ِ ُ ً ٍ ٌ ّ ْ)
  text = text.replace(/[\u064B-\u065F\u0670]/g, '');

  // 4. Normalize Arabic/Persian letter variants
  text = text
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[ة]/g, 'ه')
    .replace(/[ؤ]/g, 'و')
    .replace(/[إأآء]/g, 'ا')
    .replace(/[ئ]/g, 'ی');

  // 5. Replace common leetspeak in English
  text = text
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/!/g, 'i')
    .replace(/3/g, 'e')
    .replace(/\+/g, 't')
    .replace(/5/g, 's');

  return text;
}

/**
 * Removes punctuation and spaces to detect separated letters like "ف ح ش" or "f.u.c.k"
 */
export function collapseCharacters(normalizedText: string): string {
  // Replace punctuation, symbols, dashes, dots, underscores with nothing
  return normalizedText.replace(/[\s\.\-_,\+*=~`'"!@#\$%\^&\*\(\)\[\]\{\}\<\>\?\/\\|:;،؛ـ]/g, '');
}

/**
 * Collapses duplicate consecutive letters (e.g. "فووووحش" -> "فحش", "fuuuuck" -> "fuck")
 */
export function collapseRepeating(collapsed: string): string {
  return collapsed.replace(/(.)\1+/g, '$1');
}

/**
 * Checks if a string contains prohibited profanities or vulgarities
 */
export function containsProfanity(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  const normalized = normalizeTextForFilter(text);
  const collapsed = collapseCharacters(normalized);
  const deduplicated = collapseRepeating(collapsed);

  // Check word-by-word with Persian and English word boundaries
  const words = normalized.split(/[\s,\.\-_/\\]+/).filter(Boolean);

  // 1. Direct word check
  for (const word of words) {
    const cleanWord = collapseRepeating(word);
    for (const bad of PERSIAN_PROFANITY_ROOTS) {
      if (word === bad || cleanWord === bad || word.includes(bad)) {
        return true;
      }
    }
    for (const bad of ENGLISH_PROFANITY_ROOTS) {
      if (word === bad || cleanWord === bad) {
        return true;
      }
    }
  }

  // 2. Substring check in normalized full text
  for (const bad of PERSIAN_PROFANITY_ROOTS) {
    if (normalized.includes(bad)) {
      return true;
    }
  }
  for (const bad of ENGLISH_PROFANITY_ROOTS) {
    // English words should generally respect boundaries to avoid false positives (e.g. "classic")
    const regex = new RegExp(`\\b${bad}\\b`, 'i');
    if (regex.test(normalized)) {
      return true;
    }
  }

  // 3. Collapsed check (catches "ف ح ش", "ف_ح_ش", "ف.ح.ش", "f u c k")
  for (const bad of PERSIAN_PROFANITY_ROOTS) {
    const badCollapsed = collapseCharacters(bad);
    if (badCollapsed.length >= 3) {
      if (collapsed.includes(badCollapsed) || deduplicated.includes(collapseRepeating(badCollapsed))) {
        return true;
      }
    }
  }
  for (const bad of ENGLISH_PROFANITY_ROOTS) {
    const badCollapsed = collapseCharacters(bad);
    if (badCollapsed.length >= 4) {
      if (collapsed.includes(badCollapsed) || deduplicated.includes(collapseRepeating(badCollapsed))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validates text; returns isValid: false and standard error if profanity detected
 */
export function validateCleanContent(text: string): { isValid: boolean; error?: string } {
  if (containsProfanity(text)) {
    return {
      isValid: false,
      error: EXACT_PROFANITY_ERROR,
    };
  }
  return { isValid: true };
}
