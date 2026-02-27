/**
 * Hook for triggering immediate digest delivery
 * NAS-18.11: Alert Digest Mode
 *
 * Triggers immediate delivery of queued alerts for a channel, bypassing the
 * scheduled interval. Useful for manual digest delivery or testing digest
 * configuration. Automatically refetches queue count and history after delivery.
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * function TriggerDigestButton({ channelId }: { channelId: string }) {
 *   const [triggerDigest, { loading, error, data }] = useTriggerDigestNow();
 *
 *   const handleClick = async () => {
 *     try {
 *       const result = await triggerDigest({
 *         variables: { channelId },
 *       });
 *
 *       if (result.data?.triggerDigestNow) {
 *         toast.success(
 *           `Digest sent: ${result.data.triggerDigestNow.alertCount} alerts delivered`
 *         );
 *       }
 *     } catch (err) {
 *       toast.error('Failed to trigger digest');
 *     }
 *   };
 *
 *   return (
 *     <Button
 *       onClick={handleClick}
 *       disabled={loading}
 *       variant="outline"
 *     >
 *       {loading ? 'Sending...' : 'Send Digest Now'}
 *     </Button>
 *   );
 * }
 * ```
 */
export declare function useTriggerDigestNow(): import('@apollo/client').MutationTuple<
  any,
  import('@apollo/client').OperationVariables,
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
//# sourceMappingURL=useTriggerDigestNow.d.ts.map
