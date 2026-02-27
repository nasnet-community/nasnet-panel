/**
 * Interface Statistics API Client Hooks
 * NAS-6.9: Implement Interface Traffic Statistics
 *
 * Provides GraphQL queries, subscriptions, and Apollo Client hooks for:
 * - Real-time interface statistics monitoring
 * - Historical bandwidth data with time-series graphs
 * - Configurable polling intervals for live updates
 */
import { type QueryHookOptions, type SubscriptionHookOptions } from '@apollo/client';
import type {
  InterfaceStats,
  InterfaceStatsHistory,
  StatsTimeRangeInput,
  QueryInterfaceStatsHistoryArgs,
  SubscriptionInterfaceStatsUpdatedArgs,
} from '@nasnet/api-client/generated';
/**
 * Query current interface statistics
 * Returns snapshot of TX/RX bytes, packets, errors, and drops
 */
export declare const GET_INTERFACE_STATS: import('graphql').DocumentNode;
/**
 * Query historical interface statistics with time-series data
 * Returns aggregated data points for charting bandwidth over time
 */
export declare const GET_INTERFACE_STATS_HISTORY: import('graphql').DocumentNode;
/**
 * Subscribe to real-time interface statistics updates
 * Receives periodic updates at the specified interval
 */
export declare const INTERFACE_STATS_UPDATED: import('graphql').DocumentNode;
/**
 * Options for useInterfaceStatsQuery hook
 */
export interface UseInterfaceStatsQueryOptions {
  /** Router ID */
  routerId: string;
  /** Interface ID */
  interfaceId: string;
  /** Additional Apollo query options */
  options?: Omit<QueryHookOptions, 'variables'>;
}
/**
 * Options for useInterfaceStatsHistoryQuery hook
 */
export interface UseInterfaceStatsHistoryOptions {
  /** Router ID */
  routerId: string;
  /** Interface ID */
  interfaceId: string;
  /** Time range for historical data */
  timeRange: StatsTimeRangeInput;
  /** Aggregation interval (e.g., '5m', '1h') */
  interval?: string;
  /** Skip query execution if true */
  skip?: boolean;
  /** Additional Apollo query options */
  options?: Omit<QueryHookOptions, 'variables' | 'skip'>;
}
/**
 * Options for useInterfaceStatsSubscription hook
 */
export interface UseInterfaceStatsSubscriptionOptions {
  /** Router ID */
  routerId: string;
  /** Interface ID */
  interfaceId: string;
  /** Polling interval (e.g., '1s', '5s', '10s', '30s') */
  interval?: string;
  /** Skip subscription if true */
  skip?: boolean;
  /** Additional Apollo subscription options */
  options?: Omit<SubscriptionHookOptions, 'variables' | 'skip'>;
}
/**
 * Query current interface statistics
 *
 * Returns a snapshot of interface traffic counters (TX/RX bytes/packets/errors/drops)
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useInterfaceStatsQuery({
 *   routerId: 'router-1',
 *   interfaceId: 'ether1',
 * });
 *
 * if (data?.interface?.statistics) {
 *   console.log('TX:', formatBytes(BigInt(data.interface.statistics.txBytes)));
 *   console.log('RX:', formatBytes(BigInt(data.interface.statistics.rxBytes)));
 * }
 * ```
 */
export declare function useInterfaceStatsQuery({
  routerId,
  interfaceId,
  options,
}: UseInterfaceStatsQueryOptions): import('@apollo/client').InteropQueryResult<
  any,
  import('@apollo/client').OperationVariables
>;
/**
 * Query historical interface statistics with time-series data
 *
 * Returns aggregated data points for bandwidth charting over a time range
 *
 * @example
 * ```tsx
 * const timeRange = {
 *   start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24h ago
 *   end: new Date().toISOString(),
 * };
 *
 * const { data, loading } = useInterfaceStatsHistoryQuery({
 *   routerId: 'router-1',
 *   interfaceId: 'ether1',
 *   timeRange,
 *   interval: '5m',
 * });
 *
 * const chartData = data?.interfaceStatsHistory?.dataPoints || [];
 * ```
 */
export declare function useInterfaceStatsHistoryQuery({
  routerId,
  interfaceId,
  timeRange,
  interval,
  skip,
  options,
}: UseInterfaceStatsHistoryOptions): import('@apollo/client').InteropQueryResult<
  {
    interfaceStatsHistory: InterfaceStatsHistory;
  },
  QueryInterfaceStatsHistoryArgs
>;
/**
 * Subscribe to real-time interface statistics updates
 *
 * Receives periodic statistics updates at the configured interval via WebSocket subscription
 *
 * @example
 * ```tsx
 * const { data } = useInterfaceStatsSubscription({
 *   routerId: 'router-1',
 *   interfaceId: 'ether1',
 *   interval: '5s', // Update every 5 seconds
 * });
 *
 * useEffect(() => {
 *   if (data?.interfaceStatsUpdated) {
 *     console.log('Stats updated:', data.interfaceStatsUpdated);
 *   }
 * }, [data]);
 * ```
 */
export declare function useInterfaceStatsSubscription({
  routerId,
  interfaceId,
  interval,
  skip,
  options,
}: UseInterfaceStatsSubscriptionOptions): {
  restart: () => void;
  loading: boolean;
  data?:
    | {
        interfaceStatsUpdated: InterfaceStats;
      }
    | undefined;
  error?: import('@apollo/client').ApolloError;
  variables?: SubscriptionInterfaceStatsUpdatedArgs | undefined;
};
//# sourceMappingURL=interface-stats.d.ts.map
