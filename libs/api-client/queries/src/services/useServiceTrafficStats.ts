/**
 * Service Traffic Statistics API Client Hooks
 * NAS-8.8: Implement Traffic Statistics and Quota Management
 *
 * Provides Apollo Client hooks for:
 * - Querying service traffic statistics with historical data
 * - Per-device bandwidth breakdown
 * - Traffic quota management (set/reset)
 * - Real-time traffic updates via subscriptions
 */

import {
  useQuery,
  useMutation,
  useSubscription,
  type QueryHookOptions,
  type MutationHookOptions,
  type SubscriptionHookOptions,
} from '@apollo/client';
import type {
  ServiceTrafficStats,
  DeviceTrafficBreakdown,
  TrafficQuotaPayload,
  SetTrafficQuotaInput,
  QueryServiceTrafficStatsArgs,
  MutationSetTrafficQuotaArgs,
  MutationResetTrafficQuotaArgs,
  SubscriptionServiceTrafficUpdatedArgs,
} from '@nasnet/api-client/generated';
import {
  GET_SERVICE_TRAFFIC_STATS,
  GET_SERVICE_DEVICE_BREAKDOWN,
  SET_TRAFFIC_QUOTA,
  RESET_TRAFFIC_QUOTA,
  SUBSCRIBE_SERVICE_TRAFFIC_UPDATED,
} from './traffic-stats.graphql';

// =============================================================================
// TypeScript Types for Hook Options
// =============================================================================

/**
 * Options for useServiceTrafficStats hook
 */
export interface UseServiceTrafficStatsOptions {
  /** Router ID */
  routerID: string;
  /** Service instance ID */
  instanceID: string;
  /** Number of hours of historical data to fetch (default: 24) */
  historyHours?: number;
  /** Skip query execution if true */
  skip?: boolean;
  /** Additional Apollo query options */
  options?: Omit<QueryHookOptions, 'variables' | 'skip'>;
}

/**
 * Options for useServiceDeviceBreakdown hook
 */
export interface UseServiceDeviceBreakdownOptions {
  /** Router ID */
  routerID: string;
  /** Service instance ID */
  instanceID: string;
  /** Skip query execution if true */
  skip?: boolean;
  /** Additional Apollo query options */
  options?: Omit<QueryHookOptions, 'variables' | 'skip'>;
}

/**
 * Options for useServiceTrafficSubscription hook
 */
export interface UseServiceTrafficSubscriptionOptions {
  /** Router ID */
  routerID: string;
  /** Service instance ID */
  instanceID: string;
  /** Skip subscription if true */
  skip?: boolean;
  /** Additional Apollo subscription options */
  options?: Omit<SubscriptionHookOptions, 'variables' | 'skip'>;
}

/**
 * Options for useSetTrafficQuota mutation hook
 */
export type UseSetTrafficQuotaOptions = Omit<
  MutationHookOptions<
    { setTrafficQuota: TrafficQuotaPayload },
    MutationSetTrafficQuotaArgs
  >,
  'mutation'
>;

/**
 * Options for useResetTrafficQuota mutation hook
 */
export type UseResetTrafficQuotaOptions = Omit<
  MutationHookOptions<
    { resetTrafficQuota: TrafficQuotaPayload },
    MutationResetTrafficQuotaArgs
  >,
  'mutation'
>;

// =============================================================================
// Apollo Client Hooks
// =============================================================================

/**
 * Query service traffic statistics with historical data
 *
 * Returns total traffic counters, current period usage, historical data points,
 * per-device breakdown, and quota information.
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useServiceTrafficStats({
 *   routerID: 'router-1',
 *   instanceID: 'xray-instance-1',
 *   historyHours: 24, // Last 24 hours of data
 * });
 *
 * if (data?.serviceTrafficStats) {
 *   const stats = data.serviceTrafficStats;
 *   console.log('Total upload:', stats.totalUploadBytes);
 *   console.log('Total download:', stats.totalDownloadBytes);
 *   console.log('History points:', stats.history.length);
 *
 *   // Check quota status
 *   if (stats.quota?.limitReached) {
 *     console.warn('Traffic quota exceeded!');
 *   }
 * }
 * ```
 */
export function useServiceTrafficStats({
  routerID,
  instanceID,
  historyHours,
  skip = false,
  options,
}: UseServiceTrafficStatsOptions) {
  return useQuery<
    { serviceTrafficStats: ServiceTrafficStats },
    QueryServiceTrafficStatsArgs
  >(GET_SERVICE_TRAFFIC_STATS, {
    variables: { routerID, instanceID, historyHours },
    skip,
    // Cache for 5 seconds to avoid excessive polling
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    ...options,
  });
}

/**
 * Query per-device traffic breakdown for a service instance
 *
 * Returns detailed bandwidth consumption per connected device,
 * useful for identifying heavy users and traffic patterns.
 *
 * @example
 * ```tsx
 * const { data, loading, refetch } = useServiceDeviceBreakdown({
 *   routerID: 'router-1',
 *   instanceID: 'xray-instance-1',
 * });
 *
 * if (data?.serviceDeviceBreakdown) {
 *   data.serviceDeviceBreakdown.forEach(device => {
 *     console.log(`${device.deviceName || device.ipAddress}: ${device.totalBytes} bytes`);
 *     console.log(`  Upload: ${device.uploadBytes}, Download: ${device.downloadBytes}`);
 *     console.log(`  Percentage of total: ${device.percentOfTotal}%`);
 *   });
 * }
 * ```
 */
export function useServiceDeviceBreakdown({
  routerID,
  instanceID,
  skip = false,
  options,
}: UseServiceDeviceBreakdownOptions) {
  return useQuery<
    { serviceDeviceBreakdown: ReadonlyArray<DeviceTrafficBreakdown> },
    { routerID: string; instanceID: string }
  >(GET_SERVICE_DEVICE_BREAKDOWN, {
    variables: { routerID, instanceID },
    skip,
    fetchPolicy: 'cache-and-network',
    ...options,
  });
}

/**
 * Set traffic quota for a service instance
 *
 * Configures bandwidth limits with automated warnings and enforcement actions.
 * Supports daily, weekly, and monthly quota periods with configurable actions.
 *
 * @example
 * ```tsx
 * const [setQuota, { loading, error }] = useSetTrafficQuota();
 *
 * const handleSetQuota = async () => {
 *   const result = await setQuota({
 *     variables: {
 *       input: {
 *         routerID: 'router-1',
 *         instanceID: 'xray-instance-1',
 *         period: 'MONTHLY',
 *         limitBytes: 1024 * 1024 * 1024 * 100, // 100 GB
 *         warningThreshold: 80, // Warn at 80%
 *         action: 'ALERT', // Just alert, don't stop service
 *       },
 *     },
 *   });
 *
 *   if (result.data?.setTrafficQuota.quota) {
 *     console.log('Quota set successfully');
 *   }
 * };
 * ```
 */
export function useSetTrafficQuota(options?: UseSetTrafficQuotaOptions) {
  return useMutation<
    { setTrafficQuota: TrafficQuotaPayload },
    MutationSetTrafficQuotaArgs
  >(SET_TRAFFIC_QUOTA, {
    // Refetch traffic stats after setting quota
    refetchQueries: ['GetServiceTrafficStats'],
    awaitRefetchQueries: true,
    ...options,
  });
}

/**
 * Reset/remove traffic quota for a service instance
 *
 * Removes all quota restrictions and resets counters for a fresh start.
 *
 * @example
 * ```tsx
 * const [resetQuota, { loading, error }] = useResetTrafficQuota();
 *
 * const handleResetQuota = async () => {
 *   const result = await resetQuota({
 *     variables: {
 *       routerID: 'router-1',
 *       instanceID: 'xray-instance-1',
 *     },
 *   });
 *
 *   if (result.data?.resetTrafficQuota.errors?.length === 0) {
 *     console.log('Quota reset successfully');
 *   }
 * };
 * ```
 */
export function useResetTrafficQuota(options?: UseResetTrafficQuotaOptions) {
  return useMutation<
    { resetTrafficQuota: TrafficQuotaPayload },
    MutationResetTrafficQuotaArgs
  >(RESET_TRAFFIC_QUOTA, {
    // Refetch traffic stats after resetting quota
    refetchQueries: ['GetServiceTrafficStats'],
    awaitRefetchQueries: true,
    ...options,
  });
}

/**
 * Subscribe to real-time service traffic statistics updates
 *
 * Receives periodic updates when traffic counters change via WebSocket subscription.
 * Updates include total traffic, current period usage, historical data, and quota status.
 *
 * @example
 * ```tsx
 * const { data, loading } = useServiceTrafficSubscription({
 *   routerID: 'router-1',
 *   instanceID: 'xray-instance-1',
 * });
 *
 * useEffect(() => {
 *   if (data?.serviceTrafficUpdated) {
 *     const stats = data.serviceTrafficUpdated;
 *     console.log('Traffic updated:', {
 *       upload: stats.totalUploadBytes,
 *       download: stats.totalDownloadBytes,
 *       lastUpdated: stats.lastUpdated,
 *     });
 *
 *     // Check quota warnings
 *     if (stats.quota?.warningTriggered) {
 *       toast.warning(`Traffic quota at ${stats.quota.usagePercent}%`);
 *     }
 *   }
 * }, [data]);
 * ```
 */
export function useServiceTrafficSubscription({
  routerID,
  instanceID,
  skip = false,
  options,
}: UseServiceTrafficSubscriptionOptions) {
  return useSubscription<
    { serviceTrafficUpdated: ServiceTrafficStats },
    SubscriptionServiceTrafficUpdatedArgs
  >(SUBSCRIBE_SERVICE_TRAFFIC_UPDATED, {
    variables: { routerID, instanceID },
    skip,
    // Apollo Client automatically updates the normalized cache
    onData: ({ client, data }) => {
      if (data.data?.serviceTrafficUpdated) {
        const stats = data.data.serviceTrafficUpdated;
        // Cache is updated automatically via normalized cache
        // Additional side effects can be added here if needed (e.g., notifications)

        // Log quota warnings
        if (stats.quota?.warningTriggered && !stats.quota.limitReached) {
          console.warn(
            `Traffic quota warning: ${stats.quota.usagePercent.toFixed(1)}% used (instance: ${instanceID})`
          );
        }

        // Log quota limit reached
        if (stats.quota?.limitReached) {
          console.error(
            `Traffic quota exceeded for instance ${instanceID}. Action: ${stats.quota.action}`
          );
        }
      }
    },
    ...options,
  });
}

/**
 * Combined hook for comprehensive traffic monitoring
 *
 * Combines query and subscription for full traffic statistics coverage.
 * Useful for dashboards that need both initial data and real-time updates.
 *
 * @example
 * ```tsx
 * const {
 *   stats,
 *   loading,
 *   error,
 *   refetch,
 * } = useTrafficMonitoring({
 *   routerID: 'router-1',
 *   instanceID: 'xray-instance-1',
 *   historyHours: 24,
 * });
 *
 * // Initial data from query
 * if (stats) {
 *   <TrafficChart data={stats.history} />
 *   <DeviceBreakdownTable devices={stats.deviceBreakdown} />
 *   <QuotaProgress quota={stats.quota} />
 * }
 *
 * // Real-time updates from subscription (stats automatically updated)
 * ```
 */
export function useTrafficMonitoring(options: UseServiceTrafficStatsOptions) {
  const {
    data: queryData,
    loading: queryLoading,
    error: queryError,
    refetch,
  } = useServiceTrafficStats(options);

  const {
    data: subscriptionData,
    loading: subscriptionLoading,
    error: subscriptionError,
  } = useServiceTrafficSubscription({
    routerID: options.routerID,
    instanceID: options.instanceID,
    skip: options.skip,
  });

  // Prefer subscription data if available (most recent), fallback to query data
  const stats =
    subscriptionData?.serviceTrafficUpdated || queryData?.serviceTrafficStats;

  return {
    stats,
    loading: queryLoading || subscriptionLoading,
    error: queryError || subscriptionError,
    refetch,
  };
}
