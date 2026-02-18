import { useQuery, useSubscription } from '@apollo/client';
import { useEffect } from 'react';
import { GET_INTERFACES, GET_INTERFACE, INTERFACE_STATUS_CHANGED } from './queries.graphql';
import type { InterfaceType } from '@nasnet/api-client/generated';

/**
 * Hook to fetch and subscribe to the interface list
 * Provides real-time updates via GraphQL subscription
 *
 * @param routerId - Router ID to fetch interfaces for
 * @param type - Optional interface type filter
 * @returns Interface list data, loading state, error, and refetch function
 */
export function useInterfaceList(routerId: string, type?: InterfaceType) {
  // Query for initial data
  const { data, loading, error, refetch } = useQuery(GET_INTERFACES, {
    variables: { routerId, type },
    pollInterval: 0, // Rely on subscription for updates
    skip: !routerId, // Skip if no routerId provided
  });

  // Subscribe to real-time updates
  // Apollo Client automatically updates cache via normalized cache
  const { data: subData, error: subError } = useSubscription(INTERFACE_STATUS_CHANGED, {
    variables: { routerId },
    skip: !routerId,
  });

  // Fallback polling if subscription fails or not connected
  useEffect(() => {
    if (!subData && !loading && !subError) {
      // Only poll if subscription is not working
      const interval = setInterval(() => {
        refetch();
      }, 5000); // Poll every 5 seconds as fallback

      return () => clearInterval(interval);
    }
    return undefined;
  }, [subData, loading, subError, refetch]);

  // Extract interfaces from edges
  const interfaces = data?.interfaces?.edges?.map((edge: any) => edge.node) ?? [];
  const totalCount = data?.interfaces?.totalCount ?? 0;
  const pageInfo = data?.interfaces?.pageInfo;

  return {
    interfaces,
    totalCount,
    pageInfo,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch a single interface by ID
 * Useful for detail views
 *
 * @param routerId - Router ID
 * @param interfaceId - Interface ID to fetch
 * @returns Interface data, loading state, error, and refetch function
 */
export function useInterfaceDetail(routerId: string, interfaceId: string) {
  const { data, loading, error, refetch } = useQuery(GET_INTERFACE, {
    variables: { routerId, id: interfaceId },
    skip: !interfaceId || !routerId, // Skip if no ID provided
  });

  // Subscribe to status changes for this specific interface
  const { data: subData } = useSubscription(INTERFACE_STATUS_CHANGED, {
    variables: { routerId, interfaceId },
    skip: !interfaceId || !routerId,
  });

  return {
    interface: data?.interface,
    loading,
    error,
    refetch,
  };
}
