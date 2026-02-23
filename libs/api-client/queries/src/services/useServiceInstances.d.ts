/**
 * Service instance lifecycle status
 */
export type ServiceStatus = 'INSTALLING' | 'INSTALLED' | 'STARTING' | 'RUNNING' | 'STOPPING' | 'STOPPED' | 'FAILED' | 'DELETING';
/**
 * Service instance running on a router
 */
export interface ServiceInstance {
    id: string;
    featureID: string;
    instanceName: string;
    routerID: string;
    status: ServiceStatus;
    vlanID?: number;
    bindIP?: string;
    ports: number[];
    config?: unknown;
    binaryPath?: string;
    binaryVersion?: string;
    binaryChecksum?: string;
    createdAt: string;
    updatedAt: string;
}
/**
 * Hook to fetch and subscribe to service instances for a router
 *
 * Provides real-time updates via GraphQL subscription for instance status changes.
 * Falls back to polling if subscription is not available.
 *
 * @param routerId - Router ID to fetch instances for
 * @param status - Optional status filter (INSTALLING, RUNNING, STOPPED, etc.)
 * @param featureID - Optional feature ID filter (e.g., 'tor', 'sing-box')
 * @returns Service instances data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * // Get all instances
 * const { instances, loading, error } = useServiceInstances('router-1');
 *
 * // Get only running instances
 * const { instances } = useServiceInstances('router-1', 'RUNNING');
 *
 * // Get all Tor instances
 * const { instances } = useServiceInstances('router-1', undefined, 'tor');
 * ```
 */
export declare function useServiceInstances(routerId: string, status?: ServiceStatus, featureID?: string): {
    instances: ServiceInstance[];
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
/**
 * Hook to fetch a specific service instance by ID
 *
 * Useful for detail views and instance management screens.
 * Automatically subscribes to status changes for this specific instance.
 *
 * @param routerId - Router ID
 * @param instanceId - Instance ID to fetch
 * @returns Instance data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { instance, loading, error } = useServiceInstance('router-1', 'instance-123');
 *
 * if (instance) {
 *   console.log(instance.status, instance.featureID);
 * }
 * ```
 */
export declare function useServiceInstance(routerId: string, instanceId: string): {
    instance: ServiceInstance | undefined;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
//# sourceMappingURL=useServiceInstances.d.ts.map