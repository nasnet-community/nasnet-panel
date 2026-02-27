/**
 * Network Utilities for IP Manipulation and Calculation
 *
 * Pure utility functions for IP address manipulation, subnet calculations,
 * and network generation. These are used alongside Zod schemas for network
 * input components and calculations.
 *
 * @module @nasnet/core/forms/network-utils
 */

// ============================================================================
// Types for Network Utilities
// ============================================================================

/**
 * WAN link type indicating network availability
 */
export type WANLinkType = 'foreign' | 'domestic' | 'both';

/**
 * Base network availability flags
 */
export interface BaseNetworks {
  /** Foreign networks are available */
  Foreign: boolean;
  /** VPN networks are available */
  VPN: boolean;
  /** Domestic networks are available */
  Domestic: boolean;
  /** Split routing is available (domestic + foreign/VPN) */
  Split: boolean;
}

/**
 * VPN client networks grouped by protocol
 */
export interface VPNClientNetworks {
  Wireguard?: string[];
  OpenVPN?: string[];
  PPTP?: string[];
  L2TP?: string[];
  SSTP?: string[];
  IKev2?: string[];
}

/**
 * Complete network configuration
 */
export interface Networks {
  BaseNetworks: BaseNetworks;
  ForeignNetworks?: string[];
  DomesticNetworks?: string[];
  VPNClientNetworks?: VPNClientNetworks;
}

/**
 * WAN configuration entry
 */
export interface WANConfig {
  name?: string;
  [key: string]: unknown;
}

/**
 * WAN link group (Foreign or Domestic)
 */
export interface WANLinkGroup {
  WANConfigs?: WANConfig[];
}

/**
 * WAN links configuration
 */
export interface WANLinks {
  Foreign?: WANLinkGroup;
  Domestic?: WANLinkGroup;
}

/**
 * VPN client configuration entry
 */
export interface VPNClientConfig {
  Name?: string;
  [key: string]: unknown;
}

/**
 * Complete VPN client configuration
 */
export interface VPNClient {
  Wireguard?: VPNClientConfig[];
  OpenVPN?: VPNClientConfig[];
  PPTP?: VPNClientConfig[];
  L2TP?: VPNClientConfig[];
  SSTP?: VPNClientConfig[];
  IKeV2?: VPNClientConfig[];
}

/**
 * Subnet calculation result
 */
export interface SubnetInfo {
  /** Network address (e.g., 192.168.1.0) */
  networkAddress: string;
  /** Broadcast address (e.g., 192.168.1.255) */
  broadcastAddress: string;
  /** Subnet mask in dotted decimal (e.g., 255.255.255.0) */
  subnetMask: string;
  /** CIDR prefix length (e.g., 24) */
  prefixLength: number;
  /** First usable host IP */
  firstUsableHost: string;
  /** Last usable host IP */
  lastUsableHost: string;
  /** Number of usable hosts */
  usableHostCount: number;
  /** Total number of addresses in subnet */
  totalAddresses: number;
}

// ============================================================================
// IP Address Manipulation Functions
// ============================================================================

/**
 * Convert an IPv4 address string to a 32-bit unsigned integer.
 *
 * @param ip - IPv4 address string (e.g., "192.168.1.1")
 * @returns 32-bit unsigned integer representation
 *
 * @example
 * ipToLong('0.0.0.0');        // 0
 * ipToLong('255.255.255.255'); // 4294967295
 * ipToLong('192.168.1.1');    // 3232235777
 */
export function ipToLong(ip: string): number {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    throw new Error(`Invalid IPv4 address: ${ip}`);
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/**
 * Convert a 32-bit unsigned integer to an IPv4 address string.
 *
 * @param num - 32-bit unsigned integer
 * @returns IPv4 address string
 *
 * @example
 * longToIp(0);           // "0.0.0.0"
 * longToIp(4294967295);  // "255.255.255.255"
 * longToIp(3232235777);  // "192.168.1.1"
 */
export function longToIp(num: number): string {
  if (num < 0 || num > 4294967295) {
    throw new Error(`Invalid IP number: ${num}`);
  }
  return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
}

/**
 * Check if an IP address is within a given subnet (CIDR notation).
 *
 * @param ip - IPv4 address to check
 * @param subnet - Subnet in CIDR notation (e.g., "192.168.1.0/24")
 * @returns true if IP is within the subnet
 *
 * @example
 * isInSubnet('192.168.1.50', '192.168.1.0/24');  // true
 * isInSubnet('192.168.2.1', '192.168.1.0/24');   // false
 * isInSubnet('10.0.0.5', '10.0.0.0/8');          // true
 */
export function isInSubnet(ip: string, subnet: string): boolean {
  const [networkIp, prefixStr] = subnet.split('/');
  const prefix = parseInt(prefixStr, 10);

  if (isNaN(prefix) || prefix < 0 || prefix > 32) {
    throw new Error(`Invalid subnet: ${subnet}`);
  }

  const ipNum = ipToLong(ip);
  const networkNum = ipToLong(networkIp);
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;

  return (ipNum & mask) === (networkNum & mask);
}

/**
 * Calculate the network address from an IP and CIDR prefix.
 *
 * @param ip - IPv4 address
 * @param cidr - CIDR prefix length (0-32)
 * @returns Network address
 *
 * @example
 * getNetworkAddress('192.168.1.50', 24);  // "192.168.1.0"
 * getNetworkAddress('10.20.30.40', 8);    // "10.0.0.0"
 */
export function getNetworkAddress(ip: string, cidr: number): string {
  if (cidr < 0 || cidr > 32) {
    throw new Error(`Invalid CIDR prefix: ${cidr}`);
  }

  const ipNum = ipToLong(ip);
  const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  // Apply >>> 0 to ensure unsigned result from bitwise AND
  return longToIp((ipNum & mask) >>> 0);
}

/**
 * Calculate the broadcast address from an IP and CIDR prefix.
 *
 * @param ip - IPv4 address
 * @param cidr - CIDR prefix length (0-32)
 * @returns Broadcast address
 *
 * @example
 * getBroadcastAddress('192.168.1.0', 24);  // "192.168.1.255"
 * getBroadcastAddress('10.0.0.0', 8);      // "10.255.255.255"
 */
export function getBroadcastAddress(ip: string, cidr: number): string {
  if (cidr < 0 || cidr > 32) {
    throw new Error(`Invalid CIDR prefix: ${cidr}`);
  }

  // Special case: /0 means all hosts (broadcast is 255.255.255.255)
  if (cidr === 0) {
    return '255.255.255.255';
  }

  const networkNum = ipToLong(getNetworkAddress(ip, cidr));
  const hostBits = cidr === 32 ? 0 : ((1 << (32 - cidr)) - 1) >>> 0;
  return longToIp((networkNum | hostBits) >>> 0);
}

/**
 * Convert a CIDR prefix length to a dotted decimal subnet mask.
 *
 * @param cidr - CIDR prefix length (0-32)
 * @returns Subnet mask in dotted decimal format
 *
 * @example
 * getSubnetMask(24);  // "255.255.255.0"
 * getSubnetMask(16);  // "255.255.0.0"
 * getSubnetMask(8);   // "255.0.0.0"
 * getSubnetMask(0);   // "0.0.0.0"
 */
export function getSubnetMask(cidr: number): string {
  if (cidr < 0 || cidr > 32) {
    throw new Error(`Invalid CIDR prefix: ${cidr}`);
  }

  const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  return longToIp(mask);
}

/**
 * Alias for getSubnetMask for backwards compatibility.
 *
 * @param cidr - CIDR prefix length (0-32)
 * @returns Subnet mask in dotted decimal format
 */
export const cidrToSubnetMask = getSubnetMask;

/**
 * Convert a dotted decimal subnet mask to a CIDR prefix length.
 *
 * @param mask - Subnet mask in dotted decimal format
 * @returns CIDR prefix length
 * @throws Error if mask is not a valid contiguous subnet mask
 *
 * @example
 * subnetMaskToCidr('255.255.255.0');    // 24
 * subnetMaskToCidr('255.255.0.0');      // 16
 * subnetMaskToCidr('255.255.255.128');  // 25
 */
export function subnetMaskToCidr(mask: string): number {
  const maskNum = ipToLong(mask);

  // Check if it's a valid contiguous mask
  const binary = maskNum.toString(2).padStart(32, '0');
  if (!/^1*0*$/.test(binary)) {
    throw new Error(`Invalid subnet mask: ${mask} (must be contiguous)`);
  }

  // Count the 1 bits
  return binary.replace(/0/g, '').length;
}

/**
 * Calculate the number of usable hosts in a subnet.
 * For /31 and /32, returns special values per RFC.
 *
 * @param cidr - CIDR prefix length (0-32)
 * @returns Number of usable hosts
 *
 * @example
 * getUsableHostCount(24);  // 254
 * getUsableHostCount(16);  // 65534
 * getUsableHostCount(30);  // 2
 * getUsableHostCount(31);  // 2 (point-to-point)
 * getUsableHostCount(32);  // 1 (single host)
 */
export function getUsableHostCount(cidr: number): number {
  if (cidr < 0 || cidr > 32) {
    throw new Error(`Invalid CIDR prefix: ${cidr}`);
  }

  if (cidr === 32) return 1; // Single host
  if (cidr === 31) return 2; // Point-to-point link (RFC 3021)
  if (cidr === 0) return 4294967294; // /0 = 2^32 - 2

  return Math.pow(2, 32 - cidr) - 2;
}

/**
 * Calculate the total number of addresses in a subnet.
 *
 * @param cidr - CIDR prefix length (0-32)
 * @returns Total number of addresses
 *
 * @example
 * getTotalAddressCount(24);  // 256
 * getTotalAddressCount(16);  // 65536
 * getTotalAddressCount(32);  // 1
 */
export function getTotalAddressCount(cidr: number): number {
  if (cidr < 0 || cidr > 32) {
    throw new Error(`Invalid CIDR prefix: ${cidr}`);
  }

  return Math.pow(2, 32 - cidr);
}

/**
 * Get the first usable host IP in a subnet.
 *
 * @param ip - IPv4 address in the subnet
 * @param cidr - CIDR prefix length (0-32)
 * @returns First usable host IP
 *
 * @example
 * getFirstUsableHost('192.168.1.0', 24);  // "192.168.1.1"
 * getFirstUsableHost('10.0.0.0', 8);      // "10.0.0.1"
 */
export function getFirstUsableHost(ip: string, cidr: number): string {
  if (cidr === 32) return ip; // /32 is the only host
  if (cidr === 31) return getNetworkAddress(ip, cidr); // Point-to-point uses both

  const networkNum = ipToLong(getNetworkAddress(ip, cidr));
  return longToIp(networkNum + 1);
}

/**
 * Get the last usable host IP in a subnet.
 *
 * @param ip - IPv4 address in the subnet
 * @param cidr - CIDR prefix length (0-32)
 * @returns Last usable host IP
 *
 * @example
 * getLastUsableHost('192.168.1.0', 24);  // "192.168.1.254"
 * getLastUsableHost('10.0.0.0', 8);      // "10.255.255.254"
 */
export function getLastUsableHost(ip: string, cidr: number): string {
  if (cidr === 32) return ip; // /32 is the only host
  if (cidr === 31) return getBroadcastAddress(ip, cidr); // Point-to-point uses both

  const broadcastNum = ipToLong(getBroadcastAddress(ip, cidr));
  return longToIp(broadcastNum - 1);
}

/**
 * Get complete subnet information from an IP and CIDR.
 *
 * @param ip - IPv4 address
 * @param cidr - CIDR prefix length (0-32)
 * @returns Complete subnet information
 *
 * @example
 * const info = getSubnetInfo('192.168.1.50', 24);
 * // {
 * //   networkAddress: '192.168.1.0',
 * //   broadcastAddress: '192.168.1.255',
 * //   subnetMask: '255.255.255.0',
 * //   prefixLength: 24,
 * //   firstUsableHost: '192.168.1.1',
 * //   lastUsableHost: '192.168.1.254',
 * //   usableHostCount: 254,
 * //   totalAddresses: 256
 * // }
 */
export function getSubnetInfo(ip: string, cidr: number): SubnetInfo {
  return {
    networkAddress: getNetworkAddress(ip, cidr),
    broadcastAddress: getBroadcastAddress(ip, cidr),
    subnetMask: getSubnetMask(cidr),
    prefixLength: cidr,
    firstUsableHost: getFirstUsableHost(ip, cidr),
    lastUsableHost: getLastUsableHost(ip, cidr),
    usableHostCount: getUsableHostCount(cidr),
    totalAddresses: getTotalAddressCount(cidr),
  };
}

/**
 * Check if two IP ranges/subnets overlap.
 *
 * @param subnet1 - First subnet in CIDR notation
 * @param subnet2 - Second subnet in CIDR notation
 * @returns true if subnets overlap
 *
 * @example
 * doSubnetsOverlap('192.168.1.0/24', '192.168.1.0/25');  // true (second is subset)
 * doSubnetsOverlap('192.168.1.0/24', '192.168.2.0/24');  // false
 * doSubnetsOverlap('10.0.0.0/8', '10.1.0.0/16');         // true
 */
export function doSubnetsOverlap(subnet1: string, subnet2: string): boolean {
  const [ip1, prefix1Str] = subnet1.split('/');
  const [ip2, prefix2Str] = subnet2.split('/');

  const prefix1 = parseInt(prefix1Str, 10);
  const prefix2 = parseInt(prefix2Str, 10);

  // Check if either network contains the other
  return isInSubnet(ip1, subnet2) || isInSubnet(ip2, subnet1);
}

// ============================================================================
// IP Classification Functions
// ============================================================================

/**
 * Check if an IP address is in a private range (RFC 1918).
 *
 * @param ip - IPv4 address
 * @returns true if IP is private
 *
 * @example
 * isPrivateIp('192.168.1.1');  // true
 * isPrivateIp('10.0.0.1');     // true
 * isPrivateIp('8.8.8.8');      // false
 */
export function isPrivateIp(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [a, b] = parts;

  // 10.0.0.0/8
  if (a === 10) return true;

  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;

  return false;
}

/**
 * Check if an IP address is a loopback address (127.0.0.0/8).
 *
 * @param ip - IPv4 address
 * @returns true if IP is loopback
 *
 * @example
 * isLoopbackIp('127.0.0.1');  // true
 * isLoopbackIp('127.1.2.3');  // true
 * isLoopbackIp('192.168.1.1'); // false
 */
export function isLoopbackIp(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }
  return parts[0] === 127;
}

/**
 * Check if an IP address is a multicast address (224.0.0.0/4).
 *
 * @param ip - IPv4 address
 * @returns true if IP is multicast
 *
 * @example
 * isMulticastIp('224.0.0.1');  // true
 * isMulticastIp('239.255.255.255'); // true
 * isMulticastIp('192.168.1.1'); // false
 */
export function isMulticastIp(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }
  return parts[0] >= 224 && parts[0] <= 239;
}

/**
 * Check if an IP address is link-local (169.254.0.0/16).
 *
 * @param ip - IPv4 address
 * @returns true if IP is link-local
 *
 * @example
 * isLinkLocalIp('169.254.1.1');  // true
 * isLinkLocalIp('192.168.1.1');  // false
 */
export function isLinkLocalIp(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }
  return parts[0] === 169 && parts[1] === 254;
}

/**
 * Check if an IP address is a public (globally routable) address.
 *
 * @param ip - IPv4 address
 * @returns true if IP is public
 *
 * @example
 * isPublicIp('8.8.8.8');       // true
 * isPublicIp('192.168.1.1');   // false
 * isPublicIp('127.0.0.1');     // false
 */
export function isPublicIp(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [a, b] = parts;

  // Exclude special ranges
  if (a === 0) return false; // 0.0.0.0/8
  if (a === 10) return false; // 10.0.0.0/8
  if (a === 127) return false; // 127.0.0.0/8
  if (a === 169 && b === 254) return false; // 169.254.0.0/16
  if (a === 172 && b >= 16 && b <= 31) return false; // 172.16.0.0/12
  if (a === 192 && b === 168) return false; // 192.168.0.0/16
  if (a >= 224) return false; // 224.0.0.0/4 and above

  return true;
}

/**
 * Classify an IP address into its type.
 *
 * @param ip - IPv4 address
 * @returns Classification string
 *
 * @example
 * classifyIp('192.168.1.1');  // 'private'
 * classifyIp('8.8.8.8');      // 'public'
 * classifyIp('127.0.0.1');    // 'loopback'
 * classifyIp('224.0.0.1');    // 'multicast'
 */
export function classifyIp(
  ip: string
): 'private' | 'public' | 'loopback' | 'multicast' | 'link-local' | 'reserved' | 'invalid' {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return 'invalid';
  }

  if (isLoopbackIp(ip)) return 'loopback';
  if (isLinkLocalIp(ip)) return 'link-local';
  if (isPrivateIp(ip)) return 'private';
  if (isMulticastIp(ip)) return 'multicast';
  if (parts[0] === 0 || parts[0] >= 240) return 'reserved';
  return 'public';
}

// ============================================================================
// Network Generation Functions (Ported from Qwik)
// ============================================================================

/**
 * Check if the domestic link is available based on WAN link type.
 *
 * @param wanLinkType - The WAN link type
 * @returns true if domestic link is available
 *
 * @example
 * hasDomesticLink('domestic');  // true
 * hasDomesticLink('both');      // true
 * hasDomesticLink('foreign');   // false
 */
export function hasDomesticLink(wanLinkType: WANLinkType): boolean {
  return wanLinkType === 'domestic' || wanLinkType === 'both';
}

/**
 * Get available base networks based on configuration.
 *
 * @param wanLinkType - The WAN link type
 * @param hasForeign - Whether foreign links are configured
 * @param hasVPN - Whether VPN clients are configured
 * @returns BaseNetworks object with availability flags
 *
 * @example
 * getAvailableBaseNetworks('both', true, false);
 * // { Foreign: true, VPN: false, Domestic: true, Split: true }
 */
export function getAvailableBaseNetworks(
  wanLinkType: WANLinkType,
  hasForeign: boolean = false,
  hasVPN: boolean = false
): BaseNetworks {
  const domestic = hasDomesticLink(wanLinkType);

  return {
    Foreign: hasForeign,
    VPN: hasVPN,
    Domestic: domestic,
    Split: domestic && (hasForeign || hasVPN),
  };
}

/**
 * Extract foreign network names from WAN links configuration.
 *
 * @param wanLinks - The WAN links configuration
 * @returns Array of foreign network names
 *
 * @example
 * getForeignNetworkNames({ Foreign: { WANConfigs: [{ name: 'WAN1' }] } });
 * // ['WAN1']
 */
export function getForeignNetworkNames(wanLinks?: WANLinks): string[] {
  if (!wanLinks?.Foreign?.WANConfigs) return [];

  return wanLinks.Foreign.WANConfigs.map(
    (config, index) => config.name || `Foreign-Link-${index + 1}`
  );
}

/**
 * Extract domestic network names from WAN links configuration.
 *
 * @param wanLinks - The WAN links configuration
 * @param wanLinkType - The WAN link type to check if domestic is available
 * @returns Array of domestic network names
 *
 * @example
 * getDomesticNetworkNames(
 *   { Domestic: { WANConfigs: [{ name: 'Local' }] } },
 *   'domestic'
 * );
 * // ['Local']
 */
export function getDomesticNetworkNames(wanLinks?: WANLinks, wanLinkType?: WANLinkType): string[] {
  if (!wanLinkType || !hasDomesticLink(wanLinkType)) return [];
  if (!wanLinks?.Domestic?.WANConfigs) return [];

  return wanLinks.Domestic.WANConfigs.map(
    (config, index) => config.name || `Domestic-Link-${index + 1}`
  );
}

/**
 * Extract VPN client network names grouped by protocol.
 *
 * @param vpnClient - The VPN client configuration
 * @returns VPNClientNetworks object with protocol-specific network arrays
 *
 * @example
 * getVPNClientNetworks({
 *   Wireguard: [{ Name: 'WG1' }],
 *   OpenVPN: [{ Name: 'OV1' }]
 * });
 * // { Wireguard: ['WG1'], OpenVPN: ['OV1'] }
 */
export function getVPNClientNetworks(vpnClient?: VPNClient): VPNClientNetworks {
  if (!vpnClient) return {};

  const vpnClientNetworks: VPNClientNetworks = {};

  if (vpnClient.Wireguard && vpnClient.Wireguard.length > 0) {
    vpnClientNetworks.Wireguard = vpnClient.Wireguard.map(
      (config, index) => config.Name || `Wireguard-${index + 1}`
    );
  }

  if (vpnClient.OpenVPN && vpnClient.OpenVPN.length > 0) {
    vpnClientNetworks.OpenVPN = vpnClient.OpenVPN.map(
      (config, index) => config.Name || `OpenVPN-${index + 1}`
    );
  }

  if (vpnClient.PPTP && vpnClient.PPTP.length > 0) {
    vpnClientNetworks.PPTP = vpnClient.PPTP.map(
      (config, index) => config.Name || `PPTP-${index + 1}`
    );
  }

  if (vpnClient.L2TP && vpnClient.L2TP.length > 0) {
    vpnClientNetworks.L2TP = vpnClient.L2TP.map(
      (config, index) => config.Name || `L2TP-${index + 1}`
    );
  }

  if (vpnClient.SSTP && vpnClient.SSTP.length > 0) {
    vpnClientNetworks.SSTP = vpnClient.SSTP.map(
      (config, index) => config.Name || `SSTP-${index + 1}`
    );
  }

  if (vpnClient.IKeV2 && vpnClient.IKeV2.length > 0) {
    vpnClientNetworks.IKev2 = vpnClient.IKeV2.map(
      (config, index) => config.Name || `IKev2-${index + 1}`
    );
  }

  return vpnClientNetworks;
}

/**
 * Generate complete network configuration based on WAN links and VPN client.
 *
 * @param wanLinkType - The WAN link type that determines if domestic link is available
 * @param wanLinks - The WAN links configuration containing Foreign and Domestic links
 * @param vpnClient - The VPN client configuration containing VPN connections
 * @returns Networks configuration with BaseNetworks, ForeignNetworks, DomesticNetworks, and VPNClientNetworks
 *
 * @example
 * const networks = generateNetworks('both', {
 *   Foreign: { WANConfigs: [{ name: 'WAN1' }] },
 *   Domestic: { WANConfigs: [{ name: 'Local' }] }
 * }, {
 *   Wireguard: [{ Name: 'MyVPN' }]
 * });
 */
export function generateNetworks(
  wanLinkType: WANLinkType,
  wanLinks?: WANLinks,
  vpnClient?: VPNClient
): Networks {
  // Determine what networks are available
  const hasDomestic = hasDomesticLink(wanLinkType);
  const hasForeignLinks = !!(
    wanLinks?.Foreign?.WANConfigs && wanLinks.Foreign.WANConfigs.length > 0
  );
  const hasVPNClients = !!(
    vpnClient &&
    ((vpnClient.Wireguard && vpnClient.Wireguard.length > 0) ||
      (vpnClient.OpenVPN && vpnClient.OpenVPN.length > 0) ||
      (vpnClient.PPTP && vpnClient.PPTP.length > 0) ||
      (vpnClient.L2TP && vpnClient.L2TP.length > 0) ||
      (vpnClient.SSTP && vpnClient.SSTP.length > 0) ||
      (vpnClient.IKeV2 && vpnClient.IKeV2.length > 0))
  );

  // Build BaseNetworks
  const baseNetworks: BaseNetworks = {
    Foreign: hasForeignLinks,
    VPN: hasVPNClients,
    Domestic: hasDomestic,
    Split: hasDomestic && (hasForeignLinks || hasVPNClients),
  };

  // Extract network names
  const foreignNetworks = getForeignNetworkNames(wanLinks);
  const domesticNetworks = getDomesticNetworkNames(wanLinks, wanLinkType);
  const vpnClientNetworks = getVPNClientNetworks(vpnClient);

  return {
    BaseNetworks: baseNetworks,
    ForeignNetworks: foreignNetworks.length > 0 ? foreignNetworks : undefined,
    DomesticNetworks: domesticNetworks.length > 0 ? domesticNetworks : undefined,
    VPNClientNetworks: Object.keys(vpnClientNetworks).length > 0 ? vpnClientNetworks : undefined,
  };
}
