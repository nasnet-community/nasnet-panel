/**
 * Network utility functions for IP address validation and subnet calculations
 */

/** Validates if a string is a valid IP address */
export const isValidIp = (ip: string): boolean => {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
};

/** Validates if a string is a valid subnet in CIDR notation */
export const isValidSubnet = (subnet: string): boolean => {
  const parts = subnet.split('/');
  if (parts.length !== 2) return false;
  
  const [ip, mask] = parts;
  if (!ip || !mask) return false;
  const maskNum = parseInt(mask, 10);
  
  return isValidIp(ip) && maskNum >= 0 && maskNum <= 32;
};

/** Converts IP address to 32-bit integer */
export const ipToInt = (ip: string): number => {
  return ip.split('.')
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
};

/** Converts 32-bit integer to IP address string */
export const intToIp = (int: number): string => {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255
  ].join('.');
};

/** Generates array of IP addresses in a subnet */
export const getSubnetIps = (subnet: string): readonly string[] => {
  if (!isValidSubnet(subnet)) {
    throw new Error('Invalid subnet format');
  }
  
  const [networkIp, maskBits] = subnet.split('/');
  if (!networkIp || !maskBits) {
    throw new Error('Invalid subnet format');
  }
  const mask = parseInt(maskBits, 10);
  const networkInt = ipToInt(networkIp);
  const hostBits = 32 - mask;
  const hostCount = Math.pow(2, hostBits);
  
  // Skip network and broadcast addresses for subnets smaller than /31
  const startOffset = mask < 31 ? 1 : 0;
  const endOffset = mask < 31 ? 1 : 0;
  
  const ips: string[] = [];
  for (let i = startOffset; i < hostCount - endOffset; i++) {
    ips.push(intToIp(networkInt + i));
  }
  
  return ips;
};

/** Gets the network address for a given IP and subnet mask */
export const getNetworkAddress = (ip: string, mask: number): string => {
  const ipInt = ipToInt(ip);
  const maskInt = (0xFFFFFFFF << (32 - mask)) >>> 0;
  const networkInt = ipInt & maskInt;
  return intToIp(networkInt);
};

/** Checks if an IP address is in a private range */
export const isPrivateIp = (ip: string): boolean => {
  if (!isValidIp(ip)) return false;
  
  const ipInt = ipToInt(ip);
  
  // 10.0.0.0/8
  if (ipInt >= ipToInt('10.0.0.0') && ipInt <= ipToInt('10.255.255.255')) {
    return true;
  }
  
  // 172.16.0.0/12
  if (ipInt >= ipToInt('172.16.0.0') && ipInt <= ipToInt('172.31.255.255')) {
    return true;
  }
  
  // 192.168.0.0/16
  if (ipInt >= ipToInt('192.168.0.0') && ipInt <= ipToInt('192.168.255.255')) {
    return true;
  }
  
  return false;
};

/** Detects the local network subnet */
export const detectLocalSubnet = (): string => {
  // This is a simplified detection - in a real app you'd use more sophisticated methods
  // For now, return common private subnets
  const commonSubnets = ['192.168.1.0/24', '192.168.0.0/24', '10.0.0.0/24'];
  return commonSubnets[0]!;
};

/** Formats uptime from seconds to human readable string */
export const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

/** Formats bytes to human readable string */
export const formatBytes = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};