import { useQuery } from '@apollo/client';
import { GET_DIGEST_QUEUE_COUNT } from './digest.graphql';

/**
 * Hook for fetching the number of alerts queued for digest delivery
 * NAS-18.11: Alert Digest Mode
 *
 * Returns the count of alerts waiting in the digest queue for a specific channel.
 * Useful for displaying queue status in UI and monitoring digest accumulation.
 *
 * @param channelId - Notification channel ID to check queue for
 * @param options - Apollo query options (polling, skip, etc.)
 * @returns Query result with queue count
 *
 * @example
 * ```tsx
 * function DigestStatusBadge({ channelId }: { channelId: string }) {
 *   const { data, loading, error } = useDigestQueueCount(channelId, {
 *     pollInterval: 30000, // Poll every 30 seconds
 *   });
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <ErrorBadge error={error} />;
 *
 *   return (
 *     <Badge variant={data?.digestQueueCount > 0 ? 'warning' : 'default'}>
 *       {data?.digestQueueCount || 0} queued
 *     </Badge>
 *   );
 * }
 * ```
 */
export function useDigestQueueCount(
  channelId: string,
  options?: {
    pollInterval?: number;
    skip?: boolean;
  }
) {
  return useQuery(GET_DIGEST_QUEUE_COUNT, {
    variables: { channelId },
    // Only fetch if channelId is provided
    skip: !channelId || options?.skip,
    // Optional polling interval for real-time updates
    pollInterval: options?.pollInterval,
    // Don't cache for too long - queue count changes frequently
    fetchPolicy: 'cache-and-network',
  });
}
