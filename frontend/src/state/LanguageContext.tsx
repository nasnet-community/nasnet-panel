import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, {
  LANGUAGE_STORAGE_KEY,
  getLanguageInfo,
  type LanguageCode,
  type LanguageInfo,
} from '../i18n';

interface LanguageContextValue {
  language: LanguageInfo;
  setLanguage: (code: LanguageCode) => void;
  // Locale tag for Intl dates and numbers.
  intlLocale: string;
}

const Ctx = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Subscribing re-renders the provider, and so its value, on every language change.
  const { i18n: instance } = useTranslation();
  const language = getLanguageInfo(instance.resolvedLanguage);

  const setLanguage = useCallback((code: LanguageCode) => {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
    i18n.changeLanguage(code);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, intlLocale: language.intlLocale }),
    [language, setLanguage],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
};
