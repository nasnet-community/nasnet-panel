/**
 * Network Utilities
 *
 * Provides functions for IPv4/CIDR validation, subnet calculations,
 * and MAC address handling.
 */

export {
  isValidIPv4,
  isValidSubnet,
  ipToNumber,
  numberToIP,
  parseCIDR,
  compareIPv4,
  isValidMACAddress,
} from './ip';

export {
  isIPInSubnet,
  getHostCount,
  getFirstHost,
  getLastHost,
  getPrefixMask,
  getMaskPrefix,
  isValidMask,
  getSubnetInfo,
} from './subnet';
