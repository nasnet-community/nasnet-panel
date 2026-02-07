/**
 * WAN Types
 *
 * TypeScript types for WAN interface data.
 * Story: NAS-6.8 - Implement WAN Link Configuration
 */

/**
 * WAN connection type
 */
export type WANConnectionType = 'DHCP' | 'PPPOE' | 'STATIC_IP' | 'LTE' | 'NONE';

/**
 * WAN connection status
 */
export type WANStatus =
  | 'CONNECTED'
  | 'CONNECTING'
  | 'DISCONNECTED'
  | 'ERROR'
  | 'DISABLED';

/**
 * WAN health status
 */
export type WANHealthStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';

/**
 * WAN interface data structure
 */
export interface WANInterfaceData {
  id: string;
  interfaceName: string;
  connectionType: WANConnectionType;
  status: WANStatus;
  publicIP?: string;
  gateway?: string;
  primaryDNS?: string;
  secondaryDNS?: string;
  uptime?: number; // Duration in seconds
  lastConnected?: string; // ISO timestamp
  isDefaultRoute: boolean;
  healthStatus: WANHealthStatus;
  healthTarget?: string;
  healthLatency?: number; // in milliseconds
  healthEnabled: boolean;
}

/**
 * DHCP client data
 */
export interface DhcpClientData {
  id: string;
  interface: string;
  disabled: boolean;
  addDefaultRoute: boolean;
  usePeerDNS: boolean;
  usePeerNTP: boolean;
  status: string;
  address?: string;
  dhcpServer?: string;
  gateway?: string;
  expiresAfter?: number; // Duration in seconds
  comment?: string;
}

/**
 * PPPoE client data
 */
export interface PppoeClientData {
  id: string;
  name: string;
  interface: string;
  disabled: boolean;
  username: string;
  serviceName?: string;
  addDefaultRoute: boolean;
  usePeerDNS: boolean;
  running: boolean;
  mtu: number;
  mru: number;
  comment?: string;
}

/**
 * Static IP configuration data
 */
export interface StaticIPConfigData {
  id: string;
  interface: string;
  address: string; // CIDR notation
  gateway: string;
  primaryDNS?: string;
  secondaryDNS?: string;
  comment?: string;
}

/**
 * LTE modem data
 */
export interface LteModemData {
  id: string;
  name: string;
  apn: string;
  signalStrength: number;
  running: boolean;
  operator?: string;
  networkType?: string;
  pinConfigured: boolean;
  comment?: string;
}

/**
 * Connection event data
 */
export interface ConnectionEventData {
  id: string;
  wanInterfaceId: string;
  eventType: string; // "CONNECTED", "DISCONNECTED", "AUTH_FAILED", "IP_CHANGED", etc.
  timestamp: string; // ISO timestamp
  publicIP?: string;
  gateway?: string;
  reason?: string;
  duration?: number; // in seconds
}
