/**
 * DeviceRoutingMatrix Types
 *
 * TypeScript interfaces for the DeviceRoutingMatrix pattern component.
 * Displays network devices and allows assigning them to service instances for routing.
 */

import type { ReactNode } from 'react';

/**
 * Network device from device discovery (DHCP + ARP)
 */
export interface NetworkDevice {
  deviceID: string;
  macAddress: string;
  ipAddress?: string;
  hostname?: string;
  active: boolean;
  isRouted: boolean;
  routingMark?: string;
  source: string; // 'dhcp', 'arp', or 'both'
  dhcpLease: boolean;
  arpEntry: boolean;
}

/**
 * Virtual interface (service gateway) available for routing
 */
export interface VirtualInterfaceInfo {
  id: string;
  instanceID: string;
  instanceName: string;
  interfaceName: string;
  ipAddress: string;
  routingMark: string;
  gatewayType: string;
  gatewayStatus: string;
}

/**
 * Device routing assignment
 */
export interface DeviceRouting {
  id: string;
  deviceID: string;
  macAddress: string;
  deviceIP?: string;
  deviceName?: string;
  instanceID: string;
  interfaceID: string;
  routingMode: 'MAC' | 'IP';
  routingMark: string;
  mangleRuleID: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Summary statistics for the routing matrix
 */
export interface DeviceRoutingMatrixStats {
  totalDevices: number;
  dhcpDevices: number;
  arpOnlyDevices: number;
  routedDevices: number;
  unroutedDevices: number;
  activeRoutings: number;
  activeInterfaces: number;
}

/**
 * Complete routing matrix data
 */
export interface DeviceRoutingMatrixData {
  devices: NetworkDevice[];
  interfaces: VirtualInterfaceInfo[];
  routings: DeviceRouting[];
  summary: DeviceRoutingMatrixStats;
}

/**
 * Routing status filter options
 */
export type RoutingStatus = 'all' | 'routed' | 'unrouted';

/**
 * Filters for device list
 */
export interface DeviceFilters {
  search: string;
  routingStatus: RoutingStatus;
  serviceFilter?: string; // Instance ID filter
}

/**
 * Action handler callbacks
 */
export interface DeviceRoutingActions {
  onAssign: (deviceID: string, interfaceID: string) => Promise<void>;
  onRemove: (routingID: string) => Promise<void>;
  onBulkAssign: (deviceIDs: string[], interfaceID: string) => Promise<void>;
}

/**
 * DeviceRoutingMatrix component props
 */
export interface DeviceRoutingMatrixProps {
  /** Router ID */
  routerId: string;
  /** Matrix data (devices, interfaces, routings, summary) */
  matrix: DeviceRoutingMatrixData;
  /** Action handlers */
  actions: DeviceRoutingActions;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Custom className */
  className?: string;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Whether to show summary stats */
  showSummary?: boolean;
  /** Custom children to render */
  children?: ReactNode;
}
