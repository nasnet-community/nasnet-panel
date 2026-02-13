import { useQuery } from '@apollo/client';
import { GET_DNS_CACHE_STATS } from './dns-diagnostics.graphql';

/**
 * Hook to fetch DNS cache statistics with automatic polling
 * Provides cache metrics including entries, size, hit rate, and top domains
 *
 * @param deviceId - Device/router ID to fetch cache stats for
 * @param enabled - Whether to enable polling (default: true)
 * @returns Cache stats data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useDnsCacheStats('router-1');
 *
 * // Disable polling when not on screen
 * const { data } = useDnsCacheStats('router-1', false);
 * ```
 */
export function useDnsCacheStats(deviceId: string, enabled: boolean = true) {
  const { data, loading, error, refetch } = useQuery(GET_DNS_CACHE_STATS, {
    variables: { deviceId },
    pollInterval: enabled ? 30000 : 0, // Poll every 30 seconds when enabled
    skip: !deviceId || !enabled, // Skip if no deviceId or disabled
    fetchPolicy: 'cache-and-network', // Show cached data while fetching
  });

  return {
    cacheStats: data?.dnsCacheStats,
    loading,
    error,
    refetch,
  };
}
