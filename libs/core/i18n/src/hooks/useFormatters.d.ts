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
export declare function useFormatters(): {
    formatDate: (date: Date | string | number, options?: DateFormatOptions) => string;
    formatNumber: (value: number, options?: NumberFormatOptions) => string;
    formatBytes: (bytes: number, decimals?: number) => string;
    formatDuration: (seconds: number) => string;
    formatRelativeTime: (date: Date | string | number, options?: RelativeTimeOptions) => string;
    formatBandwidth: (bitsPerSecond: number) => string;
    locale: string;
};
//# sourceMappingURL=useFormatters.d.ts.map