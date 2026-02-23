/**
 * @fileoverview Formatters utilities
 *
 * Provides formatting functions for:
 * - Dates and times (ISO, locale-specific)
 * - Durations and uptime (RouterOS format support)
 * - Data sizes and bandwidth
 * - Numbers and percentages
 * - MAC addresses and cryptographic keys
 * - Lease times and expiration
 * - Boolean and text truncation
 *
 * All functions handle edge cases gracefully with fallback values.
 *
 * @example
 * ```typescript
 * import {
 *   formatBytes,
 *   formatDuration,
 *   formatMAC,
 *   parseRouterOSUptime,
 * } from '@nasnet/core/utils';
 *
 * formatBytes(1048576) // "1.00 MB"
 * formatDuration(3661000) // "1h 1m 1s"
 * parseRouterOSUptime("3d4h25m12s") // "3d 4h 25m 12s"
 * ```
 */
/**
 * Formats a date to a readable string
 *
 * @param date - Date object or ISO string
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted date string (e.g., "12/4/2025" in en-US)
 * @example
 * formatDate(new Date()) // "12/4/2025"
 * formatDate("2025-12-04T12:34:56Z") // "12/4/2025"
 */
export declare const formatDate: (date: Date | string, locale?: string) => string;
/**
 * Formats a date and time to a readable string
 *
 * @param date - Date object or ISO string
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted date and time string
 * @example
 * formatDateTime(new Date()) // "12/4/2025, 12:34:56 PM"
 * formatDateTime("2025-12-04T12:34:56Z") // "12/4/2025, 12:34:56 PM"
 */
export declare const formatDateTime: (date: Date | string, locale?: string) => string;
/**
 * Formats milliseconds as a duration string
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration (e.g., "1d 2h 30m 45s")
 * @example
 * formatDuration(90061000) // "1d 1h 1m 1s"
 * formatDuration(3661000) // "1h 1m 1s"
 */
export declare const formatDuration: (ms: number) => string;
/**
 * Formats uptime from seconds to a readable string
 *
 * @param seconds - Uptime in seconds
 * @returns Formatted uptime string
 * @example
 * formatUptime(90061) // "1d 1h 1m 1s"
 * formatUptime(3661) // "1h 1m 1s"
 */
export declare const formatUptime: (seconds: number) => string;
/**
 * Parses RouterOS uptime format and converts to human-readable string
 * Converts "3d4h25m12s" to "3 days, 4 hours" or "4h25m12s" to "4h 25m"
 *
 * @param uptimeStr - RouterOS uptime string (e.g., "3d4h25m12s", "4h25m", "25m12s")
 * @returns Human-readable uptime string
 * @example
 * parseRouterOSUptime("3d4h25m12s") // "3d 4h 25m 12s"
 * parseRouterOSUptime("0s") // "0s"
 * parseRouterOSUptime("365d12h30m45s") // "365d 12h 30m 45s"
 */
export declare const parseRouterOSUptime: (uptimeStr: string) => string;
/**
 * Formats bytes to a human-readable size string
 *
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted size string (e.g., "1.23 MB")
 * @example
 * formatBytes(1048576) // "1.00 MB"
 * formatBytes(1536, 1) // "1.5 KB"
 */
export declare const formatBytes: (bytes: number, decimals?: number) => string;
/**
 * Formats a percentage value
 *
 * @param value - Value between 0 and 100
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "45.5%")
 * @example
 * formatPercent(45.5) // "45.5%"
 * formatPercent(33.333, 2) // "33.33%"
 */
export declare const formatPercent: (value: number, decimals?: number) => string;
/**
 * Formats a number with thousand separators
 *
 * @param value - Number to format
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted number string
 * @example
 * formatNumber(1000000) // "1,000,000"
 * formatNumber(1000000, 'de-DE') // "1.000.000"
 */
export declare const formatNumber: (value: number, locale?: string) => string;
/**
 * Formats bytes per second as bandwidth
 *
 * @param bytesPerSecond - Bandwidth in bytes per second
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted bandwidth string (e.g., "1.23 Mbps")
 * @example
 * formatBandwidth(131072) // "1.05 Mbps" (131072 bytes/s = 1.048576 Mbps)
 * formatBandwidth(1024, 1) // "8.2 Kbps"
 */
export declare const formatBandwidth: (bytesPerSecond: number, decimals?: number) => string;
/**
 * Formats MAC address to a consistent format
 *
 * @param mac - MAC address string (any format: XX:XX:XX:XX:XX:XX, XX-XX-XX-XX-XX-XX, or XXXXXXXXXXXX)
 * @param separator - Separator character (default: ':')
 * @returns Formatted MAC address, or empty string if undefined/null
 * @example
 * formatMAC("aabbccddee00") // "AA:BB:CC:DD:EE:00"
 * formatMAC("aa-bb-cc-dd-ee-00", '-') // "AA-BB-CC-DD-EE-00"
 * formatMAC(null) // ""
 */
export declare const formatMAC: (mac: string | undefined | null, separator?: string) => string;
/**
 * Truncates text to a maximum length with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length including ellipsis
 * @param ellipsis - Ellipsis string (default: '...')
 * @returns Truncated text with ellipsis if exceeded
 * @example
 * truncateText("Hello World", 8) // "Hello..."
 * truncateText("Hi", 10) // "Hi"
 */
export declare const truncateText: (text: string, maxLength: number, ellipsis?: string) => string;
/**
 * Formats a boolean value as a human-readable string
 *
 * @param value - Boolean value
 * @param trueText - Text for true (default: 'Yes')
 * @param falseText - Text for false (default: 'No')
 * @returns Formatted boolean string
 * @example
 * formatBoolean(true) // "Yes"
 * formatBoolean(false) // "No"
 * formatBoolean(true, 'Enabled', 'Disabled') // "Enabled"
 */
export declare const formatBoolean: (value: boolean, trueText?: string, falseText?: string) => string;
/**
 * Formats DHCP lease time from RouterOS format to human-readable format
 *
 * Converts "10m" to "10 minutes", "1h" to "1 hour", "1d12h" to "1 day 12 hours", etc.
 *
 * @param leaseTime - RouterOS lease time string (e.g., "10m", "1h", "1d", "1d12h30m")
 * @returns Human-readable lease time string
 * @example
 * formatLeaseTime("10m") // "10 minutes"
 * formatLeaseTime("1h") // "1 hour"
 * formatLeaseTime("1d") // "1 day"
 * formatLeaseTime("1d12h") // "1 day 12 hours"
 * formatLeaseTime("2d") // "2 days"
 */
export declare const formatLeaseTime: (leaseTime: string) => string;
/**
 * Formats DHCP lease expiration time from RouterOS format to human-readable format
 *
 * Converts "5m30s" to "5 minutes", "2h15m" to "2 hours 15 minutes", etc.
 * Returns "Never" for static leases (undefined or empty expiresAfter).
 *
 * @param expiresAfter - RouterOS expiration string (e.g., "5m30s", "2h15m", undefined)
 * @returns Human-readable expiration time or "Never" for static leases
 * @example
 * formatExpirationTime("5m30s") // "5 minutes"
 * formatExpirationTime("2h15m") // "2 hours 15 minutes"
 * formatExpirationTime(undefined) // "Never"
 */
export declare const formatExpirationTime: (expiresAfter?: string) => string;
/**
 * Formats MAC address to uppercase with colon separators
 *
 * Alias for formatMAC for DHCP-specific context.
 *
 * @param mac - MAC address string in any format
 * @returns Formatted MAC address (XX:XX:XX:XX:XX:XX)
 * @example
 * formatMACAddress("aabbccddee00") // "AA:BB:CC:DD:EE:00"
 */
export declare const formatMACAddress: (mac: string | undefined | null, separator?: string) => string;
/**
 * Formats WireGuard public key to truncated display format
 *
 * Shows first 8 characters + "..." + last 4 characters for compact display.
 *
 * @param publicKey - Base64 encoded WireGuard public key
 * @returns Truncated public key string, or as-is if too short (<=12 chars)
 * @example
 * formatPublicKey("ABC123XYZ789DEFGHI456") // "ABC123XY...I456"
 * formatPublicKey("SHORT") // "SHORT"
 * formatPublicKey("") // ""
 */
export declare const formatPublicKey: (publicKey: string) => string;
/**
 * Formats WireGuard last handshake time to relative time string
 *
 * Shows relative time like "2 minutes ago", "about 1 hour ago", etc.
 * Returns "Never" if no handshake has occurred.
 *
 * @param lastHandshake - Date object representing the last handshake time
 * @returns Relative time string or "Never"
 * @example
 * formatLastHandshake(new Date(Date.now() - 120000)) // "2 minutes ago"
 * formatLastHandshake(new Date(Date.now() - 3600000)) // "about 1 hour ago"
 * formatLastHandshake(undefined) // "Never"
 * formatLastHandshake(null) // "Never"
 */
export declare const formatLastHandshake: (lastHandshake?: Date | null) => string;
/**
 * Formats a timestamp for log display
 *
 * Displays time in 12-hour format with seconds (e.g., "12:34:56 PM").
 * Used for system log entries and audit timestamps.
 *
 * @param timestamp - Date object or ISO string
 * @param showDate - Whether to include the date (default: false)
 * @returns Formatted timestamp string
 * @example
 * formatTimestamp(new Date()) // "12:34:56 PM"
 * formatTimestamp(new Date(), true) // "12/04/2025, 12:34:56 PM"
 * formatTimestamp("2025-12-04T12:34:56Z") // "12:34:56 PM"
 */
export declare const formatTimestamp: (timestamp: Date | string, showDate?: boolean) => string;
//# sourceMappingURL=index.d.ts.map