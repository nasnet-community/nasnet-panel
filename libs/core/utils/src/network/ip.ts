/**
 * IP Address Utilities
 * Provides functions for IPv4 validation and conversion
 */

/**
 * Validates if a string is a valid IPv4 address
 * @param ip - The IP address string to validate
 * @returns true if valid IPv4, false otherwise
 */
export const isValidIPv4 = (ip: string): boolean => {
  const ipv4Regex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
  return ipv4Regex.test(ip);
};

/**
 * Validates if a string is a valid CIDR subnet notation
 * @param cidr - The CIDR notation to validate (e.g., "192.168.1.0/24")
 * @returns true if valid CIDR, false otherwise
 */
export const isValidSubnet = (cidr: string): boolean => {
  const cidrRegex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$/;
  return cidrRegex.test(cidr);
};

/**
 * Converts an IPv4 address to a 32-bit number
 * @param ip - The IPv4 address string
 * @returns The numerical representation, or 0 if invalid
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
 */
export const numberToIP = (num: number): string => {
  return [
    (num >>> 24) & 0xff,
    (num >>> 16) & 0xff,
    (num >>> 8) & 0xff,
    num & 0xff
  ].join('.');
};

/**
 * Parses CIDR notation and returns network, netmask, and broadcast addresses
 * @param cidr - CIDR notation (e.g., "192.168.1.0/24")
 * @returns Object with network, netmask, and broadcast addresses, or null if invalid
 */
export const parseCIDR = (cidr: string): {
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
    prefix
  };
};

/**
 * Compares two IPv4 addresses numerically
 * @param ip1 - First IP address
 * @param ip2 - Second IP address
 * @returns Negative if ip1 < ip2, positive if ip1 > ip2, 0 if equal
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
 */
export const isValidMACAddress = (mac: string): boolean => {
  // Supports formats: XX:XX:XX:XX:XX:XX, XX-XX-XX-XX-XX-XX, XXXXXXXXXXXX
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$|^([0-9A-Fa-f]{12})$/;
  return macRegex.test(mac);
};

/**
 * Formats a MAC address to uppercase colon-separated format
 * @param mac - The MAC address string
 * @returns Formatted MAC address (XX:XX:XX:XX:XX:XX), or original if invalid
 */
export const formatMACAddress = (mac: string): string => {
  if (!mac) return '';

  // Remove any existing separators
  const cleaned = mac.replace(/[:-]/g, '').toUpperCase();

  // Validate length
  if (cleaned.length !== 12) return mac;

  // Validate hex characters
  if (!/^[0-9A-F]{12}$/.test(cleaned)) return mac;

  // Format as XX:XX:XX:XX:XX:XX
  return cleaned.match(/.{2}/g)?.join(':') || mac;
};
