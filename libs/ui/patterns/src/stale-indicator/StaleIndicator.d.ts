/**
 * StaleIndicator Component
 *
 * Displays a visual indicator when data is stale (from cache while offline).
 * Provides last updated timestamp and optional refresh action.
 *
 * @module @nasnet/ui/patterns/stale-indicator
 */
import * as React from 'react';
/**
 * Props for StaleIndicator component
 */
export interface StaleIndicatorProps {
    /** Whether the data is currently stale */
    isStale: boolean;
    /** Timestamp of when the data was last successfully fetched */
    lastUpdated?: Date | null;
    /** Callback when refresh button is clicked */
    onRefresh?: () => void;
    /** Whether a refresh is in progress */
    isRefreshing?: boolean;
    /** Whether the app is offline */
    isOffline?: boolean;
    /** Custom message to display */
    message?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Additional CSS classes */
    className?: string;
}
/**
 * StaleIndicator Component
 *
 * Shows a visual indicator when data is stale, typically due to being
 * served from cache while the app is offline or the backend is unreachable.
 *
 * Features:
 * - Visual badge with stale/offline status
 * - Last updated timestamp with relative formatting
 * - Optional refresh button with loading state
 * - Three size variants (sm, md, lg)
 * - Accessible with proper ARIA attributes
 *
 * @example
 * ```tsx
 * // Basic usage
 * <StaleIndicator isStale={true} lastUpdated={new Date()} />
 *
 * // With refresh action
 * <StaleIndicator
 *   isStale={true}
 *   lastUpdated={lastFetchTime}
 *   onRefresh={refetch}
 *   isRefreshing={loading}
 * />
 *
 * // Offline indicator
 * <StaleIndicator
 *   isStale={true}
 *   isOffline={true}
 *   lastUpdated={lastFetchTime}
 *   message="You're offline. Showing cached data."
 * />
 * ```
 */
declare function StaleIndicatorBase({ isStale, lastUpdated, onRefresh, isRefreshing, isOffline, message, size, className, }: StaleIndicatorProps): import("react/jsx-runtime").JSX.Element | null;
declare namespace StaleIndicatorBase {
    var displayName: string;
}
export declare const StaleIndicator: React.MemoExoticComponent<typeof StaleIndicatorBase>;
export {};
//# sourceMappingURL=StaleIndicator.d.ts.map