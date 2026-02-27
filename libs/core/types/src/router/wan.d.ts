/**
 * WAN (Wide Area Network) interface configuration types
 * Handles different WAN connection types: PPPoE, DHCP, Static IP, LTE
 */
/**
 * WAN link configuration summary
 */
export interface WANLinkConfig {
  /** RouterOS internal ID */
  id: string;
  /** Display name for the WAN link */
  name: string;
  /** WAN connection type */
  type: 'pppoe' | 'dhcp' | 'static' | 'lte';
  /** Whether the WAN link is enabled */
  isEnabled: boolean;
}
/**
 * PPPoE (Point-to-Point Protocol over Ethernet) WAN configuration
 */
export interface WANPPPoEConfig {
  /** Physical interface name */
  interface: string;
  /** PPPoE username */
  username: string;
  /** PPPoE password */
  password: string;
  /** Optional PPPoE profile name */
  profile?: string;
}
/**
 * DHCP WAN configuration
 */
export interface WANDHCPConfig {
  /** Physical interface name */
  interface: string;
  /** Whether to use peer-provided DNS servers */
  shouldUsePeerDNS: boolean;
  /** Whether this interface provides the default route */
  hasDefaultRoute: boolean;
}
/**
 * Static IP WAN configuration
 */
export interface WANStaticConfig {
  /** Physical interface name */
  interface: string;
  /** IP address in CIDR format (e.g., "192.168.1.1/24") */
  address: string;
  /** Gateway IP address */
  gateway: string;
  /** DNS server addresses */
  dnsServers: readonly string[];
}
/**
 * LTE (Long-Term Evolution) WAN configuration
 */
export interface WANLTEConfig {
  /** Physical interface name */
  interface: string;
  /** Access Point Name for cellular network */
  apn: string;
  /** Optional network name label */
  networkNameLabel?: string;
}
/**
 * WAN link with active configuration
 */
export interface WANLink {
  /** RouterOS internal ID */
  id: string;
  /** Display name for the WAN link */
  name: string;
  /** Whether the WAN link is enabled */
  isEnabled: boolean;
  /** Active configuration for this WAN link */
  config: WANPPPoEConfig | WANDHCPConfig | WANStaticConfig | WANLTEConfig;
}
//# sourceMappingURL=wan.d.ts.map
