import { useQuery, gql } from '@apollo/client';
import type { ServiceInstanceHealth } from '@nasnet/api-client/generated/types';

/**
 * GraphQL query for instance health status
 */
export const INSTANCE_HEALTH_QUERY = gql`
  query InstanceHealth($routerID: ID!, $instanceID: ID!) {
    instanceHealth(routerID: $routerID, instanceID: $instanceID) {
      status
      processAlive
      connectionStatus
      latencyMs
      lastHealthy
      consecutiveFails
      uptimeSeconds
    }
  }
`;

/**
 * Hook to query current health status for a service instance
 *
 * @param routerID - Router ID
 * @param instanceID - Service instance ID
 * @param options - Apollo query options
 * @returns Query result with health status
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useInstanceHealth(routerId, instanceId);
 *
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return <ServiceHealthBadge health={data?.instanceHealth} />;
 * ```
 */
export function useInstanceHealth(
  routerID: string,
  instanceID: string,
  options?: {
    pollInterval?: number;
    skip?: boolean;
  }
) {
  return useQuery<
    { instanceHealth: ServiceInstanceHealth | null },
    { routerID: string; instanceID: string }
  >(INSTANCE_HEALTH_QUERY, {
    variables: { routerID, instanceID },
    pollInterval: options?.pollInterval ?? 30000, // Poll every 30s as fallback
    skip: options?.skip,
    // Don't cache aggressively - health status changes frequently
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
}
