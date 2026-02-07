/**
 * Utility functions for RecentLogs dashboard widget
 * Story NAS-5.6: Recent Logs with Filtering
 */

/**
 * Formats log timestamp for display
 * - Recent logs (<1 hour): relative format ("2m ago")
 * - Older logs: absolute format ("Jan 22, 14:35:22")
 *
 * @param timestamp - Log entry timestamp
 * @returns Formatted timestamp string
 */
export function formatLogTimestamp(timestamp: Date | string): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  // Relative for recent (<60 min)
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  // Absolute for older
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
