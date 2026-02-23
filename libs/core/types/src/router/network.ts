/**
 * Network interface types for MikroTik RouterOS
 */

/**
 * MikroTik supported network interface types
 */
export type InterfaceType =
  | 'ether'
  | 'bridge'
  | 'vlan'
  | 'wireless'
  | 'wlan'
  | 'pppoe'
  | 'vpn'
  | 'wireguard'
  | 'vrrp'
  | 'bond'
  | 'bonding'
  | 'loopback'
  | 'lte'
  | 'other';

/**
 * Interface administrative status
 */
export type InterfaceStatus = 'running' | 'disabled';

/**
 * Interface physical link status
 */
export type LinkStatus = 'up' | 'down' | 'unknown';

/**
 * Represents a MikroTik network interface
 */
export interface NetworkInterface {
  /** RouterOS internal ID */
  id: string;

  /** Interface name (e.g., "ether1", "bridge1") */
  name: string;

  /** Interface type */
  type: InterfaceType;

  /** Admin status (running/disabled) */
  status: InterfaceStatus;

  /** MAC address */
  macAddress: string;

  /** Link status (connected/disconnected) */
  linkStatus: LinkStatus;

  /** Maximum Transmission Unit */
  mtu?: number;

  /** User comment */
  comment?: string;
}

/**
 * Traffic statistics for a network interface
 */
export interface TrafficStatistics {
  /** Interface ID */
  interfaceId: string;

  /** Bytes transmitted */
  txBytes: number;

  /** Bytes received */
  rxBytes: number;

  /** Packets transmitted */
  txPackets: number;

  /** Packets received */
  rxPackets: number;

  /** Transmit errors */
  txErrors: number;

  /** Receive errors */
  rxErrors: number;

  /** Transmit drops */
  txDrops: number;

  /** Receive drops */
  rxDrops: number;
}

/**
 * ARP (Address Resolution Protocol) table entry
 */
export interface ARPEntry {
  /** RouterOS internal ID */
  id: string;

  /** IP address */
  ipAddress: string;

  /** MAC address */
  macAddress: string;

  /** Interface name */
  interface: string;

  /** ARP entry status */
  status: 'complete' | 'incomplete' | 'failed';

  /** Whether entry is dynamically learned (vs statically configured) */
  isDynamic: boolean;
}

/**
 * IP address assignment on an interface
 */
export interface IPAddress {
  /** RouterOS internal ID */
  id: string;

  /** IP address in CIDR notation (e.g., "192.168.1.1/24") */
  address: string;

  /** Network address */
  network: string;

  /** Interface name */
  interface: string;

  /** Whether assigned via DHCP */
  isDynamic: boolean;

  /** Whether address is disabled */
  isDisabled: boolean;
}
