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
export declare function useDigestQueueCount(
  channelId: string,
  options?: {
    pollInterval?: number;
    skip?: boolean;
  }
): import('@apollo/client').InteropQueryResult<any, import('@apollo/client').OperationVariables>;
//# sourceMappingURL=useDigestQueueCount.d.ts.map
