/**
 * Wireless interface types for MikroTik RouterOS
 * Used across the application for WiFi management features
 */

/**
 * Main wireless interface type representing a WiFi radio
 */
export interface WirelessInterface {
  /** RouterOS internal ID (e.g., "*1") */
  id: string;

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
 */
export type FrequencyBand =
  | '2.4GHz'
  | '5GHz'
  | '6GHz'
  | 'Unknown';

/**
 * Wireless operating modes
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
 */
export interface SecurityProfile {
  /** RouterOS internal ID */
  id: string;

  /** Profile name (e.g., "default", "guest") */
  name: string;

  /** Security mode */
  mode: SecurityMode;

  /** Authentication types enabled */
  authenticationTypes: AuthenticationType[];

  /** WPA pre-shared key (hidden in UI) */
  wpaPreSharedKey?: string;

  /** WPA2 pre-shared key (hidden in UI) */
  wpa2PreSharedKey?: string;

  /** Unicast cipher algorithms */
  unicastCiphers: Cipher[];

  /** Group cipher algorithms */
  groupCiphers: Cipher[];
}

/**
 * Security modes for wireless networks
 */
export type SecurityMode =
  | 'none'                    // Open network
  | 'static-keys-required'    // WEP
  | 'dynamic-keys';           // WPA/WPA2

/**
 * Authentication types
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
 */
export type Cipher =
  | 'aes-ccm'     // AES-CCMP (recommended)
  | 'tkip';       // TKIP (legacy)

/**
 * Channel widths supported by wireless interfaces
 */
export type ChannelWidth =
  | '20MHz'
  | '40MHz'
  | '80MHz'
  | '160MHz';

/**
 * Detailed wireless interface data extending base interface
 * Used for configuration detail views
 */
export interface WirelessInterfaceDetail extends WirelessInterface {
  /** Channel width (20MHz, 40MHz, 80MHz, 160MHz) */
  channelWidth: ChannelWidth;

  /** Signal strength in dBm (station mode only) */
  signalStrength?: number;

  /** Connected AP SSID (station mode only) */
  connectedTo?: string;

  /** Full security profile details (optional) */
  securityProfileDetails?: SecurityProfile;
}

/**
 * Security level indicators for wireless networks
 */
export type SecurityLevel = 'strong' | 'moderate' | 'weak' | 'none';

/**
 * Wireless interface status for simpler displays
 */
export type WirelessStatus = 'enabled' | 'disabled';

/**
 * Helper function to determine frequency band from frequency in MHz
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
 * Helper function to get user-friendly status
 */
export function getWirelessStatus(iface: WirelessInterface): WirelessStatus {
  return iface.disabled ? 'disabled' : 'enabled';
}

/**
 * Helper function to determine security level based on profile configuration
 * @param profile - Security profile to evaluate
 * @returns Security level indicator
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
 */
export type WirelessSecurityOption =
  | 'none'           // Open network
  | 'wpa2-psk'       // WPA2-Personal (most common)
  | 'wpa3-psk'       // WPA3-Personal (SAE)
  | 'wpa2-wpa3-psk'; // WPA2/WPA3 Transitional

/**
 * Wireless registration table entry (connected client)
 * Represents a device connected to a wireless interface
 */
export interface WirelessClient {
  /** RouterOS internal ID */
  id: string;

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

  /** Uptime/connection duration string */
  uptime: string;

  /** Last activity time */
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
 * Used for updating wireless interface configuration
 */
export interface WirelessSettingsUpdate {
  /** Network name (SSID) */
  ssid?: string;

  /** Password/passphrase for the network */
  password?: string;

  /** Channel number or 'auto' */
  channel?: string;

  /** Channel width (20MHz, 40MHz, 80MHz, 160MHz) */
  channelWidth?: ChannelWidth;

  /** Transmission power in dBm */
  txPower?: number;

  /** Whether to hide the SSID from broadcast */
  hideSsid?: boolean;

  /** Security mode selection */
  securityMode?: WirelessSecurityOption;

  /** Country/region code for regulatory compliance */
  countryCode?: string;
}
