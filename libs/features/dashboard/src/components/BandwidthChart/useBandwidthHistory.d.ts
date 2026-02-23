/**
 * useBandwidthHistory - Headless hook for bandwidth data fetching
 * Implements hybrid real-time strategy: GraphQL subscription + polling fallback
 * Follows ADR-018 (Headless + Platform Presenters pattern)
 * @description
 * Fetches and manages bandwidth history data with automatic subscription/polling
 * strategy selection. For 5m time range, uses real-time GraphQL subscriptions with
 * polling fallback if subscription fails. For 1h/24h ranges, uses cached queries only.
 * Automatically appends real-time data points and trims historical data to maintain
 * performance. Cleanup is automatic: subscriptions terminated on unmount, intervals
 * cleared, refs released.
 * @example
 * const { data, loading, error, refetch } = useBandwidthHistory({
 *   deviceId: 'router-1',
 *   timeRange: '5m',
 *   interfaceId: 'eth0'
 * });
 */
import type { UseBandwidthHistoryConfig, UseBandwidthHistoryReturn } from './types';
/**
 * Hook for fetching and managing bandwidth history data
 *
 * **Data Fetching Strategy:**
 * - For 5m view: GraphQL subscription for real-time updates + polling fallback (2s interval)
 * - For 1h/24h views: Cached query only (no real-time updates)
 * - Automatic fallback to polling if subscription errors
 * - Cache policy: cache-and-network (show cached immediately, refresh in background)
 *
 * **Performance Optimization:**
 * - Real-time data appended to ref, not causing re-renders until memoized value updates
 * - Data trimmed to MAX_DATA_POINTS per timeRange to prevent memory growth
 * - useMemo prevents recalculation when data hasn't changed
 * - useCallback on event handlers prevents subscription recreation
 *
 * **Cleanup & Memory Management:**
 * - useQuery/useSubscription cleanup: automatic on unmount
 * - Ref cleanup: dataRef cleared on unmount
 * - State cleanup: subscriptionActive state cleared
 * - No memory leaks from intervals (managed by Apollo)
 *
 * @param config - Hook configuration (deviceId, timeRange, interfaceId)
 * @returns Object with data, loading, error states, refetch function, subscription status
 */
export declare function useBandwidthHistory(config: UseBandwidthHistoryConfig): UseBandwidthHistoryReturn;
//# sourceMappingURL=useBandwidthHistory.d.ts.map