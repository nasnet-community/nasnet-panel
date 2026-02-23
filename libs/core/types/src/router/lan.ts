/**
 * LAN (Local Area Network) configuration types
 * Handles bridges, networks, and LAN interfaces
 *
 * Note: DHCP types (DHCPServer, DHCPClient, DHCPLease) are now in dhcp.ts
 *
 * @module @nasnet/core/types/router/lan
 */

/**
 * Physical or logical LAN interface configuration
 *
 * @remarks
 * Represents a network interface that can be ethernet, bridge, or VLAN type
 */
export interface LANInterface {
  /** Unique identifier for this interface */
  id: string;

  /** Interface name (e.g., "ether1", "br0", "vlan100") */
  name: string;

  /** Interface type classification */
  type: 'ethernet' | 'bridge' | 'vlan';

  /** Whether this interface is currently active and operational */
  isEnabled: boolean;

  /** Maximum Transmission Unit size in bytes (optional, defaults to 1500) */
  mtu?: number;
}

/**
 * Bridge configuration for connecting multiple interfaces
 *
 * @remarks
 * Bridges multiple physical or virtual interfaces into a single logical interface
 */
export interface LANBridge {
  /** Unique identifier for this bridge */
  id: string;

  /** Bridge name (typically "br0", "br1", etc.) */
  name: string;

  /** Whether this bridge is operational */
  isEnabled: boolean;

  /** List of interface names participating in this bridge */
  readonly ports: readonly string[];

  /** Whether administrative path cost is manually configured */
  hasAdministrativePathCost: boolean;

  /** VLAN mode for the bridge (can be enabled or disabled) */
  vlanMode?: 'on' | 'off';
}

/**
 * IP network assignment to a LAN interface
 *
 * @remarks
 * Represents an IP address block assigned to an interface for DHCP or static routing
 */
export interface LANNetwork {
  /** Unique identifier for this network assignment */
  id: string;

  /** Network name or description */
  name: string;

  /** IP address block in CIDR notation (e.g., "192.168.88.0/24") */
  address: string;

  /** Interface name this network is assigned to */
  interface: string;

  /** Whether this network assignment is disabled */
  isDisabled: boolean;
}
