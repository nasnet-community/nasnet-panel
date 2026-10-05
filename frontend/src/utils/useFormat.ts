import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../state/LanguageContext';

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB'] as const;

// Locale-aware formatters for display text. Machine values (IPs, MACs, ports, keys,
// versions) are not prose: render them as-is, never through these.
export function useFormat() {
  const { intlLocale } = useLanguage();
  const { t } = useTranslation('common');

  return useMemo(() => {
    const number = (value: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(intlLocale, options).format(value);

    return {
      number,
      percent: (fraction: number, maximumFractionDigits = 0) =>
        number(fraction, { style: 'percent', maximumFractionDigits }),
      date: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) =>
        new Date(value).toLocaleDateString(intlLocale, options),
      time: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) =>
        new Date(value).toLocaleTimeString(intlLocale, options),
      dateTime: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) =>
        new Date(value).toLocaleString(intlLocale, options),
      bytes: (bytes: number) => {
        let unit = 0;
        let value = bytes;
        while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
          value /= 1024;
          unit += 1;
        }
        const digits = unit === 0 ? 0 : 2;
        return t(`units.${BYTE_UNITS[unit]}`, {
          value: number(value, { minimumFractionDigits: digits, maximumFractionDigits: digits }),
        });
      },
    };
  }, [intlLocale, t]);
}
