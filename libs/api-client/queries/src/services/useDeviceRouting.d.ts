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
import type { DeviceRoutingMatrix, DeviceRouting, AssignDeviceRoutingInput, BulkAssignRoutingInput, BulkRoutingResult, DeviceRoutingEvent, RoutingMode } from '@nasnet/api-client/generated/types';
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
export declare function useDeviceRoutingMatrix(routerId: string): {
    matrix: DeviceRoutingMatrix | undefined;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
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
export declare function useDeviceRoutings(routerId: string, filters?: DeviceRoutingFilters): {
    routings: DeviceRouting[];
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
/**
 * Hook to fetch a single device routing by ID
 *
 * @param id - Device routing ID
 * @returns Routing data, loading state, error, and refetch function
 */
export declare function useDeviceRouting(id: string): {
    routing: DeviceRouting | undefined;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
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
export declare function useAssignDeviceRouting(): readonly [(input: AssignDeviceRoutingInput) => Promise<DeviceRouting>, {
    readonly loading: boolean;
    readonly error: import("@apollo/client").ApolloError | undefined;
    readonly data: DeviceRouting | undefined;
}];
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
export declare function useRemoveDeviceRouting(): readonly [(id: string) => Promise<any>, {
    readonly loading: boolean;
    readonly error: import("@apollo/client").ApolloError | undefined;
}];
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
export declare function useBulkAssignRouting(): {
    bulkAssign: (input: BulkAssignRoutingInput) => Promise<BulkRoutingResult>;
    progress: BulkAssignProgress | null;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
};
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
export declare function useDeviceRoutingSubscription(routerId: string): {
    event: DeviceRoutingEvent | null;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
};
export type { DeviceRoutingMatrix, DeviceRouting, AssignDeviceRoutingInput, BulkAssignRoutingInput, BulkRoutingResult, DeviceRoutingEvent, RoutingMode, };
//# sourceMappingURL=useDeviceRouting.d.ts.map