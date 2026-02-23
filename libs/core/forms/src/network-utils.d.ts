/**
 * Network Utilities for IP Manipulation and Calculation
 *
 * Pure utility functions for IP address manipulation, subnet calculations,
 * and network generation. These are used alongside Zod schemas for network
 * input components and calculations.
 *
 * @module @nasnet/core/forms/network-utils
 */
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
export declare function ipToLong(ip: string): number;
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
export declare function longToIp(num: number): string;
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
export declare function isInSubnet(ip: string, subnet: string): boolean;
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
export declare function getNetworkAddress(ip: string, cidr: number): string;
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
export declare function getBroadcastAddress(ip: string, cidr: number): string;
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
export declare function getSubnetMask(cidr: number): string;
/**
 * Alias for getSubnetMask for backwards compatibility.
 *
 * @param cidr - CIDR prefix length (0-32)
 * @returns Subnet mask in dotted decimal format
 */
export declare const cidrToSubnetMask: typeof getSubnetMask;
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
export declare function subnetMaskToCidr(mask: string): number;
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
export declare function getUsableHostCount(cidr: number): number;
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
export declare function getTotalAddressCount(cidr: number): number;
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
export declare function getFirstUsableHost(ip: string, cidr: number): string;
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
export declare function getLastUsableHost(ip: string, cidr: number): string;
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
export declare function getSubnetInfo(ip: string, cidr: number): SubnetInfo;
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
export declare function doSubnetsOverlap(subnet1: string, subnet2: string): boolean;
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
export declare function isPrivateIp(ip: string): boolean;
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
export declare function isLoopbackIp(ip: string): boolean;
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
export declare function isMulticastIp(ip: string): boolean;
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
export declare function isLinkLocalIp(ip: string): boolean;
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
export declare function isPublicIp(ip: string): boolean;
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
export declare function classifyIp(ip: string): 'private' | 'public' | 'loopback' | 'multicast' | 'link-local' | 'reserved' | 'invalid';
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
export declare function hasDomesticLink(wanLinkType: WANLinkType): boolean;
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
export declare function getAvailableBaseNetworks(wanLinkType: WANLinkType, hasForeign?: boolean, hasVPN?: boolean): BaseNetworks;
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
export declare function getForeignNetworkNames(wanLinks?: WANLinks): string[];
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
export declare function getDomesticNetworkNames(wanLinks?: WANLinks, wanLinkType?: WANLinkType): string[];
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
export declare function getVPNClientNetworks(vpnClient?: VPNClient): VPNClientNetworks;
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
export declare function generateNetworks(wanLinkType: WANLinkType, wanLinks?: WANLinks, vpnClient?: VPNClient): Networks;
//# sourceMappingURL=network-utils.d.ts.map