/**
 * DHCP Pool Calculator Utilities
 * Auto-suggest address pools based on interface IP and subnet mask
 * Validates pool ranges and detects overlaps
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

/**
 * Pool suggestion result with calculated values
 */
export interface PoolSuggestion {
  start: string;
  end: string;
  size: number;
  reserved: string;
  network: string;
  broadcast: string;
}

/**
 * Convert IP address string to 32-bit unsigned integer
 *
 * @param ip - IP address in dotted notation (e.g., "192.168.1.1")
 * @returns 32-bit unsigned integer representation
 *
 * @example
 * ipToNumber("192.168.1.1") // 3232235777
 */
export function ipToNumber(ip: string): number {
  const octets = ip.split('.').map(Number);
  return (
    ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>>
    0
  );
}

/**
 * Convert 32-bit unsigned integer to IP address string
 *
 * @param num - 32-bit unsigned integer
 * @returns IP address in dotted notation
 *
 * @example
 * numberToIP(3232235777) // "192.168.1.1"
 */
export function numberToIP(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join('.');
}

/**
 * Calculate suggested DHCP pool based on interface IP and subnet
 *
 * Strategy by subnet size:
 * - /24 (Class C): Reserve .1-.99 for static, suggest .100-.254 for pool
 * - /16 (Class B): Reserve .0.1-.0.255, suggest .1.1-.255.254
 * - /30-/31: Too small for DHCP, throw error
 * - Generic: Reserve first 30% for static, use remaining 70% for pool
 *
 * @param interfaceIP - Interface IP with CIDR notation (e.g., "192.168.1.1/24")
 * @returns Pool suggestion with start, end, size, reserved range, network, and broadcast
 * @throws Error if subnet is too small for DHCP (< /29)
 *
 * @example
 * calculateSuggestedPool("192.168.1.1/24")
 * // {
 * //   start: "192.168.1.100",
 * //   end: "192.168.1.254",
 * //   size: 155,
 * //   reserved: "192.168.1.1-192.168.1.99",
 * //   network: "192.168.1.0",
 * //   broadcast: "192.168.1.255"
 * // }
 */
export function calculateSuggestedPool(interfaceIP: string): PoolSuggestion {
  const [ip, prefixStr] = interfaceIP.split('/');
  const prefix = parseInt(prefixStr, 10);

  if (isNaN(prefix) || prefix < 0 || prefix > 32) {
    throw new Error('Invalid subnet prefix');
  }

  const octets = ip.split('.').map(Number);

  // Validate IP format
  if (octets.length !== 4 || octets.some((o) => isNaN(o) || o < 0 || o > 255)) {
    throw new Error('Invalid IP address format');
  }

  // Calculate network and broadcast addresses
  const ipNum = ipToNumber(ip);
  const subnetMask = (~0 << (32 - prefix)) >>> 0;
  const networkNum = (ipNum & subnetMask) >>> 0;
  const broadcastNum = (networkNum | ~subnetMask) >>> 0;

  const network = numberToIP(networkNum);
  const broadcast = numberToIP(broadcastNum);

  // Check if subnet is too small for DHCP
  if (prefix >= 30) {
    throw new Error(
      `/${prefix} subnet is too small for DHCP pool (minimum /29 required)`
    );
  }

  // Special handling for common subnet sizes
  if (prefix === 24) {
    // /24 subnet: Reserve .1-.99, suggest .100-.254
    const start = `${octets[0]}.${octets[1]}.${octets[2]}.100`;
    const end = `${octets[0]}.${octets[1]}.${octets[2]}.254`;
    const reserved = `${octets[0]}.${octets[1]}.${octets[2]}.1-${octets[0]}.${octets[1]}.${octets[2]}.99`;

    return {
      start,
      end,
      size: 155, // 100-254 = 155 addresses
      reserved,
      network,
      broadcast,
    };
  }

  if (prefix === 16) {
    // /16 subnet: Reserve .0.1-.0.255, suggest .1.1-.255.254
    const start = `${octets[0]}.${octets[1]}.1.1`;
    const end = `${octets[0]}.${octets[1]}.255.254`;
    const reserved = `${octets[0]}.${octets[1]}.0.1-${octets[0]}.${octets[1]}.0.255`;

    return {
      start,
      end,
      size: 65279, // Large pool
      reserved,
      network,
      broadcast,
    };
  }

  // Generic calculation: Reserve first 30% for static, use remaining 70% for pool
  const hostBits = 32 - prefix;
  const totalHosts = Math.pow(2, hostBits) - 2; // -2 for network and broadcast
  const reservedCount = Math.floor(totalHosts * 0.3);
  const poolStartNum = networkNum + 1 + reservedCount;
  const poolEndNum = broadcastNum - 1;

  return {
    start: numberToIP(poolStartNum),
    end: numberToIP(poolEndNum),
    size: poolEndNum - poolStartNum + 1,
    reserved: `${numberToIP(networkNum + 1)}-${numberToIP(networkNum + reservedCount)}`,
    network,
    broadcast,
  };
}

/**
 * Check if an IP address is within a subnet
 *
 * @param ip - IP address to check
 * @param subnet - Subnet in CIDR notation (e.g., "192.168.1.0/24")
 * @returns True if IP is in subnet, false otherwise
 *
 * @example
 * isInSubnet("192.168.1.50", "192.168.1.0/24") // true
 * isInSubnet("192.168.2.1", "192.168.1.0/24") // false
 */
export function isInSubnet(ip: string, subnet: string): boolean {
  const [subnetIP, prefixStr] = subnet.split('/');
  const prefix = parseInt(prefixStr, 10);

  if (isNaN(prefix) || prefix < 0 || prefix > 32) {
    return false;
  }

  const mask = (~0 << (32 - prefix)) >>> 0;

  const ipNum = ipToNumber(ip);
  const subnetNum = ipToNumber(subnetIP);

  return (ipNum & mask) === (subnetNum & mask);
}

/**
 * Check if a DHCP pool overlaps with a specific IP address
 *
 * @param poolStart - Pool start IP address
 * @param poolEnd - Pool end IP address
 * @param ip - IP address to check for overlap
 * @returns True if IP is within pool range, false otherwise
 *
 * @example
 * poolOverlapsWithIP("192.168.1.100", "192.168.1.200", "192.168.1.150") // true
 * poolOverlapsWithIP("192.168.1.100", "192.168.1.200", "192.168.1.50") // false
 */
export function poolOverlapsWithIP(
  poolStart: string,
  poolEnd: string,
  ip: string
): boolean {
  const startNum = ipToNumber(poolStart);
  const endNum = ipToNumber(poolEnd);
  const ipNum = ipToNumber(ip);

  return ipNum >= startNum && ipNum <= endNum;
}

/**
 * Compare two IP addresses
 *
 * @param ip1 - First IP address
 * @param ip2 - Second IP address
 * @returns -1 if ip1 < ip2, 0 if equal, 1 if ip1 > ip2
 *
 * @example
 * compareIPs("192.168.1.1", "192.168.1.100") // -1
 * compareIPs("192.168.1.100", "192.168.1.1") // 1
 * compareIPs("192.168.1.1", "192.168.1.1") // 0
 */
export function compareIPs(ip1: string, ip2: string): number {
  const num1 = ipToNumber(ip1);
  const num2 = ipToNumber(ip2);

  if (num1 < num2) return -1;
  if (num1 > num2) return 1;
  return 0;
}

/**
 * Validate that pool end is greater than or equal to pool start
 *
 * @param poolStart - Pool start IP address
 * @param poolEnd - Pool end IP address
 * @returns True if valid, false otherwise
 *
 * @example
 * isValidPoolRange("192.168.1.100", "192.168.1.200") // true
 * isValidPoolRange("192.168.1.200", "192.168.1.100") // false
 */
export function isValidPoolRange(poolStart: string, poolEnd: string): boolean {
  return compareIPs(poolEnd, poolStart) >= 0;
}

/**
 * Calculate the size of a pool range
 *
 * @param poolStart - Pool start IP address
 * @param poolEnd - Pool end IP address
 * @returns Number of addresses in the pool
 *
 * @example
 * calculatePoolSize("192.168.1.100", "192.168.1.200") // 101
 */
export function calculatePoolSize(poolStart: string, poolEnd: string): number {
  const startNum = ipToNumber(poolStart);
  const endNum = ipToNumber(poolEnd);

  return endNum - startNum + 1;
}

/**
 * Validate IP address format
 *
 * @param ip - IP address string
 * @returns True if valid IPv4 format, false otherwise
 *
 * @example
 * isValidIPv4("192.168.1.1") // true
 * isValidIPv4("256.1.1.1") // false
 * isValidIPv4("192.168.1") // false
 */
export function isValidIPv4(ip: string): boolean {
  const octets = ip.split('.');

  if (octets.length !== 4) {
    return false;
  }

  return octets.every((octet) => {
    const num = parseInt(octet, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && octet === num.toString();
  });
}

/**
 * Get the network address from an IP and subnet mask
 *
 * @param ip - IP address
 * @param prefix - Subnet prefix (e.g., 24 for /24)
 * @returns Network address
 *
 * @example
 * getNetworkAddress("192.168.1.50", 24) // "192.168.1.0"
 */
export function getNetworkAddress(ip: string, prefix: number): string {
  const ipNum = ipToNumber(ip);
  const mask = (~0 << (32 - prefix)) >>> 0;
  const networkNum = (ipNum & mask) >>> 0;

  return numberToIP(networkNum);
}

/**
 * Get the broadcast address from an IP and subnet mask
 *
 * @param ip - IP address
 * @param prefix - Subnet prefix (e.g., 24 for /24)
 * @returns Broadcast address
 *
 * @example
 * getBroadcastAddress("192.168.1.50", 24) // "192.168.1.255"
 */
export function getBroadcastAddress(ip: string, prefix: number): string {
  const ipNum = ipToNumber(ip);
  const mask = (~0 << (32 - prefix)) >>> 0;
  const networkNum = (ipNum & mask) >>> 0;
  const broadcastNum = (networkNum | ~mask) >>> 0;

  return numberToIP(broadcastNum);
}
