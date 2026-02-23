/**
 * Utility functions for RecentLogs dashboard widget
 * Story NAS-5.6: Recent Logs with Filtering
 */

/**
 * Formats log timestamp for display with responsive time format
 *
 * @description
 * Intelligently formats timestamps based on recency:
 * - Very recent (<1 min): "Just now"
 * - Recent (<1 hour): relative format "Nm ago" (e.g., "5m ago", "45m ago")
 * - Older (≥1 hour): absolute format "Mon DD, HH:MM:SS"
 *
 * Uses locale-aware formatting with `toLocaleString()` for international support.
 * Timestamps displayed in user's local timezone.
 *
 * **Performance:** Uses simple arithmetic (no Date parsing beyond initial input),
 * suitable for frequent rerenders in scrolling lists.
 *
 * @param timestamp - Log entry timestamp (Date object or ISO 8601 string)
 * @returns Formatted timestamp string suitable for log display
 *
 * @example
 * ```tsx
 * formatLogTimestamp(new Date())           // "Just now"
 * formatLogTimestamp(new Date(Date.now() - 5*60000)) // "5m ago"
 * formatLogTimestamp(new Date('2025-02-21T14:35:22')) // "Feb 21, 14:35:22"
 * ```
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString
 */
export function formatLogTimestamp(timestamp: Date | string): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  // Relative format for recent logs (<60 min)
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  // Absolute format for older logs (≥1 hour)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
