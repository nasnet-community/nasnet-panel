import type { ServiceInstanceHealth } from '@nasnet/api-client/generated/types';
/**
 * GraphQL subscription for real-time health status changes
 */
export declare const INSTANCE_HEALTH_CHANGED_SUBSCRIPTION: import('graphql').DocumentNode;
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
export declare function useInstanceHealthSubscription(
  routerID: string,
  instanceID?: string,
  options?: {
    skip?: boolean;
    onData?: (data: ServiceInstanceHealth) => void;
  }
): {
  restart: () => void;
  loading: boolean;
  data?:
    | {
        instanceHealthChanged: ServiceInstanceHealth;
      }
    | undefined;
  error?: import('@apollo/client').ApolloError;
  variables?:
    | {
        routerID: string;
        instanceID?: string;
      }
    | undefined;
};
//# sourceMappingURL=useInstanceHealthSubscription.d.ts.map
