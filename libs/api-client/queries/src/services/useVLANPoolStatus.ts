import { useQuery } from '@apollo/client';
import { GET_VLAN_POOL_STATUS } from './vlan.graphql';

/**
 * VLAN pool status for a router
 */
export interface VLANPoolStatus {
  routerID: string;
  totalVLANs: number;
  allocatedVLANs: number;
  availableVLANs: number;
  utilization: number;
  shouldWarn: boolean;
  poolStart: number;
  poolEnd: number;
}

/**
 * Hook to fetch VLAN pool status with automatic polling
 *
 * Monitors VLAN pool utilization and provides warning flags when capacity
 * is running low (>80% utilization). Automatically polls every 30 seconds
 * to keep data fresh for monitoring dashboards.
 *
 * @param routerID - Router ID to check pool status for (required)
 * @param pollInterval - Polling interval in milliseconds (default: 30000ms = 30s)
 * @returns Pool status data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { poolStatus, loading, error } = useVLANPoolStatus('router-123');
 *
 * if (poolStatus?.shouldWarn) {
 *   console.warn(`VLAN pool at ${poolStatus.utilization}% capacity`);
 * }
 *
 * // Custom polling interval (every 60 seconds)
 * const { poolStatus } = useVLANPoolStatus('router-123', 60000);
 *
 * // Disable polling
 * const { poolStatus } = useVLANPoolStatus('router-123', 0);
 * ```
 */
export function useVLANPoolStatus(routerID: string, pollInterval = 30000) {
  const { data, loading, error, refetch } = useQuery(GET_VLAN_POOL_STATUS, {
    variables: { routerID },
    skip: !routerID, // Skip if no routerID provided
    fetchPolicy: 'cache-and-network', // Show cached data while fetching fresh data
    pollInterval, // Poll every 30 seconds by default
  });

  const poolStatus = data?.vlanPoolStatus as VLANPoolStatus | undefined;

  return {
    poolStatus,
    loading,
    error,
    refetch,
  };
}
