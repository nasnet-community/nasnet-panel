/**
 * useRelativeTime Hook
 * Provides relative time display that updates every second
 */

import { useState, useEffect } from 'react';

/**
 * Format time difference as relative string
 * @param timestamp - Date to format
 * @returns Formatted relative time string
 */
function formatRelativeTime(timestamp: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 5) {
    return 'Updated just now';
  }

  if (diffSeconds < 60) {
    return `Updated ${diffSeconds} second${diffSeconds === 1 ? '' : 's'} ago`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `Updated ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  return `Updated ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
}

/**
 * Hook to display relative time that updates every second
 * @param timestamp - Date to display relative to now
 * @returns Formatted relative time string that updates every second
 *
 * @example
 * ```tsx
 * function Component({ lastUpdated }: { lastUpdated: Date }) {
 *   const relativeTime = useRelativeTime(lastUpdated);
 *   return <span>{relativeTime}</span>; // "Updated 5 seconds ago"
 * }
 * ```
 */
export function useRelativeTime(timestamp: Date | null | undefined): string {
  const [relativeTime, setRelativeTime] = useState(() =>
    timestamp ? formatRelativeTime(timestamp) : ''
  );

  useEffect(() => {
    if (!timestamp) {
      setRelativeTime('');
      return;
    }

    // Initial update
    setRelativeTime(formatRelativeTime(timestamp));

    // Update every second
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(timestamp));
    }, 1000);

    return () => clearInterval(interval);
  }, [timestamp]);

  return relativeTime;
}
