import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { en, fa, namespaces } from './resources';

export const LANGUAGE_STORAGE_KEY = 'nasnet-panel.language';
export const DIGITS_STORAGE_KEY = 'nasnet-panel.digits';

export type LanguageCode = 'en' | 'fa';
export type DigitStyle = 'latin' | 'persian';

export interface LanguageInfo {
  code: LanguageCode;
  // Shown in its own script so a user who can't read the current language can still find theirs.
  nativeName: string;
  dir: 'ltr' | 'rtl';
  // BCP 47 tag handed to Intl for dates and numbers.
  intlLocale: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', nativeName: 'English', dir: 'ltr', intlLocale: 'en-US' },
  { code: 'fa', nativeName: 'فارسی', dir: 'rtl', intlLocale: 'fa-IR' },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export const getLanguageInfo = (code: string | undefined): LanguageInfo =>
  LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];

const applyDocumentLanguage = (code: string) => {
  if (typeof document === 'undefined') return;
  const info = getLanguageInfo(code);
  document.documentElement.lang = info.code;
  document.documentElement.dir = info.dir;
};

export const DIGITS_CHANGED_EVENT = 'digitsChanged';

const readStoredDigitStyle = (): DigitStyle => {
  try {
    return window.localStorage.getItem(DIGITS_STORAGE_KEY) === 'persian' ? 'persian' : 'latin';
  } catch {
    return 'latin';
  }
};

let digitStyle: DigitStyle = readStoredDigitStyle();

export const getDigitStyle = (): DigitStyle => digitStyle;

export const setDigitStyle = (style: DigitStyle) => {
  digitStyle = style;
  // react-i18next is bound to this event, so every translated component re-renders.
  i18n.emit(DIGITS_CHANGED_EVENT, style);
};

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

// Applies the digit preference to numbers interpolated into catalog strings, such as
// {{count}} or {{min}}. Only number values are touched: IPs, ports and names are passed
// as strings and stay in Latin digits. Values already formatted by useFormat are strings too.
const digitFormatter = {
  type: 'formatter' as const,
  init: () => {},
  add: () => {},
  addCached: () => {},
  format: (value: unknown, _format: string | undefined, lng: string | undefined) => {
    if (typeof value !== 'number' || digitStyle !== 'persian' || !lng?.startsWith('fa')) {
      return value;
    }
    return String(value)
      .replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)])
      .replace('.', '٫');
  },
};

i18n
  .use(LanguageDetector)
  .use(digitFormatter)
  .use(initReactI18next)
  .init({
    resources: { en, fa },
    ns: namespaces,
    defaultNS: 'common',
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: LANGUAGES.map((l) => l.code),
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      // Only an explicit choice is stored, so the browser default keeps tracking the browser.
      caches: [],
    },
    interpolation: { escapeValue: false, alwaysFormat: true },
    returnNull: false,
    react: { useSuspense: false, bindI18n: `languageChanged ${DIGITS_CHANGED_EVENT}` },
  });

applyDocumentLanguage(i18n.resolvedLanguage ?? DEFAULT_LANGUAGE);
i18n.on('languageChanged', (lng) => applyDocumentLanguage(i18n.resolvedLanguage ?? lng));

export default i18n;
