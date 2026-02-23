/**
 * Wireless interface types for MikroTik RouterOS
 * Used across the application for WiFi management features
 *
 * @module @nasnet/core/types/router/wireless
 */

/**
 * Main wireless interface type representing a WiFi radio
 *
 * @remarks
 * Represents a single wireless radio interface on the router with its configuration and status.
 */
export interface WirelessInterface {
  /** RouterOS internal ID (e.g., "*1") */
  readonly id: string;

  /** Interface name (e.g., "wlan1", "wlan2") */
  name: string;

  /** MAC address of the wireless interface */
  macAddress: string;

  /** SSID (network name) - can be null if not configured */
  ssid: string | null;

  /** Whether the interface is disabled */
  disabled: boolean;

  /** Whether the interface is actually transmitting */
  running: boolean;

  /** Frequency band (2.4GHz, 5GHz, 6GHz) */
  band: FrequencyBand;

  /** Frequency in MHz (e.g., 2412, 5180) */
  frequency: number;

  /** Channel number or identifier */
  channel: string;

  /** Operating mode (AP, station, etc.) */
  mode: WirelessMode;

  /** Transmission power in dBm */
  txPower: number;

  /** Name of the security profile used */
  securityProfile: string;

  /** Number of connected clients */
  connectedClients: number;

  /** Regulatory domain country code (optional) */
  countryCode?: string;

  /** Whether SSID broadcast is hidden */
  hideSsid?: boolean;
}

/**
 * Frequency bands supported by wireless interfaces
 *
 * @remarks
 * Standard WiFi frequency bands:
 * - `2.4GHz` - 2400-2500 MHz band (most common)
 * - `5GHz` - 5000-6000 MHz band (less interference, faster)
 * - `6GHz` - 6000-7000 MHz band (WiFi 6E and newer)
 * - `Unknown` - Unrecognized frequency
 */
export type FrequencyBand =
  | '2.4GHz'
  | '5GHz'
  | '6GHz'
  | 'Unknown';

/**
 * Wireless operating modes
 *
 * @remarks
 * Operating modes for wireless interfaces:
 * - `ap-bridge` - Access Point Bridge mode (most common, acts as WiFi AP)
 * - `station` - Station mode (acts as WiFi client)
 * - `station-bridge` - Station Bridge (client + bridge)
 * - `station-pseudobridge` - Station Pseudobridge
 * - `wds-slave` - WDS Slave (wireless distribution system)
 * - `alignment-only` - Alignment mode (no forwarding, signal testing)
 */
export type WirelessMode =
  | 'ap-bridge'              // Access Point Bridge mode (most common)
  | 'station'                // Station mode (client)
  | 'station-bridge'         // Station Bridge
  | 'station-pseudobridge'   // Station Pseudobridge
  | 'wds-slave'              // WDS Slave
  | 'alignment-only';        // Alignment mode

/**
 * Security profile for wireless networks
 *
 * @remarks
 * Defines the security configuration for a wireless interface.
 */
export interface SecurityProfile {
  /** RouterOS internal ID */
  readonly id: string;

  /** Profile name (e.g., "default", "guest") */
  name: string;

  /** Security mode */
  mode: SecurityMode;

  /** Authentication types enabled */
  authenticationTypes: readonly AuthenticationType[];

  /** WPA pre-shared key (hidden in UI) */
  wpaPreSharedKey?: string;

  /** WPA2 pre-shared key (hidden in UI) */
  wpa2PreSharedKey?: string;

  /** Unicast cipher algorithms */
  unicastCiphers: readonly Cipher[];

  /** Group cipher algorithms */
  groupCiphers: readonly Cipher[];
}

/**
 * Security modes for wireless networks
 *
 * @remarks
 * Security modes from weak to strong:
 * - `none` - Open network (no encryption)
 * - `static-keys-required` - WEP (deprecated, weak)
 * - `dynamic-keys` - WPA/WPA2/WPA3 (recommended)
 */
export type SecurityMode =
  | 'none'                    // Open network
  | 'static-keys-required'    // WEP
  | 'dynamic-keys';           // WPA/WPA2

/**
 * Authentication types
 *
 * @remarks
 * WPA/WPA2/WPA3 authentication methods:
 * - PSK variants use pre-shared key (password)
 * - EAP variants use enterprise authentication (RADIUS)
 */
export type AuthenticationType =
  | 'wpa-psk'     // WPA with pre-shared key
  | 'wpa2-psk'    // WPA2 with pre-shared key
  | 'wpa3-psk'    // WPA3 with pre-shared key (SAE)
  | 'wpa-eap'     // WPA with enterprise authentication
  | 'wpa2-eap'    // WPA2 with enterprise authentication
  | 'wpa3-eap';   // WPA3 with enterprise authentication

/**
 * Cipher algorithms
 *
 * @remarks
 * Encryption ciphers for wireless:
 * - `aes-ccm` - AES-CCMP (recommended, modern)
 * - `tkip` - TKIP (legacy, less secure)
 */
export type Cipher =
  | 'aes-ccm'     // AES-CCMP (recommended)
  | 'tkip';       // TKIP (legacy)

/**
 * Channel widths supported by wireless interfaces
 *
 * @remarks
 * Channel width affects bandwidth and interference:
 * - `20MHz` - Standard, most compatible
 * - `40MHz` - Double bandwidth, more interference
 * - `80MHz` - 5GHz/6GHz only
 * - `160MHz` - 5GHz/6GHz only, maximum bandwidth
 */
export type ChannelWidth =
  | '20MHz'
  | '40MHz'
  | '80MHz'
  | '160MHz';

/**
 * Detailed wireless interface data extending base interface
 *
 * @remarks
 * Extended interface with additional details for configuration views.
 */
export interface WirelessInterfaceDetail extends WirelessInterface {
  /** Channel width (20MHz, 40MHz, 80MHz, 160MHz) */
  channelWidth: ChannelWidth;

  /** Signal strength in dBm (station mode only, negative value) */
  signalStrength?: number;

  /** Connected AP SSID (station mode only) */
  connectedTo?: string;

  /** Full security profile details (optional) */
  securityProfileDetails?: SecurityProfile;
}

/**
 * Security level indicators for wireless networks
 *
 * @remarks
 * Qualitative security assessment:
 * - `strong` - WPA3 or WPA2 with AES
 * - `moderate` - WPA2 with TKIP or WPA with AES
 * - `weak` - WEP, WPA with TKIP, or deprecated protocols
 * - `none` - Open network, no encryption
 */
export type SecurityLevel = 'strong' | 'moderate' | 'weak' | 'none';

/**
 * Wireless interface status for simpler displays
 *
 * @remarks
 * Simple enabled/disabled status indicator.
 */
export type WirelessStatus = 'enabled' | 'disabled';

/**
 * Determine frequency band from frequency in MHz
 *
 * @param frequencyMHz - Frequency in MHz
 * @returns The corresponding frequency band
 * @example
 * getFrequencyBand(2412) // Returns '2.4GHz'
 * getFrequencyBand(5180) // Returns '5GHz'
 */
export function getFrequencyBand(frequencyMHz: number): FrequencyBand {
  if (frequencyMHz >= 2400 && frequencyMHz < 2500) {
    return '2.4GHz';
  } else if (frequencyMHz >= 5000 && frequencyMHz < 6000) {
    return '5GHz';
  } else if (frequencyMHz >= 6000 && frequencyMHz < 7000) {
    return '6GHz';
  }
  return 'Unknown';
}

/**
 * Get user-friendly wireless status
 *
 * @param iface - Wireless interface to check
 * @returns Simple enabled/disabled status
 * @example
 * getWirelessStatus(interface) // Returns 'enabled' or 'disabled'
 */
export function getWirelessStatus(iface: WirelessInterface): WirelessStatus {
  return iface.disabled ? 'disabled' : 'enabled';
}

/**
 * Determine security level based on profile configuration
 *
 * @param profile - Security profile to evaluate
 * @returns Security level indicator
 * @example
 * getSecurityLevel(profile) // Returns 'strong', 'moderate', 'weak', or 'none'
 */
export function getSecurityLevel(profile: SecurityProfile): SecurityLevel {
  // No security (open network)
  if (profile.mode === 'none') {
    return 'none';
  }

  // WEP is considered weak
  if (profile.mode === 'static-keys-required') {
    return 'weak';
  }

  // Check authentication types and ciphers for dynamic keys (WPA/WPA2/WPA3)
  const hasWPA3 = profile.authenticationTypes.some(
    (auth) => auth === 'wpa3-psk' || auth === 'wpa3-eap'
  );
  const hasWPA2 = profile.authenticationTypes.some(
    (auth) => auth === 'wpa2-psk' || auth === 'wpa2-eap'
  );
  const hasAES = profile.unicastCiphers.includes('aes-ccm');

  // Strong: WPA3 or WPA2 with AES
  if (hasWPA3 || (hasWPA2 && hasAES)) {
    return 'strong';
  }

  // Moderate: WPA2 with TKIP or WPA with AES
  if (hasWPA2 || hasAES) {
    return 'moderate';
  }

  // Weak: WPA with TKIP or other combinations
  return 'weak';
}

/**
 * User-friendly security mode options for UI
 *
 * @remarks
 * Simplified security options presented to end users:
 * - `none` - Open network (not recommended)
 * - `wpa2-psk` - WPA2-Personal (most common)
 * - `wpa3-psk` - WPA3-Personal with SAE (most secure)
 * - `wpa2-wpa3-psk` - WPA2/WPA3 Transitional (mixed device support)
 */
export type WirelessSecurityOption =
  | 'none'           // Open network
  | 'wpa2-psk'       // WPA2-Personal (most common)
  | 'wpa3-psk'       // WPA3-Personal (SAE)
  | 'wpa2-wpa3-psk'; // WPA2/WPA3 Transitional

/**
 * Wireless registration table entry (connected client)
 *
 * @remarks
 * Represents a device currently connected to a wireless interface.
 */
export interface WirelessClient {
  /** RouterOS internal ID */
  readonly id: string;

  /** MAC address of the connected client */
  macAddress: string;

  /** Interface the client is connected to */
  interface: string;

  /** Signal strength in dBm (negative value, closer to 0 is better) */
  signalStrength: number;

  /** TX rate in Mbps */
  txRate: number;

  /** RX rate in Mbps */
  rxRate: number;

  /** Uptime/connection duration string (e.g., "2h30m") */
  uptime: string;

  /** Last activity time string */
  lastActivity: string;

  /** Bytes received from client */
  rxBytes: number;

  /** Bytes transmitted to client */
  txBytes: number;

  /** Packets received from client */
  rxPackets: number;

  /** Packets transmitted to client */
  txPackets: number;
}

/**
 * Wireless settings update payload
 *
 * @remarks
 * Used for updating wireless interface configuration via API mutations.
 * All fields are optional (partial updates supported).
 */
export interface WirelessSettingsUpdate {
  /** Network name (SSID) - must be 1-32 characters */
  ssid?: string;

  /** Password/passphrase for the network - must be 8-63 characters for WPA/WPA2/WPA3 */
  password?: string;

  /** Channel number (1-165) or 'auto' for automatic selection */
  channel?: string;

  /** Channel width (20MHz, 40MHz, 80MHz, 160MHz) */
  channelWidth?: ChannelWidth;

  /** Transmission power in dBm (specific values depend on radio capabilities) */
  txPower?: number;

  /** Whether to hide the SSID from broadcast */
  hideSsid?: boolean;

  /** Security mode selection */
  securityMode?: WirelessSecurityOption;

  /** Country/region code for regulatory compliance (e.g., "US", "GB") */
  countryCode?: string;
}
