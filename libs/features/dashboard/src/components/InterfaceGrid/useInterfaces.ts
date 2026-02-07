/**
 * useInterfaces Hook
 *
 * Fetches and subscribes to interface data with hybrid real-time strategy.
 * Uses GraphQL subscription as primary source, polling as fallback.
 */

import { useQuery, useSubscription } from '@apollo/client';
import { useMemo } from 'react';
import { GET_INTERFACES, INTERFACE_STATUS_SUBSCRIPTION } from './queries';
import { sortInterfacesByPriority } from './utils';
import type { InterfaceGridData } from './types';

interface UseInterfacesProps {
  /** Device ID to fetch interfaces for */
  deviceId: string;
}

interface UseInterfacesReturn {
  /** Sorted array of interface data */
  interfaces: InterfaceGridData[];
  /** Whether data is loading (only true on initial load) */
  isLoading: boolean;
  /** Error object if query or subscription failed */
  error: Error | null;
  /** Function to manually refetch data */
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and subscribe to interface data.
 * Uses GraphQL subscription as primary, polling as fallback.
 *
 * @example
 * function InterfaceList({ deviceId }: { deviceId: string }) {
 *   const { interfaces, isLoading, error, refetch } = useInterfaces({ deviceId });
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Error message={error.message} onRetry={refetch} />;
 *
 *   return interfaces.map(iface => <InterfaceCard key={iface.id} data={iface} />);
 * }
 */
export function useInterfaces({
  deviceId,
}: UseInterfacesProps): UseInterfacesReturn {
  // Primary: Real-time subscription for status changes
  const { data: subscriptionData, error: subError } = useSubscription(
    INTERFACE_STATUS_SUBSCRIPTION,
    {
      variables: { deviceId },
    }
  );

  // Determine if subscription is active (has received data)
  const hasSubscriptionData = !!subscriptionData?.interfaceStatusChanged;

  // Fallback: Poll every 2s if subscription not working
  const {
    data: queryData,
    loading,
    error: queryError,
    refetch,
  } = useQuery(GET_INTERFACES, {
    variables: { deviceId },
    // Only poll if subscription is not active
    pollInterval: hasSubscriptionData ? 0 : 2000,
  });

  // Prefer subscription data over query data
  const rawInterfaces = useMemo(() => {
    if (hasSubscriptionData) {
      return subscriptionData.interfaceStatusChanged;
    }
    return queryData?.device?.interfaces ?? [];
  }, [hasSubscriptionData, subscriptionData, queryData]);

  // Sort interfaces by type priority (ethernet first, then bridge, wireless, etc.)
  const interfaces = useMemo(
    () => sortInterfacesByPriority(rawInterfaces),
    [rawInterfaces]
  );

  // Combine errors (subscription error takes precedence)
  const error = subError || queryError || null;

  return {
    interfaces,
    // Only show loading state on initial load (not while polling/subscribed)
    isLoading: loading && !hasSubscriptionData && interfaces.length === 0,
    error,
    refetch: async () => {
      await refetch();
    },
  };
}
