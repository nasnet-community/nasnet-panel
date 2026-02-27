/**
 * Kill Switch API Client Hooks (NAS-8.14)
 *
 * React hooks for managing kill switch functionality.
 * Kill switch automatically blocks traffic when a service instance becomes unhealthy.
 *
 * ## Usage
 *
 * ### Querying Kill Switch Status
 * ```tsx
 * import { useKillSwitchStatus } from '@nasnet/api-client/queries/services';
 *
 * const { status, loading, error } = useKillSwitchStatus('router-1', 'device-123');
 *
 * if (status) {
 *   console.log(`Enabled: ${status.enabled}, Active: ${status.active}`);
 *   console.log(`Mode: ${status.mode}`);
 * }
 * ```
 *
 * ### Enabling Kill Switch
 * ```tsx
 * import { useSetKillSwitch } from '@nasnet/api-client/queries/services';
 *
 * const [setKillSwitch, { loading, error }] = useSetKillSwitch();
 *
 * await setKillSwitch({
 *   routerID: 'router-1',
 *   deviceID: 'device-123',
 *   enabled: true,
 *   mode: 'BLOCK_ALL',
 * });
 * ```
 *
 * ### Real-time Updates
 * ```tsx
 * import { useKillSwitchSubscription } from '@nasnet/api-client/queries/services';
 *
 * const { event, loading, error } = useKillSwitchSubscription('router-1');
 *
 * useEffect(() => {
 *   if (event?.eventType === 'activated') {
 *     toast.warning(`Kill switch activated for ${event.routing?.deviceID}`);
 *   }
 * }, [event]);
 * ```
 */
import type {
  KillSwitchStatus,
  SetKillSwitchInput,
  DeviceRouting,
  DeviceRoutingEvent,
} from '@nasnet/api-client/generated/types';
/**
 * Hook to fetch kill switch status for a device
 *
 * Returns the current kill switch configuration and activation state.
 * Uses cache-and-network to show cached data immediately while fetching updates.
 *
 * @param routerId - Router ID
 * @param deviceId - Device ID to check kill switch status for
 * @returns Status data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { status, loading, error, refetch } = useKillSwitchStatus('router-1', 'device-123');
 *
 * if (loading && !status) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return (
 *   <KillSwitchStatusCard
 *     enabled={status.enabled}
 *     active={status.active}
 *     mode={status.mode}
 *     lastActivatedAt={status.lastActivatedAt}
 *   />
 * );
 * ```
 */
export declare function useKillSwitchStatus(
  routerId: string,
  deviceId: string
): {
  status: KillSwitchStatus | undefined;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
  refetch: (
    variables?: Partial<import('@apollo/client').OperationVariables> | undefined
  ) => Promise<import('@apollo/client').ApolloQueryResult<any>>;
};
/**
 * Hook to set kill switch configuration for a device
 *
 * Configures or updates the kill switch for a device routing with optimistic updates.
 * The optimistic response immediately updates the UI while the server processes the request.
 *
 * @returns Mutation function, loading state, error, and data
 *
 * @example
 * ```tsx
 * const [setKillSwitch, { loading, error }] = useSetKillSwitch();
 *
 * const handleEnable = async () => {
 *   try {
 *     const result = await setKillSwitch({
 *       routerID: 'router-1',
 *       deviceID: 'device-123',
 *       enabled: true,
 *       mode: 'BLOCK_ALL',
 *     });
 *     toast.success('Kill switch enabled');
 *   } catch (err) {
 *     toast.error('Failed to enable kill switch');
 *   }
 * };
 *
 * const handleFallback = async () => {
 *   try {
 *     const result = await setKillSwitch({
 *       routerID: 'router-1',
 *       deviceID: 'device-123',
 *       enabled: true,
 *       mode: 'FALLBACK_SERVICE',
 *       fallbackInterfaceID: 'vif-backup',
 *     });
 *     toast.success('Kill switch configured with fallback');
 *   } catch (err) {
 *     toast.error('Failed to configure kill switch');
 *   }
 * };
 * ```
 */
export declare function useSetKillSwitch(): readonly [
  (input: SetKillSwitchInput) => Promise<DeviceRouting>,
  {
    readonly loading: boolean;
    readonly error: import('@apollo/client').ApolloError | undefined;
    readonly data: DeviceRouting | undefined;
  },
];
/**
 * Hook to subscribe to real-time kill switch changes
 *
 * Subscribes to kill switch events (activated, deactivated, configured) for a router.
 * Falls back to polling if WebSocket connection fails.
 *
 * @param routerId - Router ID to subscribe to
 * @returns Latest event, loading state, error
 *
 * @example
 * ```tsx
 * const { event, loading, error } = useKillSwitchSubscription('router-1');
 *
 * useEffect(() => {
 *   if (!event) return;
 *
 *   switch (event.eventType) {
 *     case 'activated':
 *       toast.warning(`Kill switch activated for ${event.routing?.deviceID}`);
 *       toast.warning(`Reason: ${event.routing?.killSwitchActivatedAt}`);
 *       break;
 *     case 'deactivated':
 *       toast.success(`Kill switch deactivated for ${event.routing?.deviceID}`);
 *       break;
 *     case 'configured':
 *       toast.info(`Kill switch configuration updated`);
 *       break;
 *   }
 * }, [event]);
 * ```
 */
export declare function useKillSwitchSubscription(routerId: string): {
  event: DeviceRoutingEvent | null;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
};
export type { KillSwitchStatus, SetKillSwitchInput, DeviceRouting, DeviceRoutingEvent };
//# sourceMappingURL=useKillSwitch.d.ts.map
