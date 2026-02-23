/**
 * VirtualInterfaceBridge Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * Displays network bridge status for service instances, including:
 * - Virtual interface readiness
 * - Gateway connectivity (Tor, sing-box, etc.)
 * - Interface details (name, IP, VLAN)
 * - Error diagnostics
 *
 * @example
 * ```tsx
 * <VirtualInterfaceBridge
 *   routerId="router-1"
 *   instanceId="instance-123"
 *   serviceName="Tor Proxy"
 * />
 * ```
 */
import type { VirtualInterfaceBridgeProps } from './types';
/**
 * VirtualInterfaceBridge - Network bridge status display
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Vertical stack with full-width badges and 44px touch targets
 * - Tablet/Desktop (>=640px): Horizontal compact layout with inline details
 *
 * The component polls for bridge status every 5 seconds by default and displays:
 * - Bridge readiness status (ready/pending/error)
 * - Gateway status (running/stopped for Tor, sing-box, etc.)
 * - Interface details (name, IP address, VLAN ID, tunnel name)
 * - Error messages if bridge creation fails
 */
declare function VirtualInterfaceBridgeComponent(props: VirtualInterfaceBridgeProps): import("react/jsx-runtime").JSX.Element;
declare const VirtualInterfaceBridge: import("react").MemoExoticComponent<typeof VirtualInterfaceBridgeComponent>;
export { VirtualInterfaceBridge };
//# sourceMappingURL=VirtualInterfaceBridge.d.ts.map