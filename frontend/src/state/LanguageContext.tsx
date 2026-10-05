import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, {
  DIGITS_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  getDigitStyle,
  getLanguageInfo,
  setDigitStyle,
  type DigitStyle,
  type LanguageCode,
  type LanguageInfo,
} from '../i18n';

interface LanguageContextValue {
  language: LanguageInfo;
  setLanguage: (code: LanguageCode) => void;
  digits: DigitStyle;
  setDigits: (style: DigitStyle) => void;
  // Locale tag for Intl, with the numbering system pinned to the digit preference.
  intlLocale: string;
}

const Ctx = createContext<LanguageContextValue | null>(null);

const store = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Subscribing re-renders the provider, and so its value, on every language change.
  const { i18n: instance } = useTranslation();
  const [digits, setDigitsState] = useState<DigitStyle>(() => getDigitStyle());
  const language = getLanguageInfo(instance.resolvedLanguage);

  const setLanguage = useCallback((code: LanguageCode) => {
    store(LANGUAGE_STORAGE_KEY, code);
    i18n.changeLanguage(code);
  }, []);

  const setDigits = useCallback((style: DigitStyle) => {
    setDigitsState(style);
    setDigitStyle(style);
    store(DIGITS_STORAGE_KEY, style);
  }, []);

  const numberingSystem = language.code === 'fa' && digits === 'persian' ? 'arabext' : 'latn';
  const intlLocale = `${language.intlLocale}-u-nu-${numberingSystem}`;

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, digits, setDigits, intlLocale }),
    [language, setLanguage, digits, setDigits, intlLocale],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
};
