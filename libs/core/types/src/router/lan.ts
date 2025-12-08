/**
 * LAN (Local Area Network) configuration types
 * Handles bridges, networks, and LAN interfaces
 * 
 * Note: DHCP types (DHCPServer, DHCPClient, DHCPLease) are now in dhcp.ts
 */

export interface LANInterface {
  id: string;
  name: string;
  type: 'ethernet' | 'bridge' | 'vlan';
  enabled: boolean;
  mtu?: number;
}

export interface LANBridge {
  id: string;
  name: string;
  enabled: boolean;
  ports: string[]; // Interface names
  administrativePathCost: boolean;
  vlanMode?: 'on' | 'off';
}

export interface LANNetwork {
  id: string;
  name: string;
  address: string; // CIDR format
  interface: string;
  disabled: boolean;
}
