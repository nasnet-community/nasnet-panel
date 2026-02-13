import { useMutation } from '@apollo/client';
import { FLUSH_DNS_CACHE, GET_DNS_CACHE_STATS } from './dns-diagnostics.graphql';

/**
 * Hook for flushing DNS cache
 * Clears all cached DNS entries and returns before/after statistics
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [flushCache, { loading, data, error }] = useFlushDnsCache();
 *
 * // Flush cache with confirmation
 * const handleFlush = async () => {
 *   await flushCache({
 *     variables: {
 *       deviceId: 'router-1',
 *     },
 *   });
 *   // Show toast notification in calling component
 * };
 * ```
 */
export function useFlushDnsCache() {
  return useMutation(FLUSH_DNS_CACHE, {
    // Refetch cache stats after flushing to show updated state
    refetchQueries: [{ query: GET_DNS_CACHE_STATS }],
    // Note: Toast notifications should be handled by the calling component
  });
}
