/**
 * Connection History Hook
 *
 * Fetch and manage WAN connection history with pagination.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 6: Connection History)
 */
import type { ConnectionEventData } from '../types/wan.types';
export interface UseConnectionHistoryOptions {
    routerId: string;
    wanId?: string;
    limit?: number;
    offset?: number;
    skip?: boolean;
}
export interface ConnectionHistoryResult {
    total: number;
    events: ConnectionEventData[];
}
/**
 * Hook to fetch WAN connection history
 *
 * Fetches paginated WAN connection events with caching and polling support.
 * Automatically polls every 30 seconds for new events in cache-and-network mode.
 *
 * @example
 * ```tsx
 * const { events, total, loading, error, loadMore, hasMore } = useConnectionHistory({
 *   routerId: 'router-123',
 *   limit: 50,
 * });
 * ```
 */
export declare function useConnectionHistory({ routerId, wanId, limit, offset, skip, }: UseConnectionHistoryOptions): {
    events: ConnectionEventData[];
    total: number;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<{
        wanConnectionHistory: ConnectionHistoryResult;
    }>>;
    loadMore: () => Promise<void>;
    hasMore: boolean;
};
export declare namespace useConnectionHistory {
    var displayName: string;
}
/**
 * Generate mock connection history for Storybook/testing
 * @description Creates realistic mock connection events with varied timestamps
 * @param count Number of events to generate (default: 20)
 * @returns Array of mock connection events
 */
export declare function generateMockConnectionHistory(count?: number): ConnectionEventData[];
//# sourceMappingURL=useConnectionHistory.d.ts.map