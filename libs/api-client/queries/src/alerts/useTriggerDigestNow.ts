import { useMutation } from '@apollo/client';
import { TRIGGER_DIGEST_NOW, GET_DIGEST_QUEUE_COUNT, GET_DIGEST_HISTORY } from './digest.graphql';

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
export function useTriggerDigestNow() {
  return useMutation(TRIGGER_DIGEST_NOW, {
    // Refetch queue count after triggering to show updated count
    refetchQueries: [
      { query: GET_DIGEST_QUEUE_COUNT },
      { query: GET_DIGEST_HISTORY },
    ],
    // Await refetch queries to ensure UI updates after delivery
    awaitRefetchQueries: true,
  });
}
