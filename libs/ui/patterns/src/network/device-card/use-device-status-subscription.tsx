/**
 * useDeviceStatusSubscription Hook
 *
 * GraphQL subscription hook for real-time device status updates.
 * Debounces updates to prevent UI thrashing.
 *
 * @module @nasnet/ui/patterns/network/device-card
 * @see NAS-4A.20: Build Device Discovery Card Component (AC6)
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import type { DiscoveredDevice } from './device-card.types';

/**
 * GraphQL subscription document for device status
 * Note: This would typically be generated from schema/schema.graphql
 */
export const DEVICE_STATUS_SUBSCRIPTION = `
  subscription OnDeviceStatus($id: ID!) {
    deviceStatus(id: $id) {
      id
      online
      lastSeen
      ip
      signalStrength
    }
  }
`;

/**
 * Device status update from subscription
 */
export interface DeviceStatusUpdate {
  id: string;
  online: boolean;
  lastSeen: string;
  ip?: string;
  signalStrength?: number;
}

/**
 * Configuration for the subscription hook
 */
export interface UseDeviceStatusSubscriptionConfig {
  /** Device ID to subscribe to */
  deviceId: string;
  /** Initial device data */
  initialDevice: DiscoveredDevice;
  /** Debounce delay in milliseconds (default: 300ms) */
  debounceMs?: number;
  /** Callback when status changes */
  onStatusChange?: (device: DiscoveredDevice, previousOnline: boolean) => void;
  /** Whether subscription is enabled */
  enabled?: boolean;
}

/**
 * Return value from the subscription hook
 */
export interface UseDeviceStatusSubscriptionReturn {
  /** Current device with real-time updates */
  device: DiscoveredDevice;
  /** Whether status recently changed (for animation) */
  statusChanged: boolean;
  /** Whether subscription is connected */
  isConnected: boolean;
  /** Any subscription error */
  error: Error | null;
}

/**
 * Hook for real-time device status updates via GraphQL subscription.
 *
 * Features:
 * - Debounces updates (300ms default) to prevent UI thrashing
 * - Tracks status changes for animation triggers
 * - Respects prefers-reduced-motion
 * - Handles connection state
 *
 * @param config - Subscription configuration
 * @returns Device with real-time updates and status change indicator
 *
 * @example
 * ```tsx
 * function DeviceCardWithRealtime({ initialDevice }) {
 *   const { device, statusChanged } = useDeviceStatusSubscription({
 *     deviceId: initialDevice.id,
 *     initialDevice,
 *     onStatusChange: (device, prevOnline) => {
 *       if (device.online && !prevOnline) {
 *         toast.success(`${device.hostname} came online`);
 *       }
 *     },
 *   });
 *
 *   return (
 *     <DeviceCard
 *       device={device}
 *       className={statusChanged ? 'animate-pulse' : ''}
 *     />
 *   );
 * }
 * ```
 */
export function useDeviceStatusSubscription(
  config: UseDeviceStatusSubscriptionConfig
): UseDeviceStatusSubscriptionReturn {
  const { deviceId, initialDevice, debounceMs = 300, onStatusChange, enabled = true } = config;

  // Current device state
  const [device, setDevice] = useState<DiscoveredDevice>(initialDevice);

  // Status changed flag (for animation)
  const [statusChanged, setStatusChanged] = useState(false);

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs for debouncing and tracking
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousOnlineRef = useRef(initialDevice.online);
  const statusChangeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Handle incoming status update with debouncing
  const handleStatusUpdate = useCallback(
    (update: DeviceStatusUpdate) => {
      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce the update
      debounceTimerRef.current = setTimeout(() => {
        setDevice((prevDevice) => {
          const previousOnline = previousOnlineRef.current;
          const newDevice: DiscoveredDevice = {
            ...prevDevice,
            online: update.online,
            lastSeen: new Date(update.lastSeen),
            ip: update.ip || prevDevice.ip,
            signalStrength: update.signalStrength ?? prevDevice.signalStrength,
          };

          // Check if status changed
          if (previousOnline !== update.online) {
            previousOnlineRef.current = update.online;

            // Trigger status change animation (unless reduced motion)
            if (!prefersReducedMotion) {
              setStatusChanged(true);

              // Clear previous animation timer
              if (statusChangeTimerRef.current) {
                clearTimeout(statusChangeTimerRef.current);
              }

              // Reset animation flag after 1 second
              statusChangeTimerRef.current = setTimeout(() => {
                setStatusChanged(false);
              }, 1000);
            }

            // Call status change callback
            onStatusChange?.(newDevice, previousOnline);
          }

          return newDevice;
        });
      }, debounceMs);
    },
    [debounceMs, onStatusChange, prefersReducedMotion]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (statusChangeTimerRef.current) {
        clearTimeout(statusChangeTimerRef.current);
      }
    };
  }, []);

  // Note: Actual GraphQL subscription implementation would go here
  // This is a placeholder that simulates the subscription behavior
  // In a real implementation, you would use @apollo/client's useSubscription
  //
  // Example with Apollo:
  // const { data, loading, error } = useSubscription(DEVICE_STATUS_SUBSCRIPTION, {
  //   variables: { id: deviceId },
  //   skip: !enabled,
  //   onSubscriptionData: ({ subscriptionData }) => {
  //     if (subscriptionData.data?.deviceStatus) {
  //       handleStatusUpdate(subscriptionData.data.deviceStatus);
  //     }
  //   },
  // });

  // Update connection status (simulated)
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Simulate connection after a brief delay
    const timer = setTimeout(() => {
      setIsConnected(true);
    }, 100);

    return () => {
      clearTimeout(timer);
      setIsConnected(false);
    };
  }, [enabled, deviceId]);

  // Sync with initial device changes
  useEffect(() => {
    setDevice(initialDevice);
    previousOnlineRef.current = initialDevice.online;
  }, [initialDevice]);

  return {
    device,
    statusChanged,
    isConnected,
    error,
  };
}

/**
 * Higher-order component that adds real-time status updates to DeviceCard
 *
 * @param Component - DeviceCard component to wrap
 * @returns Wrapped component with real-time updates
 *
 * @example
 * ```tsx
 * const RealtimeDeviceCard = withDeviceStatusSubscription(DeviceCard);
 *
 * <RealtimeDeviceCard
 *   device={device}
 *   enableRealtime
 *   onStatusChange={(device, prev) => console.log('Status changed')}
 * />
 * ```
 */
export function withDeviceStatusSubscription<
  P extends { device: DiscoveredDevice; className?: string },
>(Component: React.ComponentType<P>) {
  return function WrappedComponent(
    props: P & {
      enableRealtime?: boolean;
      onStatusChange?: (device: DiscoveredDevice, previousOnline: boolean) => void;
    }
  ) {
    const { enableRealtime = false, onStatusChange, ...rest } = props;
    const deviceProps = rest as P;

    const { device, statusChanged } = useDeviceStatusSubscription({
      deviceId: deviceProps.device.id,
      initialDevice: deviceProps.device,
      enabled: enableRealtime,
      onStatusChange,
    });

    return (
      <Component
        {...deviceProps}
        device={device}
        className={`${deviceProps.className || ''} ${statusChanged ? 'animate-pulse' : ''}`.trim()}
      />
    );
  };
}
