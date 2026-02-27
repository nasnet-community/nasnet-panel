/**
 * Locale-aware formatting hooks
 *
 * Provides formatters for dates, numbers, durations, and data sizes
 * that respect the current locale settings.
 *
 * Note: Technical data (IP addresses, MAC addresses, ports) should NOT be formatted
 * with locale-specific settings - they must remain in universal format.
 *
 * @module hooks/useFormatters
 */
import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

/**
 * Configuration options for date formatting
 *
 * Controls how dates are displayed to users, with options for
 * verbosity level and time inclusion.
 */
export interface DateFormatOptions {
  /** Verbosity level: 'short' (M/D/YY), 'medium' (Jan 1, 2024), 'long' (January 1, 2024), 'full' (Monday, January 1, 2024) */
  style?: 'short' | 'medium' | 'long' | 'full';
  /** Whether to include time component alongside the date */
  includeTime?: boolean;
}

/**
 * Configuration options for number formatting
 *
 * Controls how numbers are displayed with locale-aware grouping
 * and decimal separators.
 */
export interface NumberFormatOptions {
  /** Format style: 'decimal' for regular numbers, 'percent' for percentages */
  style?: 'decimal' | 'percent';
  /** Minimum number of decimal places to show */
  minimumFractionDigits?: number;
  /** Maximum number of decimal places to show */
  maximumFractionDigits?: number;
}

/**
 * Configuration options for relative time formatting
 *
 * Controls how relative times are displayed (e.g., "5 minutes ago", "in 2 hours").
 */
export interface RelativeTimeOptions {
  /** Display style: 'long' (5 minutes ago), 'short' (5 min. ago), 'narrow' (5m) */
  style?: 'long' | 'short' | 'narrow';
  /** When to use numeric forms: 'always' (5 days ago), 'auto' (5 days ago vs. yesterday) */
  numeric?: 'always' | 'auto';
}

/**
 * Hook that provides locale-aware formatters for various data types
 *
 * Returns a set of formatting functions that respect the current locale settings
 * for dates, numbers, data sizes, durations, and network bandwidth. Memoized
 * to prevent unnecessary recreations when locale changes.
 *
 * @returns Object containing locale-aware formatting functions and the current locale
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
 *       <p>Updated: {formatDate(new Date(), { includeTime: true })}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFormatters() {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  return useMemo(() => {
    /**
     * Formats a date according to locale settings
     *
     * @param date - Date to format (Date object, timestamp, or ISO string)
     * @param options - Formatting options (style, includeTime)
     * @returns Formatted date string, or '-' if date is invalid
     *
     * @example
     * ```tsx
     * formatDate(new Date(2024, 0, 15), { style: 'long', includeTime: true })
     * // => "January 15, 2024, 2:30 PM" (or locale equivalent)
     * ```
     */
    const formatDate = (date: Date | string | number, options: DateFormatOptions = {}): string => {
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

    /**
     * Formats a number according to locale settings
     *
     * Applies locale-specific grouping and decimal separators.
     *
     * @param value - Number to format
     * @param options - Formatting options (style, minimumFractionDigits, maximumFractionDigits)
     * @returns Formatted number string
     *
     * @example
     * ```tsx
     * formatNumber(1234.5, { style: 'decimal', maximumFractionDigits: 1 })
     * // => "1,234.5" (en-US) or "1.234,5" (de-DE)
     * ```
     */
    const formatNumber = (value: number, options: NumberFormatOptions = {}): string => {
      const { style = 'decimal', minimumFractionDigits = 0, maximumFractionDigits = 2 } = options;

      return new Intl.NumberFormat(locale, {
        style,
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(value);
    };

    /**
     * Formats bytes to human-readable data size
     *
     * Converts bytes to appropriate unit (B, KB, MB, GB, TB, PB) with locale-aware number formatting.
     *
     * @param bytes - Number of bytes to format
     * @param decimals - Number of decimal places (default: 2)
     * @returns Formatted size string (e.g., "2.5 MB"), or '-' if invalid
     *
     * @example
     * ```tsx
     * formatBytes(2621440) // => "2.50 MB"
     * formatBytes(1024) // => "1.00 KB"
     * ```
     */
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

    /**
     * Formats duration in seconds to human-readable time
     *
     * Converts seconds to compact format using standard abbreviations (h, m, s).
     * Technical terms stay in English as per convention.
     *
     * @param seconds - Duration in seconds
     * @returns Formatted duration (e.g., "2h 30m 15s"), or '-' if invalid
     *
     * @example
     * ```tsx
     * formatDuration(9015) // => "2h 30m 15s"
     * formatDuration(125) // => "2m 5s"
     * ```
     */
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

    /**
     * Formats a date as relative time string
     *
     * Displays the difference between the given date and now in human-readable form
     * (e.g., "5 minutes ago", "in 2 hours").
     *
     * @param date - Date to format as relative time
     * @param options - Formatting options (style, numeric)
     * @returns Relative time string, or '-' if date is invalid
     *
     * @example
     * ```tsx
     * const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
     * formatRelativeTime(fiveMinutesAgo) // => "5 minutes ago"
     * ```
     */
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

    /**
     * Formats network bandwidth in bits per second
     *
     * Converts bps to appropriate unit (bps, Kbps, Mbps, Gbps, Tbps) with
     * locale-aware number formatting. Note: Network speeds use 1000 base, not 1024.
     *
     * @param bitsPerSecond - Bandwidth in bits per second
     * @returns Formatted bandwidth string (e.g., "5.25 Mbps"), or '-' if invalid
     *
     * @example
     * ```tsx
     * formatBandwidth(5250000) // => "5.25 Mbps"
     * formatBandwidth(1000000) // => "1 Mbps"
     * ```
     */
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
