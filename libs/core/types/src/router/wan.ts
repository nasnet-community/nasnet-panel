/**
 * WAN (Wide Area Network) interface configuration types
 * Handles different WAN connection types: PPPoE, DHCP, Static IP, LTE
 */

export interface WANLinkConfig {
  id: string;
  name: string;
  type: 'pppoe' | 'dhcp' | 'static' | 'lte';
  enabled: boolean;
}

export interface WANPPPoEConfig {
  interface: string;
  username: string;
  password: string;
  profile?: string;
}

export interface WANDHCPConfig {
  interface: string;
  usePeerDNS: boolean;
  defaultRoute: boolean;
}

export interface WANStaticConfig {
  interface: string;
  address: string; // CIDR format (192.168.1.1/24)
  gateway: string;
  dnsServers: string[];
}

export interface WANLTEConfig {
  interface: string;
  apn: string;
  networkName?: string;
}

export interface WANLink {
  id: string;
  name: string;
  enabled: boolean;
  config: WANPPPoEConfig | WANDHCPConfig | WANStaticConfig | WANLTEConfig;
}
