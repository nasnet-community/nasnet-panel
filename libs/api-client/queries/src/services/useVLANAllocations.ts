import { useQuery } from '@apollo/client';
import { GET_VLAN_ALLOCATIONS } from './vlan.graphql';

/**
 * VLAN allocation lifecycle status
 */
export type VLANAllocationStatus = 'ALLOCATED' | 'RELEASING' | 'RELEASED';

/**
 * Service instance minimal data (related entity)
 */
export interface ServiceInstanceRef {
  id: string;
  featureID: string;
  instanceName: string;
  status: string;
}

/**
 * Router minimal data (related entity)
 */
export interface RouterRef {
  id: string;
  address: string;
  name?: string;
}

/**
 * VLAN allocation for a service instance
 */
export interface VLANAllocation {
  id: string;
  routerID: string;
  vlanID: number;
  instanceID: string;
  serviceType: string;
  subnet?: string;
  status: VLANAllocationStatus;
  allocatedAt: string;
  releasedAt?: string;
  router: RouterRef;
  serviceInstance: ServiceInstanceRef;
}

/**
 * Hook to fetch VLAN allocations with optional filtering
 *
 * Provides a list of VLAN allocations for monitoring and diagnostics.
 * Supports filtering by router ID and allocation status.
 *
 * @param routerID - Optional router ID filter
 * @param status - Optional allocation status filter (ALLOCATED, RELEASING, RELEASED)
 * @returns VLAN allocations data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * // Get all allocations for a router
 * const { allocations, loading } = useVLANAllocations('router-123');
 *
 * // Get only active allocations
 * const { allocations } = useVLANAllocations('router-123', 'ALLOCATED');
 *
 * // Get all allocations across all routers
 * const { allocations } = useVLANAllocations();
 * ```
 */
export function useVLANAllocations(routerID?: string, status?: VLANAllocationStatus) {
  const { data, loading, error, refetch } = useQuery(GET_VLAN_ALLOCATIONS, {
    variables: { routerID, status },
    fetchPolicy: 'cache-and-network', // Show cached data while fetching fresh data
  });

  const allocations = (data?.vlanAllocations ?? []) as VLANAllocation[];

  return {
    allocations,
    loading,
    error,
    refetch,
  };
}
