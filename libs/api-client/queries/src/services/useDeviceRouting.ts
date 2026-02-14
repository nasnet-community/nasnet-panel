/**
 * Device-to-Service Routing API Client Hooks (NAS-8.3)
 *
 * React hooks for managing device routing assignments to service instances.
 * Devices can be routed through services (Tor, Xray, etc.) using Policy-Based Routing.
 *
 * ## Usage
 *
 * ### Fetching the Routing Matrix
 * ```tsx
 * import { useDeviceRoutingMatrix } from '@nasnet/api-client/queries/services';
 *
 * const { matrix, loading, error } = useDeviceRoutingMatrix('router-1');
 *
 * if (matrix) {
 *   console.log(`${matrix.devices.length} devices discovered`);
 *   console.log(`${matrix.routings.length} active routings`);
 * }
 * ```
 *
 * ### Assigning a Device
 * ```tsx
 * import { useAssignDeviceRouting } from '@nasnet/api-client/queries/services';
 *
 * const [assignDevice, { loading, error }] = useAssignDeviceRouting();
 *
 * await assignDevice({
 *   routerID: 'router-1',
 *   deviceID: 'device-123',
 *   macAddress: '00:1A:2B:3C:4D:5E',
 *   instanceID: 'instance-tor',
 *   interfaceID: 'vif-tor',
 *   routingMark: 'tor-exit',
 *   routingMode: 'MAC',
 * });
 * ```
 *
 * ### Bulk Assignment
 * ```tsx
 * import { useBulkAssignRouting } from '@nasnet/api-client/queries/services';
 *
 * const { bulkAssign, progress, loading } = useBulkAssignRouting();
 *
 * const result = await bulkAssign({
 *   routerID: 'router-1',
 *   assignments: [
 *     { deviceID: '1', macAddress: '00:...', instanceID: 'tor', ... },
 *     { deviceID: '2', macAddress: '11:...', instanceID: 'xray', ... },
 *   ],
 * });
 *
 * console.log(`Success: ${result.successCount}, Failed: ${result.failureCount}`);
 * ```
 *
 * ### Real-time Updates
 * ```tsx
 * import { useDeviceRoutingSubscription } from '@nasnet/api-client/queries/services';
 *
 * const { event, loading, error } = useDeviceRoutingSubscription('router-1');
 *
 * useEffect(() => {
 *   if (event?.eventType === 'assigned') {
 *     toast.success(`Device ${event.routing?.deviceID} assigned`);
 *   }
 * }, [event]);
 * ```
 */

import { useQuery, useMutation, useSubscription, useApolloClient } from '@apollo/client';
import { useState, useCallback, useEffect } from 'react';
import {
  GET_DEVICE_ROUTING_MATRIX,
  GET_DEVICE_ROUTINGS,
  GET_DEVICE_ROUTING,
  ASSIGN_DEVICE_ROUTING,
  REMOVE_DEVICE_ROUTING,
  BULK_ASSIGN_ROUTING,
  SUBSCRIBE_DEVICE_ROUTING_CHANGES,
} from './device-routing.graphql';
import type {
  DeviceRoutingMatrix,
  DeviceRouting,
  AssignDeviceRoutingInput,
  BulkAssignRoutingInput,
  BulkRoutingResult,
  DeviceRoutingEvent,
  RoutingMode,
} from '../../../generated/types';

/**
 * Filters for querying device routings
 */
export interface DeviceRoutingFilters {
  deviceID?: string;
  instanceID?: string;
  active?: boolean;
}

/**
 * Bulk assignment progress tracking
 */
export interface BulkAssignProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  percentage: number;
}

/**
 * Hook to fetch the complete device routing matrix
 *
 * Returns all data needed for the device-to-service routing UI with 10-second polling.
 * Uses cache-and-network to show cached data immediately while fetching updates.
 *
 * @param routerId - Router ID to fetch matrix for
 * @returns Matrix data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { matrix, loading, error, refetch } = useDeviceRoutingMatrix('router-1');
 *
 * if (loading && !matrix) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return (
 *   <DeviceRoutingMatrix
 *     devices={matrix.devices}
 *     interfaces={matrix.interfaces}
 *     routings={matrix.routings}
 *     summary={matrix.summary}
 *   />
 * );
 * ```
 */
export function useDeviceRoutingMatrix(routerId: string) {
  const { data, loading, error, refetch } = useQuery(GET_DEVICE_ROUTING_MATRIX, {
    variables: { routerID: routerId },
    skip: !routerId,
    fetchPolicy: 'cache-and-network',
    pollInterval: 10000, // Poll every 10 seconds
  });

  const matrix = data?.deviceRoutingMatrix as DeviceRoutingMatrix | undefined;

  return {
    matrix,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch device routings with optional filters
 *
 * @param routerId - Router ID to fetch routings for
 * @param filters - Optional filters (deviceID, instanceID, active)
 * @returns Routings array, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * // Get all routings for a specific device
 * const { routings } = useDeviceRoutings('router-1', { deviceID: 'device-123' });
 *
 * // Get all active routings for a service instance
 * const { routings } = useDeviceRoutings('router-1', {
 *   instanceID: 'instance-tor',
 *   active: true,
 * });
 * ```
 */
export function useDeviceRoutings(routerId: string, filters?: DeviceRoutingFilters) {
  const { data, loading, error, refetch } = useQuery(GET_DEVICE_ROUTINGS, {
    variables: {
      routerID: routerId,
      ...filters,
    },
    skip: !routerId,
    fetchPolicy: 'cache-and-network',
  });

  const routings = (data?.deviceRoutings ?? []) as DeviceRouting[];

  return {
    routings,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch a single device routing by ID
 *
 * @param id - Device routing ID
 * @returns Routing data, loading state, error, and refetch function
 */
export function useDeviceRouting(id: string) {
  const { data, loading, error, refetch } = useQuery(GET_DEVICE_ROUTING, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  const routing = data?.deviceRouting as DeviceRouting | undefined;

  return {
    routing,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to assign a device to a service instance
 *
 * Creates a new device routing assignment with optimistic updates.
 * The optimistic response immediately updates the UI while the server processes the request.
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [assignDevice, { loading, error }] = useAssignDeviceRouting();
 *
 * const handleAssign = async () => {
 *   try {
 *     const result = await assignDevice({
 *       routerID: 'router-1',
 *       deviceID: 'device-123',
 *       macAddress: '00:1A:2B:3C:4D:5E',
 *       deviceIP: '192.168.1.100',
 *       deviceName: 'iPhone',
 *       instanceID: 'instance-tor',
 *       interfaceID: 'vif-tor',
 *       routingMark: 'tor-exit',
 *       routingMode: 'MAC',
 *     });
 *     toast.success('Device assigned successfully');
 *   } catch (err) {
 *     toast.error('Failed to assign device');
 *   }
 * };
 * ```
 */
export function useAssignDeviceRouting() {
  const [assignDeviceRoutingMutation, mutationState] = useMutation(
    ASSIGN_DEVICE_ROUTING,
    {
      refetchQueries: [GET_DEVICE_ROUTING_MATRIX, GET_DEVICE_ROUTINGS],
    }
  );

  const assignDevice = useCallback(
    async (input: AssignDeviceRoutingInput) => {
      const result = await assignDeviceRoutingMutation({
        variables: { input },
        optimisticResponse: {
          assignDeviceRouting: {
            __typename: 'DeviceRouting',
            id: `temp-${Date.now()}`,
            deviceID: input.deviceID,
            macAddress: input.macAddress,
            deviceIP: input.deviceIP ?? null,
            deviceName: input.deviceName ?? null,
            instanceID: input.instanceID,
            interfaceID: input.interfaceID,
            routingMode: input.routingMode,
            routingMark: input.routingMark,
            mangleRuleID: 'pending',
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      });

      return result.data?.assignDeviceRouting as DeviceRouting;
    },
    [assignDeviceRoutingMutation]
  );

  return [
    assignDevice,
    {
      loading: mutationState.loading,
      error: mutationState.error,
      data: mutationState.data?.assignDeviceRouting as DeviceRouting | undefined,
    },
  ] as const;
}

/**
 * Hook to remove a device routing assignment
 *
 * Removes a device routing assignment with optimistic updates.
 * The UI is updated immediately while the server processes the deletion.
 *
 * @returns Mutation function, loading state, error
 *
 * @example
 * ```tsx
 * const [removeDevice, { loading, error }] = useRemoveDeviceRouting();
 *
 * const handleRemove = async (routingId: string) => {
 *   try {
 *     await removeDevice(routingId);
 *     toast.success('Device routing removed');
 *   } catch (err) {
 *     toast.error('Failed to remove device routing');
 *   }
 * };
 * ```
 */
export function useRemoveDeviceRouting() {
  const client = useApolloClient();

  const [removeDeviceRoutingMutation, mutationState] = useMutation(
    REMOVE_DEVICE_ROUTING,
    {
      onCompleted: () => {
        // Refetch queries to update the UI
        client.refetchQueries({
          include: [GET_DEVICE_ROUTING_MATRIX, GET_DEVICE_ROUTINGS],
        });
      },
    }
  );

  const removeDevice = useCallback(
    async (id: string) => {
      const result = await removeDeviceRoutingMutation({
        variables: { id },
        optimisticResponse: {
          removeDeviceRouting: true,
        },
      });

      return result.data?.removeDeviceRouting ?? false;
    },
    [removeDeviceRoutingMutation]
  );

  return [
    removeDevice,
    {
      loading: mutationState.loading,
      error: mutationState.error,
    },
  ] as const;
}

/**
 * Hook to bulk assign multiple devices to service instances
 *
 * Assigns multiple devices in a single operation with progress tracking.
 * Returns success/failure counts and detailed results for each assignment.
 *
 * @returns Bulk assign function, progress state, loading state, error
 *
 * @example
 * ```tsx
 * const { bulkAssign, progress, loading, error } = useBulkAssignRouting();
 *
 * const handleBulkAssign = async (devices: Device[], instanceId: string) => {
 *   const assignments = devices.map(device => ({
 *     deviceID: device.id,
 *     macAddress: device.macAddress,
 *     deviceIP: device.ipAddress,
 *     deviceName: device.hostname,
 *     instanceID: instanceId,
 *     interfaceID: device.interfaceId,
 *     routingMark: device.routingMark,
 *     routingMode: 'MAC' as RoutingMode,
 *   }));
 *
 *   const result = await bulkAssign({
 *     routerID: 'router-1',
 *     assignments,
 *   });
 *
 *   if (result.failureCount > 0) {
 *     toast.warning(`${result.successCount} succeeded, ${result.failureCount} failed`);
 *   } else {
 *     toast.success(`All ${result.successCount} devices assigned successfully`);
 *   }
 * };
 * ```
 */
export function useBulkAssignRouting() {
  const [progress, setProgress] = useState<BulkAssignProgress | null>(null);
  const client = useApolloClient();

  const [bulkAssignRoutingMutation, mutationState] = useMutation(
    BULK_ASSIGN_ROUTING,
    {
      onCompleted: () => {
        // Refetch queries to update the UI
        client.refetchQueries({
          include: [GET_DEVICE_ROUTING_MATRIX, GET_DEVICE_ROUTINGS],
        });
        // Reset progress after completion
        setProgress(null);
      },
    }
  );

  const bulkAssign = useCallback(
    async (input: BulkAssignRoutingInput) => {
      const total = input.assignments.length;

      // Initialize progress
      setProgress({
        total,
        processed: 0,
        successful: 0,
        failed: 0,
        percentage: 0,
      });

      const result = await bulkAssignRoutingMutation({
        variables: { input },
      });

      const bulkResult = result.data?.bulkAssignRouting as BulkRoutingResult;

      // Update final progress
      if (bulkResult) {
        setProgress({
          total,
          processed: total,
          successful: bulkResult.successCount,
          failed: bulkResult.failureCount,
          percentage: 100,
        });
      }

      return bulkResult;
    },
    [bulkAssignRoutingMutation]
  );

  return {
    bulkAssign,
    progress,
    loading: mutationState.loading,
    error: mutationState.error,
  };
}

/**
 * Hook to subscribe to real-time device routing changes
 *
 * Subscribes to device routing events (assigned, removed, updated) for a router.
 * Falls back to polling if WebSocket connection fails.
 *
 * @param routerId - Router ID to subscribe to
 * @returns Latest event, loading state, error
 *
 * @example
 * ```tsx
 * const { event, loading, error } = useDeviceRoutingSubscription('router-1');
 *
 * useEffect(() => {
 *   if (!event) return;
 *
 *   switch (event.eventType) {
 *     case 'assigned':
 *       toast.success(`Device ${event.routing?.deviceID} assigned`);
 *       break;
 *     case 'removed':
 *       toast.info(`Device routing removed`);
 *       break;
 *     case 'updated':
 *       toast.info(`Device routing updated`);
 *       break;
 *   }
 * }, [event]);
 * ```
 */
export function useDeviceRoutingSubscription(routerId: string) {
  const [latestEvent, setLatestEvent] = useState<DeviceRoutingEvent | null>(null);

  // Subscribe to real-time events
  const {
    data: subData,
    loading: subLoading,
    error: subError,
  } = useSubscription(SUBSCRIBE_DEVICE_ROUTING_CHANGES, {
    variables: { routerID: routerId },
    skip: !routerId,
  });

  // Fallback: Poll for changes if subscription fails
  const { refetch } = useQuery(GET_DEVICE_ROUTING_MATRIX, {
    variables: { routerID: routerId },
    skip: !routerId || !subError, // Only poll if subscription failed
    fetchPolicy: 'cache-and-network',
    pollInterval: subError ? 5000 : 0, // Poll every 5 seconds if subscription fails
  });

  // Update latest event when subscription emits
  useEffect(() => {
    if (subData?.deviceRoutingChanged) {
      const event = subData.deviceRoutingChanged as DeviceRoutingEvent;
      setLatestEvent(event);

      // Refetch matrix to update UI
      refetch();
    }
  }, [subData, refetch]);

  return {
    event: latestEvent,
    loading: subLoading,
    error: subError,
  };
}

// Re-export types for convenience
export type {
  DeviceRoutingMatrix,
  DeviceRouting,
  AssignDeviceRoutingInput,
  BulkAssignRoutingInput,
  BulkRoutingResult,
  DeviceRoutingEvent,
  RoutingMode,
};
