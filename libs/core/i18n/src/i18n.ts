/**
 * i18next Configuration for NasNetConnect
 *
 * Key Decisions:
 * - English bundled (always available as fallback)
 * - Other languages lazy-loaded via HTTP backend
 * - RTL support for Persian (fa), Arabic (ar), Hebrew (he)
 * - Namespace strategy: common + validation + errors
 *
 * @see Docs/architecture/implementation-patterns/17-localization-patterns.md
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Supported languages - add more as translations are completed
export const supportedLanguages = ['en', 'fa'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

// Right-to-left languages
export const rtlLanguages: readonly SupportedLanguage[] = ['fa'];

// Language display names in native script
export const languageNames: Record<SupportedLanguage, string> = {
  en: 'English',
  fa: 'فارسی',
};

// Namespaces - organized by domain
export const defaultNamespaces = ['common', 'validation', 'errors'] as const;
export type TranslationNamespace = (typeof defaultNamespaces)[number];

/**
 * Check if a language is RTL
 */
export function isRTLLanguage(lang: string): boolean {
  return rtlLanguages.includes(lang as SupportedLanguage);
}

/**
 * Get the text direction for a language
 */
export function getLanguageDirection(lang: string): 'ltr' | 'rtl' {
  return isRTLLanguage(lang) ? 'rtl' : 'ltr';
}

// Configure i18next
i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Fallback language - English is always bundled
    fallbackLng: 'en',

    // Supported languages
    supportedLngs: supportedLanguages,

    // Namespaces
    ns: defaultNamespaces,
    defaultNS: 'common',

    // Language detection configuration
    detection: {
      // Detection order: localStorage first, then browser language
      order: ['localStorage', 'navigator'],
      // Cache in localStorage
      caches: ['localStorage'],
      // localStorage key
      lookupLocalStorage: 'nasnet-language',
    },

    // HTTP backend for lazy loading
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Interpolation settings
    interpolation: {
      // React already escapes values - disable double-escaping
      escapeValue: false,
    },

    // React-specific settings
    react: {
      // Use Suspense for lazy loading
      useSuspense: true,
    },

    // Development settings
    debug: import.meta.env?.DEV ?? false,

    // Missing key handling
    saveMissing: import.meta.env?.DEV ?? false,
    missingKeyHandler: (lngs, ns, key, fallbackValue) => {
      if (import.meta.env?.DEV) {
        console.warn(`[i18n] Missing translation: ${ns}:${key} (lang: ${lngs.join(', ')})`);
      }
    },
  });

export default i18n;
