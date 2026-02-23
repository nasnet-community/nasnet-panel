/**
 * Subnet Calculation Utilities
 * Provides functions for subnet mask and address range calculations
 */

import { isValidIPv4, ipToNumber, numberToIP, parseCIDR } from './ip';

/**
 * Checks if an IP address is within a given CIDR subnet
 * @param ip - The IP address to check
 * @param cidr - The CIDR subnet notation
 * @returns true if IP is in subnet, false otherwise
 *
 * @example
 * isIPInSubnet('192.168.1.50', '192.168.1.0/24') // => true
 * isIPInSubnet('192.168.2.1', '192.168.1.0/24') // => false
 * isIPInSubnet('10.0.0.100', '10.0.0.0/8') // => true
 */
export const isIPInSubnet = (ip: string, cidr: string): boolean => {
  if (!isValidIPv4(ip)) return false;

  const parsed = parseCIDR(cidr);
  if (!parsed) return false;

  const ipNum = ipToNumber(ip);
  const networkNum = ipToNumber(parsed.network);
  const mask = ipToNumber(parsed.netmask);

  return (ipNum & mask) === (networkNum & mask);
};

/**
 * Calculates the number of usable hosts in a subnet
 * @param prefix - CIDR prefix length (0-32)
 * @returns Number of usable host addresses
 *
 * @example
 * getHostCount(24) // => 254
 * getHostCount(25) // => 126
 * getHostCount(32) // => 1
 */
export const getHostCount = (prefix: number): number => {
  if (prefix < 0 || prefix > 32) return 0;
  if (prefix === 32) return 1;
  if (prefix === 31) return 2; // /31 is special case (RFC 3331)
  return Math.pow(2, 32 - prefix) - 2; // Subtract network and broadcast
};

/**
 * Gets the first usable host address in a subnet
 * @param cidr - CIDR notation
 * @returns First usable IP or null if invalid
 *
 * @example
 * getFirstHost('192.168.1.0/24') // => '192.168.1.1'
 * getFirstHost('10.0.0.0/8') // => '10.0.0.1'
 * getFirstHost('invalid') // => null
 */
export const getFirstHost = (cidr: string): string | null => {
  const parsed = parseCIDR(cidr);
  if (!parsed) return null;

  const networkNum = ipToNumber(parsed.network);
  // For /31 and /32, return network address itself
  if (parsed.prefix >= 31) return parsed.network;

  return numberToIP(networkNum + 1);
};

/**
 * Gets the last usable host address in a subnet
 * @param cidr - CIDR notation
 * @returns Last usable IP or null if invalid
 *
 * @example
 * getLastHost('192.168.1.0/24') // => '192.168.1.254'
 * getLastHost('10.0.0.0/8') // => '10.255.255.254'
 * getLastHost('invalid') // => null
 */
export const getLastHost = (cidr: string): string | null => {
  const parsed = parseCIDR(cidr);
  if (!parsed) return null;

  const broadcastNum = ipToNumber(parsed.broadcast);
  // For /31 and /32, return broadcast address itself
  if (parsed.prefix >= 31) return parsed.broadcast;

  return numberToIP(broadcastNum - 1);
};

/**
 * Calculates subnet mask from prefix length
 * @param prefix - CIDR prefix length (0-32)
 * @returns Subnet mask in dotted decimal notation
 *
 * @example
 * getPrefixMask(24) // => '255.255.255.0'
 * getPrefixMask(16) // => '255.255.0.0'
 * getPrefixMask(8) // => '255.0.0.0'
 */
export const getPrefixMask = (prefix: number): string => {
  if (prefix < 0 || prefix > 32) return '0.0.0.0';

  const mask = prefix === 0 ? 0 : -1 << (32 - prefix);
  return numberToIP(mask & 0xffffffff);
};

/**
 * Calculates the prefix length from a subnet mask
 * @param mask - Subnet mask in dotted decimal notation
 * @returns Prefix length (0-32) or -1 if invalid
 *
 * @example
 * getMaskPrefix('255.255.255.0') // => 24
 * getMaskPrefix('255.255.0.0') // => 16
 * getMaskPrefix('invalid') // => -1
 */
export const getMaskPrefix = (mask: string): number => {
  if (!isValidIPv4(mask)) return -1;

  const maskNum = ipToNumber(mask);
  // Check if mask is valid (continuous 1s followed by continuous 0s)
  const inverted = ~maskNum & 0xffffffff;
  if ((inverted & (inverted + 1)) !== 0) return -1;

  return 32 - Math.log2(inverted + 1);
};

/**
 * Checks if a subnet mask is valid
 * @param mask - Subnet mask to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidMask('255.255.255.0') // => true
 * isValidMask('255.255.255.128') // => true
 * isValidMask('255.255.256.0') // => false
 * isValidMask('255.255.128.255') // => false (non-contiguous)
 */
export const isValidMask = (mask: string): boolean => {
  return getMaskPrefix(mask) >= 0;
};

/**
 * Gets address range information for a CIDR subnet
 * @param cidr - CIDR notation
 * @returns Object with network, first host, last host, broadcast, and host count
 *
 * @example
 * getSubnetInfo("192.168.1.0/24")
 * // => { network: "192.168.1.0", firstHost: "192.168.1.1", lastHost: "192.168.1.254", broadcast: "192.168.1.255", hostCount: 254, prefix: 24 }
 */
export const getSubnetInfo = (cidr: string): {
  readonly network: string;
  readonly firstHost: string | null;
  readonly lastHost: string | null;
  readonly broadcast: string;
  readonly hostCount: number;
  readonly prefix: number;
} | null => {
  const parsed = parseCIDR(cidr);
  if (!parsed) return null;

  return {
    network: parsed.network,
    firstHost: getFirstHost(cidr),
    lastHost: getLastHost(cidr),
    broadcast: parsed.broadcast,
    hostCount: getHostCount(parsed.prefix),
    prefix: parsed.prefix
  };
};
