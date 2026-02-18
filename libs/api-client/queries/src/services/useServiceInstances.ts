import { useQuery, useSubscription } from '@apollo/client';
import { useEffect } from 'react';
import {
  GET_SERVICE_INSTANCES,
  GET_SERVICE_INSTANCE,
  SUBSCRIBE_INSTANCE_STATUS_CHANGED,
} from './services.graphql';

/**
 * Service instance lifecycle status
 */
export type ServiceStatus =
  | 'INSTALLING'
  | 'INSTALLED'
  | 'STARTING'
  | 'RUNNING'
  | 'STOPPING'
  | 'STOPPED'
  | 'FAILED'
  | 'DELETING';

/**
 * Service instance running on a router
 */
export interface ServiceInstance {
  id: string;
  featureID: string;
  instanceName: string;
  routerID: string;
  status: ServiceStatus;
  vlanID?: number;
  bindIP?: string;
  ports: number[];
  config?: unknown;
  binaryPath?: string;
  binaryVersion?: string;
  binaryChecksum?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook to fetch and subscribe to service instances for a router
 *
 * Provides real-time updates via GraphQL subscription for instance status changes.
 * Falls back to polling if subscription is not available.
 *
 * @param routerId - Router ID to fetch instances for
 * @param status - Optional status filter (INSTALLING, RUNNING, STOPPED, etc.)
 * @param featureID - Optional feature ID filter (e.g., 'tor', 'sing-box')
 * @returns Service instances data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * // Get all instances
 * const { instances, loading, error } = useServiceInstances('router-1');
 *
 * // Get only running instances
 * const { instances } = useServiceInstances('router-1', 'RUNNING');
 *
 * // Get all Tor instances
 * const { instances } = useServiceInstances('router-1', undefined, 'tor');
 * ```
 */
export function useServiceInstances(
  routerId: string,
  status?: ServiceStatus,
  featureID?: string
) {
  // Query for initial data
  const { data, loading, error, refetch } = useQuery(GET_SERVICE_INSTANCES, {
    variables: { routerID: routerId, status, featureID },
    pollInterval: 0, // Rely on subscription for updates
    skip: !routerId, // Skip if no routerId provided
    fetchPolicy: 'cache-and-network', // Show cached data while fetching fresh data
  });

  // Subscribe to real-time status changes
  // Apollo Client automatically updates cache via normalized cache
  const { data: subData, error: subError } = useSubscription(
    SUBSCRIBE_INSTANCE_STATUS_CHANGED,
    {
      variables: { routerID: routerId },
      skip: !routerId,
    }
  );

  // Fallback polling if subscription fails or not connected
  useEffect(() => {
    if (!subData && !loading && !subError) {
      // Only poll if subscription is not working
      const interval = setInterval(() => {
        refetch();
      }, 10000); // Poll every 10 seconds as fallback

      return () => clearInterval(interval);
    }
    return undefined;
  }, [subData, loading, subError, refetch]);

  const instances = (data?.serviceInstances ?? []) as ServiceInstance[];

  return {
    instances,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch a specific service instance by ID
 *
 * Useful for detail views and instance management screens.
 * Automatically subscribes to status changes for this specific instance.
 *
 * @param routerId - Router ID
 * @param instanceId - Instance ID to fetch
 * @returns Instance data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { instance, loading, error } = useServiceInstance('router-1', 'instance-123');
 *
 * if (instance) {
 *   console.log(instance.status, instance.featureID);
 * }
 * ```
 */
export function useServiceInstance(routerId: string, instanceId: string) {
  const { data, loading, error, refetch } = useQuery(GET_SERVICE_INSTANCE, {
    variables: { routerID: routerId, instanceID: instanceId },
    skip: !routerId || !instanceId, // Skip if no IDs provided
    fetchPolicy: 'cache-and-network',
  });

  // Subscribe to status changes for real-time updates
  const { data: subData } = useSubscription(SUBSCRIBE_INSTANCE_STATUS_CHANGED, {
    variables: { routerID: routerId },
    skip: !routerId,
    // Apollo will update the cache automatically when this instance changes
  });

  const instance = data?.serviceInstance as ServiceInstance | undefined;

  return {
    instance,
    loading,
    error,
    refetch,
  };
}
