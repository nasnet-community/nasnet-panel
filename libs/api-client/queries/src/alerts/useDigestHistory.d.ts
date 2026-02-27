/**
 * Hook for fetching digest delivery history
 * NAS-18.11: Alert Digest Mode
 *
 * Returns historical digest deliveries for a channel, including delivery timestamps,
 * alert counts, and time periods covered. Useful for audit logs and monitoring
 * digest delivery patterns.
 *
 * @param channelId - Notification channel ID to get history for
 * @param options - Query options including limit and Apollo options
 * @returns Query result with digest history
 *
 * @example
 * ```tsx
 * function DigestHistoryTable({ channelId }: { channelId: string }) {
 *   const { data, loading, error, refetch } = useDigestHistory(channelId, {
 *     limit: 20,
 *     pollInterval: 60000, // Refresh every minute
 *   });
 *
 *   if (loading) return <TableSkeleton />;
 *   if (error) return <ErrorState error={error} />;
 *
 *   return (
 *     <Table>
 *       <TableHeader>
 *         <TableRow>
 *           <TableHead>Delivered At</TableHead>
 *           <TableHead>Alert Count</TableHead>
 *           <TableHead>Period</TableHead>
 *         </TableRow>
 *       </TableHeader>
 *       <TableBody>
 *         {data?.digestHistory.map((summary) => (
 *           <TableRow key={summary.id}>
 *             <TableCell>{formatDate(summary.deliveredAt)}</TableCell>
 *             <TableCell>{summary.alertCount}</TableCell>
 *             <TableCell>{summary.period}</TableCell>
 *           </TableRow>
 *         ))}
 *       </TableBody>
 *     </Table>
 *   );
 * }
 * ```
 */
export declare function useDigestHistory(
  channelId: string,
  options?: {
    limit?: number;
    pollInterval?: number;
    skip?: boolean;
  }
): import('@apollo/client').InteropQueryResult<any, import('@apollo/client').OperationVariables>;
//# sourceMappingURL=useDigestHistory.d.ts.map
