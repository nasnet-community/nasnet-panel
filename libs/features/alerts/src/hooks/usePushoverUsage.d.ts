import { type ApolloError } from '@apollo/client';
export interface PushoverUsageData {
    used: number;
    remaining: number;
    limit: number;
    resetAt: string;
}
export interface UsePushoverUsageResult {
    usage: PushoverUsageData | undefined;
    loading: boolean;
    error: ApolloError | undefined;
    percentUsed: number;
    isNearLimit: boolean;
    isExceeded: boolean;
    refetch: () => void;
}
/**
 * Hook for fetching and monitoring Pushover API usage statistics.
 *
 * @description Fetches current usage data (used, remaining, limit, resetAt)
 * with computed metrics (percentUsed, isNearLimit, isExceeded) and automatic
 * refresh via cache-and-network policy with 5-minute polling interval.
 *
 * Provides:
 * - Current usage data (used, remaining, limit, resetAt)
 * - Computed metrics (percentUsed, isNearLimit, isExceeded)
 * - Automatic refresh with cache-and-network policy
 *
 * @example
 * ```tsx
 * function PushoverSettings() {
 *   const { usage, percentUsed, isNearLimit, loading } = usePushoverUsage();
 *
 *   if (loading) return <Spinner />;
 *
 *   return (
 *     <div>
 *       <Progress value={percentUsed} />
 *       {isNearLimit && <Alert>Approaching monthly limit!</Alert>}
 *       <Text>{usage.remaining} messages remaining</Text>
 *     </div>
 *   );
 * }
 * ```
 */
export declare function usePushoverUsage(): UsePushoverUsageResult;
//# sourceMappingURL=usePushoverUsage.d.ts.map