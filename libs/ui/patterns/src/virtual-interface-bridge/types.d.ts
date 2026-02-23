/**
 * VirtualInterfaceBridge Types
 *
 * TypeScript interfaces for the VirtualInterfaceBridge pattern component.
 */
import type { ReactNode } from 'react';
/**
 * Gateway type options
 */
export type GatewayType = 'tor' | 'sing-box' | 'direct' | 'none';
/**
 * Gateway status values
 */
export type GatewayStatus = 'running' | 'stopped' | 'error' | 'pending';
/**
 * Virtual interface bridge status
 */
export type BridgeStatus = 'ready' | 'pending' | 'error' | 'unknown';
/**
 * Virtual interface data structure
 */
export interface VirtualInterface {
    /** Unique identifier */
    id: string;
    /** Service instance ID */
    instanceId: string;
    /** Interface name (e.g., vif-tor-1) */
    name: string;
    /** VLAN ID for isolation */
    vlanId: number;
    /** Assigned IP address */
    ipAddress: string;
    /** Gateway type (tor, sing-box, direct, none) */
    gatewayType: GatewayType;
    /** Gateway status */
    gatewayStatus: GatewayStatus;
    /** Tunnel interface name (for gateways) */
    tunName?: string;
    /** Routing mark for policy routing */
    routingMark?: string;
    /** Interface status */
    status: BridgeStatus;
    /** Created timestamp */
    createdAt: string;
    /** Last updated timestamp */
    updatedAt: string;
}
/**
 * Bridge status response from API
 */
export interface BridgeStatusData {
    /** Virtual interface (null if not created) */
    interface?: VirtualInterface;
    /** Whether interface is ready for traffic */
    isReady: boolean;
    /** Whether gateway is running */
    gatewayRunning: boolean;
    /** Error messages if any */
    errors?: string[];
}
/**
 * VirtualInterfaceBridge component props
 */
export interface VirtualInterfaceBridgeProps {
    /** Router ID */
    routerId: string;
    /** Service instance ID */
    instanceId: string;
    /** Service name for display */
    serviceName?: string;
    /** Refresh interval in ms (default 5000) */
    pollInterval?: number;
    /** Additional CSS classes */
    className?: string;
    /** Custom content to render */
    children?: ReactNode;
    /** Callback when refresh is triggered */
    onRefresh?: () => void;
}
//# sourceMappingURL=types.d.ts.map