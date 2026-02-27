/**
 * useRouterHealth Hook
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * Apollo Client query hook for fetching router health data.
 * Implements cache-and-network fetch policy for optimal UX.
 *
 * @see Story 4.4: Apollo Client Setup
 */

import { useQuery, gql } from '@apollo/client';

// TODO (Task 4): Import generated types from GraphQL codegen
// import { GetRouterHealthSummaryQuery, GetRouterHealthSummaryQueryVariables } from '@nasnet/api-client/generated';

// GraphQL query (will be replaced by codegen)
const GET_ROUTER_HEALTH_SUMMARY = gql`
  query GetRouterHealthSummary($routerId: ID!) {
    router(id: $routerId) {
      uuid
      configuration {
        name
      }
      platform {
        model
        version
        uptime
      }
      runtime {
        status
        cpuUsage
        memoryUsage
        activeConnections
        lastUpdate
        temperature
      }
    }
  }
`;

export interface UseRouterHealthOptions {
  /** Router UUID to fetch */
  routerId: string;
  /** Polling interval in ms (0 = disabled) */
  pollInterval?: number;
  /** Skip query execution */
  skip?: boolean;
}

/**
 * Fetch router health data with Apollo Client
 *
 * @description Fetches router health data with cache-and-network strategy.
 * Returns cached data immediately (if available) and fetches fresh data in background.
 *
 * Fetch policy: cache-and-network
 * - Returns cached data immediately (if available)
 * - Fetches fresh data in background
 * - Updates when fresh data arrives
 *
 * @example
 * ```tsx
 * function RouterHealthCard({ routerId }: Props) {
 *   const { data, loading, error, refetch } = useRouterHealth({ routerId });
 *
 *   if (loading && !data) return <Skeleton />;
 *   if (error) return <ErrorState error={error} />;
 *
 *   return <Card>...</Card>;
 * }
 * ```
 */
export function useRouterHealth({
  routerId,
  pollInterval = 0,
  skip = false,
}: UseRouterHealthOptions) {
  return useQuery(GET_ROUTER_HEALTH_SUMMARY, {
    variables: { routerId },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    pollInterval,
    skip,
    context: {
      headers: {
        'X-Router-Id': routerId,
      },
    },
  });
}
