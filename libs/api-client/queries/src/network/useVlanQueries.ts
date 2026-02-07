import { useQuery, useSubscription } from '@apollo/client';
import { useEffect } from 'react';
import {
  GET_VLANS,
  GET_VLAN,
  CHECK_VLAN_ID_AVAILABLE,
  VLAN_CHANGED,
} from './vlan-queries.graphql';

/**
 * Hook to fetch and subscribe to the VLAN list
 * Provides real-time updates via GraphQL subscription
 *
 * @param routerId - Router ID to fetch VLANs for
 * @param filter - Optional filter (parent interface, VLAN ID range, name search)
 * @returns VLAN list data, loading state, error, and refetch function
 */
export function useVlans(
  routerId: string,
  filter?: {
    parentInterface?: string;
    vlanIdRange?: { min?: number; max?: number };
    nameContains?: string;
  }
) {
  // Query for initial data
  const { data, loading, error, refetch } = useQuery(GET_VLANS, {
    variables: { routerId, filter },
    pollInterval: 0, // Rely on subscription for updates
    skip: !routerId, // Skip if no routerId provided
  });

  // Subscribe to real-time updates
  // Apollo Client automatically updates cache via normalized cache
  const { data: subData, error: subError } = useSubscription(VLAN_CHANGED, {
    variables: { routerId },
    skip: !routerId,
  });

  // Fallback polling if subscription fails or not connected
  useEffect(() => {
    if (!subData && !loading && !subError) {
      // Only poll if subscription is not working
      const interval = setInterval(() => {
        refetch();
      }, 10000); // Poll every 10 seconds as fallback

      return () => clearInterval(interval);
    }
  }, [subData, loading, subError, refetch]);

  // Extract VLANs from response
  const vlans = data?.vlans ?? [];

  return {
    vlans,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch a single VLAN by ID
 * Useful for detail views and edit forms
 *
 * @param routerId - Router ID
 * @param vlanId - VLAN ID to fetch
 * @returns VLAN data, loading state, error, and refetch function
 */
export function useVlan(routerId: string, vlanId: string) {
  const { data, loading, error, refetch } = useQuery(GET_VLAN, {
    variables: { routerId, id: vlanId },
    skip: !vlanId || !routerId, // Skip if no ID provided
  });

  // Subscribe to VLAN changes for real-time updates
  const { data: subData } = useSubscription(VLAN_CHANGED, {
    variables: { routerId },
    skip: !routerId,
  });

  return {
    vlan: data?.vlan,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to check if a VLAN ID is available on a specific parent interface
 * Used during form validation to prevent duplicate VLAN IDs (AC3)
 *
 * @param routerId - Router ID
 * @param vlanId - VLAN ID to check (1-4094)
 * @param parentInterfaceId - Parent interface ID (bridge or ethernet)
 * @param excludeId - Optional VLAN ID to exclude from check (for updates)
 * @param enabled - Whether to run the query (default: false, lazy-loaded)
 * @returns Availability result, loading state, error
 */
export function useCheckVlanIdAvailable(
  routerId: string,
  vlanId: number,
  parentInterfaceId: string,
  excludeId?: string,
  enabled: boolean = false
) {
  const { data, loading, error, refetch } = useQuery(CHECK_VLAN_ID_AVAILABLE, {
    variables: { routerId, vlanId, parentInterfaceId, excludeId },
    skip: !routerId || !vlanId || !parentInterfaceId || !enabled,
    // Disable caching for availability checks to ensure fresh validation
    fetchPolicy: 'network-only',
  });

  return {
    isAvailable: data?.checkVlanIdAvailable ?? true,
    loading,
    error,
    refetch,
  };
}
