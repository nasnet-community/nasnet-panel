/**
 * Port Registry API Client Hook
 *
 * Provides React hooks for querying and managing port allocations.
 * Enables centralized port conflict detection and management across service instances.
 *
 * @example
 * ```tsx
 * // Get all port allocations for a router
 * const { allocations, loading } = usePortAllocations('router-1');
 *
 * // Filter by protocol
 * const { allocations } = usePortAllocations('router-1', { protocol: 'TCP' });
 *
 * // Check port availability
 * const { checkPort } = useCheckPortAvailability();
 * const result = await checkPort({ routerID: 'router-1', port: 9050, protocol: 'TCP' });
 * ```
 */
import type { PortAllocation, PortProtocol, PortAvailability, OrphanedPort, CheckPortAvailabilityInput, OrphanCleanupPayload } from '@nasnet/api-client/generated';
/**
 * Query to fetch all port allocations with optional filters
 */
export declare const GET_PORT_ALLOCATIONS: import("graphql").DocumentNode;
/**
 * Query to check if a specific port is available
 */
export declare const CHECK_PORT_AVAILABILITY: import("graphql").DocumentNode;
/**
 * Query to detect orphaned port allocations
 */
export declare const DETECT_ORPHANED_PORTS: import("graphql").DocumentNode;
/**
 * Mutation to clean up orphaned port allocations
 */
export declare const CLEANUP_ORPHANED_PORTS: import("graphql").DocumentNode;
/**
 * Filters for port allocation queries
 */
export interface PortAllocationFilters {
    /** Filter by transport protocol */
    protocol?: PortProtocol | 'all';
    /** Filter by service type */
    serviceType?: string | 'all';
}
/**
 * Sort configuration for port allocations
 */
export interface PortAllocationSort {
    field: 'port' | 'serviceType' | 'allocatedAt';
    direction: 'asc' | 'desc';
}
/**
 * Return type for usePortAllocations hook
 */
export interface UsePortAllocationsReturn {
    allocations: PortAllocation[];
    groupedByService: Record<string, PortAllocation[]>;
    filters: PortAllocationFilters;
    setFilters: (filters: PortAllocationFilters) => void;
    sort: PortAllocationSort;
    setSort: (sort: PortAllocationSort) => void;
    filteredAllocations: PortAllocation[];
    sortedAllocations: PortAllocation[];
    loading: boolean;
    error: Error | undefined;
    refetch: () => Promise<void>;
}
/**
 * Hook to fetch and manage port allocations for a router
 *
 * Provides filtering, sorting, and grouping capabilities for port allocations.
 * Automatically updates when allocations change via Apollo cache.
 *
 * @param routerId - Router ID to fetch allocations for
 * @param initialFilters - Initial filter configuration
 * @param initialSort - Initial sort configuration
 * @returns Port allocations data, filters, sort, and state
 *
 * @example
 * ```tsx
 * const { allocations, filteredAllocations, loading } = usePortAllocations('router-1');
 *
 * // With filters
 * const { allocations, setFilters } = usePortAllocations('router-1', {
 *   protocol: 'TCP',
 *   serviceType: 'tor'
 * });
 * ```
 */
export declare function usePortAllocations(routerId: string, initialFilters?: PortAllocationFilters, initialSort?: PortAllocationSort): UsePortAllocationsReturn;
/**
 * Hook to check port availability
 *
 * @returns Mutation function to check if a port is available
 *
 * @example
 * ```tsx
 * const { checkPort, loading } = useCheckPortAvailability();
 *
 * const result = await checkPort({
 *   routerID: 'router-1',
 *   port: 9050,
 *   protocol: 'TCP'
 * });
 *
 * if (result.available) {
 *   console.log('Port is available!');
 * } else {
 *   console.log('Port unavailable:', result.reason);
 * }
 * ```
 */
export declare function useCheckPortAvailability(): {
    checkPort: (input: CheckPortAvailabilityInput) => Promise<PortAvailability>;
    loading: boolean;
    error: Error | undefined;
};
/**
 * Hook to detect and clean up orphaned port allocations
 *
 * @param routerId - Optional router ID to scope cleanup (cleans all if not provided)
 * @returns Queries and mutations for orphan management
 *
 * @example
 * ```tsx
 * const { orphanedPorts, cleanupOrphans, loading } = useOrphanedPorts('router-1');
 *
 * // Detect orphans
 * console.log('Found', orphanedPorts.length, 'orphaned allocations');
 *
 * // Clean up orphans
 * const result = await cleanupOrphans();
 * console.log('Cleaned up', result.cleanedCount, 'allocations');
 * ```
 */
export declare function useOrphanedPorts(routerId?: string): {
    orphanedPorts: OrphanedPort[];
    cleanupOrphans: () => Promise<OrphanCleanupPayload>;
    loading: boolean;
    error: Error | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
//# sourceMappingURL=usePortRegistry.d.ts.map