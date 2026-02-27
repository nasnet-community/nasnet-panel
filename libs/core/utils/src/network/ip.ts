/**
 * IP Address Utilities
 * Provides functions for IPv4 validation and conversion
 */

/**
 * Validates if a string is a valid IPv4 address
 * @param ip - The IP address string to validate
 * @returns true if valid IPv4, false otherwise
 *
 * @example
 * isValidIPv4('192.168.1.1') // => true
 * isValidIPv4('256.0.0.1') // => false
 * isValidIPv4('not an ip') // => false
 */
export const isValidIPv4 = (ip: string): boolean => {
  const ipv4Regex =
    /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
  return ipv4Regex.test(ip);
};

/**
 * Validates if a string is a valid CIDR subnet notation
 * @param cidr - The CIDR notation to validate (e.g., "192.168.1.0/24")
 * @returns true if valid CIDR, false otherwise
 *
 * @example
 * isValidSubnet('192.168.1.0/24') // => true
 * isValidSubnet('192.168.1.0/33') // => false
 * isValidSubnet('192.168.1.0') // => false
 */
export const isValidSubnet = (cidr: string): boolean => {
  const cidrRegex =
    /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$/;
  return cidrRegex.test(cidr);
};

/**
 * Converts an IPv4 address to a 32-bit number
 * @param ip - The IPv4 address string
 * @returns The numerical representation, or 0 if invalid
 *
 * @example
 * ipToNumber('192.168.1.1') // => 3232235777
 * ipToNumber('0.0.0.0') // => 0
 * ipToNumber('255.255.255.255') // => 4294967295
 */
export const ipToNumber = (ip: string): number => {
  if (!isValidIPv4(ip)) return 0;

  const parts = ip.split('.');
  return parts.reduce((acc, part) => {
    return (acc << 8) | parseInt(part, 10);
  }, 0);
};

/**
 * Converts a 32-bit number back to IPv4 address format
 * @param num - The numerical representation
 * @returns The IPv4 address string
 *
 * @example
 * numberToIP(3232235777) // => '192.168.1.1'
 * numberToIP(0) // => '0.0.0.0'
 * numberToIP(4294967295) // => '255.255.255.255'
 */
export const numberToIP = (num: number): string => {
  return [(num >>> 24) & 0xff, (num >>> 16) & 0xff, (num >>> 8) & 0xff, num & 0xff].join('.');
};

/**
 * Parses CIDR notation and returns network, netmask, and broadcast addresses
 * @param cidr - CIDR notation (e.g., "192.168.1.0/24")
 * @returns Object with network, netmask, and broadcast addresses, or null if invalid
 *
 * @example
 * parseCIDR('192.168.1.0/24') // => { network: '192.168.1.0', netmask: '255.255.255.0', broadcast: '192.168.1.255', prefix: 24 }
 * parseCIDR('10.0.0.0/8') // => { network: '10.0.0.0', netmask: '255.0.0.0', broadcast: '10.255.255.255', prefix: 8 }
 */
export const parseCIDR = (
  cidr: string
): {
  network: string;
  netmask: string;
  broadcast: string;
  prefix: number;
} | null => {
  if (!isValidSubnet(cidr)) return null;

  const [ip, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr, 10);

  if (!isValidIPv4(ip) || prefix < 0 || prefix > 32) return null;

  const ipNum = ipToNumber(ip);
  const mask = prefix === 0 ? 0 : -1 << (32 - prefix);
  const network = ipNum & mask;
  const broadcast = network | ~mask;

  return {
    network: numberToIP(network),
    netmask: numberToIP(mask),
    broadcast: numberToIP(broadcast),
    prefix,
  };
};

/**
 * Compares two IPv4 addresses numerically
 * @param ip1 - First IP address
 * @param ip2 - Second IP address
 * @returns Negative if ip1 < ip2, positive if ip1 > ip2, 0 if equal
 *
 * @example
 * compareIPv4('192.168.1.1', '192.168.1.2') // => negative number
 * compareIPv4('10.0.0.1', '10.0.0.1') // => 0
 * compareIPv4('192.168.2.1', '192.168.1.1') // => positive number
 */
export const compareIPv4 = (ip1: string, ip2: string): number => {
  const num1 = ipToNumber(ip1);
  const num2 = ipToNumber(ip2);
  return num1 - num2;
};

/**
 * Validates if a string is a valid MAC address
 * @param mac - The MAC address string to validate
 * @returns true if valid MAC address, false otherwise
 *
 * @example
 * isValidMACAddress('00:1A:2B:3C:4D:5E') // => true
 * isValidMACAddress('00-1A-2B-3C-4D-5E') // => true
 * isValidMACAddress('001A2B3C4D5E') // => true
 * isValidMACAddress('invalid') // => false
 */
export const isValidMACAddress = (mac: string): boolean => {
  // Supports formats: XX:XX:XX:XX:XX:XX, XX-XX-XX-XX-XX-XX, XXXXXXXXXXXX
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$|^([0-9A-Fa-f]{12})$/;
  return macRegex.test(mac);
};

/**
 * Checks if an IP address is within a given subnet
 * @param ip - The IP address to check
 * @param cidr - The CIDR subnet notation
 * @returns true if IP is within the subnet, false otherwise
 *
 * @example
 * isIPInSubnet('192.168.1.100', '192.168.1.0/24') // => true
 * isIPInSubnet('192.168.2.100', '192.168.1.0/24') // => false
 */
export const isIPInSubnet = (ip: string, cidr: string): boolean => {
  const parsed = parseCIDR(cidr);
  if (!parsed) return false;

  const ipNum = ipToNumber(ip);
  const networkNum = ipToNumber(parsed.network);
  const maskNum = ipToNumber(parsed.netmask);

  return (ipNum & maskNum) === (networkNum & maskNum);
};

/**
 * Gets the host count in a subnet
 * @param cidr - The CIDR subnet notation
 * @returns Number of usable hosts, or 0 if invalid
 *
 * @example
 * getHostCount('192.168.1.0/24') // => 254 (256 - 2)
 * getHostCount('192.168.1.0/25') // => 126 (128 - 2)
 */
export const getHostCount = (cidr: string): number => {
  const parsed = parseCIDR(cidr);
  if (!parsed) return 0;

  const prefix = parsed.prefix;
  // Special cases
  if (prefix === 31) return 2; // Point-to-point, RFC 3021
  if (prefix === 32) return 1; // Single host

  // Total addresses - 2 (network and broadcast)
  return Math.pow(2, 32 - prefix) - 2;
};

/**
 * Gets the first usable host IP in a subnet
 * @param cidr - The CIDR subnet notation
 * @returns First usable IP address, or empty string if invalid
 *
 * @example
 * getFirstHost('192.168.1.0/24') // => '192.168.1.1'
 * getFirstHost('10.0.0.0/8') // => '10.0.0.1'
 */
export const getFirstHost = (cidr: string): string => {
  const parsed = parseCIDR(cidr);
  if (!parsed) return '';

  const prefix = parsed.prefix;
  if (prefix === 31 || prefix === 32) {
    return parsed.network; // No separate first host
  }

  const networkNum = ipToNumber(parsed.network);
  return numberToIP(networkNum + 1);
};

/**
 * Gets the last usable host IP in a subnet
 * @param cidr - The CIDR subnet notation
 * @returns Last usable IP address, or empty string if invalid
 *
 * @example
 * getLastHost('192.168.1.0/24') // => '192.168.1.254'
 * getLastHost('10.0.0.0/8') // => '10.255.255.254'
 */
export const getLastHost = (cidr: string): string => {
  const parsed = parseCIDR(cidr);
  if (!parsed) return '';

  const prefix = parsed.prefix;
  if (prefix === 31 || prefix === 32) {
    return parsed.broadcast; // No separate last host
  }

  const broadcastNum = ipToNumber(parsed.broadcast);
  return numberToIP(broadcastNum - 1);
};

/**
 * Converts a prefix length to a netmask (e.g., 24 => 255.255.255.0)
 * @param prefix - Prefix length (0-32)
 * @returns Netmask in dotted decimal notation
 *
 * @example
 * getPrefixMask(24) // => '255.255.255.0'
 * getPrefixMask(16) // => '255.255.0.0'
 * getPrefixMask(8) // => '255.0.0.0'
 */
export const getPrefixMask = (prefix: number): string => {
  if (prefix < 0 || prefix > 32) return '';

  const mask = prefix === 0 ? 0 : -1 << (32 - prefix);
  return numberToIP(mask >>> 0); // >>> 0 ensures unsigned 32-bit
};

/**
 * Converts a netmask to a prefix length (e.g., 255.255.255.0 => 24)
 * @param mask - Netmask in dotted decimal notation
 * @returns Prefix length (0-32), or -1 if invalid
 *
 * @example
 * getMaskPrefix('255.255.255.0') // => 24
 * getMaskPrefix('255.255.0.0') // => 16
 * getMaskPrefix('255.0.0.0') // => 8
 */
export const getMaskPrefix = (mask: string): number => {
  if (!isValidIPv4(mask)) return -1;

  const maskNum = ipToNumber(mask);
  const binary = (maskNum >>> 0).toString(2).padStart(32, '0');

  // Count consecutive 1s from the start
  let prefix = 0;
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === '1') {
      prefix++;
    } else {
      break;
    }
  }

  // Validate the mask (should have all 1s followed by all 0s)
  if (binary !== '1'.repeat(prefix) + '0'.repeat(32 - prefix)) {
    return -1; // Invalid netmask
  }

  return prefix;
};

/**
 * Validates if a string is a valid netmask
 * @param mask - Netmask in dotted decimal notation
 * @returns true if valid netmask, false otherwise
 *
 * @example
 * isValidMask('255.255.255.0') // => true
 * isValidMask('255.255.254.0') // => true
 * isValidMask('255.255.255.1') // => false (not contiguous 1s)
 */
export const isValidMask = (mask: string): boolean => {
  return getMaskPrefix(mask) !== -1;
};

/**
 * Formats a MAC address to uppercase with colon separators
 * @param mac - MAC address in any supported format (with colons, dashes, or no separators)
 * @returns Formatted MAC address as XX:XX:XX:XX:XX:XX, or original string if invalid
 *
 * @example
 * formatMACAddress('AABBCCDDEEFF') // => 'AA:BB:CC:DD:EE:FF'
 * formatMACAddress('aa:bb:cc:dd:ee:ff') // => 'AA:BB:CC:DD:EE:FF'
 * formatMACAddress('AA-BB-CC-DD-EE-FF') // => 'AA:BB:CC:DD:EE:FF'
 */
export const formatMACAddress = (mac: string): string => {
  if (!isValidMACAddress(mac)) {
    return mac;
  }

  // Remove any existing separators and convert to uppercase
  const cleaned = mac.replace(/[:-]/g, '').toUpperCase();

  // Add colons every 2 characters
  return cleaned.replace(/(.{2})/g, '$1:').slice(0, -1);
};

/**
 * Gets detailed subnet information
 * @param cidr - CIDR subnet notation
 * @returns Object with network, broadcast, first/last host, prefix, and host count
 *
 * @example
 * getSubnetInfo('192.168.1.0/24')
 * // => {
 * //   network: '192.168.1.0',
 * //   broadcast: '192.168.1.255',
 * //   firstHost: '192.168.1.1',
 * //   lastHost: '192.168.1.254',
 * //   prefix: 24,
 * //   netmask: '255.255.255.0',
 * //   hostCount: 254,
 * //   totalAddresses: 256
 * // }
 */
export const getSubnetInfo = (
  cidr: string
): {
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  prefix: number;
  netmask: string;
  hostCount: number;
  totalAddresses: number;
} | null => {
  const parsed = parseCIDR(cidr);
  if (!parsed) return null;

  return {
    network: parsed.network,
    broadcast: parsed.broadcast,
    firstHost: getFirstHost(cidr),
    lastHost: getLastHost(cidr),
    prefix: parsed.prefix,
    netmask: parsed.netmask,
    hostCount: getHostCount(cidr),
    totalAddresses: Math.pow(2, 32 - parsed.prefix),
  };
};
