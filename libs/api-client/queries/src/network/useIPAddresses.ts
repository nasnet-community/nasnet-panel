import { useQuery, useSubscription } from '@apollo/client';
import { useEffect } from 'react';
import {
  GET_IP_ADDRESSES,
  GET_IP_ADDRESS,
  CHECK_IP_CONFLICT,
  GET_IP_ADDRESS_DEPENDENCIES,
  IP_ADDRESS_CHANGED,
} from './ip-address-queries.graphql';

/**
 * Hook to fetch and subscribe to the IP address list
 * Provides real-time updates via GraphQL subscription
 *
 * @param routerId - Router ID to fetch IP addresses for
 * @param interfaceId - Optional interface ID to filter by specific interface
 * @returns IP address list data, loading state, error, and refetch function
 */
export function useIPAddresses(routerId: string, interfaceId?: string) {
  // Query for initial data
  const { data, loading, error, refetch } = useQuery(GET_IP_ADDRESSES, {
    variables: { routerId, interfaceId },
    pollInterval: 0, // Rely on subscription for updates
    skip: !routerId, // Skip if no routerId provided
  });

  // Subscribe to real-time updates
  // Apollo Client automatically updates cache via normalized cache
  const { data: subData, error: subError } = useSubscription(IP_ADDRESS_CHANGED, {
    variables: { routerId },
    skip: !routerId,
  });

  // Fallback polling if subscription fails or not connected
  useEffect(() => {
    if (!subData && !loading && !subError) {
      // Only poll if subscription is not working
      const interval = setInterval(() => {
        refetch();
      }, 10000); // Poll every 10 seconds as fallback (per story requirements)

      return () => clearInterval(interval);
    }
  }, [subData, loading, subError, refetch]);

  // Extract IP addresses from response
  const ipAddresses = data?.ipAddresses ?? [];

  return {
    ipAddresses,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch a single IP address by ID
 * Useful for detail views
 *
 * @param routerId - Router ID
 * @param ipAddressId - IP address ID to fetch
 * @returns IP address data, loading state, error, and refetch function
 */
export function useIPAddressDetail(routerId: string, ipAddressId: string) {
  const { data, loading, error, refetch } = useQuery(GET_IP_ADDRESS, {
    variables: { routerId, id: ipAddressId },
    skip: !ipAddressId || !routerId, // Skip if no ID provided
  });

  // Subscribe to IP address changes for real-time updates
  const { data: subData } = useSubscription(IP_ADDRESS_CHANGED, {
    variables: { routerId },
    skip: !routerId,
  });

  return {
    ipAddress: data?.ipAddress,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to check for IP address conflicts
 * Used during form validation to prevent duplicate IPs and subnet overlaps
 *
 * @param routerId - Router ID
 * @param address - CIDR address to check (e.g., "192.168.1.1/24")
 * @param interfaceId - Optional interface ID for the address
 * @param excludeId - Optional IP address ID to exclude from conflict check (for updates)
 * @param enabled - Whether to run the query (default: true)
 * @returns Conflict result, loading state, error
 */
export function useCheckIPConflict(
  routerId: string,
  address: string,
  interfaceId?: string,
  excludeId?: string,
  enabled: boolean = true
) {
  const { data, loading, error } = useQuery(CHECK_IP_CONFLICT, {
    variables: { routerId, address, interfaceId, excludeId },
    skip: !routerId || !address || !enabled,
    // Disable caching for conflict checks to ensure fresh validation
    fetchPolicy: 'network-only',
  });

  return {
    conflictResult: data?.checkIpConflict,
    hasConflict: data?.checkIpConflict?.hasConflict ?? false,
    loading,
    error,
  };
}

/**
 * Hook to fetch dependencies for an IP address
 * Used before deletion to show warning about dependent resources
 *
 * @param routerId - Router ID
 * @param ipAddressId - IP address ID to check dependencies for
 * @param enabled - Whether to run the query (default: false, lazy-loaded)
 * @returns Dependency information, loading state, error
 */
export function useIPAddressDependencies(
  routerId: string,
  ipAddressId: string,
  enabled: boolean = false
) {
  const { data, loading, error, refetch } = useQuery(GET_IP_ADDRESS_DEPENDENCIES, {
    variables: { routerId, id: ipAddressId },
    skip: !routerId || !ipAddressId || !enabled,
    // Disable caching to ensure fresh dependency check
    fetchPolicy: 'network-only',
  });

  return {
    dependencies: data?.ipAddressDependencies,
    canDelete: data?.ipAddressDependencies?.canDelete ?? true,
    loading,
    error,
    refetch,
  };
}
