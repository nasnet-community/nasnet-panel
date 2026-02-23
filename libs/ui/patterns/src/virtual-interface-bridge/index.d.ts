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
export { VirtualInterfaceBridge } from './VirtualInterfaceBridge';
export { VirtualInterfaceBridgeMobile } from './VirtualInterfaceBridge.Mobile';
export { VirtualInterfaceBridgeDesktop } from './VirtualInterfaceBridge.Desktop';
export { useVirtualInterfaceBridge } from './useVirtualInterfaceBridge';
export type { UseVirtualInterfaceBridgeReturn } from './useVirtualInterfaceBridge';
export type { VirtualInterfaceBridgeProps, VirtualInterface, BridgeStatusData, BridgeStatus, GatewayType, GatewayStatus, } from './types';
//# sourceMappingURL=index.d.ts.map