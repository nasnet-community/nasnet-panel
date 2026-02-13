/**
 * StatsLiveRegion Component
 * Screen reader announcements for interface statistics updates
 *
 * NAS-6.9: Implement Interface Traffic Statistics (Task 9 - Accessibility)
 */

import { useEffect, useRef } from 'react';
import type { InterfaceStats } from '@nasnet/api-client/generated';

/**
 * Props for StatsLiveRegion component
 */
export interface StatsLiveRegionProps {
  /** Current interface statistics */
  stats: InterfaceStats | null;
  /** Interface display name */
  interfaceName: string;
}

/**
 * Formats bytes as BigInt to human-readable size string
 * Simplified version for announcements
 */
function formatBytesForAnnouncement(bytes: string): string {
  try {
    const value = BigInt(bytes);
    if (value === 0n) return '0 bytes';

    const k = 1024n;
    const sizes = ['bytes', 'kilobytes', 'megabytes', 'gigabytes', 'terabytes'];

    let num = value;
    let unitIndex = 0;

    while (num >= k && unitIndex < sizes.length - 1) {
      num = num / k;
      unitIndex++;
    }

    return `${num} ${sizes[unitIndex]}`;
  } catch {
    return bytes + ' bytes';
  }
}

/**
 * StatsLiveRegion Component
 *
 * Provides ARIA live region announcements for screen reader users.
 * Announces statistics updates in a non-intrusive way with debouncing
 * to prevent announcement spam.
 *
 * Features:
 * - Debounced announcements (max 1 per 5 seconds)
 * - Polite interruption level (doesn't interrupt current reading)
 * - Atomic updates (entire message read together)
 * - Screen-reader only (visually hidden)
 *
 * @example
 * ```tsx
 * <StatsLiveRegion
 *   stats={statsState.stats}
 *   interfaceName="ether1 - WAN"
 * />
 * ```
 */
export function StatsLiveRegion({ stats, interfaceName }: StatsLiveRegionProps) {
  const lastAnnouncementRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Debounce announcements to prevent spam
  // Maximum 1 announcement per 5 seconds
  const DEBOUNCE_MS = 5000;

  useEffect(() => {
    if (!stats) return;

    const now = Date.now();
    const timeSinceLastAnnouncement = now - lastAnnouncementRef.current;

    // Skip if we announced recently
    if (timeSinceLastAnnouncement < DEBOUNCE_MS) {
      return;
    }

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule announcement
    timeoutRef.current = setTimeout(() => {
      lastAnnouncementRef.current = Date.now();
    }, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [stats]);

  if (!stats) return null;

  // Calculate total errors for announcement
  const totalErrors = stats.txErrors + stats.rxErrors;
  const hasErrors = totalErrors > 0;

  // Build announcement message
  const announcement = hasErrors
    ? `${interfaceName} statistics updated. Transmitted ${formatBytesForAnnouncement(
        stats.txBytes
      )}, received ${formatBytesForAnnouncement(
        stats.rxBytes
      )}. Warning: ${totalErrors} error${totalErrors === 1 ? '' : 's'} detected.`
    : `${interfaceName} statistics updated. Transmitted ${formatBytesForAnnouncement(
        stats.txBytes
      )}, received ${formatBytesForAnnouncement(stats.rxBytes)}.`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}
