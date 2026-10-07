import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../state/LanguageContext';

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB'] as const;
type SizeUnit = 'B' | 'KB' | 'MB' | 'GB' | 'TB';
const SIZE_LABEL = /^(\d+(?:\.\d+)?) ?(B|KB|MB|GB|TB)(\/s)?$/;

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
          value: number(value, {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
            // Match formatBytes exactly: no thousands separators.
            useGrouping: false,
          }),
        });
      },
      // Re-renders a size the backend already formatted, such as "256.00 MB" or "1.25 MB/s",
      // in the active language. English output is unchanged; anything else passes through.
      sizeLabel: (label: string | undefined) => {
        const match = label ? SIZE_LABEL.exec(label.trim()) : null;
        if (!label || !match) return label;
        const [, amount, unit, perSecond] = match;
        const decimals = amount.split('.')[1]?.length ?? 0;
        const value = number(Number(amount), {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
          useGrouping: false,
        });
        const sizeUnit = unit as SizeUnit;
        return perSecond ? t(`units.${sizeUnit}ps`, { value }) : t(`units.${sizeUnit}`, { value });
      },
    };
  }, [intlLocale, t]);
}
