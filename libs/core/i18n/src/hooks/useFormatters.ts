/**
 * Locale-aware formatting hooks
 *
 * Provides formatters for dates, numbers, durations, and data sizes
 * that respect the current locale settings.
 *
 * Note: Technical data (IP addresses, MAC addresses, ports) should NOT be formatted
 * with locale-specific settings - they must remain in universal format.
 */
import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

/**
 * Date formatting options
 */
export interface DateFormatOptions {
  style?: 'short' | 'medium' | 'long' | 'full';
  includeTime?: boolean;
}

/**
 * Number formatting options
 */
export interface NumberFormatOptions {
  style?: 'decimal' | 'percent';
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Relative time formatting options
 */
export interface RelativeTimeOptions {
  style?: 'long' | 'short' | 'narrow';
  numeric?: 'always' | 'auto';
}

/**
 * Hook that provides locale-aware formatters
 *
 * @example
 * ```tsx
 * function StatusDisplay({ lastSeen, bytesTransferred }) {
 *   const { formatDate, formatBytes, formatRelativeTime } = useFormatters();
 *
 *   return (
 *     <div>
 *       <p>Last seen: {formatRelativeTime(lastSeen)}</p>
 *       <p>Transferred: {formatBytes(bytesTransferred)}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFormatters() {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  return useMemo(() => {
    // Date formatter
    const formatDate = (
      date: Date | string | number,
      options: DateFormatOptions = {}
    ): string => {
      const { style = 'medium', includeTime = false } = options;
      const dateObj = date instanceof Date ? date : new Date(date);

      if (isNaN(dateObj.getTime())) {
        return '-';
      }

      const dateStyleMap: Record<string, Intl.DateTimeFormatOptions['dateStyle']> = {
        short: 'short',
        medium: 'medium',
        long: 'long',
        full: 'full',
      };

      const formatOptions: Intl.DateTimeFormatOptions = {
        dateStyle: dateStyleMap[style],
        ...(includeTime && { timeStyle: 'short' }),
      };

      return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
    };

    // Number formatter
    const formatNumber = (
      value: number,
      options: NumberFormatOptions = {}
    ): string => {
      const {
        style = 'decimal',
        minimumFractionDigits = 0,
        maximumFractionDigits = 2,
      } = options;

      return new Intl.NumberFormat(locale, {
        style,
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(value);
    };

    // Bytes formatter - for data sizes
    const formatBytes = (bytes: number, decimals = 2): string => {
      if (bytes === 0) return '0 B';
      if (!isFinite(bytes)) return '-';

      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      const clampedIndex = Math.min(i, sizes.length - 1);

      const value = bytes / Math.pow(k, clampedIndex);

      // Use locale-aware number formatting for the value
      // But keep the unit in English (B, KB, MB, etc.) as per technical terms rule
      return `${formatNumber(value, { maximumFractionDigits: decimals })} ${sizes[clampedIndex]}`;
    };

    // Duration formatter - for time intervals
    const formatDuration = (seconds: number): string => {
      if (!isFinite(seconds) || seconds < 0) return '-';

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);

      const parts: string[] = [];

      if (hours > 0) {
        parts.push(`${hours}h`);
      }
      if (minutes > 0 || hours > 0) {
        parts.push(`${minutes}m`);
      }
      parts.push(`${secs}s`);

      return parts.join(' ');
    };

    // Relative time formatter - "5 minutes ago", "in 2 hours"
    const formatRelativeTime = (
      date: Date | string | number,
      options: RelativeTimeOptions = {}
    ): string => {
      const { style = 'long', numeric = 'auto' } = options;
      const dateObj = date instanceof Date ? date : new Date(date);

      if (isNaN(dateObj.getTime())) {
        return '-';
      }

      const now = new Date();
      const diffMs = dateObj.getTime() - now.getTime();
      const diffSecs = Math.round(diffMs / 1000);
      const diffMins = Math.round(diffSecs / 60);
      const diffHours = Math.round(diffMins / 60);
      const diffDays = Math.round(diffHours / 24);

      const rtf = new Intl.RelativeTimeFormat(locale, { style, numeric });

      // Choose the most appropriate unit
      if (Math.abs(diffSecs) < 60) {
        return rtf.format(diffSecs, 'second');
      } else if (Math.abs(diffMins) < 60) {
        return rtf.format(diffMins, 'minute');
      } else if (Math.abs(diffHours) < 24) {
        return rtf.format(diffHours, 'hour');
      } else {
        return rtf.format(diffDays, 'day');
      }
    };

    // Bandwidth formatter - for network speeds (bits per second)
    const formatBandwidth = (bitsPerSecond: number): string => {
      if (bitsPerSecond === 0) return '0 bps';
      if (!isFinite(bitsPerSecond)) return '-';

      const k = 1000; // Network speeds use 1000, not 1024
      const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps'];
      const i = Math.floor(Math.log(bitsPerSecond) / Math.log(k));
      const clampedIndex = Math.min(i, sizes.length - 1);

      const value = bitsPerSecond / Math.pow(k, clampedIndex);

      return `${formatNumber(value, { maximumFractionDigits: 2 })} ${sizes[clampedIndex]}`;
    };

    return {
      formatDate,
      formatNumber,
      formatBytes,
      formatDuration,
      formatRelativeTime,
      formatBandwidth,
      locale,
    };
  }, [locale]);
}

export default useFormatters;
