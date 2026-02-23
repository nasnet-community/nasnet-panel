/**
 * CachedDataBadge Component
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * Displays cache age and freshness status with color coding.
 * Indicates data staleness and provides retry action for offline scenarios.
 *
 * Two variants:
 * - inline: Compact badge for card headers (44px touch target minimum)
 * - banner: Full-width alert for dashboard top-level offline indicator
 *
 * Color coding:
 * - Green (<1 min): Fresh data - connected/synced
 * - Amber (1-5 min): Warning - slightly stale, weak connection
 * - Red (>5 min): Critical - very stale, mutations disabled
 *
 * WCAG AAA compliant:
 * - 7:1 contrast ratio in both light and dark modes
 * - Color never sole indicator (paired with icon + text)
 * - Touch targets 44x44px minimum (mobile)
 * - Screen reader announcements via role="status" and aria-live="polite"
 *
 * @example Inline badge (card header)
 * ```tsx
 * <CachedDataBadge
 *   status="warning"
 *   ageMinutes={3}
 *   lastSeenAt={new Date(Date.now() - 3 * 60000)}
 *   variant="inline"
 * />
 * ```
 *
 * @example Banner with retry action
 * ```tsx
 * <CachedDataBadge
 *   status="critical"
 *   ageMinutes={6}
 *   lastSeenAt={new Date(Date.now() - 6 * 60000)}
 *   onRetry={handleRefresh}
 *   variant="banner"
 * />
 * ```
 *
 * @see Story 5.1 Dev Notes: Offline Cache Architecture
 */
import React from 'react';
import type { CacheStatus } from '../../types/dashboard.types';
export interface CachedDataBadgeProps {
    /** Data freshness status: fresh (<1m), warning (1-5m), critical (>5m) */
    status: CacheStatus;
    /** Age of cached data in minutes (0-59) */
    ageMinutes: number;
    /** Last successful sync timestamp (ISO format or Date object) */
    lastSeenAt: Date;
    /** Optional callback to retry/refresh data (e.g., manual sync button) */
    onRetry?: () => void;
    /** Visual variant: 'inline' for cards, 'banner' for top-level offline indicator */
    variant?: 'inline' | 'banner';
    /** Additional CSS classes to apply to root element */
    className?: string;
}
/**
 * CachedDataBadge - Cache age indicator with retry action
 *
 * Two presentation variants:
 * - **inline**: Compact 24px badge for card headers, shows clock icon + age
 * - **banner**: Full-width alert row with icon, status text, timestamp, and retry button
 *
 * Accessibility:
 * - Inline: role="status" for screen reader announcements
 * - Banner: role="alert" aria-live="polite" for status updates
 * - All text meets 7:1 contrast ratio (WCAG AAA)
 * - Touch targets 44x44px minimum on mobile
 *
 * Performance:
 * - Memoized to prevent re-renders on parent updates
 * - useCallback on retry handler to maintain referential equality
 */
declare const CachedDataBadge: React.NamedExoticComponent<CachedDataBadgeProps>;
export { CachedDataBadge };
//# sourceMappingURL=CachedDataBadge.d.ts.map