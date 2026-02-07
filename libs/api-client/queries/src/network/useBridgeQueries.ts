import { useQuery, useSubscription } from '@apollo/client';
import { useEffect } from 'react';
import {
  GET_BRIDGES,
  GET_BRIDGE,
  GET_BRIDGE_PORTS,
  GET_BRIDGE_VLANS,
  GET_AVAILABLE_INTERFACES,
  BRIDGE_STP_STATUS_CHANGED,
  BRIDGE_PORTS_CHANGED,
} from './bridge-queries.graphql';

/**
 * Hook to fetch the list of bridges on a router
 * Provides real-time updates for bridge configuration changes
 *
 * @param routerId - Router ID to fetch bridges for
 * @returns Bridge list data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { bridges, loading, error, refetch } = useBridges('router-1');
 * ```
 */
export function useBridges(routerId: string) {
  const { data, loading, error, refetch } = useQuery(GET_BRIDGES, {
    variables: { routerId },
    skip: !routerId,
    pollInterval: 10000, // Poll every 10 seconds for changes
  });

  return {
    bridges: data?.bridges ?? [],
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch detailed information for a single bridge
 * Includes ports, VLANs, and STP status
 * Subscribes to real-time STP status and port changes
 *
 * @param uuid - Bridge UUID to fetch
 * @returns Bridge data with real-time updates, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { bridge, loading, error, refetch } = useBridgeDetail('bridge-uuid');
 * ```
 */
export function useBridgeDetail(uuid: string) {
  const { data, loading, error, refetch } = useQuery(GET_BRIDGE, {
    variables: { uuid },
    skip: !uuid,
  });

  // Subscribe to STP status changes
  const { data: stpData } = useSubscription(BRIDGE_STP_STATUS_CHANGED, {
    variables: { bridgeId: uuid },
    skip: !uuid || !data?.bridge,
  });

  // Subscribe to port changes
  const { data: portsData } = useSubscription(BRIDGE_PORTS_CHANGED, {
    variables: { bridgeId: uuid },
    skip: !uuid || !data?.bridge,
  });

  // Merge subscription data with query data
  const bridge = data?.bridge
    ? {
        ...data.bridge,
        stpStatus: stpData?.bridgeStpStatusChanged || data.bridge.stpStatus,
        ports: portsData?.bridgePortsChanged || data.bridge.ports,
      }
    : undefined;

  return {
    bridge,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch bridge ports for a specific bridge
 * Subscribes to real-time port changes
 *
 * @param bridgeId - Bridge ID to fetch ports for
 * @returns Bridge ports data with real-time updates, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { ports, loading, error, refetch } = useBridgePorts('bridge-uuid');
 * ```
 */
export function useBridgePorts(bridgeId: string) {
  const { data, loading, error, refetch } = useQuery(GET_BRIDGE_PORTS, {
    variables: { bridgeId },
    skip: !bridgeId,
  });

  // Subscribe to port changes
  const { data: subData } = useSubscription(BRIDGE_PORTS_CHANGED, {
    variables: { bridgeId },
    skip: !bridgeId,
  });

  // Use subscription data if available, otherwise use query data
  const ports = subData?.bridgePortsChanged || data?.bridgePorts || [];

  return {
    ports,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch bridge VLANs for a specific bridge
 *
 * @param bridgeId - Bridge ID to fetch VLANs for
 * @returns Bridge VLANs data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { vlans, loading, error, refetch } = useBridgeVlans('bridge-uuid');
 * ```
 */
export function useBridgeVlans(bridgeId: string) {
  const { data, loading, error, refetch } = useQuery(GET_BRIDGE_VLANS, {
    variables: { bridgeId },
    skip: !bridgeId,
  });

  return {
    vlans: data?.bridgeVlans ?? [],
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch interfaces available to add to a bridge
 * Returns interfaces that are not currently members of any bridge
 *
 * @param routerId - Router ID to fetch available interfaces for
 * @returns Available interfaces data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { interfaces, loading, error, refetch } = useAvailableInterfacesForBridge('router-1');
 * ```
 */
export function useAvailableInterfacesForBridge(routerId: string) {
  const { data, loading, error, refetch } = useQuery(GET_AVAILABLE_INTERFACES, {
    variables: { routerId },
    skip: !routerId,
  });

  return {
    interfaces: data?.availableInterfacesForBridge ?? [],
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to subscribe to STP status changes for a bridge
 * Provides real-time STP topology updates
 *
 * @param bridgeId - Bridge ID to subscribe to
 * @returns STP status data with real-time updates and error state
 *
 * @example
 * ```tsx
 * const { stpStatus, error } = useBridgeStpStatus('bridge-uuid');
 * ```
 */
export function useBridgeStpStatus(bridgeId: string) {
  const { data, error } = useSubscription(BRIDGE_STP_STATUS_CHANGED, {
    variables: { bridgeId },
    skip: !bridgeId,
  });

  return {
    stpStatus: data?.bridgeStpStatusChanged,
    error,
  };
}
