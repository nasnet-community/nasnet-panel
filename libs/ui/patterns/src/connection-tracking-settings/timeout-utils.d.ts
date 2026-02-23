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
export declare function parseDuration(duration: string): number;
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
export declare function formatDuration(seconds: number): string;
/**
 * Validate duration string format
 *
 * @param duration - Duration string to validate
 * @returns True if valid, false otherwise
 */
export declare function isValidDuration(duration: string): boolean;
/**
 * Get duration string from form value or default
 *
 * @param value - Form value (could be empty)
 * @param defaultSeconds - Default value in seconds
 * @returns Duration string
 */
export declare function getDurationOrDefault(value: string | undefined, defaultSeconds: number): string;
/**
 * Convert duration string to seconds or return default
 *
 * @param value - Duration string
 * @param defaultSeconds - Default value if parsing fails
 * @returns Seconds
 */
export declare function parseOrDefault(value: string | undefined, defaultSeconds: number): number;
//# sourceMappingURL=timeout-utils.d.ts.map