/**
 * useDeviceStatusSubscription Hook
 *
 * GraphQL subscription hook for real-time device status updates.
 * Debounces updates to prevent UI thrashing.
 *
 * @module @nasnet/ui/patterns/network/device-card
 * @see NAS-4A.20: Build Device Discovery Card Component (AC6)
 */
import type { DiscoveredDevice } from './device-card.types';
/**
 * GraphQL subscription document for device status
 * Note: This would typically be generated from schema/schema.graphql
 */
export declare const DEVICE_STATUS_SUBSCRIPTION = "\n  subscription OnDeviceStatus($id: ID!) {\n    deviceStatus(id: $id) {\n      id\n      online\n      lastSeen\n      ip\n      signalStrength\n    }\n  }\n";
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
export declare function useDeviceStatusSubscription(config: UseDeviceStatusSubscriptionConfig): UseDeviceStatusSubscriptionReturn;
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
export declare function withDeviceStatusSubscription<P extends {
    device: DiscoveredDevice;
    className?: string;
}>(Component: React.ComponentType<P>): (props: P & {
    enableRealtime?: boolean;
    onStatusChange?: (device: DiscoveredDevice, previousOnline: boolean) => void;
}) => import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=use-device-status-subscription.d.ts.map