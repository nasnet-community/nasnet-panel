/**
 * useVirtualInterfaceBridge Hook
 *
 * Headless hook containing all business logic for VirtualInterfaceBridge.
 * Platform presenters consume this hook for shared state and behavior.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import { useBridgeStatus } from '@nasnet/api-client/queries';
import type { VirtualInterfaceBridgeProps } from './types';
/**
 * Badge variant type matching primitives Badge component
 */
export type BadgeVariant = 'default' | 'secondary' | 'success' | 'connected' | 'warning' | 'error' | 'info' | 'offline' | 'outline';
/**
 * Return type for useVirtualInterfaceBridge hook
 */
export interface UseVirtualInterfaceBridgeReturn {
    interface: VirtualInterfaceBridgeProps['children'] extends never ? undefined : ReturnType<typeof useBridgeStatus>['status'];
    isReady: boolean;
    gatewayRunning: boolean;
    errors: string[];
    loading: boolean;
    error: Error | undefined;
    statusColor: BadgeVariant;
    statusLabel: string;
    gatewayBadgeText: string;
    gatewayBadgeVariant: BadgeVariant;
    hasInterface: boolean;
    hasErrors: boolean;
    handleRefresh: () => void;
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
export declare function useVirtualInterfaceBridge(props: VirtualInterfaceBridgeProps): UseVirtualInterfaceBridgeReturn;
//# sourceMappingURL=useVirtualInterfaceBridge.d.ts.map