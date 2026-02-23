/**
 * useCompositeResource Hook
 *
 * Hook for fetching composite resources that aggregate multiple sub-resources.
 * Supports WireGuard peers, LAN networks with DHCP, and other composite patterns.
 *
 * @module @nasnet/api-client/queries/resources
 */
import { type ApolloError } from '@apollo/client';
import type { Resource, CompositeResource } from '@nasnet/core/types';
/**
 * Options for composite resource hook.
 */
export interface UseCompositeResourceOptions {
    /** Depth of sub-resource fetching (1-3) */
    depth?: 1 | 2 | 3;
    /** Include runtime data for sub-resources */
    includeRuntime?: boolean;
    /** Skip query execution */
    skip?: boolean;
    /** Fetch policy */
    fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only';
}
/**
 * Aggregated status for composite resource.
 */
export interface CompositeStatus {
    /** Number of active sub-resources */
    activeCount: number;
    /** Number of sub-resources with errors */
    errorCount: number;
    /** Number of degraded sub-resources */
    degradedCount: number;
    /** Overall health based on sub-resources */
    overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
    /** Whether all sub-resources are running */
    allRunning: boolean;
    /** Whether any sub-resource has drift */
    hasDrift: boolean;
}
/**
 * Return type for composite resource hook.
 */
export interface UseCompositeResourceResult<TConfig = unknown> {
    /** The composite resource */
    resource: CompositeResource<any> | undefined;
    /** Aggregated status from sub-resources */
    status: CompositeStatus;
    /** Loading state */
    loading: boolean;
    /** Error state */
    error: ApolloError | undefined;
    /** Refetch function */
    refetch: () => Promise<void>;
    /** Get a specific sub-resource by uuid */
    getSubResource: (uuid: string) => Resource | undefined;
    /** Get sub-resources by type */
    getSubResourcesByType: (type: string) => Resource[];
}
/**
 * Hook for fetching composite resources with sub-resources.
 *
 * @example
 * ```tsx
 * // Fetch LAN network with DHCP server and leases
 * const { resource, status, getSubResourcesByType } = useCompositeResource(uuid, {
 *   depth: 2,
 * });
 *
 * const dhcpServer = getSubResourcesByType('dhcp-server')[0];
 * const leases = getSubResourcesByType('dhcp-lease');
 *
 * // Check overall health
 * if (status.overallHealth === 'CRITICAL') {
 *   return <CriticalAlert />;
 * }
 * ```
 */
export declare function useCompositeResource(uuid: string | undefined, options?: UseCompositeResourceOptions): UseCompositeResourceResult;
/**
 * Hook for fetching WireGuard server with all clients.
 */
export declare function useWireGuardServerWithClients(serverUuid: string | undefined, options?: Omit<UseCompositeResourceOptions, 'depth'>): {
    clients: Resource<unknown>[];
    clientCount: number;
    activeClients: number;
    /** The composite resource */
    resource: CompositeResource<any> | undefined;
    /** Aggregated status from sub-resources */
    status: CompositeStatus;
    /** Loading state */
    loading: boolean;
    /** Error state */
    error: ApolloError | undefined;
    /** Refetch function */
    refetch: () => Promise<void>;
    /** Get a specific sub-resource by uuid */
    getSubResource: (uuid: string) => Resource | undefined;
    /** Get sub-resources by type */
    getSubResourcesByType: (type: string) => Resource[];
};
/**
 * Hook for fetching LAN network with DHCP configuration.
 */
export declare function useLANNetworkWithDHCP(networkUuid: string | undefined, options?: Omit<UseCompositeResourceOptions, 'depth'>): {
    dhcpServer: Resource<unknown>;
    dhcpLeases: Resource<unknown>[];
    leaseCount: number;
    activeLeases: number;
    /** The composite resource */
    resource: CompositeResource<any> | undefined;
    /** Aggregated status from sub-resources */
    status: CompositeStatus;
    /** Loading state */
    loading: boolean;
    /** Error state */
    error: ApolloError | undefined;
    /** Refetch function */
    refetch: () => Promise<void>;
    /** Get a specific sub-resource by uuid */
    getSubResource: (uuid: string) => Resource | undefined;
    /** Get sub-resources by type */
    getSubResourcesByType: (type: string) => Resource[];
};
/**
 * Hook for fetching bridge with all member interfaces.
 */
export declare function useBridgeWithMembers(bridgeUuid: string | undefined, options?: Omit<UseCompositeResourceOptions, 'depth'>): {
    members: Resource<unknown>[];
    memberCount: number;
    /** The composite resource */
    resource: CompositeResource<any> | undefined;
    /** Aggregated status from sub-resources */
    status: CompositeStatus;
    /** Loading state */
    loading: boolean;
    /** Error state */
    error: ApolloError | undefined;
    /** Refetch function */
    refetch: () => Promise<void>;
    /** Get a specific sub-resource by uuid */
    getSubResource: (uuid: string) => Resource | undefined;
    /** Get sub-resources by type */
    getSubResourcesByType: (type: string) => Resource[];
};
/**
 * Hook for fetching feature with all its resources.
 */
export declare function useFeatureWithResources(featureUuid: string | undefined, options?: Omit<UseCompositeResourceOptions, 'depth'>): {
    resourceCount: any;
    /** The composite resource */
    resource: CompositeResource<any> | undefined;
    /** Aggregated status from sub-resources */
    status: CompositeStatus;
    /** Loading state */
    loading: boolean;
    /** Error state */
    error: ApolloError | undefined;
    /** Refetch function */
    refetch: () => Promise<void>;
    /** Get a specific sub-resource by uuid */
    getSubResource: (uuid: string) => Resource | undefined;
    /** Get sub-resources by type */
    getSubResourcesByType: (type: string) => Resource[];
};
export default useCompositeResource;
//# sourceMappingURL=useCompositeResource.d.ts.map