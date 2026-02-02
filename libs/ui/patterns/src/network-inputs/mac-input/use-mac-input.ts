/**
 * useMACInput Hook - Headless MAC Address Input Logic
 *
 * Contains all business logic for the MAC address input component:
 * - Multi-format parsing (colon, dash, dot, no separator)
 * - Auto-formatting with uppercase conversion
 * - OUI vendor lookup from embedded database
 * - Validation using the mac schema
 *
 * @module @nasnet/ui/patterns/network-inputs/mac-input
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  UseMACInputConfig,
  UseMACInputReturn,
  MACFormat,
} from './mac-input.types';

// ============================================================================
// OUI Vendor Database (Top ~100 Common Vendors)
// ============================================================================

/**
 * Embedded OUI database for vendor lookup.
 * Keys are OUI prefixes in colon format (XX:XX:XX).
 *
 * Source: IEEE OUI database, common vendors.
 */
const MAC_VENDORS: Record<string, string> = {
  // VMware
  '00:50:56': 'VMware',
  '00:0C:29': 'VMware',
  '00:05:69': 'VMware',
  '00:1C:14': 'VMware',
  // Apple
  'AC:DE:48': 'Apple',
  '00:1B:63': 'Apple',
  '00:03:93': 'Apple',
  '00:0A:95': 'Apple',
  '00:0D:93': 'Apple',
  '00:11:24': 'Apple',
  '00:14:51': 'Apple',
  '00:16:CB': 'Apple',
  '00:17:F2': 'Apple',
  '00:19:E3': 'Apple',
  '00:1C:B3': 'Apple',
  '00:1D:4F': 'Apple',
  '00:1E:52': 'Apple',
  '00:1E:C2': 'Apple',
  '00:1F:5B': 'Apple',
  '00:1F:F3': 'Apple',
  '00:21:E9': 'Apple',
  '00:22:41': 'Apple',
  '00:23:12': 'Apple',
  '00:23:32': 'Apple',
  '00:23:6C': 'Apple',
  '00:23:DF': 'Apple',
  '00:24:36': 'Apple',
  '00:25:00': 'Apple',
  '00:25:4B': 'Apple',
  '00:25:BC': 'Apple',
  '00:26:08': 'Apple',
  '00:26:4A': 'Apple',
  '00:26:B0': 'Apple',
  '00:26:BB': 'Apple',
  // Google
  '3C:5A:B4': 'Google',
  '00:1A:11': 'Google',
  '94:EB:2C': 'Google',
  'F4:F5:D8': 'Google',
  'F4:F5:E8': 'Google',
  // Microsoft / Hyper-V
  '00:15:5D': 'Microsoft Hyper-V',
  '00:03:FF': 'Microsoft',
  '00:0D:3A': 'Microsoft',
  '00:12:5A': 'Microsoft',
  '00:17:FA': 'Microsoft',
  '00:1D:D8': 'Microsoft',
  '00:22:48': 'Microsoft',
  '00:25:AE': 'Microsoft',
  '28:18:78': 'Microsoft',
  // Virtualization
  '52:54:00': 'QEMU/KVM',
  '08:00:27': 'VirtualBox',
  '0A:00:27': 'VirtualBox',
  '02:42:AC': 'Docker',
  // Cisco
  '00:00:0C': 'Cisco',
  '00:01:42': 'Cisco',
  '00:01:43': 'Cisco',
  '00:01:63': 'Cisco',
  '00:01:64': 'Cisco',
  '00:01:96': 'Cisco',
  '00:01:97': 'Cisco',
  '00:01:C7': 'Cisco',
  '00:01:C9': 'Cisco',
  '00:02:16': 'Cisco',
  '00:02:17': 'Cisco',
  '00:02:3D': 'Cisco',
  '00:02:4A': 'Cisco',
  '00:02:4B': 'Cisco',
  '00:02:7D': 'Cisco',
  '00:02:7E': 'Cisco',
  '00:02:B9': 'Cisco',
  '00:02:BA': 'Cisco',
  '00:02:FC': 'Cisco',
  '00:02:FD': 'Cisco',
  // Raspberry Pi
  'B8:27:EB': 'Raspberry Pi',
  'DC:A6:32': 'Raspberry Pi',
  'E4:5F:01': 'Raspberry Pi',
  // Intel
  '00:02:B3': 'Intel',
  '00:03:47': 'Intel',
  '00:04:23': 'Intel',
  '00:07:E9': 'Intel',
  '00:0C:F1': 'Intel',
  '00:0E:0C': 'Intel',
  '00:0E:35': 'Intel',
  '00:11:11': 'Intel',
  '00:12:F0': 'Intel',
  '00:13:02': 'Intel',
  '00:13:20': 'Intel',
  '00:13:CE': 'Intel',
  '00:13:E8': 'Intel',
  '00:15:00': 'Intel',
  '00:15:17': 'Intel',
  '00:16:6F': 'Intel',
  '00:16:76': 'Intel',
  '00:16:EA': 'Intel',
  '00:16:EB': 'Intel',
  '00:17:32': 'Intel',
  '00:18:DE': 'Intel',
  '00:19:D1': 'Intel',
  '00:19:D2': 'Intel',
  '00:1A:92': 'Intel',
  '00:1B:21': 'Intel',
  '00:1B:77': 'Intel',
  '00:1C:BF': 'Intel',
  '00:1C:C0': 'Intel',
  '00:1D:E0': 'Intel',
  '00:1D:E1': 'Intel',
  '00:1E:64': 'Intel',
  '00:1E:65': 'Intel',
  '00:1E:67': 'Intel',
  '00:1F:3B': 'Intel',
  '00:1F:3C': 'Intel',
  // Dell
  '00:06:5B': 'Dell',
  '00:08:74': 'Dell',
  '00:0B:DB': 'Dell',
  '00:0D:56': 'Dell',
  '00:0F:1F': 'Dell',
  '00:11:43': 'Dell',
  '00:12:3F': 'Dell',
  '00:13:72': 'Dell',
  '00:14:22': 'Dell',
  '00:15:C5': 'Dell',
  '00:18:8B': 'Dell',
  '00:19:B9': 'Dell',
  '00:1A:A0': 'Dell',
  '00:1C:23': 'Dell',
  '00:1D:09': 'Dell',
  '00:1E:4F': 'Dell',
  '00:1E:C9': 'Dell',
  '00:21:9B': 'Dell',
  '00:21:70': 'Dell',
  '00:22:19': 'Dell',
  '00:23:AE': 'Dell',
  '00:24:E8': 'Dell',
  '00:25:64': 'Dell',
  '00:26:B9': 'Dell',
  // HP
  '00:01:E6': 'HP',
  '00:01:E7': 'HP',
  '00:02:A5': 'HP',
  '00:04:EA': 'HP',
  '00:08:02': 'HP',
  '00:0A:57': 'HP',
  '00:0B:CD': 'HP',
  '00:0D:9D': 'HP',
  '00:0E:7F': 'HP',
  '00:0F:20': 'HP',
  '00:0F:61': 'HP',
  '00:10:83': 'HP',
  '00:11:0A': 'HP',
  '00:11:85': 'HP',
  '00:12:79': 'HP',
  '00:13:21': 'HP',
  '00:14:38': 'HP',
  '00:14:C2': 'HP',
  '00:15:60': 'HP',
  '00:16:35': 'HP',
  '00:17:08': 'HP',
  '00:17:A4': 'HP',
  '00:18:71': 'HP',
  '00:18:FE': 'HP',
  '00:19:BB': 'HP',
  '00:1A:4B': 'HP',
  '00:1B:78': 'HP',
  '00:1C:C4': 'HP',
  '00:1E:0B': 'HP',
  '00:1F:29': 'HP',
  '00:21:5A': 'HP',
  '00:22:64': 'HP',
  '00:23:7D': 'HP',
  '00:24:81': 'HP',
  '00:25:B3': 'HP',
  '00:26:55': 'HP',
  // Netgear
  '00:09:5B': 'Netgear',
  '00:0F:B5': 'Netgear',
  '00:14:6C': 'Netgear',
  '00:18:4D': 'Netgear',
  '00:1B:2F': 'Netgear',
  '00:1E:2A': 'Netgear',
  '00:1F:33': 'Netgear',
  '00:22:3F': 'Netgear',
  '00:24:B2': 'Netgear',
  '00:26:F2': 'Netgear',
  // TP-Link
  '00:1D:0F': 'TP-Link',
  '00:23:CD': 'TP-Link',
  '00:27:19': 'TP-Link',
  '14:CF:92': 'TP-Link',
  '14:CC:20': 'TP-Link',
  '30:B5:C2': 'TP-Link',
  '50:C7:BF': 'TP-Link',
  '54:C8:0F': 'TP-Link',
  '60:E3:27': 'TP-Link',
  '64:70:02': 'TP-Link',
  // MikroTik
  '00:0C:42': 'MikroTik',
  '4C:5E:0C': 'MikroTik',
  '6C:3B:6B': 'MikroTik',
  'B8:69:F4': 'MikroTik',
  'CC:2D:E0': 'MikroTik',
  'D4:01:C3': 'MikroTik',
  'E4:8D:8C': 'MikroTik',
  // Ubiquiti
  '00:15:6D': 'Ubiquiti',
  '00:27:22': 'Ubiquiti',
  '04:18:D6': 'Ubiquiti',
  '24:A4:3C': 'Ubiquiti',
  '44:D9:E7': 'Ubiquiti',
  '68:72:51': 'Ubiquiti',
  '78:8A:20': 'Ubiquiti',
  '80:2A:A8': 'Ubiquiti',
  'B4:FB:E4': 'Ubiquiti',
  'DC:9F:DB': 'Ubiquiti',
  'F0:9F:C2': 'Ubiquiti',
  'FC:EC:DA': 'Ubiquiti',
  // Samsung
  '00:00:F0': 'Samsung',
  '00:02:78': 'Samsung',
  '00:07:AB': 'Samsung',
  '00:09:18': 'Samsung',
  '00:0D:AE': 'Samsung',
  '00:12:47': 'Samsung',
  '00:12:FB': 'Samsung',
  '00:13:77': 'Samsung',
  '00:15:99': 'Samsung',
  '00:15:B9': 'Samsung',
  '00:16:32': 'Samsung',
  '00:16:6B': 'Samsung',
  '00:16:6C': 'Samsung',
  '00:16:DB': 'Samsung',
  '00:17:C9': 'Samsung',
  '00:17:D5': 'Samsung',
  '00:18:AF': 'Samsung',
  '00:1A:8A': 'Samsung',
  '00:1B:98': 'Samsung',
  '00:1C:43': 'Samsung',
  '00:1D:25': 'Samsung',
  '00:1D:F6': 'Samsung',
  '00:1E:7D': 'Samsung',
  '00:1F:CC': 'Samsung',
  '00:1F:CD': 'Samsung',
  '00:21:19': 'Samsung',
  '00:21:4C': 'Samsung',
  '00:21:D1': 'Samsung',
  '00:21:D2': 'Samsung',
  '00:23:39': 'Samsung',
  '00:23:3A': 'Samsung',
  '00:23:99': 'Samsung',
  '00:23:D6': 'Samsung',
  '00:23:D7': 'Samsung',
  '00:24:54': 'Samsung',
  '00:24:90': 'Samsung',
  '00:24:91': 'Samsung',
  '00:25:66': 'Samsung',
  '00:25:67': 'Samsung',
  '00:26:37': 'Samsung',
  '00:26:5D': 'Samsung',
  '00:26:5F': 'Samsung',
  // Realtek
  '00:E0:4C': 'Realtek',
  // Note: 52:54:00 is already listed as QEMU/KVM above
  // Quanta
  '00:1E:68': 'Quanta',
  '00:21:CC': 'Quanta',
  // Note: 00:24:54 is already listed as Samsung above
  '00:25:48': 'Quanta',
  // Amazon
  '00:FC:8B': 'Amazon',
  '0C:47:C9': 'Amazon',
  '10:AE:60': 'Amazon',
  '18:74:2E': 'Amazon',
  '34:D2:70': 'Amazon',
  '44:65:0D': 'Amazon',
  '50:F5:DA': 'Amazon',
  '68:37:E9': 'Amazon',
  '68:54:FD': 'Amazon',
  '74:C2:46': 'Amazon',
  '78:E1:03': 'Amazon',
  '84:D6:D0': 'Amazon',
  '88:71:B1': 'Amazon',
  'A0:02:DC': 'Amazon',
  'AC:63:BE': 'Amazon',
  'B4:7C:9C': 'Amazon',
  'FC:65:DE': 'Amazon',
  // Generic/Special
  'FF:FF:FF': 'Broadcast',
  '00:00:00': 'Null/Unspecified',
};

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validates if a string is a valid MAC address.
 * Supports colon, dash, dot, and no-separator formats.
 */
export function isValidMAC(mac: string): boolean {
  if (!mac || mac.trim() === '') return false;

  // Remove all separators and check if we have exactly 12 hex characters
  const hex = mac.toUpperCase().replace(/[^0-9A-F]/g, '');
  if (hex.length !== 12) return false;

  // Validate all characters are hex
  return /^[0-9A-F]{12}$/.test(hex);
}

/**
 * Normalizes a MAC address to the specified format.
 *
 * @param input - The raw MAC address input (any format)
 * @param format - Target format: 'colon', 'dash', or 'dot'
 * @returns Normalized MAC address string
 */
export function normalizeMAC(input: string, format: MACFormat): string {
  // Extract only hex characters, uppercase, limit to 12
  const hex = input.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 12);

  if (hex.length === 0) return '';

  if (format === 'dot') {
    // Cisco format: AABB.CCDD.EEFF (groups of 4)
    const groups = hex.match(/.{1,4}/g) || [];
    return groups.join('.');
  }

  // Colon or dash format: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX (groups of 2)
  const pairs = hex.match(/.{1,2}/g) || [];
  const separator = format === 'colon' ? ':' : '-';
  return pairs.join(separator);
}

/**
 * Extracts the OUI prefix from a MAC address (first 3 octets).
 *
 * @param mac - MAC address in any format
 * @returns OUI prefix in colon format (XX:XX:XX), or null if invalid
 */
export function extractOUI(mac: string): string | null {
  const hex = mac.toUpperCase().replace(/[^0-9A-F]/g, '');
  if (hex.length < 6) return null;

  // Return first 3 octets in colon format
  const pairs = hex.slice(0, 6).match(/.{2}/g) || [];
  return pairs.join(':');
}

/**
 * Looks up vendor name from OUI prefix.
 *
 * @param mac - MAC address in any format
 * @returns Vendor name or 'Unknown vendor' if not found
 */
export function lookupVendor(mac: string): string | null {
  const oui = extractOUI(mac);
  if (!oui) return null;

  return MAC_VENDORS[oui] || 'Unknown vendor';
}

// ============================================================================
// useMACInput Hook
// ============================================================================

/**
 * Headless hook for MAC address input logic.
 *
 * @param config - Configuration options
 * @returns State and handlers for MAC input component
 *
 * @example
 * ```tsx
 * const { value, isValid, error, vendor, handleChange } = useMACInput({
 *   value: mac,
 *   onChange: setMac,
 *   format: 'colon',
 *   showVendor: true,
 * });
 * ```
 */
export function useMACInput(config: UseMACInputConfig = {}): UseMACInputReturn {
  const {
    value: controlledValue,
    onChange,
    format = 'colon',
    showVendor = false,
  } = config;

  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = useState<string>(() =>
    controlledValue ? normalizeMAC(controlledValue, format) : ''
  );

  // Determine active value (controlled vs uncontrolled)
  const value = controlledValue !== undefined
    ? normalizeMAC(controlledValue, format)
    : internalValue;

  // Sync with controlled value changes
  useEffect(() => {
    if (controlledValue !== undefined) {
      const normalized = normalizeMAC(controlledValue, format);
      setInternalValue(normalized);
    }
  }, [controlledValue, format]);

  // Validation state
  const isValid = useMemo(() => isValidMAC(value), [value]);

  const error = useMemo(() => {
    // Only show error if user has entered something
    if (!value || value.length === 0) return null;

    // Extract hex characters to check length
    const hex = value.replace(/[^0-9A-Fa-f]/g, '');

    // If partial, don't show error yet (user is still typing)
    if (hex.length > 0 && hex.length < 12) return null;

    // Full length but invalid
    if (hex.length === 12 && !isValid) {
      return 'Invalid MAC address';
    }

    // If they've entered more than we can use
    if (hex.length > 12) {
      return 'MAC address too long';
    }

    return isValid ? null : 'Invalid MAC address';
  }, [value, isValid]);

  // Vendor lookup
  const vendor = useMemo(() => {
    if (!showVendor) return null;

    // Only lookup if we have at least 6 hex chars (3 octets / OUI)
    const hex = value.replace(/[^0-9A-Fa-f]/g, '');
    if (hex.length < 6) return null;

    return lookupVendor(value);
  }, [value, showVendor]);

  // Handle input change with normalization
  const handleChange = useCallback(
    (input: string) => {
      const normalized = normalizeMAC(input, format);
      setInternalValue(normalized);
      onChange?.(normalized);
    },
    [format, onChange]
  );

  // Set value directly (for programmatic use)
  const setValue = useCallback(
    (newValue: string) => {
      const normalized = normalizeMAC(newValue, format);
      setInternalValue(normalized);
      onChange?.(normalized);
    },
    [format, onChange]
  );

  return {
    value,
    isValid,
    error,
    vendor,
    handleChange,
    setValue,
  };
}
