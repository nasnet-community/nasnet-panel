/**
 * Timeout Utilities
 *
 * Convert between duration strings (1d2h3m) and seconds.
 * MikroTik supports duration formats like "1d", "12h", "30m", "45s".
 */

/**
 * Parse duration string to seconds
 *
 * Supports formats:
 * - "1d" = 86400 seconds (1 day)
 * - "12h" = 43200 seconds (12 hours)
 * - "30m" = 1800 seconds (30 minutes)
 * - "45s" = 45 seconds
 * - "1d2h3m" = 93780 seconds (1 day, 2 hours, 3 minutes)
 *
 * @param duration - Duration string
 * @returns Total seconds
 */
export function parseDuration(duration: string): number {
  if (!duration || duration.trim() === '') {
    return 0;
  }

  const str = duration.trim().toLowerCase();

  // If it's just a number, treat as seconds
  if (/^\d+$/.test(str)) {
    return parseInt(str, 10);
  }

  let total = 0;

  // Match all number-unit pairs
  const regex = /(\d+)([dhms])/g;
  let match;

  while ((match = regex.exec(str)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'd':
        total += value * 86400; // days
        break;
      case 'h':
        total += value * 3600; // hours
        break;
      case 'm':
        total += value * 60; // minutes
        break;
      case 's':
        total += value; // seconds
        break;
    }
  }

  return total;
}

/**
 * Format seconds to human-readable duration string
 *
 * Prefers the most compact representation:
 * - 86400 → "1d"
 * - 3600 → "1h"
 * - 180 → "3m"
 * - 45 → "45s"
 * - 93780 → "1d2h3m"
 *
 * @param seconds - Total seconds
 * @returns Duration string
 */
export function formatDuration(seconds: number): string {
  if (seconds === 0) {
    return '0s';
  }

  const parts: string[] = [];

  // Days
  const days = Math.floor(seconds / 86400);
  if (days > 0) {
    parts.push(`${days}d`);
    seconds -= days * 86400;
  }

  // Hours
  const hours = Math.floor(seconds / 3600);
  if (hours > 0) {
    parts.push(`${hours}h`);
    seconds -= hours * 3600;
  }

  // Minutes
  const minutes = Math.floor(seconds / 60);
  if (minutes > 0) {
    parts.push(`${minutes}m`);
    seconds -= minutes * 60;
  }

  // Seconds
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds}s`);
  }

  return parts.join('');
}

/**
 * Validate duration string format
 *
 * @param duration - Duration string to validate
 * @returns True if valid, false otherwise
 */
export function isValidDuration(duration: string): boolean {
  if (!duration || duration.trim() === '') {
    return false;
  }

  const str = duration.trim().toLowerCase();

  // Allow plain numbers (interpreted as seconds)
  if (/^\d+$/.test(str)) {
    return true;
  }

  // Must match format: <number><unit> where unit is d, h, m, or s
  // Can have multiple parts: "1d2h3m"
  const regex = /^(\d+[dhms])+$/;
  return regex.test(str);
}

/**
 * Get duration string from form value or default
 *
 * @param value - Form value (could be empty)
 * @param defaultSeconds - Default value in seconds
 * @returns Duration string
 */
export function getDurationOrDefault(
  value: string | undefined,
  defaultSeconds: number
): string {
  if (!value || value.trim() === '') {
    return formatDuration(defaultSeconds);
  }

  return value;
}

/**
 * Convert duration string to seconds or return default
 *
 * @param value - Duration string
 * @param defaultSeconds - Default value if parsing fails
 * @returns Seconds
 */
export function parseOrDefault(
  value: string | undefined,
  defaultSeconds: number
): number {
  if (!value || value.trim() === '') {
    return defaultSeconds;
  }

  const parsed = parseDuration(value);
  return parsed > 0 ? parsed : defaultSeconds;
}
