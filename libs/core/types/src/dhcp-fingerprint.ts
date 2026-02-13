/**
 * DHCP Fingerprinting Types
 *
 * Types for device identification based on DHCP option analysis.
 * Part of NAS-6.13 DHCP Fingerprinting feature.
 */

/**
 * High-level device category (6 categories)
 * Named to avoid conflict with existing DeviceType enum in connected-device.ts
 */
export type FingerprintDeviceCategory =
  | 'mobile'
  | 'computer'
  | 'iot'
  | 'network'
  | 'entertainment'
  | 'other';

/**
 * Specific device type (22 types)
 * Named to avoid conflict with existing DeviceType enum in connected-device.ts
 */
export type FingerprintDeviceType =
  // Phone/Tablet (3)
  | 'ios'
  | 'android'
  | 'other-mobile'
  // Computer (4)
  | 'windows'
  | 'macos'
  | 'linux'
  | 'chromeos'
  // IoT (4)
  | 'smart-speaker'
  | 'camera'
  | 'thermostat'
  | 'other-iot'
  // Network (4)
  | 'printer'
  | 'nas'
  | 'router'
  | 'switch'
  // Entertainment (3)
  | 'gaming-console'
  | 'smart-tv'
  | 'streaming-device'
  // Other (3)
  | 'generic'
  | 'server'
  | 'appliance'
  | 'unknown';

/**
 * DHCP fingerprint signature for device identification
 */
export interface DHCPFingerprint {
  /**
   * Unique hash identifier for this fingerprint
   */
  hash: string;

  /**
   * DHCP option 55 - Parameter Request List
   * Array of requested DHCP option codes
   */
  option55: number[];

  /**
   * DHCP option 60 - Vendor Class Identifier (optional)
   * Vendor-specific identifier string
   */
  option60?: string;

  /**
   * Hostname pattern regex for additional matching (optional)
   * Used to match against DHCP hostname option
   */
  hostnamePattern?: string;

  /**
   * Identified device type
   */
  deviceType: FingerprintDeviceType;

  /**
   * Device category
   */
  deviceCategory: FingerprintDeviceCategory;

  /**
   * Confidence level (0-100)
   * Higher values indicate more accurate identification
   */
  confidence: number;

  /**
   * Source of this fingerprint
   * - builtin: Shipped with the system
   * - manual: User-created
   * - learned: Machine-learned from network traffic
   */
  source: 'builtin' | 'manual' | 'learned';
}

/**
 * Device identification result
 * Links a MAC address to an identified device type
 */
export interface DeviceIdentification {
  /**
   * MAC address of the identified device
   */
  macAddress: string;

  /**
   * Identified device type
   */
  deviceType: FingerprintDeviceType;

  /**
   * Device category
   */
  deviceCategory: FingerprintDeviceCategory;

  /**
   * Confidence level of this identification (0-100)
   */
  confidence: number;

  /**
   * How this device was identified
   * - automatic: Identified via fingerprint matching
   * - manual: User manually set the device type
   */
  source: 'automatic' | 'manual';

  /**
   * Hash of the fingerprint used for identification (if automatic)
   */
  fingerprintHash?: string;

  /**
   * Timestamp when device was identified (ISO 8601)
   */
  identifiedAt: string;
}
