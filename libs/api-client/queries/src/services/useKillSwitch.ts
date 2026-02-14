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

import { useQuery, useMutation, useSubscription, useApolloClient } from '@apollo/client';
import { useState, useCallback, useEffect } from 'react';
import {
  GET_KILL_SWITCH_STATUS,
  SET_KILL_SWITCH,
  SUBSCRIBE_KILL_SWITCH_CHANGES,
} from './kill-switch.graphql';
import { GET_DEVICE_ROUTING_MATRIX, GET_DEVICE_ROUTINGS } from './device-routing.graphql';
import type {
  KillSwitchStatus,
  SetKillSwitchInput,
  DeviceRouting,
  DeviceRoutingEvent,
} from '../../../generated/types';

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
export function useKillSwitchStatus(routerId: string, deviceId: string) {
  const { data, loading, error, refetch } = useQuery(GET_KILL_SWITCH_STATUS, {
    variables: {
      routerID: routerId,
      deviceID: deviceId,
    },
    skip: !routerId || !deviceId,
    fetchPolicy: 'cache-and-network',
    pollInterval: 10000, // Poll every 10 seconds
  });

  const status = data?.killSwitchStatus as KillSwitchStatus | undefined;

  return {
    status,
    loading,
    error,
    refetch,
  };
}

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
export function useSetKillSwitch() {
  const [setKillSwitchMutation, mutationState] = useMutation(SET_KILL_SWITCH, {
    refetchQueries: [
      GET_DEVICE_ROUTING_MATRIX,
      GET_DEVICE_ROUTINGS,
      GET_KILL_SWITCH_STATUS,
    ],
  });

  const setKillSwitch = useCallback(
    async (input: SetKillSwitchInput) => {
      const result = await setKillSwitchMutation({
        variables: { input },
        optimisticResponse: {
          setKillSwitch: {
            __typename: 'DeviceRouting',
            id: `optimistic-${Date.now()}`,
            deviceID: input.deviceID,
            macAddress: '',
            deviceIP: null,
            deviceName: null,
            instanceID: '',
            interfaceID: '',
            routingMode: 'MAC',
            routingMark: '',
            mangleRuleID: '',
            active: true,
            killSwitchEnabled: input.enabled,
            killSwitchMode: input.mode,
            killSwitchActive: false,
            killSwitchActivatedAt: null,
            killSwitchFallbackInterfaceID: input.fallbackInterfaceID ?? null,
            killSwitchRuleID: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      });

      return result.data?.setKillSwitch as DeviceRouting;
    },
    [setKillSwitchMutation]
  );

  return [
    setKillSwitch,
    {
      loading: mutationState.loading,
      error: mutationState.error,
      data: mutationState.data?.setKillSwitch as DeviceRouting | undefined,
    },
  ] as const;
}

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
export function useKillSwitchSubscription(routerId: string) {
  const [latestEvent, setLatestEvent] = useState<DeviceRoutingEvent | null>(null);

  // Subscribe to real-time events
  const {
    data: subData,
    loading: subLoading,
    error: subError,
  } = useSubscription(SUBSCRIBE_KILL_SWITCH_CHANGES, {
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
    if (subData?.killSwitchChanged) {
      const event = subData.killSwitchChanged as DeviceRoutingEvent;
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
export type { KillSwitchStatus, SetKillSwitchInput, DeviceRouting, DeviceRoutingEvent };
