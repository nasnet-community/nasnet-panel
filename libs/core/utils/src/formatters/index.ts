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

import { formatDistanceToNow } from 'date-fns';

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
export const formatDate = (date: Date | string, locale = 'en-US'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  return dateObj.toLocaleDateString(locale);
};

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
export const formatDateTime = (date: Date | string, locale = 'en-US'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  return dateObj.toLocaleString(locale);
};

/**
 * Formats milliseconds as a duration string
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration (e.g., "1d 2h 30m 45s")
 * @example
 * formatDuration(90061000) // "1d 1h 1m 1s"
 * formatDuration(3661000) // "1h 1m 1s"
 */
export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
};

/**
 * Formats uptime from seconds to a readable string
 *
 * @param seconds - Uptime in seconds
 * @returns Formatted uptime string
 * @example
 * formatUptime(90061) // "1d 1h 1m 1s"
 * formatUptime(3661) // "1h 1m 1s"
 */
export const formatUptime = (seconds: number): string => {
  return formatDuration(seconds * 1000);
};

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
export const parseRouterOSUptime = (uptimeStr: string): string => {
  // Handle edge case: empty or invalid string
  if (!uptimeStr || typeof uptimeStr !== 'string') {
    return '0s';
  }

  // RouterOS format: "3d4h25m12s" or "4h25m12s" or "25m12s" or "12s"
  const dayMatch = uptimeStr.match(/(\d+)d/);
  const hourMatch = uptimeStr.match(/(\d+)h/);
  const minMatch = uptimeStr.match(/(\d+)m/);
  const secMatch = uptimeStr.match(/(\d+)s/);

  const days = dayMatch ? parseInt(dayMatch[1], 10) : 0;
  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
  const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;
  const seconds = secMatch ? parseInt(secMatch[1], 10) : 0;

  // Convert to total seconds and use existing formatUptime
  const totalSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds;

  return formatUptime(totalSeconds);
};

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
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

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
export const formatPercent = (value: number, decimals = 1): string => {
  if (value < 0 || value > 100) {
    return `${value.toFixed(decimals)}%`;
  }
  return `${value.toFixed(decimals)}%`;
};

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
export const formatNumber = (value: number, locale = 'en-US'): string => {
  return value.toLocaleString(locale);
};

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
export const formatBandwidth = (bytesPerSecond: number, decimals = 2): string => {
  const bitsPerSecond = bytesPerSecond * 8;
  const k = 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps'];
  const i = Math.floor(Math.log(bitsPerSecond) / Math.log(k));

  return parseFloat((bitsPerSecond / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

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
export const formatMAC = (mac: string | undefined | null, separator = ':'): string => {
  if (!mac) {
    return ''; // Return empty string if undefined/null
  }

  const cleaned = mac.replace(/[:-]/g, '').toUpperCase();

  if (cleaned.length !== 12) {
    return mac; // Return original if invalid
  }

  return cleaned.match(/.{1,2}/g)?.join(separator) || mac;
};

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
export const truncateText = (text: string, maxLength: number, ellipsis = '...'): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - ellipsis.length) + ellipsis;
};

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
export const formatBoolean = (value: boolean, trueText = 'Yes', falseText = 'No'): string => {
  return value ? trueText : falseText;
};

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
export const formatLeaseTime = (leaseTime: string): string => {
  // Handle edge cases
  if (!leaseTime || typeof leaseTime !== 'string') {
    return '0 seconds';
  }

  // Parse components from RouterOS format
  const dayMatch = leaseTime.match(/(\d+)d/);
  const hourMatch = leaseTime.match(/(\d+)h/);
  const minMatch = leaseTime.match(/(\d+)m/);
  const secMatch = leaseTime.match(/(\d+)s/);

  const days = dayMatch ? parseInt(dayMatch[1], 10) : 0;
  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
  const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;
  const seconds = secMatch ? parseInt(secMatch[1], 10) : 0;

  // Build human-readable parts
  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  }
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }
  if (seconds > 0) {
    parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
  }

  // If nothing was parsed, return "0 seconds"
  if (parts.length === 0) {
    return '0 seconds';
  }

  // Join with spaces for readability
  return parts.join(' ');
};

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
export const formatExpirationTime = (expiresAfter?: string): string => {
  // Handle static leases (no expiration)
  if (!expiresAfter || expiresAfter === '') {
    return 'Never';
  }

  // Reuse formatLeaseTime for consistency
  return formatLeaseTime(expiresAfter);
};

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
export const formatMACAddress = formatMAC;

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
export const formatPublicKey = (publicKey: string): string => {
  // Handle edge cases
  if (!publicKey || typeof publicKey !== 'string') {
    return '';
  }

  // If key is too short to meaningfully truncate, return as-is
  if (publicKey.length <= 12) {
    return publicKey;
  }

  // Truncate: first 8 chars + "..." + last 4 chars
  const first8 = publicKey.substring(0, 8);
  const last4 = publicKey.substring(publicKey.length - 4);

  return `${first8}...${last4}`;
};

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
export const formatLastHandshake = (lastHandshake?: Date | null): string => {
  // Handle cases where no handshake has occurred
  if (!lastHandshake) {
    return 'Never';
  }

  // Convert to Date if it's a string
  const date = typeof lastHandshake === 'string' ? new Date(lastHandshake) : lastHandshake;

  // Validate the date
  if (isNaN(date.getTime())) {
    return 'Never';
  }

  // Format as relative time
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    // Fallback to "Never" if formatting fails
    return 'Never';
  }
};

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
export const formatTimestamp = (
  timestamp: Date | string,
  showDate = false
): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

  if (isNaN(date.getTime())) {
    return 'Invalid Time';
  }

  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  };

  if (showDate) {
    options.year = 'numeric';
    options.month = '2-digit';
    options.day = '2-digit';
  }

  return date.toLocaleTimeString('en-US', options);
};
