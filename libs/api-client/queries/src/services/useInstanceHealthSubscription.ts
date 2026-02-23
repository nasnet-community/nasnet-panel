import { useSubscription, gql } from '@apollo/client';
import type { ServiceInstanceHealth } from '@nasnet/api-client/generated/types';

/**
 * GraphQL subscription for real-time health status changes
 */
export const INSTANCE_HEALTH_CHANGED_SUBSCRIPTION = gql`
  subscription InstanceHealthChanged($routerID: ID!, $instanceID: ID) {
    instanceHealthChanged(routerID: $routerID, instanceID: $instanceID) {
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
 * Hook to subscribe to real-time health status changes
 *
 * @param routerID - Router ID to filter events
 * @param instanceID - Optional instance ID to filter specific instance (null = all instances)
 * @param options - Apollo subscription options
 * @returns Subscription result with health status updates
 *
 * @example
 * ```tsx
 * // Subscribe to specific instance
 * const { data, loading } = useInstanceHealthSubscription(routerId, instanceId);
 *
 * // Subscribe to all instances on router
 * const { data, loading } = useInstanceHealthSubscription(routerId);
 *
 * return (
 *   <ServiceHealthBadge
 *     health={data?.instanceHealthChanged}
 *     animate
 *   />
 * );
 * ```
 */
export function useInstanceHealthSubscription(
  routerID: string,
  instanceID?: string,
  options?: {
    skip?: boolean;
    onData?: (data: ServiceInstanceHealth) => void;
  }
) {
  const result = useSubscription<
    { instanceHealthChanged: ServiceInstanceHealth },
    { routerID: string; instanceID?: string }
  >(INSTANCE_HEALTH_CHANGED_SUBSCRIPTION, {
    variables: { routerID, instanceID },
    skip: options?.skip,
    onData: (result) => {
      if (result.data?.data?.instanceHealthChanged && options?.onData) {
        options.onData(result.data.data.instanceHealthChanged);
      }
    },
  });

  return result;
}
