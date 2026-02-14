/**
 * VirtualInterfaceBridge Pattern
 *
 * Network bridge status display for service instances.
 * Implements the Headless + Platform Presenters pattern (ADR-018).
 *
 * Shows virtual interface readiness, gateway connectivity,
 * and detailed interface information for network-isolated services.
 *
 * @example
 * ```tsx
 * import { VirtualInterfaceBridge } from '@nasnet/ui/patterns';
 *
 * <VirtualInterfaceBridge
 *   routerId="router-1"
 *   instanceId="instance-123"
 *   serviceName="Tor Proxy"
 *   onRefresh={() => console.log('Refreshed')}
 * />
 * ```
 */

// Main component (auto-detect)
export { VirtualInterfaceBridge } from './VirtualInterfaceBridge';

// Platform presenters
export { VirtualInterfaceBridgeMobile } from './VirtualInterfaceBridge.Mobile';
export { VirtualInterfaceBridgeDesktop } from './VirtualInterfaceBridge.Desktop';

// Headless hook
export { useVirtualInterfaceBridge } from './useVirtualInterfaceBridge';
export type { UseVirtualInterfaceBridgeReturn } from './useVirtualInterfaceBridge';

// Types
export type {
  VirtualInterfaceBridgeProps,
  VirtualInterface,
  BridgeStatusData,
  BridgeStatus,
  GatewayType,
  GatewayStatus,
} from './types';
