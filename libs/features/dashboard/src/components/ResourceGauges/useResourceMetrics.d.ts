/**
 * useResourceMetrics Hook
 * Fetches real-time resource metrics using GraphQL subscription with 2s polling fallback
 *
 * @description
 * Implements hybrid real-time strategy with graceful degradation:
 * 1. Primary: GraphQL WebSocket subscriptions for real-time events (>1s latency)
 * 2. Fallback: Poll every 2 seconds if subscription unavailable
 * - Automatically pauses subscriptions when browser tab not visible (Page Visibility API)
 * - Subscriptions cleaned up on component unmount
 * - Returns formatted metrics with human-readable strings for display
 *
 * AC 5.2.1: Real-time resource gauges for CPU, Memory, Storage, Temperature
 * AC 5.2.2: Updates every 2 seconds via polling fallback
 *
 * @example
 * ```tsx
 * const { metrics, loading, raw } = useResourceMetrics(routerId);
 * return (
 *   <ResourceGauges
 *     cpu={metrics?.cpu}
 *     memory={metrics?.memory}
 *     storage={metrics?.storage}
 *     temperature={metrics?.temperature}
 *     isLoading={loading}
 *   />
 * );
 * ```
 */
/**
 * GraphQL subscription for real-time resource metrics
 * Priority: BACKGROUND (10s batching OK per architecture)
 */
export declare const RESOURCE_METRICS_SUBSCRIPTION: import("graphql").DocumentNode;
/**
 * GraphQL query for polling fallback
 */
export declare const GET_RESOURCE_METRICS: import("graphql").DocumentNode;
/**
 * Resource metrics data structure
 */
export interface ResourceMetrics {
    cpu: {
        usage: number;
        cores: number;
        perCore?: number[];
        frequency?: number;
    };
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    storage: {
        used: number;
        total: number;
        percentage: number;
    };
    temperature?: number;
    timestamp: string;
}
/**
 * Formatted resource metrics with human-readable strings
 */
export interface FormattedResourceMetrics {
    cpu: {
        usage: number;
        cores: number;
        perCore?: number[];
        frequency?: number;
        formatted: string;
    };
    memory: {
        used: number;
        total: number;
        percentage: number;
        formatted: string;
    };
    storage: {
        used: number;
        total: number;
        percentage: number;
        formatted: string;
    };
    temperature?: number;
    hasTemperature: boolean;
    timestamp: Date;
}
/**
 * Format bytes to human-readable format (B, KB, MB, GB)
 * Used for memory and storage displays
 */
export declare function formatBytes(bytes: number): string;
/**
 * useResourceMetrics Hook
 *
 * Implements hybrid real-time strategy with graceful degradation:
 * - Primary: GraphQL subscriptions for real-time events (<1s latency)
 * - Fallback: Poll every 2s if subscription unavailable or disconnected
 * - Auto-pause subscriptions when browser tab not visible
 * - Cleanup: All subscriptions and intervals cleared on unmount
 *
 * @param deviceId - Router device ID (UUID)
 * @returns Object with formatted metrics for display, raw data, and loading state
 *   - metrics: FormattedResourceMetrics | null - Human-readable formatted data
 *   - raw: ResourceMetrics | undefined - Raw subscription/query response
 *   - loading: boolean - True while initial query/subscription connecting
 *
 * @throws No errors thrown; gracefully falls back to polling if subscription unavailable
 */
export declare function useResourceMetrics(deviceId: string): {
    metrics: {
        cpu: any;
        memory: any;
        storage: any;
        temperature: any;
        hasTemperature: boolean;
        timestamp: Date;
    } | null;
    loading: boolean;
    raw: any;
};
//# sourceMappingURL=useResourceMetrics.d.ts.map