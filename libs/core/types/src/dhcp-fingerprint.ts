/**
 * DHCP Fingerprinting Types
 *
 * Types for device identification based on DHCP option analysis.
 * Part of NAS-6.13 DHCP Fingerprinting feature.
 *
 * @module @nasnet/core/types/dhcp-fingerprint
 */

/**
 * High-level device category (6 categories)
 *
 * @remarks
 * Named to avoid conflict with existing DeviceType enum in connected-device.ts.
 * Top-level categorization for device types.
 */
export type FingerprintDeviceCategory =
  | 'mobile'         // Phones, tablets
  | 'computer'       // PCs, laptops, workstations
  | 'iot'            // Smart home, IoT devices
  | 'network'        // Printers, NAS, routers, switches
  | 'entertainment'  // Gaming consoles, smart TVs, streaming devices
  | 'other';         // Other devices, servers, appliances, generic

/**
 * Specific device type (22 types)
 *
 * @remarks
 * Named to avoid conflict with existing DeviceType enum in connected-device.ts.
 * Granular device type classification across 6 categories.
 */
export type FingerprintDeviceType =
  // Phone/Tablet (3)
  | 'ios'                // Apple iPhone, iPad
  | 'android'            // Android phone, tablet
  | 'other-mobile'       // Other mobile devices
  // Computer (4)
  | 'windows'            // Windows PC, workstation
  | 'macos'              // Apple Mac
  | 'linux'              // Linux computer
  | 'chromeos'           // Chromebook
  // IoT (4)
  | 'smart-speaker'      // Alexa, Google Home, etc.
  | 'camera'             // IP camera, webcam
  | 'thermostat'         // Smart thermostat
  | 'other-iot'          // Other IoT devices
  // Network (4)
  | 'printer'            // Network printer
  | 'nas'                // NAS/storage device
  | 'router'             // Router, access point
  | 'switch'             // Network switch
  // Entertainment (3)
  | 'gaming-console'     // PlayStation, Xbox, Nintendo
  | 'smart-tv'           // Smart TV
  | 'streaming-device'   // Roku, Apple TV, etc.
  // Other (3)
  | 'generic'            // Generic/unknown type
  | 'server'             // Server, data center
  | 'appliance'          // Smart appliance
  | 'unknown';           // Unable to identify

/**
 * DHCP fingerprint signature for device identification
 *
 * @remarks
 * A fingerprint signature that uniquely identifies a device type based on
 * DHCP options it sends. Can be used to automatically classify devices on the network.
 */
export interface DHCPFingerprint {
  /**
   * Unique hash identifier for this fingerprint
   * Used for matching incoming DHCP requests
   */
  readonly hash: string;

  /**
   * DHCP option 55 - Parameter Request List
   * Array of requested DHCP option codes in order
   */
  readonly option55: readonly number[];

  /**
   * DHCP option 60 - Vendor Class Identifier (optional)
   * Vendor-specific identifier string (e.g., "MSFT 5.0" for Windows)
   */
  option60?: string;

  /**
   * Hostname pattern regex for additional matching (optional)
   * Used to match against DHCP hostname option for refinement
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
   *
   * @remarks
   * Higher values indicate more accurate identification.
   * Typically: 90-100 = very confident, 70-89 = confident, 50-69 = moderate, <50 = low
   */
  confidence: number;

  /**
   * Source of this fingerprint
   *
   * @remarks
   * - `builtin` - Shipped with the system (vetted)
   * - `manual` - User-created custom fingerprint
   * - `learned` - Machine-learned from network traffic analysis
   */
  source: 'builtin' | 'manual' | 'learned';
}

/**
 * Device identification result
 *
 * @remarks
 * Links a MAC address to an identified device type.
 * Result of applying fingerprint matching or manual classification.
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
   *
   * @remarks
   * Indicates how confident the identification is.
   * Used for UI presentation and rule application thresholds.
   */
  confidence: number;

  /**
   * How this device was identified
   *
   * @remarks
   * - `automatic` - Identified via fingerprint matching algorithm
   * - `manual` - User manually set the device type
   */
  source: 'automatic' | 'manual';

  /**
   * Hash of the fingerprint used for identification (if automatic)
   *
   * @remarks
   * Null for manual identifications. Allows tracing which fingerprint was matched.
   */
  fingerprintHash?: string;

  /**
   * Timestamp when device was identified (ISO 8601 format)
   *
   * @remarks
   * Example: "2026-02-21T14:30:45.123Z"
   */
  identifiedAt: string;
}
