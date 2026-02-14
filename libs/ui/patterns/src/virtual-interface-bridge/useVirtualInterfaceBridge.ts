/**
 * useVirtualInterfaceBridge Hook
 *
 * Headless hook containing all business logic for VirtualInterfaceBridge.
 * Platform presenters consume this hook for shared state and behavior.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import { useMemo, useCallback } from 'react';

import { useBridgeStatus } from '@nasnet/api-client/queries';

import type {
  VirtualInterfaceBridgeProps,
  BridgeStatus,
  GatewayType,
} from './types';

/**
 * Badge variant type matching primitives Badge component
 */
export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'connected'
  | 'warning'
  | 'error'
  | 'info'
  | 'offline'
  | 'outline';

/**
 * Return type for useVirtualInterfaceBridge hook
 */
export interface UseVirtualInterfaceBridgeReturn {
  // Bridge status data
  interface: VirtualInterfaceBridgeProps['children'] extends never
    ? undefined
    : ReturnType<typeof useBridgeStatus>['status'];
  isReady: boolean;
  gatewayRunning: boolean;
  errors: string[];

  // Loading and error states
  loading: boolean;
  error: Error | undefined;

  // Derived display state
  statusColor: BadgeVariant;
  statusLabel: string;
  gatewayBadgeText: string;
  gatewayBadgeVariant: BadgeVariant;
  hasInterface: boolean;
  hasErrors: boolean;

  // Event handlers (stable references)
  handleRefresh: () => void;
}

/**
 * Get badge variant for bridge status
 */
function getStatusColor(
  isReady: boolean,
  hasInterface: boolean,
  hasErrors: boolean
): BadgeVariant {
  if (hasErrors) return 'error';
  if (!hasInterface) return 'warning';
  if (isReady) return 'success';
  return 'warning';
}

/**
 * Get label for bridge status
 */
function getStatusLabel(
  isReady: boolean,
  hasInterface: boolean,
  hasErrors: boolean
): string {
  if (hasErrors) return 'Error';
  if (!hasInterface) return 'Pending';
  if (isReady) return 'Ready';
  return 'Pending';
}

/**
 * Get gateway badge text
 */
function getGatewayBadgeText(
  gatewayType: GatewayType | undefined,
  gatewayRunning: boolean
): string {
  if (!gatewayType || gatewayType === 'none' || gatewayType === 'direct') {
    return 'Direct';
  }

  const typeLabel =
    gatewayType === 'tor' ? 'Tor' : gatewayType === 'sing-box' ? 'sing-box' : gatewayType;

  return gatewayRunning ? `${typeLabel}: Running` : `${typeLabel}: Stopped`;
}

/**
 * Get gateway badge variant
 */
function getGatewayBadgeVariant(
  gatewayType: GatewayType | undefined,
  gatewayRunning: boolean
): BadgeVariant {
  if (!gatewayType || gatewayType === 'none' || gatewayType === 'direct') {
    return 'secondary';
  }

  return gatewayRunning ? 'success' : 'error';
}

/**
 * Headless hook for VirtualInterfaceBridge pattern
 *
 * Contains all business logic, state management, and computed values.
 * Event handlers are memoized for stable references.
 *
 * @example
 * ```tsx
 * function VirtualInterfaceBridgeMobile(props: VirtualInterfaceBridgeProps) {
 *   const {
 *     isReady,
 *     statusColor,
 *     statusLabel,
 *     gatewayBadgeText,
 *     handleRefresh,
 *   } = useVirtualInterfaceBridge(props);
 *
 *   return (
 *     <Card>
 *       <Badge variant={statusColor}>{statusLabel}</Badge>
 *       <Badge>{gatewayBadgeText}</Badge>
 *       <Button onClick={handleRefresh}>Refresh</Button>
 *     </Card>
 *   );
 * }
 * ```
 */
export function useVirtualInterfaceBridge(
  props: VirtualInterfaceBridgeProps
): UseVirtualInterfaceBridgeReturn {
  const { routerId, instanceId, onRefresh } = props;

  // Fetch bridge status from API
  const { status, loading, error, refetch } = useBridgeStatus(
    routerId,
    instanceId
  );

  // Extract data with safe defaults
  const bridgeInterface = status?.interface;
  const isReady = status?.isReady ?? false;
  const gatewayRunning = status?.gatewayRunning ?? false;
  const errors = status?.errors ?? [];

  // Derived state (memoized)
  const hasInterface = !!bridgeInterface;
  const hasErrors = errors.length > 0;

  const statusColor = useMemo(
    () => getStatusColor(isReady, hasInterface, hasErrors),
    [isReady, hasInterface, hasErrors]
  );

  const statusLabel = useMemo(
    () => getStatusLabel(isReady, hasInterface, hasErrors),
    [isReady, hasInterface, hasErrors]
  );

  const gatewayBadgeText = useMemo(
    () => getGatewayBadgeText(bridgeInterface?.gatewayType, gatewayRunning),
    [bridgeInterface?.gatewayType, gatewayRunning]
  );

  const gatewayBadgeVariant = useMemo(
    () => getGatewayBadgeVariant(bridgeInterface?.gatewayType, gatewayRunning),
    [bridgeInterface?.gatewayType, gatewayRunning]
  );

  // Event handlers with stable references
  const handleRefresh = useCallback(() => {
    void refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  return {
    // Bridge status data
    interface: status,
    isReady,
    gatewayRunning,
    errors,

    // Loading and error states
    loading,
    error,

    // Derived display state
    statusColor,
    statusLabel,
    gatewayBadgeText,
    gatewayBadgeVariant,
    hasInterface,
    hasErrors,

    // Event handlers
    handleRefresh,
  };
}
