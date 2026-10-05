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

i18n
  .use(LanguageDetector)
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
    interpolation: { escapeValue: false },
    returnNull: false,
    react: { useSuspense: false },
  });

applyDocumentLanguage(i18n.resolvedLanguage ?? DEFAULT_LANGUAGE);
i18n.on('languageChanged', (lng) => applyDocumentLanguage(i18n.resolvedLanguage ?? lng));

export default i18n;
