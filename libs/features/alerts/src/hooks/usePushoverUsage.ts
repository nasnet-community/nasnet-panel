import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

/**
 * GraphQL query for Pushover API usage statistics
 */
const PUSHOVER_USAGE_QUERY = gql`
  query PushoverUsage {
    pushoverUsage {
      used
      remaining
      limit
      resetAt
    }
  }
`;

export interface PushoverUsageData {
  used: number;
  remaining: number;
  limit: number;
  resetAt: string;
}

export interface UsePushoverUsageResult {
  usage: PushoverUsageData | undefined;
  loading: boolean;
  error: Error | undefined;
  percentUsed: number;
  isNearLimit: boolean;
  isExceeded: boolean;
  refetch: () => void;
}

/**
 * Hook for fetching and monitoring Pushover API usage statistics.
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
export function usePushoverUsage(): UsePushoverUsageResult {
  const { data, loading, error, refetch } = useQuery<{ pushoverUsage: PushoverUsageData }>(
    PUSHOVER_USAGE_QUERY,
    {
      fetchPolicy: 'cache-and-network',
      // Poll every 5 minutes to keep usage data fresh
      pollInterval: 5 * 60 * 1000,
    }
  );

  const usage = data?.pushoverUsage;

  // Calculate percentage used
  const percentUsed = usage ? Math.round((usage.used / usage.limit) * 100) : 0;

  // Flag if usage is approaching the limit (80% threshold)
  const isNearLimit = percentUsed >= 80;

  // Flag if usage is completely exhausted
  const isExceeded = usage?.remaining === 0;

  return {
    usage,
    loading,
    error: error as Error | undefined,
    percentUsed,
    isNearLimit,
    isExceeded,
    refetch: () => {
      refetch();
    },
  };
}
