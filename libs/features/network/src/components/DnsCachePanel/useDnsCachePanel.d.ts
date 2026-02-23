/**
 * DNS Cache Panel - Headless Hook
 * NAS-6.12: DNS Cache & Diagnostics - Task 6.2
 *
 * @description Provides DNS cache statistics and flush logic using Apollo Client.
 * Returns structured state object with cache data, loading states, and action handlers.
 * All formatting and computed values are memoized for performance.
 */
import type { DnsCacheStats, FlushDnsCacheResult } from './types';
/**
 * Configuration options for useDnsCachePanel hook
 * @interface UseDnsCachePanelOptions
 */
interface UseDnsCachePanelOptions {
    /** Unique device/router identifier for fetching stats */
    deviceId: string;
    /** Whether to enable polling for cache stats (default: true) */
    enablePolling?: boolean;
    /** Callback invoked on successful cache flush with result data */
    onFlushSuccess?: (result: FlushDnsCacheResult) => void;
    /** Callback invoked on flush error with error message */
    onFlushError?: (error: string) => void;
}
/**
 * Hook for DNS Cache Panel component
 *
 * @param options Configuration options (deviceId, polling, callbacks)
 * @returns Object with state, data, computed values, and action handlers
 *
 * @example
 * ```tsx
 * const {
 *   isLoading,
 *   cacheStats,
 *   cacheUsedFormatted,
 *   openFlushDialog,
 * } = useDnsCachePanel({ deviceId: 'router-1' });
 * ```
 */
export declare function useDnsCachePanel({ deviceId, enablePolling, onFlushSuccess, onFlushError, }: UseDnsCachePanelOptions): {
    isLoading: boolean;
    isFlushing: boolean;
    isError: boolean;
    isFlushDialogOpen: boolean;
    cacheStats: DnsCacheStats | undefined;
    flushResult: FlushDnsCacheResult | null;
    error: string | undefined;
    cacheUsedFormatted: string;
    cacheMaxFormatted: string;
    hitRateFormatted: string;
    openFlushDialog: () => void;
    closeFlushDialog: () => void;
    confirmFlush: () => Promise<void>;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
export {};
//# sourceMappingURL=useDnsCachePanel.d.ts.map