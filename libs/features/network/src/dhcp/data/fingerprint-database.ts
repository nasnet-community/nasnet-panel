/**
 * DHCP Fingerprint Database
 *
 * Built-in fingerprint database for automatic device identification.
 * Part of NAS-6.13 DHCP Fingerprinting feature.
 *
 * @module @nasnet/features/network/dhcp/data
 */

import type { DHCPFingerprint } from '@nasnet/core/types';

/**
 * Built-in fingerprint database
 * @description Contains well-known DHCP fingerprints for common device types.
 * Used for automatic device identification based on DHCP option signatures.
 * Organized by device category (mobile, computer, entertainment, network).
 */
export const BUILTIN_FINGERPRINTS: DHCPFingerprint[] = [
  // ==================== Mobile Devices ====================
  {
    hash: 'apple-ios-v1',
    option55: [1, 121, 3, 6, 15, 119, 252],
    hostnamePattern: '^(iPhone|iPad).*',
    deviceType: 'ios',
    deviceCategory: 'mobile',
    confidence: 95,
    source: 'builtin',
  },
  {
    hash: 'android-generic-v1',
    option55: [1, 3, 6, 15, 26, 28, 51, 58, 59, 43],
    hostnamePattern: '^android-.*',
    deviceType: 'android',
    deviceCategory: 'mobile',
    confidence: 85,
    source: 'builtin',
  },

  // ==================== Computer Operating Systems ====================
  {
    hash: 'windows-10-v1',
    option55: [1, 3, 6, 15, 31, 33, 43, 44, 46, 47, 119, 121, 249, 252],
    option60: 'MSFT 5.0',
    deviceType: 'windows',
    deviceCategory: 'computer',
    confidence: 95,
    source: 'builtin',
  },
  {
    hash: 'macos-v1',
    option55: [1, 121, 3, 6, 15, 119, 252, 95, 44, 46],
    hostnamePattern: '^(MacBook|iMac|Mac-|.*-Mac).*',
    deviceType: 'macos',
    deviceCategory: 'computer',
    confidence: 90,
    source: 'builtin',
  },
  {
    hash: 'linux-generic-v1',
    option55: [1, 28, 2, 3, 15, 6, 119, 12, 44, 47, 26, 121, 42],
    deviceType: 'linux',
    deviceCategory: 'computer',
    confidence: 75,
    source: 'builtin',
  },

  // ==================== Entertainment Devices ====================
  {
    hash: 'samsung-tv-v1',
    option55: [1, 3, 6, 12, 15, 28, 42],
    option60: 'samsung:tv',
    hostnamePattern: '.*TV.*|.*Samsung.*',
    deviceType: 'smart-tv',
    deviceCategory: 'entertainment',
    confidence: 90,
    source: 'builtin',
  },
  {
    hash: 'playstation-v1',
    option55: [1, 3, 6, 15, 28, 51, 58, 59],
    hostnamePattern: '^PS[45].*',
    deviceType: 'gaming-console',
    deviceCategory: 'entertainment',
    confidence: 90,
    source: 'builtin',
  },
  {
    hash: 'xbox-v1',
    option55: [1, 3, 6, 15, 31, 33, 43, 44, 46, 47, 119, 121, 249, 252],
    hostnamePattern: '^Xbox.*',
    deviceType: 'gaming-console',
    deviceCategory: 'entertainment',
    confidence: 85,
    source: 'builtin',
  },

  // ==================== Network Equipment ====================
  {
    hash: 'printer-generic-v1',
    option55: [1, 3, 6, 15, 44, 46, 47],
    hostnamePattern: '.*(Printer|HP|Canon|Epson|Brother).*',
    deviceType: 'printer',
    deviceCategory: 'network',
    confidence: 80,
    source: 'builtin',
  },
];

/**
 * Get fingerprint by hash
 * @description Performs O(n) lookup to find fingerprint matching the provided hash
 * @param hash - Fingerprint hash identifier
 * @returns Fingerprint or undefined if not found
 */
export function getFingerprintByHash(hash: string): DHCPFingerprint | undefined {
  return BUILTIN_FINGERPRINTS.find((fp) => fp.hash === hash);
}

/**
 * Get all fingerprints for a device type
 * @description Returns all matching fingerprints filtered by device type
 * @param deviceType - Device type to filter by
 * @returns Array of matching fingerprints
 */
export function getFingerprintsByDeviceType(
  deviceType: DHCPFingerprint['deviceType']
): DHCPFingerprint[] {
  return BUILTIN_FINGERPRINTS.filter((fp) => fp.deviceType === deviceType);
}

/**
 * Get all fingerprints for a device category
 * @description Returns all fingerprints matching the provided category (mobile, computer, etc.)
 * @param category - Device category to filter by
 * @returns Array of matching fingerprints
 */
export function getFingerprintsByCategory(
  category: DHCPFingerprint['deviceCategory']
): DHCPFingerprint[] {
  return BUILTIN_FINGERPRINTS.filter((fp) => fp.deviceCategory === category);
}

/**
 * Get statistics about the fingerprint database
 * @description Returns summary statistics including counts and unique values across database
 * @returns Database statistics with totals and unique categories/device types
 */
export function getDatabaseStats() {
  const categories = new Set(BUILTIN_FINGERPRINTS.map((fp) => fp.deviceCategory));
  const deviceTypes = new Set(BUILTIN_FINGERPRINTS.map((fp) => fp.deviceType));

  return {
    totalFingerprints: BUILTIN_FINGERPRINTS.length,
    categoriesCount: categories.size,
    deviceTypesCount: deviceTypes.size,
    categories: Array.from(categories),
    deviceTypes: Array.from(deviceTypes),
  };
}
