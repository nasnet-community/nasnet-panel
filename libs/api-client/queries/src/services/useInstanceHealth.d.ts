import type { ServiceInstanceHealth } from '@nasnet/api-client/generated/types';
/**
 * GraphQL query for instance health status
 */
export declare const INSTANCE_HEALTH_QUERY: import("graphql").DocumentNode;
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
export declare function useInstanceHealth(routerID: string, instanceID: string, options?: {
    pollInterval?: number;
    skip?: boolean;
}): import("@apollo/client").InteropQueryResult<{
    instanceHealth: ServiceInstanceHealth | null;
}, {
    routerID: string;
    instanceID: string;
}>;
//# sourceMappingURL=useInstanceHealth.d.ts.map