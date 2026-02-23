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

import { useQuery, useMutation, gql } from '@apollo/client';
import { useMemo, useState, useCallback } from 'react';

import type {
  PortAllocation,
  PortProtocol,
  PortAvailability,
  OrphanedPort,
  CheckPortAvailabilityInput,
  CleanupOrphanedPortsInput,
  OrphanCleanupPayload,
} from '@nasnet/api-client/generated';

// ============================================
// GRAPHQL QUERIES
// ============================================

/**
 * Query to fetch all port allocations with optional filters
 */
export const GET_PORT_ALLOCATIONS = gql`
  query GetPortAllocations(
    $routerID: ID
    $protocol: PortProtocol
    $serviceType: String
  ) {
    portAllocations(
      routerID: $routerID
      protocol: $protocol
      serviceType: $serviceType
    ) {
      id
      routerID
      port
      protocol
      instanceID
      serviceType
      notes
      allocatedAt
    }
  }
`;

/**
 * Query to check if a specific port is available
 */
export const CHECK_PORT_AVAILABILITY = gql`
  query CheckPortAvailability($input: CheckPortAvailabilityInput!) {
    isPortAvailable(input: $input) {
      port
      protocol
      available
      reason
    }
  }
`;

/**
 * Query to detect orphaned port allocations
 */
export const DETECT_ORPHANED_PORTS = gql`
  query DetectOrphanedPorts($routerID: ID) {
    detectOrphanedPorts(routerID: $routerID) {
      allocation {
        id
        routerID
        port
        protocol
        instanceID
        serviceType
        notes
        allocatedAt
      }
      reason
    }
  }
`;

/**
 * Mutation to clean up orphaned port allocations
 */
export const CLEANUP_ORPHANED_PORTS = gql`
  mutation CleanupOrphanedPorts($input: CleanupOrphanedPortsInput!) {
    cleanupOrphanedPorts(input: $input) {
      cleanedCount
      deletedAllocationIDs
      errors {
        field
        message
      }
    }
  }
`;

// ============================================
// TYPES
// ============================================

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
  // Data
  allocations: PortAllocation[];
  groupedByService: Record<string, PortAllocation[]>;

  // Filtering
  filters: PortAllocationFilters;
  setFilters: (filters: PortAllocationFilters) => void;

  // Sorting
  sort: PortAllocationSort;
  setSort: (sort: PortAllocationSort) => void;

  // Computed
  filteredAllocations: PortAllocation[];
  sortedAllocations: PortAllocation[];

  // State
  loading: boolean;
  error: Error | undefined;
  refetch: () => Promise<void>;
}

// ============================================
// HOOKS
// ============================================

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
export function usePortAllocations(
  routerId: string,
  initialFilters: PortAllocationFilters = {},
  initialSort: PortAllocationSort = { field: 'port', direction: 'asc' }
): UsePortAllocationsReturn {
  // State for filters and sort
  const [filters, setFilters] = useState<PortAllocationFilters>(initialFilters);
  const [sort, setSort] = useState<PortAllocationSort>(initialSort);

  // Query for port allocations
  const { data, loading, error, refetch } = useQuery(GET_PORT_ALLOCATIONS, {
    variables: {
      routerID: routerId,
      protocol: filters.protocol === 'all' ? undefined : filters.protocol,
      serviceType: filters.serviceType === 'all' ? undefined : filters.serviceType,
    },
    skip: !routerId,
    fetchPolicy: 'cache-and-network',
  });

  const allocations = (data?.portAllocations || []) as PortAllocation[];

  // Filter allocations based on current filters
  const filteredAllocations = useMemo(() => {
    let result = [...allocations];

    // Apply protocol filter
    if (filters.protocol && filters.protocol !== 'all') {
      result = result.filter((a) => a.protocol === filters.protocol);
    }

    // Apply service type filter
    if (filters.serviceType && filters.serviceType !== 'all') {
      result = result.filter((a) => a.serviceType === filters.serviceType);
    }

    return result;
  }, [allocations, filters]);

  // Sort allocations based on current sort configuration
  const sortedAllocations = useMemo(() => {
    const result = [...filteredAllocations];

    result.sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'port':
          comparison = a.port - b.port;
          break;
        case 'serviceType':
          comparison = a.serviceType.localeCompare(b.serviceType);
          break;
        case 'allocatedAt':
          comparison =
            new Date(a.allocatedAt).getTime() - new Date(b.allocatedAt).getTime();
          break;
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [filteredAllocations, sort]);

  // Group allocations by service type
  const groupedByService = useMemo(() => {
    const groups: Record<string, PortAllocation[]> = {};

    sortedAllocations.forEach((allocation) => {
      if (!groups[allocation.serviceType]) {
        groups[allocation.serviceType] = [];
      }
      groups[allocation.serviceType].push(allocation);
    });

    return groups;
  }, [sortedAllocations]);

  // Refetch wrapper
  const handleRefetch = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    allocations,
    groupedByService,
    filters,
    setFilters,
    sort,
    setSort,
    filteredAllocations,
    sortedAllocations,
    loading,
    error: error as Error | undefined,
    refetch: handleRefetch,
  };
}

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
export function useCheckPortAvailability() {
  const [checkAvailability, { loading, error }] = useMutation(
    CHECK_PORT_AVAILABILITY
  );

  const checkPort = useCallback(
    async (input: CheckPortAvailabilityInput): Promise<PortAvailability> => {
      const result = await checkAvailability({
        variables: { input },
      });

      return result.data?.isPortAvailable as PortAvailability;
    },
    [checkAvailability]
  );

  return {
    checkPort,
    loading,
    error: error as Error | undefined,
  };
}

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
export function useOrphanedPorts(routerId?: string) {
  // Query for orphaned ports
  const { data, loading: detectLoading, error: detectError, refetch } = useQuery(
    DETECT_ORPHANED_PORTS,
    {
      variables: { routerID: routerId },
      fetchPolicy: 'cache-and-network',
    }
  );

  // Mutation for cleanup
  const [cleanupMutation, { loading: cleanupLoading, error: cleanupError }] =
    useMutation(CLEANUP_ORPHANED_PORTS);

  const orphanedPorts = (data?.detectOrphanedPorts || []) as OrphanedPort[];

  const cleanupOrphans = useCallback(async () => {
    const result = await cleanupMutation({
      variables: {
        input: { routerID: routerId },
      },
    });

    // Refetch to update list
    await refetch();

    return result.data?.cleanupOrphanedPorts as OrphanCleanupPayload;
  }, [cleanupMutation, routerId, refetch]);

  return {
    orphanedPorts,
    cleanupOrphans,
    loading: detectLoading || cleanupLoading,
    error: (detectError || cleanupError) as Error | undefined,
    refetch,
  };
}
