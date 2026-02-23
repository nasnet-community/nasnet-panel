/**
 * StaleDataBadge Component
 *
 * Compact badge indicating data is from cache and may be stale.
 * Used during stale-while-revalidate patterns.
 *
 * @module @nasnet/ui/patterns/loading
 */
import * as React from 'react';
export interface StaleDataBadgeProps {
    /** Last update timestamp */
    lastUpdated?: Date | null;
    /** Whether a refresh is in progress */
    isRefreshing?: boolean;
    /** Callback when badge is clicked (to trigger refresh) */
    onRefresh?: () => void;
    /** Size variant */
    size?: 'sm' | 'md';
    /** Show relative time ("2m ago") vs absolute time */
    showRelativeTime?: boolean;
    /** Additional CSS classes */
    className?: string;
}
/**
 * StaleDataBadge Component
 *
 * Shows a small badge indicating cached/stale data with optional refresh.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <StaleDataBadge lastUpdated={new Date()} />
 *
 * // With refresh action
 * <StaleDataBadge
 *   lastUpdated={lastFetchTime}
 *   isRefreshing={isLoading}
 *   onRefresh={refetch}
 * />
 * ```
 */
export declare const StaleDataBadge: React.NamedExoticComponent<StaleDataBadgeProps>;
//# sourceMappingURL=StaleDataBadge.d.ts.map